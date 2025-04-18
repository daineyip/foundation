'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useSession } from 'next-auth/react';

// Mock analytics data for different projects
const mockAnalytics = {
  // E-commerce project data
  ecommerce: {
    pageViewsData: [
      { date: '2023-04-01', views: 20 },
      { date: '2023-04-02', views: 110 },
      { date: '2023-04-03', views: 140 },
      { date: '2023-04-04', views: 250 },
      { date: '2023-04-05', views: 360 },
      { date: '2023-04-06', views: 170 },
      { date: '2023-04-07', views: 430 },
    ],
    conversionData: [
      { name: 'Landing Page', users: 1000 },
      { name: 'Product Page', users: 750 },
      { name: 'Add to Cart', users: 500 },
      { name: 'Checkout', users: 300 },
      { name: 'Purchase', users: 200 },
    ],
    deviceData: [
      { name: 'Desktop', value: 30 },
      { name: 'Mobile', value: 50 },
      { name: 'Tablet', value: 20},
    ],
    metrics: {
      totalViews: 1480,
      uniqueVisitors: 850,
      averageSessionTime: '2:34',
      bounceRate: '32%',
      conversionRate: '18%'
    },
    events: [
      { name: 'Button Click - Add to Cart', count: 532, conversion: '45.2%' },
      { name: 'Form Submit - Checkout', count: 312, conversion: '58.6%' },
      { name: 'Product View', count: 982, conversion: '32.1%' }
    ]
  },
  
  // SaaS Dashboard project data
  saas: {
    pageViewsData: [
      { date: '2023-04-01', views: 85 },
      { date: '2023-04-02', views: 110 },
      { date: '2023-04-03', views: 145 },
      { date: '2023-04-04', views: 160 },
      { date: '2023-04-05', views: 190 },
      { date: '2023-04-06', views: 230 },
      { date: '2023-04-07', views: 250 },
    ],
    conversionData: [
      { name: 'Landing Page', users: 800 },
      { name: 'Features Page', users: 600 },
      { name: 'Pricing Page', users: 450 },
      { name: 'Sign Up', users: 280 },
      { name: 'Activation', users: 150 },
    ],
    deviceData: [
      { name: 'Desktop', value: 75 },
      { name: 'Mobile', value: 20 },
      { name: 'Tablet', value: 5 },
    ],
    metrics: {
      totalViews: 975,
      uniqueVisitors: 620,
      averageSessionTime: '3:15',
      bounceRate: '28%',
      conversionRate: '22%'
    },
    events: [
      { name: 'Button Click - Sign Up', count: 412, conversion: '52.3%' },
      { name: 'Form Submit - Contact', count: 248, conversion: '32.1%' },
      { name: 'Feature Exploration', count: 756, conversion: '48.7%' }
    ]
  },
  
  // Blog website project data
  blog: {
    pageViewsData: [
      { date: '2023-04-01', views: 220 },
      { date: '2023-04-02', views: 245 },
      { date: '2023-04-03', views: 200 },
      { date: '2023-04-04', views: 310 },
      { date: '2023-04-05', views: 340 },
      { date: '2023-04-06', views: 325 },
      { date: '2023-04-07', views: 375 },
    ],
    conversionData: [
      { name: 'Home Page', users: 1200 },
      { name: 'Article Page', users: 950 },
      { name: 'Related Posts', users: 680 },
      { name: 'Comment', users: 320 },
      { name: 'Subscribe', users: 180 },
    ],
    deviceData: [
      { name: 'Desktop', value: 45 },
      { name: 'Mobile', value: 50 },
      { name: 'Tablet', value: 5 },
    ],
    metrics: {
      totalViews: 2015,
      uniqueVisitors: 1240,
      averageSessionTime: '1:58',
      bounceRate: '42%',
      conversionRate: '15%'
    },
    events: [
      { name: 'Article Read', count: 890, conversion: '74.2%' },
      { name: 'Share Article', count: 345, conversion: '28.9%' },
      { name: 'Subscribe Button', count: 210, conversion: '17.5%' }
    ]
  }
};

