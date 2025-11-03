-- =========================================
-- CREDIT COSTS TABLE - REAL-TIME SYNC
-- =========================================
-- This table stores dynamic credit costs for all content creation actions.
-- Only one row should exist at any time (singleton pattern).
-- Real-time changes are broadcast to all connected clients.

-- Create credit_costs table
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
INSERT INTO credit_costs (story_part, plan_step, worksheet, workbook, topic_suggestions)
VALUES (1, 2, 2, 3, 1)
ON CONFLICT (id) DO NOTHING;

-- Add comment to table
COMMENT ON TABLE credit_costs IS 'מנהל את עלויות הקרדיטים עבור כל פעולה במערכת. ניתן לעדכן על ידי משתמש העל.';

-- =========================================
-- ENABLE REAL-TIME REPLICATION
-- =========================================
-- This enables real-time broadcasts for any changes to credit_costs
-- All connected clients will receive instant updates when costs change

-- Enable Realtime for credit_costs table
ALTER PUBLICATION supabase_realtime ADD TABLE credit_costs;

-- =========================================
-- ROW LEVEL SECURITY (RLS)
-- =========================================
-- Enable RLS but allow all authenticated users to read
-- Only admins can update (enforced by application logic)

ALTER TABLE credit_costs ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can read credit costs
CREATE POLICY "Anyone can view credit costs"
ON credit_costs FOR SELECT
TO authenticated
USING (true);

-- Policy: Only admins can update credit costs (you'll need to add a check for admin role)
-- For now, we allow all authenticated users to update (admin check is in app)
CREATE POLICY "Admins can update credit costs"
ON credit_costs FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy: Allow inserts for initialization
CREATE POLICY "Allow insert for initialization"
ON credit_costs FOR INSERT
TO authenticated
WITH CHECK (true);

-- =========================================
-- TRIGGER FOR UPDATED_AT
-- =========================================
-- Automatically update the updated_at timestamp when row is modified

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_credit_costs_updated_at
    BEFORE UPDATE ON credit_costs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =========================================
-- API KEYS TABLE - MANAGEMENT
-- =========================================
-- This table stores Google Gemini API keys for content generation
-- Super admin can create multiple keys and assign them to users

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

-- Add comment
COMMENT ON TABLE api_keys IS 'מאגר מפתחות API של Google Gemini. מנהל-על יכול להוסיף ולנהל מפתחות.';

-- Enable RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can read active keys (for selection)
CREATE POLICY "Users can view active API keys"
ON api_keys FOR SELECT
TO authenticated
USING (is_active = true);

-- Policy: Only super admins can insert/update/delete
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

-- Trigger for updated_at
CREATE TRIGGER update_api_keys_updated_at
    BEFORE UPDATE ON api_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert a default/placeholder key (MUST BE REPLACED!)
INSERT INTO api_keys (key_name, api_key, description)
VALUES ('Default Key', 'REPLACE_WITH_YOUR_KEY', 'מפתח ברירת מחדל - יש להחליף!')
ON CONFLICT (key_name) DO NOTHING;

-- =========================================
-- ADD API_KEY_ID TO USERS TABLE
-- =========================================
-- Each user will be assigned a specific API key

-- Add columns if not exist
DO $$ 
BEGIN
    -- Add username column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'username'
    ) THEN
        ALTER TABLE users ADD COLUMN username VARCHAR(255);
        COMMENT ON COLUMN users.username IS 'שם המשתמש להצגה במערכת';
    END IF;
    
    -- Add api_key_id column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'api_key_id'
    ) THEN
        ALTER TABLE users ADD COLUMN api_key_id INTEGER REFERENCES api_keys(id);
    END IF;
    
    -- Add is_admin column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'is_admin'
    ) THEN
        ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT false;
        COMMENT ON COLUMN users.is_admin IS 'האם המשתמש הוא מנהל';
    END IF;
    
    -- Add is_super_admin column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'is_super_admin'
    ) THEN
        ALTER TABLE users ADD COLUMN is_super_admin BOOLEAN DEFAULT false;
        COMMENT ON COLUMN users.is_super_admin IS 'האם המשתמש הוא מנהל-על';
    END IF;
END $$;

-- Update username for existing users (from email)
UPDATE users 
SET username = SPLIT_PART(email, '@', 1)
WHERE username IS NULL AND email IS NOT NULL;

-- Set default key for existing users
UPDATE users 
SET api_key_id = (SELECT id FROM api_keys WHERE key_name = 'Default Key' LIMIT 1)
WHERE api_key_id IS NULL;

-- Add comment
COMMENT ON COLUMN users.api_key_id IS 'מפתח API שהוקצה למשתמש זה. משמש ליצירת תכנים.';

-- =========================================
-- ENABLE REAL-TIME FOR USERS TABLE
-- =========================================
-- Critical for admin dashboard to see live credit updates

ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE api_keys;

-- =========================================
-- UPDATED RLS POLICIES FOR USERS
-- =========================================
-- Allow admins to see all users in real-time

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own data
CREATE POLICY "Users can view own data"
ON users FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Policy: Admins can view all users
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

-- Policy: Users can update their own data
CREATE POLICY "Users can update own data"
ON users FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Policy: Admins can update all users
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
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid() 
        AND u.is_admin = true
    )
);

-- Policy: Allow user creation (for registration)
CREATE POLICY "Anyone can insert users"
ON users FOR INSERT
TO authenticated
WITH CHECK (true);

-- Trigger for users updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


