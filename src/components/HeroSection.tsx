import React, { useMemo } from 'react';
import EditableContent from './EditableContent';

const AnimatedBackground = () => {
    const chars = 'אבגדהוזחטיכלמנסעפצקרשת1234567890'.split('');
    const colors = ['var(--primary-color)', 'var(--secondary-color)', 'var(--primary-light)'];

    const floatingChars = useMemo(() => {
        return Array.from({ length: 40 }).map((_, i) => {
            const style = {
                left: `${Math.random() * 100}vw`,
                fontSize: `${Math.random() * 2 + 1}rem`,
                animationDelay: `${Math.random() * 20}s`,
                animationDuration: `${Math.random() * 15 + 15}s`,
                opacity: Math.random() * 0.3 + 0.1,
                color: colors[Math.floor(Math.random() * colors.length)]
            };
            const char = chars[Math.floor(Math.random() * chars.length)];
            return <span key={i} style={style}>{char}</span>;
        });
    }, []);

    return <div className="floating-chars">{floatingChars}</div>;
};


interface HeroSectionProps {
    onCTAClick: () => void;
    content: Record<string, any>;
    isEditMode: boolean;
    onEdit: (key: string) => void;
}

const HeroSection = ({ onCTAClick, content, isEditMode, onEdit }: HeroSectionProps) => {
    return (
        <section className="hero-section">
            <AnimatedBackground />
            <EditableContent sectionKey="hero_title" isEditMode={isEditMode} onEdit={onEdit}>
                <h1 className="fade-in" style={{ animationDelay: '0.1s' }}>
                    {content.hero_title || 'גאון'}
                </h1>
            </EditableContent>
            <EditableContent sectionKey="hero_subtitle" isEditMode={isEditMode} onEdit={onEdit}>
                <div className="hero-subtitle fade-in" style={{ animationDelay: '0.2s' }}>
                    {content.hero_subtitle || 'של אמא'}
                </div>
            </EditableContent>
            <EditableContent sectionKey="hero_logo_url" isEditMode={isEditMode} onEdit={onEdit}>
                <img
                    src={content.hero_logo_url || "/logo.png"}
                    alt="לוגו גאון"
                    className="hero-logo fade-in"
                    style={{ animationDelay: '0.3s' }}
                />
            </EditableContent>
            <EditableContent sectionKey="hero_description" isEditMode={isEditMode} onEdit={onEdit}>
                <p className="fade-in" style={{ animationDelay: '0.4s' }}>
                    {content.hero_description || 'פלטפורמת למידה ויצירה מותאמת קבוצתית.'}
                </p>
            </EditableContent>
            <EditableContent sectionKey="hero_cta_text" isEditMode={isEditMode} onEdit={onEdit}>
                <button onClick={onCTAClick} className="hero-cta fade-in" style={{ animationDelay: '0.6s' }}>
                    {content.hero_cta_text || 'התחילו ליצור עכשיו'}
                </button>
            </EditableContent>
        </section>
    );
};

export default HeroSection;