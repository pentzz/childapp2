import React, { useState, useEffect } from 'react';

const THEMED_CHARS = 'אבגדהוזחטיכלמנסעפצקרשת1234567890'.split('');
const LOADER_EMOJIS = ['✨', '🌟', '💫', '⭐', '🎨', '📚', '🎯', '🚀'];

interface LoaderProps {
    message: string;
}

const Loader: React.FC<LoaderProps> = ({ message }) => {
    const [char, setChar] = useState('א');
    const [emojiIndex, setEmojiIndex] = useState(0);

    useEffect(() => {
        const charInterval = setInterval(() => {
            const randomIndex = Math.floor(Math.random() * THEMED_CHARS.length);
            setChar(THEMED_CHARS[randomIndex]);
        }, 120);

        const emojiInterval = setInterval(() => {
            setEmojiIndex((prev) => (prev + 1) % LOADER_EMOJIS.length);
        }, 800);

        return () => {
            clearInterval(charInterval);
            clearInterval(emojiInterval);
        };
    }, []);

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(135deg, rgba(26, 46, 26, 0.98), rgba(36, 60, 36, 0.95))',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
            }}
        >
            {/* Animated Background Elements */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    overflow: 'hidden',
                    opacity: 0.1,
                }}
            >
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        style={{
                            position: 'absolute',
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            fontSize: `${Math.random() * 2 + 1}rem`,
                            color: 'var(--primary-color)',
                            animation: `float ${Math.random() * 10 + 15}s linear infinite`,
                            animationDelay: `${Math.random() * 5}s`,
                        }}
                    >
                        {THEMED_CHARS[Math.floor(Math.random() * THEMED_CHARS.length)]}
                    </div>
                ))}
            </div>

            {/* Main Logo Container */}
            <div
                style={{
                    position: 'relative',
                    marginBottom: '3rem',
                }}
            >
                {/* Rotating Ring */}
                <div
                    style={{
                        width: '180px',
                        height: '180px',
                        border: '4px solid transparent',
                        borderTopColor: 'var(--primary-color)',
                        borderRightColor: 'var(--secondary-color)',
                        borderRadius: '50%',
                        animation: 'spin 2s linear infinite',
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                    }}
                ></div>

                {/* Inner Ring */}
                <div
                    style={{
                        width: '140px',
                        height: '140px',
                        border: '3px solid transparent',
                        borderBottomColor: 'var(--accent-color)',
                        borderLeftColor: 'var(--primary-light)',
                        borderRadius: '50%',
                        animation: 'spin-reverse 1.5s linear infinite',
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                    }}
                ></div>

                {/* Center Content */}
                <div
                    style={{
                        width: '160px',
                        height: '160px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(145deg, rgba(127, 217, 87, 0.15), rgba(86, 217, 137, 0.1))',
                        borderRadius: '50%',
                        border: '3px solid var(--primary-color)',
                        boxShadow: '0 0 40px rgba(127, 217, 87, 0.3), inset 0 0 20px rgba(127, 217, 87, 0.1)',
                        position: 'relative',
                    }}
                >
                    {/* Animated Emoji */}
                    <div
                        style={{
                            fontSize: '3.5rem',
                            animation: 'bounce 1s ease-in-out infinite',
                            marginBottom: '0.5rem',
                        }}
                    >
                        {LOADER_EMOJIS[emojiIndex]}
                    </div>

                    {/* Animated Character */}
                    <div
                        style={{
                            fontSize: '2rem',
                            fontWeight: 900,
                            background: 'linear-gradient(135deg, var(--primary-light), var(--secondary-color))',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}
                    >
                        {char}
                    </div>
                </div>
            </div>

            {/* Brand Name */}
            <div
                style={{
                    fontSize: 'clamp(2rem, 5vw, 3rem)',
                    fontWeight: 900,
                    background: 'linear-gradient(135deg, var(--primary-light), var(--secondary-color))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    marginBottom: '1rem',
                    textAlign: 'center',
                    animation: 'pulse-text 2s ease-in-out infinite',
                }}
            >
                גאון של אמא
            </div>

            {/* Loading Message */}
            <p
                style={{
                    fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
                    color: 'var(--text-light)',
                    marginBottom: '2rem',
                    textAlign: 'center',
                    padding: '0 1rem',
                }}
            >
                {message}
            </p>

            {/* Loading Dots */}
            <div
                style={{
                    display: 'flex',
                    gap: '0.8rem',
                }}
            >
                {[0, 1, 2].map((i) => (
                    <div
                        key={i}
                        style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
                            animation: `bounce-dot 1.4s ease-in-out infinite`,
                            animationDelay: `${i * 0.2}s`,
                            boxShadow: '0 0 10px rgba(127, 217, 87, 0.5)',
                        }}
                    ></div>
                ))}
            </div>

            <style>{`
                @keyframes spin {
                    0% { transform: translate(-50%, -50%) rotate(0deg); }
                    100% { transform: translate(-50%, -50%) rotate(360deg); }
                }

                @keyframes spin-reverse {
                    0% { transform: translate(-50%, -50%) rotate(0deg); }
                    100% { transform: translate(-50%, -50%) rotate(-360deg); }
                }

                @keyframes bounce {
                    0%, 100% { transform: translateY(0) scale(1); }
                    50% { transform: translateY(-15px) scale(1.1); }
                }

                @keyframes bounce-dot {
                    0%, 100% { transform: translateY(0); opacity: 0.5; }
                    50% { transform: translateY(-15px); opacity: 1; }
                }

                @keyframes pulse-text {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }

                @keyframes float {
                    0% { transform: translateY(0) rotate(0deg); opacity: 0.1; }
                    50% { opacity: 0.3; }
                    100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
                }
            `}</style>
        </div>
    );
};

export default Loader;
