# 🚀 הוראות התקנה - Supabase Real-Time Credit Costs

## 📋 סקירה כללית

מערכת עלויות קרדיטים דינמית עם סנכרון בזמן אמת לכל המשתמשים.
כאשר המנהל הראשי משנה עלויות, כל המשתמשים במערכת מקבלים את העדכון מיידית!

## 🔧 שלב 1: הרצת Migration ב-Supabase

### אופציה א': דרך ה-SQL Editor (מומלץ)

1. **היכנס ל-Supabase Dashboard**
   - לך ל: https://supabase.com/dashboard
   - בחר את הפרויקט שלך

2. **פתח את ה-SQL Editor**
   - בתפריט הצדדי, לחץ על "SQL Editor"
   - לחץ על "+ New Query"

3. **הרץ את ה-Migration**
   - העתק את כל התוכן מהקובץ `supabase_migrations.sql`
   - הדבק ב-SQL Editor
   - לחץ על "RUN" (או Ctrl+Enter)

4. **בדוק הצלחה**
   - אמור להופיע הודעה: "Success. No rows returned"
   - זה תקין! הטבלה נוצרה בהצלחה

### אופציה ב': דרך Supabase CLI

```bash
# אם יש לך Supabase CLI מותקן
supabase db push

# או
supabase db execute --file supabase_migrations.sql
```

## 🔍 שלב 2: אימות שהכל עובד

### בדוק שהטבלה נוצרה:

1. לך ל-Table Editor ב-Supabase
2. חפש את הטבלה `credit_costs`
3. אמור לראות שורה אחת עם הערכים המוגדרים מראש:
   - story_part: 1
   - plan_step: 2
   - worksheet: 2
   - workbook: 3
   - topic_suggestions: 1

### בדוק ש-Real-time מופעל:

1. לך ל-Database → Replication
2. ודא שהטבלה `credit_costs` מופיעה ברשימה
3. אם לא - לחץ על "0 tables" ובחר את `credit_costs`

## 🎯 שלב 3: בדיקת Real-Time בפעולה

### בדיקה מהירה:

1. **פתח שני חלונות דפדפן**
   - חלון 1: היכנס כמנהל ראשי
   - חלון 2: היכנס כמשתמש רגיל (או אותו משתמש)

2. **שנה עלויות בחלון 1**
   - לך ללוח בקרה מתקדם
   - ערוך את עלויות הקרדיטים (למשל, שנה "חלק בסיפור" מ-1 ל-5)
   - שמור

3. **צפה בשינוי בחלון 2**
   - אמור לראות את השינוי מיידית!
   - בקונסול תראה: "🔔 AppContext: Credit costs changed in real-time!"

## ⚙️ איך זה עובד?

### מבנה המערכת:

```
┌─────────────────┐
│  Supabase DB    │
│  credit_costs   │
└────────┬────────┘
         │
    Real-time
   Subscription
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼────┐
│ User 1│ │ User 2│
└───────┘ └───────┘
```

### רכיבי המערכת:

1. **Supabase Database**
   - טבלה `credit_costs` עם שורה יחידה
   - Real-time replication מופעל
   - RLS policies מאפשרים קריאה לכולם, עריכה למנהלים

2. **AppContext.tsx**
   - טוען עלויות מ-DB בהפעלה
   - מקשיב לשינויים בזמן אמת
   - מעדכן את כל הקומפוננטות אוטומטית

3. **AdminDashboard.tsx**
   - לוח בקרה בולט לעריכת עלויות
   - שומר שינויים ישירות ל-Supabase
   - כל המשתמשים מקבלים עדכון מיידי

## 🐛 פתרון בעיות

### הטבלה לא נוצרה?
```sql
-- בדוק אם הטבלה קיימת
SELECT * FROM credit_costs;

-- אם לא קיימת, הרץ רק את חלק יצירת הטבלה:
CREATE TABLE credit_costs (
    id SERIAL PRIMARY KEY,
    story_part INTEGER NOT NULL DEFAULT 1,
    plan_step INTEGER NOT NULL DEFAULT 2,
    worksheet INTEGER NOT NULL DEFAULT 2,
    workbook INTEGER NOT NULL DEFAULT 3,
    topic_suggestions INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Real-time לא עובד?

1. בדוק שהטבלה ב-Replication:
   ```
   Database → Replication → Source → credit_costs (✓)
   ```

2. אם לא מופיעה, הרץ:
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE credit_costs;
   ```

3. רענן את האפליקציה (F5)

### שגיאות הרשאות (RLS)?

```sql
-- הסר את ה-RLS זמנית לבדיקה
ALTER TABLE credit_costs DISABLE ROW LEVEL SECURITY;

-- אחרי שזה עובד, החזר:
ALTER TABLE credit_costs ENABLE ROW LEVEL SECURITY;
```

## ✅ סיום

אחרי הרצת ה-Migration:
1. ✅ הטבלה נוצרה
2. ✅ Real-time מופעל
3. ✅ ערכי ברירת מחדל הוכנסו
4. ✅ כל המשתמשים מסונכרנים

**עכשיו תוכל לשלוט בעלויות הקרדיטים מלוח הבקרה, והשינויים יעודכנו מיידית לכולם!** 🎉

## 📞 תמיכה

אם יש בעיות:
1. בדוק את הקונסול (F12) לשגיאות
2. חפש הודעות עם 🔵 או ❌
3. ודא שיש חיבור לאינטרנט
4. רענן את הדף (F5)

