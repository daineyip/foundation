import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get all environment variables
    const allEnvVars = process.env;
    
    // Create a sanitized version without actual keys
    const sanitizedEnvVars: Record<string, string> = {};
    
    // Check if specific keys exist and sanitize them
    Object.keys(allEnvVars).forEach(key => {
      const value = allEnvVars[key] || '';
      
      // Special handling for API keys
      if (key.includes('API_KEY') || key.includes('SECRET')) {
        if (value) {
          sanitizedEnvVars[key] = `${value.substring(0, 6)}...${value.substring(value.length - 4)} (Length: ${value.length})`;
        } else {
          sanitizedEnvVars[key] = 'MISSING';
        }
      } else {
        // For other environment variables, show them normally
        sanitizedEnvVars[key] = value;
      }
    });
    
    // Specifically check for keys we're interested in
    const envStatus = {
      ANTHROPIC_API_KEY: {
        exists: !!process.env.ANTHROPIC_API_KEY,
        length: process.env.ANTHROPIC_API_KEY?.length || 0,
        startsWith: process.env.ANTHROPIC_API_KEY?.startsWith('sk-ant') || false,
        containsWhitespace: /\s/.test(process.env.ANTHROPIC_API_KEY || '')
      },
      NOTION_API_KEY: {
        exists: !!process.env.NOTION_API_KEY,
        length: process.env.NOTION_API_KEY?.length || 0
      },
      ENCRYPTION_KEY: {
        exists: !!process.env.ENCRYPTION_KEY,
        length: process.env.ENCRYPTION_KEY?.length || 0
      },
      DATABASE_URL: {
        exists: !!process.env.DATABASE_URL,
        contains_password: (process.env.DATABASE_URL || '').includes('daine'),
      }
    };
    
    return NextResponse.json({
      envStatus,
      vars: sanitizedEnvVars
    });
  } catch (error) {
    console.error('Error getting environment variables:', error);
    return NextResponse.json(
      { error: 'Failed to get environment variables' },
      { status: 500 }
    );
  }
} 