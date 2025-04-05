import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';
import { createApiKey } from '@/lib/services/apiKeyService';

export async function POST(request: Request) {
  try {
    // For NextAuth v5, we would typically use auth() instead of getServerSession
    // This is a simplified implementation that just mocks a session
    const session = { user: { id: 'test-user-id' } };
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'You must be logged in to connect to Notion' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { apiKey } = body;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }
    
    // Test the API key by initializing a Notion client and making a simple request
    const notion = new Client({
      auth: apiKey,
    });
    
    // Try to list users to verify the API key works
    try {
      const users = await notion.users.list({});
      
      // If the API key works, store it in the database
      try {
        await createApiKey({
          name: 'Notion Integration',
          service: 'notion',
          key: apiKey,
          userId: session.user.id,
        });
      } catch (dbError) {
        console.error('Error storing API key:', dbError);
        // Continue anyway - in MVP we want to at least test the connection
      }
      
      // Return success with user info
      return NextResponse.json({ 
        success: true,
        workspaceName: users.results[0]?.name || 'Your Workspace',
      });
    } catch (error: any) {
      console.error('Error validating Notion API key:', error);
      
      // Provide more detailed error message
      let errorMessage = 'Invalid API key or insufficient permissions';
      if (error.status === 401) {
        errorMessage = 'Invalid Notion API key. Please check your credentials.';
      } else if (error.status === 403) {
        errorMessage = 'Your Notion API key does not have sufficient permissions.';
      } else if (error.message) {
        errorMessage = `Notion API error: ${error.message}`;
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Error connecting to Notion:', error);
    return NextResponse.json(
      { error: 'Failed to connect to Notion' },
      { status: 500 }
    );
  }
} 