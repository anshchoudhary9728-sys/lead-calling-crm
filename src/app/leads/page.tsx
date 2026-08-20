'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import CallDrawer from '@/components/crm/CallDrawer';
import { Lead, LeadFilterState, LeadStatus, LeadSource } from '@/types/crm';
import { crmStore } from '@/lib/crm-store';
import { formatIST } from '@/lib/timezone';
import { useAuth } from '@/context/AuthContext';
import {
  Users,
  Search,
  Plus,
  FileSpreadsheet,
  PhoneCall,
  Eye,
  Filter,
  RefreshCw,
  X,
  CheckCircle2,
} from 'lucide-react';

export default function LeadsMasterPage() {
  const { currentUser } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedLeadForCall, setSelectedLeadForCall] = useState<Lead | null>(null);
  const [allLeads, setAllLeads] = useState<Lead[]>([]);

  // New Lead Modal State
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState({
    customer_name: '',
    company_name: '',
    mobile_number: '',
    alternate_number: '',
    email: '',
    city: '',
    state: '',
    source: 'MANUAL' as LeadSource,
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

  // Load leads from Supabase only
  React.useEffect(() => {
    fetch('/api/v1/leads')
      .then(r => r.json())
      .then(data => setAllLeads(data.leads || []))
      .catch(() => setAllLeads([]));
  }, [refreshKey]);

  // Apply filters to Supabase leads
  const leads = React.useMemo(() => {
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
    return result;
  }, [allLeads, filters]);

  const users = crmStore.getUsers();


  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadForm.customer_name || !newLeadForm.mobile_number) {
      alert('Client Name and Contact Mobile Number are mandatory.');
      return;
    }

    crmStore.createLead({
      customer_name: newLeadForm.customer_name,
      company_name: newLeadForm.company_name,
      mobile_number: newLeadForm.mobile_number,
      alternate_number: newLeadForm.alternate_number,
      email: newLeadForm.email,
      city: newLeadForm.city,
      state: newLeadForm.state,
      source: newLeadForm.source,
      client_requirement: newLeadForm.client_requirement,
      assigned_user_id: newLeadForm.assigned_user_id || undefined,
    });

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
      client_requirement: '',
      assigned_user_id: '',
    });
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="p-6 space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center">
            <Users className="w-6 h-6 mr-2.5 text-sky-600" />
            LEADS MASTER DIRECTORY
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete database of leads received from Justdial, IndiaMART, Manual entry & CSV imports.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowNewLeadModal(true)}
            className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center shadow-md transition transform active:scale-95"
          >
            <Plus className="w-4 h-4 mr-1.5" /> ADD NEW LEAD
          </button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Unique ID, Client Name, Mobile, Requirement..."
              value={filters.search}
              onChange={e => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

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
              <option value="CONVERTED">CONVERTED</option>
              <option value="NOT_INTERESTED">NOT INTERESTED</option>
              <option value="LOST">LOST</option>
            </select>
          </div>

          <div>
            <select
              value={filters.source}
              onChange={e => setFilters({ ...filters, source: e.target.value })}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">All Sources</option>
              <option value="JUSTDIAL">JUSTDIAL</option>
              <option value="INDIAMART">INDIAMART</option>
              <option value="MANUAL">MANUAL</option>
              <option value="IMPORT">IMPORT</option>
            </select>
          </div>

          <div>
            <select
              value={filters.assigned_user_id}
              onChange={e => setFilters({ ...filters, assigned_user_id: e.target.value })}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">All Assigned Executives</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider border-b border-slate-800">
                <th className="py-3.5 px-4">Unique Lead ID</th>
                <th className="py-3.5 px-4">Received Date</th>
                <th className="py-3.5 px-4">Client Name</th>
                <th className="py-3.5 px-4">Contact Number</th>
                <th className="py-3.5 px-4">Source</th>
                <th className="py-3.5 px-4 max-w-xs">Requirement</th>
                <th className="py-3.5 px-4">Assigned To</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 italic">
                    No leads found matching criteria.
                  </td>
                </tr>
              ) : (
                leads.map(lead => (
                  <tr key={lead.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-sky-700 whitespace-nowrap">
                      {lead.unique_lead_id}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                      {formatIST(lead.lead_received_at)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                      {lead.customer_name}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 whitespace-nowrap">
                      {lead.mobile_number}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {lead.source}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-600" title={lead.client_requirement}>
                      {lead.client_requirement || lead.enquiry_message || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-800">
                      {lead.assigned_user_name || 'Unassigned'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-slate-100 text-slate-800">
                        {lead.current_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => setSelectedLeadForCall(lead)}
                          title="Call Lead"
                          className="p-1.5 rounded-lg bg-sky-100 text-sky-700 hover:bg-sky-200 transition"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                        </button>
                        <Link
                          href={`/leads/${lead.id}`}
                          title="View 360 Degree Lead Profile"
                          className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW LEAD MODAL */}
      {showNewLeadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">CREATE NEW CRM LEAD</h3>
              <button onClick={() => setShowNewLeadModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={newLeadForm.customer_name}
                    onChange={e => setNewLeadForm({ ...newLeadForm, customer_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 9876543210"
                    value={newLeadForm.mobile_number}
                    onChange={e => setNewLeadForm({ ...newLeadForm, mobile_number: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Company Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Fabric Ltd"
                    value={newLeadForm.company_name}
                    onChange={e => setNewLeadForm({ ...newLeadForm, company_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Source *</label>
                  <select
                    value={newLeadForm.source}
                    onChange={e => setNewLeadForm({ ...newLeadForm, source: e.target.value as LeadSource })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500 font-semibold"
                  >
                    <option value="MANUAL">MANUAL ENTRY</option>
                    <option value="JUSTDIAL">JUSTDIAL</option>
                    <option value="INDIAMART">INDIAMART</option>
                    <option value="IMPORT">IMPORT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Client Requirement</label>
                <textarea
                  rows={2}
                  placeholder="Details of fabric, quantity or product enquiry..."
                  value={newLeadForm.client_requirement}
                  onChange={e => setNewLeadForm({ ...newLeadForm, client_requirement: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewLeadModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-5 py-2 rounded-lg shadow-md"
                >
                  Create & Auto-Plan Call
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
            setRefreshKey(prev => prev + 1);
            setSelectedLeadForCall(null);
          }}
        />
      )}
    </div>
  );
}
