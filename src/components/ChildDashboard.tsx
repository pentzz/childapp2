import React, { useMemo, useState, useEffect } from 'react';
import { useAppContext } from './AppContext';
import { styles } from '../../styles';
import AnimatedSection from './AnimatedSection';
import { supabase } from '../supabaseClient';

// --- AnimatedWordsBackground Component ---
const AnimatedWordsBackground = () => {
    const words = useMemo(() => {
        const wordList = ['קסם', 'יצירה', 'למידה', 'הרפתקה', 'דמיון', 'א', 'ב', 'ג', '1', '2', '3', '+', '='];
        return Array.from({ length: 20 }).map((_, i) => {
            const style: React.CSSProperties = {
                left: `${Math.random() * 100}%`,
                fontSize: `${Math.random() * 2 + 1}rem`,
                animationDuration: `${Math.random() * 20 + 15}s`,
                animationDelay: `${Math.random() * 15}s`,
                opacity: Math.random() * 0.5 + 0.1,
                color: `hsl(${255 + Math.random() * 60}, 70%, 80%)`,
            };
            const word = wordList[Math.floor(Math.random() * wordList.length)];
            return <span key={i} className="floating-word" style={style}>{word}</span>;
        });
    }, []);

    return <div className="floating-words-bg">{words}</div>;
};


interface ChildDashboardProps {
    setCurrentView: (view: string) => void;
}

