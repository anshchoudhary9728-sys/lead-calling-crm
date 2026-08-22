'use client';

import React, { useState } from 'react';
import { Lead, LeadStatus } from '@/types/crm';
import { crmStore } from '@/lib/crm-store';
import { useAuth } from '@/context/AuthContext';
import { formatIST, calculateTimeDelay } from '@/lib/timezone';
import {
  X,
  PhoneCall,
  Clock,
  AlertCircle,
  History,
  CheckCircle2,
  Calendar,
  CalendarCheck,
  DollarSign,
  Send,
  MessageSquare,
  Loader2,
  FileText,
} from 'lucide-react';
import QuotationModal from './QuotationModal';

interface CallDrawerProps {
  lead: Lead | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CallDrawer({ lead, onClose, onSuccess }: CallDrawerProps) {
  const { currentUser } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus>('FOLLOW_UP' as LeadStatus);
  const [remarks, setRemarks] = useState('');
  const [followupDate, setFollowupDate] = useState('');
  const [followupTime, setFollowupTime] = useState('11:00');
  const [callDuration, setCallDuration] = useState('60');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showAllRemarks, setShowAllRemarks] = useState(true);
  const [showQuotationModal, setShowQuotationModal] = useState(false);

  if (!lead) return null;

  const previousCalls = crmStore.getCallLogsForLead(lead.id);
  const lastCall = previousCalls[0];
  const delayInfo = calculateTimeDelay(lead.current_planned_call_at);

  const isFollowupRequired = selectedStatus === 'FOLLOW_UP';
  const isConverted = selectedStatus === 'CONVERTED';

