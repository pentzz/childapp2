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

// תיאורי סגנונות אמנות ל-AI - exported for use in components
export const artStyleDescriptions: Record<ArtStyle, string> = {
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
- **כותרת הסיפור: "${topic}"** ← הסיפור חייב להתייחס ישירות לכותרת הזו!
- שם הילד/ה: ${childName}
- גיל: ${childAge}
- רמת קושי: ${difficultyMap[difficulty]}
${educationalFocus ? `- מיקוד חינוכי: ${educationalFocus}` : ''}
${moralLesson ? `- מסר חינוכי: ${moralLesson}` : ''}

📚 דרישות התוכן:
1. **הסיפור חייב להתאים לכותרת "${topic}"** - צור סיפור שמתאים בדיוק לכותרת!
2. הסיפור חייב להיות מעניין, מרתק ומושך לילדים בגיל ${childAge}
3. כלול את ${childName} כדמות ראשית בסיפור
4. הסיפור חייב להיות חינוכי ולהעביר ערכים חיוביים
5. השתמש בשפה ${language === 'hebrew' ? 'עברית תקנית וברורה' : language === 'arabic' ? 'ערבית תקנית' : 'אנגלית פשוטה'}
6. אורך: 5-7 משפטים לכל חלק (הילד ימשיך את הסיפור בהמשך)
7. כל חלק צריך לכלול פעולה או אירוע מרתק שמקדם את העלילה

🎨 מבנה הפלט (JSON בלבד!):
{
  "text": "טקסט החלק הזה של הסיפור (5-7 משפטים)",
  "imagePrompt": "תיאור מדויק לתמונה באנגלית - ${artStyleDescriptions[artStyle]}"
}

⚠️ חשוב מאוד:
- כל imagePrompt חייב לכלול: ${artStyleDescriptions[artStyle]}
- **התמונות חייבות להיות ללא טקסט לחלוטין!** הוסף "NO TEXT" לכל imagePrompt
${options.childImageReference ? `- התמונות צריכות להראות ילד/ה שנראה כמו ${childName} - שמור על מאפייני פנים דומים` : ''}
- הפלט חייב להיות JSON תקני בלבד, ללא טקסט נוסף
- ה-imagePrompt חייב להיות באנגלית למערכת ה-AI לתמונות
- **הסיפור צריך להתאים לכותרת "${topic}"!**

צור עכשיו חלק מעניין מהסיפור!
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
    prompt += ', featuring a child character that matches the provided reference image, maintain facial features and appearance';
  }

  // הוספת מאפיינים כלליים לאיכות
  prompt += ', high quality, professional, child-friendly, safe for kids, wholesome';

  // ⚠️ חשוב מאוד - ללא טקסט!
  prompt += ', NO TEXT, NO WORDS, NO LETTERS, absolutely no text in the image';

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
