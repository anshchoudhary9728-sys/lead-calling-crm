'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { Loader2 } from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, isLoading } = useAuth();
  const pathname = usePathname();

  // If on login page, show only the login page without sidebar/header
  if (pathname === '/login') {
    return <main className="min-h-screen bg-slate-900">{children}</main>;
  }

  // If loading session state, show clean loader
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-3">
        <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
        <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Loading FabricTraders CRM...</p>
      </div>
    );
  }

  // If unauthenticated on any protected route, don't show dashboard (AuthContext will redirect to /login)
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-3">
        <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
        <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Redirecting to Login...</p>
      </div>
    );
  }

  // Authenticated layout with Sidebar & Header
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
