import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { supabase } from '../supabaseClient';
import { AppProvider, useAppContext } from './AppContext';
import LandingPage from './LandingPage';
import LoggedInHeader from './LoggedInHeader';
import ChildDashboard from './ChildDashboard';
import ParentDashboard from './ParentDashboard';
import AdminDashboard from './AdminDashboard';
import StoryCreator from './StoryCreator';
import LearningCenter from './WorkbookCreator';
import UserProfile from './UserProfile';
import Footer from './Footer';
import Loader from './Loader';
import { styles } from '../../styles';
import '../../App.css';


// --- NEW COMPONENT: Mobile Nav ---
const MobileNavMenu = ({ navItems, currentView, setCurrentView, onLogout, onClose }: any) => {
    const animatedBackground = useMemo(() => {
        const chars = 'אבגדהוזחטיכלמנסעפצקרשת1234567890'.split('');
        return Array.from({ length: 30 }).map((_, i) => {
            const style = {
                left: `${Math.random() * 100}%`,
                fontSize: `${Math.random() * 2 + 1}rem`,
                animationDuration: `${Math.random() * 15 + 10}s`,
                animationDelay: `${Math.random() * 10}s`,
                opacity: Math.random() * 0.2 + 0.05,
                color: 'var(--primary-color)',
            };
            const char = chars[Math.floor(Math.random() * chars.length)];
            return <span key={i} className="floating-word" style={style}>{char}</span>;
        });
    }, []);

    return (
        <div className="mobile-nav-overlay" onClick={onClose}>
            <div className="floating-words-bg">{animatedBackground}</div>
            <nav className="sidebar-nav">
                {navItems.map((item: any, index: number) => (
                    <button
                        key={item.view}
                        onClick={() => {
                            setCurrentView(item.view);
                            onClose();
                        }}
                        className={`sidebar-nav-card ${currentView === item.view ? 'active' : ''}`}
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                         <div className="icon">{item.icon}</div>
                         <div className="nav-text">
                            <h4>{item.label}</h4>
                         </div>
                    </button>
                ))}
            </nav>
        </div>
    );
};

const MobileHeader = ({ onMenuClick, isMenuOpen, viewLabel }: any) => (
    <header className="mobile-header no-print">
        <div className="logo-container">
            <img src="/logo.png" alt="לוגו גאון" className="logo-image" />
            <span className="logo-text">{viewLabel}</span>
        </div>
        <button className={`hamburger-button ${isMenuOpen ? 'is-active' : ''}`} onClick={onMenuClick}>
            <span className="line"></span>
            <span className="line"></span>
            <span className="line"></span>
        </button>
    </header>
);

// Admin Dashboard Wrapper - NOW SIMPLIFIED (All data from AppContext)
const AdminDashboardWrapper = () => {
    const { user } = useAppContext();

    if (!user) return null;

    return <AdminDashboard loggedInUser={user} />;
};

