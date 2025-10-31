import React, { useState, useEffect } from 'react';
import { supabase } from './src/supabaseClient';

interface ActivityLog {
    id: number;
    user_email: string;
    action_type: string;
    resource_type: string;
    resource_id: string | null;
    created_at: string;
    changes_summary: any;
    old_value: any;
    new_value: any;
}

interface UserActivitySummary {
    email: string;
    username: string;
    creates_count: number;
    updates_count: number;
    deletes_count: number;
    total_actions: number;
    last_activity: string;
}

interface ActivityMonitorProps {
    onClose: () => void;
}

const ActivityMonitor: React.FC<ActivityMonitorProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState<'recent' | 'users' | 'stats'>('recent');
    const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
    const [userSummary, setUserSummary] = useState<UserActivitySummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ action: 'all', resource: 'all', search: '' });

    useEffect(() => {
        loadData();
        // Auto-refresh every 30 seconds
        const interval = setInterval(loadData, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadData = async () => {
        setLoading(true);
        await Promise.all([loadRecentActivity(), loadUserSummary()]);
        setLoading(false);
    };

    const loadRecentActivity = async () => {
        try {
            const { data, error } = await supabase
                .from('activity_log')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) throw error;
            setRecentActivity(data || []);
        } catch (error) {
            console.error('Error loading activity:', error);
        }
    };

    const loadUserSummary = async () => {
        try {
            const { data, error } = await supabase
                .from('user_activity_summary')
                .select('*');

            if (error) throw error;
            setUserSummary(data || []);
        } catch (error) {
            console.error('Error loading user summary:', error);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('he-IL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'create': return '➕';
            case 'update': return '✏️';
            case 'delete': return '🗑️';
            case 'view': return '👁️';
            case 'login': return '🔐';
            case 'logout': return '🚪';
            default: return '📝';
        }
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'create': return '#4ade80';
            case 'update': return '#60a5fa';
            case 'delete': return '#f87171';
            case 'view': return '#a78bfa';
            default: return '#94a3b8';
        }
    };

    const getResourceLabel = (resource: string) => {
        const labels: Record<string, string> = {
            section: 'סקשן',
            section_item: 'פריט סקשן',
            menu_item: 'פריט תפריט',
            site_setting: 'הגדרת אתר',
            media: 'מדיה',
            content: 'תוכן',
            user: 'משתמש',
            profile: 'פרופיל'
        };
        return labels[resource] || resource;
    };

    const filteredActivity = recentActivity.filter(item => {
        if (filter.action !== 'all' && item.action_type !== filter.action) return false;
        if (filter.resource !== 'all' && item.resource_type !== filter.resource) return false;
        if (filter.search && !item.user_email.toLowerCase().includes(filter.search.toLowerCase())) return false;
        return true;
    });

    const panelStyles: React.CSSProperties = {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)',
        zIndex: 10001,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fadeIn 0.3s ease-out'
    };

    const contentStyles: React.CSSProperties = {
        background: 'linear-gradient(135deg, rgba(15, 30, 15, 0.98), rgba(25, 45, 25, 0.98))',
        width: '90vw',
        maxWidth: '1200px',
        height: '90vh',
        borderRadius: '20px',
        border: '2px solid var(--primary-color)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        color: 'white',
        overflow: 'hidden'
    };

    const headerStyles: React.CSSProperties = {
        padding: '1.5rem 2rem',
        borderBottom: '1px solid rgba(127, 217, 87, 0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(0, 0, 0, 0.3)'
    };

    const tabStyles = (isActive: boolean): React.CSSProperties => ({
        padding: '0.75rem 1.5rem',
        background: isActive ? 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))' : 'transparent',
        border: isActive ? 'none' : '1px solid rgba(127, 217, 87, 0.3)',
        borderRadius: '12px',
        color: 'white',
        cursor: 'pointer',
        fontSize: '0.9rem',
        fontWeight: isActive ? 'bold' : 'normal',
        transition: 'all 0.3s ease'
    });

    return (
        <>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .activity-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .activity-table th {
                    padding: 1rem;
                    text-align: right;
                    background: rgba(0, 0, 0, 0.3);
                    border-bottom: 1px solid rgba(127, 217, 87, 0.3);
                    font-weight: bold;
                    font-size: 0.9rem;
                }
                .activity-table td {
                    padding: 0.75rem 1rem;
                    border-bottom: 1px solid rgba(127, 217, 87, 0.1);
                    font-size: 0.85rem;
                }
                .activity-table tr:hover {
                    background: rgba(127, 217, 87, 0.05);
                }
                .filter-input {
                    padding: 0.5rem;
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid rgba(127, 217, 87, 0.3);
                    border-radius: 8px;
                    color: white;
                    font-size: 0.85rem;
                }
                .filter-input:focus {
                    outline: none;
                    border-color: var(--primary-color);
                }
            `}</style>
            <div style={panelStyles} onClick={onClose}>
                <div style={contentStyles} onClick={(e) => e.stopPropagation()}>
                    {/* Header */}
                    <div style={headerStyles}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                📊 ניטור פעילות מערכת
                            </h2>
                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
                                מעקב אחר כל הפעולות במערכת בזמן אמת
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                color: 'white',
                                width: '50px',
                                height: '50px',
                                borderRadius: '50%',
                                cursor: 'pointer',
                                fontSize: '2rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            ×
                        </button>
                    </div>

                    {/* Tabs */}
                    <div style={{ padding: '1rem 2rem', borderBottom: '1px solid rgba(127, 217, 87, 0.3)', display: 'flex', gap: '0.5rem', background: 'rgba(0, 0, 0, 0.2)' }}>
                        <button style={tabStyles(activeTab === 'recent')} onClick={() => setActiveTab('recent')}>
                            🕒 פעילות אחרונה
                        </button>
                        <button style={tabStyles(activeTab === 'users')} onClick={() => setActiveTab('users')}>
                            👥 סיכום משתמשים
                        </button>
                        <button
                            onClick={loadData}
                            style={{
                                marginRight: 'auto',
                                padding: '0.75rem 1.5rem',
                                background: 'linear-gradient(135deg, #4ade80, #22c55e)',
                                border: 'none',
                                borderRadius: '12px',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                fontWeight: 'bold',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            🔄 רענן
                        </button>
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem' }}>
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '3rem', fontSize: '1.2rem', color: 'rgba(255,255,255,0.6)' }}>
                                טוען נתוני פעילות...
                            </div>
                        ) : activeTab === 'recent' ? (
                            <>
                                {/* Filters */}
                                <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                    <select
                                        className="filter-input"
                                        value={filter.action}
                                        onChange={(e) => setFilter({ ...filter, action: e.target.value })}
                                    >
                                        <option value="all">כל הפעולות</option>
                                        <option value="create">➕ יצירה</option>
                                        <option value="update">✏️ עדכון</option>
                                        <option value="delete">🗑️ מחיקה</option>
                                    </select>
                                    <select
                                        className="filter-input"
                                        value={filter.resource}
                                        onChange={(e) => setFilter({ ...filter, resource: e.target.value })}
                                    >
                                        <option value="all">כל המשאבים</option>
                                        <option value="section">סקשנים</option>
                                        <option value="menu_item">תפריט</option>
                                        <option value="site_setting">הגדרות</option>
                                    </select>
                                    <input
                                        type="text"
                                        className="filter-input"
                                        placeholder="חיפוש לפי אימייל..."
                                        value={filter.search}
                                        onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                                        style={{ flex: 1, minWidth: '200px' }}
                                    />
                                </div>

                                {/* Activity Table */}
                                <div style={{ overflowX: 'auto' }}>
                                    <table className="activity-table">
                                        <thead>
                                            <tr>
                                                <th>זמן</th>
                                                <th>משתמש</th>
                                                <th>פעולה</th>
                                                <th>משאב</th>
                                                <th>מזהה</th>
                                                <th>פרטים</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredActivity.map((item) => (
                                                <tr key={item.id}>
                                                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                                                        {formatDate(item.created_at)}
                                                    </td>
                                                    <td style={{ fontWeight: 'bold' }}>
                                                        {item.user_email}
                                                    </td>
                                                    <td>
                                                        <span style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '0.5rem',
                                                            padding: '0.25rem 0.75rem',
                                                            borderRadius: '12px',
                                                            background: `${getActionColor(item.action_type)}20`,
                                                            border: `1px solid ${getActionColor(item.action_type)}`,
                                                            fontSize: '0.85rem'
                                                        }}>
                                                            {getActionIcon(item.action_type)}
                                                            {item.action_type}
                                                        </span>
                                                    </td>
                                                    <td>{getResourceLabel(item.resource_type)}</td>
                                                    <td style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                                                        {item.resource_id || '-'}
                                                    </td>
                                                    <td>
                                                        {item.action_type === 'update' && item.old_value && item.new_value ? (
                                                            <details style={{ cursor: 'pointer' }}>
                                                                <summary style={{ fontSize: '0.8rem', color: '#60a5fa' }}>
                                                                    הצג שינויים
                                                                </summary>
                                                                <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', fontSize: '0.75rem' }}>
                                                                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                                                                        {JSON.stringify({ old: item.old_value, new: item.new_value }, null, 2)}
                                                                    </pre>
                                                                </div>
                                                            </details>
                                                        ) : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {filteredActivity.length === 0 && (
                                        <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.5)' }}>
                                            אין פעילות מתאימה למסננים
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div>
                                <h3 style={{ marginBottom: '1.5rem' }}>📊 סטטיסטיקות משתמשים</h3>
                                <table className="activity-table">
                                    <thead>
                                        <tr>
                                            <th>משתמש</th>
                                            <th>אימייל</th>
                                            <th>יצירות</th>
                                            <th>עדכונים</th>
                                            <th>מחיקות</th>
                                            <th>סה"כ פעולות</th>
                                            <th>פעילות אחרונה</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {userSummary.map((user, index) => (
                                            <tr key={index}>
                                                <td style={{ fontWeight: 'bold' }}>{user.username}</td>
                                                <td>{user.email}</td>
                                                <td><span style={{ color: '#4ade80' }}>➕ {user.creates_count}</span></td>
                                                <td><span style={{ color: '#60a5fa' }}>✏️ {user.updates_count}</span></td>
                                                <td><span style={{ color: '#f87171' }}>🗑️ {user.deletes_count}</span></td>
                                                <td><strong>{user.total_actions}</strong></td>
                                                <td style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                                                    {user.last_activity ? formatDate(user.last_activity) : 'אף פעם'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {userSummary.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.5)' }}>
                                        אין נתוני פעילות
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default ActivityMonitor;
