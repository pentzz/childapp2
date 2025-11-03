import React, { useMemo } from 'react';
import { useAppContext } from './AppContext';
import { styles } from '../../styles';
import AnimatedSection from './AnimatedSection';

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
    const { activeProfile } = useAppContext();
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
        </div>
    );
};

export default ChildDashboard;