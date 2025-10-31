# 🔒 מדריך הגדרת אבטחה וניטור פעילות

## סקירה כללית

מדריך זה מסביר כיצד להפעיל את מערכת האבטחה המתקדמת שמגבילה עריכה **רק למשתמש ofirbaranesad@gmail.com** ומוסיפה מערכת ניטור פעילות מלאה.

---

## 🎯 מה זה עושה?

### 1. אבטחה מוגברת
- **הסרת כל ההרשאות הקודמות** - כל המדיניות (RLS Policies) הישנה שאפשרה לכל מנהל לערוך נמחקת
- **הרשאה רק למנהל-העל** - רק המשתמש עם האימייל ofirbaranesad@gmail.com יכול לערוך את:
  - cms_sections (סקשנים)
  - cms_section_items (פריטים בתוך סקשנים)
  - cms_menu_items (תפריט)
  - cms_site_settings (הגדרות אתר)
  - cms_media (מדיה)
  - landing_page_content (תוכן דף הבית)

### 2. ניטור פעילות מלא
- **רישום אוטומטי** של כל פעולה במערכת
- **טבלת activity_log** שומרת:
  - מי ביצע את הפעולה (user_id, user_email)
  - מה בוצע (action_type: create/update/delete)
  - על מה בוצע (resource_type, resource_id)
  - ערכים לפני ואחרי (old_value, new_value)
  - מתי בוצע (created_at)

### 3. דשבורד ניטור
- **ממשק ויזואלי** לצפייה בכל הפעולות
- **סינון** לפי סוג פעולה, סוג משאב, משתמש
- **עדכון אוטומטי** כל 30 שניות
- **סטטיסטיקות משתמשים** - מי עשה מה וכמה

---

## 📋 שלב 1: הרצת סקריפט ה-SQL

### איך להריץ את הסקריפט:

1. **פתח את Supabase Dashboard**
   - היכנס לפרויקט שלך ב-https://supabase.com
   - לחץ על "SQL Editor" בתפריט הצד

2. **העתק את התוכן של הקובץ `security_and_logging.sql`**
   - פתח את הקובץ `security_and_logging.sql` בעורך קוד
   - העתק את **כל התוכן** (Ctrl+A, Ctrl+C)

3. **הדבק והרץ ב-Supabase**
   - הדבק את התוכן ב-SQL Editor (Ctrl+V)
   - לחץ על "Run" או Ctrl+Enter
   - המתן עד שתראה הודעת הצלחה

4. **בדוק שהכל עבד**
   - אתה אמור לראות הודעות כמו:
     ```
     CREATE TABLE success
     DROP POLICY success
     CREATE POLICY success
     CREATE TRIGGER success
     ```

### מה הסקריפט עושה (בפירוט):

```sql
-- יצירת טבלת activity_log
CREATE TABLE activity_log (...)

-- מחיקת מדיניות ישנות
DROP POLICY "Admins can manage sections" ON cms_sections
DROP POLICY "Admins can manage section items" ON cms_section_items
-- וכו'...

-- יצירת מדיניות חדשות עם בדיקת אימייל
CREATE POLICY "Only super admin can manage sections"
    ON public.cms_sections FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.email = 'ofirbaranesad@gmail.com'
            AND users.role = 'admin'
        )
    )

-- יצירת טריגרים לרישום פעילות אוטומטית
CREATE TRIGGER log_cms_section_changes
    AFTER INSERT OR UPDATE OR DELETE ON cms_sections
    FOR EACH ROW EXECUTE FUNCTION log_cms_section_changes();
```

---

## 🧪 שלב 2: בדיקת האבטחה

### בדוק שרק אתה יכול לערוך:

1. **התחבר עם ofirbaranesad@gmail.com**
   - לך לדף הבית עם `?view=landing`
   - לחץ על כפתור ⚙️ (Advanced CMS Panel)
   - נסה לערוך סקשן או להוסיף תפריט
   - **צריך לעבוד!** ✅

2. **התחבר עם משתמש אחר (אם יש לך)**
   - התנתק ממשתמש הראשי
   - התחבר עם משתמש אחר (גם אם הוא admin)
   - נסה לפתוח את ה-CMS או לערוך משהו
   - **צריך להיכשל!** ❌ (יופיע שגיאת הרשאות)

### בדיקה מהירה ב-SQL Editor:

```sql
-- בדוק שהמדיניות החדשה קיימת
SELECT * FROM pg_policies
WHERE tablename = 'cms_sections'
AND policyname = 'Only super admin can manage sections';

-- בדוק שטבלת הלוגים נוצרה
SELECT COUNT(*) FROM activity_log;
```

---

## 📊 שלב 3: שימוש בדשבורד ניטור

### איך לפתוח את הדשבורד:

1. **התחבר כמנהל-על** (ofirbaranesad@gmail.com)
2. **לך ללוח הבקרה למנהל** (Admin Dashboard)
3. **לחץ על כפתור "📊 ניטור פעילות"** בקטע "פעולות מהירות"

### תכונות הדשבורד:

