-- =========================================
-- FINAL FIX - SUPER SIMPLE SQL
-- =========================================
-- Copy this ENTIRE file and run it in Supabase SQL Editor
-- This will fix everything once and for all!

-- =========================================
-- STEP 1: ADD COLUMNS TO USERS TABLE
-- =========================================

-- Add username column
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(255);

-- Add is_admin column
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Add is_super_admin column
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;

-- Add role column
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'parent';

-- Add credits column
ALTER TABLE users ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 0;

-- Add email column (might already exist from Supabase Auth)
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Add created_at column
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add updated_at column
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add api_key_id column (we'll create api_keys table later)
-- Skip this for now, will add after api_keys table exists

-- Update username for existing users (from email)
UPDATE users 
SET username = SPLIT_PART(email, '@', 1)
WHERE (username IS NULL OR username = '') AND email IS NOT NULL;

-- =========================================
-- STEP 2: CREATE CREDIT COSTS TABLE
-- =========================================

CREATE TABLE IF NOT EXISTS credit_costs (
    id SERIAL PRIMARY KEY,
    story_part INTEGER NOT NULL DEFAULT 1,
    plan_step INTEGER NOT NULL DEFAULT 2,
    worksheet INTEGER NOT NULL DEFAULT 2,
    workbook INTEGER NOT NULL DEFAULT 3,
    topic_suggestions INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default values if table is empty
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM credit_costs LIMIT 1) THEN
        INSERT INTO credit_costs (story_part, plan_step, worksheet, workbook, topic_suggestions)
        VALUES (1, 2, 2, 3, 1);
    END IF;
END $$;

-- =========================================
-- STEP 3: CREATE API KEYS TABLE
-- =========================================

CREATE TABLE IF NOT EXISTS api_keys (
    id SERIAL PRIMARY KEY,
    key_name VARCHAR(255) NOT NULL UNIQUE,
    api_key TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default API key
INSERT INTO api_keys (key_name, api_key, description, is_active)
VALUES ('Default Key', 'YOUR_GOOGLE_GEMINI_API_KEY_HERE', 'מפתח ברירת מחדל - החלף אותי!', true)
ON CONFLICT (key_name) DO NOTHING;

-- Now add api_key_id to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS api_key_id INTEGER REFERENCES api_keys(id);

-- Assign default key to all users
UPDATE users 
SET api_key_id = (SELECT id FROM api_keys WHERE key_name = 'Default Key' LIMIT 1)
WHERE api_key_id IS NULL;

-- =========================================
-- STEP 4: CREATE TRIGGERS
-- =========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Users trigger
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Credit costs trigger
DROP TRIGGER IF EXISTS update_credit_costs_updated_at ON credit_costs;
CREATE TRIGGER update_credit_costs_updated_at
    BEFORE UPDATE ON credit_costs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- API keys trigger
DROP TRIGGER IF EXISTS update_api_keys_updated_at ON api_keys;
CREATE TRIGGER update_api_keys_updated_at
    BEFORE UPDATE ON api_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =========================================
-- STEP 5: ROW LEVEL SECURITY (RLS)
-- =========================================

-- Enable RLS on users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Anyone can insert users" ON users;

-- Create new policies
CREATE POLICY "Users can view own data"
ON users FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Admins can view all users"
ON users FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid() 
        AND u.is_admin = true
    )
);

CREATE POLICY "Users can update own data"
ON users FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can update all users"
ON users FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid() 
        AND u.is_admin = true
    )
)
WITH CHECK (true);

CREATE POLICY "Anyone can insert users"
ON users FOR INSERT
TO authenticated
WITH CHECK (true);

-- Enable RLS on credit_costs
ALTER TABLE credit_costs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view credit costs" ON credit_costs;
DROP POLICY IF EXISTS "Super admins can update credit costs" ON credit_costs;
DROP POLICY IF EXISTS "Allow insert for initialization" ON credit_costs;

CREATE POLICY "Anyone can view credit costs"
ON credit_costs FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Super admins can update credit costs"
ON credit_costs FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.is_super_admin = true
    )
)
WITH CHECK (true);

CREATE POLICY "Allow insert for initialization"
ON credit_costs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Enable RLS on api_keys
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view active API keys" ON api_keys;
DROP POLICY IF EXISTS "Super admins can manage API keys" ON api_keys;

CREATE POLICY "Users can view active API keys"
ON api_keys FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Super admins can manage API keys"
ON api_keys FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.is_super_admin = true
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.is_super_admin = true
    )
);

-- =========================================
-- STEP 6: ENABLE REAL-TIME
-- =========================================

-- Method 1: Try to add tables (will error if already exists, that's OK)
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE users;
EXCEPTION
    WHEN duplicate_object THEN
        NULL; -- Table already in publication, ignore
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE credit_costs;
EXCEPTION
    WHEN duplicate_object THEN
        NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE api_keys;
EXCEPTION
    WHEN duplicate_object THEN
        NULL;
END $$;

-- =========================================
-- STEP 7: SET YOU AS SUPER ADMIN
-- =========================================
-- IMPORTANT: This will set ofirbaranesad@gmail.com as super admin

UPDATE users 
SET 
    is_admin = true, 
    is_super_admin = true,
    role = 'admin'
WHERE email = 'ofirbaranesad@gmail.com';

-- =========================================
-- STEP 8: VERIFY EVERYTHING WORKS
-- =========================================

-- Check your admin status
SELECT 
    id, 
    email, 
    username, 
    is_admin, 
    is_super_admin, 
    role,
    credits 
FROM users 
WHERE email = 'ofirbaranesad@gmail.com';

-- You should see:
-- is_admin: true
-- is_super_admin: true
-- role: admin

-- =========================================
-- DONE!
-- =========================================
-- Now:
-- 1. Log out from the app
-- 2. Log back in
-- 3. Go to Admin Dashboard
-- 4. Everything should work!

