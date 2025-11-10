import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { useAppContext } from './AppContext';
import { supabase } from '../supabaseClient';
import { styles } from '../../styles';
import Loader from './Loader';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

    // Enhanced Story Options
    const [storyStyle, setStoryStyle] = useState<string>('adventure');
    const [storyLength, setStoryLength] = useState<string>('medium');
    const [storyComplexity, setStoryComplexity] = useState<string>('auto');
    const [imageStyle, setImageStyle] = useState<string>('colorful');
    const [storyTheme, setStoryTheme] = useState<string>('general'); // New: specific themes
    const [includeEducationalContent, setIncludeEducationalContent] = useState<boolean>(true); // New
    const [includeDialogue, setIncludeDialogue] = useState<boolean>(true); // New
    const [characterCount, setCharacterCount] = useState<string>('few'); // New: solo, few, many
    const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

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

    // Initialize story title
    useEffect(() => {
        if (!storyTitle && activeProfile) {
            setStoryTitle(`הרפתקאות ${activeProfile.name}`);
        }
    }, [activeProfile, storyTitle]);

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

            console.log('🚀 Generating story part...');

            // Generate text with structured output
            const schema = {
                type: Type.OBJECT,
                properties: {
                    text: {type: Type.STRING},
                    imagePrompt: {type: Type.STRING}
                },
                required: ["text", "imagePrompt"]
            };

            const textResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: schema,
                    maxOutputTokens: 500
                }
            });

            if (!textResponse?.text) {
                throw new Error("API did not return text response");
            }

            const partData = JSON.parse(textResponse.text.trim());
            console.log('✅ Text generated:', partData.text.substring(0, 100) + '...');

            // Prepare image generation
            const profilePhoto = activeProfile.photo_url || activeProfile.photo;
            const imageCharacterPrompt = profilePhoto
                ? `A consistent character drawing that matches the reference photo, maintaining facial features,`
                : `A ${activeProfile.age}-year-old ${activeProfile.gender === 'בת' ? 'girl' : 'boy'},`;

            const imageStyleDescriptions: Record<string, string> = {
                colorful: 'vibrant colorful',
                watercolor: 'soft watercolor',
                cartoon: 'cartoon',
                realistic: 'realistic',
                sketch: 'sketch',
                digital: 'digital art'
            };

            const fullImagePrompt = `${imageCharacterPrompt} ${partData.imagePrompt}, ${imageStyleDescriptions[imageStyle]} children's book illustration`;

            console.log('🎨 Generating image...');

            // Load reference image if available
            let referenceImageData = referenceImage;
            if (!referenceImageData && profilePhoto) {
                try {
                    if (profilePhoto.startsWith('http')) {
                        const response = await fetch(profilePhoto);
                        const blob = await response.blob();
                        const reader = new FileReader();
                        referenceImageData = await new Promise<string>((resolve) => {
                            reader.onloadend = () => resolve(reader.result as string);
                            reader.readAsDataURL(blob);
                        });
                    } else if (profilePhoto.startsWith('data:')) {
                        referenceImageData = profilePhoto;
                    }
                } catch (error) {
                    console.warn('Could not load profile photo:', error);
                }
            }

            const textPart = { text: fullImagePrompt };
            const imageRequestParts = referenceImageData && referenceImageData.startsWith('data:')
                ? [
                    { inlineData: { mimeType: 'image/jpeg', data: referenceImageData.split(',')[1] } },
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
                console.log('✅ Image generated successfully');
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
                await saveStoryToDatabase(updatedStoryParts);
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
            const characterDescription = `${activeProfile?.name}, ${activeProfile?.gender} בגיל ${activeProfile?.age}`;
            const interestsDescription = activeProfile?.interests ? `תחומים: ${activeProfile.interests}` : '';

            return `סופר ספרי ילדים. צור סיפור: "${storyTitle || `הרפתקאות ${activeProfile?.name}`}"

דמות: ${characterDescription}${interestsDescription ? ` | ${interestsDescription}` : ''}
ז'אנר: ${styleDescriptions[storyStyle]}
נושא: ${themeDescriptions[storyTheme]}
אורך: ${lengthDescriptions[storyLength]}
${includeDialogue ? 'כלול דיאלוגים. ' : ''}${includeEducationalContent ? 'כלול תוכן חינוכי. ' : ''}

צור חלק פתיחה מרתק שמתחבר לשם הסיפור "${storyTitle}".

JSON:
{
  "text": "טקסט בעברית",
  "imagePrompt": "Short English prompt"
}`;
        } else {
            // Continuing the story
            return `המשך סיפור "${storyTitle}".
ז'אנר: ${styleDescriptions[storyStyle]} | נושא: ${themeDescriptions[storyTheme]}

היסטוריה:
${storyHistory}

המשך מ-${activeProfile?.name}. ${lengthDescriptions[storyLength]}. ${includeDialogue ? 'דיאלוג. ' : ''}${includeEducationalContent ? 'מסר. ' : ''}תפנית מרתקת.

JSON:
{
  "text": "המשך בעברית",
  "imagePrompt": "Short English prompt"
}`;
        }
    };

    const startStory = () => {
        if (!activeProfile) return;
        setStoryParts([]);
        const prompt = buildPrompt([]);
        const profilePhoto = activeProfile.photo_url || activeProfile.photo;
        generateStoryPart(prompt, profilePhoto);
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
        const profilePhoto = activeProfile.photo_url || activeProfile.photo;
        generateStoryPart(prompt, profilePhoto);
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
            <div style={{...styles.centered, padding: '2rem', textAlign: 'center'}}>
                <div style={{fontSize: '4rem', marginBottom: '1rem'}}>👤</div>
                <h2 style={{color: 'var(--primary-light)', marginBottom: '1rem'}}>אין פרופיל פעיל</h2>
                <p style={{color: 'var(--text-light)', fontSize: '1.1rem'}}>
                    יש לבחור פרופיל בדשבורד ההורים כדי ליצור סיפור
                </p>
            </div>
        );
    }

    if (isLoadingStory) {
        return <Loader message="טוען סיפור..." />;
    }

    // Intro Screen
    if (showIntro && !contentId && storyParts.length === 0) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, rgba(26, 46, 26, 0.98) 0%, rgba(36, 60, 36, 0.95) 100%)',
                padding: 'clamp(1rem, 3vw, 2rem)',
                overflowY: 'auto',
                position: 'relative'
            }}>
                {/* Floating decorative elements */}
                <div style={{
                    position: 'absolute',
                    top: '10%',
                    left: '5%',
                    fontSize: '3rem',
                    animation: 'float 3s ease-in-out infinite',
                    opacity: 0.6
                }}>⭐</div>
                <div style={{
                    position: 'absolute',
                    top: '20%',
                    right: '8%',
                    fontSize: '2.5rem',
                    animation: 'float 4s ease-in-out infinite 0.5s',
                    opacity: 0.6
                }}>🌈</div>
                <div style={{
                    position: 'absolute',
                    top: '60%',
                    left: '10%',
                    fontSize: '2rem',
                    animation: 'float 3.5s ease-in-out infinite 1s',
                    opacity: 0.6
                }}>✨</div>
                <div style={{
                    position: 'absolute',
                    top: '70%',
                    right: '12%',
                    fontSize: '2.8rem',
                    animation: 'float 4.5s ease-in-out infinite 1.5s',
                    opacity: 0.6
                }}>🎨</div>

                <div style={{
                    maxWidth: '1000px',
                    margin: '0 auto',
                    background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.9))',
                    padding: 'clamp(2rem, 5vw, 3rem)',
                    borderRadius: '32px',
                    border: '4px solid var(--primary-color)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3), inset 0 0 0 2px rgba(255, 255, 255, 0.5)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {/* Decorative corner elements */}
                    <div style={{
                        position: 'absolute',
                        top: '-10px',
                        left: '-10px',
                        width: '80px',
                        height: '80px',
                        background: 'linear-gradient(135deg, var(--primary-color), var(--primary-light))',
                        borderRadius: '50%',
                        opacity: 0.7
                    }}></div>
                    <div style={{
                        position: 'absolute',
                        top: '-10px',
                        right: '-10px',
                        width: '80px',
                        height: '80px',
                        background: 'linear-gradient(135deg, #6BCF7F, #4CAF50)',
                        borderRadius: '50%',
                        opacity: 0.7
                    }}></div>
                    <div style={{
                        position: 'absolute',
                        bottom: '-10px',
                        left: '-10px',
                        width: '80px',
                        height: '80px',
                        background: 'linear-gradient(135deg, var(--secondary-color), var(--primary-color))',
                        borderRadius: '50%',
                        opacity: 0.7
                    }}></div>
                    <div style={{
                        position: 'absolute',
                        bottom: '-10px',
                        right: '-10px',
                        width: '80px',
                        height: '80px',
                        background: 'linear-gradient(135deg, var(--primary-light), #6BCF7F)',
                        borderRadius: '50%',
                        opacity: 0.7
                    }}></div>
                    {/* Header */}
                    <div style={{textAlign: 'center', marginBottom: '2rem', position: 'relative', zIndex: 1}}>
                        <div style={{
                            fontSize: 'clamp(4rem, 10vw, 6rem)',
                            marginBottom: '1rem',
                            animation: 'bounce 2s ease-in-out infinite'
                        }}>📚✨🎨</div>
                        <h1 style={{
                            fontSize: 'clamp(2rem, 6vw, 3rem)',
                            background: 'linear-gradient(135deg, var(--primary-color), var(--primary-light), var(--secondary-color))',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            marginBottom: '0.5rem',
                            fontWeight: '900',
                            textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
                        }}>🌟 יוצר הסיפורים הקסום 🌟</h1>
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

                    {/* How it works */}
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(255, 107, 157, 0.15), rgba(107, 207, 127, 0.15))',
                        padding: 'clamp(1.5rem, 4vw, 2rem)',
                        borderRadius: '24px',
                        border: '3px solid var(--primary-color)',
                        marginBottom: '2rem',
                        position: 'relative',
                        zIndex: 1,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
                    }}>
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
                                { icon: '🎨', text: 'המערכת יוצרת סיפור מותאם אישית', color: 'var(--primary-color)' },
                                { icon: '✍️', text: 'הילד/ה כותב/ת מה קורה עכשיו', color: 'var(--secondary-color)' },
                                { icon: '🤖', text: 'הבינה המלאכותית ממשיכה בסיפור', color: 'var(--primary-light)' },
                                { icon: '🖼️', text: 'כל חלק מלווה באיור יפהפה', color: '#6BCF7F' }
                            ].map((item, idx) => (
                                <div key={idx} style={{
                                    background: 'white',
                                    padding: '1.5rem',
                                    borderRadius: '20px',
                                    textAlign: 'center',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                    border: `3px solid ${item.color}`,
                                    transition: 'transform 0.3s ease',
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={(e: any) => e.currentTarget.style.transform = 'scale(1.05) rotate(2deg)'}
                                onMouseLeave={(e: any) => e.currentTarget.style.transform = 'scale(1) rotate(0deg)'}>
                                    <div style={{
                                        fontSize: '3rem',
                                        marginBottom: '0.75rem',
                                        animation: `bounce 2s ease-in-out infinite ${idx * 0.2}s`
                                    }}>{item.icon}</div>
                                    <p style={{
                                        margin: 0,
                                        fontSize: 'clamp(0.95rem, 2.2vw, 1.1rem)',
                                        color: '#333',
                                        fontWeight: '600',
                                        lineHeight: 1.4
                                    }}>{item.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Story Title */}
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: 'clamp(1.5rem, 4vw, 2rem)',
                        borderRadius: '16px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        marginBottom: '2rem'
                    }}>
                        <label style={{
                            display: 'block',
                            fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)',
                            color: 'var(--primary-light)',
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
                                transition: 'all 0.3s ease'
                            }}
                        />
                    </div>

                    {/* Story Options */}
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: 'clamp(1.5rem, 4vw, 2rem)',
                        borderRadius: '16px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        marginBottom: '2rem'
                    }}>
                        <button
                            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                background: 'rgba(127, 217, 87, 0.1)',
                                border: '1px solid rgba(127, 217, 87, 0.3)',
                                borderRadius: '12px',
                                color: 'var(--primary-light)',
                                fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <span>{showAdvancedOptions ? '▼' : '▶'}</span>
                            <span>הגדרות הסיפור</span>
                            <span>⚙️</span>
                        </button>

                        {showAdvancedOptions && (
                            <div style={{
                                marginTop: '1.5rem',
                                display: 'grid',
                                gap: '1.5rem',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))'
                            }}>
                                {/* Story Style */}
                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                                        color: 'var(--primary-light)',
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
                                            border: '1px solid var(--primary-color)',
                                            borderRadius: '8px',
                                            color: '#333',
                                            fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <option value="adventure" style={{background: 'white', color: '#333'}}>הרפתקאות</option>
                                        <option value="fantasy" style={{background: 'white', color: '#333'}}>פנטזיה</option>
                                        <option value="educational" style={{background: 'white', color: '#333'}}>חינוכי</option>
                                        <option value="mystery" style={{background: 'white', color: '#333'}}>תעלומה</option>
                                        <option value="comedy" style={{background: 'white', color: '#333'}}>קומדיה</option>
                                        <option value="scifi" style={{background: 'white', color: '#333'}}>מדע בדיוני</option>
                                        <option value="nature" style={{background: 'white', color: '#333'}}>טבע וסביבה</option>
                                        <option value="history" style={{background: 'white', color: '#333'}}>היסטורי</option>
                                    </select>
                                </div>

                                {/* Story Theme */}
                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                                        color: 'var(--primary-light)',
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
                                            border: '1px solid var(--primary-color)',
                                            borderRadius: '8px',
                                            color: '#333',
                                            fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <option value="general" style={{background: 'white', color: '#333'}}>כללי</option>
                                        <option value="space" style={{background: 'white', color: '#333'}}>חלל וכוכבים</option>
                                        <option value="underwater" style={{background: 'white', color: '#333'}}>עולם תת-ימי</option>
                                        <option value="jungle" style={{background: 'white', color: '#333'}}>ג'ונגל הרפתקאות</option>
                                        <option value="city" style={{background: 'white', color: '#333'}}>עיר מודרנית</option>
                                        <option value="medieval" style={{background: 'white', color: '#333'}}>ימי ביניים וטירות</option>
                                        <option value="magic" style={{background: 'white', color: '#333'}}>בית ספר לקסמים</option>
                                        <option value="animals" style={{background: 'white', color: '#333'}}>בעלי חיים מדברים</option>
                                        <option value="robots" style={{background: 'white', color: '#333'}}>רובוטים וטכנולוגיה</option>
                                        <option value="sports" style={{background: 'white', color: '#333'}}>ספורט ותחרויות</option>
                                    </select>
                                </div>

                                {/* Story Length */}
                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                                        color: 'var(--primary-light)',
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
                                            border: '1px solid var(--primary-color)',
                                            borderRadius: '8px',
                                            color: '#333',
                                            fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <option value="short" style={{background: 'white', color: '#333'}}>קצר (3-4 משפטים)</option>
                                        <option value="medium" style={{background: 'white', color: '#333'}}>בינוני (5-6 משפטים)</option>
                                        <option value="long" style={{background: 'white', color: '#333'}}>ארוך (7-9 משפטים)</option>
                                    </select>
                                </div>

                                {/* Complexity */}
                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                                        color: 'var(--primary-light)',
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
                                            border: '1px solid var(--primary-color)',
                                            borderRadius: '8px',
                                            color: '#333',
                                            fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <option value="auto" style={{background: 'white', color: '#333'}}>אוטומטי (לפי גיל)</option>
                                        <option value="simple" style={{background: 'white', color: '#333'}}>פשוט</option>
                                        <option value="medium" style={{background: 'white', color: '#333'}}>בינוני</option>
                                        <option value="advanced" style={{background: 'white', color: '#333'}}>מתקדם</option>
                                    </select>
                                </div>

                                {/* Image Style */}
                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                                        color: 'var(--primary-light)',
                                        marginBottom: '0.5rem',
                                        fontWeight: 'bold'
                                    }}>🎨 סגנון האיורים:</label>
                                    <select
                                        value={imageStyle}
                                        onChange={(e) => setImageStyle(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            background: 'white',
                                            border: '1px solid var(--primary-color)',
                                            borderRadius: '8px',
                                            color: '#333',
                                            fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <option value="colorful" style={{background: 'white', color: '#333'}}>צבעוני ועליז</option>
                                        <option value="watercolor" style={{background: 'white', color: '#333'}}>צבעי מים רכים</option>
                                        <option value="cartoon" style={{background: 'white', color: '#333'}}>קריקטורה מצויירת</option>
                                        <option value="realistic" style={{background: 'white', color: '#333'}}>ריאליסטי</option>
                                        <option value="sketch" style={{background: 'white', color: '#333'}}>סקיצה אומנותית</option>
                                        <option value="digital" style={{background: 'white', color: '#333'}}>אומנות דיגיטלית</option>
                                    </select>
                                </div>

                                {/* Character Count */}
                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                                        color: 'var(--primary-light)',
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
                                            border: '1px solid var(--primary-color)',
                                            borderRadius: '8px',
                                            color: '#333',
                                            fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <option value="solo" style={{background: 'white', color: '#333'}}>סולו (לבד)</option>
                                        <option value="few" style={{background: 'white', color: '#333'}}>קבוצה קטנה (2-3)</option>
                                        <option value="many" style={{background: 'white', color: '#333'}}>קבוצה גדולה</option>
                                    </select>
                                </div>

                                {/* Educational Content */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.75rem',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    borderRadius: '8px'
                                }}>
                                    <input
                                        type="checkbox"
                                        id="educational"
                                        checked={includeEducationalContent}
                                        onChange={(e) => setIncludeEducationalContent(e.target.checked)}
                                        style={{
                                            width: '20px',
                                            height: '20px',
                                            cursor: 'pointer'
                                        }}
                                    />
                                    <label htmlFor="educational" style={{
                                        fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                                        color: 'var(--text-light)',
                                        cursor: 'pointer',
                                        flex: 1
                                    }}>📚 כולל תוכן חינוכי</label>
                                </div>

                                {/* Dialogue */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.75rem',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    borderRadius: '8px'
                                }}>
                                    <input
                                        type="checkbox"
                                        id="dialogue"
                                        checked={includeDialogue}
                                        onChange={(e) => setIncludeDialogue(e.target.checked)}
                                        style={{
                                            width: '20px',
                                            height: '20px',
                                            cursor: 'pointer'
                                        }}
                                    />
                                    <label htmlFor="dialogue" style={{
                                        fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                                        color: 'var(--text-light)',
                                        cursor: 'pointer',
                                        flex: 1
                                    }}>💬 כולל דיאלוגים</label>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Credits Info */}
                    <div style={{
                        background: 'rgba(127, 217, 87, 0.15)',
                        padding: '1.5rem',
                        borderRadius: '12px',
                        border: '1px solid var(--primary-color)',
                        marginBottom: '2rem',
                        textAlign: 'center'
                    }}>
                        <div style={{fontSize: '2rem', marginBottom: '0.5rem'}}>💎</div>
                        <p style={{
                            margin: 0,
                            fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
                            color: 'var(--white)'
                        }}>
                            כל חלק בסיפור עולה <strong style={{color: 'var(--primary-light)', fontSize: '1.3em'}}>{STORY_PART_CREDITS}</strong> קרדיט{STORY_PART_CREDITS !== 1 ? 'ים' : ''}
                        </p>
                        <p style={{
                            margin: '0.5rem 0 0 0',
                            fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                            color: 'var(--text-light)'
                        }}>
                            הקרדיטים שלך: <strong style={{color: 'var(--primary-light)'}}>{user?.credits ?? 0}</strong>
                        </p>
                    </div>

                    {/* Start Button */}
                    <button
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
                            color: 'var(--white)',
                            border: 'none',
                            borderRadius: '16px',
                            cursor: (user?.credits ?? 0) >= STORY_PART_CREDITS && initialStoryTitle.trim() ? 'pointer' : 'not-allowed',
                            boxShadow: (user?.credits ?? 0) >= STORY_PART_CREDITS && initialStoryTitle.trim()
                                ? '0 8px 25px rgba(127, 217, 87, 0.4)'
                                : 'none',
                            transition: 'all 0.3s ease',
                            opacity: (user?.credits ?? 0) >= STORY_PART_CREDITS && initialStoryTitle.trim() ? 1 : 0.5
                        }}
                    >
                        {(user?.credits ?? 0) < STORY_PART_CREDITS
                            ? `❌ חסרים ${STORY_PART_CREDITS - (user?.credits ?? 0)} קרדיטים`
                            : !initialStoryTitle.trim()
                            ? '✏️ אנא כתוב שם לסיפור'
                            : '🚀 בואו נתחיל את הסיפור!'}
                    </button>
                </div>
            </div>
        );
    }

    // Story View
    return (
        <div style={{
            height: '100vh',
            background: 'linear-gradient(135deg, rgba(26, 46, 26, 0.98), rgba(36, 60, 36, 0.95))',
            padding: 'clamp(1rem, 2vw, 2rem)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            {isAiThinking && <Loader message="יוצר את הסיפור... ✨" />}

            {/* Scrollable Content Area */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {error && (
                    <div style={{
                        background: 'rgba(244, 67, 54, 0.2)',
                        border: '2px solid rgba(244, 67, 54, 0.5)',
                        padding: '1rem',
                        borderRadius: '12px',
                        color: '#ff6b6b',
                        marginBottom: '1rem',
                        textAlign: 'center',
                        fontSize: '1.1rem'
                    }}>
                        ❌ {error}
                    </div>
                )}

                {/* Story Header */}
                <div style={{
                    background: 'rgba(127, 217, 87, 0.1)',
                    padding: 'clamp(1rem, 3vw, 1.5rem)',
                    borderRadius: '16px',
                    border: '2px solid var(--primary-color)',
                    marginBottom: '1.5rem',
                    textAlign: 'center'
                }}>
                    <h1 style={{
                        fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                        color: 'var(--primary-light)',
                        margin: '0 0 0.5rem 0'
                    }}>📖 {storyTitle}</h1>
                    <p style={{
                        margin: 0,
                        fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
                        color: 'var(--text-light)'
                    }}>סיפור של {activeProfile.name} | {storyParts.filter((p: any) => p.author === 'ai').length} חלקים</p>
                </div>

                {/* Story Content */}
                <div ref={storyBookRef} style={{
                    marginBottom: '1.5rem'
                }}>
                {storyParts.map((part: any, index: number) => (
                    <div key={index} style={{
                        background: part.author === 'ai'
                            ? 'rgba(127, 217, 87, 0.1)'
                            : 'rgba(86, 217, 137, 0.1)',
                        padding: 'clamp(1rem, 3vw, 2rem)',
                        borderRadius: '16px',
                        border: `2px solid ${part.author === 'ai' ? 'var(--primary-color)' : 'var(--secondary-color)'}`,
                        marginBottom: '1.5rem',
                        animation: 'fadeIn 0.5s ease'
                    }}>
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
                            <img
                                src={part.image}
                                alt="Story illustration"
                                style={{
                                    width: '100%',
                                    maxWidth: '600px',
                                    height: 'auto',
                                    borderRadius: '12px',
                                    display: 'block',
                                    margin: '0 auto',
                                    boxShadow: '0 8px 20px rgba(0,0,0,0.3)'
                                }}
                            />
                        )}
                    </div>
                ))}
                {thinkingIndex !== null && (
                    <div style={{
                        background: 'rgba(127, 217, 87, 0.05)',
                        padding: '2rem',
                        borderRadius: '16px',
                        border: '2px dashed var(--primary-color)',
                        textAlign: 'center',
                        fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
                        color: 'var(--primary-light)'
                    }}>
                        ✨ יוצר את הסיפור...
                    </div>
                )}
                <div ref={storyEndRef} />
            </div>

            {/* Input Area */}
            {!isAiThinking && storyParts.length > 0 && (
                <div style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: 'clamp(1rem, 3vw, 1.5rem)',
                    borderRadius: '16px',
                    border: '2px solid var(--primary-color)',
                    marginBottom: '1.5rem'
                }}>
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
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '12px',
                                color: '#333',
                                resize: 'vertical',
                                marginBottom: '1rem',
                                textAlign: 'right'
                            }}
                        />
                        <button
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
                                transition: 'all 0.3s ease',
                                opacity: userInput.trim() && !isAiThinking ? 1 : 0.5
                            }}
                        >
                            🚀 המשך את הסיפור
                        </button>
                    </form>
                </div>
            )}

            {/* Export Button - Footer */}
            {storyParts.length > 0 && !isAiThinking && (
                <div style={{
                    textAlign: 'center',
                    paddingBottom: '2rem'
                }}>
                    <button
                        onClick={handleExportPDF}
                        style={{
                            padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1.5rem, 4vw, 2rem)',
                            fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
                            fontWeight: 'bold',
                            background: 'linear-gradient(135deg, var(--accent-color), var(--secondary-color))',
                            color: 'var(--white)',
                            border: 'none',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            boxShadow: '0 4px 15px rgba(160, 132, 232, 0.3)',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        📥 הורד כ-PDF
                    </button>
                </div>
            )}
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                @keyframes rainbowGradient {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }

                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-20px); }
                }

                @keyframes bounce {
                    0%, 100% { transform: translateY(0) scale(1); }
                    50% { transform: translateY(-10px) scale(1.05); }
                }
            `}</style>
        </div>
    );
};

export default StoryCreator;
