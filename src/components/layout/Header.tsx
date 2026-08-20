'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Clock, ShieldCheck, LogOut } from 'lucide-react';

export default function Header() {
  const { currentUser, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Timezone Badge & CRM status */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 font-medium">
          <Clock className="w-3.5 h-3.5 text-sky-600 mr-1.5" />
          <span>TZ: <strong>Asia/Kolkata (IST)</strong></span>
        </div>
      </div>

      {/* Right Controls: User Profile & Logout */}
      <div className="flex items-center space-x-4">
        {/* Current User Profile Pill */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-sky-100 border border-sky-300 flex items-center justify-center text-sky-800 font-black text-sm shadow-sm">
            {currentUser?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-slate-800 leading-tight">
              {currentUser?.full_name || 'Guest User'}
            </p>
            <p className="text-[10px] text-slate-500 font-bold flex items-center mt-0.5">
              <ShieldCheck className="w-3 h-3 text-emerald-600 mr-1 inline" />
              <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold ${
                currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN'
                  ? 'bg-rose-100 text-rose-800'
                  : currentUser?.role === 'MANAGER'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-sky-100 text-sky-800'
              }`}>
                {currentUser?.role || 'SALES_EXECUTIVE'}
              </span>
            </p>
          </div>
          <button
            onClick={logout}
            title="Logout"
            className="ml-2 p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