  const handleSaveCall = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!remarks.trim()) {
      setErrorMsg('Remarks are mandatory for every call attempt.');
      return;
    }

    let followupISO: string | null = null;
    if (isFollowupRequired) {
      if (!followupDate) {
        setErrorMsg('Please select a valid Next Follow-up Date & Time.');
        return;
      }
      followupISO = new Date(`${followupDate}T${followupTime}:00`).toISOString();
    }

    setIsSubmitting(true);

    try {
      // Calculate next planned call time based on status
      let nextPlannedAt: string | null = null;
      if (selectedStatus === 'FOLLOW_UP' && followupISO) {
        nextPlannedAt = followupISO;
      } else if (selectedStatus === 'NOT_REACHABLE') {
        nextPlannedAt = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(); // +4 hours
      } else if (selectedStatus === 'CONVERTED') {
        nextPlannedAt = null;
      }

      // Update lead in Supabase database
      const updateTargetId = lead.id || lead.unique_lead_id;
      const res = await fetch(`/api/v1/leads/${updateTargetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_status: selectedStatus,
          current_planned_call_at: nextPlannedAt,
          next_followup_at: selectedStatus === 'FOLLOW_UP' ? followupISO : null,
          deal_amount: isConverted ? (lead.deal_amount || 0) : null,
          remarks: remarks.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update lead status in database.');
      }

      // Also log locally in store if available
      try {
        const existingInStore = crmStore.getLeadById(lead.id);
        if (!existingInStore) {
          (crmStore as any).leads.unshift({ ...lead, current_status: selectedStatus });
        }
        crmStore.logCall({
          lead_id: lead.id,
          user_id: currentUser?.id || 'user-exec-1',
          call_status: selectedStatus,
          remarks: remarks.trim(),
          selected_followup_at: followupISO,
          call_duration_seconds: parseInt(callDuration) || 45,
          deal_amount: isConverted ? (lead.deal_amount || 0) : undefined,
        });
      } catch (localErr) {
        // Non-critical local store error
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save call record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end transition-opacity animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col overflow-hidden border-l border-slate-200">
        
        {/* Drawer Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-sky-500/20 text-sky-400 font-mono text-xs font-bold px-2.5 py-0.5 rounded border border-sky-500/30">
                {lead.unique_lead_id}
              </span>
              <span className="text-xs text-slate-400 font-medium">{lead.source}</span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1 leading-tight">{lead.customer_name}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* CLIENT REQUIREMENT BOX */}
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 space-y-1.5">
            <h3 className="text-xs font-bold text-sky-900 uppercase tracking-wider flex items-center">
              Client Requirement:
            </h3>
            <p className="text-xs text-slate-800 font-medium leading-relaxed">
              {lead.client_requirement || lead.enquiry_message || 'No specific requirement provided.'}
            </p>
          </div>

          {/* CALL NOW & SEND QUOTATION ACTION BUTTONS */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-800">Direct Actions for this Lead</p>
                <p className="text-[11px] text-slate-500">Call client phone or create &amp; send instant fabric quotation via WhatsApp.</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowQuotationModal(true)}
                  className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold px-3.5 py-2.5 rounded-lg flex items-center shadow-md transition transform active:scale-95"
                >
                  <FileText className="w-4 h-4 mr-1.5" />
                  SEND QUOTATION (कोटेशन)
                </button>
                <a
                  href={`tel:${lead.mobile_number}`}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2.5 rounded-lg flex items-center shadow-md transition transform active:scale-95"
                >
                  <PhoneCall className="w-4 h-4 mr-1.5 animate-bounce" />
                  CALL NOW ({lead.mobile_number})
                </a>
              </div>
            </div>
          </div>

          {/* LAST CONVERSATION BOX */}
          <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between border-b border-amber-200 pb-2">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-amber-700" />
                <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                  LAST CONVERSATION (Review Before Calling)
                </h3>
              </div>
              {lastCall && (
                <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
                  {lastCall.call_status}
                </span>
              )}
            </div>

            {lastCall ? (
              <div className="text-xs text-slate-800 space-y-1 pt-1">
                <div className="flex justify-between text-[11px] text-slate-600 font-medium">
                  <span>Caller: <strong>{lastCall.user_name}</strong></span>
                  <span>Date: <strong>{formatIST(lastCall.created_at)}</strong></span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-amber-200 text-slate-900 font-semibold italic text-xs mt-1">
                  "{lastCall.remarks}"
                </div>
                {lastCall.next_followup_at && (
                  <p className="text-[11px] text-amber-900 font-semibold pt-1">
                    Scheduled Follow-up: {formatIST(lastCall.next_followup_at)}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-amber-800 italic pt-1">
                No previous call history. This is the <strong>FIRST CALL</strong> attempt for this lead.
              </p>
            )}
          </div>

          {/* PREVIOUS REMARKS TIMELINE */}
          {previousCalls.length > 1 && (
            <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
              <div
                className="flex items-center justify-between cursor-pointer select-none"
                onClick={() => setShowAllRemarks(!showAllRemarks)}
              >
                <div className="flex items-center space-x-2">
                  <History className="w-4 h-4 text-slate-600" />
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    All Previous Remarks History ({previousCalls.length} Attempts)
                  </h4>
                </div>
                <span className="text-xs text-sky-600 font-semibold hover:underline">
                  {showAllRemarks ? 'Hide' : 'View All'}
                </span>
              </div>

              {showAllRemarks && (
                <div className="space-y-3 pt-2 border-t border-slate-100 max-h-48 overflow-y-auto">
                  {previousCalls.map((call) => (
                    <div key={call.id} className="text-xs bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                      <div className="flex justify-between font-semibold text-slate-700">
                        <span>Attempt #{call.attempt_number} — {call.user_name}</span>
                        <span className="text-slate-500 font-mono">{formatIST(call.created_at)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-200 text-slate-800">
                          {call.call_status}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{call.call_duration_seconds}s duration</span>
                      </div>
                      <p className="text-slate-800 font-medium pt-1">"{call.remarks}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CALL DISPOSITION FORM */}
          <form onSubmit={handleSaveCall} className="bg-slate-50 border border-slate-300 p-5 rounded-xl space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-1.5 text-sky-600" /> Log Call Disposition & Reschedule
            </h3>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 text-rose-600 flex-shrink-0" />
                {errorMsg}
              </div>
            )}

            {/* 3 Outcome Buttons */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Call Outcome <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedStatus('FOLLOW_UP')}
                  className={`p-3 rounded-xl border-2 text-xs font-bold flex flex-col items-center justify-center gap-1 transition ${
                    selectedStatus === 'FOLLOW_UP'
                      ? 'border-sky-500 bg-sky-50 text-sky-700 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-sky-300'
                  }`}
                >
                  <CalendarCheck className="w-5 h-5" />
                  Follow-up
                  <span className="text-[10px] font-normal opacity-70">Set Date &amp; Time</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStatus('NOT_REACHABLE')}
                  className={`p-3 rounded-xl border-2 text-xs font-bold flex flex-col items-center justify-center gap-1 transition ${
                    selectedStatus === 'NOT_REACHABLE'
                      ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-amber-300'
                  }`}
                >
                  <PhoneCall className="w-5 h-5" />
                  Not Reachable
                  <span className="text-[10px] font-normal opacity-70">Auto +4 Hr</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStatus('CONVERTED')}
                  className={`p-3 rounded-xl border-2 text-xs font-bold flex flex-col items-center justify-center gap-1 transition ${
                    selectedStatus === 'CONVERTED'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-emerald-300'
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Converted
                  <span className="text-[10px] font-normal opacity-70">Deal Won 🎉</span>
                </button>
              </div>
            </div>

            {/* Conditional Follow-up Date/Time Picker */}
            {isFollowupRequired && (
              <div className="grid grid-cols-2 gap-3 bg-white p-3 border border-slate-200 rounded-lg">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center">
                    <Calendar className="w-3 h-3 mr-1 text-sky-600" /> Next Follow-up Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={followupDate}
                    onChange={e => setFollowupDate(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center">
                    <Clock className="w-3 h-3 mr-1 text-sky-600" /> Follow-up Time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={followupTime}
                    onChange={e => setFollowupTime(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Mandatory Call Remarks */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Call Conversation Remarks <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                placeholder="Detail customer response, requirement updates, pricing discussed, or next steps..."
                className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            {/* Save Button */}
            <div className="pt-2 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-6 py-2.5 rounded-lg flex items-center shadow-md transition transform active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    SAVING...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    SAVE CALL &amp; UPDATE STATUS
                  </>
                )}
              </button>
            </div>
          </form>

        </div>
      </div>

      {/* Quotation Modal */}
      {showQuotationModal && (
        <QuotationModal
          lead={lead}
          onClose={() => setShowQuotationModal(false)}
          onSuccess={() => {
            setShowQuotationModal(false);
          }}
        />
      )}
    </div>
  );
}

