import React, { useState, useEffect } from 'react';
import Header from './Header';
import HeroSection from './HeroSection';
import FeaturesSection from './FeaturesSection';
import PricingSection from './PricingSection';
import AboutSection from './AboutSection';
import LoginModal from './LoginModal';
import AnimatedSection from './AnimatedSection';
import Footer from './Footer';
import ContentEditor from './ContentEditor';
import EditableContent from './EditableContent';
import AdvancedCMSPanel from './AdvancedCMSPanel';
import { supabase } from '../supabaseClient';
import { useAppContext } from './AppContext';


interface HowItWorksSectionProps {
    content: Record<string, any>;
    isEditMode: boolean;
    onEdit: (key: string) => void;
}

const HowItWorksSection = ({ content, isEditMode, onEdit }: HowItWorksSectionProps) => (
    <AnimatedSection>
        <section id="how-it-works">
            <EditableContent sectionKey="howitworks_title" isEditMode={isEditMode} onEdit={onEdit}>
                <h2 className="section-title">{content.howitworks_title || 'איך הקסם עובד?'}</h2>
            </EditableContent>
            <EditableContent sectionKey="howitworks_subtitle" isEditMode={isEditMode} onEdit={onEdit}>
                <p className="section-subtitle">{content.howitworks_subtitle || 'בכמה צעדים פשוטים, תפתחו עולם שלם של יצירה ולמידה מותאמת אישית.'}</p>
            </EditableContent>
            <div className="how-it-works-grid">
                <div className="step-card">
                    <EditableContent sectionKey="step_1_number" isEditMode={isEditMode} onEdit={onEdit}>
                        <div className="step-number">{content.step_1_number || '01'}</div>
                    </EditableContent>
                    <EditableContent sectionKey="step_1_title" isEditMode={isEditMode} onEdit={onEdit}>
                        <h3>{content.step_1_title || 'יוצרים פרופיל'}</h3>
                    </EditableContent>
                    <EditableContent sectionKey="step_1_description" isEditMode={isEditMode} onEdit={onEdit}>
                        <p>{content.step_1_description || 'הקימו פרופיל אישי לכל ילד, עם תחומי העניין, הגיל ומטרות הלמידה שלו.'}</p>
                    </EditableContent>
                </div>
                <div className="step-card">
                    <EditableContent sectionKey="step_2_number" isEditMode={isEditMode} onEdit={onEdit}>
                        <div className="step-number">{content.step_2_number || '02'}</div>
                    </EditableContent>
                    <EditableContent sectionKey="step_2_title" isEditMode={isEditMode} onEdit={onEdit}>
                        <h3>{content.step_2_title || 'בוחרים פעילות'}</h3>
                    </EditableContent>
                    <EditableContent sectionKey="step_2_description" isEditMode={isEditMode} onEdit={onEdit}>
                        <p>{content.step_2_description || 'האם תרצו לצאת להרפתקה בסיפור אישי מאויר.'}</p>
                    </EditableContent>
                </div>
                <div className="step-card">
                    <EditableContent sectionKey="step_3_number" isEditMode={isEditMode} onEdit={onEdit}>
                        <div className="step-number">{content.step_3_number || '03'}</div>
                    </EditableContent>
                    <EditableContent sectionKey="step_3_title" isEditMode={isEditMode} onEdit={onEdit}>
                        <h3>{content.step_3_title || 'יוצרים ולומדים'}</h3>
                    </EditableContent>
                    <EditableContent sectionKey="step_3_description" isEditMode={isEditMode} onEdit={onEdit}>
                        <p>{content.step_3_description || 'היו שותפים פעילים ביצירה!'}</p>
                    </EditableContent>
                </div>
            </div>
        </section>
    </AnimatedSection>
);

interface CreationShowcaseSectionProps {
    content: Record<string, any>;
    isEditMode: boolean;
    onEdit: (key: string) => void;
}

