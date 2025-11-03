-- =========================================
-- ADD AUTOMATIC USER CREATION TRIGGER
-- =========================================
-- This will automatically create a row in public.users
-- whenever someone registers via Supabase Auth

-- =========================================
-- STEP 1: CREATE TRIGGER FUNCTION
-- =========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_key_id INTEGER;
BEGIN
    -- Get default API key ID
    SELECT id INTO default_key_id
    FROM api_keys
    WHERE key_name = 'Default Key'
    LIMIT 1;

    -- Insert new user into public.users
    INSERT INTO public.users (
        id,
        email,
        username,
        role,
        credits,
        is_admin,
        is_super_admin,
        api_key_id
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'name',
            SPLIT_PART(NEW.email, '@', 1)
        ),
        'parent',
        0,
        false,
        false,
        default_key_id
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================
-- STEP 2: CREATE TRIGGER
-- =========================================

-- Drop old trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create new trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =========================================
-- STEP 3: VERIFY TRIGGER EXISTS
-- =========================================

SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- You should see:
-- trigger_name: on_auth_user_created
-- event_manipulation: INSERT
-- event_object_table: users
-- action_statement: EXECUTE FUNCTION public.handle_new_user()

-- =========================================
-- DONE!
-- =========================================
-- Now whenever someone registers:
-- 1. They're added to auth.users (Supabase Auth)
-- 2. AUTOMATICALLY added to public.users (our app)
-- 3. With default credits, API key, etc.

