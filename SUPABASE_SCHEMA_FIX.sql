-- =======================================
-- SUPABASE SCHEMA FIX - Copy & Paste This
-- =======================================
-- Run this in your Supabase SQL Editor to fix all schema mismatches

-- 1. ADD MISSING DOCUMENT COLUMNS TO ELECTRICIANS TABLE
ALTER TABLE electricians
ADD COLUMN IF NOT EXISTS aadhaar_front_url TEXT,
ADD COLUMN IF NOT EXISTS aadhaar_back_url TEXT,
ADD COLUMN IF NOT EXISTS pan_front_url TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- 2. ADD MISSING COLUMNS TO BANK_DETAILS TABLE
ALTER TABLE bank_details
ADD COLUMN IF NOT EXISTS account_holder_name TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- 3. ENSURE CUSTOMERS TABLE HAS TIMESTAMPS
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- 4. ENSURE SERVICE_REQUESTS TABLE HAS ALL NEEDED COLUMNS
ALTER TABLE service_requests
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- 5. ENSURE USERS TABLE HAS TIMESTAMPS
ALTER TABLE users
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- =======================================
-- After running above, you can migrate data:
-- POST http://localhost:3000/api/debug/migrate-data
-- =======================================
