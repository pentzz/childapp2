import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAppContext } from './AppContext';
import { styles } from '../../styles';

interface APIKey {
    id: string;
    api_key: string;
    is_assigned: boolean;
    assigned_to_user_id: string | null;
    assigned_at: string | null;
    created_at: string;
    notes: string | null;
    is_active: boolean;
    assigned_user_email?: string;
}

const APIKeysManager: React.FC = () => {
    const { user } = useAppContext();
    const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [newAPIKey, setNewAPIKey] = useState('');
    const [newAPIKeyNotes, setNewAPIKeyNotes] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (user) {
            loadAPIKeys();
        }
    }, [user]);

    const loadAPIKeys = async () => {
        setLoading(true);
        setError('');
        try {
            // Get all API keys
            const { data: keysData, error: keysError } = await supabase
                .from('api_keys_pool')
                .select('*')
                .order('created_at', { ascending: false });

            if (keysError) throw keysError;

            // Get assigned user emails
            if (keysData) {
                const keysWithEmails = await Promise.all(
                    keysData.map(async (key) => {
                        if (key.assigned_to_user_id) {
                            const { data: userData } = await supabase
                                .from('users')
                                .select('email')
                                .eq('id', key.assigned_to_user_id)
                                .single();

                            return { ...key, assigned_user_email: userData?.email };
                        }
                        return key;
                    })
                );
                setApiKeys(keysWithEmails);
            }
        } catch (err: any) {
            console.error('Error loading API keys:', err);
            setError(err.message || 'שגיאה בטעינת מפתחות API');
        } finally {
            setLoading(false);
        }
    };

    const handleAddAPIKey = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (!newAPIKey.trim()) {
            setError('יש להזין מפתח API');
            return;
        }

        try {
            const { error: insertError } = await supabase
                .from('api_keys_pool')
                .insert([{
                    api_key: newAPIKey.trim(),
                    notes: newAPIKeyNotes.trim() || null,
                    created_by: user?.id
                }]);

            if (insertError) throw insertError;

            setSuccessMessage('✅ מפתח API נוסף בהצלחה!');
            setNewAPIKey('');
            setNewAPIKeyNotes('');
            setShowAddForm(false);
            loadAPIKeys();

            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err: any) {
            console.error('Error adding API key:', err);
            setError(err.message || 'שגיאה בהוספת מפתח API');
        }
    };

    const handleToggleActive = async (id: string, currentStatus: boolean) => {
        try {
            const { error: updateError } = await supabase
                .from('api_keys_pool')
                .update({ is_active: !currentStatus })
                .eq('id', id);

            if (updateError) throw updateError;

            setSuccessMessage(currentStatus ? '❌ מפתח הושבת' : '✅ מפתח הופעל');
            loadAPIKeys();

            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err: any) {
            console.error('Error toggling API key:', err);
            setError(err.message || 'שגיאה בעדכון מפתח');
        }
    };

    const handleDeleteKey = async (id: string) => {
        if (!confirm('האם אתה בטוח שברצונך למחוק את המפתח?')) return;

        try {
            const { error: deleteError } = await supabase
                .from('api_keys_pool')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            setSuccessMessage('🗑️ מפתח נמחק בהצלחה');
            loadAPIKeys();

            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err: any) {
            console.error('Error deleting API key:', err);
            setError(err.message || 'שגיאה במחיקת מפתח');
        }
    };

    const stats = {
        total: apiKeys.filter(k => k.is_active).length,
        assigned: apiKeys.filter(k => k.is_assigned && k.is_active).length,
        available: apiKeys.filter(k => !k.is_assigned && k.is_active).length,
        inactive: apiKeys.filter(k => !k.is_active).length
    };

    if (loading) {
        return <div style={{...styles.centered, padding: '2rem'}}>טוען...</div>;
    }

    return (
        <div style={{
            padding: 'clamp(1rem, 3vw, 2rem)',
            maxWidth: '1200px',
            margin: '0 auto'
        }}>
            <div style={{
                background: 'linear-gradient(135deg, #FF6B9D, #FFA07A)',
                padding: 'clamp(1.5rem, 4vw, 2rem)',
                borderRadius: '20px',
                marginBottom: '2rem',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
            }}>
                <h1 style={{
                    fontSize: 'clamp(1.8rem, 5vw, 2.5rem)',
                    color: 'white',
                    margin: '0 0 1rem 0',
                    textAlign: 'center',
                    fontWeight: 'bold'
                }}>🔑 ניהול מפתחות API</h1>
                <p style={{
                    fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
                    color: 'rgba(255,255,255,0.95)',
                    margin: 0,
                    textAlign: 'center'
                }}>נהל את מאגר המפתחות להקצאה אוטומטית למשתמשים</p>
            </div>

            {error && (
                <div style={{
                    background: 'rgba(244, 67, 54, 0.15)',
                    border: '2px solid #f44336',
                    padding: '1rem',
                    borderRadius: '12px',
                    color: '#f44336',
                    marginBottom: '1rem',
                    textAlign: 'center',
                    fontSize: '1.1rem'
                }}>
                    ❌ {error}
                </div>
            )}

            {successMessage && (
                <div style={{
                    background: 'rgba(76, 175, 80, 0.15)',
                    border: '2px solid #4CAF50',
                    padding: '1rem',
                    borderRadius: '12px',
                    color: '#4CAF50',
                    marginBottom: '1rem',
                    textAlign: 'center',
                    fontSize: '1.1rem',
                    fontWeight: 'bold'
                }}>
                    {successMessage}
                </div>
            )}

            {/* Stats */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
            }}>
                {[
                    { label: 'סה"כ פעילים', value: stats.total, icon: '🔑', color: '#6BCF7F' },
                    { label: 'מוקצים', value: stats.assigned, icon: '✅', color: '#FF6B9D' },
                    { label: 'זמינים', value: stats.available, icon: '🆓', color: '#FFD93D' },
                    { label: 'מושבתים', value: stats.inactive, icon: '❌', color: '#999' }
                ].map((stat, idx) => (
                    <div key={idx} style={{
                        background: 'white',
                        padding: '1.5rem',
                        borderRadius: '16px',
                        border: `3px solid ${stat.color}`,
                        textAlign: 'center',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{fontSize: '2.5rem', marginBottom: '0.5rem'}}>{stat.icon}</div>
                        <div style={{
                            fontSize: '2rem',
                            fontWeight: 'bold',
                            color: stat.color,
                            marginBottom: '0.25rem'
                        }}>{stat.value}</div>
                        <div style={{fontSize: '0.95rem', color: '#666'}}>{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Add New Key Button */}
            <div style={{marginBottom: '2rem', textAlign: 'center'}}>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    style={{
                        padding: '1rem 2rem',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        background: 'linear-gradient(135deg, #6BCF7F, #4CAF50)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '16px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)',
                        transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e: any) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e: any) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    {showAddForm ? '❌ ביטול' : '➕ הוסף מפתח API חדש'}
                </button>
            </div>

            {/* Add Form */}
            {showAddForm && (
                <div style={{
                    background: 'linear-gradient(135deg, rgba(107, 207, 127, 0.15), rgba(76, 175, 80, 0.1))',
                    padding: '2rem',
                    borderRadius: '20px',
                    border: '3px solid #6BCF7F',
                    marginBottom: '2rem',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
                }}>
                    <h3 style={{
                        fontSize: '1.5rem',
                        color: '#4CAF50',
                        marginBottom: '1.5rem',
                        textAlign: 'center',
                        fontWeight: 'bold'
                    }}>➕ הוסף מפתח API חדש</h3>
                    <form onSubmit={handleAddAPIKey}>
                        <div style={{marginBottom: '1.5rem'}}>
                            <label style={{
                                display: 'block',
                                fontSize: '1.1rem',
                                color: '#333',
                                marginBottom: '0.5rem',
                                fontWeight: 'bold',
                                textAlign: 'right'
                            }}>🔑 מפתח API:</label>
                            <input
                                type="text"
                                value={newAPIKey}
                                onChange={(e) => setNewAPIKey(e.target.value)}
                                placeholder="הדבק כאן את מפתח Google Generative AI API"
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    fontSize: '1rem',
                                    borderRadius: '12px',
                                    border: '2px solid #6BCF7F',
                                    background: 'white',
                                    textAlign: 'left',
                                    fontFamily: 'monospace'
                                }}
                            />
                        </div>
                        <div style={{marginBottom: '1.5rem'}}>
                            <label style={{
                                display: 'block',
                                fontSize: '1.1rem',
                                color: '#333',
                                marginBottom: '0.5rem',
                                fontWeight: 'bold',
                                textAlign: 'right'
                            }}>📝 הערות (אופציונלי):</label>
                            <input
                                type="text"
                                value={newAPIKeyNotes}
                                onChange={(e) => setNewAPIKeyNotes(e.target.value)}
                                placeholder="לדוגמה: מפתח מ-Project X"
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    fontSize: '1rem',
                                    borderRadius: '12px',
                                    border: '2px solid #6BCF7F',
                                    background: 'white',
                                    textAlign: 'right'
                                }}
                            />
                        </div>
                        <button
                            type="submit"
                            style={{
                                width: '100%',
                                padding: '1rem',
                                fontSize: '1.2rem',
                                fontWeight: 'bold',
                                background: 'linear-gradient(135deg, #6BCF7F, #4CAF50)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            ✅ הוסף מפתח
                        </button>
                    </form>
                </div>
            )}

            {/* API Keys List */}
            <div style={{
                background: 'white',
                borderRadius: '20px',
                border: '3px solid #FFD93D',
                overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
            }}>
                <div style={{
                    background: 'linear-gradient(135deg, #FFD93D, #FFA07A)',
                    padding: '1.5rem',
                    textAlign: 'center'
                }}>
                    <h2 style={{
                        fontSize: '1.8rem',
                        color: 'white',
                        margin: 0,
                        fontWeight: 'bold'
                    }}>📋 רשימת מפתחות API</h2>
                </div>

                {apiKeys.length === 0 ? (
                    <div style={{
                        padding: '3rem',
                        textAlign: 'center',
                        color: '#999',
                        fontSize: '1.2rem'
                    }}>
                        <div style={{fontSize: '4rem', marginBottom: '1rem'}}>🔑</div>
                        <p>אין עדיין מפתחות API במערכת</p>
                        <p style={{fontSize: '1rem'}}>לחץ על "הוסף מפתח API חדש" כדי להתחיל</p>
                    </div>
                ) : (
                    <div style={{padding: '1rem'}}>
                        {apiKeys.map((key) => (
                            <div key={key.id} style={{
                                background: key.is_active ? 'rgba(107, 207, 127, 0.08)' : 'rgba(200, 200, 200, 0.1)',
                                padding: '1.5rem',
                                marginBottom: '1rem',
                                borderRadius: '16px',
                                border: `2px solid ${key.is_active ? '#6BCF7F' : '#999'}`,
                                position: 'relative'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    flexWrap: 'wrap',
                                    gap: '1rem'
                                }}>
                                    <div style={{flex: 1, minWidth: '200px'}}>
                                        <div style={{
                                            fontSize: '0.9rem',
                                            color: '#666',
                                            marginBottom: '0.5rem'
                                        }}>
                                            🔑 מפתח API:
                                        </div>
                                        <div style={{
                                            fontFamily: 'monospace',
                                            background: '#f5f5f5',
                                            padding: '0.75rem',
                                            borderRadius: '8px',
                                            wordBreak: 'break-all',
                                            fontSize: '0.85rem',
                                            color: '#333'
                                        }}>
                                            {key.api_key.substring(0, 20)}...{key.api_key.substring(key.api_key.length - 10)}
                                        </div>

                                        <div style={{
                                            marginTop: '1rem',
                                            display: 'flex',
                                            gap: '1rem',
                                            flexWrap: 'wrap',
                                            fontSize: '0.9rem'
                                        }}>
                                            <div>
                                                <strong>סטטוס:</strong>{' '}
                                                {key.is_assigned ? (
                                                    <span style={{color: '#FF6B9D', fontWeight: 'bold'}}>
                                                        ✅ מוקצה ל-{key.assigned_user_email || 'משתמש'}
                                                    </span>
                                                ) : (
                                                    <span style={{color: '#6BCF7F', fontWeight: 'bold'}}>
                                                        🆓 זמין
                                                    </span>
                                                )}
                                            </div>
                                            {key.notes && (
                                                <div>
                                                    <strong>הערות:</strong> {key.notes}
                                                </div>
                                            )}
                                        </div>

                                        <div style={{
                                            marginTop: '0.5rem',
                                            fontSize: '0.85rem',
                                            color: '#999'
                                        }}>
                                            נוצר: {new Date(key.created_at).toLocaleDateString('he-IL')}
                                            {key.assigned_at && ` | הוקצה: ${new Date(key.assigned_at).toLocaleDateString('he-IL')}`}
                                        </div>
                                    </div>

                                    <div style={{
                                        display: 'flex',
                                        gap: '0.5rem',
                                        flexDirection: 'column'
                                    }}>
                                        <button
                                            onClick={() => handleToggleActive(key.id, key.is_active)}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                fontSize: '0.9rem',
                                                fontWeight: 'bold',
                                                background: key.is_active ? '#FFA07A' : '#6BCF7F',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease'
                                            }}
                                        >
                                            {key.is_active ? '❌ השבת' : '✅ הפעל'}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteKey(key.id)}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                fontSize: '0.9rem',
                                                fontWeight: 'bold',
                                                background: '#f44336',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease'
                                            }}
                                        >
                                            🗑️ מחק
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div style={{
                marginTop: '2rem',
                padding: '1.5rem',
                background: 'rgba(160, 132, 232, 0.1)',
                borderRadius: '16px',
                border: '2px solid #A084E8',
                textAlign: 'right'
            }}>
                <h3 style={{
                    fontSize: '1.3rem',
                    color: '#A084E8',
                    marginBottom: '1rem',
                    fontWeight: 'bold'
                }}>ℹ️ איך זה עובד?</h3>
                <ul style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    color: '#666',
                    lineHeight: 1.8
                }}>
                    <li style={{marginBottom: '0.75rem'}}>
                        ✅ <strong>הוספת מפתחות:</strong> הוסף מפתחות Google Generative AI API למאגר
                    </li>
                    <li style={{marginBottom: '0.75rem'}}>
                        🤖 <strong>הקצאה אוטומטית:</strong> כשמשתמש חדש נרשם, המערכת מקצה לו מפתח זמין אוטומטית
                    </li>
                    <li style={{marginBottom: '0.75rem'}}>
                        🔄 <strong>ניהול:</strong> אפשר להשבית או למחוק מפתחות בכל עת
                    </li>
                    <li style={{marginBottom: '0.75rem'}}>
                        📊 <strong>מעקב:</strong> ראה איזה מפתחות מוקצים ולמי
                    </li>
                    <li>
                        ⚠️ <strong>חשוב:</strong> ודא שיש תמיד מפתחות זמינים למשתמשים חדשים
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default APIKeysManager;
