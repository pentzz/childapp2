# 🎯 מדריך פרויקט - Cursor AI

## ⚠️ הוראה מחייבת - קרא לפני כל שינוי!

### 🚨 תהליך עבודה מחייב (2 משתמשים):

1. **לפני כל שינוי** - **חובה לקרוא את `CHANGELOG.md`** - זה מתעדכן בזמן אמת!
2. **בצע את השינוי** - רק אחרי שקראת את השינויים האחרונים
3. **תעד את השינוי** - **חובה להוסיף ל-`CHANGELOG.md`** לפני Commit!
4. **Commit** - רק אחרי שתיעדת את השינוי

**⚠️ ללא תיעוד - אין Commit!**

### 👥 משתמשים בפרויקט:

- **אופיר ברנס** (ofirbaranesad@gmail.com) - מחשב זה
- **מתוקו מסגנאו** - מחשב שני

---

## 📋 תוכן עניינים

1. [⚠️ תיעוד שינויים (מחייב!)](#תיעוד-שינויים-מחייב)
2. [מידע כללי על הפרויקט](#מידע-כללי-על-הפרויקט)
3. [משיכת הפרויקט מה-Git של השרת](#משיכת-הפרויקט-מה-git-של-השרת)
4. [מבנה הפרויקט](#מבנה-הפרויקט)
5. [משתני סביבה](#משתני-סביבה)
6. [תהליך Deploy](#תהליך-deploy)
7. [אזהרות חשובות](#אזהרות-חשובות)
8. [פקודות חשובות](#פקודות-חשובות)
9. [ארכיטקטורה ומבנה](#ארכיטקטורה-ומבנה)

---

## ⚠️ תיעוד שינויים (מחייב!)

### 🚨 תהליך עבודה מחייב:

**לפני כל שינוי בקוד, חובה:**

1. **קרא את `CHANGELOG.md`** - זה מתעדכן בזמן אמת על ידי שני המשתמשים!
2. **בדוק מה שונה לאחרונה** - האם יש שינויים שמשפיעים על מה שאתה עושה?
3. **בצע את השינוי** - רק אחרי שקראת והבנת את השינויים האחרונים
4. **תעד את השינוי** - **חובה להוסיף ל-`CHANGELOG.md`** לפני Commit!
5. **Commit** - רק אחרי שתיעדת את השינוי

### 📝 פורמט תיעוד שינוי:

**לפני כל Commit, תוסיף ל-`CHANGELOG.md`:**

```markdown
### [YYYY-MM-DD] - [שם המשתמש] - [תיאור קצר]

**מה שונה:**
- [תיאור מפורט של השינוי]
- [קובץ/תיקייה ששונה]
- [תכונה/תיקון שהוסף]

**למה:**
- [סיבה לשינוי]

**השפעה:**
- [איך זה משפיע על המערכת]
- [האם צריך Deploy?]
- [האם יש breaking changes?]
```

### ✅ דוגמה לתיעוד:

```markdown
### [2024-11-05] - אופיר ברנס - תיקון API Key loading

**מה שונה:**
- עדכון `vite.config.ts` לקריאת `VITE_GEMINI_API_KEY` מ-`.env.production`
- עדכון `deploy-vite-project.sh` ליצירת `.env.production` לפני Build

**למה:**
- API Key לא נטען נכון ב-Production

**השפעה:**
- ✅ API Key נטען נכון כעת
- ✅ צריך Deploy מחדש
- ❌ אין breaking changes
```

### 🚨 שינויים קריטיים:

אם יש שינוי קריטי שמשפיע על המערכת, **הדגש אותו כך:**

```markdown
### [YYYY-MM-DD] - [שם המשתמש] - ⚠️ BREAKING CHANGE: [תיאור]

**⚠️ שינוי קריטי!**
- [תיאור השינוי הקריטי]
- [מה נשבר/השתנה]
- [איך להתמודד עם זה]
```

### 📋 Checklist לפני Commit:

- [ ] קראתי את `CHANGELOG.md` (חובה!)
- [ ] הבנתי את השינויים האחרונים
- [ ] הוספתי את השינוי שלי ל-`CHANGELOG.md` (חובה!)
- [ ] תיעדתי את כל הקבצים ששונו
- [ ] תיעדתי את הסיבה לשינוי
- [ ] תיעדתי את ההשפעה על המערכת
- [ ] אני מוכן ל-Commit!

**⚠️ ללא תיעוד ב-`CHANGELOG.md` - אין לעשות Commit!**

---

## 🌐 מידע כללי על הפרויקט

### **שם הפרויקט:**
`childapp2` - מערכת ליצירת תוכן חינוכי לילדים

### **טכנולוגיות:**
- **Frontend:** React 19 + TypeScript + Vite
- **Backend:** Supabase (PostgreSQL + Auth + Real-time)
- **AI:** Google Gemini API (`@google/genai`)
- **Deployment:** CyberPanel (Linux Server)

### **כתובת השרת:**
- **Domain:** `childapp2.srv989497.hstgr.cloud`
- **IP:** `72.60.81.96`
- **SSH User:** `root`
- **Git Repository:** `/var/repo/childapp2.git`
- **Environment File:** `/var/repo/childapp2.env`
- **Web Root:** `/home/childapp2.srv989497.hstgr.cloud/public_html`

### **כתובת Supabase:**
- **URL:** `https://vudwubldeonlqhlworcq.supabase.co`
- **Dashboard:** https://supabase.com/dashboard

---

## 🔄 משיכת הפרויקט מה-Git של השרת

### **שלב 1: התחברות לשרת**

```bash
# התחברות לשרת עם SSH
ssh root@72.60.81.96
```

### **שלב 2: מיקום ה-Git Repository**

```bash
# ה-Git repository נמצא בנתיב:
cd /var/repo/childapp2.git

# בדוק את ה-branches
git branch -a

# בדוק את ה-commits האחרונים
git log --oneline -10
```

### **שלב 3: Clone הפרויקט למקום עבודה מקומי**

**אפשרות A: Clone ישירות מהשרת (מומלץ)**

```bash
# במחשב המקומי שלך (לא בשרת)
git clone ssh://root@72.60.81.96/var/repo/childapp2.git childapp2-local
cd childapp2-local
```

**אפשרות B: Clone דרך Git Hook (אם יש remote מוגדר)**

```bash
# אם יש remote בשם 'production'
git remote -v  # בדוק את ה-remotes
git clone --origin production ssh://root@72.60.81.96/var/repo/childapp2.git
```

### **שלב 4: הגדרת Remote (אם צריך)**

```bash
# בדוק את ה-remotes הקיימים
git remote -v

# הוסף remote לשרת (אם לא קיים)
git remote add production ssh://root@72.60.81.96/var/repo/childapp2.git

# הוסף remote למקומי (אם צריך)
git remote add origin <your-origin-url>
```

### **שלב 5: משיכת השינויים האחרונים**

```bash
# משוך את ה-main branch
git checkout main
git pull production main

# או אם אתה כבר ב-main
git pull
```

---

## 📁 מבנה הפרויקט

```
childapp2/
├── src/
│   ├── components/          # כל הקומפוננטות של React
│   │   ├── App.tsx          # הקומפוננטה הראשית
│   │   ├── AppContext.tsx   # ⚠️ CRITICAL - ניהול State גלובלי
│   │   ├── AdminDashboard.tsx  # לוח בקרה למנהלים
│   │   ├── StoryCreator.tsx     # יצירת סיפורים
│   │   ├── WorkbookCreator.tsx  # יצירת חוברות ותוכניות למידה
│   │   ├── ChildDashboard.tsx   # דשבורד לילדים
│   │   ├── ParentDashboard.tsx  # דשבורד להורים
│   │   ├── UserProfile.tsx      # פרופיל משתמש
│   │   ├── LoginModal.tsx       # התחברות
│   │   └── ... (קומפוננטות נוספות)
│   ├── supabaseClient.ts    # ⚠️ CRITICAL - הגדרת Supabase
│   └── vite-env.d.ts        # TypeScript definitions
├── public/
│   └── logo.png             # הלוגו (חייב להיות ב-public/)
├── index.html               # HTML ראשי
├── index.tsx                # Entry point
├── vite.config.ts           # ⚠️ CRITICAL - הגדרות Vite + Environment Variables
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config
├── deploy-vite-project.sh   # ⚠️ CRITICAL - Script Deploy לשרת
└── UPGRADE_CONTENT_SYSTEM.sql  # SQL Schema (Supabase)
```

### **קבצים קריטיים (⚠️ אל תמחק/תשנה בלי הבנה):**

1. **`src/components/AppContext.tsx`** - ניהול State גלובלי, Real-time subscriptions, ניהול משתמשים
2. **`vite.config.ts`** - הגדרות Build + Environment Variables
3. **`deploy-vite-project.sh`** - Script Deploy (רץ אוטומטית ב-Git Hook)
4. **`src/supabaseClient.ts`** - הגדרת Supabase Client
5. **`index.html`** - HTML ראשי (לא להסיר את ה-React div!)

---

## 🔐 משתני סביבה

### **מיקום משתני הסביבה בשרת:**

```bash
# בשרת - קובץ משתני הסביבה
/var/repo/childapp2.env
```

### **תוכן הקובץ (דוגמה):**

```bash
VITE_SUPABASE_URL=https://vudwubldeonlqhlworcq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_GEMINI_API_KEY=AIzaSyB02O22P0LJ9fRjPMb5tyOxvvvQN1EfZ9c
```

### **איך לקרוא את משתני הסביבה מהשרת:**

```bash
# דרך SSH
ssh root@72.60.81.96 "cat /var/repo/childapp2.env"
```

### **איך לעדכן משתני סביבה בשרת:**

```bash
# דרך SSH - ערוך את הקובץ
ssh root@72.60.81.96
nano /var/repo/childapp2.env
# או
vi /var/repo/childapp2.env

# אחרי עדכון - צריך לעשות Deploy מחדש!
```

### **משתני סביבה מקומיים (פיתוח):**

צור קובץ `.env.local` בפרויקט המקומי:

```bash
# .env.local
VITE_SUPABASE_URL=https://vudwubldeonlqhlworcq.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_GEMINI_API_KEY=your_gemini_key_here
```

**⚠️ חשוב:** אל תעלה את `.env.local` ל-Git! הוא כבר ב-`.gitignore`.

---

## 🚀 תהליך Deploy

### **איך Deploy עובד:**

1. **Git Push** ל-`production` remote → מפעיל Git Hook
2. **Git Hook** → מריץ `deploy-vite-project.sh`
3. **Deploy Script** → עושה את הפעולות הבאות:
   - קורא `/var/repo/childapp2.env`
   - יוצר `.env.production` בפרויקט
   - מריץ `npm install`
   - מריץ `npm run build` (Vite build)
   - מעתיק את `dist/` ל-`/home/childapp2.srv989497.hstgr.cloud/public_html`

### **Deploy ידני (אם צריך):**

```bash
# התחבר לשרת
ssh root@72.60.81.96

# עבור ל-Git repository
cd /var/repo/childapp2.git

# הרץ את ה-Deploy Script
./deploy-vite-project.sh
```

### **Deploy דרך Git (אוטומטי):**

```bash
# במחשב המקומי שלך
git add .
git commit -m "Your commit message"
git push production main
```

**⚠️ זה יעשה Deploy אוטומטית!**

---

## ⚠️ אזהרות חשובות

### **❌ אל תעשה:**

1. **❌ אל תעשה Commit ללא תיעוד ב-`CHANGELOG.md`** - זה מחייב!
2. **❌ אל תעשה שינוי ללא קריאת `CHANGELOG.md`** - זה מחייב!
3. **אל תמחק את `AppContext.tsx`** - זה יפיל את כל האפליקציה
4. **אל תשנה את `vite.config.ts` בלי הבנה** - זה ישבור את ה-Build
5. **אל תמחק את `index.html`** - זה ה-entry point
6. **אל תעלה `.env.local` ל-Git** - זה מכיל סודות!
7. **אל תשנה את `deploy-vite-project.sh` בלי לבדוק** - זה ישבור את ה-Deploy
8. **אל תמחק את `/public/logo.png`** - זה הלוגו
9. **אל תשנה את מבנה ה-`src/components/` בלי לבדוק** - זה ישבור imports

### **✅ תמיד תעשה:**

1. **✅ קרא את `CHANGELOG.md` לפני כל שינוי** - זה מחייב!
2. **✅ תיעד כל שינוי ב-`CHANGELOG.md` לפני Commit** - זה מחייב!
3. **עשה `git pull` לפני שינויים** - תמיד להיות מעודכן
4. **בדוק את ה-Console** - אחרי שינויים, בדוק שגיאות
5. **עשה `npm install`** - אחרי `git pull` אם יש שינויים ב-`package.json`
6. **עשה `npm run build` מקומית** - לפני Push לשרת
7. **בדוק את ה-TypeScript** - `npm run build` יראה שגיאות
8. **עשה Commit עם הודעות ברורות** - זה עוזר ל-Troubleshooting

---

## 🔧 פקודות חשובות

### **פיתוח מקומי:**

```bash
# התקנת Dependencies
npm install

# הרצת שרת פיתוח (localhost:3000)
npm run dev

# Build ל-Production (מקומי)
npm run build

# Preview של Build (מקומי)
npm run preview
```

### **Git פקודות:**

```bash
# בדוק את ה-Status
git status

# הוסף שינויים
git add .

# Commit
git commit -m "תיאור השינוי"

# Push ל-Production (Deploy אוטומטי!)
git push production main

# משוך שינויים
git pull production main

# בדוק את ה-Log
git log --oneline -10
```

### **SSH פקודות (שרת):**

```bash
# התחברות
ssh root@72.60.81.96

# בדוק את ה-Environment Variables
cat /var/repo/childapp2.env

# בדוק את ה-Logs (אם יש)
tail -f /var/log/nginx/error.log

# בדוק את ה-Deploy Script
cat /var/repo/deploy-vite-project.sh

# בדוק את ה-Web Root
ls -la /home/childapp2.srv989497.hstgr.cloud/public_html
```

---

## 🏗️ ארכיטקטורה ומבנה

### **State Management:**

- **`AppContext.tsx`** - ניהול State גלובלי עם React Context
- **Real-time Subscriptions** - Supabase Real-time ל-`credit_costs`, `users`, `api_keys`
- **Polling Fallback** - אם Real-time נכשל, יש Polling כל 10 שניות

### **מבנה הנתונים (Supabase):**

#### **טבלאות עיקריות:**

1. **`users`** - משתמשים
   - `id` (UUID, Primary Key)
   - `email`
   - `username`
   - `role` ('parent' | 'admin')
   - `credits` (מספר)
   - `is_admin` (boolean)
   - `is_super_admin` (boolean)
   - `api_key_id` (FK ל-`api_keys`)

2. **`credit_costs`** - עלויות קרדיטים (טבלה עם שורה אחת)
   - `id` (Primary Key)
   - `story_part` (מספר)
   - `worksheet` (מספר)
   - `workbook` (מספר)
   - `learning_plan` (מספר)

3. **`api_keys`** - מפתחות Gemini API
   - `id` (Primary Key)
   - `key_name` (שם)
   - `api_key` (המפתח עצמו)
   - `description`
   - `is_active` (boolean)

4. **`profiles`** - פרופילים של ילדים
   - `id` (Primary Key)
   - `user_id` (FK ל-`users`)
   - `name`, `age`, `gender`, `interests`, etc.

5. **`stories`** - סיפורים שנוצרו
6. **`workbooks`** - חוברות שנוצרו
7. **`learning_plans`** - תוכניות למידה

### **Real-time Subscriptions:**

האפליקציה משתמשת ב-Supabase Real-time ל:
- **`credit_costs`** - עדכון עלויות בזמן אמת
- **`users`** - עדכון משתמשים (למנהלים)
- **`api_keys`** - עדכון מפתחות API (למנהלים)

### **Authentication:**

- **Supabase Auth** - Google OAuth
- **Session Management** - אוטומטי דרך Supabase
- **Auto-refresh** - Token מתעדכן אוטומטית

### **API Key Management:**

- **מנהל-על** יכול להוסיף/לערוך/למחוק API Keys
- **כל משתמש** מקבל `api_key_id` שמצביע על API Key
- **בעת יצירת תוכן** - משתמשים ב-API Key של המשתמש

---

## 🔍 Debugging Tips

### **אם יש שגיאות:**

1. **פתח Console** (`F12` בדפדפן)
2. **חפש שגיאות** - 🔴 או ❌
3. **בדוק Network Tab** - האם יש שגיאות HTTP?
4. **בדוק את ה-Logs של Supabase** - Dashboard → Logs

### **אם Deploy נכשל:**

1. **בדוק את ה-Output של `git push`** - יש שם Logs
2. **התחבר לשרת** - `ssh root@72.60.81.96`
3. **בדוק את ה-Environment Variables** - `cat /var/repo/childapp2.env`
4. **הרץ את ה-Deploy Script ידנית** - `./deploy-vite-project.sh`

### **אם API Key לא עובד:**

1. **בדוק את ה-Console** - האם יש הודעות על API Key?
2. **בדוק את `vite.config.ts`** - האם הוא קורא את `VITE_GEMINI_API_KEY`?
3. **בדוק את `.env.production`** - האם הוא נוצר בזמן Deploy?
4. **בדוק את ה-Environment Variables בשרת** - `cat /var/repo/childapp2.env`

---

## 📚 משאבים נוספים

### **קבצים חשובים:**

- **`DEPLOY_INSTRUCTIONS.md`** - הוראות Deploy מפורטות
- **`SUPABASE_REDIRECT_FIX.md`** - תיקון Redirect URLs
- **`UPGRADE_CONTENT_SYSTEM.sql`** - SQL Schema מלא
- **`כרטיס_עזר_מהיר.txt`** - כרטיס עזר מהיר לתיקונים

### **קישורים חשובים:**

- **Supabase Dashboard:** https://supabase.com/dashboard
- **Google Gemini API:** https://ai.google.dev/
- **Vite Documentation:** https://vite.dev/
- **React Documentation:** https://react.dev/

---

## ✅ Checklist לפני Push לשרת

### לפני כל שינוי:
- [ ] **קראתי את `CHANGELOG.md`** (חובה!)
- [ ] הבנתי את השינויים האחרונים
- [ ] בדקתי שאין שינויים שמתנגשים עם מה שאני עושה

### לפני Commit:
- [ ] **הוספתי את השינוי שלי ל-`CHANGELOG.md`** (חובה!)
- [ ] תיעדתי את כל הקבצים ששונו
- [ ] תיעדתי את הסיבה לשינוי
- [ ] תיעדתי את ההשפעה על המערכת

### לפני Push:
- [ ] ערכתי `git pull` כדי לקבל את השינויים האחרונים
- [ ] הרצתי `npm install` אם יש שינויים ב-`package.json`
- [ ] הרצתי `npm run build` מקומית - ללא שגיאות
- [ ] בדקתי את ה-TypeScript - ללא שגיאות
- [ ] בדקתי את ה-Console - ללא שגיאות
- [ ] בדקתי את ה-Environment Variables - מוגדרים נכון
- [ ] כתבתי Commit Message ברור
- [ ] אני מוכן ל-Deploy!

---

## 🎯 סיכום

**פרויקט זה הוא מערכת ליצירת תוכן חינוכי לילדים, עם:**

- ✅ React 19 + TypeScript + Vite
- ✅ Supabase (Backend + Auth + Real-time)
- ✅ Google Gemini API (AI)
- ✅ Deploy אוטומטי דרך Git Hooks

**⚠️ חשוב לזכור:**
- תמיד לעשות `git pull` לפני שינויים
- תמיד לבדוק `npm run build` לפני Push
- אל למחוק קבצים קריטיים
- Environment Variables חייבים להיות מוגדרים נכון

**🚀 בהצלחה!**

