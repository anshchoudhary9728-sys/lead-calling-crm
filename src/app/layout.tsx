import './globals.css';
import React from 'react';
import { AuthProvider } from '@/context/AuthContext';
import AppLayout from '@/components/layout/AppLayout';

export const metadata = {
  title: 'Lead Management & Calling CRM — FabricTraders',
  description: 'Production Lead Calling, Follow-up & Sales CRM System for Indian Businesses',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-100 min-h-screen text-slate-900 antialiased">
        <AuthProvider>
          <AppLayout>{children}</AppLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