const LoggedInView = () => {
    const { user, isLoading } = useAppContext();
    const [currentView, setCurrentView] = useState('child');
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const [selectedContentId, setSelectedContentId] = useState<number | null>(null);
    const [selectedContentType, setSelectedContentType] = useState<'story' | 'workbook' | 'learning_plan' | null>(null);

    console.log('🔵 LoggedInView: Rendering with state:', {
        hasUser: !!user,
        isLoading,
        userId: user?.id,
        username: user?.username
    });

    const handleLogout = async () => {
        try {
            console.log('🔵 LoggedInView: Logging out...');
            await supabase.auth.signOut();
        } catch (error) {
            console.error('🔴 LoggedInView: Logout failed:', error);
            alert('שגיאה ביציאה מהמערכת. אנא נסה שוב.');
        }
    };

    // Show loader while user data is loading
    if (isLoading) {
        console.log('🟡 LoggedInView: Showing loader (isLoading=true)');
        return <Loader message="טוען נתונים..." />;
    }

    if (!user) {
        console.log('🔴 LoggedInView: No user found (returning null)');
        return null;
    }

    console.log('✅ LoggedInView: User loaded, rendering dashboard');
    
    const navItems = [
        { view: 'child', label: 'דשבורד ילד/ה', icon: '🎨', description: 'הרפתקאות, סיפורים וקסם אישי' },
        { view: 'parent', label: 'דשבורד הורים', icon: '👨‍👩‍👧', description: 'ניהול פרופילים ומעקב התקדמות' },
        { view: 'story', label: 'יוצר הסיפורים', icon: '📚', description: 'הופכים לגיבורי אגדה מאוירת' },
        { view: 'learning-center', label: 'מרכז למידה', icon: '🎓', description: 'יוצרים חוברות ותוכניות חכמות' },
        { view: 'profile', label: 'הפרופיל שלי', icon: '👤', description: 'פרופיל אישי והיסטוריית תוכן' },
    ];
    if (user?.role === 'admin') {
        navItems.push({ view: 'admin', label: 'לוח בקרה מנהל', icon: '🎛️', description: 'ניהול מתקדם ונתונים' });
    }
    const currentViewLabel = navItems.find(item => item.view === currentView)?.label || 'גאון';

    const handleViewChange = (view: string, contentId?: number, contentType?: 'story' | 'workbook' | 'learning_plan') => {
        setCurrentView(view);
        if (contentId && contentType) {
            setSelectedContentId(contentId);
            setSelectedContentType(contentType);
        } else {
            setSelectedContentId(null);
            setSelectedContentType(null);
        }
    };

    const renderView = () => {
        switch (currentView) {
            case 'child': return <ChildDashboard setCurrentView={setCurrentView} />;
            case 'parent': return <ParentDashboard />;
            case 'admin': return <AdminDashboardWrapper />;
            case 'story': return <StoryCreator contentId={selectedContentType === 'story' ? selectedContentId : null} onContentLoaded={() => { setSelectedContentId(null); setSelectedContentType(null); }} />;
            case 'learning-center': return <LearningCenter contentId={selectedContentType === 'workbook' || selectedContentType === 'learning_plan' ? selectedContentId : null} contentType={selectedContentType} onContentLoaded={() => { setSelectedContentId(null); setSelectedContentType(null); }} />;
            case 'profile': return <UserProfile setCurrentView={handleViewChange} />;
            default: return <ChildDashboard setCurrentView={setCurrentView} />;
        }
    };

    return (
        <div className="app-layout">
            <MobileHeader
                onMenuClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
                isMenuOpen={isMobileNavOpen}
                viewLabel={currentViewLabel}
            />
            {isMobileNavOpen && (
                <MobileNavMenu
                    navItems={navItems}
                    currentView={currentView}
                    setCurrentView={setCurrentView}
                    onLogout={handleLogout}
                    onClose={() => setIsMobileNavOpen(false)}
                />
            )}
             <LoggedInHeader 
                navItems={navItems} 
                currentView={currentView} 
                setCurrentView={setCurrentView} 
                onLogout={handleLogout} 
            />
            <main className="main-content">
                {renderView()}
            </main>
        </div>
    );
}

const AppContent = () => {
    const { user, isLoading } = useAppContext();
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [forceLandingPage, setForceLandingPage] = useState(false);

    useEffect(() => {
        // Check if URL contains landing parameter
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('view') === 'landing') {
            setForceLandingPage(true);
        }

        // Check initial session
        supabase.auth.getSession()
            .then(({ data: { session } }) => {
                console.log('🔵 AppContent: Initial session check:', {
                    hasSession: !!session,
                    userId: session?.user?.id,
                    email: session?.user?.email
                });
                setIsCheckingAuth(false);
            })
            .catch((error) => {
                console.error('🔴 AppContent: Failed to get session:', error);
                setIsCheckingAuth(false);
            });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('🔵 AppContent: Auth state changed:', event, {
                hasSession: !!session,
                userId: session?.user?.id
            });
        });

        return () => subscription.unsubscribe();
    }, []);

    // Show loader while checking auth
    if (isCheckingAuth || isLoading) {
        return <Loader message="טוען..." />;
    }

    // Force landing page view if requested
    if (forceLandingPage) {
        console.log('🟡 AppContent: Force landing page view');
        return <LandingPage />;
    }

    // If no user, show landing page
    if (!user) {
        console.log('🟡 AppContent: No user, showing LandingPage');
        return <LandingPage />;
    }

    console.log('✅ AppContent: User exists, rendering LoggedInView');

    // If user exists, show logged in view
    return (
        <>
            <LoggedInView />
            <Footer />
        </>
    );
};

const App = () => {
    return (
        <AppProvider>
            <AppContent />
        </AppProvider>
    );
};

export default App;