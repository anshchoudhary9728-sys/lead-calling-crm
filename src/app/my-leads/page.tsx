'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { formatIST } from '@/lib/timezone';
import { UserCheck, PhoneCall, RefreshCw } from 'lucide-react';
import CallDrawer from '@/components/crm/CallDrawer';
import { Lead } from '@/types/crm';

export default function MyAssignedLeadsPage() {
  const { currentUser } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadForCall, setSelectedLeadForCall] = useState<Lead | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadMyLeads = () => {
    fetch(`/api/v1/leads?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    })
      .then(r => r.json())
      .then(data => {
        let all: Lead[] = data.leads || [];
        if (currentUser?.role === 'SALES_EXECUTIVE') {
          all = all.filter(l => l.assigned_user_id === currentUser.id);
        }
        setLeads(all);
      })
      .catch(() => setLeads([]));
  };

  useEffect(() => {
    loadMyLeads();
  }, [refreshKey, currentUser]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center">
            <UserCheck className="w-6 h-6 mr-2 text-sky-600" /> MY ASSIGNED LEADS
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Active leads and calling tasks allocated to your account.
          </p>
        </div>
        <button
          onClick={() => setRefreshKey(k => k + 1)}
          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg flex items-center shadow-sm transition"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-slate-500" /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Unique ID</th>
                <th className="py-3.5 px-4">Client Name</th>
                <th className="py-3.5 px-4">Mobile</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Source</th>
                <th className="py-3.5 px-4">Requirement</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 italic">No assigned leads found.</td>
                </tr>
              ) : (
                leads.map(lead => (
                  <tr key={lead.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-mono font-bold text-sky-700">{lead.unique_lead_id}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{lead.customer_name}</td>
                    <td className="py-3.5 px-4 font-mono">{lead.mobile_number}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        lead.current_status === 'NEW'
                          ? 'bg-blue-100 text-blue-800'
                          : lead.current_status === 'FOLLOW_UP'
                          ? 'bg-purple-100 text-purple-800'
                          : lead.current_status === 'NOT_REACHABLE'
                          ? 'bg-amber-100 text-amber-800'
                          : lead.current_status === 'CONVERTED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}>
                        {lead.current_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800">
                        {lead.source}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-[200px] truncate text-slate-600">{lead.client_requirement || lead.enquiry_message || '—'}</td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setSelectedLeadForCall(lead)}
                        className="bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center mx-auto shadow-sm"
                      >
                        <PhoneCall className="w-3.5 h-3.5 mr-1.5" /> Call / Update
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedLeadForCall && (
        <CallDrawer
          lead={selectedLeadForCall}
          onClose={() => setSelectedLeadForCall(null)}
          onSuccess={() => {
            setSelectedLeadForCall(null);
            loadMyLeads();
          }}
        />
      )}
    </div>
  );
}
