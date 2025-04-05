import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

// Initialize Notion client
const notionClient = new Client({
  auth: process.env.NOTION_API_KEY,
});

// Get workspace information
export async function GET() {
  try {
    // This is a mock response for the prototype
    // In a real implementation, we would use actual Notion API calls
    const mockWorkspaces = [
      {
        id: 'workspace1',
        name: 'Personal Workspace',
        owner: {
          type: 'user',
          user: {
            id: 'user1',
            name: 'John Doe',
            avatar_url: 'https://via.placeholder.com/150',
          }
        }
      },
      {
        id: 'workspace2',
        name: 'Work Workspace',
        owner: {
          type: 'user',
          user: {
            id: 'user2',
            name: 'Jane Smith',
            avatar_url: 'https://via.placeholder.com/150',
          }
        }
      }
    ];

    return NextResponse.json({ workspaces: mockWorkspaces });
  } catch (error) {
    console.error('Error fetching Notion workspaces:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Notion workspaces' },
      { status: 500 }
    );
  }
}

// Connect to Notion workspace
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code } = body;

    // This is a mock response for the prototype
    // In a real implementation, we would exchange the code for an access token
    const mockResponse = {
      access_token: 'mock-access-token',
      workspace_id: 'workspace1',
      workspace_name: 'Personal Workspace',
      bot_id: 'bot1',
    };

    return NextResponse.json(mockResponse);
  } catch (error) {
    console.error('Error connecting to Notion:', error);
    return NextResponse.json(
      { error: 'Failed to connect to Notion' },
      { status: 500 }
    );
  }
}

// Get pages from a workspace
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { workspaceId } = body;

    // This is a mock response for the prototype
    // In a real implementation, we would query the Notion API for pages
    const mockPages = [
      {
        id: 'page1',
        title: 'Product Requirements',
        icon: '📝',
        last_edited_time: '2023-04-01T12:00:00Z',
      },
      {
        id: 'page2',
        title: 'User Journey',
        icon: '🚶‍♂️',
        last_edited_time: '2023-04-02T14:30:00Z',
      },
      {
        id: 'page3',
        title: 'Feature Specification',
        icon: '✨',
        last_edited_time: '2023-04-03T09:15:00Z',
      },
    ];

    return NextResponse.json({ pages: mockPages });
  } catch (error) {
    console.error('Error fetching Notion pages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Notion pages' },
      { status: 500 }
    );
  }
} 