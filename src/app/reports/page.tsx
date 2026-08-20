'use client';

import React, { useState, useEffect } from 'react';
import { crmStore } from '@/lib/crm-store';
import { Lead } from '@/types/crm';
import { BarChart3, Users, TrendingUp, Award, Calendar, RefreshCw, CheckCircle2, PhoneOff, CalendarCheck } from 'lucide-react';

export default function ReportsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const users = crmStore.getUsers();

  const loadReportsData = () => {
    fetch(`/api/v1/leads?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    })
      .then(r => r.json())
      .then(data => setLeads(data.leads || []))
      .catch(() => setLeads([]));
  };

  useEffect(() => {
    loadReportsData();
  }, [refreshKey]);

  const totalLeads = leads.length;
  const newLeads = leads.filter(l => l.current_status === 'NEW').length;
  const followups = leads.filter(l => l.current_status === 'FOLLOW_UP').length;
  const notReachable = leads.filter(l => l.current_status === 'NOT_REACHABLE').length;
  const converted = leads.filter(l => l.current_status === 'CONVERTED').length;
  const totalRevenue = leads
    .filter(l => l.current_status === 'CONVERTED')
    .reduce((sum, l) => sum + (Number(l.deal_amount) || 0), 0);

  // Compute User-wise analytics metrics
  const userMetrics = users.map(user => {
    const assignedLeads = leads.filter(l => l.assigned_user_id === user.id);
    const convertedLeads = assignedLeads.filter(l => l.current_status === 'CONVERTED').length;
    const followupLeads = assignedLeads.filter(l => l.current_status === 'FOLLOW_UP').length;
    const notReachableLeads = assignedLeads.filter(l => l.current_status === 'NOT_REACHABLE').length;
    const revenue = assignedLeads
      .filter(l => l.current_status === 'CONVERTED')
      .reduce((sum, l) => sum + (Number(l.deal_amount) || 0), 0);
    const conversionRate = assignedLeads.length > 0
      ? ((convertedLeads / assignedLeads.length) * 100).toFixed(1)
      : '0.0';

    return {
      user,
      assignedCount: assignedLeads.length,
      followupLeads,
      notReachableLeads,
      convertedLeads,
      revenue,
      conversionRate,
    };
  });

  // Compute Source-wise analytics metrics
  const sources = ['JUSTDIAL', 'INDIAMART', 'MANUAL', 'IMPORT'];
  const sourceMetrics = sources.map(src => {
    const srcLeads = leads.filter(l => l.source === src);
    const convertedCount = srcLeads.filter(l => l.current_status === 'CONVERTED').length;
    const followupCount = srcLeads.filter(l => l.current_status === 'FOLLOW_UP').length;
    const notReachableCount = srcLeads.filter(l => l.current_status === 'NOT_REACHABLE').length;
    const totalRev = srcLeads
      .filter(l => l.current_status === 'CONVERTED')
      .reduce((sum, l) => sum + (Number(l.deal_amount) || 0), 0);
    const rate = srcLeads.length > 0 ? ((convertedCount / srcLeads.length) * 100).toFixed(1) : '0.0';

    return {
      source: src,
      totalLeads: srcLeads.length,
      convertedCount,
      followupCount,
      notReachableCount,
      totalRev,
      rate,
    };
  });

  return (
    <div className="p-6 space-y-6">
      
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center">
            <BarChart3 className="w-6 h-6 mr-2 text-sky-600" /> LIVE REPORTS &amp; CONVERSION ANALYTICS
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Realtime database performance reports, caller efficiency, and channel ROI.
          </p>
        </div>
        <button
          onClick={() => {
            setRefreshKey(k => k + 1);
            loadReportsData();
          }}
          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg flex items-center shadow-sm transition"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-slate-500" /> Refresh Reports
        </button>
      </div>

      {/* OVERALL PERFORMANCE METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Inquiries</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalLeads}</p>
          <p className="text-[11px] text-slate-500 mt-1">{newLeads} new awaiting</p>
        </div>

        <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 shadow-sm">
          <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wider flex items-center">
            <CalendarCheck className="w-3.5 h-3.5 mr-1" /> Follow-ups
          </p>
          <p className="text-2xl font-black text-purple-800 mt-1">{followups}</p>
          <p className="text-[11px] text-purple-600 mt-1">{totalLeads > 0 ? ((followups / totalLeads) * 100).toFixed(0) : 0}% of pipeline</p>
        </div>

        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 shadow-sm">
          <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider flex items-center">
            <PhoneOff className="w-3.5 h-3.5 mr-1" /> Not Reachable
          </p>
          <p className="text-2xl font-black text-amber-800 mt-1">{notReachable}</p>
          <p className="text-[11px] text-amber-600 mt-1">{totalLeads > 0 ? ((notReachable / totalLeads) * 100).toFixed(0) : 0}% retry queue</p>
        </div>

        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 shadow-sm">
          <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Converted Won
          </p>
          <p className="text-2xl font-black text-emerald-800 mt-1">{converted}</p>
          <p className="text-[11px] text-emerald-600 mt-1 font-bold">
            {totalLeads > 0 ? ((converted / totalLeads) * 100).toFixed(1) : 0}% Win Rate
          </p>
        </div>

        <div className="bg-slate-900 text-white p-4 rounded-xl shadow-sm">
          <p className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">Total Revenue Won</p>
          <p className="text-xl font-black text-emerald-400 mt-1">₹{totalRevenue.toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-slate-400 mt-1">{converted} deals closed</p>
        </div>
      </div>

      {/* CALLER PERFORMANCE TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center">
          <Users className="w-4 h-4 mr-2 text-sky-600" /> Executive / Caller Performance Summary
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Executive Name</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4 text-center">Assigned Leads</th>
                <th className="py-3 px-4 text-center">In Follow-up</th>
                <th className="py-3 px-4 text-center">Not Reachable</th>
                <th className="py-3 px-4 text-center">Deals Converted</th>
                <th className="py-3 px-4 text-right">Revenue Won</th>
                <th className="py-3 px-4 text-center">Win Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {userMetrics.map(m => (
                <tr key={m.user.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-slate-900">{m.user.full_name}</td>
                  <td className="py-3 px-4 text-slate-500 font-medium">{m.user.role}</td>
                  <td className="py-3 px-4 text-center font-semibold text-slate-800">{m.assignedCount}</td>
                  <td className="py-3 px-4 text-center font-semibold text-purple-700">{m.followupLeads}</td>
                  <td className="py-3 px-4 text-center font-semibold text-amber-700">{m.notReachableLeads}</td>
                  <td className="py-3 px-4 text-center font-bold text-emerald-700">{m.convertedLeads}</td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-700">₹{m.revenue.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {m.conversionRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* LEAD SOURCE ROI PERFORMANCE TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center">
          <Award className="w-4 h-4 mr-2 text-amber-600" /> Channel / Lead Source Conversion Breakdown
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Source Channel</th>
                <th className="py-3 px-4 text-center">Total Inquiries</th>
                <th className="py-3 px-4 text-center">Follow-ups</th>
                <th className="py-3 px-4 text-center">Not Reachable</th>
                <th className="py-3 px-4 text-center">Converted Deals</th>
                <th className="py-3 px-4 text-right">Revenue Generated</th>
                <th className="py-3 px-4 text-center">Conversion %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {sourceMetrics.map(src => (
                <tr key={src.source} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-sky-700">{src.source}</td>
                  <td className="py-3 px-4 text-center font-semibold text-slate-800">{src.totalLeads}</td>
                  <td className="py-3 px-4 text-center font-semibold text-purple-700">{src.followupCount}</td>
                  <td className="py-3 px-4 text-center font-semibold text-amber-700">{src.notReachableCount}</td>
                  <td className="py-3 px-4 text-center font-bold text-emerald-700">{src.convertedCount}</td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-700">₹{src.totalRev.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800">
                      {src.rate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
