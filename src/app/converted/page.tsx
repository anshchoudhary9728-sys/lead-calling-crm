'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { formatIST } from '@/lib/timezone';
import { CheckCircle2, RefreshCw } from 'lucide-react';
import CrmQueueFilterBar, { FilterValues } from '@/components/crm/CrmQueueFilterBar';
import { Lead } from '@/types/crm';

export default function ConvertedDealsPage() {
  const [convertedLeads, setConvertedLeads] = useState<Lead[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const [filters, setFilters] = useState<FilterValues>({
    search: '',
    date: '',
    datePreset: 'ALL',
    source: 'ALL',
  });

  const loadConverted = () => {
    fetch(`/api/v1/leads?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    })
      .then(r => r.json())
      .then(data => {
        const all: Lead[] = data.leads || [];
        const converted = all
          .filter(l => l.current_status === 'CONVERTED')
          .sort((a, b) => {
            const aTime = a.converted_at || a.updated_at;
            const bTime = b.converted_at || b.updated_at;
            const aNum = aTime ? new Date(aTime).getTime() : 0;
            const bNum = bTime ? new Date(bTime).getTime() : 0;
            return bNum - aNum;
          });
        setConvertedLeads(converted);
      })
      .catch(() => setConvertedLeads([]));
  };

  useEffect(() => {
    loadConverted();
  }, [refreshKey]);

  // Filtered Converted Leads
  const filteredLeads = useMemo(() => {
    return convertedLeads.filter(lead => {
      // 1. Search filter (Name, Mobile, Unique ID, Requirement)
      if (filters.search) {
        const q = filters.search.toLowerCase().trim();
        const match =
          lead.unique_lead_id?.toLowerCase().includes(q) ||
          lead.customer_name?.toLowerCase().includes(q) ||
          lead.mobile_number?.includes(q) ||
          (lead.city && lead.city.toLowerCase().includes(q)) ||
          (lead.client_requirement && lead.client_requirement.toLowerCase().includes(q)) ||
          (lead.enquiry_message && lead.enquiry_message.toLowerCase().includes(q));
        if (!match) return false;
      }

      // 2. Calendar Date filter
      if (filters.date) {
        const cTime = lead.converted_at || lead.updated_at || '';
        const cDate = cTime.substring(0, 10);
        if (cDate !== filters.date) return false;
      }

      // 3. Source filter
      if (filters.source && filters.source !== 'ALL') {
        if (lead.source !== filters.source) return false;
      }

      return true;
    });
  }, [convertedLeads, filters]);

  const totalRevenue = filteredLeads.reduce((sum, l) => sum + (Number(l.deal_amount) || 0), 0);

  return (
    <div className="p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center">
            <CheckCircle2 className="w-6 h-6 mr-2 text-emerald-600" /> CONVERTED DEALS &amp; WON SALES
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Archived converted leads with deal revenue metrics and conversion history.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl text-right shadow-sm">
            <p className="text-[10px] font-bold text-emerald-700 uppercase">Filtered Deals Revenue</p>
            <p className="text-lg font-black text-emerald-800 font-mono">₹{totalRevenue.toLocaleString('en-IN')}</p>
          </div>
          <button
            onClick={() => {
              setRefreshKey(k => k + 1);
              loadConverted();
            }}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg flex items-center shadow-sm transition"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-slate-500" /> Refresh
          </button>
        </div>
      </div>

      {/* FILTERS TOOLBAR */}
      <CrmQueueFilterBar
        filters={filters}
        onFilterChange={setFilters}
        totalCount={convertedLeads.length}
        filteredCount={filteredLeads.length}
        placeholder="Search Converted Deals by Name, Mobile, Unique ID, Fabric..."
        dateLabel="Filter by Deal Conversion Date"
      />

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#250a42] text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Unique ID</th>
                <th className="py-3.5 px-4">Client Name</th>
                <th className="py-3.5 px-4">Mobile</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Requirement</th>
                <th className="py-3.5 px-4">Source</th>
                <th className="py-3.5 px-4">Conversion Date</th>
                <th className="py-3.5 px-4 text-right">Deal Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 italic">
                    {convertedLeads.length === 0
                      ? 'No converted deals recorded yet. Convert a lead during a call to archive it here.'
                      : 'No converted deals match the selected filters.'}
                  </td>
                </tr>
              ) : (
                filteredLeads.map(lead => (
                  <tr key={lead.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-mono font-bold text-purple-700">{lead.unique_lead_id}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{lead.customer_name}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      <a href={`tel:${lead.mobile_number}`} className="text-purple-700 hover:underline">
                        {lead.mobile_number}
                      </a>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">{lead.city || 'Surat'}</td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-[200px] truncate">{lead.client_requirement || lead.enquiry_message || 'N/A'}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {lead.source}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-600">
                      {lead.converted_at ? formatIST(lead.converted_at) : lead.updated_at ? formatIST(lead.updated_at) : '—'}
                    </td>
                    <td className="py-3.5 px-4 font-black text-emerald-700 font-mono text-right text-sm">
                      ₹{(Number(lead.deal_amount) || 0).toLocaleString('en-IN')}
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
