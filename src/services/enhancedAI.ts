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
אתה כותב סיפורים חינוכיים מקצועי המתמחה ביצירת תוכן איכותי וMרתק לילדים.

🎯 פרטי הסיפור - קריטי ביותר:
- **📖 כותרת הסיפור: "${topic}"**
  ⚠️ זוהי הכותרת המרכזית! הסיפור חייב להתבסס ישירות על הכותרת הזו!
  אם הכותרת היא "הרפתקאות בחלל" - הסיפור חייב להיות על חלל וחלליות
  אם הכותרת היא "הנסיכה האמיצה" - הסיפור חייב להיות על נסיכה אמיצה
  אם הכותרת היא "המסע לים" - הסיפור חייב להיות על מסע לים
  **הכותרת היא הבסיס לכל הסיפור - אסור לסטות ממנה!**

- 👤 שם הילד/ה הראשי: ${childName} (זוהי הדמות הראשית!)
- 🎂 גיל: ${childAge} שנים
- 📊 רמת קושי: ${difficultyMap[difficulty]}
${educationalFocus ? `- 🎓 מיקוד חינוכי: ${educationalFocus}` : ''}
${moralLesson ? `- 💡 מסר חינוכי חשוב: ${moralLesson}` : ''}

📚 דרישות תוכן - MUST FOLLOW:
1. 🎯 **קריטי**: הסיפור חייב להתאים 100% לכותרת "${topic}"
   - נתח את הכותרת והבן מה היא אומרת
   - צור סיפור שמתאר בדיוק את מה שהכותרת מבטיחה
   - כל חלק בסיפור צריך להמשיך את הנושא מהכותרת

2. 🌟 הסיפור חייב להיות מרתק, מעניין ומושך לילדים בגיל ${childAge}
   - שלב הרפתקאות, פעולה, דמיון
   - צור סצנות חיות ומרגשות
   - הוסף תיאורים עשירים של המקום, הדמויות והפעולות

3. 👦 ${childName} הוא/היא הדמות הראשית של הסיפור
   - תאר את ${childName} כגיבור/ה שמוביל את העלילה
   - הראה את ${childName} פועל/ת, חושב/ת, מתמודד/ת עם אתגרים

4. 📖 אורך: 5-7 משפטים עשירים ומפורטים לכל חלק
   - כל משפט צריך לקדם את העלילה
   - תאר בפירוט מה קורה, איפה, ואיך
   - צור אווירה מרתקת

5. ✨ הוסף ערכים חינוכיים: אומץ, ידידות, שיתוף פעולה, סקרנות
6. 🗣️ השתמש בשפה ${language === 'hebrew' ? 'עברית תקנית, עשירה וברורה' : language === 'arabic' ? 'ערבית תקנית' : 'אנגלית פשוטה'}
7. 🎬 כל חלק חייב לסיים עם תפנית קלה שגורמת לרצות לדעת מה קורה אחר כך

🎨 מבנה הפלט (JSON בלבד!):
{
  "text": "טקסט החלק הזה של הסיפור - 5-7 משפטים עשירים ומרתקים שמתאימים לכותרת ${topic}",
  "imagePrompt": "detailed English description for illustration - ${artStyleDescriptions[artStyle]}, depicting the scene from the story"
}

⚠️ חשוב קריטי:
- **הכותרת "${topic}" היא הבסיס - הסיפור חייב להתאים אליה!**
- כל imagePrompt חייב לתאר את הסצנה מהסיפור + ${artStyleDescriptions[artStyle]}
${options.childImageReference ? `- 📸 יש לנו תמונת רפרנס של ${childName}! וודא שהתיאור בתמונה כולל ילד/ה שדומה לתמונה המקורית` : ''}
- הפלט חייב להיות JSON תקני בלבד
- ה-imagePrompt חייב להיות באנגלית למערכת ה-AI לתמונות
- **התמונות חייבות להיות ללא טקסט!** הוסף "NO TEXT AT ALL" בסוף כל imagePrompt

דוגמה מצוינת:
אם הכותרת היא "הרפתקאות דני בחלל" - הסיפור יתחיל עם דני עולה על חללית, ממריא לכוכבים, פוגש חייזרים וכו'.
אם הכותרת היא "הארנב הקסום של מיכל" - הסיפור על מיכל שמוצאת ארנב קסום עם כוחות מיוחדים.

עכשיו צור חלק מרתק מהסיפור "${topic}" עם ${childName} כגיבור/ה!
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
    prompt += ', featuring a child character that matches the provided reference image, maintain consistent facial features and appearance throughout the story';
  }

  // הוספת מאפיינים כלליים לאיכות
  prompt += ', high quality, professional illustration, child-friendly, safe for kids, wholesome, vibrant colors';

  // ⚠️ קריטי - ללא טקסט בכלל בתמונה!
  prompt += ', ABSOLUTELY NO TEXT IN IMAGE, NO WORDS, NO LETTERS, NO WRITING, NO SIGNS WITH TEXT, pure visual illustration only, text-free image';

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
