import React from 'react';
import { styles } from '../../styles';

const Footer = () => {
    const currentYear = new Date().getFullYear();
    return (
        <footer style={{
            background: 'linear-gradient(135deg, rgba(15, 31, 15, 0.95), rgba(26, 46, 26, 0.9))',
            borderTop: '1px solid rgba(127, 217, 87, 0.2)',
            padding: 'clamp(1rem, 3vw, 1.5rem) clamp(1rem, 3vw, 2rem)',
            marginTop: 'auto',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
            pointerEvents: 'auto',
            position: 'relative',
            zIndex: 1
        }} className="no-print">
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'clamp(0.75rem, 2vw, 1rem)',
                textAlign: 'center'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'clamp(0.75rem, 2vw, 1rem)',
                    flexWrap: 'wrap',
                    justifyContent: 'center'
                }}>
                    <img
                        src="/logo.png"
                        alt="לוגו גאון"
                        style={{
                            width: 'clamp(32px, 8vw, 40px)',
                            height: 'clamp(32px, 8vw, 40px)',
                            objectFit: 'cover',
                            borderRadius: '50%',
                            border: '2px solid var(--primary-color)',
                            boxShadow: '0 2px 8px rgba(127, 217, 87, 0.2)'
                        }}
                    />
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: '0.2rem'
                    }}>
                        <h3 style={{
                            margin: 0,
                            fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)',
                            color: 'var(--primary-light)',
                            fontWeight: 600
                        }}>
                            גאון - פלטפורמת למידה ויצירה
                        </h3>
                        <p style={{
                            margin: 0,
                            fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
                            color: 'var(--text-light)',
                            opacity: 0.8
                        }}>
                            © {currentYear} ZBANG. כל הזכויות שמורות.
                        </p>
                    </div>
                </div>
                <div style={{
                    display: 'flex',
                    gap: 'clamp(1rem, 3vw, 1.5rem)',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    fontSize: 'clamp(0.7rem, 2vw, 0.8rem)',
                    color: 'var(--text-light)',
                    opacity: 0.7
                }}>
                    <span>✨ חינוך מותאם אישית</span>
                    <span>🎨 יצירתיות ללא גבולות</span>
                    <span>🚀 למידה משמעותית</span>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
