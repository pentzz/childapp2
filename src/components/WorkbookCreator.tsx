import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { useAppContext } from './AppContext';
import { supabase } from '../supabaseClient';
import { styles } from '../../styles';
import Loader from './Loader';

// --- NEW COMPONENT: GuidedPlanView ---
const GuidedPlanView = ({ planHistory, onNextStep, onGenerateWorksheet, isGenerating, isLastStep, worksheetCredits }: { planHistory: any[], onNextStep: (feedback: string) => void, onGenerateWorksheet: () => void, isGenerating: boolean, isLastStep: boolean, worksheetCredits: number }) => {
    const { user, activeProfile } = useAppContext();
    const [feedback, setFeedback] = useState('');
    const [expandedParentCard, setExpandedParentCard] = useState<number>(0);
    const [expandedChildCard, setExpandedChildCard] = useState<number>(0);
    const currentStep = planHistory[planHistory.length - 1];

    if (!currentStep) return null;

    return (
        <div className="fade-in" style={{
            maxWidth: '1600px',
            margin: '0 auto',
            padding: 'clamp(1rem, 3vw, 2rem)'
        }}>
            {/* Enhanced Header Section with Progress */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(127, 217, 87, 0.15), rgba(86, 217, 137, 0.1))',
                border: '3px solid var(--primary-color)',
                borderRadius: '24px',
                padding: 'clamp(2rem, 4vw, 3rem)',
                marginBottom: 'clamp(2rem, 4vw, 3rem)',
                boxShadow: '0 12px 48px rgba(127, 217, 87, 0.3)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Decorative Pattern Background */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    opacity: 0.05,
                    pointerEvents: 'none'
                }}>
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="step-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                                <circle cx="20" cy="20" r="2" fill="var(--primary-color)" />
                                <path d="M 0 20 L 40 20 M 20 0 L 20 40" stroke="var(--primary-color)" strokeWidth="0.5" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#step-pattern)" />
                    </svg>
                </div>

                {/* Progress Badge */}
                <div style={{
                    display: 'inline-flex',
                    background: 'linear-gradient(135deg, var(--primary-color), var(--primary-light))',
                    color: 'white',
                    padding: 'clamp(0.5rem, 1.5vw, 0.75rem) clamp(1rem, 2.5vw, 1.5rem)',
                    borderRadius: '50px',
                    fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
                    fontWeight: 'bold',
                    marginBottom: 'clamp(1rem, 2vw, 1.5rem)',
                    boxShadow: '0 4px 16px rgba(127, 217, 87, 0.4)',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <span>📍</span>
                    <span>שלב {planHistory.length} מתוך {TOTAL_PLAN_STEPS}</span>
                </div>

                {/* Title and Description */}
                <h1 style={{
                    fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                    marginBottom: 'clamp(1rem, 2vw, 1.5rem)',
                    color: 'var(--primary-color)',
                    fontFamily: 'var(--font-serif)',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
                    lineHeight: 1.2
                }}>{currentStep.step_title}</h1>

                <p style={{
                    fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
                    color: 'var(--text-secondary)',
                    marginBottom: 'clamp(1.5rem, 3vw, 2rem)',
                    lineHeight: 1.8,
                    maxWidth: '900px'
                }}>
                    {activeProfile && `שלום ${activeProfile.name}! `}
                    בשלב זה תעברו יחד מסע למידה מרתק. בצעו את הפעילויות בקצב שלכם, ובסוף ספרו לי איך היה כדי שאוכל להתאים את השלב הבא במיוחד עבורכם!
                </p>

                {/* Worksheet Generation CTA */}
                <div style={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '16px',
                    padding: 'clamp(1.5rem, 3vw, 2rem)',
                    border: '2px solid rgba(127, 217, 87, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 'clamp(1rem, 2vw, 1.5rem)'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        flexWrap: 'wrap',
                        justifyContent: 'center'
                    }}>
                        <span style={{
                            fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
                            color: 'var(--text-secondary)',
                            fontWeight: 'bold'
                        }}>💡 רוצים לתרגל את מה שלמדתם?</span>
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(127, 217, 87, 0.2), rgba(86, 217, 137, 0.15))',
                            padding: 'clamp(0.5rem, 1.5vw, 0.75rem) clamp(1rem, 2vw, 1.5rem)',
                            borderRadius: '50px',
                            fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
                            color: 'var(--primary-color)',
                            fontWeight: 'bold',
                            border: '2px solid var(--primary-color)'
                        }}>
                            💎 {worksheetCredits} קרדיטים
                        </div>
                    </div>
                    <button
                        onClick={onGenerateWorksheet}
                        style={{
                            ...styles.button,
                            fontSize: 'clamp(1rem, 2.5vw, 1.3rem)',
                            padding: 'clamp(1rem, 2.5vw, 1.5rem) clamp(2rem, 5vw, 3rem)',
                            background: 'linear-gradient(135deg, var(--primary-color), var(--primary-light))',
                            boxShadow: '0 8px 24px rgba(127, 217, 87, 0.4)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 'clamp(0.5rem, 1.5vw, 1rem)',
                            fontWeight: 'bold',
                            transition: 'all 0.3s ease',
                            opacity: isGenerating || (user?.credits ?? 0) < worksheetCredits ? 0.6 : 1
                        }}
                        disabled={isGenerating || (user?.credits ?? 0) < worksheetCredits}
                        className="worksheet-generate-button"
                    >
                        <span style={{fontSize: 'clamp(1.5rem, 3vw, 2rem)'}}>📄</span>
                        <span>צרו דף תרגול מותאם אישית</span>
                    </button>
                </div>
            </div>

            {/* Main Activities Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(320px, 45vw, 500px), 1fr))',
                gap: 'clamp(1.5rem, 3vw, 2.5rem)',
                marginBottom: 'clamp(2rem, 4vw, 3rem)'
            }}>
                {/* Parent/Educator Column */}
                <div>
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(127, 217, 87, 0.2), rgba(86, 217, 137, 0.15))',
                        borderRadius: '20px',
                        padding: 'clamp(1.5rem, 3vw, 2rem)',
                        marginBottom: 'clamp(1.5rem, 3vw, 2rem)',
                        border: '3px solid var(--primary-color)',
                        boxShadow: '0 8px 32px rgba(127, 217, 87, 0.3)',
                        position: 'sticky',
                        top: '1rem',
                        zIndex: 10
                    }}>
                        <h2 style={{
                            fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
                            marginBottom: 'clamp(0.75rem, 2vw, 1rem)',
                            color: 'var(--primary-color)',
                            fontFamily: 'var(--font-serif)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
                        }}>
                            <span style={{fontSize: 'clamp(2rem, 5vw, 2.5rem)'}}>👩‍🏫</span>
                            <span>מדריך להורה/מורה</span>
                        </h2>
                        <p style={{
                            fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.7,
                            margin: 0
                        }}>
                            הנחיות מפורטות לליווי יעיל ומקצועי של הילד/ה בתהליך הלמידה
                        </p>
                    </div>

                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'clamp(1.5rem, 3vw, 2rem)'
                    }}>
                        {currentStep.cards.map((card: any, index: number) => {
                            const isExpanded = expandedParentCard === index;
                            return (
                                <div
                                    key={index}
                                    className="fade-in"
                                    style={{
                                        animationDelay: `${index * 100}ms`,
                                        background: 'linear-gradient(145deg, rgba(26, 46, 26, 0.95), rgba(36, 60, 36, 0.9))',
                                        borderRadius: '20px',
                                        border: '3px solid var(--primary-color)',
                                        boxShadow: isExpanded ? '0 16px 48px rgba(127, 217, 87, 0.4)' : '0 8px 24px rgba(0,0,0,0.2)',
                                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                        transform: isExpanded ? 'scale(1.02)' : 'scale(1)',
                                        overflow: 'hidden'
                                    }}
                                >
                                    {/* Card Header - Always Visible */}
                                    <div
                                        onClick={() => setExpandedParentCard(isExpanded ? -1 : index)}
                                        style={{
                                            background: 'linear-gradient(135deg, var(--primary-color), var(--primary-light))',
                                            padding: 'clamp(1.25rem, 3vw, 1.75rem)',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between'
                                        }}
                                    >
                                        <div style={{flex: 1}}>
                                            <div style={{
                                                fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
                                                color: 'rgba(255, 255, 255, 0.9)',
                                                fontWeight: 'bold',
                                                marginBottom: '0.25rem',
                                                letterSpacing: '0.05em'
                                            }}>
                                                פעילות {index + 1} מתוך {currentStep.cards.length}
                                            </div>
                                            <h3 style={{
                                                fontSize: 'clamp(1.3rem, 3vw, 1.7rem)',
                                                margin: 0,
                                                color: 'white',
                                                fontFamily: 'var(--font-serif)',
                                                textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
                                            }}>
                                                {card.educator_guidance.objective.split('\n')[0].substring(0, 60)}...
                                            </h3>
                                        </div>
                                        <div style={{
                                            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                                            color: 'white',
                                            transition: 'transform 0.3s ease',
                                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
                                            marginRight: '1rem'
                                        }}>
                                            {isExpanded ? '▲' : '▼'}
                                        </div>
                                    </div>

                                    {/* Card Content - Expandable */}
                                    <div style={{
                                        maxHeight: isExpanded ? '2000px' : '0',
                                        opacity: isExpanded ? 1 : 0,
                                        transition: 'max-height 0.5s ease, opacity 0.4s ease',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            padding: 'clamp(1.5rem, 3vw, 2.5rem)'
                                        }}>
                                            {/* Objective Section */}
                                            <div style={{
                                                marginBottom: 'clamp(1.5rem, 3vw, 2rem)',
                                                padding: 'clamp(1.25rem, 3vw, 1.75rem)',
                                                background: 'rgba(127, 217, 87, 0.1)',
                                                borderRadius: '16px',
                                                borderRight: '4px solid var(--primary-color)'
                                            }}>
                                                <h4 style={{
                                                    fontFamily: 'var(--font-serif)',
                                                    fontSize: 'clamp(1.15rem, 2.5vw, 1.4rem)',
                                                    marginBottom: 'clamp(0.75rem, 2vw, 1rem)',
                                                    color: 'var(--primary-light)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem'
                                                }}>
                                                    <span style={{fontSize: 'clamp(1.5rem, 3vw, 1.8rem)'}}>🎯</span>
                                                    <span>מטרת הפעילות</span>
                                                </h4>
                                                <p style={{
                                                    fontSize: 'clamp(1rem, 2.2vw, 1.2rem)',
                                                    lineHeight: 1.8,
                                                    margin: 0,
                                                    whiteSpace: 'pre-wrap',
                                                    color: 'var(--white)'
                                                }}>{card.educator_guidance.objective}</p>
                                            </div>

                                            {/* Tips Section */}
                                            <div style={{
                                                marginBottom: 'clamp(1.5rem, 3vw, 2rem)',
                                                padding: 'clamp(1.25rem, 3vw, 1.75rem)',
                                                background: 'rgba(255, 193, 7, 0.1)',
                                                borderRadius: '16px',
                                                borderRight: '4px solid #FFC107'
                                            }}>
                                                <h4 style={{
                                                    fontFamily: 'var(--font-serif)',
                                                    fontSize: 'clamp(1.15rem, 2.5vw, 1.4rem)',
                                                    marginBottom: 'clamp(0.75rem, 2vw, 1rem)',
                                                    color: '#FFC107',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem'
                                                }}>
                                                    <span style={{fontSize: 'clamp(1.5rem, 3vw, 1.8rem)'}}>💡</span>
                                                    <span>טיפים והמלצות להצלחה</span>
                                                </h4>
                                                <p style={{
                                                    fontSize: 'clamp(1rem, 2.2vw, 1.2rem)',
                                                    lineHeight: 1.8,
                                                    margin: 0,
                                                    whiteSpace: 'pre-wrap',
                                                    color: 'var(--white)'
                                                }}>{card.educator_guidance.tips}</p>
                                            </div>

                                            {/* Troubleshooting Section */}
                                            <div style={{
                                                padding: 'clamp(1.25rem, 3vw, 1.75rem)',
                                                background: 'rgba(160, 132, 232, 0.1)',
                                                borderRadius: '16px',
                                                borderRight: '4px solid var(--secondary-color)'
                                            }}>
                                                <h4 style={{
                                                    fontFamily: 'var(--font-serif)',
                                                    fontSize: 'clamp(1.15rem, 2.5vw, 1.4rem)',
                                                    marginBottom: 'clamp(0.75rem, 2vw, 1rem)',
                                                    color: 'var(--secondary-color)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem'
                                                }}>
                                                    <span style={{fontSize: 'clamp(1.5rem, 3vw, 1.8rem)'}}>🤔</span>
                                                    <span>אתגרים אפשריים ופתרונות</span>
                                                </h4>
                                                <p style={{
                                                    fontSize: 'clamp(1rem, 2.2vw, 1.2rem)',
                                                    lineHeight: 1.8,
                                                    margin: 0,
                                                    whiteSpace: 'pre-wrap',
                                                    color: 'var(--white)'
                                                }}>{card.educator_guidance.potential_pitfalls}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick View Summary - When Collapsed */}
                                    {!isExpanded && (
                                        <div style={{
                                            padding: 'clamp(1rem, 2.5vw, 1.5rem)',
                                            background: 'rgba(127, 217, 87, 0.05)',
                                            borderTop: '1px solid rgba(127, 217, 87, 0.2)',
                                            fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                                            color: 'var(--text-light)',
                                            textAlign: 'center',
                                            fontStyle: 'italic'
                                        }}>
                                            לחצו כאן לצפייה במדריך המלא
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Child/Learner Column */}
                <div>
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(160, 132, 232, 0.2), rgba(190, 162, 255, 0.15))',
                        borderRadius: '20px',
                        padding: 'clamp(1.5rem, 3vw, 2rem)',
                        marginBottom: 'clamp(1.5rem, 3vw, 2rem)',
                        border: '3px solid var(--secondary-color)',
                        boxShadow: '0 8px 32px rgba(160, 132, 232, 0.3)',
                        position: 'sticky',
                        top: '1rem',
                        zIndex: 10
                    }}>
                        <h2 style={{
                            fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
                            marginBottom: 'clamp(0.75rem, 2vw, 1rem)',
                            color: 'var(--secondary-color)',
                            fontFamily: 'var(--font-serif)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
                        }}>
                            <span style={{fontSize: 'clamp(2rem, 5vw, 2.5rem)'}}>🧒</span>
                            <span>{activeProfile ? `ל${activeProfile.name}` : 'לילד/ה'}</span>
                        </h2>
                        <p style={{
                            fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.7,
                            margin: 0
                        }}>
                            פעילויות מותאמות אישית ומרתקות במיוחד עבורך!
                        </p>
                    </div>

                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'clamp(1.5rem, 3vw, 2rem)'
                    }}>
                        {currentStep.cards.map((card: any, index: number) => {
                            const isExpanded = expandedChildCard === index;
                            return (
                                <div
                                    key={index}
                                    className="fade-in"
                                    style={{
                                        animationDelay: `${index * 100}ms`,
                                        background: 'linear-gradient(145deg, rgba(46, 26, 46, 0.95), rgba(60, 36, 60, 0.9))',
                                        borderRadius: '20px',
                                        border: '3px solid var(--secondary-color)',
                                        boxShadow: isExpanded ? '0 16px 48px rgba(160, 132, 232, 0.4)' : '0 8px 24px rgba(0,0,0,0.2)',
                                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                        transform: isExpanded ? 'scale(1.02)' : 'scale(1)',
                                        overflow: 'hidden'
                                    }}
                                >
                                    {/* Card Header - Always Visible */}
                                    <div
                                        onClick={() => setExpandedChildCard(isExpanded ? -1 : index)}
                                        style={{
                                            background: 'linear-gradient(135deg, var(--secondary-color), var(--accent-color))',
                                            padding: 'clamp(1.25rem, 3vw, 1.75rem)',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between'
                                        }}
                                    >
                                        <div style={{flex: 1}}>
                                            <div style={{
                                                fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
                                                color: 'rgba(255, 255, 255, 0.9)',
                                                fontWeight: 'bold',
                                                marginBottom: '0.25rem',
                                                letterSpacing: '0.05em'
                                            }}>
                                                פעילות {index + 1} מתוך {currentStep.cards.length}
                                            </div>
                                            <h3 style={{
                                                fontSize: 'clamp(1.3rem, 3vw, 1.7rem)',
                                                margin: 0,
                                                color: 'white',
                                                fontFamily: 'var(--font-serif)',
                                                textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
                                            }}>
                                                הפעילות שלי #{index + 1}
                                            </h3>
                                        </div>
                                        <div style={{
                                            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                                            color: 'white',
                                            transition: 'transform 0.3s ease',
                                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
                                            marginRight: '1rem'
                                        }}>
                                            {isExpanded ? '▲' : '▼'}
                                        </div>
                                    </div>

                                    {/* Card Content - Expandable */}
                                    <div style={{
                                        maxHeight: isExpanded ? '2000px' : '0',
                                        opacity: isExpanded ? 1 : 0,
                                        transition: 'max-height 0.5s ease, opacity 0.4s ease',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            padding: 'clamp(1.5rem, 3vw, 2.5rem)'
                                        }}>
                                            <div style={{
                                                padding: 'clamp(1.5rem, 3vw, 2rem)',
                                                background: 'rgba(160, 132, 232, 0.15)',
                                                borderRadius: '16px',
                                                border: '2px solid rgba(160, 132, 232, 0.3)'
                                            }}>
                                                <p style={{
                                                    fontSize: 'clamp(1.05rem, 2.5vw, 1.3rem)',
                                                    lineHeight: 2,
                                                    margin: 0,
                                                    whiteSpace: 'pre-wrap',
                                                    color: 'var(--white)',
                                                    fontWeight: '500'
                                                }}>{card.learner_activity}</p>
                                            </div>

                                            {/* Encouragement Badge */}
                                            <div style={{
                                                marginTop: 'clamp(1.5rem, 3vw, 2rem)',
                                                textAlign: 'center',
                                                padding: 'clamp(1rem, 2.5vw, 1.5rem)',
                                                background: 'linear-gradient(135deg, rgba(127, 217, 87, 0.2), rgba(86, 217, 137, 0.15))',
                                                borderRadius: '12px',
                                                border: '2px solid var(--primary-color)'
                                            }}>
                                                <p style={{
                                                    fontSize: 'clamp(1rem, 2.2vw, 1.2rem)',
                                                    margin: 0,
                                                    color: 'var(--primary-light)',
                                                    fontWeight: 'bold',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '0.5rem'
                                                }}>
                                                    <span style={{fontSize: 'clamp(1.5rem, 3vw, 1.8rem)'}}>⭐</span>
                                                    <span>יאללה, בהצלחה!</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick View Summary - When Collapsed */}
                                    {!isExpanded && (
                                        <div style={{
                                            padding: 'clamp(1rem, 2.5vw, 1.5rem)',
                                            background: 'rgba(160, 132, 232, 0.05)',
                                            borderTop: '1px solid rgba(160, 132, 232, 0.2)',
                                            fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                                            color: 'var(--text-light)',
                                            textAlign: 'center',
                                            fontStyle: 'italic'
                                        }}>
                                            לחצו כאן לצפייה בפעילות המלאה
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Feedback and Next Step Section */}
            <div style={{
                background: 'linear-gradient(145deg, rgba(127, 217, 87, 0.1), rgba(160, 132, 232, 0.1))',
                borderRadius: '24px',
                padding: 'clamp(2rem, 4vw, 3rem)',
                marginTop: 'clamp(2rem, 4vw, 3rem)',
                border: '3px solid var(--primary-color)',
                boxShadow: '0 12px 48px rgba(0,0,0,0.15)',
                textAlign: 'center'
            }}>
                <h3 style={{
                    fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
                    marginBottom: 'clamp(1rem, 2.5vw, 1.5rem)',
                    color: 'var(--primary-color)',
                    fontFamily: 'var(--font-serif)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem'
                }}>
                    <span style={{fontSize: 'clamp(2rem, 5vw, 2.5rem)'}}>📝</span>
                    <span>איך היה השלב הזה?</span>
                </h3>

                <p style={{
                    fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
                    color: 'var(--text-secondary)',
                    marginBottom: 'clamp(1.5rem, 3vw, 2rem)',
                    lineHeight: 1.8,
                    maxWidth: '800px',
                    margin: '0 auto clamp(1.5rem, 3vw, 2rem)'
                }}>
                    {activeProfile && `${activeProfile.name}, `}
                    המשוב שלכם עוזר לי להתאים את השלב הבא במדויק לצרכים שלכם! ספרו לי איך הלך, מה היה מעניין, ומה הייתם רוצים לשפר.
                </p>

                <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: 'clamp(0.5rem, 1.5vw, 1rem)',
                    marginBottom: 'clamp(1.5rem, 3vw, 2rem)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
                }}>
                    <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="לדוגמה: היה נהדר! הילד/ה אהב/ה במיוחד את... / היה קצת קשה ב... / הייתי רוצה להתמקד יותר ב... / הילד/ה התקשה קצת עם... אבל הצליח/ה!"
                        style={{
                            width: '100%',
                            minHeight: 'clamp(120px, 20vw, 160px)',
                            fontSize: 'clamp(1rem, 2.2vw, 1.2rem)',
                            padding: 'clamp(1rem, 2.5vw, 1.5rem)',
                            border: '3px solid var(--primary-color)',
                            borderRadius: '12px',
                            fontFamily: 'inherit',
                            resize: 'vertical',
                            transition: 'all 0.3s ease',
                            lineHeight: 1.7
                        }}
                        disabled={isGenerating || isLastStep}
                        className="plan-feedback-textarea"
                    />
                </div>

                <button
                    onClick={() => onNextStep(feedback)}
                    style={{
                        ...styles.button,
                        fontSize: 'clamp(1.1rem, 2.8vw, 1.4rem)',
                        padding: 'clamp(1rem, 2.5vw, 1.5rem) clamp(2.5rem, 6vw, 4rem)',
                        background: isLastStep
                            ? 'linear-gradient(135deg, #FFD700, #FFA500)'
                            : 'linear-gradient(135deg, var(--primary-color), var(--primary-light))',
                        boxShadow: '0 8px 32px rgba(127, 217, 87, 0.4)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 'clamp(0.75rem, 2vw, 1rem)',
                        fontWeight: 'bold',
                        transition: 'all 0.3s ease',
                        opacity: isGenerating ? 0.6 : 1,
                        transform: isGenerating ? 'scale(0.98)' : 'scale(1)'
                    }}
                    disabled={isGenerating || isLastStep}
                    className="plan-next-step-button"
                >
                    <span style={{fontSize: 'clamp(1.5rem, 3.5vw, 2rem)'}}>
                        {isLastStep ? '🎉' : '➡️'}
                    </span>
                    <span>{isLastStep ? 'התוכנית הושלמה בהצלחה!' : 'המשך לשלב הבא'}</span>
                </button>

                {!isLastStep && (
                    <p style={{
                        marginTop: 'clamp(1rem, 2vw, 1.5rem)',
                        fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                        color: 'var(--text-light)',
                        fontStyle: 'italic'
                    }}>
                        💡 ככל שתספקו משוב מפורט יותר, כך השלב הבא יותאם טוב יותר עבורכם
                    </p>
                )}
            </div>
        </div>
    );
};

