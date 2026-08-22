'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  PhoneCall,
  LayoutDashboard,
  Users,
  CalendarCheck,
  CheckCircle2,
  BarChart3,
  UserCheck,
  Layers,
  Settings,
  LogOut,
  FileSpreadsheet,
  PhoneOff,
  Sparkles,
  FileText,
  X,
} from 'lucide-react';

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { currentUser, logout } = useAuth();
  const isExecutive = currentUser?.role === 'SALES_EXECUTIVE';

  const [kpis, setKpis] = useState({
    overdue_calls: 0,
    new_inquiry_count: 0,
    followup_count: 0,
    not_reachable_count: 0,
  });

  const fetchKpis = () => {
    fetch(`/api/v1/kpis?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    })
      .then(r => r.json())
      .then(data => {
        if (data.success && data.kpis) {
          setKpis(data.kpis);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchKpis();
    const interval = setInterval(fetchKpis, 15000);
    return () => clearInterval(interval);
  }, [pathname]);

  const menuItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      iconBg: 'bg-purple-600',
    },
    {
      name: 'New Inquiry',
      href: '/planned-calls',
      icon: PhoneCall,
      iconBg: 'bg-blue-600',
      badge: kpis.overdue_calls > 0 ? `${kpis.overdue_calls} Overdue` : kpis.new_inquiry_count > 0 ? `${kpis.new_inquiry_count}` : null,
      badgeColor: kpis.overdue_calls > 0 ? 'bg-rose-500 text-white animate-pulse' : 'bg-blue-600 text-white',
    },
    {
      name: 'Follow-ups',
      href: '/followups',
      icon: CalendarCheck,
      iconBg: 'bg-amber-500',
      badge: kpis.followup_count > 0 ? `${kpis.followup_count}` : null,
      badgeColor: 'bg-amber-500 text-slate-950 font-bold',
    },
    {
      name: 'Not Reachable',
      href: '/not-reachable',
      icon: PhoneOff,
      iconBg: 'bg-rose-500',
      badge: kpis.not_reachable_count > 0 ? `${kpis.not_reachable_count}` : null,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      name: 'Leads Master',
      href: '/leads',
      icon: Users,
      iconBg: 'bg-pink-600',
    },
    {
      name: 'Quotations / कोटेशन',
      href: '/quotations',
      icon: FileText,
      iconBg: 'bg-amber-600',
    },
    {
      name: 'My Assigned Leads',
      href: '/my-leads',
      icon: UserCheck,
      iconBg: 'bg-cyan-600',
    },
    {
      name: 'Call History Logs',
      href: '/calls',
      icon: Layers,
      iconBg: 'bg-indigo-600',
    },
    {
      name: 'Converted Deals',
      href: '/converted',
      icon: CheckCircle2,
      iconBg: 'bg-emerald-600',
    },
    {
      name: 'Analytics & Reports',
      href: '/reports',
      icon: BarChart3,
      iconBg: 'bg-violet-600',
      adminOnly: true,
    },
    {
      name: 'User Management',
      href: '/users',
      icon: UserCheck,
      iconBg: 'bg-teal-600',
      adminOnly: true,
    },
    {
      name: 'Integrations',
      href: '/integrations',
      icon: FileSpreadsheet,
      iconBg: 'bg-fuchsia-600',
      adminOnly: true,
    },
    {
      name: 'Fabric & System Settings',
      href: '/settings',
      icon: Settings,
      iconBg: 'bg-slate-600',
      adminOnly: true,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm md:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 md:w-64 bg-gradient-to-b from-[#1e0a38] via-[#280c4a] to-[#140426] text-slate-200 flex flex-col h-screen select-none border-r border-purple-900/40 shadow-2xl transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Logo Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-purple-900/40 bg-[#16052c]">
          <div className="flex items-center">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-pink-500 flex items-center justify-center text-white font-black text-lg mr-3 shadow-lg shadow-purple-900/50">
              F
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h1 className="font-extrabold text-white tracking-tight text-base leading-tight">FabricTraders</h1>
                <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              </div>
              <p className="text-[10px] text-purple-300 font-bold tracking-wider uppercase">CRM Enterprise</p>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-purple-300 hover:text-white hover:bg-white/10 transition"
            title="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map(item => {
            if (item.adminOnly && isExecutive) return null;

            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition group ${
                  isActive
                    ? 'bg-purple-600/40 text-white border border-purple-400/40 shadow-inner'
                    : 'text-purple-200/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-7 h-7 rounded-lg ${item.iconBg} flex items-center justify-center text-white shadow-md group-hover:scale-105 transition transform`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="tracking-wide">{item.name}</span>
                </div>

                {item.badge && (
                  <span
                    className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full shadow-sm ${
                      item.badgeColor || 'bg-purple-900 text-purple-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Profile & Logout */}
        <div className="p-3.5 border-t border-purple-900/40 bg-[#120324]">
          <div className="flex items-center justify-between bg-purple-950/60 p-2 rounded-xl border border-purple-900/50">
            <div className="truncate pr-2">
              <p className="text-xs font-bold text-white truncate">{currentUser?.full_name || 'User'}</p>
              <p className="text-[10px] text-purple-300 font-medium truncate">{currentUser?.email}</p>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 rounded-lg text-purple-300 hover:text-rose-400 hover:bg-white/10 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
