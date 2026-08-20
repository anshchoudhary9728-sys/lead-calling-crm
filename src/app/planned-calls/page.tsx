'use client';

import React, { useState, useEffect } from 'react';
import CallDrawer from '@/components/crm/CallDrawer';
import { Lead, LeadFilterState } from '@/types/crm';
import { crmStore } from '@/lib/crm-store';
import { formatIST, calculateTimeDelay } from '@/lib/timezone';
import { useAuth } from '@/context/AuthContext';
import {
  PhoneCall,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

export default function PlannedCallsDashboard() {
  const { currentUser } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadForCall, setSelectedLeadForCall] = useState<Lead | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filters State
  const [filters, setFilters] = useState<LeadFilterState>({
    search: '',
    status: 'all',
    source: 'all',
    assigned_user_id: currentUser?.role === 'SALES_EXECUTIVE' ? currentUser.id : 'all',
    date_range: 'all',
    planned_filter: 'all',
  });

  const [kpis, setKpis] = useState({
    todays_new_leads: 0,
    calls_planned_today: 0,
    calls_completed_today: 0,
    overdue_calls: 0,
    not_reachable_count: 0,
    total_converted: 0,
  });
  const users = crmStore.getUsers();

  const loadLeads = async () => {
    try {
      const res = await fetch(`/api/v1/leads?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      const data = await res.json();
      const allLeads: Lead[] = (data.leads || []) as Lead[];
      const now = new Date();

      // NEW INQUIRY = Show ONLY NEW status leads
      let queue: Lead[] = allLeads
        .filter(l => l.current_status === 'NEW')
        .filter(l => {
          if (currentUser?.role === 'SALES_EXECUTIVE') {
            return !l.assigned_user_id || l.assigned_user_id === currentUser.id;
          }
          return true;
        })
        .sort((a, b) => {
          const aTime = a.current_planned_call_at ? new Date(a.current_planned_call_at).getTime() : Infinity;
          const bTime = b.current_planned_call_at ? new Date(b.current_planned_call_at).getTime() : Infinity;
          return aTime - bTime;
        });

      // Compute KPIs accurately
      const todayStr = now.toISOString().substring(0, 10);
      const newLeads = allLeads.filter(l => l.current_status === 'NEW');
      const overdueNewLeads = newLeads.filter(
        l => l.current_planned_call_at && new Date(l.current_planned_call_at) < now
      );

      setKpis({
        todays_new_leads: allLeads.filter(l => l.lead_received_at && l.lead_received_at.substring(0, 10) === todayStr).length,
        calls_planned_today: newLeads.length,
        calls_completed_today: allLeads.filter(l => l.current_status !== 'NEW').length,
        overdue_calls: overdueNewLeads.length,
        not_reachable_count: allLeads.filter(l => l.current_status === 'NOT_REACHABLE').length,
        total_converted: allLeads.filter(l => l.current_status === 'CONVERTED').length,
      });

      // Apply search/source filters
      let filtered = queue;
      if (filters.search) {
        const q = filters.search.toLowerCase().trim();
        filtered = filtered.filter(
          l =>
            l.unique_lead_id?.toLowerCase().includes(q) ||
            l.customer_name?.toLowerCase().includes(q) ||
            l.mobile_number?.includes(q) ||
            (l.company_name && l.company_name.toLowerCase().includes(q))
        );
      }
      if (filters.source !== 'all') {
        filtered = filtered.filter(l => l.source === filters.source);
      }
      if (filters.planned_filter === 'overdue') {
        filtered = filtered.filter(l => l.current_planned_call_at && new Date(l.current_planned_call_at) < now);
      }

      setLeads(filtered);
    } catch (err) {
      setLeads([]);
    }
  };

  useEffect(() => {
    loadLeads();

    // Auto refresh every 20 seconds
    const interval = setInterval(() => {
      loadLeads();
    }, 20000);

    return () => clearInterval(interval);
  }, [filters, currentUser, refreshKey]);

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Page Content */}
        <main className="p-6 space-y-6">
          
          {/* Header Title & Quick Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 flex items-center">
                <PhoneCall className="w-6 h-6 mr-2.5 text-sky-600" />
                NEW INQUIRY CALL QUEUE
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Fresh incoming leads awaiting first call. Automatically prioritized by time received.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setRefreshKey(prev => prev + 1);
                  loadLeads();
                }}
                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg flex items-center shadow-sm transition"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-slate-500" /> Refresh Queue
              </button>
            </div>
          </div>

          {/* SUMMARY KPI CARDS GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">New Leads Today</p>
              <p className="text-xl font-black text-slate-900 mt-1">{kpis.todays_new_leads}</p>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Inquiry</p>
              <p className="text-xl font-black text-sky-600 mt-1">{leads.length}</p>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Calls Completed</p>
              <p className="text-xl font-black text-emerald-600 mt-1">{kpis.calls_completed_today}</p>
            </div>

            <div className="bg-rose-50 p-3.5 rounded-xl border border-rose-200 shadow-sm">
              <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider flex items-center">
                <AlertTriangle className="w-3 h-3 mr-1 text-rose-600" /> Overdue Calls
              </p>
              <p className="text-xl font-black text-rose-700 mt-1">{kpis.overdue_calls}</p>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Not Reachable</p>
              <p className="text-xl font-black text-amber-600 mt-1">{kpis.not_reachable_count}</p>
            </div>

            <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200 shadow-sm">
              <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Converted Deals</p>
              <p className="text-xl font-black text-emerald-700 mt-1">{kpis.total_converted}</p>
            </div>
          </div>

          {/* FILTERS TOOLBAR */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <input
                  type="text"
                  placeholder="Search Unique ID, Client Name, Mobile..."
                  value={filters.search}
                  onChange={e => setFilters({ ...filters, search: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <select
                  value={filters.source}
                  onChange={e => setFilters({ ...filters, source: e.target.value })}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  <option value="all">All Lead Sources</option>
                  <option value="JUSTDIAL">JUSTDIAL</option>
                  <option value="INDIAMART">INDIAMART</option>
                  <option value="MANUAL">MANUAL ENTRY</option>
                  <option value="IMPORT">CSV IMPORT</option>
                </select>
              </div>

              <div>
                <select
                  value={filters.planned_filter}
                  onChange={e => setFilters({ ...filters, planned_filter: e.target.value as any })}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  <option value="all">All Inquiries</option>
                  <option value="overdue">Overdue Only (&gt;10 min late)</option>
                </select>
              </div>
            </div>
          </div>

          {/* PLANNED CALLS PRIORITY TABLE */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4 whitespace-nowrap">Unique ID</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Planned Time</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Time Delay</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Client Name</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Contact Number</th>
                    <th className="py-3.5 px-4">Requirement</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Source</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Status</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {leads.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400 italic">
                        No pending new inquiries! All calls have been handled and transferred to Follow-up / Not Reachable / Converted. 🎉
                      </td>
                    </tr>
                  ) : (
                    leads.map(lead => {
                      const delay = calculateTimeDelay(lead.current_planned_call_at);
                      return (
                        <tr key={lead.id} className="hover:bg-slate-50 transition">
                          <td className="py-3.5 px-4 font-mono font-bold text-sky-700 whitespace-nowrap">
                            {lead.unique_lead_id}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="font-semibold text-slate-800">
                              {lead.current_planned_call_at ? formatIST(lead.current_planned_call_at) : 'Immediate'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {delay.isOverdue ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                                {delay.text}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
                                {delay.text}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                            {lead.customer_name}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-800 whitespace-nowrap">
                            <a href={`tel:${lead.mobile_number}`} className="text-sky-600 hover:underline">
                              {lead.mobile_number}
                            </a>
                          </td>
                          <td className="py-3.5 px-4 max-w-[200px] truncate text-slate-600">
                            {lead.client_requirement || lead.enquiry_message || '—'}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800">
                              {lead.source}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                              {lead.current_status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <button
                              onClick={() => setSelectedLeadForCall(lead)}
                              className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center justify-center shadow-sm transition mx-auto"
                            >
                              <PhoneCall className="w-3.5 h-3.5 mr-1.5" />
                              CALL / LOG
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
        </main>
      </div>

      {/* Slide-out Call Drawer Modal */}
      {selectedLeadForCall && (
        <CallDrawer
          lead={selectedLeadForCall}
          onClose={() => setSelectedLeadForCall(null)}
          onSuccess={() => {
            loadLeads();
            setSelectedLeadForCall(null);
          }}
        />
      )}
    </div>
  );
}
