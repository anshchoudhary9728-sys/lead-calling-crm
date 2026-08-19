'use client';

import React from 'react';
import { crmStore } from '@/lib/crm-store';
import { formatIST } from '@/lib/timezone';
import { CheckCircle2, DollarSign, TrendingUp } from 'lucide-react';

export default function ConvertedDealsPage() {
  const convertedLeads = crmStore.getLeads().filter(l => l.current_status === 'CONVERTED');
  const totalRevenue = convertedLeads.reduce((sum, l) => sum + (l.deal_amount || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center">
            <CheckCircle2 className="w-6 h-6 mr-2 text-emerald-600" /> CONVERTED DEALS & WON SALES
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Archived converted leads with deal revenue metrics and conversion history.
          </p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl text-right">
          <p className="text-[10px] font-bold text-emerald-700 uppercase">Total Revenue Won</p>
          <p className="text-lg font-black text-emerald-800">₹{totalRevenue.toLocaleString('en-IN')}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Unique ID</th>
                <th className="py-3.5 px-4">Client Name</th>
                <th className="py-3.5 px-4">Mobile</th>
                <th className="py-3.5 px-4">Product / Requirement</th>
                <th className="py-3.5 px-4">Conversion Date</th>
                <th className="py-3.5 px-4">Deal Revenue</th>
                <th className="py-3.5 px-4">Converted By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {convertedLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 italic">No converted deals recorded yet.</td>
                </tr>
              ) : (
                convertedLeads.map(lead => (
                  <tr key={lead.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-mono font-bold text-sky-700">{lead.unique_lead_id}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{lead.customer_name}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{lead.mobile_number}</td>
                    <td className="py-3.5 px-4 text-slate-600">{lead.client_requirement || lead.product || 'N/A'}</td>
                    <td className="py-3.5 px-4 whitespace-nowrap">{formatIST(lead.converted_at)}</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700">₹{(lead.deal_amount || 0).toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4 font-medium">{lead.assigned_user_name}</td>
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
