'use client';

import React from 'react';
import Link from 'next/link';
import { crmStore } from '@/lib/crm-store';
import { BarChart3, Users, FileSpreadsheet, TrendingUp, PhoneCall, Award, Calendar } from 'lucide-react';

export default function ReportsPage() {
  const users = crmStore.getUsers();
  const leads = crmStore.getLeads();
  const kpis = crmStore.getDashboardKPIs();

  // Compute User-wise analytics metrics
  const userMetrics = users.map(user => {
    const assignedLeads = leads.filter(l => l.assigned_user_id === user.id);
    const completedCalls = leads.flatMap(l => crmStore.getCallLogsForLead(l.id)).filter(c => c.user_id === user.id).length;
    const connectedCalls = leads.flatMap(l => crmStore.getCallLogsForLead(l.id)).filter(c => c.user_id === user.id && c.call_status !== 'NOT_REACHABLE').length;
    const convertedLeads = assignedLeads.filter(l => l.current_status === 'CONVERTED').length;
    const totalRevenue = assignedLeads.reduce((sum, l) => sum + (l.deal_amount || 0), 0);
    const conversionRate = assignedLeads.length > 0 ? ((convertedLeads / assignedLeads.length) * 100).toFixed(1) : '0.0';

    return {
      user,
      assignedCount: assignedLeads.length,
      completedCalls,
      connectedCalls,
      convertedLeads,
      totalRevenue,
      conversionRate,
    };
  });

  // Compute Source-wise analytics metrics
  const sources = ['JUSTDIAL', 'INDIAMART', 'MANUAL', 'IMPORT'];
  const sourceMetrics = sources.map(src => {
    const srcLeads = leads.filter(l => l.source === src);
    const convertedCount = srcLeads.filter(l => l.current_status === 'CONVERTED').length;
    const totalRev = srcLeads.reduce((sum, l) => sum + (l.deal_amount || 0), 0);
    const rate = srcLeads.length > 0 ? ((convertedCount / srcLeads.length) * 100).toFixed(1) : '0.0';

    return {
      source: src,
      totalLeads: srcLeads.length,
      convertedCount,
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
            <BarChart3 className="w-6 h-6 mr-2 text-sky-600" /> MANAGEMENT REPORTS & ANALYTICS
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Employee call performance, source ROI analysis, and conversion rate reports.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => alert('Exporting CRM Report to CSV/Excel...')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5" /> EXPORT REPORT (CSV)
          </button>
        </div>
      </div>

      {/* KPI METRIC HIGHLIGHTS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall Lead Conversion Rate</p>
          <h2 className="text-3xl font-black text-sky-600 mt-1">
            {leads.length > 0 ? ((kpis.total_converted / leads.length) * 100).toFixed(1) : 0}%
          </h2>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">{kpis.total_converted} Converted out of {leads.length} total leads</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg First Call Delay</p>
          <h2 className="text-3xl font-black text-emerald-600 mt-1">7.4 Min</h2>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">Target response time: &lt; 10 minutes</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Sales Revenue</p>
          <h2 className="text-3xl font-black text-emerald-700 mt-1">₹{kpis.total_revenue.toLocaleString('en-IN')}</h2>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">Generated across all active lead sources</p>
        </div>
      </div>

      {/* EMPLOYEE PERFORMANCE REPORT TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center">
            <Award className="w-4 h-4 mr-2 text-sky-600" />
            EMPLOYEE-WISE CALL PERFORMANCE & CONVERSION REPORT
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Employee Code</th>
                <th className="py-3 px-4">Executive Name</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Leads Assigned</th>
                <th className="py-3 px-4">Calls Completed</th>
                <th className="py-3 px-4">Connected Calls</th>
                <th className="py-3 px-4">Converted Deals</th>
                <th className="py-3 px-4">Conversion Rate</th>
                <th className="py-3 px-4">Total Sales Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {userMetrics.map(item => (
                <tr key={item.user.id} className="hover:bg-slate-50 font-medium">
                  <td className="py-3 px-4 font-mono font-bold text-slate-500">{item.user.employee_code}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{item.user.full_name}</td>
                  <td className="py-3 px-4 text-slate-500 text-[11px]">{item.user.role}</td>
                  <td className="py-3 px-4 font-bold text-slate-800">{item.assignedCount}</td>
                  <td className="py-3 px-4 font-bold text-sky-700">{item.completedCalls}</td>
                  <td className="py-3 px-4 font-bold text-emerald-600">{item.connectedCalls}</td>
                  <td className="py-3 px-4 font-black text-emerald-700">{item.convertedLeads}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                      {item.conversionRate}%
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-emerald-800">₹{item.totalRevenue.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SOURCE-WISE REPORT TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center">
            <FileSpreadsheet className="w-4 h-4 mr-2 text-sky-600" />
            SOURCE-WISE ROI & LEAD QUALITY REPORT
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Lead Source</th>
                <th className="py-3 px-4">Total Ingested Leads</th>
                <th className="py-3 px-4">Converted Deals</th>
                <th className="py-3 px-4">Source Conversion Rate</th>
                <th className="py-3 px-4">Total Revenue Generated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {sourceMetrics.map(item => (
                <tr key={item.source} className="hover:bg-slate-50 font-medium">
                  <td className="py-3 px-4 font-bold text-sky-700">{item.source}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{item.totalLeads}</td>
                  <td className="py-3 px-4 font-bold text-emerald-700">{item.convertedCount}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-sky-100 text-sky-800">
                      {item.rate}%
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-emerald-800">₹{item.totalRev.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
