import React from 'react';

export const styles: { [key: string]: React.CSSProperties } = {
    // Layouts
    centered: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        height: '100%',
        textAlign: 'center',
    },
    dashboard: {
        padding: '2rem',
        animation: 'fade-in 0.5s ease-out',
        maxWidth: '1200px',
        margin: '0 auto',
    },
    dashboardGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '2rem',
        marginTop: '2rem',
    },
    
    // Components
    card: {
        background: 'var(--surface-color)',
        padding: '1.5rem',
        borderRadius: '16px',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
        border: '1px solid var(--border-color)',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    },
    actionCard: {
        cursor: 'pointer',
        textAlign: 'center',
    },
    actionIcon: {
        fontSize: '3rem',
        marginBottom: '1rem',
    },
    button: {
        background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
        color: '#fff',
        border: 'none',
        padding: '12px 24px',
        borderRadius: '50px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '1rem',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease',
        boxShadow: '0 4px 15px rgba(127, 217, 87, 0.4)',
        textDecoration: 'none',
    },
    buttonDanger: {
        background: 'transparent',
        color: 'var(--error-color)',
        border: '1px solid var(--error-color)',
        padding: '8px 16px',
        borderRadius: '50px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '0.9rem',
        transition: 'all 0.2s ease',
    },
    iconButton: {
        background: 'transparent',
        border: 'none',
        color: 'var(--text-color)',
        fontSize: '1.5rem',
        cursor: 'pointer',
        padding: '8px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 0.2s ease, transform 0.2s ease',
    },
    input: {
        width: '100%',
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        background: 'var(--input-bg)',
        color: 'var(--text-color)',
        fontSize: '1rem',
        boxSizing: 'border-box',
    },
    textarea: {
        width: '100%',
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        background: 'var(--input-bg)',
        color: 'var(--text-color)',
        fontSize: '1rem',
        minHeight: '100px',
        resize: 'vertical',
        fontFamily: 'inherit',
    },
    select: {
        width: '100%',
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        background: 'var(--input-bg)',
        color: 'var(--text-color)',
        fontSize: '1rem',
        boxSizing: 'border-box',
    },
    spinner: {
        border: '4px solid rgba(255, 255, 255, 0.3)',
        borderTop: '4px solid var(--primary-light)',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        animation: 'spin 1s linear infinite',
    },
    error: {
        color: '#ff6b6b',
        background: 'rgba(255, 107, 107, 0.1)',
        padding: '10px',
        borderRadius: '8px',
        border: '1px solid rgba(255, 107, 107, 0.2)',
        textAlign: 'center',
        margin: '1rem 0',
    },

    // Typography
    mainTitle: {
        fontSize: '2.5rem',
        color: 'var(--primary-light)',
        marginBottom: '0.5rem',
        textAlign: 'center'
    },
    title: {
        fontSize: '2rem',
        color: 'var(--primary-light)',
        marginBottom: '0.5rem',
    },
    subtitle: {
        fontSize: '1.2rem',
        color: 'var(--text-light)',
        marginBottom: '2rem',
        textAlign: 'center',
        maxWidth: '600px',
        margin: '0 auto 2rem auto'
    },

    // Forms
    glassForm: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        width: '100%',
    },
    formRow: {
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap',
    },
    formField: {
        flex: 1,
        minWidth: '150px'
    },
    
    // Learning Center
    subjectsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem',
    },
    subjectIcon: {
        fontSize: '2.5rem',
        lineHeight: 1,
    },
    
    // Learning Plan Accordion
    accordionItem: {
        background: 'var(--surface-color)',
        marginBottom: '1rem',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
    },
    accordionHeader: {
        padding: '1rem 1.5rem',
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(255,255,255,0.05)',
    },
    accordionContent: {
        padding: '1.5rem',
        borderTop: '1px solid var(--border-color)',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '2rem',
    },
    planSection: {
        padding: '1rem',
        borderRadius: '8px',
        background: 'var(--input-bg)',
    },
    planVisual: {
        width: '100%',
        borderRadius: '8px',
        aspectRatio: '1 / 1',
        objectFit: 'cover',
    },

    // Story Creator specific
    storyView: {
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 80px)', // Assuming header/sidebar height
        padding: '1rem',
    },
    storyHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
        padding: '0 1rem',
    },
    storyContent: {
        flex: 1,
        overflowY: 'auto',
        padding: '2rem',
    },
    aiStoryPart: {
        marginBottom: '1.5rem',
        textAlign: 'right',
    },
    userStoryPart: {
        marginBottom: '1.5rem',
        textAlign: 'left',
        padding: '1rem',
        background: 'rgba(160, 132, 232, 0.1)',
        borderRadius: '12px',
    },
    storyImage: {
        maxWidth: '100%',
        maxHeight: '400px',
        borderRadius: '12px',
        marginBottom: '1rem',
        display: 'block',
        marginLeft: 'auto',
        marginRight: 'auto',
    },
    storyText: {
        fontSize: '1.2rem',
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
    },
    storyActions: {
        display: 'flex',
        gap: '0.5rem',
        justifyContent: 'flex-end',
        marginTop: '0.5rem',
    },
    storyInputForm: {
        display: 'flex',
        gap: '1rem',
        padding: '1rem',
        marginTop: '1rem',
        borderTop: '1px solid var(--border-color)',
    },
};