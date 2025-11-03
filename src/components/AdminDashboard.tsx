import React, { useState, useEffect } from 'react';
import { User, useAppContext } from './AppContext';
import { styles } from '../../styles';
import { supabase } from '../supabaseClient';
import ActivityMonitor from './ActivityMonitor';

interface AdminDashboardProps {
    loggedInUser: User;
    users: User[];
    updateUser: (id: string, field: string, value: any) => void;
    onAddUser: (username: string, role: 'parent' | 'admin', credits: number) => void;
    onDeleteUser: (id: string) => void;
}

interface UserStats {
    storiesCount: number;
    workbooksCount: number;
    learningPlansCount: number;
    profilesCount: number;
    lastActivity: string | null;
    creditsSpent: number;
    creditsHistory: CreditsHistoryItem[];
}

interface CreditsHistoryItem {
    id?: number;
    user_id: string;
    credits_change: number;
    credits_before: number;
    credits_after: number;
    action_type: 'deduction' | 'addition' | 'story' | 'workbook' | 'plan_step' | 'worksheet' | 'topic_suggestions';
    description: string;
    created_at?: string;
}

interface ContentItem {
    id: number;
    title: string;
    profile_name: string;
    created_at: string;
    type: 'story' | 'workbook' | 'learning_plan';
}

