import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAppContext } from './AppContext';
import ContentCard, { ContentSection } from './ContentCard';
import { styles } from '../../styles';
import Loader from './Loader';

// =============================================
// 🎨 ContentGallery - גלרייה מודרנית של תכנים
// =============================================

export interface SavedContent {
    id: number;
    user_id: string;
    profile_id?: number;
    content_type: 'story' | 'workbook' | 'learning_plan' | 'worksheet' | 'custom';
    title: string;
    description?: string;
    thumbnail_url?: string;
    content_data: any;
    is_favorite: boolean;
    is_archived: boolean;
    is_public: boolean;
    view_count: number;
    like_count: number;
    share_count: number;
    tags: string[];
    created_at: string;
    updated_at: string;
    last_viewed_at?: string;
}

interface ContentGalleryProps {
    filterType?: 'story' | 'workbook' | 'learning_plan' | 'worksheet' | 'custom' | 'all';
    showOnlyFavorites?: boolean;
    isAdminView?: boolean;
}

const ContentGallery: React.FC<ContentGalleryProps> = ({
    filterType = 'all',
    showOnlyFavorites = false,
    isAdminView = false
}) => {
    const { user, activeProfile } = useAppContext();
    const [contents, setContents] = useState<SavedContent[]>([]);
    const [sections, setSections] = useState<Record<number, ContentSection[]>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [sortBy, setSortBy] = useState<'created' | 'updated' | 'views' | 'likes'>('created');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedContent, setSelectedContent] = useState<SavedContent | null>(null);

    useEffect(() => {
        loadContents();
    }, [user, filterType, showOnlyFavorites, sortBy]);

    const loadContents = async () => {
        if (!user && !isAdminView) return;

        setIsLoading(true);
        try {
            let query = supabase
                .from('saved_content')
                .select('*');

            // Filter by user (unless admin view)
            if (!isAdminView) {
                query = query.eq('user_id', user!.id);
            }

            // Filter by type
            if (filterType !== 'all') {
                query = query.eq('content_type', filterType);
            }

            // Filter favorites
            if (showOnlyFavorites) {
                query = query.eq('is_favorite', true);
            }

            // Don't show archived
            query = query.eq('is_archived', false);

            // Sort
            switch (sortBy) {
                case 'created':
                    query = query.order('created_at', { ascending: false });
                    break;
                case 'updated':
                    query = query.order('updated_at', { ascending: false });
                    break;
                case 'views':
                    query = query.order('view_count', { ascending: false });
                    break;
                case 'likes':
                    query = query.order('like_count', { ascending: false });
                    break;
            }

            const { data, error } = await query;

            if (error) throw error;

            setContents(data || []);

            // Load sections for each content
            if (data && data.length > 0) {
                const contentIds = data.map(c => c.id);
                const { data: sectionsData } = await supabase
                    .from('content_sections')
                    .select('*')
                    .in('content_id', contentIds)
                    .order('section_order', { ascending: true });

                if (sectionsData) {
                    const sectionsByContent: Record<number, ContentSection[]> = {};
                    sectionsData.forEach(section => {
                        if (!sectionsByContent[section.content_id]) {
                            sectionsByContent[section.content_id] = [];
                        }
                        sectionsByContent[section.content_id].push(section);
                    });
                    setSections(sectionsByContent);
                }
            }
        } catch (error) {
            console.error('Error loading contents:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFavoriteToggle = async (contentId: number, currentFavorite: boolean) => {
        try {
            const { error } = await supabase
                .from('saved_content')
                .update({ is_favorite: !currentFavorite })
                .eq('id', contentId);

            if (error) throw error;

            // Update local state
            setContents(prev =>
                prev.map(c =>
                    c.id === contentId ? { ...c, is_favorite: !currentFavorite } : c
                )
            );

            // Track analytics
            await supabase.from('content_analytics').insert({
                content_id: contentId,
                user_id: user!.id,
                event_type: currentFavorite ? 'unlike' : 'like'
            });
        } catch (error) {
            console.error('Error toggling favorite:', error);
        }
    };

    const handleShare = async (content: SavedContent) => {
        // Copy link to clipboard or open share modal
        const shareUrl = `${window.location.origin}/content/${content.id}`;
        try {
            await navigator.clipboard.writeText(shareUrl);
            alert('קישור הועתק ללוח! 🔗');

            // Update share count
            await supabase
                .from('saved_content')
                .update({ share_count: content.share_count + 1 })
                .eq('id', content.id);

            // Track analytics
            await supabase.from('content_analytics').insert({
                content_id: content.id,
                user_id: user!.id,
                event_type: 'share'
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const handleView = async (content: SavedContent) => {
        setSelectedContent(content);

        // Increment view count
        try {
            await supabase.rpc('increment_content_view', { content_uuid: content.id });
        } catch (error) {
            console.error('Error incrementing view count:', error);
        }
    };

    const handleArchive = async (contentId: number) => {
        if (!confirm('האם אתה בטוח שברצונך לארכב תוכן זה?')) return;

        try {
            const { error } = await supabase
                .from('saved_content')
                .update({ is_archived: true })
                .eq('id', contentId);

            if (error) throw error;

            setContents(prev => prev.filter(c => c.id !== contentId));

            // Track analytics
            await supabase.from('content_analytics').insert({
                content_id: contentId,
                user_id: user!.id,
                event_type: 'delete'
            });
        } catch (error) {
            console.error('Error archiving content:', error);
        }
    };

    const filteredContents = contents.filter(content =>
        content.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        content.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        content.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const contentTypeIcons: Record<string, string> = {
        story: '📚',
        workbook: '📓',
        learning_plan: '🎯',
        worksheet: '📄',
        custom: '✨'
    };

    const contentTypeNames: Record<string, string> = {
        story: 'סיפור',
        workbook: 'מחברת',
        learning_plan: 'תוכנית לימוד',
        worksheet: 'דף עבודה',
        custom: 'תוכן מותאם'
    };

    const galleryStyles = {
        container: {
            padding: 'clamp(1rem, 3vw, 2rem)',
        },
        header: {
            background: 'var(--glass-bg)',
            padding: 'clamp(1.5rem, 3vw, 2rem)',
            borderRadius: 'var(--border-radius-large)',
            border: '2px solid var(--glass-border)',
            marginBottom: '2rem',
            boxShadow: 'var(--card-shadow)',
        },
        searchBar: {
            ...styles.input,
            width: '100%',
            padding: '1rem 1.5rem',
            fontSize: '1.1rem',
            marginBottom: '1.5rem',
        },
        controls: {
            display: 'flex',
            flexWrap: 'wrap' as const,
            gap: '1rem',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        controlGroup: {
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap' as const,
        },
        filterButton: (isActive: boolean) => ({
            ...styles.button,
            background: isActive
                ? 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))'
                : 'rgba(255, 255, 255, 0.1)',
            border: isActive ? '2px solid var(--primary-color)' : '1px solid var(--glass-border)',
            padding: '0.75rem 1.5rem',
            fontSize: '0.95rem',
        }),
        grid: {
            display: 'grid',
            gridTemplateColumns: viewMode === 'grid'
                ? 'repeat(auto-fill, minmax(350px, 1fr))'
                : '1fr',
            gap: 'clamp(1rem, 2vw, 2rem)',
            marginTop: '2rem',
        },
        contentPreview: {
            background: 'linear-gradient(145deg, rgba(26, 46, 26, 0.95), rgba(36, 60, 36, 0.9))',
            borderRadius: 'var(--border-radius-large)',
            border: '2px solid var(--glass-border)',
            overflow: 'hidden', // חשוב! מונע שהתמונה תצא מהמסגרת בזמן הזום
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
            ':hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                borderColor: 'var(--primary-color)',
            }
        } as React.CSSProperties,
        thumbnail: {
            width: '100%',
            height: '200px',
            objectFit: 'cover' as const,
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))',
            animation: 'kenBurnsZoomOut 8s ease-out infinite',
            transformOrigin: 'center center',
        },
        contentInfo: {
            padding: 'clamp(1rem, 2vw, 1.5rem)',
        },
        contentTitle: {
            ...styles.title,
            fontSize: 'clamp(1.2rem, 2.5vw, 1.5rem)',
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
        },
        contentMeta: {
            display: 'flex',
            gap: '1rem',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            marginTop: '0.75rem',
        },
        stats: {
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
        },
        emptyState: {
            textAlign: 'center' as const,
            padding: 'clamp(3rem, 6vw, 5rem)',
            background: 'var(--glass-bg)',
            borderRadius: 'var(--border-radius-large)',
            border: '2px dashed var(--glass-border)',
        }
    };

    if (isLoading) {
        return <Loader message="טוען תכנים..." />;
    }

    // Show selected content in elegant modal
    if (selectedContent) {
        const contentSections = sections[selectedContent.id] || [];
        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.9)',
                zIndex: 10000,
                overflowY: 'auto',
                padding: 'clamp(1rem, 3vw, 2rem)',
                animation: 'fadeIn 0.3s ease'
            }} className="content-view-modal" onClick={() => setSelectedContent(null)}>
                <div style={{
                    maxWidth: 'clamp(600px, 90vw, 1400px)',
                    margin: '0 auto',
                    paddingTop: 'clamp(3rem, 6vw, 5rem)',
                    animation: 'slideUp 0.4s ease'
                }} onClick={(e) => e.stopPropagation()}>
                    <button
                        onClick={() => setSelectedContent(null)}
                        style={{
                            position: 'fixed',
                            top: 'clamp(1rem, 3vw, 2rem)',
                            right: 'clamp(1rem, 3vw, 2rem)',
                            background: 'var(--glass-bg)',
                            border: '2px solid var(--error-color)',
                            borderRadius: '50%',
                            width: 'clamp(44px, 8vw, 56px)',
                            height: 'clamp(44px, 8vw, 56px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                            color: 'var(--white)',
                            zIndex: 10001,
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                        }}
                        className="content-modal-close"
                        title="סגור"
                    >
                        ✕
                    </button>
                    <ContentCard
                        title={selectedContent.title}
                        sections={contentSections}
                        onFavorite={() => handleFavoriteToggle(selectedContent.id, selectedContent.is_favorite)}
                        onShare={() => handleShare(selectedContent)}
                        isFavorite={selectedContent.is_favorite}
                        showActions={true}
                    />
                </div>
            </div>
        );
    }

    return (
        <div style={galleryStyles.container}>
            {/* Header */}
            <div style={galleryStyles.header} className="fade-in">
                <h1 style={{ ...styles.mainTitle, marginBottom: '1.5rem', textAlign: 'center' }}>
                    🎨 הגלריה שלי
                </h1>

                {/* Search */}
                <input
                    type="text"
                    placeholder="🔍 חפש תוכן..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={galleryStyles.searchBar}
                />

                {/* Controls */}
                <div style={galleryStyles.controls}>
                    <div style={galleryStyles.controlGroup}>
                        <button
                            onClick={() => setSortBy('created')}
                            style={galleryStyles.filterButton(sortBy === 'created')}
                        >
                            🕐 חדשים
                        </button>
                        <button
                            onClick={() => setSortBy('updated')}
                            style={galleryStyles.filterButton(sortBy === 'updated')}
                        >
                            📝 עודכנו לאחרונה
                        </button>
                        <button
                            onClick={() => setSortBy('views')}
                            style={galleryStyles.filterButton(sortBy === 'views')}
                        >
                            👁️ הכי נצפים
                        </button>
                        <button
                            onClick={() => setSortBy('likes')}
                            style={galleryStyles.filterButton(sortBy === 'likes')}
                        >
                            ⭐ הכי אהובים
                        </button>
                    </div>

                    <div style={galleryStyles.controlGroup}>
                        <button
                            onClick={() => setViewMode('grid')}
                            style={galleryStyles.filterButton(viewMode === 'grid')}
                        >
                            ⊞ רשת
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            style={galleryStyles.filterButton(viewMode === 'list')}
                        >
                            ☰ רשימה
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div style={{
                    marginTop: '1.5rem',
                    padding: '1rem',
                    background: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: 'var(--border-radius)',
                    display: 'flex',
                    gap: '2rem',
                    justifyContent: 'center',
                    flexWrap: 'wrap'
                }}>
                    <div>📚 סה"כ תכנים: <strong>{filteredContents.length}</strong></div>
                    <div>⭐ מועדפים: <strong>{filteredContents.filter(c => c.is_favorite).length}</strong></div>
                    <div>👁️ צפיות: <strong>{filteredContents.reduce((sum, c) => sum + c.view_count, 0)}</strong></div>
                </div>
            </div>

            {/* Content Grid */}
            {filteredContents.length === 0 ? (
                <div style={galleryStyles.emptyState} className="fade-in">
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📭</div>
                    <h2 style={styles.title}>אין תכנים להצגה</h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        {searchQuery ? 'נסה חיפוש אחר' : 'התחל ליצור תוכן חדש!'}
                    </p>
                </div>
            ) : (
                <div style={galleryStyles.grid}>
                    {filteredContents.map((content) => (
                        <div
                            key={content.id}
                            style={galleryStyles.contentPreview}
                            className="fade-in"
                            onClick={() => handleView(content)}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.3)';
                                e.currentTarget.style.borderColor = 'var(--primary-color)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
                                e.currentTarget.style.borderColor = 'var(--glass-border)';
                            }}
                        >
                            {content.thumbnail_url && (
                                <img
                                    src={content.thumbnail_url}
                                    alt={content.title}
                                    style={galleryStyles.thumbnail}
                                />
                            )}
                            {!content.thumbnail_url && (
                                <div style={galleryStyles.thumbnail}>
                                    <div style={{
                                        height: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '4rem'
                                    }}>
                                        {contentTypeIcons[content.content_type]}
                                    </div>
                                </div>
                            )}

                            <div style={galleryStyles.contentInfo}>
                                <h3 style={galleryStyles.contentTitle}>
                                    <span>{contentTypeIcons[content.content_type]}</span>
                                    <span>{content.title}</span>
                                </h3>

                                {content.description && (
                                    <p style={{
                                        fontSize: '0.9rem',
                                        color: 'var(--text-secondary)',
                                        marginTop: '0.5rem',
                                        lineHeight: '1.6',
                                    }}>
                                        {content.description.substring(0, 100)}
                                        {content.description.length > 100 && '...'}
                                    </p>
                                )}

                                <div style={galleryStyles.contentMeta}>
                                    <span style={galleryStyles.stats}>
                                        <span>👁️</span>
                                        <span>{content.view_count}</span>
                                    </span>
                                    <span style={galleryStyles.stats}>
                                        <span>⭐</span>
                                        <span>{content.like_count}</span>
                                    </span>
                                    <span style={galleryStyles.stats}>
                                        <span>🔗</span>
                                        <span>{content.share_count}</span>
                                    </span>
                                    <span>•</span>
                                    <span>{contentTypeNames[content.content_type]}</span>
                                </div>

                                {content.tags.length > 0 && (
                                    <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {content.tags.map((tag, index) => (
                                            <span
                                                key={index}
                                                style={{
                                                    background: 'rgba(59, 130, 246, 0.2)',
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '12px',
                                                    fontSize: '0.75rem',
                                                    border: '1px solid rgba(59, 130, 246, 0.3)',
                                                }}
                                            >
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Action buttons */}
                            <div style={{
                                padding: '1rem',
                                borderTop: '1px solid var(--glass-border)',
                                display: 'flex',
                                gap: '0.5rem',
                                justifyContent: 'space-between',
                            }}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleFavoriteToggle(content.id, content.is_favorite);
                                    }}
                                    style={{
                                        ...styles.button,
                                        flex: 1,
                                        padding: '0.5rem',
                                        fontSize: '0.85rem',
                                        background: content.is_favorite
                                            ? 'linear-gradient(135deg, #fbbf24, #f59e0b)'
                                            : 'rgba(255, 255, 255, 0.1)',
                                    }}
                                >
                                    {content.is_favorite ? '⭐' : '☆'}
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleShare(content);
                                    }}
                                    style={{
                                        ...styles.button,
                                        flex: 1,
                                        padding: '0.5rem',
                                        fontSize: '0.85rem',
                                        background: 'rgba(255, 255, 255, 0.1)',
                                    }}
                                >
                                    🔗
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleArchive(content.id);
                                    }}
                                    style={{
                                        ...styles.button,
                                        flex: 1,
                                        padding: '0.5rem',
                                        fontSize: '0.85rem',
                                        background: 'rgba(239, 68, 68, 0.2)',
                                    }}
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ContentGallery;
