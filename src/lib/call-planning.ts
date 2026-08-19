import { Lead, LeadStatus, CRMConfigSettings } from '@/types/crm';
import { addMinutesToDate, addHoursToDate } from './timezone';

export interface PlannedCallResult {
  nextPlannedCallAt: string | null;
  nextFollowupAt: string | null;
  newLeadStatus: LeadStatus;
  changeReason: string;
}

/**
 * Core Call Planning Rule Engine
 * Calculates when the next planned call should happen based on call disposition and Admin settings.
 */
export function calculateNextPlannedCall(
  currentStatus: LeadStatus,
  disposition: LeadStatus,
  actualCallTimeISO: string,
  selectedFollowupISO: string | null,
  config: CRMConfigSettings
): PlannedCallResult {
  switch (disposition) {
    case 'NOT_REACHABLE':
      return {
        nextPlannedCallAt: addHoursToDate(actualCallTimeISO, config.not_reachable_retry_hours),
        nextFollowupAt: null,
        newLeadStatus: 'NOT_REACHABLE',
        changeReason: `Not Reachable retry scheduled (+${config.not_reachable_retry_hours} hours)`,
      };

    case 'BUSY':
      return {
        nextPlannedCallAt: addMinutesToDate(actualCallTimeISO, config.busy_retry_minutes),
        nextFollowupAt: null,
        newLeadStatus: 'BUSY',
        changeReason: `Busy retry scheduled (+${config.busy_retry_minutes} minutes)`,
      };

    case 'FOLLOW_UP':
    case 'CALL_BACK':
    case 'INTERESTED':
      if (!selectedFollowupISO) {
        throw new Error('Next follow-up date and time is mandatory for Follow-up / Call Back / Interested disposition');
      }
      return {
        nextPlannedCallAt: selectedFollowupISO,
        nextFollowupAt: selectedFollowupISO,
        newLeadStatus: disposition,
        changeReason: `Follow-up manually scheduled for ${selectedFollowupISO}`,
      };

    case 'CONVERTED':
      return {
        nextPlannedCallAt: null,
        nextFollowupAt: null,
        newLeadStatus: 'CONVERTED',
        changeReason: 'Lead marked as Converted (Deal Won)',
      };

    case 'NOT_INTERESTED':
    case 'LOST':
    case 'WRONG_NUMBER':
      return {
        nextPlannedCallAt: null,
        nextFollowupAt: null,
        newLeadStatus: disposition,
        changeReason: `Lead closed with status: ${disposition}`,
      };

    default:
      // Fallback
      return {
        nextPlannedCallAt: selectedFollowupISO || addMinutesToDate(actualCallTimeISO, 60),
        nextFollowupAt: selectedFollowupISO,
        newLeadStatus: disposition,
        changeReason: `Status updated to ${disposition}`,
      };
  }
}

/**
 * Calculates initial planned call time when a NEW lead enters the CRM.
 * Formula: Lead Received Time + Configured New Lead First Call Delay (e.g., +10 Minutes)
 */
export function calculateInitialPlannedCall(leadReceivedISO: string, config: CRMConfigSettings): string {
  return addMinutesToDate(leadReceivedISO, config.new_lead_call_delay_minutes);
}

/**
 * Sorts leads for the Priority Calling Dashboard Queue:
 * Priority 1: Overdue calls (current_planned_call_at < NOW), sorted ASC (most overdue first)
 * Priority 2: Due calls (current_planned_call_at = NOW)
 * Priority 3: Upcoming calls (current_planned_call_at > NOW), sorted ASC
 */
export function sortLeadsByPlannedPriority(leads: Lead[], referenceTime: Date = new Date()): Lead[] {
  return [...leads].sort((a, b) => {
    // Leads without planned call time go to the end
    if (!a.current_planned_call_at && !b.current_planned_call_at) return 0;
    if (!a.current_planned_call_at) return 1;
    if (!b.current_planned_call_at) return -1;

    const timeA = new Date(a.current_planned_call_at).getTime();
    const timeB = new Date(b.current_planned_call_at).getTime();
    const nowTime = referenceTime.getTime();

    const isOverdueA = timeA < nowTime;
    const isOverdueB = timeB < nowTime;

    // If both are overdue, earliest planned time (most overdue) comes first
    if (isOverdueA && isOverdueB) {
      return timeA - timeB;
    }

    // Overdue lead takes priority over non-overdue
    if (isOverdueA && !isOverdueB) return -1;
    if (!isOverdueA && isOverdueB) return 1;

    // Both are upcoming, earliest planned time comes first
    return timeA - timeB;
  });
}
