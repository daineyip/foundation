'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface Page {
  id: string;
  title: string;
  lastEdited: string;
}

interface ApiKeyInfo {
  exists: boolean;
  id?: string;
  name?: string;
}

export default function NotionIntegration() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorType = searchParams.get('error');
  const { data: session } = useSession();
  
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [notionApiKey, setNotionApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKeyInfo, setApiKeyInfo] = useState<ApiKeyInfo>({ exists: false });

  // Check if there's an error from API calls
  useEffect(() => {
    if (errorType) {
      if (errorType === 'unauthorized') {
        setError('Invalid Notion API key. Please enter a valid API key.');
      } else {
        setError('An error occurred during the Notion connection process.');
      }
      
      // Remove the error query parameter
      router.replace('/dashboard/notion');
    }
  }, [errorType, router]);

  // Check if user already has a Notion API key on component mount
  useEffect(() => {
    const checkExistingApiKey = async () => {
      if (!session?.user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/user/api-keys?service=notion');
        
        if (!response.ok) {
          throw new Error('Failed to check for existing API key');
        }
        
        const data = await response.json();
        
        if (data.exists) {
          setApiKeyInfo({
            exists: true,
            id: data.id,
            name: data.name
          });
          // Auto-connect using the existing API key
          connectWithExistingKey();
        } else {
          setShowApiKeyInput(true);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error checking for existing API key:', error);
        setShowApiKeyInput(true);
        setIsLoading(false);
      }
    };

    checkExistingApiKey();
  }, [session]);

  // Connect using the existing API key
  const connectWithExistingKey = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/notion/user-pages', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to connect to Notion');
      }
      
      const data = await response.json();
      setPages(data.pages);
      setIsConnected(true);
      setShowApiKeyInput(false);
    } catch (error) {
      console.error('Error connecting to Notion with existing key:', error);
      setError(error instanceof Error ? error.message : 'Failed to connect to Notion');
      setIsConnected(false);
      setShowApiKeyInput(true);
      
      // Mark the API key as non-existent since it failed
      setApiKeyInfo({ exists: false });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to connect to Notion with the provided API key
  const connectToNotion = async (event?: FormEvent) => {
    if (event) {
      event.preventDefault();
    }
    
    if (!notionApiKey && !isConnected) {
      setError('Please enter your Notion API key');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // First save the API key if provided
      if (notionApiKey && session?.user?.id) {
        const saveResponse = await fetch('/api/notion/direct-connect', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            apiKey: notionApiKey,
          }),
        });
        
        if (!saveResponse.ok) {
          const errorData = await saveResponse.json();
          throw new Error(errorData.error || 'Failed to connect to Notion with provided API key');
        }
        
        const saveData = await saveResponse.json();
        console.log('API key saved successfully:', saveData);
      }
      
      // Now fetch the pages using the saved API key
      const response = await fetch('/api/notion/user-pages', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to connect to Notion');
      }
      
      const data = await response.json();
      setPages(data.pages);
      setIsConnected(true);
      setShowApiKeyInput(false);
      setApiKeyInfo({ exists: true });
    } catch (error) {
      console.error('Error connecting to Notion:', error);
      setError(error instanceof Error ? error.message : 'Failed to connect to Notion');
      setIsConnected(false);
      setShowApiKeyInput(true);
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

  // Format date string
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  };

  const generatePrototype = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!selectedPages.length) {
        setError('Please select at least one page to generate a prototype');
        return;
      }

      if (!session?.user?.id) {
        setError('You must be logged in to generate a prototype');
        return;
      }
      
      console.log('User session:', session);
      console.log('Current user ID:', session.user.id);
      
      // Get the page titles for the selected pages
      const selectedPageData = pages.filter(page => selectedPages.includes(page.id));
      const projectName = selectedPageData[0]?.title || 'Untitled Project';
      const projectDescription = `Generated from ${selectedPageData.length} Notion page(s)`;
      
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pages: selectedPages,
          projectType: 'e-commerce'
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate prototype');
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Save the project to the database
      const saveResponse = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: projectName,
          description: projectDescription,
          notionPages: selectedPages,
          codeContent: data.code,
          userId: session.user.id,
        }),
      });
      
      if (!saveResponse.ok) {
        const saveErrorData = await saveResponse.json();
        throw new Error(saveErrorData.message || 'Failed to save project');
      }
      
      const projectData = await saveResponse.json();
      
      // Store the generated code in localStorage for the editor
      localStorage.setItem('generatedCode', data.code);
      
      // Redirect to the editor
      router.push(`/dashboard/editor/${projectData.id}`);
    } catch (error) {
      console.error('Error generating prototype:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate prototype');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-2xl font-bold mb-4">Notion Integration</h1>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-9a1 1 0 112 0v4a1 1 0 11-2 0V9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      ) : !isConnected && showApiKeyInput ? (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Connect to Notion</h2>
          <p className="mb-4 text-gray-600">
            To connect your Notion workspace, you'll need to provide your Notion API key.
          </p>
          
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-9a1 1 0 112 0v4a1 1 0 11-2 0V9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Get your Notion API Key</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ol className="list-decimal pl-5 space-y-1">
                    <li>Go to <a href="https://www.notion.so/my-integrations" className="underline" target="_blank" rel="noopener noreferrer">Notion's integrations page</a></li>
                    <li>Create a new integration for your workspace</li>
                    <li>Copy the "Internal Integration Token"</li>
                    <li>Paste it below</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
          
          <form onSubmit={connectToNotion} className="mt-4">
            <div className="mb-4">
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
                Notion API Key
              </label>
              <input
                type="password"
                id="apiKey"
                value={notionApiKey}
                onChange={(e) => setNotionApiKey(e.target.value)}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                placeholder="secret_XXXXXXXXXXXXXXXXXXXXX"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Your API key will be securely stored for future use.
              </p>
            </div>
            <button
              type="submit"
              disabled={isLoading || !notionApiKey}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                isLoading || !notionApiKey ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {isLoading ? 'Connecting...' : 'Connect to Notion'}
            </button>
          </form>
        </div>
      ) : isConnected ? (
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
                  setNotionApiKey('');
                  setIsConnected(false);
                  setShowApiKeyInput(true);
                  setPages([]);
                  setSelectedPages([]);
                }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Disconnect
              </button>
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
            <div className="p-4 border-b">
              <div className="flex justify-between mb-2">
                <h2 className="text-lg font-semibold">Your Notion Pages</h2>
                <p className="text-sm text-gray-500">{selectedPages.length} selected</p>
              </div>
              <p className="text-sm text-gray-500">Select the pages you want to use for your prototype</p>
            </div>
            
            {pages.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No pages found in your Notion workspace. Make sure you've shared the pages with your integration.
              </div>
            ) : (
              <div className="overflow-hidden">
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
                      <tr key={page.id} 
                        className={`${selectedPages.includes(page.id) ? 'bg-blue-50' : 'hover:bg-gray-50'} cursor-pointer`}
                        onClick={() => togglePageSelection(page.id)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedPages.includes(page.id)}
                            onChange={() => {}}
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
            )}
          </div>
          
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => {
                setIsConnected(false);
                setShowApiKeyInput(true);
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Change API Key
            </button>
            
            <button
              onClick={generatePrototype}
              disabled={isLoading || selectedPages.length === 0}
              className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${
                isLoading || selectedPages.length === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {isLoading ? 'Generating...' : 'Generate Prototype'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
} 