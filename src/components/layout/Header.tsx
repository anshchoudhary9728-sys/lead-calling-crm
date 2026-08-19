'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Bell, Search, Clock, ShieldCheck, UserCheck } from 'lucide-react';
import { crmStore } from '@/lib/crm-store';
import { UserRole } from '@/types/crm';

export default function Header() {
  const { currentUser, switchRole } = useAuth();
  const kpis = crmStore.getDashboardKPIs();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Search Input & Timezone Badge */}
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search Unique ID (LD-...), Client, Mobile..."
            className="pl-9 pr-4 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg w-72 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
          />
        </div>

        <div className="hidden md:flex items-center text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
          <Clock className="w-3.5 h-3.5 text-sky-600 mr-1.5" />
          <span>TZ: <strong>Asia/Kolkata (IST)</strong></span>
        </div>
      </div>

      {/* Right Controls: Overdue notifications & User Profile */}
      <div className="flex items-center space-x-4">
        {/* Overdue Alert Badge */}
        {kpis.overdue_calls > 0 && (
          <div className="flex items-center bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold px-2.5 py-1 rounded-full animate-pulse">
            <Bell className="w-3.5 h-3.5 mr-1 text-rose-600" />
            <span>{kpis.overdue_calls} Overdue Calls</span>
          </div>
        )}

        {/* Role Switcher for Demo Testing */}
        <div className="hidden lg:flex items-center text-xs space-x-1 bg-slate-50 p-1 border border-slate-200 rounded-lg">
          <span className="text-slate-400 px-1 font-medium">Switch Role:</span>
          {(['SUPER_ADMIN', 'SALES_EXECUTIVE'] as UserRole[]).map(role => (
            <button
              key={role}
              onClick={() => switchRole(role)}
              className={`px-2 py-0.5 rounded font-medium transition ${
                currentUser?.role === role ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              {role === 'SUPER_ADMIN' ? 'Admin' : 'Caller'}
            </button>
          ))}
        </div>

        {/* Current User Profile Pill */}
        <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-sky-100 border border-sky-300 flex items-center justify-center text-sky-800 font-bold text-sm">
            {currentUser?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-slate-800 leading-tight">{currentUser?.full_name}</p>
            <p className="text-[10px] text-slate-500 font-medium flex items-center">
              <ShieldCheck className="w-3 h-3 text-emerald-600 mr-0.5 inline" />
              {currentUser?.role}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
