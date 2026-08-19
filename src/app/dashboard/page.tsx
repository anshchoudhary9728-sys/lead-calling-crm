'use client';

import React from 'react';
import Link from 'next/link';
import { crmStore } from '@/lib/crm-store';
import { formatIST } from '@/lib/timezone';
import {
  PhoneCall,
  Users,
  CalendarCheck,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Clock,
  ArrowRight,
  PlusCircle,
  FileSpreadsheet,
} from 'lucide-react';

export default function DashboardPage() {
  const kpis = crmStore.getDashboardKPIs();
  const leads = crmStore.getLeads();
  const overdueLeads = crmStore.getPlannedCallsQueue().filter(l => l.current_planned_call_at && new Date(l.current_planned_call_at) < new Date());
  const recentLeads = leads.slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      
      {/* Title & Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 p-6 rounded-2xl text-white shadow-md">
        <div>
          <span className="bg-sky-500/20 text-sky-400 text-xs font-bold px-2.5 py-0.5 rounded border border-sky-500/30 uppercase tracking-wider">
            CRM Operations Center
          </span>
          <h1 className="text-2xl font-black mt-1">Lead Calling & Follow-up Control Room</h1>
          <p className="text-xs text-slate-300 mt-1">
            Realtime lead assignment, automatic call planning engine, and conversion metrics.
          </p>
        </div>
        <div>
          <Link
            href="/planned-calls"
            className="bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-black px-5 py-3 rounded-xl flex items-center shadow-lg transition transform active:scale-95"
          >
            <PhoneCall className="w-4 h-4 mr-2" /> GO TO PLANNED CALLS QUEUE
          </Link>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Today's New Leads */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today's New Leads</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{kpis.todays_new_leads}</h3>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">Auto-assigned & planned</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Overdue Calls Alert */}
        <div className="bg-rose-50 p-5 rounded-2xl border border-rose-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center">
              <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Overdue Calls
            </p>
            <h3 className="text-2xl font-black text-rose-800 mt-1">{kpis.overdue_calls}</h3>
            <p className="text-[11px] text-rose-600 mt-1 font-semibold">Immediate caller action needed</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-200 text-rose-700 flex items-center justify-center font-bold animate-pulse">
            <PhoneCall className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Today's Followups */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today's Follow-ups</p>
            <h3 className="text-2xl font-black text-purple-600 mt-1">{kpis.todays_followups}</h3>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">Scheduled follow-up calls</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
            <CalendarCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Total Converted Revenue */}
        <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Total Converted Deals</p>
            <h3 className="text-2xl font-black text-emerald-700 mt-1">{kpis.total_converted}</h3>
            <p className="text-[11px] text-emerald-700 font-bold mt-1">₹{kpis.total_revenue.toLocaleString('en-IN')} Won</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-200 text-emerald-800 flex items-center justify-center font-bold">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* TWO COLUMN GRID: URGENT OVERDUE CALLS & RECENT INGESTED LEADS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Urgent Overdue Calls List */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2 text-rose-600" />
                URGENT OVERDUE PLANNED CALLS
              </h2>
              <p className="text-[11px] text-slate-500">Requires caller follow-up immediately</p>
            </div>
            <Link href="/planned-calls" className="text-xs font-bold text-sky-600 hover:underline flex items-center">
              View All Queue <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </div>

          <div className="space-y-3">
            {overdueLeads.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6 text-center">Great job! Zero overdue calls pending.</p>
            ) : (
              overdueLeads.slice(0, 4).map(lead => (
                <div key={lead.id} className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-100 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-rose-800">{lead.unique_lead_id}</span>
                      <span className="font-bold text-slate-900">{lead.customer_name}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{lead.mobile_number} • {lead.client_requirement || 'No requirement'}</p>
                    <p className="text-[10px] text-rose-700 font-bold mt-1">Planned: {formatIST(lead.current_planned_call_at)}</p>
                  </div>
                  <Link
                    href="/planned-calls"
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-lg text-[11px] shadow-sm"
                  >
                    CALL NOW
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Ingested Leads */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center">
                <Users className="w-4 h-4 mr-2 text-sky-600" />
                RECENTLY INGESTED LEADS
              </h2>
              <p className="text-[11px] text-slate-500">Synced from Justdial, IndiaMART & Sheets</p>
            </div>
            <Link href="/leads" className="text-xs font-bold text-sky-600 hover:underline flex items-center">
              View All Leads <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentLeads.map(lead => (
              <div key={lead.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-sky-700">{lead.unique_lead_id}</span>
                    <span className="font-bold text-slate-900">{lead.customer_name}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Source: <strong>{lead.source}</strong> • Assigned: {lead.assigned_user_name}</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800">
                  {lead.current_status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
