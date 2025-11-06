import React, { useMemo } from 'react';
import EditableContent from './EditableContent';

const AnimatedBackground = () => {
    const chars = 'אבגדהוזחטיכלמנסעפצקרשת1234567890✨🌟💫⭐🎨📚🎯🚀'.split('');
    const colors = ['var(--primary-color)', 'var(--secondary-color)', 'var(--primary-light)', 'var(--accent-color)'];

    const floatingChars = useMemo(() => {
        return Array.from({ length: 60 }).map((_, i) => {
            const style = {
                left: `${Math.random() * 100}vw`,
                fontSize: `${Math.random() * 2.5 + 1}rem`,
                animationDelay: `${Math.random() * 20}s`,
                animationDuration: `${Math.random() * 15 + 20}s`,
                opacity: Math.random() * 0.4 + 0.1,
                color: colors[Math.floor(Math.random() * colors.length)],
                textShadow: `0 0 10px ${colors[Math.floor(Math.random() * colors.length)]}`
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
        <section className="hero-section hero-section-enhanced">
            <AnimatedBackground />
            <div className="hero-content-wrapper">
                <EditableContent sectionKey="hero_title" isEditMode={isEditMode} onEdit={onEdit}>
                    <h1 className="hero-title-enhanced fade-in" style={{ animationDelay: '0.1s' }}>
                        {content.hero_title || 'גאון'}
                    </h1>
                </EditableContent>
                <EditableContent sectionKey="hero_subtitle" isEditMode={isEditMode} onEdit={onEdit}>
                    <div className="hero-subtitle hero-subtitle-enhanced fade-in" style={{ animationDelay: '0.2s' }}>
                        {content.hero_subtitle || 'של אמא'}
                    </div>
                </EditableContent>
                <EditableContent sectionKey="hero_logo_url" isEditMode={isEditMode} onEdit={onEdit}>
                    <div className="hero-logo-wrapper fade-in" style={{ animationDelay: '0.3s' }}>
                        <img
                            src={content.hero_logo_url || "/logo.png"}
                            alt="לוגו גאון"
                            className="hero-logo hero-logo-enhanced"
                        />
                        <div className="logo-glow-effect"></div>
                    </div>
                </EditableContent>
                <EditableContent sectionKey="hero_description" isEditMode={isEditMode} onEdit={onEdit}>
                    <p className="hero-description-enhanced fade-in" style={{ animationDelay: '0.4s' }}>
                        {content.hero_description || 'פלטפורמת למידה ויצירה מותאמת אישית לילדים ✨'}
                    </p>
                </EditableContent>
                <EditableContent sectionKey="hero_cta_text" isEditMode={isEditMode} onEdit={onEdit}>
                    <div className="hero-cta-wrapper fade-in" style={{ animationDelay: '0.6s' }}>
                        <button onClick={onCTAClick} className="hero-cta hero-cta-enhanced">
                            <span className="cta-text">{content.hero_cta_text || 'התחילו ליצור עכשיו'}</span>
                            <span className="cta-icon">🚀</span>
                        </button>
                        <div className="hero-features-preview">
                            <span className="feature-badge">📖 סיפורים</span>
                            <span className="feature-badge">✏️ חוברות</span>
                            <span className="feature-badge">🧠 תוכניות למידה</span>
                        </div>
                    </div>
                </EditableContent>
            </div>
            <div className="hero-scroll-indicator fade-in" style={{ animationDelay: '0.8s' }}>
                <div className="scroll-icon">⬇</div>
                <span>גלו עוד</span>
            </div>
        </section>
    );
};

export default HeroSection;