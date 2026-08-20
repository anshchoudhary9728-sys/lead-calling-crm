'use client';

import React, { useState, useEffect } from 'react';
import { User, UserRole } from '@/types/crm';
import { Users, UserPlus, ShieldCheck, RefreshCw, X, Loader2, Key } from 'lucide-react';

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [form, setForm] = useState({
    full_name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    role: 'SALES_EXECUTIVE' as UserRole,
  });

  const loadUsers = () => {
    setLoading(true);
    fetch(`/api/v1/users?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    })
      .then(r => r.json())
      .then(data => setUsers(data.users || []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggle = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetch(`/api/v1/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        loadUsers();
      }
    } catch (e) {
      alert('Failed to update user status');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!form.full_name.trim() || !form.email.trim() || !form.username.trim() || !form.password.trim()) {
      setErrorMsg('Full Name, Username, Email, and Password are all required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/v1/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create user');
      }

      setShowAddModal(false);
      setForm({
        full_name: '',
        username: '',
        email: '',
        phone: '',
        password: '',
        role: 'SALES_EXECUTIVE',
      });
      loadUsers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating user');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center">
            <Users className="w-6 h-6 mr-2 text-sky-600" /> USER MANAGEMENT &amp; RBAC
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create and manage sales callers, admins, login credentials, and permission roles.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadUsers}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg flex items-center shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-slate-500" /> Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center shadow-sm"
          >
            <UserPlus className="w-4 h-4 mr-1.5" /> CREATE NEW USER
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Employee Code</th>
                <th className="py-3.5 px-4">Full Name</th>
                <th className="py-3.5 px-4">Login Username</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4">Assigned Role</th>
                <th className="py-3.5 px-4">Account Status</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400 italic">
                    {loading ? 'Loading users from database...' : 'No users found.'}
                  </td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-600">{u.employee_code || 'EMP-101'}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{u.full_name}</td>
                    <td className="py-3.5 px-4 font-mono text-sky-700 font-semibold">{u.username}</td>
                    <td className="py-3.5 px-4">{u.email}</td>
                    <td className="py-3.5 px-4">{u.phone || 'N/A'}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        u.role === 'SUPER_ADMIN' || u.role === 'ADMIN'
                          ? 'bg-rose-100 text-rose-800'
                          : u.role === 'MANAGER'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-sky-100 text-sky-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          u.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggle(u.id, u.status)}
                        className={`px-3 py-1 text-[11px] font-bold rounded-lg transition ${
                          u.status === 'ACTIVE'
                            ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                            : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        }`}
                      >
                        {u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center">
                <UserPlus className="w-4 h-4 mr-2 text-sky-600" />
                CREATE NEW CRM USER
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Suresh Kumar"
                  value={form.full_name}
                  onChange={e => setForm({ ...form, full_name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Username (Login ID) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. suresh.caller"
                    value={form.username}
                    onChange={e => setForm({ ...form, username: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Login Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="e.g. caller123"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="suresh@fabrictraders.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mobile Phone (Optional)</label>
                <input
                  type="text"
                  placeholder="+91 9876543210"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Role &amp; Permissions *</label>
                <select
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value as UserRole })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500 font-bold text-sky-800"
                >
                  <option value="SALES_EXECUTIVE">Sales Executive (Calls &amp; Assigned Leads Only)</option>
                  <option value="MANAGER">Manager (Team Queue &amp; Reports)</option>
                  <option value="ADMIN">Admin (Full Control + User Management)</option>
                  <option value="SUPER_ADMIN">Super Admin (All Permissions)</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-5 py-2 rounded-lg shadow-md flex items-center disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Save & Create User'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
