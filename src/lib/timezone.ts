import { format, formatDistanceToNow, parseISO, isAfter, isBefore, differenceInMinutes, differenceInHours } from 'date-fns';

export const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Format ISO date string into readable IST Date + Time
 * e.g., "19 Aug, 4:30 PM" or "19 Aug 2026, 04:30 PM"
 */
export function formatIST(dateStr: string | null | undefined, includeYear: boolean = false): string {
  if (!dateStr) return 'N/A';
  try {
    const date = parseISO(dateStr);
    const pattern = includeYear ? 'dd MMM yyyy, hh:mm a' : 'dd MMM, hh:mm a';
    return format(date, pattern);
  } catch (err) {
    return dateStr;
  }
}

/**
 * Format ISO date string into readable IST Time only
 * e.g., "04:30 PM"
 */
export function formatISTTime(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A';
  try {
    const date = parseISO(dateStr);
    return format(date, 'hh:mm a');
  } catch (err) {
    return dateStr;
  }
}

/**
 * Format ISO date string into readable IST Date only
 * e.g., "19 Aug 2026"
 */
export function formatISTDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A';
  try {
    const date = parseISO(dateStr);
    return format(date, 'dd MMM yyyy');
  } catch (err) {
    return dateStr;
  }
}

/**
 * Computes exact Time Delay string relative to planned call time.
 * If Overdue: Returns e.g. "25 Min Late", "1 Hr 35 Min Late"
 * If Upcoming: Returns e.g. "In 10 Min", "In 2 Hr"
 * If Due Now (< 2 min difference): Returns "Due Now"
 */
export function calculateTimeDelay(plannedCallAt: string | null | undefined, referenceTime: Date = new Date()): {
  text: string;
  isOverdue: boolean;
  isDueNow: boolean;
  delayMinutes: number;
} {
  if (!plannedCallAt) {
    return { text: 'No Call Planned', isOverdue: false, isDueNow: false, delayMinutes: 0 };
  }

  try {
    const plannedDate = parseISO(plannedCallAt);
    const diffMinutes = differenceInMinutes(referenceTime, plannedDate);

    // If within -2 to +2 minutes
    if (Math.abs(diffMinutes) <= 2) {
      return { text: 'Due Now', isOverdue: false, isDueNow: true, delayMinutes: diffMinutes };
    }

    if (diffMinutes > 2) {
      // Overdue
      const hours = Math.floor(diffMinutes / 60);
      const mins = diffMinutes % 60;
      let text = '';
      if (hours > 0) {
        text = `${hours} Hr ${mins > 0 ? `${mins} Min ` : ''}Late`;
      } else {
        text = `${mins} Min Late`;
      }
      return { text, isOverdue: true, isDueNow: false, delayMinutes: diffMinutes };
    } else {
      // Upcoming
      const absMinutes = Math.abs(diffMinutes);
      const hours = Math.floor(absMinutes / 60);
      const mins = absMinutes % 60;
      let text = '';
      if (hours > 0) {
        text = `In ${hours} Hr ${mins > 0 ? `${mins} Min` : ''}`;
      } else {
        text = `In ${mins} Min`;
      }
      return { text, isOverdue: false, isDueNow: false, delayMinutes: diffMinutes };
    }
  } catch (err) {
    return { text: 'Invalid Date', isOverdue: false, isDueNow: false, delayMinutes: 0 };
  }
}

/**
 * Add specified minutes to an ISO string or current Date
 */
export function addMinutesToDate(baseDateISO: string | Date, minutes: number): string {
  const base = typeof baseDateISO === 'string' ? parseISO(baseDateISO) : baseDateISO;
  const result = new Date(base.getTime() + minutes * 60 * 1000);
  return result.toISOString();
}

/**
 * Add specified hours to an ISO string or current Date
 */
export function addHoursToDate(baseDateISO: string | Date, hours: number): string {
  const base = typeof baseDateISO === 'string' ? parseISO(baseDateISO) : baseDateISO;
  const result = new Date(base.getTime() + hours * 60 * 60 * 1000);
  return result.toISOString();
}
