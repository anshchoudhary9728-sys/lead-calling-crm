'use client';

import React, { useState } from 'react';
import { crmStore } from '@/lib/crm-store';
import { UserRole } from '@/types/crm';
import { Users, UserPlus, ShieldCheck, CheckCircle, XCircle, X } from 'lucide-react';

export default function UserManagementPage() {
  const [users, setUsers] = useState(crmStore.getUsers());
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    username: '',
    email: '',
    phone: '',
    role: 'SALES_EXECUTIVE' as UserRole,
  });

  const handleToggle = (id: string) => {
    crmStore.toggleUserStatus(id);
    setUsers([...crmStore.getUsers()]);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.email) {
      alert('Full Name and Email are mandatory.');
      return;
    }
    crmStore.createUser(form);
    setUsers([...crmStore.getUsers()]);
    setShowAddModal(false);
    setForm({ full_name: '', username: '', email: '', phone: '', role: 'SALES_EXECUTIVE' });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center">
            <Users className="w-6 h-6 mr-2 text-sky-600" /> USER MANAGEMENT & RBAC
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage CRM sales executives, admins, roles, and access credentials.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center shadow-sm"
        >
          <UserPlus className="w-4 h-4 mr-1.5" /> CREATE NEW USER
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Employee Code</th>
                <th className="py-3.5 px-4">Full Name</th>
                <th className="py-3.5 px-4">Username</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-600">{u.employee_code}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{u.full_name}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">{u.username}</td>
                  <td className="py-3.5 px-4">{u.email}</td>
                  <td className="py-3.5 px-4">{u.phone || 'N/A'}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-sky-100 text-sky-800">
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
                      onClick={() => handleToggle(u.id)}
                      className={`px-3 py-1 text-[11px] font-bold rounded-lg ${
                        u.status === 'ACTIVE'
                          ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                          : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      }`}
                    >
                      {u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">CREATE NEW CRM USER</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Suresh Kumar"
                  value={form.full_name}
                  onChange={e => setForm({ ...form, full_name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
                />
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
                <label className="block font-bold text-slate-700 mb-1">Role *</label>
                <select
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value as UserRole })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500 font-semibold"
                >
                  <option value="SALES_EXECUTIVE">Sales Executive (Caller)</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button type="submit" className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-5 py-2 rounded-lg shadow-md">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
