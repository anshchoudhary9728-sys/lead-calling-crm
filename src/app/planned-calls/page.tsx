'use client';

import React, { useState, useEffect } from 'react';
import CallDrawer from '@/components/crm/CallDrawer';
import QuotationModal from '@/components/crm/QuotationModal';
import { Lead, LeadFilterState, LeadSource, User } from '@/types/crm';
import { formatIST, calculateTimeDelay } from '@/lib/timezone';
import { useAuth } from '@/context/AuthContext';
import {
  PhoneCall,
  RefreshCw,
  AlertTriangle,
  Plus,
  UserPlus,
  X,
  Loader2,
  FileText,
  MapPin,
  Sparkles,
} from 'lucide-react';
import FabricRequirementInput from '@/components/crm/FabricRequirementInput';
import { INDIAN_CITIES_SUGGESTIONS } from '@/constants/cities';
import { useSources } from '@/lib/useSources';
import CrmQueueFilterBar, { FilterValues } from '@/components/crm/CrmQueueFilterBar';

export default function PlannedCallsDashboard() {
  const { currentUser } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedLeadForCall, setSelectedLeadForCall] = useState<Lead | null>(null);
  const [selectedLeadForQuote, setSelectedLeadForQuote] = useState<Lead | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Manual Lead Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [newLeadForm, setNewLeadForm] = useState({
    customer_name: '',
    company_name: '',
    mobile_number: '',
    alternate_number: '',
    email: '',
    city: '',
    state: '',
    source: 'MANUAL' as LeadSource,
    custom_source: '',
    client_requirement: '',
    assigned_user_id: '',
  });

  const { sources } = useSources();
  const [filters, setFilters] = useState<FilterValues>({
    search: '',
    date: '',
    datePreset: 'ALL',
    source: 'ALL',
  });
  const [totalQueueCount, setTotalQueueCount] = useState(0);

  const [kpis, setKpis] = useState({
    todays_new_leads: 0,
    calls_planned_today: 0,
    calls_completed_today: 0,
    overdue_calls: 0,
    not_reachable_count: 0,
    total_converted: 0,
  });

  const loadLeads = async () => {
    try {
      const [leadsRes, usersRes] = await Promise.all([
        fetch(`/api/v1/leads?_t=${Date.now()}`, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } }),
        fetch(`/api/v1/users?_t=${Date.now()}`, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } }),
      ]);

      const data = await leadsRes.json();
      const usersData = await usersRes.json();

      setUsers(usersData.users || []);
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

      setTotalQueueCount(queue.length);

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

      // Apply Search (Name, Mobile, ID, Fabric)
      let filtered = queue;
      if (filters.search) {
        const q = filters.search.toLowerCase().trim();
        filtered = filtered.filter(
          l =>
            l.unique_lead_id?.toLowerCase().includes(q) ||
            l.customer_name?.toLowerCase().includes(q) ||
            l.mobile_number?.includes(q) ||
            (l.company_name && l.company_name.toLowerCase().includes(q)) ||
            (l.client_requirement && l.client_requirement.toLowerCase().includes(q))
        );
      }

      // Apply Date Filter (Calendar)
      if (filters.date) {
        filtered = filtered.filter(l => {
          const lDate = (l.current_planned_call_at || l.lead_received_at || l.created_at || '').substring(0, 10);
          return lDate === filters.date;
        });
      }

      // Apply Source Filter
      if (filters.source && filters.source !== 'ALL') {
        filtered = filtered.filter(l => l.source === filters.source);
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

  const handleCreateManualLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    if (!newLeadForm.customer_name.trim() || !newLeadForm.mobile_number.trim()) {
      setModalError('Client Name and Mobile Number are required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/v1/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLeadForm),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create manual lead.');
      }

      setShowAddModal(false);
      setNewLeadForm({
        customer_name: '',
        company_name: '',
        mobile_number: '',
        alternate_number: '',
        email: '',
        city: '',
        state: '',
        source: 'MANUAL',
        custom_source: '',
        client_requirement: '',
        assigned_user_id: '',
      });
      loadLeads();
    } catch (err: any) {
      setModalError(err.message || 'Error saving lead.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#f4f6f9] overflow-hidden">
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Page Content */}
        <main className="p-6 space-y-6">
          
          {/* Header Title & Quick Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 flex items-center">
                <PhoneCall className="w-6 h-6 mr-2.5 text-purple-700" />
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
                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl flex items-center shadow-sm transition"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-slate-500" /> Refresh Queue
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center shadow-md transition"
              >
                <Plus className="w-4 h-4 mr-1.5" /> + ADD MANUAL INQUIRY
              </button>
            </div>
          </div>

          {/* SUMMARY KPI CARDS GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">New Leads Today</p>
              <p className="text-xl font-black text-slate-900 mt-1">{kpis.todays_new_leads}</p>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Inquiry</p>
              <p className="text-xl font-black text-blue-600 mt-1">{leads.length}</p>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Calls Completed</p>
              <p className="text-xl font-black text-emerald-600 mt-1">{kpis.calls_completed_today}</p>
            </div>

            <div className="bg-rose-50 p-3.5 rounded-2xl border border-rose-200 shadow-sm">
              <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider flex items-center">
                <AlertTriangle className="w-3 h-3 mr-1 text-rose-600" /> Overdue Calls
              </p>
              <p className="text-xl font-black text-rose-700 mt-1">{kpis.overdue_calls}</p>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Not Reachable</p>
              <p className="text-xl font-black text-amber-600 mt-1">{kpis.not_reachable_count}</p>
            </div>

            <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200 shadow-sm">
              <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Converted Deals</p>
              <p className="text-xl font-black text-emerald-700 mt-1">{kpis.total_converted}</p>
            </div>
          </div>

          {/* FILTERS TOOLBAR (Date Calendar, Name, Mobile, Source) */}
          <CrmQueueFilterBar
            filters={filters}
            onFilterChange={setFilters}
            totalCount={totalQueueCount}
            filteredCount={leads.length}
            placeholder="Search New Inquiries by Name, Mobile, Unique ID, Fabric..."
            dateLabel="Filter by Inquiry / Planned Call Date"
          />

          {/* PLANNED CALLS PRIORITY TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#250a42] text-white text-[11px] font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4 whitespace-nowrap">Unique ID</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Planned Time</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Time Delay</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Client Name</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Contact Number</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Location</th>
                    <th className="py-3.5 px-4">Requirement</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Source</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Status</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {leads.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400 italic">
                        No pending new inquiries! All calls have been handled and transferred.
                      </td>
                    </tr>
                  ) : (
                    leads.map(lead => {
                      const delay = calculateTimeDelay(lead.current_planned_call_at);
                      return (
                        <tr key={lead.id} className="hover:bg-slate-50 transition">
                          <td className="py-3.5 px-4 font-mono font-bold text-purple-700 whitespace-nowrap">
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
                            <a href={`tel:${lead.mobile_number}`} className="text-purple-700 hover:underline">
                              {lead.mobile_number}
                            </a>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="flex items-center text-slate-700 font-semibold">
                              <MapPin className="w-3.5 h-3.5 mr-1 text-purple-600 shrink-0" />
                              {lead.city || 'Surat'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 max-w-[200px] truncate text-slate-600">
                            {lead.client_requirement || lead.enquiry_message || '—'}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                              {lead.source}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                              {lead.current_status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center space-x-1.5">
                              <button
                                onClick={() => setSelectedLeadForCall(lead)}
                                className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center justify-center shadow-sm transition"
                              >
                                <PhoneCall className="w-3.5 h-3.5 mr-1" />
                                CALL
                              </button>
                              <button
                                onClick={() => setSelectedLeadForQuote(lead)}
                                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center justify-center shadow-sm transition"
                              >
                                <FileText className="w-3.5 h-3.5 mr-1" />
                                QUOTE
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
        </main>
      </div>

      {/* MANUAL INQUIRY MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center">
                <UserPlus className="w-4 h-4 mr-2 text-purple-700" />
                CREATE NEW MANUAL INQUIRY / LEAD
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateManualLead} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Customer / Client Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={newLeadForm.customer_name}
                    onChange={e => setNewLeadForm({ ...newLeadForm, customer_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9876543210"
                    value={newLeadForm.mobile_number}
                    onChange={e => setNewLeadForm({ ...newLeadForm, mobile_number: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 font-mono font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Company / Firm Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Gupta Textiles"
                    value={newLeadForm.company_name}
                    onChange={e => setNewLeadForm({ ...newLeadForm, company_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">City / Location</label>
                  <input
                    type="text"
                    list="planned-calls-city-suggestions"
                    placeholder="e.g. Surat, Delhi, Mumbai"
                    value={newLeadForm.city}
                    onChange={e => setNewLeadForm({ ...newLeadForm, city: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500"
                  />
                  <datalist id="planned-calls-city-suggestions">
                    {INDIAN_CITIES_SUGGESTIONS.map((city, cIdx) => (
                      <option key={cIdx} value={city} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Source Channel *</label>
                <select
                  value={newLeadForm.source}
                  onChange={e => setNewLeadForm({ ...newLeadForm, source: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 font-bold text-purple-800 text-xs"
                >
                  {sources.map((s, idx) => (
                    <option key={idx} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Product Requirement / Enquiry Details *</span>
                  <span className="text-[10px] text-purple-700 font-semibold flex items-center">
                    <Sparkles className="w-3 h-3 mr-1" /> Type 1 letter for Fabric Auto-Suggestions
                  </span>
                </label>
                <FabricRequirementInput
                  value={newLeadForm.client_requirement}
                  onChange={val => setNewLeadForm({ ...newLeadForm, client_requirement: val })}
                  placeholder="Type 1 word (e.g. Cotton, Denim, Cambric, Linen, Rayon, Silk, Crepe...)"
                  rows={2}
                />
              </div>

              <div className="p-2.5 bg-purple-50 border border-purple-200 text-purple-900 rounded-xl text-[11px] font-semibold flex items-center">
                <span className="w-2 h-2 rounded-full bg-purple-600 mr-2"></span>
                <span>Automatic Assignment: Lead will be distributed directly to active Sales Team CRM queues.</span>
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
                  className="bg-purple-700 hover:bg-purple-800 text-white font-bold px-5 py-2 rounded-lg shadow-md flex items-center disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                      Saving to Database...
                    </>
                  ) : (
                    'Save & Create Lead'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

      {/* Quotation Modal */}
      {selectedLeadForQuote && (
        <QuotationModal
          lead={selectedLeadForQuote}
          onClose={() => setSelectedLeadForQuote(null)}
          onSuccess={() => {
            loadLeads();
            setSelectedLeadForQuote(null);
          }}
        />
      )}
    </div>
  );
}

