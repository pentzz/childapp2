import React from 'react';
import { styles } from '../../styles';

const Footer = () => {
    const currentYear = new Date().getFullYear();
    return (
        <footer style={{
            background: 'linear-gradient(135deg, rgba(15, 31, 15, 0.95), rgba(26, 46, 26, 0.9))',
            borderTop: '1px solid var(--glass-border)',
            padding: '2rem 1rem',
            marginTop: 'auto',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 -4px 20px rgba(127, 217, 87, 0.1)'
        }} className="no-print">
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1.5rem',
                textAlign: 'center'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    flexWrap: 'wrap',
                    justifyContent: 'center'
                }}>
                    <img 
                        src="/logo.png" 
                        alt="לוגו גאון" 
                        style={{
                            width: '50px',
                            height: '50px',
                            objectFit: 'cover',
                            borderRadius: '50%',
                            border: '2px solid var(--primary-color)',
                            boxShadow: '0 4px 15px rgba(127, 217, 87, 0.3)'
                        }}
                    />
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: '0.3rem'
                    }}>
                        <h3 style={{
                            margin: 0,
                            fontSize: '1.2rem',
                            color: 'var(--primary-light)',
                            fontWeight: 'bold'
                        }}>
                            גאון - פלטפורמת למידה ויצירה
                        </h3>
                        <p style={{
                            margin: 0,
                            fontSize: '0.9rem',
                            color: 'var(--text-light)'
                        }}>
                            © {currentYear} ZBANG. כל הזכויות שמורות.
                        </p>
                    </div>
                </div>
                <div style={{
                    display: 'flex',
                    gap: '2rem',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    fontSize: '0.85rem',
                    color: 'var(--text-light)'
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
