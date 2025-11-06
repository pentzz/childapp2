import React, { useState } from 'react';
import AnimatedSection from './AnimatedSection';
import EditableContent from './EditableContent';

interface FeaturesSectionProps {
    content: Record<string, any>;
    isEditMode: boolean;
    onEdit: (key: string) => void;
}

const FeaturesSection = ({ content, isEditMode, onEdit }: FeaturesSectionProps) => {
    const [hoveredCard, setHoveredCard] = useState<number | null>(null);

    const features = [
        {
            icon: content.feature_1_icon || '📖',
            title: content.feature_1_title || 'סיפורים אישיים מאוירים',
            description: content.feature_1_description || 'הילד שלכם הופך לגיבור בסיפור הרפתקאות מותאם אישית עם תמונות מרהיבות שנוצרות על ידי AI מתקדם.',
            color: 'var(--primary-color)',
            gradient: 'linear-gradient(135deg, var(--primary-color), var(--primary-light))',
            benefits: ['🎨 תמונות ייחודיות', '📚 סיפור מותאם', '⭐ הילד בכיכוב'],
            keyPrefix: 'feature_1'
        },
        {
            icon: content.feature_2_icon || '✏️',
            title: content.feature_2_title || 'חוברות עבודה חכמות',
            description: content.feature_2_description || 'חוברות תרגול אינטראקטיביות המבוססות על תחומי העניין של הילד, עם שאלות מעניינות ואתגרים מגוונים.',
            color: 'var(--secondary-color)',
            gradient: 'linear-gradient(135deg, var(--secondary-color), var(--primary-light))',
            benefits: ['🎯 מותאם לגיל', '🧩 אתגרים מגוונים', '📝 תרגול מעניין'],
            keyPrefix: 'feature_2'
        },
        {
            icon: content.feature_3_icon || '🧠',
            title: content.feature_3_title || 'תוכניות למידה מותאמות',
            description: content.feature_3_description || 'תוכנית למידה מקיפה ומפורטת המותאמת לצרכים ולמטרות הלמידה של הילד, עם עצות פדגוגיות מעשיות.',
            color: 'var(--accent-color)',
            gradient: 'linear-gradient(135deg, var(--accent-color), var(--primary-color))',
            benefits: ['🎓 פדגוגיה מקצועית', '📊 מעקב התקדמות', '💡 טיפים להורים'],
            keyPrefix: 'feature_3'
        }
    ];

    return (
        <AnimatedSection>
            <section id="features" className="features-section-enhanced">
                <div className="features-header">
                    <EditableContent sectionKey="features_title" isEditMode={isEditMode} onEdit={onEdit}>
                        <h2 className="section-title features-title-enhanced">{content.features_title || 'מה אנחנו מציעים? ✨'}</h2>
                    </EditableContent>
                    <EditableContent sectionKey="features_subtitle" isEditMode={isEditMode} onEdit={onEdit}>
                        <p className="section-subtitle features-subtitle-enhanced">{content.features_subtitle || 'כלים חכמים שהופכים למידה ויצירה לחוויה קסומה ומרתקת לכל ילד'}</p>
                    </EditableContent>
                </div>
                <div className="features-grid features-grid-enhanced">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className={`feature-card feature-card-enhanced ${hoveredCard === index ? 'hovered' : ''}`}
                            onMouseEnter={() => setHoveredCard(index)}
                            onMouseLeave={() => setHoveredCard(null)}
                            style={{
                                animationDelay: `${index * 0.15}s`,
                                '--feature-color': feature.color,
                                '--feature-gradient': feature.gradient
                            } as React.CSSProperties}
                        >
                            <div className="feature-card-inner">
                                <div className="feature-icon-wrapper">
                                    <div className="feature-icon feature-icon-enhanced">
                                        <EditableContent sectionKey={`${feature.keyPrefix}_icon`} isEditMode={isEditMode} onEdit={onEdit}>
                                            <span className="icon-emoji">{feature.icon}</span>
                                        </EditableContent>
                                        <div className="icon-glow"></div>
                                    </div>
                                </div>
                                <div className="feature-content">
                                    <EditableContent sectionKey={`${feature.keyPrefix}_title`} isEditMode={isEditMode} onEdit={onEdit}>
                                        <h3 className="feature-title-enhanced">{feature.title}</h3>
                                    </EditableContent>
                                    <EditableContent sectionKey={`${feature.keyPrefix}_description`} isEditMode={isEditMode} onEdit={onEdit}>
                                        <p className="feature-description-enhanced">{feature.description}</p>
                                    </EditableContent>
                                    <div className="feature-benefits">
                                        {feature.benefits.map((benefit, i) => (
                                            <div key={i} className="benefit-item" style={{ animationDelay: `${i * 0.1}s` }}>
                                                {benefit}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="feature-card-decoration">
                                    <div className="decoration-circle"></div>
                                    <div className="decoration-line"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </AnimatedSection>
    );
};

export default FeaturesSection;