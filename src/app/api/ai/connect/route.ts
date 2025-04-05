import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createApiKey } from '@/lib/services/apiKeyService';

export async function POST(request: Request) {
  try {
    // For NextAuth v5, we would typically use auth() instead of getServerSession
    // This is a simplified implementation that just mocks a session
    const session = { user: { id: 'test-user-id' } };
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'You must be logged in to connect to Claude' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    // Use API key from request or environment
    let apiKey = body.apiKey || process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }
    
    // Log key info for debugging (masking most of it)
    const maskedKey = apiKey.substring(0, 7) + '...' + apiKey.substring(apiKey.length - 4);
    console.log('Using Claude API key:', maskedKey);
    console.log('API key length:', apiKey.length);
    console.log('API key prefix format check:', apiKey.startsWith('sk-ant'));
    
    // Test the API key by initializing an Anthropic client and making a simple request
    const claude = new Anthropic({
      apiKey: apiKey,
    });
    
    // Try to list models to verify the API key works
    try {
      console.log('Making request to list models...');
      const models = await claude.models.list();
      console.log('Models retrieved successfully:', models.data.length);
      
      // If the API key works, store it in the database
      try {
        await createApiKey({
          name: 'Claude 3.7 Integration',
          service: 'anthropic',
          key: apiKey,
          userId: session.user.id,
        });
        console.log('Successfully stored API key in database');
      } catch (dbError) {
        console.error('Error storing API key:', dbError);
        // Continue anyway - in MVP we want to at least test the connection
      }
      
      // Return success with available models
      // Use the actual models from the API response
      const transformedModels = models.data.map((model: any) => ({
        id: model.id,
        name: model.id.includes('-') ? model.id.split('-').slice(0, 3).join('-') : model.id,
        maxTokens: 200000
      }));
      
      return NextResponse.json({ 
        success: true,
        models: transformedModels,
        defaultModel: 'claude-3-7-sonnet-20240425'
      });
    } catch (error: any) {
      console.error('Error validating Claude API key:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // Provide more detailed error message
      let errorMessage = 'Invalid API key or insufficient permissions';
      if (error.status === 401) {
        errorMessage = 'Invalid Claude API key. Please check your credentials.';
      } else if (error.status === 403) {
        errorMessage = 'Your Claude API key does not have sufficient permissions.';
      } else if (error.message) {
        errorMessage = `Claude API error: ${error.message}`;
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Error connecting to Claude:', error);
    return NextResponse.json(
      { error: 'Failed to connect to Claude API' },
      { status: 500 }
    );
  }
} 