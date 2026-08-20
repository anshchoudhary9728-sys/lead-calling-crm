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
  Activity,
  ArrowRight,
  Sparkles,
  ChevronRight,
  BarChart2,
} from 'lucide-react';

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'PERFORMANCE' | 'PIPELINE'>('OVERVIEW');

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
    <div className="p-6 space-y-6 bg-[#f4f6f9] min-h-screen">
      
      {/* 1. CREATIO-STYLE CHEVRON PIPELINE PROGRESS BAR */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-black text-slate-800 tracking-tight">SALES CALLING FUNNEL STAGES</h2>
            <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
              Live Pipeline
            </span>
          </div>
          <button
            onClick={() => {
              setRefreshKey(k => k + 1);
              loadDashboardData();
            }}
            className="text-xs text-purple-700 hover:text-purple-900 font-bold flex items-center bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-xl transition"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh Data
          </button>
        </div>

        {/* Chevron Stage Funnel */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs font-bold text-white">
          <div className="bg-emerald-600 p-2.5 rounded-xl flex items-center justify-between shadow-sm">
            <span>1. New Inquiry</span>
            <span className="bg-emerald-800 px-2 py-0.5 rounded-full text-[11px] font-black">{newInquiries.length}</span>
          </div>
          <div className="bg-blue-600 p-2.5 rounded-xl flex items-center justify-between shadow-sm">
            <span>2. Follow-ups</span>
            <span className="bg-blue-800 px-2 py-0.5 rounded-full text-[11px] font-black">{followups.length}</span>
          </div>
          <div className="bg-amber-500 p-2.5 rounded-xl flex items-center justify-between shadow-sm">
            <span>3. Not Reachable</span>
            <span className="bg-amber-700 px-2 py-0.5 rounded-full text-[11px] font-black">{notReachable.length}</span>
          </div>
          <div className="bg-purple-700 p-2.5 rounded-xl flex items-center justify-between shadow-sm">
            <span>4. Total Pipeline</span>
            <span className="bg-purple-900 px-2 py-0.5 rounded-full text-[11px] font-black">{leads.length}</span>
          </div>
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-2.5 rounded-xl flex items-center justify-between shadow-sm">
            <span>5. Closed Won</span>
            <span className="bg-emerald-900 px-2 py-0.5 rounded-full text-[11px] font-black">{converted.length}</span>
          </div>
        </div>
      </div>

      {/* 2. CREATIO-STYLE SOLID COLOR METRIC BLOCKS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Card 1: Solid Royal Blue */}
        <Link href="/planned-calls" className="bg-[#0052cc] text-white p-5 rounded-2xl shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5 flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-blue-200 uppercase tracking-wider">New Inquiries</p>
            <h3 className="text-3xl font-black mt-2">{newInquiries.length}</h3>
          </div>
          <p className="text-[11px] text-blue-100 mt-4 font-semibold flex items-center">
            <span>Awaiting first call</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </p>
        </Link>

        {/* Card 2: Solid Indigo / Overdue */}
        <Link href="/planned-calls?planned_filter=overdue" className="bg-[#4c1d95] text-white p-5 rounded-2xl shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5 flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-purple-200 uppercase tracking-wider">Overdue Calls</p>
            <h3 className="text-3xl font-black mt-2">{overdueNewLeads.length}</h3>
          </div>
          <p className="text-[11px] text-purple-200 mt-4 font-semibold flex items-center">
            <span>Urgent attention</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </p>
        </Link>

        {/* Card 3: Solid Warm Orange */}
        <Link href="/followups" className="bg-[#f97316] text-white p-5 rounded-2xl shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5 flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-orange-100 uppercase tracking-wider">Active Follow-ups</p>
            <h3 className="text-3xl font-black mt-2">{followups.length}</h3>
          </div>
          <p className="text-[11px] text-orange-100 mt-4 font-semibold flex items-center">
            <span>Scheduled callbacks</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </p>
        </Link>

        {/* Card 4: Solid Emerald Green */}
        <Link href="/converted" className="bg-[#16a34a] text-white p-5 rounded-2xl shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5 flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-100 uppercase tracking-wider">Converted Won</p>
            <h3 className="text-3xl font-black mt-2">{converted.length}</h3>
          </div>
          <p className="text-[11px] text-emerald-100 mt-4 font-bold flex items-center">
            <span>{leads.length > 0 ? ((converted.length / leads.length) * 100).toFixed(1) : 0}% Win Rate</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </p>
        </Link>

        {/* Card 5: Solid Deep Purple / Revenue */}
        <div className="bg-[#2e0854] text-white p-5 rounded-2xl shadow-md flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-purple-300 uppercase tracking-wider">Total Revenue</p>
            <h3 className="text-2xl font-black mt-2 text-emerald-400">₹{totalRevenue.toLocaleString('en-IN')}</h3>
          </div>
          <p className="text-[11px] text-purple-300 mt-4 font-semibold">
            {converted.length} deals revenue closed
          </p>
        </div>

      </div>

      {/* 3. CREATIO TABS & ANALYTICS SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex items-center space-x-8 border-b border-slate-200 pb-3 text-xs font-extrabold tracking-wider">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`pb-3 -mb-3 transition ${
              activeTab === 'OVERVIEW'
                ? 'text-purple-700 border-b-2 border-purple-700'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            OVERVIEW &amp; CALL DYNAMICS
          </button>
          <button
            onClick={() => setActiveTab('PERFORMANCE')}
            className={`pb-3 -mb-3 transition ${
              activeTab === 'PERFORMANCE'
                ? 'text-purple-700 border-b-2 border-purple-700'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            PIPELINE DISTRIBUTION
          </button>
          <button
            onClick={() => setActiveTab('PIPELINE')}
            className={`pb-3 -mb-3 transition ${
              activeTab === 'PIPELINE'
                ? 'text-purple-700 border-b-2 border-purple-700'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            LIVE RECENT LEADS ({leads.length})
          </button>
        </div>

        {/* Tab 1: Overview & SVG Charts */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Engagement & Dynamics Curve */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center">
                    <Activity className="w-4 h-4 mr-1.5 text-purple-600" /> Calling Activity Dynamics
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Active IST Engine
                  </span>
                </div>
                
                {/* SVG Visual Curve Chart */}
                <div className="h-40 w-full pt-4">
                  <svg className="w-full h-full" viewBox="0 0 500 150" fill="none">
                    <path
                      d="M 10 130 C 80 120, 120 70, 180 85 C 240 100, 280 20, 350 40 C 420 60, 460 25, 490 30"
                      stroke="#16a34a"
                      strokeWidth="3"
                      fill="none"
                    />
                    <path
                      d="M 10 140 C 90 130, 140 110, 200 105 C 260 100, 310 60, 380 70 C 440 80, 470 50, 490 55"
                      stroke="#0052cc"
                      strokeWidth="3"
                      fill="none"
                    />
                    <path
                      d="M 10 145 C 100 140, 160 135, 220 125 C 280 115, 330 90, 400 95 C 450 100, 480 80, 490 85"
                      stroke="#f97316"
                      strokeWidth="2.5"
                      strokeDasharray="4 4"
                      fill="none"
                    />
                  </svg>
                  <div className="flex items-center justify-center space-x-6 text-[11px] font-bold mt-2">
                    <span className="flex items-center text-emerald-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 mr-1.5"></span> Converted Won
                    </span>
                    <span className="flex items-center text-blue-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 mr-1.5"></span> Connected Calls
                    </span>
                    <span className="flex items-center text-orange-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-500 mr-1.5"></span> Follow-ups
                    </span>
                  </div>
                </div>
              </div>

              {/* Source Distribution Breakdown */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1.5 text-blue-600" /> Channel Ingestion Share
                </span>

                <div className="space-y-3 pt-2">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                      <span>Justdial Inquiries</span>
                      <span>{leads.filter(l => l.source === 'JUSTDIAL').length} leads</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full"
                        style={{
                          width: `${leads.length > 0 ? (leads.filter(l => l.source === 'JUSTDIAL').length / leads.length) * 100 : 0}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                      <span>IndiaMART Inquiries</span>
                      <span>{leads.filter(l => l.source === 'INDIAMART').length} leads</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full"
                        style={{
                          width: `${leads.length > 0 ? (leads.filter(l => l.source === 'INDIAMART').length / leads.length) * 100 : 0}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                      <span>Manual / Direct Inquiries</span>
                      <span>{leads.filter(l => l.source === 'MANUAL' || l.source === 'IMPORT').length} leads</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-purple-600 h-full rounded-full"
                        style={{
                          width: `${leads.length > 0 ? (leads.filter(l => l.source === 'MANUAL' || l.source === 'IMPORT').length / leads.length) * 100 : 0}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Tab 2: Performance breakdown */}
        {activeTab === 'PERFORMANCE' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl">
              <p className="text-xs font-bold text-purple-900">Follow-up Pipeline</p>
              <p className="text-2xl font-black text-purple-700 mt-1">{followups.length}</p>
              <p className="text-[11px] text-purple-600 mt-1">Callbacks booked</p>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
              <p className="text-xs font-bold text-amber-900">Not Reachable Retries</p>
              <p className="text-2xl font-black text-amber-700 mt-1">{notReachable.length}</p>
              <p className="text-[11px] text-amber-600 mt-1">4-hour automated retry</p>
            </div>
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
              <p className="text-xs font-bold text-emerald-900">Conversion Rate</p>
              <p className="text-2xl font-black text-emerald-700 mt-1">
                {leads.length > 0 ? ((converted.length / leads.length) * 100).toFixed(1) : 0}%
              </p>
              <p className="text-[11px] text-emerald-600 mt-1">Closed deals percentage</p>
            </div>
          </div>
        )}

        {/* Tab 3: Live Recent Leads Table */}
        {activeTab === 'PIPELINE' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#250a42] text-white text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Unique ID</th>
                  <th className="py-3 px-4">Client Name</th>
                  <th className="py-3 px-4">Mobile</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                      No leads found in database.
                    </td>
                  </tr>
                ) : (
                  leads.map(lead => (
                    <tr key={lead.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-purple-700">{lead.unique_lead_id}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{lead.customer_name}</td>
                      <td className="py-3 px-4 font-mono">{lead.mobile_number}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
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
                            : 'bg-slate-100 text-slate-800'
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
        )}

      </div>

    </div>
  );
}
