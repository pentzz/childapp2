# 📚 מבנה הפרויקט - מדריך מקיף למפתחים

## 🎯 סקירה כללית

פרויקט זה הוא אפליקציית React מבוססת TypeScript למערכת חינוכית לילדים.
המערכת מאפשרת ליצור סיפורים, חוברות עבודה ותוכניות למידה מותאמות אישית באמצעות AI.

---

## 📁 מבנה תיקיות

```
childapp2/
├── src/
│   ├── components/        # כל קומפוננטות React
│   ├── services/          # לוגיקה עסקית ו-API
│   ├── assets/            # תמונות, אייקונים, קבצים סטטיים
│   ├── supabaseClient.ts  # חיבור ל-Supabase
│   └── main.tsx           # נקודת הכניסה
├── styles.tsx             # עיצוב גלובלי
├── public/                # קבצים סטטיים
├── dist/                  # Build output (לא ב-git)
├── SQL קבצים/             # סקריפטים ל-Supabase
└── package.json           # תלויות ו-scripts

---

## 🧩 קומפוננטות מרכזיות

### 📊 **App.tsx** - הקומפוננטה הראשית
**תפקיד:** מנהלת את כל הניווט והקונטקסט הגלובלי

**מבנה:**
```tsx
<AppProvider>  {/* מספקת קונטקסט גלובלי */}
  <ErrorBoundary>  {/* תופסת שגיאות */}
    <GlobalStyles />
    {/* Routing בין דפים שונים */}
  </ErrorBoundary>
</AppProvider>
```

**עריכה:**
- שינוי routing: חפש `currentView === 'X'`
- הוספת דף חדש: הוסף case ל-currentView
- שינוי סידרת components: ערוך את ה-JSX הראשי

---

### 🌐 **AppContext.tsx** - ניהול State גלובלי
**תפקיד:** מספק state משותף לכל האפליקציה (משתמש, פרופילים, קרדיטים)

**State מרכזי:**
```tsx
{
  user: User | null,                    // משתמש מחובר
  activeProfile: ChildProfile | null,   // פרופיל פעיל
  profiles: ChildProfile[],             // כל הפרופילים
  credits: number,                      // קרדיטים
  creditCosts: { ... }                  // עלויות פעולות
}
```

**עריכה:**
- הוספת state חדש: הוסף ל-interface `AppContextType`
- שינוי לוגיקה: ערוך פונקציות כמו `updateUserCredits`

---

### 🏠 **LandingPage.tsx** - דף הבית
**תפקיד:** דף נחיתה עם מידע על המערכת + כניסה/הרשמה

**חלקים עיקריים:**
- `<HeroSection />` - כותרת + CTA
- `<FeaturesSection />` - תכונות המערכת
- `<PricingSection />` - מחירים וחבילות
- `<AboutSection />` - על המערכת
- `<Footer />` - פוטר

**עריכה:**
- שינוי טקסטים: חפש את החלק הרלוונטי (Hero/Features/About)
- הוספת סקציה: הוסף component חדש ב-return

---

### 👨‍👩‍👧 **ParentDashboard.tsx** - דשבורד ההורים
**תפקיד:** ניהול פרופילי ילדים, צפייה בסיפורים, אנליטיקס

**טאבים:**
1. **Profiles** - יצירה ועריכת פרופילי ילדים
2. **Stories** - כל הסיפורים שנוצרו
3. **Analytics** - סטטיסטיקות שימוש

**עריכה:**
- הוספת טאב: הוסף ל-`activeTab` type והוסף case ב-JSX
- שינוי טופס פרופיל: ערוך את `<ProfileForm />`

---

### 🧒 **ChildDashboard.tsx** - דשבורד הילדים
**תפקיד:** ממשק לילדים ליצירת תכנים

**רכיבים:**
- **פרופיל מרכזי** - תמונה, שם, סטטיסטיקות
- **כרטיסי פעילות** - יצירת סיפור/חוברת/תוכנית
- **תוכן אחרון** - סיפורים וחוברות שנוצרו לאחרונה

**עריכה:**
- שינוי כרטיסי פעילות: ערוך את `activityCards` array
- הוספת פעילות: הוסף object ל-`activityCards`

---

### 📖 **StoryCreator.tsx** - יצירת סיפורים (הקומפוננטה הכי חשובה!)
**תפקיד:** יצירה אינטראקטיבית של סיפורים עם AI + תמונות

**Flow:**
1. **מסך בחירה** (Intro) - בחירת כותרת, סגנון, נושא
2. **מסך יצירה** - AI מייצר סיפור + תמונה
3. **המשך סיפור** - הילד כותב + AI ממשיך

**פונקציות מרכזיות:**

#### `generateStoryPart(storyHistory)`
**תפקיד:** יוצרת חלק חדש בסיפור
**תהליך:**
1. בודקת קרדיטים
2. בונה פרומפט מותאם (התחלה/המשך)
3. קוראת ל-Gemini AI לטקסט
4. קוראת ל-Gemini AI לתמונה (עם רפרנס)
5. שומרת ב-state + database

**עריכה:**
- שינוי פרומפט: ערוך את ה-`enhancedPrompt` string
- הוספת מאפייןים: הוסף משתנים ל-prompt template

#### `startStory()`
**תפקיד:** מתחילה סיפור חדש
**קורא ל:** `generateStoryPart([])`

#### `handleContinueStory()`
**תפקיד:** ממשיכה סיפור קיים לאחר שהילד כתב
**קורא ל:** `generateStoryPart(newStoryHistory)`

**State מרכזי:**
```tsx
storyParts: Array<{     // כל חלקי הסיפור
  author: 'ai' | 'user',
  text: string,
  image?: string,
  timestamp: string
}>

