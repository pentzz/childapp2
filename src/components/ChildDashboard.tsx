import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from './AppContext';
import { styles } from '../../styles';
import AnimatedSection from './AnimatedSection';
import ProfileImageUpload from './ProfileImageUpload';
import { supabase } from '../supabaseClient';
import { getProfileImage, getAllStories, getAllWorkbooks, getLocalStats } from '../services/localStorageDB';
import { FaBook, FaFileAlt, FaChartLine, FaStar, FaImage, FaRocket } from 'react-icons/fa';

// --- AnimatedWordsBackground Component ---
const AnimatedWordsBackground = () => {
    const words = useMemo(() => {
        const wordList = ['✨', '📚', '🎨', '🚀', '⭐', '💡', '🎯', '🌟', '🎪', '🎭'];
        return Array.from({ length: 30 }).map((_, i) => {
            const style: React.CSSProperties = {
                left: `${Math.random() * 100}%`,
                fontSize: `${Math.random() * 3 + 1.5}rem`,
                animationDuration: `${Math.random() * 25 + 20}s`,
                animationDelay: `${Math.random() * 10}s`,
                opacity: Math.random() * 0.4 + 0.1,
            };
            const word = wordList[Math.floor(Math.random() * wordList.length)];
            return <span key={i} className="floating-word" style={style}>{word}</span>;
        });
    }, []);

    return <div className="floating-words-bg">{words}</div>;
};

interface ChildDashboardProps {
    setCurrentView: (view: string, contentId?: number, contentType?: 'story' | 'workbook' | 'learning_plan') => void;
}

