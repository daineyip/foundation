'use client';

import { useState } from 'react';
import Link from 'next/link';

interface ProjectCard {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'deployed' | 'archived';
  created: string;
  updated: string;
}

const mockProjects: ProjectCard[] = [
  {
    id: '1',
    name: 'E-commerce Prototype',
    description: 'Product listing and checkout flow prototype',
    status: 'deployed',
    created: '2023-04-01',
    updated: '2023-04-05'
  },
  {
    id: '2',
    name: 'Task Management App',
    description: 'To-do list with filtering and sorting',
    status: 'draft',
    created: '2023-04-10',
    updated: '2023-04-10'
  }
];

export default function Dashboard() {
  const [projects, setProjects] = useState<ProjectCard[]>(mockProjects);

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
          <h3 className="text-gray-500 text-sm font-medium">Recent Activity</h3>
          <p className="text-3xl font-bold">
            {new Date().toLocaleDateString()}
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

        {projects.length > 0 ? (
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
                    <span>Created: {project.created}</span>
                    <span>Updated: {project.updated}</span>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-2 border-t">
                  <div className="flex justify-between">
                    <Link
                      href={`/dashboard/editor/${project.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Details
                    </Link>
                    {project.status === 'deployed' && (
                      <Link
                        href={`/dashboard/analytics/${project.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Analytics
                      </Link>
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