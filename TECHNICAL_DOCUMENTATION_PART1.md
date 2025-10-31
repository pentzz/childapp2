# תיעוד טכני מקיף - אפליקציית "גאון" | GAON Platform
## מסמך למפתחים - חלק 1: סקירה, ארכיטקטורה ופיצ'רים עיקריים

---

## 📋 תוכן עניינים - חלק 1

1. [סקירה כללית](#1-סקירה-כללית)
2. [טכנולוגיות ותלויות](#2-טכנולוגיות-ותלויות)
3. [מבנה הפרויקט](#3-מבנה-הפרויקט)
4. [ארכיטקטורה וזרימת נתונים](#4-ארכיטקטורה-וזרימת-נתונים)
5. [ניהול מצב - Context API](#5-ניהול-מצב---context-api)
6. [מערכת משתמשים ואימות](#6-מערכת-משתמשים-ואימות)

---

## 1. סקירה כללית

### 1.1 מהי "גאון"?
**גאון** היא פלטפורמת למידה ויצירה מותאמת אישית המשתמשת בבינה מלאכותית (Google Gemini) ליצירת תוכן לימודי ייחודי לילדים. המערכת מאפשרת להורים ומחנכים ליצור:
- **סיפורים אישיים מאוירים** - הילד הופך לגיבור הסיפור עם שמירה על תווי פניו
- **חוברות עבודה אינטראקטיביות** - תרגילים מותאמים לתחומי עניין הילד
- **תוכניות למידה מודרכות** - מסלול למידה שלב אחר שלב עם הדרכה להורים

### 1.2 מטרת המערכת
- **התאמה אישית מקסימלית**: כל תוכן מותאם לגיל, תחומי עניין ומטרות למידה של הילד
- **שיתוף פעולה הורה-ילד**: פעילויות משותפות שמעודדות מעורבות הורית
- **למידה מהנה**: שילוב דמיון וקסם בתהליך הלמידה
- **גמישות**: מערכת רספונסיבית הפועלת בכל מכשיר

### 1.3 משתמשי קצה
1. **הורים** - מנהלים פרופילים, יוצרים תוכן, עוקבים אחר התקדמות
2. **ילדים** - צורכים תוכן, משתתפים ביצירה, לומדים ונהנים
3. **מנהלים** - מנהלים משתמשים, קרדיטים והרשאות

---

## 2. טכנולוגיות ותלויות

### 2.1 Frontend Stack
```json
{
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    "@google/genai": "latest"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "vite": "^5.x",
    "@vitejs/plugin-react": "^4.x",
    "@types/react": "^18.x",
    "@types/react-dom": "^18.x"
  }
}
```

### 2.2 טכנולוגיות ליבה
| טכנולוגיה | תפקיד | גרסה |
|-----------|-------|------|
| **React** | ספריית UI | 18.x |
| **TypeScript** | Type Safety | 5.x |
| **Vite** | Build Tool & Dev Server | 5.x |
| **Google Gemini AI** | יצירת תוכן ותמונות | API v2.5 |
| **Context API** | State Management | Built-in React |
| **CSS Variables** | Theme System | Native CSS |

### 2.3 APIs חיצוניים
1. **Google GenAI (`@google/genai`)**:
   - `gemini-2.5-flash`: יצירת טקסט מהירה (JSON structured output)
   - `gemini-2.5-pro`: יצירת תוכן מורכב ותוכניות למידה
   - `gemini-2.5-flash-image`: יצירת תמונות מ-text prompts

2. **DiceBear API** (`api.dicebear.com`):
   - יצירת אווטרים בוטים ניטרליים לפרופילים ללא תמונה
   - Format: `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${name}`

3. **Web APIs**:
   - `speechSynthesis` - הקראת טקסט בעברית
   - `FileReader` - המרת תמונות ל-base64
   - `IntersectionObserver` - אנימציות scroll
   - `window.print()` - ייצוא PDF

### 2.4 CDN ושירותים חיצוניים
```html
<!-- Font Awesome Icons -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />

<!-- Google Fonts -->
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;700;900&family=Frank+Ruhl+Libre:wght@400;700&family=Amatic+SC:wght@400;700&display=swap" rel="stylesheet">

<!-- Unsplash Images (Landing Page) -->
<!-- נעשה שימוש בתמונות דוגמה בלבד -->
```

---

## 3. מבנה הפרויקט

### 3.1 מבנה קבצים
```
childapp/
├── public/
│   └── logo.png                 # לוגו האפליקציה
├── src/
│   ├── main.tsx                 # Entry point
│   ├── App.tsx                  # Root component
│   ├── App.css                  # Global styles
│   ├── AppContext.tsx           # Context API (state management)
│   ├── styles.ts                # Inline styles object
│   ├── helpers.ts               # Utility functions
│   ├── Loader.tsx               # Loading component
│   ├── AnimatedSection.tsx      # Scroll animations
│   │
│   ├── --- Landing Page Components ---
│   ├── LandingPage.tsx          # Landing page container
│   ├── Header.tsx               # Main header (guest)
│   ├── HeroSection.tsx          # Hero section
│   ├── FeaturesSection.tsx      # Features grid
│   ├── PricingSection.tsx       # Pricing cards
│   ├── AboutSection.tsx         # About us
│   ├── Footer.tsx               # Footer
│   ├── LoginModal.tsx           # Login dialog
│   │
│   ├── --- Logged-In Components ---
│   ├── LoggedInHeader.tsx       # Header for logged-in users
│   ├── ChildDashboard.tsx       # Child dashboard (main menu)
│   ├── ParentDashboard.tsx      # Parent dashboard (profiles management)
│   ├── AdminDashboard.tsx       # Admin dashboard (user management)
│   │
│   ├── --- Core Features ---
│   ├── StoryCreator.tsx         # Interactive story creation
│   ├── WorkbookCreator.tsx      # Learning center (renamed)
│   └── LearningPlan.tsx         # Old learning plan (legacy)
│
├── index.html                   # HTML entry + embedded CSS
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript config
├── vite.config.ts               # Vite config
└── metadata.json                # App metadata
```

### 3.2 ארגון קוד לפי אחריות

#### 🎨 **Layout & Structure**
- `App.tsx` - Root logic, routing between Landing/Logged-in
- `LandingPage.tsx` - Marketing site structure
- `LoggedInHeader.tsx` + `MobileHeader` - Navigation bars

#### 🧩 **State Management**
- `AppContext.tsx` - Global state (user, active profile, CRUD operations)

#### 🎯 **Feature Modules**
1. **Story Creation** (`StoryCreator.tsx`)
2. **Learning Center** (`WorkbookCreator.tsx`)
3. **Profile Management** (`ParentDashboard.tsx`)
4. **Admin Panel** (`AdminDashboard.tsx`)

#### 🎭 **UI Components**
- `Loader.tsx` - Loading indicator
- `AnimatedSection.tsx` - Scroll animations wrapper
- `LoginModal.tsx` - Authentication dialog

---

## 4. ארכיטקטורה וזרימת נתונים

### 4.1 דיאגרמת זרימה כללית
```
┌─────────────────────────────────────────────────────┐
│                    App.tsx (Root)                    │
│  ┌──────────────────────────────────────────────┐   │
│  │  State: loggedInUser, allUsers               │   │
│  │  Logic: handleLogin, handleLogout            │   │
│  └──────────────────────────────────────────────┘   │
└───────────────────┬─────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌───────────────┐       ┌──────────────────┐
│ LandingPage   │       │ AppProvider      │
│ (Guest View)  │       │ (Context Wrapper)│
└───────────────┘       └────────┬─────────┘
                                 │
                    ┌────────────┴────────────┐
                    │   LoggedInView          │
                    │   ├─ MobileHeader       │
                    │   ├─ LoggedInHeader     │
                    │   └─ Main Content:      │
                    │      ├─ ChildDashboard  │
                    │      ├─ ParentDashboard │
                    │      ├─ StoryCreator    │
                    │      ├─ LearningCenter  │
                    │      └─ AdminDashboard  │
                    └─────────────────────────┘
```

### 4.2 זרימת אימות (Authentication Flow)
```
1. משתמש לוחץ "כניסה/הרשמה"
   ↓
2. LoginModal נפתח
   ↓
3. משתמש מזין username + password
   ↓
4. handleLogin() ב-App.tsx מאמת:
   - ofirb: סיסמה 1679861 (מנהל ראשי)
   - משתמשים אחרים: סיסמה 123
   ↓
5. אם הצליח: setLoggedInUser(user)
   ↓
6. AppProvider מעטף את LoggedInView
   ↓
7. useEffect ב-LoggedInView קורא ל-setUser() ו-setActiveProfile()
   ↓
8. כל הקומפוננטות יכולות לגשת ל-user ו-activeProfile דרך useAppContext()
```

### 4.3 זרימת יצירת תוכן (Content Creation Flow)

#### A. יצירת סיפור (Story Creation)
```
┌─────────────────────────────────────────────────┐
│ StoryCreator Component                          │
│                                                 │
│ 1. useEffect: startStory() on mount            │
│    └─> buildPrompt()                           │
│    └─> generateStoryPart()                     │
│                                                 │
│ 2. AI Generation:                              │
│    ┌─────────────────────────────────┐         │
│    │ gemini-2.5-flash:               │         │
│    │   Input: Child profile + prompt │         │
│    │   Output: {text, imagePrompt}   │         │
│    └─────────────────────────────────┘         │
│                                                 │
│ 3. Image Generation:                           │
│    ┌─────────────────────────────────┐         │
│    │ gemini-2.5-flash-image:         │         │
│    │   Input: imagePrompt + photo    │         │
│    │   Output: Base64 image          │         │
│    └─────────────────────────────────┘         │
│                                                 │
│ 4. Display: {text, image} → storyParts[]       │
│                                                 │
│ 5. User Input:                                 │
│    └─> handleContinueStory()                   │
│        └─> Add user part to history            │
│        └─> Generate next AI part               │
│                                                 │
│ 6. Special Actions:                            │
│    ├─> handleModifierClick() - "קסום יותר"    │
│    ├─> handleRegeneratePart() - נסה שוב       │
│    └─> speakText() - הקרא בקול                │
└─────────────────────────────────────────────────┘
```

#### B. מרכז למידה (Learning Center)
```
┌───────────────────────────────────────────────────────┐
│ LearningCenter Component (WorkbookCreator.tsx)       │
│                                                       │
│ 1. User Input Form:                                  │
│    ├─> creationType: 'plan' | 'workbook'            │
│    ├─> subject: (12 predefined + custom)            │
│    ├─> topic: free text + suggestions               │
│    └─> goal/description                             │
│                                                       │
│ 2. Topic Suggestions (Optional):                     │
│    └─> fetchTopicSuggestions()                      │
│        └─> AI suggests 5 relevant topics            │
│                                                       │
│ 3A. If 'plan' (תוכנית מודרכת):                      │
│    └─> handleGeneratePlanStep()                     │
│        ├─> gemini-2.5-pro: Generate step_title +    │
│        │   5 cards with learner_activity +          │
│        │   educator_guidance {objective, tips,      │
│        │   potential_pitfalls}                      │
│        ├─> Display in GuidedPlanView                │
│        ├─> User provides feedback                   │
│        ├─> Generate next step (up to 5 steps)       │
│        └─> Option: Generate worksheet from plan     │
│            └─> handleGenerateWorksheetFromPlan()    │
│                └─> Creates printable worksheet      │
│                                                       │
│ 3B. If 'workbook' (חוברת עבודה):                    │
│    └─> handleGenerateWorkbook()                     │
│        ├─> gemini-2.5-pro: Generate workbook with   │
│        │   title, intro, exercises[], conclusion    │
│        ├─> Display in InteractiveWorkbook           │
│        ├─> User fills answers                       │
│        └─> handleCheckAnswers()                     │
│            └─> AI grades and provides feedback      │
└───────────────────────────────────────────────────────┘
```

---

## 5. ניהול מצב - Context API

### 5.1 AppContext.tsx - מבנה מלא
```typescript
// Types
export interface Profile {
    id: number;
    name: string;
    age: number;
    gender: 'בן' | 'בת';
    interests: string;
    learningGoals?: string;
    photo?: string; // base64 string
}

export interface User {
    id: number;
    username: string;
    role: 'parent' | 'admin';
    credits: number;
    profiles: Profile[];
}

interface AppContextType {
    user: User | null;
    setUser: (user: User | null) => void;
    activeProfile: Profile | null;
    setActiveProfile: (profile: Profile | null) => void;
    updateUserProfile: (updatedProfile: Profile) => void;
    addUserProfile: (newProfile: Profile) => void;
}

// Context Provider
export const AppProvider = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [activeProfile, setActiveProfile] = useState<Profile | null>(null);

    const updateUserProfile = (updatedProfile: Profile) => {
        // Updates profile in user.profiles array
        // Also updates activeProfile if it's the same profile
    };

    const addUserProfile = (newProfile: Profile) => {
        // Adds profile to user.profiles array
    };

    return (
        <AppContext.Provider value={{
            user, setUser,
            activeProfile, setActiveProfile,
            updateUserProfile, addUserProfile
        }}>
            {children}
        </AppContext.Provider>
    );
};

// Hook
export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('Must use within AppProvider');
    return context;
};
```

### 5.2 שימוש ב-Context בקומפוננטות
```typescript
// Example: StoryCreator.tsx
const StoryCreator = () => {
    const { activeProfile } = useAppContext();
    
    if (!activeProfile) {
        return <p>יש לבחור פרופיל</p>;
    }
    
    // Use activeProfile.name, .age, .interests, .photo
    // in AI prompts and UI
};

// Example: ParentDashboard.tsx
const ParentDashboard = () => {
    const { user, activeProfile, setActiveProfile, 
            addUserProfile, updateUserProfile } = useAppContext();
    
    // Manage profiles
    const handleSaveProfile = (profileData) => {
        if (profileData.id) {
            updateUserProfile(profileData);
        } else {
            addUserProfile(profileData);
        }
    };
};
```

---

## 6. מערכת משתמשים ואימות

### 6.1 Mock Users Database (App.tsx)
```typescript
const MOCK_USERS: { [key: string]: User } = {
    parent: {
        id: 1,
        username: 'הורה',
        role: 'parent',
        credits: 100,
        profiles: [
            {
                id: 101,
                name: 'אורי',
                age: 6,
                gender: 'בן',
                interests: 'דינוזאורים, חלל',
                learningGoals: 'ללמוד לספור עד 20'
            },
            {
                id: 102,
                name: 'מאיה',
                age: 8,
                gender: 'בת',
                interests: 'חיות, ציור, פיות',
                learningGoals: 'שיפור קריאה שוטפת'
            }
        ]
    },
    admin: {
        id: 2,
        username: 'מנהל',
        role: 'admin',
        credits: 9999,
        profiles: []
    },
    ofirb: {
        id: 3,
        username: 'ofirb',
        role: 'admin',
        credits: 999999,
        profiles: []
    }
};
```

### 6.2 Login Logic
```typescript
const handleLogin = (username: string, password: string): boolean => {
    const userKey = username.toLowerCase();

    // Special admin user
    if (userKey === 'ofirb' && password === '1679861') {
        const userToLogin = allUsers.find(u => u.username.toLowerCase() === 'ofirb');
        setLoggedInUser(userToLogin || null);
        return !!userToLogin;
    }

    // All other users (including dynamically created)
    const userToLogin = allUsers.find(u => u.username.toLowerCase() === userKey);
    if (userToLogin && password === '123') {
        setLoggedInUser(userToLogin);
        return true;
    }
    
    return false;
};
```

### 6.3 User Roles & Permissions

| Role | Access | Permissions |
|------|--------|------------|
| **parent** | ChildDashboard, ParentDashboard, StoryCreator, LearningCenter | יצירת פרופילים, יצירת תוכן, צריכת קרדיטים |
| **admin** | כל הנ"ל + AdminDashboard | ניהול משתמשים, שינוי קרדיטים, מחיקת משתמשים |

### 6.4 Admin Dashboard Features
```typescript
// AdminDashboard.tsx
const AdminDashboard = ({ loggedInUser, users, updateUser, onAddUser, onDeleteUser }) => {
    
    // 1. Add New User
    const handleAddUserSubmit = (e) => {
        onAddUser(newUsername, newRole, newCredits);
        // Default password: '123'
    };
    
    // 2. Update User Credits
    const updateCredits = (userId, newCredits) => {
        updateUser(userId, 'credits', newCredits);
    };
    
    // 3. Delete User
    const handleDelete = (userId) => {
        if (userId === loggedInUser.id) {
            alert("לא ניתן למחוק את המשתמש המחובר");
            return;
        }
        onDeleteUser(userId);
    };
    
    // 4. Special: Infinite Credits (for 'ofirb' only)
    if (loggedInUser.username === 'ofirb') {
        <button onClick={() => updateUser(loggedInUser.id, 'credits', 9999999)}>
            🚀 הפעל קרדיטים אינסופיים
        </button>
    }
};
```

---

**המשך בחלק 2 >>**
- פירוט מלא של כל פיצ'ר (Story Creator, Learning Center)
- מערכת העיצוב והרספונסיביות
- אנימציות ואפקטים
- מערכת ההדפסה
- API Integrations
- שיפורים עתידיים

