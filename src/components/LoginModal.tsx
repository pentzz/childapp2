import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { styles } from '../../styles';

interface LoginModalProps {
    onClose: () => void;
}

const LoginModal = ({ onClose }: LoginModalProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGoogleLogin = async () => {
        try {
            setIsLoading(true);
            setError('');

            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin,
                }
            });

            if (error) {
                console.error('Error signing in with Google:', error);
                setError('שגיאה בהתחברות עם Google. נסה שוב.');
                setIsLoading(false);
                return;
            }

            // OAuth will redirect, so we don't need to close the modal here
        } catch (err) {
            console.error('Unexpected error:', err);
            setError('שגיאה בלתי צפויה. נסה שוב.');
            setIsLoading(false);
        }
    };

    // Prevents closing modal when clicking inside the form
    const handleModalContentClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    return (
        <div className="modal-backdrop no-print" onClick={onClose}>
            <div className="modal-content" onClick={handleModalContentClick}>
                <div style={styles.glassForm}>
                    <h2 style={styles.title}>כניסה למערכת</h2>
                    <p style={{...styles.subtitle, margin: '0 0 2rem 0', fontSize: '1rem'}}>
                        מוכנים להתחיל את ההרפתקה? התחברו עם Google כדי להמשיך.
                    </p>

                    <button 
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        style={{
                            ...styles.button,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.75rem',
                            width: '100%',
                            padding: '1rem',
                            fontSize: '1.1rem',
                            background: 'linear-gradient(135deg, #4285f4, #34a853)',
                            boxShadow: '0 4px 15px rgba(66, 133, 244, 0.4)',
                            opacity: isLoading ? 0.7 : 1,
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {isLoading ? (
                            <>
                                <span style={{
                                    display: 'inline-block',
                                    width: '20px',
                                    height: '20px',
                                    border: '3px solid rgba(255,255,255,0.3)',
                                    borderTop: '3px solid white',
                                    borderRadius: '50%',
                                    animation: 'spin 1s linear infinite',
                                }}></span>
                                מתחבר...
                            </>
                        ) : (
                            <>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                </svg>
                                כניסה/הרשמה עם Google
                            </>
                        )}
                    </button>

                    {error && (
                        <p style={{
                            ...styles.error, 
                            margin: '1rem 0 0 0',
                            fontSize: '0.9rem'
                        }}>
                            {error}
                        </p>
                    )}

                    <div style={{
                        marginTop: '1.5rem',
                        padding: '1rem',
                        background: 'rgba(100, 204, 197, 0.1)',
                        borderRadius: '8px',
                        border: '1px solid rgba(100, 204, 197, 0.3)',
                    }}>
                        <p style={{
                            fontSize: '0.85rem',
                            color: 'var(--text-light)',
                            margin: 0,
                            lineHeight: 1.5,
                        }}>
                            💡 <strong>הערה:</strong> אם זו הפעם הראשונה שלך, חשבון חדש ייווצר אוטומטית עם ההתחברות הראשונה.
                        </p>
                    </div>

                    <button 
                        type="button" 
                        onClick={onClose} 
                        style={{
                            ...styles.button, 
                            background: 'transparent', 
                            color: 'var(--text-light)', 
                            boxShadow: 'none',
                            marginTop: '1rem',
                            width: '100%'
                        }}
                    >
                        סגירה
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default LoginModal;
