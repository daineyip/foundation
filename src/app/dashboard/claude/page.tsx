'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface ClaudeModel {
  id: string;
  name?: string;
  maxTokens?: number;
}

export default function ClaudeIntegration() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorType = searchParams.get('error');
  
  const [apiKey, setApiKey] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [models, setModels] = useState<ClaudeModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [envKeyAvailable, setEnvKeyAvailable] = useState(false);

  // Check if Claude API key is available in environment
  useEffect(() => {
    const checkEnvironmentKey = async () => {
      try {
        const response = await fetch('/api/ai/check-env');
        if (response.ok) {
          const data = await response.json();
          setEnvKeyAvailable(data.available);
          
          // If key is available in environment, connect automatically
          if (data.available) {
            connectWithEnvironmentKey();
          }
        }
      } catch (error) {
        console.error('Error checking for environment API key:', error);
      }
    };
    
    checkEnvironmentKey();
  }, []);

  // Check if there's an error from API calls
  useEffect(() => {
    if (errorType) {
      if (errorType === 'unauthorized') {
        setError('Invalid Claude API key. Please check your credentials.');
      } else {
        setError('An error occurred during the Claude connection process.');
      }
      
      // Remove the error query parameter
      router.replace('/dashboard/claude');
    }
  }, [errorType, router]);

  // Connect using the API key from environment variables
  const connectWithEnvironmentKey = async () => {
    setIsLoading(true);
    try {
      // Test the connection using the environment key
      const response = await fetch('/api/ai/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: '' }), // Empty string will trigger using env variable
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to connect to Claude');
      }
      
      const data = await response.json();
      setModels(data.models || []);
      setSelectedModel(data.defaultModel || (data.models?.[0]?.id || ''));
      setIsConnected(true);
    } catch (error) {
      console.error('Error connecting to Claude with environment key:', error);
      setError(error instanceof Error ? error.message : 'Failed to connect to Claude');
      setEnvKeyAvailable(false); // Reset if connection fails
    } finally {
      setIsLoading(false);
    }
  };

  // Connect to Claude with user-provided API key
  const connectToClaude = async () => {
    if (!apiKey.trim()) {
      setError('Please enter a valid Claude API key');
      return;
    }

    setIsLoading(true);
    try {
      // Store API key in session storage (for demo purposes only)
      // In production, this should be handled more securely
      sessionStorage.setItem('claude_api_key', apiKey);
      
      // Test the connection by fetching available models
      const response = await fetch('/api/ai/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to connect to Claude');
      }
      
      const data = await response.json();
      setModels(data.models || []);
      setSelectedModel(data.defaultModel || (data.models?.[0]?.id || ''));
      setIsConnected(true);
    } catch (error) {
      console.error('Error connecting to Claude:', error);
      setError(error instanceof Error ? error.message : 'Failed to connect to Claude');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Claude Integration</h2>
        
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
            <p>{error}</p>
            <button 
              onClick={() => setError(null)} 
              className="text-sm underline mt-2"
            >
              Dismiss
            </button>
          </div>
        )}
        
        {!isConnected ? (
          <div className="text-center py-10">
            <h3 className="text-lg font-medium text-gray-600 mb-2">Connect to Claude</h3>
            
            {envKeyAvailable ? (
              <div className="mb-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="bg-green-100 text-green-800 p-2 rounded-full mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-green-700">Claude API key found in environment variables</p>
                </div>
                <button
                  onClick={connectWithEnvironmentKey}
                  disabled={isLoading}
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors disabled:bg-gray-400 w-full max-w-md"
                >
                  {isLoading ? 'Connecting...' : 'Connect with Environment Key'}
                </button>
              </div>
            ) : (
              <>
                <p className="text-gray-500 mb-6">Enter your Anthropic API Key to connect to Claude 3.7</p>
                <div className="max-w-md mx-auto mb-4">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Paste your Claude API key here"
                    className="w-full p-2 border border-gray-300 rounded-md mb-4"
                  />
                  <button
                    onClick={connectToClaude}
                    disabled={isLoading || !apiKey.trim()}
                    className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors disabled:bg-gray-400 w-full"
                  >
                    {isLoading ? 'Connecting...' : 'Connect to Claude'}
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  You can find your API key in the Anthropic Console under "API Keys"
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="bg-purple-600 text-white rounded p-2 mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">Connected to Claude</p>
                    <p className="text-sm text-gray-500">
                      {envKeyAvailable 
                        ? 'Using API key from environment variables' 
                        : 'Using provided API key'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsConnected(false);
                    if (!envKeyAvailable) {
                      sessionStorage.removeItem('claude_api_key');
                    }
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Disconnect
                </button>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <h3 className="font-medium">Available Models</h3>
              </div>
              
              {models.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <div className="space-y-2 p-4">
                    {models.map(model => (
                      <div 
                        key={model.id} 
                        className={`p-3 rounded-lg cursor-pointer flex items-center justify-between ${selectedModel === model.id ? 'bg-purple-50 border border-purple-200' : 'hover:bg-gray-50 border border-transparent'}`}
                        onClick={() => setSelectedModel(model.id)}
                      >
                        <div>
                          <p className="font-medium">{model.id}</p>
                          <p className="text-sm text-gray-500">{model.name || model.id}</p>
                        </div>
                        <div>
                          {selectedModel === model.id && (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-purple-600">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                            </svg>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 border rounded-lg">
                  <p className="text-gray-500">No models available</p>
                </div>
              )}
              
              <div className="mt-6">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                >
                  Continue to Dashboard
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 