const CreationShowcaseSection = ({ content, isEditMode, onEdit }: CreationShowcaseSectionProps) => (
    <AnimatedSection>
        <section id="showcase">
            <EditableContent sectionKey="showcase_title" isEditMode={isEditMode} onEdit={onEdit}>
                <h2 className="section-title">{content.showcase_title || 'הצצה לעולם הקסום שלנו'}</h2>
            </EditableContent>
            <EditableContent sectionKey="showcase_subtitle" isEditMode={isEditMode} onEdit={onEdit}>
                <p className="section-subtitle">{content.showcase_subtitle || 'ראו דוגמאות למה שתוכלו ליצור.'}</p>
            </EditableContent>
            <div className="showcase-grid">
                <div className="showcase-card">
                    <EditableContent sectionKey="showcase_1_image" isEditMode={isEditMode} onEdit={onEdit}>
                        <img src={content.showcase_1_image || "https://images.unsplash.com/photo-1531362221037-9a6e14a1a516?q=80&w=800&auto=format&fit=crop"} alt="Illustrated story page" />
                    </EditableContent>
                    <div className="showcase-card-content">
                        <EditableContent sectionKey="showcase_1_title" isEditMode={isEditMode} onEdit={onEdit}>
                            <h3>{content.showcase_1_title || 'סיפור אישי מאויר'}</h3>
                        </EditableContent>
                        <EditableContent sectionKey="showcase_1_description" isEditMode={isEditMode} onEdit={onEdit}>
                            <p>{content.showcase_1_description || 'הילד שלכם הופך לגיבור בסיפור.'}</p>
                        </EditableContent>
                    </div>
                </div>
                <div className="showcase-card">
                    <EditableContent sectionKey="showcase_2_image" isEditMode={isEditMode} onEdit={onEdit}>
                        <img src={content.showcase_2_image || "https://images.unsplash.com/photo-1456743625079-86a97ff8bc82?q=80&w=800&auto=format&fit=crop"} alt="Smart workbook page" />
                    </EditableContent>
                    <div className="showcase-card-content">
                        <EditableContent sectionKey="showcase_2_title" isEditMode={isEditMode} onEdit={onEdit}>
                            <h3>{content.showcase_2_title || 'חוברת למידה חכמה'}</h3>
                        </EditableContent>
                        <EditableContent sectionKey="showcase_2_description" isEditMode={isEditMode} onEdit={onEdit}>
                            <p>{content.showcase_2_description || 'תרגול חשבון הופך למסע בחלל.'}</p>
                        </EditableContent>
                    </div>
                </div>
            </div>
        </section>
    </AnimatedSection>
);

interface TestimonialsSectionProps {
    content: Record<string, any>;
    isEditMode: boolean;
    onEdit: (key: string) => void;
}

const TestimonialsSection = ({ content, isEditMode, onEdit }: TestimonialsSectionProps) => (
    <AnimatedSection>
        <section id="testimonials">
            <EditableContent sectionKey="testimonials_title" isEditMode={isEditMode} onEdit={onEdit}>
                <h2 className="section-title">{content.testimonials_title || 'הורים ממליצים'}</h2>
            </EditableContent>
            <EditableContent sectionKey="testimonials_subtitle" isEditMode={isEditMode} onEdit={onEdit}>
                <p className="section-subtitle">{content.testimonials_subtitle || 'אל תאמינו רק לנו.'}</p>
            </EditableContent>
            <div className="testimonials-grid">
                <div className="testimonial-card">
                    <EditableContent sectionKey="testimonial_1_text" isEditMode={isEditMode} onEdit={onEdit}>
                        <p>{content.testimonial_1_text || '״הבת שלי, מאיה, אף פעם לא התלהבה כל כך מלימוד אותיות.״'}</p>
                    </EditableContent>
                    <div className="testimonial-author">
                        <EditableContent sectionKey="testimonial_1_avatar" isEditMode={isEditMode} onEdit={onEdit}>
                            <img src={content.testimonial_1_avatar || "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=100&auto=format&fit=crop"} alt="Yael Cohen" className="testimonial-avatar" />
                        </EditableContent>
                        <div>
                            <EditableContent sectionKey="testimonial_1_name" isEditMode={isEditMode} onEdit={onEdit}>
                                <strong>{content.testimonial_1_name || 'יעל כהן'}</strong>
                            </EditableContent>
                            <EditableContent sectionKey="testimonial_1_role" isEditMode={isEditMode} onEdit={onEdit}>
                                <p>{content.testimonial_1_role || 'אמא של מאיה, בת 5'}</p>
                            </EditableContent>
                        </div>
                    </div>
                </div>
                <div className="testimonial-card">
                    <EditableContent sectionKey="testimonial_2_text" isEditMode={isEditMode} onEdit={onEdit}>
                        <p>{content.testimonial_2_text || '״כלי מדהים. הסיפורים האישיים הפכו לטקס קבוע.״'}</p>
                    </EditableContent>
                     <div className="testimonial-author">
                        <EditableContent sectionKey="testimonial_2_avatar" isEditMode={isEditMode} onEdit={onEdit}>
                            <img src={content.testimonial_2_avatar || "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=100&auto=format&fit=crop"} alt="David Levi" className="testimonial-avatar" />
                        </EditableContent>
                        <div>
                            <EditableContent sectionKey="testimonial_2_name" isEditMode={isEditMode} onEdit={onEdit}>
                                <strong>{content.testimonial_2_name || 'דוד לוי'}</strong>
                            </EditableContent>
                            <EditableContent sectionKey="testimonial_2_role" isEditMode={isEditMode} onEdit={onEdit}>
                                <p>{content.testimonial_2_role || 'אבא של אורי, בן 6'}</p>
                            </EditableContent>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </AnimatedSection>
);


