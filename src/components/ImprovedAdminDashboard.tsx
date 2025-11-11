import React, { useState, useEffect } from 'react';
import { User, useAppContext } from './AppContext';
import { styles } from '../../styles';
import { supabase } from '../supabaseClient';

interface ImprovedAdminDashboardProps {
    loggedInUser: User;
}

interface SystemStats {
    totalUsers: number;
    activeUsers: number;
    totalStories: number;
    totalWorkbooks: number;
    totalPlans: number;
    totalCreditsSpent: number;
    newUsersThisMonth: number;
    activeSessions: number;
}

const ImprovedAdminDashboard = ({ loggedInUser }: ImprovedAdminDashboardProps) => {
    const { allUsers, refreshAllUsers } = useAppContext();
    const [activeMainTab, setActiveMainTab] = useState<'dashboard' | 'users' | 'content' | 'notifications' | 'activity'>('dashboard');
    const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
    const [loadingStats, setLoadingStats] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState<'all' | 'user' | 'admin'>('all');

    // Check if super admin
    const isSuperAdmin = loggedInUser.is_super_admin || false;

    // Load system stats
    const loadSystemStats = async () => {
        setLoadingStats(true);
        try {
            // Get total users
            const { count: totalUsers } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true });

            // Get active users (logged in last 30 days)
            const { count: activeUsers } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .gte('last_login_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

            // Get total stories
            const { count: totalStories } = await supabase
                .from('stories')
                .select('*', { count: 'exact', head: true });

            // Get total workbooks
            const { count: totalWorkbooks } = await supabase
                .from('workbooks')
                .select('*', { count: 'exact', head: true });

            // Get total learning plans
            const { count: totalPlans } = await supabase
                .from('learning_plans')
                .select('*', { count: 'exact', head: true });

            // Get new users this month
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);
            const { count: newUsersThisMonth } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', startOfMonth.toISOString());

            setSystemStats({
                totalUsers: totalUsers || 0,
                activeUsers: activeUsers || 0,
                totalStories: totalStories || 0,
                totalWorkbooks: totalWorkbooks || 0,
                totalPlans: totalPlans || 0,
                totalCreditsSpent: 0, // Calculate from transactions if exists
                newUsersThisMonth: newUsersThisMonth || 0,
                activeSessions: 0 // From user_sessions table
            });
        } catch (error) {
            console.error('Error loading system stats:', error);
        } finally {
            setLoadingStats(false);
        }
    };

    useEffect(() => {
        refreshAllUsers();
        loadSystemStats();
    }, []);

    // Filter users
    const filteredUsers = allUsers.filter(user => {
        const matchesSearch =
            user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRole =
            filterRole === 'all' ||
            (filterRole === 'admin' && (user.is_admin || user.role === 'admin')) ||
            (filterRole === 'user' && !user.is_admin && user.role !== 'admin');

        return matchesSearch && matchesRole;
    });

    return (
        <div style={{
            padding: '2rem',
            minHeight: '100vh',
            background: 'var(--background-dark)'
        }}>
            {/* Header */}
            <div style={{
                marginBottom: '2rem',
                textAlign: 'center'
            }}>
                <h1 style={{
                    fontSize: 'clamp(2rem, 5vw, 3rem)',
                    background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '0.5rem'
                }}>
                    🛡️ דשבורד מנהלים מתקדם
                </h1>
                <p style={{ color: 'var(--text-light)', fontSize: '1.1rem' }}>
                    ברוך הבא, {loggedInUser.username} {isSuperAdmin && '👑 (סופר מנהל)'}
                </p>
            </div>

            {/* Main Navigation Tabs */}
            <div style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '2rem',
                flexWrap: 'wrap',
                justifyContent: 'center'
            }}>
                <button
                    onClick={() => setActiveMainTab('dashboard')}
                    style={{
                        padding: '1rem 2rem',
                        background: activeMainTab === 'dashboard'
                            ? 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))'
                            : 'var(--glass-bg)',
                        border: `2px solid ${activeMainTab === 'dashboard' ? 'var(--primary-color)' : 'var(--glass-border)'}`,
                        borderRadius: '12px',
                        color: 'white',
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: activeMainTab === 'dashboard' ? '0 4px 15px rgba(127, 217, 87, 0.3)' : 'none'
                    }}
                >
                    📊 Dashboard
                </button>
                <button
                    onClick={() => setActiveMainTab('users')}
                    style={{
                        padding: '1rem 2rem',
                        background: activeMainTab === 'users'
                            ? 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))'
                            : 'var(--glass-bg)',
                        border: `2px solid ${activeMainTab === 'users' ? 'var(--primary-color)' : 'var(--glass-border)'}`,
                        borderRadius: '12px',
                        color: 'white',
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: activeMainTab === 'users' ? '0 4px 15px rgba(127, 217, 87, 0.3)' : 'none'
                    }}
                >
                    👥 משתמשים ({allUsers.length})
                </button>
                <button
                    onClick={() => setActiveMainTab('content')}
                    style={{
                        padding: '1rem 2rem',
                        background: activeMainTab === 'content'
                            ? 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))'
                            : 'var(--glass-bg)',
                        border: `2px solid ${activeMainTab === 'content' ? 'var(--primary-color)' : 'var(--glass-border)'}`,
                        borderRadius: '12px',
                        color: 'white',
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: activeMainTab === 'content' ? '0 4px 15px rgba(127, 217, 87, 0.3)' : 'none'
                    }}
                >
                    📚 תוכן
                </button>
                {isSuperAdmin && (
                    <>
                        <button
                            onClick={() => setActiveMainTab('notifications')}
                            style={{
                                padding: '1rem 2rem',
                                background: activeMainTab === 'notifications'
                                    ? 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))'
                                    : 'var(--glass-bg)',
                                border: `2px solid ${activeMainTab === 'notifications' ? 'var(--primary-color)' : 'var(--glass-border)'}`,
                                borderRadius: '12px',
                                color: 'white',
                                fontSize: '1.1rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                boxShadow: activeMainTab === 'notifications' ? '0 4px 15px rgba(127, 217, 87, 0.3)' : 'none'
                            }}
                        >
                            📢 הודעות
                        </button>
                        <button
                            onClick={() => setActiveMainTab('activity')}
                            style={{
                                padding: '1rem 2rem',
                                background: activeMainTab === 'activity'
                                    ? 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))'
                                    : 'var(--glass-bg)',
                                border: `2px solid ${activeMainTab === 'activity' ? 'var(--primary-color)' : 'var(--glass-border)'}`,
                                borderRadius: '12px',
                                color: 'white',
                                fontSize: '1.1rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                boxShadow: activeMainTab === 'activity' ? '0 4px 15px rgba(127, 217, 87, 0.3)' : 'none'
                            }}
                        >
                            🔍 פעילות
                        </button>
                    </>
                )}
            </div>

            {/* Dashboard Tab */}
            {activeMainTab === 'dashboard' && (
                <div>
                    <h2 style={{ color: 'var(--primary-light)', marginBottom: '2rem', fontSize: '1.8rem' }}>
                        📈 סטטיסטיקות מערכת
                    </h2>

                    {loadingStats ? (
                        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-light)' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
                            <p>טוען סטטיסטיקות...</p>
                        </div>
                    ) : systemStats && (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                            gap: '1.5rem',
                            marginBottom: '2rem'
                        }}>
                            {/* Total Users */}
                            <div style={{
                                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.05))',
                                padding: '2rem',
                                borderRadius: '16px',
                                border: '2px solid rgba(59, 130, 246, 0.3)',
                                textAlign: 'center',
                                transition: 'transform 0.3s ease',
                                cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>👥</div>
                                <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'rgb(59, 130, 246)', marginBottom: '0.5rem' }}>
                                    {systemStats.totalUsers}
                                </div>
                                <div style={{ color: 'var(--text-light)', fontSize: '1.1rem' }}>
                                    סה"כ משתמשים
                                </div>
                            </div>

                            {/* Active Users */}
                            <div style={{
                                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.05))',
                                padding: '2rem',
                                borderRadius: '16px',
                                border: '2px solid rgba(16, 185, 129, 0.3)',
                                textAlign: 'center',
                                transition: 'transform 0.3s ease',
                                cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>✅</div>
                                <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'rgb(16, 185, 129)', marginBottom: '0.5rem' }}>
                                    {systemStats.activeUsers}
                                </div>
                                <div style={{ color: 'var(--text-light)', fontSize: '1.1rem' }}>
                                    משתמשים פעילים
                                </div>
                                <div style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                                    (30 ימים אחרונים)
                                </div>
                            </div>

                            {/* Total Stories */}
                            <div style={{
                                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.05))',
                                padding: '2rem',
                                borderRadius: '16px',
                                border: '2px solid rgba(245, 158, 11, 0.3)',
                                textAlign: 'center',
                                transition: 'transform 0.3s ease',
                                cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>📚</div>
                                <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'rgb(245, 158, 11)', marginBottom: '0.5rem' }}>
                                    {systemStats.totalStories}
                                </div>
                                <div style={{ color: 'var(--text-light)', fontSize: '1.1rem' }}>
                                    סיפורים שנוצרו
                                </div>
                            </div>

                            {/* Total Workbooks */}
                            <div style={{
                                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(124, 58, 237, 0.05))',
                                padding: '2rem',
                                borderRadius: '16px',
                                border: '2px solid rgba(139, 92, 246, 0.3)',
                                textAlign: 'center',
                                transition: 'transform 0.3s ease',
                                cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>📖</div>
                                <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'rgb(139, 92, 246)', marginBottom: '0.5rem' }}>
                                    {systemStats.totalWorkbooks}
                                </div>
                                <div style={{ color: 'var(--text-light)', fontSize: '1.1rem' }}>
                                    חוברות עבודה
                                </div>
                            </div>

                            {/* New Users This Month */}
                            <div style={{
                                background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(219, 39, 119, 0.05))',
                                padding: '2rem',
                                borderRadius: '16px',
                                border: '2px solid rgba(236, 72, 153, 0.3)',
                                textAlign: 'center',
                                transition: 'transform 0.3s ease',
                                cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>🆕</div>
                                <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'rgb(236, 72, 153)', marginBottom: '0.5rem' }}>
                                    {systemStats.newUsersThisMonth}
                                </div>
                                <div style={{ color: 'var(--text-light)', fontSize: '1.1rem' }}>
                                    משתמשים חדשים
                                </div>
                                <div style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                                    (החודש)
                                </div>
                            </div>

                            {/* Learning Plans */}
                            <div style={{
                                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(8, 145, 178, 0.05))',
                                padding: '2rem',
                                borderRadius: '16px',
                                border: '2px solid rgba(6, 182, 212, 0.3)',
                                textAlign: 'center',
                                transition: 'transform 0.3s ease',
                                cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>🎯</div>
                                <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'rgb(6, 182, 212)', marginBottom: '0.5rem' }}>
                                    {systemStats.totalPlans}
                                </div>
                                <div style={{ color: 'var(--text-light)', fontSize: '1.1rem' }}>
                                    תוכניות למידה
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div style={{
                        background: 'var(--glass-bg)',
                        padding: '2rem',
                        borderRadius: '16px',
                        border: '2px solid var(--glass-border)',
                        marginTop: '2rem'
                    }}>
                        <h3 style={{ color: 'var(--primary-light)', marginBottom: '1.5rem', fontSize: '1.5rem' }}>
                            ⚡ פעולות מהירות
                        </h3>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '1rem'
                        }}>
                            <button
                                onClick={() => setActiveMainTab('users')}
                                style={{
                                    padding: '1.5rem',
                                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.1))',
                                    border: '2px solid rgba(59, 130, 246, 0.3)',
                                    borderRadius: '12px',
                                    color: 'white',
                                    fontSize: '1.1rem',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                👥 ניהול משתמשים
                            </button>
                            <button
                                onClick={loadSystemStats}
                                style={{
                                    padding: '1.5rem',
                                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.1))',
                                    border: '2px solid rgba(16, 185, 129, 0.3)',
                                    borderRadius: '12px',
                                    color: 'white',
                                    fontSize: '1.1rem',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                🔄 רענן סטטיסטיקות
                            </button>
                            <button
                                onClick={() => setActiveMainTab('content')}
                                style={{
                                    padding: '1.5rem',
                                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.1))',
                                    border: '2px solid rgba(245, 158, 11, 0.3)',
                                    borderRadius: '12px',
                                    color: 'white',
                                    fontSize: '1.1rem',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                📚 צפה בתוכן
                            </button>
                            {isSuperAdmin && (
                                <button
                                    onClick={() => setActiveMainTab('notifications')}
                                    style={{
                                        padding: '1.5rem',
                                        background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(219, 39, 119, 0.1))',
                                        border: '2px solid rgba(236, 72, 153, 0.3)',
                                        borderRadius: '12px',
                                        color: 'white',
                                        fontSize: '1.1rem',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                >
                                    📢 שלח הודעה
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Users Tab */}
            {activeMainTab === 'users' && (
                <div>
                    <h2 style={{ color: 'var(--primary-light)', marginBottom: '2rem', fontSize: '1.8rem' }}>
                        👥 ניהול משתמשים
                    </h2>

                    {/* Search and Filter */}
                    <div style={{
                        background: 'var(--glass-bg)',
                        padding: '1.5rem',
                        borderRadius: '16px',
                        border: '2px solid var(--glass-border)',
                        marginBottom: '2rem'
                    }}>
                        <div style={{
                            display: 'flex',
                            gap: '1rem',
                            flexWrap: 'wrap'
                        }}>
                            <input
                                type="text"
                                placeholder="🔍 חפש משתמש (שם או אימייל)..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    ...styles.input,
                                    flex: 1,
                                    minWidth: '250px',
                                    fontSize: '1.1rem'
                                }}
                            />
                            <select
                                value={filterRole}
                                onChange={(e) => setFilterRole(e.target.value as any)}
                                style={{
                                    ...styles.select,
                                    minWidth: '150px',
                                    fontSize: '1.1rem'
                                }}
                            >
                                <option value="all">כל התפקידים</option>
                                <option value="user">משתמשים רגילים</option>
                                <option value="admin">מנהלים</option>
                            </select>
                        </div>
                    </div>

                    {/* Users List */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: '1.5rem'
                    }}>
                        {filteredUsers.map(user => (
                            <div
                                key={user.id}
                                style={{
                                    background: 'var(--glass-bg)',
                                    padding: '1.5rem',
                                    borderRadius: '16px',
                                    border: '2px solid var(--glass-border)',
                                    transition: 'all 0.3s ease',
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-5px)';
                                    e.currentTarget.style.borderColor = 'var(--primary-color)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.borderColor = 'var(--glass-border)';
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    marginBottom: '1rem'
                                }}>
                                    <div style={{
                                        width: '60px',
                                        height: '60px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '2rem',
                                        fontWeight: 'bold',
                                        color: 'white'
                                    }}>
                                        {user.username?.[0]?.toUpperCase() || '👤'}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            fontSize: '1.2rem',
                                            fontWeight: 'bold',
                                            color: 'white',
                                            marginBottom: '0.25rem'
                                        }}>
                                            {user.username}
                                            {user.is_admin && ' 👑'}
                                        </div>
                                        <div style={{
                                            fontSize: '0.9rem',
                                            color: 'var(--text-light)'
                                        }}>
                                            {user.email}
                                        </div>
                                    </div>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '1rem',
                                    background: 'rgba(0, 0, 0, 0.2)',
                                    borderRadius: '8px',
                                    marginBottom: '1rem'
                                }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary-light)' }}>
                                            💎 {user.credits}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                                            קרדיטים
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'rgb(59, 130, 246)' }}>
                                            {user.profiles?.length || 0}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                                            פרופילים
                                        </div>
                                    </div>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    gap: '0.5rem'
                                }}>
                                    <button
                                        onClick={() => {
                                            // Open user details
                                            console.log('View user:', user.id);
                                        }}
                                        style={{
                                            flex: 1,
                                            padding: '0.75rem',
                                            background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
                                            border: 'none',
                                            borderRadius: '8px',
                                            color: 'white',
                                            fontSize: '0.9rem',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        📊 פרטים
                                    </button>
                                    {isSuperAdmin && (
                                        <button
                                            onClick={() => {
                                                // Edit credits
                                                console.log('Edit credits:', user.id);
                                            }}
                                            style={{
                                                flex: 1,
                                                padding: '0.75rem',
                                                background: 'rgba(59, 130, 246, 0.2)',
                                                border: '2px solid rgba(59, 130, 246, 0.4)',
                                                borderRadius: '8px',
                                                color: 'white',
                                                fontSize: '0.9rem',
                                                fontWeight: 'bold',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease'
                                            }}
                                        >
                                            💎 ערוך
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredUsers.length === 0 && (
                        <div style={{
                            textAlign: 'center',
                            padding: '4rem',
                            color: 'var(--text-light)'
                        }}>
                            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔍</div>
                            <p style={{ fontSize: '1.2rem' }}>לא נמצאו משתמשים התואמים לחיפוש</p>
                        </div>
                    )}
                </div>
            )}

            {/* Content Tab */}
            {activeMainTab === 'content' && (
                <div style={{ textAlign: 'center', padding: '4rem' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📚</div>
                    <h2 style={{ color: 'var(--primary-light)', marginBottom: '1rem' }}>
                        ניהול תוכן
                    </h2>
                    <p style={{ color: 'var(--text-light)', fontSize: '1.1rem' }}>
                        בקרוב! כאן תוכל לראות ולנהל את כל התוכן שנוצר במערכת
                    </p>
                </div>
            )}

            {/* Notifications Tab */}
            {activeMainTab === 'notifications' && isSuperAdmin && (
                <div style={{ textAlign: 'center', padding: '4rem' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📢</div>
                    <h2 style={{ color: 'var(--primary-light)', marginBottom: '1rem' }}>
                        ניהול הודעות מערכת
                    </h2>
                    <p style={{ color: 'var(--text-light)', fontSize: '1.1rem' }}>
                        בקרוב! כאן תוכל לשלוח הודעות גלובליות למשתמשים
                    </p>
                </div>
            )}

            {/* Activity Tab */}
            {activeMainTab === 'activity' && isSuperAdmin && (
                <div style={{ textAlign: 'center', padding: '4rem' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔍</div>
                    <h2 style={{ color: 'var(--primary-light)', marginBottom: '1rem' }}>
                        לוג פעילות
                    </h2>
                    <p style={{ color: 'var(--text-light)', fontSize: '1.1rem' }}>
                        בקרוב! כאן תוכל לראות את כל הפעולות שבוצעו במערכת
                    </p>
                </div>
            )}
        </div>
    );
};

export default ImprovedAdminDashboard;
