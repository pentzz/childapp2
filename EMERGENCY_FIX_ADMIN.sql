-- =========================================
-- EMERGENCY FIX - SET SUPER ADMIN NOW!
-- =========================================
-- This MUST work. Period.

-- =========================================
-- STEP 1: CHECK CURRENT STATUS
-- =========================================

SELECT 
    email, 
    username,
    role,
    is_admin, 
    is_super_admin,
    credits
FROM users 
WHERE email = 'ofirbaranesad@gmail.com';

-- If you see:
-- is_admin: false or NULL → PROBLEM!
-- is_super_admin: false or NULL → PROBLEM!

-- =========================================
-- STEP 2: FIX IT NOW
-- =========================================

UPDATE users 
SET 
    is_admin = true, 
    is_super_admin = true,
    role = 'admin',
    username = 'ofirbaranesad'
WHERE email = 'ofirbaranesad@gmail.com';

-- =========================================
-- STEP 3: VERIFY IT'S FIXED
-- =========================================

SELECT 
    email, 
    username,
    role,
    is_admin, 
    is_super_admin,
    credits
FROM users 
WHERE email = 'ofirbaranesad@gmail.com';

-- You MUST see:
-- is_admin: true ✅
-- is_super_admin: true ✅
-- role: admin ✅

-- =========================================
-- STEP 4: CHECK ALL USERS
-- =========================================

SELECT 
    email,
    username,
    role,
    is_admin,
    is_super_admin,
    credits
FROM users
ORDER BY email;

-- You should see ALL 5 users from the screenshot!

-- =========================================
-- DONE!
-- =========================================
-- Now:
-- 1. In the app, press F12 to open Console
-- 2. Type: localStorage.clear(); location.reload();
-- 3. Press Enter
-- 4. Log in again with ofirbaranesad@gmail.com
-- 5. Go to Admin Dashboard
-- 6. You WILL see all 5 users!

