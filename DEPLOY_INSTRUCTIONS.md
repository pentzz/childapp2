# 🔧 הוראות Deploy עם משתני Supabase

## ⚠️ בעיות שצריך לתקן:

### 1. משתני Supabase לא מוגדרים בשרת

האפליקציה צריכה את משתני הסביבה הבאים:
- `VITE_SUPABASE_URL` - כתובת ה-API של Supabase
- `VITE_SUPABASE_ANON_KEY` - המפתח האנונימי של Supabase

### 2. הוסר קישור ל-index.css שלא קיים

✅ **תוקן** - הקישור הוסר מ-`index.html`

---

## 🔴 שלב 1: קבל את משתני Supabase

1. **לכי ל-Supabase Dashboard:**
   - https://supabase.com/dashboard
   - בחרי את הפרויקט שלך

2. **לכי ל-Settings → API:**
   - מצאי את **"Project URL"** → זה ה-`VITE_SUPABASE_URL`
   - מצאי את **"anon public"** key → זה ה-`VITE_SUPABASE_ANON_KEY`

---

## 🔴 שלב 2: עדכני את ה-Deploy Script בשרת

**התחברי לשרת ב-SSH:**
```bash
ssh root@72.60.81.96
```

**ערוכי את הקובץ:**
```bash
nano /var/repo/childapp2.env
```

**הוסיפי את השורות הבאות:**
```bash
VITE_GEMINI_API_KEY=AIzaSyBXX00z5boj_XW9FEvtZDempkEKpnYpqHU
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
```

**שמרי והקישי:**
- `Ctrl+O` → `Enter` → `Ctrl+X`

---

## 🔴 שלב 3: עדכני את ה-Deploy Script

**ערוכי את הקובץ:**
```bash
nano /var/repo/deploy-vite-project.sh
```

**מצאי את השורה:**
```bash
source /var/repo/childapp2.env
```

**וודאי שהיא קיימת לפני ה-build**, ואז ה-build יקרא את משתני הסביבה.

**או הוסיפי:**
```bash
export VITE_SUPABASE_URL=$(grep VITE_SUPABASE_URL /var/repo/childapp2.env | cut -d '=' -f2)
export VITE_SUPABASE_ANON_KEY=$(grep VITE_SUPABASE_ANON_KEY /var/repo/childapp2.env | cut -d '=' -f2)
export VITE_GEMINI_API_KEY=$(grep VITE_GEMINI_API_KEY /var/repo/childapp2.env | cut -d '=' -f2)
```

**לפני:**
```bash
npm run build
```

---

## 🔴 שלב 4: Deploy מחדש

**מהמחשב המקומי:**
```bash
git add .
git commit -m "Fix CSS link and Supabase env vars"
git push production main
```

---

## ✅ אחרי זה:

1. האפליקציה תתחבר ל-Supabase
2. ה-CSS יעבוד (כל ה-CSS הוא inline ב-`index.html`)
3. הכל יעבוד כמו שצריך!

---

## 📝 הערות:

- **משתני Supabase** חייבים להיות מוגדרים **לפני** ה-build
- **Vite** קורא משתני סביבה רק ב-build time
- **אחרי build** - הערכים מוטבעים בקוד

