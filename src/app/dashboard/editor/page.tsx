'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Editor from '@monaco-editor/react';
import Preview from './components/Preview';
import Link from 'next/link';

interface FileNode {
  name: string;
  content: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  fileType?: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

type ViewMode = 'code' | 'preview' | 'split';

export default function CodeEditor() {
  const router = useRouter();
  const [code, setCode] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('code');
  const [hasProjects, setHasProjects] = useState<boolean | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  // Fetch projects and check if any exist
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects');
        
        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }
        
        const data = await response.json();
        setProjects(data.projects || []);
        setHasProjects(data.projects.length > 0);
        
        // Only set loading to false if there are no projects
        // Otherwise, we'll wait until code is loaded
        if (data.projects.length === 0) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
        setHasProjects(false);
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Load the generated code from localStorage when component mounts or project is selected
  useEffect(() => {
    if (hasProjects === null) {
      return; // Wait until we know if there are projects
    }
    
    if (hasProjects === false) {
      setIsLoading(false); // If no projects, we're done loading
      return;
    }
    
    // If no project is selected and we have code in localStorage, try to load it
    if (!selectedProject) {
      try {
        // Try to get generated code from localStorage
        const savedCode = localStorage.getItem('generatedCode');
        if (savedCode) {
          setCode(savedCode);
          
          try {
            // Try to parse the code as JSON (new format)
            const parsedFiles = JSON.parse(savedCode);
            if (typeof parsedFiles === 'object') {
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
              // Fallback to old parsing method
              const parsedFiles = parseCodeToFileTree(savedCode);
              setFileTree(parsedFiles);
              if (parsedFiles.length > 0) {
                setSelectedFile(parsedFiles[0].name);
              }
            }
          } catch (e) {
            // If JSON parsing fails, try the old format
            const parsedFiles = parseCodeToFileTree(savedCode);
            setFileTree(parsedFiles);
            if (parsedFiles.length > 0) {
              setSelectedFile(parsedFiles[0].name);
            }
          }
        } else {
          // No code in localStorage and no project selected
          console.log('No generated code found in localStorage');
        }
      } catch (error) {
        console.error('Error loading generated code:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Load code for the selected project
      loadProjectCode(selectedProject);
    }
  }, [hasProjects, selectedProject]);

  // Parse the JSON structure into a file tree
  const parseJsonToFileTree = (files: Record<string, string>): FileNode[] => {
    const root: Record<string, any> = {};
    
    // Sort file paths to ensure parent directories are processed first
    const filePaths = Object.keys(files).sort();
    
    filePaths.forEach(path => {
      const content = files[path];
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

  // Load code for a specific project
  const loadProjectCode = async (projectId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/code`);
      if (!response.ok) {
        throw new Error('Failed to fetch project code');
      }
      
      const data = await response.json();
      if (data.code) {
        setCode(data.code);
        localStorage.setItem('generatedCode', data.code);
        
        try {
          // Try to parse the code as JSON (new format)
          const parsedFiles = JSON.parse(data.code);
          if (typeof parsedFiles === 'object') {
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
            // Fallback to old parsing method
            const parsedFiles = parseCodeToFileTree(data.code);
            setFileTree(parsedFiles);
            if (parsedFiles.length > 0) {
              setSelectedFile(parsedFiles[0].name);
            }
          }
        } catch (e) {
          // If JSON parsing fails, try the old format
          const parsedFiles = parseCodeToFileTree(data.code);
          setFileTree(parsedFiles);
          if (parsedFiles.length > 0) {
            setSelectedFile(parsedFiles[0].name);
          }
        }
      } else {
        setCode('');
        setFileTree([]);
      }
    } catch (error) {
      console.error('Error loading project code:', error);
      setCode('');
      setFileTree([]);
    } finally {
      setIsLoading(false);
    }
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
    
    return files;
  };

  // Save the current code to localStorage
  const saveCode = () => {
    setIsSaving(true);
    
    try {
      if (selectedFile) {
        try {
          // Try to parse the current code in localStorage as JSON
          const codeObj = JSON.parse(localStorage.getItem('generatedCode') || '{}');
          
          if (typeof codeObj === 'object') {
            // In JSON mode, update the content for selected file
            const updatedObj = {
              ...codeObj,
              [selectedFile]: code
            };
            localStorage.setItem('generatedCode', JSON.stringify(updatedObj, null, 2));
            
            // Also update our file tree for the current session
            const updatedFileTree = updateFileTreeContent(fileTree, selectedFile, code);
            setFileTree(updatedFileTree);
          } else {
            // Fallback for old format
            localStorage.setItem('generatedCode', code);
          }
        } catch (e) {
          // If we can't parse as JSON, we're using old format
          localStorage.setItem('generatedCode', code);
          
          // Update file tree for the legacy format
          const updatedFileTree = fileTree.map(file => {
            if (file.name === selectedFile) {
              return { ...file, content: code };
            }
            return file;
          });
          
          setFileTree(updatedFileTree);
        }
      } else {
        // No file selected, just save the whole code
        localStorage.setItem('generatedCode', code);
      }
      
      // Show a success message briefly
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch (error) {
      console.error('Error saving code:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Helper function to update content in a nested file tree
  const updateFileTreeContent = (tree: FileNode[], targetPath: string, newContent: string): FileNode[] => {
    return tree.map(node => {
      if (node.type === 'file' && node.name === targetPath) {
        return { ...node, content: newContent };
      }
      
      if (node.type === 'directory' && node.children) {
        return {
          ...node,
          children: updateFileTreeContent(node.children, targetPath, newContent)
        };
      }
      
      return node;
    });
  };

  // Get the content of the currently selected file
  const getSelectedFileContent = (): string => {
    if (!selectedFile) return code;
    
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
    
    // Try finding the file in our file tree first
    const contentFromTree = findFileContent(fileTree, selectedFile);
    if (contentFromTree) {
      return contentFromTree;
    }
    
    try {
      // If not found in tree, check if we're using the JSON format
      const codeObj = JSON.parse(localStorage.getItem('generatedCode') || '{}');
      if (typeof codeObj === 'object') {
        // First check if there's a "files" wrapper (Claude format)
        if (codeObj.files && typeof codeObj.files === 'object') {
          if (selectedFile in codeObj.files) {
            return codeObj.files[selectedFile];
          }
        }
        // Otherwise check if the file exists directly in the object
        else if (selectedFile in codeObj) {
          return codeObj[selectedFile];
        }
      }
    } catch (e) {
      // If we can't parse as JSON, we're using old format
      console.log("Failed to parse code from localStorage as JSON", e);
    }
    
    // Legacy format or fallback
    const file = fileTree.find(file => file.name === selectedFile);
    return file ? file.content : '';
  };

  // If no projects, show a friendly message with a button to create a project
  if (hasProjects === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-semibold mb-4">No projects yet</h2>
          <p className="text-gray-600 mb-8">
            Connect your Notion workspace to create your first project. 
            Foundation will help you transform your Notion documentation into functional prototypes.
          </p>
          <Link 
            href="/dashboard/notion" 
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Connect Notion
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Show project selection if no code is loaded or file tree is empty
  if ((code === '' || fileTree.length === 0) && projects.length > 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-6">Select a Project</h2>
        <p className="text-gray-600 mb-6">
          Choose a project to view and edit its generated code.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(project => (
            <Link 
              key={project.id}
              href={`/dashboard/editor/${project.id}`}
              className="border rounded-lg p-4 hover:border-blue-500 hover:shadow-md cursor-pointer transition-all"
            >
              <h3 className="font-medium text-lg mb-2">{project.name}</h3>
              {project.description && (
                <p className="text-gray-600 text-sm mb-3">{project.description}</p>
              )}
              <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
                <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
                <span>Last updated: {new Date(project.updatedAt).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
        
        <div className="mt-8 flex justify-center">
          <Link
            href="/dashboard/notion"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create New Project
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold">Generated Code</h2>
            {selectedProject && (
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="ml-4 border rounded-md px-2 py-1 text-sm"
              >
                <option value="">Select Project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
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
            <span>Changes saved successfully!</span>
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
                  onChange={(value) => setCode(value || '')}
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