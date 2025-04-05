'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Deployment {
  id: string;
  projectId: string;
  projectName: string;
  url: string;
  status: 'building' | 'deployed' | 'failed';
  createdAt: string;
  version: number;
}

const mockDeployments: Deployment[] = [
  {
    id: 'd1',
    projectId: '1',
    projectName: 'E-commerce Prototype',
    url: 'https://ecommerce-prototype.foundation.dev',
    status: 'deployed',
    createdAt: '2023-04-05T10:30:00Z',
    version: 3
  },
  {
    id: 'd2',
    projectId: '1',
    projectName: 'E-commerce Prototype',
    url: 'https://ecommerce-prototype-v2.foundation.dev',
    status: 'building',
    createdAt: '2023-04-06T14:20:00Z',
    version: 4
  }
];

export default function Deployment() {
  const [deployments, setDeployments] = useState<Deployment[]>(mockDeployments);
  const [selectedDeployment, setSelectedDeployment] = useState<Deployment | null>(null);

  const viewDeployment = (deployment: Deployment) => {
    setSelectedDeployment(deployment);
  };

  const closeDetails = () => {
    setSelectedDeployment(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Deployments</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Version
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  URL
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deployed At
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {deployments.map((deployment) => (
                <tr key={deployment.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{deployment.projectName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">v{deployment.version}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      deployment.status === 'deployed' ? 'bg-green-100 text-green-800' :
                      deployment.status === 'building' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {deployment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <a 
                      href={deployment.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      {deployment.url.replace('https://', '')}
                    </a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{formatDate(deployment.createdAt)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => viewDeployment(deployment)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      Details
                    </button>
                    <Link
                      href={`/dashboard/analytics/${deployment.projectId}`}
                      className="text-green-600 hover:text-green-800"
                    >
                      Analytics
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Deployment Details Modal */}
        {selectedDeployment && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-8 max-w-lg w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">{selectedDeployment.projectName} (v{selectedDeployment.version})</h3>
                <button
                  onClick={closeDetails}
                  className="text-gray-500 hover:text-gray-700"
                >
                  &times;
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Status</h4>
                  <p className="text-sm">{selectedDeployment.status}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">URL</h4>
                  <a 
                    href={selectedDeployment.url} 
                    target="_blank"
                    rel="noopener noreferrer" 
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    {selectedDeployment.url}
                  </a>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Deployed At</h4>
                  <p className="text-sm">{formatDate(selectedDeployment.createdAt)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Access Controls</h4>
                  <div className="flex items-center mt-1">
                    <span className="mr-2 text-sm">Password Protection:</span>
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Enabled</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Actions</h4>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors">
                      View Logs
                    </button>
                    <button className="px-3 py-1 bg-gray-200 text-gray-800 text-sm rounded-md hover:bg-gray-300 transition-colors">
                      Rebuild
                    </button>
                    <button className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 