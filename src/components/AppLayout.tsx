'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';

const PUBLIC_PATHS = ['/login', '/register', '/auth/callback'];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  '/operators': ['ADMIN'],
  '/batteries': ['ADMIN', 'OPERATOR'],
  '/telemetry': ['ADMIN', 'OPERATOR'],
  '/alarms': ['ADMIN', 'OPERATOR'],
};

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  const isPublicPath = PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith('/auth/callback'));

  useEffect(() => {
    if (!loading) {
      if (!user && !isPublicPath) {
        router.replace('/login');
      } else if (user && isPublicPath && pathname !== '/auth/callback') {
        router.replace('/');
      } else if (user) {
        const allowedRoles = Object.entries(ROLE_PERMISSIONS).find(([path]) => 
          pathname === path || pathname.startsWith(path + '/')
        )?.[1];
        if (allowedRoles && !allowedRoles.includes(user.role)) {
          router.replace('/');
        }
      }
    }
  }, [user, loading, isPublicPath, pathname, router]);

  // Show loading spinner during auth hydration
  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-slate-400">Authenticating session...</p>
      </div>
    );
  }

  // Unauthenticated user trying to access protected route: render nothing while redirecting
  if (!user && !isPublicPath) {
    return null;
  }

  // Public pages (login / register): render standalone full-screen layout without sidebar
  if (isPublicPath) {
    return (
      <div className="min-h-screen bg-dark-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    );
  }

  // Protected dashboard pages: render Sidebar + Navbar + Content
  return (
    <div className="flex min-h-screen bg-dark-900 text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
