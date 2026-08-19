import './globals.css';
import React from 'react';
import { AuthProvider } from '@/context/AuthContext';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

export const metadata = {
  title: 'Lead Management & Calling CRM — FabricTraders',
  description: 'Production Lead Calling, Follow-up & Sales CRM System for Indian Businesses',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-100 min-h-screen text-slate-900 antialiased">
        <AuthProvider>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
              <Header />
              <div className="flex-1">{children}</div>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
