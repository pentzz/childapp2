import React, { useState } from 'react';
import { styles } from '../../styles';

interface HelpSystemProps {
    onClose: () => void;
}

interface HelpSection {
    id: string;
    icon: string;
    title: string;
    content: string[];
    subsections?: {
        title: string;
        content: string[];
    }[];
}

const HelpSystem = ({ onClose }: HelpSystemProps) => {
    const [activeSection, setActiveSection] = useState<string>('welcome');
    const [expandedSubsections, setExpandedSubsections] = useState<string[]>([]);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const toggleSubsection = (subsectionTitle: string) => {
        setExpandedSubsections(prev =>
            prev.includes(subsectionTitle)
                ? prev.filter(s => s !== subsectionTitle)
                : [...prev, subsectionTitle]
        );
    };

    const helpSections: HelpSection[] = [
        {
            id: 'welcome',
            icon: '👋',
            title: 'ברוכים הבאים לגאון של אמא',
            content: [
                'פלטפורמת "גאון של אמא" היא כלי חכם ומתקדם שעוזר להורים ולמורים ליצור תכנים חינוכיים מותאמים אישית לילדים.',
                'באמצעות טכנולוגיית בינה מלאכותית (AI) מתקדמת, אנחנו יוצרים:',
            ],
            subsections: [
                {
                    title: '📖 סיפורים מאוירים מותאמים אישית',
                    content: [
                        'סיפורים ייחודיים שבהם הילד שלכם הוא הגיבור הראשי',
                        'איורים מקוריים שנוצרים במיוחד עבור הסיפור',
                        'תוכן המותאם לגיל, לתחומי עניין ולערכים החינוכיים שלכם'
                    ]
                },
                {
                    title: '✏️ חוברות עבודה אינטראקטיביות',
                    content: [
                        'תרגילים מגוונים ומעניינים בכל התחומים הלימודיים',
                        'בדיקה אוטומטית של תשובות עם משוב מעודד',
                        'אפשרות להדפסה לעבודה גם ללא מחשב'
                    ]
                },
                {
                    title: '🎯 תוכניות למידה מודרכות',
                    content: [
                        'תוכניות מדורגות שמתאימות את עצמן לקצב הילד',
                        'פעילויות מעשיות לביצוע משותף של הורה וילד',
                        'הדרכה פדגוגית מקצועית להורים ולמורים',
                        'יכולת להרחיב את התוכנית עד 10 שלבים'
                    ]
                }
            ]
        },
        {
            id: 'how-to-use',
            icon: '🚀',
            title: 'איך להתחיל?',
            content: [
                'השימוש בפלטפורמה פשוט וקל:',
            ],
            subsections: [
                {
                    title: 'שלב 1: יצירת פרופיל לילד',
                    content: [
                        'היכנסו לדשבורד ההורים שלכם',
                        'לחצו על "הוסף פרופיל חדש"',
                        'מלאו את פרטי הילד: שם, גיל, ותחומי עניין',
                        'הפרופיל נשמר ותוכלו להשתמש בו שוב ושוב'
                    ]
                },
                {
                    title: 'שלב 2: בחירת סוג התוכן',
                    content: [
                        '📚 מרכז הלמידה - ליצירת חוברות עבודה ותוכניות למידה מודרכות',
                        '📖 יוצר הסיפורים - ליצירת סיפורים מאוירים מותאמים אישית',
                        'כל אחד מהכלים האלה מותאם לצרכים שונים ומציע חוויה ייחודית'
                    ]
                },
                {
                    title: 'שלב 3: הזנת הנושא והמטרה',
                    content: [
                        'בחרו תחום לימוד מתוך הרשימה (מתמטיקה, שפה, מדעים, תנ"ך ועוד)',
                        'או הזינו נושא מותאם אישית',
                        'תארו בקצרה מה אתם רוצים שהילד ילמד',
                        'ניתן גם לקבל הצעות לנושאים מהמערכת (בעלות 5 קרדיטים)'
                    ]
                },
                {
                    title: 'שלב 4: יצירת התוכן',
                    content: [
                        'לחצו על "צור" והמערכת תתחיל לעבוד',
                        'תהליך היצירה אורך בדרך כלל 30-60 שניות',
                        'במהלך ההמתנה תראו הודעות על ההתקדמות',
                        'כשהתוכן מוכן, הוא יופיע מיד על המסך'
                    ]
                },
                {
                    title: 'שלב 5: שימוש בתוכן שנוצר',
                    content: [
                        'צפו בתוכן יחד עם הילד במסך',
                        'השתמשו בכפתור "הדפסה" להדפסת העבודה',
                        'בחוברות אינטראקטיביות - פתרו ישירות במסך וקבלו משוב מיידי',
                        'בתוכניות מודרכות - עברו משלב לשלב לפי הקצב שלכם'
                    ]
                }
            ]
        },
        {
            id: 'credits',
            icon: '💎',
            title: 'מערכת הקרדיטים - הסבר מפורט',
            content: [
                'הפלטפורמה עובדת עם מערכת קרדיטים. כל קרדיט מייצג שימוש בטכנולוגיית הבינה המלאכותית שלנו.',
                'מדוע צריך קרדיטים? כי יצירת תוכן באיכות גבוהה דורשת שימוש במודלים מתקדמים של AI שעולים כסף לתפעול.',
            ],
            subsections: [
                {
                    title: 'מחירון קרדיטים לפי סוג תוכן',
                    content: [
                        '📖 סיפור מאויר מלא - 100 קרדיטים',
                        '   • כולל סיפור מותאם אישית בן מספר עמודים',
                        '   • איורים ייחודיים שנוצרו במיוחד לסיפור',
                        '   • עיצוב מקצועי ומרשים',
                        '',
                        '🎯 שלב בתוכנית למידה מודרכת - 30 קרדיטים',
                        '   • פעילויות מפורטות לילד ולהורה',
                        '   • הדרכה פדגוגית מקצועית',
                        '   • התאמה אוטומטית לקצב ההתקדמות',
                        '',
                        '📄 דף תרגול (מתוך תוכנית מודרכת) - 30 קרדיטים',
                        '   • סיכום ותרגילים על השלב שלמדתם',
                        '   • אפשרות להדפסה',
                        '   • מתאים לביצוע עצמאי',
                        '',
                        '📚 חוברת עבודה מלאה - 50 קרדיטים',
                        '   • 5-10 תרגילים מגוונים',
                        '   • בדיקה אוטומטית עם משוב מפורט',
                        '   • אפשרות להדפסה או לפתרון דיגיטלי',
                        '',
                        '💡 הצעות לנושאים - 5 קרדיטים',
                        '   • רשימה של 5 הצעות לנושאים רלוונטיים',
                        '   • מותאם לתחום הלימוד ולגיל הילד'
                    ]
                },
                {
                    title: 'איך מקבלים קרדיטים?',
                    content: [
                        '1. כשאתם נרשמים לראשונה, אתם מקבלים קרדיטים לניסיון',
                        '2. ניתן לרכוש חבילות קרדיטים דרך הדשבורד',
                        '3. משתמשים רשומים מקבלים מדי פעם בונוסים מיוחדים',
                        '4. צרו קשר עם התמיכה אם נגמרו לכם הקרדיטים ואתם זקוקים לעזרה'
                    ]
                },
                {
                    title: 'טיפים לניהול חכם של קרדיטים',
                    content: [
                        '• התחילו עם תוכנית מודרכת (30 קרדיטים) במקום חוברת מלאה (50 קרדיטים)',
                        '• שמרו תכנים שיצרתם - הצפייה בהם שוב היא חינם',
                        '• השתמשו בהצעות הנושאים רק אם אתם באמת צריכים השראה',
                        '• תכננו מראש - חשבו מה הילד צריך ללמוד השבוע',
                        '• הדפיסו תכנים לשימוש חוזר'
                    ]
                }
            ]
        },
        {
            id: 'features-detail',
            icon: '⭐',
            title: 'תכונות מתקדמות',
            content: [
                'הפלטפורמה מלאה בתכונות שיעזרו לכם להפיק את המקסימום:',
            ],
            subsections: [
                {
                    title: '🎨 התאמה אישית מלאה',
                    content: [
                        'כל תוכן מותאם לגיל הילד ולרמתו',
                        'ניתן לבקש התמקדות בנושאים ספציפיים',
                        'האיורים משקפים את תחומי העניין של הילד',
                        'הסגנון והשפה מותאמים לרמת ההבנה'
                    ]
                },
                {
                    title: '📊 מעקב והתקדמות',
                    content: [
                        'כל התכנים שיצרתם נשמרים בדשבורד',
                        'תוכלו לחזור אליהם בכל זמן ללא עלות נוספת',
                        'בתוכניות מודרכות - המערכת זוכרת איפה עצרתם',
                        'ניתן לראות את כל ההיסטוריה של התכנים שנוצרו'
                    ]
                },
                {
                    title: '🖨️ הדפסה מקצועית',
                    content: [
                        'כל תוכן מותאם להדפסה על נייר A4 רגיל',
                        'עיצוב נקי וברור שמתאים לילדים',
                        'גופנים גדולים וקריאים',
                        'שימוש חכם בצבעים - נראה טוב גם בשחור-לבן'
                    ]
                },
                {
                    title: '🧠 בינה מלאכותית חכמה',
                    content: [
                        'המערכת לומדת מהמשוב שלכם',
                        'בתוכניות מודרכות - השלב הבא מתאים את עצמו לקודם',
                        'בחוברות אינטראקטיביות - משוב מותאם לטעויות הספציפיות',
                        'האיורים משקפים את הסיפור בצורה עקבית'
                    ]
                },
                {
                    title: '👨‍👩‍👧‍👦 מרובה פרופילים',
                    content: [
                        'צרו פרופיל נפרד לכל ילד במשפחה',
                        'כל פרופיל שומר את ההיסטוריה שלו',
                        'מעבר מהיר בין ילדים',
                        'מתאים גם למורים עם כמה תלמידים'
                    ]
                }
            ]
        },
        {
            id: 'curriculum',
            icon: '📚',
            title: 'תחומי הלימוד הזמינים',
            content: [
                'הפלטפורמה תומכת במגוון רחב של תחומי לימוד, מותאמים לתוכנית הלימודים הישראלית:',
            ],
            subsections: [
                {
                    title: 'מקצועות הליבה',
                    content: [
                        '🔢 מתמטיקה - חשבון, גאומטריה, בעיות מילוליות',
                        'אב שפה עברית - קריאה, כתיבה, דקדוק, ביטוי',
                        '🔤 אנגלית - אוצר מילים, דקדוק, הבנת הנקרא',
                        '🔬 מדעים - פיזיקה, כימיה, ביולוגיה, מדעי הסביבה'
                    ]
                },
                {
                    title: 'מקצועות ייחודיים',
                    content: [
                        '📜 תנ"ך - סיפורי המקרא, ערכים, מסורת',
                        '🏛️ היסטוריה - תולדות עם ישראל, היסטוריה כללית',
                        '🌍 גאוגרפיה - גאוגרפיה של ישראל והעולם',
                        '🎨 אמנות - ציור, יצירה, היכרות עם אמנים',
                        '🎵 מוזיקה - תורת המוזיקה, היכרות עם מלחינים',
                        '🌿 טבע - צמחים, בעלי חיים, מערכות אקולוגיות'
                    ]
                },
                {
                    title: 'נושאים מותאמים אישית',
                    content: [
                        'לא מצאתם את מה שחיפשתם? בחרו ב"אחר..." והזינו כל נושא!',
                        'המערכת יכולה ליצור תכנים גם בנושאים מיוחדים',
                        'לדוגמה: בישול, גינון, רובוטיקה, פילוסופיה לילדים',
                        'היצירתיות היא הגבול!'
                    ]
                }
            ]
        },
        {
            id: 'tips',
            icon: '💡',
            title: 'טיפים שימושיים',
            content: [
                'כמה עצות מהצוות שלנו כדי להפיק את המקסימום מהפלטפורמה:',
            ],
            subsections: [
                {
                    title: 'לקבלת תוצאות מיטביות',
                    content: [
                        '✓ היו ספציפיים בתיאור הנושא - ככל שתתנו יותר פרטים, התוכן יהיה מותאם יותר',
                        '✓ ציינו את רמת הידע של הילד - "מתחיל", "בינוני", "מתקדם"',
                        '✓ אפשר להוסיף הנחיות מיוחדות - למשל "עם דוגמאות מהחיים"',
                        '✓ הזינו תחומי עניין - אם הילד אוהב דינוזאורים, תוסיפו את זה לתיאור!'
                    ]
                },
                {
                    title: 'עבודה משותפת עם הילד',
                    content: [
                        '👨‍👧 קראו סיפורים ביחד ושוחחו על הדמויות והעלילה',
                        '🤝 בתוכניות מודרכות - עשו את הפעילויות ביחד, זה חלק מהחוויה',
                        '💬 עודדו את הילד לשתף אתכם במחשבות ובשאלות',
                        '🎉 חגגו הצלחות - גם קטנות!'
                    ]
                },
                {
                    title: 'למורים ואנשי חינוך',
                    content: [
                        '📋 צרו פרופיל לכל תלמיד או קבוצת תלמידים',
                        '🗂️ תכננו מראש את השיעורים ויצרו תכנים לכל השבוע',
                        '📊 השתמשו בתוכניות מודרכות לעבודה עצמאית של התלמידים',
                        '🏠 שלחו חוברות להדפסה כשיעורי בית'
                    ]
                },
                {
                    title: 'פתרון בעיות נפוצות',
                    content: [
                        '❓ התוכן לא מדויק? נסו לנסח את הבקשה באופן אחר',
                        '⏱️ היצירה לוקחת זמן? זה נורמלי - תכנים איכותיים דורשים זמן',
                        '💳 נגמרו קרדיטים? צרו קשר עם התמיכה או רכשו חבילה נוספת',
                        '🐛 בעיה טכנית? רעננו את הדף או צרו קשר עם התמיכה'
                    ]
                }
            ]
        },
        {
            id: 'contact',
            icon: '📞',
            title: 'יצירת קשר ותמיכה',
            content: [
                'אנחנו כאן כדי לעזור! אם יש לכם שאלות, בעיות, או הצעות לשיפור:',
            ],
            subsections: [
                {
                    title: 'דרכי יצירת קשר',
                    content: [
                        '📧 אימייל: support@gaon.com',
                        '📱 טלפון: 03-1234567 (ימים א-ה, 9:00-17:00)',
                        '💬 צ\'אט בדשבורד (בפינה הימנית התחתונה)',
                        '🔗 אתר: www.gaon.com'
                    ]
                },
                {
                    title: 'שאלות נפוצות',
                    content: [
                        'ש: האם אפשר להחזיר קרדיטים?',
                        'ת: לרוב לא, אבל אם יש בעיה טכנית נפתור את זה ביחד.',
                        '',
                        'ש: האם התכנים שמורים?',
                        'ת: כן! כל מה שיצרתם נשמר בדשבורד שלכם לצמיתות.',
                        '',
                        'ש: האם יש הנחה למורים?',
                        'ת: כן! צרו קשר לפרטים על חבילות למוסדות חינוך.',
                        '',
                        'ש: עד איזה גיל זה מתאים?',
                        'ת: הפלטפורמה מותאמת לגילאי 3-18, עם התאמה אוטומטית לכל גיל.'
                    ]
                }
            ]
        }
    ];

    const currentSection = helpSections.find(s => s.id === activeSection) || helpSections[0];

    return (
        <div
            className="help-system-overlay"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.85)',
                backdropFilter: 'blur(8px)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
                overflowY: 'auto'
            }}
            onClick={onClose}
        >
            <div
                className="help-system-container"
                style={{
                    maxWidth: '1200px',
                    width: '100%',
                    maxHeight: '95vh',
                    background: 'linear-gradient(145deg, rgba(26, 46, 26, 0.98), rgba(36, 60, 36, 0.95))',
                    borderRadius: 'clamp(16px, 3vw, 24px)',
                    border: '2px solid var(--primary-color)',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    overflow: 'hidden',
                    position: 'relative'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Mobile Menu Toggle */}
                <button
                    className="mobile-menu-toggle"
                    onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                    style={{
                        display: 'none',
                        position: 'absolute',
                        top: '1rem',
                        right: '4rem',
                        zIndex: 1001,
                        background: 'var(--primary-color)',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.6rem 1rem',
                        color: 'white',
                        fontSize: '1rem',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                    }}
                >
                    {isMobileSidebarOpen ? '✕ סגור' : '☰ תפריט'}
                </button>

                {/* Sidebar */}
                <div
                    className="help-sidebar"
                    style={{
                        width: '280px',
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderLeft: '2px solid rgba(127, 217, 87, 0.3)',
                        overflowY: 'auto',
                        padding: '2rem 1rem',
                        flexShrink: 0,
                        transition: 'transform 0.3s ease'
                    }}
                >
                    <h2 style={{
                        fontSize: '1.5rem',
                        color: 'var(--primary-light)',
                        marginBottom: '2rem',
                        textAlign: 'center',
                        fontFamily: 'var(--font-serif)'
                    }}>📚 מדריך המשתמש</h2>

                    {helpSections.map(section => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                marginBottom: '0.5rem',
                                background: activeSection === section.id
                                    ? 'linear-gradient(135deg, var(--primary-color), var(--primary-light))'
                                    : 'rgba(127, 217, 87, 0.1)',
                                border: activeSection === section.id
                                    ? '2px solid var(--primary-light)'
                                    : '2px solid transparent',
                                borderRadius: '12px',
                                color: 'white',
                                fontSize: '1rem',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                textAlign: 'right',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                fontWeight: activeSection === section.id ? 'bold' : 'normal'
                            }}
                            onMouseEnter={(e) => {
                                if (activeSection !== section.id) {
                                    e.currentTarget.style.background = 'rgba(127, 217, 87, 0.2)';
                                    e.currentTarget.style.transform = 'translateX(-5px)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (activeSection !== section.id) {
                                    e.currentTarget.style.background = 'rgba(127, 217, 87, 0.1)';
                                    e.currentTarget.style.transform = 'translateX(0)';
                                }
                            }}
                        >
                            <span style={{ fontSize: '1.5rem' }}>{section.icon}</span>
                            <span style={{ flex: 1 }}>{section.title}</span>
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: 'clamp(2rem, 4vw, 3rem)'
                }}>
                    {/* Header */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '2rem',
                        paddingBottom: '1.5rem',
                        borderBottom: '3px solid var(--primary-color)'
                    }}>
                        <div>
                            <h1 style={{
                                fontSize: 'clamp(2rem, 5vw, 3rem)',
                                color: 'var(--primary-light)',
                                marginBottom: '0.5rem',
                                fontFamily: 'var(--font-serif)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem'
                            }}>
                                <span style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)' }}>{currentSection.icon}</span>
                                {currentSection.title}
                            </h1>
                        </div>
                        <button
                            onClick={onClose}
                            style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '2px solid rgba(255, 255, 255, 0.3)',
                                borderRadius: '50%',
                                width: '48px',
                                height: '48px',
                                color: 'white',
                                fontSize: '1.5rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 0, 0, 0.2)';
                                e.currentTarget.style.transform = 'rotate(90deg)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                e.currentTarget.style.transform = 'rotate(0deg)';
                            }}
                        >
                            ✕
                        </button>
                    </div>

                    {/* Main Content */}
                    <div>
                        {currentSection.content.map((paragraph, index) => (
                            <p key={index} style={{
                                fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)',
                                lineHeight: 1.8,
                                color: 'var(--text-primary)',
                                marginBottom: '1.5rem'
                            }}>
                                {paragraph}
                            </p>
                        ))}

                        {/* Subsections */}
                        {currentSection.subsections && (
                            <div style={{ marginTop: '2rem' }}>
                                {currentSection.subsections.map((subsection, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            background: 'linear-gradient(145deg, rgba(127, 217, 87, 0.1), rgba(100, 200, 100, 0.05))',
                                            borderRadius: '16px',
                                            border: '2px solid rgba(127, 217, 87, 0.3)',
                                            marginBottom: '1.5rem',
                                            overflow: 'hidden',
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        <button
                                            onClick={() => toggleSubsection(subsection.title)}
                                            style={{
                                                width: '100%',
                                                padding: '1.5rem',
                                                background: 'transparent',
                                                border: 'none',
                                                color: 'var(--primary-light)',
                                                fontSize: 'clamp(1.2rem, 2.8vw, 1.5rem)',
                                                fontWeight: 'bold',
                                                cursor: 'pointer',
                                                textAlign: 'right',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                fontFamily: 'var(--font-serif)'
                                            }}
                                        >
                                            <span>{subsection.title}</span>
                                            <span style={{
                                                fontSize: '1.5rem',
                                                transform: expandedSubsections.includes(subsection.title)
                                                    ? 'rotate(180deg)'
                                                    : 'rotate(0deg)',
                                                transition: 'transform 0.3s ease'
                                            }}>
                                                ▼
                                            </span>
                                        </button>

                                        {expandedSubsections.includes(subsection.title) && (
                                            <div style={{
                                                padding: '0 1.5rem 1.5rem 1.5rem',
                                                animation: 'slideDown 0.3s ease'
                                            }}>
                                                {subsection.content.map((line, lineIndex) => (
                                                    <p key={lineIndex} style={{
                                                        fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
                                                        lineHeight: 1.7,
                                                        color: 'var(--text-primary)',
                                                        marginBottom: line === '' ? '0.5rem' : '0.75rem',
                                                        whiteSpace: 'pre-wrap'
                                                    }}>
                                                        {line}
                                                    </p>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                /* Responsive Styles */
                @media (max-width: 1024px) {
                    .help-system-container {
                        flex-direction: column;
                        max-height: 90vh !important;
                    }

                    .help-sidebar {
                        width: 100% !important;
                        max-height: ${isMobileSidebarOpen ? '400px' : '0'} !important;
                        padding: ${isMobileSidebarOpen ? '1.5rem 1rem' : '0 1rem'} !important;
                        border-left: none !important;
                        border-bottom: 2px solid rgba(127, 217, 87, 0.3);
                        overflow-y: ${isMobileSidebarOpen ? 'auto' : 'hidden'} !important;
                        transform: ${isMobileSidebarOpen ? 'translateY(0)' : 'translateY(-100%)'};
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        z-index: 1000;
                    }

                    .mobile-menu-toggle {
                        display: block !important;
                    }
                }

                @media (max-width: 768px) {
                    .help-system-overlay {
                        padding: 0.5rem !important;
                    }

                    .help-system-container {
                        border-radius: 16px !important;
                        border-width: 2px !important;
                    }

                    .mobile-menu-toggle {
                        top: 0.7rem !important;
                        right: 3.5rem !important;
                        padding: 0.5rem 0.8rem !important;
                        font-size: 0.9rem !important;
                    }
                }

                @media (max-width: 480px) {
                    .help-system-container {
                        border-radius: 12px !important;
                    }

                    .mobile-menu-toggle {
                        font-size: 0.85rem !important;
                        padding: 0.4rem 0.7rem !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default HelpSystem;
