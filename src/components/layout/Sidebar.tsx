'use client';

import React from 'react';
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
  Phone,
  FileSpreadsheet,
} from 'lucide-react';
import { crmStore } from '@/lib/crm-store';

export default function Sidebar() {
  const pathname = usePathname();
  const { currentUser, logout } = useAuth();
  const kpis = crmStore.getDashboardKPIs();

  const isExecutive = currentUser?.role === 'SALES_EXECUTIVE';

  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    {
      name: 'New Inquiry',
      href: '/planned-calls',
      icon: PhoneCall,
      badge: kpis.overdue_calls > 0 ? `${kpis.overdue_calls} Overdue` : `${kpis.calls_pending} Due`,
      badgeColor: kpis.overdue_calls > 0 ? 'bg-rose-500 text-white animate-pulse' : 'bg-sky-500 text-white',
    },
    { name: 'Follow-ups', href: '/followups', icon: CalendarCheck, badge: kpis.todays_followups > 0 ? `${kpis.todays_followups}` : undefined },
    { name: 'Not Reachable', href: '/leads?status=NOT_REACHABLE', icon: Phone, badge: kpis.not_reachable_count > 0 ? `${kpis.not_reachable_count}` : undefined, badgeColor: 'bg-amber-500 text-white' },
    { name: 'Leads Master', href: '/leads', icon: Users },
    { name: 'My Assigned Leads', href: '/my-leads', icon: UserCheck },
    { name: 'Call History Logs', href: '/calls', icon: Layers },
    { name: 'Converted Deals', href: '/converted', icon: CheckCircle2 },
    { name: 'Analytics & Reports', href: '/reports', icon: BarChart3, adminOnly: true },
    { name: 'User Management', href: '/users', icon: UserCheck, adminOnly: true },
    { name: 'Integrations', href: '/integrations', icon: FileSpreadsheet, adminOnly: true },
    { name: 'Call Engine Settings', href: '/settings', icon: Settings, adminOnly: true },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen sticky top-0 z-40 select-none border-r border-slate-800">
      {/* Brand Logo Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
        <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white font-black text-lg mr-3 shadow-md">
          F
        </div>
        <div>
          <h1 className="font-bold text-white tracking-wide text-base leading-tight">FabricTraders</h1>
          <p className="text-[10px] text-sky-400 font-semibold tracking-wider uppercase">Sales & Calling CRM</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuItems.map(item => {
          if (item.adminOnly && isExecutive) return null;

          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                isActive
                  ? 'bg-sky-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </div>

              {item.badge && (
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${item.badgeColor || 'bg-slate-700 text-slate-200'}`}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Profile & Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-950">
        <div className="flex items-center justify-between">
          <div className="truncate pr-2">
            <p className="text-xs font-semibold text-white truncate">{currentUser?.full_name}</p>
            <p className="text-[10px] text-slate-400 truncate">{currentUser?.email}</p>
          </div>
          <button
            onClick={logout}
            title="Logout"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
