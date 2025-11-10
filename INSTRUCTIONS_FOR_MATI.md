# 🚀 הוראות התחלה מהירה למתי

> **⚠️ קרא את זה לפני שאתה מתחיל לעבוד!**

---

## 📥 שלב 1: Clone הפרויקט

```bash
# פתח Terminal/CMD והרץ:
git clone ssh://root@72.60.81.96/var/repo/childapp2.git
cd childapp2
```

אם SSH לא עובד, דבר עם אופיר לקבל גישה.

---

## 📦 שלב 2: התקן תלויות

```bash
npm install
```

אם יש שגיאות:
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 🌿 שלב 3: עבור לענף dev

```bash
git checkout dev
```

**⚠️ חשוב: תמיד עבוד על ענף `dev` - לא על `main`!**

---

## 🔑 שלב 4: העתק משתני סביבה

צור קובץ `.env.local` בשורש הפרויקט עם התוכן הבא:

```env
VITE_SUPABASE_URL=https://vudwubldeonlqhlworcq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1ZHd1YmxkZW9ubHFobHdvcmNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4MjMyMjcsImV4cCI6MjA3NzM5OTIyN30.gNYtjyM6Sqt-hUgZ_SAEgkHKz4QnpD3rHtFRTzuk12E
VITE_GEMINI_API_KEY=AIzaSyB02O22P0LJ9fRjPMb5tyOxvvvQN1EfZ9c
```

**⚠️ אל תשנה את הערכים האלה בשום מצב!**

---

## 🏃 שלב 5: הרץ את הפרויקט

```bash
npm run dev
```

האתר ייפתח ב: http://localhost:3000

---

## 🎯 זרימת העבודה שלך (חשוב מאוד!)

### לפני כל שינוי:

```bash
# 1. ודא שאתה על ענף dev
git checkout dev

# 2. Pull עדכונים מהשרת (חובה!)
git pull production dev

# 3. קרא מה השתנה
cat CHANGELOG.md
```

### אחרי שעשית שינויים:

```bash
# 1. בדוק שהכל עובד מקומית
npm run dev

# 2. Build לבדיקת שגיאות
npm run build

# 3. תעד את השינוי ב-CHANGELOG.md
# פתח את הקובץ והוסף בראש:
# ## [תאריך] - מתי מסגנאו
# ### השינוי שלך
# - מה עשית
# - למה עשית את זה

# 4. Pull שוב לפני commit (חובה!)
git pull production dev

# 5. Commit
git add .
git commit -m "תיאור השינוי"

# 6. Push לסביבת פיתוח
git push production dev
```

### בדוק את השינויים שלך:
גש ל: https://childapp2.srv989497.hstgr.cloud/dev/

---

## ⚠️ אזהרות קריטיות!

### 🔥 אסור לך לגעת בקבצים האלה:

```
❌ אסור לשנות:
├── .env
├── .env.production
├── vite.config.ts
├── src/supabaseClient.ts
├── supabase_setup.sql
```

**למה?** שינוי בקבצים האלה ישבור את החיבור ל-Supabase ו-API!

### 🔥 אסור לך לעבוד על main ישירות:

```bash
# ❌ אסור!
git checkout main
git push production main

# ✅ נכון - תמיד דרך dev:
git checkout dev
git push production dev
# אחרי בדיקות -> אופיר יעשה merge ל-main
```

### 🔥 אסור לך לשנות משתני סביבה:

```env
# ❌ אסור לשנות את הערכים האלה!
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_GEMINI_API_KEY=...
```

---

## 📖 קריאה נוספת

אם אתה רוצה להבין יותר לעומק:
- [README.md](README.md) - תיעוד מלא
- [DEV_WORKFLOW.md](DEV_WORKFLOW.md) - זרימת עבודה מפורטת
- [CHANGELOG.md](CHANGELOG.md) - היסטוריית שינויים

---

## 🤖 הוראות ל-Cursor

אם אתה מעתיק את זה ל-Cursor, הוסף:

```
אני עובד על פרויקט React + TypeScript + Vite עם Supabase.

כללים חשובים:
1. אני תמיד עובד על ענף 'dev' - לא 'main'
2. לפני כל שינוי אני עושה: git pull production dev
3. אחרי שינוי אני עושה: git push production dev
4. אסור לי לשנות: .env, vite.config.ts, supabaseClient.ts
5. אסור לי לשנות משתני סביבה: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
6. אם אתה מציע שינוי בקבצים אלה - תזהיר אותי!

המבנה:
- src/components/ - כל הקומפוננטים
- src/supabaseClient.ts - חיבור למסד נתונים (אל תשנה!)
- vite.config.ts - תצורת Vite (אל תשנה!)

לפני כל קוד - בדוק שאתה לא משנה קבצים אסורים!
```

---

## 🆘 עזרה

### בעיות נפוצות:

#### "Cannot find module 'vite'"
```bash
rm -rf node_modules package-lock.json
npm install
```

#### "Supabase connection failed"
בדוק ש-`.env.local` קיים ומכיל את המשתנים הנכונים.

#### "Build failed"
```bash
npm run build
# קרא את השגיאות ותקן
```

#### שאלות אחרות?
דבר עם אופיר!

---

## 🎯 תזכורת מהירה

```bash
# בכל פעם שאתה מתחיל לעבוד:
git checkout dev
git pull production dev
cat CHANGELOG.md

# עבוד על הקוד...

# כשסיימת:
npm run build
# תעד ב-CHANGELOG.md
git pull production dev
git add .
git commit -m "תיאור"
git push production dev

# בדוק: https://childapp2.srv989497.hstgr.cloud/dev/
```

---

<div align="center">

**🚀 בהצלחה!**

אם משהו לא ברור - שאל את אופיר

*גאון - פלטפורמת למידה ויצירה*

</div>
