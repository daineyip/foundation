import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function GET() {
  try {
    // Get API key from environment
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not found in environment variables' },
        { status: 400 }
      );
    }
    
    // Show masked API key info
    const maskedKey = apiKey.substring(0, 7) + '...' + apiKey.substring(apiKey.length - 4);
    console.log('Testing Claude API key:', maskedKey);
    console.log('API key length:', apiKey.length);
    console.log('API key starts with sk-ant:', apiKey.startsWith('sk-ant'));
    
    // Initialize client
    const anthropic = new Anthropic({ apiKey });
    
    // Simple message to test the API
    try {
      console.log('Sending simple message to Claude...');
      const response = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 100,
        messages: [
          { role: "user", content: "Respond with only the word 'success' if you can read this message." }
        ]
      });
      
      console.log('Claude response ID:', response.id);
      
      // Extract the text from the response
      let responseText = '';
      if (response.content && response.content.length > 0) {
        for (const block of response.content) {
          if (block.type === 'text') {
            responseText += block.text;
          }
        }
      }
      
      return NextResponse.json({
        success: true,
        message: 'Claude API connection successful',
        response: responseText.trim(),
        usage: response.usage
      });
    } catch (error: any) {
      console.error('Claude API request error:', error);
      
      return NextResponse.json({
        success: false,
        error: 'Failed to connect to Claude API',
        message: error.message,
        status: error.status || 500
      }, { status: error.status || 500 });
    }
  } catch (error: any) {
    console.error('Error in test endpoint:', error);
    return NextResponse.json(
      { error: 'Unexpected error', message: error.message },
      { status: 500 }
    );
  }
} 