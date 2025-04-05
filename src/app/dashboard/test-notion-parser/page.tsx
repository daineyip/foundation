"use client";

import React, { useState, ChangeEvent } from 'react';

export default function TestNotionParser() {
  const [pageId, setPageId] = useState<string>('');
  const [notionKey, setNotionKey] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const testParser = async () => {
    if (!pageId.trim()) {
      setError('Page ID is required');
      return;
    }

    if (!notionKey.trim()) {
      setError('Notion API Key is required');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(`/api/ai/test-notion-parser?pageId=${encodeURIComponent(pageId)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Notion-API-Key': notionKey
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to test Notion parser');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while testing the Notion parser');
    } finally {
      setLoading(false);
    }
  };

  // Recursive function to render the page hierarchy
  const renderPageHierarchy = (page: any, depth = 0) => {
    if (!page) return null;

    return (
      <div key={page.id} style={{ marginLeft: `${depth * 20}px` }}>
        <div className="flex items-center gap-2 mb-1 mt-2">
          <span className="px-2 py-1 text-xs rounded-full bg-gray-100">{page.blockCount} blocks</span>
          <span className="font-medium">{page.title || 'Untitled'}</span>
        </div>
        
        {page.subpages && page.subpages.length > 0 && (
          <div className="border-l-2 border-gray-200 pl-4 mt-1">
            {page.subpages.map((subpage: any) => renderPageHierarchy(subpage, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container p-8">
      <h1 className="text-2xl font-bold mb-6">Test Notion Parser with Subpages</h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="border rounded-lg p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold mb-2">Notion Parser Test</h2>
            <p className="text-gray-600 mb-4">
              Test the enhanced Notion parser by retrieving a page and all its subpages
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <label htmlFor="pageId" className="block mb-1 font-medium">Notion Page ID</label>
              <input
                id="pageId"
                value={pageId}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setPageId(e.target.value)}
                placeholder="Enter Notion page ID"
                className="w-full p-2 border rounded"
              />
              <p className="text-xs text-gray-500 mt-1">
                You can find the page ID in the Notion page URL (the 32-character ID after the page name)
              </p>
            </div>
            <div>
              <label htmlFor="notionKey" className="block mb-1 font-medium">Notion API Key</label>
              <input
                id="notionKey"
                value={notionKey}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setNotionKey(e.target.value)}
                type="password"
                placeholder="Enter your Notion API key"
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          <div className="mt-6">
            <button 
              onClick={testParser} 
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Parser'}
            </button>
          </div>
        </div>

        <div className="border rounded-lg p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold mb-2">Results</h2>
            <p className="text-gray-600 mb-4">
              View the retrieved page hierarchy and block counts
            </p>
          </div>
          <div>
            {error && (
              <div className="bg-red-50 p-4 rounded-md text-red-500 mb-4">
                {error}
              </div>
            )}
            
            {result && (
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-md text-green-700 mb-4">
                  Successfully retrieved page content!
                </div>
                
                <div className="grid gap-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Main Page:</span>
                    <span>{result.mainPageTitle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Block Count:</span>
                    <span>{result.blockCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Subpage Count:</span>
                    <span>{result.subpageCount}</span>
                  </div>
                </div>
                
                <div className="border-t pt-4 mt-4">
                  <h3 className="font-medium mb-2">Page Hierarchy:</h3>
                  {renderPageHierarchy(result.formattedResult)}
                </div>
              </div>
            )}
            
            {!error && !result && (
              <div className="text-gray-500 italic">
                Enter a Notion page ID and click "Test Parser" to see results.
              </div>
            )}
          </div>
        </div>
      </div>

      {result && (
        <div className="border rounded-lg p-6 mt-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold mb-2">Raw Response Data</h2>
            <p className="text-gray-600 mb-4">
              Full response from the test endpoint (for debugging)
            </p>
          </div>
          <div>
            <textarea
              className="font-mono text-sm w-full h-64 p-2 border rounded"
              readOnly
              value={JSON.stringify(result, null, 2)}
            />
          </div>
        </div>
      )}
    </div>
  );
} 