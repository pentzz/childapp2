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
    const [showTitleModal, setShowTitleModal] = useState(false);
    const [initialStoryTitle, setInitialStoryTitle] = useState<string>('');
    const [isGeneratingInitialTitles, setIsGeneratingInitialTitles] = useState(false);
    const [initialTitleSuggestions, setInitialTitleSuggestions] = useState<string[]>([]);

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
    
    // Generate initial title suggestions before story creation
    const generateInitialTitleSuggestions = async () => {
        if (!activeProfile || isGeneratingInitialTitles) return;
        
        setIsGeneratingInitialTitles(true);
        try {
            const prompt = `You are a creative children's book title generator. Based on the following child profile, suggest 5 creative, engaging Hebrew titles for a children's story book.

Child's name: ${activeProfile.name}
Child's age: ${activeProfile.age}
Child's gender: ${activeProfile.gender}
Child's interests: ${activeProfile.interests}
Child's learning goals: ${activeProfile.learningGoals || 'לא מוגדר'}

Create titles that:
- Are engaging and magical for children
- Relate to the child's interests: ${activeProfile.interests}
- Are age-appropriate for ${activeProfile.age} years old
- Include the child's name or relate to their personality
- Are creative and inspire curiosity

Return ONLY a JSON array of exactly 5 title suggestions in Hebrew, nothing else. Format: ["Title 1", "Title 2", "Title 3", "Title 4", "Title 5"]`;

            const schema = { type: Type.ARRAY, items: { type: Type.STRING } };
            const response = await ai.models.generateContent({ 
                model: 'gemini-2.5-flash', 
                contents: prompt, 
                config: { responseMimeType: "application/json", responseSchema: schema } 
            });
            
            if (response.text) {
                const suggestions = JSON.parse(response.text.trim());
                setInitialTitleSuggestions(Array.isArray(suggestions) ? suggestions.slice(0, 5) : []);
            }
        } catch (error) {
            console.error('Error generating initial title suggestions:', error);
        } finally {
            setIsGeneratingInitialTitles(false);
        }
    };
    
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

    // Export to PDF with high quality - simplified and fixed
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

            // Filter only AI story parts (skip user parts)
            const aiStoryParts = storyParts.filter(part => part.author === 'ai');
            
            // Get cover page and story pages
            const coverPage = storyBookRef.current.querySelector('.story-cover-page');
            const storyPages = storyBookRef.current.querySelectorAll('.story-page');
            
            const totalPages = (coverPage ? 1 : 0) + storyPages.length;
            
            if (totalPages === 0) {
                alert('לא נמצאו דפים לייצוא');
                document.body.removeChild(loadingElement);
                return;
            }

            let pdfPageIndex = 0;

            // Export elegant cover page
            if (coverPage) {
                loadingElement.textContent = `📄 מייצא דף כריכה אלגנטי...`;
                
                const images = coverPage.querySelectorAll('img');
                await Promise.all(Array.from(images).map(img => {
                    if ((img as HTMLImageElement).complete) return Promise.resolve();
                    return new Promise((resolve) => {
                        (img as HTMLImageElement).onload = resolve;
                        (img as HTMLImageElement).onerror = resolve;
                        setTimeout(resolve, 2000);
                    });
                }));

                const tempContainer = document.createElement('div');
                tempContainer.style.cssText = 'position: absolute; left: -9999px; width: 210mm; height: 297mm; background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);';
                
                const clonedCover = coverPage.cloneNode(true) as HTMLElement;
                clonedCover.style.cssText = 'width: 100%; height: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%); display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 4rem; box-sizing: border-box; position: relative; overflow: hidden;';
                tempContainer.appendChild(clonedCover);
                document.body.appendChild(tempContainer);

                await new Promise(resolve => setTimeout(resolve, 300));

                const canvas = await html2canvas(tempContainer, {
                    scale: 3,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#667eea',
                    width: 794,
                    height: 1123,
                    allowTaint: true
                });

                document.body.removeChild(tempContainer);

                const imgData = canvas.toDataURL('image/png', 1.0);
                const imgHeight = (canvas.height * pageWidth) / canvas.width;
                const imgHeightMM = Math.min(imgHeight, pageHeight);

                pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, imgHeightMM);
                pdfPageIndex++;
            }

            // Export story pages - one per AI part with high quality and proper aspect ratio
            for (let i = 0; i < storyPages.length; i++) {
                const page = storyPages[i] as HTMLElement;
                
                loadingElement.textContent = `📄 מייצא דף ${i + 1} מתוך ${storyPages.length}...`;
                
                // Wait for all images to load
                const images = page.querySelectorAll('img');
                await Promise.all(Array.from(images).map(img => {
                    if ((img as HTMLImageElement).complete) return Promise.resolve();
                    return new Promise((resolve) => {
                        (img as HTMLImageElement).onload = resolve;
                        (img as HTMLImageElement).onerror = resolve;
                        setTimeout(resolve, 3000);
                    });
                }));

                // Create temporary container with proper dimensions
                const tempContainer = document.createElement('div');
                tempContainer.style.cssText = 'position: absolute; left: -9999px; width: 210mm; height: 297mm; background: white; padding: 0; margin: 0;';
                
                // Clone the page and preserve its structure
                const clonedPage = page.cloneNode(true) as HTMLElement;
                
                // Preserve image aspect ratios by setting max-width and max-height
                const clonedImages = clonedPage.querySelectorAll('img');
                clonedImages.forEach((img: HTMLImageElement) => {
                    img.style.maxWidth = '100%';
                    img.style.maxHeight = '50vh';
                    img.style.width = 'auto';
                    img.style.height = 'auto';
                    img.style.objectFit = 'contain';
                    img.style.display = 'block';
                });
                
                clonedPage.style.cssText = `
                    width: 100%;
                    min-height: 100%;
                    background: white;
                    padding: 2.5rem;
                    display: flex;
                    flex-direction: column;
                    box-sizing: border-box;
                    font-size: 1.1rem;
                    line-height: 1.6;
                `;
                
                tempContainer.appendChild(clonedPage);
                document.body.appendChild(tempContainer);

                // Wait for rendering
                await new Promise(resolve => setTimeout(resolve, 500));

                // Capture with high quality
                const canvas = await html2canvas(tempContainer, {
                    scale: 3, // Higher quality for better text and images
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff',
                    width: 794, // A4 width in pixels at 96 DPI
                    height: 1123, // A4 height in pixels at 96 DPI
                    allowTaint: true,
                    removeContainer: true,
                    windowWidth: 794,
                    windowHeight: 1123,
                    onclone: (clonedDoc) => {
                        // Ensure images are loaded in cloned document
                        const clonedImgs = clonedDoc.querySelectorAll('img');
                        clonedImgs.forEach((img: HTMLImageElement) => {
                            img.style.maxWidth = '100%';
                            img.style.maxHeight = '45vh';
                            img.style.width = 'auto';
                            img.style.height = 'auto';
                            img.style.objectFit = 'contain';
                        });
                    }
                });

                document.body.removeChild(tempContainer);

                // Calculate proper dimensions maintaining aspect ratio
                const canvasAspectRatio = canvas.width / canvas.height;
                const pageAspectRatio = pageWidth / pageHeight;
                
                let imgWidth = pageWidth;
                let imgHeight = pageHeight;
                
                // Maintain aspect ratio without stretching
                if (canvasAspectRatio > pageAspectRatio) {
                    // Canvas is wider - fit to width
                    imgHeight = (canvas.height * pageWidth) / canvas.width;
                } else {
                    // Canvas is taller - fit to height
                    imgWidth = (canvas.width * pageHeight) / canvas.height;
                }

                const imgData = canvas.toDataURL('image/png', 1.0); // Maximum quality

                pdf.addPage();
                // Center the image on the page if needed
                const xOffset = (pageWidth - imgWidth) / 2;
                const yOffset = (pageHeight - imgHeight) / 2;
                pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgWidth, imgHeight, undefined, 'FAST');
                pdfPageIndex++;
            }

            // Save PDF
            pdf.save(`${storyTitle || 'סיפור'}_${activeProfile.name}.pdf`);
            document.body.removeChild(loadingElement);
        } catch (error) {
            console.error('Error exporting to PDF:', error);
            alert(`שגיאה בייצוא PDF: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}`);
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

    // Generate initial title suggestions when intro is shown
    useEffect(() => {
        if (showIntro && activeProfile && initialTitleSuggestions.length === 0 && !isGeneratingInitialTitles) {
            generateInitialTitleSuggestions();
        }
    }, [showIntro, activeProfile?.id]);

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
            // Build comprehensive character description
            const characterDescription = `${activeProfile.name} הוא ${activeProfile.gender} בגיל ${activeProfile.age}`;
            const interestsDescription = activeProfile.interests ? `תחומי העניין שלו/ה: ${activeProfile.interests}` : '';
            const learningGoalsDescription = activeProfile.learningGoals ? `מטרות למידה: ${activeProfile.learningGoals}` : '';
            const storyTitleContext = storyTitle ? `הסיפור נקרא: "${storyTitle}"` : '';
            
            prompt = `אתה סופר מקצועי של ספרי ילדים. צור סיפור הרפתקאות קסום ומותאם אישית בעברית.

${storyTitleContext}
${characterDescription}. ${interestsDescription}${learningGoalsDescription ? `. ${learningGoalsDescription}` : ''}

הנחיות לסיפור:
- הסיפור צריך להתייחס לשם הסיפור: "${storyTitle || `הרפתקאות ${activeProfile.name}`}"
- הסיפור צריך להתאים לאופי של ${activeProfile.name} ולחשוב על ${activeProfile.interests || 'תחומי עניין כלליים'}
- הסיפור צריך להיות מותאם לגיל ${activeProfile.age}
- הסיפור צריך להיות קסום, מרגש ומעורר דמיון
- הסיפור צריך להיות אינטראקטיבי - מזמין את הילד/ה להמשיך
- כתוב את החלק הראשון של הסיפור (3-4 משפטים) שמציג את הדמות הראשית (${activeProfile.name}) ואת ההרפתקה שמתחילה
- סיים את החלק הראשון במשפט פתוח ומזמין שמזמין את הילד/ה להמשיך את הסיפור`;
        } else { // Continuing the story
            prompt = `זהו סיפור שנכתב בשיתוף פעולה. הנה היסטוריית הסיפור עד כה:\n${storyHistory}\n\nהמשך את הסיפור בצורה יצירתית ומותחת על בסיס התרומה האחרונה של ${activeProfile.name}.`;
             if (modifier) {
                prompt += `\nהנחיה נוספת מהמשתמש: ${modifier}. שלב את ההנחיה הזו באופן טבעי בהמשך הסיפור.`;
            }
            prompt += `\nכתוב את החלק הבא מנקודת מבטו של המספר. שמור על המשכיות עם הסיפור. סיים במשפט פתוח.`;
        }
        
        prompt += `\n\nצור הנחיית ציור באנגלית לאיור המתאר את הקטע החדש בסיפור. האיור צריך להיות מותאם לילד/ה ${activeProfile.name} (${activeProfile.age} שנים, ${activeProfile.gender}) ותחומי העניין שלו/ה: ${activeProfile.interests || 'תחומי עניין כלליים'}.`;
        prompt += '\nהחזר JSON עם מבנה: "text", "imagePrompt".'
        return prompt;
    };

    const startStory = (customTitle?: string) => {
        if (!activeProfile) return;
        if (customTitle) {
            setStoryTitle(customTitle);
        } else if (!storyTitle) {
            setStoryTitle(`הרפתקאות ${activeProfile.name}`);
        }
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

    // Title Selection Modal - appears before story creation
    if (showTitleModal) {
        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.8)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 10000,
                padding: 'clamp(1rem, 3vw, 2rem)',
                animation: 'fadeIn 0.3s ease'
            }} className="story-title-modal-backdrop" onClick={() => setShowTitleModal(false)}>
                <div style={{
                    background: 'var(--background-dark)',
                    borderRadius: '20px',
                    padding: 'clamp(1.5rem, 4vw, 3rem)',
                    maxWidth: 'clamp(300px, 90vw, 600px)',
                    width: '100%',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                    border: '2px solid var(--primary-color)',
                    animation: 'slideUp 0.4s ease',
                    position: 'relative'
                }} className="story-title-modal" onClick={(e) => e.stopPropagation()}>
                    <button
                        onClick={() => setShowTitleModal(false)}
                        style={{
                            position: 'absolute',
                            top: '1rem',
                            left: '1rem',
                            background: 'var(--glass-bg)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: '1.2rem',
                            color: 'var(--white)',
                            transition: 'all 0.3s ease'
                        }}
                        className="story-title-modal-close"
                    >
                        ✕
                    </button>
                    <h2 style={{
                        fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                        marginBottom: 'clamp(1rem, 3vw, 1.5rem)',
                        color: 'var(--primary-light)',
                        textAlign: 'center'
                    }}>📖 בחר שם לסיפור</h2>
                    <p style={{
                        fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                        color: 'var(--text-light)',
                        textAlign: 'center',
                        marginBottom: 'clamp(1rem, 3vw, 1.5rem)',
                        lineHeight: 1.6
                    }}>
                        בחר שם לסיפור שיתאר את ההרפתקה של <strong style={{color: 'var(--primary-light)'}}>{activeProfile.name}</strong>
                        {activeProfile.interests && ` בתחום ${activeProfile.interests.split(',')[0]}`}
                    </p>
                    
                    <div style={{
                        marginBottom: 'clamp(1rem, 3vw, 1.5rem)'
                    }}>
                        <label style={{
                            display: 'block',
                            fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                            color: 'var(--white)',
                            marginBottom: '0.5rem',
                            fontWeight: 'bold'
                        }}>שם הסיפור:</label>
                        <input
                            type="text"
                            value={initialStoryTitle}
                            onChange={(e) => setInitialStoryTitle(e.target.value)}
                            placeholder="לדוגמה: הרפתקאותיו של דודו בחלל"
                            style={{
                                ...styles.input,
                                width: '100%',
                                fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
                                padding: 'clamp(0.75rem, 2vw, 1rem)',
                                background: 'var(--glass-bg)',
                                border: '2px solid var(--primary-color)',
                                borderRadius: '12px',
                                transition: 'all 0.3s ease'
                            }}
                            className="story-title-input-modal"
                        />
                    </div>
                    
                    {initialTitleSuggestions.length > 0 && (
                        <div style={{
                            marginBottom: 'clamp(1rem, 3vw, 1.5rem)'
                        }}>
                            <label style={{
                                display: 'block',
                                fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                                color: 'var(--white)',
                                marginBottom: '0.5rem',
                                fontWeight: 'bold'
                            }}>💡 הצעות:</label>
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.5rem'
                            }}>
                                {initialTitleSuggestions.map((suggestion, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            setInitialStoryTitle(suggestion);
                                        }}
                                        style={{
                                            ...styles.button,
                                            width: '100%',
                                            textAlign: 'right',
                                            background: initialStoryTitle === suggestion ? 'var(--primary-color)' : 'var(--glass-bg)',
                                            color: initialStoryTitle === suggestion ? 'var(--background-dark)' : 'var(--white)',
                                            fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                                            padding: 'clamp(0.75rem, 2vw, 1rem)',
                                            border: `2px solid ${initialStoryTitle === suggestion ? 'var(--primary-color)' : 'var(--glass-border)'}`,
                                            transition: 'all 0.3s ease'
                                        }}
                                        className="story-title-suggestion-item"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    <div style={{
                        display: 'flex',
                        gap: '1rem',
                        justifyContent: 'center',
                        flexWrap: 'wrap'
                    }}>
                        <button
                            onClick={generateInitialTitleSuggestions}
                            disabled={isGeneratingInitialTitles}
                            style={{
                                ...styles.button,
                                background: 'var(--primary-light)',
                                color: 'var(--background-dark)',
                                fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                                padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1.5rem, 4vw, 2rem)',
                                transition: 'all 0.3s ease',
                                flex: '1 1 auto',
                                minWidth: '150px'
                            }}
                            className="story-generate-suggestions-button"
                        >
                            {isGeneratingInitialTitles ? '⏳ מייצר הצעות...' : '💡 קבל הצעות'}
                        </button>
                        <button
                            onClick={() => {
                                if (!initialStoryTitle.trim()) {
                                    alert('אנא בחר או כתוב שם לסיפור');
                                    return;
                                }
                                setShowTitleModal(false);
                                setShowIntro(false);
                                startStory(initialStoryTitle.trim());
                            }}
                            style={{
                                ...styles.button,
                                fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
                                padding: 'clamp(0.75rem, 2vw, 1rem) clamp(2rem, 5vw, 3rem)',
                                transition: 'all 0.3s ease',
                                flex: '1 1 auto',
                                minWidth: '150px',
                                fontWeight: 'bold'
                            }}
                            disabled={!initialStoryTitle.trim()}
                            className="story-start-button"
                        >
                            🚀 התחל סיפור
                        </button>
                    </div>
                </div>
            </div>
        );
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
                    <div style={{
                        background: 'var(--glass-bg)',
                        padding: 'clamp(1.5rem, 4vw, 2rem)',
                        borderRadius: 'var(--border-radius)',
                        border: '2px solid var(--primary-color)',
                        marginBottom: '2rem',
                        width: '100%',
                        maxWidth: '600px',
                        margin: '0 auto 2rem auto'
                    }}>
                        <h3 style={{
                            fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)',
                            marginBottom: 'clamp(1rem, 2.5vw, 1.5rem)',
                            color: 'var(--primary-light)',
                            textAlign: 'center',
                            fontWeight: 'bold'
                        }}>📖 בחר שם לסיפור</h3>
                        <div style={{
                            marginBottom: '1rem'
                        }}>
                            <label style={{
                                display: 'block',
                                fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                                color: 'var(--white)',
                                marginBottom: '0.5rem',
                                fontWeight: 'bold',
                                textAlign: 'right'
                            }}>שם הסיפור:</label>
                            <input
                                type="text"
                                value={initialStoryTitle}
                                onChange={(e) => setInitialStoryTitle(e.target.value)}
                                placeholder="לדוגמה: הרפתקאותיו של דודו בחלל"
                                style={{
                                    ...styles.input,
                                    width: '100%',
                                    fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
                                    padding: 'clamp(0.75rem, 2vw, 1rem)',
                                    background: 'var(--glass-bg)',
                                    border: '2px solid var(--primary-color)',
                                    borderRadius: '12px',
                                    transition: 'all 0.3s ease',
                                    textAlign: 'right'
                                }}
                                className="story-title-input-intro"
                            />
                        </div>
                        <button
                            onClick={generateInitialTitleSuggestions}
                            disabled={isGeneratingInitialTitles}
                            style={{
                                ...styles.button,
                                background: 'var(--primary-light)',
                                color: 'var(--background-dark)',
                                fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                                padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1.5rem, 4vw, 2rem)',
                                transition: 'all 0.3s ease',
                                width: '100%',
                                marginBottom: '1rem'
                            }}
                            className="story-generate-suggestions-button-intro"
                        >
                            {isGeneratingInitialTitles ? '⏳ מייצר הצעות...' : '💡 קבל הצעות לשם'}
                        </button>
                        {initialTitleSuggestions.length > 0 && (
                            <div style={{
                                marginBottom: '1rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.5rem'
                            }}>
                                {initialTitleSuggestions.map((suggestion, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            setInitialStoryTitle(suggestion);
                                        }}
                                        style={{
                                            ...styles.button,
                                            width: '100%',
                                            textAlign: 'right',
                                            background: initialStoryTitle === suggestion ? 'var(--primary-color)' : 'var(--glass-bg)',
                                            color: initialStoryTitle === suggestion ? 'var(--background-dark)' : 'var(--white)',
                                            fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                                            padding: 'clamp(0.75rem, 2vw, 1rem)',
                                            border: `2px solid ${initialStoryTitle === suggestion ? 'var(--primary-color)' : 'var(--glass-border)'}`,
                                            transition: 'all 0.3s ease'
                                        }}
                                        className="story-title-suggestion-item-intro"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => {
                            if ((user?.credits ?? 0) < STORY_PART_CREDITS) {
                                alert(`אין מספיק קרדיטים. נדרשים ${STORY_PART_CREDITS} קרדיטים, יש לך ${user?.credits ?? 0}.`);
                                return;
                            }
                            if (!initialStoryTitle.trim()) {
                                alert('אנא בחר או כתוב שם לסיפור');
                                return;
                            }
                            setShowIntro(false);
                            startStory(initialStoryTitle.trim());
                        }}
                        style={{
                            ...styles.button,
                            padding: '1.2rem 3rem',
                            fontSize: '1.3rem',
                            fontWeight: 'bold',
                            background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
                            boxShadow: '0 8px 25px rgba(127, 217, 87, 0.4)',
                            minWidth: '250px',
                            transition: 'all 0.3s ease'
                        }}
                        disabled={(user?.credits ?? 0) < STORY_PART_CREDITS || !initialStoryTitle.trim()}
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
        <div style={{
            ...styles.storyView,
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            <div style={{
                ...styles.storyHeader,
                position: 'sticky',
                top: 0,
                zIndex: 100,
                background: 'var(--background-dark)',
                padding: 'clamp(0.75rem, 2vw, 1rem)',
                borderBottom: '1px solid var(--glass-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'clamp(0.5rem, 1.5vw, 1rem)',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                transition: 'all 0.3s ease'
            }} className="no-print story-header-responsive">
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'clamp(0.5rem, 1.5vw, 1rem)',
                    flex: 1,
                    width: '100%',
                    flexWrap: 'wrap'
                }}>
                    {isEditingTitle ? (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'clamp(0.25rem, 1vw, 0.5rem)',
                            flex: 1,
                            minWidth: '200px',
                            width: '100%'
                        }}>
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
                                    fontSize: 'clamp(1rem, 2.5vw, 1.5rem)',
                                    fontWeight: 'bold',
                                    padding: 'clamp(0.4rem, 1.2vw, 0.5rem) clamp(0.75rem, 2vw, 1rem)',
                                    background: 'var(--glass-bg)',
                                    border: '2px solid var(--primary-color)',
                                    borderRadius: '12px',
                                    transition: 'all 0.3s ease',
                                    minWidth: '150px'
                                }}
                                autoFocus
                                className="story-title-input"
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
                                style={{
                                    ...styles.button,
                                    padding: 'clamp(0.4rem, 1.2vw, 0.5rem) clamp(0.75rem, 2vw, 1rem)',
                                    fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
                                    transition: 'all 0.3s ease',
                                    minWidth: '40px',
                                    flexShrink: 0
                                }}
                                className="story-save-button"
                            >
                                ✓
                            </button>
            </div>
                    ) : (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'clamp(0.25rem, 1vw, 0.5rem)',
                            flex: 1,
                            flexWrap: 'wrap',
                            minWidth: 0
                        }}>
                            <h1 
                                style={{
                                    ...styles.mainTitle,
                                    cursor: 'pointer',
                                    margin: 0,
                                    fontSize: 'clamp(1.2rem, 3vw, 2rem)',
                                    transition: 'all 0.3s ease',
                                    wordBreak: 'break-word',
                                    flex: '1 1 auto',
                                    minWidth: 0
                                }}
                                onClick={() => setIsEditingTitle(true)}
                                title="לחץ לעריכה"
                                className="story-title-clickable"
                            >
                                {storyTitle || `הרפתקאות ${activeProfile?.name}`}
                            </h1>
                            <button
                                onClick={() => setIsEditingTitle(true)}
                                style={{
                                    ...styles.iconButton,
                                    fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                                    padding: 'clamp(0.25rem, 0.8vw, 0.3rem) clamp(0.5rem, 1.2vw, 0.6rem)',
                                    transition: 'all 0.3s ease',
                                    flexShrink: 0
                                }}
                                title="ערוך שם סיפור"
                                className="story-edit-button"
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
                                        fontSize: 'clamp(0.75rem, 1.8vw, 0.9rem)',
                                        padding: 'clamp(0.4rem, 1.2vw, 0.5rem) clamp(0.75rem, 2vw, 1rem)',
                                        transition: 'all 0.3s ease',
                                        flexShrink: 0,
                                        whiteSpace: 'nowrap'
                                    }}
                                    disabled={isGeneratingTitleSuggestions}
                                    title="קבל הצעות לשם"
                                    className="story-suggestions-button"
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
                            padding: 'clamp(0.75rem, 2vw, 1rem)',
                            zIndex: 1000,
                            minWidth: 'clamp(250px, 30vw, 300px)',
                            maxWidth: '90vw',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                            animation: 'slideDown 0.3s ease'
                        }} className="story-suggestions-dropdown">
                            <h3 style={{
                                margin: '0 0 clamp(0.4rem, 1vw, 0.5rem) 0',
                                color: 'var(--white)',
                                fontSize: 'clamp(0.9rem, 2vw, 1rem)'
                            }}>הצעות לשם:</h3>
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
                                        marginBottom: 'clamp(0.4rem, 1vw, 0.5rem)',
                                        textAlign: 'right',
                                        background: 'var(--primary-color)',
                                        color: 'var(--background-dark)',
                                        fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                                        padding: 'clamp(0.6rem, 1.5vw, 0.75rem) clamp(0.75rem, 2vw, 1rem)',
                                        transition: 'all 0.3s ease'
                                    }}
                                    className="story-suggestion-item"
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
                                    fontSize: 'clamp(0.8rem, 1.8vw, 0.9rem)',
                                    padding: 'clamp(0.4rem, 1vw, 0.5rem)',
                                    transition: 'all 0.3s ease'
                                }}
                                className="story-close-suggestions"
                            >
                                ✖️ סגור
                            </button>
                             </div>
                    )}
                </div>
                <button
                    onClick={exportToPDF}
                    style={{
                        ...styles.button,
                        padding: 'clamp(0.5rem, 1.5vw, 0.75rem) clamp(1rem, 3vw, 1.5rem)',
                        fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                        transition: 'all 0.3s ease',
                        alignSelf: 'flex-end',
                        flexShrink: 0,
                        whiteSpace: 'nowrap'
                    }}
                    disabled={storyParts.length === 0}
                    className="story-export-button"
                >
                    📄 ייצא ל-PDF
                </button>
            </div>
            <div ref={storyBookRef} style={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
                padding: '2rem',
                background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                minHeight: 'calc(100vh - 150px)',
                width: '100%',
                boxSizing: 'border-box'
            }} className="story-book-container">
                {/* Elegant Cover Page */}
                {storyParts.length > 0 && (
                    <div style={{
                        minHeight: '100vh',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                        borderRadius: '24px',
                        padding: 'clamp(2rem, 5vw, 4rem)',
                        marginBottom: '2rem',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3), inset 0 0 100px rgba(255,255,255,0.1)',
                        color: 'white',
                        textAlign: 'center',
                        width: '100%',
                        maxWidth: '100%',
                        boxSizing: 'border-box',
                        position: 'relative',
                        overflow: 'hidden'
                    }} className="story-cover-page">
                        {/* Decorative elements */}
                        <div style={{
                            position: 'absolute',
                            top: '-50px',
                            right: '-50px',
                            width: '200px',
                            height: '200px',
                            background: 'rgba(255,255,255,0.1)',
                            borderRadius: '50%',
                            filter: 'blur(40px)'
                        }} />
                        <div style={{
                            position: 'absolute',
                            bottom: '-50px',
                            left: '-50px',
                            width: '200px',
                            height: '200px',
                            background: 'rgba(255,255,255,0.1)',
                            borderRadius: '50%',
                            filter: 'blur(40px)'
                        }} />
                        
                        {/* Book icon */}
                        <div style={{
                            fontSize: 'clamp(4rem, 12vw, 8rem)',
                            marginBottom: 'clamp(1rem, 3vw, 2rem)',
                            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
                            animation: 'pulse 2s ease-in-out infinite'
                        }}>📚</div>
                        
                        {/* Main title */}
                        <h1 style={{
                            fontSize: 'clamp(1.8rem, 6vw, 4.5rem)',
                            fontFamily: 'var(--font-serif)',
                            fontWeight: 'bold',
                            marginBottom: 'clamp(1rem, 3vw, 2rem)',
                            textShadow: '3px 3px 6px rgba(0,0,0,0.4), 0 0 20px rgba(255,255,255,0.2)',
                            wordWrap: 'break-word',
                            maxWidth: '100%',
                            lineHeight: 1.2,
                            letterSpacing: '0.02em'
                        }}>{storyTitle || `הרפתקאות ${activeProfile?.name}`}</h1>
                        
                        {/* Decorative line */}
                        <div style={{
                            width: 'clamp(100px, 30vw, 200px)',
                            height: '3px',
                            background: 'rgba(255,255,255,0.6)',
                            margin: 'clamp(1rem, 3vw, 2rem) auto',
                            borderRadius: '2px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }} />
                        
                        {/* Author */}
                        <h2 style={{
                            fontSize: 'clamp(1.2rem, 4vw, 2.5rem)',
                            fontFamily: 'var(--font-serif)',
                            fontWeight: 'normal',
                            marginTop: 'clamp(0.5rem, 2vw, 1rem)',
                            opacity: 0.95,
                            wordWrap: 'break-word',
                            maxWidth: '100%',
                            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
                        }}>מאת: {activeProfile?.name}</h2>
                        
                        {/* Age and interests */}
                        {activeProfile && (
                            <div style={{
                                marginTop: 'clamp(1rem, 3vw, 2rem)',
                                fontSize: 'clamp(0.9rem, 2.5vw, 1.3rem)',
                                opacity: 0.85,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.5rem',
                                alignItems: 'center'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    flexWrap: 'wrap',
                                    justifyContent: 'center'
                                }}>
                                    <span>👤</span>
                                    <span>{activeProfile.age} שנים • {activeProfile.gender}</span>
                                </div>
                                {activeProfile.interests && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        flexWrap: 'wrap',
                                        justifyContent: 'center',
                                        maxWidth: '90%'
                                    }}>
                                        <span>🎨</span>
                                        <span>{activeProfile.interests.split(',').slice(0, 2).join(', ')}</span>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* Footer */}
                        <div style={{
                            marginTop: 'clamp(2rem, 5vw, 3rem)',
                            fontSize: 'clamp(0.8rem, 2vw, 1.1rem)',
                            opacity: 0.7,
                            fontStyle: 'italic',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            justifyContent: 'center',
                            flexWrap: 'wrap'
                        }}>
                            <span>✨</span>
                            <span>נוצר בעזרת בינה מלאכותית</span>
                            <span>✨</span>
                        </div>
                    </div>
                )}

                {/* Story Pages - Each AI part is a page */}
                {storyParts
                    .filter(part => part.author === 'ai') // Only show AI parts
                    .map((part, aiIndex) => (
                        <div key={`ai-part-${aiIndex}`} style={{
                            minHeight: '100vh',
                            display: 'flex',
                            flexDirection: 'column',
                            background: 'white',
                            borderRadius: '20px',
                            padding: '3rem',
                            marginBottom: '2rem',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                            pageBreakAfter: 'always',
                            position: 'relative',
                            width: '100%',
                            maxWidth: '100%',
                            boxSizing: 'border-box'
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
                                {aiIndex + 1}
                             </div>

                                {thinkingIndex === storyParts.findIndex(p => p === part) ? (
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
                                            height: 'clamp(200px, 50vh, 500px)',
                                            marginBottom: '2rem',
                                            borderRadius: '16px',
                                            overflow: 'hidden',
                                            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                                            background: '#f0f0f0',
                                            minHeight: '200px',
                                            maxHeight: '50vh'
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
                                        padding: 'clamp(1rem, 3vw, 2rem)',
                                        background: 'linear-gradient(to bottom, rgba(255,255,255,0.9), rgba(255,255,255,0.7))',
                                        borderRadius: '16px',
                                        border: '2px solid #f0f0f0',
                                        minHeight: '200px'
                                    }}>
                                        <p style={{
                                            fontSize: 'clamp(1rem, 2.5vw, 1.8rem)',
                                            lineHeight: 'clamp(1.5, 3vw, 2)',
                                            color: '#333',
                                            fontFamily: 'var(--font-serif)',
                                            textAlign: 'right',
                                            whiteSpace: 'pre-wrap',
                                            margin: 0,
                                            wordWrap: 'break-word',
                                            overflowWrap: 'break-word'
                                        }}>{part.text}</p>
                             </div>

                                    {/* Actions - only visible on screen */}
                                    <div style={{
                                        ...styles.storyActions,
                                        gap: 'clamp(0.4rem, 1.2vw, 0.5rem)',
                                        marginTop: 'clamp(0.5rem, 1.5vw, 1rem)',
                                        justifyContent: 'flex-end',
                                        flexWrap: 'wrap'
                                    }} className="no-print story-actions-responsive">
                                        <button
                                            onClick={() => speakText(part.text)}
                                            title="הקרא"
                                            style={{
                                                ...styles.iconButton,
                                                fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
                                                padding: 'clamp(0.4rem, 1vw, 0.5rem)',
                                                width: 'clamp(36px, 7vw, 44px)',
                                                height: 'clamp(36px, 7vw, 44px)',
                                                transition: 'all 0.3s ease'
                                            }}
                                            className="story-action-button"
                                        >
                                            🔊
                                        </button>
                                        <button
                                            onClick={() => handleRegeneratePart(storyParts.findIndex(p => p === part))}
                                            title="נסה שוב"
                                            style={{
                                                ...styles.iconButton,
                                                fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
                                                padding: 'clamp(0.4rem, 1vw, 0.5rem)',
                                                width: 'clamp(36px, 7vw, 44px)',
                                                height: 'clamp(36px, 7vw, 44px)',
                                                transition: 'all 0.3s ease'
                                            }}
                                            disabled={isAiThinking}
                                            className="story-action-button"
                                        >
                                            🔄
                                        </button>
                                        </div>
                                    </>
                        )}
                    </div>
                ))}
                
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
            <form onSubmit={handleContinueStory} style={{
                ...styles.storyInputForm,
                position: 'sticky',
                bottom: 0,
                zIndex: 100,
                background: 'var(--background-dark)',
                padding: 'clamp(0.75rem, 2vw, 1rem)',
                borderTop: '1px solid var(--glass-border)',
                boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'clamp(0.5rem, 1.5vw, 0.75rem)',
                transition: 'all 0.3s ease'
            }} className="no-print story-input-form-responsive">
                <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    style={{
                        ...styles.input,
                        flex: 1,
                        fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                        padding: 'clamp(0.6rem, 1.5vw, 0.75rem) clamp(0.75rem, 2vw, 1rem)',
                        borderRadius: '12px',
                        transition: 'all 0.3s ease',
                        width: '100%',
                        minWidth: 0
                    }}
                    placeholder="מה קורה עכשיו?"
                    disabled={isAiThinking}
                    className="story-input-field"
                />
                <div style={{
                    display: 'flex',
                    gap: 'clamp(0.4rem, 1.2vw, 0.5rem)',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    width: '100%'
                }}>
                    <div style={{
                        display: 'flex',
                        gap: 'clamp(0.4rem, 1vw, 0.5rem)',
                        alignItems: 'center',
                        background: 'var(--glass-bg)',
                        padding: 'clamp(0.4rem, 1.2vw, 0.5rem) clamp(0.75rem, 2vw, 1rem)',
                        borderRadius: '8px',
                        border: '1px solid var(--glass-border)',
                        flexShrink: 0,
                        whiteSpace: 'nowrap'
                    }} className="story-credits-display">
                        <span style={{
                            fontSize: 'clamp(0.8rem, 1.8vw, 0.9rem)',
                            color: 'var(--text-secondary)'
                        }}>💎 קרדיטים: {user?.credits ?? 0}</span>
                        <span style={{
                            fontSize: 'clamp(0.75rem, 1.6vw, 0.85rem)',
                            color: 'var(--warning-color)'
                        }}>(יוציא {STORY_PART_CREDITS})</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => handleModifierClick('הפוך את זה לקסום יותר')}
                        style={{
                            ...styles.button,
                            background: 'var(--primary-light)',
                            color: 'var(--background-dark)',
                            fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
                            padding: 'clamp(0.5rem, 1.2vw, 0.6rem)',
                            width: 'clamp(40px, 8vw, 50px)',
                            height: 'clamp(40px, 8vw, 50px)',
                            transition: 'all 0.3s ease',
                            flexShrink: 0
                        }}
                        title="הפוך לקסום יותר"
                        disabled={isAiThinking}
                        className="story-modifier-button"
                    >
                        ✨
                    </button>
                    <button
                        type="button"
                        onClick={() => handleModifierClick('הוסף יותר אקשן ומתח')}
                        style={{
                            ...styles.button,
                            background: 'var(--warning-color)',
                            color: 'var(--background-dark)',
                            fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
                            padding: 'clamp(0.5rem, 1.2vw, 0.6rem)',
                            width: 'clamp(40px, 8vw, 50px)',
                            height: 'clamp(40px, 8vw, 50px)',
                            transition: 'all 0.3s ease',
                            flexShrink: 0
                        }}
                        title="הוסף אקשן"
                        disabled={isAiThinking}
                        className="story-modifier-button"
                    >
                        🚀
                    </button>
                    <button
                        type="button"
                        onClick={() => handleModifierClick('הפוך את זה למצחיק')}
                        style={{
                            ...styles.button,
                            background: 'var(--success-color)',
                            color: 'var(--background-dark)',
                            fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
                            padding: 'clamp(0.5rem, 1.2vw, 0.6rem)',
                            width: 'clamp(40px, 8vw, 50px)',
                            height: 'clamp(40px, 8vw, 50px)',
                            transition: 'all 0.3s ease',
                            flexShrink: 0
                        }}
                        title="הפוך למצחיק"
                        disabled={isAiThinking}
                        className="story-modifier-button"
                    >
                        😂
                    </button>
                    <button
                        type="submit"
                        style={{
                            ...styles.button,
                            fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                            padding: 'clamp(0.6rem, 1.5vw, 0.75rem) clamp(1.5rem, 4vw, 2rem)',
                            transition: 'all 0.3s ease',
                            flex: '1 1 auto',
                            minWidth: 'clamp(100px, 25vw, 150px)',
                            whiteSpace: 'nowrap'
                        }}
                        disabled={isAiThinking || !userInput.trim() || (user?.credits ?? 0) < STORY_PART_CREDITS}
                        className="story-continue-button"
                    >
                        המשך
                    </button>
                </div>
            </form>
            {error && <p style={styles.error}>{error}</p>}
        </div>
    );
};

export default StoryCreator;