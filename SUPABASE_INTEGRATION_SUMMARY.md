# 📦 סיכום אינטגרציית Supabase

## ✅ מה בוצע

### 1. התקנת חבילות
```bash
npm install @supabase/supabase-js @supabase/auth-helpers-react
```

### 2. קבצים שנוצרו
- ✅ `src/supabaseClient.ts` - Supabase client עם types מלאים
- ✅ `src/vite-env.d.ts` - TypeScript definitions למשתני סביבה
- ✅ `supabase_schema.sql` - SQL schema מלא (5 טבלאות)
- ✅ `SUPABASE_SETUP.md` - מדריך התקנה מפורט
- ✅ `.gitignore` - עודכן לא לשלוח .env.local

### 3. קבצים שעודכנו
- ✅ `AppContext.tsx`:
  - `User.id`: שונה מ-`number` ל-`string` (UUID)
  - `Profile.photo_url`: נוסף כשדה חדש
  - שמירת `photo` לתאימות לאחור

- ✅ `App.tsx`:
  - ייבוא `SessionContextProvider` מ-Supabase
  - עטיפת `AppProvider` ב-`SessionContextProvider`
  - עדכון MOCK_USERS למבנה החדש (string IDs)

- ✅ `README_DEVELOPER.md`:
  - הוספת מדריך Supabase
  - עדכון סטטוס Backend Integration
  - הוספת הוראות setup

---

## 🗄️ מבנה Database

### טבלאות שנוצרו:

1. **public.users** (מקושר ל-auth.users)
   - `id` (UUID, PK)
   - `role` ('parent' | 'admin')
   - `credits` (integer)
   - `created_at`, `updated_at`

2. **public.profiles** (פרופילי ילדים)
   - `id` (bigserial, PK)
   - `user_id` (UUID, FK → users)
   - `name`, `age`, `gender`
   - `interests`, `learning_goals`
   - `photo_url`

3. **public.stories** (סיפורים)
   - `id` (bigserial, PK)
   - `user_id` (UUID, FK)
   - `profile_id` (bigint, FK)
   - `title`
   - `story_parts` (jsonb)

4. **public.workbooks** (חוברות)
   - `id`, `user_id`, `profile_id`
   - `title`
   - `workbook_data` (jsonb)

5. **public.learning_plans** (תוכניות למידה)
   - `id`, `user_id`, `profile_id`
   - `title`
   - `plan_steps` (jsonb)

### אבטחה (RLS - Row Level Security):
- ✅ כל משתמש רואה רק את הנתונים שלו
- ✅ Admin רואה את כל הנתונים
- ✅ Policies מוגדרות ל-SELECT, INSERT, UPDATE, DELETE

### Storage:
- ✅ Bucket `profile-photos` (public)
- ✅ מבנה תיקיות: `{user_id}/{timestamp}.{ext}`

---

## ✅ מה הושלם (עדכון)

- ✅ **אימות Supabase** - Google OAuth מלא
- ✅ **AppContext** - מחובר ל-database
- ✅ **ניהול פרופילים** - שמירה/עדכון ב-database
- ✅ **התחברות/התנתקות** - פונקציות אמיתיות

📖 **ראה מדריך מלא:** [SUPABASE_AUTH_MIGRATION.md](./SUPABASE_AUTH_MIGRATION.md)

---

## 🎯 השלבים הבאים

### שלב 1: הגדרת Supabase (חובה)
1. צור פרויקט ב-https://app.supabase.com
2. העתק Project URL ו-Anon Key
3. צור `.env.local`:
   ```bash
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGc...
   API_KEY=your-google-ai-key
   ```
4. הרץ את `supabase_schema.sql` ב-SQL Editor

### ~~שלב 2: החלפת מערכת Login~~ ✅ **הושלם!**
- ✅ LoginModal משתמש ב-Google OAuth
- ✅ App.tsx משתמש ב-`useSession()`
- ✅ משתמשים מחוברים מ-database

📖 ראה: [SUPABASE_AUTH_MIGRATION.md](./SUPABASE_AUTH_MIGRATION.md)

### ~~שלב 3: ניהול פרופילים~~ ✅ **הושלם!**
- ✅ פרופילים נטענים אוטומטית ב-AppContext
- ✅ יצירת פרופיל שומרת ישירות ל-database
- ✅ עדכון פרופיל מעדכן את database
- ✅ תמיכה ב-`photo_url` + backward compatibility ל-`photo`

### שלב 4: שמירת תוכן
📍 **StoryCreator.tsx**
- שמור `storyParts` ב-`stories` table
- העלה תמונות ל-Storage (אופציונלי)

📍 **WorkbookCreator.tsx**
- שמור `workbook` ב-`workbooks` table
- שמור `planHistory` ב-`learning_plans` table

### שלב 5: העלאת תמונות
📍 **ParentDashboard.tsx** (ProfileFormModal)
```typescript
// Upload photo
const { data } = await supabase.storage
  .from('profile-photos')
  .upload(`${userId}/${Date.now()}.jpg`, file);

// Get URL
const { data: urlData } = supabase.storage
  .from('profile-photos')
  .getPublicUrl(data.path);

// Save URL to profile
await supabase
  .from('profiles')
  .update({ photo_url: urlData.publicUrl })
  .eq('id', profileId);
```

---

## 📖 דוגמאות קוד מלאות

ראה **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** לדוגמאות מפורטות.

---

## ⚠️ הערות חשובות

### תאימות לאחור:
- ✅ הקוד הישן ימשיך לעבוד עם MOCK_USERS
- ✅ שדה `photo` נשמר ב-`Profile` interface
- ✅ ניתן לעבור בהדרגה לשימוש ב-`photo_url`

### Types:
- ✅ כל ה-interfaces מעודכנים
- ✅ TypeScript מזהה את `User.id` כ-string
- ✅ Supabase client עם types מלאים ב-`supabaseClient.ts`

### Security:
- ✅ `.env.local` לא נשלח ל-Git
- ✅ RLS מוגדר לכל הטבלאות
- ✅ Storage policies מוגדרים

---

## 🔍 בדיקת תקינות

### בדיקה 1: Environment
```bash
# וודא שהקובץ קיים
ls .env.local

# הפעל שוב
npm run dev
```

### בדיקה 2: Supabase Connection
פתח את הקונסול בדפדפן ובדוק:
```javascript
console.log(import.meta.env.VITE_SUPABASE_URL);
// צריך להדפיס את ה-URL, לא undefined
```

### בדיקה 3: Database
ב-Supabase Dashboard:
- עבור ל-Table Editor
- בדוק שכל 5 הטבלאות קיימות

### בדיקה 4: Storage
ב-Supabase Dashboard:
- עבור ל-Storage
- בדוק ש-`profile-photos` bucket קיים

---

## 🆘 פתרון בעיות

### "Invalid API key"
**פתרון**: בדוק ש-`.env.local` קיים ועם ערכים נכונים. הפעל מחדש `npm run dev`.

### "relation does not exist"
**פתרון**: הרץ את `supabase_schema.sql` ב-SQL Editor של Supabase.

### TypeScript errors on User.id
**פתרון**: וודא ש-`vite-env.d.ts` קיים ב-`src/`.

### "Row Level Security policy violation"
**פתרון**: וודא שהרצת את כל ה-RLS policies מה-SQL script.

---

## 📞 תמיכה נוספת

- [Supabase Docs](https://supabase.com/docs)
- [Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers)
- [RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

**✅ Supabase מוכן לשימוש!**

עקוב אחר [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) למדריך מפורט.

