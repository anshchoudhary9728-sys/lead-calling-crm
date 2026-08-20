'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Lead, User } from '@/types/crm';
import { formatIST } from '@/lib/timezone';
import {
  BarChart3,
  Users,
  Award,
  Calendar,
  RefreshCw,
  CheckCircle2,
  PhoneOff,
  CalendarCheck,
  Search,
  Filter,
  Download,
  PhoneCall,
  TrendingUp,
  Activity,
  ArrowRight,
} from 'lucide-react';

export default function ReportsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filter States
  const [dateFilter, setDateFilter] = useState<string>('ALL_TIME');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('ALL');
  const [employeeSearchText, setEmployeeSearchText] = useState<string>('');
  const [selectedSource, setSelectedSource] = useState<string>('ALL');

  // Load live Leads & Users from Supabase API
  const loadReportsData = async () => {
    setLoading(true);
    try {
      const [leadsRes, usersRes] = await Promise.all([
        fetch(`/api/v1/leads?_t=${Date.now()}`, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } }),
        fetch(`/api/v1/users?_t=${Date.now()}`, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } }),
      ]);

      const leadsData = await leadsRes.json();
      const usersData = await usersRes.json();

      setLeads(leadsData.leads || []);
      setUsers(usersData.users || []);
    } catch (err) {
      console.error('Error loading reports data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportsData();
  }, [refreshKey]);

  // Generate Month Options for filter dropdown
  const monthOptions = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      months.push({ val, label });
    }
    return months;
  }, []);

  // Filter leads based on Date, Month, Employee, and Source
  const filteredLeads = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().substring(0, 10);

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().substring(0, 10);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const currentMonthPrefix = todayStr.substring(0, 7);

    return leads.filter(lead => {
      const leadDateStr = lead.lead_received_at || lead.created_at || '';
      const leadDate = new Date(leadDateStr);
      const leadDayStr = leadDateStr.substring(0, 10);

      // 1. Date Range Preset Filter
      if (dateFilter === 'TODAY' && leadDayStr !== todayStr) return false;
      if (dateFilter === 'YESTERDAY' && leadDayStr !== yesterdayStr) return false;
      if (dateFilter === 'THIS_WEEK' && leadDate < startOfWeek) return false;
      if (dateFilter === 'THIS_MONTH' && !leadDayStr.startsWith(currentMonthPrefix)) return false;
      if (dateFilter === 'CUSTOM') {
        if (customStartDate && leadDayStr < customStartDate) return false;
        if (customEndDate && leadDayStr > customEndDate) return false;
      }

      // 2. Month-Wise Filter
      if (selectedMonth !== 'ALL') {
        if (!leadDayStr.startsWith(selectedMonth)) return false;
      }

      // 3. Employee Filter
      if (selectedEmployeeId !== 'ALL') {
        if (selectedEmployeeId === 'UNASSIGNED') {
          if (lead.assigned_user_id) return false;
        } else {
          if (lead.assigned_user_id !== selectedEmployeeId) return false;
        }
      }

      // 4. Source Channel Filter
      if (selectedSource !== 'ALL') {
        if (lead.source !== selectedSource) return false;
      }

      return true;
    });
  }, [leads, dateFilter, customStartDate, customEndDate, selectedMonth, selectedEmployeeId, selectedSource]);

  // Overall KPI Metrics for filtered leads
  const totalLeads = filteredLeads.length;
  const newLeads = filteredLeads.filter(l => l.current_status === 'NEW').length;
  const followups = filteredLeads.filter(l => l.current_status === 'FOLLOW_UP').length;
  const notReachable = filteredLeads.filter(l => l.current_status === 'NOT_REACHABLE').length;
  const converted = filteredLeads.filter(l => l.current_status === 'CONVERTED').length;
  const totalRevenue = filteredLeads
    .filter(l => l.current_status === 'CONVERTED')
    .reduce((sum, l) => sum + (Number(l.deal_amount) || 0), 0);
  const winRate = totalLeads > 0 ? ((converted / totalLeads) * 100).toFixed(1) : '0.0';

  // Compute Employee Performance Metrics from Filtered Leads
  const userMetrics = useMemo(() => {
    let targetUsers = users;
    if (employeeSearchText.trim()) {
      const q = employeeSearchText.toLowerCase();
      targetUsers = targetUsers.filter(u =>
        u.full_name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    }

    const metrics = targetUsers.map(user => {
      const userLeads = filteredLeads.filter(l => l.assigned_user_id === user.id);
      const userNew = userLeads.filter(l => l.current_status === 'NEW').length;
      const userFollowup = userLeads.filter(l => l.current_status === 'FOLLOW_UP').length;
      const userNotReachable = userLeads.filter(l => l.current_status === 'NOT_REACHABLE').length;
      const userConverted = userLeads.filter(l => l.current_status === 'CONVERTED').length;
      const revenue = userLeads
        .filter(l => l.current_status === 'CONVERTED')
        .reduce((sum, l) => sum + (Number(l.deal_amount) || 0), 0);
      const rate = userLeads.length > 0 ? ((userConverted / userLeads.length) * 100).toFixed(1) : '0.0';

      return {
        user,
        total: userLeads.length,
        newCount: userNew,
        followupCount: userFollowup,
        notReachableCount: userNotReachable,
        convertedCount: userConverted,
        revenue,
        conversionRate: rate,
      };
    });

    // Also include unassigned leads if any
    const unassignedLeads = filteredLeads.filter(l => !l.assigned_user_id);
    if (unassignedLeads.length > 0 && !employeeSearchText) {
      const unassignedConverted = unassignedLeads.filter(l => l.current_status === 'CONVERTED').length;
      const unassignedRev = unassignedLeads
        .filter(l => l.current_status === 'CONVERTED')
        .reduce((sum, l) => sum + (Number(l.deal_amount) || 0), 0);

      metrics.push({
        user: { id: 'unassigned', full_name: 'Unassigned / Direct Webhook', username: 'unassigned', role: 'SALES_EXECUTIVE' } as any,
        total: unassignedLeads.length,
        newCount: unassignedLeads.filter(l => l.current_status === 'NEW').length,
        followupCount: unassignedLeads.filter(l => l.current_status === 'FOLLOW_UP').length,
        notReachableCount: unassignedLeads.filter(l => l.current_status === 'NOT_REACHABLE').length,
        convertedCount: unassignedConverted,
        revenue: unassignedRev,
        conversionRate: unassignedLeads.length > 0 ? ((unassignedConverted / unassignedLeads.length) * 100).toFixed(1) : '0.0',
      });
    }

    return metrics;
  }, [users, filteredLeads, employeeSearchText]);

  // Compute Source-wise ROI Breakdown
  const sourceMetrics = useMemo(() => {
    const sources = ['JUSTDIAL', 'INDIAMART', 'MANUAL', 'IMPORT'];
    return sources.map(src => {
      const srcLeads = filteredLeads.filter(l => l.source === src);
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
  }, [filteredLeads]);

  // Export Filtered Report to CSV
  const handleExportCSV = () => {
    const headers = ['Unique ID', 'Client Name', 'Mobile', 'Source', 'Assigned To', 'Status', 'Date Received', 'Deal Revenue'];
    const rows = filteredLeads.map(l => [
      l.unique_lead_id,
      `"${(l.customer_name || '').replace(/"/g, '""')}"`,
      l.mobile_number,
      l.source,
      `"${l.assigned_user_name || 'Unassigned'}"`,
      l.current_status,
      l.lead_received_at ? formatIST(l.lead_received_at) : '',
      l.deal_amount || 0,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CRM_Report_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 space-y-6 bg-[#f4f6f9] min-h-screen">
      
      {/* Header Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center">
            <BarChart3 className="w-6 h-6 mr-2 text-purple-700" /> LIVE REPORTS &amp; EMPLOYEE ANALYTICS
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Realtime database performance reports, employee caller breakdown, and date/month filters.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setRefreshKey(k => k + 1);
              loadReportsData();
            }}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl flex items-center shadow-sm transition"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-slate-500" /> Refresh
          </button>
          <button
            onClick={handleExportCSV}
            className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center shadow-md transition"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* COMPREHENSIVE FILTER TOOLBAR */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-xs font-bold text-purple-900 flex items-center">
            <Filter className="w-3.5 h-3.5 mr-1.5 text-purple-600" /> Filter Reports &amp; Performance
          </span>
          {(dateFilter !== 'ALL_TIME' || selectedMonth !== 'ALL' || selectedEmployeeId !== 'ALL' || selectedSource !== 'ALL' || employeeSearchText) && (
            <button
              onClick={() => {
                setDateFilter('ALL_TIME');
                setSelectedMonth('ALL');
                setSelectedEmployeeId('ALL');
                setSelectedSource('ALL');
                setEmployeeSearchText('');
                setCustomStartDate('');
                setCustomEndDate('');
              }}
              className="text-[11px] font-semibold text-rose-600 hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* 1. Date Range Presets */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Date Range Filter</label>
            <select
              value={dateFilter}
              onChange={e => {
                setDateFilter(e.target.value);
                if (e.target.value !== 'ALL_TIME') setSelectedMonth('ALL');
              }}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-purple-500"
            >
              <option value="ALL_TIME">All Time</option>
              <option value="TODAY">Today</option>
              <option value="YESTERDAY">Yesterday</option>
              <option value="THIS_WEEK">This Week</option>
              <option value="THIS_MONTH">This Month</option>
              <option value="CUSTOM">Custom Date Range</option>
            </select>
          </div>

          {/* 2. Month-Wise Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Month-Wise Filter</label>
            <select
              value={selectedMonth}
              onChange={e => {
                setSelectedMonth(e.target.value);
                if (e.target.value !== 'ALL') setDateFilter('ALL_TIME');
              }}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-purple-500"
            >
              <option value="ALL">All Months</option>
              {monthOptions.map(m => (
                <option key={m.val} value={m.val}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Employee Dropdown */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Employee / Caller</label>
            <select
              value={selectedEmployeeId}
              onChange={e => setSelectedEmployeeId(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-purple-500"
            >
              <option value="ALL">All Employees ({users.length})</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.full_name} ({u.role})
                </option>
              ))}
              <option value="UNASSIGNED">Unassigned Leads Only</option>
            </select>
          </div>

          {/* 4. Lead Source Channel */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Lead Channel / Source</label>
            <select
              value={selectedSource}
              onChange={e => setSelectedSource(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-purple-500"
            >
              <option value="ALL">All Lead Sources</option>
              <option value="JUSTDIAL">JUSTDIAL</option>
              <option value="INDIAMART">INDIAMART</option>
              <option value="MANUAL">MANUAL ENTRY</option>
              <option value="IMPORT">CSV IMPORT</option>
            </select>
          </div>

        </div>

        {/* Custom Start & End Date Pickers */}
        {dateFilter === 'CUSTOM' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">From Date</label>
              <input
                type="date"
                value={customStartDate}
                onChange={e => setCustomStartDate(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">To Date</label>
              <input
                type="date"
                value={customEndDate}
                onChange={e => setCustomEndDate(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2"
              />
            </div>
          </div>
        )}
      </div>

      {/* CREATIO SOLID METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Card 1: Solid Royal Blue */}
        <div className="bg-[#0052cc] text-white p-5 rounded-2xl shadow-md flex flex-col justify-between">
          <p className="text-xs font-bold text-blue-200 uppercase tracking-wider">Total Inquiries</p>
          <h3 className="text-3xl font-black mt-2">{totalLeads}</h3>
          <p className="text-[11px] text-blue-100 mt-3 font-semibold">{newLeads} new awaiting</p>
        </div>

        {/* Card 2: Solid Warm Orange */}
        <div className="bg-[#f97316] text-white p-5 rounded-2xl shadow-md flex flex-col justify-between">
          <p className="text-xs font-bold text-orange-100 uppercase tracking-wider">Follow-ups</p>
          <h3 className="text-3xl font-black mt-2">{followups}</h3>
          <p className="text-[11px] text-orange-100 mt-3 font-semibold">
            {totalLeads > 0 ? ((followups / totalLeads) * 100).toFixed(0) : 0}% of pipeline
          </p>
        </div>

        {/* Card 3: Solid Amber / Not Reachable */}
        <div className="bg-[#e11d48] text-white p-5 rounded-2xl shadow-md flex flex-col justify-between">
          <p className="text-xs font-bold text-rose-100 uppercase tracking-wider">Not Reachable</p>
          <h3 className="text-3xl font-black mt-2">{notReachable}</h3>
          <p className="text-[11px] text-rose-100 mt-3 font-semibold">
            {totalLeads > 0 ? ((notReachable / totalLeads) * 100).toFixed(0) : 0}% retry queue
          </p>
        </div>

        {/* Card 4: Solid Emerald Green */}
        <div className="bg-[#16a34a] text-white p-5 rounded-2xl shadow-md flex flex-col justify-between">
          <p className="text-xs font-bold text-emerald-100 uppercase tracking-wider">Converted Deals</p>
          <h3 className="text-3xl font-black mt-2">{converted}</h3>
          <p className="text-[11px] text-emerald-100 mt-3 font-bold">{winRate}% Win Rate</p>
        </div>

        {/* Card 5: Solid Deep Violet */}
        <div className="bg-[#2e0854] text-white p-5 rounded-2xl shadow-md flex flex-col justify-between">
          <p className="text-xs font-bold text-purple-300 uppercase tracking-wider">Total Revenue</p>
          <h3 className="text-2xl font-black mt-2 text-emerald-400">₹{totalRevenue.toLocaleString('en-IN')}</h3>
          <p className="text-[11px] text-purple-300 mt-3 font-semibold">{converted} deals closed</p>
        </div>

      </div>

      {/* EMPLOYEE NAME SEARCH & PERFORMANCE SUMMARY TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center">
            <Users className="w-4 h-4 mr-2 text-purple-700" /> Employee / Caller Performance Summary
          </h3>
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Employee by Name..."
              value={employeeSearchText}
              onChange={e => setEmployeeSearchText(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 font-semibold"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#250a42] text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Executive Name</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4 text-center">Total Assigned</th>
                <th className="py-3 px-4 text-center">New Inquiry</th>
                <th className="py-3 px-4 text-center">In Follow-up</th>
                <th className="py-3 px-4 text-center">Not Reachable</th>
                <th className="py-3 px-4 text-center">Deals Converted</th>
                <th className="py-3 px-4 text-right">Revenue Won</th>
                <th className="py-3 px-4 text-center">Win Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {userMetrics.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 italic">
                    No matching employees found.
                  </td>
                </tr>
              ) : (
                userMetrics.map(m => (
                  <tr key={m.user.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{m.user.full_name}</td>
                    <td className="py-3 px-4 text-slate-500 font-medium">{m.user.role}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-900">{m.total}</td>
                    <td className="py-3 px-4 text-center font-semibold text-blue-700">{m.newCount}</td>
                    <td className="py-3 px-4 text-center font-semibold text-purple-700">{m.followupCount}</td>
                    <td className="py-3 px-4 text-center font-semibold text-amber-700">{m.notReachableCount}</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-700">{m.convertedCount}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700">₹{m.revenue.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {m.conversionRate}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* LEAD SOURCE CHANNEL BREAKDOWN */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center">
          <Award className="w-4 h-4 mr-2 text-purple-700" /> Channel / Lead Source Breakdown
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#250a42] text-white text-[11px] font-bold uppercase tracking-wider">
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
                  <td className="py-3 px-4 font-bold text-purple-700">{src.source}</td>
                  <td className="py-3 px-4 text-center font-semibold text-slate-800">{src.totalLeads}</td>
                  <td className="py-3 px-4 text-center font-semibold text-purple-700">{src.followupCount}</td>
                  <td className="py-3 px-4 text-center font-semibold text-amber-700">{src.notReachableCount}</td>
                  <td className="py-3 px-4 text-center font-bold text-emerald-700">{src.convertedCount}</td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-700">₹{src.totalRev.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                      {src.rate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FILTERED INQUIRIES REGISTER */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center">
          <PhoneCall className="w-4 h-4 mr-2 text-purple-700" /> Filtered Inquiries Register ({filteredLeads.length} Records)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#250a42] text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Unique ID</th>
                <th className="py-3 px-4">Client Name</th>
                <th className="py-3 px-4">Mobile</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Assigned Caller</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Received Date</th>
                <th className="py-3 px-4 text-right">Deal Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                    {loading ? 'Loading report data...' : 'No leads match the selected filters.'}
                  </td>
                </tr>
              ) : (
                filteredLeads.map(lead => (
                  <tr key={lead.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-purple-700">{lead.unique_lead_id}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{lead.customer_name}</td>
                    <td className="py-3 px-4 font-mono">{lead.mobile_number}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                        {lead.source}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">
                      {lead.assigned_user_name || 'Unassigned'}
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
                    <td className="py-3 px-4 text-right font-bold text-emerald-700">
                      {lead.deal_amount ? `₹${Number(lead.deal_amount).toLocaleString('en-IN')}` : '—'}
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
