# 🌟 גאון (GAON) - תיעוד למפתחים

## 🚀 התחלה מהירה

### התקנה והרצה
```bash
# התקנת תלויות
npm install

# הגדרת משתני סביבה (ראה להלן)
# צור קובץ .env.local עם הערכים הנדרשים

# הרצת סביבת פיתוח
npm run dev

# בניית production
npm build
```

### הגדרת משתני סביבה
צור קובץ `.env.local` בשורש הפרויקט:
```bash
# Supabase (required for production)
VITE_SUPABASE_URL=your-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Google AI API Key
API_KEY=your-google-ai-api-key-here
```

**📖 מדריך מלא להתקנת Supabase:** ראה [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

### ⚠️ אימות אמיתי עם Supabase
המערכת משתמשת כעת באימות אמיתי דרך **Google OAuth**.

**להתחבר:**
1. לחץ "כניסה/הרשמה" בדף הבית
2. לחץ "כניסה/הרשמה עם Google"
3. התחבר עם חשבון Google שלך
4. משתמש חדש נוצר אוטומטית בהתחברות הראשונה

**📖 ראה מדריך מלא:** [SUPABASE_AUTH_MIGRATION.md](./SUPABASE_AUTH_MIGRATION.md)

---

## 📚 מסמכים מפורטים

קראו את המסמכים המלאים לפרטים מעמיקים:

1. **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** ⭐ **התחל כאן!**
   - הגדרת Supabase
   - הרצת SQL Schema
   - דוגמאות קוד
   - פתרון בעיות

1a. **[SUPABASE_AUTH_MIGRATION.md](./SUPABASE_AUTH_MIGRATION.md)** 🔐 **אימות הושלם!**
   - מעבר מ-Mock Auth ל-Supabase Auth
   - התחברות עם Google OAuth
   - ניהול משתמשים ופרופילים
   - דוגמאות ובדיקות

2. **[TECHNICAL_DOCUMENTATION_PART1.md](./TECHNICAL_DOCUMENTATION_PART1.md)**
   - סקירה כללית ומטרות
   - טכנולוגיות ותלויות
   - מבנה הפרויקט והארכיטקטורה
   - ניהול מצב (Context API)
   - מערכת משתמשים ואימות

3. **[TECHNICAL_DOCUMENTATION_PART2.md](./TECHNICAL_DOCUMENTATION_PART2.md)**
   - פירוט מלא של StoryCreator
   - פירוט מלא של LearningCenter
   - מערכת עיצוב ורספונסיביות
   - אנימציות ואפקטים
   - Landing Page
   - מערכת הדפסה
   - Helpers & Utilities

---

## 🎯 תיאור מהיר

**גאון** היא פלטפורמת למידה מבוססת AI המאפשרת:

### פיצ'רים עיקריים
1. **יוצר הסיפורים** (`StoryCreator.tsx`)
   - סיפורים אינטראקטיביים מאוירים
   - הילד הופך לגיבור הסיפור
   - שימור תווי פנים מתמונה
   - יצירה משותפת AI + ילד

2. **מרכז למידה** (`WorkbookCreator.tsx`)
   - **תוכניות מודרכות**: 5 שלבים עם הדרכה להורים
   - **חוברות עבודה**: תרגילים אינטראקטיביים עם בדיקה אוטומטית
   - בחירת נושא מ-12 תחומים + custom
   - הצעות נושאים חכמות

3. **ניהול פרופילים** (`ParentDashboard.tsx`)
   - מספר פרופילי ילדים למשתמש אחד
   - גיל, מין, תחומי עניין, מטרות למידה
   - תמונה אופציונלית

4. **לוח מנהל** (`AdminDashboard.tsx`)
   - ניהול משתמשים וקרדיטים
   - הוספה/מחיקה של משתמשים
   - קרדיטים אינסופיים למנהל ראשי

---

## 🏗️ ארכיטקטורה

```
App.tsx (Root)
├─ LandingPage (Guest)
│  ├─ Header
│  ├─ HeroSection
│  ├─ FeaturesSection
│  ├─ HowItWorksSection
│  ├─ ShowcaseSection
│  ├─ TestimonialsSection
│  ├─ PricingSection
│  ├─ AboutSection
│  └─ Footer
│
└─ AppProvider (Context Wrapper)
   └─ LoggedInView
      ├─ MobileHeader (Responsive)
      ├─ LoggedInHeader (Desktop)
      └─ Main Content:
         ├─ ChildDashboard (מסך בחירה)
         ├─ ParentDashboard (ניהול פרופילים)
         ├─ StoryCreator (יצירת סיפורים)
         ├─ LearningCenter (מרכז למידה)
         └─ AdminDashboard (ניהול מערכת)
```

---

## 🧩 קומפוננטות מרכזיות

### State Management
```typescript
// AppContext.tsx
interface User {
  id: number;
  username: string;
  role: 'parent' | 'admin';
  credits: number;
  profiles: Profile[];
}

interface Profile {
  id: number;
  name: string;
  age: number;
  gender: 'בן' | 'בת';
  interests: string;
  learningGoals?: string;
  photo?: string; // base64
}

// Usage
const { user, activeProfile, setActiveProfile, 
        updateUserProfile, addUserProfile } = useAppContext();
```

### AI Integration
```typescript
import { GoogleGenAI, Modality, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Text generation with structured output
const result = await ai.models.generateContent({
  model: 'gemini-2.5-flash', // or gemini-2.5-pro
  contents: prompt,
  config: {
    responseMimeType: "application/json",
    responseSchema: schema
  }
});

// Image generation
const imageResult = await ai.models.generateContent({
  model: 'gemini-2.5-flash-image',
  contents: { parts: [{ text: imagePrompt }] },
  config: { responseModalities: [Modality.IMAGE] }
});
```

---

## 🎨 מערכת העיצוב

### צבעים (CSS Variables)
```css
--primary-color: #7b68d4;      /* סגול */
--primary-light: #a084e8;      /* סגול בהיר */
--secondary-color: #64ccc5;    /* טורקיז */
--background-dark: #121222;    /* רקע */
```

### פונטים
- **Heebo**: טקסט רגיל עברי
- **Frank Ruhl Libre**: כותרות בעברית (serif)
- **Amatic SC**: כתב יד ("של אמא")

### Responsive Breakpoints
- **1024px**: טאבלטים
- **768px**: מובייל (תפריט המבורגר)
- **480px**: מסכים קטנים

---

## 🔑 פיצ'רים מיוחדים

### 1. תפריט מובייל אנימטיבי
- אייקון המבורגר מונפש
- פתיחה מלא מסך עם blur
- אותיות מרחפות ברקע
- כל פריט מגיע בנפרד (stagger animation)
- כפתור כניסה/הרשמה משולב

### 2. אנימציות מתקדמות
```css
/* Logo animations */
- logo-float: תנועה מתנדנדת
- logo-glow: זוהר פועם
- logo-spin: סיבוב בהובר

/* Feature cards */
- book-flip: היפוך ספר
- pen-write: כתיבה בעט
- brain-pulse: פעימת מוח
```

### 3. Scroll Animations
- **IntersectionObserver** לזיהוי גלילה
- אנימציית fade-in + slide-up
- Threshold: 10% (מתחיל כשרואים 10% מהאלמנט)

### 4. מערכת הדפסה
```css
@media print {
  .no-print { display: none !important; }
  .print-only { display: block !important; }
  .page-break-inside-avoid { page-break-inside: avoid; }
}
```

---

## 📊 זרימות עבודה

### Story Creation Flow
```
1. startStory() → buildPrompt()
2. AI generates: { text, imagePrompt }
3. Generate image from imagePrompt + profile photo
4. Display: { text, image }
5. User adds continuation
6. Repeat steps 2-4
7. Optional: Regenerate, TTS, Modifiers
8. Export to PDF
```

### Learning Plan Flow
```
1. Select: subject, topic, goal
2. Generate Step 1 (5 activities)
   - Learner activities
   - Educator guidance {objective, tips, pitfalls}
3. User provides feedback
4. Generate Step 2 (based on feedback)
5. Repeat until 5 steps
6. Generate worksheet summary
7. Print/Export
```

### Workbook Flow
```
1. Select: subject, topic, description, numExercises
2. AI generates workbook:
   - title, introduction
   - exercises[] {question_text, question_type, options, correct_answer}
   - conclusion
3. User fills answers
4. AI grades and provides feedback
5. Print/Export
```

---

## 🔧 Utilities

### helpers.ts
```typescript
// Text-to-Speech (Hebrew)
speakText(text: string, rate = 1.0)

// File to Base64
toBase64(file: File): Promise<string>
```

### Loader Component
- רנדום אות עברית/מספר
- אנימציית pulse-glow
- הודעה דינמית

---

## 📱 רספונסיביות

### Desktop (> 1024px)
- Header sticky עם logo + nav links + כפתור כניסה
- Grid layouts (3 columns)
- Hero: 10rem title, 160px logo

### Tablet (768px - 1024px)
- Grid → 2 columns
- Hero: 7rem title, 140px logo

### Mobile (< 768px)
- תפריט המבורגר
- Grid → 1 column
- Hero: 4.5rem title, 110px logo
- Full-screen menu overlay

### Small Mobile (< 480px)
- Hero: 3.5rem title, 80px logo
- כפתורים קטנים יותר

---

## 🚧 שיפורים עתידיים

### Backend (Supabase Integration)
- [x] PostgreSQL database (Supabase) ✅
- [x] Authentication system (Supabase Auth) ✅
- [x] Google OAuth login ✅
- [x] User profiles in database ✅
- [x] Storage for images (Supabase Storage) ✅
- [x] Complete migration from mock data ✅
- [ ] Save stories/workbooks to database
- [ ] Upload photos to Storage
- [ ] Stripe for payments
- [ ] Real-time updates (optional)

### Features
- [ ] Voice input (Speech Recognition)
- [ ] Collaborative stories
- [ ] Progress tracking & analytics
- [ ] Gamification (points, badges)
- [ ] Social sharing
- [ ] PWA + Offline mode

### Performance
- [ ] React.lazy() code splitting
- [ ] WebP images
- [ ] Service Workers caching
- [ ] CDN integration

---

## 📞 צור קשר

**מפתח מקורי**: Ofir Bibi (ofirb)  
**טכנולוגיות**: React 18, TypeScript, Vite, Google Gemini AI  
**גרסה**: 1.0.0  
**שנה**: 2024

---

## 📖 למידע נוסף

קראו את המסמכים המפורטים:
- [חלק 1 - ארכיטקטורה ומערכות](./TECHNICAL_DOCUMENTATION_PART1.md)
- [חלק 2 - פיצ'רים ועיצוב](./TECHNICAL_DOCUMENTATION_PART2.md)

---

## 🗄️ Supabase Integration

### מה השתנה?
- ✅ **User.id**: שונה מ-`number` ל-`string` (UUID)
- ✅ **Profile.photo_url**: שדה חדש במקום `photo` (base64)
- ✅ **App.tsx**: עטוף ב-`SessionContextProvider`
- ✅ **supabaseClient.ts**: מוכן לשימוש עם types מלאים
- ✅ **SQL Schema**: 5 טבלאות + RLS + triggers + storage

### השלבים הבאים:
1. **הגדר Supabase** - עקוב אחר [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
2. **החלף Login** - השתמש ב-Supabase Auth במקום mock data
3. **שמור תוכן** - שמור סיפורים/חוברות ב-database
4. **העלה תמונות** - השתמש ב-Supabase Storage לפרופילים

---

**בהצלחה! 🚀✨**

