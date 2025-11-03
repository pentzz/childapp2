# 🎨 ChildApp2 - פלטפורמה חינוכית אינטראקטיבית

מערכת מתקדמת ליצירת תכנים חינוכיים מותאמים אישית באמצעות בינה מלאכותית.

## 📋 תוכן עניינים

- [תכונות עיקריות](#-תכונות-עיקריות)
- [טכנולוגיות](#-טכנולוגיות)
- [התקנה והרצה](#-התקנה-והרצה)
- [הגדרת Supabase](#-הגדרת-supabase)
- [משתני סביבה](#-משתני-סביבה)
- [מבנה הפרויקט](#-מבנה-הפרויקט)
- [תיעוד למשתמשים](#-תיעוד-למשתמשים)
- [פיצ'רים מתקדמים](#-פיצרים-מתקדמים)

---

## 🌟 תכונות עיקריות

### 💫 יצירת תכנים

- **סיפורים אינטראקטיביים** - יצירת סיפורים מותאמים אישית עם תמונות AI
- **תכניות למידה מודרכות** - 5 שלבי למידה מותאמים לגיל ולתחומי עניין
- **דפי תרגול** - דפים להדפסה מותאמים אישית
- **חוברות עבודה** - חוברות אינטראקטיביות עם תרגילים מגוונים

### 👥 ניהול משתמשים

- אימות Supabase מאובטח
- תמיכה במספר פרופילי ילדים למשתמש
- מערכת קרדיטים דינמית
- הרשאות מנהל ומנהל-על

### 🎯 יכולות AI

- **Google Gemini 2.5 Flash** - יצירת טקסטים
- **Gemini Flash Image** - יצירת תמונות
- תמיכה בתמונות reference לדמויות אישיות
- JSON Schema validation

### 📱 חוויית משתמש

- UI מרשים עם אפקטים ויזואליים
- Responsive Design מלא
- תמיכה בהדפסה
- הקראת טקסט (Text-to-Speech)
- זיהוי קולי (Speech Recognition)

---

## 🛠️ טכנולוגיות

### Frontend
- **React 19.2** - ספריית UI
- **TypeScript** - שפת פיתוח מובנית
- **Vite** - Build tool מהיר
- **CSS Custom Properties** - עיצוב דינמי

### Backend & Services
- **Supabase** - Backend-as-a-Service:
  - Authentication
  - PostgreSQL Database
  - Real-time Subscriptions
  - Row Level Security (RLS)
- **Google Gemini AI** - יצירת תכנים וגרפיקות

### אחסון נתונים
- `users` - משתמשי המערכת
- `profiles` - פרופילי ילדים
- `stories` - סיפורים אינטראקטיביים
- `learning_plans` - תכניות למידה
- `worksheets` - דפי תרגול
- `workbooks` - חוברות עבודה
- `credit_costs` - ניהול עלויות דינמי

---

## 🚀 התקנה והרצה

### דרישות מקדימות

- Node.js 18+ 
- npm או pnpm
- חשבון Supabase (חינם)
- Google AI API Key

### שלבי התקנה

#### 1. Clone הפרויקט

```bash
git clone https://github.com/pentzz/childapp2.git
cd childapp2
```

#### 2. התקנת תלויות

```bash
npm install
```

#### 3. הגדרת משתני סביבה

צרו קובץ `.env` בשורש הפרויקט:

```env
# Google AI
VITE_API_KEY=your_google_ai_api_key_here

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

#### 4. הרצת שרת פיתוח

```bash
npm run dev
```

האפליקציה תהיה זמינה ב: `http://localhost:5173`

#### 5. Build לפרודקשן

```bash
npm run build
npm run preview
```

---

## 🗄️ הגדרת Supabase

### שלב 1: יצירת פרויקט

1. היכנסו ל-[Supabase](https://supabase.com)
2. צרו פרויקט חדש
3. שמרו את ה-URL וה-Anon Key

### שלב 2: הרצת המיגרציות

הפרויקט כולל קובץ SQL מלא: `supabase_migrations.sql`

**אופציה A: דרך Dashboard**

1. היכנסו ל-Supabase Dashboard
2. עברו ל-**SQL Editor**
3. העתיקו את התוכן של `supabase_migrations.sql`
4. הריצו את הסקריפט

**אופציה B: דרך CLI**

```bash
# התקנת Supabase CLI
npm install -g supabase

# התחברות
supabase login

# הרצת מיגרציה
supabase db push --db-url "your_db_connection_string"
```

### שלב 3: אפשור Real-time

זה **קריטי** לסנכרון עלויות קרדיטים:

1. Dashboard → **Database** → **Replication**
2. הוסיפו את טבלת `credit_costs` ל-publication
3. או הריצו:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE credit_costs;
```

### שלב 4: יצירת משתמש ראשון (Super Admin)

```sql
-- הרשמו במערכת דרך ה-UI תחילה, אז:
UPDATE users 
SET is_admin = true, is_super_admin = true 
WHERE email = 'your-email@example.com';
```

📚 **למידע מפורט:** ראו `SUPABASE_SETUP.md`

---

## 🔑 משתני סביבה

### נדרשים

| משתנה | תיאור | דוגמה |
|-------|--------|--------|
| `VITE_API_KEY` | Google AI API Key | `AIzaSy...` |
| `VITE_SUPABASE_URL` | Supabase Project URL | `https://abc.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase Anon Key | `eyJhbG...` |

### קבלת Google AI API Key

1. עברו ל-[Google AI Studio](https://aistudio.google.com/app/apikey)
2. צרו API Key חדש
3. העתיקו אותו ל-`.env`

---

## 📁 מבנה הפרויקט

```
childapp2/
├── src/
│   └── components/
│       ├── App.tsx                 # קומפוננטה ראשית
│       ├── AppContext.tsx          # ניהול State גלובלי
│       ├── Login.tsx               # מסך כניסה והרשמה
│       ├── LoggedInHeader.tsx      # Header למשתמשים מחוברים
│       ├── UserProfile.tsx         # ניהול פרופילי ילדים
│       ├── StoryCreator.tsx        # יצירת סיפורים
│       ├── WorkbookCreator.tsx     # מרכז למידה (תכניות/דפים/חוברות)
│       ├── AdminDashboard.tsx      # ממשק מנהל
│       ├── Library.tsx             # הספרייה שלי
│       ├── Loader.tsx              # אנימציית טעינה
│       └── GlobalStyles.tsx        # סגנונות גלובליים
│
├── supabaseClient.ts               # חיבור Supabase
├── helpers.ts                      # פונקציות עזר
├── styles.ts                       # סגנונות משותפים
│
├── supabase_migrations.sql         # SQL Schema מלא
├── SUPABASE_SETUP.md              # הוראות Supabase מפורטות
├── USER_GUIDE.md                   # מדריך למשתמשי קצה
│
├── index.html                      # HTML ראשי + CSS גלובלי
├── index.tsx                       # Entry point
├── vite.config.ts                  # הגדרות Vite
├── tsconfig.json                   # הגדרות TypeScript
└── package.json                    # תלויות
```

---

## 📖 תיעוד למשתמשים

מדריך שימוש מפורט עם דוגמאות זמין ב:
👉 **[USER_GUIDE.md](./USER_GUIDE.md)**

המדריך כולל:
- הוראות שימוש שלב אחר שלב
- דוגמאות לכל פיצ'ר
- טיפים לחיסכון בקרדיטים
- שאלות נפוצות (FAQ)
- פתרון בעיות נפוצות

---

## 🎯 פיצ'רים מתקדמים

### 1. סנכרון Real-time של עלויות קרדיטים

המערכת משתמשת במנגנון אגרסיבי לסנכרון:

```typescript
// AppContext.tsx
useEffect(() => {
  // 1. Real-time subscription
  supabase.channel('credit_costs_changes')
    .on('postgres_changes', { table: 'credit_costs' }, handler)
    .subscribe();
  
  // 2. Polling fallback (כל 10 שניות)
  setInterval(loadCreditCosts, 10000);
  
  // 3. רענון בעת חזרה לטאב
  document.addEventListener('visibilitychange', handler);
  
  // 4. רענון לפני כל יצירה
  await refreshCreditCosts();
}, []);
```

### 2. מערכת פרופילים מתקדמת

- תמיכה בתמונות reference לדמויות מותאמות
- כל תוכן משויך לפרופיל ספציפי
- סינון אוטומטי של תכנים לפי פרופיל פעיל

### 3. Responsive Design מלא

```css
/* index.html */
@media (max-width: 1200px) {
  /* מסתיר טקסט, משאיר אייקונים */
}

@media (max-width: 768px) {
  /* ממשק נייד מלא */
}
```

### 4. טיפול בטעינה ושגיאות

```typescript
// כל קומפוננטה כוללת:
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState('');

// עם Loader ייעודי
{isLoading && <Loader message="יוצר תוכן..." />}
```

### 5. שמירה אוטומטית

- סיפורים נשמרים אחרי כל חלק
- תכניות למידה נשמרות אחרי כל שלב
- שחזור אוטומטי בעת טעינת `contentId`

---

## 🔒 אבטחה

### Row Level Security (RLS)

כל הטבלאות מוגנות ב-RLS:

```sql
-- דוגמה: רק משתמש רואה את הפרופילים שלו
CREATE POLICY "Users can view own profiles"
ON profiles FOR SELECT
TO authenticated
USING (user_id = auth.uid());
```

### Authentication

- Supabase Auth מובנה
- Session management אוטומטי
- Password hashing מאובטח

### API Keys

- משתנים ב-`.env` (לא ב-Git!)
- Vite prefix: `VITE_` לחשיפה לקליינט
- Anon Key של Supabase מוגן ב-RLS

---

## 🐛 Debugging

### Console Logs

המערכת כוללת logging מפורט:

```typescript
console.log('🔵 Real-time subscription active');
console.log('🔄 Polling credit costs...');
console.log('✅ Credit costs synced!');
console.log('❌ Error:', error);
```

### Tools מומלצים

- **React Developer Tools** - בדיקת state
- **Supabase Studio** - ניהול DB
- **Network Tab** - בדיקת API calls

---

## 📈 ביצועים

### אופטימיזציות

- ✅ Real-time בלי פולינג מיותר
- ✅ Lazy loading של קומפוננטות (אפשרי בעתיד)
- ✅ Memoization של callbacks
- ✅ Debouncing של inputs (אפשרי בעתיד)

### זמני טעינה

| פעולה | זמן ממוצע |
|-------|-----------|
| חלק סיפור | 30-60 שניות |
| שלב למידה | 45-90 שניות |
| דף תרגול | 40-70 שניות |
| חוברת | 60-120 שניות |

---

## 🚀 Deployment

### Vercel (מומלץ)

```bash
# התקנת Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Netlify

```bash
# Build
npm run build

# Upload את תיקיית dist/
```

### משתני סביבה בפרודקשן

ודאו שהגדרתם:
- `VITE_API_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## 🤝 תרומה

רוצים לתרום? מצוין!

1. Fork את הפרויקט
2. צרו branch חדש (`git checkout -b feature/amazing-feature`)
3. Commit (`git commit -m 'Add amazing feature'`)
4. Push (`git push origin feature/amazing-feature`)
5. פתחו Pull Request

---

## 📝 רישיון

פרויקט זה הוא קוד פתוח תחת רישיון MIT.

---

## 🙏 תודות

- **Google Gemini** - AI מדהים
- **Supabase** - Backend מושלם
- **React** - הספרייה הכי טובה
- **Vite** - Build tool מהיר

---

## 📞 יצירת קשר

יש שאלות? רעיונות? בעיות?

- 📧 אימייל: support@childapp.com
- 🐛 Issues: [GitHub Issues](https://github.com/pentzz/childapp2/issues)
- 📖 דוקס: ראו `USER_GUIDE.md` למשתמשים

---

**נבנה עם ❤️ לילדים ולהורים**

*עודכן לאחרונה: ינואר 2025*

