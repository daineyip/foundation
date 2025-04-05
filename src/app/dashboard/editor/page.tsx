'use client';

import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';

// Default fallback code in case no generated code is found
const fallbackCode = `
// No generated code found. 
// Please go back to the Notion page and generate a prototype.

import React from 'react';

export default function EmptyComponent() {
  return (
    <div className="p-4 text-center">
      <h2 className="text-xl font-semibold mb-2">No Generated Code</h2>
      <p>Please return to the Notion integration page and generate a prototype.</p>
    </div>
  );
}
`;

export default function CodeEditor() {
  const [code, setCode] = useState(fallbackCode);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load the generated code from localStorage when component mounts
  useEffect(() => {
    try {
      // Try to get generated code from localStorage
      const savedCode = localStorage.getItem('generatedCode');
      if (savedCode) {
        setCode(savedCode);
      } else {
        console.log('No generated code found in localStorage');
      }
    } catch (error) {
      console.error('Error loading generated code:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
    }
  };

  const saveCode = () => {
    setIsSaving(true);
    try {
      // Save code to localStorage
      localStorage.setItem('generatedCode', code);
      setTimeout(() => {
        setIsSaving(false);
      }, 500);
    } catch (error) {
      console.error('Error saving code:', error);
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Generated Code</h2>
          <div className="flex space-x-2">
            <button
              onClick={saveCode}
              disabled={isSaving}
              className={`px-4 py-2 rounded-md ${
                isSaving ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
              } transition-colors`}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden h-[70vh]">
            <div className="bg-gray-100 px-4 py-2 border-b flex justify-between">
              <h3 className="font-medium">Code from Claude AI</h3>
              <span className="text-sm text-gray-500">You can edit this code directly</span>
            </div>
            <Editor
              height="calc(100% - 37px)"
              defaultLanguage="typescript"
              defaultValue={code}
              onChange={handleEditorChange}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                tabSize: 2,
                wordWrap: 'on'
              }}
            />
          </div>
        )}

        <div className="mt-4 px-4 py-3 bg-gray-50 rounded-lg text-sm text-gray-600">
          <p>This code is generated based on your Notion documentation. You can edit it directly in the editor above.</p>
          <p className="mt-1">Note: The preview functionality is disabled in this version to prevent rendering errors.</p>
        </div>
      </div>
    </div>
  );
} 