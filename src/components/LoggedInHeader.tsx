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
                        gap: 'clamp(0.5rem, 2vw, 0.75rem)',
                        padding: 'clamp(0.4rem, 1.5vw, 0.5rem) clamp(0.75rem, 2.5vw, 1rem)',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, rgba(127, 217, 87, 0.08), rgba(86, 217, 137, 0.04))',
                        border: '1px solid rgba(127, 217, 87, 0.15)',
                        transition: 'all 0.3s ease'
                    }}>
                        <img src="/logo.png" alt="לוגו גאון" className="logo-image" style={{
                            filter: 'drop-shadow(0 2px 4px rgba(127, 217, 87, 0.2))',
                            transition: 'transform 0.3s ease',
                            width: 'clamp(28px, 6vw, 36px)',
                            height: 'clamp(28px, 6vw, 36px)'
                        }} />
                        <span className="logo-text" style={{
                            background: 'linear-gradient(135deg, var(--primary-light), var(--secondary-color))',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            fontWeight: 800,
                            fontSize: 'clamp(1.1rem, 3vw, 1.3rem)',
                            letterSpacing: '-0.3px'
                        }}>גאון</span>
                    </div>
                    <nav className="header-nav" style={{
                        display: 'flex',
                        gap: 'clamp(0.3rem, 1.5vw, 0.5rem)',
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
                                    gap: 'clamp(0.35rem, 1.5vw, 0.5rem)',
                                    padding: 'clamp(0.5rem, 2vw, 0.65rem) clamp(0.75rem, 3vw, 1rem)',
                                    borderRadius: '10px',
                                    border: currentView === item.view
                                        ? '1.5px solid var(--primary-color)'
                                        : '1.5px solid transparent',
                                    background: currentView === item.view
                                        ? 'linear-gradient(135deg, rgba(127, 217, 87, 0.15), rgba(86, 217, 137, 0.1))'
                                        : 'rgba(255, 255, 255, 0.02)',
                                    color: currentView === item.view ? 'var(--primary-light)' : 'var(--text-light)',
                                    fontSize: 'clamp(0.8rem, 2.2vw, 0.9rem)',
                                    fontWeight: currentView === item.view ? 600 : 500,
                                    cursor: 'pointer',
                                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                    backdropFilter: 'blur(8px)',
                                    boxShadow: currentView === item.view
                                        ? '0 2px 8px rgba(127, 217, 87, 0.2)'
                                        : 'none',
                                    transform: currentView === item.view ? 'translateY(-1px)' : 'translateY(0)',
                                    overflow: 'hidden'
                                }}
                                onMouseEnter={(e) => {
                                    if (currentView !== item.view) {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (currentView !== item.view) {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }
                                }}
                            >
                                <span className="icon" style={{
                                    fontSize: 'clamp(1rem, 2.5vw, 1.1rem)',
                                    filter: currentView === item.view ? 'drop-shadow(0 1px 2px rgba(127, 217, 87, 0.4))' : 'none',
                                    transition: 'all 0.25s ease'
                                }}>{item.icon}</span>
                                <span className="button-text" style={{
                                    position: 'relative',
                                    zIndex: 1,
                                    display: window.innerWidth < 768 ? 'none' : 'inline'
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
                            gap: 'clamp(0.5rem, 2vw, 0.65rem)',
                            padding: 'clamp(0.4rem, 1.5vw, 0.5rem) clamp(0.75rem, 2.5vw, 1rem)',
                            borderRadius: '10px',
                            background: isDropdownOpen
                                ? 'linear-gradient(135deg, rgba(127, 217, 87, 0.15), rgba(86, 217, 137, 0.1))'
                                : 'rgba(255, 255, 255, 0.03)',
                            border: '1.5px solid ' + (isDropdownOpen ? 'var(--primary-color)' : 'rgba(255, 255, 255, 0.08)'),
                            cursor: 'pointer',
                            transition: 'all 0.25s ease',
                            boxShadow: isDropdownOpen ? '0 2px 8px rgba(127, 217, 87, 0.2)' : 'none'
                        }}
                    >
                        {activeProfile ? (
                            <img
                                src={activeProfile.photo_url || activeProfile.photo || `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${activeProfile.name}`}
                                alt={activeProfile.name}
                                className="user-menu-avatar"
                                style={{
                                    width: 'clamp(30px, 7vw, 36px)',
                                    height: 'clamp(30px, 7vw, 36px)',
                                    borderRadius: '50%',
                                    border: '2px solid var(--primary-color)',
                                    boxShadow: '0 0 0 2px rgba(127, 217, 87, 0.15)',
                                    objectFit: 'cover'
                                }}
                            />
                        ) : (
                            <div className="user-menu-avatar placeholder" style={{
                                width: 'clamp(30px, 7vw, 36px)',
                                height: 'clamp(30px, 7vw, 36px)',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: 'clamp(1rem, 2.5vw, 1.15rem)'
                            }}>?</div>
                        )}
                        <span className="user-menu-name" style={{
                            color: 'var(--text-primary)',
                            fontWeight: 600,
                            fontSize: 'clamp(0.85rem, 2.2vw, 0.95rem)',
                            display: window.innerWidth < 480 ? 'none' : 'inline'
                        }}>{activeProfile ? activeProfile.name : "בחר פרופיל"}</span>
                        <span className={`chevron ${isDropdownOpen ? 'open' : ''}`} style={{
                            color: 'var(--primary-light)',
                            fontSize: 'clamp(0.65rem, 1.8vw, 0.75rem)',
                            transition: 'transform 0.25s ease',
                            transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0)'
                        }}>▼</span>
                    </button>

                    <div
                        className={`user-menu-dropdown ${isDropdownOpen ? 'open' : ''}`}
                        style={{
                            position: 'absolute',
                            top: 'calc(100% + 0.5rem)',
                            left: 0,
                            minWidth: 'clamp(260px, 80vw, 300px)',
                            background: 'linear-gradient(145deg, rgba(26, 46, 26, 0.98), rgba(36, 60, 36, 0.95))',
                            backdropFilter: 'blur(15px)',
                            borderRadius: '12px',
                            border: '1.5px solid rgba(127, 217, 87, 0.25)',
                            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
                            opacity: isDropdownOpen ? 1 : 0,
                            visibility: isDropdownOpen ? 'visible' : 'hidden',
                            transform: isDropdownOpen ? 'translateY(0) scale(1)' : 'translateY(-8px) scale(0.96)',
                            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                            overflow: 'hidden',
                            zIndex: 10000
                        }}
                    >
                        {/* Gradient glow effect */}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '2px',
                            background: 'linear-gradient(90deg, var(--primary-color), var(--secondary-color), var(--accent-color))',
                            backgroundSize: '200% 100%',
                            animation: 'gradientFlow 3s ease infinite'
                        }} />

                        <div className="dropdown-header" style={{
                            padding: 'clamp(1rem, 3vw, 1.25rem)',
                            borderBottom: '1px solid rgba(127, 217, 87, 0.15)',
                            background: 'linear-gradient(135deg, rgba(127, 217, 87, 0.08), rgba(86, 217, 137, 0.04))'
                        }}>
                            <span style={{
                                display: 'block',
                                color: 'var(--text-light)',
                                fontSize: 'clamp(0.8rem, 2.2vw, 0.85rem)',
                                marginBottom: 'clamp(0.4rem, 1.5vw, 0.5rem)'
                            }}>שלום, <strong style={{
                                color: 'var(--primary-light)',
                                fontSize: 'clamp(0.95rem, 2.5vw, 1rem)'
                            }}>{user.username}</strong></span>
                            <div className="dropdown-credits" style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'clamp(0.4rem, 1.5vw, 0.5rem)',
                                padding: 'clamp(0.6rem, 2vw, 0.75rem) clamp(0.85rem, 2.5vw, 1rem)',
                                background: 'linear-gradient(135deg, rgba(127, 217, 87, 0.15), rgba(86, 217, 137, 0.1))',
                                borderRadius: '10px',
                                border: '1px solid rgba(127, 217, 87, 0.25)',
                                marginTop: 'clamp(0.5rem, 2vw, 0.65rem)'
                            }}>
                                <span style={{
                                    fontSize: 'clamp(1.05rem, 2.8vw, 1.15rem)',
                                    filter: 'drop-shadow(0 1px 2px rgba(255, 215, 0, 0.4))'
                                }}>💎</span>
                                <span style={{
                                    color: 'var(--text-primary)',
                                    fontWeight: 600,
                                    fontSize: 'clamp(0.85rem, 2.2vw, 0.9rem)'
                                }}>קרדיטים: <AnimatedCounter endValue={user.credits} /></span>
                            </div>
                        </div>

                        <div className="profile-list-header" style={{
                            padding: 'clamp(0.75rem, 2.5vw, 1rem) clamp(1rem, 3vw, 1.25rem) clamp(0.4rem, 1.5vw, 0.5rem)',
                            color: 'var(--primary-light)',
                            fontSize: 'clamp(0.75rem, 2vw, 0.8rem)',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.3px'
                        }}>החלף פרופיל</div>

                        <ul className="profile-list" style={{
                            listStyle: 'none',
                            padding: 'clamp(0.4rem, 1.5vw, 0.5rem)',
                            margin: 0,
                            maxHeight: 'clamp(220px, 60vw, 280px)',
                            overflowY: 'auto'
                        }}>
                            {user.profiles.map(p => (
                                <li key={p.id} className={activeProfile?.id === p.id ? 'active' : ''} style={{
                                    margin: 'clamp(0.15rem, 1vw, 0.2rem) 0'
                                }}>
                                    <button
                                        onClick={() => handleProfileSelect(p)}
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'clamp(0.6rem, 2vw, 0.75rem)',
                                            padding: 'clamp(0.6rem, 2vw, 0.75rem) clamp(0.75rem, 2.5vw, 1rem)',
                                            background: activeProfile?.id === p.id
                                                ? 'linear-gradient(135deg, rgba(127, 217, 87, 0.15), rgba(86, 217, 137, 0.1))'
                                                : 'transparent',
                                            border: activeProfile?.id === p.id
                                                ? '1.5px solid var(--primary-color)'
                                                : '1.5px solid transparent',
                                            borderRadius: '10px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            color: 'var(--text-primary)',
                                            fontSize: 'clamp(0.85rem, 2.2vw, 0.9rem)'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (activeProfile?.id !== p.id) {
                                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
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
                                                width: 'clamp(28px, 7vw, 32px)',
                                                height: 'clamp(28px, 7vw, 32px)',
                                                borderRadius: '50%',
                                                border: '1.5px solid ' + (activeProfile?.id === p.id ? 'var(--primary-color)' : 'rgba(255, 255, 255, 0.15)'),
                                                objectFit: 'cover'
                                            }}
                                        />
                                        <span style={{ flex: 1, textAlign: 'right' }}>{p.name}</span>
                                        {activeProfile?.id === p.id && (
                                            <span className="active-check" style={{
                                                color: 'var(--primary-light)',
                                                fontSize: 'clamp(1.05rem, 2.8vw, 1.15rem)',
                                                filter: 'drop-shadow(0 1px 2px rgba(127, 217, 87, 0.4))'
                                            }}>✔</span>
                                        )}
                                    </button>
                                </li>
                            ))}
                            {user.profiles.length === 0 && (
                                <li className="no-profiles" style={{
                                    padding: 'clamp(0.85rem, 2.5vw, 1rem)',
                                    textAlign: 'center',
                                    color: 'var(--text-light)',
                                    fontSize: 'clamp(0.8rem, 2.2vw, 0.85rem)'
                                }}>עדיין אין פרופילים.</li>
                            )}
                            <li style={{ marginTop: 'clamp(0.4rem, 1.5vw, 0.5rem)' }}>
                                <button
                                    className="manage-profiles-btn"
                                    onClick={() => { setCurrentView('parent'); setIsDropdownOpen(false); }}
                                    style={{
                                        width: '100%',
                                        padding: 'clamp(0.7rem, 2.2vw, 0.85rem) clamp(0.85rem, 2.5vw, 1rem)',
                                        background: 'linear-gradient(135deg, var(--secondary-color), var(--accent-color))',
                                        border: 'none',
                                        borderRadius: '10px',
                                        color: 'white',
                                        fontSize: 'clamp(0.85rem, 2.2vw, 0.9rem)',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        boxShadow: '0 2px 8px rgba(160, 132, 232, 0.25)'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(160, 132, 232, 0.35)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(160, 132, 232, 0.25)';
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
                                padding: 'clamp(0.85rem, 2.5vw, 1rem) clamp(1rem, 3vw, 1.25rem)',
                                background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.08), rgba(211, 47, 47, 0.04))',
                                border: 'none',
                                borderTop: '1px solid rgba(244, 67, 54, 0.15)',
                                color: '#ff6b6b',
                                fontSize: 'clamp(0.85rem, 2.2vw, 0.9rem)',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(244, 67, 54, 0.15), rgba(211, 47, 47, 0.08))';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(244, 67, 54, 0.08), rgba(211, 47, 47, 0.04))';
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
