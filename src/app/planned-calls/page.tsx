'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import CallDrawer from '@/components/crm/CallDrawer';
import { Lead, LeadFilterState, LeadStatus, LeadSource } from '@/types/crm';
import { crmStore } from '@/lib/crm-store';
import { formatIST, calculateTimeDelay } from '@/lib/timezone';
import { useAuth } from '@/context/AuthContext';
import {
  PhoneCall,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  User,
  Building,
  MapPin,
  MessageSquare,
  FileSpreadsheet,
  Plus,
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

  const kpis = crmStore.getDashboardKPIs();
  const users = crmStore.getUsers();

  const loadLeads = async () => {
    // If Sales Executive, show assigned planned calls queue by default
    const assignedId = currentUser?.role === 'SALES_EXECUTIVE' ? currentUser.id : filters.assigned_user_id;
    let queue = crmStore.getPlannedCallsQueue(assignedId);

    try {
      const res = await fetch('/api/v1/leads');
      const data = await res.json();
      if (data.success && data.leads && data.leads.length > 0) {
        // Merge server synced leads into store
        data.leads.forEach((serverLead: Lead) => {
          if (!crmStore.getLeadById(serverLead.id)) {
            crmStore.createLead(serverLead);
          }
        });
        queue = crmStore.getPlannedCallsQueue(assignedId);
      }
    } catch (err) {
      // Fallback to local store queue
    }

    // Apply secondary filters
    let filtered = queue;

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      filtered = filtered.filter(
        l =>
          l.unique_lead_id.toLowerCase().includes(q) ||
          l.customer_name.toLowerCase().includes(q) ||
          l.mobile_number.includes(q) ||
          (l.company_name && l.company_name.toLowerCase().includes(q))
      );
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(l => l.current_status === filters.status);
    }

    if (filters.source !== 'all') {
      filtered = filtered.filter(l => l.source === filters.source);
    }

    if (filters.planned_filter === 'overdue') {
      const now = new Date();
      filtered = filtered.filter(l => l.current_planned_call_at && new Date(l.current_planned_call_at) < now);
    }

    setLeads(filtered);
  };

  useEffect(() => {
    loadLeads();

    // Auto refresh time delay calculation every 30 seconds
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 30000);

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
                PLANNED CALLS PRIORITY QUEUE
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Automatically prioritized by planned call time & delay. Most urgent overdue calls are at top.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setRefreshKey(prev => prev + 1)}
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
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Planned Today</p>
              <p className="text-xl font-black text-sky-600 mt-1">{kpis.calls_planned_today}</p>
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

          {/* SEARCH & STICKY MULTI-FILTER BAR */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              
              {/* Search input */}
              <div className="relative lg:col-span-2">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Unique ID, Client Name, Mobile..."
                  value={filters.search}
                  onChange={e => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
                />
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={filters.status}
                  onChange={e => setFilters({ ...filters, status: e.target.value })}
                  className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="NEW">NEW</option>
                  <option value="FOLLOW_UP">FOLLOW UP</option>
                  <option value="INTERESTED">INTERESTED</option>
                  <option value="NOT_REACHABLE">NOT REACHABLE</option>
                  <option value="BUSY">BUSY</option>
                </select>
              </div>

              {/* Source Filter */}
              <div>
                <select
                  value={filters.source}
                  onChange={e => setFilters({ ...filters, source: e.target.value })}
                  className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="all">All Lead Sources</option>
                  <option value="JUSTDIAL">JUSTDIAL</option>
                  <option value="INDIAMART">INDIAMART</option>
                  <option value="MANUAL">MANUAL</option>
                  <option value="IMPORT">IMPORT</option>
                </select>
              </div>

              {/* Assigned Executive Filter (Admins only) */}
              {currentUser?.role !== 'SALES_EXECUTIVE' && (
                <div>
                  <select
                    value={filters.assigned_user_id}
                    onChange={e => setFilters({ ...filters, assigned_user_id: e.target.value })}
                    className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="all">All Executives</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.full_name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* MAIN PLANNED CALLS TABLE (REQ 14, 60) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider border-b border-slate-800">
                    <th className="py-3.5 px-4">Unique ID</th>
                    <th className="py-3.5 px-4">Planned</th>
                    <th className="py-3.5 px-4">Time Delay</th>
                    <th className="py-3.5 px-4">Client Name</th>
                    <th className="py-3.5 px-4">Contact Number</th>
                    <th className="py-3.5 px-4 max-w-xs">Requirement</th>
                    <th className="py-3.5 px-4">Others</th>
                    <th className="py-3.5 px-4 max-w-xs">Remarks</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-center">Updates / Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {leads.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400 italic">
                        No planned calls match your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    leads.map(lead => {
                      const delay = calculateTimeDelay(lead.current_planned_call_at);
                      const lastCall = crmStore.getLastCallForLead(lead.id);

                      return (
                        <tr key={lead.id} className="hover:bg-slate-50 transition">
                          
                          {/* 1. Unique ID */}
                          <td className="py-3.5 px-4 font-mono font-bold text-sky-700 whitespace-nowrap">
                            {lead.unique_lead_id}
                          </td>

                          {/* 2. Planned Time */}
                          <td className="py-3.5 px-4 whitespace-nowrap font-medium">
                            {formatIST(lead.current_planned_call_at)}
                          </td>

                          {/* 3. Time Delay (Req 13) */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 rounded text-[10px] font-extrabold ${
                                delay.isOverdue
                                  ? 'bg-rose-100 text-rose-700 animate-pulse'
                                  : delay.isDueNow
                                  ? 'bg-amber-100 text-amber-800 font-bold'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {delay.text}
                            </span>
                          </td>

                          {/* 4. Client Name */}
                          <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                            {lead.customer_name}
                          </td>

                          {/* 5. Contact Number + CALL button */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-slate-800">{lead.mobile_number}</span>
                              <a
                                href={`tel:${lead.mobile_number}`}
                                title="Call Customer"
                                className="p-1 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition"
                              >
                                <PhoneCall className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </td>

                          {/* 6. Requirement */}
                          <td className="py-3.5 px-4 max-w-xs truncate text-slate-600" title={lead.client_requirement}>
                            {lead.client_requirement || lead.enquiry_message || 'N/A'}
                          </td>

                          {/* 7. Others (Source, City, Company) */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-[11px] text-slate-500">
                            <span className="font-semibold text-slate-700">{lead.source}</span>
                            {lead.city && <span> • {lead.city}</span>}
                          </td>

                          {/* 8. Remarks (Req 20: latest remark visible) */}
                          <td className="py-3.5 px-4 max-w-xs truncate text-slate-800 italic" title={lastCall?.remarks || 'No previous remarks'}>
                            {lastCall ? (
                              <span>"{lastCall.remarks}"</span>
                            ) : (
                              <span className="text-slate-400 font-normal">First Call — No previous remarks</span>
                            )}
                          </td>

                          {/* 9. Status Badge */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                lead.current_status === 'NEW'
                                  ? 'bg-sky-100 text-sky-800'
                                  : lead.current_status === 'FOLLOW_UP'
                                  ? 'bg-purple-100 text-purple-800'
                                  : lead.current_status === 'INTERESTED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : lead.current_status === 'NOT_REACHABLE'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {lead.current_status}
                            </span>
                          </td>

                          {/* 10. Updates / Action (Req 22) */}
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
