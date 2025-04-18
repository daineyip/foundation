'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Editor from '@monaco-editor/react';
import Link from 'next/link';
import Preview from '../components/Preview';

interface FileNode {
  name: string;
  content: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  fileType?: string;
}

interface ProjectData {
  id: string;
  name: string;
  description: string;
  codeContent: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

type ViewMode = 'code' | 'preview' | 'split';

export default function ProjectEditor() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<ProjectData | null>(null);
  const [code, setCode] = useState<string>('// Loading...');
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('code');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    // Fetch the project details
    const fetchProject = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/projects/${projectId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch project');
        }
        
        const data = await response.json();
        setProject(data);
        
        try {
          // Try to parse the code as JSON (new format)
          const parsedFiles = JSON.parse(data.codeContent || '{}');
          if (typeof parsedFiles === 'object') {
            setCode(data.codeContent || '{}');
            
            // Parse the JSON structure into a file tree
            const parsedTree = parseJsonToFileTree(parsedFiles);
            setFileTree(parsedTree);
            
            // Select the first file by default
            if (parsedTree.length > 0) {
              if (parsedTree[0].children && parsedTree[0].children.length > 0) {
                setSelectedFile(parsedTree[0].children[0].name);
              } else {
                setSelectedFile(parsedTree[0].name);
              }
            }
          } else {
            throw new Error('Not a valid JSON object');
          }
        } catch (e) {
          // If JSON parsing fails, try the old format
          setCode(data.codeContent || '// No code content found');
          
          // Parse the code into a file tree (legacy format)
          const parsedFiles = parseCodeToFileTree(data.codeContent || '');
          setFileTree(parsedFiles);
          
          // Select the first file by default
          if (parsedFiles.length > 0) {
            setSelectedFile(parsedFiles[0].name);
          }
        }
      } catch (error) {
        console.error('Error fetching project:', error);
        setError('Failed to load project');
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  // Parse the JSON structure into a file tree
  const parseJsonToFileTree = (files: Record<string, string>): FileNode[] => {
    const root: Record<string, any> = {};
    
    // Handle "files" wrapper from Claude API response
    let filesToProcess: Record<string, string> = files;
    
    // Check if we have a "files" property at the top level (Claude format)
    if (files.files && typeof files.files === 'object') {
      filesToProcess = files.files as Record<string, string>;
    }
    
    // Sort file paths to ensure parent directories are processed first
    const filePaths = Object.keys(filesToProcess).sort();
    
    filePaths.forEach(path => {
      const content = filesToProcess[path];
      const parts = path.split('/');
      const fileName = parts.pop() || '';
      const fileExt = fileName.includes('.') ? fileName.split('.').pop() || '' : '';
      
      // Create directories if they don't exist
      let currentLevel = root;
      parts.forEach(part => {
        if (!currentLevel[part]) {
          currentLevel[part] = {
            name: part,
            content: '',
            type: 'directory',
            children: {}
          };
        }
        if (!currentLevel[part].children) {
          currentLevel[part].children = {};
        }
        currentLevel = currentLevel[part].children;
      });
      
      // Add the file to its parent directory
      const fileNode: FileNode = {
        name: path,  // Use the full path as the unique identifier
        content,
        type: 'file',
        fileType: fileExt
      };
      
      if (parts.length === 0) {
        // Top-level file
        root[fileName] = fileNode;
      } else {
        // Nested file
        const parentDir = parts.reduce((acc, part) => {
          return acc[part].children;
        }, root);
        
        parentDir[fileName] = fileNode;
      }
    });
    
    // Convert the object tree to an array tree
    const toArray = (obj: Record<string, any>): FileNode[] => {
      return Object.values(obj).map(node => {
        if (node.children) {
          // Convert children object to array
          const childrenArray = toArray(node.children);
          node.children = childrenArray;
          
          // Sort children: directories first, then files alphabetically
          node.children.sort((a: FileNode, b: FileNode) => {
            if (a.type !== b.type) {
              return a.type === 'directory' ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
          });
        }
        return node;
      });
    };
    
    const result = toArray(root);
    // Sort top level: directories first, then files alphabetically
    result.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
    
    return result;
  };

  // Parse the generated code into a file tree structure (legacy format)
  const parseCodeToFileTree = (codeString: string): FileNode[] => {
    const fileRegex = /\/\/ File: (.*?)\n```[a-z]*\n([\s\S]*?)```/g;
    const files: FileNode[] = [];
    let match;
    
    while ((match = fileRegex.exec(codeString)) !== null) {
      const path = match[1].trim();
      const content = match[2];
      const name = path.split('/').pop() || path;
      const fileExt = name.includes('.') ? name.split('.').pop() || '' : '';
      
      files.push({
        name: path,
        content,
        type: 'file',
        fileType: fileExt
      });
    }
    
    // If no matches found, treat as a single file
    if (files.length === 0 && codeString.trim()) {
      files.push({
        name: 'index.tsx',
        content: codeString,
        type: 'file',
        fileType: 'tsx'
      });
    }
    
    return files;
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined && selectedFile) {
      try {
        // Try to parse the current code as JSON
        const parsedCode = JSON.parse(code);
        
        if (typeof parsedCode === 'object') {
          // In JSON mode, update the content for selected file
          const updatedCode = {
            ...parsedCode,
            [selectedFile]: value
          };
          setCode(JSON.stringify(updatedCode, null, 2));
        } else {
          throw new Error('Not a valid JSON object');
        }
      } catch (e) {
        // Legacy format - update the file in the file tree
        const updatedFileTree = fileTree.map(file => {
          if (file.name === selectedFile) {
            return { ...file, content: value };
          }
          return file;
        });
        
        setFileTree(updatedFileTree);
        
        // Update the full code string with all files
        const updatedCode = updatedFileTree.map(file => {
          return `// File: ${file.name}\n\`\`\`${file.fileType || ''}\n${file.content}\n\`\`\``;
        }).join('\n\n');
        
        setCode(updatedCode);
      }
    }
  };

  const saveCode = async () => {
    if (!project) return;
    
    try {
      setIsSaving(true);
      
      // Prepare the code content for saving to the database
      let codeToSave: string;
      
      if (selectedFile) {
        try {
          // If we have a selected file, we may need to update its content in the JSON
          const codeObj = JSON.parse(code);
          
          if (typeof codeObj === 'object') {
            // Update the selected file in the JSON object
            const updatedCode = {
              ...codeObj,
              [selectedFile]: getSelectedFileContent()
            };
            codeToSave = JSON.stringify(updatedCode, null, 2);
          } else {
            // Not a JSON object, use the current code as is
            codeToSave = code;
          }
        } catch (e) {
          // If parsing fails, it's probably not JSON format - use as is
          codeToSave = code;
        }
      } else {
        // No file selected, use the current code as is
        codeToSave = code;
      }
      
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          codeContent: codeToSave,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save code');
      }
      
      // Show success toast
      setShowToast(true);
      // Hide toast after 2 seconds
      setTimeout(() => setShowToast(false), 2000);
    } catch (error) {
      console.error('Error saving code:', error);
      setError('Failed to save code');
    } finally {
      setIsSaving(false);
    }
  };

  const getSelectedFileContent = (): string => {
    if (!selectedFile) return '';
    
    // Helper function to recursively search for the file in the tree
    const findFileContent = (nodes: FileNode[], targetPath: string): string => {
      for (const node of nodes) {
        // Check if this is the file we're looking for (either by name or full path)
        if (node.type === 'file' && (node.name === targetPath || node.name.endsWith('/' + targetPath))) {
          return node.content;
        }
        
        // If this is a directory, search its children
        if (node.type === 'directory' && node.children) {
          const content = findFileContent(node.children, targetPath);
          if (content) return content;
        }
      }
      return '';
    };
    
    return findFileContent(fileTree, selectedFile);
  };

  // Get icon for file type
  const getFileIcon = (file: FileNode): React.ReactNode => {
    const type = file.fileType || 'unknown';
    
    switch (type) {
      case 'page':
        return (
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        );
      case 'component':
        return (
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        );
      case 'api':
        return (
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'styles':
        return (
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  // Get the appropriate language for the editor based on file extension
  const getLanguageFromFileName = (fileName: string): string => {
    if (!fileName.includes('.')) return 'typescript';
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    
    switch (extension) {
      case 'js':
        return 'javascript';
      case 'jsx':
        return 'javascript';
      case 'ts':
        return 'typescript';
      case 'tsx':
        return 'typescript';
      case 'css':
        return 'css';
      case 'html':
        return 'html';
      case 'json':
        return 'json';
      case 'md':
        return 'markdown';
      default:
        return 'typescript';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-6 rounded-md">
        <p className="text-xl font-medium mb-2">Error</p>
        <p>{error}</p>
        <button 
          onClick={() => router.push('/dashboard')} 
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-600 mb-2">Project not found</h3>
        <p className="text-gray-500 mb-6">The project you're looking for doesn't exist or you don't have access to it.</p>
        <Link
          href="/dashboard"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold">{project?.name || 'Project'}</h2>
            {project?.description && (
              <p className="ml-4 text-gray-500 text-sm">{project.description}</p>
            )}
          </div>
          <div className="flex space-x-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('code')}
                className={`px-3 py-1 rounded ${
                  viewMode === 'code' ? 'bg-white shadow' : 'text-gray-600'
                }`}
              >
                Code
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={`px-3 py-1 rounded ${
                  viewMode === 'preview' ? 'bg-white shadow' : 'text-gray-600'
                }`}
              >
                Preview
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`px-3 py-1 rounded ${
                  viewMode === 'split' ? 'bg-white shadow' : 'text-gray-600'
                }`}
              >
                Split
              </button>
            </div>
            <button
              onClick={saveCode}
              className="flex items-center px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
            <Link
              href="/dashboard"
              className="flex items-center px-3 py-1 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Success Toast */}
        {showToast && (
          <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded flex items-center shadow-md z-50">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Changes saved to database!</span>
          </div>
        )}

        <div className="flex h-[70vh] border rounded-lg overflow-hidden">
          {/* File Tree */}
          <div className="w-64 border-r overflow-y-auto bg-gray-50 p-4">
            <div className="mb-4">
              <h3 className="font-medium text-gray-700 mb-2">Project Files</h3>
              <input
                type="text"
                placeholder="Search files..."
                className="w-full px-2 py-1 text-sm border rounded"
              />
            </div>
            <div className="space-y-1">
              {fileTree.map((file) => renderFileTree(file))}
            </div>
          </div>

          {/* Editor / Preview */}
          <div className="flex-1 flex">
            {(viewMode === 'code' || viewMode === 'split') && (
              <div className={viewMode === 'split' ? 'w-1/2' : 'w-full'}>
                <Editor
                  height="100%"
                  theme="vs-dark"
                  language={selectedFile?.split('.').pop() || 'typescript'}
                  value={getSelectedFileContent()}
                  onChange={handleEditorChange}
                  options={{
                    minimap: { enabled: false },
                    wordWrap: 'on',
                    scrollBeyondLastLine: false,
                  }}
                />
              </div>
            )}
            {(viewMode === 'preview' || viewMode === 'split') && (
              <div className={viewMode === 'split' ? 'w-1/2 border-l' : 'w-full'}>
                <Preview code={code} />
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 px-4 py-3 bg-gray-50 rounded-lg text-sm text-gray-600">
          <p>This code was generated from Notion pages. You can edit it here or download it to use in your project.</p>
        </div>
      </div>
    </div>
  );

  // Helper function to render the file tree recursively
  function renderFileTree(file: FileNode) {
    const isSelected = selectedFile === file.name;
    
    if (file.type === 'directory') {
      return (
        <div key={file.name} className="ml-2">
          <div className="flex items-center mb-1">
            <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <span className="ml-1 text-gray-700">{file.name}</span>
          </div>
          {file.children && (
            <div className="ml-4">
              {file.children.map((child) => renderFileTree(child))}
            </div>
          )}
        </div>
      );
    }
    
    return (
      <div 
        key={file.name} 
        className={`flex items-center px-2 py-1 rounded cursor-pointer ${
          isSelected ? 'bg-blue-100' : 'hover:bg-gray-100'
        }`}
        onClick={() => setSelectedFile(file.name)}
      >
        <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span className="ml-1 text-sm truncate">{file.name.split('/').pop()}</span>
      </div>
    );
  }
} 