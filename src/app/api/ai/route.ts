import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getActiveApiKeyForService } from '@/lib/services/apiKeyService';
import { getNotionPageContent, getPageWithSubpages } from '@/lib/api/notion';
import { getCurrentUser } from '@/lib/auth';
import { auth } from '@/lib/auth';

// Initialize Anthropic client with environment API key
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function POST(request: Request) {
  try {
    // Extract request body
    const { pages, projectType } = await request.json();
    
    // Get authenticated user
    const session = await auth() || { user: null };
    const user = session.user;
    
    if (!user || !user.id) {
      return NextResponse.json(
        { error: 'You must be logged in to generate a prototype' },
        { status: 401 }
      );
    }
    
    // Log user information
    console.log(`Generating prototype for user: ${user.id}`);
    console.log(`Project type selected: ${projectType}`);
    console.log(`Selected pages: ${pages.length}`);
    
    // Check if we have valid Notion page IDs
    if (!pages || !Array.isArray(pages) || pages.length === 0) {
      return NextResponse.json(
        { error: 'Please select at least one Notion page' },
        { status: 400 }
      );
    }
    
    // Attempt to get the user's Notion API key
    const notionApiKey = await getActiveApiKeyForService(user.id, 'notion');
    
    if (!notionApiKey) {
      return NextResponse.json(
        { error: 'Notion API key not found. Please connect your Notion account.' },
        { status: 401 }
      );
    }
    
    // Log API key validation (mask for security)
    console.log('Using Notion API key:', notionApiKey.substring(0, 7) + '...' + notionApiKey.substring(notionApiKey.length - 4));
    
    // Attempt to get Claude API key from environment or user settings
    let claudeApiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!claudeApiKey) {
      // Try to get from user's stored API keys
      console.log('No Claude API key in environment, trying user API key...');
      const userApiKey = await getActiveApiKeyForService(user.id, 'anthropic');
      
      if (!userApiKey) {
        return NextResponse.json(
          { error: 'Claude API key not found' },
          { status: 401 }
        );
      }
      
      claudeApiKey = userApiKey;
      console.log('Found user Claude API key');
    } else {
      console.log('Using environment Claude API key');
    }
    
    try {
      // Log API key validation (mask for security)
      console.log('Using Claude API key:', claudeApiKey.substring(0, 7) + '...' + claudeApiKey.substring(claudeApiKey.length - 4));
      console.log('API key format check:', claudeApiKey.startsWith('sk-ant'));
      
      // Fetch content from selected Notion pages including subpages
      console.log(`Fetching content for ${pages.length} Notion pages and their subpages`);
      
      let pagesWithContent = [];
      
      // For each selected page ID, fetch its content and subpages
      for (const pageId of pages) {
        try {
          console.log(`Fetching content for page ${pageId} and its subpages`);
          // Use recursive function to get page content and all subpages
          const content = await getPageWithSubpages(notionApiKey, pageId, 3); // Depth of 3 levels
          console.log(`Successfully fetched page ${pageId} and ${content.subpages?.length || 0} subpages`);
          
          // Log page structure for debugging
          if (content.page && content.page.properties) {
            console.log('Page property keys:', Object.keys(content.page.properties));
            // Deep inspect the first property to understand structure
            const firstPropKey = Object.keys(content.page.properties)[0];
            if (firstPropKey) {
              console.log(`Sample property structure (${firstPropKey}):`, 
                JSON.stringify(content.page.properties[firstPropKey]).substring(0, 100) + '...');
            }
          } else {
            console.log('Page has no properties or unexpected structure');
          }
          
          pagesWithContent.push(content);
        } catch (error) {
          console.error(`Error fetching content for page ${pageId}:`, error);
          // Continue with other pages even if one fails
        }
      }
      
      if (pagesWithContent.length === 0) {
        return NextResponse.json(
          { error: 'Failed to fetch content from any of the selected Notion pages' },
          { status: 400 }
        );
      }
      
      // Format page content for Claude
      let formattedContent = '';
      
      // Helper function to format a page and its blocks
      const formatPageContent = (content: any, title: string, level: number = 0): string => {
        let formattedText = '';
        const indent = '  '.repeat(level);
        
        // Add page title with appropriate heading level
        // Main pages are h2, first level subpages are h3, etc.
        const headingLevel = Math.min(level + 2, 6);
        const headingMarker = '#'.repeat(headingLevel);
        formattedText += `${indent}${headingMarker} ${title}\n\n`;
        
        // Add page blocks
        if (content.blocks && Array.isArray(content.blocks)) {
          content.blocks.forEach((block: any) => {
            try {
              if (!block || typeof block !== 'object') {
                return; // Skip invalid blocks
              }
              
              // Skip child_page blocks as we'll handle them separately
              if (block.type === 'child_page' || block.type === 'child_database') {
                return;
              }

              // Helper function to safely extract text from rich_text array
              const safeExtractText = (richTextArray: any): string => {
                if (!richTextArray || !Array.isArray(richTextArray)) {
                  return '';
                }
                try {
                  return richTextArray
                    .filter(text => text && typeof text === 'object')
                    .map(text => text.plain_text || '')
                    .join('');
                } catch (textError) {
                  console.error('Error processing rich text array:', textError);
                  return '';
                }
              };

              if (block.type === 'paragraph' && block.paragraph) {
                const paragraphText = safeExtractText(block.paragraph.rich_text);
                if (paragraphText) {
                  formattedText += `${indent}${paragraphText}\n\n`;
                }
              } else if (block.type === 'heading_1' && block.heading_1) {
                const headingText = safeExtractText(block.heading_1.rich_text);
                if (headingText) {
                  // Adjust heading level based on nesting
                  const adjustedLevel = Math.min(level + 1, 6);
                  const adjustedMarker = '#'.repeat(adjustedLevel);
                  formattedText += `${indent}${adjustedMarker} ${headingText}\n\n`;
                }
              } else if (block.type === 'heading_2' && block.heading_2) {
                const headingText = safeExtractText(block.heading_2.rich_text);
                if (headingText) {
                  // Adjust heading level based on nesting
                  const adjustedLevel = Math.min(level + 2, 6);
                  const adjustedMarker = '#'.repeat(adjustedLevel);
                  formattedText += `${indent}${adjustedMarker} ${headingText}\n\n`;
                }
              } else if (block.type === 'heading_3' && block.heading_3) {
                const headingText = safeExtractText(block.heading_3.rich_text);
                if (headingText) {
                  // Adjust heading level based on nesting
                  const adjustedLevel = Math.min(level + 3, 6);
                  const adjustedMarker = '#'.repeat(adjustedLevel);
                  formattedText += `${indent}${adjustedMarker} ${headingText}\n\n`;
                }
              } else if (block.type === 'bulleted_list_item' && block.bulleted_list_item) {
                const itemText = safeExtractText(block.bulleted_list_item.rich_text);
                if (itemText) {
                  formattedText += `${indent}• ${itemText}\n`;
                }
              } else if (block.type === 'numbered_list_item' && block.numbered_list_item) {
                const itemText = safeExtractText(block.numbered_list_item.rich_text);
                if (itemText) {
                  formattedText += `${indent}1. ${itemText}\n`;
                }
              } else if (block.type === 'code' && block.code) {
                const codeText = safeExtractText(block.code.rich_text);
                if (codeText) {
                  const language = block.code.language || '';
                  formattedText += `${indent}\`\`\`${language}\n${codeText}\n${indent}\`\`\`\n\n`;
                }
              } else if (block.type === 'to_do' && block.to_do) {
                const todoText = safeExtractText(block.to_do.rich_text);
                const checked = block.to_do.checked ? '✅' : '⬜';
                if (todoText) {
                  formattedText += `${indent}${checked} ${todoText}\n`;
                }
              } else if (block.type === 'toggle' && block.toggle) {
                const toggleText = safeExtractText(block.toggle.rich_text);
                if (toggleText) {
                  formattedText += `${indent}➤ ${toggleText}\n`;
                }
              } else if (block.type === 'image' && block.image) {
                const caption = block.image.caption ? safeExtractText(block.image.caption) : 'Image';
                formattedText += `${indent}![${caption}](${block.image.file?.url || block.image.external?.url || 'image_url'})\n\n`;
              }
            } catch (blockError) {
              console.error('Error processing block:', blockError);
              // Continue with other blocks even if one fails
            }
          });
        }
        
        return formattedText;
      };
      
      // Recursive function to format a page and all its subpages
      const formatPageWithSubpages = (pageWithContent: any, pageIndex: number, level: number = 0): void => {
        try {
          // Extract page title
          let pageTitle = `Document ${pageIndex}`;
          if (pageWithContent.page && pageWithContent.page.properties) {
            const properties = pageWithContent.page.properties;
            try {
              // Find title property (could be named "title" or "Name" depending on page structure)
              const titleProperty = 
                (properties.title && properties.title.title) ? properties.title :
                (properties.Name && properties.Name.title) ? properties.Name :
                Object.values(properties).find((prop: any) => 
                  prop && prop.type === 'title' && prop.title && Array.isArray(prop.title) && prop.title.length > 0
                );
              
              if (titleProperty && titleProperty.title && Array.isArray(titleProperty.title)) {
                pageTitle = titleProperty.title
                  .map((t: any) => t && t.plain_text ? t.plain_text : '')
                  .join('');
              }
            } catch (titleError) {
              console.error('Error extracting page title:', titleError);
              // Continue with default title
            }
          }
          
          // Format the main page content
          formattedContent += formatPageContent(pageWithContent, pageTitle, level);
          
          // Format subpages, if any
          if (pageWithContent.subpages && Array.isArray(pageWithContent.subpages)) {
            pageWithContent.subpages.forEach((subpage: any, subIndex: number) => {
              if (subpage.page) {
                // Recursively format the subpage with increased nesting level
                formatPageWithSubpages(subpage, pageIndex * 100 + subIndex + 1, level + 1);
              }
            });
          }
        } catch (contentError) {
          console.error('Error formatting page with subpages:', contentError);
          // Continue with other pages even if formatting one fails
        }
      };
      
      // Process each main page and its subpages
      console.log(`Processing ${pagesWithContent.length} pages and their subpages for formatting`);
      pagesWithContent.forEach((pageWithContent, index) => {
        formatPageWithSubpages(pageWithContent, index + 1);
      });
      
      console.log('Content formatting complete');
      
      // If no content was successfully formatted, use fallback prompt
      if (!formattedContent.trim()) {
        console.log('No formatted content available, using fallback prompt');
        formattedContent = `Create a ${projectType} component with standard features and best practices.`;
      } else {
        console.log(`Successfully formatted content: ${formattedContent.length} characters`);
        // Log a preview of the formatted content (first 200 chars)
        console.log(`Content preview: ${formattedContent.substring(0, 200)}...`);
      }
      
      // Prepare system prompt with detailed instructions
      const systemPrompt = `You are a skilled full-stack developer tasked with generating a functional prototype based on the provided Notion documentation. Your goal is to create working components that implement both frontend and backend functionality as specified.
      
      Create React components with the following characteristics:
      1. Implement ALL requirements and specifications from the Notion documentation precisely
      2. Build COMPLETE end-to-end functionality - not just UI mockups
      3. Include both frontend components and necessary backend API routes where applicable
      4. Use proper data flow patterns with state management appropriate to the requirements
      5. Implement realistic API calls, form handling, and data validation
      6. Handle loading states, error cases, and edge cases thoroughly
      7. Use modern React patterns (hooks, functional components, context if needed)
      8. Include appropriate TypeScript typing throughout the code
      9. Add comprehensive error handling and user feedback mechanisms
      10. Ensure components are responsive and follow accessibility best practices
      
      IMPORTANT: You MUST format your response as a valid JSON object following this structure:
      {
        "files": {
          "app/page.tsx": "import React from 'react';\n\nexport default function Home() {\n  return <div>Hello World</div>;\n}",
          "components/Button.tsx": "import React from 'react';\n\nexport default function Button() {\n  return <button>Click Me</button>;\n}"
        }
      }
      
      IMPORTANT: You MUST include a "README.md" file in the "files" dictionary. This file should contain a detailed description of the project, including:
      - The technologies used
      - A step-by-step guide for setting up the project and project dependencies
      - All the commands to install the project dependencies and run the project
      
      The JSON object should have a single "files" property containing a dictionary where:
      - Each key is a file path (relative to the project root)
      - Each value is the complete file content as a string with proper escaping
      - Include ALL necessary files to make the prototype functional

      No other commentary or explanation should be included - ONLY the JSON object.`;
      
      // Prepare user prompt with the formatted Notion content
      const userPrompt = `I need you to create a complete, functional ${projectType} prototype based on the following Notion documentation:
      
      ${formattedContent}
      
      Please generate production-ready React component(s) that implement ALL the requirements in these documents. Include:
      
      1. Any necessary backend API routes or handlers needed for full functionality
      2. Complete data flow and state management
      3. All form validation and error handling
      4. Loading states and user feedback
      5. Proper TypeScript types for all components and functions
      
      CRITICAL: Your ENTIRE response must be a valid, parseable JSON object with this EXACT structure:
      {
        "files": {
          "filepath1": "complete file content as string",
          "filepath2": "complete file content as string",
          ...
        }
      }
      
      For example:
      {
        "files": {
          "app/page.tsx": "import React from 'react';\n\nexport default function Home() {\n  return <div>Hello World</div>;\n}",
          "components/ProductList.tsx": "import React from 'react';\n\nexport interface Product {\n  id: string;\n  name: string;\n  price: number;\n}\n\nexport default function ProductList() {\n  return <div>Products will be listed here</div>;\n}"
        }
      }

      IMPORTANT: You MUST include a "README.md" file in the "files" dictionary. This file should contain a detailed description of the project, including:
      - The technologies used
      - A step-by-step guide for setting up the project and project dependencies
      - All the commands to install the project dependencies and run the project
      
      Your response MUST:
      1. Be valid JSON that can be parsed with JSON.parse()
      2. Include ALL necessary files (components, styles, types, API routes) in the "files" dictionary
      3. Organize files according to Next.js conventions (pages in app directory, components in components directory)
      4. Make each file complete with all required imports and dependencies
      5. Use proper escaping for special characters in strings
      6. NOT include any comments, explanations, or text outside the JSON structure
      
      The code should follow best practices for a Next.js application and be ready to integrate directly into our project. Focus on delivering a complete, working solution that implements everything specified in the documentation.`;
      
      console.log('Sending request to Claude with Notion content...');
      
      // Call Claude API to generate code with the Notion content
      const response = await anthropic.messages.create({
        model: "claude-3-5-haiku-20241022", // Using the most recent working model from logs
        max_tokens: 4000, // Increased token limit to handle larger responses
        system: systemPrompt,
        messages: [
          { role: "user", content: userPrompt }
        ]
      });
      
      console.log('Claude response received', JSON.stringify(response.id));

      console.log('Claude system prompt:', systemPrompt);
      console.log('Claude user prompt:', userPrompt);
      
      // Extract the generated code from Claude's response
      // The content field is an array of content blocks
      let generatedContent = '';

      console.log('Claude response content:', JSON.stringify(response.content));
      
      // Each content block has a type, only process text blocks
      if (response.content && response.content.length > 0) {
        for (const block of response.content) {
          if (block.type === 'text') {
            generatedContent += block.text;
          }
        }
      }
      
      console.log('Raw content from Claude:', generatedContent.substring(0, 200) + '...');
      
      // Try to parse the JSON response directly from Claude's content
      let generatedCode = generatedContent;
      
      // After getting the Claude API response
      const completion = generatedCode;
      
      // Try to parse the JSON response
      let parsedFiles;
      try {
        // Extract the JSON object from the response
        // Sometimes Claude might wrap the JSON in markdown code blocks or add explanation text
        const jsonMatch = completion.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : completion;
        
        // First try to parse as JSON directly
        try {
          const parsedResponse = JSON.parse(jsonString);
          
          if (parsedResponse.files && typeof parsedResponse.files === 'object') {
            parsedFiles = parsedResponse.files;
            console.log(`Successfully parsed ${Object.keys(parsedFiles).length} files from Claude response`);
            
            // Return the structured files as JSON
            return NextResponse.json({ 
              code: JSON.stringify({ files: parsedFiles }, null, 2),
              message: 'Successfully generated prototype code'
            });
          }
        } catch (jsonError) {
          console.log('Failed to parse direct JSON response:', jsonError);
          // Continue to fallback parsing
        }
        
        // Fallback: Try to parse the files manually from the code block format
        console.log('Falling back to manual file extraction');
        parsedFiles = {} as Record<string, string>;
        
        // Extract file blocks manually
        const fileBlockPattern = /\/\/\s*File:\s*([^\n]+)(?:\n|\r\n?)(?:```(?:jsx|tsx|javascript|typescript|css|json|html)?(?:\n|\r\n?)([\s\S]*?)```|([^/]*?)(?=\/\/\s*File:|$))/g;
        const fileMatches = [...completion.matchAll(fileBlockPattern)];
        
        if (fileMatches.length > 0) {
          // Process each file match
          for (const [_, fileName, codeInBlock, codeOutsideBlock] of fileMatches) {
            if (!fileName.trim()) continue;
            
            const code = codeInBlock || codeOutsideBlock;
            if (!code || !code.trim()) continue;
            
            console.log(`Adding file: ${fileName.trim()}`);
            parsedFiles[fileName.trim()] = code.trim();
          }
          
          console.log(`Manually extracted ${Object.keys(parsedFiles).length} files`);
          
          // Return the structured files
          return NextResponse.json({ 
            code: JSON.stringify({ files: parsedFiles }, null, 2),
            message: 'Successfully generated prototype code (manually extracted)'
          });
        }
        
        // If we still can't parse it, return the raw text
        console.warn('Failed to parse files from Claude response, returning raw text');
        return NextResponse.json({ 
          code: completion,
          message: 'Generated code (raw format - JSON parsing failed)'
        });
      } catch (parseError) {
        console.error('Error parsing Claude response:', parseError);
        console.log('Raw Claude response:', completion);
        
        // Return the raw text as fallback
        return NextResponse.json({ 
          code: completion,
          message: 'Generated code (raw format - parsing failed)'
        });
      }
    } catch (error: any) {
      console.error('Error generating code with Claude:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      return NextResponse.json(
        { 
          error: 'Failed to generate code', 
          message: error.message || 'Unknown error occurred'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in AI route:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
} 