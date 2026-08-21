'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Clock, ShieldCheck, LogOut, Bell, Search, UserCheck } from 'lucide-react';

export default function Header() {
  const { currentUser, logout } = useAuth();

  return (
    <header className="h-16 bg-[#250a42] text-white border-b border-purple-900/50 px-6 flex items-center justify-between sticky top-0 z-30 shadow-md">
      {/* Search Input & Timezone Badge */}
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-purple-300" />
          <input
            type="text"
            placeholder="Search leads, clients, mobile..."
            className="pl-9 pr-4 py-1.5 text-xs bg-purple-950/70 border border-purple-800/60 rounded-xl text-white placeholder-purple-300/60 w-64 md:w-80 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-purple-900 transition"
          />
        </div>

        <div className="hidden md:flex items-center text-xs text-purple-200 bg-purple-950/80 px-3 py-1.5 rounded-xl border border-purple-800/50 font-medium">
          <Clock className="w-3.5 h-3.5 text-sky-400 mr-1.5" />
          <span>TZ: <strong className="text-white">Asia/Kolkata (IST)</strong></span>
        </div>

        <div className="hidden lg:flex items-center text-xs text-emerald-300 bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-700/50 font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
          <span>Quotation &amp; WhatsApp Live</span>
        </div>
      </div>

      {/* Right Controls: User Profile & Actions */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3 bg-purple-950/80 px-3 py-1.5 rounded-2xl border border-purple-800/60 shadow-sm">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white font-black text-sm shadow-md">
            {currentUser?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-white leading-tight">
              {currentUser?.full_name || 'Rajesh Sharma'}
            </p>
            <p className="text-[10px] text-purple-300 font-bold flex items-center mt-0.5">
              <ShieldCheck className="w-3 h-3 text-emerald-400 mr-1 inline" />
              <span className="text-purple-200">
                {currentUser?.role || 'SUPER_ADMIN'}
              </span>
            </p>
          </div>
          <button
            onClick={logout}
            title="Logout"
            className="ml-2 p-1.5 rounded-lg text-purple-300 hover:text-rose-300 hover:bg-white/10 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
