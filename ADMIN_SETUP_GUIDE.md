# 🛡️ מדריך התקנה ושימוש - מערכת ניהול מנהלים

## 📋 תוכן עניינים

1. [התקנה ראשונית](#התקנה-ראשונית)
2. [טבלאות במערכת](#טבלאות-במערכת)
3. [פונקציות עזר](#פונקציות-עזר)
4. [שימוש ב-AdminDashboard](#שימוש-ב-admindashboard)
5. [אבטחה והרשאות](#אבטחה-והרשאות)

---

## 🚀 התקנה ראשונית

### שלב 1: הרצת קבצי SQL

הרץ את הקבצים הבאים **לפי הסדר** ב-Supabase SQL Editor:

```bash
1. supabase_setup.sql          # מערכת API Keys
2. UPGRADE_CONTENT_SYSTEM.sql  # מערכת תוכן מתקדמת
3. COMPLETE_ADMIN_SYSTEM_SETUP.sql  # מערכת ניהול מנהלים
```

#### איך להריץ:

1. היכנס ל-Supabase Dashboard
2. לחץ על **SQL Editor** בתפריט הצד
3. צור **New Query**
4. העתק את תוכן הקובץ SQL
5. לחץ **Run**
6. בדוק את ההודעות בחלון התחתון - אתה אמור לראות ✅

### שלב 2: הפיכת משתמש למנהל

אחרי שמשתמש נרשם, הפוך אותו למנהל:

```sql
-- חפש את המשתמש
SELECT id, email, is_admin, role FROM public.users WHERE email = 'your-admin@example.com';

-- הפוך למנהל
UPDATE public.users
SET is_admin = TRUE,
    role = 'admin'
WHERE email = 'your-admin@example.com';

-- הפוך ל-Super Admin (אופציונלי)
UPDATE public.users
SET is_super_admin = TRUE,
    role = 'super_admin'
WHERE email = 'your-admin@example.com';
```

---

## 📊 טבלאות במערכת

### 1. `users` (טבלת משתמשים)

```sql
-- שדות חשובים:
- id: UUID ייחודי
- email: אימייל
- credits: מספר קרדיטים
- is_admin: האם מנהל?
- is_super_admin: האם סופר מנהל?
- role: תפקיד (user/admin/super_admin)
- subscription_tier: דרגת מנוי (free/basic/premium/enterprise)
- is_active: האם פעיל?
- last_login_at: כניסה אחרונה
```

### 2. `saved_content` (תוכן שמור)

```sql
-- כל התוכן שנוצר ע"י AI
- content_type: story/workbook/learning_plan/worksheet
- title: כותרת
- content_data: JSON עם כל התוכן
- is_favorite: מועדף?
- is_archived: בארכיון?
- tags: תגיות לחיפוש
- view_count, like_count, share_count: סטטיסטיקות
```

### 3. `admin_activity_logs` (לוג פעולות מנהלים)

```sql
-- תיעוד כל פעולה של מנהלים
- action_type: סוג הפעולה
- target_user_id: על איזה משתמש
- action_description: תיאור
- action_data: JSON עם פרטים נוספים
```

### 4. `credit_transactions` (היסטוריית קרדיטים)

```sql
-- כל שינוי בקרדיטים
- amount: כמה (חיובי או שלילי)
- balance_before/after: יתרה לפני/אחרי
- transaction_type: סוג (purchase/gift/deduction/admin_adjustment)
- description: תיאור
- performed_by: מי ביצע
```

### 5. `system_notifications` (הודעות מערכת)

```sql
-- הודעות למשתמשים
- notification_type: info/warning/error/success
- title, message: תוכן ההודעה
- target_audience: all/admins/users/specific
- is_active: פעיל?
- expires_at: תפוגה
```

### 6. `user_sessions` (מושבי משתמשים)

```sql
-- ניטור מושבים פעילים
- session_token: טוקן ייחודי
- ip_address, user_agent: פרטים טכניים
- device_type, browser, os: סוג מכשיר
- is_active: פעיל?
- last_activity_at: פעילות אחרונה
```

### 7. `user_reports` (דיווחים)

```sql
-- דיווחים על תוכן/משתמשים
- report_type: user/content/bug/feedback/abuse
- reason, description: סיבה
- severity: low/medium/high/critical
- status: pending/in_review/resolved/dismissed
- handled_by: מי טיפל
```

### 8. `system_settings` (הגדרות מערכת)

```sql
-- הגדרות גלובליות
- setting_key: מפתח ייחודי
- setting_value: ערך (JSON)
- is_public: האם גלוי לכולם?
```

---

## 🔧 פונקציות עזר

### 1. `get_system_stats()` - סטטיסטיקות מערכת

```sql
SELECT * FROM get_system_stats();

-- תוצאה:
- total_users: סה"כ משתמשים
- active_users: משתמשים פעילים
- total_stories: סה"כ סיפורים
- total_workbooks: סה"כ חוברות
- total_plans: סה"כ תוכניות למידה
- total_credits_spent: סה"כ קרדיטים שהוצאו
- new_users_this_month: משתמשים חדשים החודש
- active_sessions: מושבים פעילים כרגע
```

### 2. `admin_change_user_credits()` - שינוי קרדיטים

```sql
-- הוסף 100 קרדיטים למשתמש
SELECT admin_change_user_credits(
    'user-uuid-here',          -- UUID של המשתמש
    100,                        -- כמה להוסיף (שלילי להפחית)
    'Bonus for being awesome'  -- סיבה
);
```

### 3. `log_admin_activity()` - רישום פעילות

```sql
-- רשום פעולה שעשית
SELECT log_admin_activity(
    'user_credits_changed',    -- סוג הפעולה
    'Added 100 credits',        -- תיאור
    'target-user-uuid',         -- על מי (אופציונלי)
    '{"amount": 100}'::jsonb    -- מטאדאטה נוספת
);
```

### 4. `get_top_users()` - משתמשים מובילים

```sql
-- 10 המשתמשים הכי פעילים
SELECT * FROM get_top_users(10);

-- תוצאה:
- user_id, email, full_name
- credits: קרדיטים נוכחיים
- content_count: כמה תוכן יצרו
- credits_spent: כמה קרדיטים הוציאו
- last_activity: פעילות אחרונה
```

---

## 🎯 שימוש ב-AdminDashboard

### איך להיכנס למערכת המנהלים?

1. היכנס לאפליקציה עם חשבון מנהל
2. אתה אמור לראות אוטומטית את דשבורד המנהלים
3. אם לא - וודא ש-`is_admin = TRUE` במסד הנתונים

### תכונות עיקריות:

#### 📊 **Overview (מבט כולל)**
- סטטיסטיקות בזמן אמת
- משתמשים חדשים
- פעילות אחרונה
- גרפים ומגמות

#### 👥 **Users (ניהול משתמשים)**
- רשימת כל המשתמשים
- חיפוש וסינון
- עריכת פרטים
- שינוי קרדיטים
- חסימת משתמשים
- מחיקה

#### 💾 **Content (ניהול תוכן)**
- כל התוכן במערכת
- מיון לפי סוג
- מחיקה המונית
- מודרציה
- סטטיסטיקות תוכן

#### 💳 **Credits (ניהול קרדיטים)**
- היסטוריית עסקאות
- שינוי קרדיטים ידני
- מתן קרדיטים לקבוצה
- דוחות שימוש

#### 🔑 **API Keys (ניהול מפתחות)**
- הוספת API keys חדשים
- הקצאת מפתחות למשתמשים
- ניטור שימוש
- השבתת מפתחות

#### ⚙️ **Settings (הגדרות)**
- עלויות קרדיטים
- הגדרות מערכת
- הודעות גלובליות
- תחזוקה

#### 📈 **Stats & Analytics (אנליטיקס)**
- דוחות מפורטים
- גרפים
- ייצוא נתונים
- מגמות

---

## 🔒 אבטחה והרשאות

### סוגי משתמשים:

1. **User (משתמש רגיל)**
   - יכול לראות רק את התוכן שלו
   - יכול לערוך רק את הפרופיל שלו
   - לא גישה לדשבורד מנהלים

2. **Admin (מנהל)**
   - גישה מלאה לדשבורד מנהלים
   - יכול לראות ולערוך כל משתמש
   - יכול לשנות קרדיטים
   - יכול למחוק תוכן
   - לא יכול למחוק מנהלים אחרים

3. **Super Admin (סופר מנהל)**
   - כל ההרשאות של Admin
   - יכול למחוק מנהלים
   - יכול לשנות הגדרות קריטיות
   - גישה לכל הפונקציות

### Row Level Security (RLS):

המערכת מגנה על הנתונים ברמת השורה:

```sql
-- דוגמה: משתמשים רואים רק את התוכן שלהם
CREATE POLICY "Users can view own content"
    ON saved_content FOR SELECT
    USING (auth.uid() = user_id);

-- דוגמה: מנהלים רואים הכל
CREATE POLICY "Admins can view all content"
    ON saved_content FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );
```

---

## 📝 טיפים לשימוש

### 1. בדיקת בריאות המערכת

```sql
-- בדוק כמה משתמשים פעילים
SELECT COUNT(*) FROM public.users WHERE is_active = TRUE;

-- בדוק סיפורים שנוצרו היום
SELECT COUNT(*) FROM public.saved_content
WHERE content_type = 'story'
AND created_at >= CURRENT_DATE;

-- בדוק קרדיטים שהוצאו היום
SELECT COALESCE(SUM(ABS(amount)), 0) FROM public.credit_transactions
WHERE amount < 0 AND created_at >= CURRENT_DATE;
```

### 2. מתן קרדיטים קבוצתי

```sql
-- תן 50 קרדיטים לכל המשתמשים שנרשמו החודש
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN
        SELECT id FROM public.users
        WHERE created_at >= DATE_TRUNC('month', NOW())
        AND is_active = TRUE
    LOOP
        PERFORM admin_change_user_credits(
            user_record.id,
            50,
            'Monthly bonus for new users'
        );
    END LOOP;
END $$;
```

### 3. ניקוי תוכן ישן

```sql
-- ארכב תוכן שלא נצפה ב-6 חודשים
UPDATE public.saved_content
SET is_archived = TRUE
WHERE last_viewed_at < NOW() - INTERVAL '6 months'
AND is_favorite = FALSE;
```

### 4. שליחת הודעה לכולם

```sql
INSERT INTO public.system_notifications (
    notification_type,
    title,
    message,
    target_audience,
    is_active,
    expires_at,
    created_by
) VALUES (
    'info',
    'עדכון מערכת',
    'המערכת תעבור תחזוקה ביום שישי בשעה 20:00',
    'all',
    TRUE,
    NOW() + INTERVAL '7 days',
    auth.uid()
);
```

---

## 🐛 פתרון בעיות נפוצות

### בעיה: "Only admins can..." שגיאה

```sql
-- וודא שהמשתמש הוא מנהל
SELECT id, email, is_admin, role FROM public.users WHERE id = auth.uid();

-- אם לא, הפוך אותו למנהל
UPDATE public.users SET is_admin = TRUE, role = 'admin'
WHERE id = 'your-user-id';
```

### בעיה: RLS חוסם גישה

```sql
-- בדוק את ה-Policies
SELECT * FROM pg_policies WHERE tablename = 'saved_content';

-- בטל RLS זמנית (לבדיקה בלבד!)
ALTER TABLE public.saved_content DISABLE ROW LEVEL SECURITY;

-- אל תשכח להפעיל בחזרה!
ALTER TABLE public.saved_content ENABLE ROW LEVEL SECURITY;
```

### בעיה: פונקציות לא עובדות

```sql
-- בדוק שהפונקציות קיימות
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%admin%';

-- אם חסרות - הרץ שוב את COMPLETE_ADMIN_SYSTEM_SETUP.sql
```

---

## 🎓 שאלות ותשובות נפוצות

**ש: איך אני יודע אם ההתקנה הצליחה?**

ת: הרץ את הפקודה הבאה - אמור להחזיר תוצאות:
```sql
SELECT * FROM get_system_stats();
```

**ש: איך אני מוסיף מנהל נוסף?**

ת: השתמש בפקודה:
```sql
UPDATE public.users SET is_admin = TRUE WHERE email = 'new-admin@example.com';
```

**ש: האם השינויים משפיעים על משתמשים קיימים?**

ת: לא! כל הנתונים הקיימים נשמרים. המערכת רק מוסיפה טבלאות חדשות.

**ש: איך אני מגבה את המידע?**

ת: Supabase עושה Backup אוטומטי. אבל תוכל גם לייצא:
```sql
-- ייצא את כל הנתונים החשובים
COPY (SELECT * FROM public.users) TO '/tmp/users_backup.csv' CSV HEADER;
COPY (SELECT * FROM public.saved_content) TO '/tmp/content_backup.csv' CSV HEADER;
```

---

## 📞 תמיכה

אם נתקלת בבעיות:

1. בדוק את הלוגים ב-Supabase
2. וודא ש-RLS Policies מוגדרות נכון
3. בדוק שיש לך הרשאות Admin
4. הרץ שוב את קבצי ה-SQL

---

## ✅ Checklist להתקנה

- [ ] הרצתי את `supabase_setup.sql`
- [ ] הרצתי את `UPGRADE_CONTENT_SYSTEM.sql`
- [ ] הרצתי את `COMPLETE_ADMIN_SYSTEM_SETUP.sql`
- [ ] הפכתי את עצמי למנהל
- [ ] בדקתי ש-`get_system_stats()` עובדת
- [ ] נכנסתי ל-AdminDashboard והכל עובד
- [ ] בדקתי שאני יכול לראות את כל המשתמשים
- [ ] בדקתי שאני יכול לשנות קרדיטים
- [ ] הוספתי API Keys ל-`api_keys_pool`

---

🎉 **מזל טוב! המערכת מוכנה לשימוש!**
