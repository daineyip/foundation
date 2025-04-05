import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

// Note: This is a development utility for testing.
// In production, you would handle API keys more securely.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { apiKey } = body;
    
    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }
    
    // Check if key has the right format
    if (!apiKey.startsWith('sk-ant')) {
      return NextResponse.json({ 
        error: 'Invalid API key format',
        message: 'API key must start with sk-ant'
      }, { status: 400 });
    }
    
    // For testing, we'll try connecting to Claude with this key
    try {
      const anthropic = new Anthropic({ apiKey });
      
      // Simple validation request
      const response = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 50,
        messages: [{ role: "user", content: "Say hello" }]
      });
      
      // If we get here, the key is valid
      let responseText = '';
      for (const block of response.content) {
        if (block.type === 'text') {
          responseText += block.text;
        }
      }
      
      // For development only - update the .env.local file
      // Note: This is insecure and should never be done in production
      try {
        const envPath = path.join(process.cwd(), '.env.local');
        let envContent = fs.readFileSync(envPath, 'utf-8');
        
        // Replace the API key line
        envContent = envContent.replace(
          /ANTHROPIC_API_KEY=.*/,
          `ANTHROPIC_API_KEY=${apiKey}`
        );
        
        fs.writeFileSync(envPath, envContent);
        
        // Return success response
        return NextResponse.json({
          success: true,
          message: 'API key updated and validated successfully',
          response: responseText.trim()
        });
      } catch (fileError) {
        console.error('Error updating .env.local file:', fileError);
        return NextResponse.json({
          success: false,
          error: 'Failed to update .env.local file',
          message: 'API key is valid but could not update environment file'
        }, { status: 500 });
      }
    } catch (apiError: any) {
      console.error('Claude API validation error:', apiError);
      return NextResponse.json({
        success: false,
        error: 'Invalid API key',
        message: apiError.message || 'Could not connect to Claude API with provided key'
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error processing request:', error);
    return NextResponse.json({ 
      error: 'Server error', 
      message: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
} 