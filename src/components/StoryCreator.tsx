import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { useAppContext } from './AppContext';
import { supabase } from '../supabaseClient';
import { speakText } from '../../helpers';
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
    const [storyModifier, setStoryModifier] = useState('');
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [thinkingIndex, setThinkingIndex] = useState<number | null>(null);
    const [error, setError] = useState('');
    const [showIntro, setShowIntro] = useState(true);
    const storyEndRef = useRef<HTMLDivElement>(null);
    const [storyId, setStoryId] = useState<number | null>(contentId || null);
    const [isLoadingStory, setIsLoadingStory] = useState(false);
    const [storyTitle, setStoryTitle] = useState<string>('');
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [isGeneratingTitleSuggestions, setIsGeneratingTitleSuggestions] = useState(false);
    const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);

    // Get API key from user (if assigned) or fallback to global
    const userApiKey = getUserAPIKey();
    const apiKey = userApiKey || process.env.API_KEY || '';
    
    // Create AI instance with current API key - will update when API key changes
    const ai = useMemo(() => {
    if (!apiKey) {
            console.error('🔴 StoryCreator: No API key available (neither user key nor global)');
            console.error('🔴 Check vite.config.ts and .env.production file, or assign API key to user');
            return new GoogleGenAI({ apiKey: '' }); // Create empty instance as fallback
        }
        
        if (userApiKey) {
            console.log('✅ StoryCreator: Using user API key (length:', apiKey.length, ')');
        } else {
            console.log('✅ StoryCreator: Using global API key (length:', apiKey.length, ')');
        }
        
        return new GoogleGenAI({ apiKey });
    }, [apiKey, userApiKey]);
    
    const STORY_PART_CREDITS = creditCosts.story_part; // דינמי מההגדרות
    const storyBookRef = useRef<HTMLDivElement>(null);
    
    // Initialize story title
    useEffect(() => {
        if (!storyTitle && activeProfile) {
            setStoryTitle(`הרפתקאות ${activeProfile.name}`);
        }
    }, [activeProfile, storyTitle]);
    
    // Generate title suggestions
    const generateTitleSuggestions = async () => {
        if (!activeProfile || storyParts.length === 0 || isGeneratingTitleSuggestions) return;
        
        setIsGeneratingTitleSuggestions(true);
        try {
            const prompt = `You are a creative children's book title generator. Based on the following story parts, suggest 3 creative, engaging Hebrew titles for a children's book.

Story parts:
${storyParts.slice(0, 3).map((p, i) => `Part ${i + 1}: ${p.text.substring(0, 200)}`).join('\n')}

Child's name: ${activeProfile.name}
Child's age: ${activeProfile.age}
Child's interests: ${activeProfile.interests}

Return ONLY a JSON array of exactly 3 title suggestions in Hebrew, nothing else. Format: ["Title 1", "Title 2", "Title 3"]`;

            const schema = { type: Type.ARRAY, items: { type: Type.STRING } };
            const response = await ai.models.generateContent({ 
                model: 'gemini-2.5-flash', 
                contents: prompt, 
                config: { responseMimeType: "application/json", responseSchema: schema } 
            });
            
            if (response.text) {
                const suggestions = JSON.parse(response.text.trim());
                setTitleSuggestions(Array.isArray(suggestions) ? suggestions.slice(0, 3) : []);
            }
        } catch (error) {
            console.error('Error generating title suggestions:', error);
        } finally {
            setIsGeneratingTitleSuggestions(false);
        }
    };

    // Export to PDF with high quality - each page separately
    const exportToPDF = async () => {
        if (!storyBookRef.current || !activeProfile || storyParts.length === 0) return;
        
        try {
            const loadingMessage = '📄 מייצא את הסיפור ל-PDF...';
            const loadingElement = document.createElement('div');
            loadingElement.textContent = loadingMessage;
            loadingElement.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.8); color: white; padding: 2rem; border-radius: 12px; z-index: 10000; font-size: 1.2rem;';
            document.body.appendChild(loadingElement);

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pageWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm

            // Get all story pages (cover + story pages)
            const pages = storyBookRef.current.querySelectorAll('.story-cover-page, .story-page');
            
            if (pages.length === 0) {
                alert('לא נמצאו דפים לייצוא');
                document.body.removeChild(loadingElement);
                return;
            }

            for (let i = 0; i < pages.length; i++) {
                const page = pages[i] as HTMLElement;
                
                // Wait for images in this page to load
                const images = page.querySelectorAll('img');
                await Promise.all(Array.from(images).map(img => {
                    if ((img as HTMLImageElement).complete) return Promise.resolve();
                    return new Promise((resolve) => {
                        (img as HTMLImageElement).onload = resolve;
                        (img as HTMLImageElement).onerror = resolve;
                        setTimeout(resolve, 2000);
                    });
                }));

                // Create a temporary container for this page with fixed dimensions
                const tempContainer = document.createElement('div');
                tempContainer.style.cssText = `
                    position: absolute;
                    left: -9999px;
                    top: 0;
                    width: 210mm;
                    min-height: 297mm;
                    background: white;
                    padding: 0;
                    margin: 0;
                `;
                
                // Clone the page and set its dimensions
                const clonedPage = page.cloneNode(true) as HTMLElement;
                clonedPage.style.cssText = `
                    width: 100%;
                    min-height: 297mm;
                    background: white;
                    padding: 3rem;
                    margin: 0;
                    box-sizing: border-box;
                `;
                
                tempContainer.appendChild(clonedPage);
                document.body.appendChild(tempContainer);

                // Wait a bit for layout to settle
                await new Promise(resolve => setTimeout(resolve, 100));

                // Capture this page
                const canvas = await html2canvas(tempContainer, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff',
                    windowWidth: 794, // A4 width in pixels at 96 DPI
                    windowHeight: 1123, // A4 height in pixels at 96 DPI
                    width: tempContainer.scrollWidth,
                    height: tempContainer.scrollHeight
                });

                document.body.removeChild(tempContainer);

                const imgData = canvas.toDataURL('image/png', 1.0);
                const imgHeight = (canvas.height * pageWidth) / canvas.width;

                // Add new page if not first
                if (i > 0) {
                    pdf.addPage();
                }

                // Fit image to page
                if (imgHeight <= pageHeight) {
                    // Image fits on one page - center it
                    const yPosition = (pageHeight - imgHeight) / 2;
                    pdf.addImage(imgData, 'PNG', 0, yPosition, pageWidth, imgHeight);
                } else {
                    // Image is taller than page - split it
                    let sourceY = 0;
                    let remainingHeight = imgHeight;
                    let currentPage = 0;
                    
                    while (remainingHeight > 0) {
                        if (currentPage > 0) {
                            pdf.addPage();
                        }
                        
                        const pageImgHeight = Math.min(remainingHeight, pageHeight);
                        const sourceHeight = (pageImgHeight / imgHeight) * canvas.height;
                        
                        // Create a canvas for this page portion
                        const pageCanvas = document.createElement('canvas');
                        pageCanvas.width = canvas.width;
                        pageCanvas.height = sourceHeight;
                        const ctx = pageCanvas.getContext('2d');
                        if (ctx) {
                            ctx.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight);
                            const pageImgData = pageCanvas.toDataURL('image/png', 1.0);
                            pdf.addImage(pageImgData, 'PNG', 0, 0, pageWidth, pageImgHeight);
                        }
                        
                        sourceY += sourceHeight;
                        remainingHeight -= pageImgHeight;
                        currentPage++;
                    }
                }

                // Update loading message
                loadingElement.textContent = `📄 מייצא דף ${i + 1} מתוך ${pages.length}...`;
            }

            // Save PDF
            pdf.save(`${storyTitle || 'סיפור'}_${activeProfile.name}.pdf`);
            document.body.removeChild(loadingElement);
        } catch (error) {
            console.error('Error exporting to PDF:', error);
            alert('שגיאה בייצוא PDF. נסה שוב.');
            const loadingElement = document.querySelector('[style*="z-index: 10000"]');
            if (loadingElement) document.body.removeChild(loadingElement);
        }
    };

    // Save story to database
    const saveStoryToDatabase = async (partsToSave?: any[]) => {
        if (!activeProfile || !user) return;
        
        const parts = partsToSave || storyParts;
        if (parts.length === 0) return;

        try {
            const storyData = {
                user_id: user.id,
                profile_id: activeProfile.id,
                title: storyTitle || `הרפתקאות ${activeProfile.name}`,
                story_parts: parts
            };

            if (storyId) {
                // Update existing story
                const { error } = await supabase
                    .from('stories')
                    .update({
                        title: storyTitle || `הרפתקאות ${activeProfile.name}`,
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
                    if (data.title) {
                        setStoryTitle(data.title);
                    }
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
            
            // Use photo_url from profile if available, otherwise use photo (deprecated)
            const profilePhoto = activeProfile.photo_url || activeProfile.photo;
            
            const imageCharacterPrompt = profilePhoto ? `A drawing of a child that looks like the reference photo, consistent character, maintaining facial features from the reference,` : `A drawing of a ${activeProfile.age}-year-old ${activeProfile.gender === 'בת' ? 'girl' : 'boy'},`;
            const imagePrompt = `${imageCharacterPrompt} ${partData.imagePrompt}, beautiful illustration for a children's story book, magical, vibrant colors, detailed, no text`;
            
            // Load reference image if photo_url exists
            let referenceImageData = referenceImage;
            if (!referenceImageData && profilePhoto) {
                try {
                    // If photo_url is a URL, fetch it and convert to base64
                    if (profilePhoto.startsWith('http') || profilePhoto.startsWith('https')) {
                        const response = await fetch(profilePhoto);
                        const blob = await response.blob();
                        const reader = new FileReader();
                        referenceImageData = await new Promise<string>((resolve) => {
                            reader.onloadend = () => resolve(reader.result as string);
                            reader.readAsDataURL(blob);
                        });
                    } else if (profilePhoto.startsWith('data:')) {
                        referenceImageData = profilePhoto;
                    } else {
                        // Try to get from Supabase Storage
                        const { data: photoData } = supabase.storage
                            .from('profile-photos')
                            .getPublicUrl(profilePhoto);
                        if (photoData?.publicUrl) {
                            const response = await fetch(photoData.publicUrl);
                            const blob = await response.blob();
                            const reader = new FileReader();
                            referenceImageData = await new Promise<string>((resolve) => {
                                reader.onloadend = () => resolve(reader.result as string);
                                reader.readAsDataURL(blob);
                            });
                        }
                    }
                } catch (error) {
                    console.warn('Could not load profile photo for reference:', error);
                    referenceImageData = null;
                }
            }
            
            const textPart = { text: imagePrompt };
            const imageRequestParts = referenceImageData && referenceImageData.startsWith('data:')
                ? [{ inlineData: { mimeType: 'image/jpeg', data: referenceImageData.split(',')[1] } }, textPart]
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
        const profilePhoto = activeProfile.photo_url || activeProfile.photo;
        generateStoryPart(prompt, profilePhoto);
    };

    const handleContinueStory = (e: React.FormEvent, modifier: string = '') => {
        e.preventDefault();
        if (!userInput.trim() || isAiThinking || !activeProfile) return;
        
        const newUserPart = { author: 'user', text: userInput };
        const newStoryHistory = [...storyParts, newUserPart];
        setStoryParts(newStoryHistory);
        setUserInput('');
        
        const prompt = buildPrompt(newStoryHistory, modifier || storyModifier);
        const profilePhoto = activeProfile.photo_url || activeProfile.photo;
        generateStoryPart(prompt, profilePhoto);
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
        const profilePhoto = activeProfile.photo_url || activeProfile.photo;
        generateStoryPart(prompt, profilePhoto, index);
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
                <div style={{display: 'flex', alignItems: 'center', gap: '1rem', flex: 1}}>
                    {isEditingTitle ? (
                        <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1}}>
                            <input
                                type="text"
                                value={storyTitle}
                                onChange={(e) => setStoryTitle(e.target.value)}
                                onBlur={() => setIsEditingTitle(false)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        setIsEditingTitle(false);
                                        if (storyTitle.trim()) {
                                            saveStoryToDatabase();
                                        }
                                    }
                                }}
                                style={{
                                    ...styles.input,
                                    flex: 1,
                                    fontSize: '1.5rem',
                                    fontWeight: 'bold',
                                    padding: '0.5rem 1rem',
                                    background: 'var(--glass-bg)',
                                    border: '2px solid var(--primary-color)',
                                    borderRadius: '12px'
                                }}
                                autoFocus
                            />
                            <button
                                onClick={() => {
                                    setIsEditingTitle(false);
                                    if (storyTitle.trim()) {
                                        saveStoryToDatabase();
                                    } else {
                                        setStoryTitle(`הרפתקאות ${activeProfile?.name}`);
                                    }
                                }}
                                style={styles.button}
                            >
                                ✓
                            </button>
                        </div>
                    ) : (
                        <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1}}>
                            <h1 
                                style={{...styles.mainTitle, cursor: 'pointer', margin: 0}}
                                onClick={() => setIsEditingTitle(true)}
                                title="לחץ לעריכה"
                            >
                                {storyTitle || `הרפתקאות ${activeProfile?.name}`}
                            </h1>
                            <button
                                onClick={() => setIsEditingTitle(true)}
                                style={{
                                    ...styles.iconButton,
                                    fontSize: '1rem',
                                    padding: '0.3rem 0.6rem'
                                }}
                                title="ערוך שם סיפור"
                            >
                                ✏️
                            </button>
                            {storyParts.length >= 2 && (
                                <button
                                    onClick={generateTitleSuggestions}
                                    style={{
                                        ...styles.button,
                                        background: 'var(--primary-light)',
                                        color: 'var(--background-dark)',
                                        fontSize: '0.9rem',
                                        padding: '0.5rem 1rem'
                                    }}
                                    disabled={isGeneratingTitleSuggestions}
                                    title="קבל הצעות לשם"
                                >
                                    {isGeneratingTitleSuggestions ? '⏳' : '💡 הצעות'}
                                </button>
                            )}
                        </div>
                    )}
                    {titleSuggestions.length > 0 && !isEditingTitle && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            marginTop: '0.5rem',
                            background: 'var(--glass-bg)',
                            border: '2px solid var(--primary-color)',
                            borderRadius: '12px',
                            padding: '1rem',
                            zIndex: 1000,
                            minWidth: '300px',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
                        }}>
                            <h3 style={{margin: '0 0 0.5rem 0', color: 'var(--white)', fontSize: '1rem'}}>הצעות לשם:</h3>
                            {titleSuggestions.map((suggestion, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setStoryTitle(suggestion);
                                        setTitleSuggestions([]);
                                        saveStoryToDatabase();
                                    }}
                                    style={{
                                        ...styles.button,
                                        display: 'block',
                                        width: '100%',
                                        marginBottom: '0.5rem',
                                        textAlign: 'right',
                                        background: 'var(--primary-color)',
                                        color: 'var(--background-dark)',
                                        fontSize: '1rem',
                                        padding: '0.75rem 1rem'
                                    }}
                                >
                                    {suggestion}
                                </button>
                            ))}
                            <button
                                onClick={() => setTitleSuggestions([])}
                                style={{
                                    ...styles.button,
                                    width: '100%',
                                    background: 'var(--glass-bg)',
                                    color: 'var(--text-light)',
                                    fontSize: '0.9rem',
                                    padding: '0.5rem'
                                }}
                            >
                                ✖️ סגור
                            </button>
            </div>
                    )}
                </div>
                <button onClick={exportToPDF} style={styles.button} disabled={storyParts.length === 0}>
                     📄 ייצא ל-PDF
                </button>
            </div>
            <div ref={storyBookRef} style={{
                flex: 1,
                overflowY: 'auto',
                padding: '2rem',
                background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                minHeight: 'calc(100vh - 200px)'
            }} className="story-book-container">
                {/* Cover Page */}
                {storyParts.length > 0 && (
                    <div style={{
                        minHeight: '100vh',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '20px',
                        padding: '4rem',
                        marginBottom: '2rem',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                        color: 'white',
                        textAlign: 'center'
                    }} className="story-cover-page">
                        <h1 style={{
                            fontSize: '4rem',
                            fontFamily: 'var(--font-serif)',
                            fontWeight: 'bold',
                            marginBottom: '2rem',
                            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
                        }}>{storyTitle || `הרפתקאות ${activeProfile?.name}`}</h1>
                        <h2 style={{
                            fontSize: '2rem',
                            fontFamily: 'var(--font-serif)',
                            fontWeight: 'normal',
                            marginTop: '2rem',
                            opacity: 0.9
                        }}>מאת: {activeProfile?.name}</h2>
                        <p style={{
                            fontSize: '1.2rem',
                            marginTop: '1rem',
                            opacity: 0.8
                        }}>נוצר בעזרת בינה מלאכותית</p>
                    </div>
                )}

                {/* Story Pages - Each part is a page */}
                {storyParts.map((part, index) => {
                    if (part.author === 'user') return null; // Skip user parts in book view
                    
                    return (
                        <div key={index} style={{
                            minHeight: '100vh',
                            display: 'flex',
                            flexDirection: 'column',
                            background: 'white',
                            borderRadius: '20px',
                            padding: '3rem',
                            marginBottom: '2rem',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                            pageBreakAfter: 'always',
                            position: 'relative'
                        }} className="story-page fade-in">
                            {/* Page Number */}
                            <div style={{
                                position: 'absolute',
                                bottom: '2rem',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                fontSize: '0.9rem',
                                color: '#999',
                                fontFamily: 'var(--font-serif)'
                            }}>
                                {index + 1}
                             </div>

                                {thinkingIndex === index ? (
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    minHeight: '80vh',
                                    flexDirection: 'column'
                                }}>
                                    <Loader message="רוקם חלומות למילים וצבעים..." />
                                </div>
                                ) : (
                                    <>
                                    {/* Image takes top half of page */}
                                    {part.image && (
                                        <div style={{
                                            width: '100%',
                                            height: '50vh',
                                            marginBottom: '2rem',
                                            borderRadius: '16px',
                                            overflow: 'hidden',
                                            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                                            background: '#f0f0f0'
                                        }}>
                                            <img 
                                                src={part.image} 
                                                alt="איור לסיפור" 
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                    display: 'block'
                                                }}
                                            />
                                        </div>
                                    )}
                                    
                                    {/* Text takes bottom half */}
                                    <div style={{
                                        flex: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        padding: '2rem',
                                        background: 'linear-gradient(to bottom, rgba(255,255,255,0.9), rgba(255,255,255,0.7))',
                                        borderRadius: '16px',
                                        border: '2px solid #f0f0f0'
                                    }}>
                                        <p style={{
                                            fontSize: '1.8rem',
                                            lineHeight: 2,
                                            color: '#333',
                                            fontFamily: 'var(--font-serif)',
                                            textAlign: 'right',
                                            whiteSpace: 'pre-wrap',
                                            margin: 0
                                        }}>{part.text}</p>
                                    </div>

                                    {/* Actions - only visible on screen */}
                                        <div style={styles.storyActions} className="no-print">
                                            <button onClick={() => speakText(part.text)} title="הקרא" style={styles.iconButton}>🔊</button>
                                            <button onClick={() => handleRegeneratePart(index)} title="נסה שוב" style={styles.iconButton} disabled={isAiThinking}>🔄</button>
                                        </div>
                                    </>
                                )}
                             </div>
                    );
                })}
                
                {isAiThinking && thinkingIndex === storyParts.length && (
                    <div style={{
                        minHeight: '100vh',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        background: 'white',
                        borderRadius: '20px',
                        padding: '3rem',
                        marginBottom: '2rem',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
                    }}>
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