-- MASTER CLEAN RESET SQL SCRIPT FOR SUPABASE POSTGRESQL
-- Drops all old tables and re-creates clean schema with public RLS insert policies

-- 1. DROP EXISTING TABLES AND TYPES IN CASCADE MODE
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS integration_logs CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS lead_assignment_history CASCADE;
DROP TABLE IF EXISTS plan_change_history CASCADE;
DROP TABLE IF EXISTS followups CASCADE;
DROP TABLE IF EXISTS call_logs CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS source_settings CASCADE;
DROP TABLE IF EXISTS crm_settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS followup_status CASCADE;
DROP TYPE IF EXISTS lead_status CASCADE;
DROP TYPE IF EXISTS lead_source CASCADE;
DROP TYPE IF EXISTS user_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- ENABLE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CREATE ENUM TYPES
CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SALES_EXECUTIVE');
CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE lead_source AS ENUM ('JUSTDIAL', 'INDIAMART', 'MANUAL', 'IMPORT', 'OTHER');
CREATE TYPE lead_status AS ENUM (
    'NEW', 'PLANNED', 'CALLING', 'CALL_BACK', 'FOLLOW_UP', 
    'INTERESTED', 'NOT_REACHABLE', 'BUSY', 'NOT_INTERESTED', 
    'WRONG_NUMBER', 'CONVERTED', 'LOST'
);
CREATE TYPE followup_status AS ENUM ('PENDING', 'COMPLETED', 'RESCHEDULED', 'CANCELLED');

-- 3. USERS TABLE
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE,
    employee_code VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20),
    role user_role NOT NULL DEFAULT 'SALES_EXECUTIVE',
    status user_status NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Default Admin User
INSERT INTO users (employee_code, full_name, username, email, role, status)
VALUES ('EMP-101', 'Rajesh Sharma', 'rajesh.admin', 'rajesh@fabrictraders.com', 'SUPER_ADMIN', 'ACTIVE')
ON CONFLICT DO NOTHING;

-- 4. CRM CONFIGURATION SETTINGS
CREATE TABLE crm_settings (
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

-- 5. SOURCE SETTINGS
CREATE TABLE source_settings (
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

-- 6. LEADS TABLE
CREATE TABLE leads (
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES FOR FAST SEARCHING
CREATE INDEX idx_leads_unique_id ON leads(unique_lead_id);
CREATE INDEX idx_leads_mobile ON leads(mobile_number);
CREATE INDEX idx_leads_assigned_planned ON leads(assigned_user_id, current_planned_call_at ASC);
CREATE INDEX idx_leads_status_planned ON leads(current_status, current_planned_call_at ASC);

-- 7. CALL LOGS TABLE (IMMUTABLE HISTORY)
CREATE TABLE call_logs (
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

CREATE INDEX idx_call_logs_lead ON call_logs(lead_id, created_at DESC);

-- 8. FOLLOWUPS TABLE
CREATE TABLE followups (
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

-- 9. AUDIT & LOGGING TABLES
CREATE TABLE plan_change_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    previous_planned_at TIMESTAMPTZ,
    new_planned_at TIMESTAMPTZ,
    change_reason VARCHAR(255) NOT NULL,
    changed_by_user_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE lead_assignment_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    previous_user_id UUID REFERENCES users(id),
    new_user_id UUID REFERENCES users(id),
    assigned_by_user_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE integration_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source lead_source NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(50) NOT NULL,
    error_message TEXT,
    retry_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. ENABLE RLS POLICIES
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE followups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public all users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public webhook insert leads" ON leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select leads" ON leads FOR SELECT USING (true);
CREATE POLICY "Allow public update leads" ON leads FOR UPDATE USING (true);

CREATE POLICY "Allow public all call_logs" ON call_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all followups" ON followups FOR ALL USING (true) WITH CHECK (true);

