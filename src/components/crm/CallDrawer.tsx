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
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex justify-end transition-opacity animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col overflow-hidden border-l border-slate-200">
        
        {/* Drawer Header */}
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between border-b border-slate-800">
          <div className="min-w-0 pr-2">
            <div className="flex items-center space-x-2">
              <span className="bg-sky-500/20 text-sky-400 font-mono text-[11px] sm:text-xs font-bold px-2 py-0.5 rounded border border-sky-500/30 truncate">
                {lead.unique_lead_id}
              </span>
              <span className="text-[11px] sm:text-xs text-slate-400 font-medium truncate">{lead.source}</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white mt-1 leading-tight truncate">{lead.customer_name}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition flex-shrink-0"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 pb-24 md:pb-6">
          
          {/* CLIENT REQUIREMENT BOX */}
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-3.5 sm:p-4 space-y-1">
            <h3 className="text-[11px] sm:text-xs font-bold text-sky-900 uppercase tracking-wider flex items-center">
              Client Requirement:
            </h3>
            <p className="text-xs text-slate-800 font-medium leading-relaxed">
              {lead.client_requirement || lead.enquiry_message || 'No specific requirement provided.'}
            </p>
          </div>

          {/* CALL NOW & SEND QUOTATION ACTION BUTTONS */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 space-y-3 shadow-sm">
            <div className="flex flex-col gap-2.5">
              <div>
                <p className="text-xs font-bold text-slate-800">Direct Actions for this Lead</p>
                <p className="text-[11px] text-slate-500">Call client phone or create &amp; send instant fabric quotation via WhatsApp.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                <button
                  type="button"
                  onClick={() => setShowQuotationModal(true)}
                  className="w-full bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl flex items-center justify-center shadow-md transition transform active:scale-95"
                >
                  <FileText className="w-4 h-4 mr-1.5" />
                  SEND QUOTATION (कोटेशन)
                </button>
                <a
                  href={`tel:${lead.mobile_number}`}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl flex items-center justify-center shadow-md transition transform active:scale-95"
                >
                  <PhoneCall className="w-4 h-4 mr-1.5 animate-bounce" />
                  CALL NOW ({lead.mobile_number})
                </a>
              </div>
            </div>
          </div>

          {/* LAST CONVERSATION BOX */}
          <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3.5 sm:p-4 space-y-2">
            <div className="flex items-center justify-between border-b border-amber-200 pb-2">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-amber-700 flex-shrink-0" />
                <h3 className="text-[11px] sm:text-xs font-bold text-amber-900 uppercase tracking-wider">
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
              <p className="text-xs text-amber-800 italic">No previous conversation recorded for this lead. Make the initial call now.</p>
            )}
          </div>

          {/* ALL PREVIOUS CALL HISTORY */}
          {previousCalls.length > 1 && (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <button
                type="button"
                onClick={() => setShowAllRemarks(!showAllRemarks)}
                className="w-full bg-slate-100 px-4 py-2.5 flex items-center justify-between text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
              >
                <span className="flex items-center">
                  <History className="w-3.5 h-3.5 mr-1.5 text-purple-700" />
                  Full Conversation History ({previousCalls.length} logs)
                </span>
                <span className="text-purple-700 font-bold">{showAllRemarks ? 'Hide ▲' : 'Show ▼'}</span>
              </button>

              {showAllRemarks && (
                <div className="divide-y divide-slate-100 bg-white max-h-48 overflow-y-auto">
                  {previousCalls.map(c => (
                    <div key={c.id} className="p-3 text-xs space-y-1 hover:bg-slate-50">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-bold text-slate-900">{formatIST(c.created_at)}</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[9px] font-bold">
                          {c.call_status} ({c.call_duration_seconds}s)
                        </span>
                      </div>
                      <p className="text-slate-700 italic">"{c.remarks}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* FORM: UPDATE CALL STATUS & REMARKS */}
          <form onSubmit={handleSaveCall} className="space-y-4 pt-2 border-t border-slate-200">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              Log Current Call Outcome (कॉल परिणाम दर्ज करें)
            </h3>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Status Selection Cards */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Select Call Outcome Status <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedStatus('FOLLOW_UP')}
                  className={`p-2.5 sm:p-3 rounded-xl border-2 text-[11px] sm:text-xs font-bold flex flex-col items-center justify-center gap-1 transition ${
                    selectedStatus === 'FOLLOW_UP'
                      ? 'border-sky-500 bg-sky-50 text-sky-700 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-sky-300'
                  }`}
                >
                  <CalendarCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Follow-up</span>
                  <span className="text-[9px] sm:text-[10px] font-normal opacity-70">Set Time</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStatus('NOT_REACHABLE')}
                  className={`p-2.5 sm:p-3 rounded-xl border-2 text-[11px] sm:text-xs font-bold flex flex-col items-center justify-center gap-1 transition ${
                    selectedStatus === 'NOT_REACHABLE'
                      ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-amber-300'
                  }`}
                >
                  <PhoneCall className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Not Reach</span>
                  <span className="text-[9px] sm:text-[10px] font-normal opacity-70">Auto +4 Hr</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStatus('CONVERTED')}
                  className={`p-2.5 sm:p-3 rounded-xl border-2 text-[11px] sm:text-xs font-bold flex flex-col items-center justify-center gap-1 transition ${
                    selectedStatus === 'CONVERTED'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-emerald-300'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Converted</span>
                  <span className="text-[9px] sm:text-[10px] font-normal opacity-70">Won 🎉</span>
                </button>
              </div>
            </div>

            {/* Conditional Follow-up Date/Time Picker */}
            {isFollowupRequired && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3 border border-slate-200 rounded-xl">
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
                className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            {/* Save Button */}
            <div className="pt-2 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition text-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold px-6 py-2.5 rounded-xl flex items-center justify-center shadow-md transition transform active:scale-95 disabled:opacity-50"
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
