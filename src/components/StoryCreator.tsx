import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { useAppContext } from './AppContext';
import { speakText } from '../../helpers';
import { styles } from '../../styles';
import Loader from './Loader';

const StoryCreator = () => {
    const { activeProfile } = useAppContext();
    const [storyParts, setStoryParts] = useState<any[]>([]);
    const [userInput, setUserInput] = useState('');
    const [storyModifier, setStoryModifier] = useState('');
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [thinkingIndex, setThinkingIndex] = useState<number | null>(null);
    const [error, setError] = useState('');
    const storyEndRef = useRef<HTMLDivElement>(null);

    const apiKey = process.env.API_KEY || '';
    if (!apiKey) {
        console.error('🔴 StoryCreator: API_KEY environment variable is not set');
    }
    const ai = new GoogleGenAI({ apiKey });
    const storyTitle = `הרפתקאות ${activeProfile?.name}`;

    useEffect(() => {
        if (activeProfile && storyParts.length === 0) {
            startStory();
        }
    }, [activeProfile?.id]);

    const scrollToBottom = () => storyEndRef.current?.scrollIntoView({ behavior: "smooth" });
    useEffect(scrollToBottom, [storyParts, isAiThinking]);
    
    const generateStoryPart = async (prompt: string, referenceImage: string | null = null, partIndexToUpdate: number | null = null) => {
        if (!activeProfile) return;
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
            } else {
                setStoryParts(prev => [...prev, newPart]);
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
                 <div style={{ display: 'flex', gap: '0.5rem'}}>
                    <button type="button" onClick={() => handleModifierClick('הפוך את זה לקסום יותר')} style={{...styles.button, background: 'var(--primary-light)', color: 'var(--background-dark)'}} title="הפוך לקסום יותר" disabled={isAiThinking}>✨</button>
                    <button type="button" onClick={() => handleModifierClick('הוסף יותר אקשן ומתח')} style={{...styles.button, background: 'var(--warning-color)', color: 'var(--background-dark)'}} title="הוסף אקשן" disabled={isAiThinking}>🚀</button>
                    <button type="button" onClick={() => handleModifierClick('הפוך את זה למצחיק')} style={{...styles.button, background: 'var(--success-color)', color: 'var(--background-dark)'}} title="הפוך למצחיק" disabled={isAiThinking}>😂</button>
                    <button type="submit" style={styles.button} disabled={isAiThinking || !userInput.trim()}>המשך</button>
                </div>
            </form>
            {error && <p style={styles.error}>{error}</p>}
        </div>
    );
};

export default StoryCreator;