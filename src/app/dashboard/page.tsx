'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatIST } from '@/lib/timezone';
import { Lead } from '@/types/crm';
import {
  PhoneCall,
  Users,
  CalendarCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  PhoneOff,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadDashboardData = () => {
    setLoading(true);
    fetch(`/api/v1/leads?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    })
      .then(r => r.json())
      .then(data => {
        setLeads(data.leads || []);
      })
      .catch(() => setLeads([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 20000);
    return () => clearInterval(interval);
  }, [refreshKey]);

  const now = new Date();
  const todayStr = now.toISOString().substring(0, 10);

  const newInquiries = leads.filter(l => l.current_status === 'NEW');
  const followups = leads.filter(l => l.current_status === 'FOLLOW_UP');
  const notReachable = leads.filter(l => l.current_status === 'NOT_REACHABLE');
  const converted = leads.filter(l => l.current_status === 'CONVERTED');

  const todaysLeads = leads.filter(l => l.lead_received_at && l.lead_received_at.substring(0, 10) === todayStr);
  const overdueNewLeads = newInquiries.filter(
    l => l.current_planned_call_at && new Date(l.current_planned_call_at) < now
  );

  const totalRevenue = converted.reduce((sum, l) => sum + (Number(l.deal_amount) || 0), 0);

  return (
    <div className="p-6 space-y-6">
      
      {/* Title & Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 p-6 rounded-2xl text-white shadow-md">
        <div>
          <span className="bg-sky-500/20 text-sky-400 text-xs font-bold px-2.5 py-0.5 rounded border border-sky-500/30 uppercase tracking-wider">
            CRM Operations Center
          </span>
          <h1 className="text-2xl font-black mt-1">Lead Calling &amp; Follow-up Control Room</h1>
          <p className="text-xs text-slate-300 mt-1">
            Realtime lead assignment, live call management, and sales conversion metrics.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setRefreshKey(k => k + 1);
              loadDashboardData();
            }}
            className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-3 py-3 rounded-xl flex items-center border border-slate-700 shadow transition"
          >
            <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh
          </button>
          <Link
            href="/planned-calls"
            className="bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-black px-5 py-3 rounded-xl flex items-center shadow-lg transition transform active:scale-95"
          >
            <PhoneCall className="w-4 h-4 mr-2" /> GO TO NEW INQUIRIES ({newInquiries.length})
          </Link>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Card 1: Today's New Leads */}
        <Link href="/planned-calls" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-sky-300 transition flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today's New Leads</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{todaysLeads.length}</h3>
            <p className="text-[11px] text-sky-600 mt-1 font-semibold">{newInquiries.length} pending call</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold">
            <PhoneCall className="w-6 h-6" />
          </div>
        </Link>

        {/* Card 2: Overdue Inquiries */}
        <Link href="/planned-calls?planned_filter=overdue" className="bg-rose-50 p-5 rounded-2xl border border-rose-200 shadow-sm hover:border-rose-300 transition flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-rose-600 uppercase tracking-wider flex items-center">
              <AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-600" /> Overdue Calls
            </p>
            <h3 className="text-2xl font-black text-rose-700 mt-1">{overdueNewLeads.length}</h3>
            <p className="text-[11px] text-rose-600 mt-1 font-semibold">Immediate attention needed</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-200 text-rose-700 flex items-center justify-center font-bold">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </Link>

        {/* Card 3: Active Follow-ups */}
        <Link href="/followups" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-purple-300 transition flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Follow-ups</p>
            <h3 className="text-2xl font-black text-purple-600 mt-1">{followups.length}</h3>
            <p className="text-[11px] text-purple-600 mt-1 font-semibold">Scheduled callbacks</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
            <CalendarCheck className="w-6 h-6" />
          </div>
        </Link>

        {/* Card 4: Not Reachable */}
        <Link href="/not-reachable" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-amber-300 transition flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Not Reachable</p>
            <h3 className="text-2xl font-black text-amber-600 mt-1">{notReachable.length}</h3>
            <p className="text-[11px] text-amber-600 mt-1 font-semibold">+4h Auto-retry</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
            <PhoneOff className="w-6 h-6" />
          </div>
        </Link>

        {/* Card 5: Converted Won */}
        <Link href="/converted" className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200 shadow-sm hover:border-emerald-300 transition flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Converted Won</p>
            <h3 className="text-2xl font-black text-emerald-700 mt-1">{converted.length}</h3>
            <p className="text-[11px] text-emerald-700 mt-1 font-bold">₹{totalRevenue.toLocaleString('en-IN')}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-200 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </Link>

      </div>

      {/* RECENT LEADS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Latest Live Leads Status</h2>
            <p className="text-xs text-slate-500">Live database sync status across all channels.</p>
          </div>
          <Link href="/leads" className="text-xs font-bold text-sky-600 hover:underline">
            View All Leads ({leads.length}) &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Unique ID</th>
                <th className="py-3 px-4">Client Name</th>
                <th className="py-3 px-4">Mobile</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Current Status</th>
                <th className="py-3 px-4">Received Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                    {loading ? 'Loading leads from database...' : 'No leads found in database.'}
                  </td>
                </tr>
              ) : (
                leads.slice(0, 10).map(lead => (
                  <tr key={lead.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-sky-700">{lead.unique_lead_id}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{lead.customer_name}</td>
                    <td className="py-3 px-4 font-mono">{lead.mobile_number}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800">
                        {lead.source}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        lead.current_status === 'NEW'
                          ? 'bg-blue-100 text-blue-800'
                          : lead.current_status === 'FOLLOW_UP'
                          ? 'bg-purple-100 text-purple-800'
                          : lead.current_status === 'NOT_REACHABLE'
                          ? 'bg-amber-100 text-amber-800'
                          : lead.current_status === 'CONVERTED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {lead.current_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono">
                      {lead.lead_received_at ? formatIST(lead.lead_received_at) : '—'}
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