storyTitle: string       // כותרת
artStyle: ArtStyle       // סגנון אמנות
storyTheme: string       // נושא
storyStyle: string       // ז'אנר
```

**עריכה:**
- שינוי UI של הבחירה: ערוך את ה-Intro screen (showIntro)
- שינוי הצגת הסיפור: ערוך את Story View
- הוספת אופציות: הוסף ל-`artStyleOptions` / `themeDescriptions`

---

### 📝 **WorkbookCreator.tsx** - יצירת חוברות עבודה
**תפקיד:** יוצר תרגילים חינוכיים מותאמים

**Flow:**
1. בחירת נושא וקושי
2. AI מייצר תרגילים
3. הורדה כ-PDF

**עריכה:**
- שינוי סוגי תרגילים: ערוך את ה-prompt
- הוספת נושאים: הוסף options

---

### 🎓 **LearningPlan.tsx** - תוכניות למידה
**תפקיד:** יוצר מסלול למידה מותאם

**עריכה:**
- שינוי מבנה: ערוך את ה-schema של התוכנית
- הוספת תכנים: עדכן את ה-AI prompt

---

### 🔐 **LoginModal.tsx** - התחברות והרשמה
**תפקיד:** טיפול ב-authentication

**Modes:**
- Login - התחברות
- Register - הרשמה
- Forgot Password - איפוס סיסמה

**עריכה:**
- שינוי טפסים: ערוך את ה-form JSX
- הוספת שדות: הוסף input + state

---

### 👤 **UserProfile.tsx** - פרופיל משתמש
**תפקיד:** עריכת פרטי משתמש, API keys, הגדרות

**עריכה:**
- הוספת הגדרה: הוסף input ושמירה ב-database

---

### 🛡️ **AdminDashboard.tsx / ImprovedAdminDashboard.tsx** - ניהול מערכת
**תפקיד:** ממשק למנהלים

**פיצ'רים:**
- ניהול משתמשים
- צפייה בסטטיסטיקות
- ניהול קרדיטים
- לוגים של פעילות

**עריכה:**
- הוספת טאב: הוסף ב-navigation
- שינוי הרשאות: עדכן את תנאי ה-rendering

---

## 🔧 Services - לוגיקה עסקית

### 🤖 **enhancedAI.ts** - שירות AI
**תפקיד:** כל הלוגיקה של קריאות ל-AI

**פונקציות מרכזיות:**

#### `createEducationalStoryPrompt(options)`
**תפקיד:** יוצר prompt לסיפור חינוכי
**פרמטרים:**
```tsx
{
  topic: string,           // כותרת
  childName: string,       // שם הילד
  childAge: number,        // גיל
  artStyle: ArtStyle,      // סגנון
  childImageReference?: string,  // תמונת רפרנס
  educationalFocus?: string,
  moralLesson?: string,
  difficulty: 'easy' | 'medium' | 'hard'
}
```

**עריכה:**
- שינוי הוראות: ערוך את ה-prompt string
- הוספת מאפיין: הוסף פרמטר והטמע בפרומפט

#### `createImagePromptWithReference(basePrompt, artStyle, hasReference)`
**תפקיד:** מכין prompt לתמונה עם סגנון ורפרנס
**חשוב:** מוסיף "NO TEXT" כדי למנוע טקסט בתמונות

**עריכה:**
- שינוי סגנונות: ערוך את `artStyleDescriptions`
- הוספת הוראות: הוסף ל-prompt string

#### `createWorkbookPrompt()`
**תפקיד:** יוצר prompt לחוברת עבודה

---

### 💾 **localStorageDB.ts** - אחסון מקומי
**תפקיד:** שומר נתונים ב-localStorage + IndexedDB

**פונקציות:**
- `saveStoryLocally()` - שומר סיפור
- `getAllStories()` - טוען כל הסיפורים
- `saveProfileImage()` - שומר תמונת פרופיל
- `getProfileImage()` - טוען תמונת פרופיל

**למה צריך:** גיבוי מקומי + עבודה offline

---

### 🗄️ **supabaseClient.ts** - חיבור לשרת
**תפקיד:** מנהל חיבור ל-Supabase (database + auth)

**שימוש:**
```tsx
import { supabase } from '../supabaseClient';

