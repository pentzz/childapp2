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
        <header className="logged-in-header no-print">
            <div className="header-left">
                <div className="logo-container">
                    <img src="/logo.png" alt="לוגו גאון" className="logo-image" />
                    <span className="logo-text">גאון</span>
                </div>
                <nav className="header-nav">
                    {navItems.map(item => (
                        <button
                            key={item.view}
                            onClick={() => setCurrentView(item.view)}
                            className={`header-nav-button ${currentView === item.view ? 'active' : ''}`}
                        >
                            <span className="icon">{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="user-menu" ref={dropdownRef}>
                <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="user-menu-trigger">
                    {activeProfile ? (
                        <img src={activeProfile.photo_url || activeProfile.photo || `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${activeProfile.name}`} alt={activeProfile.name} className="user-menu-avatar" />
                    ) : (
                         <div className="user-menu-avatar placeholder">?</div>
                    )}
                    <span className="user-menu-name">{activeProfile ? activeProfile.name : "בחר פרופיל"}</span>
                    <span className={`chevron ${isDropdownOpen ? 'open' : ''}`}>▼</span>
                </button>

                <div className={`user-menu-dropdown ${isDropdownOpen ? 'open' : ''}`}>
                    <div className="dropdown-header">
                        <span>שלום, <strong>{user.username}</strong></span>
                        <div className="dropdown-credits">
                            <span>💎</span> קרדיטים: <AnimatedCounter endValue={user.credits} />
                        </div>
                    </div>
                    <div className="profile-list-header">החלף פרופיל</div>
                    <ul className="profile-list">
                        {user.profiles.map(p => (
                            <li key={p.id} className={activeProfile?.id === p.id ? 'active' : ''}>
                                <button onClick={() => handleProfileSelect(p)}>
                                    <img src={p.photo_url || p.photo || `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${p.name}`} alt={p.name} />
                                    <span>{p.name}</span>
                                    {activeProfile?.id === p.id && <span className="active-check">✔</span>}
                                </button>
                            </li>
                        ))}
                        {user.profiles.length === 0 && <li className="no-profiles">עדיין אין פרופילים.</li>}
                         <li>
                            <button className="manage-profiles-btn" onClick={() => { setCurrentView('parent'); setIsDropdownOpen(false); }}>
                                ＋ ניהול פרופילים
                            </button>
                        </li>
                    </ul>
                    <button onClick={handleLogout} className="logout-button">
                        התנתקות
                    </button>
                </div>
            </div>
        </header>
    );
};

export default LoggedInHeader;
