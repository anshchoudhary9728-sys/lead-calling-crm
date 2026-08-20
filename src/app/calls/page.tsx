'use client';

import React, { useState, useEffect } from 'react';
import { formatIST } from '@/lib/timezone';
import { Phone, RefreshCw } from 'lucide-react';
import { Lead } from '@/types/crm';

export default function CallsHistoryPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetch(`/api/v1/leads?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    })
      .then(r => r.json())
      .then(data => setLeads(data.leads || []))
      .catch(() => setLeads([]));
  }, [refreshKey]);

  // Show leads with recorded calls or non-NEW status
  const calledLeads = leads.filter(l => l.last_call_at || l.current_status !== 'NEW');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center">
            <Phone className="w-6 h-6 mr-2 text-sky-600" /> CALL HISTORY LOGS
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete historical register of every phone attempt, outcome, and customer status.
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
                <th className="py-3.5 px-4">Last Call Date</th>
                <th className="py-3.5 px-4">Unique Lead ID</th>
                <th className="py-3.5 px-4">Client Name</th>
                <th className="py-3.5 px-4">Mobile</th>
                <th className="py-3.5 px-4">Outcome Status</th>
                <th className="py-3.5 px-4">Channel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {calledLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 italic">
                    No calls recorded yet. Click "CALL / LOG" on any inquiry to start logging calls.
                  </td>
                </tr>
              ) : (
                calledLeads.map(lead => (
                  <tr key={lead.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-600">
                      {lead.last_call_at ? formatIST(lead.last_call_at) : lead.updated_at ? formatIST(lead.updated_at) : '—'}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-sky-700">{lead.unique_lead_id}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{lead.customer_name}</td>
                    <td className="py-3.5 px-4 font-mono">{lead.mobile_number}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        lead.current_status === 'FOLLOW_UP'
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
