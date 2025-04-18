'use client';

import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';

export default function UserProfileWidget() {
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (status === 'loading') {
    return (
      <div className="flex items-center space-x-2">
        <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  if (status === 'unauthenticated' || !session) {
    return null;
  }

  const userName = session.user?.name || 'User';
  const userEmail = session.user?.email || '';

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="flex items-center space-x-2 focus:outline-none"
      >
        <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
          <div className="text-gray-500 text-xs font-bold">
            {userName.substring(0, 1).toUpperCase()}
          </div>
        </div>
        <span className="text-sm font-medium">{userName}</span>
      </button>

      {isMenuOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border">
          <div className="px-4 py-2 border-b">
            <p className="text-sm font-medium">{userName}</p>
            <p className="text-xs text-gray-500 truncate">{userEmail}</p>
          </div>
          <a 
            href="/dashboard/settings" 
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Account Settings
          </a>
          <button
            onClick={handleSignOut}
            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
} 