// Query
const { data, error } = await supabase
  .from('stories')
  .select('*')
  .eq('user_id', userId);

// Insert
const { error } = await supabase
  .from('stories')
  .insert([{ ... }]);
```

---

## 🎨 עיצוב - styles.tsx

**תפקיד:** כל הסגנונות הגלובליים

**סגנונות מרכזיים:**
```tsx
styles = {
  button: { ... },           // כפתור רגיל
  primaryButton: { ... },    // כפתור ראשי
  input: { ... },            // שדה קלט
  card: { ... },             // כרטיס
  container: { ... },        // מכיל
  // ...
}
```

**משתני צבע (CSS Variables):**
```css
--primary-color: #7FD957      /* ירוק ראשי */
--secondary-color: #56D989    /* ירוק משני */
--accent-color: #A084E8       /* סגול */
--background-dark: #0d1a0d    /* רקע כהה */
```

**עריכה:**
- שינוי צבעים: ערוך ב-GlobalStyles
- שינוי סגנון: ערוך ב-styles object

---

## 🗂️ מבנה Database (Supabase)

### טבלאות מרכזיות:

#### `users`
```sql
- id (uuid, PK)
- email (text)
- role ('user' | 'admin' | 'super_admin')
- credits (integer)
- created_at (timestamp)
```

#### `child_profiles`
```sql
- id (uuid, PK)
- user_id (uuid, FK -> users)
- name (text)
- age (integer)
- gender (text)
- interests (text)
- photo_url (text)
```

#### `saved_content`
```sql
- id (uuid, PK)
- user_id (uuid, FK -> users)
- profile_id (uuid, FK -> child_profiles)
- type ('story' | 'workbook' | 'learning_plan')
- title (text)
- content_data (jsonb)  -- כל הנתונים
- created_at (timestamp)
```

#### `content_sections`
```sql
- id (uuid, PK)
- content_id (uuid, FK -> saved_content)
- section_number (integer)
- section_data (jsonb)
```

---

## 🔀 Flow של פעולות

### 📖 יצירת סיפור חדש:

1. משתמש נכנס ל-ChildDashboard
2. לוחץ על "צור סיפור חדש"
3. StoryCreator מציג מסך בחירה (Intro)
4. משתמש בוחר:
   - כותרת
   - סגנון אמנות (artStyle)
   - נושא (theme)
   - ז'אנר (style)
5. לוחץ "התחל סיפור"
6. `startStory()` -> `generateStoryPart([])`
7. AI מייצר טקסט + תמונה
8. מוצג לילד
9. ילד כותב המשך -> `handleContinueStory()`
10. חוזר על 7-9

### 💾 שמירה:

- **אוטומטית** - כל חלק נשמר מיד ב:
  - Supabase (saved_content table)
  - localStorage (גיבוי מקומי)

---

## 🛠️ איך לערוך קבצים - Best Practices

### ✅ כללי עריכה:

1. **קומפוננטות קטנות:**
   - עדיף 200-300 שורות
   - פצל לקומפוננטות משנה אם צריך

2. **TypeScript:**
   - תמיד הגדר types
   - השתמש ב-interface לאובייקטים

3. **State Management:**
   - State מקומי: `useState` בקומפוננטה
   - State גלובלי: AppContext
   - Server state: React Query (עתידי)

4. **Styling:**
   - עדיף להשתמש ב-styles.tsx
   - או inline styles עם משתנים

5. **AI Prompts:**
   - כתוב ברור ומפורט
   - בדוק תוצאות ושפר
   - הוסף דוגמאות

### 🔧 עריכת קומפוננטה קיימת:

**דוגמה: הוספת אופציה חדשה ל-StoryCreator**

1. הוסף state:
```tsx
const [myNewOption, setMyNewOption] = useState<string>('default');
```

2. הוסף ב-UI (Intro screen):
```tsx
<select value={myNewOption} onChange={(e) => setMyNewOption(e.target.value)}>
  <option value="option1">אופציה 1</option>
  <option value="option2">אופציה 2</option>
