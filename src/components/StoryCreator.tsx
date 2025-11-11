import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { useAppContext } from './AppContext';
import { supabase } from '../supabaseClient';
import { styles } from '../../styles';
import Loader from './Loader';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { FaBook, FaSave, FaDownload, FaPalette, FaImage, FaCheckCircle } from 'react-icons/fa';
import {
    ArtStyle,
    StoryGenerationOptions,
    createEducationalStoryPrompt,
    createImagePromptWithReference,
    validateStoryOutput,
    artStyleDescriptions
} from '../services/enhancedAI';
import {
    saveStoryLocally,
    getProfileImage,
    ProfileImage
} from '../services/localStorageDB';

interface StoryCreatorProps {
    contentId?: number | null;
    onContentLoaded?: () => void;
}

const StoryCreator = ({ contentId, onContentLoaded }: StoryCreatorProps = {}) => {
    const { activeProfile, user, updateUserCredits, creditCosts, refreshCreditCosts, getUserAPIKey } = useAppContext();
    const [storyParts, setStoryParts] = useState<any[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [thinkingIndex, setThinkingIndex] = useState<number | null>(null);
    const [error, setError] = useState('');
    const [showIntro, setShowIntro] = useState(true);
    const storyEndRef = useRef<HTMLDivElement>(null);
    const [storyId, setStoryId] = useState<number | null>(contentId || null);
    const [isLoadingStory, setIsLoadingStory] = useState(false);
    const [storyTitle, setStoryTitle] = useState<string>('');
    const [initialStoryTitle, setInitialStoryTitle] = useState<string>('');
    const [savedToLocal, setSavedToLocal] = useState(false);

    // Enhanced Story Options
    const [storyStyle, setStoryStyle] = useState<string>('adventure');
    const [storyLength, setStoryLength] = useState<string>('medium');
    const [storyComplexity, setStoryComplexity] = useState<string>('auto');
    const [artStyle, setArtStyle] = useState<ArtStyle>('cartoon');
    const [storyTheme, setStoryTheme] = useState<string>('general');
    const [educationalFocus, setEducationalFocus] = useState<string>('');
    const [moralLesson, setMoralLesson] = useState<string>('');
    const [includeEducationalContent, setIncludeEducationalContent] = useState<boolean>(true);
    const [includeDialogue, setIncludeDialogue] = useState<boolean>(true);
    const [characterCount, setCharacterCount] = useState<string>('few');
    const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
    const [profileImage, setProfileImage] = useState<ProfileImage | null>(null);

    // Get API key
    const userApiKey = getUserAPIKey();
    const apiKey = userApiKey || process.env.GEMINI_API_KEY || '';

    // Create AI instance
    const ai = useMemo(() => {
        if (!apiKey) {
            console.error('🔴 StoryCreator: No API key available');
            return new GoogleGenAI({ apiKey: '' });
        }

        if (userApiKey) {
            console.log('✅ StoryCreator: Using user API key');
        } else {
            console.log('✅ StoryCreator: Using global API key');
        }

        return new GoogleGenAI({ apiKey });
    }, [apiKey, userApiKey]);

    const STORY_PART_CREDITS = creditCosts.story_part;
    const storyBookRef = useRef<HTMLDivElement>(null);

    // Art style options with visual previews
    const artStyleOptions: Array<{ value: ArtStyle; label: string; emoji: string; description: string }> = [
        { value: 'cartoon', label: 'מצוייר', emoji: '🎨', description: 'קריקטורה חמודה וצבעונית' },
        { value: 'realistic', label: 'ריאליסטי', emoji: '📸', description: 'פוטוריאליסטי עם פרטים' },
        { value: 'anime', label: 'אנימה', emoji: '🎭', description: 'סגנון אנימה יפני' },
        { value: 'watercolor', label: 'צבעי מים', emoji: '🖌️', description: 'ציור רך וחלומי' },
        { value: 'pixar', label: 'פיקסאר', emoji: '🎬', description: 'אנימציה תלת-ממדית' },
        { value: 'sketch', label: 'סקיצה', emoji: '✏️', description: 'ציור בעיפרון אמנותי' },
        { value: 'comic', label: 'קומיקס', emoji: '💥', description: 'סגנון ספרי קומיקס' },
        { value: 'fantasy', label: 'פנטזיה', emoji: '✨', description: 'אמנות קסומה ופנטסטית' },
    ];

    // Load profile image on mount
    useEffect(() => {
        if (activeProfile) {
            loadProfileImage();
            setStoryTitle(`הרפתקאות ${activeProfile.name}`);
        }
    }, [activeProfile]);

    const loadProfileImage = async () => {
        if (!activeProfile) return;
        try {
            const img = await getProfileImage(activeProfile.id.toString());
            if (img) {
                setProfileImage(img);
                console.log('✅ Profile image loaded for story generation');
            }
        } catch (error) {
            console.error('Error loading profile image:', error);
        }
    };

    // Auto-scroll to end of story
    useEffect(() => {
        if (storyEndRef.current) {
            storyEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [storyParts]);

    // Load existing story if contentId provided
    useEffect(() => {
        if (contentId) {
            loadStoryFromDatabase(contentId);
        }
    }, [contentId]);

    const loadStoryFromDatabase = async (id: number) => {
        if (!user) return;
        setIsLoadingStory(true);
        try {
            const { data, error } = await supabase
                .from('content')
                .select('*')
                .eq('id', id)
                .eq('user_id', user.id)
                .single();

            if (error) throw error;
            if (data) {
                setStoryId(data.id);
                setStoryTitle(data.title || `הרפתקאות ${activeProfile?.name}`);
                setStoryParts(data.content_data?.storyParts || []);
                setShowIntro(false);
                if (onContentLoaded) onContentLoaded();
            }
        } catch (err) {
            console.error('Error loading story:', err);
            setError('שגיאה בטעינת הסיפור');
        } finally {
            setIsLoadingStory(false);
        }
    };

    const saveStoryToDatabase = async (parts: any[] = storyParts) => {
        if (!user || !activeProfile) return;

        try {
            const contentData = {
                user_id: user.id,
                profile_id: activeProfile.id,
                type: 'story',
                title: storyTitle || `הרפתקאות ${activeProfile.name}`,
                content_data: {
                    storyParts: parts,
                    storyStyle,
                    storyTheme,
                    artStyle,
                    storyComplexity,
                    createdAt: new Date().toISOString()
                }
            };

            if (storyId) {
                const { error } = await supabase
                    .from('content')
                    .update(contentData)
                    .eq('id', storyId);
                if (error) throw error;
            } else {
                const { data, error } = await supabase
                    .from('content')
                    .insert([contentData])
                    .select()
                    .single();
                if (error) throw error;
                if (data) setStoryId(data.id);
            }
        } catch (err) {
            console.error('Error saving story:', err);
        }
    };

    const saveToLocalStorage = async () => {
        if (!activeProfile || storyParts.length === 0) return;

        try {
            const coverImage = storyParts.find(p => p.image)?.image || null;

            // שמירה מקומית
            await saveStoryLocally({
                title: storyTitle || `הרפתקאות ${activeProfile.name}`,
                content: {
                    storyParts,
                    storyStyle,
                    artStyle,
                    storyTheme
                },
                coverImage,
                childProfileId: activeProfile.id.toString(),
                childName: activeProfile.name,
                tags: [storyStyle, storyTheme, artStyle]
            });

            // שמירה גם בשרת (Supabase) - כך המשתמש יכול לגשת מכל מכשיר
            await saveStoryToDatabase(storyParts);

            setSavedToLocal(true);
            setTimeout(() => setSavedToLocal(false), 3000);
            console.log('✅ Story saved to local storage AND server');
        } catch (error) {
            console.error('Error saving story:', error);
            setError('שגיאה בשמירת הסיפור');
        }
    };

    const generateStoryPart = async (prompt: string, referenceImage: string | null = null) => {
        if (!activeProfile || !user) return;

        await refreshCreditCosts();

        if (user.credits < STORY_PART_CREDITS) {
            setError(`אין מספיק קרדיטים. נדרשים ${STORY_PART_CREDITS} קרדיטים, יש לך ${user.credits}.`);
            return;
        }

        setIsAiThinking(true);
        setThinkingIndex(storyParts.length);
        setError('');

        try {
            // Validate API key before making request
            if (!apiKey) {
                throw new Error('API key is missing. Please check your environment configuration.');
            }

            console.log('🚀 Generating story part with enhanced prompts...');

            // Use enhanced AI prompts
            const storyOptions: StoryGenerationOptions = {
                topic: storyTitle,
                childName: activeProfile.name,
                childAge: activeProfile.age || 6,
                artStyle,
                childImageReference: profileImage?.imageData,
                educationalFocus: educationalFocus || undefined,
                moralLesson: moralLesson || undefined,
                difficulty: storyComplexity === 'auto'
                    ? (activeProfile.age && activeProfile.age <= 6 ? 'easy' : activeProfile.age && activeProfile.age <= 10 ? 'medium' : 'hard')
                    : storyComplexity as 'easy' | 'medium' | 'hard',
                language: 'hebrew'
            };

            const enhancedPrompt = createEducationalStoryPrompt(storyOptions);

            // Generate text with structured output
            const schema = {
                type: Type.OBJECT,
                properties: {
                    text: { type: Type.STRING },
                    imagePrompt: { type: Type.STRING }
                },
                required: ["text", "imagePrompt"]
            };

            const textResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: enhancedPrompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: schema
                }
            });

            if (!textResponse?.text) {
                throw new Error("API did not return text response");
            }

            const partData = JSON.parse(textResponse.text.trim());
            console.log('✅ Text generated:', partData.text.substring(0, 100) + '...');

            // Create enhanced image prompt with art style and reference
            const fullImagePrompt = createImagePromptWithReference(
                partData.imagePrompt,
                artStyle,
                !!profileImage
            );

            console.log('🎨 Generating image with art style:', artStyle);

            // Prepare image generation with reference image if available
            const textPart = { text: fullImagePrompt };
            const imageRequestParts = profileImage?.imageData
                ? [
                    { inlineData: { mimeType: profileImage.imageType, data: profileImage.imageData.split(',')[1] } },
                    textPart
                  ]
                : [textPart];

            const imageRequestContents = { parts: imageRequestParts };

            const imageResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: imageRequestContents,
                config: { responseModalities: [Modality.IMAGE] }
            });

            const imagePart = imageResponse.candidates?.[0]?.content.parts[0];
            const imageUrl = imagePart?.inlineData ? `data:image/png;base64,${imagePart.inlineData.data}` : null;

            if (imageUrl) {
                console.log('✅ Image generated successfully with', artStyle, 'style');
            } else {
                console.warn('⚠️ Image generation returned no data');
            }

            const newPart = {
                author: 'ai',
                text: partData.text,
                image: imageUrl,
                timestamp: new Date().toISOString()
            };

            const updatedStoryParts = [...storyParts, newPart];
            setStoryParts(updatedStoryParts);

            // Deduct credits
            const success = await updateUserCredits(-STORY_PART_CREDITS);
            if (success) {
                console.log(`✅ Credits deducted: ${STORY_PART_CREDITS}`);

                // שמירה אוטומטית ב-Supabase
                await saveStoryToDatabase(updatedStoryParts);

                // שמירה אוטומטית גם ב-localStorage - כך נשמר גם מקומי וגם בשרת
                const coverImage = updatedStoryParts.find(p => p.image)?.image || null;
                await saveStoryLocally({
                    title: storyTitle || `הרפתקאות ${activeProfile.name}`,
                    content: {
                        storyParts: updatedStoryParts,
                        storyStyle,
                        artStyle,
                        storyTheme
                    },
                    coverImage,
                    childProfileId: activeProfile.id.toString(),
                    childName: activeProfile.name,
                    tags: [storyStyle, storyTheme, artStyle]
                });

                console.log('✅ Story saved to both server AND local storage');
            } else {
                console.error('❌ Failed to deduct credits');
                setError('שגיאה בעדכון קרדיטים');
            }

        } catch (err: any) {
            console.error('❌ Story generation error:', err);
            setError(err.message || 'שגיאה ביצירת הסיפור. אנא נסה שוב.');
        } finally {
            setIsAiThinking(false);
            setThinkingIndex(null);
        }
    };

    const buildPrompt = (history: any[]) => {
        const storyHistory = history.map(p => `${p.author === 'ai' ? 'המספר' : activeProfile?.name}: ${p.text}`).join('\n');

        // Determine complexity
        const actualComplexity = storyComplexity === 'auto'
            ? (activeProfile && activeProfile.age <= 6 ? 'simple' : activeProfile && activeProfile.age <= 10 ? 'medium' : 'advanced')
            : storyComplexity;

        // Style descriptions
        const styleDescriptions: Record<string, string> = {
            adventure: 'הרפתקאות מרגשת עם פעולה וגילויים',
            fantasy: 'פנטזיה קסומה עם יצורים מיתולוגיים וקסמים',
            educational: 'חינוכי ומלמד עם עובדות מעניינות',
            mystery: 'תעלומה מסתורית עם חידות ופתרון בעיות',
            comedy: 'הומוריסטי ומצחיק עם בדיחות ושמחה',
            scifi: 'מדע בדיוני עם טכנולוגיה וחלל',
            nature: 'טבע וסביבה עם בעלי חיים וצמחים',
            history: 'היסטורי עם אירועים ודמויות מהעבר'
        };

        const lengthDescriptions: Record<string, string> = {
            short: '3-4 משפטים תמציתיים',
            medium: '5-6 משפטים מפורטים',
            long: '7-9 משפטים עשירים ומורחבים'
        };

        const complexityDescriptions: Record<string, string> = {
            simple: 'שפה פשוטה וברורה, משפטים קצרים',
            medium: 'שפה עשירה עם תיאורים מגוונים',
            advanced: 'שפה ספרותית מתוחכמת עם מטפורות'
        };

        const themeDescriptions: Record<string, string> = {
            general: 'כללי',
            space: 'חלל וכוכבים',
            underwater: 'עולם תת-ימי',
            jungle: 'ג\'ונגל הרפתקאות',
            city: 'עיר מודרנית',
            medieval: 'ימי ביניים וטירות',
            magic: 'בית ספר לקסמים',
            animals: 'בעלי חיים מדברים',
            robots: 'רובוטים וטכנולוגיה',
            sports: 'ספורט ותחרויות'
        };

        const characterCountDescriptions: Record<string, string> = {
            solo: 'הגיבור/ה לבד או עם מדריך אחד',
            few: 'הגיבור/ה עם 2-3 חברים',
            many: 'קבוצה גדולה של דמויות'
        };

        if (history.length === 0) {
            // Starting the story
            const characterDescription = `${activeProfile?.name} הוא/היא ${activeProfile?.gender} בגיל ${activeProfile?.age}`;
            const interestsDescription = activeProfile?.interests ? `תחומי העניין: ${activeProfile.interests}` : '';

            return `אתה סופר מקצועי של ספרי ילדים המתמחה ביצירת סיפורים מרתקים.

📖 **כותרת הסיפור: "${storyTitle || `הרפתקאות ${activeProfile?.name}`}"**
⚠️ קריטי: הסיפור חייב להתבסס על הכותרת הזו! נתח את הכותרת והבן מה היא אומרת, וצור סיפור שמתאים לה בדיוק!

דמות ראשית: ${characterDescription}
${interestsDescription}

הגדרות הסיפור:
- ז'אנר: ${styleDescriptions[storyStyle]}
- נושא: ${themeDescriptions[storyTheme]}
- אורך כל חלק: ${lengthDescriptions[storyLength]}
- מספר דמויות: ${characterCountDescriptions[characterCount]}
${includeEducationalContent ? '- כולל תוכן חינוכי ומסרים חיוביים' : ''}
${includeDialogue ? '- כולל דיאלוגים טבעיים' : ''}

🎯 משימה:
צור חלק ראשון מרתק ומעניין שמתאים בדיוק לכותרת "${storyTitle}".
- התחל עם סצנה מרגשת שמושכת את הקורא
- תאר בפירוט את המקום, הדמויות והאווירה
- גרום לילד/ה לרצות לדעת מה קורה אחר כך
- ${activeProfile?.name} צריך להיות הדמות הראשית!
- השתמש ב-${lengthDescriptions[storyLength]} עם תיאורים עשירים
${includeDialogue ? '- הוסף דיאלוג טבעי שמקדם את הסיפור' : ''}
${includeEducationalContent ? '- שלב ערך חינוכי (אומץ, ידידות, סקרנות וכו\')' : ''}

📝 פורמט הפלט (JSON בלבד):
{
  "text": "טקסט הסיפור בעברית - ${lengthDescriptions[storyLength]} עשירים ומרתקים",
  "imagePrompt": "Detailed English description for ${artStyleDescriptions[artStyle]} style illustration, depicting the scene - ABSOLUTELY NO TEXT IN IMAGE"
}

**זכור: הכותרת "${storyTitle}" היא הבסיס - הסיפור חייב להתאים אליה בדיוק!**`;
        } else {
            // Continuing the story
            return `המשך את הסיפור "${storyTitle}" בצורה מרתקת.

📖 כותרת הסיפור: "${storyTitle}"
⚠️ המשך צריך להתאים לכותרת ולהמשיך את העלילה!

הגדרות:
- ז'אנר: ${styleDescriptions[storyStyle]}
- נושא: ${themeDescriptions[storyTheme]}
- אורך: ${lengthDescriptions[storyLength]}

📚 היסטוריית הסיפור עד כה:
${storyHistory}

🎯 משימה:
המשך באופן טבעי ומרתק מהתרומה האחרונה של ${activeProfile?.name}.
- תגיב למה ש-${activeProfile?.name} כתב/ה וקדם את העלילה
- הוסף סצנה חדשה מרגשת או אירוע מעניין
- שמור על התאמה לכותרת "${storyTitle}"
- צור אווירה מרתקת עם תיאורים עשירים
${includeDialogue ? '- הוסף דיאלוג טבעי שמעשיר את הסיפור' : ''}
${includeEducationalContent ? '- שלב מסר חינוכי או ערך חיובי' : ''}
- סיים עם תפנית קלה שגורמת לרצות לדעת מה קורה אחר כך

📝 פורמט הפלט (JSON בלבד):
{
  "text": "המשך הסיפור בעברית - ${lengthDescriptions[storyLength]} עשירים ומרתקים",
  "imagePrompt": "Detailed English description for ${artStyleDescriptions[artStyle]} style illustration of this scene - ABSOLUTELY NO TEXT IN IMAGE"
}`;
        }
    };

    const startStory = () => {
        if (!activeProfile) return;
        setStoryParts([]);
        const prompt = buildPrompt([]);
        generateStoryPart(prompt, profileImage?.imageData || null);
    };

    const handleContinueStory = (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || isAiThinking || !activeProfile) return;

        const newUserPart = {
            author: 'user',
            text: userInput,
            timestamp: new Date().toISOString()
        };
        const newStoryHistory = [...storyParts, newUserPart];
        setStoryParts(newStoryHistory);
        setUserInput('');

        const prompt = buildPrompt(newStoryHistory);
        generateStoryPart(prompt, profileImage?.imageData || null);
    };

    const handleExportPDF = async () => {
        if (!storyBookRef.current) return;

        try {
            const element = storyBookRef.current;
            const canvas = await html2canvas(element, {
                scale: 1.5,
                useCORS: true,
                logging: false,
                backgroundColor: '#1a2e1a'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
            const imgX = (pdfWidth - imgWidth * ratio) / 2;
            const imgY = 0;

            pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
            pdf.save(`${storyTitle || 'סיפור'}.pdf`);
        } catch (err) {
            console.error('Error exporting PDF:', err);
            setError('שגיאה בהורדת PDF');
        }
    };

    if (!activeProfile) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{...styles.centered, padding: '2rem', textAlign: 'center'}}
            >
                <div style={{fontSize: '4rem', marginBottom: '1rem'}}>👤</div>
                <h2 style={{color: 'var(--primary-light)', marginBottom: '1rem'}}>אין פרופיל פעיל</h2>
                <p style={{color: 'var(--text-light)', fontSize: '1.1rem'}}>
                    יש לבחור פרופיל בדשבורד ההורים כדי ליצור סיפור
                </p>
            </motion.div>
        );
    }

    if (isLoadingStory) {
        return <Loader message="טוען סיפור..." />;
    }

    // Intro Screen
    if (showIntro && !contentId && storyParts.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                style={{
                    minHeight: '100vh',
                    background: 'linear-gradient(135deg, rgba(26, 46, 26, 0.98) 0%, rgba(36, 60, 36, 0.95) 100%)',
                    padding: 'clamp(1rem, 3vw, 2rem)',
                    overflowY: 'auto',
                    position: 'relative'
                }}
            >
                {/* Floating decorative elements */}
                {['⭐', '🌈', '✨', '🎨', '📚', '🦄'].map((emoji, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{
                            opacity: 0.6,
                            scale: 1,
                            y: [0, -20, 0],
                        }}
                        transition={{
                            opacity: { delay: idx * 0.1 },
                            scale: { delay: idx * 0.1 },
                            y: {
                                duration: 3 + idx * 0.5,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }
                        }}
                        style={{
                            position: 'absolute',
                            top: `${10 + idx * 12}%`,
                            left: idx % 2 === 0 ? `${5 + idx * 3}%` : 'auto',
                            right: idx % 2 !== 0 ? `${5 + idx * 2}%` : 'auto',
                            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                            pointerEvents: 'none',
                            zIndex: 0
                        }}
                    >
                        {emoji}
                    </motion.div>
                ))}

                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    style={{
                        maxWidth: '1200px',
                        margin: '0 auto',
                        background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.95))',
                        padding: 'clamp(2rem, 5vw, 3rem)',
                        borderRadius: '32px',
                        border: '4px solid var(--primary-color)',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3), inset 0 0 0 2px rgba(255, 255, 255, 0.5)',
                        position: 'relative',
                        overflow: 'hidden',
                        zIndex: 1
                    }}
                >
                    {/* Decorative corner elements */}
                    {[0, 1, 2, 3].map((corner) => (
                        <motion.div
                            key={corner}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1, rotate: 360 }}
                            transition={{ delay: 0.3 + corner * 0.1, duration: 0.8 }}
                            style={{
                                position: 'absolute',
                                top: corner < 2 ? '-10px' : 'auto',
                                bottom: corner >= 2 ? '-10px' : 'auto',
                                left: corner % 2 === 0 ? '-10px' : 'auto',
                                right: corner % 2 !== 0 ? '-10px' : 'auto',
                                width: '80px',
                                height: '80px',
                                background: `linear-gradient(135deg, var(--primary-color), ${corner % 2 === 0 ? 'var(--primary-light)' : 'var(--secondary-color)'})`,
                                borderRadius: '50%',
                                opacity: 0.7
                            }}
                        />
                    ))}

                    {/* Header */}
                    <div style={{textAlign: 'center', marginBottom: '2rem', position: 'relative', zIndex: 1}}>
                        <motion.div
                            animate={{
                                rotate: [0, 10, -10, 0],
                                scale: [1, 1.1, 1]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            style={{
                                fontSize: 'clamp(4rem, 10vw, 6rem)',
                                marginBottom: '1rem'
                            }}
                        >
                            📚✨🎨
                        </motion.div>
                        <h1 style={{
                            fontSize: 'clamp(2rem, 6vw, 3rem)',
                            background: 'linear-gradient(135deg, var(--primary-color), var(--primary-light), var(--secondary-color))',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            marginBottom: '0.5rem',
                            fontWeight: '900',
                            textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
                        }}>🌟 יוצר הסיפורים המשופר 🌟</h1>
                        <p style={{
                            fontSize: 'clamp(1.1rem, 3vw, 1.4rem)',
                            color: '#5F5F5F',
                            margin: 0,
                            fontWeight: '600'
                        }}>בואו ניצור סיפור מדהים ל<span style={{
                            color: 'var(--primary-light)',
                            fontWeight: 'bold'
                        }}>{activeProfile.name}</span>!</p>
                    </div>

                    {/* Profile Image Status */}
                    {profileImage && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                                background: 'linear-gradient(135deg, rgba(127, 217, 87, 0.2), rgba(86, 217, 137, 0.2))',
                                padding: 'clamp(1rem, 3vw, 1.5rem)',
                                borderRadius: '20px',
                                border: '3px solid var(--primary-color)',
                                marginBottom: '2rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'clamp(1rem, 3vw, 1.5rem)',
                                flexWrap: 'wrap',
                                justifyContent: 'center'
                            }}
                        >
                            <img
                                src={profileImage.imageData}
                                alt="תמונת פרופיל"
                                style={{
                                    width: 'clamp(60px, 15vw, 80px)',
                                    height: 'clamp(60px, 15vw, 80px)',
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    border: '4px solid var(--primary-color)',
                                    boxShadow: '0 4px 16px rgba(127, 217, 87, 0.4)'
                                }}
                            />
                            <div style={{ flex: 1, minWidth: '200px', textAlign: 'center' }}>
                                <div style={{
                                    fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)',
                                    color: 'var(--primary-color)',
                                    fontWeight: 'bold',
                                    marginBottom: '0.25rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    justifyContent: 'center'
                                }}>
                                    <FaCheckCircle /> תמונת הילד/ה תשמש כרפרנס
                                </div>
                                <p style={{
                                    fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                                    color: '#5F5F5F',
                                    margin: 0
                                }}>
                                    הדמויות בסיפור ידמו ל-{activeProfile.name}! 🎨
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {/* How it works */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        style={{
                            background: 'linear-gradient(135deg, rgba(255, 107, 157, 0.15), rgba(107, 207, 127, 0.15))',
                            padding: 'clamp(1.5rem, 4vw, 2rem)',
                            borderRadius: '24px',
                            border: '3px solid var(--primary-color)',
                            marginBottom: '2rem',
                            position: 'relative',
                            zIndex: 1,
                            boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
                        }}
                    >
                        <h3 style={{
                            fontSize: 'clamp(1.4rem, 3.5vw, 1.8rem)',
                            background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            marginBottom: '1.5rem',
                            textAlign: 'center',
                            fontWeight: 'bold'
                        }}>✨ איך זה עובד? ✨</h3>
                        <div style={{
                            display: 'grid',
                            gap: '1.5rem',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'
                        }}>
                            {[
                                { icon: '🎨', text: 'בחר סגנון אמנות לאיורים', color: 'var(--primary-color)' },
                                { icon: '📸', text: 'תמונת הילד/ה משמשת כרפרנס', color: 'var(--secondary-color)' },
                                { icon: '✍️', text: 'הילד/ה כותב/ת מה קורה', color: 'var(--primary-light)' },
                                { icon: '🤖', text: 'AI ממשיך בסיפור חינוכי', color: '#6BCF7F' }
                            ].map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.5 + idx * 0.1 }}
                                    whileHover={{ scale: 1.05, rotate: 2 }}
                                    style={{
                                        background: 'white',
                                        padding: '1.5rem',
                                        borderRadius: '20px',
                                        textAlign: 'center',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                        border: `3px solid ${item.color}`,
                                        cursor: 'pointer'
                                    }}
                                >
                                    <div style={{
                                        fontSize: '3rem',
                                        marginBottom: '0.75rem'
                                    }}>{item.icon}</div>
                                    <p style={{
                                        margin: 0,
                                        fontSize: 'clamp(0.95rem, 2.2vw, 1.1rem)',
                                        color: '#333',
                                        fontWeight: '600',
                                        lineHeight: 1.4
                                    }}>{item.text}</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Story Title */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        style={{
                            background: 'rgba(255, 255, 255, 0.8)',
                            padding: 'clamp(1.5rem, 4vw, 2rem)',
                            borderRadius: '20px',
                            border: '2px solid var(--primary-color)',
                            marginBottom: '2rem'
                        }}
                    >
                        <label style={{
                            display: 'block',
                            fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)',
                            color: 'var(--primary-color)',
                            marginBottom: '1rem',
                            fontWeight: 'bold',
                            textAlign: 'center'
                        }}>📖 שם הסיפור:</label>
                        <input
                            type="text"
                            value={initialStoryTitle}
                            onChange={(e) => setInitialStoryTitle(e.target.value)}
                            placeholder={`לדוגמה: הרפתקאות ${activeProfile.name} בחלל`}
                            style={{
                                width: '100%',
                                fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
                                padding: 'clamp(0.75rem, 2vw, 1rem)',
                                background: 'white',
                                border: '2px solid var(--primary-color)',
                                borderRadius: '12px',
                                color: '#333',
                                textAlign: 'center',
                                transition: 'all 0.3s ease',
                                outline: 'none'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--secondary-color)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                        />
                    </motion.div>

                    {/* Art Style Selector */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        style={{
                            background: 'rgba(255, 255, 255, 0.8)',
                            padding: 'clamp(1.5rem, 4vw, 2rem)',
                            borderRadius: '20px',
                            border: '2px solid var(--secondary-color)',
                            marginBottom: '2rem'
                        }}
                    >
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            marginBottom: '1.5rem'
                        }}>
                            <FaPalette style={{ fontSize: '1.5rem', color: 'var(--secondary-color)' }} />
                            <h3 style={{
                                fontSize: 'clamp(1.2rem, 2.8vw, 1.5rem)',
                                color: 'var(--secondary-color)',
                                margin: 0,
                                fontWeight: 'bold'
                            }}>בחר סגנון אמנות לאיורים</h3>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                            gap: 'clamp(0.75rem, 2vw, 1rem)'
                        }}>
                            {artStyleOptions.map((option, idx) => (
                                <motion.button
                                    key={option.value}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.8 + idx * 0.05 }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setArtStyle(option.value)}
                                    style={{
                                        background: artStyle === option.value
                                            ? 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))'
                                            : 'white',
                                        color: artStyle === option.value ? 'white' : '#333',
                                        border: `3px solid ${artStyle === option.value ? 'var(--primary-color)' : '#ddd'}`,
                                        borderRadius: '16px',
                                        padding: 'clamp(0.75rem, 2vw, 1rem)',
                                        cursor: 'pointer',
                                        textAlign: 'center',
                                        transition: 'all 0.3s ease',
                                        boxShadow: artStyle === option.value
                                            ? '0 8px 24px rgba(127, 217, 87, 0.4)'
                                            : '0 2px 8px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    <div style={{ fontSize: 'clamp(2rem, 5vw, 2.5rem)', marginBottom: '0.5rem' }}>
                                        {option.emoji}
                                    </div>
                                    <div style={{
                                        fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
                                        fontWeight: 'bold',
                                        marginBottom: '0.25rem'
                                    }}>
                                        {option.label}
                                    </div>
                                    <div style={{
                                        fontSize: 'clamp(0.75rem, 1.8vw, 0.85rem)',
                                        opacity: 0.8,
                                        lineHeight: 1.3
                                    }}>
                                        {option.description}
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>

                    {/* Advanced Options Toggle */}
                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.9 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                        style={{
                            width: '100%',
                            padding: 'clamp(0.75rem, 2vw, 1rem)',
                            background: 'rgba(127, 217, 87, 0.1)',
                            border: '2px solid var(--primary-color)',
                            borderRadius: '12px',
                            color: 'var(--primary-color)',
                            fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            marginBottom: '2rem'
                        }}
                    >
                        <motion.span
                            animate={{ rotate: showAdvancedOptions ? 90 : 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            ▶
                        </motion.span>
                        <span>{showAdvancedOptions ? 'הסתר הגדרות מתקדמות' : 'הצג הגדרות מתקדמות'}</span>
                        <span>⚙️</span>
                    </motion.button>

                    {/* Advanced Options */}
                    <AnimatePresence>
                        {showAdvancedOptions && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                style={{
                                    overflow: 'hidden',
                                    marginBottom: '2rem'
                                }}
                            >
                                <div style={{
                                    background: 'rgba(255, 255, 255, 0.8)',
                                    padding: 'clamp(1.5rem, 4vw, 2rem)',
                                    borderRadius: '20px',
                                    border: '2px solid var(--primary-color)',
                                    display: 'grid',
                                    gap: 'clamp(1rem, 3vw, 1.5rem)',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))'
                                }}>
                                    {/* Story Style */}
                                    <div>
                                        <label style={{
                                            display: 'block',
                                            fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                                            color: 'var(--primary-color)',
                                            marginBottom: '0.5rem',
                                            fontWeight: 'bold'
                                        }}>🎭 סגנון הסיפור:</label>
                                        <select
                                            value={storyStyle}
                                            onChange={(e) => setStoryStyle(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                background: 'white',
                                                border: '2px solid var(--primary-color)',
                                                borderRadius: '8px',
                                                color: '#333',
                                                fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <option value="adventure">הרפתקאות</option>
                                            <option value="fantasy">פנטזיה</option>
                                            <option value="educational">חינוכי</option>
                                            <option value="mystery">תעלומה</option>
                                            <option value="comedy">קומדיה</option>
                                            <option value="scifi">מדע בדיוני</option>
                                            <option value="nature">טבע וסביבה</option>
                                            <option value="history">היסטורי</option>
                                        </select>
                                    </div>

                                    {/* Story Theme */}
                                    <div>
                                        <label style={{
                                            display: 'block',
                                            fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                                            color: 'var(--primary-color)',
                                            marginBottom: '0.5rem',
                                            fontWeight: 'bold'
                                        }}>🌍 נושא הסיפור:</label>
                                        <select
                                            value={storyTheme}
                                            onChange={(e) => setStoryTheme(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                background: 'white',
                                                border: '2px solid var(--primary-color)',
                                                borderRadius: '8px',
                                                color: '#333',
                                                fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <option value="general">כללי</option>
                                            <option value="space">חלל וכוכבים</option>
                                            <option value="underwater">עולם תת-ימי</option>
                                            <option value="jungle">ג'ונגל הרפתקאות</option>
                                            <option value="city">עיר מודרנית</option>
                                            <option value="medieval">ימי ביניים וטירות</option>
                                            <option value="magic">בית ספר לקסמים</option>
                                            <option value="animals">בעלי חיים מדברים</option>
                                            <option value="robots">רובוטים וטכנולוגיה</option>
                                            <option value="sports">ספורט ותחרויות</option>
                                        </select>
                                    </div>

                                    {/* Educational Focus */}
                                    <div>
                                        <label style={{
                                            display: 'block',
                                            fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                                            color: 'var(--primary-color)',
                                            marginBottom: '0.5rem',
                                            fontWeight: 'bold'
                                        }}>📚 מיקוד חינוכי (אופציונלי):</label>
                                        <input
                                            type="text"
                                            value={educationalFocus}
                                            onChange={(e) => setEducationalFocus(e.target.value)}
                                            placeholder="לדוגמה: חשיבות שיתוף פעולה"
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                background: 'white',
                                                border: '2px solid var(--primary-color)',
                                                borderRadius: '8px',
                                                color: '#333',
                                                fontSize: 'clamp(0.9rem, 2vw, 1rem)'
                                            }}
                                        />
                                    </div>

                                    {/* Moral Lesson */}
                                    <div>
                                        <label style={{
                                            display: 'block',
                                            fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                                            color: 'var(--primary-color)',
                                            marginBottom: '0.5rem',
                                            fontWeight: 'bold'
                                        }}>💡 מסר חינוכי (אופציונלי):</label>
                                        <input
                                            type="text"
                                            value={moralLesson}
                                            onChange={(e) => setMoralLesson(e.target.value)}
                                            placeholder="לדוגמה: אומץ ועזרה לאחרים"
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                background: 'white',
                                                border: '2px solid var(--primary-color)',
                                                borderRadius: '8px',
                                                color: '#333',
                                                fontSize: 'clamp(0.9rem, 2vw, 1rem)'
                                            }}
                                        />
                                    </div>

                                    {/* Story Length */}
                                    <div>
                                        <label style={{
                                            display: 'block',
                                            fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                                            color: 'var(--primary-color)',
                                            marginBottom: '0.5rem',
                                            fontWeight: 'bold'
                                        }}>📏 אורך כל חלק:</label>
                                        <select
                                            value={storyLength}
                                            onChange={(e) => setStoryLength(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                background: 'white',
                                                border: '2px solid var(--primary-color)',
                                                borderRadius: '8px',
                                                color: '#333',
                                                fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <option value="short">קצר (3-4 משפטים)</option>
                                            <option value="medium">בינוני (5-6 משפטים)</option>
                                            <option value="long">ארוך (7-9 משפטים)</option>
                                        </select>
                                    </div>

                                    {/* Complexity */}
                                    <div>
                                        <label style={{
                                            display: 'block',
                                            fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                                            color: 'var(--primary-color)',
                                            marginBottom: '0.5rem',
                                            fontWeight: 'bold'
                                        }}>🎓 מורכבות השפה:</label>
                                        <select
                                            value={storyComplexity}
                                            onChange={(e) => setStoryComplexity(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                background: 'white',
                                                border: '2px solid var(--primary-color)',
                                                borderRadius: '8px',
                                                color: '#333',
                                                fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <option value="auto">אוטומטי (לפי גיל)</option>
                                            <option value="simple">פשוט</option>
                                            <option value="medium">בינוני</option>
                                            <option value="advanced">מתקדם</option>
                                        </select>
                                    </div>

                                    {/* Character Count */}
                                    <div>
                                        <label style={{
                                            display: 'block',
                                            fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                                            color: 'var(--primary-color)',
                                            marginBottom: '0.5rem',
                                            fontWeight: 'bold'
                                        }}>👥 מספר דמויות:</label>
                                        <select
                                            value={characterCount}
                                            onChange={(e) => setCharacterCount(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                background: 'white',
                                                border: '2px solid var(--primary-color)',
                                                borderRadius: '8px',
                                                color: '#333',
                                                fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <option value="solo">סולו (לבד)</option>
                                            <option value="few">קבוצה קטנה (2-3)</option>
                                            <option value="many">קבוצה גדולה</option>
                                        </select>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Credits Info */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.0 }}
                        style={{
                            background: 'linear-gradient(135deg, rgba(127, 217, 87, 0.2), rgba(86, 217, 137, 0.2))',
                            padding: 'clamp(1rem, 3vw, 1.5rem)',
                            borderRadius: '16px',
                            border: '2px solid var(--primary-color)',
                            marginBottom: '2rem',
                            textAlign: 'center'
                        }}
                    >
                        <div style={{fontSize: '2rem', marginBottom: '0.5rem'}}>💎</div>
                        <p style={{
                            margin: 0,
                            fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
                            color: '#333'
                        }}>
                            כל חלק בסיפור עולה <strong style={{color: 'var(--primary-color)', fontSize: '1.3em'}}>{STORY_PART_CREDITS}</strong> קרדיט{STORY_PART_CREDITS !== 1 ? 'ים' : ''}
                        </p>
                        <p style={{
                            margin: '0.5rem 0 0 0',
                            fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                            color: '#5F5F5F'
                        }}>
                            הקרדיטים שלך: <strong style={{color: 'var(--primary-color)'}}>{user?.credits ?? 0}</strong>
                        </p>
                    </motion.div>

                    {/* Start Button */}
                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.1 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                            if ((user?.credits ?? 0) < STORY_PART_CREDITS) {
                                alert(`אין מספיק קרדיטים. נדרשים ${STORY_PART_CREDITS} קרדיטים, יש לך ${user?.credits ?? 0}.`);
                                return;
                            }
                            if (!initialStoryTitle.trim()) {
                                alert('אנא כתוב שם לסיפור');
                                return;
                            }
                            if (!apiKey) {
                                alert('שגיאה: חסר API key. אנא פנה למנהל המערכת.');
                                return;
                            }
                            setStoryTitle(initialStoryTitle.trim());
                            setShowIntro(false);
                            startStory();
                        }}
                        disabled={(user?.credits ?? 0) < STORY_PART_CREDITS || !initialStoryTitle.trim()}
                        style={{
                            width: '100%',
                            padding: 'clamp(1rem, 3vw, 1.5rem)',
                            fontSize: 'clamp(1.2rem, 3vw, 1.5rem)',
                            fontWeight: 'bold',
                            background: (user?.credits ?? 0) >= STORY_PART_CREDITS && initialStoryTitle.trim()
                                ? 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))'
                                : 'rgba(100, 100, 100, 0.3)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '16px',
                            cursor: (user?.credits ?? 0) >= STORY_PART_CREDITS && initialStoryTitle.trim() ? 'pointer' : 'not-allowed',
                            boxShadow: (user?.credits ?? 0) >= STORY_PART_CREDITS && initialStoryTitle.trim()
                                ? '0 8px 25px rgba(127, 217, 87, 0.4)'
                                : 'none',
                            opacity: (user?.credits ?? 0) >= STORY_PART_CREDITS && initialStoryTitle.trim() ? 1 : 0.5
                        }}
                    >
                        {(user?.credits ?? 0) < STORY_PART_CREDITS
                            ? `❌ חסרים ${STORY_PART_CREDITS - (user?.credits ?? 0)} קרדיטים`
                            : !initialStoryTitle.trim()
                            ? '✏️ אנא כתוב שם לסיפור'
                            : '🚀 בואו נתחיל את הסיפור!'}
                    </motion.button>
                </motion.div>
            </motion.div>
        );
    }

    // Story View
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
                height: '100vh',
                background: 'linear-gradient(135deg, rgba(26, 46, 26, 0.98), rgba(36, 60, 36, 0.95))',
                padding: 'clamp(1rem, 2vw, 2rem)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}
        >
            {isAiThinking && <Loader message="יוצר את הסיפור עם AI משופר... ✨" />}

            {/* Scrollable Content Area */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            style={{
                                background: 'rgba(244, 67, 54, 0.2)',
                                border: '2px solid rgba(244, 67, 54, 0.5)',
                                padding: '1rem',
                                borderRadius: '12px',
                                color: '#ff6b6b',
                                marginBottom: '1rem',
                                textAlign: 'center',
                                fontSize: 'clamp(0.9rem, 2vw, 1.1rem)'
                            }}
                        >
                            ❌ {error}
                        </motion.div>
                    )}

                    {savedToLocal && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            style={{
                                background: 'linear-gradient(135deg, var(--primary-color), var(--primary-light))',
                                color: '#0d1a0d',
                                padding: '1rem',
                                borderRadius: '12px',
                                marginBottom: '1rem',
                                textAlign: 'center',
                                fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
                                fontWeight: 'bold',
                                boxShadow: '0 4px 16px rgba(127, 217, 87, 0.5)'
                            }}
                        >
                            ✨ הסיפור נשמר בהצלחה! ✨
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Story Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        background: 'linear-gradient(135deg, rgba(127, 217, 87, 0.15), rgba(86, 217, 137, 0.15))',
                        padding: 'clamp(1rem, 3vw, 1.5rem)',
                        borderRadius: '16px',
                        border: '2px solid var(--primary-color)',
                        marginBottom: '1.5rem',
                        textAlign: 'center'
                    }}
                >
                    <h1 style={{
                        fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                        color: 'var(--primary-light)',
                        margin: '0 0 0.5rem 0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        flexWrap: 'wrap'
                    }}>
                        <FaBook /> {storyTitle}
                    </h1>
                    <p style={{
                        margin: 0,
                        fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
                        color: 'var(--text-light)'
                    }}>
                        סיפור של {activeProfile.name} | {storyParts.filter((p: any) => p.author === 'ai').length} חלקים | סגנון: {artStyleOptions.find(s => s.value === artStyle)?.label}
                    </p>
                </motion.div>

                {/* Story Content */}
                <div ref={storyBookRef} style={{ marginBottom: '1.5rem' }}>
                    <AnimatePresence>
                        {storyParts.map((part: any, index: number) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: part.author === 'ai' ? -50 : 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5 }}
                                style={{
                                    background: part.author === 'ai'
                                        ? 'linear-gradient(135deg, rgba(127, 217, 87, 0.15), rgba(107, 207, 127, 0.1))'
                                        : 'linear-gradient(135deg, rgba(86, 217, 137, 0.15), rgba(76, 207, 117, 0.1))',
                                    padding: 'clamp(1rem, 3vw, 2rem)',
                                    borderRadius: '16px',
                                    border: `2px solid ${part.author === 'ai' ? 'var(--primary-color)' : 'var(--secondary-color)'}`,
                                    marginBottom: '1.5rem',
                                    boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    marginBottom: '1rem',
                                    fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                                    color: 'var(--primary-light)',
                                    fontWeight: 'bold'
                                }}>
                                    <span>{part.author === 'ai' ? '🤖 המספר' : `✍️ ${activeProfile.name}`}</span>
                                </div>
                                <p style={{
                                    fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
                                    lineHeight: 1.8,
                                    color: 'var(--white)',
                                    margin: '0 0 1rem 0',
                                    textAlign: 'right'
                                }}>{part.text}</p>
                                {part.image && (
                                    <motion.img
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                        src={part.image}
                                        alt="Story illustration"
                                        style={{
                                            width: '100%',
                                            maxWidth: '600px',
                                            height: 'auto',
                                            borderRadius: '12px',
                                            display: 'block',
                                            margin: '0 auto',
                                            boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
                                            border: '3px solid var(--primary-color)'
                                        }}
                                    />
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {thinkingIndex !== null && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{
                                background: 'rgba(127, 217, 87, 0.05)',
                                padding: '2rem',
                                borderRadius: '16px',
                                border: '2px dashed var(--primary-color)',
                                textAlign: 'center',
                                fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
                                color: 'var(--primary-light)'
                            }}
                        >
                            ✨ יוצר את הסיפור...
                        </motion.div>
                    )}
                    <div ref={storyEndRef} />
                </div>

                {/* Input Area */}
                {!isAiThinking && storyParts.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            padding: 'clamp(1rem, 3vw, 1.5rem)',
                            borderRadius: '16px',
                            border: '2px solid var(--primary-color)',
                            marginBottom: '1.5rem'
                        }}
                    >
                        <form onSubmit={handleContinueStory}>
                            <label style={{
                                display: 'block',
                                fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
                                color: 'var(--primary-light)',
                                marginBottom: '0.75rem',
                                fontWeight: 'bold',
                                textAlign: 'center'
                            }}>✍️ מה קורה עכשיו?</label>
                            <textarea
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                placeholder="כתוב מה הגיבור/ה עושה עכשיו..."
                                style={{
                                    width: '100%',
                                    minHeight: '100px',
                                    padding: '1rem',
                                    fontSize: 'clamp(1rem, 2.5vw, 1.1rem)',
                                    background: 'white',
                                    border: '2px solid var(--primary-color)',
                                    borderRadius: '12px',
                                    color: '#333',
                                    resize: 'vertical',
                                    marginBottom: '1rem',
                                    textAlign: 'right'
                                }}
                            />
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={!userInput.trim() || isAiThinking}
                                style={{
                                    width: '100%',
                                    padding: 'clamp(0.75rem, 2vw, 1rem)',
                                    fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
                                    fontWeight: 'bold',
                                    background: userInput.trim() && !isAiThinking
                                        ? 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))'
                                        : 'rgba(100, 100, 100, 0.3)',
                                    color: 'var(--white)',
                                    border: 'none',
                                    borderRadius: '12px',
                                    cursor: userInput.trim() && !isAiThinking ? 'pointer' : 'not-allowed',
                                    opacity: userInput.trim() && !isAiThinking ? 1 : 0.5
                                }}
                            >
                                🚀 המשך את הסיפור
                            </motion.button>
                        </form>
                    </motion.div>
                )}

                {/* Action Buttons - Footer */}
                {storyParts.length > 0 && !isAiThinking && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            display: 'flex',
                            gap: 'clamp(0.5rem, 2vw, 1rem)',
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                            paddingBottom: '2rem'
                        }}
                    >
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={saveToLocalStorage}
                            style={{
                                padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1.5rem, 4vw, 2rem)',
                                fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
                                fontWeight: 'bold',
                                background: 'linear-gradient(135deg, var(--primary-color), var(--primary-light))',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                boxShadow: '0 4px 15px rgba(127, 217, 87, 0.4)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <FaSave /> שמור מקומית
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleExportPDF}
                            style={{
                                padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1.5rem, 4vw, 2rem)',
                                fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
                                fontWeight: 'bold',
                                background: 'linear-gradient(135deg, var(--accent-color), var(--secondary-color))',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                boxShadow: '0 4px 15px rgba(160, 132, 232, 0.4)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <FaDownload /> הורד כ-PDF
                        </motion.button>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
};

export default StoryCreator;
