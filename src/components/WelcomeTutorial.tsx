import React, { useState, useEffect } from 'react';
import { styles } from '../../styles';

interface WelcomeTutorialProps {
    onComplete: () => void;
}

const WelcomeTutorial = ({ onComplete }: WelcomeTutorialProps) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Fade in animation
        setTimeout(() => setIsVisible(true), 100);
    }, []);

    const steps = [
        {
            icon: '👋',
            title: 'ברוכים הבאים לגאון של אמא!',
            description: 'אנחנו כאן כדי ליצור חוויות למידה מדהימות ומותאמות אישית לילדים שלכם',
            tip: 'הפלטפורמה שלנו משתמשת בבינה מלאכותית מתקדמת ליצירת תוכן איכותי ומעניין'
        },
        {
            icon: '👶',
            title: 'צרו פרופיל לילד',
            description: 'התחילו ביצירת פרופיל אישי לכל ילד עם שם, גיל ותחומי עניין',
            tip: 'ככל שתספרו לנו יותר על הילד, כך התוכן יהיה מותאם יותר'
        },
        {
            icon: '🎨',
            title: 'בחרו מה ליצור',
            description: 'סיפורים מאוירים, חוברות עבודה או תוכניות למידה מודרכות',
            tip: 'כל סוג תוכן עולה מספר קרדיטים שונה - ראו בעזרה למידע מלא'
        },
        {
            icon: '💎',
            title: 'מערכת הקרדיטים',
            description: 'השתמשו בקרדיטים ליצירת תוכן. קבלתם קרדיטים התחלתיים מתנה!',
            tip: 'לחצו על כפתור העזרה (❓) בכל עת לראות מחירון מלא ופרטים נוספים'
        },
        {
            icon: '✨',
            title: 'מוכנים להתחיל?',
            description: 'עכשיו אתם מוכנים ליצור תוכן מדהים! בהצלחה!',
            tip: 'זקוקים לעזרה? כפתור העזרה תמיד כאן בשבילכם בפינה השמאלית התחתונה'
        }
    ];

    const currentStepData = steps[currentStep];

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleComplete = () => {
        setIsVisible(false);
        setTimeout(() => {
            onComplete();
        }, 300);
    };

    const handleSkip = () => {
        handleComplete();
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.85)',
                backdropFilter: 'blur(8px)',
                zIndex: 10000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
                opacity: isVisible ? 1 : 0,
                transition: 'opacity 0.3s ease',
                overflowY: 'auto',
            }}
            onClick={handleSkip}
        >
            <div
                className="fade-in"
                style={{
                    background: 'linear-gradient(145deg, rgba(26, 46, 26, 0.98), rgba(36, 60, 36, 0.95))',
                    borderRadius: 'clamp(16px, 4vw, 28px)',
                    maxWidth: '650px',
                    width: '100%',
                    padding: 0,
                    boxShadow: '0 20px 80px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(127, 217, 87, 0.3)',
                    border: '2px solid var(--primary-color)',
                    overflow: 'hidden',
                    position: 'relative',
                    transform: isVisible ? 'scale(1)' : 'scale(0.9)',
                    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    margin: 'auto',
                    maxHeight: '95vh',
                    display: 'flex',
                    flexDirection: 'column',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with gradient */}
                <div
                    style={{
                        background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
                        padding: 'clamp(1.5rem, 4vw, 3rem)',
                        textAlign: 'center',
                        position: 'relative',
                        overflow: 'hidden',
                        flexShrink: 0,
                    }}
                >
                    {/* SVG Pattern Background */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                            opacity: 0.3,
                        }}
                    ></div>

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div
                            style={{
                                fontSize: 'clamp(4rem, 8vw, 5rem)',
                                marginBottom: '1rem',
                                animation: 'float-icon 3s ease-in-out infinite',
                                filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.3))',
                            }}
                        >
                            {currentStepData.icon}
                        </div>
                        <h2
                            style={{
                                margin: 0,
                                fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
                                fontWeight: 900,
                                color: 'white',
                                textShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                            }}
                        >
                            {currentStepData.title}
                        </h2>
                    </div>
                </div>

                {/* Content */}
                <div style={{ padding: 'clamp(1.2rem, 4vw, 3rem)', flex: 1, overflowY: 'auto' }}>
                    <p
                        style={{
                            fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
                            lineHeight: 1.8,
                            color: 'var(--text-primary)',
                            marginBottom: '1.5rem',
                            textAlign: 'center',
                        }}
                    >
                        {currentStepData.description}
                    </p>

                    {/* Tip Box */}
                    <div
                        style={{
                            background: 'linear-gradient(135deg, rgba(127, 217, 87, 0.15), rgba(86, 217, 137, 0.1))',
                            border: '2px solid rgba(127, 217, 87, 0.3)',
                            borderRadius: '16px',
                            padding: 'clamp(1rem, 2.5vw, 1.5rem)',
                            marginBottom: '2rem',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '0.8rem',
                            }}
                        >
                            <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>💡</span>
                            <p
                                style={{
                                    margin: 0,
                                    fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
                                    lineHeight: 1.6,
                                    color: 'var(--text-light)',
                                }}
                            >
                                {currentStepData.tip}
                            </p>
                        </div>
                    </div>

                    {/* Progress Indicator */}
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            marginBottom: '2rem',
                        }}
                    >
                        {steps.map((_, index) => (
                            <div
                                key={index}
                                style={{
                                    width: index === currentStep ? '32px' : '10px',
                                    height: '10px',
                                    borderRadius: '5px',
                                    background:
                                        index === currentStep
                                            ? 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))'
                                            : index < currentStep
                                            ? 'var(--primary-color)'
                                            : 'rgba(127, 217, 87, 0.2)',
                                    transition: 'all 0.3s ease',
                                    boxShadow: index === currentStep ? '0 2px 8px rgba(127, 217, 87, 0.5)' : 'none',
                                }}
                            ></div>
                        ))}
                    </div>

                    {/* Navigation Buttons */}
                    <div
                        style={{
                            display: 'flex',
                            gap: '1rem',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
                        <button
                            onClick={handleSkip}
                            style={{
                                ...styles.button,
                                background: 'transparent',
                                color: 'var(--text-light)',
                                boxShadow: 'none',
                                padding: '0.8rem 1.5rem',
                                fontSize: 'clamp(0.95rem, 2vw, 1.05rem)',
                            }}
                        >
                            דלג
                        </button>

                        <div style={{ display: 'flex', gap: '0.8rem' }}>
                            {currentStep > 0 && (
                                <button
                                    onClick={handlePrevious}
                                    style={{
                                        ...styles.button,
                                        background: 'rgba(127, 217, 87, 0.15)',
                                        color: 'var(--primary-light)',
                                        border: '2px solid var(--primary-color)',
                                        padding: '0.8rem 1.5rem',
                                        fontSize: 'clamp(0.95rem, 2vw, 1.05rem)',
                                    }}
                                >
                                    ← הקודם
                                </button>
                            )}

                            <button
                                onClick={handleNext}
                                style={{
                                    ...styles.button,
                                    background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
                                    padding: '0.8rem 2rem',
                                    fontSize: 'clamp(0.95rem, 2vw, 1.05rem)',
                                    fontWeight: 700,
                                    boxShadow: '0 6px 24px rgba(127, 217, 87, 0.4)',
                                }}
                            >
                                {currentStep === steps.length - 1 ? 'בואו נתחיל! 🚀' : 'הבא →'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Step Counter */}
                <div
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        left: '1rem',
                        background: 'rgba(0, 0, 0, 0.5)',
                        backdropFilter: 'blur(10px)',
                        padding: '0.5rem 1rem',
                        borderRadius: '20px',
                        fontSize: '0.9rem',
                        color: 'white',
                        fontWeight: 600,
                    }}
                >
                    {currentStep + 1} / {steps.length}
                </div>
            </div>

            <style>{`
                @keyframes float-icon {
                    0%, 100% {
                        transform: translateY(0) rotate(0deg);
                    }
                    25% {
                        transform: translateY(-10px) rotate(-5deg);
                    }
                    75% {
                        transform: translateY(-5px) rotate(5deg);
                    }
                }
            `}</style>
        </div>
    );
};

export default WelcomeTutorial;