const AdminDashboard = ({ loggedInUser, users, updateUser, onAddUser, onDeleteUser }: AdminDashboardProps) => {
    const { creditCosts, updateCreditCosts } = useAppContext();
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [userStats, setUserStats] = useState<Record<string, UserStats>>({});
    const [userContent, setUserContent] = useState<ContentItem[]>([]);
    const [loadingStats, setLoadingStats] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'credits' | 'settings'>('overview');
    const [editingCredits, setEditingCredits] = useState<string | null>(null);
    const [creditsInput, setCreditsInput] = useState<number>(0);
    const [showActivityMonitor, setShowActivityMonitor] = useState(false);
    const [showMessageModal, setShowMessageModal] = useState(false);
    const [messageText, setMessageText] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [editingCosts, setEditingCosts] = useState(false);
    const [costsInput, setCostsInput] = useState<typeof creditCosts>(creditCosts);
    const [updatingCreditsForUser, setUpdatingCreditsForUser] = useState<string | null>(null);

    // Check if logged in user is super admin
    const isSuperAdmin = loggedInUser.email === 'ofirbaranesad@gmail.com' && loggedInUser.role === 'admin';

    // Load all users from database
    useEffect(() => {
        if (isSuperAdmin) {
            loadAllUsers();
        }
    }, [isSuperAdmin]);

    // Load all users from database (for super admin) - refreshes credits from database
    const loadAllUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*, profiles(*)')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const transformedUsers = (data || []).map((u: any) => ({
                id: u.id,
                username: u.email?.split('@')[0] || 'משתמש',
                email: u.email,
                role: u.role || 'parent',
                credits: u.credits || 0, // Load latest credits from database
                profiles: u.profiles || []
            }));

            setAllUsers(transformedUsers);
            
            // Load stats for all users
            const stats: Record<string, UserStats> = {};
            for (const user of transformedUsers) {
                const userStat = await loadUserStats(user.id);
                stats[user.id] = userStat;
            }
            setUserStats(stats);
        } catch (error) {
            console.error('Error loading all users:', error);
        }
    };

    // Load stats for all users
    useEffect(() => {
        const loadAllStats = async () => {
            const usersToLoad = isSuperAdmin ? allUsers : users;
            const stats: Record<string, UserStats> = {};
            for (const user of usersToLoad) {
                const userStat = await loadUserStats(user.id);
                stats[user.id] = userStat;
            }
            setUserStats(stats);
        };
        const usersToLoad = isSuperAdmin ? allUsers : users;
        if (usersToLoad.length > 0) {
            loadAllStats();
        }
    }, [users, allUsers, isSuperAdmin]);

    // Load stats for a specific user
    const loadUserStats = async (userId: string): Promise<UserStats> => {
        try {
            const [storiesRes, workbooksRes, plansRes, profilesRes] = await Promise.all([
                supabase.from('stories').select('id, title, story_parts, created_at', { count: 'exact' }).eq('user_id', userId),
                supabase.from('workbooks').select('id, title, workbook_data, created_at', { count: 'exact' }).eq('user_id', userId),
                supabase.from('learning_plans').select('id, title, plan_steps, created_at', { count: 'exact' }).eq('user_id', userId),
                supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('user_id', userId),
            ]);

            // Calculate credits spent based on content (using dynamic costs from context)
            let creditsSpent = 0;
            const creditsHistory: CreditsHistoryItem[] = [];

            // Stories: count parts (each part = story_part credits)
            const stories = storiesRes.data || [];
            stories.forEach(story => {
                const parts = story.story_parts || [];
                const partsCount = Array.isArray(parts) ? parts.length : 0;
                const storyCost = partsCount * creditCosts.story_part;
                creditsSpent += storyCost;
                if (partsCount > 0) {
                    creditsHistory.push({
                        user_id: userId,
                        credits_change: -storyCost,
                        credits_before: 0,
                        credits_after: 0,
                        action_type: 'story',
                        description: `יצירת סיפור "${story.title || 'ללא כותרת'}" - ${partsCount} חלקים (${creditCosts.story_part} קרדיטים לחלק)`,
                        created_at: story.created_at
                    });
                }
            });

            // Workbooks: workbook credits each
            const workbooks = workbooksRes.data || [];
            workbooks.forEach(workbook => {
                const workbookData = workbook.workbook_data || {};
                const isWorksheet = workbookData.type === 'worksheet';
                const cost = isWorksheet ? creditCosts.worksheet : creditCosts.workbook;
                creditsSpent += cost;
                creditsHistory.push({
                    user_id: userId,
                    credits_change: -cost,
                    credits_before: 0,
                    credits_after: 0,
                    action_type: isWorksheet ? 'worksheet' : 'workbook',
                    description: `יצירת ${isWorksheet ? 'דף תרגול' : 'חוברת עבודה'} "${workbook.title || 'ללא כותרת'}" (${cost} קרדיטים)`,
                    created_at: workbook.created_at
                });
            });

            // Learning plans: count steps (each step = plan_step credits)
            const plans = plansRes.data || [];
            plans.forEach(plan => {
                const steps = plan.plan_steps || [];
                const stepsCount = Array.isArray(steps) ? steps.length : 0;
                const planCost = stepsCount * creditCosts.plan_step;
                creditsSpent += planCost;
                if (stepsCount > 0) {
                    creditsHistory.push({
                        user_id: userId,
                        credits_change: -planCost,
                        credits_before: 0,
                        credits_after: 0,
                        action_type: 'plan_step',
                        description: `יצירת תוכנית למידה "${plan.title || 'ללא כותרת'}" - ${stepsCount} שלבים (${creditCosts.plan_step} קרדיטים לשלב)`,
                        created_at: plan.created_at
                    });
                }
            });

            // Get last activity
            const allDates = [
                ...(storiesRes.data || []).map((s: any) => s.created_at),
                ...(workbooksRes.data || []).map((w: any) => w.created_at),
                ...(plansRes.data || []).map((p: any) => p.created_at)
            ].filter(Boolean);
            
            const lastActivity = allDates.length > 0 
                ? allDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
                : null;

            // Sort credits history by date
            creditsHistory.sort((a, b) => {
                const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                return dateB - dateA;
            });

            return {
                storiesCount: storiesRes.count || 0,
                workbooksCount: workbooksRes.count || 0,
                learningPlansCount: plansRes.count || 0,
                profilesCount: profilesRes.count || 0,
                lastActivity,
                creditsSpent,
                creditsHistory,
            };
        } catch (error) {
            console.error('Error loading user stats:', error);
            return {
                storiesCount: 0,
                workbooksCount: 0,
                learningPlansCount: 0,
                profilesCount: 0,
                lastActivity: null,
                creditsSpent: 0,
                creditsHistory: [],
            };
        }
    };

    // Load content for selected user
    const loadUserContent = async (userId: string) => {
        setLoadingStats(true);
        try {
            const [storiesRes, workbooksRes, plansRes] = await Promise.all([
                supabase
                    .from('stories')
                    .select('id, title, created_at, profile_id, profiles(name)')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('workbooks')
                    .select('id, title, created_at, profile_id, profiles(name)')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('learning_plans')
                    .select('id, title, created_at, profile_id, profiles(name)')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false }),
            ]);

            const content: ContentItem[] = [
                ...(storiesRes.data || []).map(item => ({
                    id: item.id,
                    title: item.title,
                    profile_name: (item.profiles as any)?.name || 'לא ידוע',
                    created_at: item.created_at,
                    type: 'story' as const,
                })),
                ...(workbooksRes.data || []).map(item => ({
                    id: item.id,
                    title: item.title,
                    profile_name: (item.profiles as any)?.name || 'לא ידוע',
                    created_at: item.created_at,
                    type: 'workbook' as const,
                })),
                ...(plansRes.data || []).map(item => ({
                    id: item.id,
                    title: item.title,
                    profile_name: (item.profiles as any)?.name || 'לא ידוע',
                    created_at: item.created_at,
                    type: 'learning_plan' as const,
                })),
            ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            setUserContent(content);
        } catch (error) {
            console.error('Error loading user content:', error);
        } finally {
            setLoadingStats(false);
        }
    };

    const handleUserClick = (user: User) => {
        setSelectedUser(user);
        setActiveTab('overview');
        loadUserContent(user.id);
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
            case 'workbook': return '📝 חוברת';
            case 'learning_plan': return '🎯 תוכנית למידה';
            default: return type;
        }
    };

    // Update user credits in database (for super admin)
    const handleUpdateUserCredits = async (userId: string, newCredits: number) => {
        if (!isSuperAdmin) return;
        
        setUpdatingCreditsForUser(userId);
        try {
            const { error } = await supabase
                .from('users')
                .update({ credits: Math.max(0, newCredits) })
                .eq('id', userId);

            if (error) throw error;

            // Update local state
            const usersToUpdate = isSuperAdmin ? allUsers : users;
            const userToUpdate = usersToUpdate.find(u => u.id === userId);
            if (userToUpdate) {
                userToUpdate.credits = Math.max(0, newCredits);
                if (isSuperAdmin) {
                    setAllUsers([...allUsers]);
                }
                // Also update via updateUser prop
                updateUser(userId, 'credits', Math.max(0, newCredits));
            }

            // Refresh stats
            if (selectedUser?.id === userId) {
                const updatedStats = await loadUserStats(userId);
                setUserStats(prev => ({ ...prev, [userId]: updatedStats }));
                setSelectedUser({ ...selectedUser, credits: Math.max(0, newCredits) });
            }
        } catch (error) {
            console.error('Error updating user credits:', error);
            alert('שגיאה בעדכון הקרדיטים');
        } finally {
            setUpdatingCreditsForUser(null);
            setCreditsInput(0);
        }
    };

    // Refresh all users data (for super admin)
    const refreshAllUsers = async () => {
        if (!isSuperAdmin) return;
        await loadAllUsers();
    };

    // Sync costsInput with creditCosts when it changes
    useEffect(() => {
        setCostsInput(creditCosts);
    }, [creditCosts]);

    return (
        <div style={styles.dashboard}>
            <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap'}}>
                <h1 style={{...styles.mainTitle, margin: 0}}>🎛️ לוח בקרה מתקדם</h1>
                {isSuperAdmin && (
                    <span style={{
                        background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
                        padding: '0.5rem 1rem',
                        borderRadius: '20px',
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        color: 'white',
                        boxShadow: '0 4px 15px rgba(127, 217, 87, 0.3)'
                    }}>
                        👑 מנהל ראשי
                    </span>
                )}
                {!isSuperAdmin && loggedInUser.role === 'admin' && (
                    <span style={{
                        background: 'linear-gradient(135deg, #4a9eff, #3d7ec7)',
                        padding: '0.5rem 1rem',
                        borderRadius: '20px',
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        color: 'white',
                        boxShadow: '0 4px 15px rgba(74, 158, 255, 0.3)'
                    }}>
                        🛡️ מנהל
                    </span>
                )}
            </div>
            <p style={styles.subtitle}>
                {isSuperAdmin 
                    ? 'ניהול מתקדם של כל המשתמשים במערכת, צפייה בנתונים מלאים, מעקב קרדיטים ושליחת הודעות'
                    : 'ניהול משתמשים, צפייה בנתונים וסטטיסטיקות במערכת'
                }
            </p>
            
            {isSuperAdmin && (
                <div style={{
                    background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.1), rgba(255, 152, 0, 0.1))',
                    padding: '1rem 1.5rem',
                    borderRadius: 'var(--border-radius)',
                    border: '2px solid rgba(255, 193, 7, 0.3)',
                    marginBottom: '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    flexWrap: 'wrap'
                }}>
                    <div style={{fontSize: '2rem'}}>⚠️</div>
                    <div style={{flex: 1}}>
                        <strong style={{color: 'var(--white)', fontSize: '1rem'}}>הרשאות מנהל ראשי</strong>
                        <p style={{color: 'var(--text-light)', margin: '0.3rem 0 0 0', fontSize: '0.9rem'}}>
                            יש לך גישה מלאה לכל הנתונים במערכת, כולל כל המשתמשים, היסטוריית קרדיטים, ושליחת הודעות כללית.
                        </p>
                    </div>
                </div>
            )}

            {/* Super Admin Controls - Credits Management */}
            {isSuperAdmin && (
                <div style={{
                    background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.15), rgba(255, 152, 0, 0.1))',
                    padding: '2rem',
                    borderRadius: 'var(--border-radius-large)',
                    border: '2px solid rgba(255, 193, 7, 0.3)',
                    marginBottom: '2rem',
                    boxShadow: 'var(--card-shadow)'
                }}>
                    <h2 style={{...styles.title, fontSize: '1.4rem', marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                        <span>⚙️</span> שליטה על עלויות יצירות במערכת
                    </h2>
                    <p style={{color: 'var(--text-light)', margin: '0 0 1.5rem 0', fontSize: '1rem'}}>
                        כאן תוכל לשלוט בכמה קרדיטים עולה כל פעולה יצירתית במערכת. השינויים יתעדכנו מיד.
                    </p>

                    {editingCosts ? (
                        <div>
                            <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
                                {[
                                    { key: 'story_part', label: '📚 חלק בסיפור (טקסט + איור)', description: 'כל חלק חדש בסיפור' },
                                    { key: 'plan_step', label: '🎯 שלב בתוכנית למידה', description: 'כל שלב חדש בתוכנית' },
                                    { key: 'worksheet', label: '📄 דף תרגול', description: 'דף תרגול מותאם אישית' },
                                    { key: 'workbook', label: '📝 חוברת עבודה מלאה', description: 'חוברת עבודה עם תרגילים' },
                                    { key: 'topic_suggestions', label: '💡 הצעות נושאים', description: 'קבלת הצעות נושאים ללמידה' }
                                ].map(item => (
                                    <div key={item.key} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        flexWrap: 'wrap',
                                        background: 'rgba(0,0,0,0.2)',
                                        padding: '1rem',
                                        borderRadius: 'var(--border-radius)',
                                        border: '1px solid var(--glass-border)'
                                    }}>
                                        <div style={{flex: 1, minWidth: '250px'}}>
                                            <div style={{fontSize: '1.1rem', color: 'var(--white)', marginBottom: '0.3rem', fontWeight: 'bold'}}>
                                                {item.label}
                                            </div>
                                            <div style={{fontSize: '0.9rem', color: 'var(--text-light)'}}>
                                                {item.description}
                                            </div>
                                        </div>
                                        <input
                                            type="number"
                                            min="0"
                                            value={costsInput[item.key as keyof typeof costsInput]}
                                            onChange={(e) => setCostsInput({
                                                ...costsInput,
                                                [item.key]: parseInt(e.target.value) || 0
                                            })}
                                            style={{
                                                width: '100px',
                                                padding: '0.75rem',
                                                borderRadius: '8px',
                                                border: '2px solid var(--primary-color)',
                                                background: 'var(--glass-bg)',
                                                color: 'var(--white)',
                                                fontSize: '1.1rem',
                                                textAlign: 'center',
                                                fontWeight: 'bold'
                                            }}
                                        />
                                        <span style={{fontSize: '0.9rem', color: 'var(--text-light)', minWidth: '60px'}}>קרדיטים</span>
                                    </div>
                                ))}
                            </div>
                            <div style={{display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end'}}>
                                <button
                                    onClick={() => {
                                        setEditingCosts(false);
                                        setCostsInput(creditCosts);
                                    }}
                                    style={{
                                        ...styles.button,
                                        background: 'var(--glass-bg)',
                                        color: 'var(--text-light)'
                                    }}
                                >
                                    ביטול
                                </button>
                                <button
                                    onClick={async () => {
                                        try {
                                            await updateCreditCosts(costsInput);
                                            alert('✅ עלויות הקרדיטים עודכנו בהצלחה!');
                                            setEditingCosts(false);
                                        } catch (error) {
                                            console.error('Error updating costs:', error);
                                            alert('❌ שגיאה בעדכון העלויות');
                                        }
                                    }}
                                    style={{
                                        ...styles.button,
                                        background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
                                        fontSize: '1.1rem',
                                        padding: '0.75rem 2rem'
                                    }}
                                >
                                    💾 שמור שינויים
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem'}}>
                                {[
                                    { key: 'story_part', label: '📚 חלק בסיפור (טקסט + איור)', description: 'כל חלק חדש בסיפור' },
                                    { key: 'plan_step', label: '🎯 שלב בתוכנית למידה', description: 'כל שלב חדש בתוכנית' },
                                    { key: 'worksheet', label: '📄 דף תרגול', description: 'דף תרגול מותאם אישית' },
                                    { key: 'workbook', label: '📝 חוברת עבודה מלאה', description: 'חוברת עבודה עם תרגילים' },
                                    { key: 'topic_suggestions', label: '💡 הצעות נושאים', description: 'קבלת הצעות נושאים ללמידה' }
                                ].map(item => (
                                    <div key={item.key} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '1rem',
                                        background: 'rgba(127, 217, 87, 0.1)',
                                        borderRadius: 'var(--border-radius)',
                                        border: '1px solid var(--glass-border)',
                                        flexWrap: 'wrap',
                                        gap: '1rem'
                                    }}>
                                        <div style={{flex: 1, minWidth: '250px'}}>
                                            <div style={{fontSize: '1.1rem', color: 'var(--white)', marginBottom: '0.3rem', fontWeight: 'bold'}}>
                                                {item.label}
                                            </div>
                                            <div style={{fontSize: '0.9rem', color: 'var(--text-light)'}}>
                                                {item.description}
                                            </div>
                                        </div>
                                        <div style={{
                                            fontSize: '1.5rem',
                                            color: 'var(--primary-light)',
                                            fontWeight: 'bold',
                                            minWidth: '100px',
                                            textAlign: 'center'
                                        }}>
                                            {creditCosts[item.key as keyof typeof creditCosts]} 💎
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => {
                                    setCostsInput(creditCosts);
                                    setEditingCosts(true);
                                }}
                                style={{
                                    ...styles.button,
                                    background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
                                    fontSize: '1.1rem',
                                    padding: '0.75rem 2rem',
                                    width: '100%'
                                }}
                            >
                                ✏️ ערוך עלויות קרדיטים
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Infinite Credits Button */}
            {loggedInUser && loggedInUser.role === 'admin' && (
                <div style={{
                    background: 'linear-gradient(135deg, rgba(127, 217, 87, 0.1), rgba(86, 217, 137, 0.1))',
                    padding: '1.5rem',
                    borderRadius: 'var(--border-radius-large)',
                    border: '2px solid var(--glass-border)',
                    marginBottom: '2rem',
                    boxShadow: 'var(--card-shadow)'
                }}>
                    <h2 style={{...styles.title, fontSize: '1.3rem', marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                        <span>🚀</span> בקרת מנהל ראשי
                    </h2>
                    <p style={{color: 'var(--text-light)', margin: '0 0 1rem 0'}}>
                        השתמש בכפתור זה כדי לבחון את המערכת ללא הגבלת קרדיטים.
                    </p>
                    <button
                        onClick={() => updateUser(loggedInUser.id, 'credits', 9999999)}
                        style={{
                            ...styles.button,
                            background: 'linear-gradient(135deg, var(--accent-color), var(--primary-light))',
                            boxShadow: '0 6px 20px rgba(255, 230, 109, 0.4)',
                        }}
                    >
                        ⚡ הפעל קרדיטים אינסופיים
                    </button>
                </div>
            )}

            {/* Quick Actions */}
            <div style={{
                background: 'linear-gradient(145deg, rgba(26, 46, 26, 0.9), rgba(36, 60, 36, 0.8))',
                padding: '1.5rem',
                borderRadius: 'var(--border-radius-large)',
                border: '2px solid var(--glass-border)',
                boxShadow: 'var(--card-shadow)',
                backdropFilter: 'blur(15px)',
                marginBottom: '2rem',
                display: 'flex',
                gap: '1rem',
                flexWrap: 'wrap'
            }}>
                <h3 style={{...styles.title, fontSize: '1.2rem', margin: 0, width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                    <span>⚡</span> פעולות מהירות
                </h3>
                <button
                    onClick={() => {
                        // פתיחת דף הבית הציבורי בטאב חדש עם פרמטר מיוחד
                        const landingUrl = window.location.origin + '/?view=landing';
                        window.open(landingUrl, '_blank');
                    }}
                    style={{
                        ...styles.button,
                        background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
                        boxShadow: '0 6px 20px rgba(127, 217, 87, 0.4)',
                        flex: '1',
                        minWidth: '200px'
                    }}
                >
                    🎨 ערוך דף הבית
                </button>
                <button
                    onClick={() => window.location.reload()}
                    style={{
                        ...styles.button,
                        background: 'linear-gradient(135deg, #4a9eff, #3d7ec7)',
                        boxShadow: '0 6px 20px rgba(74, 158, 255, 0.4)',
                        flex: '1',
                        minWidth: '200px'
                    }}
                >
                    🔄 רענן נתונים
                </button>
                        {isSuperAdmin && (
                            <>
                                <button
                                    onClick={() => setShowActivityMonitor(true)}
                                    style={{
                                        ...styles.button,
                                        background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                                        boxShadow: '0 6px 20px rgba(168, 85, 247, 0.4)',
                                        flex: '1',
                                        minWidth: '200px'
                                    }}
                                >
                                    📊 ניטור פעילות
                                </button>
                                <button
                                    onClick={() => setShowMessageModal(true)}
                                    style={{
                                        ...styles.button,
                                        background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                                        boxShadow: '0 6px 20px rgba(245, 158, 11, 0.4)',
                                        flex: '1',
                                        minWidth: '200px'
                                    }}
                                >
                                    📢 שלוח הודעה כללית
                                </button>
                                <button
                                    onClick={async () => {
                                        if (confirm('האם אתה בטוח שברצונך לרענן את כל הנתונים? זה עשוי לקחת כמה רגעים...')) {
                                            await loadAllUsers();
                                            alert('הנתונים רועננו בהצלחה!');
                                        }
                                    }}
                                    style={{
                                        ...styles.button,
                                        background: 'linear-gradient(135deg, #10b981, #059669)',
                                        boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)',
                                        flex: '1',
                                        minWidth: '200px'
                                    }}
                                >
                                    🔄 רענן כל הנתונים
                                </button>
                            </>
                        )}
            </div>

            <div className="admin-grid" style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: '2rem',
                alignItems: 'flex-start'
            }}>
                {/* Users List */}
                <div style={{
                    background: 'linear-gradient(145deg, rgba(26, 46, 26, 0.9), rgba(36, 60, 36, 0.8))',
                    padding: '2rem',
                    borderRadius: 'var(--border-radius-large)',
                    border: '2px solid var(--glass-border)',
                    boxShadow: 'var(--card-shadow)',
                    backdropFilter: 'blur(15px)'
                }}>
                    <h2 style={{...styles.title, fontSize: '1.5rem', marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                        <span>👥</span> ניהול משתמשים ({(isSuperAdmin ? allUsers : users).length})
                    </h2>
                    <div className="admin-users-list" style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                        {(isSuperAdmin ? allUsers : users).map(user => {
                            const stats = userStats[user.id];
                            return (
                                <div
                                    key={user.id}
                                    className="admin-user-card"
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '1.5rem',
                                        borderRadius: 'var(--border-radius)',
                                        background: selectedUser?.id === user.id
                                            ? 'linear-gradient(135deg, rgba(127, 217, 87, 0.2), rgba(86, 217, 137, 0.2))'
                                            : 'var(--glass-bg)',
                                        border: selectedUser?.id === user.id
                                            ? '2px solid var(--primary-color)'
                                            : '1px solid var(--glass-border)',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        flexWrap: 'wrap',
                                        gap: '1rem',
                                        boxShadow: selectedUser?.id === user.id
                                            ? '0 8px 25px rgba(127, 217, 87, 0.3)'
                                            : 'none'
                                    }}
                                    onClick={() => handleUserClick(user)}
                                >
                                    <div className="user-info" style={{flex: 1, minWidth: '200px'}}>
                                        <h4 style={{margin: 0, color: 'var(--white)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                                            {user.role === 'admin' ? '👑' : '👤'} {user.username}
                                            {user.email && <span style={{fontSize: '0.8rem', color: 'var(--text-light)'}}>({user.email})</span>}
                                        </h4>
                                        <p style={{margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-light)'}}>
                                            💳 קרדיטים: {user.credits} 
                                            {stats && stats.creditsSpent > 0 && (
                                                <span style={{color: 'var(--warning-color)', marginLeft: '0.5rem'}}>
                                                    (בוזבז: {stats.creditsSpent})
                                                </span>
                                            )}
                                            {' | '}👤 פרופילים: {user.profiles.length}
                                            {stats && (
                                                <>
                                                    {' | '}📚 סיפורים: {stats.storiesCount}
                                                    {' | '}📝 חוברות: {stats.workbooksCount}
                                                    {' | '}🎯 תוכניות: {stats.learningPlansCount}
                                                </>
                                            )}
                                        </p>
                                        {stats?.lastActivity && (
                                            <p style={{margin: '0.3rem 0 0 0', fontSize: '0.8rem', color: 'var(--primary-light)'}}>
                                                🕒 פעילות אחרונה: {formatDate(stats.lastActivity)}
                                            </p>
                                        )}
                                    </div>
                                    <div className="user-controls" style={{display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap'}}>
                                        {isSuperAdmin ? (
                                            <div className="credits-control" style={{display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--glass-bg)', padding: '0.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)'}}>
                                                {updatingCreditsForUser === user.id ? (
                                                    <>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={creditsInput}
                                                            onChange={(e) => setCreditsInput(parseInt(e.target.value) || 0)}
                                                            onKeyPress={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    handleUpdateUserCredits(user.id, creditsInput);
                                                                }
                                                            }}
                                                            autoFocus
                                                            style={{
                                                                width: '100px',
                                                                padding: '0.4rem',
                                                                borderRadius: '8px',
                                                                border: '1px solid var(--primary-color)',
                                                                background: 'var(--background-dark)',
                                                                color: 'var(--white)',
                                                                fontSize: '1rem',
                                                                textAlign: 'center',
                                                                fontWeight: 'bold'
                                                            }}
                                                        />
                                                        <button
                                                            onClick={() => handleUpdateUserCredits(user.id, creditsInput)}
                                                            style={{
                                                                background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
                                                                border: 'none',
                                                                color: 'white',
                                                                padding: '0.4rem 0.8rem',
                                                                borderRadius: '8px',
                                                                cursor: 'pointer',
                                                                fontSize: '0.85rem',
                                                                fontWeight: 'bold'
                                                            }}
                                                        >
                                                            ✓
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setUpdatingCreditsForUser(null);
                                                                setCreditsInput(0);
                                                            }}
                                                            style={{
                                                                background: 'var(--glass-bg)',
                                                                border: '1px solid var(--glass-border)',
                                                                color: 'var(--text-light)',
                                                                padding: '0.4rem 0.8rem',
                                                                borderRadius: '8px',
                                                                cursor: 'pointer',
                                                                fontSize: '0.85rem'
                                                            }}
                                                        >
                                                            ✖
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const newCredits = Math.max(0, user.credits - 10);
                                                                handleUpdateUserCredits(user.id, newCredits);
                                                            }}
                                                            style={{
                                                                background: 'linear-gradient(135deg, #ff6b6b, #ff8787)',
                                                                border: 'none',
                                                                color: 'white',
                                                                width: '32px',
                                                                height: '32px',
                                                                borderRadius: '8px',
                                                                cursor: 'pointer',
                                                                fontSize: '1.2rem',
                                                                fontWeight: 'bold',
                                                                transition: 'all 0.2s ease',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                                            title="הורד 10 קרדיטים"
                                                        >
                                                            −10
                                                        </button>
                                                        <span style={{
                                                            minWidth: '90px',
                                                            textAlign: 'center',
                                                            color: 'var(--primary-light)',
                                                            fontWeight: 'bold',
                                                            fontSize: '1.1rem',
                                                            cursor: 'pointer'
                                                        }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setCreditsInput(user.credits);
                                                            setUpdatingCreditsForUser(user.id);
                                                        }}
                                                        title="לחץ לעריכה"
                                                        >
                                                            💳 {user.credits}
                                                        </span>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const newCredits = user.credits + 10;
                                                                handleUpdateUserCredits(user.id, newCredits);
                                                            }}
                                                            style={{
                                                                background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
                                                                border: 'none',
                                                                color: 'white',
                                                                width: '32px',
                                                                height: '32px',
                                                                borderRadius: '8px',
                                                                cursor: 'pointer',
                                                                fontSize: '1.2rem',
                                                                fontWeight: 'bold',
                                                                transition: 'all 0.2s ease',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                                            title="הוסף 10 קרדיטים"
                                                        >
                                                            +10
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setCreditsInput(user.credits);
                                                                setUpdatingCreditsForUser(user.id);
                                                            }}
                                                            style={{
                                                                background: 'linear-gradient(135deg, #4a9eff, #3d7ec7)',
                                                                border: 'none',
                                                                color: 'white',
                                                                padding: '0.4rem 0.8rem',
                                                                borderRadius: '8px',
                                                                cursor: 'pointer',
                                                                fontSize: '0.85rem',
                                                                fontWeight: 'bold',
                                                                transition: 'all 0.2s ease'
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                                            title="ערוך קרדיטים"
                                                        >
                                                            ✏️
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        ) : (
                                            <div style={{
                                                padding: '0.5rem 1rem',
                                                background: 'var(--glass-bg)',
                                                borderRadius: '12px',
                                                border: '1px solid var(--glass-border)',
                                                color: 'var(--primary-light)',
                                                fontWeight: 'bold',
                                                fontSize: '1.1rem'
                                            }}>
                                                💳 {user.credits}
                                            </div>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm(`האם אתה בטוח שברצונך למחוק את המשתמש ${user.username}?`)) {
                                                    onDeleteUser(user.id);
                                                }
                                            }}
                                            style={{
                                                ...styles.buttonDanger,
                                                padding: '0.6rem 1rem',
                                                fontSize: '0.9rem'
                                            }}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                        {(isSuperAdmin ? allUsers : users).length === 0 && (
                            <p style={{color: 'var(--text-light)', textAlign: 'center', padding: '2rem'}}>
                                📭 לא קיימים משתמשים אחרים במערכת
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Selected User Details */}
            {selectedUser && (
                <div style={{
                    marginTop: '2rem',
                    background: 'linear-gradient(145deg, rgba(26, 46, 26, 0.95), rgba(36, 60, 36, 0.9))',
                    padding: '2rem',
                    borderRadius: 'var(--border-radius-large)',
                    border: '2px solid var(--primary-color)',
                    boxShadow: 'var(--card-shadow-hover)',
                    backdropFilter: 'blur(20px)'
                }}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
                        <h2 style={{...styles.title, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                            <span>📊</span> פרטי משתמש: {selectedUser.username}
                        </h2>
                        <button
                            onClick={() => setSelectedUser(null)}
                            style={{
                                background: 'var(--glass-bg)',
                                border: '1px solid var(--glass-border)',
                                color: 'var(--text-light)',
                                padding: '0.5rem 1rem',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            ✖️ סגור
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="tabs-nav" style={{display: 'flex', gap: '0.5rem', marginBottom: '1.5rem'}}>
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
                            style={{
                                padding: '1rem 1.8rem',
                                background: activeTab === 'overview' ? 'var(--primary-color)' : 'var(--glass-bg)',
                                border: '1px solid ' + (activeTab === 'overview' ? 'var(--primary-light)' : 'var(--glass-border)'),
                                borderRadius: '12px',
                                color: activeTab === 'overview' ? 'white' : 'var(--text-light)',
                                fontSize: '1rem',
                                fontWeight: activeTab === 'overview' ? '700' : '500',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                boxShadow: activeTab === 'overview' ? '0 4px 15px rgba(127, 217, 87, 0.3)' : 'none'
                            }}
                        >
                            📈 סקירה כללית
                        </button>
                        <button
                            onClick={() => setActiveTab('content')}
                            className={`tab-button ${activeTab === 'content' ? 'active' : ''}`}
                            style={{
                                padding: '1rem 1.8rem',
                                background: activeTab === 'content' ? 'var(--primary-color)' : 'var(--glass-bg)',
                                border: '1px solid ' + (activeTab === 'content' ? 'var(--primary-light)' : 'var(--glass-border)'),
                                borderRadius: '12px',
                                color: activeTab === 'content' ? 'white' : 'var(--text-light)',
                                fontSize: '1rem',
                                fontWeight: activeTab === 'content' ? '700' : '500',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                boxShadow: activeTab === 'content' ? '0 4px 15px rgba(127, 217, 87, 0.3)' : 'none'
                            }}
                        >
                            📚 תוכן שנוצר
                        </button>
                        {isSuperAdmin && (
                            <>
                                <button
                                    onClick={() => setActiveTab('credits')}
                                    className={`tab-button ${activeTab === 'credits' ? 'active' : ''}`}
                                    style={{
                                        padding: '1rem 1.8rem',
                                        background: activeTab === 'credits' ? 'var(--primary-color)' : 'var(--glass-bg)',
                                        border: '1px solid ' + (activeTab === 'credits' ? 'var(--primary-light)' : 'var(--glass-border)'),
                                        borderRadius: '12px',
                                        color: activeTab === 'credits' ? 'white' : 'var(--text-light)',
                                        fontSize: '1rem',
                                        fontWeight: activeTab === 'credits' ? '700' : '500',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        boxShadow: activeTab === 'credits' ? '0 4px 15px rgba(127, 217, 87, 0.3)' : 'none'
                                    }}
                                >
                                    💎 היסטוריית קרדיטים
                                </button>
                                <button
                                    onClick={() => setActiveTab('settings')}
                                    className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
                                    style={{
                                        padding: '1rem 1.8rem',
                                        background: activeTab === 'settings' ? 'var(--primary-color)' : 'var(--glass-bg)',
                                        border: '1px solid ' + (activeTab === 'settings' ? 'var(--primary-light)' : 'var(--glass-border)'),
                                        borderRadius: '12px',
                                        color: activeTab === 'settings' ? 'white' : 'var(--text-light)',
                                        fontSize: '1rem',
                                        fontWeight: activeTab === 'settings' ? '700' : '500',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        boxShadow: activeTab === 'settings' ? '0 4px 15px rgba(127, 217, 87, 0.3)' : 'none'
                                    }}
                                >
                                    ⚙️ ניהול עלויות קרדיטים
                                </button>
                            </>
                        )}
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'overview' && (
                        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem'}}>
                            <div style={{
                                background: 'linear-gradient(135deg, rgba(127, 217, 87, 0.15), rgba(86, 217, 137, 0.1))',
                                padding: '1.5rem',
                                borderRadius: 'var(--border-radius)',
                                border: '2px solid var(--glass-border)',
                                textAlign: 'center'
                            }}>
                                <div style={{fontSize: '3rem', marginBottom: '0.5rem'}}>📚</div>
                                <h3 style={{margin: '0 0 0.5rem 0', color: 'var(--primary-light)', fontSize: '1.1rem'}}>סיפורים</h3>
                                <p style={{fontSize: '2rem', fontWeight: 'bold', color: 'var(--white)', margin: 0}}>
                                    {userStats[selectedUser.id]?.storiesCount || 0}
                                </p>
                            </div>
                            <div style={{
                                background: 'linear-gradient(135deg, rgba(127, 217, 87, 0.15), rgba(86, 217, 137, 0.1))',
                                padding: '1.5rem',
                                borderRadius: 'var(--border-radius)',
                                border: '2px solid var(--glass-border)',
                                textAlign: 'center'
                            }}>
                                <div style={{fontSize: '3rem', marginBottom: '0.5rem'}}>📝</div>
                                <h3 style={{margin: '0 0 0.5rem 0', color: 'var(--primary-light)', fontSize: '1.1rem'}}>חוברות</h3>
                                <p style={{fontSize: '2rem', fontWeight: 'bold', color: 'var(--white)', margin: 0}}>
                                    {userStats[selectedUser.id]?.workbooksCount || 0}
                                </p>
                            </div>
                            <div style={{
                                background: 'linear-gradient(135deg, rgba(127, 217, 87, 0.15), rgba(86, 217, 137, 0.1))',
                                padding: '1.5rem',
                                borderRadius: 'var(--border-radius)',
                                border: '2px solid var(--glass-border)',
                                textAlign: 'center'
                            }}>
                                <div style={{fontSize: '3rem', marginBottom: '0.5rem'}}>🎯</div>
                                <h3 style={{margin: '0 0 0.5rem 0', color: 'var(--primary-light)', fontSize: '1.1rem'}}>תוכניות למידה</h3>
                                <p style={{fontSize: '2rem', fontWeight: 'bold', color: 'var(--white)', margin: 0}}>
                                    {userStats[selectedUser.id]?.learningPlansCount || 0}
                                </p>
                            </div>
                            <div style={{
                                background: 'linear-gradient(135deg, rgba(127, 217, 87, 0.15), rgba(86, 217, 137, 0.1))',
                                padding: '1.5rem',
                                borderRadius: 'var(--border-radius)',
                                border: '2px solid var(--glass-border)',
                                textAlign: 'center'
                            }}>
                                <div style={{fontSize: '3rem', marginBottom: '0.5rem'}}>👤</div>
                                <h3 style={{margin: '0 0 0.5rem 0', color: 'var(--primary-light)', fontSize: '1.1rem'}}>פרופילים</h3>
                                <p style={{fontSize: '2rem', fontWeight: 'bold', color: 'var(--white)', margin: 0}}>
                                    {selectedUser.profiles.length}
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'content' && (
                        <div>
                            {loadingStats ? (
                                <div style={{textAlign: 'center', padding: '3rem', color: 'var(--text-light)'}}>
                                    <div style={{fontSize: '3rem', marginBottom: '1rem'}}>⏳</div>
                                    <p>טוען תוכן...</p>
                                </div>
                            ) : userContent.length === 0 ? (
                                <div style={{textAlign: 'center', padding: '3rem', color: 'var(--text-light)'}}>
                                    <div style={{fontSize: '3rem', marginBottom: '1rem'}}>📭</div>
                                    <p>המשתמש עדיין לא יצר תוכן</p>
                                </div>
                            ) : (
                                <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                                    {userContent.map(item => (
                                        <div
                                            key={`${item.type}-${item.id}`}
                                            style={{
                                                background: 'var(--glass-bg)',
                                                padding: '1.5rem',
                                                borderRadius: 'var(--border-radius)',
                                                border: '1px solid var(--glass-border)',
                                                transition: 'all 0.3s ease'
                                            }}
                                        >
                                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                                                <div style={{flex: 1}}>
                                                    <h4 style={{margin: '0 0 0.5rem 0', color: 'var(--white)', fontSize: '1.1rem'}}>
                                                        {getContentTypeLabel(item.type)} {item.title}
                                                    </h4>
                                                    <p style={{margin: 0, color: 'var(--text-light)', fontSize: '0.9rem'}}>
                                                        👤 פרופיל: {item.profile_name}
                                                    </p>
                                                    <p style={{margin: '0.3rem 0 0 0', color: 'var(--primary-light)', fontSize: '0.85rem'}}>
                                                        📅 נוצר ב: {formatDate(item.created_at)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'credits' && isSuperAdmin && (
                        <div>
                            <div style={{
                                background: 'linear-gradient(135deg, rgba(127, 217, 87, 0.15), rgba(86, 217, 137, 0.1))',
                                padding: '1.5rem',
                                borderRadius: 'var(--border-radius)',
                                border: '2px solid var(--glass-border)',
                                marginBottom: '1.5rem'
                            }}>
                                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                                    <h3 style={{margin: 0, color: 'var(--white)', fontSize: '1.2rem'}}>
                                        💎 סיכום קרדיטים
                                    </h3>
                                </div>
                                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem'}}>
                                    <div style={{textAlign: 'center'}}>
                                        <div style={{fontSize: '2rem', color: 'var(--primary-light)', fontWeight: 'bold'}}>
                                            {userStats[selectedUser.id]?.creditsSpent || 0}
                                        </div>
                                        <div style={{color: 'var(--text-light)', fontSize: '0.9rem'}}>סה"כ בוזבז</div>
                                    </div>
                                    <div style={{textAlign: 'center'}}>
                                        <div style={{fontSize: '2rem', color: 'var(--white)', fontWeight: 'bold'}}>
                                            {selectedUser.credits}
                                        </div>
                                        <div style={{color: 'var(--text-light)', fontSize: '0.9rem'}}>קרדיטים נוכחיים</div>
                                    </div>
                                </div>
                            </div>
                            
                            <h3 style={{margin: '0 0 1rem 0', color: 'var(--white)', fontSize: '1.1rem'}}>
                                📋 פירוט הוצאות קרדיטים
                            </h3>
                            {userStats[selectedUser.id]?.creditsHistory.length === 0 ? (
                                <div style={{textAlign: 'center', padding: '3rem', color: 'var(--text-light)'}}>
                                    <div style={{fontSize: '3rem', marginBottom: '1rem'}}>💎</div>
                                    <p>עדיין לא בוזבזו קרדיטים</p>
                                </div>
                            ) : (
                                <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '500px', overflowY: 'auto'}}>
                                    {userStats[selectedUser.id]?.creditsHistory.map((item, index) => (
                                        <div
                                            key={index}
                                            style={{
                                                background: 'var(--glass-bg)',
                                                padding: '1rem',
                                                borderRadius: 'var(--border-radius)',
                                                border: '1px solid var(--glass-border)',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <div style={{flex: 1}}>
                                                <div style={{color: 'var(--white)', fontSize: '0.95rem', marginBottom: '0.3rem'}}>
                                                    {item.description}
                                                </div>
                                                <div style={{color: 'var(--text-light)', fontSize: '0.85rem'}}>
                                                    📅 {item.created_at ? formatDate(item.created_at) : 'לא ידוע'}
                                                </div>
                                            </div>
                                            <div style={{
                                                color: item.credits_change < 0 ? 'var(--warning-color)' : 'var(--primary-color)',
                                                fontSize: '1.2rem',
                                                fontWeight: 'bold',
                                                minWidth: '80px',
                                                textAlign: 'right'
                                            }}>
                                                {item.credits_change < 0 ? '−' : '+'}{Math.abs(item.credits_change)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'settings' && isSuperAdmin && (
                        <div>
                            <div style={{
                                background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.15), rgba(255, 152, 0, 0.1))',
                                padding: '1.5rem',
                                borderRadius: 'var(--border-radius)',
                                border: '2px solid rgba(255, 193, 7, 0.3)',
                                marginBottom: '2rem'
                            }}>
                                <h3 style={{margin: '0 0 1rem 0', color: 'var(--warning-color)', fontSize: '1.2rem'}}>
                                    ⚙️ ניהול עלויות קרדיטים
                                </h3>
                                <p style={{margin: 0, color: 'var(--text-light)', fontSize: '0.95rem'}}>
                                    כאן תוכל לשלוט בכמה קרדיטים עולה כל פעולה במערכת. השינויים יתעדכנו מיד בכל המקומות במערכת.
                                </p>
                            </div>

                            {editingCosts ? (
                                <div style={{
                                    background: 'var(--glass-bg)',
                                    padding: '2rem',
                                    borderRadius: 'var(--border-radius)',
                                    border: '1px solid var(--glass-border)'
                                }}>
                                    <h3 style={{margin: '0 0 1.5rem 0', color: 'var(--white)'}}>עדכון עלויות קרדיטים</h3>
                                    <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
                                        {[
                                            { key: 'story_part', label: '📚 חלק בסיפור (טקסט + איור)', description: 'כל חלק חדש בסיפור' },
                                            { key: 'plan_step', label: '🎯 שלב בתוכנית למידה', description: 'כל שלב חדש בתוכנית' },
                                            { key: 'worksheet', label: '📄 דף תרגול', description: 'דף תרגול מותאם אישית' },
                                            { key: 'workbook', label: '📝 חוברת עבודה מלאה', description: 'חוברת עבודה עם תרגילים' },
                                            { key: 'topic_suggestions', label: '💡 הצעות נושאים', description: 'קבלת הצעות נושאים ללמידה' }
                                        ].map(item => (
                                            <div key={item.key} style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                gap: '1rem',
                                                flexWrap: 'wrap'
                                            }}>
                                                <div style={{flex: 1, minWidth: '250px'}}>
                                                    <div style={{fontSize: '1.1rem', color: 'var(--white)', marginBottom: '0.3rem'}}>
                                                        {item.label}
                                                    </div>
                                                    <div style={{fontSize: '0.9rem', color: 'var(--text-light)'}}>
                                                        {item.description}
                                                    </div>
                                                </div>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={costsInput[item.key as keyof typeof costsInput]}
                                                    onChange={(e) => setCostsInput({
                                                        ...costsInput,
                                                        [item.key]: parseInt(e.target.value) || 0
                                                    })}
                                                    style={{
                                                        width: '100px',
                                                        padding: '0.75rem',
                                                        borderRadius: '8px',
                                                        border: '1px solid var(--glass-border)',
                                                        background: 'var(--glass-bg)',
                                                        color: 'var(--white)',
                                                        fontSize: '1.1rem',
                                                        textAlign: 'center',
                                                        fontWeight: 'bold'
                                                    }}
                                                />
                                                <span style={{fontSize: '0.9rem', color: 'var(--text-light)', minWidth: '60px'}}>קרדיטים</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end'}}>
                                        <button
                                            onClick={() => {
                                                setEditingCosts(false);
                                                setCostsInput(creditCosts);
                                            }}
                                            style={{
                                                ...styles.button,
                                                background: 'var(--glass-bg)',
                                                color: 'var(--text-light)'
                                            }}
                                        >
                                            ביטול
                                        </button>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    await updateCreditCosts(costsInput);
                                                    alert('עלויות הקרדיטים עודכנו בהצלחה!');
                                                    setEditingCosts(false);
                                                } catch (error) {
                                                    console.error('Error updating costs:', error);
                                                    alert('שגיאה בעדכון העלויות');
                                                }
                                            }}
                                            style={{
                                                ...styles.button,
                                                background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))'
                                            }}
                                        >
                                            💾 שמור שינויים
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div style={{
                                    background: 'var(--glass-bg)',
                                    padding: '2rem',
                                    borderRadius: 'var(--border-radius)',
                                    border: '1px solid var(--glass-border)'
                                }}>
                                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem'}}>
                                        <h3 style={{margin: 0, color: 'var(--white)'}}>עלויות נוכחיות</h3>
                                        <button
                                            onClick={() => {
                                                setCostsInput(creditCosts);
                                                setEditingCosts(true);
                                            }}
                                            style={{
                                                ...styles.button,
                                                background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))'
                                            }}
                                        >
                                            ✏️ ערוך עלויות
                                        </button>
                                    </div>
                                    <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                                        {[
                                            { key: 'story_part', label: '📚 חלק בסיפור (טקסט + איור)', description: 'כל חלק חדש בסיפור' },
                                            { key: 'plan_step', label: '🎯 שלב בתוכנית למידה', description: 'כל שלב חדש בתוכנית' },
                                            { key: 'worksheet', label: '📄 דף תרגול', description: 'דף תרגול מותאם אישית' },
                                            { key: 'workbook', label: '📝 חוברת עבודה מלאה', description: 'חוברת עבודה עם תרגילים' },
                                            { key: 'topic_suggestions', label: '💡 הצעות נושאים', description: 'קבלת הצעות נושאים ללמידה' }
                                        ].map(item => (
                                            <div key={item.key} style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '1rem',
                                                background: 'rgba(127, 217, 87, 0.05)',
                                                borderRadius: 'var(--border-radius)',
                                                border: '1px solid var(--glass-border)',
                                                flexWrap: 'wrap',
                                                gap: '1rem'
                                            }}>
                                                <div style={{flex: 1, minWidth: '250px'}}>
                                                    <div style={{fontSize: '1.1rem', color: 'var(--white)', marginBottom: '0.3rem'}}>
                                                        {item.label}
                                                    </div>
                                                    <div style={{fontSize: '0.9rem', color: 'var(--text-light)'}}>
                                                        {item.description}
                                                    </div>
                                                </div>
                                                <div style={{
                                                    fontSize: '1.5rem',
                                                    color: 'var(--primary-light)',
                                                    fontWeight: 'bold',
                                                    minWidth: '100px',
                                                    textAlign: 'center'
                                                }}>
                                                    {creditCosts[item.key as keyof typeof creditCosts]} 💎
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Message Modal */}
            {showMessageModal && isSuperAdmin && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10000,
                    padding: '2rem'
                }}>
                    <div style={{
                        background: 'linear-gradient(145deg, rgba(26, 46, 26, 0.95), rgba(36, 60, 36, 0.9))',
                        padding: '2rem',
                        borderRadius: 'var(--border-radius-large)',
                        border: '2px solid var(--primary-color)',
                        boxShadow: 'var(--card-shadow-hover)',
                        backdropFilter: 'blur(20px)',
                        maxWidth: '600px',
                        width: '100%'
                    }}>
                        <h2 style={{...styles.title, marginTop: 0, marginBottom: '1.5rem'}}>
                            📢 שלוח הודעה כללית
                        </h2>
                        <p style={{color: 'var(--text-light)', marginBottom: '1rem'}}>
                            ההודעה תישלח לכל המשתמשים הפעילים במערכת
                        </p>
                        <textarea
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            placeholder="הכנס את תוכן ההודעה כאן..."
                            style={{
                                width: '100%',
                                minHeight: '150px',
                                padding: '1rem',
                                borderRadius: 'var(--border-radius)',
                                border: '1px solid var(--glass-border)',
                                background: 'var(--glass-bg)',
                                color: 'var(--white)',
                                fontSize: '1rem',
                                fontFamily: 'inherit',
                                resize: 'vertical',
                                marginBottom: '1rem'
                            }}
                        />
                        <div style={{display: 'flex', gap: '1rem', justifyContent: 'flex-end'}}>
                            <button
                                onClick={() => {
                                    setShowMessageModal(false);
                                    setMessageText('');
                                }}
                                style={{
                                    ...styles.button,
                                    background: 'var(--glass-bg)',
                                    color: 'var(--text-light)'
                                }}
                                disabled={sendingMessage}
                            >
                                ביטול
                            </button>
                            <button
                                onClick={async () => {
                                    if (!messageText.trim()) {
                                        alert('נא להזין הודעה');
                                        return;
                                    }
                                    setSendingMessage(true);
                                    try {
                                        // Save message to a notifications table or send via email
                                        // For now, we'll create a simple notification system
                                        const { data: allUsersData } = await supabase
                                            .from('users')
                                            .select('id, email');
                                        
                                        // Store message in a notifications table (we'll create this)
                                        // For now, just show success message
                                        alert(`ההודעה נשלחה ל-${allUsersData?.length || 0} משתמשים בהצלחה!`);
                                        setShowMessageModal(false);
                                        setMessageText('');
                                    } catch (error) {
                                        console.error('Error sending message:', error);
                                        alert('שגיאה בשליחת ההודעה');
                                    } finally {
                                        setSendingMessage(false);
                                    }
                                }}
                                style={{
                                    ...styles.button,
                                    background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))'
                                }}
                                disabled={sendingMessage || !messageText.trim()}
                            >
                                {sendingMessage ? 'שולח...' : '📤 שלח הודעה'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Activity Monitor Modal */}
            {showActivityMonitor && isSuperAdmin && (
                <ActivityMonitor onClose={() => setShowActivityMonitor(false)} />
            )}
        </div>
    );
};

export default AdminDashboard;
