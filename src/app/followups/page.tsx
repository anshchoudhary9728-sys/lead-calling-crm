'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { formatIST } from '@/lib/timezone';
import { CalendarCheck, PhoneCall, RefreshCw, FileText } from 'lucide-react';
import CallDrawer from '@/components/crm/CallDrawer';
import QuotationModal from '@/components/crm/QuotationModal';
import CrmQueueFilterBar, { FilterValues } from '@/components/crm/CrmQueueFilterBar';
import { Lead } from '@/types/crm';

export default function FollowupsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadForCall, setSelectedLeadForCall] = useState<Lead | null>(null);
  const [selectedLeadForQuote, setSelectedLeadForQuote] = useState<Lead | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [filters, setFilters] = useState<FilterValues>({
    search: '',
    date: '',
    datePreset: 'ALL',
    source: 'ALL',
  });

  const loadFollowups = () => {
    fetch(`/api/v1/leads?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    })
      .then(r => r.json())
      .then(data => {
        const all: Lead[] = data.leads || [];
        const followups = all
          .filter(l => l.current_status === 'FOLLOW_UP')
          .sort((a, b) => {
            const aTime = a.next_followup_at || a.current_planned_call_at;
            const bTime = b.next_followup_at || b.current_planned_call_at;
            const aNum = aTime ? new Date(aTime).getTime() : Infinity;
            const bNum = bTime ? new Date(bTime).getTime() : Infinity;
            return aNum - bNum;
          });
        setLeads(followups);
      })
      .catch(() => setLeads([]));
  };

  useEffect(() => {
    loadFollowups();
  }, [refreshKey]);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // 1. Search filter (Name, Mobile, Unique ID, Requirement)
      if (filters.search) {
        const q = filters.search.toLowerCase().trim();
        const match =
          lead.unique_lead_id?.toLowerCase().includes(q) ||
          lead.customer_name?.toLowerCase().includes(q) ||
          lead.mobile_number?.includes(q) ||
          (lead.city && lead.city.toLowerCase().includes(q)) ||
          (lead.client_requirement && lead.client_requirement.toLowerCase().includes(q)) ||
          (lead.enquiry_message && lead.enquiry_message.toLowerCase().includes(q));
        if (!match) return false;
      }

      // 2. Calendar Date filter
      if (filters.date) {
        const fTime = lead.next_followup_at || lead.current_planned_call_at || lead.updated_at || '';
        const fDate = fTime.substring(0, 10);
        if (fDate !== filters.date) return false;
      }

      // 3. Source filter
      if (filters.source && filters.source !== 'ALL') {
        if (lead.source !== filters.source) return false;
      }

      return true;
    });
  }, [leads, filters]);

  const now = new Date();

  return (
    <div className="p-6 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center">
            <CalendarCheck className="w-6 h-6 mr-2 text-purple-700" /> FOLLOW-UPS TRACKER
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Scheduled follow-up calls. When called, they will update status or reschedule.
          </p>
        </div>
        <button
          onClick={() => {
            setRefreshKey(k => k + 1);
            loadFollowups();
          }}
          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg flex items-center shadow-sm transition"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-slate-500" /> Refresh
        </button>
      </div>

      {/* FILTERS TOOLBAR */}
      <CrmQueueFilterBar
        filters={filters}
        onFilterChange={setFilters}
        totalCount={leads.length}
        filteredCount={filteredLeads.length}
        placeholder="Search Follow-ups by Name, Mobile, Unique ID, Fabric..."
        dateLabel="Filter by Scheduled Follow-up Date"
      />

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#250a42] text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Follow-up Date & Time</th>
                <th className="py-3.5 px-4">Unique ID</th>
                <th className="py-3.5 px-4">Customer Name</th>
                <th className="py-3.5 px-4">Mobile</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Source</th>
                <th className="py-3.5 px-4">Requirement</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 italic">
                    {leads.length === 0
                      ? 'No active follow-ups. Tag an inquiry as "Follow-up" during call to see it here.'
                      : 'No follow-up calls match the selected filters.'}
                  </td>
                </tr>
              ) : (
                filteredLeads.map(lead => {
                  const targetTime = lead.next_followup_at || lead.current_planned_call_at;
                  const isOverdue = targetTime && new Date(targetTime) < now;
                  return (
                    <tr key={lead.id} className={`hover:bg-slate-50 ${isOverdue ? 'bg-rose-50/50' : ''}`}>
                      <td className="py-3 px-4">
                        <span className={`font-bold ${isOverdue ? 'text-rose-600' : 'text-purple-700'}`}>
                          {targetTime ? formatIST(targetTime) : '—'}
                        </span>
                        {isOverdue && <span className="ml-1 text-[10px] text-rose-500 font-bold">OVERDUE</span>}
                      </td>
                      <td className="py-3 px-4 font-mono text-purple-700 font-bold">{lead.unique_lead_id}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{lead.customer_name}</td>
                      <td className="py-3 px-4 font-mono font-semibold">
                        <a href={`tel:${lead.mobile_number}`} className="text-purple-700 hover:underline">
                          {lead.mobile_number}
                        </a>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">{lead.city || 'Surat'}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                          {lead.source}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-[200px] truncate text-slate-600">{lead.client_requirement || lead.enquiry_message || '—'}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => setSelectedLeadForCall(lead)}
                            className="bg-purple-700 hover:bg-purple-800 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg flex items-center shadow-sm"
                          >
                            <PhoneCall className="w-3.5 h-3.5 mr-1" /> Call
                          </button>
                          <button
                            onClick={() => setSelectedLeadForQuote(lead)}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg flex items-center shadow-sm"
                          >
                            <FileText className="w-3.5 h-3.5 mr-1" /> Quote
                          </button>
                        </div>
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
          onSuccess={() => {
            setSelectedLeadForCall(null);
            loadFollowups();
          }}
        />
      )}

      {selectedLeadForQuote && (
        <QuotationModal
          lead={selectedLeadForQuote}
          onClose={() => setSelectedLeadForQuote(null)}
          onSuccess={() => {
            setSelectedLeadForQuote(null);
            loadFollowups();
          }}
        />
      )}
    </div>
  );
}
