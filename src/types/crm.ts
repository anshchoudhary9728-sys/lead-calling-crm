export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'SALES_EXECUTIVE';
export type UserStatus = 'ACTIVE' | 'INACTIVE';
export type LeadSource = 'JUSTDIAL' | 'INDIAMART' | 'MANUAL' | 'IMPORT' | 'OTHER';

export type LeadStatus =
  | 'NEW'
  | 'PLANNED'
  | 'CALLING'
  | 'CALL_BACK'
  | 'FOLLOW_UP'
  | 'INTERESTED'
  | 'NOT_REACHABLE'
  | 'BUSY'
  | 'NOT_INTERESTED'
  | 'WRONG_NUMBER'
  | 'CONVERTED'
  | 'LOST';

export type FollowupStatus = 'PENDING' | 'COMPLETED' | 'RESCHEDULED' | 'CANCELLED';

export interface User {
  id: string;
  auth_user_id?: string;
  employee_code: string;
  full_name: string;
  username: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CRMConfigSettings {
  id: number;
  new_lead_call_delay_minutes: number;
  not_reachable_retry_hours: number;
  busy_retry_minutes: number;
  max_not_reachable_attempts: number;
  auto_assignment_enabled: boolean;
  timezone: string;
  remarks_mandatory: boolean;
  updated_at: string;
}

export interface SourceSetting {
  id: string;
  source_name: LeadSource;
  api_key?: string;
  secret_key?: string;
  webhook_secret?: string;
  google_sheet_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  unique_lead_id: string; // e.g. LD-20260819-00125
  source: LeadSource;
  source_lead_id?: string;
  customer_name: string;
  company_name?: string;
  mobile_number: string;
  alternate_number?: string;
  email?: string;
  city?: string;
  state?: string;
  client_requirement?: string;
  product?: string;
  enquiry_message?: string;
  other_details?: Record<string, any>;
  lead_received_at: string;
  assigned_user_id?: string;
  assigned_user_name?: string;
  current_status: LeadStatus;
  current_planned_call_at: string | null;
  next_followup_at: string | null;
  last_call_at: string | null;
  last_call_status: LeadStatus | null;
  total_call_attempts: number;
  converted_at: string | null;
  deal_amount: number | null;
  is_locked_by?: string | null;
  locked_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CallLog {
  id: string;
  lead_id: string;
  user_id: string;
  user_name?: string;
  attempt_number: number;
  planned_call_at: string | null;
  actual_call_started_at: string;
  actual_call_ended_at?: string;
  call_duration_seconds: number;
  call_status: LeadStatus;
  remarks: string;
  next_followup_at: string | null;
  lead_status_after_call: LeadStatus;
  created_at: string;
}

export interface Followup {
  id: string;
  lead_id: string;
  lead_unique_id?: string;
  customer_name?: string;
  mobile_number?: string;
  assigned_user_id: string;
  assigned_user_name?: string;
  created_from_call_id?: string;
  followup_at: string;
  followup_status: FollowupStatus;
  remarks?: string;
  completed_at?: string | null;
  created_at: string;
}

export interface PlanChangeHistory {
  id: string;
  lead_id: string;
  previous_planned_at: string | null;
  new_planned_at: string | null;
  change_reason: string;
  changed_by_user_id?: string;
  changed_by_user_name?: string;
  created_at: string;
}

export interface LeadAssignmentHistory {
  id: string;
  lead_id: string;
  previous_user_id?: string;
  new_user_id?: string;
  assigned_by_user_id?: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  lead_id?: string;
  user_id?: string;
  user_name?: string;
  action: string;
  details?: Record<string, any>;
  created_at: string;
}

export interface IntegrationLog {
  id: string;
  source: LeadSource;
  payload: any;
  status: 'SUCCESS' | 'FAILED' | 'RETRYING';
  error_message?: string;
  retry_count: number;
  created_at: string;
}

export interface LeadFilterState {
  search: string;
  status: string;
  source: string;
  assigned_user_id: string;
  date_range: 'all' | 'today' | 'yesterday' | 'tomorrow' | 'last7' | 'this_week' | 'this_month' | 'custom';
  from_date?: string;
  to_date?: string;
  planned_filter?: 'all' | 'overdue' | 'due_today' | 'upcoming';
}

export interface DashboardSummaryKPI {
  todays_new_leads: number;
  calls_planned_today: number;
  calls_completed_today: number;
  calls_pending: number;
  overdue_calls: number;
  todays_followups: number;
  not_reachable_count: number;
  interested_count: number;
  converted_today: number;
  total_converted: number;
  total_revenue: number;
}
