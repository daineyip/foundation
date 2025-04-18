'use client';

import { SessionProvider } from 'next-auth/react';
import { useState, useEffect } from 'react';

export default function AuthSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Use client-side only rendering to fix hydration issues
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <SessionProvider 
      // Enforce refetch on window focus to keep the session up to date
      refetchInterval={0} 
      refetchOnWindowFocus={true}
    >
      <div suppressHydrationWarning>
        {mounted ? children : null}
      </div>
    </SessionProvider>
  );
} 