const LandingPage = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [content, setContent] = useState<Record<string, any>>({});
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingSection, setEditingSection] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showAdvancedCMS, setShowAdvancedCMS] = useState(false);
    const { user } = useAppContext();

    // Check if user is the main admin
    const isMainAdmin = user?.email === 'ofirbaranesad@gmail.com' && user?.role === 'admin';

    // Load content from database
    useEffect(() => {
        loadContent();
    }, []);

    const loadContent = async () => {
        try {
            const { data, error } = await supabase
                .from('landing_page_content')
                .select('*')
                .eq('is_active', true);

            if (error) throw error;

            // Transform array to key-value object
            const contentMap: Record<string, any> = {};
            data?.forEach((item: any) => {
                contentMap[item.section_key] = item.image_url || item.content_value;
            });

            setContent(contentMap);
        } catch (error) {
            console.error('Error loading content:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (sectionKey: string) => {
        setEditingSection(sectionKey);
    };

    const handleSave = async (sectionKey: string, value: string, imageUrl?: string) => {
        try {
            // Get the content type from database
            const { data: existing } = await supabase
                .from('landing_page_content')
                .select('content_type')
                .eq('section_key', sectionKey)
                .single();

            const contentType = existing?.content_type || 'text';

            // Update the database
            const updateData: any = {
                updated_at: new Date().toISOString(),
                updated_by: user?.id
            };

            if (contentType === 'image') {
                updateData.image_url = imageUrl || value;
                updateData.content_value = imageUrl || value;
            } else {
                updateData.content_value = value;
            }

            const { error } = await supabase
                .from('landing_page_content')
                .update(updateData)
                .eq('section_key', sectionKey);

            if (error) throw error;

            // Update local state
            setContent(prev => ({
                ...prev,
                [sectionKey]: imageUrl || value
            }));

            setEditingSection(null);
            console.log('✅ Content updated successfully');
        } catch (error) {
            console.error('Error saving content:', error);
            alert('שגיאה בשמירת התוכן');
        }
    };

    const handleCancel = () => {
        setEditingSection(null);
    };

    // Get current editing item details
    const getCurrentEditItem = () => {
        if (!editingSection) return null;

        return {
            sectionKey: editingSection,
            currentValue: content[editingSection] || '',
            currentImageUrl: content[editingSection] || '',
            contentType: editingSection.includes('image') || editingSection.includes('avatar') || editingSection.includes('logo') ? 'image' : 'text'
        };
    };

    const editItem = getCurrentEditItem();

    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                color: 'var(--primary-color)'
            }}>
                <div>טוען תוכן...</div>
            </div>
        );
    }

    return (
        <>
            {isModalOpen && <LoginModal onClose={() => setIsModalOpen(false)} />}
            {editItem && (
                <ContentEditor
                    sectionKey={editItem.sectionKey}
                    currentValue={editItem.currentValue}
                    currentImageUrl={editItem.currentImageUrl}
                    contentType={editItem.contentType}
                    onSave={handleSave}
                    onCancel={handleCancel}
                />
            )}
            <Header onLoginClick={() => setIsModalOpen(true)} />

            {/* CMS Control Buttons (only for main admin) */}
            {isMainAdmin && (
                <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Advanced CMS Panel Button */}
                    <button
                        onClick={() => setShowAdvancedCMS(!showAdvancedCMS)}
                        style={{
                            background: showAdvancedCMS
                                ? 'linear-gradient(135deg, #667eea, #764ba2)'
                                : 'linear-gradient(135deg, #f093fb, #f5576c)',
                            color: '#fff',
                            border: 'none',
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            fontSize: '1.8rem',
                            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.1) rotate(90deg)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                        }}
                        title="פאנל CMS מתקדם"
                    >
                        ⚙️
                    </button>

                    {/* Quick Edit Mode Button */}
                    <button
                        onClick={() => setIsEditMode(!isEditMode)}
                        style={{
                            background: isEditMode
                                ? 'linear-gradient(135deg, #ff6b6b, #ff8787)'
                                : 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
                            color: '#fff',
                            border: 'none',
                            padding: '1rem 1.5rem',
                            borderRadius: '50px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '0.9rem',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                            transition: 'all 0.3s ease',
                            whiteSpace: 'nowrap'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
                            e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0) scale(1)';
                            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.2)';
                        }}
                        title="עריכה מהירה"
                    >
                        {isEditMode ? '✅ סיום' : '✏️ עריכה'}
                    </button>
                </div>
            )}

            {/* Advanced CMS Panel */}
            {showAdvancedCMS && isMainAdmin && (
                <AdvancedCMSPanel onClose={() => {
                    setShowAdvancedCMS(false);
                    loadContent(); // Refresh content after closing panel
                }} />
            )}

            <main className="landing-container">
                <HeroSection
                    onCTAClick={() => setIsModalOpen(true)}
                    content={content}
                    isEditMode={isEditMode}
                    onEdit={handleEdit}
                />
                <FeaturesSection
                    content={content}
                    isEditMode={isEditMode}
                    onEdit={handleEdit}
                />
                <HowItWorksSection
                    content={content}
                    isEditMode={isEditMode}
                    onEdit={handleEdit}
                />
                <CreationShowcaseSection
                    content={content}
                    isEditMode={isEditMode}
                    onEdit={handleEdit}
                />
                <TestimonialsSection
                    content={content}
                    isEditMode={isEditMode}
                    onEdit={handleEdit}
                />
                <PricingSection onCTAClick={() => setIsModalOpen(true)}/>
                <AboutSection />
            </main>
            <Footer />
        </>
    );
};

export default LandingPage;