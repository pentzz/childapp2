import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { supabase } from '../supabaseClient';
import { AppProvider, useAppContext } from './AppContext';
import LoggedInHeader from './LoggedInHeader';
import Footer from './Footer';
import Loader from './Loader';
import { ToastContainer, ToastMessage } from './Toast';
import { styles } from '../../styles';
import '../../App.css';
import './enhanced-styles.css';

// Lazy load heavy components for better performance
const LandingPage = lazy(() => import('./LandingPage'));
const ChildDashboard = lazy(() => import('./ChildDashboard'));
const ParentDashboard = lazy(() => import('./ParentDashboard'));
const AdminDashboard = lazy(() => import('./AdminDashboard'));
const StoryCreator = lazy(() => import('./StoryCreator'));
const LearningCenter = lazy(() => import('./WorkbookCreator'));
const UserProfile = lazy(() => import('./UserProfile'));
const HelpSystem = lazy(() => import('./HelpSystem'));
const WelcomeTutorial = lazy(() => import('./WelcomeTutorial'));


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
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [showWelcomeTutorial, setShowWelcomeTutorial] = useState(false);
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [isTransitioning, setIsTransitioning] = useState(false);

    // Check if user is new and should see welcome tutorial
    useEffect(() => {
        const checkIfNewUser = async () => {
            if (!user) return;

            try {
                // Check localStorage first for faster UX
                const hasSeenTutorial = localStorage.getItem(`tutorial_completed_${user.id}`);

                if (!hasSeenTutorial) {
                    // Check if user has any content created
                    const { data: userContent, error } = await supabase
                        .from('content')
                        .select('id')
                        .eq('user_id', user.id)
                        .limit(1);

                    if (!error && (!userContent || userContent.length === 0)) {
                        // New user with no content - show tutorial
                        setShowWelcomeTutorial(true);
                    }
                }
            } catch (error) {
                console.error('Error checking tutorial status:', error);
            }
        };

        checkIfNewUser();
    }, [user]);

    const handleTutorialComplete = () => {
        if (user) {
            localStorage.setItem(`tutorial_completed_${user.id}`, 'true');
        }
        setShowWelcomeTutorial(false);
    };

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
        // Fast transition between views
        setIsTransitioning(true);
        setTimeout(() => {
            setCurrentView(view);
            if (contentId && contentType) {
                setSelectedContentId(contentId);
                setSelectedContentType(contentType);
            } else {
                setSelectedContentId(null);
                setSelectedContentType(null);
            }
            setIsTransitioning(false);
        }, 50);
    };

    const handleRemoveToast = (id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    };

    const renderView = () => {
        return (
            <Suspense fallback={<Loader message="טוען..." />}>
                {(() => {
                    switch (currentView) {
                        case 'child': return <ChildDashboard setCurrentView={setCurrentView} />;
                        case 'parent': return <ParentDashboard />;
                        case 'admin': return <AdminDashboardWrapper />;
                        case 'story': return <StoryCreator contentId={selectedContentType === 'story' ? selectedContentId : null} onContentLoaded={() => { setSelectedContentId(null); setSelectedContentType(null); }} />;
                        case 'learning-center': return <LearningCenter contentId={selectedContentType === 'workbook' || selectedContentType === 'learning_plan' ? selectedContentId : null} contentType={selectedContentType} onContentLoaded={() => { setSelectedContentId(null); setSelectedContentType(null); }} />;
                        case 'profile': return <UserProfile setCurrentView={handleViewChange} />;
                        default: return <ChildDashboard setCurrentView={handleViewChange} />;
                    }
                })()}
            </Suspense>
        );
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
            <main
                className="main-content"
                style={{
                    opacity: isTransitioning ? 0.9 : 1,
                    transform: isTransitioning ? 'scale(0.99)' : 'scale(1)',
                    transition: 'opacity 0.1s ease-out, transform 0.1s ease-out',
                }}
            >
                {renderView()}
            </main>

            {/* Toast Notifications */}
            <ToastContainer toasts={toasts} onClose={handleRemoveToast} />

            {/* Floating Help Button - Hidden when mobile nav is open */}
            {!isMobileNavOpen && (
                <button
                    onClick={() => setIsHelpOpen(true)}
                    className="floating-help-button no-print"
                    style={{
                        position: 'fixed',
                        bottom: '2rem',
                        left: '2rem',
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
                        border: 'none',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3), 0 0 0 0 rgba(127, 217, 87, 0.7)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.8rem',
                        color: 'white',
                        zIndex: 1000,
                        transition: 'all 0.3s ease',
                        animation: 'pulse 2s infinite'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                        e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.4), 0 0 0 10px rgba(127, 217, 87, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.3), 0 0 0 0 rgba(127, 217, 87, 0.7)';
                    }}
                    title="עזרה ומדריך"
                >
                    ❓
                </button>
            )}

            {/* Help System Modal */}
            {isHelpOpen && (
                <Suspense fallback={null}>
                    <HelpSystem onClose={() => setIsHelpOpen(false)} />
                </Suspense>
            )}

            {/* Welcome Tutorial for New Users */}
            {showWelcomeTutorial && (
                <Suspense fallback={null}>
                    <WelcomeTutorial onComplete={handleTutorialComplete} />
                </Suspense>
            )}

            <style>{`
                @keyframes pulse {
                    0% {
                        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3), 0 0 0 0 rgba(127, 217, 87, 0.7);
                    }
                    50% {
                        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3), 0 0 0 10px rgba(127, 217, 87, 0);
                    }
                    100% {
                        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3), 0 0 0 0 rgba(127, 217, 87, 0);
                    }
                }

                @media (max-width: 768px) {
                    .floating-help-button {
                        bottom: 1rem !important;
                        left: 1rem !important;
                        width: 50px !important;
                        height: 50px !important;
                        font-size: 1.5rem !important;
                    }
                }
            `}</style>
            
            {/* Footer - Only visible after scrolling to bottom */}
            <Footer />
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

        // Check initial session and handle OAuth redirect
        const checkSession = async () => {
            try {
                // Get session (this will also handle OAuth redirect tokens in URL hash)
                const { data: { session }, error } = await supabase.auth.getSession();
                
                console.log('🔵 AppContent: Initial session check:', {
                    hasSession: !!session,
                    userId: session?.user?.id,
                    email: session?.user?.email,
                    error: error?.message
                });
                
                // If we have a session after OAuth redirect, clear URL hash to clean up
                if (session && window.location.hash) {
                    console.log('✅ AppContent: Session found after OAuth, cleaning URL hash');
                    // Remove the hash but keep the path
                    const cleanUrl = window.location.origin + window.location.pathname;
                    window.history.replaceState({}, '', cleanUrl);
                }
                
                setIsCheckingAuth(false);
            } catch (error) {
                console.error('🔴 AppContent: Failed to get session:', error);
                setIsCheckingAuth(false);
            }
        };
        
        checkSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('🔵 AppContent: Auth state changed:', event, {
                hasSession: !!session,
                userId: session?.user?.id,
                email: session?.user?.email
            });

            // If user signed in, clear any force landing page flag and ensure navigation to dashboard
            if (event === 'SIGNED_IN' && session?.user) {
                console.log('✅ AppContent: User signed in, clearing force landing page and cleaning URL');
                setForceLandingPage(false);

                // Clean up URL to ensure we're not on landing page
                if (window.location.search.includes('view=landing')) {
                    const cleanUrl = window.location.origin + window.location.pathname;
                    window.history.replaceState({}, '', cleanUrl);
                }
            }

            // If user signed out, show landing page
            if (event === 'SIGNED_OUT') {
                console.log('🟡 AppContent: User signed out');
                setForceLandingPage(false);
            }
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
        return (
            <Suspense fallback={<Loader message="טוען..." />}>
                <LandingPage />
            </Suspense>
        );
    }

    // If no user, show landing page
    if (!user) {
        console.log('🟡 AppContent: No user, showing LandingPage');
        return (
            <Suspense fallback={<Loader message="טוען..." />}>
                <LandingPage />
            </Suspense>
        );
    }

    console.log('✅ AppContent: User exists, rendering LoggedInView');

    // If user exists, show logged in view
    return <LoggedInView />;
};

const App = () => {
    return (
        <AppProvider>
            <AppContent />
        </AppProvider>
    );
};

export default App;