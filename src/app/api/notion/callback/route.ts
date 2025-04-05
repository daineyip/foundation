import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Get the authorization code from the URL query parameters
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  // Handle error or missing code
  if (error || !code) {
    console.error('Error in Notion OAuth callback:', error);
    return NextResponse.redirect(new URL('/dashboard/notion?error=oauth_failed', request.url));
  }

  try {
    // Exchange the code for an access token
    const response = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${process.env.NOTION_CLIENT_ID}:${process.env.NOTION_CLIENT_SECRET}`).toString('base64')}`
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.NOTION_REDIRECT_URI || 'http://localhost:3000/api/notion/callback'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error exchanging code for token:', errorData);
      return NextResponse.redirect(new URL('/dashboard/notion?error=token_exchange_failed', request.url));
    }

    // Get the access token and other information
    const data = await response.json();
    const { access_token, workspace_id, workspace_name, bot_id } = data;

    // Set the access token in a cookie (in a real app, you would store this securely)
    // We could also use a server-side session store or a secure HttpOnly cookie
    const redirectUrl = new URL('/dashboard/notion', request.url);
    redirectUrl.searchParams.append('success', 'true');
    
    const response_with_cookies = NextResponse.redirect(redirectUrl);
    
    // Set a secure cookie with the access token
    // In production, ensure this is a secure, HttpOnly cookie and the data is properly encrypted
    response_with_cookies.cookies.set({
      name: 'notion_access_token',
      value: access_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/'
    });
    
    // Also set workspace info in cookies
    response_with_cookies.cookies.set({
      name: 'notion_workspace_id',
      value: workspace_id,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    });
    
    response_with_cookies.cookies.set({
      name: 'notion_workspace_name',
      value: workspace_name,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    });

    return response_with_cookies;
  } catch (error) {
    console.error('Error in Notion OAuth callback:', error);
    return NextResponse.redirect(new URL('/dashboard/notion?error=server_error', request.url));
  }
} 