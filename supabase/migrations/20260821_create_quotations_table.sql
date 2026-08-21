-- MIGRATION: CREATE QUOTATIONS TABLE FOR FABRIC TRADERS CRM
-- Allows storing, querying, and auditing quotations sent to leads via WhatsApp or PDF

CREATE TYPE quotation_status AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED');
CREATE TYPE whatsapp_status AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED');
CREATE TYPE tax_type_enum AS ENUM ('CGST_SGST', 'IGST', 'NONE');

CREATE TABLE IF NOT EXISTS quotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_number VARCHAR(50) UNIQUE NOT NULL,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    lead_unique_id VARCHAR(30),
    customer_name VARCHAR(150) NOT NULL,
    company_name VARCHAR(150),
    mobile_number VARCHAR(20) NOT NULL,
    email VARCHAR(150),
    billing_address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    gstin VARCHAR(30),
    
    quotation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '15 days'),
    
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discount_type VARCHAR(20) DEFAULT 'PERCENTAGE',
    discount_value NUMERIC(10, 2) DEFAULT 0.00,
    discount_amount NUMERIC(12, 2) DEFAULT 0.00,
    taxable_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    
    tax_type tax_type_enum DEFAULT 'CGST_SGST',
    cgst_rate NUMERIC(5, 2) DEFAULT 2.50,
    cgst_amount NUMERIC(12, 2) DEFAULT 0.00,
    sgst_rate NUMERIC(5, 2) DEFAULT 2.50,
    sgst_amount NUMERIC(12, 2) DEFAULT 0.00,
    igst_rate NUMERIC(5, 2) DEFAULT 5.00,
    igst_amount NUMERIC(12, 2) DEFAULT 0.00,
    total_tax NUMERIC(12, 2) DEFAULT 0.00,
    
    shipping_charges NUMERIC(12, 2) DEFAULT 0.00,
    round_off NUMERIC(6, 2) DEFAULT 0.00,
    grand_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    grand_total_words TEXT,
    
    terms_and_conditions JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    company_profile JSONB DEFAULT '{}'::jsonb,
    
    status quotation_status NOT NULL DEFAULT 'SENT',
    whatsapp_status whatsapp_status NOT NULL DEFAULT 'PENDING',
    whatsapp_sent_at TIMESTAMPTZ,
    whatsapp_message_id VARCHAR(100),
    
    created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by_user_name VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES FOR FAST SEARCH
CREATE INDEX IF NOT EXISTS idx_quotations_number ON quotations(quotation_number);
CREATE INDEX IF NOT EXISTS idx_quotations_lead ON quotations(lead_id);
CREATE INDEX IF NOT EXISTS idx_quotations_mobile ON quotations(mobile_number);
CREATE INDEX IF NOT EXISTS idx_quotations_created ON quotations(created_at DESC);

-- RLS POLICIES
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all quotations" ON quotations FOR ALL USING (true) WITH CHECK (true);
