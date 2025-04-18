import { NextResponse } from 'next/server';
import { getNotionPages } from '@/lib/api/notion';
import { getActiveApiKeyForService } from '@/lib/services/apiKeyService';
import { auth } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    // Get authenticated user
    const session = await auth() || { user: null };
    const user = session.user;
    
    if (!user || !user.id) {
      return NextResponse.json(
        { error: 'You must be logged in to access your Notion pages' },
        { status: 401 }
      );
    }
    
    // Get Notion API key from user's stored keys
    const notionApiKey = await getActiveApiKeyForService(user.id, 'notion');
    
    if (!notionApiKey) {
      return NextResponse.json(
        { error: 'Notion API key not found. Please connect your Notion account.' },
        { status: 401 }
      );
    }
    
    // Log API key validation (mask for security)
    console.log('Using user Notion API key:', notionApiKey.substring(0, 7) + '...' + notionApiKey.substring(notionApiKey.length - 4));
    
    // Fetch pages from Notion using our client
    try {
      const pages = await getNotionPages(notionApiKey);
      return NextResponse.json({ pages });
    } catch (error: any) {
      console.error('Error fetching Notion pages:', error);
      
      // Provide more detailed error message
      let errorMessage = 'Failed to fetch Notion pages';
      if (error.status === 401) {
        errorMessage = 'Invalid Notion API key. Please reconnect your Notion account.';
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
    console.error('Error in user Notion pages endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Notion pages' },
      { status: 500 }
    );
  }
} 