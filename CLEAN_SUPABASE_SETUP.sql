-- =========================================
-- CLEAN SUPABASE SETUP FOR CHILDAPP2
-- =========================================
-- Run this ONCE in Supabase SQL Editor
-- This will set up everything needed for the admin dashboard

-- =========================================
-- 1. USERS TABLE SETUP
-- =========================================

-- Add missing columns to users table (if not exist)
DO $$ 
BEGIN
    -- username
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'username'
    ) THEN
        ALTER TABLE users ADD COLUMN username VARCHAR(255);
    END IF;
    
    -- is_admin
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'is_admin'
    ) THEN
        ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT false;
    END IF;
    
    -- is_super_admin
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'is_super_admin'
    ) THEN
        ALTER TABLE users ADD COLUMN is_super_admin BOOLEAN DEFAULT false;
    END IF;
    
    -- role
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'role'
    ) THEN
        ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'parent';
    END IF;
    
    -- credits
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'credits'
    ) THEN
        ALTER TABLE users ADD COLUMN credits INTEGER DEFAULT 0;
    END IF;
    
    -- email
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'email'
    ) THEN
        ALTER TABLE users ADD COLUMN email VARCHAR(255);
    END IF;
    
    -- created_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE users ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- updated_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Update username for existing users (from email)
UPDATE users 
SET username = SPLIT_PART(email, '@', 1)
WHERE (username IS NULL OR username = '') AND email IS NOT NULL;

-- =========================================
-- 2. CREDIT COSTS TABLE
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

-- Insert default values if empty
INSERT INTO credit_costs (story_part, plan_step, worksheet, workbook, topic_suggestions)
SELECT 1, 2, 2, 3, 1
WHERE NOT EXISTS (SELECT 1 FROM credit_costs LIMIT 1);

-- =========================================
-- 3. API KEYS TABLE
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

-- Add api_key_id to users
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'api_key_id'
    ) THEN
        ALTER TABLE users ADD COLUMN api_key_id INTEGER REFERENCES api_keys(id);
    END IF;
END $$;

-- Insert default API key if not exists
INSERT INTO api_keys (key_name, api_key, description, is_active)
VALUES ('Default Key', 'YOUR_GOOGLE_GEMINI_API_KEY_HERE', 'מפתח ברירת מחדל - החלף אותי!', true)
ON CONFLICT (key_name) DO NOTHING;

-- Assign default key to users without one
UPDATE users 
SET api_key_id = (SELECT id FROM api_keys WHERE key_name = 'Default Key' LIMIT 1)
WHERE api_key_id IS NULL;

-- =========================================
-- 4. TRIGGERS FOR UPDATED_AT
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
-- 5. ROW LEVEL SECURITY (RLS)
-- =========================================

-- USERS TABLE
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Anyone can insert users" ON users;

-- New policies
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

-- CREDIT COSTS TABLE
ALTER TABLE credit_costs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view credit costs" ON credit_costs;
DROP POLICY IF EXISTS "Admins can update credit costs" ON credit_costs;
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

-- API KEYS TABLE
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
-- 6. ENABLE REAL-TIME REPLICATION
-- =========================================

-- Enable realtime for tables (drop and re-add to avoid errors)
DO $$
BEGIN
    -- Remove tables from publication if they exist
    ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS users;
    ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS credit_costs;
    ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS api_keys;
    
    -- Add tables to publication
    ALTER PUBLICATION supabase_realtime ADD TABLE users;
    ALTER PUBLICATION supabase_realtime ADD TABLE credit_costs;
    ALTER PUBLICATION supabase_realtime ADD TABLE api_keys;
EXCEPTION
    WHEN OTHERS THEN
        -- If any error, just add the tables (they might not be in the publication yet)
        ALTER PUBLICATION supabase_realtime ADD TABLE users;
        ALTER PUBLICATION supabase_realtime ADD TABLE credit_costs;
        ALTER PUBLICATION supabase_realtime ADD TABLE api_keys;
END $$;

-- =========================================
-- 7. SET YOURSELF AS SUPER ADMIN
-- =========================================
-- IMPORTANT: Change the email to YOUR email!

UPDATE users 
SET 
    is_admin = true, 
    is_super_admin = true,
    role = 'admin'
WHERE email = 'ofirbaranesad@gmail.com';  -- <- CHANGE THIS TO YOUR EMAIL!

-- =========================================
-- 8. VERIFICATION QUERIES
-- =========================================
-- Run these to verify everything works:

-- Check your admin status
SELECT id, email, username, is_admin, is_super_admin, credits 
FROM users 
WHERE email = 'ofirbaranesad@gmail.com';  -- <- CHANGE THIS TO YOUR EMAIL!

-- Check all users
SELECT id, email, username, is_admin, is_super_admin, credits, api_key_id
FROM users 
ORDER BY created_at DESC;

-- Check credit costs
SELECT * FROM credit_costs;

-- Check API keys
SELECT id, key_name, description, is_active FROM api_keys;

-- =========================================
-- DONE! 
-- =========================================
-- After running this:
-- 1. Log out and log back in
-- 2. Go to Admin Dashboard
-- 3. You should see all users and be able to edit everything

