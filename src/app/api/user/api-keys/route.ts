import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getApiKeys } from '@/lib/services/apiKeyService';

export async function GET(request: Request) {
  try {
    // Get authenticated user
    const session = await auth() || { user: null };
    const user = session.user;
    
    if (!user || !user.id) {
      return NextResponse.json(
        { error: 'You must be logged in to access API keys' },
        { status: 401 }
      );
    }
    
    // Get the service from query parameters
    const url = new URL(request.url);
    const service = url.searchParams.get('service');
    
    if (!service) {
      // Return all API keys for the user
      const apiKeys = await getApiKeys(user.id);
      return NextResponse.json({ apiKeys });
    }
    
    // Return information about a specific service API key
    const apiKeys = await getApiKeys(user.id);
    const apiKey = apiKeys.find(key => key.service === service && key.isActive);
    
    if (apiKey) {
      return NextResponse.json({
        exists: true,
        id: apiKey.id,
        name: apiKey.name,
        service: apiKey.service,
        createdAt: apiKey.createdAt
      });
    } else {
      return NextResponse.json({ exists: false });
    }
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    );
  }
} 