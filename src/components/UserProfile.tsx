import React, { useState, useEffect } from 'react';
import { useAppContext } from './AppContext';
import { supabase } from '../supabaseClient';
import { styles } from '../../styles';

interface UserProfileProps {
    setCurrentView?: (view: string, contentId?: number, contentType?: 'story' | 'workbook' | 'learning_plan') => void;
}

// Avatar component that tries Google avatar first, then custom, then default
const AvatarDisplay = ({ userId, username, customAvatarUrl }: { userId: string, username: string, customAvatarUrl: string | null }) => {
    const [avatarSrc, setAvatarSrc] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadAvatar = async () => {
            try {
                // First try Google avatar
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user?.user_metadata?.avatar_url) {
                    setAvatarSrc(session.user.user_metadata.avatar_url);
                    setLoading(false);
                    return;
                }
                if (session?.user?.user_metadata?.picture) {
                    setAvatarSrc(session.user.user_metadata.picture);
                    setLoading(false);
                    return;
                }
                
                // Then try custom uploaded avatar
                if (customAvatarUrl) {
                    setAvatarSrc(customAvatarUrl);
                    setLoading(false);
                    return;
                }
                
                // Try from storage
                const { data } = supabase.storage
                    .from('user-avatars')
                    .getPublicUrl(`${userId}/avatar.jpg`);
                
                try {
                    const response = await fetch(data.publicUrl, { method: 'HEAD' });
                    if (response.ok) {
                        setAvatarSrc(data.publicUrl);
                        setLoading(false);
                        return;
                    }
                } catch {
                    // File doesn't exist
                }
                
                // Default avatar
                setAvatarSrc(`https://api.dicebear.com/8.x/avataaars/svg?seed=${username}`);
                setLoading(false);
            } catch (error) {
                console.error('Error loading avatar:', error);
                setAvatarSrc(`https://api.dicebear.com/8.x/avataaars/svg?seed=${username}`);
                setLoading(false);
            }
        };
        
        loadAvatar();
    }, [userId, username, customAvatarUrl]);

    if (loading) {
        return (
            <div style={{
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                background: 'var(--glass-bg)',
                border: '4px solid var(--primary-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-light)',
                fontSize: '3rem'
            }}>
                ⏳
            </div>
        );
    }

    return (
        <img
            src={avatarSrc}
            alt={username}
            style={{
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '4px solid var(--primary-color)',
                boxShadow: '0 8px 25px rgba(127, 217, 87, 0.3)'
            }}
            onError={(e) => {
                // Final fallback
                const target = e.target as HTMLImageElement;
                target.src = `https://api.dicebear.com/8.x/avataaars/svg?seed=${username}`;
            }}
        />
    );
};

interface ContentHistoryItem {
    id: number;
    title: string;
    type: 'story' | 'workbook' | 'learning_plan' | 'worksheet';
    created_at: string;
    profile_name: string;
    data?: any;
}

