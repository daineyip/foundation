import React, { useEffect, useState } from 'react';

interface PreviewProps {
  code: string;
  isVisible?: boolean;
}

interface PreviewFile {
  name: string;
  path: string;
  content: string;
  type: string;
}

export default function Preview({ code, isVisible = true }: PreviewProps) {
  const [error, setError] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileStructure, setFileStructure] = useState<PreviewFile[]>([]);

  useEffect(() => {
    if (!isVisible) return;

    try {
      // Try to parse the code as JSON format first
      try {
        const parsedCode = JSON.parse(code);
        if (typeof parsedCode === 'object') {
          // We have JSON structured files, find a good file to preview
          const fileKeys = Object.keys(parsedCode);
          if (fileKeys.length > 0) {
            // Prioritize page files, then components, then anything else
            const pageFile = fileKeys.find(f => f.includes('/page.') || f.includes('index.'));
            const componentFile = fileKeys.find(f => f.includes('components/'));
            const fileToShow = pageFile || componentFile || fileKeys[0];
            
            setFileName(fileToShow);
            setFileContent(parsedCode[fileToShow]);
            
            // Generate file structure from all files
            const files: PreviewFile[] = fileKeys.map(path => {
              const name = path.split('/').pop() || path;
              return {
                name,
                path,
                content: parsedCode[path],
                type: getFileType(path)
              };
            });
            
            setFileStructure(files);
            return;
          }
        }
      } catch (jsonError) {
        // Not JSON, continue with the original handling
      }

      // Extract filename from the selected file code (legacy format)
      const fileNameMatch = code.match(/^(?:\/\/ File: (.+?)$)?/m);
      const extractedFileName = fileNameMatch && fileNameMatch[1] ? fileNameMatch[1].trim() : null;
      
      if (extractedFileName) {
        setFileName(extractedFileName);
        console.log('Preview showing file:', extractedFileName);
      } else {
        setFileName('Unknown File');
      }
      
      // Store the content for display
      setFileContent(code);

      // Parse all files from the complete generated code
      const allCode = localStorage.getItem('generatedCode') || '';
      if (allCode) {
        parseFileStructure(allCode);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error extracting file info:', err);
      setError(err instanceof Error ? err.message : 'Failed to process code');
    }
  }, [code, isVisible]);

  const parseFileStructure = (fullCode: string) => {
    try {
      const filePattern = /\/\/\s*File:\s*([^\n]+)(?:\n|\r\n?)([\s\S]*?)(?=\/\/\s*File:|$)/g;
      const files: PreviewFile[] = [];
      let match;

      while ((match = filePattern.exec(fullCode)) !== null) {
        if (match[1] && match[2]) {
          const path = match[1].trim();
          const name = path.split('/').pop() || path;
          const content = match[2].trim();
          const type = getFileType(path);
          
          files.push({
            name,
            path,
            content,
            type
          });
        }
      }

      console.log(`Parsed ${files.length} files for preview structure`);
      setFileStructure(files);
    } catch (err) {
      console.error('Error parsing file structure:', err);
    }
  };

  if (!isVisible) return null;

  // Determine file type for syntax highlighting class
  const getFileType = (name: string | null): string => {
    if (!name) return 'unknown';
    if (name.endsWith('.css')) return 'styles';
    if (name.endsWith('.html')) return 'html';
    if (name.endsWith('.json')) return 'data';
    if (name.endsWith('.js')) return 'script';
    if (name.endsWith('.jsx')) return 'component';
    if (name.endsWith('.ts')) return 'script';
    if (name.endsWith('.tsx')) return 'component';
    if (name.includes('page')) return 'page';
    if (name.includes('api/')) return 'api';
    return 'other';
  };

  // Get display information for the file
  const getFileInfoDisplay = (name: string | null): { icon: string, label: string } => {
    if (!name) return { icon: 'code', label: 'Unknown File' };
    
    if (name.includes('page.') || name.includes('index.')) {
      return { icon: 'layout', label: 'Page Component' };
    }
    
    if (name.includes('api/')) {
      return { icon: 'server', label: 'API Route' };
    }
    
    if (name.endsWith('.tsx') || name.endsWith('.jsx')) {
      return { icon: 'component', label: 'React Component' };
    }
    
    if (name.endsWith('.css')) {
      return { icon: 'style', label: 'Stylesheet' };
    }
    
    if (name.endsWith('.json')) {
      return { icon: 'data', label: 'JSON Data' };
    }
    
    return { icon: 'code', label: 'Code File' };
  };

  const fileInfo = getFileInfoDisplay(fileName);

  // Organize files by directory
  const organizeFilesByDirectory = () => {
    const directories: Record<string, PreviewFile[]> = {
      'pages': [],
      'components': [],
      'api': [],
      'styles': [],
      'lib': [],
      'other': []
    };

    fileStructure.forEach(file => {
      if (file.path.includes('page') || file.path.includes('/app/')) {
        directories.pages.push(file);
      } else if (file.path.includes('components/')) {
        directories.components.push(file);
      } else if (file.path.includes('api/')) {
        directories.api.push(file);
      } else if (file.path.includes('styles/') || file.path.endsWith('.css')) {
        directories.styles.push(file);
      } else if (file.path.includes('lib/') || file.path.includes('utils/')) {
        directories.lib.push(file);
      } else {
        directories.other.push(file);
      }
    });

    return directories;
  };

  const directories = organizeFilesByDirectory();

  return (
    <div className="h-full bg-white">
      <div className="border-b bg-gray-50 px-4 py-2 flex justify-between items-center">
        <div className="flex items-center">
          <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
          </svg>
          <h3 className="font-medium">
            {fileName || 'Code Preview'}
          </h3>
          <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
            {fileInfo.label}
          </span>
        </div>
        <span className="text-sm text-gray-500">Generated Deployment Preview</span>
      </div>
      
      <div className="p-4 h-[calc(100%-37px)] overflow-auto bg-gray-50">
        {error ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-md">
            <p className="font-medium">Preview Error</p>
            <p className="mt-1 text-sm">{error}</p>
          </div>
        ) : fileContent ? (
          <div className="space-y-4">
            <div className="rounded-lg border overflow-hidden bg-white shadow-sm">
              <div className="border-b px-4 py-2 bg-gray-50 flex justify-between items-center">
                <div className="flex items-center">
                  <span className="text-sm font-medium">Prototype Structure</span>
                </div>
                <span className="text-xs text-gray-500">{fileStructure.length} files total</span>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(directories).map(([dir, files]) => (
                    files.length > 0 && (
                      <div key={dir} className="border rounded-lg p-3">
                        <h4 className="font-medium text-sm mb-2 capitalize">{dir}</h4>
                        <ul className="text-xs space-y-1 text-gray-600">
                          {files.map((file, i) => (
                            <li key={i} className="truncate">
                              {file.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-lg border overflow-hidden bg-white shadow-sm">
              <div className="border-b px-4 py-2 bg-gray-50 flex justify-between items-center">
                <div className="flex items-center">
                  <span className="text-sm font-medium">Code Structure</span>
                </div>
              </div>
              <pre className="p-4 text-sm overflow-auto max-h-64 bg-gray-50">
                <code className={`language-${fileName?.split('.').pop()}`}>
                  {fileContent}
                </code>
              </pre>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-700">
              <p className="font-medium mb-2">Foundation Deployment System:</p>
              <p>Your prototype has been generated with a complete application structure, including:</p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Frontend components and pages ({directories.components.length + directories.pages.length} files)</li>
                <li>API endpoints ({directories.api.length} routes)</li>
                <li>Styles and UI components ({directories.styles.length} files)</li>
                <li>Utilities and helpers ({directories.lib.length} files)</li>
              </ul>
              <p className="mt-3">To see the full implementation in action, use the Deploy button (coming soon).</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            No preview available
          </div>
        )}
      </div>
    </div>
  );
}

// Mock data available to the preview
const mockProductData = {
  id: 1,
  name: 'Sample Product',
  price: 99.99,
  description: 'This is a sample product description',
  image: 'https://via.placeholder.com/400',
  features: ['Feature 1', 'Feature 2', 'Feature 3'],
  inStock: true,
  rating: 4.5,
  reviews: [
    { id: 1, author: 'User 1', text: 'Great product!', rating: 5 },
    { id: 2, author: 'User 2', text: 'Good value', rating: 4 }
  ]
}; 