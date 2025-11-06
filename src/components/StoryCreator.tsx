import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { useAppContext } from './AppContext';
import { supabase } from '../supabaseClient';
import { speakText } from '../../helpers';
import { styles } from '../../styles';
import Loader from './Loader';

interface StoryCreatorProps {
    contentId?: number | null;
    onContentLoaded?: () => void;
}

const StoryCreator = ({ contentId, onContentLoaded }: StoryCreatorProps = {}) => {
    const { activeProfile, user, updateUserCredits, creditCosts, refreshCreditCosts } = useAppContext();
    const [storyParts, setStoryParts] = useState<any[]>([]);
    const [userInput, setUserInput] = useState('');
    const [storyModifier, setStoryModifier] = useState('');
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [thinkingIndex, setThinkingIndex] = useState<number | null>(null);
    const [error, setError] = useState('');
    const [showIntro, setShowIntro] = useState(true);
    const storyEndRef = useRef<HTMLDivElement>(null);
    const [storyId, setStoryId] = useState<number | null>(contentId || null);
    const [isLoadingStory, setIsLoadingStory] = useState(false);

    const apiKey = process.env.API_KEY || '';
    if (!apiKey) {
        console.error('🔴 StoryCreator: API_KEY environment variable is not set');
        console.error('🔴 Check vite.config.ts and .env.production file');
    } else {
        console.log('✅ StoryCreator: API_KEY loaded successfully (length:', apiKey.length, ')');
    }
    const ai = new GoogleGenAI({ apiKey });
    const storyTitle = `הרפתקאות ${activeProfile?.name}`;
    const STORY_PART_CREDITS = creditCosts.story_part; // דינמי מההגדרות

    // Save story to database
    const saveStoryToDatabase = async (partsToSave?: any[]) => {
        if (!activeProfile || !user) return;
        
        const parts = partsToSave || storyParts;
        if (parts.length === 0) return;

        try {
            const storyData = {
                user_id: user.id,
                profile_id: activeProfile.id,
                title: storyTitle,
                story_parts: parts
            };

            if (storyId) {
                // Update existing story
                const { error } = await supabase
                    .from('stories')
                    .update({
                        story_parts: parts,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', storyId);

                if (error) throw error;
            } else {
                // Create new story
                const { data, error } = await supabase
                    .from('stories')
                    .insert(storyData)
                    .select()
                    .single();

                if (error) throw error;
                if (data) {
                    setStoryId(data.id);
                }
            }
        } catch (error) {
            console.error('Error saving story to database:', error);
        }
    };

    useEffect(() => {
        if (activeProfile && storyParts.length === 0) {
            startStory();
            setStoryId(null); // Reset story ID for new story
        }
    }, [activeProfile?.id]);

    // Auto-save story when parts change
    useEffect(() => {
        if (storyParts.length > 0 && !isAiThinking && activeProfile && user) {
            const autoSaveTimer = setTimeout(() => {
                saveStoryToDatabase();
            }, 2000); // Save after 2 seconds of inactivity
            
            return () => clearTimeout(autoSaveTimer);
        }
    }, [storyParts, isAiThinking, activeProfile, user]);

    const scrollToBottom = () => storyEndRef.current?.scrollIntoView({ behavior: "smooth" });
    useEffect(scrollToBottom, [storyParts, isAiThinking]);

    // Load existing story when contentId is provided
    useEffect(() => {
        const loadExistingStory = async () => {
            if (!contentId || !user || !activeProfile) return;
            
            setIsLoadingStory(true);
            try {
                const { data, error } = await supabase
                    .from('stories')
                    .select('*')
                    .eq('id', contentId)
                    .eq('user_id', user.id)
                    .single();

                if (error) throw error;

                if (data && data.story_parts && Array.isArray(data.story_parts)) {
                    setStoryParts(data.story_parts);
                    setStoryId(data.id);
                }
            } catch (error) {
                console.error('Error loading story:', error);
                setError('שגיאה בטעינת הסיפור');
            } finally {
                setIsLoadingStory(false);
                if (onContentLoaded) onContentLoaded();
            }
        };

        if (contentId) {
            loadExistingStory();
            setShowIntro(false); // Don't show intro for existing stories
        } else {
            // Reset for new story
            setStoryParts([]);
            setStoryId(null);
            setShowIntro(true); // Show intro for new stories
        }
    }, [contentId, user?.id, activeProfile?.id]);

    // Only start new story if no contentId is provided and intro was dismissed
    useEffect(() => {
        if (activeProfile && storyParts.length === 0 && !contentId && !isLoadingStory && !showIntro) {
            startStory();
            setStoryId(null); // Reset story ID for new story
        }
    }, [activeProfile?.id, contentId, showIntro]);

    const generateStoryPart = async (prompt: string, referenceImage: string | null = null, partIndexToUpdate: number | null = null) => {
        if (!activeProfile || !user) return;
        
        // 🔄 Refresh credit costs BEFORE creation to ensure latest prices
        console.log('🔄 StoryCreator: Refreshing credit costs before generation...');
        await refreshCreditCosts();
        
        // Check if user has enough credits (only for new parts, not regeneration)
        if (partIndexToUpdate === null && user.credits < STORY_PART_CREDITS) {
            setError(`אין מספיק קרדיטים. נדרשים ${STORY_PART_CREDITS} קרדיטים, יש לך ${user.credits}.`);
            return;
        }
        
        const currentThinkingIndex = partIndexToUpdate ?? storyParts.length;
        setIsAiThinking(true);
        setThinkingIndex(currentThinkingIndex);
        setError('');
        
        try {
            const schema = {type: Type.OBJECT, properties: {text: {type: Type.STRING}, imagePrompt: {type: Type.STRING}}, required: ["text", "imagePrompt"]};
            const textResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema }});
            if (!textResponse.text) throw new Error("API did not return text.");
            const partData = JSON.parse(textResponse.text.trim());
            
            const imageCharacterPrompt = activeProfile.photo ? `A drawing of a child that looks like the reference photo, consistent character,` : `A drawing of a ${activeProfile.age}-year-old ${activeProfile.gender === 'בת' ? 'girl' : 'boy'},`;
            const imagePrompt = `${imageCharacterPrompt} ${partData.imagePrompt}, beautiful illustration for a children's story book, magical, vibrant colors, detailed, no text`;
            
            const textPart = { text: imagePrompt };
            const imageRequestParts = referenceImage
                ? [{ inlineData: { mimeType: 'image/jpeg', data: referenceImage.split(',')[1] } }, textPart]
                : [textPart];
            
            const imageRequestContents = { parts: imageRequestParts };
            
            const imageResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents: imageRequestContents, config: { responseModalities: [Modality.IMAGE] } });
            const imagePart = imageResponse.candidates?.[0]?.content.parts[0];

            // Validate image data
            if (!imagePart?.inlineData || !imagePart.inlineData.data) {
                console.warn('🟡 StoryCreator: Image generation returned no data');
            }

            const imageUrl = imagePart?.inlineData ? `data:image/png;base64,${imagePart.inlineData.data}` : null;

            const newPart = { author: 'ai', text: partData.text, image: imageUrl };

            if (partIndexToUpdate !== null) {
                setStoryParts(prev => prev.map((part, index) => index === partIndexToUpdate ? newPart : part));
                // Update existing story in database
                await saveStoryToDatabase();
            } else {
                const updatedStoryParts = [...storyParts, newPart];
                setStoryParts(updatedStoryParts);
                // Deduct credits only for new parts (not regeneration)
                const success = await updateUserCredits(-STORY_PART_CREDITS);
                if (success) {
                    console.log(`✅ Credits deducted: ${STORY_PART_CREDITS}. Remaining: ${(user.credits - STORY_PART_CREDITS)}`);
                    // Save story to database
                    await saveStoryToDatabase(updatedStoryParts);
                } else {
                    console.error('❌ Failed to deduct credits');
                }
            }

        } catch (err) {
            console.error(err);
            setError('שגיאה ביצירת המשך הסיפור. נסו שוב.');
        } finally {
            setIsAiThinking(false);
            setThinkingIndex(null);
            setStoryModifier(''); // Reset modifier after use
        }
    };
    
    const buildPrompt = (history: any[], modifier: string) => {
        const storyHistory = history.map(p => `${p.author === 'ai' ? 'המספר' : activeProfile.name}: ${p.text}`).join('\n');
        let prompt;
        if (history.length === 0) { // Starting the story
            prompt = `התחל סיפור הרפתקאות קצר וקסום בעברית עבור ${activeProfile.name}, ${activeProfile.gender} בגיל ${activeProfile.age}, שתחומי העניין שלו/ה הם ${activeProfile.interests}. סיים את החלק הראשון במשפט פתוח שמזמין את הילד/ה להמשיך.`;
        } else { // Continuing the story
            prompt = `זהו סיפור שנכתב בשיתוף פעולה. הנה היסטוריית הסיפור עד כה:\n${storyHistory}\n\nהמשך את הסיפור בצורה יצירתית ומותחת על בסיס התרומה האחרונה של ${activeProfile.name}.`;
             if (modifier) {
                prompt += `\nהנחיה נוספת מהמשתמש: ${modifier}. שלב את ההנחיה הזו באופן טבעי בהמשך הסיפור.`;
            }
            prompt += `\nכתוב את החלק הבא מנקודת מבטו של המספר. סיים במשפט פתוח.`;
        }
        
        prompt += ` צור הנחיית ציור באנגלית לאיור המתאר את הקטע החדש בסיפור.`;
        prompt += ' החזר JSON עם מבנה: "text", "imagePrompt".'
        return prompt;
    };

    const startStory = () => {
        if (!activeProfile) return;
        setStoryParts([]);
        const prompt = buildPrompt([], '');
        generateStoryPart(prompt, activeProfile.photo);
    };

    const handleContinueStory = (e: React.FormEvent, modifier: string = '') => {
        e.preventDefault();
        if (!userInput.trim() || isAiThinking || !activeProfile) return;
        
        const newUserPart = { author: 'user', text: userInput };
        const newStoryHistory = [...storyParts, newUserPart];
        setStoryParts(newStoryHistory);
        setUserInput('');
        
        const prompt = buildPrompt(newStoryHistory, modifier || storyModifier);
        generateStoryPart(prompt, activeProfile.photo);
    };
    
    const handleModifierClick = (modifier: string) => {
        if (!userInput.trim() || isAiThinking) {
             alert("יש לכתוב מה קורה עכשיו לפני שמוסיפים הנחיה.");
             return;
        }
        setStoryModifier(modifier);
        // We can auto-submit, or wait for user to click continue. Let's auto-submit.
        handleContinueStory({ preventDefault: () => {} } as React.FormEvent, modifier);
    }

    const handleRegeneratePart = (index: number) => {
        if (isAiThinking || !activeProfile) return;
        const historyUpToPart = storyParts.slice(0, index);
        const prompt = buildPrompt(historyUpToPart, '');
        generateStoryPart(prompt, activeProfile.photo, index);
    };

    if (!activeProfile) {
        return <div style={styles.centered}><p>יש לבחור פרופיל בדשבורד ההורים כדי ליצור סיפור.</p></div>
    }

    // Show intro screen if no content is loaded and story hasn't started
    if (showIntro && !contentId && storyParts.length === 0 && !isLoadingStory) {
        return (
            <div style={styles.dashboard}>
                <div style={{
                    background: 'linear-gradient(145deg, rgba(26, 46, 26, 0.95), rgba(36, 60, 36, 0.9))',
                    padding: 'clamp(2rem, 6vw, 4rem)',
                    borderRadius: 'var(--border-radius-large)',
                    border: '2px solid var(--glass-border)',
                    boxShadow: 'var(--card-shadow)',
                    backdropFilter: 'blur(15px)',
                    maxWidth: '900px',
                    margin: '0 auto',
                    textAlign: 'center'
                }}>
                    <div style={{fontSize: '5rem', marginBottom: '1.5rem'}}>📚</div>
                    <h1 style={{...styles.mainTitle, marginBottom: '1.5rem'}}>יוצר הסיפורים הקסום</h1>
                    <div style={{
                        background: 'var(--glass-bg)',
                        padding: '2rem',
                        borderRadius: 'var(--border-radius)',
                        border: '1px solid var(--glass-border)',
                        marginBottom: '2rem',
                        textAlign: 'right'
                    }}>
                        <h2 style={{...styles.title, marginTop: 0, marginBottom: '1rem', color: 'var(--primary-light)'}}>✨ איך זה עובד?</h2>
                        <ul style={{
                            listStyle: 'none',
                            padding: 0,
                            margin: 0,
                            color: 'var(--text-light)',
                            lineHeight: '2',
                            fontSize: '1.1rem'
                        }}>
                            <li style={{marginBottom: '1rem'}}>
                                <span style={{fontSize: '1.5rem', marginLeft: '0.5rem'}}>🎨</span>
                                המערכת יוצרת סיפור אינטראקטיבי מותאם אישית ל<b>{activeProfile.name}</b>
                            </li>
                            <li style={{marginBottom: '1rem'}}>
                                <span style={{fontSize: '1.5rem', marginLeft: '0.5rem'}}>✍️</span>
                                הילד/ה כותב/ת מה קורה עכשיו, והבינה המלאכותית ממשיכה את הסיפור עם איור יפה
                            </li>
                            <li style={{marginBottom: '1rem'}}>
                                <span style={{fontSize: '1.5rem', marginLeft: '0.5rem'}}>🔄</span>
                                אפשר להמשיך כמה שרוצים וליצור סיפור ארוך ומרתק
                            </li>
                            <li style={{marginBottom: '1rem'}}>
                                <span style={{fontSize: '1.5rem', marginLeft: '0.5rem'}}>🎁</span>
                                בסוף אפשר להדפיס את הסיפור כספר מאויר!
                            </li>
                        </ul>
                    </div>
                    <div style={{
                        background: 'rgba(127, 217, 87, 0.15)',
                        padding: '1.5rem',
                        borderRadius: 'var(--border-radius)',
                        border: '1px solid var(--primary-color)',
                        marginBottom: '2rem'
                    }}>
                        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '0.5rem'}}>
                            <span style={{fontSize: '1.5rem'}}>💎</span>
                            <h3 style={{margin: 0, color: 'var(--primary-light)'}}>עלות קרדיטים</h3>
                        </div>
                        <p style={{margin: 0, fontSize: '1.2rem', color: 'var(--white)'}}>
                            כל חלק חדש בסיפור (טקסט + איור) עולה <strong style={{color: 'var(--primary-light)', fontSize: '1.5rem'}}>{STORY_PART_CREDITS}</strong> קרדיט{STORY_PART_CREDITS !== 1 ? 'ים' : ''}
                        </p>
                        <p style={{margin: '0.5rem 0 0 0', fontSize: '1rem', color: 'var(--text-light)'}}>
                            הקרדיטים שלך: <strong style={{color: 'var(--primary-light)'}}>{user?.credits ?? 0}</strong>
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            if ((user?.credits ?? 0) < STORY_PART_CREDITS) {
                                alert(`אין מספיק קרדיטים. נדרשים ${STORY_PART_CREDITS} קרדיטים, יש לך ${user?.credits ?? 0}.`);
                                return;
                            }
                            setShowIntro(false);
                            startStory();
                        }}
                        style={{
                            ...styles.button,
                            padding: '1.2rem 3rem',
                            fontSize: '1.3rem',
                            fontWeight: 'bold',
                            background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
                            boxShadow: '0 8px 25px rgba(127, 217, 87, 0.4)',
                            minWidth: '250px'
                        }}
                        disabled={(user?.credits ?? 0) < STORY_PART_CREDITS}
                    >
                        {user && user.credits < STORY_PART_CREDITS 
                            ? `❌ חסרים ${STORY_PART_CREDITS - user.credits} קרדיטים`
                            : '🚀 בואו נתחיל לכתוב סיפור!'}
                    </button>
                    {user && user.credits < STORY_PART_CREDITS && (
                        <p style={{marginTop: '1rem', color: 'var(--error-color)', fontSize: '0.9rem'}}>
                            פנה למנהל המערכת לקבלת קרדיטים נוספים
                        </p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div style={styles.storyView}>
            <div style={styles.storyHeader} className="no-print">
                 <h1 style={styles.mainTitle}>{storyTitle}</h1>
                 <button onClick={() => window.print()} style={styles.button}>ייצא ל-PDF</button>
            </div>
            <div style={{...styles.storyContent, ...styles.card}} className="printable-area">
                 <div className="print-title-page">
                    <h1>{storyTitle}</h1>
                    <h2>מאת: {activeProfile.name} והבינה המלאכותית</h2>
                </div>
                {storyParts.map((part, index) => (
                    <div key={index}>
                        {part.author === 'user' ? (
                             <div style={styles.userStoryPart} className="fade-in print-story-part">
                                <p style={styles.storyText}>{activeProfile.name}: {part.text}</p>
                             </div>
                        ) : (
                             <div style={styles.aiStoryPart} className="fade-in print-story-part">
                                {thinkingIndex === index ? (
                                    <Loader message="רוקם חלומות למילים וצבעים..." />
                                ) : (
                                    <>
                                        {part.image && <img src={part.image} alt="איור לסיפור" style={styles.storyImage} className="print-story-image"/>}
                                        <p style={styles.storyText}>{part.text}</p>
                                        <div style={styles.storyActions} className="no-print">
                                            <button onClick={() => speakText(part.text)} title="הקרא" style={styles.iconButton}>🔊</button>
                                            <button onClick={() => handleRegeneratePart(index)} title="נסה שוב" style={styles.iconButton} disabled={isAiThinking}>🔄</button>
                                        </div>
                                    </>
                                )}
                             </div>
                        )}
                    </div>
                ))}
                {isAiThinking && thinkingIndex === storyParts.length && (
                    <div style={styles.aiStoryPart}>
                        <Loader message="ממציא את ההרפתקה הבאה..." />
                    </div>
                )}
                <div ref={storyEndRef} />
            </div>
            <form onSubmit={handleContinueStory} style={styles.storyInputForm} className="no-print">
                <input type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)} style={{...styles.input, flex: 1}} placeholder="מה קורה עכשיו?" disabled={isAiThinking}/>
                 <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap'}}>
                    <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'var(--glass-bg)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--glass-border)'}}>
                        <span style={{fontSize: '0.9rem', color: 'var(--text-secondary)'}}>💎 קרדיטים: {user?.credits ?? 0}</span>
                        <span style={{fontSize: '0.85rem', color: 'var(--warning-color)'}}>(יוציא {STORY_PART_CREDITS})</span>
                    </div>
                    <button type="button" onClick={() => handleModifierClick('הפוך את זה לקסום יותר')} style={{...styles.button, background: 'var(--primary-light)', color: 'var(--background-dark)'}} title="הפוך לקסום יותר" disabled={isAiThinking}>✨</button>
                    <button type="button" onClick={() => handleModifierClick('הוסף יותר אקשן ומתח')} style={{...styles.button, background: 'var(--warning-color)', color: 'var(--background-dark)'}} title="הוסף אקשן" disabled={isAiThinking}>🚀</button>
                    <button type="button" onClick={() => handleModifierClick('הפוך את זה למצחיק')} style={{...styles.button, background: 'var(--success-color)', color: 'var(--background-dark)'}} title="הפוך למצחיק" disabled={isAiThinking}>😂</button>
                    <button type="submit" style={styles.button} disabled={isAiThinking || !userInput.trim() || (user?.credits ?? 0) < STORY_PART_CREDITS}>המשך</button>
                </div>
            </form>
            {error && <p style={styles.error}>{error}</p>}
        </div>
    );
};

export default StoryCreator;