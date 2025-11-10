import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAppContext } from './AppContext';
import { styles } from '../../styles';

// --- AnimatedCounter Component (moved from deleted Sidebar.tsx) ---
const AnimatedCounter = ({ endValue }: { endValue: number }) => {
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const node = ref.current;
        if (!node) return;

        const startValue = parseInt(node.textContent?.replace(/,/g, '') || '0', 10);
        if (startValue === endValue) {
            node.textContent = String(endValue.toLocaleString());
            return;
        }

        let animationFrameId: number;
        const duration = 1500;
        let startTimestamp: number | null = null;

        const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const currentValue = Math.floor(progress * (endValue - startValue) + startValue);
            node.textContent = String(currentValue.toLocaleString());
            if (progress < 1) {
                animationFrameId = requestAnimationFrame(step);
            } else {
                 node.textContent = String(endValue.toLocaleString());
            }
        };

        animationFrameId = requestAnimationFrame(step);

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [endValue]);

    return <span ref={ref}>{endValue.toLocaleString()}</span>;
};


interface LoggedInHeaderProps {
    navItems: any[];
    currentView: string;
    setCurrentView: (view: string) => void;
    onLogout: () => void;
}

const LoggedInHeader = ({ navItems, currentView, setCurrentView, onLogout }: LoggedInHeaderProps) => {
    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            // onLogout callback is also called for any additional cleanup
            onLogout();
        } catch (error) {
            console.error('🔴 LoggedInHeader: Logout failed:', error);
            alert('שגיאה ביציאה מהמערכת. אנא נסה שוב.');
        }
    };
    const { user, activeProfile, setActiveProfile } = useAppContext();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!user) return null;

    const handleProfileSelect = (profile: any) => {
        setActiveProfile(profile);
        setIsDropdownOpen(false);
    };

    return (
        <>
            <header className="logged-in-header no-print" style={{
                background: 'linear-gradient(135deg, rgba(26, 46, 26, 0.98), rgba(36, 60, 36, 0.95))',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 1px 0 rgba(127, 217, 87, 0.2)',
                borderBottom: '1px solid rgba(127, 217, 87, 0.2)',
                position: 'sticky',
                top: 0,
                zIndex: 1000
            }}>
                {/* Animated gradient line at top */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: 'linear-gradient(90deg, transparent, var(--primary-color), var(--secondary-color), var(--accent-color), transparent)',
                    backgroundSize: '200% 100%',
                    animation: 'gradientFlow 3s ease infinite'
                }} />

                <div className="header-left">
                    <div className="logo-container" style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.5rem 1rem',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, rgba(127, 217, 87, 0.1), rgba(86, 217, 137, 0.05))',
                        border: '1px solid rgba(127, 217, 87, 0.2)',
                        transition: 'all 0.3s ease'
                    }}>
                        <img src="/logo.png" alt="לוגו גאון" className="logo-image" style={{
                            filter: 'drop-shadow(0 4px 8px rgba(127, 217, 87, 0.3))',
                            transition: 'transform 0.3s ease'
                        }} />
                        <span className="logo-text" style={{
                            background: 'linear-gradient(135deg, var(--primary-light), var(--secondary-color))',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            fontWeight: 900,
                            fontSize: '1.5rem',
                            letterSpacing: '-0.5px'
                        }}>גאון</span>
                    </div>
                    <nav className="header-nav" style={{
                        display: 'flex',
                        gap: '0.5rem',
                        alignItems: 'center'
                    }}>
                        {navItems.map((item, index) => (
                            <button
                                key={item.view}
                                onClick={() => setCurrentView(item.view)}
                                className={`header-nav-button ${currentView === item.view ? 'active' : ''}`}
                                title={item.label}
                                style={{
                                    position: 'relative',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.75rem 1.25rem',
                                    borderRadius: '12px',
                                    border: currentView === item.view
                                        ? '2px solid var(--primary-color)'
                                        : '2px solid transparent',
                                    background: currentView === item.view
                                        ? 'linear-gradient(135deg, rgba(127, 217, 87, 0.2), rgba(86, 217, 137, 0.15))'
                                        : 'rgba(255, 255, 255, 0.03)',
                                    color: currentView === item.view ? 'var(--primary-light)' : 'var(--text-light)',
                                    fontSize: '1rem',
                                    fontWeight: currentView === item.view ? 700 : 500,
                                    cursor: 'pointer',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    backdropFilter: 'blur(10px)',
                                    boxShadow: currentView === item.view
                                        ? '0 4px 16px rgba(127, 217, 87, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                                        : 'none',
                                    transform: currentView === item.view ? 'translateY(-2px)' : 'translateY(0)',
                                    overflow: 'hidden'
                                }}
                                onMouseEnter={(e) => {
                                    if (currentView !== item.view) {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (currentView !== item.view) {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }
                                }}
                            >
                                {currentView === item.view && (
                                    <div style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background: 'linear-gradient(135deg, transparent, rgba(127, 217, 87, 0.1), transparent)',
                                        backgroundSize: '200% 100%',
                                        animation: 'shimmer 2s ease-in-out infinite',
                                        pointerEvents: 'none'
                                    }} />
                                )}
                                <span className="icon" style={{
                                    fontSize: '1.25rem',
                                    filter: currentView === item.view ? 'drop-shadow(0 2px 4px rgba(127, 217, 87, 0.5))' : 'none',
                                    transition: 'all 0.3s ease'
                                }}>{item.icon}</span>
                                <span className="button-text" style={{
                                    position: 'relative',
                                    zIndex: 1
                                }}>{item.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="user-menu" ref={dropdownRef} style={{ position: 'relative' }}>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="user-menu-trigger"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.5rem 1rem',
                            borderRadius: '12px',
                            background: isDropdownOpen
                                ? 'linear-gradient(135deg, rgba(127, 217, 87, 0.2), rgba(86, 217, 137, 0.15))'
                                : 'rgba(255, 255, 255, 0.05)',
                            border: '2px solid ' + (isDropdownOpen ? 'var(--primary-color)' : 'rgba(255, 255, 255, 0.1)'),
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: isDropdownOpen ? '0 4px 16px rgba(127, 217, 87, 0.3)' : 'none'
                        }}
                    >
                        {activeProfile ? (
                            <img
                                src={activeProfile.photo_url || activeProfile.photo || `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${activeProfile.name}`}
                                alt={activeProfile.name}
                                className="user-menu-avatar"
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    border: '2px solid var(--primary-color)',
                                    boxShadow: '0 0 0 3px rgba(127, 217, 87, 0.2)',
                                    objectFit: 'cover'
                                }}
                            />
                        ) : (
                            <div className="user-menu-avatar placeholder" style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '1.25rem'
                            }}>?</div>
                        )}
                        <span className="user-menu-name" style={{
                            color: 'var(--text-primary)',
                            fontWeight: 600,
                            fontSize: '1rem'
                        }}>{activeProfile ? activeProfile.name : "בחר פרופיל"}</span>
                        <span className={`chevron ${isDropdownOpen ? 'open' : ''}`} style={{
                            color: 'var(--primary-light)',
                            fontSize: '0.75rem',
                            transition: 'transform 0.3s ease',
                            transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0)'
                        }}>▼</span>
                    </button>

                    <div
                        className={`user-menu-dropdown ${isDropdownOpen ? 'open' : ''}`}
                        style={{
                            position: 'absolute',
                            top: 'calc(100% + 0.75rem)',
                            left: 0,
                            minWidth: '320px',
                            background: 'linear-gradient(145deg, rgba(26, 46, 26, 0.98), rgba(36, 60, 36, 0.95))',
                            backdropFilter: 'blur(20px)',
                            borderRadius: '16px',
                            border: '2px solid rgba(127, 217, 87, 0.3)',
                            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(127, 217, 87, 0.2)',
                            opacity: isDropdownOpen ? 1 : 0,
                            visibility: isDropdownOpen ? 'visible' : 'hidden',
                            transform: isDropdownOpen ? 'translateY(0) scale(1)' : 'translateY(-10px) scale(0.95)',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            overflow: 'hidden',
                            zIndex: 1000
                        }}
                    >
                        {/* Gradient glow effect */}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '3px',
                            background: 'linear-gradient(90deg, var(--primary-color), var(--secondary-color), var(--accent-color))',
                            backgroundSize: '200% 100%',
                            animation: 'gradientFlow 3s ease infinite'
                        }} />

                        <div className="dropdown-header" style={{
                            padding: '1.5rem',
                            borderBottom: '1px solid rgba(127, 217, 87, 0.2)',
                            background: 'linear-gradient(135deg, rgba(127, 217, 87, 0.1), rgba(86, 217, 137, 0.05))'
                        }}>
                            <span style={{
                                display: 'block',
                                color: 'var(--text-light)',
                                fontSize: '0.9rem',
                                marginBottom: '0.5rem'
                            }}>שלום, <strong style={{
                                color: 'var(--primary-light)',
                                fontSize: '1.1rem'
                            }}>{user.username}</strong></span>
                            <div className="dropdown-credits" style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.75rem 1rem',
                                background: 'linear-gradient(135deg, rgba(127, 217, 87, 0.2), rgba(86, 217, 137, 0.15))',
                                borderRadius: '12px',
                                border: '1px solid rgba(127, 217, 87, 0.3)',
                                marginTop: '0.75rem'
                            }}>
                                <span style={{
                                    fontSize: '1.25rem',
                                    filter: 'drop-shadow(0 2px 4px rgba(255, 215, 0, 0.5))'
                                }}>💎</span>
                                <span style={{
                                    color: 'var(--text-primary)',
                                    fontWeight: 600,
                                    fontSize: '1rem'
                                }}>קרדיטים: <AnimatedCounter endValue={user.credits} /></span>
                            </div>
                        </div>

                        <div className="profile-list-header" style={{
                            padding: '1rem 1.5rem 0.5rem',
                            color: 'var(--primary-light)',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                        }}>החלף פרופיל</div>

                        <ul className="profile-list" style={{
                            listStyle: 'none',
                            padding: '0.5rem',
                            margin: 0,
                            maxHeight: '300px',
                            overflowY: 'auto'
                        }}>
                            {user.profiles.map(p => (
                                <li key={p.id} className={activeProfile?.id === p.id ? 'active' : ''} style={{
                                    margin: '0.25rem 0'
                                }}>
                                    <button
                                        onClick={() => handleProfileSelect(p)}
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                            padding: '0.75rem 1rem',
                                            background: activeProfile?.id === p.id
                                                ? 'linear-gradient(135deg, rgba(127, 217, 87, 0.2), rgba(86, 217, 137, 0.15))'
                                                : 'transparent',
                                            border: activeProfile?.id === p.id
                                                ? '2px solid var(--primary-color)'
                                                : '2px solid transparent',
                                            borderRadius: '12px',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            color: 'var(--text-primary)',
                                            fontSize: '1rem'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (activeProfile?.id !== p.id) {
                                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (activeProfile?.id !== p.id) {
                                                e.currentTarget.style.background = 'transparent';
                                            }
                                        }}
                                    >
                                        <img
                                            src={p.photo_url || p.photo || `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${p.name}`}
                                            alt={p.name}
                                            style={{
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '50%',
                                                border: '2px solid ' + (activeProfile?.id === p.id ? 'var(--primary-color)' : 'rgba(255, 255, 255, 0.2)'),
                                                objectFit: 'cover'
                                            }}
                                        />
                                        <span style={{ flex: 1, textAlign: 'right' }}>{p.name}</span>
                                        {activeProfile?.id === p.id && (
                                            <span className="active-check" style={{
                                                color: 'var(--primary-light)',
                                                fontSize: '1.25rem',
                                                filter: 'drop-shadow(0 2px 4px rgba(127, 217, 87, 0.5))'
                                            }}>✔</span>
                                        )}
                                    </button>
                                </li>
                            ))}
                            {user.profiles.length === 0 && (
                                <li className="no-profiles" style={{
                                    padding: '1rem',
                                    textAlign: 'center',
                                    color: 'var(--text-light)',
                                    fontSize: '0.9rem'
                                }}>עדיין אין פרופילים.</li>
                            )}
                            <li style={{ marginTop: '0.5rem' }}>
                                <button
                                    className="manage-profiles-btn"
                                    onClick={() => { setCurrentView('parent'); setIsDropdownOpen(false); }}
                                    style={{
                                        width: '100%',
                                        padding: '0.875rem 1rem',
                                        background: 'linear-gradient(135deg, var(--secondary-color), var(--accent-color))',
                                        border: 'none',
                                        borderRadius: '12px',
                                        color: 'white',
                                        fontSize: '1rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        boxShadow: '0 4px 12px rgba(160, 132, 232, 0.3)'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(160, 132, 232, 0.5)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(160, 132, 232, 0.3)';
                                    }}
                                >
                                    ＋ ניהול פרופילים
                                </button>
                            </li>
                        </ul>

                        <button
                            onClick={handleLogout}
                            className="logout-button"
                            style={{
                                width: '100%',
                                padding: '1rem 1.5rem',
                                background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.1), rgba(211, 47, 47, 0.05))',
                                border: 'none',
                                borderTop: '1px solid rgba(244, 67, 54, 0.2)',
                                color: '#ff6b6b',
                                fontSize: '1rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(244, 67, 54, 0.2), rgba(211, 47, 47, 0.1))';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(244, 67, 54, 0.1), rgba(211, 47, 47, 0.05))';
                            }}
                        >
                            התנתקות
                        </button>
                    </div>
                </div>
            </header>

            {/* Global animations */}
            <style>{`
                @keyframes gradientFlow {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }

                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
            `}</style>
        </>
    );
};

export default LoggedInHeader;
