'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Page {
  id: string;
  title: string;
  lastEdited: string;
}

export default function NotionIntegration() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorType = searchParams.get('error');
  
  const [apiKey, setApiKey] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedPages, setSelectedPages] = useState<string[]>([]);

  // Check if there's an error from API calls
  useEffect(() => {
    if (errorType) {
      if (errorType === 'unauthorized') {
        setError('Invalid Notion API key. Please check your credentials.');
      } else {
        setError('An error occurred during the Notion connection process.');
      }
      
      // Remove the error query parameter
      router.replace('/dashboard/notion');
    }
  }, [errorType, router]);

  // Connect to Notion with API key
  const connectToNotion = async () => {
    if (!apiKey.trim()) {
      setError('Please enter a valid Notion API key');
      return;
    }

    setIsLoading(true);
    try {
      // Store API key in session storage (for demo purposes only)
      // In production, this should be handled more securely
      sessionStorage.setItem('notion_api_key', apiKey);
      
      // Test the connection by fetching pages
      const response = await fetch('/api/notion/direct-connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to connect to Notion');
      }
      
      setIsConnected(true);
      fetchNotionPages();
    } catch (error) {
      console.error('Error connecting to Notion:', error);
      setError(error instanceof Error ? error.message : 'Failed to connect to Notion');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Notion pages using direct API key
  const fetchNotionPages = async () => {
    setIsLoading(true);
    try {
      const storedApiKey = sessionStorage.getItem('notion_api_key');
      
      if (!storedApiKey) {
        throw new Error('No API key found. Please reconnect to Notion.');
      }
      
      const response = await fetch('/api/notion/direct-pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: storedApiKey }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch pages');
      }
      
      const data = await response.json();
      setPages(data.pages);
    } catch (error) {
      console.error('Error fetching Notion pages:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch pages');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePageSelection = (pageId: string) => {
    if (selectedPages.includes(pageId)) {
      setSelectedPages(selectedPages.filter(id => id !== pageId));
    } else {
      setSelectedPages([...selectedPages, pageId]);
    }
  };

  const generatePrototype = async () => {
    setIsLoading(true);
    try {
      // Get the Notion API key from session storage
      const notionApiKey = sessionStorage.getItem('notion_api_key');
      
      if (!notionApiKey) {
        throw new Error('Notion API key not found. Please reconnect to Notion.');
      }
      
      // Send selected pages to API for processing
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Notion-API-Key': notionApiKey // Pass the API key in a custom header
        },
        body: JSON.stringify({
          pages: selectedPages,
          projectType: 'e-commerce', // Default type, could be a user selection
        }),
      });
      
      // Get the response data
      const data = await response.json();
      
      if (!response.ok) {
        // Handle error case
        throw new Error(data.error || 'Failed to generate code');
      }
      
      // Store the generated code in localStorage so the editor can access it
      if (data.code) {
        localStorage.setItem('generatedCode', data.code);
        console.log('Generated code saved to localStorage');
      }
      
      // Redirect to editor with the generated code
      router.push('/dashboard/editor');
    } catch (error) {
      console.error('Error generating prototype:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate prototype');
    } finally {
      setIsLoading(false);
    }
  };

  // Format date string
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Notion Integration</h2>
        
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
            <h3 className="text-lg font-medium text-gray-600 mb-2">Connect to Notion</h3>
            <p className="text-gray-500 mb-6">Enter your Notion API Key to start creating prototypes</p>
            <div className="max-w-md mx-auto mb-4">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Paste your Notion API key here"
                className="w-full p-2 border border-gray-300 rounded-md mb-4"
              />
              <button
                onClick={connectToNotion}
                disabled={isLoading || !apiKey.trim()}
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors disabled:bg-gray-400 w-full"
              >
                {isLoading ? 'Connecting...' : 'Connect to Notion'}
              </button>
            </div>
            <p className="text-xs text-gray-500">
              You can find your API key in the Notion integrations page under "Internal Integration Token"
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="bg-black text-white rounded p-2 mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                      <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32l8.4-8.4z" />
                      <path d="M5.25 5.25a3 3 0 00-3 3v10.5a3 3 0 003 3h10.5a3 3 0 003-3V13.5a.75.75 0 00-1.5 0v5.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5V8.25a1.5 1.5 0 011.5-1.5h5.25a.75.75 0 000-1.5H5.25z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">Connected to Notion</p>
                    <p className="text-sm text-gray-500">Select pages to import</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsConnected(false);
                    sessionStorage.removeItem('notion_api_key');
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Disconnect
                </button>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <h3 className="font-medium">Available Pages</h3>
                <p className="text-sm text-gray-500">{selectedPages.length} selected</p>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
                </div>
              ) : pages.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Select
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Page Title
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Edited
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pages.map(page => (
                        <tr key={page.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input 
                              type="checkbox" 
                              checked={selectedPages.includes(page.id)}
                              onChange={() => togglePageSelection(page.id)}
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{page.title}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{formatDate(page.lastEdited)}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 border rounded-lg">
                  <p className="text-gray-500">No pages found in your workspace. Make sure your integration has access to the pages.</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={generatePrototype}
                disabled={selectedPages.length === 0 || isLoading}
                className={`px-4 py-2 rounded-md ${
                  selectedPages.length === 0 || isLoading
                    ? 'bg-gray-300 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                } transition-colors`}
              >
                {isLoading ? 'Generating...' : 'Generate Prototype'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 