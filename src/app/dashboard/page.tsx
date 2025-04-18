'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'deployed' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export default function Dashboard() {
  const { data: session, status: authStatus } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch projects when the user is authenticated
    if (authStatus === 'authenticated') {
      fetchProjects();
    } else if (authStatus === 'unauthenticated') {
      setIsLoading(false);
    }
  }, [authStatus]);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/projects');
      
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      
      const data = await response.json();
      
      // Format dates for display
      const formattedProjects = data.projects.map((project: any) => ({
        ...project,
        createdAt: new Date(project.createdAt).toLocaleDateString(),
        updatedAt: new Date(project.updatedAt).toLocaleDateString(),
      }));
      
      setProjects(formattedProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  if (authStatus === 'loading') {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-gray-500 text-sm font-medium">Total Projects</h3>
          <p className="text-3xl font-bold">{projects.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-gray-500 text-sm font-medium">Deployed</h3>
          <p className="text-3xl font-bold">
            {projects.filter(p => p.status === 'deployed').length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-gray-500 text-sm font-medium">Latest Update</h3>
          <p className="text-3xl font-bold">
            {projects.length > 0 ? projects[0].updatedAt : 'N/A'}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Your Projects</h2>
          <Link
            href="/dashboard/notion"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            New Project
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-md">
            <p>{error}</p>
            <button 
              onClick={() => { setError(null); fetchProjects(); }} 
              className="text-sm underline mt-2"
            >
              Try Again
            </button>
          </div>
        ) : projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div key={project.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{project.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      project.status === 'deployed' ? 'bg-green-100 text-green-800' :
                      project.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{project.description}</p>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Created: {project.createdAt}</span>
                    <span>Updated: {project.updatedAt}</span>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-2 border-t">
                  <div className="flex justify-between">
                    <Link
                      href={`/dashboard/editor/${project.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Code
                    </Link>
                    {project.status === 'deployed' ? (
                      <Link
                        href={`/dashboard/analytics/${project.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Analytics
                      </Link>
                    ) : (
                      <button
                        onClick={() => {
                          // Will implement deployment later
                          alert('Deployment feature coming soon!');
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Deploy
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-600 mb-2">No projects yet</h3>
            <p className="text-gray-500 mb-6">Connect your Notion workspace to create your first project</p>
            <Link
              href="/dashboard/notion"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Connect Notion
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 