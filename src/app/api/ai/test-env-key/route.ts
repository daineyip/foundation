import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function GET() {
  try {
    let apiKey = process.env.ANTHROPIC_API_KEY || '';
    
    // Trim whitespace that might have been accidentally included
    apiKey = apiKey.trim();
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'No API key found in environment variables' },
        { status: 400 }
      );
    }
    
    // Log key info for debugging (masking most of it)
    const maskedKey = apiKey.substring(0, 7) + '...' + apiKey.substring(apiKey.length - 4);
    console.log('Testing environment Claude API key:', maskedKey);
    console.log('API key length:', apiKey.length);
    console.log('API key prefix format check:', apiKey.startsWith('sk-ant'));
    
    // Verify key format
    if (!apiKey.startsWith('sk-ant')) {
      return NextResponse.json({
        error: 'API key has incorrect format',
        hint: 'Claude API keys should start with "sk-ant"',
        actualPrefix: apiKey.substring(0, 6)
      }, { status: 400 });
    }
    
    // Initialize Anthropic client with the environment API key
    const anthropic = new Anthropic({
      apiKey: apiKey,
    });
    
    try {
      console.log('Making direct request to list models...');
      const response = await anthropic.models.list();
      
      return NextResponse.json({
        success: true,
        message: 'Environment API key is valid',
        modelCount: response.data.length,
        models: response.data.map((model: any) => ({
          id: model.id
        }))
      });
    } catch (error: any) {
      console.error('API request error:', error);
      
      // Check if the error is related to the API key
      const errorMessage = error.message || '';
      if (errorMessage.includes('invalid x-api-key') || error.status === 401) {
        return NextResponse.json({
          error: 'Invalid API key',
          message: 'The Claude API key in your environment variables is not valid or has expired',
          suggestion: 'Please check your .env.local file and ensure the API key is correct and active',
          status: 401
        }, { status: 401 });
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to authenticate with environment API key',
          message: error.message,
          status: error.status
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to test environment API key' },
      { status: 500 }
    );
  }
} 