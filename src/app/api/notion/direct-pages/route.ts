import { NextResponse } from 'next/server';
import { getNotionPages } from '@/lib/api/notion';
import { getActiveApiKeyForService } from '@/lib/services/apiKeyService';

export async function POST(request: Request) {
  try {
    // For NextAuth v5, we would typically use auth() instead of getServerSession
    // This is a simplified implementation that just mocks a session
    const session = { user: { id: 'test-user-id' } };
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'You must be logged in to access Notion pages' },
        { status: 401 }
      );
    }
    
    // Get API key from request body (for direct connection)
    // or from the database (for stored connection)
    const body = await request.json();
    let apiKey = body.apiKey;
    
    if (!apiKey) {
      try {
        // Try to get the API key from the database
        apiKey = await getActiveApiKeyForService(session.user.id, 'notion');
      } catch (error) {
        console.error('Error fetching API key from database:', error);
        // Continue with null apiKey to handle the error below
      }
      
      if (!apiKey) {
        return NextResponse.json(
          { error: 'No Notion API key found. Please connect your workspace first.' },
          { status: 401 }
        );
      }
    }
    
    // Fetch pages from Notion using our client
    try {
      const pages = await getNotionPages(apiKey);
      return NextResponse.json({ pages });
    } catch (error: any) {
      console.error('Error fetching Notion pages:', error);
      
      // Provide more detailed error message
      let errorMessage = 'Failed to fetch Notion pages';
      if (error.status === 401) {
        errorMessage = 'Invalid Notion API key. Please reconnect your workspace.';
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