</select>
```

3. הטמע בפרומפט (generateStoryPart):
```tsx
enhancedPrompt = `
  ...
  - האופציה החדשה: ${myNewOption}
  ...
`;
```

4. שמור ב-database:
```tsx
const contentData = {
  ...
  myNewOption,  // הוסף למה ששומרים
};
```

### 🆕 יצירת קומפוננטה חדשה:

**תבנית:**
```tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from './AppContext';

interface MyComponentProps {
  // הגדר props
}

const MyComponent = ({ ...props }: MyComponentProps) => {
  const { user, activeProfile } = useAppContext();
  const [myState, setMyState] = useState<string>('');

  const handleAction = async () => {
    // לוגיקה
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* JSX */}
    </motion.div>
  );
};

export default MyComponent;
```

---

## 🐛 Debugging

### Console Logs:

StoryCreator מוסיף logs מפורטים:
```
🚀 Generating story part...
📖 Story Title: הרפתקאות בחלל
🎨 Art Style: cartoon
🌟 Story Theme: space
📸 Has Reference Image: true
📝 Enhanced Prompt: ...
✅ Text generated: ...
🎨 Generating image...
✅ Image generated successfully
✅ Story saved
```

### כלים:

- **React DevTools** - בדוק state וprops
- **Network Tab** - ראה קריאות API
- **Supabase Dashboard** - בדוק database

---

## 📦 Build & Deploy

### Build מקומי:
```bash
npm run build
```

### Deploy (כבר מוגדר):
```bash
npm run deploy
```

**הערה:** ה-deploy script מעלה אוטומטית ל-server.

---

## 🔑 משתני סביבה

**קובץ: `.env` / `.env.production`**

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_GEMINI_API_KEY=...  (אופציונלי - משתמשים יכולים להכניס משלהם)
```

---

## 📚 תלויות מרכזיות

```json
{
  "react": "^18.x",              // UI framework
  "typescript": "^5.x",          // Type safety
  "vite": "^7.x",                // Build tool
  "framer-motion": "^11.x",      // Animations
  "@supabase/supabase-js": "^2.x",  // Database
  "@google/genai": "latest",     // Gemini AI
  "jspdf": "^2.x",               // PDF generation
  "html2canvas": "^1.x"          // Screenshot to PDF
}
```

---

## 🎯 תזרים עבודה מומלץ

### לפני שמתחילים:

1. הבן את הקומפוננטה
2. קרא את הקוד הקיים
3. בדוק איפה השינוי צריך להיות

### תהליך עריכה:

1. צור branch חדש
2. ערוך קבצים
3. בדוק ב-dev mode: `npm run dev`
4. תקן שגיאות
5. Build: `npm run build`
6. Commit + Push
7. Deploy

### Testing:

- בדוק כל flow מקצה לקצה
- בדוק עם משתמשים שונים
- בדוק responsive (mobile/desktop)
- בדוק שגיאות (אין קרדיטים, אין רשת וכו')

---

## 🚀 סיכום

הפרויקט מחולק ל:
- **Components** - UI ואינטראקציות
- **Services** - לוגיקה + API
- **Database** - Supabase
- **AI** - Gemini

**הקומפוננטות החשובות ביותר:**
1. StoryCreator - 80% מהשימוש
2. ChildDashboard - נקודת כניסה
3. ParentDashboard - ניהול
4. AppContext - state גלובלי

**למי שמתחיל:**
- התחל מ-StoryCreator
- למד איך זה עובד
- עשה שינויים קטנים
- הוסף features בזהירות

**למפתחים מנוסים:**
- הפרויקט ארכיטקטורת clean
- TypeScript מאלץ type safety
- Separation of concerns ברור
- קל להרחיב

---

**✨ בהצלחה! ✨**
