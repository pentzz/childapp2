-- ========================================
-- Gaon (גאון) - Supabase Database Schema
-- ========================================
-- This SQL script creates the database schema for the Gaon learning platform
-- Run this in your Supabase SQL Editor
-- ========================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- Table: public.users
-- ========================================
-- Extended user profile data that supplements auth.users
-- This table is automatically populated via trigger when a new user signs up

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'parent' CHECK (role IN ('parent', 'admin')),
    credits INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own data"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own data"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

-- Admin can view all users
CREATE POLICY "Admins can view all users"
    ON public.users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admin can update all users
CREATE POLICY "Admins can update all users"
    ON public.users FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ========================================
-- Table: public.profiles
-- ========================================
-- Child profiles associated with parent users

CREATE TABLE IF NOT EXISTS public.profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    age INTEGER NOT NULL CHECK (age > 0 AND age < 18),
    gender TEXT NOT NULL CHECK (gender IN ('בן', 'בת')),
    interests TEXT NOT NULL,
    learning_goals TEXT,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles table
CREATE POLICY "Users can view their own profiles"
    ON public.profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profiles"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profiles"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profiles"
    ON public.profiles FOR DELETE
    USING (auth.uid() = user_id);

-- Admin can view all profiles
CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ========================================
-- Table: public.stories
-- ========================================
-- Stores interactive stories created by users

CREATE TABLE IF NOT EXISTS public.stories (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    profile_id BIGINT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    story_parts JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_stories_user_id ON public.stories(user_id);
CREATE INDEX idx_stories_profile_id ON public.stories(profile_id);

-- Enable Row Level Security
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stories table
CREATE POLICY "Users can view their own stories"
    ON public.stories FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stories"
    ON public.stories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stories"
    ON public.stories FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stories"
    ON public.stories FOR DELETE
    USING (auth.uid() = user_id);

-- ========================================
-- Table: public.workbooks
-- ========================================
-- Stores interactive workbooks created by users

CREATE TABLE IF NOT EXISTS public.workbooks (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    profile_id BIGINT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    workbook_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_workbooks_user_id ON public.workbooks(user_id);
CREATE INDEX idx_workbooks_profile_id ON public.workbooks(profile_id);

-- Enable Row Level Security
ALTER TABLE public.workbooks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workbooks table
CREATE POLICY "Users can view their own workbooks"
    ON public.workbooks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workbooks"
    ON public.workbooks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workbooks"
    ON public.workbooks FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workbooks"
    ON public.workbooks FOR DELETE
    USING (auth.uid() = user_id);

-- ========================================
-- Table: public.learning_plans
-- ========================================
-- Stores guided learning plans created by users

CREATE TABLE IF NOT EXISTS public.learning_plans (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    profile_id BIGINT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    plan_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_learning_plans_user_id ON public.learning_plans(user_id);
CREATE INDEX idx_learning_plans_profile_id ON public.learning_plans(profile_id);

-- Enable Row Level Security
ALTER TABLE public.learning_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies for learning_plans table
CREATE POLICY "Users can view their own learning plans"
    ON public.learning_plans FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own learning plans"
    ON public.learning_plans FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own learning plans"
    ON public.learning_plans FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own learning plans"
    ON public.learning_plans FOR DELETE
    USING (auth.uid() = user_id);

-- ========================================
-- Triggers & Functions
-- ========================================

-- Function to update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stories_updated_at
    BEFORE UPDATE ON public.stories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workbooks_updated_at
    BEFORE UPDATE ON public.workbooks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_plans_updated_at
    BEFORE UPDATE ON public.learning_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- Function to auto-create user profile on signup
-- ========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, role, credits)
    VALUES (NEW.id, 'parent', 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call function on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- Storage Buckets (for profile photos)
-- ========================================
-- Run this in the Supabase Storage section or via SQL:

INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can view profile photos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'profile-photos');

CREATE POLICY "Users can upload their own profile photos"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'profile-photos' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update their own profile photos"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'profile-photos' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own profile photos"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'profile-photos' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- ========================================
-- Indexes for Performance
-- ========================================

-- Additional indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON public.stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workbooks_created_at ON public.workbooks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_learning_plans_created_at ON public.learning_plans(created_at DESC);

-- ========================================
-- Initial Data (Optional)
-- ========================================
-- You can insert an admin user manually after signup:
-- UPDATE public.users SET role = 'admin', credits = 999999 WHERE id = 'YOUR_USER_UUID';

-- ========================================
-- Helpful Queries
-- ========================================

-- View all users with their profile counts:
-- SELECT 
--     u.id, 
--     u.role, 
--     u.credits,
--     COUNT(p.id) as profile_count
-- FROM public.users u
-- LEFT JOIN public.profiles p ON u.id = p.user_id
-- GROUP BY u.id;

-- View all stories for a specific user:
-- SELECT * FROM public.stories WHERE user_id = 'YOUR_USER_UUID' ORDER BY created_at DESC;

-- Get profile with all their content:
-- SELECT 
--     p.*,
--     (SELECT COUNT(*) FROM stories WHERE profile_id = p.id) as story_count,
--     (SELECT COUNT(*) FROM workbooks WHERE profile_id = p.id) as workbook_count,
--     (SELECT COUNT(*) FROM learning_plans WHERE profile_id = p.id) as plan_count
-- FROM profiles p
-- WHERE p.user_id = 'YOUR_USER_UUID';

-- ========================================
-- SETUP COMPLETE! 🎉
-- ========================================
-- Next steps:
-- 1. Run this script in your Supabase SQL Editor
-- 2. Add your Supabase URL and Anon Key to .env.local
-- 3. Test user signup and profile creation
-- 4. Start building Supabase integration in your React components
-- ========================================