const ChildDashboard = ({ setCurrentView }: ChildDashboardProps) => {
    const { activeProfile, user } = useAppContext();
    const [recentContent, setRecentContent] = useState<any[]>([]);
    const [isLoadingContent, setIsLoadingContent] = useState(false);

    useEffect(() => {
        if (activeProfile && user) {
            loadRecentContent();
        }
    }, [activeProfile, user]);

    const loadRecentContent = async () => {
        if (!activeProfile || !user) return;

        setIsLoadingContent(true);
        try {
            // Load stories
            const { data: stories, error: storiesError } = await supabase
                .from('stories')
                .select('*')
                .eq('user_id', user.id)
                .eq('profile_id', activeProfile.id)
                .order('updated_at', { ascending: false })
                .limit(3);

            // Load workbooks
            const { data: workbooks, error: workbooksError } = await supabase
                .from('workbooks')
                .select('*')
                .eq('user_id', user.id)
                .eq('profile_id', activeProfile.id)
                .order('updated_at', { ascending: false })
                .limit(3);

            // Load learning plans
            const { data: plans, error: plansError } = await supabase
                .from('learning_plans')
                .select('*')
                .eq('user_id', user.id)
                .eq('profile_id', activeProfile.id)
                .order('updated_at', { ascending: false })
                .limit(3);

            const combined = [
                ...(stories || []).map((s: any) => ({ ...s, type: 'story' })),
                ...(workbooks || []).map((w: any) => ({ ...w, type: 'workbook' })),
                ...(plans || []).map((p: any) => ({ ...p, type: 'learning_plan' }))
            ].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 6);

            setRecentContent(combined);
        } catch (error) {
            console.error('Error loading content:', error);
        } finally {
            setIsLoadingContent(false);
        }
    };

    const getContentIcon = (type: string) => {
        switch(type) {
            case 'story': return '📖';
            case 'workbook': return '📝';
            case 'learning_plan': return '🎯';
            default: return '📄';
        }
    };

    const getContentTypeName = (type: string) => {
        switch(type) {
            case 'story': return 'סיפור';
            case 'workbook': return 'חוברת';
            case 'learning_plan': return 'תוכנית למידה';
            default: return 'תוכן';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

        if (diffHours < 1) return 'לפני כמה דקות';
        if (diffHours < 24) return `לפני ${diffHours} שעות`;
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays === 1) return 'אתמול';
        if (diffDays < 7) return `לפני ${diffDays} ימים`;
        return date.toLocaleDateString('he-IL');
    };

    if (!activeProfile) {
        return (
            <div style={styles.centered}>
                <h1 style={styles.mainTitle}>ברוכים הבאים!</h1>
                <p style={styles.subtitle}>נראה שאין עדיין פרופיל פעיל. עברו לדשבורד ההורים כדי ליצור או לבחור פרופיל.</p>
                <button style={styles.button} onClick={() => setCurrentView('parent')}>מעבר לדשבורד הורים</button>
            </div>
        )
    }
     return (
        <div style={{...styles.dashboard, position: 'relative', overflow: 'hidden'}}>
            <AnimatedWordsBackground />
             <div className="child-dashboard-header">
                <img 
                    src={activeProfile.photo_url || activeProfile.photo || `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${activeProfile.name}`} 
                    alt={activeProfile.name} 
                    className="child-avatar"
                />
                <div>
                    <h1 style={{...styles.mainTitle, marginBottom: '0.5rem'}}>היי {activeProfile.name},</h1>
                    <p style={{...styles.subtitle, margin: 0}}>בוא/י נצא להרפתקה של למידה ויצירה!</p>
                </div>
            </div>
            <AnimatedSection>
                <div className="dashboard-menu-container">
                    <div onClick={() => setCurrentView('learning-center')} className="dashboard-menu-item">
                        <div className="dashboard-menu-item-shine"></div>
                        <div className="portal-icon">🎓</div>
                        <h3>מרכז הלמידה</h3>
                        <p>ניצור יחד חוברות עבודה חכמות או תוכניות למידה מודרכות בנושאים שאת/ה הכי אוהב/ת!</p>
                    </div>
                    <div onClick={() => setCurrentView('story')} className="dashboard-menu-item">
                        <div className="dashboard-menu-item-shine"></div>
                        <div className="portal-icon">✒️</div>
                        <h3>יוצר הסיפורים</h3>
                        <p>נהפוך אותך לגיבור/ת סיפור הרפתקאות אישי ומאויר שיצרתם לגמרי בעצמכם!</p>
                    </div>
                </div>
            </AnimatedSection>

            {/* Recent Content Gallery */}
            <AnimatedSection>
                <div style={{marginTop: '3rem'}}>
                    <h2 style={{...styles.sectionTitle, textAlign: 'center', marginBottom: '2rem'}}>
                        ✨ היצירות שלי ✨
                    </h2>

                    {isLoadingContent ? (
                        <div style={styles.centered}>
                            <div className="spinner"></div>
                            <p style={{marginTop: '1rem'}}>טוען את היצירות שלך...</p>
                        </div>
                    ) : recentContent.length === 0 ? (
                        <div style={{
                            ...styles.card,
                            textAlign: 'center',
                            padding: '3rem 2rem',
                            background: 'linear-gradient(145deg, rgba(26, 46, 26, 0.6), rgba(36, 60, 36, 0.5))',
                            border: '2px solid var(--glass-border)',
                        }}>
                            <div style={{fontSize: '4rem', marginBottom: '1rem'}}>🎨</div>
                            <h3 style={{...styles.subtitle, marginBottom: '0.5rem'}}>עדיין לא יצרת כלום!</h3>
                            <p style={{color: 'var(--text-secondary)', marginBottom: '2rem'}}>
                                התחל ליצור סיפורים מדהימים, חוברות עבודה מעניינות ותוכניות למידה מותאמות אישית
                            </p>
                        </div>
                    ) : (
                        <div className="content-gallery-grid">
                            {recentContent.map((item, index) => (
                                <div
                                    key={`${item.type}-${item.id}`}
                                    className="content-card fade-in"
                                    style={{animationDelay: `${index * 0.1}s`}}
                                    onClick={() => {
                                        // Navigate to appropriate view with content ID
                                        if (item.type === 'story') {
                                            setCurrentView(`story?id=${item.id}`);
                                        } else if (item.type === 'workbook') {
                                            setCurrentView(`learning-center?type=workbook&id=${item.id}`);
                                        } else if (item.type === 'learning_plan') {
                                            setCurrentView(`learning-center?type=plan&id=${item.id}`);
                                        }
                                    }}
                                >
                                    <div className="content-card-header">
                                        <div className="content-icon">{getContentIcon(item.type)}</div>
                                        <div className="content-type-badge">{getContentTypeName(item.type)}</div>
                                    </div>
                                    <div className="content-card-body">
                                        <h4 className="content-title">{item.title || item.topic || 'ללא כותרת'}</h4>
                                        <p className="content-date">{formatDate(item.updated_at)}</p>
                                        {item.description && (
                                            <p className="content-description">{item.description.substring(0, 80)}...</p>
                                        )}
                                    </div>
                                    <div className="content-card-footer">
                                        <span className="content-action">לחץ לצפייה והמשך עבודה →</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </AnimatedSection>
        </div>
    );
};

export default ChildDashboard;