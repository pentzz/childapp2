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
    // Additional fields for direct table loading
    profile_name?: string;
    username?: string;
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
    }, [user, filterType, showOnlyFavorites, sortBy, isAdminView]);

    const loadContents = async () => {
        if (!user && !isAdminView) return;

        setIsLoading(true);
        try {
            const allContents: SavedContent[] = [];

            // Load from saved_content table (if exists)
            try {
                let savedContentQuery = supabase
                    .from('saved_content')
                    .select('*');

                if (!isAdminView) {
                    savedContentQuery = savedContentQuery.eq('user_id', user!.id);
                }

                if (filterType !== 'all') {
                    savedContentQuery = savedContentQuery.eq('content_type', filterType);
                }

                if (showOnlyFavorites) {
                    savedContentQuery = savedContentQuery.eq('is_favorite', true);
                }

                savedContentQuery = savedContentQuery.eq('is_archived', false);

                switch (sortBy) {
                    case 'created':
                        savedContentQuery = savedContentQuery.order('created_at', { ascending: false });
                        break;
                    case 'updated':
                        savedContentQuery = savedContentQuery.order('updated_at', { ascending: false });
                        break;
                    case 'views':
                        savedContentQuery = savedContentQuery.order('view_count', { ascending: false });
                        break;
                    case 'likes':
                        savedContentQuery = savedContentQuery.order('like_count', { ascending: false });
                        break;
                }

                const { data: savedData, error: savedError } = await savedContentQuery;

                if (!savedError && savedData) {
                    const savedContents = savedData.map((item: any) => ({
                        id: item.id,
                        user_id: item.user_id,
                        profile_id: item.profile_id,
                        content_type: item.content_type,
                        title: item.title,
                        description: item.description,
                        thumbnail_url: item.thumbnail_url,
                        content_data: item.content_data,
                        is_favorite: item.is_favorite || false,
                        is_archived: item.is_archived || false,
                        is_public: item.is_public || false,
                        view_count: item.view_count || 0,
                        like_count: item.like_count || 0,
                        share_count: item.share_count || 0,
                        tags: item.tags || [],
                        created_at: item.created_at,
                        updated_at: item.updated_at,
                        last_viewed_at: item.last_viewed_at
                    }));
                    allContents.push(...savedContents);
                }
            } catch (error) {
                console.log('saved_content table not available or error:', error);
            }

            // Load stories directly
            try {
                let storiesQuery = supabase
                    .from('stories')
                    .select('*, profiles(name), users(username, email)');

                if (!isAdminView) {
                    storiesQuery = storiesQuery.eq('user_id', user!.id);
                }

                if (filterType === 'all' || filterType === 'story') {
                    const { data: storiesData, error: storiesError } = await storiesQuery.order('created_at', { ascending: false });

                    if (!storiesError && storiesData) {
                        const stories = storiesData.map((story: any) => ({
                            id: story.id,
                            user_id: story.user_id,
                            profile_id: story.profile_id,
                            content_type: 'story' as const,
                            title: story.title || `סיפור של ${story.profiles?.name || 'ילד'}`,
                            description: `סיפור מותאם אישית עם ${story.story_parts?.length || 0} חלקים`,
                            thumbnail_url: story.thumbnail_url,
                            content_data: {
                                story_parts: story.story_parts,
                                title: story.title
                            },
                            is_favorite: false,
                            is_archived: false,
                            is_public: false,
                            view_count: 0,
                            like_count: 0,
                            share_count: 0,
                            tags: [],
                            created_at: story.created_at,
                            updated_at: story.updated_at || story.created_at,
                            profile_name: story.profiles?.name,
                            username: story.users?.username || story.users?.email?.split('@')[0]
                        }));
                        allContents.push(...stories);
                    }
                }
            } catch (error) {
                console.log('Error loading stories:', error);
            }

            // Load workbooks directly
            try {
                let workbooksQuery = supabase
                    .from('workbooks')
                    .select('*, profiles(name), users(username, email)');

                if (!isAdminView) {
                    workbooksQuery = workbooksQuery.eq('user_id', user!.id);
                }

                if (filterType === 'all' || filterType === 'workbook') {
                    const { data: workbooksData, error: workbooksError } = await workbooksQuery.order('created_at', { ascending: false });

                    if (!workbooksError && workbooksData) {
                        const workbooks = workbooksData.map((wb: any) => ({
                            id: wb.id,
                            user_id: wb.user_id,
                            profile_id: wb.profile_id,
                            content_type: 'workbook' as const,
                            title: wb.title || `חוברת עבודה`,
                            description: `חוברת עבודה אינטראקטיבית עם ${wb.exercises?.length || 0} תרגילים`,
                            thumbnail_url: wb.thumbnail_url,
                            content_data: {
                                exercises: wb.exercises,
                                introduction: wb.introduction,
                                conclusion: wb.conclusion
                            },
                            is_favorite: false,
                            is_archived: false,
                            is_public: false,
                            view_count: 0,
                            like_count: 0,
                            share_count: 0,
                            tags: [],
                            created_at: wb.created_at,
                            updated_at: wb.updated_at || wb.created_at,
                            profile_name: wb.profiles?.name,
                            username: wb.users?.username || wb.users?.email?.split('@')[0]
                        }));
                        allContents.push(...workbooks);
                    }
                }
            } catch (error) {
                console.log('Error loading workbooks:', error);
            }

            // Load learning plans directly
            try {
                let plansQuery = supabase
                    .from('learning_plans')
                    .select('*, profiles(name), users(username, email)');

                if (!isAdminView) {
                    plansQuery = plansQuery.eq('user_id', user!.id);
                }

                if (filterType === 'all' || filterType === 'learning_plan') {
                    const { data: plansData, error: plansError } = await plansQuery.order('created_at', { ascending: false });

                    if (!plansError && plansData) {
                        const plans = plansData.map((plan: any) => ({
                            id: plan.id,
                            user_id: plan.user_id,
                            profile_id: plan.profile_id,
                            content_type: 'learning_plan' as const,
                            title: plan.title || `תוכנית למידה`,
                            description: `תוכנית למידה עם ${plan.plan_steps?.length || 0} שלבים`,
                            thumbnail_url: plan.thumbnail_url,
                            content_data: {
                                plan_steps: plan.plan_steps,
                                topic: plan.topic,
                                subject: plan.subject
                            },
                            is_favorite: false,
                            is_archived: false,
                            is_public: false,
                            view_count: 0,
                            like_count: 0,
                            share_count: 0,
                            tags: [],
                            created_at: plan.created_at,
                            updated_at: plan.updated_at || plan.created_at,
                            profile_name: plan.profiles?.name,
                            username: plan.users?.username || plan.users?.email?.split('@')[0]
                        }));
                        allContents.push(...plans);
                    }
                }
            } catch (error) {
                console.log('Error loading learning plans:', error);
            }

            // Sort all contents
            const sortedContents = allContents.sort((a, b) => {
                switch (sortBy) {
                    case 'created':
                        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                    case 'updated':
                        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
                    case 'views':
                        return (b.view_count || 0) - (a.view_count || 0);
                    case 'likes':
                        return (b.like_count || 0) - (a.like_count || 0);
                    default:
                        return 0;
                }
            });

            setContents(sortedContents);

            // Load sections for saved_content items
            const savedContentIds = sortedContents.filter(c => c.content_type !== 'story' && c.content_type !== 'workbook' && c.content_type !== 'learning_plan').map(c => c.id);
            if (savedContentIds.length > 0) {
                try {
                    const { data: sectionsData } = await supabase
                        .from('content_sections')
                        .select('*')
                        .in('content_id', savedContentIds)
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
                } catch (error) {
                    console.log('Error loading content sections:', error);
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
            // Try to update in saved_content first
            const { error } = await supabase
                .from('saved_content')
                .update({ is_favorite: !currentFavorite })
                .eq('id', contentId);

            if (error) {
                console.log('Could not update favorite in saved_content, updating local state only');
            }

            // Update local state
            setContents(prev =>
                prev.map(c =>
                    c.id === contentId ? { ...c, is_favorite: !currentFavorite } : c
                )
            );
        } catch (error) {
            console.error('Error toggling favorite:', error);
        }
    };

    const handleShare = async (content: SavedContent) => {
        const shareUrl = `${window.location.origin}/content/${content.id}`;
        try {
            await navigator.clipboard.writeText(shareUrl);
            alert('קישור הועתק ללוח! 🔗');
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const handleView = async (content: SavedContent) => {
        setSelectedContent(content);

        // Increment view count if possible
        try {
            await supabase
                .from('saved_content')
                .update({ view_count: (content.view_count || 0) + 1 })
                .eq('id', content.id);
        } catch (error) {
            // Ignore if table doesn't exist or update fails
        }
    };

    const handleArchive = async (contentId: number) => {
        if (!confirm('האם אתה בטוח שברצונך לארכב תוכן זה?')) return;

        try {
            await supabase
                .from('saved_content')
                .update({ is_archived: true })
                .eq('id', contentId);

            setContents(prev => prev.filter(c => c.id !== contentId));
        } catch (error) {
            console.error('Error archiving content:', error);
            // Still remove from local state
            setContents(prev => prev.filter(c => c.id !== contentId));
        }
    };

    const filteredContents = contents.filter(content => {
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                content.title.toLowerCase().includes(query) ||
                content.description?.toLowerCase().includes(query) ||
                content.tags.some(tag => tag.toLowerCase().includes(query)) ||
                content.profile_name?.toLowerCase().includes(query) ||
                content.username?.toLowerCase().includes(query)
            );
        }
        return true;
    });

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
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box' as const,
        },
        header: {
            background: 'var(--glass-bg)',
            padding: 'clamp(1.5rem, 4vw, 2.5rem)',
            borderRadius: 'var(--border-radius-large)',
            border: '2px solid var(--glass-border)',
            marginBottom: 'clamp(1.5rem, 3vw, 2rem)',
            boxShadow: 'var(--card-shadow)',
            backdropFilter: 'blur(10px)',
        },
        searchBar: {
            ...styles.input,
            width: '100%',
            padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1rem, 2.5vw, 1.5rem)',
            fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
            marginBottom: 'clamp(1rem, 2.5vw, 1.5rem)',
            borderRadius: '12px',
            transition: 'all 0.3s ease',
        },
        controls: {
            display: 'flex',
            flexWrap: 'wrap' as const,
            gap: 'clamp(0.75rem, 2vw, 1rem)',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        controlGroup: {
            display: 'flex',
            gap: 'clamp(0.4rem, 1.2vw, 0.5rem)',
            flexWrap: 'wrap' as const,
        },
        filterButton: (isActive: boolean) => ({
            ...styles.button,
            background: isActive
                ? 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))'
                : 'rgba(255, 255, 255, 0.1)',
            border: isActive ? '2px solid var(--primary-color)' : '1px solid var(--glass-border)',
            padding: 'clamp(0.6rem, 1.5vw, 0.75rem) clamp(1rem, 2.5vw, 1.5rem)',
            fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
            transition: 'all 0.3s ease',
            whiteSpace: 'nowrap' as const,
        }),
        grid: {
            display: 'grid',
            gridTemplateColumns: viewMode === 'grid'
                ? 'repeat(auto-fill, minmax(clamp(280px, 30vw, 380px), 1fr))'
                : '1fr',
            gap: 'clamp(1rem, 2.5vw, 2rem)',
            marginTop: 'clamp(1.5rem, 3vw, 2rem)',
        },
        contentPreview: {
            background: 'linear-gradient(145deg, rgba(26, 46, 26, 0.95), rgba(36, 60, 36, 0.9))',
            borderRadius: 'var(--border-radius-large)',
            border: '2px solid var(--glass-border)',
            overflow: 'hidden',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            flexDirection: 'column' as const,
            height: '100%',
            position: 'relative' as const,
        } as React.CSSProperties,
        thumbnail: {
            width: '100%',
            height: 'clamp(180px, 25vh, 220px)',
            objectFit: 'cover' as const,
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))',
            animation: 'kenBurnsZoomOut 8s ease-out infinite',
            transformOrigin: 'center center',
            flexShrink: 0,
        },
        contentInfo: {
            padding: 'clamp(1rem, 2.5vw, 1.5rem)',
            flex: 1,
            display: 'flex',
            flexDirection: 'column' as const,
        },
        contentTitle: {
            ...styles.title,
            fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
            marginBottom: 'clamp(0.4rem, 1vw, 0.5rem)',
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(0.4rem, 1vw, 0.5rem)',
            lineHeight: 1.3,
            wordWrap: 'break-word' as const,
            overflowWrap: 'break-word' as const,
        },
        contentMeta: {
            display: 'flex',
            gap: 'clamp(0.75rem, 2vw, 1rem)',
            fontSize: 'clamp(0.8rem, 1.8vw, 0.85rem)',
            color: 'var(--text-secondary)',
            marginTop: 'clamp(0.5rem, 1.5vw, 0.75rem)',
            flexWrap: 'wrap' as const,
        },
        stats: {
            display: 'flex',
            gap: 'clamp(0.3rem, 1vw, 0.5rem)',
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
        
        // Create sections from content_data for stories, workbooks, learning_plans
        let displaySections = contentSections;
        if (contentSections.length === 0 && selectedContent.content_data) {
            if (selectedContent.content_type === 'story' && selectedContent.content_data.story_parts) {
                displaySections = selectedContent.content_data.story_parts.map((part: any, index: number) => ({
                    id: index,
                    content_id: selectedContent.id,
                    section_type: 'text',
                    section_title: `חלק ${index + 1}`,
                    section_content: part.text || part.content || '',
                    section_order: index,
                    image_url: part.image_url || part.image || null
                }));
            } else if (selectedContent.content_type === 'workbook' && selectedContent.content_data.exercises) {
                displaySections = selectedContent.content_data.exercises.map((ex: any, index: number) => ({
                    id: index,
                    content_id: selectedContent.id,
                    section_type: 'text',
                    section_title: `תרגיל ${index + 1}`,
                    section_content: ex.question_text || ex.question || '',
                    section_order: index
                }));
            } else if (selectedContent.content_type === 'learning_plan' && selectedContent.content_data.plan_steps) {
                displaySections = selectedContent.content_data.plan_steps.map((step: any, index: number) => ({
                    id: index,
                    content_id: selectedContent.id,
                    section_type: 'text',
                    section_title: step.step_title || `שלב ${index + 1}`,
                    section_content: JSON.stringify(step, null, 2),
                    section_order: index
                }));
            }
        }

        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.85)',
                backdropFilter: 'blur(10px)',
                zIndex: 1000,
                overflowY: 'auto',
                padding: 'clamp(1rem, 3vw, 2rem)',
                animation: 'fadeIn 0.3s ease'
            }} className="content-view-modal" onClick={() => setSelectedContent(null)}>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectedContent(null);
                    }}
                    style={{
                        ...styles.button,
                        position: 'fixed',
                        top: 'clamp(1rem, 3vw, 2rem)',
                        left: 'clamp(1rem, 3vw, 2rem)',
                        zIndex: 1001,
                        padding: 'clamp(0.75rem, 2vw, 1rem)',
                        fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
                        borderRadius: '50%',
                        width: 'clamp(44px, 8vw, 50px)',
                        height: 'clamp(44px, 8vw, 50px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(239, 68, 68, 0.8)',
                        border: '2px solid var(--error-color)',
                        transition: 'all 0.3s ease',
                    }}
                    className="content-modal-close"
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'rotate(90deg) scale(1.1)';
                        e.currentTarget.style.background = 'var(--error-color)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'rotate(0deg) scale(1)';
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.8)';
                    }}
                >
                    ✕
                </button>
                <div style={{
                    maxWidth: 'clamp(600px, 90vw, 1200px)',
                    margin: '0 auto',
                    paddingTop: 'clamp(4rem, 8vw, 5rem)',
                    animation: 'slideUp 0.4s ease'
                }} onClick={(e) => e.stopPropagation()}>
                    {isAdminView && (selectedContent.username || selectedContent.profile_name) && (
                        <div style={{
                            background: 'rgba(127, 217, 87, 0.15)',
                            padding: 'clamp(0.75rem, 2vw, 1rem)',
                            borderRadius: '12px',
                            marginBottom: '1rem',
                            border: '1px solid var(--primary-color)',
                            fontSize: 'clamp(0.9rem, 2vw, 1rem)'
                        }}>
                            👤 משתמש: <strong>{selectedContent.username}</strong>
                            {selectedContent.profile_name && (
                                <> | 👶 פרופיל: <strong>{selectedContent.profile_name}</strong></>
                            )}
                        </div>
                    )}
                    <ContentCard
                        title={selectedContent.title}
                        sections={displaySections}
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
                    {isAdminView ? '🎨 גלריית כל היצירות' : '🎨 הגלריה שלי'}
                </h1>
                {isAdminView && (
                    <p style={{
                        textAlign: 'center',
                        color: 'var(--text-light)',
                        fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                        marginBottom: '1rem'
                    }}>
                        צפייה בכל היצירות של כל המשתמשים במערכת
                    </p>
                )}

                {/* Search */}
                <input
                    type="text"
                    placeholder="🔍 חפש תוכן, משתמש או פרופיל..."
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
                    marginTop: 'clamp(1rem, 2.5vw, 1.5rem)',
                    padding: 'clamp(0.75rem, 2vw, 1rem)',
                    background: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: 'var(--border-radius)',
                    display: 'flex',
                    gap: 'clamp(1rem, 3vw, 2rem)',
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                    fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                }}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                        <span>📚</span>
                        <span>סה"כ תכנים: <strong>{filteredContents.length}</strong></span>
                    </div>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                        <span>📚</span>
                        <span>סיפורים: <strong>{filteredContents.filter(c => c.content_type === 'story').length}</strong></span>
                    </div>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                        <span>📓</span>
                        <span>חוברות: <strong>{filteredContents.filter(c => c.content_type === 'workbook').length}</strong></span>
                    </div>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                        <span>🎯</span>
                        <span>תוכניות: <strong>{filteredContents.filter(c => c.content_type === 'learning_plan').length}</strong></span>
                    </div>
                    {!isAdminView && (
                        <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                            <span>⭐</span>
                            <span>מועדפים: <strong>{filteredContents.filter(c => c.is_favorite).length}</strong></span>
                        </div>
                    )}
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
                            key={`${content.content_type}-${content.id}`}
                            style={galleryStyles.contentPreview}
                            className="fade-in"
                            onClick={() => handleView(content)}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)';
                                e.currentTarget.style.boxShadow = '0 12px 32px rgba(127, 217, 87, 0.3)';
                                e.currentTarget.style.borderColor = 'var(--primary-color)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0) scale(1)';
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
                                        fontSize: 'clamp(0.85rem, 2vw, 0.9rem)',
                                        color: 'var(--text-secondary)',
                                        marginTop: 'clamp(0.4rem, 1vw, 0.5rem)',
                                        lineHeight: 1.6,
                                    }}>
                                        {content.description.substring(0, 100)}
                                        {content.description.length > 100 && '...'}
                                    </p>
                                )}

                                {(isAdminView && (content.username || content.profile_name)) && (
                                    <div style={{
                                        marginTop: 'clamp(0.5rem, 1.5vw, 0.75rem)',
                                        padding: 'clamp(0.5rem, 1.2vw, 0.75rem)',
                                        background: 'rgba(127, 217, 87, 0.1)',
                                        borderRadius: '8px',
                                        fontSize: 'clamp(0.8rem, 1.8vw, 0.85rem)',
                                        color: 'var(--primary-light)'
                                    }}>
                                        👤 {content.username}
                                        {content.profile_name && ` | 👶 ${content.profile_name}`}
                                    </div>
                                )}

                                <div style={galleryStyles.contentMeta}>
                                    <span style={galleryStyles.stats}>
                                        <span>👁️</span>
                                        <span>{content.view_count || 0}</span>
                                    </span>
                                    <span style={galleryStyles.stats}>
                                        <span>⭐</span>
                                        <span>{content.like_count || 0}</span>
                                    </span>
                                    <span style={galleryStyles.stats}>
                                        <span>🔗</span>
                                        <span>{content.share_count || 0}</span>
                                    </span>
                                    <span>•</span>
                                    <span>{contentTypeNames[content.content_type]}</span>
                                    <span>•</span>
                                    <span style={{fontSize: '0.75rem', opacity: 0.8}}>
                                        {new Date(content.created_at).toLocaleDateString('he-IL')}
                                    </span>
                                </div>

                                {content.tags.length > 0 && (
                                    <div style={{ marginTop: 'clamp(0.5rem, 1.5vw, 0.75rem)', display: 'flex', gap: 'clamp(0.4rem, 1vw, 0.5rem)', flexWrap: 'wrap' }}>
                                        {content.tags.map((tag, index) => (
                                            <span
                                                key={index}
                                                style={{
                                                    background: 'rgba(59, 130, 246, 0.2)',
                                                    padding: 'clamp(0.2rem, 0.8vw, 0.25rem) clamp(0.5rem, 1.5vw, 0.75rem)',
                                                    borderRadius: '12px',
                                                    fontSize: 'clamp(0.7rem, 1.6vw, 0.75rem)',
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
                                padding: 'clamp(0.75rem, 2vw, 1rem)',
                                borderTop: '1px solid var(--glass-border)',
                                display: 'flex',
                                gap: 'clamp(0.4rem, 1vw, 0.5rem)',
                                justifyContent: 'space-between',
                                marginTop: 'auto',
                            }}>
                                {!isAdminView && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleFavoriteToggle(content.id, content.is_favorite);
                                        }}
                                        style={{
                                            ...styles.button,
                                            flex: 1,
                                            padding: 'clamp(0.5rem, 1.2vw, 0.6rem)',
                                            fontSize: 'clamp(0.8rem, 1.8vw, 0.85rem)',
                                            background: content.is_favorite
                                                ? 'linear-gradient(135deg, #fbbf24, #f59e0b)'
                                                : 'rgba(255, 255, 255, 0.1)',
                                            transition: 'all 0.3s ease',
                                        }}
                                    >
                                        {content.is_favorite ? '⭐' : '☆'}
                                    </button>
                                )}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleShare(content);
                                    }}
                                    style={{
                                        ...styles.button,
                                        flex: 1,
                                        padding: 'clamp(0.5rem, 1.2vw, 0.6rem)',
                                        fontSize: 'clamp(0.8rem, 1.8vw, 0.85rem)',
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        transition: 'all 0.3s ease',
                                    }}
                                >
                                    🔗
                                </button>
                                {!isAdminView && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleArchive(content.id);
                                        }}
                                        style={{
                                            ...styles.button,
                                            flex: 1,
                                            padding: 'clamp(0.5rem, 1.2vw, 0.6rem)',
                                            fontSize: 'clamp(0.8rem, 1.8vw, 0.85rem)',
                                            background: 'rgba(239, 68, 68, 0.2)',
                                            transition: 'all 0.3s ease',
                                        }}
                                    >
                                        🗑️
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ContentGallery;
