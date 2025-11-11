/**
 * Enhanced AI Service עם תמיכה בתמונות reference וסגנונות שונים
 * מותאם למהות המערכת - כלי עזר חינוכי להורים וילדים
 */

export type ArtStyle =
  | 'realistic' // פוטוריאליסטי
  | 'cartoon' // מצוייר
  | 'anime' // אנימה
  | 'watercolor' // צבעי מים
  | 'pixar' // סטייל Pixar/Disney
  | 'sketch' // סקיצה
  | 'comic' // קומיקס
  | 'fantasy'; // פנטזיה

export interface StoryGenerationOptions {
  topic: string;
  childName: string;
  childAge?: number;
  artStyle: ArtStyle;
  childImageReference?: string; // Base64 של תמונת הילד
  educationalFocus?: string; // נושא חינוכי מרכזי
  moralLesson?: string; // מסר חינוכי
  difficulty?: 'easy' | 'medium' | 'hard';
  language?: 'hebrew' | 'arabic' | 'english';
}

// תיאורי סגנונות אמנות ל-AI
const artStyleDescriptions: Record<ArtStyle, string> = {
  realistic: 'realistic, photorealistic, high detail, natural lighting, like a real photograph',
  cartoon: 'cartoon style, cute, colorful, simple shapes, child-friendly illustration',
  anime: 'anime style, manga, big expressive eyes, vibrant colors, Japanese animation aesthetic',
  watercolor: 'watercolor painting style, soft colors, artistic brushstrokes, dreamy atmosphere',
  pixar: 'Pixar/Disney 3D animation style, cute characters, vibrant colors, professional CGI',
  sketch: 'pencil sketch style, hand-drawn, artistic lines, black and white or light colors',
  comic: 'comic book style, bold outlines, speech bubbles aesthetic, dynamic poses',
  fantasy: 'fantasy art style, magical, ethereal, imaginative, colorful and mystical',
};

// תבניות prompts משופרות לסיפורים חינוכיים
export function createEducationalStoryPrompt(options: StoryGenerationOptions): string {
  const {
    topic,
    childName,
    childAge = 6,
    artStyle,
    educationalFocus,
    moralLesson,
    difficulty = 'medium',
    language = 'hebrew',
  } = options;

  const difficultyMap = {
    easy: 'פשוט מאוד, עם משפטים קצרים ומילים בסיסיות',
    medium: 'בינוני, עם משפטים מגוונים ואוצר מילים עשיר',
    hard: 'מאתגר, עם משפטים מורכבים ואוצר מילים רחב',
  };

  return `
אתה כותב סיפורים חינוכיים מקצועי המתמחה ביצירת תוכן איכותי לילדים.

🎯 פרטי הסיפור:
- שם הילד/ה: ${childName}
- גיל: ${childAge}
- נושא: ${topic}
- רמת קושי: ${difficultyMap[difficulty]}
${educationalFocus ? `- מיקוד חינוכי: ${educationalFocus}` : ''}
${moralLesson ? `- מסר חינוכי: ${moralLesson}` : ''}

📚 דרישות התוכן:
1. הסיפור חייב להיות מעניין, מרתק ומושך לילדים בגיל ${childAge}
2. כלול את ${childName} כדמות ראשית בסיפור
3. הסיפור חייב להיות חינוכי ולהעביר ערכים חיוביים
4. השתמש בשפה ${language === 'hebrew' ? 'עברית תקנית וברורה' : language === 'arabic' ? 'ערבית תקנית' : 'אנגלית פשוטה'}
5. אורך: בין 8-12 פסקאות (כל פסקה = דף בסיפור)
6. כל פסקה צריכה לכלול פעולה או אירוע מרתק

🎨 מבנה הפלט (JSON בלבד!):
{
  "title": "כותרת הסיפור",
  "pages": [
    {
      "pageNumber": 1,
      "text": "הטקסט של הדף",
      "imagePrompt": "תיאור מדויק לתמונה - ${artStyleDescriptions[artStyle]}"
    }
  ],
  "educationalValue": "מה הילד למד מהסיפור",
  "vocabulary": ["מילה1", "מילה2", "מילה3"]
}

⚠️ חשוב:
- כל imagePrompt חייב לכלול את הסגנון: ${artStyleDescriptions[artStyle]}
${options.childImageReference ? `- התמונות צריכות להראות ילד/ה שנראה כמו ${childName} (תאר מאפיינים כלליים של ילד)` : ''}
- הפלט חייב להיות JSON תקני בלבד, ללא טקסט נוסף
- כל דף חייב להיות עצמאי ומובן בפני עצמו
- ה-imagePrompt חייב להיות באנגלית למערכת ה-AI לתמונות

צור עכשיו את הסיפור!
`;
}

