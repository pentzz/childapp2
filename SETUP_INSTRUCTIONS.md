# הוראות תיקון שגיאת התחברות

## הבעיה
כאשר מתחברים דרך Google OAuth, מתקבלת השגיאה: **"שגיאה בטעינת נתוני משתמש. אנא רענן את הדף."**

## הסיבה
השגיאה מתרחשת כי:
1. הטבלה `public.users` לא קיימת או שאין לה את כל העמודות הנדרשות
2. ה-RLS (Row Level Security) policies חוסמים גישה
3. הטריגר שאמור ליצור משתמש חדש אוטומטית לא מוגדר או לא עובד

## הפתרון - שלבים לביצוע

### שלב 1: הרץ את הסקריפט SQL ב-Supabase

1. היכנס ל-Supabase Dashboard שלך: https://supabase.com/dashboard/project/vudwubldeonlqhlworcq
2. לך ל-**SQL Editor** (בתפריט הצד)
3. לחץ על **New Query**
4. העתק והדבק את כל התוכן מהקובץ `fix_database_setup.sql`
5. לחץ על **Run** (או Ctrl+Enter)
6. וודא שאין שגיאות - אמור להופיע "Success"

הסקריפט יבצע את הפעולות הבאות:
- ✅ יצור את כל הטבלאות הנדרשות אם הן לא קיימות
- ✅ יגדיר את ה-RLS policies כך שכל משתמש יוכל לגשת רק לנתונים שלו
- ✅ יגדיר טריגר שיוצר אוטומטית רשומה ב-`public.users` כאשר משתמש חדש נרשם
- ✅ יוסיף indexes לביצועים טובים יותר

### שלב 2: וודא שה-Google OAuth מוגדר נכון

1. ב-Supabase Dashboard, לך ל-**Authentication** → **Providers**
2. מצא את **Google** ווודא שהוא מופעל (Enabled)
3. וודא שיש לך:
   - Client ID
   - Client Secret
   - Redirect URL מוגדר כ: `https://vudwubldeonlqhlworcq.supabase.co/auth/v1/callback`

### שלב 3: עדכן את קובץ ה-.env.local

וודא שהקובץ `.env.local` מכיל את הפרטים הנכונים:

```env
VITE_SUPABASE_URL=https://vudwubldeonlqhlworcq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1ZHd1YmxkZW9ubHFobHdvcmNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4MjMyMjcsImV4cCI6MjA3NzM5OTIyN30.gNYtjyM6Sqt-hUgZ_SAEgkHKz4QnpD3rHtFRTzuk12E
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
```

**חשוב:** החלף את `YOUR_GEMINI_API_KEY_HERE` במפתח API אמיתי של Gemini.

### שלב 4: הפעל מחדש את השרת

```bash
# עצור את השרת הקיים (Ctrl+C)
# הרץ מחדש:
npm run dev
```

### שלב 5: נסה להתחבר שוב

1. פתח את הדפדפן ב-`http://localhost:3003`
2. לחץ על "כניסה"
3. בחר "כניסה/הרשמה עם Google"
4. התחבר עם חשבון Google שלך

## בדיקת התקינות

לאחר ההתחברות, בדוק את הקונסול של הדפדפן (F12):
- אמורים להופיע לוגים ירוקים (🟢) המציינים הצלחה
- אם יש לוגים אדומים (🔴), העתק אותם ושלח לי

## שאלות נפוצות

### Q: עדיין מקבל שגיאה אחרי הרצת הסקריפט
**A:** נסה:
1. התנתק מהמערכת (אם אתה מחובר)
2. נקה את ה-cache של הדפדפן (Ctrl+Shift+Delete)
3. סגור את כל הטאבים של האפליקציה
4. פתח טאב חדש ונסה שוב

### Q: הסקריפט SQL נכשל עם שגיאה
**A:** העתק את השגיאה המדויקת ושלח לי. יכול להיות שצריך להריץ חלקים מסוימים בנפרד.

### Q: איפה אני מוצא את ה-Gemini API Key?
**A:**
1. לך ל-https://aistudio.google.com/apikey
2. התחבר עם חשבון Google שלך
3. לחץ על "Create API Key"
4. העתק את המפתח והדבק ב-.env.local

## תמיכה נוספת

אם הבעיה ממשיכה לאחר כל השלבים:
1. פתח את הקונסול של הדפדפן (F12)
2. נסה להתחבר
3. צלם את כל ההודעות בקונסול (גם הירוקות וגם האדומות)
4. שלח לי את הצילומים

---

**שינויים שבוצעו בקוד:**
- ✅ תיקון TypeScript errors
- ✅ הוספת error handling לכל ה-async operations
- ✅ שיפור הודעות שגיאה להיות יותר מפורטות
- ✅ תיקון useEffect dependencies
- ✅ הוספת validation למשתני סביבה
- ✅ הוספת validation לתמונות שנוצרות ע"י AI