// --- NEW COMPONENT: GeneratedWorksheetView ---
const GeneratedWorksheetView = ({ worksheetData, onBack, topic }: { worksheetData: any, onBack: () => void, topic: string }) => {
    const { activeProfile } = useAppContext();
    const currentYear = new Date().getFullYear();

    return (
        <div className="fade-in" style={{
            minHeight: '100vh',
            padding: 'clamp(1rem, 3vw, 2rem)',
            background: 'linear-gradient(135deg, rgba(26, 46, 26, 0.3), rgba(36, 60, 36, 0.2))',
            position: 'relative'
        }}>
            {/* Floating decorative elements */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: 'none',
                overflow: 'hidden',
                zIndex: 0,
                opacity: 0.1
            }}>
                {[...Array(10)].map((_, i) => (
                    <div
                        key={i}
                        style={{
                            position: 'absolute',
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            fontSize: `${Math.random() * 3 + 1}rem`,
                            color: 'var(--primary-color)',
                            animation: `float ${Math.random() * 20 + 15}s linear infinite`,
                            animationDelay: `${Math.random() * 5}s`
                        }}
                    >
                        {['📚', '✏️', '📝', '🎯', '⭐'][Math.floor(Math.random() * 5)]}
                    </div>
                ))}
            </div>

            <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 'clamp(1.5rem, 3vw, 2.5rem)',
                    padding: 'clamp(1.5rem, 3vw, 2rem)',
                    background: 'linear-gradient(145deg, rgba(127, 217, 87, 0.2), rgba(100, 200, 100, 0.15))',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '20px',
                    border: '3px solid rgba(127, 217, 87, 0.4)',
                    boxShadow: '0 8px 32px rgba(127, 217, 87, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                    position: 'relative',
                    overflow: 'hidden'
                }} className="no-print">
                    {/* Animated gradient overlay */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '3px',
                        background: 'linear-gradient(90deg, transparent, var(--primary-color), var(--secondary-color), transparent)',
                        backgroundSize: '200% 100%',
                        animation: 'gradientFlow 3s ease infinite'
                    }} />

                    <div style={{flex: 1, position: 'relative', zIndex: 1}}>
                        <h1 style={{
                            ...styles.mainTitle,
                            textAlign: 'right',
                            marginBottom: '0.75rem',
                            fontSize: 'clamp(2rem, 5vw, 3rem)',
                            background: 'linear-gradient(135deg, var(--primary-light), var(--secondary-color))',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            textShadow: 'none',
                            fontWeight: 900,
                            letterSpacing: '-0.5px',
                            lineHeight: 1.2
                        }}>{worksheetData.title}</h1>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem 1.25rem',
                            background: 'linear-gradient(135deg, rgba(127, 217, 87, 0.3), rgba(86, 217, 137, 0.2))',
                            borderRadius: '50px',
                            border: '2px solid rgba(127, 217, 87, 0.5)',
                            backdropFilter: 'blur(10px)'
                        }}>
                            <span style={{
                                fontSize: '1.5rem',
                                filter: 'drop-shadow(0 2px 4px rgba(127, 217, 87, 0.5))'
                            }}>📝</span>
                            <span style={{
                                fontSize: 'clamp(1rem, 2.2vw, 1.2rem)',
                                color: 'var(--text-primary)',
                                fontWeight: 600
                            }}>דף תרגול וסיכום • {topic}</span>
                        </div>
                    </div>

                    <div style={{
                        display: 'flex',
                        gap: '1rem',
                        flexWrap: 'wrap',
                        position: 'relative',
                        zIndex: 1
                    }}>
                        <button
                            onClick={() => window.print()}
                            style={{
                                ...styles.button,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: 'clamp(1rem, 2.5vw, 1.25rem) clamp(1.5rem, 4vw, 2rem)',
                                fontSize: 'clamp(1rem, 2.2vw, 1.2rem)',
                                background: 'linear-gradient(135deg, var(--primary-color), var(--primary-light))',
                                boxShadow: '0 6px 20px rgba(127, 217, 87, 0.4)',
                                border: 'none',
                                borderRadius: '12px',
                                fontWeight: 700,
                                transition: 'all 0.3s ease',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-3px)';
                                e.currentTarget.style.boxShadow = '0 8px 28px rgba(127, 217, 87, 0.5)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(127, 217, 87, 0.4)';
                            }}
                        >
                            <span style={{fontSize: '1.5rem'}}>🖨️</span>
                            <span>הדפסה</span>
                        </button>
                        <button
                            onClick={onBack}
                            style={{
                                ...styles.button,
                                background: 'linear-gradient(135deg, var(--secondary-color), var(--accent-color))',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: 'clamp(1rem, 2.5vw, 1.25rem) clamp(1.5rem, 4vw, 2rem)',
                                fontSize: 'clamp(1rem, 2.2vw, 1.2rem)',
                                boxShadow: '0 6px 20px rgba(160, 132, 232, 0.4)',
                                border: 'none',
                                borderRadius: '12px',
                                fontWeight: 700,
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-3px)';
                                e.currentTarget.style.boxShadow = '0 8px 28px rgba(160, 132, 232, 0.5)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(160, 132, 232, 0.4)';
                            }}
                        >
                            <span style={{fontSize: '1.5rem'}}>↩️</span>
                            <span>חזרה לתוכנית</span>
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes float {
                    0% { transform: translateY(0) rotate(0deg); opacity: 0.1; }
                    50% { opacity: 0.3; }
                    100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
                }

                @keyframes gradientFlow {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
            `}</style>

            <div className="printable-area" style={{
                maxWidth: '900px',
                margin: '0 auto',
                background: 'white',
                borderRadius: '20px',
                boxShadow: '0 12px 48px rgba(0, 0, 0, 0.3)',
                overflow: 'hidden',
                border: '3px solid var(--primary-color)'
            }}>
                 <header style={{
                     background: 'linear-gradient(135deg, var(--primary-color), var(--primary-light))',
                     padding: 'clamp(2rem, 4vw, 3rem)',
                     textAlign: 'center',
                     position: 'relative',
                     overflow: 'hidden'
                 }}>
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                        opacity: 0.3
                    }}></div>
                    <div style={{position: 'relative', zIndex: 1}}>
                        <div style={{
                            fontSize: 'clamp(2rem, 5vw, 3rem)',
                            fontWeight: 'bold',
                            color: 'white',
                            marginBottom: '0.5rem',
                            textShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                            fontFamily: 'var(--font-serif)'
                        }}>✨ גאון של אמא ✨</div>
                        <h1 style={{
                            fontSize: 'clamp(1.5rem, 4vw, 2.2rem)',
                            color: 'white',
                            margin: '1rem 0',
                            textShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                            fontFamily: 'var(--font-serif)',
                            fontWeight: 'bold'
                        }}>{worksheetData.title}</h1>
                        <h2 style={{
                            fontSize: 'clamp(1.2rem, 3vw, 1.6rem)',
                            color: 'rgba(255, 255, 255, 0.95)',
                            margin: 0,
                            fontWeight: 'normal'
                        }}>עבור: <strong>{activeProfile?.name}</strong></h2>
                    </div>
                 </header>

                <div style={{
                    padding: 'clamp(2rem, 4vw, 3rem)',
                    color: '#1a1a1a'
                }}>
                    {worksheetData.imageUrl && (
                        <div style={{
                            textAlign: 'center',
                            marginBottom: 'clamp(2rem, 4vw, 3rem)'
                        }}>
                            <img
                                src={worksheetData.imageUrl}
                                alt={worksheetData.title}
                                style={{
                                    maxWidth: '100%',
                                    height: 'auto',
                                    borderRadius: '16px',
                                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                                    border: '3px solid var(--primary-light)'
                                }}
                            />
                        </div>
                    )}

                    <div style={{
                        background: 'linear-gradient(145deg, rgba(127, 217, 87, 0.1), rgba(100, 200, 100, 0.05))',
                        padding: 'clamp(1.5rem, 3vw, 2rem)',
                        borderRadius: '16px',
                        border: '2px solid rgba(127, 217, 87, 0.3)',
                        marginBottom: 'clamp(2rem, 4vw, 3rem)',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
                    }}>
                        <p style={{
                            fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
                            lineHeight: 1.8,
                            margin: 0,
                            color: '#2d2d2d',
                            whiteSpace: 'pre-wrap'
                        }}>
                            <strong style={{
                                color: 'var(--primary-color)',
                                fontSize: 'clamp(1.2rem, 2.8vw, 1.5rem)',
                                display: 'block',
                                marginBottom: '0.75rem'
                            }}>📖 מבוא:</strong>
                            {worksheetData.introduction}
                        </p>
                    </div>

                    <div style={{
                        marginBottom: 'clamp(2rem, 4vw, 3rem)'
                    }}>
                        <h3 style={{
                            fontSize: 'clamp(1.5rem, 3.5vw, 2rem)',
                            color: 'var(--primary-color)',
                            marginBottom: 'clamp(1.5rem, 3vw, 2rem)',
                            fontFamily: 'var(--font-serif)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            paddingBottom: '0.75rem',
                            borderBottom: '3px solid var(--primary-light)'
                        }}>
                            <span>✏️</span>
                            <span>תרגילים</span>
                        </h3>
                        {worksheetData.exercises.map((ex: any, index: number) => (
                            <div
                                key={index}
                                style={{
                                    background: index % 2 === 0
                                        ? 'linear-gradient(145deg, rgba(127, 217, 87, 0.05), rgba(100, 200, 100, 0.03))'
                                        : 'linear-gradient(145deg, rgba(160, 132, 232, 0.05), rgba(140, 112, 212, 0.03))',
                                    padding: 'clamp(1.5rem, 3vw, 2rem)',
                                    borderRadius: '16px',
                                    border: `2px solid ${index % 2 === 0 ? 'rgba(127, 217, 87, 0.3)' : 'rgba(160, 132, 232, 0.3)'}`,
                                    marginBottom: 'clamp(1.5rem, 3vw, 2rem)',
                                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                                    pageBreakInside: 'avoid'
                                }}
                            >
                                <h4 style={{
                                    fontSize: 'clamp(1.2rem, 2.8vw, 1.6rem)',
                                    marginBottom: 'clamp(1rem, 2vw, 1.5rem)',
                                    color: index % 2 === 0 ? 'var(--primary-color)' : 'var(--secondary-color)',
                                    fontFamily: 'var(--font-serif)',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '0.5rem'
                                }}>
                                    <span style={{
                                        background: index % 2 === 0 ? 'var(--primary-color)' : 'var(--secondary-color)',
                                        color: 'white',
                                        borderRadius: '50%',
                                        width: 'clamp(2rem, 5vw, 2.5rem)',
                                        height: 'clamp(2rem, 5vw, 2.5rem)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 'clamp(1rem, 2.5vw, 1.3rem)',
                                        fontWeight: 'bold',
                                        flexShrink: 0,
                                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                                    }}>{index + 1}</span>
                                    <span style={{flex: 1}}>{ex.question}</span>
                                </h4>
                                <div style={{
                                    minHeight: 'clamp(100px, 20vw, 150px)',
                                    background: 'white',
                                    borderRadius: '12px',
                                    border: '2px dashed #ccc',
                                    padding: 'clamp(1rem, 2vw, 1.5rem)',
                                    marginTop: '1rem'
                                }}>
                                    <p style={{
                                        color: '#999',
                                        fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
                                        fontStyle: 'italic',
                                        margin: 0
                                    }}>מקום לתשובה שלך...</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{
                        background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.15), rgba(255, 152, 0, 0.1))',
                        padding: 'clamp(1.5rem, 3vw, 2rem)',
                        borderRadius: '16px',
                        border: '2px solid rgba(255, 193, 7, 0.4)',
                        textAlign: 'center',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
                    }}>
                        <p style={{
                            fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
                            lineHeight: 1.8,
                            margin: 0,
                            color: '#2d2d2d',
                            fontWeight: 'bold',
                            whiteSpace: 'pre-wrap'
                        }}>
                            <span style={{
                                fontSize: 'clamp(2rem, 4vw, 2.5rem)',
                                display: 'block',
                                marginBottom: '0.5rem'
                            }}>✨ 🌟 ⭐</span>
                            {worksheetData.motivational_message}
                        </p>
                    </div>
                </div>

                 <footer style={{
                     background: 'linear-gradient(135deg, rgba(26, 46, 26, 0.95), rgba(36, 60, 36, 0.9))',
                     padding: 'clamp(1.5rem, 3vw, 2rem)',
                     textAlign: 'center',
                     color: 'var(--text-light)',
                     fontSize: 'clamp(0.85rem, 2vw, 1rem)',
                     borderTop: '3px solid var(--primary-color)'
                 }}>
                    <p style={{margin: 0}}>
                        נוצר באמצעות פלטפורמת <strong style={{color: 'var(--primary-light)'}}>"גאון של אמא"</strong> © {currentYear} ZBANG. כל הזכויות שמורות.
                    </p>
                </footer>
            </div>
        </div>
    );
};


// --- Original InteractiveWorkbook for "חוברת עבודה" path ---
const InteractiveWorkbook = ({ workbook, onReset }: { workbook: any; onReset: () => void; }) => {
    const { activeProfile, getUserAPIKey } = useAppContext();
    const [answers, setAnswers] = useState<{ [key: number]: string }>({});
    const [result, setResult] = useState<{ score: number, feedback: string } | null>(null);
    const [isChecking, setIsChecking] = useState(false);

    // Get API key from user (if assigned) or fallback to global
    const userApiKey = getUserAPIKey();
    const apiKey = userApiKey || process.env.API_KEY || '';
    
    // Create AI instance with current API key - will update when API key changes
    const ai = useMemo(() => {
        if (!apiKey) {
            console.error('🔴 WorkbookCreator (InteractiveWorkbook): No API key available (neither user key nor global)');
            console.error('🔴 Check vite.config.ts and .env.production file, or assign API key to user');
            return new GoogleGenAI({ apiKey: '' }); // Create empty instance as fallback
        }
        
        if (userApiKey) {
            console.log('✅ WorkbookCreator (InteractiveWorkbook): Using user API key (length:', apiKey.length, ')');
        } else {
            console.log('✅ WorkbookCreator (InteractiveWorkbook): Using global API key (length:', apiKey.length, ')');
        }
        
        return new GoogleGenAI({ apiKey });
    }, [apiKey, userApiKey]);
    const currentYear = new Date().getFullYear();

    const handleAnswerChange = (index: number, value: string) => {
        setAnswers(prev => ({ ...prev, [index]: value }));
    };

    const handleCheckAnswers = async () => {
        setIsChecking(true);
        setResult(null);
        
        const submission = workbook.exercises.map((ex: any, index: number) => ({
            question: ex.question_text,
            correct_answer: ex.correct_answer,
            user_answer: answers[index] || "לא נענה"
        }));

        const prompt = `You are a helpful and encouraging teacher reviewing a child's workbook.
        Child's Name: ${activeProfile?.name}.
        Here is the child's submission:
        ${JSON.stringify(submission, null, 2)}

        Please evaluate the answers. Provide a score as a percentage and encouraging, constructive feedback in Hebrew.
        The feedback should praise the effort, gently point out any mistakes, and offer positive reinforcement.
        Return a valid JSON object with "score" (a number) and "feedback" (a string).`;
        
        try {
            const schema = {type: Type.OBJECT, properties: {score: {type: Type.NUMBER}, feedback: {type: Type.STRING}}, required: ["score", "feedback"]};
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
            if (!response.text) throw new Error("API did not return grading feedback.");
            const data = JSON.parse(response.text.trim());
            setResult(data);
        } catch (err) {
            console.error(err);
            setResult({ score: 0, feedback: 'הייתה שגיאה בבדיקת התשובות. נסו שוב.' });
        } finally {
            setIsChecking(false);
        }
    };
    
    return (
        <div className="fade-in" style={{
            minHeight: '100vh',
            padding: 'clamp(1rem, 3vw, 2rem)',
            background: 'linear-gradient(135deg, rgba(26, 46, 26, 0.3), rgba(36, 60, 36, 0.2))'
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'clamp(1.5rem, 3vw, 2.5rem)',
                padding: 'clamp(1rem, 2vw, 1.5rem)',
                background: 'linear-gradient(145deg, rgba(127, 217, 87, 0.15), rgba(100, 200, 100, 0.1))',
                borderRadius: '16px',
                border: '2px solid rgba(127, 217, 87, 0.3)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                flexWrap: 'wrap',
                gap: '1rem'
            }} className="no-print">
                <div style={{flex: 1, minWidth: '300px'}}>
                     <h1 style={{
                         ...styles.mainTitle,
                         textAlign: 'right',
                         marginBottom: '0.5rem',
                         fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
                         background: 'linear-gradient(135deg, var(--primary-light), var(--secondary-color))',
                         WebkitBackgroundClip: 'text',
                         WebkitTextFillColor: 'transparent',
                         backgroundClip: 'text'
                     }}>{workbook.title}</h1>
                     <p style={{
                         ...styles.subtitle,
                         textAlign: 'right',
                         margin: 0,
                         fontSize: 'clamp(1rem, 2vw, 1.2rem)',
                         color: 'var(--text-light)',
                         lineHeight: 1.6
                     }}>📚 {workbook.introduction}</p>
                </div>
                <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
                    <button
                        onClick={() => window.print()}
                        style={{
                            ...styles.button,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1.25rem, 3vw, 1.75rem)',
                            fontSize: 'clamp(0.95rem, 2vw, 1.1rem)'
                        }}
                    >
                        <span>🖨️</span>
                        <span>הדפסת חוברת ריקה</span>
                    </button>
                    <button
                        onClick={onReset}
                        style={{
                            ...styles.button,
                            background: 'linear-gradient(135deg, var(--secondary-color), var(--accent-color))',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1.25rem, 3vw, 1.75rem)',
                            fontSize: 'clamp(0.95rem, 2vw, 1.1rem)'
                        }}
                    >
                        <span>🔄</span>
                        <span>יצירה מחדש</span>
                    </button>
                </div>
            </div>

            <div className="printable-area" style={{
                maxWidth: '900px',
                margin: '0 auto',
                background: 'white',
                borderRadius: '20px',
                boxShadow: '0 12px 48px rgba(0, 0, 0, 0.3)',
                overflow: 'hidden',
                border: '3px solid var(--primary-color)'
            }}>
                 <div className="workbook-print-cover" style={{
                     background: 'linear-gradient(135deg, var(--primary-color), var(--primary-light))',
                     padding: 'clamp(3rem, 5vw, 4rem)',
                     textAlign: 'center',
                     position: 'relative',
                     overflow: 'hidden'
                 }}>
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                        opacity: 0.3
                    }}></div>
                    <div style={{position: 'relative', zIndex: 1}}>
                        <div style={{
                            fontSize: 'clamp(2.5rem, 6vw, 4rem)',
                            marginBottom: 'clamp(1rem, 2vw, 1.5rem)'
                        }}>📚</div>
                        <div style={{
                            fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                            fontWeight: 'bold',
                            color: 'white',
                            marginBottom: '0.5rem',
                            textShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                            fontFamily: 'var(--font-serif)'
                        }}>✨ גאון של אמא ✨</div>
                        <h1 style={{
                            fontSize: 'clamp(2rem, 5vw, 3rem)',
                            marginBottom: 'clamp(0.75rem, 2vw, 1rem)',
                            color: 'white',
                            textShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                            fontFamily: 'var(--font-serif)',
                            fontWeight: 'bold'
                        }}>{workbook.title}</h1>
                        <h2 style={{
                            fontSize: 'clamp(1.3rem, 3vw, 1.8rem)',
                            marginBottom: 'clamp(1rem, 2vw, 1.5rem)',
                            color: 'rgba(255, 255, 255, 0.95)',
                            fontWeight: 'normal'
                        }}>עבור: <strong style={{fontSize: 'clamp(1.4rem, 3.2vw, 2rem)'}}>{activeProfile?.name}</strong></h2>
                        <div style={{
                            maxWidth: 'clamp(400px, 70vw, 700px)',
                            margin: '0 auto',
                            background: 'rgba(255, 255, 255, 0.15)',
                            padding: 'clamp(1rem, 2vw, 1.5rem)',
                            borderRadius: '12px',
                            backdropFilter: 'blur(10px)'
                        }}>
                            <p style={{
                                fontSize: 'clamp(1rem, 2.5vw, 1.3rem)',
                                lineHeight: 1.7,
                                color: 'white',
                                margin: 0
                            }}>{workbook.introduction}</p>
                        </div>
                    </div>
                </div>

                <div style={{
                    padding: 'clamp(2rem, 4vw, 3rem)',
                    background: 'white'
                }}>
                    {workbook.exercises.map((ex: any, index: number) => (
                    <div key={index} className="workbook-print-page page-break-inside-avoid" style={{
                        padding: 'clamp(1.5rem, 3vw, 2.5rem)',
                        borderBottom: '2px solid var(--glass-border)',
                        marginBottom: 'clamp(1rem, 2vw, 1.5rem)',
                        background: 'white',
                        borderRadius: '12px',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                        pageBreakInside: 'avoid'
                    }}>
                        <h4 style={{
                            fontSize: 'clamp(1.3rem, 3vw, 1.8rem)',
                            marginBottom: 'clamp(0.75rem, 2vw, 1rem)',
                            color: 'var(--primary-color)',
                            fontFamily: 'var(--font-serif)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            paddingBottom: 'clamp(0.5rem, 1.5vw, 0.75rem)',
                            borderBottom: '2px solid var(--primary-color)'
                        }}>
                            <span>❓</span>
                            <span>תרגיל {index + 1}: {ex.question_text}</span>
                        </h4>
                        <div className="no-print" style={{
                            marginTop: 'clamp(1rem, 2vw, 1.5rem)',
                            padding: 'clamp(1rem, 2vw, 1.5rem)',
                            background: 'var(--glass-bg)',
                            borderRadius: '12px',
                            border: '2px solid var(--glass-border)'
                        }}>
                            {ex.question_type === 'multiple_choice' ? (
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 'clamp(0.75rem, 2vw, 1rem)'
                                }}>
                                    {ex.options.map((opt: string, i: number) => (
                                        <label key={i} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'clamp(0.75rem, 2vw, 1rem)',
                                            padding: 'clamp(0.75rem, 2vw, 1rem)',
                                            background: 'rgba(127, 217, 87, 0.1)',
                                            borderRadius: '10px',
                                            border: '2px solid rgba(127, 217, 87, 0.3)',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            fontSize: 'clamp(1rem, 2.5vw, 1.2rem)'
                                        }} onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(127, 217, 87, 0.2)';
                                            e.currentTarget.style.transform = 'translateX(-5px)';
                                        }} onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(127, 217, 87, 0.1)';
                                            e.currentTarget.style.transform = 'translateX(0)';
                                        }}>
                                            <input 
                                                type="radio" 
                                                name={`q_${index}`} 
                                                value={opt} 
                                                onChange={(e) => handleAnswerChange(index, e.target.value)}
                                                style={{
                                                    width: 'clamp(20px, 4vw, 24px)',
                                                    height: 'clamp(20px, 4vw, 24px)',
                                                    cursor: 'pointer'
                                                }}
                                            />
                                            <strong style={{color: 'var(--primary-color)', marginLeft: '0.5rem'}}>{String.fromCharCode(1488 + i)}.</strong>
                                            <span style={{flex: 1}}>{opt}</span>
                                        </label>
                                    ))}
                                </div>
                            ) : (
                                <input 
                                    type="text" 
                                    onChange={(e) => handleAnswerChange(index, e.target.value)} 
                                    style={{
                                        ...styles.input,
                                        fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
                                        padding: 'clamp(0.75rem, 2vw, 1rem)',
                                        width: '100%',
                                        transition: 'all 0.3s ease'
                                    }} 
                                    placeholder="התשובה שלך"
                                    className="workbook-answer-input"
                                />
                            )}
                        </div>
                         <div className="print-only" style={{
                             minHeight: 'clamp(80px, 15vw, 120px)',
                             border: '2px dashed var(--primary-color)',
                             borderRadius: '10px',
                             padding: 'clamp(1rem, 2vw, 1.5rem)',
                             background: 'linear-gradient(135deg, rgba(127, 217, 87, 0.05), rgba(100, 200, 100, 0.03))',
                             marginTop: 'clamp(1rem, 2vw, 1.5rem)'
                         }}>
                             <p style={{
                                 color: 'var(--text-light)',
                                 fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                                 fontStyle: 'italic',
                                 textAlign: 'center',
                                 margin: 0
                             }}>✍️ כתוב כאן את התשובה שלך</p>
                         </div>
                    </div>
                ))}
                
                <div className="print-only" style={{
                    marginTop: 'clamp(2rem, 4vw, 3rem)',
                    padding: 'clamp(2rem, 4vw, 3rem)',
                    background: 'linear-gradient(135deg, rgba(127, 217, 87, 0.15), rgba(100, 200, 100, 0.1))',
                    borderRadius: '16px',
                    border: '3px solid var(--primary-color)',
                    textAlign: 'center',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
                }}>
                    <h3 style={{
                        fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
                        marginBottom: 'clamp(1rem, 2vw, 1.5rem)',
                        color: 'var(--primary-color)',
                        fontFamily: 'var(--font-serif)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                    }}>
                        <span>🎉</span>
                        <span>סיימנו! כל הכבוד!</span>
                    </h3>
                    <p style={{
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.8,
                        fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
                        color: '#333',
                        maxWidth: 'clamp(400px, 60vw, 700px)',
                        margin: '0 auto'
                    }}>{workbook.conclusion}</p>
                </div>
                </div>

                <div className="no-print" style={{
                    padding: 'clamp(1.5rem, 3vw, 2.5rem)',
                    marginTop: 'clamp(2rem, 4vw, 3rem)'
                }}>
                    {isChecking && <Loader message="בודק תשובות... ⏳" />}
                    {!result && !isChecking && (
                        <div style={{textAlign: 'center'}}>
                            <button
                                onClick={handleCheckAnswers}
                                disabled={isChecking}
                                style={{
                                    ...styles.button,
                                    fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
                                    padding: 'clamp(1rem, 2.5vw, 1.5rem) clamp(2rem, 4vw, 3rem)',
                                    background: 'linear-gradient(135deg, var(--secondary-color), var(--accent-color))',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    boxShadow: '0 8px 24px rgba(160, 132, 232, 0.4)',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                <span style={{fontSize: 'clamp(1.5rem, 3vw, 2rem)'}}>✅</span>
                                <span>בדיקת תשובות</span>
                            </button>
                            <p style={{
                                marginTop: 'clamp(1rem, 2vw, 1.5rem)',
                                color: 'var(--text-light)',
                                fontSize: 'clamp(0.95rem, 2vw, 1.1rem)'
                            }}>💡 ענו על כל השאלות ואז לחצו כאן לקבל משוב</p>
                        </div>
                    )}

                    {result && (
                        <div className="fade-in" style={{
                            background: 'linear-gradient(145deg, rgba(127, 217, 87, 0.15), rgba(100, 200, 100, 0.1))',
                            borderRadius: '20px',
                            border: '3px solid var(--primary-color)',
                            boxShadow: '0 12px 48px rgba(0, 0, 0, 0.2)',
                            overflow: 'hidden',
                            marginTop: 'clamp(2rem, 4vw, 3rem)'
                        }}>
                            <div style={{
                                background: 'linear-gradient(135deg, var(--primary-color), var(--primary-light))',
                                padding: 'clamp(1.5rem, 3vw, 2.5rem)',
                                textAlign: 'center',
                                position: 'relative'
                            }}>
                                <div style={{
                                    fontSize: 'clamp(3rem, 6vw, 4rem)',
                                    marginBottom: '0.5rem'
                                }}>
                                    {result.score >= 90 ? '🌟' : result.score >= 75 ? '⭐' : result.score >= 60 ? '✨' : '💪'}
                                </div>
                                <h3 style={{
                                    fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
                                    color: 'white',
                                    margin: 0,
                                    textShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                                    fontFamily: 'var(--font-serif)',
                                    fontWeight: 'bold'
                                }}>התוצאות שלי</h3>
                            </div>

                            <div style={{
                                padding: 'clamp(2rem, 4vw, 3rem)',
                                textAlign: 'center'
                            }}>
                                <div style={{
                                    marginBottom: 'clamp(2rem, 4vw, 3rem)'
                                }}>
                                    <div style={{
                                        fontSize: 'clamp(3rem, 6vw, 4.5rem)',
                                        fontWeight: 'bold',
                                        color: 'var(--primary-color)',
                                        marginBottom: '0.5rem',
                                        fontFamily: 'var(--font-serif)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.75rem'
                                    }}>
                                        <span>{result.score}%</span>
                                    </div>
                                    <p style={{
                                        fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
                                        color: 'var(--text-secondary)',
                                        margin: 0,
                                        fontWeight: 'bold'
                                    }}>הציון שלך</p>
                                </div>

                                <div style={{
                                    background: 'white',
                                    borderRadius: '16px',
                                    padding: 'clamp(1.5rem, 3vw, 2.5rem)',
                                    border: '2px solid rgba(127, 217, 87, 0.3)',
                                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                                    marginBottom: 'clamp(1.5rem, 3vw, 2rem)',
                                    textAlign: 'right'
                                }}>
                                    <h4 style={{
                                        fontSize: 'clamp(1.3rem, 3vw, 1.6rem)',
                                        color: 'var(--primary-color)',
                                        marginBottom: 'clamp(1rem, 2vw, 1.5rem)',
                                        fontFamily: 'var(--font-serif)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        justifyContent: 'flex-start'
                                    }}>
                                        <span>💬</span>
                                        <span>משוב מהמורה</span>
                                    </h4>
                                    <p style={{
                                        fontSize: 'clamp(1.05rem, 2.5vw, 1.3rem)',
                                        lineHeight: 1.8,
                                        color: '#2d2d2d',
                                        margin: 0,
                                        whiteSpace: 'pre-wrap'
                                    }}>{result.feedback}</p>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    gap: 'clamp(1rem, 2vw, 1.5rem)',
                                    justifyContent: 'center',
                                    flexWrap: 'wrap'
                                }}>
                                    <button
                                        onClick={() => setResult(null)}
                                        style={{
                                            ...styles.button,
                                            background: 'linear-gradient(135deg, var(--secondary-color), var(--accent-color))',
                                            fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
                                            padding: 'clamp(0.9rem, 2vw, 1.2rem) clamp(1.5rem, 3vw, 2rem)',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}
                                    >
                                        <span>🔄</span>
                                        <span>לנסות שוב</span>
                                    </button>
                                    <button
                                        onClick={() => window.print()}
                                        style={{
                                            ...styles.button,
                                            background: 'linear-gradient(135deg, var(--primary-color), var(--primary-light))',
                                            fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
                                            padding: 'clamp(0.9rem, 2vw, 1.2rem) clamp(1.5rem, 3vw, 2rem)',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}
                                    >
                                        <span>🖨️</span>
                                        <span>הדפסה</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="print-only print-footer">
                    <p>נוצר באמצעות פלטפורמת "גאון" © {currentYear} ZBANG. כל הזכויות שמורות.</p>
                </div>
            </div>
        </div>
    );
};


const subjects = [
    { name: 'מתמטיקה', icon: '🔢', color: '#4CAF50' },
    { name: 'שפה', icon: 'אב', color: '#9C27B0' },
    { name: 'אנגלית', icon: '🔤', color: '#2196F3' },
    { name: 'מדעים', icon: '🔬', color: '#FF9800' },
    { name: 'תנ"ך', icon: '📜', color: '#795548' },
    { name: 'היסטוריה', icon: '🏛️', color: '#FF5722' },
    { name: 'גאוגרפיה', icon: '🌍', color: '#00BCD4' },
    { name: 'קריאה', icon: '📖', color: '#E91E63' },
    { name: 'כתיבה', icon: '✍️', color: '#673AB7' },
    { name: 'גאומטריה', icon: '📐', color: '#009688' },
    { name: 'אמנות', icon: '🎨', color: '#F44336' },
    { name: 'מוזיקה', icon: '🎵', color: '#FFC107' },
    { name: 'טבע', icon: '🌿', color: '#8BC34A' },
];

const loadingMessages = [ "מגבש תוכנית למידה...", "יוצר חוברת עבודה אינטראקטיבית...", "משרטט איורים קסומים...", "מערבב צבעים של דמיון..." ];
const TOTAL_PLAN_STEPS = 10; // הגדלת מספר השלבים המקסימלי מ-5 ל-10

// Credit costs - will be loaded from context

interface LearningCenterProps {
    contentId?: number | null;
    contentType?: 'workbook' | 'learning_plan' | null;
    onContentLoaded?: () => void;
}

const LearningCenter = ({ contentId, contentType, onContentLoaded }: LearningCenterProps = {}) => {
    const { activeProfile, user, updateUserCredits, creditCosts, refreshCreditCosts, getUserAPIKey } = useAppContext();
    
    // Dynamic credit costs from context
    const PLAN_STEP_CREDITS = creditCosts.plan_step;
    const WORKSHEET_CREDITS = creditCosts.worksheet;
    const WORKBOOK_CREDITS = creditCosts.workbook;
    const TOPIC_SUGGESTIONS_CREDITS = creditCosts.topic_suggestions;
    const [creationType, setCreationType] = useState<'plan' | 'workbook'>('plan');
    const [subject, setSubject] = useState('');
    const [isOtherSubject, setIsOtherSubject] = useState(false);
    const [otherSubjectText, setOtherSubjectText] = useState('');
    const [topic, setTopic] = useState('');
    const [topicSuggestions, setTopicSuggestions] = useState<string[]>([]);
    const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
    const [goal, setGoal] = useState('');
    const [description, setDescription] = useState('');
    const [numExercises, setNumExercises] = useState(10);

    const [planHistory, setPlanHistory] = useState<any[]>([]);
    const [generatedWorksheet, setGeneratedWorksheet] = useState<any | null>(null);
    const [workbook, setWorkbook] = useState<any | null>(null);
    const [learningPlanId, setLearningPlanId] = useState<number | null>(null);
    const [workbookId, setWorkbookId] = useState<number | null>(null);
    const [isLoadingExisting, setIsLoadingExisting] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [currentLoadingMessage, setCurrentLoadingMessage] = useState(loadingMessages[0]);
    const [error, setError] = useState('');

    // Load existing content when contentId is provided
    useEffect(() => {
        const loadExistingContent = async () => {
            if (!contentId || !user || !activeProfile) return;
            
            setIsLoadingExisting(true);
            try {
                const { data, error } = await supabase
                    .from('content')
                    .select('*')
                    .eq('id', contentId)
                    .eq('user_id', user.id)
                    .single();

                if (error) throw error;

                if (data) {
                    const contentData = data.content_data as any;
                    
                    if (contentType === 'workbook' && contentData) {
                        setWorkbook(contentData);
                        setWorkbookId(data.id);
                        setCreationType('workbook');
                    } else if (contentType === 'learning_plan' && contentData?.plan_steps) {
                        setPlanHistory(contentData.plan_steps);
                        setLearningPlanId(data.id);
                        setCreationType('plan');
                    }
                }
            } catch (error) {
                console.error('Error loading content:', error);
                setError('שגיאה בטעינת התוכן');
            } finally {
                setIsLoadingExisting(false);
                if (onContentLoaded) onContentLoaded();
            }
        };

        if (contentId && contentType) {
            loadExistingContent();
        } else {
            // Reset for new content
            setPlanHistory([]);
            setWorkbook(null);
            setGeneratedWorksheet(null);
            setLearningPlanId(null);
            setWorkbookId(null);
        }
    }, [contentId, contentType, user?.id, activeProfile?.id]);

    // Get API key from user (if assigned) or fallback to global
    const userApiKey = getUserAPIKey();
    const apiKey = userApiKey || process.env.API_KEY || '';
    
    // Create AI instance with current API key - will update when API key changes
    const ai = useMemo(() => {
        if (!apiKey) {
            console.error('🔴 WorkbookCreator (LearningCenter): No API key available (neither user key nor global)');
            console.error('🔴 Check vite.config.ts and .env.production file, or assign API key to user');
            return new GoogleGenAI({ apiKey: '' }); // Create empty instance as fallback
        }
        
        if (userApiKey) {
            console.log('✅ WorkbookCreator (LearningCenter): Using user API key (length:', apiKey.length, ')');
        } else {
            console.log('✅ WorkbookCreator (LearningCenter): Using global API key (length:', apiKey.length, ')');
        }
        
        return new GoogleGenAI({ apiKey });
    }, [apiKey, userApiKey]);

    // Save learning plan to database
    const saveLearningPlanToDatabase = async () => {
        if (!activeProfile || !user || planHistory.length === 0) return;

        try {
            const planTitle = `${topic} - תוכנית למידה`;
            const planData = {
                user_id: user.id,
                profile_id: activeProfile.id,
                type: 'learning_plan',
                title: planTitle,
                content_data: {
                    plan_steps: planHistory,
                    topic: topic
                }
            };

            if (learningPlanId) {
                // Update existing plan
                const { error } = await supabase
                    .from('content')
                    .update(planData)
                    .eq('id', learningPlanId);

                if (error) throw error;
            } else {
                // Create new plan
                const { data, error } = await supabase
                    .from('content')
                    .insert(planData)
                    .select()
                    .single();

                if (error) throw error;
                if (data) {
                    setLearningPlanId(data.id);
                }
            }
        } catch (error) {
            console.error('Error saving learning plan to database:', error);
        }
    };

    // Save workbook to database
    const saveWorkbookToDatabase = async (workbookData: any) => {
        if (!activeProfile || !user || !workbookData) return;

        try {
            const workbookTitle = workbookData.title || `${topic} - חוברת עבודה`;
            const dataToSave = {
                user_id: user.id,
                profile_id: activeProfile.id,
                type: 'workbook',
                title: workbookTitle,
                content_data: workbookData
            };

            if (workbookId) {
                // Update existing workbook
                const { error } = await supabase
                    .from('content')
                    .update(dataToSave)
                    .eq('id', workbookId);

                if (error) throw error;
            } else {
                // Create new workbook
                const { data, error } = await supabase
                    .from('content')
                    .insert(dataToSave)
                    .select()
                    .single();

                if (error) throw error;
                if (data) {
                    setWorkbookId(data.id);
                }
            }
        } catch (error) {
            console.error('Error saving workbook to database:', error);
        }
    };

    // Save worksheet to database (save as workbook with type worksheet)
    const saveWorksheetToDatabase = async (worksheetData: any) => {
        if (!activeProfile || !user || !worksheetData) return;

        try {
            const worksheetTitle = worksheetData.title || `${topic} - דף תרגול`;
            const dataToSave = {
                user_id: user.id,
                profile_id: activeProfile.id,
                type: 'workbook',
                title: worksheetTitle,
                content_data: { ...worksheetData, type: 'worksheet' }
            };

            const { data, error } = await supabase
                .from('content')
                .insert(dataToSave)
                .select()
                .single();

            if (error) throw error;
            console.log('✅ Worksheet saved to database');
        } catch (error) {
            console.error('Error saving worksheet to database:', error);
        }
    };

    const resetForm = () => {
        setPlanHistory([]);
        setWorkbook(null);
        setGeneratedWorksheet(null);
        setError('');
        setTopicSuggestions([]);
        setLearningPlanId(null);
        setWorkbookId(null);
    };
    
    const fetchTopicSuggestions = async () => {
        const finalSubject = isOtherSubject ? otherSubjectText : subject;
        if (!finalSubject || !activeProfile || !user) return;
        
        // 🔄 Refresh credit costs BEFORE creation to ensure latest prices
        console.log('🔄 WorkbookCreator: Refreshing credit costs before topic suggestions...');
        await refreshCreditCosts();
        
        // Check if user has enough credits
        if (user.credits < TOPIC_SUGGESTIONS_CREDITS) {
            setError(`אין מספיק קרדיטים. נדרשים ${TOPIC_SUGGESTIONS_CREDITS} קרדיטים, יש לך ${user.credits}.`);
            return;
        }
        
        setIsFetchingSuggestions(true);
        setError('');
        setTopicSuggestions([]);

        const prompt = `Based on a child's profile (age: ${activeProfile.age}, interests: "${activeProfile.interests}"), suggest 5 engaging and specific learning topics in Hebrew for the subject "${finalSubject}".
        The topics should be short and appropriate for the child's age.
        Return a valid JSON object with a single key "topics" which is an array of 5 strings.`;

        try {
            const schema = {type: Type.OBJECT, properties: {topics: {type: Type.ARRAY, items: {type: Type.STRING}}}};
            const result = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema }});
            if (!result.text) throw new Error("API did not return topic suggestions.");
            const data = JSON.parse(result.text.trim());
            setTopicSuggestions(data.topics || []);
            
            // Deduct credits after successful generation
            await updateUserCredits(-TOPIC_SUGGESTIONS_CREDITS);
        } catch (err) {
            console.error(err);
            setError('לא הצלחתי למצוא הצעות. אפשר להזין נושא באופן ידני.');
        } finally {
            setIsFetchingSuggestions(false);
        }
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        const finalSubject = isOtherSubject ? otherSubjectText : subject;
        if (!finalSubject || !topic) {
            setError('נא לבחור תחום ידע ונושא מרכזי כדי להתחיל.');
            return;
        }
        setIsLoading(true);
        setPlanHistory([]);
        setWorkbook(null);
        setError('');

        if (creationType === 'plan') {
            await handleGeneratePlanStep(); // Generate the first step
        } else {
            await handleGenerateWorkbook();
        }
        
        setIsLoading(false);
    };

    const handleGeneratePlanStep = async (feedback = '') => {
        if (!user) return;
        
        // 🔄 Refresh credit costs BEFORE creation to ensure latest prices
        console.log('🔄 WorkbookCreator: Refreshing credit costs before plan step generation...');
        await refreshCreditCosts();
        
        // Check if user has enough credits
        if (user.credits < PLAN_STEP_CREDITS) {
            setError(`אין מספיק קרדיטים. נדרשים ${PLAN_STEP_CREDITS} קרדיטים, יש לך ${user.credits}.`);
            return;
        }
        
        setIsLoading(true);
        setCurrentLoadingMessage(`מכין את שלב ${planHistory.length + 1}...`);
        const finalSubject = isOtherSubject ? otherSubjectText : subject;
        try {
            const historyPrompt = planHistory.map((step, index) => `Step ${index + 1}: ${step.step_title}`).join('\n');

            const prompt = `You are an expert curriculum designer and pedagogical coach creating a step-by-step learning plan in Hebrew.
            
            Child Profile: 
            - Name: ${activeProfile!.name}
            - Age: ${activeProfile!.age} years old
            - Gender: ${activeProfile!.gender}
            - Interests: ${activeProfile!.interests}
            - Learning Goals: ${activeProfile!.learningGoals || 'לא מוגדר'}
            - Character: Based on the child's interests (${activeProfile!.interests}), create activities that match their personality and learning style.
            
            Plan Details: Subject: ${finalSubject}, Topic: "${topic}", Goal: "${goal || 'General understanding and enjoyment of the topic'}"
            
            ${planHistory.length > 0 ? `History of previous steps:\n${historyPrompt}` : ''}
            ${feedback ? `Feedback from the parent on the last step: "${feedback}"` : ''}
            
            IMPORTANT: The instructions must be:
            1. Very detailed and specific for the parent - step-by-step guidance
            2. Personalized based on the child's interests: ${activeProfile!.interests}
            3. Age-appropriate for ${activeProfile!.age} years old
            4. Engaging and fun for the child
            5. Clear and encouraging for the child

            Now, create the ${planHistory.length === 0 ? 'FIRST' : 'NEXT'} step of the plan. This is step number ${planHistory.length + 1}.
            The step must contain:
            1. "step_title": A concise, engaging title for the overall step.
            2. "cards": An array of exactly 5 distinct mini-activities. Each item in the array must be an object with:
                - "learner_activity": A fun and clear activity for the child.
                - "educator_guidance": A detailed pedagogical guide for the parent. This MUST be an object containing three keys:
                    - "objective": (string) The specific learning goal of this activity.
                    - "tips": (string) Actionable tips for the parent on how to present the activity, make it engaging, and create a positive learning environment.
                    - "potential_pitfalls": (string) Advice on what to do if the child struggles or makes common mistakes.

            Adhere strictly to the JSON schema. The entire output must be a valid JSON object.`;
            
            const guidanceSchema = { type: Type.OBJECT, properties: { objective: { type: Type.STRING }, tips: { type: Type.STRING }, potential_pitfalls: { type: Type.STRING } }, required: ["objective", "tips", "potential_pitfalls"] };
            const cardSchema = { type: Type.OBJECT, properties: { learner_activity: { type: Type.STRING }, educator_guidance: guidanceSchema }, required: ["learner_activity", "educator_guidance"] };
            const planStepSchema = { type: Type.OBJECT, properties: { step_title: { type: Type.STRING }, cards: { type: Type.ARRAY, items: cardSchema } }, required: ["step_title", "cards"] };

            const result = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt, config: { responseMimeType: "application/json", responseSchema: planStepSchema }});
            if (!result.text) throw new Error("API did not return text for the plan step.");
            let planStepData = JSON.parse(result.text.trim());
            
            setPlanHistory(prev => [...prev, planStepData]);
            
            // Deduct credits after successful generation
            await updateUserCredits(-PLAN_STEP_CREDITS);
            
            // Save learning plan to database
            await saveLearningPlanToDatabase();

        } catch (err) { handleError(err); } finally { setIsLoading(false); }
    };

    const handleGenerateWorksheetFromPlan = async () => {
        if (planHistory.length === 0 || !user) return;
        
        // 🔄 Refresh credit costs BEFORE creation to ensure latest prices
        console.log('🔄 WorkbookCreator: Refreshing credit costs before worksheet generation...');
        await refreshCreditCosts();
        
        // Check if user has enough credits
        if (user.credits < WORKSHEET_CREDITS) {
            setError(`אין מספיק קרדיטים. נדרשים ${WORKSHEET_CREDITS} קרדיטים, יש לך ${user.credits}.`);
            return;
        }
        
        setIsLoading(true);
        setCurrentLoadingMessage("יוצר דף תרגול מסכם...");
        const finalTopic = isOtherSubject ? otherSubjectText : topic;
        try {
            const historyForPrompt = JSON.stringify(planHistory.map(p => ({ title: p.step_title, activities: p.cards.map((c:any) => c.learner_activity) })));
            
            const prompt = `Based on the following learning plan history for ${activeProfile?.name} (age ${activeProfile?.age}, interests: ${activeProfile?.interests}) on the topic of "${finalTopic}":
            ${historyForPrompt}
            
            Create a single, printable practice worksheet in Hebrew that summarizes what has been learned.
            The worksheet must contain:
            1. "title": A suitable title.
            2. "introduction": A short, encouraging intro for the child.
            3. "exercises": An array of 3-5 simple exercise objects, each with a "question" string.
            4. "motivational_message": A final positive message.
            5. "image_prompt": An English prompt for a single, general illustration for the top of the worksheet. The image should be pleasant, related to the child's interests and the topic. CRITICAL: It must NOT contain any text, letters, or numbers.

            Return a single valid JSON object with this structure.`;

            const exerciseSchema = {type: Type.OBJECT, properties: {question: {type: Type.STRING}}, required: ['question']};
            const worksheetSchema = {type: Type.OBJECT, properties: {
                title: {type: Type.STRING}, introduction: {type: Type.STRING}, exercises: {type: Type.ARRAY, items: exerciseSchema},
                motivational_message: {type: Type.STRING}, image_prompt: {type: Type.STRING}
            }, required: ["title", "introduction", "exercises", "motivational_message", "image_prompt"]};

            const textResult = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt, config: { responseMimeType: "application/json", responseSchema: worksheetSchema }});
            if (!textResult.text) throw new Error("API did not return worksheet text.");
            const worksheetData = JSON.parse(textResult.text.trim());

            setCurrentLoadingMessage("מצייר תמונה יפה...");
            const imageResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [{ text: worksheetData.image_prompt }] }, config: { responseModalities: [Modality.IMAGE] } });

            // Validate image data
            const imagePart = imageResponse?.candidates?.[0]?.content.parts[0];
            let imageUrl = '';

            if (!imagePart?.inlineData || !imagePart.inlineData.data) {
                console.warn('🟡 WorkbookCreator: Image generation failed for worksheet, continuing without image');
                setError('שים לב: נוצר דף תרגול ללא תמונה. התוכן נשמר בהצלחה.');
            } else {
                imageUrl = `data:image/png;base64,${imagePart.inlineData.data}`;
            }

            // Validate worksheet data
            if (!worksheetData.exercises || worksheetData.exercises.length === 0) {
                throw new Error('דף התרגול לא כולל תרגילים. נסה שוב.');
            }

            setGeneratedWorksheet({ ...worksheetData, imageUrl });

            // Deduct credits after successful generation
            await updateUserCredits(-WORKSHEET_CREDITS);

            // Save worksheet to database
            await saveWorksheetToDatabase({ ...worksheetData, imageUrl });

            console.log('✅ WorkbookCreator: Worksheet generated and saved successfully');

        } catch (err) {
            console.error('❌ WorkbookCreator: Worksheet generation failed:', err);
            handleError(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleGenerateWorkbook = async () => {
        const finalSubject = isOtherSubject ? otherSubjectText : subject;
        if (!description) {
            setError('נא לתאר מה תרצו לתרגל בחוברת.');
            setIsLoading(false);
            return;
        }
        
        if (!user) return;
        
        // 🔄 Refresh credit costs BEFORE creation to ensure latest prices
        console.log('🔄 WorkbookCreator: Refreshing credit costs before workbook generation...');
        await refreshCreditCosts();
        
        // Check if user has enough credits
        if (user.credits < WORKBOOK_CREDITS) {
            setError(`אין מספיק קרדיטים. נדרשים ${WORKBOOK_CREDITS} קרדיטים, יש לך ${user.credits}.`);
            setIsLoading(false);
            return;
        }
        
        try {
            setCurrentLoadingMessage(loadingMessages[1]);
            const prompt = `🎓 אתה מעצב תוכניות לימוד מומחה ומחנך מנוסה המתמחה ביצירת חוברות עבודה מרתקות, אינטראקטיביות ופדגוגיות לילדים.

📋 **פרטי הילד והחוברת:**
- 👤 שם: ${activeProfile!.name}
- 🎂 גיל: ${activeProfile!.age} שנים
- ❤️ תחומי עניין: ${activeProfile!.interests}
- 📚 תחום לימוד: ${finalSubject}
- 🎯 נושא מרכזי: "${topic}"
- 📝 תיאור המשתמש: "${description}"
- 📊 מספר תרגילים: ${numExercises}

✨ **הנחיות מפורטות ליצירת חוברת מושלמת:**

1️⃣ **כותרת וניסוח:**
   - צור כותרת מרתקת ויצירתית שמשלבת את השם "${activeProfile!.name}" או מתייחסת לתחומי העניין שלו/ה
   - הכותרת צריכה להיות מזמינה ומעוררת סקרנות
   - דוגמה: "${activeProfile!.name} מגלה את עולם ה[נושא]" או "הרפתקאות ה[נושא] של ${activeProfile!.name}"

2️⃣ **מבוא מעורר מוטיבציה:**
   - כתוב מבוא אישי ומעודד (3-4 משפטים) המתייחס ישירות ל${activeProfile!.name}
   - שלב את תחומי העניין: ${activeProfile!.interests} באופן יצירתי
   - הסבר למה הנושא הזה מעניין וחשוב
   - יצור התרגשות וציפייה ללמידה
   - דוגמה: "שלום ${activeProfile!.name}! ידעת ש[משהו מעניין]? היום נצא להרפתקה מדהימה בעולם ה[נושא]..."

3️⃣ **תרגילים איכותיים ומגוונים:**
   עבור כל אחד מ-${numExercises} התרגילים, הקפד על:

   **סוגי תרגילים:**
   - שלב לפחות 2 סוגי שאלות שונים: 'multiple_choice' ו-'open_ended'
   - תרגילי בחירה מרובה: צור 4 אפשרויות, כאשר רק אחת נכונה
   - תרגילים פתוחים: שאלות שמעודדות חשיבה יצירתית וביטוי עצמאי

   **רמת קושי הדרגתית:**
   - התרגילים הראשונים: קלים יותר, משמשים חימום ובניית ביטחון
   - תרגילים אמצעיים: רמת קושי בינונית, משלבים מושגים
   - תרגילים אחרונים: מאתגרים יותר, מעודדים חשיבה מורכבת

   **התאמה לגיל ${activeProfile!.age}:**
   - שפה ברורה ומתאימה לגיל
   - מושגים שהילד/ה מכיר/ה מהחיים
   - רמת מורכבות מתאימה

   **שילוב תחומי עניין:**
   - קשר כל תרגיל אם אפשר לתחומי העניין: ${activeProfile!.interests}
   - דוגמאות ודימויים מעולמו/ה של ${activeProfile!.name}
   - הפוך את הלמידה לרלוונטית ומעניינת

   **ניסוח השאלות:**
   - שאלות ברורות וישירות
   - הימנע ממילים מסובכות מיותרות
   - הוסף הקשר למציאות או לדוגמאות

   **אפשרויות בשאלות רב-ברירתיות:**
   - כל 4 האפשרויות צריכות להיות הגיוניות ומתקבלות על הדעת
   - תשובה אחת בלבד נכונה
   - האפשרויות השגויות צריכות להיות קרובות לנכונה (לא מגוחכות)
   - סדר אקראי (לא תמיד התשובה הנכונה במקום ראשון)

4️⃣ **תשובות נכונות ומדויקות:**
   - עבור 'multiple_choice': רשום את התשובה הנכונה המדויקת מתוך האפשרויות
   - עבור 'open_ended': רשום תשובה לדוגמה מפורטת ואיכותית
   - תשובות פתוחות צריכות להיות עשירות אך לא יחידות - עודד יצירתיות

5️⃣ **סיכום מעודד:**
   - כתוב סיכום חיובי ומעצים (2-3 משפטים)
   - שבח את המאמץ והלמידה
   - הדגש מה ${activeProfile!.name} למד/ה
   - עודד להמשיך ללמוד ולחקור
   - הוסף אמוג'י מעודד 🌟
   - דוגמה: "כל הכבוד ${activeProfile!.name}! הראת ידע מדהים ב[נושא]. אתה/את ממש גאון/ית! המשך/י לחקור ולגלות עוד דברים מרתקים! 🌟"

6️⃣ **גיוון ואיכות:**
   - וודא שכל תרגיל שונה ומעניין
   - הימנע מחזרות או שאלות דומות מדי
   - כל תרגיל צריך ללמד או לבחון משהו חדש
   - שלב סוגי שאלות שונים (עובדות, הבנה, יישום, ניתוח)

7️⃣ **פדגוגיה ולמידה:**
   - כל תרגיל צריך להיות בעל מטרה למידה ברורה
   - התקדמות הגיונית בין התרגילים
   - חיזוק ידע קודם תוך הוספת ידע חדש
   - מסרים חינוכיים עדינים (ערכים, חשיבה ביקורתית)

🎯 **פורמט ה-JSON המדויק:**

{
  "title": "כותרת מרתקת ויצירתית המותאמת ל${activeProfile!.name}",
  "introduction": "מבוא אישי ומעורר מוטיבציה (3-4 משפטים) המתייחס ל${activeProfile!.name} ולתחומי העניין שלו/ה",
  "exercises": [
    {
      "question_text": "שאלה ברורה ומעניינת",
      "question_type": "multiple_choice" או "open_ended",
      "options": ["אופציה 1", "אופציה 2", "אופציה 3", "אופציה 4"] (רק ל-multiple_choice),
      "correct_answer": "התשובה הנכונה המדויקת"
    },
    ... (עוד ${numExercises - 1} תרגילים)
  ],
  "conclusion": "סיכום חיובי ומעצים המעודד את ${activeProfile!.name} להמשיך ללמוד"
}

💡 **זכור:** זו חוברת עבור ${activeProfile!.name} בן/בת ${activeProfile!.age}, שאוהב/ת ${activeProfile!.interests}. הפוך את הלמידה לחוויה מהנה, מעניינת ומותאמת אישית!`;
            
            const exerciseSchema = {
                type: Type.OBJECT, properties: {
                    question_text: { type: Type.STRING },
                    question_type: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correct_answer: { type: Type.STRING }
                }, required: ["question_text", "question_type", "correct_answer"]
            };
            const workbookSchema = {
                type: Type.OBJECT, properties: {
                    title: { type: Type.STRING }, introduction: { type: Type.STRING },
                    exercises: { type: Type.ARRAY, items: exerciseSchema },
                    conclusion: { type: Type.STRING }
                }, required: ["title", "introduction", "exercises", "conclusion"]
            };

            const result = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt, config: { responseMimeType: "application/json", responseSchema: workbookSchema }});
            if (!result.text) throw new Error("API did not return text for the workbook.");

            let workbookData;
            try {
                workbookData = JSON.parse(result.text.trim());
            } catch (parseError) {
                console.error('❌ WorkbookCreator: Failed to parse workbook JSON:', parseError);
                throw new Error('נכשל בפענוח התוצאה מהמערכת. נסה שוב.');
            }

            // Validate workbook data
            if (!workbookData.exercises || !Array.isArray(workbookData.exercises) || workbookData.exercises.length === 0) {
                throw new Error('החוברת לא כוללת תרגילים. נסה שוב עם תיאור שונה.');
            }

            // Validate each exercise has required fields
            const invalidExercises = workbookData.exercises.filter((ex: any) => !ex.question_text || !ex.correct_answer);
            if (invalidExercises.length > 0) {
                console.warn('🟡 WorkbookCreator: Some exercises are missing required fields:', invalidExercises);
            }

            setWorkbook(workbookData);

            // Deduct credits after successful generation
            await updateUserCredits(-WORKBOOK_CREDITS);

            // Save workbook to database
            await saveWorkbookToDatabase(workbookData);

            console.log('✅ WorkbookCreator: Workbook generated and saved successfully with', workbookData.exercises.length, 'exercises');

        } catch (err) { handleError(err); }
    };

    const handleError = (err: any) => {
        console.error(err);
        setError(err instanceof Error ? err.message : 'אוי, משהו השתבש.');
    };
    
    const handleSubjectClick = (s: string) => {
        setSubject(s);
        if (s === 'אחר...') {
            setIsOtherSubject(true);
        } else {
            setIsOtherSubject(false);
            setOtherSubjectText('');
        }
    };

    if (!activeProfile) {
        return <div style={styles.centered}><p>יש לבחור פרופיל בדשבורד ההורים כדי ליצור תוכן לימודי.</p></div>
    }
    if (isLoadingExisting) return <Loader message="טוען תוכן קיים..." />;
    if (isLoading) return <Loader message={currentLoadingMessage} />;
    if (generatedWorksheet) return <GeneratedWorksheetView worksheetData={generatedWorksheet} onBack={() => setGeneratedWorksheet(null)} topic={topic} />;
    if (planHistory.length > 0) return <GuidedPlanView planHistory={planHistory} onNextStep={handleGeneratePlanStep} onGenerateWorksheet={handleGenerateWorksheetFromPlan} isGenerating={isLoading} isLastStep={planHistory.length >= TOTAL_PLAN_STEPS} worksheetCredits={WORKSHEET_CREDITS} />;
    if (workbook) return <InteractiveWorkbook workbook={workbook} onReset={resetForm} />;

    return (
        <div style={styles.dashboard}>
            {/* Enhanced Header with Parent-Focused Messaging */}
            <div style={{
                textAlign: 'center',
                marginBottom: 'clamp(2rem, 4vw, 3rem)',
                padding: 'clamp(1.5rem, 3vw, 2rem)',
                background: 'linear-gradient(145deg, rgba(127, 217, 87, 0.1), rgba(86, 217, 137, 0.05))',
                borderRadius: '20px',
                border: '2px solid rgba(127, 217, 87, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
            }}>
                <h1 style={{
                    ...styles.mainTitle,
                    fontSize: 'clamp(2rem, 5vw, 3rem)',
                    marginBottom: '1rem',
                    background: 'linear-gradient(135deg, var(--primary-light), var(--secondary-color))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                }}>
                    מרכז הלמידה המשפחתי
                </h1>
                <p style={{
                    ...styles.subtitle,
                    fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
                    color: 'var(--text-primary)',
                    maxWidth: '900px',
                    lineHeight: 1.8,
                    marginBottom: '1rem'
                }}>
                    ברוכים הבאים, הורים יקרים! כאן תוכלו ליצור בקלות חומרי למידה מותאמים אישית עבור {activeProfile.name}.
                </p>
                <p style={{
                    fontSize: 'clamp(1rem, 2vw, 1.2rem)',
                    color: 'var(--text-light)',
                    maxWidth: '800px',
                    margin: '0 auto',
                    lineHeight: 1.7
                }}>
                    פשוט בחרו נושא, ואנחנו נדאג ליצור תכנים מעניינים ומהנים שמותאמים לגיל {activeProfile.age} ולתחומי העניין של {activeProfile.name}
                </p>
            </div>

            <div style={{maxWidth: '900px', margin: '0 auto'}}>
                <div style={{
                    ...styles.card,
                    background: 'linear-gradient(145deg, rgba(26, 46, 26, 0.95), rgba(36, 60, 36, 0.9))',
                    border: '2px solid var(--glass-border)',
                    padding: 'clamp(2rem, 4vw, 3rem)',
                    boxShadow: '0 12px 48px rgba(0, 0, 0, 0.3)'
                }}>
                    <form onSubmit={handleGenerate} style={styles.glassForm}>
                         <div style={{marginBottom: '1.5rem'}}>
                            <label style={{
                                fontSize: 'clamp(1.2rem, 2.5vw, 1.5rem)',
                                fontWeight: 'bold',
                                color: 'var(--primary-light)',
                                display: 'block',
                                marginBottom: '1rem',
                                fontFamily: 'var(--font-serif)'
                            }}>
                                1. איזה סוג תוכן תרצו ליצור?
                            </label>
                            <div style={{...styles.formRow, gap: '1rem', marginTop: '1rem'}}>
                                <button
                                    type="button"
                                    onClick={() => setCreationType('plan')}
                                    style={{
                                        ...styles.button,
                                        flex: 1,
                                        padding: 'clamp(1rem, 2vw, 1.5rem)',
                                        fontSize: 'clamp(1rem, 2vw, 1.2rem)',
                                        background: creationType === 'plan'
                                            ? 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))'
                                            : 'rgba(127, 217, 87, 0.1)',
                                        border: creationType === 'plan'
                                            ? '2px solid var(--primary-light)'
                                            : '2px solid var(--glass-border)',
                                        color: creationType === 'plan' ? 'white' : 'var(--text-light)',
                                        boxShadow: creationType === 'plan'
                                            ? '0 8px 24px rgba(127, 217, 87, 0.4)'
                                            : '0 4px 12px rgba(0, 0, 0, 0.2)',
                                        transform: creationType === 'plan' ? 'scale(1.05)' : 'scale(1)',
                                        transition: 'all 0.3s ease'
                                    }}
                                    className="creation-type-button"
                                >
                                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem'}}>
                                        <span style={{fontSize: '2rem'}}>🎯</span>
                                        <span style={{fontWeight: 'bold'}}>תוכנית מודרכת</span>
                                        <span style={{fontSize: '0.85rem', opacity: 0.9}}>שלב אחר שלב עם הדרכה</span>
                                    </div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCreationType('workbook')}
                                    style={{
                                        ...styles.button,
                                        flex: 1,
                                        padding: 'clamp(1rem, 2vw, 1.5rem)',
                                        fontSize: 'clamp(1rem, 2vw, 1.2rem)',
                                        background: creationType === 'workbook'
                                            ? 'linear-gradient(135deg, var(--secondary-color), var(--accent-color))'
                                            : 'rgba(127, 217, 87, 0.1)',
                                        border: creationType === 'workbook'
                                            ? '2px solid var(--secondary-color)'
                                            : '2px solid var(--glass-border)',
                                        color: creationType === 'workbook' ? 'white' : 'var(--text-light)',
                                        boxShadow: creationType === 'workbook'
                                            ? '0 8px 24px rgba(160, 132, 232, 0.4)'
                                            : '0 4px 12px rgba(0, 0, 0, 0.2)',
                                        transform: creationType === 'workbook' ? 'scale(1.05)' : 'scale(1)',
                                        transition: 'all 0.3s ease'
                                    }}
                                    className="creation-type-button"
                                >
                                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem'}}>
                                        <span style={{fontSize: '2rem'}}>📚</span>
                                        <span style={{fontWeight: 'bold'}}>חוברת עבודה</span>
                                        <span style={{fontSize: '0.85rem', opacity: 0.9}}>תרגילים להדפסה ולפתרון</span>
                                    </div>
                                </button>
                            </div>
                        </div>

                        <div style={{marginBottom: '1.5rem'}}>
                            <label style={{
                                fontSize: 'clamp(1.2rem, 2.5vw, 1.5rem)',
                                fontWeight: 'bold',
                                color: 'var(--primary-light)',
                                display: 'block',
                                marginBottom: '1rem',
                                fontFamily: 'var(--font-serif)'
                            }}>
                                2. בחרו תחום לימוד:
                            </label>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(110px, 15vw, 140px), 1fr))',
                                gap: 'clamp(0.75rem, 1.5vw, 1rem)',
                                marginTop: '1rem'
                            }} className="subjects-grid-enhanced">
                                {subjects.map(s => (
                                    <div
                                        key={s.name}
                                        onClick={() => handleSubjectClick(s.name)}
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem',
                                            padding: 'clamp(1rem, 2vw, 1.5rem)',
                                            background: subject === s.name
                                                ? `linear-gradient(145deg, ${s.color}dd, ${s.color}aa)`
                                                : 'rgba(26, 46, 26, 0.8)',
                                            border: subject === s.name
                                                ? `3px solid ${s.color}`
                                                : '2px solid var(--glass-border)',
                                            borderRadius: '16px',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                            transform: subject === s.name ? 'scale(1.1)' : 'scale(1)',
                                            boxShadow: subject === s.name
                                                ? `0 8px 24px ${s.color}66`
                                                : '0 4px 12px rgba(0, 0, 0, 0.2)',
                                            position: 'relative',
                                            overflow: 'hidden'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (subject !== s.name) {
                                                e.currentTarget.style.transform = 'scale(1.05) translateY(-5px)';
                                                e.currentTarget.style.borderColor = s.color;
                                                e.currentTarget.style.boxShadow = `0 8px 24px ${s.color}44`;
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (subject !== s.name) {
                                                e.currentTarget.style.transform = 'scale(1)';
                                                e.currentTarget.style.borderColor = 'var(--glass-border)';
                                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
                                            }
                                        }}
                                        className="subject-card-enhanced"
                                    >
                                        <div style={{
                                            fontSize: 'clamp(2rem, 4vw, 3rem)',
                                            filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))',
                                            transition: 'all 0.3s ease'
                                        }}>
                                            {s.icon}
                                        </div>
                                        <span style={{
                                            fontSize: 'clamp(0.9rem, 1.8vw, 1.1rem)',
                                            fontWeight: subject === s.name ? 'bold' : '600',
                                            color: subject === s.name ? 'white' : 'var(--text-light)',
                                            textAlign: 'center',
                                            lineHeight: 1.2
                                        }}>
                                            {s.name}
                                        </span>
                                    </div>
                                ))}
                                <div
                                    onClick={() => handleSubjectClick('אחר...')}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        padding: 'clamp(1rem, 2vw, 1.5rem)',
                                        background: subject === 'אחר...'
                                            ? 'linear-gradient(145deg, rgba(255, 230, 109, 0.9), rgba(255, 200, 87, 0.7))'
                                            : 'rgba(26, 46, 26, 0.8)',
                                        border: subject === 'אחר...'
                                            ? '3px solid var(--accent-color)'
                                            : '2px solid var(--glass-border)',
                                        borderRadius: '16px',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                        transform: subject === 'אחר...' ? 'scale(1.1)' : 'scale(1)',
                                        boxShadow: subject === 'אחר...'
                                            ? '0 8px 24px rgba(255, 230, 109, 0.4)'
                                            : '0 4px 12px rgba(0, 0, 0, 0.2)'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (subject !== 'אחר...') {
                                            e.currentTarget.style.transform = 'scale(1.05) translateY(-5px)';
                                            e.currentTarget.style.borderColor = 'var(--accent-color)';
                                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 230, 109, 0.3)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (subject !== 'אחר...') {
                                            e.currentTarget.style.transform = 'scale(1)';
                                            e.currentTarget.style.borderColor = 'var(--glass-border)';
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
                                        }
                                    }}
                                    className="subject-card-enhanced"
                                >
                                    <div style={{
                                        fontSize: 'clamp(2rem, 4vw, 3rem)',
                                        filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))'
                                    }}>
                                        ✨
                                    </div>
                                    <span style={{
                                        fontSize: 'clamp(0.9rem, 1.8vw, 1.1rem)',
                                        fontWeight: subject === 'אחר...' ? 'bold' : '600',
                                        color: subject === 'אחר...' ? '#1a2e1a' : 'var(--text-light)',
                                        textAlign: 'center'
                                    }}>
                                        אחר...
                                    </span>
                                </div>
                            </div>
                            {isOtherSubject && (
                                <div className="fade-in" style={{marginTop: '1rem'}}>
                                     <input
                                        type="text"
                                        value={otherSubjectText}
                                        onChange={e => setOtherSubjectText(e.target.value)}
                                        placeholder="הקלידו את תחום הידע הרצוי (לדוגמה: פילוסופיה, תכנות, בישול...)"
                                        style={{
                                            ...styles.input,
                                            fontSize: 'clamp(1rem, 2vw, 1.1rem)',
                                            padding: 'clamp(0.75rem, 1.5vw, 1rem)',
                                            border: '2px solid var(--accent-color)',
                                            background: 'rgba(255, 230, 109, 0.1)',
                                            boxShadow: '0 4px 12px rgba(255, 230, 109, 0.2)'
                                        }}
                                        required
                                    />
                                </div>
                            )}
                        </div>
                        <div style={{marginBottom: '1.5rem'}}>
                            <label htmlFor="topic" style={{
                                fontSize: 'clamp(1.2rem, 2.5vw, 1.5rem)',
                                fontWeight: 'bold',
                                color: 'var(--primary-light)',
                                display: 'block',
                                marginBottom: '1rem',
                                fontFamily: 'var(--font-serif)'
                            }}>
                                3. מה הנושא המרכזי?
                            </label>
                            <div style={{display: 'flex', gap: '1rem', alignItems: 'stretch', marginTop: '0.5rem', flexWrap: 'wrap'}}>
                                <input
                                    id="topic"
                                    type="text"
                                    value={topic}
                                    onChange={e => setTopic(e.target.value)}
                                    placeholder="לדוגמה: חיבור עד 10, אותיות הא'-ב', סיפורי הבריאה..."
                                    style={{
                                        ...styles.input,
                                        flex: 1,
                                        minWidth: '250px',
                                        fontSize: 'clamp(1rem, 2vw, 1.1rem)',
                                        padding: 'clamp(0.75rem, 1.5vw, 1rem)',
                                        border: '2px solid var(--glass-border)',
                                        background: 'rgba(26, 46, 26, 0.6)',
                                        transition: 'all 0.3s ease'
                                    }}
                                    required
                                    list="topic-suggestions"
                                    className="topic-input-enhanced"
                                />
                                {(subject || otherSubjectText) && (
                                    <button
                                        type="button"
                                        onClick={fetchTopicSuggestions}
                                        style={{
                                            ...styles.button,
                                            padding: 'clamp(0.75rem, 1.5vw, 1rem) clamp(1rem, 2vw, 1.5rem)',
                                            fontSize: 'clamp(0.9rem, 1.8vw, 1rem)',
                                            flexShrink: 0,
                                            background: isFetchingSuggestions
                                                ? 'var(--glass-border)'
                                                : 'linear-gradient(135deg, var(--accent-color), var(--secondary-color))',
                                            opacity: (user?.credits ?? 0) < TOPIC_SUGGESTIONS_CREDITS ? 0.5 : 1,
                                            cursor: (user?.credits ?? 0) < TOPIC_SUGGESTIONS_CREDITS ? 'not-allowed' : 'pointer'
                                        }}
                                        disabled={isFetchingSuggestions || (user?.credits ?? 0) < TOPIC_SUGGESTIONS_CREDITS}
                                        title={user && user.credits < TOPIC_SUGGESTIONS_CREDITS ? `נדרשים ${TOPIC_SUGGESTIONS_CREDITS} קרדיטים` : 'קבלו הצעות לנושאים מותאמים אישית'}
                                        className="suggestions-button"
                                    >
                                        {isFetchingSuggestions ? '⏳ טוען...' : `💡 קבלו הצעות (${TOPIC_SUGGESTIONS_CREDITS} קרדיטים)`}
                                    </button>
                                )}
                            </div>
                            <datalist id="topic-suggestions">
                                {topicSuggestions.map((s, i) => <option key={i} value={s} />)}
                            </datalist>
                            {topicSuggestions.length > 0 && (
                                <div className="fade-in" style={{
                                    marginTop: '1rem',
                                    padding: '1rem',
                                    background: 'rgba(255, 230, 109, 0.1)',
                                    borderRadius: '12px',
                                    border: '2px solid rgba(255, 230, 109, 0.3)'
                                }}>
                                    <p style={{
                                        fontSize: 'clamp(0.9rem, 1.8vw, 1rem)',
                                        color: 'var(--accent-color)',
                                        marginBottom: '0.5rem',
                                        fontWeight: 'bold'
                                    }}>
                                        💡 הצעות מומלצות:
                                    </p>
                                    <p style={{
                                        fontSize: 'clamp(0.85rem, 1.6vw, 0.95rem)',
                                        color: 'var(--text-light)',
                                        margin: 0,
                                        lineHeight: 1.6
                                    }}>
                                        {topicSuggestions.join(' • ')}
                                    </p>
                                </div>
                            )}
                        </div>

                        {creationType === 'plan' ? (
                            <div className="fade-in" style={{marginBottom: '1.5rem'}}>
                                <label htmlFor="goal" style={{
                                    fontSize: 'clamp(1.2rem, 2.5vw, 1.5rem)',
                                    fontWeight: 'bold',
                                    color: 'var(--primary-light)',
                                    display: 'block',
                                    marginBottom: '1rem',
                                    fontFamily: 'var(--font-serif)'
                                }}>
                                    4. מהי מטרת הלמידה? (אופציונלי)
                                </label>
                                <textarea
                                    id="goal"
                                    value={goal}
                                    onChange={e => setGoal(e.target.value)}
                                    placeholder="לדוגמה: זיהוי כל האותיות בביטחון, חיבור עצמאי עד 20, הבנת סיפורי התורה..."
                                    style={{
                                        ...styles.textarea,
                                        marginTop: '0.5rem',
                                        minHeight: '80px',
                                        fontSize: 'clamp(1rem, 2vw, 1.1rem)',
                                        padding: 'clamp(0.75rem, 1.5vw, 1rem)',
                                        border: '2px solid var(--glass-border)',
                                        background: 'rgba(26, 46, 26, 0.6)',
                                        transition: 'all 0.3s ease',
                                        lineHeight: 1.6
                                    }}
                                    className="goal-textarea-enhanced"
                                />
                            </div>
                        ) : (
                            <div className="fade-in" style={{marginBottom: '1.5rem'}}>
                                <label htmlFor="description" style={{
                                    fontSize: 'clamp(1.2rem, 2.5vw, 1.5rem)',
                                    fontWeight: 'bold',
                                    color: 'var(--primary-light)',
                                    display: 'block',
                                    marginBottom: '1rem',
                                    fontFamily: 'var(--font-serif)'
                                }}>
                                    4. תארו מה תרצו לתרגל בחוברת:
                                </label>
                                <textarea
                                    id="description"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="לדוגמה: תרגילים של חיבור וחיסור עם דינוזאורים, זיהוי אותיות בתוך מילים שקשורות לפיות, שאלות על סיפורי התנ&quot;ך..."
                                    style={{
                                        ...styles.textarea,
                                        marginTop: '0.5rem',
                                        minHeight: '100px',
                                        fontSize: 'clamp(1rem, 2vw, 1.1rem)',
                                        padding: 'clamp(0.75rem, 1.5vw, 1rem)',
                                        border: '2px solid var(--glass-border)',
                                        background: 'rgba(26, 46, 26, 0.6)',
                                        transition: 'all 0.3s ease',
                                        lineHeight: 1.6
                                    }}
                                    required
                                    className="description-textarea-enhanced"
                                />
                                <div style={{marginTop: '1.5rem'}}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '0.75rem'
                                    }}>
                                        <label htmlFor="numExercises" style={{
                                            fontSize: 'clamp(1rem, 2vw, 1.2rem)',
                                            color: 'var(--text-light)',
                                            fontWeight: '600'
                                        }}>
                                            מספר תרגילים:
                                        </label>
                                        <span style={{
                                            fontSize: 'clamp(1.3rem, 2.5vw, 1.8rem)',
                                            fontWeight: 'bold',
                                            color: 'var(--primary-light)',
                                            background: 'rgba(127, 217, 87, 0.2)',
                                            padding: '0.25rem 1rem',
                                            borderRadius: '20px',
                                            border: '2px solid var(--primary-color)'
                                        }}>
                                            {numExercises}
                                        </span>
                                    </div>
                                    <input
                                        id="numExercises"
                                        type="range"
                                        min="5"
                                        max="20"
                                        value={numExercises}
                                        onChange={e => setNumExercises(parseInt(e.target.value))}
                                        style={{
                                            width: '100%',
                                            marginTop: '0.5rem',
                                            height: '8px',
                                            borderRadius: '4px',
                                            background: 'linear-gradient(to right, var(--primary-color) 0%, var(--primary-color) ' + ((numExercises - 5) / 15 * 100) + '%, var(--glass-border) ' + ((numExercises - 5) / 15 * 100) + '%, var(--glass-border) 100%)',
                                            outline: 'none',
                                            cursor: 'pointer'
                                        }}
                                        className="range-slider-enhanced"
                                    />
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        marginTop: '0.5rem',
                                        fontSize: 'clamp(0.85rem, 1.6vw, 0.95rem)',
                                        color: 'var(--text-secondary)'
                                    }}>
                                        <span>5 תרגילים</span>
                                        <span>20 תרגילים</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Enhanced Submit Section */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem',
                            marginTop: '2rem',
                            padding: 'clamp(1.5rem, 3vw, 2rem)',
                            background: 'rgba(127, 217, 87, 0.1)',
                            borderRadius: '16px',
                            border: '2px solid rgba(127, 217, 87, 0.3)'
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: '1rem'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    background: 'rgba(26, 46, 26, 0.8)',
                                    padding: 'clamp(0.75rem, 1.5vw, 1rem) clamp(1rem, 2vw, 1.5rem)',
                                    borderRadius: '50px',
                                    border: '2px solid var(--primary-color)',
                                    boxShadow: '0 4px 16px rgba(127, 217, 87, 0.3)'
                                }}>
                                    <span style={{fontSize: 'clamp(1.5rem, 3vw, 2rem)'}}>💎</span>
                                    <div style={{display: 'flex', flexDirection: 'column', gap: '0.25rem'}}>
                                        <span style={{
                                            fontSize: 'clamp(0.85rem, 1.6vw, 0.95rem)',
                                            color: 'var(--text-secondary)',
                                            fontWeight: '600'
                                        }}>
                                            יתרת קרדיטים:
                                        </span>
                                        <span style={{
                                            fontSize: 'clamp(1.1rem, 2.2vw, 1.4rem)',
                                            fontWeight: 'bold',
                                            color: 'var(--primary-light)'
                                        }}>
                                            {user?.credits ?? 0}
                                        </span>
                                    </div>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    background: 'rgba(255, 230, 109, 0.2)',
                                    padding: 'clamp(0.75rem, 1.5vw, 1rem) clamp(1rem, 2vw, 1.5rem)',
                                    borderRadius: '50px',
                                    border: '2px solid var(--accent-color)'
                                }}>
                                    <span style={{fontSize: 'clamp(1.2rem, 2.4vw, 1.5rem)'}}>⚡</span>
                                    <span style={{
                                        fontSize: 'clamp(0.9rem, 1.8vw, 1rem)',
                                        color: 'var(--text-light)',
                                        fontWeight: '600'
                                    }}>
                                        {creationType === 'plan'
                                            ? `יוציא ${PLAN_STEP_CREDITS} קרדיטים לכל שלב`
                                            : `יוציא ${WORKBOOK_CREDITS} קרדיטים`}
                                    </span>
                                </div>
                            </div>
                            <button
                                type="submit"
                                style={{
                                    ...styles.button,
                                    fontSize: 'clamp(1.1rem, 2.2vw, 1.4rem)',
                                    fontWeight: 'bold',
                                    padding: 'clamp(1rem, 2vw, 1.5rem) clamp(2rem, 4vw, 3rem)',
                                    background: (isLoading || (creationType === 'plan' && (user?.credits ?? 0) < PLAN_STEP_CREDITS) || (creationType === 'workbook' && (user?.credits ?? 0) < WORKBOOK_CREDITS))
                                        ? 'var(--glass-border)'
                                        : 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
                                    opacity: (isLoading || (creationType === 'plan' && (user?.credits ?? 0) < PLAN_STEP_CREDITS) || (creationType === 'workbook' && (user?.credits ?? 0) < WORKBOOK_CREDITS))
                                        ? 0.6
                                        : 1,
                                    cursor: (isLoading || (creationType === 'plan' && (user?.credits ?? 0) < PLAN_STEP_CREDITS) || (creationType === 'workbook' && (user?.credits ?? 0) < WORKBOOK_CREDITS))
                                        ? 'not-allowed'
                                        : 'pointer',
                                    boxShadow: '0 8px 32px rgba(127, 217, 87, 0.5)',
                                    transition: 'all 0.3s ease'
                                }}
                                disabled={isLoading || (creationType === 'plan' && (user?.credits ?? 0) < PLAN_STEP_CREDITS) || (creationType === 'workbook' && (user?.credits ?? 0) < WORKBOOK_CREDITS)}
                                className="submit-button-enhanced"
                            >
                                {isLoading ? '⏳ יוצר את התוכן שלך...' : `✨ צור ${creationType === 'plan' ? 'תוכנית מודרכת' : 'חוברת עבודה'}`}
                            </button>
                            {((creationType === 'plan' && (user?.credits ?? 0) < PLAN_STEP_CREDITS) || (creationType === 'workbook' && (user?.credits ?? 0) < WORKBOOK_CREDITS)) && (
                                <p style={{
                                    ...styles.error,
                                    fontSize: 'clamp(0.95rem, 1.8vw, 1.1rem)',
                                    margin: 0,
                                    background: 'rgba(255, 107, 107, 0.2)',
                                    border: '2px solid rgba(255, 107, 107, 0.4)'
                                }}>
                                    ⚠️ אין מספיק קרדיטים. נדרשים {creationType === 'plan' ? PLAN_STEP_CREDITS : WORKBOOK_CREDITS} קרדיטים.
                                </p>
                            )}
                        </div>
                        {error && <p style={{
                            ...styles.error,
                            fontSize: 'clamp(0.95rem, 1.8vw, 1.1rem)',
                            marginTop: '1rem'
                        }}>{error}</p>}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LearningCenter;