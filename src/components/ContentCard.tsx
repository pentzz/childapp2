import React, { useState } from 'react';
import { styles } from '../../styles';

// =============================================
// 🎨 ContentCard - קומפוננטת כרטיסייה מודרנית
// =============================================

export interface ContentSection {
    id?: number;
    section_order: number;
    section_title: string;
    section_type: 'text' | 'image' | 'activity' | 'quiz' | 'video' | 'code';
    section_data: any;
    background_color?: string;
    icon?: string;
}

export interface ContentCardProps {
    title: string;
    sections: ContentSection[];
    onSave?: () => void;
    onShare?: () => void;
    onFavorite?: () => void;
    isFavorite?: boolean;
    isEditable?: boolean;
    showActions?: boolean;
}

const ContentCard: React.FC<ContentCardProps> = ({
    title,
    sections,
    onSave,
    onShare,
    onFavorite,
    isFavorite = false,
    isEditable = false,
    showActions = true
}) => {
    const [activeTab, setActiveTab] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);

    const sectionIcons: Record<string, string> = {
        text: '📝',
        image: '🖼️',
        activity: '🎯',
        quiz: '❓',
        video: '🎬',
        code: '💻'
    };

    const sectionColors: Record<string, string> = {
        text: 'rgba(59, 130, 246, 0.1)',
        image: 'rgba(236, 72, 153, 0.1)',
        activity: 'rgba(34, 197, 94, 0.1)',
        quiz: 'rgba(251, 146, 60, 0.1)',
        video: 'rgba(168, 85, 247, 0.1)',
        code: 'rgba(14, 165, 233, 0.1)'
    };

    const cardStyles = {
        container: {
            background: 'linear-gradient(145deg, rgba(26, 46, 26, 0.95), rgba(36, 60, 36, 0.9))',
            borderRadius: 'var(--border-radius-large)',
            border: '2px solid var(--glass-border)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            overflow: 'hidden',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative' as const,
        },
        header: {
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))',
            padding: 'clamp(1.5rem, 3vw, 2rem)',
            borderBottom: '1px solid var(--glass-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem'
        },
        title: {
            ...styles.mainTitle,
            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
            margin: 0,
            flex: 1,
            background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
        },
        actionsBar: {
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap' as const
        },
        actionButton: {
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            padding: '0.5rem 1rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontSize: '0.9rem',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            ':hover': {
                background: 'rgba(255, 255, 255, 0.2)',
                transform: 'translateY(-2px)'
            }
        } as React.CSSProperties,
        tabsContainer: {
            display: 'flex',
            flexWrap: 'wrap' as const,
            gap: '0.5rem',
            padding: 'clamp(1rem, 2vw, 1.5rem)',
            background: 'rgba(0, 0, 0, 0.2)',
            borderBottom: '1px solid var(--glass-border)',
            overflowX: 'auto' as const
        },
        tab: (isActive: boolean, sectionType: string) => ({
            padding: '0.75rem 1.5rem',
            borderRadius: '12px',
            border: `2px solid ${isActive ? 'var(--primary-color)' : 'transparent'}`,
            background: isActive
                ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(139, 92, 246, 0.3))'
                : sectionColors[sectionType] || 'rgba(255, 255, 255, 0.05)',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            fontSize: '0.95rem',
            fontWeight: isActive ? '600' : '400',
            color: isActive ? 'var(--primary-color)' : 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            whiteSpace: 'nowrap' as const,
            boxShadow: isActive
                ? '0 4px 12px rgba(59, 130, 246, 0.3)'
                : 'none',
            transform: isActive ? 'scale(1.05)' : 'scale(1)',
        }),
        content: {
            padding: 'clamp(1.5rem, 3vw, 2.5rem)',
            minHeight: '300px',
            maxHeight: isExpanded ? 'none' : '500px',
            overflow: isExpanded ? 'visible' as const : 'hidden' as const,
            position: 'relative' as const
        },
        expandButton: {
            width: '100%',
            padding: '1rem',
            background: 'linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.5))',
            border: 'none',
            borderTop: '1px solid var(--glass-border)',
            color: 'var(--primary-color)',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '600',
            transition: 'all 0.2s',
            ':hover': {
                background: 'linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.7))'
            }
        } as React.CSSProperties
    };

    const renderSectionContent = (section: ContentSection) => {
        const { section_type, section_data } = section;

        switch (section_type) {
            case 'text':
                // Check if this is a story page with image
                const hasImage = section_data?.image_url || section_data?.image;
                const textContent = typeof section_data === 'string' 
                    ? section_data 
                    : (section_data?.text || section_data?.html || '');
                
                return (
                    <div className="fade-in" style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'clamp(1rem, 2.5vw, 1.5rem)',
                        fontSize: 'clamp(1rem, 2vw, 1.1rem)',
                        lineHeight: '1.8',
                        color: 'var(--text-primary)'
                    }}>
                        {hasImage && (
                            <div style={{
                                width: '100%',
                                height: 'clamp(200px, 40vh, 400px)',
                                borderRadius: 'var(--border-radius-large)',
                                overflow: 'hidden',
                                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                                marginBottom: '1rem',
                                position: 'relative'
                            }}>
                                <img
                                    src={section_data.image_url || section_data.image}
                                    alt={section.section_title || 'תמונה'}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        animation: 'kenBurnsZoomOut 8s ease-out infinite',
                                        transformOrigin: 'center center'
                                    }}
                                />
                            </div>
                        )}
                        <div style={{
                            padding: hasImage ? '0' : 'clamp(1rem, 2vw, 1.5rem)',
                            background: hasImage ? 'transparent' : 'rgba(0, 0, 0, 0.2)',
                            borderRadius: 'var(--border-radius)',
                            whiteSpace: 'pre-wrap',
                            wordWrap: 'break-word'
                        }}>
                            {typeof section_data === 'string' ? (
                                <p style={{margin: 0}}>{section_data}</p>
                            ) : (
                                <div dangerouslySetInnerHTML={{ __html: textContent }} />
                            )}
                        </div>
                    </div>
                );

            case 'image':
                return (
                    <div className="fade-in" style={{ textAlign: 'center' }}>
                        {section_data.url && (
                            <img
                                src={section_data.url}
                                alt={section_data.alt || 'תמונה'}
                                style={{
                                    maxWidth: '100%',
                                    height: 'auto',
                                    borderRadius: 'var(--border-radius)',
                                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                                    marginBottom: '1rem'
                                }}
                            />
                        )}
                        {section_data.caption && (
                            <p style={{
                                fontSize: '0.9rem',
                                color: 'var(--text-secondary)',
                                fontStyle: 'italic',
                                marginTop: '0.5rem'
                            }}>
                                {section_data.caption}
                            </p>
                        )}
                    </div>
                );

            case 'activity':
                return (
                    <div className="fade-in" style={{
                        background: 'var(--glass-bg)',
                        padding: 'clamp(1rem, 2vw, 1.5rem)',
                        borderRadius: 'var(--border-radius)',
                        border: '2px solid rgba(34, 197, 94, 0.3)'
                    }}>
                        <h3 style={{
                            ...styles.title,
                            fontSize: 'clamp(1.2rem, 2.5vw, 1.5rem)',
                            marginTop: 0,
                            color: '#22c55e'
                        }}>
                            🎯 {section_data.title || 'פעילות'}
                        </h3>
                        {section_data.description && <p>{section_data.description}</p>}
                        {section_data.steps && (
                            <ol style={{ paddingRight: '1.5rem', marginTop: '1rem' }}>
                                {section_data.steps.map((step: string, index: number) => (
                                    <li key={index} style={{ marginBottom: '0.5rem', lineHeight: '1.6' }}>
                                        {step}
                                    </li>
                                ))}
                            </ol>
                        )}
                    </div>
                );

            case 'quiz':
                return (
                    <div className="fade-in" style={{
                        background: 'var(--glass-bg)',
                        padding: 'clamp(1rem, 2vw, 1.5rem)',
                        borderRadius: 'var(--border-radius)',
                        border: '2px solid rgba(251, 146, 60, 0.3)'
                    }}>
                        <h3 style={{
                            ...styles.title,
                            fontSize: 'clamp(1.2rem, 2.5vw, 1.5rem)',
                            marginTop: 0,
                            color: '#fb923c'
                        }}>
                            ❓ {section_data.question || 'שאלה'}
                        </h3>
                        {section_data.options && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                                {section_data.options.map((option: string, index: number) => (
                                    <div
                                        key={index}
                                        style={{
                                            padding: '1rem',
                                            background: 'rgba(251, 146, 60, 0.1)',
                                            borderRadius: '8px',
                                            border: '1px solid rgba(251, 146, 60, 0.2)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(251, 146, 60, 0.2)';
                                            e.currentTarget.style.transform = 'translateX(-4px)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(251, 146, 60, 0.1)';
                                            e.currentTarget.style.transform = 'translateX(0)';
                                        }}
                                    >
                                        {String.fromCharCode(65 + index)}. {option}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );

            case 'code':
                return (
                    <div className="fade-in">
                        <pre style={{
                            background: '#1e1e1e',
                            color: '#d4d4d4',
                            padding: 'clamp(1rem, 2vw, 1.5rem)',
                            borderRadius: 'var(--border-radius)',
                            overflow: 'auto',
                            fontSize: '0.9rem',
                            lineHeight: '1.6',
                            border: '2px solid rgba(14, 165, 233, 0.3)',
                        }}>
                            <code>{section_data.code || section_data}</code>
                        </pre>
                        {section_data.language && (
                            <p style={{
                                fontSize: '0.85rem',
                                color: 'var(--text-secondary)',
                                marginTop: '0.5rem',
                                textAlign: 'right'
                            }}>
                                שפה: {section_data.language}
                            </p>
                        )}
                    </div>
                );

            case 'video':
                return (
                    <div className="fade-in" style={{ textAlign: 'center' }}>
                        {section_data.url && (
                            <video
                                controls
                                style={{
                                    maxWidth: '100%',
                                    borderRadius: 'var(--border-radius)',
                                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
                                }}
                            >
                                <source src={section_data.url} type="video/mp4" />
                                הדפדפן שלך לא תומך בתגית וידאו.
                            </video>
                        )}
                        {section_data.title && (
                            <h4 style={{ marginTop: '1rem', color: 'var(--text-primary)' }}>
                                {section_data.title}
                            </h4>
                        )}
                    </div>
                );

            default:
                return (
                    <div className="fade-in">
                        <pre style={{
                            background: 'var(--glass-bg)',
                            padding: '1rem',
                            borderRadius: 'var(--border-radius)',
                            overflow: 'auto'
                        }}>
                            {JSON.stringify(section_data, null, 2)}
                        </pre>
                    </div>
                );
        }
    };

    const currentSection = sections[activeTab];

    return (
        <div style={cardStyles.container} className="content-card fade-in">
            {/* Header */}
            <div style={cardStyles.header}>
                <h2 style={cardStyles.title}>{title}</h2>
                {showActions && (
                    <div style={cardStyles.actionsBar}>
                        {onFavorite && (
                            <button
                                onClick={onFavorite}
                                style={{
                                    ...cardStyles.actionButton,
                                    color: isFavorite ? '#fbbf24' : 'var(--text-primary)'
                                }}
                                title={isFavorite ? 'הסר ממועדפים' : 'הוסף למועדפים'}
                            >
                                {isFavorite ? '⭐' : '☆'}
                            </button>
                        )}
                        {onShare && (
                            <button onClick={onShare} style={cardStyles.actionButton} title="שתף">
                                🔗 שתף
                            </button>
                        )}
                        {onSave && (
                            <button onClick={onSave} style={cardStyles.actionButton} title="שמור">
                                💾 שמור
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Tabs */}
            {sections.length > 1 && (
                <div style={cardStyles.tabsContainer}>
                    {sections.map((section, index) => (
                        <button
                            key={index}
                            onClick={() => setActiveTab(index)}
                            style={cardStyles.tab(activeTab === index, section.section_type)}
                        >
                            <span style={{ fontSize: '1.2rem' }}>
                                {section.icon || sectionIcons[section.section_type] || '📄'}
                            </span>
                            <span>{section.section_title}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Content */}
            {currentSection && (
                <div style={cardStyles.content}>
                    {renderSectionContent(currentSection)}
                </div>
            )}

            {/* Expand/Collapse Button */}
            {!isExpanded && currentSection && (
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    style={cardStyles.expandButton}
                >
                    {isExpanded ? '▲ הצג פחות' : '▼ הצג עוד'}
                </button>
            )}
        </div>
    );
};

export default ContentCard;
