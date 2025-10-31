# 🎓 פלטפורמת גאון - Gaon Learning Platform

פלטפורמת חינוך מותאמת אישית המשתמשת בבינה מלאכותית ליצירת תכנים חינוכיים.

## 🚨 תיקון דחוף - התחברות לא עובדת?

**אם אתה רואה שגיאה "infinite recursion" או "שגיאה בטעינת נתוני משתמש":**

👉 **עבור ל-[QUICK_FIX_GUIDE.md](QUICK_FIX_GUIDE.md)** והרץ את הסקריפט `fix_database_final.sql`

## 🏗️ מבנה הפרויקט

```
childapp/
├── src/
│   ├── supabaseClient.ts      # חיבור ל-Supabase
│   └── vite-env.d.ts
├── App.tsx                     # נקודת כניסה ראשית
├── AppContext.tsx              # ניהול state גלובלי
├── LandingPage.tsx            # עמוד נחיתה
├── ParentDashboard.tsx        # Dashboard להורים
├── ChildDashboard.tsx         # Dashboard לילדים
├── AdminDashboard.tsx         # Dashboard למנהלים
├── StoryCreator.tsx           # יצירת סיפורים
├── WorkbookCreator.tsx        # יצירת חוברות עבודה
├── LearningPlan.tsx           # תוכנית לימודים
├── LoginModal.tsx             # מודאל התחברות
├── LoggedInHeader.tsx         # Header למשתמשים מחוברים
└── styles.ts                  # סגנונות משותפים

Database Setup:
├── fix_database_final.sql     # ✅ הסקריפט המתוקן - השתמש בזה!
├── QUICK_FIX_GUIDE.md        # מדריך מהיר לתיקון בעיות
└── SETUP_INSTRUCTIONS.md      # הוראות מפורטות
```

## 🔧 התקנה והרצה

### דרישות מוקדמות

- Node.js 20.19+ או 22.12+
- npm
- חשבון Supabase
- Gemini API Key

### צעדים

1. **התקן dependencies:**
   ```bash
   npm install
   ```

2. **הגדר משתני סביבה:**

   צור קובץ `.env.local` עם:
   ```env
   VITE_SUPABASE_URL=https://vudwubldeonlqhlworcq.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   GEMINI_API_KEY=your_gemini_key_here
   ```

3. **הגדר את הדאטאבייס:**

   - פתח Supabase Dashboard → SQL Editor
   - הרץ את `fix_database_final.sql`

4. **הרץ את האפליקציה:**
   ```bash
   npm run dev
   ```

5. **בנה לפרודקשן:**
   ```bash
   npm run build
   ```

## 👤 משתמשים

### מנהל ראשי
- **Email:** ofirbaranesad@gmail.com
- **הרשאות:** גישה מלאה, קרדיטים אינסופיים, ניהול משתמשים
- **Role:** admin (נקבע אוטומטית בהתחברות הראשונה)

### הורים
- **Role:** parent
- **Credits:** 100 (התחלתי)
- **יכולות:**
  - יצירת פרופילים לילדים
  - יצירת סיפורים מותאמים אישית
  - יצירת חוברות עבודה
  - צפייה בתוכניות לימוד

## 🎨 פיצ'רים

### ✨ יצירת סיפורים
- סיפורים מותאמים אישית לפי גיל, מגדר ותחומי עניין
- יצירת תמונות AI לכל חלק בסיפור
- אפשרות להשפיע על כיוון הסיפור
- העלאת תמונת הילד לדמות עקבית

### 📚 חוברות עבודה
- יצירת חוברות עבודה מותאמות
- תרגילים מגוונים (בחירה מרובה, השלמה, שאלות פתוחות)
- בדיקה אוטומטית עם משוב AI
- תמיכה במספר נושאים (מתמטיקה, עברית, אנגלית, מדעים)

### 📋 תוכניות לימוד
- תוכניות לימוד מותאמות אישית
- מעקב אחר התקדמות
- המלצות מותאמות

### 👥 ניהול משתמשים (מנהלים)
- הוספת משתמשים חדשים
- ניהול קרדיטים
- מחיקת משתמשים
- שינוי הרשאות

## 🔒 אבטחה

### Row Level Security (RLS)
- כל משתמש רואה רק את הנתונים שלו
- Policies מוגדרות ברמת הדאטאבייס
- הפרדה מלאה בין משתמשים

### Authentication
- OAuth עם Google
- ניהול session אוטומטי
- Refresh tokens

## 🐛 תיקון בעיות נפוצות

### "infinite recursion detected"
👉 ראה [QUICK_FIX_GUIDE.md](QUICK_FIX_GUIDE.md)

### "שגיאה בטעינת נתוני משתמש"
1. וודא שהרצת את `fix_database_final.sql`
2. נקה cache (Ctrl+Shift+Delete)
3. נסה להתחבר שוב

### "API_KEY is not set"
1. בדוק שקובץ `.env.local` קיים
2. וודא ש-`GEMINI_API_KEY` מוגדר
3. הפעל מחדש את הserver (`npm run dev`)

### Vite לא נמצא
```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install --production=false
```

## 📝 שינויים שבוצעו לאחרונה

### ✅ תיקוני שגיאות (2025-10-31)

1. **TypeScript Errors:**
   - תוקן טיפוס `id` מ-`number` ל-`string` (UUID)

2. **Promise Rejections:**
   - הוספת `.catch()` לכל `getSession()` calls
   - הוספת error handling ל-logout functions

3. **useEffect Dependencies:**
   - תיקון dependency array ב-LoggedInHeader

4. **Security:**
   - הסרת hardcoded username check
   - שימוש ב-role-based access control

5. **Environment Variables:**
   - הוספת validation למשתני סביבה
   - הודעות אזהרה ברורות

6. **AI Image Generation:**
   - הוספת validation לתמונות שנוצרות
   - טיפול במצבים של תמונות חסרות

7. **Database (הכי חשוב!):**
   - תיקון infinite recursion ב-RLS policies
   - הוספת SECURITY DEFINER לטריגר
   - יצירת משתמש אוטומטית ע"י טריגר
   - הגדרת admin אוטומטי לofirbaranesad@gmail.com

## 🚀 Deploy

### Vercel / Netlify
1. בנה את הפרויקט: `npm run build`
2. העלה את תיקיית `dist/`
3. הגדר environment variables בפלטפורמת ההוסטינג

### Docker
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

## 📞 תמיכה

אם יש בעיות:
1. בדוק את הקונסול בדפדפן (F12)
2. צלם את הודעות השגיאה
3. פנה למפתח

## 📄 רישיון

Proprietary - כל הזכויות שמורות

---

**גרסה:** 1.0.0
**עדכון אחרון:** 31 אוקטובר 2025
**מפתח:** Claude + Ofir Baranes
