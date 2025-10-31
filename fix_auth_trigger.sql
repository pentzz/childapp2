-- ========================================
-- FIX: Auth Trigger for Gaon Platform
-- ========================================
-- This script fixes the handle_new_user trigger
-- Run this in your Supabase SQL Editor
-- ========================================

-- 1. Drop the old trigger and function if they exist (to be safe)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Create the function that copies the new user to public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert the new user into public.users with default values
  INSERT INTO public.users (id, role, credits)
  VALUES (
    NEW.id,
    'parent',  -- Default role
    100        -- Default credits
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the trigger that runs the function after a new user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Grant usage on the function
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon, authenticated;

-- ========================================
-- Verification Query (Run after the above)
-- ========================================
-- Check if the trigger exists:
-- SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Check if the function exists:
-- SELECT * FROM pg_proc WHERE proname = 'handle_new_user';

-- ========================================
-- SUCCESS! ✅
-- ========================================
-- The trigger is now configured correctly.
-- When a new user signs up via Google OAuth,
-- they will automatically be added to public.users
-- with role='parent' and credits=100.
-- ========================================

