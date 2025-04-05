import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getNotionPages } from '@/lib/api/notion';

export async function GET() {
  try {
    // Get Notion access token from cookies
    const cookieStore = cookies();
    const accessToken = cookieStore.get('notion_access_token')?.value;
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Not connected to Notion. Please connect your workspace first.' },
        { status: 401 }
      );
    }
    
    // Fetch pages from Notion using our client
    const pages = await getNotionPages(accessToken);
    
    return NextResponse.json({ pages });
  } catch (error) {
    console.error('Error fetching Notion pages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Notion pages' },
      { status: 500 }
    );
  }
} 