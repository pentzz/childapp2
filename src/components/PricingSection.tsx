import React from 'react';
import AnimatedSection from './AnimatedSection';
import { styles } from '../../styles';

interface PricingSectionProps {
    onCTAClick: () => void;
}

const PricingSection = ({ onCTAClick } : PricingSectionProps) => {
    return (
        <AnimatedSection>
            <section id="pricing">
                <h2 className="section-title">תוכניות ומחירים</h2>
                <p className="section-subtitle">בחרו את התוכנית המושלמת עבורכם והתחילו את המסע הקסום של למידה ויצירה.</p>
                <div className="pricing-grid">
                    <div className="pricing-card">
                        <h3>ניצוץ</h3>
                        <p className="price">₪29<span>/חודש</span></p>
                        <ul>
                            <li><span className="check-icon">✔</span>5 סיפורים אישיים בחודש</li>
                            <li><span className="check-icon">✔</span>10 חוברות עבודה בחודש</li>
                            <li><span className="check-icon">✔</span>יצירת עד 2 פרופילים</li>
                            <li><span className="check-icon">✔</span>תמיכה במייל</li>
                        </ul>
                        <button onClick={onCTAClick} style={styles.button}>בחירת התוכנית</button>
                    </div>
                    <div className="pricing-card popular">
                        <div className="popular-badge">הכי פופולרי</div>
                        <h3>גאון</h3>
                        <p className="price">₪49<span>/חודש</span></p>
                        <ul>
                            <li><span className="check-icon">✔</span>סיפורים אישיים ללא הגבלה</li>
                            <li><span className="check-icon">✔</span>חוברות עבודה ללא הגבלה</li>
                            <li><span className="check-icon">✔</span>יצירת עד 5 פרופילים</li>
                            <li><span className="check-icon">✔</span>תמיכה פרימיום</li>
                        </ul>
                        <button onClick={onCTAClick} style={{...styles.button, background: 'var(--secondary-color)', boxShadow: '0 4px 15px rgba(100, 204, 197, 0.4)'}}>בחירת התוכנית</button>
                    </div>
                    <div className="pricing-card">
                         <h3>התנסות</h3>
                        <p className="price">חינם</p>
                        <ul>
                            <li><span className="check-icon">✔</span>סיפור אישי 1 (חד פעמי)</li>
                            <li><span className="check-icon">✔</span>2 חוברות עבודה (חד פעמי)</li>
                            <li><span className="check-icon">✔</span>יצירת פרופיל 1</li>
                            <li><span className="check-icon">✔</span>תמיכה קהילתית</li>
                        </ul>
                        <button onClick={onCTAClick} style={styles.button}>התחילו בחינם</button>
                    </div>
                </div>
            </section>
        </AnimatedSection>
    );
};

export default PricingSection;