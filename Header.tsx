import React, { useState, useMemo } from 'react';

interface HeaderProps {
    onLoginClick: () => void;
}

const Header = ({ onLoginClick }: HeaderProps) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const handleLinkClick = () => {
        setIsMenuOpen(false);
    };

    const handleLoginClick = () => {
        setIsMenuOpen(false);
        onLoginClick();
    };

    // Floating characters background for mobile menu
    const floatingChars = useMemo(() => {
        const chars = 'אבגדהוזחטיכלמנסעפצקרשת1234567890📚🎨✨💡🌟'.split('');
        return Array.from({ length: 25 }).map((_, i) => {
            const style: React.CSSProperties = {
                position: 'absolute',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                fontSize: `${Math.random() * 2 + 1}rem`,
                opacity: Math.random() * 0.3 + 0.1,
                animation: `float-menu-char ${Math.random() * 15 + 10}s linear infinite`,
                animationDelay: `${Math.random() * 5}s`,
                color: Math.random() > 0.5 ? 'var(--primary-light)' : 'var(--secondary-color)',
                pointerEvents: 'none',
            };
            const char = chars[Math.floor(Math.random() * chars.length)];
            return <span key={i} style={style}>{char}</span>;
        });
    }, []);

    return (
        <header className="app-header no-print">
            <div className="logo-container">
                <img src="/logo.png" alt="לוגו גאון" className="logo-image" />
                <span className="logo-text">גאון</span>
            </div>
            
            <div className={`mobile-menu-icon ${isMenuOpen ? 'open' : ''}`} onClick={toggleMenu}>
                <span></span>
                <span></span>
                <span></span>
            </div>
            
            <nav className={`nav-links ${isMenuOpen ? 'open' : ''}`}>
                {isMenuOpen && <div className="mobile-menu-bg-chars">{floatingChars}</div>}
                <a href="#features" onClick={handleLinkClick}>הקסם שלנו</a>
                <a href="#how-it-works" onClick={handleLinkClick}>איך זה עובד</a>
                <a href="#showcase" onClick={handleLinkClick}>דוגמאות</a>
                <a href="#pricing" onClick={handleLinkClick}>תוכניות</a>
                <a href="#about" onClick={handleLinkClick}>אודות</a>
                <button onClick={handleLoginClick} className="mobile-login-btn">
                    <i className="fas fa-sign-in-alt"></i>
                    כניסה | הרשמה
                </button>
            </nav>
            
            <button onClick={onLoginClick} className="header-cta desktop-only">
                כניסה | הרשמה
            </button>
        </header>
    );
};

export default Header;