import {
  User,
  Lead,
  CallLog,
  Followup,
  CRMConfigSettings,
  SourceSetting,
  IntegrationLog,
  ActivityLog,
  PlanChangeHistory,
  LeadFilterState,
  DashboardSummaryKPI,
  LeadStatus,
  LeadSource,
} from '@/types/crm';
import { calculateInitialPlannedCall, calculateNextPlannedCall, sortLeadsByPlannedPriority } from './call-planning';
import { addMinutesToDate, addHoursToDate } from './timezone';

// INITIAL SEED USERS
const DEFAULT_USERS: User[] = [
  {
    id: 'user-admin-1',
    employee_code: 'EMP-101',
    full_name: 'Rajesh Sharma',
    username: 'rajesh.admin',
    email: 'rajesh@fabrictraders.com',
    phone: '+91 9876543210',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    created_at: '2026-08-01T09:00:00Z',
    updated_at: '2026-08-01T09:00:00Z',
  },
  {
    id: 'user-exec-1',
    employee_code: 'EMP-102',
    full_name: 'Rahul Verma',
    username: 'rahul.verma',
    email: 'rahul@fabrictraders.com',
    phone: '+91 9812345678',
    role: 'SALES_EXECUTIVE',
    status: 'ACTIVE',
    created_at: '2026-08-02T10:00:00Z',
    updated_at: '2026-08-02T10:00:00Z',
  },
  {
    id: 'user-exec-2',
    employee_code: 'EMP-103',
    full_name: 'Amit Patel',
    username: 'amit.patel',
    email: 'amit@fabrictraders.com',
    phone: '+91 9711223344',
    role: 'SALES_EXECUTIVE',
    status: 'ACTIVE',
    created_at: '2026-08-03T10:00:00Z',
    updated_at: '2026-08-03T10:00:00Z',
  },
  {
    id: 'user-exec-3',
    employee_code: 'EMP-104',
    full_name: 'Priya Singh',
    username: 'priya.singh',
    email: 'priya@fabrictraders.com',
    phone: '+91 9655443322',
    role: 'SALES_EXECUTIVE',
    status: 'ACTIVE',
    created_at: '2026-08-04T10:00:00Z',
    updated_at: '2026-08-04T10:00:00Z',
  },
];

// INITIAL SEED CONFIG
const DEFAULT_CONFIG: CRMConfigSettings = {
  id: 1,
  new_lead_call_delay_minutes: 10,
  not_reachable_retry_hours: 4,
  busy_retry_minutes: 30,
  max_not_reachable_attempts: 5,
  auto_assignment_enabled: true,
  timezone: 'Asia/Kolkata',
  remarks_mandatory: true,
  updated_at: new Date().toISOString(),
};

