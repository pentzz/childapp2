import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { useAppContext } from './AppContext';
import { supabase } from '../supabaseClient';
import { styles } from '../../styles';
import Loader from './Loader';

// --- NEW COMPONENT: GuidedPlanView ---
const GuidedPlanView = ({ planHistory, onNextStep, onGenerateWorksheet, isGenerating, isLastStep, worksheetCredits }: { planHistory: any[], onNextStep: (feedback: string) => void, onGenerateWorksheet: () => void, isGenerating: boolean, isLastStep: boolean, worksheetCredits: number }) => {
    const { user } = useAppContext();
    const [feedback, setFeedback] = useState('');
    const currentStep = planHistory[planHistory.length - 1];

    if (!currentStep) return null;
    
    return (
        <div className="fade-in">
             <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem', textAlign: 'center' }}>
                 <h1 style={{...styles.mainTitle, marginBottom: 0}}>שלב {planHistory.length}: {currentStep.step_title}</h1>
                 <p style={{...styles.subtitle, margin: '0.5rem 0 1rem 0'}}>בצעו את הפעילויות יחד, ואז ספרו לי איך היה כדי שאוכל להכין את השלב הבא!</p>
                 <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center'}}>
                    <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'var(--glass-bg)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--glass-border)'}}>
                        <span style={{fontSize: '0.85rem', color: 'var(--text-secondary)'}}>💎 יוציא {worksheetCredits} קרדיטים</span>
                    </div>
                    <button onClick={onGenerateWorksheet} style={styles.button} disabled={isGenerating || (user?.credits ?? 0) < worksheetCredits}>
                        📄 צור דף תרגול על מה שלמדנו
                    </button>
                </div>
            </div>

            <div className="plan-step-grid">
                {/* Parent Cards */}
                <div>
                     <h3 style={{...styles.title, fontSize: '1.5rem'}}>👩‍🏫 להורה/מורה</h3>
                     <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                        {currentStep.cards.map((card: any, index: number) => (
                             <div key={index} className="guidance-card guidance-card-parent fade-in" style={{animationDelay: `${index * 100}ms`}}>
                                <h4>פעילות {index + 1}</h4>
                                <h5 style={{fontFamily: 'var(--font-serif)'}}>🎯 מטרה</h5>
                                <p>{card.educator_guidance.objective}</p>
                                <h5 style={{fontFamily: 'var(--font-serif)'}}>💡 טיפים להצלחה</h5>
                                <p>{card.educator_guidance.tips}</p>
                                <h5 style={{fontFamily: 'var(--font-serif)'}}>🤔 מה לעשות אם...</h5>
                                <p>{card.educator_guidance.potential_pitfalls}</p>
                            </div>
                        ))}
                     </div>
                </div>
                 {/* Child Cards */}
                 <div>
                    <h3 style={{...styles.title, fontSize: '1.5rem'}}>🧒 לתלמיד/ה</h3>
                     <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                         {currentStep.cards.map((card: any, index: number) => (
                             <div key={index} className="guidance-card guidance-card-child fade-in" style={{animationDelay: `${index * 100}ms`}}>
                                <h4>פעילות {index + 1}</h4>
                                <p>{card.learner_activity}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            {/* Feedback and Controls */}
            <div style={{...styles.card, background: 'var(--glass-bg)', marginTop: '2.5rem', textAlign: 'center'}}>
                 <h3 style={styles.title}>איך היה השלב?</h3>
                 <textarea 
                    value={feedback} 
                    onChange={(e) => setFeedback(e.target.value)} 
                    placeholder="היה נהדר! / היה קצת קשה / אפשר להתמקד יותר ב..." 
                    style={{...styles.textarea, minHeight: '80px', margin: '1rem 0'}}
                    disabled={isGenerating || isLastStep}
                />
                 <button onClick={() => onNextStep(feedback)} style={styles.button} disabled={isGenerating || isLastStep}>
                     {isLastStep ? 'התוכנית הושלמה!' : 'לשלב הבא!'}
                </button>
            </div>
        </div>
    );
};

// --- NEW COMPONENT: GeneratedWorksheetView ---
const GeneratedWorksheetView = ({ worksheetData, onBack, topic }: { worksheetData: any, onBack: () => void, topic: string }) => {
    const { activeProfile } = useAppContext();
    const currentYear = new Date().getFullYear();

    return (
        <div className="fade-in">
             <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}} className="no-print">
                <div>
                     <h1 style={{...styles.mainTitle, textAlign: 'right', marginBottom: 0}}>{worksheetData.title}</h1>
                     <p style={{...styles.subtitle, textAlign: 'right', margin: '0.5rem 0 0 0'}}>דף תרגול וסיכום בנושא: {topic}</p>
                </div>
                 <div>
                    <button onClick={() => window.print()} style={styles.button}>הדפסה</button>
                    <button onClick={onBack} style={{...styles.button, background: 'var(--secondary-color)', marginRight: '1rem'}}>חזרה לתוכנית</button>
                </div>
            </div>
            <div className="printable-area worksheet-container">
                 <div className="worksheet-border"></div>
                 <header className="worksheet-header">
                    <div className="worksheet-logo">✨ גאון</div>
                    <div className="worksheet-title-section">
                        <h1>{worksheetData.title}</h1>
                        <h2>עבור: {activeProfile?.name}</h2>
                    </div>
                 </header>

                <div className="worksheet-body">
                    {worksheetData.imageUrl && <img src={worksheetData.imageUrl} alt={worksheetData.title} className="worksheet-intro-image" />}
                    <p className="worksheet-intro-text">{worksheetData.introduction}</p>

                    {worksheetData.exercises.map((ex: any, index: number) => (
                        <div key={index} className="worksheet-exercise">
                            <h4>תרגיל {index+1}: {ex.question}</h4>
                            <div className="worksheet-exercise-space"></div>
                        </div>
                    ))}
                    
                    <p className="worksheet-motivation">{worksheetData.motivational_message}</p>
                </div>
                
                 <footer className="worksheet-footer">
                    נוצר באמצעות פלטפורמת "גאון" © {currentYear} ZBANG. כל הזכויות שמורות.
                </footer>
            </div>
        </div>
    );
};


