# 🚀 Supabase Integration Setup Guide

## מדריך התקנה והגדרת Supabase לפרויקט גאון

---

## 📋 תוכן עניינים
1. [סקירה כללית](#סקירה-כללית)
2. [התקנת חבילות](#התקנת-חבילות)
3. [יצירת פרויקט Supabase](#יצירת-פרויקט-supabase)
4. [הגדרת משתני סביבה](#הגדרת-משתני-סביבה)
5. [הרצת SQL Schema](#הרצת-sql-schema)
6. [בדיקת ההתקנה](#בדיקת-ההתקנה)
7. [שימוש בקוד](#שימוש-בקוד)

---

## סקירה כללית

Supabase מספק:
- ✅ **Authentication** - ניהול משתמשים, הרשמה, התחברות
- ✅ **Database** - PostgreSQL מנוהל עם Row Level Security
- ✅ **Storage** - אחסון קבצים (תמונות פרופיל)
- ✅ **Real-time** - עדכונים בזמן אמת (אופציונלי)

---

## 1. התקנת חבילות

החבילות כבר מותקנות! ✅

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-react
```

---

## 2. יצירת פרויקט Supabase

### שלב 1: הרשמה ל-Supabase
1. גש ל-https://app.supabase.com
2. התחבר עם GitHub או Email
3. לחץ על "New Project"

### שלב 2: הגדרת הפרויקט
- **Organization**: בחר או צור ארגון חדש
- **Name**: `gaon-platform` (או כל שם שתרצה)
- **Database Password**: שמור סיסמה חזקה (תצטרך אותה רק למקרי חירום)
- **Region**: בחר `Europe (Frankfurt)` או הקרוב אליך
- **Pricing Plan**: `Free` (מספיק להתחלה)

### שלב 3: המתן ליצירה
הפרויקט ייווצר תוך 1-2 דקות.

---

## 3. הגדרת משתני סביבה

### שלב 1: מצא את המפתחות
לאחר שהפרויקט נוצר:
1. עבור ל-**Settings** (⚙️) → **API**
2. תמצא שני ערכים חשובים:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### שלב 2: צור קובץ .env.local
צור קובץ בשם `.env.local` בשורש הפרויקט:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Google AI API Key (existing)
API_KEY=your-google-ai-api-key-here
```

⚠️ **חשוב**: הקובץ `.env.local` כבר ב-`.gitignore` ולא יועלה ל-Git!

### שלב 3: הגדר Google OAuth (חובה!)
1. עבור ל-**Authentication** → **Providers** בפרויקט Supabase
2. לחץ על **Google**
3. הפעל את ה-toggle
4. **Authorized redirect URLs**: הוסף את הכתובת שלך:
   - Development: `http://localhost:5173/**`
   - Production: `https://your-domain.com/**`
5. **קבל Client ID ו-Secret מ-Google:**
   - עבור ל-[Google Cloud Console](https://console.cloud.google.com/)
   - צור פרויקט חדש (אם אין לך)
   - הפעל **Google+ API**
   - עבור ל-**Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
   - בחר **Web application**
   - הוסף **Authorized redirect URIs**:
     - `https://your-project.supabase.co/auth/v1/callback`
   - העתק **Client ID** ו-**Client Secret**
6. חזור ל-Supabase והזן את ה-Client ID ו-Secret
7. שמור

### שלב 4: הפעל מחדש את שרת הפיתוח
```bash
npm run dev
```

---

## 5. הרצת SQL Schema

### שלב 1: פתח את SQL Editor
1. בפרויקט Supabase שלך, עבור ל-**SQL Editor** (📝)
2. לחץ על **New query**

### שלב 2: העתק את הסקריפט
1. פתח את הקובץ `supabase_schema.sql` בפרויקט
2. העתק את **כל התוכן**
3. הדבק ב-SQL Editor

### שלב 3: הרץ את הסקריפט
1. לחץ על **Run** (או `Ctrl+Enter`)
2. אם הכל עבד, תראה הודעה: ✅ `Success. No rows returned`

### מה נוצר?
הסקריפט יצר:
- ✅ **5 טבלאות**: users, profiles, stories, workbooks, learning_plans
- ✅ **Row Level Security (RLS)** policies
- ✅ **Triggers** לעדכון timestamps
- ✅ **Function** ליצירת user אוטומטית בהרשמה
- ✅ **Storage bucket** לתמונות פרופיל
- ✅ **Indexes** לביצועים

---

## 6. בדיקת ההתקנה

### בדיקה 1: טבלאות
עבור ל-**Table Editor** (📊) ובדוק שכל הטבלאות קיימות:
- users
- profiles
- stories
- workbooks
- learning_plans

### בדיקה 2: Storage
עבור ל-**Storage** (🗂️) ובדוק ש-bucket `profile-photos` קיים.

### בדיקה 3: Authentication
עבור ל-**Authentication** (👤) ובדוק שהמערכת פעילה.

---

## 7. שימוש בקוד

### A. יצירת משתמש חדש (Sign Up)
```typescript
import { supabase } from './supabaseClient';

const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });
    
    if (error) {
        console.error('Error signing up:', error.message);
        return null;
    }
    
    // User created successfully!
    // public.users table was automatically populated via trigger
    return data.user;
};
```

### B. התחברות (Sign In)
```typescript
const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    
    if (error) {
        console.error('Error signing in:', error.message);
        return null;
    }
    
    return data.user;
};
```

### C. קבלת משתמש מחובר
```typescript
import { useSession } from '@supabase/auth-helpers-react';

function MyComponent() {
    const session = useSession();
    const user = session?.user;
    
    if (!user) {
        return <div>Please log in</div>;
    }
    
    return <div>Welcome, {user.email}!</div>;
}
```

### D. יצירת פרופיל ילד
```typescript
const createProfile = async (profileData: {
    name: string;
    age: number;
    gender: 'בן' | 'בת';
    interests: string;
}) => {
    const { data, error } = await supabase
        .from('profiles')
        .insert({
            user_id: (await supabase.auth.getUser()).data.user?.id,
            ...profileData
        })
        .select()
        .single();
    
    if (error) {
        console.error('Error creating profile:', error.message);
        return null;
    }
    
    return data;
};
```

### E. שמירת סיפור
```typescript
const saveStory = async (profileId: number, storyData: {
    title: string;
    story_parts: any[];
}) => {
    const { data, error } = await supabase
        .from('stories')
        .insert({
            user_id: (await supabase.auth.getUser()).data.user?.id,
            profile_id: profileId,
            ...storyData
        })
        .select()
        .single();
    
    if (error) {
        console.error('Error saving story:', error.message);
        return null;
    }
    
    return data;
};
```

### F. העלאת תמונת פרופיל
```typescript
const uploadProfilePhoto = async (file: File, userId: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, file);
    
    if (error) {
        console.error('Error uploading photo:', error.message);
        return null;
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);
    
    return urlData.publicUrl;
};
```

---

## 8. שלבים הבאים

### ✅ אימות הושלם!
המערכת עברה מ-Mock Authentication ל-Supabase Auth מלא עם Google OAuth.

📖 **ראה מדריך מפורט:** [SUPABASE_AUTH_MIGRATION.md](./SUPABASE_AUTH_MIGRATION.md)

### הערות חשובות:
1. ✅ **AppContext.tsx** כבר מעודכן לתמוך ב-UUID במקום מספרים
2. ✅ **App.tsx** עטוף ב-`SessionContextProvider`
3. ✅ **supabaseClient.ts** מוכן לשימוש

### מה צריך לעשות עכשיו?
1. **החלף את מערכת ההתחברות הישנה**:
   - במקום `handleLogin(username, password)` → השתמש ב-Supabase Auth
   - עדכן את `LoginModal.tsx` לשלוח email במקום username

2. **החלף את ניהול הפרופילים**:
   - ב-`ParentDashboard.tsx` → שלוף פרופילים מ-Supabase
   - שמור פרופילים חדשים ב-database

3. **החלף את שמירת התוכן**:
   - ב-`StoryCreator.tsx` → שמור סיפורים ב-`stories` table
   - ב-`WorkbookCreator.tsx` → שמור ב-`workbooks` ו-`learning_plans`

4. **הוסף ניהול קרדיטים**:
   - בכל יצירת תוכן → הפחת קרדיטים
   - הוסף בדיקת קרדיטים לפני יצירה

---

## 🎯 טיפים ושיטות עבודה מומלצות

### 1. טיפול בשגיאות
```typescript
try {
    const { data, error } = await supabase.from('profiles').select();
    if (error) throw error;
    // Use data
} catch (error) {
    console.error('Database error:', error);
    // Show user-friendly error message
}
```

### 2. Real-time Updates (אופציונלי)
```typescript
const channel = supabase
    .channel('profiles-changes')
    .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'profiles' },
        (payload) => {
            console.log('New profile created:', payload.new);
        }
    )
    .subscribe();
```

### 3. Optimistic Updates
עדכן UI מיד ואז שלח לשרת:
```typescript
// Update UI immediately
setProfiles([...profiles, newProfile]);

// Save to database
const { error } = await supabase.from('profiles').insert(newProfile);
if (error) {
    // Rollback UI change
    setProfiles(profiles);
}
```

---

## 🐛 פתרון בעיות נפוצות

### שגיאה: "Invalid API key"
**פתרון**: בדוק ש-`.env.local` קיים ושהערכים נכונים. הפעל מחדש `npm run dev`.

### שגיאה: "Row Level Security policy violation"
**פתרון**: וודא שהרצת את כל ה-SQL schema כולל ה-RLS policies.

### שגיאה: "relation does not exist"
**פתרון**: הטבלה לא נוצרה. הרץ שוב את `supabase_schema.sql`.

### תמונות לא נטענות
**פתרון**: וודא ש-bucket `profile-photos` הוא `public` ושה-storage policies הותקנו.

---

## 📚 משאבים נוספים

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Guide](https://supabase.com/docs/guides/storage)

---

**בהצלחה! 🚀✨**

אם יש בעיות או שאלות, פתח issue בפרויקט או צור קשר עם הצוות.

