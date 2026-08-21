'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Lock, User, ArrowRight, ShieldCheck, Loader2, Sparkles, Key } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { setCurrentUser } = useAuth();
  const [username, setUsername] = useState('rajesh.admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e?: React.FormEvent, customUser?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setError('');

    const targetUser = customUser || username;
    const targetPass = customPass || password;

    if (!targetUser.trim()) {
      setError('Please enter username/email.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: targetUser.trim(),
          password: targetPass.trim() || 'admin123',
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Invalid credentials. Please check username and password.');
        return;
      }

      setCurrentUser(data.user);
      router.push('/planned-calls');
    } catch (err: any) {
      setError('Login failed: ' + (err.message || 'Server error'));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (uname: string, pwd = 'admin123') => {
    setUsername(uname);
    setPassword(pwd);
    handleLogin(undefined, uname, pwd);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#120324] via-[#1e0a38] to-[#0d021a] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 space-y-6 border border-purple-900/30">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-800 via-indigo-700 to-pink-600 text-white font-black text-2xl flex items-center justify-center mx-auto shadow-lg shadow-purple-900/50">
            F
          </div>
          <div className="flex items-center justify-center space-x-1.5 pt-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">FabricTraders CRM</h1>
            <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <p className="text-xs text-slate-500">Lead Calling, Quotations &amp; WhatsApp CRM</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl text-center">
            {error}
          </div>
        )}

        {/* Quick Demo Login Badges */}
        <div className="bg-purple-50/70 p-3.5 rounded-2xl border border-purple-200/80 space-y-2">
          <p className="text-[10px] font-black uppercase tracking-wider text-purple-950 flex items-center">
            <Key className="w-3 h-3 mr-1 text-purple-700" /> 1-Click Quick Login Accounts:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('rajesh.admin')}
              className="p-2 rounded-xl bg-purple-900 hover:bg-purple-950 text-white text-[11px] font-bold shadow-sm transition text-left"
            >
              <div className="font-extrabold flex items-center">
                👑 Super Admin
              </div>
              <div className="text-[9.5px] text-purple-200">rajesh.admin</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('rahul.verma')}
              className="p-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-[11px] font-bold shadow-sm transition text-left"
            >
              <div className="font-extrabold">
                📞 Sales Executive
              </div>
              <div className="text-[9.5px] text-indigo-200">rahul.verma</div>
            </button>
          </div>
        </div>

        {/* Standard Login Form */}
        <form onSubmit={e => handleLogin(e)} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Username / Email</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                placeholder="rajesh.admin or rahul.verma"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 font-semibold text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                placeholder="Enter password (default: admin123)"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 font-semibold text-slate-900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold py-3 rounded-xl shadow-lg transition flex items-center justify-center space-x-2 text-xs uppercase tracking-wider disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                <span>AUTHENTICATING...</span>
              </>
            ) : (
              <>
                <span>SIGN IN TO CRM</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 border-t border-slate-100 text-center text-[11px] text-slate-400">
          <p className="flex items-center justify-center">
            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            Protected by Supabase RBAC &amp; Session Auth
          </p>
        </div>
      </div>
    </div>
  );
}
