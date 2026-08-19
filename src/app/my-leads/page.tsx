'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import CallDrawer from '@/components/crm/CallDrawer';
import { Lead } from '@/types/crm';
import { crmStore } from '@/lib/crm-store';
import { formatIST } from '@/lib/timezone';
import { useAuth } from '@/context/AuthContext';
import { UserCheck, PhoneCall, Eye, Search } from 'lucide-react';

export default function MyAssignedLeadsPage() {
  const { currentUser } = useAuth();
  const [selectedLeadForCall, setSelectedLeadForCall] = useState<Lead | null>(null);
  const [search, setSearch] = useState('');

  const myLeads = crmStore.getLeads({
    search,
    assigned_user_id: currentUser?.id || 'user-exec-1',
    status: 'all',
    source: 'all',
    date_range: 'all',
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center">
            <UserCheck className="w-6 h-6 mr-2 text-sky-600" /> MY ASSIGNED LEADS
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Leads assigned specifically to you ({currentUser?.full_name})
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search my leads..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Unique ID</th>
                <th className="py-3.5 px-4">Client Name</th>
                <th className="py-3.5 px-4">Mobile</th>
                <th className="py-3.5 px-4">Requirement</th>
                <th className="py-3.5 px-4">Planned Call</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {myLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 italic">No assigned leads found.</td>
                </tr>
              ) : (
                myLeads.map(lead => (
                  <tr key={lead.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-mono font-bold text-sky-700">{lead.unique_lead_id}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{lead.customer_name}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{lead.mobile_number}</td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-600">{lead.client_requirement || 'N/A'}</td>
                    <td className="py-3.5 px-4 whitespace-nowrap">{formatIST(lead.current_planned_call_at)}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                        {lead.current_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setSelectedLeadForCall(lead)}
                        className="bg-sky-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm"
                      >
                        CALL NOW
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
          onSuccess={() => setSelectedLeadForCall(null)}
        />
      )}
    </div>
  );
}
