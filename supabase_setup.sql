-- ========================================
-- Supabase Setup for API Keys Pool System
-- ========================================

-- 1. Create API Keys Pool table
CREATE TABLE IF NOT EXISTS api_keys_pool (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key TEXT NOT NULL UNIQUE,
    is_assigned BOOLEAN DEFAULT FALSE,
    assigned_to_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

-- 2. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_keys_pool_is_assigned ON api_keys_pool(is_assigned);
CREATE INDEX IF NOT EXISTS idx_api_keys_pool_assigned_to ON api_keys_pool(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_pool_is_active ON api_keys_pool(is_active);

-- 3. Add api_key column to users table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'api_key'
    ) THEN
        ALTER TABLE users ADD COLUMN api_key TEXT;
    END IF;
END $$;

-- 4. Create function to auto-assign API key to new user
CREATE OR REPLACE FUNCTION assign_api_key_to_user()
RETURNS TRIGGER AS $$
DECLARE
    available_key RECORD;
BEGIN
    -- Find an available API key from the pool
    SELECT * INTO available_key
    FROM api_keys_pool
    WHERE is_assigned = FALSE
      AND is_active = TRUE
    ORDER BY created_at ASC
    LIMIT 1;

    -- If an available key was found, assign it
    IF available_key.id IS NOT NULL THEN
        -- Update the API key pool
        UPDATE api_keys_pool
        SET is_assigned = TRUE,
            assigned_to_user_id = NEW.id,
            assigned_at = NOW()
        WHERE id = available_key.id;

        -- Update the user with the assigned API key
        UPDATE users
        SET api_key = available_key.api_key
        WHERE id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger to auto-assign API key on user creation
DROP TRIGGER IF EXISTS trigger_assign_api_key ON users;
CREATE TRIGGER trigger_assign_api_key
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION assign_api_key_to_user();

-- 6. Add matimasganow@gmail.com as secondary admin (if exists)
-- Note: This will only work if the user already exists in auth.users
DO $$
DECLARE
    mati_user_id UUID;
BEGIN
    -- Get the user ID for matimasganow@gmail.com
    SELECT id INTO mati_user_id
    FROM auth.users
    WHERE email = 'matimasganow@gmail.com';

    -- If user exists, update their role to admin
    IF mati_user_id IS NOT NULL THEN
        UPDATE users
        SET is_admin = TRUE
        WHERE id = mati_user_id;

        RAISE NOTICE 'Successfully made matimasganow@gmail.com an admin';
    ELSE
        RAISE NOTICE 'User matimasganow@gmail.com not found - they need to register first';
    END IF;
END $$;

-- 7. Ensure ofirbaranesad@gmail.com is admin
DO $$
DECLARE
    ofir_user_id UUID;
BEGIN
    SELECT id INTO ofir_user_id
    FROM auth.users
    WHERE email = 'ofirbaranesad@gmail.com';

    IF ofir_user_id IS NOT NULL THEN
        UPDATE users
        SET is_admin = TRUE
        WHERE id = ofir_user_id;

        RAISE NOTICE 'Successfully confirmed ofirbaranesad@gmail.com as admin';
    END IF;
END $$;

-- 8. Grant permissions (RLS policies)
-- Enable RLS
ALTER TABLE api_keys_pool ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all API keys
CREATE POLICY "Admins can view all API keys" ON api_keys_pool
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_admin = TRUE
        )
    );

-- Policy: Admins can insert API keys
CREATE POLICY "Admins can insert API keys" ON api_keys_pool
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_admin = TRUE
        )
    );

-- Policy: Admins can update API keys
CREATE POLICY "Admins can update API keys" ON api_keys_pool
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_admin = TRUE
        )
    );

-- Policy: Admins can delete API keys
CREATE POLICY "Admins can delete API keys" ON api_keys_pool
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_admin = TRUE
        )
    );

-- 9. Insert sample API keys (replace with real keys later)
-- IMPORTANT: Delete these and add real API keys!
INSERT INTO api_keys_pool (api_key, notes) VALUES
    ('SAMPLE_KEY_1_REPLACE_ME', 'Sample key 1 - REPLACE WITH REAL KEY'),
    ('SAMPLE_KEY_2_REPLACE_ME', 'Sample key 2 - REPLACE WITH REAL KEY'),
    ('SAMPLE_KEY_3_REPLACE_ME', 'Sample key 3 - REPLACE WITH REAL KEY')
ON CONFLICT (api_key) DO NOTHING;

-- 10. Show summary
DO $$
DECLARE
    total_keys INTEGER;
    assigned_keys INTEGER;
    available_keys INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_keys FROM api_keys_pool WHERE is_active = TRUE;
    SELECT COUNT(*) INTO assigned_keys FROM api_keys_pool WHERE is_assigned = TRUE AND is_active = TRUE;
    SELECT COUNT(*) INTO available_keys FROM api_keys_pool WHERE is_assigned = FALSE AND is_active = TRUE;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'API Keys Pool Summary:';
    RAISE NOTICE '  Total Active Keys: %', total_keys;
    RAISE NOTICE '  Assigned Keys: %', assigned_keys;
    RAISE NOTICE '  Available Keys: %', available_keys;
    RAISE NOTICE '========================================';
    RAISE NOTICE 'IMPORTANT: Replace sample API keys with real Google Generative AI API keys!';
    RAISE NOTICE '========================================';
END $$;
