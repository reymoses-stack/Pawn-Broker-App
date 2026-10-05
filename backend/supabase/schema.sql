-- ============================================================================
-- NEXUS GOLD PAWN OS & CUSTOMER APPS - SUPABASE POSTGRESQL SCHEMA
-- Execute this entire script in Supabase SQL Editor (Database -> SQL Editor)
-- ============================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. DOORSTEP SERVICE PINCODES
CREATE TABLE IF NOT EXISTS doorstep_pincodes (
    id TEXT PRIMARY KEY,
    pincode VARCHAR(10) UNIQUE NOT NULL,
    area TEXT NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doorstep_pincodes_pincode ON doorstep_pincodes(pincode);

-- 2. PAWN ENQUIRIES & DOORSTEP BOOKINGS
CREATE TABLE IF NOT EXISTS pawn_enquiries (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_mobile TEXT NOT NULL,
    item_type TEXT NOT NULL,
    approx_weight NUMERIC(10, 3) NOT NULL,
    purity TEXT NOT NULL,
    expected_amount NUMERIC(12, 2) NOT NULL,
    service_type TEXT NOT NULL,
    pincode VARCHAR(10),
    address TEXT,
    status TEXT DEFAULT 'PENDING',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pawn_enquiries_mobile ON pawn_enquiries(customer_mobile);
CREATE INDEX IF NOT EXISTS idx_pawn_enquiries_status ON pawn_enquiries(status);

-- 3. MASTER CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    secondary_mobile TEXT,
    aadhaar_number TEXT,
    date_of_birth DATE,
    address TEXT,
    city TEXT DEFAULT 'Chennai',
    pincode VARCHAR(10),
    occupation TEXT,
    nominee_name TEXT,
    nominee_relation TEXT,
    nominee_phone TEXT,
    photo_url TEXT,
    kyc_status TEXT DEFAULT 'Pending',
    kyc_record JSONB,
    branch_id TEXT NOT NULL,
    customer_tier TEXT DEFAULT 'Standard',
    preferred_broker_rate_adjustment NUMERIC(8, 2) DEFAULT 85,
    preferred_interest_rate NUMERIC(5, 2) DEFAULT 2.0,
    credit_score_rating TEXT DEFAULT 'A',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_mobile ON customers(mobile);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);

-- 4. MORTGAGES (PLEDGE LOANS) TABLE
CREATE TABLE IF NOT EXISTS mortgages (
    id TEXT PRIMARY KEY,
    mortgage_number TEXT UNIQUE NOT NULL,
    customer_id TEXT REFERENCES customers(id) ON DELETE CASCADE,
    branch_id TEXT NOT NULL,
    mortgage_date DATE NOT NULL,
    maturity_date DATE NOT NULL,
    principal_amount NUMERIC(12, 2) NOT NULL,
    interest_rate NUMERIC(5, 2) NOT NULL,
    interest_type TEXT DEFAULT 'Monthly',
    interest_frequency TEXT DEFAULT 'Monthly',
    penalty_rate_monthly NUMERIC(5, 2) DEFAULT 0,
    grace_period_days INT DEFAULT 7,
    processing_fee NUMERIC(10, 2) DEFAULT 0,
    other_charges NUMERIC(10, 2) DEFAULT 0,
    outstanding_principal NUMERIC(12, 2) NOT NULL,
    outstanding_interest NUMERIC(12, 2) DEFAULT 0,
    status TEXT DEFAULT 'Active',
    disbursement_mode TEXT DEFAULT 'Cash',
    packet_id TEXT NOT NULL,
    items JSONB DEFAULT '[]'::jsonb,
    renewal_history JSONB DEFAULT '[]'::jsonb,
    created_by TEXT,
    approved_by TEXT,
    last_payment_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mortgages_mortgage_number ON mortgages(mortgage_number);
CREATE INDEX IF NOT EXISTS idx_mortgages_customer_id ON mortgages(customer_id);
CREATE INDEX IF NOT EXISTS idx_mortgages_packet_id ON mortgages(packet_id);
CREATE INDEX IF NOT EXISTS idx_mortgages_status ON mortgages(status);

-- 5. VAULT GOLD PACKETS TABLE
CREATE TABLE IF NOT EXISTS gold_packets (
    id TEXT PRIMARY KEY,
    mortgage_id TEXT REFERENCES mortgages(id) ON DELETE CASCADE,
    customer_id TEXT REFERENCES customers(id),
    branch_id TEXT NOT NULL,
    locker_id TEXT NOT NULL,
    rack TEXT NOT NULL,
    tray TEXT NOT NULL,
    bin TEXT,
    status TEXT DEFAULT 'In Locker',
    total_gross_weight NUMERIC(10, 3) NOT NULL,
    total_net_weight NUMERIC(10, 3) NOT NULL,
    item_count INT NOT NULL,
    movements JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    released_at TIMESTAMP WITH TIME ZONE,
    released_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_gold_packets_mortgage_id ON gold_packets(mortgage_id);
CREATE INDEX IF NOT EXISTS idx_gold_packets_locker ON gold_packets(locker_id, rack, tray);

-- 6. REPAYMENTS & SETTLEMENTS LEDGER
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    mortgage_id TEXT REFERENCES mortgages(id) ON DELETE CASCADE,
    customer_id TEXT REFERENCES customers(id),
    branch_id TEXT NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    amount NUMERIC(12, 2) NOT NULL,
    principal_portion NUMERIC(12, 2) DEFAULT 0,
    interest_portion NUMERIC(12, 2) DEFAULT 0,
    penalty_portion NUMERIC(12, 2) DEFAULT 0,
    payment_mode TEXT DEFAULT 'Cash',
    collected_by TEXT NOT NULL,
    receipt_number TEXT NOT NULL,
    notes TEXT,
    breakdown JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_mortgage_id ON payments(mortgage_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);

-- 7. LIVE BULLION RATES BENCHMARK
CREATE TABLE IF NOT EXISTS live_rates (
    id TEXT PRIMARY KEY DEFAULT 'current',
    city TEXT NOT NULL,
    rates_24k NUMERIC(10, 2) NOT NULL,
    rates_22k NUMERIC(10, 2) NOT NULL,
    rates_20k NUMERIC(10, 2) NOT NULL,
    rates_18k NUMERIC(10, 2) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id TEXT,
    user_name TEXT,
    user_role TEXT,
    branch_id TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    reason TEXT,
    device_ip TEXT
);

-- ----------------------------------------------------------------------------
-- INITIAL SEED DATA
-- ----------------------------------------------------------------------------

-- Seed Doorstep Pincodes
INSERT INTO doorstep_pincodes (id, pincode, area, active, added_at) VALUES
('PIN001', '600001', 'Chennai - Park Town / Anna Salai', true, NOW()),
('PIN002', '600002', 'Chennai - George Town / Mint Street', true, NOW()),
('PIN003', '600006', 'Chennai - Triplicane / Chepauk', true, NOW()),
('PIN004', '627356', 'Munnirpallam, Tirunelveli, Tamil Nadu', true, NOW()),
('PIN005', '627453', 'Pattamadai, Tirunelveli, Tamil Nadu', true, NOW())
ON CONFLICT (pincode) DO NOTHING;

-- Seed Live Bullion Rates
INSERT INTO live_rates (id, city, rates_24k, rates_22k, rates_20k, rates_18k, updated_at) VALUES
('current', 'Chennai', 7920.00, 7260.00, 6600.00, 5940.00, NOW())
ON CONFLICT (id) DO UPDATE SET
    rates_24k = EXCLUDED.rates_24k,
    rates_22k = EXCLUDED.rates_22k,
    rates_20k = EXCLUDED.rates_20k,
    rates_18k = EXCLUDED.rates_18k,
    updated_at = NOW();

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) - PUBLIC READ ACCESS FOR FRONTENDS WITH ANON KEY
-- ----------------------------------------------------------------------------
ALTER TABLE doorstep_pincodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pawn_enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE mortgages ENABLE ROW LEVEL SECURITY;
ALTER TABLE gold_packets ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Anonymous/Authenticated read & write policies for service endpoints
CREATE POLICY "Public Read Pincodes" ON doorstep_pincodes FOR SELECT USING (true);
CREATE POLICY "Public Manage Pincodes" ON doorstep_pincodes FOR ALL USING (true);

CREATE POLICY "Public Read Enquiries" ON pawn_enquiries FOR SELECT USING (true);
CREATE POLICY "Public Create Enquiries" ON pawn_enquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Enquiries" ON pawn_enquiries FOR UPDATE USING (true);

CREATE POLICY "Public Read Customers" ON customers FOR SELECT USING (true);
CREATE POLICY "Public Manage Customers" ON customers FOR ALL USING (true);

CREATE POLICY "Public Read Mortgages" ON mortgages FOR SELECT USING (true);
CREATE POLICY "Public Manage Mortgages" ON mortgages FOR ALL USING (true);

CREATE POLICY "Public Read Packets" ON gold_packets FOR SELECT USING (true);
CREATE POLICY "Public Manage Packets" ON gold_packets FOR ALL USING (true);

CREATE POLICY "Public Read Payments" ON payments FOR SELECT USING (true);
CREATE POLICY "Public Manage Payments" ON payments FOR ALL USING (true);

CREATE POLICY "Public Manage Audit" ON audit_logs FOR ALL USING (true);

-- 9. RE-PLEDGES (மறு அடமானம்) & BANK VAULT TREASURY
CREATE TABLE IF NOT EXISTS re_pledges (
    id TEXT PRIMARY KEY,
    mortgage_id TEXT REFERENCES mortgages(id) ON DELETE CASCADE,
    mortgage_number TEXT NOT NULL,
    customer_id TEXT REFERENCES customers(id),
    customer_name TEXT NOT NULL,
    customer_mobile TEXT NOT NULL,
    branch_id TEXT NOT NULL,
    destination_type TEXT NOT NULL DEFAULT 'Public Sector Bank',
    institution_name TEXT NOT NULL,
    bank_loan_number TEXT NOT NULL,
    account_holder_name TEXT NOT NULL,
    date_moved DATE NOT NULL,
    bank_due_date DATE NOT NULL,
    appraised_net_weight NUMERIC(10, 3) NOT NULL,
    bank_valuation_per_gram NUMERIC(10, 2) NOT NULL,
    bank_received_amount NUMERIC(12, 2) NOT NULL,
    retail_loan_amount NUMERIC(12, 2) NOT NULL,
    bank_interest_rate NUMERIC(5, 2) NOT NULL,
    customer_interest_rate NUMERIC(5, 2) NOT NULL,
    net_spread_margin NUMERIC(5, 2) NOT NULL,
    bank_packet_reference TEXT,
    custody_status TEXT NOT NULL DEFAULT 'AT_BANK',
    release_requested_at TIMESTAMP WITH TIME ZONE,
    release_requested_by TEXT,
    scheduled_pickup_date TIMESTAMP WITH TIME ZONE,
    bank_settled_amount NUMERIC(12, 2),
    bank_settled_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_re_pledges_mortgage_id ON re_pledges(mortgage_id);
CREATE INDEX IF NOT EXISTS idx_re_pledges_custody_status ON re_pledges(custody_status);
CREATE INDEX IF NOT EXISTS idx_re_pledges_bank_due_date ON re_pledges(bank_due_date);

-- Add re-pledge and customer advance release columns to mortgages
ALTER TABLE mortgages ADD COLUMN IF NOT EXISTS re_pledge_id TEXT;
ALTER TABLE mortgages ADD COLUMN IF NOT EXISTS re_pledge_status TEXT;
ALTER TABLE mortgages ADD COLUMN IF NOT EXISTS release_request JSONB;

ALTER TABLE re_pledges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read RePledges" ON re_pledges FOR SELECT USING (true);
CREATE POLICY "Public Manage RePledges" ON re_pledges FOR ALL USING (true);

