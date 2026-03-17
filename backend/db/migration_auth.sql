-- Migration: Add authentication fields
-- Run this in Supabase SQL Editor

-- 1. Add password_hash to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- 2. Add invite_code to companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS invite_code VARCHAR(50);

-- 3. Make company_id nullable in users (for personal accounts)
ALTER TABLE users ALTER COLUMN company_id DROP NOT NULL;

-- 4. Create unique index for invite_code
CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_invite_code ON companies(invite_code);

-- 5. Enable RLS on users (if not already enabled)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 6. Update RLS policy to allow read/write for authenticated users
DROP POLICY IF EXISTS "Allow authenticated users to manage own user" ON users;
CREATE POLICY "Allow authenticated users to manage own user" ON users 
  FOR ALL TO authenticated 
  USING (true) WITH CHECK (true);

-- 7. Allow anon to create users (signup)
DROP POLICY IF EXISTS "Allow anon to insert users" ON users;
CREATE POLICY "Allow anon to insert users" ON users 
  FOR INSERT TO anon 
  WITH CHECK (true);

-- 8. Allow anon to select users (login)
DROP POLICY IF EXISTS "Allow anon to select users" ON users;
CREATE POLICY "Allow anon to select users" ON users 
  FOR SELECT TO anon 
  USING (true);
