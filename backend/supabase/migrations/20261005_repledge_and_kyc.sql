-- ============================================================================
-- MIGRATION: RE-PLEDGES (மறு அடமானம்) & CUSTOMER VAULT RETRIEVAL PROTOCOL
-- Run this in your Supabase SQL Editor: Database -> SQL Editor
-- ============================================================================

-- 1. Create re_pledges table for Treasury & Bank Arbitrage tracking
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

-- 2. Indexes for fast retrieval
CREATE INDEX IF NOT EXISTS idx_re_pledges_mortgage_id ON re_pledges(mortgage_id);
CREATE INDEX IF NOT EXISTS idx_re_pledges_custody_status ON re_pledges(custody_status);
CREATE INDEX IF NOT EXISTS idx_re_pledges_bank_due_date ON re_pledges(bank_due_date);

-- 3. Extend mortgages table with re-pledge and advance release fields
ALTER TABLE mortgages ADD COLUMN IF NOT EXISTS re_pledge_id TEXT;
ALTER TABLE mortgages ADD COLUMN IF NOT EXISTS re_pledge_status TEXT;
ALTER TABLE mortgages ADD COLUMN IF NOT EXISTS release_request JSONB;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE re_pledges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read RePledges" ON re_pledges FOR SELECT USING (true);
CREATE POLICY "Public Manage RePledges" ON re_pledges FOR ALL USING (true);
