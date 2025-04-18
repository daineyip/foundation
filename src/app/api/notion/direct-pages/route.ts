import { NextResponse } from 'next/server';
import { getNotionPages } from '@/lib/api/notion';

export async function POST(request: Request) {
  try {
    // Get Notion API key from environment
    const notionApiKey = process.env.NOTION_API_KEY;
    
    if (!notionApiKey) {
      return NextResponse.json(
        { error: 'Notion API key not found in environment variables' },
        { status: 401 }
      );
    }
    
    // Log API key validation (mask for security)
    console.log('Using Notion API key:', notionApiKey.substring(0, 7) + '...' + notionApiKey.substring(notionApiKey.length - 4));
    
    // Fetch pages from Notion using our client
    try {
      const pages = await getNotionPages(notionApiKey);
      return NextResponse.json({ pages });
    } catch (error: any) {
      console.error('Error fetching Notion pages:', error);
      
      // Provide more detailed error message
      let errorMessage = 'Failed to fetch Notion pages';
      if (error.status === 401) {
        errorMessage = 'Invalid Notion API key. Please check your environment variables.';
      } else if (error.status === 403) {
        errorMessage = 'Your Notion API key does not have sufficient permissions.';
      } else if (error.message) {
        errorMessage = `Notion API error: ${error.message}`;
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: error.status || 500 }
      );
    }
  } catch (error) {
    console.error('Error in Notion pages endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Notion pages' },
      { status: 500 }
    );
  }
} 