const UserProfile = ({ setCurrentView }: UserProfileProps = {}) => {
    const { user } = useAppContext();
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [contentHistory, setContentHistory] = useState<ContentHistoryItem[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [activeTab, setActiveTab] = useState<'profile' | 'history'>('profile');
    const [deletingId, setDeletingId] = useState<number | null>(null);

    useEffect(() => {
        if (user) {
            loadUserAvatar();
            loadContentHistory();
        }
    }, [user]);

    const loadUserAvatar = async () => {
        if (!user) return;
        
        try {
            // Try to get avatar from user metadata or Google account
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.user_metadata?.avatar_url) {
                setAvatarUrl(session.user.user_metadata.avatar_url);
                return;
            }
            if (session?.user?.user_metadata?.picture) {
                setAvatarUrl(session.user.user_metadata.picture);
                return;
            }
            
            // Try to load from Supabase Storage
            const { data } = supabase.storage
                .from('user-avatars')
                .getPublicUrl(`${user.id}/avatar.jpg`);
            
            // Check if file exists by trying to fetch it
            try {
                const response = await fetch(data.publicUrl, { method: 'HEAD' });
                if (response.ok) {
                    setAvatarUrl(data.publicUrl);
                }
            } catch {
                // File doesn't exist, will use default
            }
        } catch (error) {
            console.error('Error loading avatar:', error);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0] || !user) return;

        const file = e.target.files[0];
        setUploading(true);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `avatar.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('user-avatars')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data } = supabase.storage
                .from('user-avatars')
                .getPublicUrl(filePath);

            const publicUrl = data.publicUrl;
            setAvatarUrl(publicUrl);
            
            // Force reload avatar
            await loadUserAvatar();
            
            alert('תמונת הפרופיל עודכנה בהצלחה!');
        } catch (error) {
            console.error('Error uploading avatar:', error);
            alert('שגיאה בהעלאת התמונה');
        } finally {
            setUploading(false);
        }
    };

    const loadContentHistory = async () => {
        if (!user) return;
        
        setLoadingHistory(true);
        try {
            const [storiesRes, workbooksRes, plansRes] = await Promise.all([
                supabase
                    .from('stories')
                    .select('id, title, created_at, profile_id, profiles(name)')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(100),
                supabase
                    .from('workbooks')
                    .select('id, title, created_at, profile_id, profiles(name), workbook_data')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(100),
                supabase
                    .from('learning_plans')
                    .select('id, title, created_at, profile_id, profiles(name)')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(100),
            ]);

            const history: ContentHistoryItem[] = [
                ...(storiesRes.data || []).map(item => ({
                    id: item.id,
                    title: item.title || 'סיפור ללא כותרת',
                    type: 'story' as const,
                    created_at: item.created_at,
                    profile_name: (item.profiles as any)?.name || 'לא ידוע',
                    data: null
                })),
                ...(workbooksRes.data || []).map(item => {
                    const workbookData = item.workbook_data;
                    const isWorksheet = workbookData?.type === 'worksheet';
                    return {
                        id: item.id,
                        title: item.title || (isWorksheet ? 'דף תרגול ללא כותרת' : 'חוברת עבודה ללא כותרת'),
                        type: isWorksheet ? 'worksheet' as const : 'workbook' as const,
                        created_at: item.created_at,
                        profile_name: (item.profiles as any)?.name || 'לא ידוע',
                        data: workbookData
                    };
                }),
                ...(plansRes.data || []).map(item => ({
                    id: item.id,
                    title: item.title || 'תוכנית למידה ללא כותרת',
                    type: 'learning_plan' as const,
                    created_at: item.created_at,
                    profile_name: (item.profiles as any)?.name || 'לא ידוע',
                    data: null
                })),
            ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            setContentHistory(history);
        } catch (error) {
            console.error('Error loading content history:', error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('he-IL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getContentTypeLabel = (type: string) => {
        switch (type) {
            case 'story': return '📚 סיפור';
            case 'workbook': return '📝 חוברת עבודה';
            case 'worksheet': return '📄 דף תרגול';
            case 'learning_plan': return '🎯 תוכנית למידה';
            default: return type;
        }
    };

    const getGoogleAvatar = () => {
        if (!user) return null;
        const { data: { session } } = supabase.auth.getSession();
        return session?.then(({ data: { session } }) => 
            session?.user?.user_metadata?.avatar_url || 
            session?.user?.user_metadata?.picture
        ) || null;
    };

    if (!user) return null;

    return (
        <div style={{
            ...styles.dashboard,
            padding: 'clamp(1rem, 4vw, 2rem)',
            width: '100%',
            boxSizing: 'border-box',
            maxWidth: '1400px',
            margin: '0 auto'
        }}>
            <h1 style={{...styles.mainTitle, fontSize: 'clamp(1.8rem, 5vw, 2.5rem)'}}>👤 הפרופיל שלי</h1>
            <p style={{...styles.subtitle, fontSize: 'clamp(0.9rem, 3vw, 1.1rem)'}}>ניהול פרופיל אישי וצפייה בהיסטוריית התוכן שיצרת</p>

            {/* Tabs */}
            <div style={{
                display: 'flex', 
                gap: '0.5rem', 
                marginBottom: '2rem',
                flexWrap: 'wrap',
                justifyContent: 'center'
            }}>
                <button
                    onClick={() => setActiveTab('profile')}
                    style={{
                        padding: '1rem 2rem',
                        background: activeTab === 'profile' 
                            ? 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))' 
                            : 'var(--glass-bg)',
                        border: '1px solid ' + (activeTab === 'profile' ? 'var(--primary-light)' : 'var(--glass-border)'),
                        borderRadius: '12px',
                        color: activeTab === 'profile' ? 'white' : 'var(--text-light)',
                        fontSize: '1rem',
                        fontWeight: activeTab === 'profile' ? '700' : '500',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: activeTab === 'profile' ? '0 4px 15px rgba(127, 217, 87, 0.3)' : 'none',
                        minWidth: '160px'
                    }}
                >
                    👤 פרופיל אישי
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    style={{
                        padding: '1rem 2rem',
                        background: activeTab === 'history' 
                            ? 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))' 
                            : 'var(--glass-bg)',
                        border: '1px solid ' + (activeTab === 'history' ? 'var(--primary-light)' : 'var(--glass-border)'),
                        borderRadius: '12px',
                        color: activeTab === 'history' ? 'white' : 'var(--text-light)',
                        fontSize: '1rem',
                        fontWeight: activeTab === 'history' ? '700' : '500',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: activeTab === 'history' ? '0 4px 15px rgba(127, 217, 87, 0.3)' : 'none',
                        minWidth: '160px'
                    }}
                >
                    📚 היסטוריית תוכן
                </button>
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
                <div style={{
                    background: 'linear-gradient(145deg, rgba(26, 46, 26, 0.9), rgba(36, 60, 36, 0.8))',
                    padding: 'clamp(1.5rem, 4vw, 2rem)',
                    borderRadius: 'var(--border-radius-large)',
                    border: '2px solid var(--glass-border)',
                    boxShadow: 'var(--card-shadow)',
                    backdropFilter: 'blur(15px)',
                    width: '100%',
                    boxSizing: 'border-box'
                }}>
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem'}}>
                        <div style={{position: 'relative'}}>
                            <AvatarDisplay userId={user.id} username={user.username} customAvatarUrl={avatarUrl} />
                            <label
                                style={{
                                    position: 'absolute',
                                    bottom: '0',
                                    right: '0',
                                    background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
                                    color: 'white',
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: uploading ? 'not-allowed' : 'pointer',
                                    border: '3px solid var(--background-dark)',
                                    boxShadow: '0 4px 15px rgba(127, 217, 87, 0.4)',
                                    transition: 'all 0.2s ease',
                                    fontSize: '1.2rem',
                                    opacity: uploading ? 0.6 : 1
                                }}
                                title="העלה תמונת פרופיל"
                                onMouseEnter={(e) => {
                                    if (!uploading) {
                                        e.currentTarget.style.transform = 'scale(1.1)';
                                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(127, 217, 87, 0.6)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(127, 217, 87, 0.4)';
                                }}
                            >
                                {uploading ? '⏳' : '📷'}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarUpload}
                                    style={{display: 'none'}}
                                    disabled={uploading}
                                />
                            </label>
                        </div>
                        {uploading && (
                            <p style={{color: 'var(--text-light)'}}>מעלה תמונה...</p>
                        )}

                        <div style={{textAlign: 'center', width: '100%'}}>
                            <h2 style={{...styles.title, marginBottom: '0.5rem', fontSize: '2rem'}}>
                                {user.username}
                            </h2>
                            {user.email && (
                                <p style={{color: 'var(--text-light)', marginBottom: '1rem', fontSize: '1.1rem'}}>
                                    {user.email}
                                </p>
                            )}
                            <div style={{
                                background: 'var(--glass-bg)',
                                padding: '1.5rem',
                                borderRadius: 'var(--border-radius)',
                                border: '1px solid var(--glass-border)',
                                marginTop: '1.5rem'
                            }}>
                                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem'}}>
                                    <div style={{textAlign: 'center'}}>
                                        <div style={{fontSize: '2.5rem', color: 'var(--primary-light)', fontWeight: 'bold'}}>
                                            {user.credits}
                                        </div>
                                        <div style={{color: 'var(--text-light)', fontSize: '0.9rem'}}>💎 קרדיטים</div>
                                    </div>
                                    <div style={{textAlign: 'center'}}>
                                        <div style={{fontSize: '2.5rem', color: 'var(--white)', fontWeight: 'bold'}}>
                                            {user.profiles.length}
                                        </div>
                                        <div style={{color: 'var(--text-light)', fontSize: '0.9rem'}}>👤 פרופילים</div>
                                    </div>
                                    <div style={{textAlign: 'center'}}>
                                        <div style={{fontSize: '2.5rem', color: 'var(--white)', fontWeight: 'bold'}}>
                                            {contentHistory.length}
                                        </div>
                                        <div style={{color: 'var(--text-light)', fontSize: '0.9rem'}}>📚 תוכן שנוצר</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
                <div style={{
                    background: 'linear-gradient(145deg, rgba(26, 46, 26, 0.9), rgba(36, 60, 36, 0.8))',
                    padding: 'clamp(1.5rem, 4vw, 2rem)',
                    borderRadius: 'var(--border-radius-large)',
                    border: '2px solid var(--glass-border)',
                    boxShadow: 'var(--card-shadow)',
                    backdropFilter: 'blur(15px)',
                    width: '100%',
                    boxSizing: 'border-box'
                }}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem'}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap'}}>
                            <h2 style={{...styles.title, marginTop: 0, margin: 0}}>
                                📚 היסטוריית התוכן שיצרת
                            </h2>
                            <button
                                onClick={loadContentHistory}
                                disabled={loadingHistory}
                                style={{
                                    ...styles.button,
                                    padding: '0.5rem 1rem',
                                    fontSize: '0.9rem',
                                    background: loadingHistory ? 'var(--glass-bg)' : 'var(--primary-color)',
                                    opacity: loadingHistory ? 0.6 : 1,
                                    cursor: loadingHistory ? 'not-allowed' : 'pointer'
                                }}
                                title="רענן היסטוריה"
                            >
                                {loadingHistory ? '⏳ טוען...' : '🔄 רענן'}
                            </button>
                        </div>
                        {contentHistory.length > 0 && (
                            <div style={{
                                background: 'var(--glass-bg)',
                                padding: '0.75rem 1.5rem',
                                borderRadius: 'var(--border-radius)',
                                border: '1px solid var(--glass-border)',
                                display: 'flex',
                                gap: '1rem',
                                alignItems: 'center',
                                flexWrap: 'wrap'
                            }}>
                                <div style={{textAlign: 'center'}}>
                                    <div style={{fontSize: '1.5rem', color: 'var(--primary-light)', fontWeight: 'bold'}}>
                                        {contentHistory.filter(c => c.type === 'story').length}
                                    </div>
                                    <div style={{color: 'var(--text-light)', fontSize: '0.8rem'}}>📚 סיפורים</div>
                                </div>
                                <div style={{textAlign: 'center'}}>
                                    <div style={{fontSize: '1.5rem', color: 'var(--white)', fontWeight: 'bold'}}>
                                        {contentHistory.filter(c => c.type === 'workbook' || c.type === 'worksheet').length}
                                    </div>
                                    <div style={{color: 'var(--text-light)', fontSize: '0.8rem'}}>📝 חוברות</div>
                                </div>
                                <div style={{textAlign: 'center'}}>
                                    <div style={{fontSize: '1.5rem', color: 'var(--white)', fontWeight: 'bold'}}>
                                        {contentHistory.filter(c => c.type === 'learning_plan').length}
                                    </div>
                                    <div style={{color: 'var(--text-light)', fontSize: '0.8rem'}}>🎯 תוכניות</div>
                                </div>
                            </div>
                        )}
                    </div>
                    {loadingHistory ? (
                        <div style={{textAlign: 'center', padding: '3rem', color: 'var(--text-light)'}}>
                            <div style={{fontSize: '3rem', marginBottom: '1rem'}}>⏳</div>
                            <p>טוען היסטוריה...</p>
                        </div>
                    ) : contentHistory.length === 0 ? (
                        <div style={{textAlign: 'center', padding: '3rem', color: 'var(--text-light)'}}>
                            <div style={{fontSize: '3rem', marginBottom: '1rem'}}>📭</div>
                            <p>עדיין לא יצרת תוכן</p>
                            <p style={{fontSize: '0.9rem', marginTop: '0.5rem'}}>בואו נתחיל ליצור!</p>
                        </div>
                    ) : (
                        <div style={{
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '1rem', 
                            maxHeight: '600px', 
                            overflowY: 'auto',
                            padding: '0.5rem'
                        }}>
                                    {contentHistory.map(item => (
                                        <div
                                            key={`${item.type}-${item.id}`}
                                            style={{
                                                background: 'var(--glass-bg)',
                                                padding: '1.5rem',
                                                borderRadius: 'var(--border-radius)',
                                                border: '1px solid var(--glass-border)',
                                                transition: 'all 0.3s ease',
                                                cursor: setCurrentView ? 'pointer' : 'default',
                                                position: 'relative',
                                                width: '100%',
                                                boxSizing: 'border-box'
                                            }}
                                            onMouseEnter={(e) => {
                                                if (setCurrentView) {
                                                    e.currentTarget.style.transform = 'translateY(-3px)';
                                                    e.currentTarget.style.boxShadow = '0 12px 30px rgba(127, 217, 87, 0.3)';
                                                    e.currentTarget.style.borderColor = 'var(--primary-color)';
                                                    e.currentTarget.style.background = 'linear-gradient(145deg, rgba(127, 217, 87, 0.15), rgba(168, 224, 99, 0.1))';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
                                                e.currentTarget.style.borderColor = 'var(--glass-border)';
                                                e.currentTarget.style.background = 'linear-gradient(145deg, var(--glass-bg), rgba(26, 46, 26, 0.6))';
                                            }}
                                            onClick={(e) => {
                                                // Don't navigate if clicking delete button
                                                if ((e.target as HTMLElement).closest('.delete-button')) return;
                                                
                                                // Navigate to the appropriate view
                                                if (setCurrentView) {
                                                    if (item.type === 'story') {
                                                        setCurrentView('story', item.id, 'story');
                                                    } else if (item.type === 'workbook' || item.type === 'worksheet') {
                                                        setCurrentView('learning-center', item.id, 'workbook');
                                                    } else if (item.type === 'learning_plan') {
                                                        setCurrentView('learning-center', item.id, 'learning_plan');
                                                    }
                                                }
                                            }}
                                        >
                                            <div style={{
                                                display: 'flex', 
                                                justifyContent: 'space-between', 
                                                alignItems: 'flex-start', 
                                                gap: '1rem',
                                                flexWrap: 'wrap',
                                                width: '100%'
                                            }}>
                                                <div style={{flex: 1, minWidth: '200px'}}>
                                                    <div style={{
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        gap: '0.5rem', 
                                                        marginBottom: '0.5rem', 
                                                        flexWrap: 'wrap'
                                                    }}>
                                                        <span style={{fontSize: '1.5rem'}}>
                                                            {item.type === 'story' ? '📚' : item.type === 'worksheet' ? '📄' : item.type === 'workbook' ? '📝' : '🎯'}
                                                        </span>
                                                        <h4 style={{
                                                            margin: 0, 
                                                            color: 'var(--white)', 
                                                            fontSize: 'clamp(1rem, 4vw, 1.2rem)',
                                                            wordBreak: 'break-word'
                                                        }}>
                                                            {item.title}
                                                        </h4>
                                                        <span style={{
                                                            fontSize: '0.75rem',
                                                            color: 'var(--primary-light)',
                                                            background: 'rgba(127, 217, 87, 0.2)',
                                                            padding: '0.2rem 0.5rem',
                                                            borderRadius: '8px',
                                                            marginRight: 'auto',
                                                            whiteSpace: 'nowrap'
                                                        }}>
                                                            {getContentTypeLabel(item.type)}
                                                        </span>
                                                    </div>
                                                    <p style={{margin: '0.3rem 0', color: 'var(--text-light)', fontSize: '0.9rem'}}>
                                                        👤 פרופיל: {item.profile_name}
                                                    </p>
                                                    <p style={{margin: 0, color: 'var(--primary-light)', fontSize: '0.85rem'}}>
                                                        📅 נוצר ב: {formatDate(item.created_at)}
                                                    </p>
                                                </div>
                                                <div style={{
                                                    display: 'flex', 
                                                    gap: '0.5rem', 
                                                    alignItems: 'center',
                                                    flexWrap: 'wrap',
                                                    justifyContent: 'flex-end',
                                                    flex: '0 0 auto',
                                                    width: '100%',
                                                    marginTop: '0.5rem'
                                                }}>
                                                    {setCurrentView && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (item.type === 'story') {
                                                                    setCurrentView('story', item.id, 'story');
                                                                } else if (item.type === 'workbook' || item.type === 'worksheet') {
                                                                    setCurrentView('learning-center', item.id, 'workbook');
                                                                } else if (item.type === 'learning_plan') {
                                                                    setCurrentView('learning-center', item.id, 'learning_plan');
                                                                }
                                                            }}
                                                            style={{
                                                                background: 'linear-gradient(135deg, rgba(127, 217, 87, 0.2), rgba(168, 224, 99, 0.15))',
                                                                border: '1px solid var(--primary-color)',
                                                                padding: '0.6rem 1.2rem',
                                                                borderRadius: '10px',
                                                                color: 'var(--primary-light)',
                                                                fontSize: 'clamp(0.8rem, 3vw, 0.9rem)',
                                                                cursor: 'pointer',
                                                                whiteSpace: 'nowrap',
                                                                transition: 'all 0.3s ease',
                                                                minWidth: '90px',
                                                                fontWeight: '600',
                                                                boxShadow: '0 2px 8px rgba(127, 217, 87, 0.2)'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.background = 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))';
                                                                e.currentTarget.style.color = 'var(--background-dark)';
                                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                                e.currentTarget.style.boxShadow = '0 4px 15px rgba(127, 217, 87, 0.4)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(127, 217, 87, 0.2), rgba(168, 224, 99, 0.15))';
                                                                e.currentTarget.style.color = 'var(--primary-light)';
                                                                e.currentTarget.style.transform = 'translateY(0)';
                                                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(127, 217, 87, 0.2)';
                                                            }}
                                                        >
                                                            👆 פתח
                                                        </button>
                                                    )}
                                                    <button
                                                        className="delete-button"
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            if (!confirm(`האם אתה בטוח שברצונך למחוק את "${item.title}"?`)) return;
                                                            
                                                            setDeletingId(item.id);
                                                            try {
                                                                let error;
                                                                if (item.type === 'story') {
                                                                    const { error: delError } = await supabase
                                                                        .from('stories')
                                                                        .delete()
                                                                        .eq('id', item.id);
                                                                    error = delError;
                                                                } else if (item.type === 'workbook' || item.type === 'worksheet') {
                                                                    const { error: delError } = await supabase
                                                                        .from('workbooks')
                                                                        .delete()
                                                                        .eq('id', item.id);
                                                                    error = delError;
                                                                } else if (item.type === 'learning_plan') {
                                                                    const { error: delError } = await supabase
                                                                        .from('learning_plans')
                                                                        .delete()
                                                                        .eq('id', item.id);
                                                                    error = delError;
                                                                }
                                                                
                                                                if (error) throw error;
                                                                
                                                                // Remove from local state
                                                                setContentHistory(prev => prev.filter(c => c.id !== item.id));
                                                                alert('התוכן נמחק בהצלחה!');
                                                            } catch (error) {
                                                                console.error('Error deleting content:', error);
                                                                alert('שגיאה במחיקת התוכן');
                                                            } finally {
                                                                setDeletingId(null);
                                                            }
                                                        }}
                                                        disabled={deletingId === item.id}
                                                        style={{
                                                            background: deletingId === item.id 
                                                                ? 'rgba(255, 107, 107, 0.1)' 
                                                                : 'linear-gradient(135deg, rgba(255, 107, 107, 0.2), rgba(255, 154, 154, 0.15))',
                                                            border: '1px solid ' + (deletingId === item.id ? 'var(--glass-border)' : 'var(--error-color)'),
                                                            padding: '0.6rem 1.2rem',
                                                            borderRadius: '10px',
                                                            color: deletingId === item.id ? 'var(--text-light)' : 'var(--error-color)',
                                                            fontSize: 'clamp(0.8rem, 3vw, 0.9rem)',
                                                            cursor: deletingId === item.id ? 'not-allowed' : 'pointer',
                                                            whiteSpace: 'nowrap',
                                                            transition: 'all 0.3s ease',
                                                            opacity: deletingId === item.id ? 0.6 : 1,
                                                            minWidth: '90px',
                                                            fontWeight: '600',
                                                            boxShadow: deletingId === item.id ? 'none' : '0 2px 8px rgba(255, 107, 107, 0.2)'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            if (deletingId !== item.id) {
                                                                e.currentTarget.style.background = 'linear-gradient(135deg, var(--error-color), #ff8e8e)';
                                                                e.currentTarget.style.color = 'var(--white)';
                                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                                e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 107, 107, 0.4)';
                                                            }
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            if (deletingId !== item.id) {
                                                                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 107, 107, 0.2), rgba(255, 154, 154, 0.15))';
                                                                e.currentTarget.style.color = 'var(--error-color)';
                                                                e.currentTarget.style.transform = 'translateY(0)';
                                                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(255, 107, 107, 0.2)';
                                                            }
                                                        }}
                                                    >
                                                        {deletingId === item.id ? '⏳ מוחק...' : '🗑️ מחק'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default UserProfile;

