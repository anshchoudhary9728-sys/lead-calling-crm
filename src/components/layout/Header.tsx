'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, LogOut, Search, Menu } from 'lucide-react';

interface HeaderProps {
  onToggleMobileMenu?: () => void;
}

export default function Header({ onToggleMobileMenu }: HeaderProps) {
  const { currentUser, logout } = useAuth();

  return (
    <header className="h-16 bg-[#250a42] text-white border-b border-purple-900/50 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-md">
      {/* Left: Mobile Menu Hamburger & Search */}
      <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 rounded-xl text-purple-200 hover:text-white bg-purple-950/80 border border-purple-800/60 transition"
          title="Open Menu"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search Input */}
        <div className="relative flex-1 max-w-[200px] sm:max-w-xs md:max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-purple-300 pointer-events-none" />
          <input
            type="text"
            placeholder="Search leads, clients..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-purple-950/70 border border-purple-800/60 rounded-xl text-white placeholder-purple-300/60 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-purple-900 transition"
          />
        </div>
      </div>

      {/* Right: User Profile Badge & Logout */}
      <div className="flex items-center space-x-2 sm:space-x-3 ml-2 flex-shrink-0">
        <div className="flex items-center space-x-2 sm:space-x-2.5 bg-purple-950/80 px-2.5 py-1.5 rounded-2xl border border-purple-800/60 shadow-sm">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white font-black text-xs sm:text-sm shadow-md flex-shrink-0">
            {currentUser?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-bold text-white leading-tight truncate max-w-[120px]">
              {currentUser?.full_name || 'Rajesh Sharma'}
            </p>
            <p className="text-[10px] text-purple-300 font-bold flex items-center mt-0.5">
              <ShieldCheck className="w-3 h-3 text-emerald-400 mr-1 inline flex-shrink-0" />
              <span className="text-purple-200">
                {currentUser?.role === 'SUPER_ADMIN' ? 'Admin' : 'Sales'}
              </span>
            </p>
          </div>
          <button
            onClick={logout}
            title="Logout"
            className="p-1 rounded-lg text-purple-300 hover:text-rose-300 hover:bg-white/10 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
