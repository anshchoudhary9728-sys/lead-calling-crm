'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import {
  Loader2,
  PhoneCall,
  CalendarCheck,
  PhoneOff,
  FileText,
  Menu,
  LayoutDashboard,
} from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, isLoading } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auto-close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // If on login page, show only login page
  if (pathname === '/login') {
    return <main className="min-h-screen bg-slate-900">{children}</main>;
  }

  // If loading session state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-3">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">
          Loading FabricTraders CRM...
        </p>
      </div>
    );
  }

  // If unauthenticated
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-3">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">
          Redirecting to Login...
        </p>
      </div>
    );
  }

  // Mobile Bottom Bar Items
  const mobileNavItems = [
    {
      name: 'New',
      href: '/planned-calls',
      icon: PhoneCall,
      activeColor: 'text-purple-400',
    },
    {
      name: 'Follow-ups',
      href: '/followups',
      icon: CalendarCheck,
      activeColor: 'text-amber-400',
    },
    {
      name: 'Not Reach',
      href: '/not-reachable',
      icon: PhoneOff,
      activeColor: 'text-rose-400',
    },
    {
      name: 'Quotes',
      href: '/quotations',
      icon: FileText,
      activeColor: 'text-emerald-400',
    },
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      activeColor: 'text-sky-400',
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      {/* Sidebar (Desktop Permanent + Mobile Slide-over Drawer) */}
      <Sidebar mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header onToggleMobileMenu={() => setMobileMenuOpen(prev => !prev)} />
        
        {/* Main Viewport (with padding bottom on mobile to accommodate bottom nav) */}
        <main className="flex-1 pb-20 md:pb-6">{children}</main>

        {/* Mobile Bottom Navigation Bar (Fixed for quick 1-thumb CRM access) */}
        <nav
          aria-label="Mobile Navigation"
          className="fixed bottom-0 left-0 right-0 z-30 bg-[#1e0a38]/95 backdrop-blur-md border-t border-purple-900/50 flex items-center justify-around py-2 px-1 md:hidden shadow-2xl"
        >
          {mobileNavItems.map(item => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
                  isActive
                    ? `${item.activeColor} font-black`
                    : 'text-purple-200/70 hover:text-white font-medium'
                }`}
              >
                <div
                  className={`p-1 rounded-lg ${
                    isActive ? 'bg-purple-900/60 shadow-inner' : ''
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] tracking-tight mt-0.5">{item.name}</span>
              </Link>
            );
          })}

          {/* More Menu Drawer Trigger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center py-1 px-2 text-purple-200/70 hover:text-white font-medium rounded-xl transition"
          >
            <div className="p-1 rounded-lg">
              <Menu className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">More</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
