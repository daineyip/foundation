import { Client } from '@notionhq/client';

interface NotionPage {
  id: string;
  title: string;
  icon?: string;
  lastEdited: string;
  url: string;
}

interface NotionWorkspace {
  id: string;
  name: string;
  icon?: string;
}

// For recursive subpage fetching
interface NotionPageWithContent {
  page: any;
  blocks: any[];
  subpages?: NotionPageWithContent[];
}

// Initialize Notion client with API key
const getNotionClient = (apiKey: string) => {
  return new Client({
    auth: apiKey,
  });
};

// Get user's Notion workspace info (will need OAuth for this)
export const getNotionWorkspaces = async (apiKey: string): Promise<NotionWorkspace[]> => {
  try {
    // For now, return mock data as we need OAuth for real implementation
    // In production, this would use the Notion API to get workspace information
    return [
      {
        id: 'workspace1',
        name: 'Personal Workspace',
      }
    ];
  } catch (error) {
    console.error('Error fetching Notion workspaces:', error);
    throw error;
  }
};

// Get pages from a Notion workspace
export const getNotionPages = async (apiKey: string): Promise<NotionPage[]> => {
  try {
    const notion = getNotionClient(apiKey);
    
    // Search for pages in the workspace
    const response = await notion.search({
      filter: {
        property: 'object',
        value: 'page'
      },
      sort: {
        direction: 'descending',
        timestamp: 'last_edited_time'
      }
    });

    // Transform API response to our interface
    const pages: NotionPage[] = response.results.map((page: any) => {
      let title = 'Untitled';
      
      // Extract title from properties (different formats based on page type)
      if (page.properties && page.properties.title) {
        const titleProperty = page.properties.title;
        if (titleProperty.title && titleProperty.title.length > 0) {
          title = titleProperty.title.map((t: any) => t.plain_text).join('');
        }
      } else if (page.properties && page.properties.Name) {
        const nameProperty = page.properties.Name;
        if (nameProperty.title && nameProperty.title.length > 0) {
          title = nameProperty.title.map((t: any) => t.plain_text).join('');
        }
      }

      return {
        id: page.id,
        title: title,
        icon: page.icon ? page.icon.emoji || page.icon.external?.url : undefined,
        lastEdited: page.last_edited_time,
        url: page.url
      };
    });

    return pages;
  } catch (error) {
    console.error('Error fetching Notion pages:', error);
    throw error;
  }
};

// Get content of a specific Notion page
export const getNotionPageContent = async (apiKey: string, pageId: string): Promise<any> => {
  try {
    const notion = getNotionClient(apiKey);
    
    // Get page details
    const page = await notion.pages.retrieve({ page_id: pageId });
    
    // Get page content (blocks)
    const blocks = await notion.blocks.children.list({
      block_id: pageId,
      page_size: 100, // Max blocks to retrieve
    });

    return {
      page,
      blocks: blocks.results
    };
  } catch (error) {
    console.error(`Error fetching content for page ${pageId}:`, error);
    throw error;
  }
};

// Check if a block is a child page or child database
const isChildPage = (block: any): boolean => {
  return block.type === 'child_page' || block.type === 'child_database';
};

// Extract page ID from a block that contains a subpage reference
const getChildPageId = (block: any): string | null => {
  if (block.type === 'child_page') {
    return block.id;
  } else if (block.type === 'child_database') {
    return block.id;
  }
  return null;
};

// Get all subpages referenced within a page
export const getSubpageIds = async (apiKey: string, pageId: string): Promise<string[]> => {
  try {
    const notion = getNotionClient(apiKey);
    
    // Get page blocks
    const response = await notion.blocks.children.list({
      block_id: pageId,
      page_size: 100,
    });
    
    // Filter for blocks that are subpages or databases
    const subpageIds = response.results
      .filter(isChildPage)
      .map(block => getChildPageId(block))
      .filter((id): id is string => id !== null); // Type guard to filter out nulls
    
    return subpageIds;
  } catch (error) {
    console.error(`Error fetching subpage IDs for page ${pageId}:`, error);
    return [];
  }
};

// Recursively get a page and all its subpages with content
export const getPageWithSubpages = async (
  apiKey: string, 
  pageId: string, 
  depth: number = 2,  // Limit recursion depth to prevent infinite loops
  visited: Set<string> = new Set()
): Promise<NotionPageWithContent> => {
  // Prevent infinite recursion due to circular references
  if (visited.has(pageId) || depth <= 0) {
    return { page: null, blocks: [] };
  }
  
  // Mark this page as visited
  visited.add(pageId);
  
  try {
    // Get the base page content
    const content = await getNotionPageContent(apiKey, pageId);
    const result: NotionPageWithContent = {
      page: content.page,
      blocks: content.blocks,
      subpages: []
    };
    
    // Only recurse if we have depth remaining
    if (depth > 0) {
      // Find all subpage references in this page
      const subpageIds = await getSubpageIds(apiKey, pageId);
      
      // For each subpage, recursively get its content
      if (subpageIds.length > 0) {
        const subpagesPromises = subpageIds.map(subpageId => 
          getPageWithSubpages(apiKey, subpageId, depth - 1, new Set(visited))
        );
        
        // Wait for all subpages to be fetched
        result.subpages = await Promise.all(subpagesPromises);
      }
    }
    
    return result;
  } catch (error) {
    console.error(`Error in recursive page fetch for ${pageId}:`, error);
    return { page: null, blocks: [], subpages: [] };
  }
};

// Create a temporary Notion connection link (for OAuth flow)
export const createNotionConnectionLink = (): string => {
  const clientId = process.env.NEXT_PUBLIC_NOTION_CLIENT_ID;
  const redirectUri = encodeURIComponent(process.env.NEXT_PUBLIC_NOTION_REDIRECT_URI || 'http://localhost:3000/api/notion/callback');
  
  // OAuth URL for Notion
  return `https://api.notion.com/v1/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code`;
}; 