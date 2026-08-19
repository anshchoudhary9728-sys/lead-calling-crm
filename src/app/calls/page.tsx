'use client';

import React from 'react';
import { crmStore } from '@/lib/crm-store';
import { formatIST } from '@/lib/timezone';
import { Phone, Clock, User, FileText } from 'lucide-react';

export default function CallsHistoryPage() {
  const leads = crmStore.getLeads();
  
  // Flatten all call logs
  const allCalls = leads
    .flatMap(lead =>
      crmStore.getCallLogsForLead(lead.id).map(log => ({
        ...log,
        unique_lead_id: lead.unique_lead_id,
        customer_name: lead.customer_name,
        mobile_number: lead.mobile_number,
      }))
    )
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-black text-slate-900 flex items-center">
          <Phone className="w-6 h-6 mr-2 text-sky-600" /> IMMUTABLE CALL HISTORY LOGS
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Complete historical register of every phone attempt, remarks, duration, and disposition.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Call Timestamp</th>
                <th className="py-3.5 px-4">Unique Lead ID</th>
                <th className="py-3.5 px-4">Client Name</th>
                <th className="py-3.5 px-4">Caller</th>
                <th className="py-3.5 px-4">Attempt #</th>
                <th className="py-3.5 px-4">Duration</th>
                <th className="py-3.5 px-4">Outcome Status</th>
                <th className="py-3.5 px-4 max-w-md">Call Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {allCalls.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 italic">No calls logged yet.</td>
                </tr>
              ) : (
                allCalls.map(call => (
                  <tr key={call.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-600">{formatIST(call.created_at)}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-sky-700">{call.unique_lead_id}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{call.customer_name}</td>
                    <td className="py-3.5 px-4 font-medium">{call.user_name}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">#{call.attempt_number}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">{call.call_duration_seconds}s</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                        {call.call_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-md italic text-slate-800">"{call.remarks}"</td>
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
