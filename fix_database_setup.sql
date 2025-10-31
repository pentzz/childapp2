-- ========================================
-- Complete Database Setup for Gaon Platform
-- ========================================
-- Run this in your Supabase SQL Editor
-- ========================================

-- 1. Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'parent' CHECK (role IN ('parent', 'admin')),
    credits INTEGER NOT NULL DEFAULT 100,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create profiles table if it doesn't exist
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

-- 3. Create stories table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.stories (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    profile_id INTEGER NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    story_parts JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create workbooks table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.workbooks (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    profile_id INTEGER NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    workbook_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Create learning_plans table if it doesn't exist
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
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_plans ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own data" ON public.users;
DROP POLICY IF EXISTS "Profiles are viewable by owner" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are insertable by owner" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are updatable by owner" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are deletable by owner" ON public.profiles;
DROP POLICY IF EXISTS "Stories are viewable by owner" ON public.stories;
DROP POLICY IF EXISTS "Stories are insertable by owner" ON public.stories;
DROP POLICY IF EXISTS "Stories are updatable by owner" ON public.stories;
DROP POLICY IF EXISTS "Stories are deletable by owner" ON public.stories;
DROP POLICY IF EXISTS "Workbooks are viewable by owner" ON public.workbooks;
DROP POLICY IF EXISTS "Workbooks are insertable by owner" ON public.workbooks;
DROP POLICY IF EXISTS "Workbooks are updatable by owner" ON public.workbooks;
DROP POLICY IF EXISTS "Workbooks are deletable by owner" ON public.workbooks;
DROP POLICY IF EXISTS "Learning plans are viewable by owner" ON public.learning_plans;
DROP POLICY IF EXISTS "Learning plans are insertable by owner" ON public.learning_plans;
DROP POLICY IF EXISTS "Learning plans are updatable by owner" ON public.learning_plans;
DROP POLICY IF EXISTS "Learning plans are deletable by owner" ON public.learning_plans;

-- Users table policies
CREATE POLICY "Users can view their own data"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own data"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own data"
    ON public.users FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Profiles table policies
CREATE POLICY "Profiles are viewable by owner"
    ON public.profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Profiles are insertable by owner"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Profiles are updatable by owner"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Profiles are deletable by owner"
    ON public.profiles FOR DELETE
    USING (auth.uid() = user_id);

-- Stories table policies
CREATE POLICY "Stories are viewable by owner"
    ON public.stories FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Stories are insertable by owner"
    ON public.stories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Stories are updatable by owner"
    ON public.stories FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Stories are deletable by owner"
    ON public.stories FOR DELETE
    USING (auth.uid() = user_id);

-- Workbooks table policies
CREATE POLICY "Workbooks are viewable by owner"
    ON public.workbooks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Workbooks are insertable by owner"
    ON public.workbooks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Workbooks are updatable by owner"
    ON public.workbooks FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Workbooks are deletable by owner"
    ON public.workbooks FOR DELETE
    USING (auth.uid() = user_id);

-- Learning plans table policies
CREATE POLICY "Learning plans are viewable by owner"
    ON public.learning_plans FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Learning plans are insertable by owner"
    ON public.learning_plans FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Learning plans are updatable by owner"
    ON public.learning_plans FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Learning plans are deletable by owner"
    ON public.learning_plans FOR DELETE
    USING (auth.uid() = user_id);

-- ========================================
-- AUTH TRIGGER
-- ========================================

-- Drop the old trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the function that copies the new user to public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert the new user into public.users with default values
  INSERT INTO public.users (id, email, role, credits)
  VALUES (
    NEW.id,
    NEW.email,
    'parent',
    100
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger that runs the function after a new user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant usage on the function
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon, authenticated;

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON public.stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_profile_id ON public.stories(profile_id);
CREATE INDEX IF NOT EXISTS idx_workbooks_user_id ON public.workbooks(user_id);
CREATE INDEX IF NOT EXISTS idx_workbooks_profile_id ON public.workbooks(profile_id);
CREATE INDEX IF NOT EXISTS idx_learning_plans_user_id ON public.learning_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_plans_profile_id ON public.learning_plans(profile_id);

-- ========================================
-- SUCCESS! ✅
-- ========================================
-- All tables, RLS policies, and triggers are now configured correctly.
-- Try logging in with Google OAuth again.
-- ========================================
