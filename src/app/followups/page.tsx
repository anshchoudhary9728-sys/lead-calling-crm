'use client';

import React, { useState } from 'react';
import { crmStore } from '@/lib/crm-store';
import { formatIST } from '@/lib/timezone';
import { CalendarCheck, CheckCircle, Clock, PhoneCall, CheckCircle2 } from 'lucide-react';
import CallDrawer from '@/components/crm/CallDrawer';
import { Lead } from '@/types/crm';

export default function FollowupsPage() {
  const followups = crmStore.getFollowups();
  const [selectedLeadForCall, setSelectedLeadForCall] = useState<Lead | null>(null);

  const handleComplete = (id: string) => {
    crmStore.markFollowupCompleted(id);
    window.location.reload();
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-black text-slate-900 flex items-center">
          <CalendarCheck className="w-6 h-6 mr-2 text-sky-600" /> DEDICATED FOLLOW-UPS TRACKER
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Track, manage, and complete scheduled customer follow-up calls.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Follow-up Date & Time</th>
                <th className="py-3.5 px-4">Unique ID</th>
                <th className="py-3.5 px-4">Customer Name</th>
                <th className="py-3.5 px-4">Mobile</th>
                <th className="py-3.5 px-4">Remarks</th>
                <th className="py-3.5 px-4">Assigned Caller</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {followups.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                    No follow-ups recorded yet.
                  </td>
                </tr>
              ) : (
                followups.map(fol => {
                  const lead = crmStore.getLeadById(fol.lead_id);
                  const isCompleted = fol.followup_status === 'COMPLETED';

                  return (
                    <tr key={fol.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-bold text-sky-700 whitespace-nowrap">
                        {formatIST(fol.followup_at)}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        {fol.lead_unique_id}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{fol.customer_name}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">{fol.mobile_number}</td>
                      <td className="py-3.5 px-4 max-w-xs truncate italic">"{fol.remarks}"</td>
                      <td className="py-3.5 px-4 font-medium">{fol.assigned_user_name}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                            isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {fol.followup_status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-2">
                          {!isCompleted && (
                            <button
                              onClick={() => handleComplete(fol.id)}
                              className="px-2.5 py-1 text-[11px] font-bold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 rounded-lg"
                            >
                              Mark Done
                            </button>
                          )}
                          {lead && (
                            <button
                              onClick={() => setSelectedLeadForCall(lead)}
                              className="px-2.5 py-1 text-[11px] font-bold bg-sky-600 text-white hover:bg-sky-700 rounded-lg flex items-center"
                            >
                              <PhoneCall className="w-3 h-3 mr-1" /> Call Now
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedLeadForCall && (
        <CallDrawer
          lead={selectedLeadForCall}
          onClose={() => setSelectedLeadForCall(null)}
          onSuccess={() => setSelectedLeadForCall(null)}
        />
      )}
    </div>
  );
}
