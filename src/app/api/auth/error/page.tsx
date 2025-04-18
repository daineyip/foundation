'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Parse the error and set a user-friendly message
    switch (error) {
      case 'Configuration':
        setErrorMessage('There is a problem with the server configuration.');
        console.error('NextAuth Configuration Error - Check your .env files and OAuth settings');
        break;
      case 'AccessDenied':
        setErrorMessage('You do not have permission to sign in.');
        break;
      case 'OAuthSignin':
        setErrorMessage('Error in OAuth sign in process. Please try again.');
        break;
      case 'OAuthCallback':
        setErrorMessage('Error in OAuth callback. Please check your Google account settings.');
        break;
      case 'OAuthCreateAccount':
        setErrorMessage('Could not create user account using OAuth provider.');
        break;
      case 'EmailCreateAccount':
        setErrorMessage('Could not create user account using email provider.');
        break;
      case 'Callback':
        setErrorMessage('Error in authentication callback.');
        break;
      case 'OAuthAccountNotLinked':
        setErrorMessage('This email is already associated with another account.');
        break;
      case 'EmailSignin':
        setErrorMessage('Error sending the sign in email.');
        break;
      case 'CredentialsSignin':
        setErrorMessage('Sign in failed. Check the details you provided are correct.');
        break;
      case 'SessionRequired':
        setErrorMessage('Please sign in to access this page.');
        break;
      default:
        setErrorMessage('An unknown error occurred during authentication.');
        break;
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Authentication Error</h1>
          <div className="mt-4 text-red-600 p-4 bg-red-50 rounded-md">
            <p className="font-medium">Error: {error}</p>
            <p className="mt-2">{errorMessage}</p>
          </div>
          
          <div className="mt-8">
            <p className="text-gray-600 mb-4">
              Please try the following:
            </p>
            <ul className="text-left text-sm text-gray-600 mb-6 pl-5 space-y-2">
              <li>• Make sure you have cookies enabled in your browser</li>
              <li>• Check that your Google account is active and accessible</li>
              <li>• Try signing in with a different Google account</li>
              <li>• If you continue to experience issues, please contact support</li>
            </ul>
            
            <div className="mt-6 flex justify-center">
              <Link 
                href="/login" 
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Return to Sign In
              </Link>
            </div>
            
            <p className="mt-4 text-xs text-gray-500">
              Error ID: {error || 'unknown'}-{Date.now().toString().slice(-6)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 