// --- Original InteractiveWorkbook for "חוברת עבודה" path ---
const InteractiveWorkbook = ({ workbook, onReset }: { workbook: any; onReset: () => void; }) => {
    const { activeProfile, getUserAPIKey } = useAppContext();
    const [answers, setAnswers] = useState<{ [key: number]: string }>({});
    const [result, setResult] = useState<{ score: number, feedback: string } | null>(null);
    const [isChecking, setIsChecking] = useState(false);

    // Note: API key will be retrieved when needed, not at component initialization
    const currentYear = new Date().getFullYear();

    const handleAnswerChange = (index: number, value: string) => {
        setAnswers(prev => ({ ...prev, [index]: value }));
    };

    const handleCheckAnswers = async () => {
        // Get API key and create AI instance fresh each time
        const apiKey = getUserAPIKey();
        if (!apiKey) {
            alert('❌ API key is missing. Please contact support.');
            return;
        }
        const ai = new GoogleGenAI({ apiKey });
        setIsChecking(true);
        setResult(null);
        
        const submission = workbook.exercises.map((ex: any, index: number) => ({
            question: ex.question_text,
            correct_answer: ex.correct_answer,
            user_answer: answers[index] || "לא נענה"
        }));

        const prompt = `You are a helpful and encouraging teacher reviewing a child's workbook.
        Child's Name: ${activeProfile?.name}.
        Here is the child's submission:
        ${JSON.stringify(submission, null, 2)}

        Please evaluate the answers. Provide a score as a percentage and encouraging, constructive feedback in Hebrew.
        The feedback should praise the effort, gently point out any mistakes, and offer positive reinforcement.
        Return a valid JSON object with "score" (a number) and "feedback" (a string).`;
        
        try {
            const schema = {type: Type.OBJECT, properties: {score: {type: Type.NUMBER}, feedback: {type: Type.STRING}}, required: ["score", "feedback"]};
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
            if (!response.text) throw new Error("API did not return grading feedback.");
            const data = JSON.parse(response.text.trim());
            setResult(data);
        } catch (err) {
            console.error(err);
            setResult({ score: 0, feedback: 'הייתה שגיאה בבדיקת התשובות. נסו שוב.' });
        } finally {
            setIsChecking(false);
        }
    };
    
    return (
        <div className="fade-in">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}} className="no-print">
                <div>
                     <h1 style={{...styles.mainTitle, textAlign: 'right', marginBottom: 0}}>{workbook.title}</h1>
                     <p style={{...styles.subtitle, textAlign: 'right', margin: '0.5rem 0 0 0'}}>{workbook.introduction}</p>
                </div>
                <div>
                    <button onClick={() => window.print()} style={styles.button}>הדפסת חוברת ריקה</button>
                    <button onClick={onReset} style={{...styles.button, background: 'var(--secondary-color)', marginRight: '1rem'}}>יצירה מחדש</button>
                </div>
            </div>

            <div className="printable-area" style={{...styles.card, background: 'var(--glass-bg)'}}>
                 <div className="workbook-print-cover">
                    <h1>{workbook.title}</h1>
                    <h2>עבור: {activeProfile?.name}</h2>
                    <p>{workbook.introduction}</p>
                </div>

                {workbook.exercises.map((ex: any, index: number) => (
                    <div key={index} className="workbook-print-page page-break-inside-avoid" style={{padding: '1.5rem', borderBottom: '1px solid var(--glass-border)'}}>
                        <h4>תרגיל {index + 1}: {ex.question_text}</h4>
                        <div className="no-print">
                            {ex.question_type === 'multiple_choice' ? (
                                <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                                    {ex.options.map((opt: string, i: number) => (
                                        <label key={i} style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                            <input type="radio" name={`q_${index}`} value={opt} onChange={(e) => handleAnswerChange(index, e.target.value)} />
                                            {opt}
                                        </label>
                                    ))}
                                </div>
                            ) : (
                                <input type="text" onChange={(e) => handleAnswerChange(index, e.target.value)} style={styles.input} placeholder="התשובה שלך" />
                            )}
                        </div>
                         <div className="print-only" style={{height: '50px', borderBottom: '1px solid #ccc', marginTop: '1rem'}}></div>
                    </div>
                ))}
                
                <div className="print-only">
                    <h3>סיימנו! כל הכבוד!</h3>
                    <p style={{whiteSpace: 'pre-wrap', lineHeight: 1.7}}>{workbook.conclusion}</p>
                </div>
                
                <div className="no-print" style={{padding: '1.5rem'}}>
                    {isChecking && <Loader message="בודק תשובות..." />}
                    {!result && (
                         <button onClick={handleCheckAnswers} style={styles.button} disabled={isChecking}>בדיקת תשובות</button>
                    )}
                   
                    {result && (
                        <div className="fade-in" style={{...styles.card, background: 'var(--surface-color-light)', marginTop: '2rem'}}>
                            <h3 style={styles.title}>התוצאות שלי</h3>
                            <p style={{fontSize: '1.5rem'}}><strong>ציון: {result.score}%</strong></p>
                            <p style={{fontSize: '1.1rem', lineHeight: 1.6}}><strong>משוב:</strong> {result.feedback}</p>
                            <button onClick={() => setResult(null)} style={{...styles.button, background: 'var(--primary-light)'}}>לנסות שוב</button>
                        </div>
                    )}
                </div>

                <div className="print-only print-footer">
                    <p>נוצר באמצעות פלטפורמת "גאון" © {currentYear} ZBANG. כל הזכויות שמורות.</p>
                </div>
            </div>
        </div>
    );
};


