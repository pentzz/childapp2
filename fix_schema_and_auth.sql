-- ========================================
-- FINAL FIX: Schema + Auth Setup
-- ========================================
-- This fixes the missing email column issue
-- Run this in your Supabase SQL Editor
-- ========================================

-- Step 1: First, let's see what columns exist (for debugging)
-- Run this separately to see current structure:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' AND table_schema = 'public';

-- Step 2: Drop and recreate users table with correct schema
DROP TABLE IF EXISTS public.users CASCADE;

-- Create users table with ALL required columns
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT,
    email TEXT,  -- ← זו העמודה שחסרה!
    role TEXT NOT NULL DEFAULT 'parent' CHECK (role IN ('parent', 'admin')),
    credits INTEGER NOT NULL DEFAULT 100,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 3: Create other tables (they depend on users table)
CREATE TABLE IF NOT EXISTS public.profiles (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('בן', 'בת')),
    interests TEXT NOT NULL,
    learning_goals TEXT,
    photo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.stories (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    profile_id INTEGER NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    story_parts JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.workbooks (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    profile_id INTEGER NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    workbook_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.learning_plans (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    profile_id INTEGER NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    plan_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================
-- Step 4: Create the trigger FIRST (before enabling RLS)
-- ========================================

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the trigger function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert new user with email detection for admin
  INSERT INTO public.users (id, email, role, credits)
  VALUES (
    NEW.id,
    NEW.email,
    CASE
      WHEN NEW.email = 'ofirbaranesad@gmail.com' THEN 'admin'
      ELSE 'parent'
    END,
    CASE
      WHEN NEW.email = 'ofirbaranesad@gmail.com' THEN 999999
      ELSE 100
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = CASE
      WHEN EXCLUDED.email = 'ofirbaranesad@gmail.com' THEN 'admin'
      ELSE public.users.role
    END,
    credits = CASE
      WHEN EXCLUDED.email = 'ofirbaranesad@gmail.com' THEN GREATEST(public.users.credits, 999999)
      ELSE public.users.credits
    END;

  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- ========================================
-- Step 5: Enable RLS and create policies
-- ========================================

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_plans ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies (in case they exist)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname
              FROM pg_policies
              WHERE schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.schemaname || '.' || r.tablename;
    END LOOP;
END $$;

-- Users table policies
CREATE POLICY "Users can view their own data"
    ON public.users FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own data"
    ON public.users FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Note: No INSERT policy for authenticated users!
-- Only the trigger (service_role) can insert

-- Profiles table policies
CREATE POLICY "Profiles are viewable by owner"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Profiles are insertable by owner"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Profiles are updatable by owner"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Profiles are deletable by owner"
    ON public.profiles FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Stories table policies
CREATE POLICY "Stories are viewable by owner"
    ON public.stories FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Stories are insertable by owner"
    ON public.stories FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Stories are updatable by owner"
    ON public.stories FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Stories are deletable by owner"
    ON public.stories FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Workbooks table policies
CREATE POLICY "Workbooks are viewable by owner"
    ON public.workbooks FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Workbooks are insertable by owner"
    ON public.workbooks FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Workbooks are updatable by owner"
    ON public.workbooks FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Workbooks are deletable by owner"
    ON public.workbooks FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Learning plans table policies
CREATE POLICY "Learning plans are viewable by owner"
    ON public.learning_plans FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Learning plans are insertable by owner"
    ON public.learning_plans FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Learning plans are updatable by owner"
    ON public.learning_plans FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Learning plans are deletable by owner"
    ON public.learning_plans FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- ========================================
-- Step 6: Create indexes
-- ========================================

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON public.stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_profile_id ON public.stories(profile_id);
CREATE INDEX IF NOT EXISTS idx_workbooks_user_id ON public.workbooks(user_id);
CREATE INDEX IF NOT EXISTS idx_workbooks_profile_id ON public.workbooks(profile_id);
CREATE INDEX IF NOT EXISTS idx_learning_plans_user_id ON public.learning_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_plans_profile_id ON public.learning_plans(profile_id);

-- ========================================
-- Step 7: Add admin user if already exists in auth.users
-- ========================================

DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Check if admin exists in auth.users
    SELECT id INTO admin_user_id
    FROM auth.users
    WHERE email = 'ofirbaranesad@gmail.com';

    IF admin_user_id IS NOT NULL THEN
        -- Admin exists, add to public.users
        INSERT INTO public.users (id, email, role, credits)
        VALUES (admin_user_id, 'ofirbaranesad@gmail.com', 'admin', 999999)
        ON CONFLICT (id) DO UPDATE SET
            email = 'ofirbaranesad@gmail.com',
            role = 'admin',
            credits = GREATEST(public.users.credits, 999999);

        RAISE NOTICE '✅ Admin user added/updated successfully with unlimited credits';
    ELSE
        RAISE NOTICE '⚠️ Admin user not found in auth.users - will be created on first login';
    END IF;
END $$;

-- ========================================
-- VERIFICATION
-- ========================================

-- Show current users
SELECT
    id,
    email,
    role,
    credits,
    created_at
FROM public.users;

-- Show trigger exists
SELECT
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- ========================================
-- SUCCESS! ✅
-- ========================================
-- Schema is now correct with email column
-- Trigger will create users automatically
-- ofirbaranesad@gmail.com gets admin role + unlimited credits
--
-- Now try logging in with Google!
-- ========================================
