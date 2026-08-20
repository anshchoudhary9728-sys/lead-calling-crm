'use client';

import React, { useState, useEffect } from 'react';
import { formatIST } from '@/lib/timezone';
import { CalendarCheck, PhoneCall } from 'lucide-react';
import CallDrawer from '@/components/crm/CallDrawer';
import { Lead } from '@/types/crm';

export default function FollowupsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadForCall, setSelectedLeadForCall] = useState<Lead | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetch('/api/v1/leads')
      .then(r => r.json())
      .then(data => {
        const all: Lead[] = data.leads || [];
        // Show only FOLLOW_UP status leads sorted by planned call time
        const followups = all
          .filter(l => l.current_status === 'FOLLOW_UP')
          .sort((a, b) => {
            const aTime = a.current_planned_call_at ? new Date(a.current_planned_call_at).getTime() : Infinity;
            const bTime = b.current_planned_call_at ? new Date(b.current_planned_call_at).getTime() : Infinity;
            return aTime - bTime;
          });
        setLeads(followups);
      })
      .catch(() => setLeads([]));
  }, [refreshKey]);

  const now = new Date();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-black text-slate-900 flex items-center">
          <CalendarCheck className="w-6 h-6 mr-2 text-sky-600" /> FOLLOW-UPS TRACKER
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Leads where follow-up call is scheduled. Overdue follow-ups are highlighted in red.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Planned Call Time</th>
                <th className="py-3.5 px-4">Unique ID</th>
                <th className="py-3.5 px-4">Customer Name</th>
                <th className="py-3.5 px-4">Mobile</th>
                <th className="py-3.5 px-4">Source</th>
                <th className="py-3.5 px-4">Requirement</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 italic">
                    No follow-up leads found. Follow-ups appear here after marking a lead as "Follow-up" during a call.
                  </td>
                </tr>
              ) : (
                leads.map(lead => {
                  const isOverdue = lead.current_planned_call_at && new Date(lead.current_planned_call_at) < now;
                  return (
                    <tr key={lead.id} className={`hover:bg-slate-50 ${isOverdue ? 'bg-rose-50' : ''}`}>
                      <td className="py-3 px-4">
                        <span className={`font-bold ${isOverdue ? 'text-rose-600' : 'text-sky-600'}`}>
                          {lead.current_planned_call_at ? formatIST(lead.current_planned_call_at) : '—'}
                        </span>
                        {isOverdue && <span className="ml-1 text-[10px] text-rose-500 font-bold">OVERDUE</span>}
                      </td>
                      <td className="py-3 px-4 font-mono text-sky-700 font-bold">{lead.unique_lead_id}</td>
                      <td className="py-3 px-4 font-semibold">{lead.customer_name}</td>
                      <td className="py-3 px-4 font-mono">{lead.mobile_number}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800">
                          {lead.source}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-[200px] truncate text-slate-600">{lead.client_requirement || '—'}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setSelectedLeadForCall(lead)}
                          className="bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center mx-auto"
                        >
                          <PhoneCall className="w-3.5 h-3.5 mr-1.5" /> Call Now
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedLeadForCall && (
        <CallDrawer
          lead={selectedLeadForCall}
          onClose={() => setSelectedLeadForCall(null)}
          onSuccess={() => { setSelectedLeadForCall(null); setRefreshKey(k => k + 1); }}
        />
      )}
    </div>
  );
}
