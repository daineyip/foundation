import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check if Claude API key is available in environment
    const apiKeyAvailable = !!process.env.ANTHROPIC_API_KEY;
    
    return NextResponse.json({ 
      available: apiKeyAvailable,
      message: apiKeyAvailable 
        ? 'Claude API key found in environment variables' 
        : 'No Claude API key found in environment variables'
    });
  } catch (error) {
    console.error('Error checking environment variables:', error);
    return NextResponse.json(
      { error: 'Failed to check environment variables' },
      { status: 500 }
    );
  }
} 