const ChildDashboard = ({ setCurrentView }: ChildDashboardProps) => {
    const { activeProfile, user } = useAppContext();
    const [recentContent, setRecentContent] = useState<any[]>([]);
    const [isLoadingContent, setIsLoadingContent] = useState(false);
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [localStats, setLocalStats] = useState<any>(null);
    const [showImageUpload, setShowImageUpload] = useState(false);

    useEffect(() => {
        if (activeProfile) {
            loadProfileData();
            loadRecentContent();
            loadLocalStats();
        }
    }, [activeProfile, user]);

    const loadProfileData = async () => {
        if (!activeProfile) return;

        const img = await getProfileImage(activeProfile.id.toString());
        if (img) {
            setProfileImage(img.imageData);
        }
    };

    const loadLocalStats = async () => {
        const stats = await getLocalStats();
        setLocalStats(stats);
    };

    const loadRecentContent = async () => {
        if (!activeProfile) return;

        setIsLoadingContent(true);
        try {
            // טען מ-Supabase
            let supabaseContent: any[] = [];
            if (user) {
                const [stories, workbooks, plans] = await Promise.all([
                    supabase.from('stories').select('*').eq('user_id', user.id).eq('profile_id', activeProfile.id).order('updated_at', { ascending: false }).limit(3),
                    supabase.from('workbooks').select('*').eq('user_id', user.id).eq('profile_id', activeProfile.id).order('updated_at', { ascending: false }).limit(3),
                    supabase.from('learning_plans').select('*').eq('user_id', user.id).eq('profile_id', activeProfile.id).order('updated_at', { ascending: false }).limit(3),
                ]);

                supabaseContent = [
                    ...(stories.data || []).map((s: any) => ({ ...s, type: 'story', source: 'cloud' })),
                    ...(workbooks.data || []).map((w: any) => ({ ...w, type: 'workbook', source: 'cloud' })),
                    ...(plans.data || []).map((p: any) => ({ ...p, type: 'learning_plan', source: 'cloud' }))
                ];
            }

            // טען מהאחסון המקומי
            const localStories = await getAllStories();
            const localWorkbooks = await getAllWorkbooks();

            const localContent = [
                ...localStories.filter(s => s.childProfileId === activeProfile.id.toString()).map(s => ({ ...s, type: 'story', source: 'local' })),
                ...localWorkbooks.filter(w => w.childProfileId === activeProfile.id.toString()).map(w => ({ ...w, type: 'workbook', source: 'local' }))
            ];

            // שלב והצג
            const combined = [...supabaseContent, ...localContent]
                .sort((a, b) => {
                    const aTime = a.updated_at ? new Date(a.updated_at).getTime() : a.updatedAt || 0;
                    const bTime = b.updated_at ? new Date(b.updated_at).getTime() : b.updatedAt || 0;
                    return bTime - aTime;
                })
                .slice(0, 6);

            setRecentContent(combined);
        } catch (error) {
            console.error('Error loading content:', error);
        } finally {
            setIsLoadingContent(false);
        }
    };

    const activityCards = [
        {
            icon: <FaBook />,
            title: 'צור סיפור חדש',
            description: 'צור סיפור מותאם אישית עם תמונות קסומות',
            color: '#7FD957',
            action: () => setCurrentView('story'),
            gradient: 'linear-gradient(135deg, #7FD957, #56D989)',
        },
        {
            icon: <FaFileAlt />,
            title: 'חוברת עבודה',
            description: 'תרגול וחיזוק ידע בנושאים שונים',
            color: '#56D989',
            action: () => setCurrentView('workbook'),
            gradient: 'linear-gradient(135deg, #56D989, #7FD957)',
        },
        {
            icon: <FaChartLine />,
            title: 'תוכנית למידה',
            description: 'מסלול למידה מותאם אישית',
            color: '#FFE66D',
            action: () => setCurrentView('learning'),
            gradient: 'linear-gradient(135deg, #FFE66D, #FFAA00)',
        },
    ];

    if (!activeProfile) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <h2>אנא בחר פרופיל ילד</h2>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            position: 'relative',
            overflow: 'hidden',
        }}>
            <AnimatedWordsBackground />

            <div style={{
                maxWidth: '1400px',
                margin: '0 auto',
                padding: 'clamp(1rem, 3vw, 2rem)',
                position: 'relative',
                zIndex: 1,
            }}>
                {/* כרטיס פרופיל מרכזי */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    style={{
                        background: 'linear-gradient(135deg, rgba(127, 217, 87, 0.15), rgba(86, 217, 137, 0.1))',
                        border: '3px solid var(--primary-color)',
                        borderRadius: '24px',
                        padding: 'clamp(1.5rem, 4vw, 3rem)',
                        marginBottom: 'clamp(2rem, 4vw, 3rem)',
                        boxShadow: '0 20px 60px rgba(127, 217, 87, 0.3)',
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    {/* דקורציה */}
                    <div style={{
                        position: 'absolute',
                        top: '-50px',
                        right: '-50px',
                        width: '200px',
                        height: '200px',
                        background: 'radial-gradient(circle, rgba(127, 217, 87, 0.2) 0%, transparent 70%)',
                        borderRadius: '50%',
                        pointerEvents: 'none',
                    }} />

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: window.innerWidth > 768 ? 'auto 1fr' : '1fr',
                        gap: 'clamp(1.5rem, 3vw, 2.5rem)',
                        alignItems: 'center',
                    }}>
                        {/* תמונת פרופיל */}
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            transition={{ type: 'spring', stiffness: 300 }}
                            onClick={() => setShowImageUpload(!showImageUpload)}
                            style={{
                                position: 'relative',
                                cursor: 'pointer',
                            }}
                        >
                            <div style={{
                                width: 'clamp(100px, 20vw, 180px)',
                                height: 'clamp(100px, 20vw, 180px)',
                                borderRadius: '50%',
                                border: '5px solid var(--primary-color)',
                                overflow: 'hidden',
                                background: profileImage
                                    ? `url(${profileImage})`
                                    : 'linear-gradient(135deg, var(--primary-color), var(--primary-light))',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 'clamp(3rem, 8vw, 5rem)',
                                boxShadow: '0 10px 40px rgba(127, 217, 87, 0.4)',
                                position: 'relative',
                            }}>
                                {!profileImage && <span>👤</span>}

                                {/* אייקון מצלמה */}
                                <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    style={{
                                        position: 'absolute',
                                        bottom: '5px',
                                        right: '5px',
                                        background: 'var(--primary-color)',
                                        borderRadius: '50%',
                                        width: '40px',
                                        height: '40px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                        color: '#0d1a0d',
                                    }}
                                >
                                    <FaImage size={20} />
                                </motion.div>
                            </div>
                        </motion.div>

                        {/* מידע */}
                        <div>
                            <motion.h1
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                style={{
                                    fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                                    color: 'var(--primary-color)',
                                    marginBottom: '0.5rem',
                                    fontFamily: 'var(--font-serif)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    flexWrap: 'wrap',
                                }}
                            >
                                שלום, {activeProfile.name}!
                                <motion.span
                                    animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
                                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                                >
                                    👋
                                </motion.span>
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                style={{
                                    fontSize: 'clamp(1rem, 2.5vw, 1.3rem)',
                                    color: 'var(--text-secondary)',
                                    marginBottom: '1.5rem',
                                }}
                            >
                                מוכנ/ה להרפתקה חדשה? בוא/י נלמד ונצור ביחד! 🚀
                            </motion.p>

                            {/* סטטיסטיקות */}
                            {localStats && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    style={{
                                        display: 'flex',
                                        gap: 'clamp(1rem, 2vw, 1.5rem)',
                                        flexWrap: 'wrap',
                                    }}
                                >
                                    {[
                                        { icon: '📚', label: 'סיפורים', value: localStats.stories },
                                        { icon: '📝', label: 'חוברות', value: localStats.workbooks },
                                        { icon: '⭐', label: 'הישגים', value: localStats.stories + localStats.workbooks },
                                    ].map((stat, i) => (
                                        <div
                                            key={i}
                                            style={{
                                                background: 'rgba(127, 217, 87, 0.2)',
                                                padding: '0.75rem 1.25rem',
                                                borderRadius: '12px',
                                                border: '2px solid rgba(127, 217, 87, 0.3)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                            }}
                                        >
                                            <span style={{ fontSize: '1.5rem' }}>{stat.icon}</span>
                                            <div>
                                                <div style={{
                                                    fontSize: 'clamp(1.2rem, 2.5vw, 1.8rem)',
                                                    fontWeight: 'bold',
                                                    color: 'var(--primary-color)',
                                                }}>{stat.value}</div>
                                                <div style={{
                                                    fontSize: 'clamp(0.75rem, 1.5vw, 0.9rem)',
                                                    color: 'var(--text-secondary)',
                                                }}>{stat.label}</div>
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </div>
                    </div>

                    {/* העלאת תמונה */}
                    {showImageUpload && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            style={{ marginTop: '2rem' }}
                        >
                            <ProfileImageUpload
                                childProfileId={activeProfile.id.toString()}
                                currentImage={profileImage || undefined}
                                onImageUploaded={(img) => {
                                    setProfileImage(img);
                                    setShowImageUpload(false);
                                }}
                            />
                        </motion.div>
                    )}
                </motion.div>

                {/* כרטיסי פעילויות */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <h2 style={{
                        fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
                        color: 'var(--primary-color)',
                        marginBottom: 'clamp(1.5rem, 3vw, 2rem)',
                        textAlign: 'center',
                        fontFamily: 'var(--font-serif)',
                    }}>
                        מה נרצה ליצור היום? 🎨
                    </h2>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: 'clamp(1rem, 2vw, 1.5rem)',
                        marginBottom: 'clamp(2rem, 4vw, 3rem)',
                    }}>
                        {activityCards.map((card, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 + index * 0.1 }}
                                whileHover={{ y: -10, scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={card.action}
                                style={{
                                    background: card.gradient,
                                    borderRadius: '20px',
                                    padding: 'clamp(1.5rem, 3vw, 2rem)',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    boxShadow: `0 10px 30px ${card.color}40`,
                                    border: `3px solid ${card.color}`,
                                }}
                            >
                                <div style={{
                                    fontSize: 'clamp(3rem, 6vw, 4rem)',
                                    marginBottom: '1rem',
                                    color: '#0d1a0d',
                                }}>
                                    {card.icon}
                                </div>

                                <h3 style={{
                                    fontSize: 'clamp(1.3rem, 2.5vw, 1.8rem)',
                                    color: '#0d1a0d',
                                    fontWeight: 'bold',
                                    marginBottom: '0.5rem',
                                }}>
                                    {card.title}
                                </h3>

                                <p style={{
                                    fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
                                    color: 'rgba(13, 26, 13, 0.8)',
                                    lineHeight: 1.5,
                                }}>
                                    {card.description}
                                </p>

                                <motion.div
                                    style={{
                                        position: 'absolute',
                                        bottom: '10px',
                                        right: '10px',
                                        fontSize: '2rem',
                                    }}
                                    animate={{ x: [0, 5, 0] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                >
                                    →
                                </motion.div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* תוכן אחרון */}
                {recentContent.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                    >
                        <h2 style={{
                            fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
                            color: 'var(--primary-color)',
                            marginBottom: 'clamp(1.5rem, 3vw, 2rem)',
                            fontFamily: 'var(--font-serif)',
                        }}>
                            המשך מאיפה שעצרת 📖
                        </h2>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                            gap: 'clamp(1rem, 2vw, 1.5rem)',
                        }}>
                            {recentContent.map((item, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.7 + index * 0.05 }}
                                    whileHover={{ scale: 1.05 }}
                                    style={{
                                        background: 'rgba(127, 217, 87, 0.1)',
                                        border: '2px solid rgba(127, 217, 87, 0.3)',
                                        borderRadius: '16px',
                                        padding: '1.5rem',
                                        cursor: 'pointer',
                                    }}
                                    onClick={() => {
                                        if (item.source === 'cloud' && item.id) {
                                            setCurrentView(item.type, item.id, item.type);
                                        }
                                    }}
                                >
                                    <div style={{
                                        fontSize: '2.5rem',
                                        marginBottom: '0.5rem',
                                    }}>
                                        {item.type === 'story' && '📚'}
                                        {item.type === 'workbook' && '📝'}
                                        {item.type === 'learning_plan' && '🎯'}
                                    </div>

                                    <h4 style={{
                                        fontSize: 'clamp(1.1rem, 2vw, 1.3rem)',
                                        color: 'var(--text-light)',
                                        marginBottom: '0.5rem',
                                        fontWeight: 'bold',
                                    }}>
                                        {item.title || item.content?.title || 'ללא שם'}
                                    </h4>

                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        fontSize: '0.85rem',
                                        color: 'var(--text-secondary)',
                                    }}>
                                        <span>{item.source === 'local' ? '💾 מקומי' : '☁️ ענן'}</span>
                                        <span>
                                            {new Date(item.updated_at || item.updatedAt).toLocaleDateString('he-IL')}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default ChildDashboard;