// INITIAL SEED SOURCES
const DEFAULT_SOURCES: SourceSetting[] = [
  { id: 'src-1', source_name: 'JUSTDIAL', api_key: 'jd_live_key_99182', webhook_secret: 'whsec_jd_88192', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'src-2', source_name: 'INDIAMART', api_key: 'im_live_key_77123', webhook_secret: 'whsec_im_66124', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'src-3', source_name: 'MANUAL', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'src-4', source_name: 'IMPORT', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

// NO DEMO/SEED DATA - All data comes from Supabase PostgreSQL
const DEFAULT_LEADS: Lead[] = [];
const DEFAULT_CALL_LOGS: CallLog[] = [];
const DEFAULT_FOLLOWUPS: Followup[] = [];

// IN-MEMORY STORAGE CLASS
class CRMStore {
  private users: User[] = [...DEFAULT_USERS];
  private leads: Lead[] = [...DEFAULT_LEADS];
  private callLogs: CallLog[] = [...DEFAULT_CALL_LOGS];
  private followups: Followup[] = [...DEFAULT_FOLLOWUPS];
  private config: CRMConfigSettings = { ...DEFAULT_CONFIG };
  private sourceSettings: SourceSetting[] = [...DEFAULT_SOURCES];
  private integrationLogs: IntegrationLog[] = [];
  private activityLogs: ActivityLog[] = [];
  private planChangeHistory: PlanChangeHistory[] = [];

  private roundRobinUserIndex = 0;

  constructor() {
    this.loadFromLocalStorage();
  }

  private loadFromLocalStorage() {
    if (typeof window !== 'undefined') {
      try {
        const storedLeads = localStorage.getItem('crm_leads');
        const storedCalls = localStorage.getItem('crm_call_logs');
        const storedFollowups = localStorage.getItem('crm_followups');
        const storedConfig = localStorage.getItem('crm_config');

        if (storedLeads) this.leads = JSON.parse(storedLeads);
        if (storedCalls) this.callLogs = JSON.parse(storedCalls);
        if (storedFollowups) this.followups = JSON.parse(storedFollowups);
        if (storedConfig) this.config = JSON.parse(storedConfig);
      } catch (err) {
        console.error('Failed to load CRM state from localStorage', err);
      }
    }
  }

  private saveToLocalStorage() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('crm_leads', JSON.stringify(this.leads));
        localStorage.setItem('crm_call_logs', JSON.stringify(this.callLogs));
        localStorage.setItem('crm_followups', JSON.stringify(this.followups));
        localStorage.setItem('crm_config', JSON.stringify(this.config));
      } catch (err) {
        console.error('Failed to persist CRM state', err);
      }
    }
  }

  // --- USERS & AUTH ---
  getUsers(): User[] {
    return this.users;
  }

  getUserById(id: string): User | undefined {
    return this.users.find(u => u.id === id);
  }

  createUser(userData: Partial<User>): User {
    const newUser: User = {
      id: `user-${Date.now()}`,
      employee_code: userData.employee_code || `EMP-${Math.floor(100 + Math.random() * 900)}`,
      full_name: userData.full_name || 'New Employee',
      username: userData.username || `user_${Date.now()}`,
      email: userData.email || `user${Date.now()}@fabrictraders.com`,
      phone: userData.phone || '+91 9900000000',
      role: userData.role || 'SALES_EXECUTIVE',
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.users.push(newUser);
    this.saveToLocalStorage();
    return newUser;
  }

  toggleUserStatus(id: string): User {
    const user = this.users.find(u => u.id === id);
    if (!user) throw new Error('User not found');
    user.status = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    user.updated_at = new Date().toISOString();
    this.saveToLocalStorage();
    return user;
  }

  // --- CONFIG SETTINGS ---
  getSettings(): CRMConfigSettings {
    return this.config;
  }

  updateSettings(newSettings: Partial<CRMConfigSettings>): CRMConfigSettings {
    this.config = { ...this.config, ...newSettings, updated_at: new Date().toISOString() };
    this.saveToLocalStorage();
    return this.config;
  }

  // --- SOURCE SETTINGS ---
  getSourceSettings(): SourceSetting[] {
    return this.sourceSettings;
  }

  updateSourceSetting(id: string, updates: Partial<SourceSetting>): SourceSetting {
    const source = this.sourceSettings.find(s => s.id === id);
    if (!source) throw new Error('Source setting not found');
    Object.assign(source, updates, { updated_at: new Date().toISOString() });
    this.saveToLocalStorage();
    return source;
  }

  // --- LEADS MANAGEMENT ---
  getLeads(filter?: LeadFilterState): Lead[] {
    let result = [...this.leads];

    if (!filter) return result;

    // Search filter: Customer Name, Phone, Unique ID, Company, Requirement
    if (filter.search) {
      const q = filter.search.toLowerCase().trim();
      result = result.filter(
        l =>
          l.unique_lead_id.toLowerCase().includes(q) ||
          l.customer_name.toLowerCase().includes(q) ||
          l.mobile_number.includes(q) ||
          (l.company_name && l.company_name.toLowerCase().includes(q)) ||
          (l.client_requirement && l.client_requirement.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (filter.status && filter.status !== 'all') {
      result = result.filter(l => l.current_status === filter.status);
    }

    // Source filter
    if (filter.source && filter.source !== 'all') {
      result = result.filter(l => l.source === filter.source);
    }

    // Assigned User filter
    if (filter.assigned_user_id && filter.assigned_user_id !== 'all') {
      result = result.filter(l => l.assigned_user_id === filter.assigned_user_id);
    }

    // Planned calls filter
    if (filter.planned_filter) {
      const refTime = new Date();
      if (filter.planned_filter === 'overdue') {
        result = result.filter(l => l.current_planned_call_at && new Date(l.current_planned_call_at) < refTime && l.current_status !== 'CONVERTED' && l.current_status !== 'LOST');
      } else if (filter.planned_filter === 'due_today') {
        const todayStr = refTime.toISOString().substring(0, 10);
        result = result.filter(l => l.current_planned_call_at && l.current_planned_call_at.substring(0, 10) === todayStr);
      }
    }

    return result;
  }

  getPlannedCallsQueue(assignedUserId?: string): Lead[] {
    let activeLeads = this.leads.filter(
      l => l.current_planned_call_at !== null && l.current_status !== 'CONVERTED' && l.current_status !== 'LOST' && l.current_status !== 'NOT_INTERESTED'
    );

    if (assignedUserId && assignedUserId !== 'all') {
      activeLeads = activeLeads.filter(l => l.assigned_user_id === assignedUserId);
    }

    return sortLeadsByPlannedPriority(activeLeads);
  }

  getLeadById(id: string): Lead | undefined {
    return this.leads.find(l => l.id === id || l.unique_lead_id === id);
  }

  generateUniqueLeadId(): string {
    const today = new Date();
    const dateStr = today.toISOString().substring(0, 10).replace(/-/g, '');
    const prefix = `LD-${dateStr}-`;
    const count = this.leads.filter(l => l.unique_lead_id.startsWith(prefix)).length + 1;
    return `${prefix}${String(count).padStart(5, '0')}`;
  }

  getNextRoundRobinUser(): User | undefined {
    const activeExecutives = this.users.filter(u => u.status === 'ACTIVE' && u.role === 'SALES_EXECUTIVE');
    if (activeExecutives.length === 0) {
      return this.users.find(u => u.status === 'ACTIVE');
    }
    const user = activeExecutives[this.roundRobinUserIndex % activeExecutives.length];
    this.roundRobinUserIndex++;
    return user;
  }

  createLead(data: Partial<Lead>): Lead {
    const leadReceivedISO = data.lead_received_at || new Date().toISOString();
    const assignedUser = data.assigned_user_id ? this.getUserById(data.assigned_user_id) : this.getNextRoundRobinUser();

    const initialPlannedCallAt = calculateInitialPlannedCall(leadReceivedISO, this.config);

    const newLead: Lead = {
      id: `lead-${Date.now()}`,
      unique_lead_id: data.unique_lead_id || this.generateUniqueLeadId(),
      source: data.source || 'MANUAL',
      source_lead_id: data.source_lead_id,
      customer_name: data.customer_name || 'Unspecified Client',
      company_name: data.company_name,
      mobile_number: data.mobile_number || '+91 9000000000',
      alternate_number: data.alternate_number,
      email: data.email,
      city: data.city,
      state: data.state,
      client_requirement: data.client_requirement || data.enquiry_message,
      product: data.product,
      enquiry_message: data.enquiry_message,
      other_details: data.other_details || {},
      lead_received_at: leadReceivedISO,
      assigned_user_id: assignedUser?.id,
      assigned_user_name: assignedUser?.full_name,
      current_status: 'NEW',
      current_planned_call_at: initialPlannedCallAt,
      next_followup_at: null,
      last_call_at: null,
      last_call_status: null,
      total_call_attempts: 0,
      converted_at: null,
      deal_amount: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.leads.unshift(newLead);
    this.saveToLocalStorage();
    return newLead;
  }

  // --- CALL LOGGING & DISPOSITION ENGINE ---
  logCall(params: {
    lead_id: string;
    user_id: string;
    call_status: LeadStatus;
    remarks: string;
    selected_followup_at?: string | null;
    call_duration_seconds?: number;
    deal_amount?: number;
  }): { callLog: CallLog; lead: Lead } {
    const lead = this.getLeadById(params.lead_id);
    if (!lead) throw new Error('Lead not found');

    const user = this.getUserById(params.user_id);
    const actualCallTime = new Date().toISOString();
    const attemptNumber = lead.total_call_attempts + 1;

    // Calculate next planned call time based on disposition rules
    const planningResult = calculateNextPlannedCall(
      lead.current_status,
      params.call_status,
      actualCallTime,
      params.selected_followup_at || null,
      this.config
    );

    // Create Immutable Call Log
    const newCallLog: CallLog = {
      id: `call-${Date.now()}`,
      lead_id: lead.id,
      user_id: params.user_id,
      user_name: user?.full_name || 'Caller',
      attempt_number: attemptNumber,
      planned_call_at: lead.current_planned_call_at,
      actual_call_started_at: actualCallTime,
      actual_call_ended_at: new Date().toISOString(),
      call_duration_seconds: params.call_duration_seconds || 45,
      call_status: params.call_status,
      remarks: params.remarks,
      next_followup_at: planningResult.nextFollowupAt,
      lead_status_after_call: planningResult.newLeadStatus,
      created_at: actualCallTime,
    };
    this.callLogs.unshift(newCallLog);

    // Track Plan Change History
    if (lead.current_planned_call_at !== planningResult.nextPlannedCallAt) {
      this.planChangeHistory.unshift({
        id: `plan-hist-${Date.now()}`,
        lead_id: lead.id,
        previous_planned_at: lead.current_planned_call_at,
        new_planned_at: planningResult.nextPlannedCallAt,
        change_reason: planningResult.changeReason,
        changed_by_user_id: params.user_id,
        changed_by_user_name: user?.full_name,
        created_at: actualCallTime,
      });
    }

    // Create Follow-up item if applicable
    if (planningResult.nextFollowupAt) {
      this.followups.unshift({
        id: `fol-${Date.now()}`,
        lead_id: lead.id,
        lead_unique_id: lead.unique_lead_id,
        customer_name: lead.customer_name,
        mobile_number: lead.mobile_number,
        assigned_user_id: lead.assigned_user_id || params.user_id,
        assigned_user_name: lead.assigned_user_name || user?.full_name,
        created_from_call_id: newCallLog.id,
        followup_at: planningResult.nextFollowupAt,
        followup_status: 'PENDING',
        remarks: params.remarks,
        created_at: actualCallTime,
      });
    }

    // Update Lead Record
    lead.current_status = planningResult.newLeadStatus;
    lead.current_planned_call_at = planningResult.nextPlannedCallAt;
    lead.next_followup_at = planningResult.nextFollowupAt;
    lead.last_call_at = actualCallTime;
    lead.last_call_status = params.call_status;
    lead.total_call_attempts = attemptNumber;
    lead.updated_at = actualCallTime;

    if (params.call_status === 'CONVERTED') {
      lead.converted_at = actualCallTime;
      lead.deal_amount = params.deal_amount || 50000;
    }

    this.saveToLocalStorage();
    return { callLog: newCallLog, lead };
  }

  getCallLogsForLead(leadId: string): CallLog[] {
    return this.callLogs.filter(c => c.lead_id === leadId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  getLastCallForLead(leadId: string): CallLog | undefined {
    return this.getCallLogsForLead(leadId)[0];
  }

  // --- FOLLOWUPS ---
  getFollowups(user_id?: string): Followup[] {
    let result = [...this.followups];
    if (user_id && user_id !== 'all') {
      result = result.filter(f => f.assigned_user_id === user_id);
    }
    return result.sort((a, b) => new Date(a.followup_at).getTime() - new Date(b.followup_at).getTime());
  }

  markFollowupCompleted(id: string): Followup {
    const followup = this.followups.find(f => f.id === id);
    if (!followup) throw new Error('Followup not found');
    followup.followup_status = 'COMPLETED';
    followup.completed_at = new Date().toISOString();
    this.saveToLocalStorage();
    return followup;
  }

  // --- GOOGLE SHEETS & INTEGRATIONS SYNC ---
  syncGoogleSheetLead(payload: {
    source: LeadSource;
    source_lead_id?: string;
    customer_name: string;
    mobile_number: string;
    company_name?: string;
    email?: string;
    city?: string;
    state?: string;
    client_requirement?: string;
    product?: string;
    enquiry_message?: string;
  }): { success: boolean; lead_id?: string; unique_lead_id?: string; message: string } {
    try {
      // 1. Clean & normalize phone number
      const rawPhone = String(payload.mobile_number || '');
      const cleanPhone = rawPhone.replace(/\D/g, '');
      const normalizedPhone = cleanPhone.length === 10 ? `+91 ${cleanPhone}` : `+91 ${cleanPhone.slice(-10)}`;

      // 2. Deduplication check
      const existingLead = this.leads.find(l => l.mobile_number.replace(/\D/g, '').endsWith(cleanPhone.slice(-10)));

      if (existingLead) {
        // Append message to existing lead
        existingLead.enquiry_message = `${existingLead.enquiry_message || ''}\n[New Enquiry ${new Date().toLocaleDateString()}]: ${payload.enquiry_message || payload.client_requirement || 'Repeat lead received'}`;
        existingLead.updated_at = new Date().toISOString();

        this.addIntegrationLog(payload.source, payload, 'SUCCESS', `Linked enquiry to existing lead ${existingLead.unique_lead_id}`);
        this.saveToLocalStorage();
        return {
          success: true,
          lead_id: existingLead.id,
          unique_lead_id: existingLead.unique_lead_id,
          message: `Linked to existing customer profile (${existingLead.unique_lead_id})`,
        };
      }

      // 3. Create New Lead
      const newLead = this.createLead({
        source: payload.source,
        source_lead_id: payload.source_lead_id,
        customer_name: payload.customer_name,
        company_name: payload.company_name,
        mobile_number: normalizedPhone,
        email: payload.email,
        city: payload.city,
        state: payload.state,
        client_requirement: payload.client_requirement || payload.enquiry_message,
        product: payload.product,
        enquiry_message: payload.enquiry_message,
        lead_received_at: new Date().toISOString(),
      });

      this.addIntegrationLog(payload.source, payload, 'SUCCESS', `Created lead ${newLead.unique_lead_id}`);
      return {
        success: true,
        lead_id: newLead.id,
        unique_lead_id: newLead.unique_lead_id,
        message: `Lead successfully synced and assigned to ${newLead.assigned_user_name}`,
      };
    } catch (err: any) {
      this.addIntegrationLog(payload.source, payload, 'FAILED', err.message);
      return { success: false, message: `Sync failed: ${err.message}` };
    }
  }

  addIntegrationLog(source: LeadSource, payload: any, status: 'SUCCESS' | 'FAILED' | 'RETRYING', errorMessage?: string) {
    this.integrationLogs.unshift({
      id: `int-log-${Date.now()}`,
      source,
      payload,
      status,
      error_message: errorMessage,
      retry_count: 0,
      created_at: new Date().toISOString(),
    });
  }

  getIntegrationLogs(): IntegrationLog[] {
    return this.integrationLogs;
  }

  // --- DASHBOARD KPIS & REPORTS ---
  getDashboardKPIs(): DashboardSummaryKPI {
    const todayStr = new Date().toISOString().substring(0, 10);
    const refTime = new Date();

    const todays_new_leads = this.leads.filter(l => l.lead_received_at.substring(0, 10) === todayStr).length;
    const calls_planned_today = this.leads.filter(l => l.current_planned_call_at && l.current_planned_call_at.substring(0, 10) === todayStr).length;
    const calls_completed_today = this.callLogs.filter(c => c.created_at.substring(0, 10) === todayStr).length;
    const calls_pending = this.leads.filter(l => l.current_planned_call_at !== null && l.current_status !== 'CONVERTED' && l.current_status !== 'LOST').length;
    const overdue_calls = this.leads.filter(
      l => l.current_planned_call_at !== null && new Date(l.current_planned_call_at) < refTime && l.current_status !== 'CONVERTED' && l.current_status !== 'LOST'
    ).length;
    const todays_followups = this.followups.filter(f => f.followup_at.substring(0, 10) === todayStr).length;
    const not_reachable_count = this.leads.filter(l => l.current_status === 'NOT_REACHABLE').length;
    const interested_count = this.leads.filter(l => l.current_status === 'INTERESTED').length;
    const converted_today = this.leads.filter(l => l.converted_at && l.converted_at.substring(0, 10) === todayStr).length;
    const total_converted = this.leads.filter(l => l.current_status === 'CONVERTED').length;
    const total_revenue = this.leads.reduce((sum, l) => sum + (l.deal_amount || 0), 0);

    return {
      todays_new_leads,
      calls_planned_today,
      calls_completed_today,
      calls_pending,
      overdue_calls,
      todays_followups,
      not_reachable_count,
      interested_count,
      converted_today,
      total_converted,
      total_revenue,
    };
  }
}

// Singleton Store Instance
export const crmStore = new CRMStore();