#### טאב "פעילות אחרונה" (Recent Activity):
- **100 הפעולות האחרונות** במערכת
- **סינון לפי:**
  - סוג פעולה: הצג הכל / רק יצירה / רק עדכון / רק מחיקה
  - סוג משאב: הצג הכל / רק סקשנים / רק תפריט / וכו'
  - חיפוש לפי אימייל משתמש
- **צבעים:**
  - 🟢 ירוק = יצירה חדשה (create)
  - 🔵 כחול = עדכון (update)
  - 🔴 אדום = מחיקה (delete)
- **פרטים מלאים:**
  - מי ביצע
  - מתי בוצע
  - מה שונה (before/after בפורמט JSON)

#### טאב "סיכום משתמשים" (User Summary):
- **סטטיסטיקות לכל משתמש:**
  - כמה פעולות סה"כ
  - כמה יצירות / עדכונים / מחיקות
  - פעילות אחרונה
- **מיון והצגה ברורה**

### עדכון אוטומטי:
- הדשבורד מתעדכן **אוטומטית כל 30 שניות**
- אתה יכול גם לסגור ולפתוח שוב כדי לרענן ידנית

---

## 🔧 פתרון בעיות

### בעיה: לא מצליח להריץ את ה-SQL
**פתרון:**
- וודא שאתה מחובר כמשתמש עם הרשאות admin ב-Supabase
- נסה להריץ את הסקריפט בחלקים:
  1. תחילה רק את CREATE TABLE
  2. אחר כך את DROP POLICY
  3. ואז CREATE POLICY
  4. לבסוף CREATE TRIGGER

### בעיה: לא רואה את כפתור "ניטור פעילות"
**פתרון:**
- וודא שהתחברת עם ofirbaranesad@gmail.com
- וודא שבטבלת users האימייל רשום בדיוק ככה (ללא רווחים/אותיות גדולות)
- וודא ש-role שלך הוא 'admin'
- בדוק את הקונסול (F12) לשגיאות

### בעיה: עדיין יכול לערוך עם משתמש אחר
**פתרון:**
- וודא שהרצת את כל הסקריפט כולל את ה-DROP POLICY
- רענן את הדפדפן (Ctrl+Shift+R)
- נקה Cache
- בדוק ב-Supabase Dashboard -> Authentication -> Policies שהמדיניות החדשה קיימת

### בעיה: טבלת activity_log ריקה
**פתרון:**
- וודא שה-triggers נוצרו בהצלחה
- בדוק ב-SQL:
  ```sql
  SELECT * FROM pg_trigger WHERE tgname LIKE 'log_cms%';
  ```
- נסה לבצע פעולה (עריכת סקשן) ובדוק שוב

---

## 🎓 מידע נוסף

### מבנה activity_log:

| שדה | תיאור |
|-----|-------|
| id | מזהה ייחודי |
| user_id | UUID של המשתמש שביצע |
| user_email | אימייל המשתמש (לנוחות) |
| action_type | 'create', 'update', או 'delete' |
| resource_type | 'section', 'section_item', 'menu_item', וכו' |
| resource_id | מזהה המשאב שנערך |
| old_value | הערך לפני השינוי (JSON) |
| new_value | הערך אחרי השינוי (JSON) |
| created_at | זמן הפעולה |

### שאילתות שימושיות:

```sql
-- כל הפעולות של משתמש מסוים
SELECT * FROM activity_log
WHERE user_email = 'ofirbaranesad@gmail.com'
ORDER BY created_at DESC;

-- פעולות היום
SELECT * FROM activity_log
WHERE created_at >= CURRENT_DATE
ORDER BY created_at DESC;

-- ספירת פעולות לפי סוג
SELECT action_type, COUNT(*)
FROM activity_log
GROUP BY action_type;

-- שינויים בסקשן מסוים
SELECT * FROM activity_log
WHERE resource_type = 'section'
AND resource_id = '123'
ORDER BY created_at DESC;
```

---

## ✅ סיכום - רשימת בדיקה

- [ ] הרצתי את `security_and_logging.sql` ב-Supabase
- [ ] ראיתי הודעות הצלחה (CREATE TABLE, CREATE POLICY, CREATE TRIGGER)
- [ ] התחברתי כמנהל-על ובדקתי שאני יכול לערוך
- [ ] (אופציונלי) התחברתי כמשתמש אחר ובדקתי שהוא לא יכול לערוך
- [ ] פתחתי את דשבורד ניטור הפעילות מלוח הבקרה
- [ ] ביצעתי כמה פעולות ובדקתי שהן מופיעות בלוג
- [ ] בדקתי את הסינון והחיפוש בדשבורד

---

## 🚀 אתה מוכן!

המערכת שלך כעת מאובטחת לחלוטין עם ניטור מלא של כל הפעולות. רק אתה (ofirbaranesad@gmail.com) יכול לערוך תוכן, וכל פעולה נרשמת אוטומטית לביקורת עתידית.

**נהנה מהעוצמה של מנהל-העל! 👑**
