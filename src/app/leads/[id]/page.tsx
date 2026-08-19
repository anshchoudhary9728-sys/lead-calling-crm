'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import CallDrawer from '@/components/crm/CallDrawer';
import { crmStore } from '@/lib/crm-store';
import { formatIST } from '@/lib/timezone';
import {
  ArrowLeft,
  PhoneCall,
  User,
  Building,
  MapPin,
  Mail,
  Clock,
  History,
  FileText,
  CheckCircle2,
  Calendar,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';

export default function LeadProfileDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const lead = crmStore.getLeadById(id);
  const [selectedForCall, setSelectedForCall] = useState(false);

  if (!lead) {
    return (
      <div className="p-12 text-center text-slate-500">
        <p className="text-lg font-bold text-slate-800">Lead Not Found</p>
        <p className="text-xs text-slate-500 mt-1">The requested unique lead ID or UUID does not exist.</p>
        <Link href="/leads" className="text-xs font-bold text-sky-600 hover:underline mt-4 inline-block">
          Return to Leads Directory
        </Link>
      </div>
    );
  }

  const callLogs = crmStore.getCallLogsForLead(lead.id);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      
      {/* Back Link */}
      <div className="flex items-center justify-between">
        <Link href="/leads" className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Leads Directory
        </Link>
        <button
          onClick={() => setSelectedForCall(true)}
          className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center shadow-sm"
        >
          <PhoneCall className="w-3.5 h-3.5 mr-1.5" /> MAKE CALL / UPDATE DISPOSITION
        </button>
      </div>

      {/* LEAD HEADER CARD */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-sky-100 text-sky-800 font-mono text-xs font-bold px-2.5 py-0.5 rounded">
                {lead.unique_lead_id}
              </span>
              <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-0.5 rounded">
                {lead.source}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-1">{lead.customer_name}</h1>
          </div>
          <div className="flex items-center space-x-3">
            <span className="px-3 py-1 text-xs font-extrabold uppercase rounded-full bg-sky-100 text-sky-800 border border-sky-200">
              {lead.current_status}
            </span>
          </div>
        </div>

        {/* DETAILS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Contact Details</p>
            <p className="flex items-center font-bold text-slate-900"><PhoneCall className="w-3.5 h-3.5 mr-2 text-sky-600" /> {lead.mobile_number}</p>
            {lead.email && <p className="flex items-center text-slate-600"><Mail className="w-3.5 h-3.5 mr-2 text-slate-400" /> {lead.email}</p>}
            {lead.city && <p className="flex items-center text-slate-600"><MapPin className="w-3.5 h-3.5 mr-2 text-slate-400" /> {lead.city}, {lead.state || ''}</p>}
          </div>

          <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Calling & Assignment</p>
            <p className="flex items-center text-slate-700">Assigned Exec: <strong className="ml-1 text-slate-900">{lead.assigned_user_name || 'Unassigned'}</strong></p>
            <p className="flex items-center text-slate-700">Planned Call: <strong className="ml-1 text-sky-700">{formatIST(lead.current_planned_call_at)}</strong></p>
            <p className="flex items-center text-slate-700">Total Attempts: <strong className="ml-1 text-slate-900">{lead.total_call_attempts}</strong></p>
          </div>

          <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Requirement Details</p>
            <p className="text-slate-800 font-medium leading-relaxed">{lead.client_requirement || lead.enquiry_message || 'No requirement specified.'}</p>
          </div>
        </div>
      </div>

      {/* COMPLETE CALL & REMARKS HISTORY TIMELINE (REQ 31, 33, 34) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
          <History className="w-5 h-5 text-sky-600" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Complete Conversation & Remarks History ({callLogs.length} Records)
          </h2>
        </div>

        {callLogs.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-4">No calls logged yet. Lead is waiting in initial planned queue.</p>
        ) : (
          <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-6 py-2">
            {callLogs.map(log => (
              <div key={log.id} className="relative">
                {/* Timeline Dot */}
                <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-sky-600 border-4 border-white shadow-sm" />

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span className="flex items-center">
                      <User className="w-3.5 h-3.5 mr-1 text-sky-600" />
                      Attempt #{log.attempt_number} — {log.user_name}
                    </span>
                    <span className="text-slate-500 font-mono">{formatIST(log.created_at)}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-sky-100 text-sky-800">
                      {log.call_status}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{log.call_duration_seconds}s duration</span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200 text-slate-900 font-medium italic">
                    "{log.remarks}"
                  </div>

                  {log.next_followup_at && (
                    <p className="text-[11px] text-purple-700 font-semibold pt-1">
                      Scheduled Follow-up for: {formatIST(log.next_followup_at)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Call Drawer */}
      {selectedForCall && (
        <CallDrawer
          lead={lead}
          onClose={() => setSelectedForCall(false)}
          onSuccess={() => setSelectedForCall(false)}
        />
      )}
    </div>
  );
}