export function createWorkbookPrompt(
  topic: string,
  childName: string,
  childAge: number,
  numExercises: number,
  difficulty: 'easy' | 'medium' | 'hard'
): string {
  const difficultyMap = {
    easy: 'בסיסית - תרגילים פשוטים ומובנים',
    medium: 'בינונית - תרגילים מאתגרים במידה',
    hard: 'מתקדמת - תרגילים מורכבים ומעמיקים',
  };

  return `
אתה יוצר חוברות עבודה חינוכיות מקצועי למוצרי STEM וחינוך כללי.

🎯 פרטי החוברת:
- נושא: ${topic}
- שם הילד/ה: ${childName}
- גיל: ${childAge}
- מספר תרגילים: ${numExercises}
- רמת קושי: ${difficultyMap[difficulty]}

📚 דרישות התוכן:
1. תרגילים מגוונים: שאלות פתוחות, רב-ברירה, השלמה, חשיבה יצירתית
2. כל תרגיל חייב להיות רלוונטי לגיל ${childAge}
3. כלול הסברים קצרים לפני כל קבוצת תרגילים
4. תרגילים מדורגים מקל לקשה
5. כלול שאלות בונוס למתקדמים
6. התאם את התרגילים לשם ${childName} (שילוב שמו/ה בדוגמאות)

🎨 מבנה הפלט (JSON בלבד!):
{
  "title": "כותרת החוברת",
  "introduction": "הקדמה קצרה",
  "sections": [
    {
      "sectionTitle": "כותרת קטע",
      "explanation": "הסבר קצר",
      "exercises": [
        {
          "questionNumber": 1,
          "question": "שאלה",
          "type": "multiple_choice | open_ended | fill_blank",
          "options": ["אופציה1", "אופציה2"],
          "correctAnswer": "תשובה נכונה",
          "hint": "רמז (אופציונלי)"
        }
      ]
    }
  ],
  "bonusExercises": [],
  "learningObjectives": ["מטרת למידה 1", "מטרת למידה 2"]
}

⚠️ חשוב:
- הפלט חייב להיות JSON תקני בלבד
- כל תרגיל חייב להיות חינוכי ומעניין
- התאם את התוכן לגיל ${childAge}

צור עכשיו את החוברת!
`;
}

// פונקציה ליצירת prompt לתמונה עם reference
export function createImagePromptWithReference(
  basePrompt: string,
  artStyle: ArtStyle,
  hasChildReference: boolean
): string {
  let prompt = basePrompt;

  // הוסף את הסגנון
  prompt += `, ${artStyleDescriptions[artStyle]}`;

  // אם יש תמונת reference
  if (hasChildReference) {
    prompt += ', featuring a child character that matches the provided reference image';
  }

  // הוספת מאפיינים כלליים לאיכות
  prompt += ', high quality, professional, child-friendly, safe for kids, wholesome';

  return prompt;
}

// פונקציית עזר לבדיקת איכות הפלט
export function validateStoryOutput(output: any): boolean {
  return (
    output &&
    typeof output === 'object' &&
    output.title &&
    Array.isArray(output.pages) &&
    output.pages.length > 0 &&
    output.pages.every(
      (page: any) =>
        page.pageNumber &&
        page.text &&
        page.imagePrompt
    )
  );
}

export function validateWorkbookOutput(output: any): boolean {
  return (
    output &&
    typeof output === 'object' &&
    output.title &&
    Array.isArray(output.sections) &&
    output.sections.length > 0 &&
    output.sections.every(
      (section: any) =>
        section.sectionTitle &&
        Array.isArray(section.exercises) &&
        section.exercises.length > 0
    )
  );
}
