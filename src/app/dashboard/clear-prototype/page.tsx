'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ClearPrototype() {
  const router = useRouter();
  const [isCleared, setIsCleared] = useState(false);
  const [originalCode, setOriginalCode] = useState<string | null>(null);

  useEffect(() => {
    // Store the original code in case user wants to undo
    const code = localStorage.getItem('generatedCode');
    if (code) {
      setOriginalCode(code);
    }
  }, []);

  const clearGeneratedCode = () => {
    localStorage.removeItem('generatedCode');
    setIsCleared(true);
  };

  const restoreGeneratedCode = () => {
    if (originalCode) {
      localStorage.setItem('generatedCode', originalCode);
      setIsCleared(false);
    }
  };

  const goToNotion = () => {
    router.push('/dashboard/notion');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Clear Generated Prototype</h2>
        
        {isCleared ? (
          <div className="bg-green-50 text-green-700 p-4 rounded-md mb-6">
            <p>The prototype has been successfully cleared. You can now generate a new one.</p>
            <div className="mt-4 flex space-x-4">
              <button 
                onClick={restoreGeneratedCode} 
                className="px-4 py-2 border border-green-600 text-green-600 rounded-md hover:bg-green-50"
              >
                Restore Previous Code
              </button>
              <button 
                onClick={goToNotion} 
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Go to Notion Integration
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="mb-4 text-gray-600">
              This will delete the currently generated e-commerce prototype from your browser's storage.
              You can then regenerate it with different settings.
            </p>
            <div className="bg-yellow-50 p-4 rounded-md mb-6 text-yellow-700">
              <p>⚠️ Warning: This action cannot be undone. The generated code will be permanently deleted.</p>
            </div>
            <button
              onClick={clearGeneratedCode}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Delete E-commerce Prototype
            </button>
          </>
        )}
      </div>
    </div>
  );
} 