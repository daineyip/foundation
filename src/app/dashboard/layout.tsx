import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Foundation Dashboard',
  description: 'Transform Notion documentation into functional prototypes',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Foundation</h2>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <Link 
                href="/dashboard" 
                className="block p-2 rounded hover:bg-gray-200 transition-colors"
              >
                Dashboard
              </Link>
            </li>
            <li>
              <Link 
                href="/dashboard/notion" 
                className="block p-2 rounded hover:bg-gray-200 transition-colors"
              >
                Notion Integration
              </Link>
            </li>
            <li>
              <Link 
                href="/dashboard/claude" 
                className="block p-2 rounded hover:bg-gray-200 transition-colors"
              >
                Claude Integration
              </Link>
            </li>
            <li>
              <Link 
                href="/dashboard/editor" 
                className="block p-2 rounded hover:bg-gray-200 transition-colors"
              >
                Code Editor
              </Link>
            </li>
            <li>
              <Link 
                href="/dashboard/deployment" 
                className="block p-2 rounded hover:bg-gray-200 transition-colors"
              >
                Deployment
              </Link>
            </li>
            <li>
              <Link 
                href="/dashboard/analytics" 
                className="block p-2 rounded hover:bg-gray-200 transition-colors"
              >
                Analytics
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm">
          <div className="mx-auto px-4 py-3 flex justify-between items-center">
            <h1 className="text-lg font-semibold">Dashboard</h1>
            <div>
              <button className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                New Project
              </button>
            </div>
          </div>
        </header>
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 