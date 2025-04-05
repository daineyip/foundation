import { NextResponse } from 'next/server';
import { getPageWithSubpages } from '@/lib/api/notion';

export async function GET(request: Request) {
  try {
    // Get Notion API key from request headers
    const notionApiKey = request.headers.get('Notion-API-Key');
    
    // Get page ID from query parameters
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId');
    
    if (!notionApiKey) {
      return NextResponse.json(
        { error: 'Notion API key is required in the Notion-API-Key header' },
        { status: 400 }
      );
    }
    
    if (!pageId) {
      return NextResponse.json(
        { error: 'Page ID is required as a query parameter' },
        { status: 400 }
      );
    }
    
    // Fetch the page and its subpages
    console.log(`Testing Notion parser with page ID: ${pageId}`);
    const pageWithSubpages = await getPageWithSubpages(notionApiKey, pageId, 3);
    
    // Count the total number of subpages at all levels
    const countSubpages = (page: any): number => {
      if (!page.subpages || !Array.isArray(page.subpages)) {
        return 0;
      }
      
      return page.subpages.reduce((count: number, subpage: any) => {
        return count + 1 + countSubpages(subpage);
      }, 0);
    };
    
    const subpageCount = countSubpages(pageWithSubpages);
    
    // Format a simplified version of the content for the response
    const formatForResponse = (page: any): any => {
      if (!page) return null;
      
      // Create a simplified page object
      const simplifiedPage = {
        id: page.page?.id || 'unknown',
        title: 'Untitled',
        blockCount: page.blocks?.length || 0,
        subpages: []
      };
      
      // Extract the page title
      if (page.page && page.page.properties) {
        const properties = page.page.properties;
        try {
          // Find title property
          const titleProperty = 
            (properties.title && properties.title.title) ? properties.title :
            (properties.Name && properties.Name.title) ? properties.Name :
            Object.values(properties).find((prop: any) => 
              prop && prop.type === 'title' && prop.title && Array.isArray(prop.title) && prop.title.length > 0
            );
          
          if (titleProperty && titleProperty.title && Array.isArray(titleProperty.title)) {
            simplifiedPage.title = titleProperty.title
              .map((t: any) => t && t.plain_text ? t.plain_text : '')
              .join('');
          }
        } catch (error) {
          console.error('Error extracting page title:', error);
        }
      }
      
      // Process subpages recursively
      if (page.subpages && Array.isArray(page.subpages)) {
        simplifiedPage.subpages = page.subpages
          .map((subpage: any) => formatForResponse(subpage))
          .filter(Boolean);
      }
      
      return simplifiedPage;
    };
    
    // Create formatted result
    const formattedResult = formatForResponse(pageWithSubpages);
    
    // Return the result
    return NextResponse.json({
      success: true,
      pageId,
      mainPageTitle: formattedResult.title,
      blockCount: formattedResult.blockCount,
      subpageCount,
      formattedResult
    });
    
  } catch (error: any) {
    console.error('Error testing Notion parser:', error);
    return NextResponse.json(
      { 
        error: 'Failed to test Notion parser',
        message: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
} 