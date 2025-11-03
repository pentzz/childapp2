-- =========================================
-- CHECK AND FIX USERS TABLE
-- =========================================

-- =========================================
-- STEP 1: CHECK IF YOU EXIST IN USERS TABLE
-- =========================================

SELECT 
    id, 
    email, 
    username, 
    role,
    credits,
    is_admin, 
    is_super_admin,
    api_key_id
FROM users 
WHERE email = 'ofirbaranesad@gmail.com';

-- If you see a row with your email → GOOD!
-- If you see NOTHING → need to create the user

-- =========================================
-- STEP 2: CHECK ALL USERS IN AUTH.USERS
-- =========================================

SELECT 
    id,
    email,
    created_at
FROM auth.users
ORDER BY created_at DESC;

-- This shows all registered users from Supabase Auth

-- =========================================
-- STEP 3: INSERT MISSING USERS INTO PUBLIC.USERS
-- =========================================

-- This will copy all users from auth.users to public.users
-- ONLY if they don't exist yet

INSERT INTO public.users (id, email, username, role, credits, is_admin, is_super_admin)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'name', SPLIT_PART(au.email, '@', 1)) as username,
    'parent' as role,
    0 as credits,
    false as is_admin,
    false as is_super_admin
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.users pu WHERE pu.id = au.id
);

-- This copies ALL auth users to public.users if they're missing

-- =========================================
-- STEP 4: SET YOU AS SUPER ADMIN
-- =========================================

UPDATE public.users 
SET 
    is_admin = true, 
    is_super_admin = true,
    role = 'admin',
    username = 'ofirbaranesad'
WHERE email = 'ofirbaranesad@gmail.com';

-- =========================================
-- STEP 5: ASSIGN DEFAULT API KEY
-- =========================================

-- First, make sure default API key exists
INSERT INTO api_keys (key_name, api_key, description, is_active)
VALUES ('Default Key', 'YOUR_GOOGLE_GEMINI_API_KEY_HERE', 'מפתח ברירת מחדל', true)
ON CONFLICT (key_name) DO NOTHING;

-- Assign it to all users
UPDATE public.users
SET api_key_id = (SELECT id FROM api_keys WHERE key_name = 'Default Key' LIMIT 1)
WHERE api_key_id IS NULL;

-- =========================================
-- STEP 6: VERIFY EVERYTHING
-- =========================================

-- Check your user again
SELECT 
    id, 
    email, 
    username, 
    role,
    credits,
    is_admin, 
    is_super_admin,
    api_key_id,
    created_at
FROM public.users 
WHERE email = 'ofirbaranesad@gmail.com';

-- Check all users count
SELECT COUNT(*) as total_users FROM public.users;

-- Check all users details
SELECT 
    email,
    username,
    role,
    credits,
    is_admin,
    is_super_admin
FROM public.users
ORDER BY created_at DESC;

-- =========================================
-- EXPECTED RESULTS:
-- =========================================
-- After running this, you should see:
-- 1. Your email with is_admin=true, is_super_admin=true
-- 2. total_users > 0 (at least you!)
-- 3. All registered users from auth.users