// Default data for new projects without specific mock data
const defaultAnalytics = {
  pageViewsData: [
    { date: '2023-04-01', views: 75 },
    { date: '2023-04-02', views: 90 },
    { date: '2023-04-03', views: 120 },
    { date: '2023-04-04', views: 135 },
    { date: '2023-04-05', views: 150 },
    { date: '2023-04-06', views: 160 },
    { date: '2023-04-07', views: 180 },
  ],
  conversionData: [
    { name: 'Landing Page', users: 500 },
    { name: 'Main Feature', users: 350 },
    { name: 'Secondary Action', users: 250 },
    { name: 'Final Step', users: 150 },
    { name: 'Completion', users: 100 },
  ],
  deviceData: [
    { name: 'Desktop', value: 50 },
    { name: 'Mobile', value: 40 },
    { name: 'Tablet', value: 10 },
  ],
  metrics: {
    totalViews: 910,
    uniqueVisitors: 550,
    averageSessionTime: '2:05',
    bounceRate: '35%',
    conversionRate: '20%'
  },
  events: [
    { name: 'Primary Action', count: 320, conversion: '58.2%' },
    { name: 'Secondary Action', count: 180, conversion: '32.7%' },
    { name: 'Information Request', count: 420, conversion: '76.4%' }
  ]
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

interface ProjectData {
  id: string;
  name: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function Analytics() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [dateRange, setDateRange] = useState('7d');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch projects when component mounts
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/projects');
        
        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }
        
        const data = await response.json();
        setProjects(data.projects);
        
        // Set the first project as selected by default
        if (data.projects.length > 0) {
          setSelectedProjectId(data.projects[0].id);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
        setError('Failed to load projects');
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      fetchProjects();
    }
  }, [session]);

  // Find the selected project
  const selectedProject = projects.find(p => p.id === selectedProjectId);

  // Determine which analytics data to use based on project name and ID
  const getAnalyticsData = () => {
    if (!selectedProject) return defaultAnalytics;

    // Get base data type based on project name
    const projectName = selectedProject.name.toLowerCase();
    let baseData;
    
    if (projectName.includes('ecommerce') || projectName.includes('shop')) {
      baseData = { ...mockAnalytics.ecommerce };
    } else if (projectName.includes('chairflow') || projectName.includes('dashboard')) {
      baseData = { ...mockAnalytics.saas };
    } else if (projectName.includes('blog') || projectName.includes('content')) {
      baseData = { ...mockAnalytics.blog };
    } else {
      baseData = { ...defaultAnalytics };
    }
    
    // Use the project ID to create unique variations
    // Extract numeric hash from project ID for consistent randomization
    const idSum = selectedProject.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const seed = idSum % 100; // Get a number between 0-99 based on ID
    
    // Create project-specific variations
    const variationFactor = 1 + (seed / 100); // Create a multiplier between 1.0 and 1.99
    
    // Update metrics with unique variations
    baseData.metrics = {
      totalViews: Math.floor(baseData.metrics.totalViews * variationFactor),
      uniqueVisitors: Math.floor(baseData.metrics.uniqueVisitors * variationFactor),
      averageSessionTime: baseData.metrics.averageSessionTime,
      bounceRate: `${Math.floor(parseFloat(baseData.metrics.bounceRate) * (1 + (seed % 20) / 100))}%`,
      conversionRate: `${Math.floor(parseFloat(baseData.metrics.conversionRate) * (1 + (seed % 25) / 100))}%`,
    };
    
    // Update page views data
    baseData.pageViewsData = baseData.pageViewsData.map(item => ({
      date: item.date,
      views: Math.floor(item.views * (0.8 + (seed % 50) / 100)), // Create variation between 0.8x and 1.3x
    }));
    
    // Update conversion data 
    baseData.conversionData = baseData.conversionData.map(item => ({
      name: item.name,
      users: Math.floor(item.users * (0.9 + (seed % 30) / 100)), // Create variation between 0.9x and 1.2x
    }));
    
    // Update event data
    baseData.events = baseData.events.map(item => ({
      name: item.name,
      count: Math.floor(item.count * variationFactor),
      conversion: `${Math.floor(parseFloat(item.conversion) * (0.95 + (seed % 15) / 100))}%`,
    }));
    
    return baseData;
  };

  const analyticsData = getAnalyticsData();

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
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Analytics Dashboard</h2>
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No projects found. Create a project to view analytics.</p>
          <a href="/dashboard/notion" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            Create Project
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Analytics Dashboard</h2>

          <div className="flex space-x-4">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="border border-gray-300 rounded-md py-2 px-3"
            >
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>

            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="border border-gray-300 rounded-md py-2 px-3"
            >
              <option value="1d">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="all">All time</option>
            </select>

            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              Export Data
            </button>
          </div>
        </div>

        {selectedProject && (
          <>
            {/* Project Info */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium">{selectedProject.name}</h3>
              <p className="text-sm text-gray-500">{selectedProject.description}</p>
              <div className="mt-2 flex space-x-3 text-xs">
                <span className={`px-2 py-1 rounded-full ${
                  selectedProject.status === 'deployed' ? 'bg-green-100 text-green-800' :
                  selectedProject.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {selectedProject.status}
                </span>
                <span className="text-gray-500">
                  Created: {new Date(selectedProject.createdAt).toLocaleDateString()}
                </span>
                <span className="text-gray-500">
                  Updated: {new Date(selectedProject.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Total Views</h3>
                <p className="text-2xl font-bold">{analyticsData.metrics.totalViews.toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Unique Visitors</h3>
                <p className="text-2xl font-bold">{analyticsData.metrics.uniqueVisitors.toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Avg. Session</h3>
                <p className="text-2xl font-bold">{analyticsData.metrics.averageSessionTime}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Bounce Rate</h3>
                <p className="text-2xl font-bold">{analyticsData.metrics.bounceRate}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Conversion Rate</h3>
                <p className="text-2xl font-bold">{analyticsData.metrics.conversionRate}</p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Page Views Over Time */}
              <div className="border rounded-lg p-4">
                <h3 className="text-md font-medium mb-4">Page Views Over Time</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={analyticsData.pageViewsData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="views" stroke="#8884d8" activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Conversion Funnel */}
              <div className="border rounded-lg p-4">
                <h3 className="text-md font-medium mb-4">Conversion Funnel</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analyticsData.conversionData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="users" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Device Breakdown */}
              <div className="border rounded-lg p-4">
                <h3 className="text-md font-medium mb-4">Device Breakdown</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData.deviceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {analyticsData.deviceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Event Tracking */}
              <div className="border rounded-lg p-4">
                <h3 className="text-md font-medium mb-4">Top Events</h3>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Event
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Count
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Conversion
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analyticsData.events.map((event, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{event.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{event.count}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{event.conversion}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 