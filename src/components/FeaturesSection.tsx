import React from 'react';
import AnimatedSection from './AnimatedSection';
import EditableContent from './EditableContent';

interface FeaturesSectionProps {
    content: Record<string, any>;
    isEditMode: boolean;
    onEdit: (key: string) => void;
}

const FeaturesSection = ({ content, isEditMode, onEdit }: FeaturesSectionProps) => {
    return (
        <AnimatedSection>
            <section id="features">
                <EditableContent sectionKey="features_title" isEditMode={isEditMode} onEdit={onEdit}>
                    <h2 className="section-title">{content.features_title || 'מה אפשר להציע לך'}</h2>
                </EditableContent>
                <EditableContent sectionKey="features_subtitle" isEditMode={isEditMode} onEdit={onEdit}>
                    <p className="section-subtitle">{content.features_subtitle || 'כלים חכמים שהופכים למידה ויצירה לחוויה קסומה.'}</p>
                </EditableContent>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">
                            <EditableContent sectionKey="feature_1_icon" isEditMode={isEditMode} onEdit={onEdit}>
                                <span style={{ fontSize: '4rem' }}>{content.feature_1_icon || '📖'}</span>
                            </EditableContent>
                        </div>
                        <EditableContent sectionKey="feature_1_title" isEditMode={isEditMode} onEdit={onEdit}>
                            <h3>{content.feature_1_title || 'סיפורים אישיים מאוירים'}</h3>
                        </EditableContent>
                        <EditableContent sectionKey="feature_1_description" isEditMode={isEditMode} onEdit={onEdit}>
                            <p>{content.feature_1_description || 'הילד שלכם הופך לגיבור בסיפור הרפתקאות.'}</p>
                        </EditableContent>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <EditableContent sectionKey="feature_2_icon" isEditMode={isEditMode} onEdit={onEdit}>
                                <span style={{ fontSize: '4rem' }}>{content.feature_2_icon || '✏️'}</span>
                            </EditableContent>
                        </div>
                        <EditableContent sectionKey="feature_2_title" isEditMode={isEditMode} onEdit={onEdit}>
                            <h3>{content.feature_2_title || 'חוברות עבודה חכמות'}</h3>
                        </EditableContent>
                        <EditableContent sectionKey="feature_2_description" isEditMode={isEditMode} onEdit={onEdit}>
                            <p>{content.feature_2_description || 'חוברות תרגול המבוססות על תחומי העניין.'}</p>
                        </EditableContent>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <EditableContent sectionKey="feature_3_icon" isEditMode={isEditMode} onEdit={onEdit}>
                                <span style={{ fontSize: '4rem' }}>{content.feature_3_icon || '🧠'}</span>
                            </EditableContent>
                        </div>
                        <EditableContent sectionKey="feature_3_title" isEditMode={isEditMode} onEdit={onEdit}>
                            <h3>{content.feature_3_title || 'תוכניות למידה מותאמות'}</h3>
                        </EditableContent>
                        <EditableContent sectionKey="feature_3_description" isEditMode={isEditMode} onEdit={onEdit}>
                            <p>{content.feature_3_description || 'תוכנית למידה מקיפה ומפורטת עם עצות פדגוגיות.'}</p>
                        </EditableContent>
                    </div>
                </div>
            </section>
        </AnimatedSection>
    );
};

export default FeaturesSection;