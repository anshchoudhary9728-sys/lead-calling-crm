-- SUPABASE POSTGRESQL CRM MASTER SCHEMA SETUP

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUM TYPES
CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SALES_EXECUTIVE');
CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE lead_source AS ENUM ('JUSTDIAL', 'INDIAMART', 'MANUAL', 'IMPORT', 'OTHER');
CREATE TYPE lead_status AS ENUM (
    'NEW', 'PLANNED', 'CALLING', 'CALL_BACK', 'FOLLOW_UP', 
    'INTERESTED', 'NOT_REACHABLE', 'BUSY', 'NOT_INTERESTED', 
    'WRONG_NUMBER', 'CONVERTED', 'LOST'
);
CREATE TYPE followup_status AS ENUM ('PENDING', 'COMPLETED', 'RESCHEDULED', 'CANCELLED');

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_code VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20),
    role user_role NOT NULL DEFAULT 'SALES_EXECUTIVE',
    status user_status NOT NULL DEFAULT 'ACTIVE',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CRM CONFIGURATION SETTINGS
CREATE TABLE IF NOT EXISTS crm_settings (
    id INT PRIMARY KEY DEFAULT 1,
    new_lead_call_delay_minutes INT NOT NULL DEFAULT 10,
    not_reachable_retry_hours INT NOT NULL DEFAULT 4,
    busy_retry_minutes INT NOT NULL DEFAULT 30,
    max_not_reachable_attempts INT NOT NULL DEFAULT 5,
    auto_assignment_enabled BOOLEAN NOT NULL DEFAULT true,
    timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata',
    remarks_mandatory BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO crm_settings (id, new_lead_call_delay_minutes, not_reachable_retry_hours, busy_retry_minutes, max_not_reachable_attempts, auto_assignment_enabled, timezone, remarks_mandatory)
VALUES (1, 10, 4, 30, 5, true, 'Asia/Kolkata', true)
ON CONFLICT (id) DO NOTHING;

-- 4. SOURCE SETTINGS
CREATE TABLE IF NOT EXISTS source_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_name lead_source NOT NULL UNIQUE,
    api_key VARCHAR(255),
    secret_key VARCHAR(255),
    webhook_secret VARCHAR(255),
    google_sheet_id VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. LEADS TABLE
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unique_lead_id VARCHAR(30) UNIQUE NOT NULL,
    source lead_source NOT NULL DEFAULT 'MANUAL',
    source_lead_id VARCHAR(100),
    customer_name VARCHAR(150) NOT NULL,
    company_name VARCHAR(150),
    mobile_number VARCHAR(20) NOT NULL,
    alternate_number VARCHAR(20),
    email VARCHAR(150),
    city VARCHAR(100),
    state VARCHAR(100),
    client_requirement TEXT,
    product VARCHAR(150),
    enquiry_message TEXT,
    other_details JSONB DEFAULT '{}'::jsonb,
    lead_received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    current_status lead_status NOT NULL DEFAULT 'NEW',
    current_planned_call_at TIMESTAMPTZ,
    next_followup_at TIMESTAMPTZ,
    last_call_at TIMESTAMPTZ,
    last_call_status lead_status,
    total_call_attempts INT NOT NULL DEFAULT 0,
    converted_at TIMESTAMPTZ,
    deal_amount NUMERIC(12, 2),
    is_locked_by UUID REFERENCES users(id) ON DELETE SET NULL,
    locked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_unique_id ON leads(unique_lead_id);
CREATE INDEX IF NOT EXISTS idx_leads_mobile ON leads(mobile_number);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_planned ON leads(assigned_user_id, current_planned_call_at ASC);
CREATE INDEX IF NOT EXISTS idx_leads_status_planned ON leads(current_status, current_planned_call_at ASC);
CREATE INDEX IF NOT EXISTS idx_leads_source_received ON leads(source, lead_received_at DESC);

-- 6. CALL LOGS TABLE
CREATE TABLE IF NOT EXISTS call_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    attempt_number INT NOT NULL,
    planned_call_at TIMESTAMPTZ,
    actual_call_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actual_call_ended_at TIMESTAMPTZ,
    call_duration_seconds INT DEFAULT 0,
    call_status lead_status NOT NULL,
    remarks TEXT NOT NULL,
    next_followup_at TIMESTAMPTZ,
    lead_status_after_call lead_status NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_call_logs_lead ON call_logs(lead_id, created_at DESC);

-- 7. FOLLOWUPS TABLE
CREATE TABLE IF NOT EXISTS followups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    assigned_user_id UUID NOT NULL REFERENCES users(id),
    created_from_call_id UUID REFERENCES call_logs(id) ON DELETE SET NULL,
    followup_at TIMESTAMPTZ NOT NULL,
    followup_status followup_status NOT NULL DEFAULT 'PENDING',
    remarks TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PLAN CHANGE HISTORY
CREATE TABLE IF NOT EXISTS plan_change_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    previous_planned_at TIMESTAMPTZ,
    new_planned_at TIMESTAMPTZ,
    change_reason VARCHAR(255) NOT NULL,
    changed_by_user_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. LEAD ASSIGNMENT HISTORY
CREATE TABLE IF NOT EXISTS lead_assignment_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    previous_user_id UUID REFERENCES users(id),
    new_user_id UUID REFERENCES users(id),
    assigned_by_user_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. ACTIVITY LOGS
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. INTEGRATION LOGS
CREATE TABLE IF NOT EXISTS integration_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source lead_source NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(50) NOT NULL,
    error_message TEXT,
    retry_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. FUNCTION TO GENERATE UNIQUE LEAD ID (e.g. LD-20260819-00001)
CREATE OR REPLACE FUNCTION generate_unique_lead_id()
RETURNS VARCHAR AS $$
DECLARE
    date_prefix VARCHAR;
    seq_num INT;
    new_id VARCHAR;
BEGIN
    date_prefix := 'LD-' || TO_CHAR(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYYMMDD') || '-';
    
    SELECT COUNT(*) + 1 INTO seq_num
    FROM leads
    WHERE unique_lead_id LIKE date_prefix || '%';
    
    new_id := date_prefix || LPAD(seq_num::TEXT, 5, '0');
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- 14. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE followups ENABLE ROW LEVEL SECURITY;

-- Policy for Executives: view assigned leads, admins view all
CREATE POLICY "Leads access policy" ON leads
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_user_id = auth.uid()
            AND (users.role IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER') OR leads.assigned_user_id = users.id)
        )
    );

-- Policy for Call Logs: executives access assigned, admins access all
CREATE POLICY "Call logs access policy" ON call_logs
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_user_id = auth.uid()
            AND (users.role IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER') OR call_logs.user_id = users.id)
        )
    );
