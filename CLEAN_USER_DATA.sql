-- ========================================
-- 🧹 סקריפט לניקוי נתוני משתמשים
-- ========================================
-- סקריפט זה מנקה את כל הסיפורים והתכנים שנוצרו על ידי משתמשים
-- ⚠️ שימו לב: פעולה זו בלתי הפיכה!
-- ========================================

BEGIN;

-- מחיקת כל חלקי הסיפורים
DELETE FROM public.content_sections;

-- מחיקת כל הסיפורים ששמורים
DELETE FROM public.saved_content;

-- מחיקת לוגים של פעילות מנהלים (אופציונלי)
DELETE FROM public.admin_activity_logs;

-- איפוס ספירת הקרדיטים של כל המשתמשים (אופציונלי)
-- אם תרצה לאפס את הקרדיטים של כולם, הסר את ההערה מהשורות הבאות:
-- UPDATE public.users SET credits = 100 WHERE role = 'user';
-- UPDATE public.users SET credits = 500 WHERE role = 'admin';
-- UPDATE public.users SET credits = 999999 WHERE role = 'super_admin';

-- מחיקת היסטוריית טרנזקציות קרדיטים
DELETE FROM public.credit_transactions;

COMMIT;

DO $$
BEGIN
    RAISE NOTICE '✅ ניקוי נתונים הושלם בהצלחה!';
    RAISE NOTICE '📊 כל הסיפורים והתכנים נמחקו';
    RAISE NOTICE '🔄 המערכת מוכנה לשימוש מחדש';
END $$;
