'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { formatIST } from '@/lib/timezone';
import { CheckCircle2, RefreshCw, Lock, Save, Loader2, DollarSign, Check, AlertCircle } from 'lucide-react';
import CrmQueueFilterBar, { FilterValues } from '@/components/crm/CrmQueueFilterBar';
import { Lead } from '@/types/crm';

export default function ConvertedDealsPage() {
  const [convertedLeads, setConvertedLeads] = useState<Lead[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [savingLeadId, setSavingLeadId] = useState<string | null>(null);
  const [inputAmounts, setInputAmounts] = useState<{ [leadId: string]: string }>({});
  const [notificationMsg, setNotificationMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

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

  // Handle manual saving of deal revenue (allowed only once when deal_amount is 0 or empty)
  const handleSaveRevenue = async (lead: Lead) => {
    const leadKey = lead.id || lead.unique_lead_id;
    const rawVal = inputAmounts[leadKey];
    const numVal = parseFloat(rawVal);

    if (isNaN(numVal) || numVal <= 0) {
      setNotificationMsg({ text: 'Please enter a valid Deal Revenue amount greater than 0.', type: 'error' });
      setTimeout(() => setNotificationMsg(null), 3500);
      return;
    }

    setSavingLeadId(leadKey);
    setNotificationMsg(null);

    try {
      const res = await fetch(`/api/v1/leads/${leadKey}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deal_amount: numVal,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save Deal Revenue.');
      }

      // Update state immediately so it locks permanently
      setConvertedLeads(prev =>
        prev.map(l => {
          if ((l.id && l.id === lead.id) || l.unique_lead_id === lead.unique_lead_id) {
            return { ...l, deal_amount: numVal };
          }
          return l;
        })
      );

      setNotificationMsg({
        text: `Deal Revenue ₹${numVal.toLocaleString('en-IN')} successfully recorded and locked for ${lead.customer_name}!`,
        type: 'success',
      });
      setTimeout(() => setNotificationMsg(null), 4000);
    } catch (err: any) {
      setNotificationMsg({ text: err.message || 'Error saving revenue', type: 'error' });
      setTimeout(() => setNotificationMsg(null), 4000);
    } finally {
      setSavingLeadId(null);
    }
  };

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
            Archived converted leads. Deal revenue can be entered once for new deals and locks permanently.
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

      {/* Notification Toast */}
      {notificationMsg && (
        <div
          className={`p-3 text-xs font-bold rounded-xl flex items-center shadow-sm transition ${
            notificationMsg.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {notificationMsg.type === 'success' ? (
            <Check className="w-4 h-4 mr-2 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 mr-2 text-rose-600 flex-shrink-0" />
          )}
          <span>{notificationMsg.text}</span>
        </div>
      )}

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
                <th className="py-3.5 px-4 text-right min-w-[190px]">Deal Revenue</th>
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
                filteredLeads.map(lead => {
                  const leadKey = lead.id || lead.unique_lead_id;
                  const currentAmount = Number(lead.deal_amount) || 0;
                  const isLocked = currentAmount > 0;
                  const isSavingThis = savingLeadId === leadKey;

                  return (
                    <tr key={lead.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-mono font-bold text-purple-700">{lead.unique_lead_id}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{lead.customer_name}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        <a href={`tel:${lead.mobile_number}`} className="text-purple-700 hover:underline">
                          {lead.mobile_number}
                        </a>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">{lead.city || 'Surat'}</td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-[200px] truncate">
                        {lead.client_requirement || lead.enquiry_message || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {lead.source}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-600">
                        {lead.converted_at
                          ? formatIST(lead.converted_at)
                          : lead.updated_at
                          ? formatIST(lead.updated_at)
                          : '—'}
                      </td>

                      {/* Deal Revenue Column: Editable ONLY if 0, Permanently Locked once entered */}
                      <td className="py-3.5 px-4 text-right">
                        {isLocked ? (
                          /* Locked State: Cannot be edited once entered */
                          <div className="flex items-center justify-end space-x-1.5">
                            <span className="font-black text-emerald-700 font-mono text-sm">
                              ₹{currentAmount.toLocaleString('en-IN')}
                            </span>
                            <span
                              className="inline-flex items-center text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-bold"
                              title="Revenue recorded & locked"
                            >
                              <Lock className="w-2.5 h-2.5 mr-0.5 text-emerald-600" /> Locked
                            </span>
                          </div>
                        ) : (
                          /* Editable State: When Deal Revenue is 0 */
                          <div className="flex items-center justify-end space-x-1.5">
                            <div className="relative w-28">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                                ₹
                              </span>
                              <input
                                type="number"
                                placeholder="Enter Amt"
                                value={inputAmounts[leadKey] ?? ''}
                                onChange={e =>
                                  setInputAmounts({ ...inputAmounts, [leadKey]: e.target.value })
                                }
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    handleSaveRevenue(lead);
                                  }
                                }}
                                disabled={isSavingThis}
                                className="w-full pl-5 pr-2 py-1 bg-amber-50/60 border border-amber-300 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-400 focus:outline-none"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSaveRevenue(lead)}
                              disabled={isSavingThis || !inputAmounts[leadKey]}
                              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-[11px] px-2.5 py-1 rounded-lg flex items-center shadow-sm transition"
                              title="Save Deal Revenue (Locked after saving)"
                            >
                              {isSavingThis ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <>
                                  <Save className="w-3 h-3 mr-1" /> Save
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
