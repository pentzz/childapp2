import React from 'react';
import AnimatedSection from './AnimatedSection';
import { styles } from '../../styles';

const AboutSection = () => {
    return (
        <AnimatedSection>
            <section id="about" className="about-section">
                <h2 className="section-title">קצת עלינו</h2>
                <p className="section-subtitle" style={{marginBottom: '3rem', fontSize: '1.2rem', lineHeight: '1.8'}}>
                    ״גאון״ נולדה מתוך תשוקה להפוך למידה לחוויה אישית, מרגשת ובלתי נשכחת. אנו מאמינים שכל ילד הוא עולם ומלואו, וכשהתוכן מותאם לתחומי העניין והעולם הפנימי שלו - הקסם קורה באמת. המשימה שלנו היא לספק כלים יצירתיים וטכנולוגיים להורים ומחנכים כדי להצית את הסקרנות הטבעית של ילדים ולטפח אהבה לידע ודמיון.
                </p>

                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginBottom: '3rem'}}>
                    <div style={{
                        textAlign: 'center',
                        padding: '2rem',
                        background: 'linear-gradient(145deg, rgba(160, 132, 232, 0.1), rgba(100, 204, 197, 0.05))',
                        borderRadius: '16px',
                        border: '1px solid var(--glass-border)',
                        transition: 'all 0.3s ease'
                    }}>
                        <i className="fas fa-bullseye" style={{
                            fontSize: '3rem',
                            marginBottom: '1rem',
                            background: 'linear-gradient(135deg, var(--primary-light), var(--secondary-color))',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            display: 'block'
                        }}></i>
                        <h3 style={{color: 'var(--primary-light)', marginBottom: '1rem', fontSize: '1.4rem'}}>החזון שלנו</h3>
                        <p style={{color: 'var(--text-light)', lineHeight: '1.7'}}>
                            ליצור עולם שבו כל ילד יכול ללמוד בדרך שמתאימה לו, להתפתח בקצב שלו, ולגלות את הגאון הייחודי שבתוכו.
                        </p>
                    </div>

                    <div style={{
                        textAlign: 'center',
                        padding: '2rem',
                        background: 'linear-gradient(145deg, rgba(100, 204, 197, 0.1), rgba(160, 132, 232, 0.05))',
                        borderRadius: '16px',
                        border: '1px solid var(--glass-border)',
                        transition: 'all 0.3s ease'
                    }}>
                        <i className="fas fa-gem" style={{
                            fontSize: '3rem',
                            marginBottom: '1rem',
                            background: 'linear-gradient(135deg, var(--secondary-color), var(--primary-light))',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            display: 'block'
                        }}></i>
                        <h3 style={{color: 'var(--primary-light)', marginBottom: '1rem', fontSize: '1.4rem'}}>הערכים שלנו</h3>
                        <p style={{color: 'var(--text-light)', lineHeight: '1.7'}}>
                            יצירתיות, אישיות, חדשנות ואהבת למידה. אנו מחויבים לספק חוויות איכותיות שמכבדות את הייחודיות של כל ילד.
                        </p>
                    </div>

                    <div style={{
                        textAlign: 'center',
                        padding: '2rem',
                        background: 'linear-gradient(145deg, rgba(160, 132, 232, 0.08), rgba(100, 204, 197, 0.08))',
                        borderRadius: '16px',
                        border: '1px solid var(--glass-border)',
                        transition: 'all 0.3s ease'
                    }}>
                        <i className="fas fa-rocket" style={{
                            fontSize: '3rem',
                            marginBottom: '1rem',
                            background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            display: 'block'
                        }}></i>
                        <h3 style={{color: 'var(--primary-light)', marginBottom: '1rem', fontSize: '1.4rem'}}>המשימה שלנו</h3>
                        <p style={{color: 'var(--text-light)', lineHeight: '1.7'}}>
                            להצית סקרנות, לטפח אהבת למידה, וליצור חוויות חינוכיות מותאמות אישית לכל ילד וילדה.
                        </p>
                    </div>
                </div>

                <div style={{textAlign: 'center', marginBottom: '2rem'}}>
                    <h3 style={{color: 'var(--primary-light)', fontSize: '1.8rem', marginBottom: '1.5rem'}}>נשמח לשמוע מכם</h3>
                    <p style={{color: 'var(--text-light)', marginBottom: '1.5rem', fontSize: '1.1rem', lineHeight: '1.6'}}>
                        יש לכם שאלה או רעיון? הצוות שלנו כאן בשבילכם
                    </p>
                    <a href="mailto:support@gaon.ai" style={{
                        ...styles.button,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.7rem',
                        background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
                        padding: '1rem 2.5rem',
                        fontSize: '1.1rem',
                        boxShadow: '0 8px 25px rgba(160, 132, 232, 0.4)',
                        transition: 'all 0.3s ease'
                    }}>
                        <i className="fas fa-envelope"></i>
                        support@gaon.ai
                    </a>
                </div>
            </section>
        </AnimatedSection>
    );
};

export default AboutSection;