const subjects = [
    { name: 'מתמטיקה', icon: '🔢' }, { name: 'שפה', icon: 'אב' }, { name: 'אנגלית', icon: '🔤' },
    { name: 'מדעים', icon: '🔬' }, { name: 'קריאה', icon: '📖' }, { name: 'כתיבה', icon: '✍️' },
    { name: 'גאומטריה', icon: '📐' }, { name: 'אמנות', icon: '🎨' }, { name: 'היסטוריה', icon: '📜' },
    { name: 'גאוגרפיה', icon: '🌍' }, { name: 'מוזיקה', icon: '🎵' }, { name: 'טבע', icon: '🌿' },
];

const loadingMessages = [ "מגבש תוכנית למידה...", "יוצר חוברת עבודה אינטראקטיבית...", "משרטט איורים קסומים...", "מערבב צבעים של דמיון..." ];
const TOTAL_PLAN_STEPS = 5;

// Credit costs - will be loaded from context

interface LearningCenterProps {
    contentId?: number | null;
    contentType?: 'workbook' | 'learning_plan' | null;
    onContentLoaded?: () => void;
}

const LearningCenter = ({ contentId, contentType, onContentLoaded }: LearningCenterProps = {}) => {
    const { activeProfile, user, updateUserCredits, creditCosts, refreshCreditCosts, getUserAPIKey } = useAppContext();
    
    // Dynamic credit costs from context
    const PLAN_STEP_CREDITS = creditCosts.plan_step;
    const WORKSHEET_CREDITS = creditCosts.worksheet;
    const WORKBOOK_CREDITS = creditCosts.workbook;
    const TOPIC_SUGGESTIONS_CREDITS = creditCosts.topic_suggestions;
    const [creationType, setCreationType] = useState<'plan' | 'workbook'>('plan');
    const [subject, setSubject] = useState('');
    const [isOtherSubject, setIsOtherSubject] = useState(false);
    const [otherSubjectText, setOtherSubjectText] = useState('');
    const [topic, setTopic] = useState('');
    const [topicSuggestions, setTopicSuggestions] = useState<string[]>([]);
    const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
    const [goal, setGoal] = useState('');
    const [description, setDescription] = useState('');
    const [numExercises, setNumExercises] = useState(10);

    const [planHistory, setPlanHistory] = useState<any[]>([]);
    const [generatedWorksheet, setGeneratedWorksheet] = useState<any | null>(null);
    const [workbook, setWorkbook] = useState<any | null>(null);
    const [learningPlanId, setLearningPlanId] = useState<number | null>(null);
    const [workbookId, setWorkbookId] = useState<number | null>(null);
    const [isLoadingExisting, setIsLoadingExisting] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [currentLoadingMessage, setCurrentLoadingMessage] = useState(loadingMessages[0]);
    const [error, setError] = useState('');

    // Load existing content when contentId is provided
    useEffect(() => {
        const loadExistingContent = async () => {
            if (!contentId || !user || !activeProfile) return;
            
            setIsLoadingExisting(true);
            try {
                if (contentType === 'workbook') {
                    const { data, error } = await supabase
                        .from('workbooks')
                        .select('*')
                        .eq('id', contentId)
                        .eq('user_id', user.id)
                        .single();

                    if (error) throw error;

                    if (data && data.workbook_data) {
                        setWorkbook(data.workbook_data);
                        setWorkbookId(data.id);
                        setCreationType('workbook');
                    }
                } else if (contentType === 'learning_plan') {
                    const { data, error } = await supabase
                        .from('learning_plans')
                        .select('*')
                        .eq('id', contentId)
                        .eq('user_id', user.id)
                        .single();

                    if (error) throw error;

                    if (data && data.plan_steps && Array.isArray(data.plan_steps)) {
                        setPlanHistory(data.plan_steps);
                        setLearningPlanId(data.id);
                        setCreationType('plan');
                    }
                }
            } catch (error) {
                console.error('Error loading content:', error);
                setError('שגיאה בטעינת התוכן');
            } finally {
                setIsLoadingExisting(false);
                if (onContentLoaded) onContentLoaded();
            }
        };

        if (contentId && contentType) {
            loadExistingContent();
        } else {
            // Reset for new content
            setPlanHistory([]);
            setWorkbook(null);
            setGeneratedWorksheet(null);
            setLearningPlanId(null);
            setWorkbookId(null);
        }
    }, [contentId, contentType, user?.id, activeProfile?.id]);

    // Note: API key will be retrieved when needed, not at component initialization

    // Save learning plan to database
    const saveLearningPlanToDatabase = async () => {
        if (!activeProfile || !user || planHistory.length === 0) return;

        try {
            const planTitle = `${topic} - תוכנית למידה`;
            const planData = {
                user_id: user.id,
                profile_id: activeProfile.id,
                title: planTitle,
                plan_steps: planHistory
            };

            if (learningPlanId) {
                // Update existing plan
                const { error } = await supabase
                    .from('learning_plans')
                    .update({
                        plan_steps: planHistory,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', learningPlanId);

                if (error) throw error;
            } else {
                // Create new plan
                const { data, error } = await supabase
                    .from('learning_plans')
                    .insert(planData)
                    .select()
                    .single();

                if (error) throw error;
                if (data) {
                    setLearningPlanId(data.id);
                }
            }
        } catch (error) {
            console.error('Error saving learning plan to database:', error);
        }
    };

    // Save workbook to database
    const saveWorkbookToDatabase = async (workbookData: any) => {
        if (!activeProfile || !user || !workbookData) return;

        try {
            const workbookTitle = workbookData.title || `${topic} - חוברת עבודה`;
            const dataToSave = {
                user_id: user.id,
                profile_id: activeProfile.id,
                title: workbookTitle,
                workbook_data: workbookData
            };

            if (workbookId) {
                // Update existing workbook
                const { error } = await supabase
                    .from('workbooks')
                    .update({
                        workbook_data: workbookData,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', workbookId);

                if (error) throw error;
            } else {
                // Create new workbook
                const { data, error } = await supabase
                    .from('workbooks')
                    .insert(dataToSave)
                    .select()
                    .single();

                if (error) throw error;
                if (data) {
                    setWorkbookId(data.id);
                }
            }
        } catch (error) {
            console.error('Error saving workbook to database:', error);
        }
    };

    // Save worksheet to database (save as workbook with type worksheet)
    const saveWorksheetToDatabase = async (worksheetData: any) => {
        if (!activeProfile || !user || !worksheetData) return;

        try {
            const worksheetTitle = worksheetData.title || `${topic} - דף תרגול`;
            const dataToSave = {
                user_id: user.id,
                profile_id: activeProfile.id,
                title: worksheetTitle,
                workbook_data: { ...worksheetData, type: 'worksheet' }
            };

            const { data, error } = await supabase
                .from('workbooks')
                .insert(dataToSave)
                .select()
                .single();

            if (error) throw error;
            console.log('✅ Worksheet saved to database');
        } catch (error) {
            console.error('Error saving worksheet to database:', error);
        }
    };

    const resetForm = () => {
        setPlanHistory([]);
        setWorkbook(null);
        setGeneratedWorksheet(null);
        setError('');
        setTopicSuggestions([]);
        setLearningPlanId(null);
        setWorkbookId(null);
    };
    
    const fetchTopicSuggestions = async () => {
        const finalSubject = isOtherSubject ? otherSubjectText : subject;
        if (!finalSubject || !activeProfile || !user) return;
        
        // 🔄 Refresh credit costs BEFORE creation to ensure latest prices
        console.log('🔄 WorkbookCreator: Refreshing credit costs before topic suggestions...');
        await refreshCreditCosts();
        
        // Check if user has enough credits
        if (user.credits < TOPIC_SUGGESTIONS_CREDITS) {
            setError(`אין מספיק קרדיטים. נדרשים ${TOPIC_SUGGESTIONS_CREDITS} קרדיטים, יש לך ${user.credits}.`);
            return;
        }
        
        setIsFetchingSuggestions(true);
        setError('');
        setTopicSuggestions([]);

        const prompt = `Based on a child's profile (age: ${activeProfile.age}, interests: "${activeProfile.interests}"), suggest 5 engaging and specific learning topics in Hebrew for the subject "${finalSubject}".
        The topics should be short and appropriate for the child's age.
        Return a valid JSON object with a single key "topics" which is an array of 5 strings.`;

        try {
            // Get API key and create AI instance fresh each time
            const apiKey = getUserAPIKey();
            if (!apiKey) {
                throw new Error('API key is missing. Please provide a valid API key.');
            }
            const ai = new GoogleGenAI({ apiKey });
            
            const schema = {type: Type.OBJECT, properties: {topics: {type: Type.ARRAY, items: {type: Type.STRING}}}};
            const result = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema }});
            if (!result.text) throw new Error("API did not return topic suggestions.");
            const data = JSON.parse(result.text.trim());
            setTopicSuggestions(data.topics || []);
            
            // Deduct credits after successful generation
            await updateUserCredits(-TOPIC_SUGGESTIONS_CREDITS);
        } catch (err) {
            console.error(err);
            setError('לא הצלחתי למצוא הצעות. אפשר להזין נושא באופן ידני.');
        } finally {
            setIsFetchingSuggestions(false);
        }
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        const finalSubject = isOtherSubject ? otherSubjectText : subject;
        if (!finalSubject || !topic) {
            setError('נא לבחור תחום ידע ונושא מרכזי כדי להתחיל.');
            return;
        }
        setIsLoading(true);
        setPlanHistory([]);
        setWorkbook(null);
        setError('');

        if (creationType === 'plan') {
            await handleGeneratePlanStep(); // Generate the first step
        } else {
            await handleGenerateWorkbook();
        }
        
        setIsLoading(false);
    };

    const handleGeneratePlanStep = async (feedback = '') => {
        if (!user) return;
        
        // 🔄 Refresh credit costs BEFORE creation to ensure latest prices
        console.log('🔄 WorkbookCreator: Refreshing credit costs before plan step generation...');
        await refreshCreditCosts();
        
        // Check if user has enough credits
        if (user.credits < PLAN_STEP_CREDITS) {
            setError(`אין מספיק קרדיטים. נדרשים ${PLAN_STEP_CREDITS} קרדיטים, יש לך ${user.credits}.`);
            return;
        }
        
        setIsLoading(true);
        setCurrentLoadingMessage(`מכין את שלב ${planHistory.length + 1}...`);
        const finalSubject = isOtherSubject ? otherSubjectText : subject;
        try {
            const historyPrompt = planHistory.map((step, index) => `Step ${index + 1}: ${step.step_title}`).join('\n');

            const prompt = `You are an expert curriculum designer and pedagogical coach creating a step-by-step learning plan in Hebrew.
            Child Profile: Name: ${activeProfile!.name}, Age: ${activeProfile!.age}, Interests: ${activeProfile!.interests}
            Plan Details: Subject: ${finalSubject}, Topic: "${topic}", Goal: "${goal || 'General understanding and enjoyment of the topic'}"
            
            ${planHistory.length > 0 ? `History of previous steps:\n${historyPrompt}` : ''}
            ${feedback ? `Feedback from the parent on the last step: "${feedback}"` : ''}

            Now, create the ${planHistory.length === 0 ? 'FIRST' : 'NEXT'} step of the plan. This is step number ${planHistory.length + 1}.
            The step must contain:
            1. "step_title": A concise, engaging title for the overall step.
            2. "cards": An array of exactly 5 distinct mini-activities. Each item in the array must be an object with:
                - "learner_activity": A fun and clear activity for the child.
                - "educator_guidance": A detailed pedagogical guide for the parent. This MUST be an object containing three keys:
                    - "objective": (string) The specific learning goal of this activity.
                    - "tips": (string) Actionable tips for the parent on how to present the activity, make it engaging, and create a positive learning environment.
                    - "potential_pitfalls": (string) Advice on what to do if the child struggles or makes common mistakes.

            Adhere strictly to the JSON schema. The entire output must be a valid JSON object.`;
            
            const guidanceSchema = { type: Type.OBJECT, properties: { objective: { type: Type.STRING }, tips: { type: Type.STRING }, potential_pitfalls: { type: Type.STRING } }, required: ["objective", "tips", "potential_pitfalls"] };
            const cardSchema = { type: Type.OBJECT, properties: { learner_activity: { type: Type.STRING }, educator_guidance: guidanceSchema }, required: ["learner_activity", "educator_guidance"] };
            const planStepSchema = { type: Type.OBJECT, properties: { step_title: { type: Type.STRING }, cards: { type: Type.ARRAY, items: cardSchema } }, required: ["step_title", "cards"] };

            // Get API key and create AI instance fresh each time
            const apiKey = getUserAPIKey();
            if (!apiKey) {
                throw new Error('API key is missing. Please provide a valid API key.');
            }
            const ai = new GoogleGenAI({ apiKey });
            
            const result = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt, config: { responseMimeType: "application/json", responseSchema: planStepSchema }});
            if (!result.text) throw new Error("API did not return text for the plan step.");
            let planStepData = JSON.parse(result.text.trim());
            
            setPlanHistory(prev => [...prev, planStepData]);
            
            // Deduct credits after successful generation
            await updateUserCredits(-PLAN_STEP_CREDITS);
            
            // Save learning plan to database
            await saveLearningPlanToDatabase();

        } catch (err) { handleError(err); } finally { setIsLoading(false); }
    };

    const handleGenerateWorksheetFromPlan = async () => {
        if (planHistory.length === 0 || !user) return;
        
        // 🔄 Refresh credit costs BEFORE creation to ensure latest prices
        console.log('🔄 WorkbookCreator: Refreshing credit costs before worksheet generation...');
        await refreshCreditCosts();
        
        // Check if user has enough credits
        if (user.credits < WORKSHEET_CREDITS) {
            setError(`אין מספיק קרדיטים. נדרשים ${WORKSHEET_CREDITS} קרדיטים, יש לך ${user.credits}.`);
            return;
        }
        
        setIsLoading(true);
        setCurrentLoadingMessage("יוצר דף תרגול מסכם...");
        const finalTopic = isOtherSubject ? otherSubjectText : topic;
        try {
            const historyForPrompt = JSON.stringify(planHistory.map(p => ({ title: p.step_title, activities: p.cards.map((c:any) => c.learner_activity) })));
            
            const prompt = `Based on the following learning plan history for ${activeProfile?.name} (age ${activeProfile?.age}, interests: ${activeProfile?.interests}) on the topic of "${finalTopic}":
            ${historyForPrompt}
            
            Create a single, printable practice worksheet in Hebrew that summarizes what has been learned.
            The worksheet must contain:
            1. "title": A suitable title.
            2. "introduction": A short, encouraging intro for the child.
            3. "exercises": An array of 3-5 simple exercise objects, each with a "question" string.
            4. "motivational_message": A final positive message.
            5. "image_prompt": An English prompt for a single, general illustration for the top of the worksheet. The image should be pleasant, related to the child's interests and the topic. CRITICAL: It must NOT contain any text, letters, or numbers.

            Return a single valid JSON object with this structure.`;

            const exerciseSchema = {type: Type.OBJECT, properties: {question: {type: Type.STRING}}, required: ['question']};
            const worksheetSchema = {type: Type.OBJECT, properties: {
                title: {type: Type.STRING}, introduction: {type: Type.STRING}, exercises: {type: Type.ARRAY, items: exerciseSchema},
                motivational_message: {type: Type.STRING}, image_prompt: {type: Type.STRING}
            }, required: ["title", "introduction", "exercises", "motivational_message", "image_prompt"]};

            // Get API key and create AI instance fresh each time
            const apiKey = getUserAPIKey();
            if (!apiKey) {
                throw new Error('API key is missing. Please provide a valid API key.');
            }
            const ai = new GoogleGenAI({ apiKey });
            
            const textResult = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt, config: { responseMimeType: "application/json", responseSchema: worksheetSchema }});
            if (!textResult.text) throw new Error("API did not return worksheet text.");
            const worksheetData = JSON.parse(textResult.text.trim());

            setCurrentLoadingMessage("מצייר תמונה יפה...");
            const imageResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [{ text: worksheetData.image_prompt }] }, config: { responseModalities: [Modality.IMAGE] } });

            // Validate image data
            const imagePart = imageResponse?.candidates?.[0]?.content.parts[0];
            if (!imagePart?.inlineData || !imagePart.inlineData.data) {
                console.warn('🟡 WorkbookCreator: Image generation returned no data for worksheet');
            }

            const imageUrl = imagePart?.inlineData ? `data:image/png;base64,${imagePart.inlineData.data}` : '';

            setGeneratedWorksheet({ ...worksheetData, imageUrl });
            
            // Deduct credits after successful generation
            await updateUserCredits(-WORKSHEET_CREDITS);
            
            // Save worksheet to database
            await saveWorksheetToDatabase({ ...worksheetData, imageUrl });

        } catch (err) { handleError(err); } finally { setIsLoading(false); }
    };
    
    const handleGenerateWorkbook = async () => {
        const finalSubject = isOtherSubject ? otherSubjectText : subject;
        if (!description) {
            setError('נא לתאר מה תרצו לתרגל בחוברת.');
            setIsLoading(false);
            return;
        }
        
        if (!user) return;
        
        // 🔄 Refresh credit costs BEFORE creation to ensure latest prices
        console.log('🔄 WorkbookCreator: Refreshing credit costs before workbook generation...');
        await refreshCreditCosts();
        
        // Check if user has enough credits
        if (user.credits < WORKBOOK_CREDITS) {
            setError(`אין מספיק קרדיטים. נדרשים ${WORKBOOK_CREDITS} קרדיטים, יש לך ${user.credits}.`);
            setIsLoading(false);
            return;
        }
        
        try {
            setCurrentLoadingMessage(loadingMessages[1]);
            const prompt = `You are an expert curriculum designer. Create a complete, interactive workbook in Hebrew for this child:
             - Name: ${activeProfile!.name}, Age: ${activeProfile!.age}, Interests: ${activeProfile!.interests}
             - Subject: ${finalSubject}, Topic: "${topic}"
             - User's description: "${description}"
            The workbook should contain exactly ${numExercises} exercises. For each exercise, provide: "question_text", "question_type" ('multiple_choice' or 'open_ended'). If it's 'multiple_choice', provide an array of 4 "options" and the "correct_answer". For 'open_ended', "correct_answer" can be a sample correct response.
            The entire output must be a valid JSON object with: "title", "introduction", an array of the exercises, and a "conclusion".`;
            
            const exerciseSchema = {
                type: Type.OBJECT, properties: {
                    question_text: { type: Type.STRING },
                    question_type: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correct_answer: { type: Type.STRING }
                }, required: ["question_text", "question_type", "correct_answer"]
            };
            const workbookSchema = {
                type: Type.OBJECT, properties: {
                    title: { type: Type.STRING }, introduction: { type: Type.STRING },
                    exercises: { type: Type.ARRAY, items: exerciseSchema },
                    conclusion: { type: Type.STRING }
                }, required: ["title", "introduction", "exercises", "conclusion"]
            };

            // Get API key and create AI instance fresh each time
            const apiKey = getUserAPIKey();
            if (!apiKey) {
                throw new Error('API key is missing. Please provide a valid API key.');
            }
            const ai = new GoogleGenAI({ apiKey });
            
            const result = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt, config: { responseMimeType: "application/json", responseSchema: workbookSchema }});
            if (!result.text) throw new Error("API did not return text for the workbook.");
            let workbookData = JSON.parse(result.text.trim());
            setWorkbook(workbookData);
            
            // Deduct credits after successful generation
            await updateUserCredits(-WORKBOOK_CREDITS);
            
            // Save workbook to database
            await saveWorkbookToDatabase(workbookData);

        } catch (err) { handleError(err); }
    };

    const handleError = (err: any) => {
        console.error(err);
        setError(err instanceof Error ? err.message : 'אוי, משהו השתבש.');
    };
    
    const handleSubjectClick = (s: string) => {
        setSubject(s);
        if (s === 'אחר...') {
            setIsOtherSubject(true);
        } else {
            setIsOtherSubject(false);
            setOtherSubjectText('');
        }
    };

    if (!activeProfile) {
        return <div style={styles.centered}><p>יש לבחור פרופיל בדשבורד ההורים כדי ליצור תוכן לימודי.</p></div>
    }
    if (isLoadingExisting) return <Loader message="טוען תוכן קיים..." />;
    if (isLoading) return <Loader message={currentLoadingMessage} />;
    if (generatedWorksheet) return <GeneratedWorksheetView worksheetData={generatedWorksheet} onBack={() => setGeneratedWorksheet(null)} topic={topic} />;
    if (planHistory.length > 0) return <GuidedPlanView planHistory={planHistory} onNextStep={handleGeneratePlanStep} onGenerateWorksheet={handleGenerateWorksheetFromPlan} isGenerating={isLoading} isLastStep={planHistory.length >= TOTAL_PLAN_STEPS} worksheetCredits={WORKSHEET_CREDITS} />;
    if (workbook) return <InteractiveWorkbook workbook={workbook} onReset={resetForm} />;

    return (
        <div style={styles.dashboard}>
            <h1 style={styles.mainTitle}>מרכז הלמידה</h1>
            <p style={styles.subtitle}>בואו ניצור תוכן לימודי מותאם אישית עבור {activeProfile.name}.</p>
            <div style={{maxWidth: '800px', margin: '0 auto'}}>
                <div style={{...styles.card, background: 'var(--glass-bg)'}}>
                    <form onSubmit={handleGenerate} style={styles.glassForm}>
                         <div>
                            <label>1. מה תרצו ליצור?</label>
                            <div style={{...styles.formRow, gap: '0.5rem', marginTop: '0.5rem'}}>
                                <button type="button" onClick={() => setCreationType('plan')} style={{...styles.button, flex: 1, background: creationType === 'plan' ? 'var(--primary-color)' : 'var(--glass-border)'}}>תוכנית מודרכת</button>
                                <button type="button" onClick={() => setCreationType('workbook')} style={{...styles.button, flex: 1, background: creationType === 'workbook' ? 'var(--primary-color)' : 'var(--glass-border)'}}>חוברת עבודה</button>
                            </div>
                        </div>
                        <div style={{...styles.formField, flex: 2}}>
                            <label>2. בחרו תחום ידע:</label>
                            <div style={styles.subjectsGrid} className="subjects-grid">
                                {subjects.map(s => (
                                    <div key={s.name} className={`subject-card ${subject === s.name ? 'selected' : ''}`} onClick={() => handleSubjectClick(s.name)}>
                                        <div style={styles.subjectIcon} className="subject-icon">{s.icon}</div>
                                        <span>{s.name}</span>
                                    </div>
                                ))}
                                <div className={`subject-card ${subject === 'אחר...' ? 'selected' : ''}`} onClick={() => handleSubjectClick('אחר...')}>
                                    <div style={styles.subjectIcon} className="subject-icon">✨</div>
                                    <span>אחר...</span>
                                </div>
                            </div>
                            {isOtherSubject && (
                                <div className="fade-in" style={{marginTop: '0.5rem'}}>
                                     <input 
                                        type="text" 
                                        value={otherSubjectText} 
                                        onChange={e => setOtherSubjectText(e.target.value)} 
                                        placeholder="הקלידו את תחום הידע הרצוי" 
                                        style={styles.input} 
                                        required
                                    />
                                </div>
                            )}
                        </div>
                        <div>
                            <label htmlFor="topic">3. מה הנושא המרכזי?</label>
                            <div style={{display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.5rem'}}>
                                <input 
                                    id="topic" 
                                    type="text" 
                                    value={topic} 
                                    onChange={e => setTopic(e.target.value)} 
                                    placeholder="לדוגמה: חיבור עד 10, אותיות הא'-ב'" 
                                    style={{...styles.input, flex: 1}} 
                                    required
                                    list="topic-suggestions"
                                />
                                {(subject || otherSubjectText) && (
                                    <button 
                                        type="button" 
                                        onClick={fetchTopicSuggestions} 
                                        style={{...styles.button, padding: '12px 18px', flexShrink: 0}} 
                                        disabled={isFetchingSuggestions || (user?.credits ?? 0) < TOPIC_SUGGESTIONS_CREDITS}
                                        title={user && user.credits < TOPIC_SUGGESTIONS_CREDITS ? `נדרשים ${TOPIC_SUGGESTIONS_CREDITS} קרדיטים` : ''}
                                    >
                                        {isFetchingSuggestions ? '...' : `💡 קבל הצעות (${TOPIC_SUGGESTIONS_CREDITS} קרדיטים)`}
                                    </button>
                                )}
                            </div>
                            <datalist id="topic-suggestions">
                                {topicSuggestions.map((s, i) => <option key={i} value={s} />)}
                            </datalist>
                        </div>

                        {creationType === 'plan' ? (
                            <div className="fade-in">
                                <label htmlFor="goal">4. מהי מטרת הלמידה? (אופציונלי)</label>
                                <textarea id="goal" value={goal} onChange={e => setGoal(e.target.value)} placeholder="לדוגמה: זיהוי כל האותיות, חיבור באופן עצמאי" style={{...styles.textarea, marginTop: '0.5rem', minHeight: '60px'}}/>
                            </div>
                        ) : (
                            <div className="fade-in">
                                <label htmlFor="description">4. תארו מה תרצו לתרגל בחוברת:</label>
                                <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="לדוגמה: תרגילים של חיבור וחיסור עם דינוזאורים, זיהוי אותיות בתוך מילים שקשורות לפיות" style={{...styles.textarea, marginTop: '0.5rem', minHeight: '80px'}} required/>
                                <div style={{marginTop: '1rem'}}>
                                    <label htmlFor="numExercises">מספר תרגילים (5-20): {numExercises}</label>
                                    <input id="numExercises" type="range" min="5" max="20" value={numExercises} onChange={e => setNumExercises(parseInt(e.target.value))} style={{width: '100%', marginTop: '0.5rem'}}/>
                                </div>
                            </div>
                        )}
                        <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                            <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center', background: 'var(--glass-bg)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)'}}>
                                <span style={{fontSize: '0.9rem', color: 'var(--text-secondary)'}}>💎 קרדיטים: {user?.credits ?? 0}</span>
                                <span style={{fontSize: '0.85rem', color: 'var(--warning-color)'}}>
                                    ({creationType === 'plan' ? `יוציא ${PLAN_STEP_CREDITS} לכל שלב` : `יוציא ${WORKBOOK_CREDITS} קרדיטים`})
                                </span>
                            </div>
                            <button 
                                type="submit" 
                                style={styles.button} 
                                disabled={isLoading || (creationType === 'plan' && (user?.credits ?? 0) < PLAN_STEP_CREDITS) || (creationType === 'workbook' && (user?.credits ?? 0) < WORKBOOK_CREDITS)}
                            >
                                {isLoading ? 'יוצר...' : `צור ${creationType === 'plan' ? 'תוכנית' : 'חוברת'}`}
                            </button>
                        </div>
                        {error && <p style={styles.error}>{error}</p>}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LearningCenter;