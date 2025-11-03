import React, { useState } from 'react';
import { styles } from '../../styles';

const LearningPlan = ({ planData, topic, onReset }: { planData: any, topic: string, onReset: () => void }) => {
    const [activeTab, setActiveTab] = useState(0);
    const { steps, exercises } = planData;
    const currentYear = new Date().getFullYear();

    const renderContent = () => {
        if (activeTab < steps.length) {
            const step = steps[activeTab];
            return (
                <div className="fade-in plan-step-grid">
                    <div style={styles.planSection}>
                        <h4 style={{marginTop: 0}}>👩‍🏫 להורה/מורה</h4>
                        <p style={{whiteSpace: 'pre-wrap', lineHeight: 1.6}}>{step.educator_guidance}</p>
                    </div>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                        <div style={{...styles.planSection, flex: 1}}>
                           <h4 style={{marginTop: 0}}>🧒 לתלמיד/ה</h4>
                           <p style={{whiteSpace: 'pre-wrap', lineHeight: 1.6}}>{step.learner_activity}</p>
                       </div>
                       {step.imageUrl ? (
                           <img src={step.imageUrl} alt={`Visual for ${step.step_title}`} style={styles.planVisual} />
                       ) : (
                            <div style={{...styles.planVisual, ...styles.centered, background: 'var(--input-bg)'}}>
                               <p style={{color: 'var(--text-light)'}}>לא נוצר איור</p>
                           </div>
                       )}
                   </div>
                </div>
            );
        }
        if (activeTab === steps.length && exercises) {
             return (
                <div className="fade-in" style={styles.planSection}>
                    <h3 style={{marginTop: 0}}>{exercises.title}</h3>
                    <p style={{whiteSpace: 'pre-wrap', lineHeight: 1.6}}>{exercises.introduction}</p>
                    <ul style={{listStyle: 'none', padding: 0, marginTop: '2rem'}}>
                        {exercises.questions.map((q: any, i: number) => (
                            <li key={i} style={{marginBottom: '1.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem'}}>
                                <strong>שאלה {i + 1}:</strong> {q.question_text}
                                <br/>
                                <em style={{color: 'var(--text-light)', fontSize: '0.9rem'}}>(סוג: {q.question_type})</em>
                            </li>
                        ))}
                    </ul>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="fade-in">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}} className="no-print">
                <div>
                     <h1 style={{...styles.mainTitle, textAlign: 'right', marginBottom: 0}}>תוכנית למידה: {topic}</h1>
                     <p style={{...styles.subtitle, textAlign: 'right', margin: '0.5rem 0 0 0'}}>עקבו אחר השלבים ללמידה מהנה ומוצלחת!</p>
                </div>
                 <div>
                    <button onClick={() => window.print()} style={styles.button}>הדפסה / שמירה ל-PDF</button>
                    <button onClick={onReset} style={{...styles.button, background: 'var(--secondary-color)', marginRight: '1rem'}}>יצירת תוכנית חדשה</button>
                </div>
            </div>
            
            <div className="printable-area">
                 {/* Header for print view */}
                <div className="print-only">
                    <h1>תוכנית למידה: {topic}</h1>
                    <hr />
                </div>

                <div className="tabs-nav no-print">
                    {steps.map((step: any, index: number) => (
                        <button key={index} onClick={() => setActiveTab(index)} className={`tab-button ${activeTab === index ? 'active' : ''}`}>
                            שלב {index + 1}: {step.step_title}
                        </button>
                    ))}
                    {exercises && (
                         <button onClick={() => setActiveTab(steps.length)} className={`tab-button ${activeTab === steps.length ? 'active' : ''}`}>
                            תרגול
                        </button>
                    )}
                </div>

                {/* Content for screen view */}
                <div className="tab-content no-print">
                    {renderContent()}
                </div>
                
                {/* Content for print view (renders all steps sequentially) */}
                <div className="print-only">
                    {steps.map((step: any, index: number) => (
                        <div key={index} className="page-break-inside-avoid" style={{marginBottom: '2rem'}}>
                            <h2>שלב {index + 1}: {step.step_title}</h2>
                            {step.imageUrl && <img src={step.imageUrl} alt={`Visual for ${step.step_title}`} style={{maxWidth: '400px', float: 'left', marginRight: '1.5rem', borderRadius: '8px'}} />}
                            <h4>הסבר ופעילות</h4>
                             <p style={{whiteSpace: 'pre-wrap', lineHeight: 1.6}}>{step.learner_activity}</p>
                             <div style={{clear: 'both'}}></div>
                             <hr style={{opacity: 0.2}} />
                        </div>
                    ))}
                    {exercises && (
                        <div className="page-break-before">
                             <h2>{exercises.title}</h2>
                             <p style={{whiteSpace: 'pre-wrap', lineHeight: 1.6}}>{exercises.introduction}</p>
                             <ul style={{listStyle: 'decimal', paddingRight: '20px', marginTop: '1.5rem'}}>
                                {exercises.questions.map((q: any, i: number) => (
                                    <li key={i} style={{marginBottom: '1rem'}}>
                                        {q.question_text}
                                    </li>
                                ))}
                            </ul>
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

export default LearningPlan;