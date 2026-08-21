'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import CallDrawer from '@/components/crm/CallDrawer';
import QuotationModal from '@/components/crm/QuotationModal';
import { Lead, LeadFilterState, LeadSource, User } from '@/types/crm';
import { formatIST } from '@/lib/timezone';
import { useAuth } from '@/context/AuthContext';
import {
  Users,
  Search,
  Plus,
  PhoneCall,
  RefreshCw,
  X,
  UserPlus,
  Loader2,
  Filter,
  FileText,
  MapPin,
  Sparkles,
} from 'lucide-react';
import FabricRequirementInput from '@/components/crm/FabricRequirementInput';
import { INDIAN_CITIES_SUGGESTIONS } from '@/constants/cities';

export default function LeadsMasterPage() {
  const { currentUser } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedLeadForCall, setSelectedLeadForCall] = useState<Lead | null>(null);
  const [selectedLeadForQuote, setSelectedLeadForQuote] = useState<Lead | null>(null);
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // New Lead Modal State
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);
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

  // Filters State
  const [filters, setFilters] = useState<LeadFilterState>({
    search: '',
    status: 'all',
    source: 'all',
    assigned_user_id: 'all',
    date_range: 'all',
  });

  // Load leads and users from Supabase
  const loadData = async () => {
    setLoading(true);
    try {
      const [leadsRes, usersRes] = await Promise.all([
        fetch(`/api/v1/leads?_t=${Date.now()}`, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } }),
        fetch(`/api/v1/users?_t=${Date.now()}`, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } }),
      ]);

      const leadsData = await leadsRes.json();
      const usersData = await usersRes.json();

      setAllLeads(leadsData.leads || []);
      setUsers(usersData.users || []);
    } catch (err) {
      console.error('Error loading leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  // Apply filters to Supabase leads
  const leads = useMemo(() => {
    let result = [...allLeads];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(l =>
        l.unique_lead_id?.toLowerCase().includes(q) ||
        l.customer_name?.toLowerCase().includes(q) ||
        l.mobile_number?.includes(q) ||
        (l.company_name && l.company_name.toLowerCase().includes(q))
      );
    }
    if (filters.status !== 'all') result = result.filter(l => l.current_status === filters.status);
    if (filters.source !== 'all') result = result.filter(l => l.source === filters.source);
    if (filters.assigned_user_id !== 'all') result = result.filter(l => l.assigned_user_id === filters.assigned_user_id);
    return result;
  }, [allLeads, filters]);

  const handleCreateLead = async (e: React.FormEvent) => {
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
        throw new Error(data.error || 'Failed to create lead.');
      }

      setShowNewLeadModal(false);
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
      loadData();
    } catch (err: any) {
      setModalError(err.message || 'Error saving lead.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-[#f4f6f9] min-h-screen">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center">
            <Users className="w-6 h-6 mr-2 text-purple-700" /> LEADS MASTER DIRECTORY
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete database of leads from Justdial, IndiaMART, Manual Entry, WhatsApp &amp; other channels.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl flex items-center shadow-sm transition"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-slate-500" /> Refresh
          </button>
          <button
            onClick={() => setShowNewLeadModal(true)}
            className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center shadow-md transition"
          >
            <Plus className="w-4 h-4 mr-1.5" /> + ADD NEW LEAD
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search Unique ID, Client, Mobile..."
                value={filters.search}
                onChange={e => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 font-medium"
              />
            </div>
          </div>

          <div>
            <select
              value={filters.status}
              onChange={e => setFilters({ ...filters, status: e.target.value as any })}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Lead Statuses</option>
              <option value="NEW">NEW</option>
              <option value="FOLLOW_UP">FOLLOW_UP</option>
              <option value="NOT_REACHABLE">NOT_REACHABLE</option>
              <option value="CONVERTED">CONVERTED</option>
            </select>
          </div>

          <div>
            <select
              value={filters.source}
              onChange={e => setFilters({ ...filters, source: e.target.value as any })}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Sources</option>
              <option value="JUSTDIAL">JUSTDIAL</option>
              <option value="INDIAMART">INDIAMART</option>
              <option value="MANUAL">MANUAL ENTRY / OTHER</option>
              <option value="IMPORT">IMPORT</option>
            </select>
          </div>

          <div>
            <select
              value={filters.assigned_user_id}
              onChange={e => setFilters({ ...filters, assigned_user_id: e.target.value })}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Assigned Executives</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.full_name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#250a42] text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Unique Lead ID</th>
                <th className="py-3.5 px-4">Received Date</th>
                <th className="py-3.5 px-4">Client Name</th>
                <th className="py-3.5 px-4">Contact Number</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Source</th>
                <th className="py-3.5 px-4">Requirement</th>
                <th className="py-3.5 px-4">Assigned To</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-slate-400 italic">
                    {loading ? 'Loading leads from database...' : 'No leads found.'}
                  </td>
                </tr>
              ) : (
                leads.map(lead => (
                  <tr key={lead.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-purple-700">{lead.unique_lead_id}</td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono">
                      {lead.lead_received_at ? formatIST(lead.lead_received_at) : '—'}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{lead.customer_name}</td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">{lead.mobile_number}</td>
                    <td className="py-3.5 px-4">
                      <span className="flex items-center text-slate-700 font-semibold">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-purple-600 shrink-0" />
                        {lead.city || 'Surat'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                        {lead.source}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-[220px] truncate text-slate-600">
                      {lead.client_requirement || lead.enquiry_message || '—'}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {lead.assigned_user_name || 'Unassigned'}
                    </td>
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
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => setSelectedLeadForCall(lead)}
                          className="bg-purple-700 hover:bg-purple-800 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg flex items-center shadow-sm transition"
                        >
                          <PhoneCall className="w-3.5 h-3.5 mr-1" /> Call
                        </button>
                        <button
                          onClick={() => setSelectedLeadForQuote(lead)}
                          className="bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg flex items-center shadow-sm transition"
                        >
                          <FileText className="w-3.5 h-3.5 mr-1" /> Quote
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE NEW LEAD MODAL */}
      {showNewLeadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center">
                <UserPlus className="w-4 h-4 mr-2 text-purple-700" />
                CREATE NEW MANUAL INQUIRY / LEAD
              </h3>
              <button onClick={() => setShowNewLeadModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateLead} className="space-y-3 text-xs">
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
                    list="leads-city-suggestions"
                    placeholder="e.g. Surat, Delhi, Mumbai"
                    value={newLeadForm.city}
                    onChange={e => setNewLeadForm({ ...newLeadForm, city: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500"
                  />
                  <datalist id="leads-city-suggestions">
                    {INDIAN_CITIES_SUGGESTIONS.map((city, cIdx) => (
                      <option key={cIdx} value={city} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Source Channel *</label>
                  <select
                    value={newLeadForm.source}
                    onChange={e => setNewLeadForm({ ...newLeadForm, source: e.target.value as LeadSource })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 font-bold text-purple-800"
                  >
                    <option value="MANUAL">Direct Call / Walk-in</option>
                    <option value="OTHER">WhatsApp / Referral</option>
                    <option value="JUSTDIAL">Justdial</option>
                    <option value="INDIAMART">IndiaMART</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Specific Source Name</label>
                  <input
                    type="text"
                    placeholder="e.g. WhatsApp, Trade Fair"
                    value={newLeadForm.custom_source}
                    onChange={e => setNewLeadForm({ ...newLeadForm, custom_source: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
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
                  onClick={() => setShowNewLeadModal(false)}
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

      {/* Call Drawer */}
      {selectedLeadForCall && (
        <CallDrawer
          lead={selectedLeadForCall}
          onClose={() => setSelectedLeadForCall(null)}
          onSuccess={() => {
            setSelectedLeadForCall(null);
            loadData();
          }}
        />
      )}

      {/* Quotation Modal */}
      {selectedLeadForQuote && (
        <QuotationModal
          lead={selectedLeadForQuote}
          onClose={() => setSelectedLeadForQuote(null)}
          onSuccess={() => {
            setSelectedLeadForQuote(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}

