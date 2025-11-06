-- =========================================
-- בדיקת ותיקון RLS Policies ל-users table
-- =========================================

-- 1. בדוק אם RLS מופעל
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'users';

-- 2. בדוק את כל ה-Policies הקיימות
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users';

-- 3. אם RLS מופעל אבל אין policy - נסה להשבית זמנית או ליצור policy
-- אופציה 1: להשבית RLS זמנית (רק לבדיקה)
-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- אופציה 2: ליצור policy שמאפשרת SELECT למשתמשים מאומתים
-- אם יש כבר policy, נמחק אותה ונגדיר מחדש

-- מחיקת policies קיימות
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Anyone can view users" ON public.users;

-- הפעלת RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: משתמשים יכולים לראות את הנתונים שלהם
CREATE POLICY "Users can view own data"
ON public.users FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Policy: מנהלים יכולים לראות את כל המשתמשים
CREATE POLICY "Admins can view all users"
ON public.users FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() 
        AND (u.is_admin = true OR u.is_super_admin = true)
    )
);

-- Policy: כל משתמש מאומת יכול לראות את הנתונים שלו (גיבוי)
CREATE POLICY "Authenticated users can view own data"
ON public.users FOR SELECT
TO authenticated
USING (id = auth.uid());

-- וידוא שה-policies נוצרו
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users';

