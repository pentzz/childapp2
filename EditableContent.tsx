import React, { useState } from 'react';

interface EditableContentProps {
    sectionKey: string;
    children: React.ReactNode;
    isEditMode: boolean;
    onEdit: (sectionKey: string) => void;
}

const EditableContent = ({ sectionKey, children, isEditMode, onEdit }: EditableContentProps) => {
    const [isHovering, setIsHovering] = useState(false);

    if (!isEditMode) {
        return <>{children}</>;
    }

    return (
        <div
            style={{
                position: 'relative',
                display: 'inline-block',
                width: '100%'
            }}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            {children}
            {isHovering && (
                <button
                    onClick={() => onEdit(sectionKey)}
                    style={{
                        position: 'absolute',
                        top: '-10px',
                        right: '-10px',
                        background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
                        color: 'white',
                        border: '2px solid white',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '1.2rem',
                        boxShadow: '0 4px 15px rgba(127, 217, 87, 0.5)',
                        transition: 'all 0.3s ease',
                        zIndex: 1000,
                        animation: 'edit-button-pulse 2s ease-in-out infinite'
                    }}
                    title={`ערוך: ${sectionKey}`}
                >
                    ✏️
                </button>
            )}
            <style>{`
                @keyframes edit-button-pulse {
                    0%, 100% {
                        transform: scale(1);
                        box-shadow: 0 4px 15px rgba(127, 217, 87, 0.5);
                    }
                    50% {
                        transform: scale(1.1);
                        box-shadow: 0 6px 20px rgba(127, 217, 87, 0.7);
                    }
                }
            `}</style>
        </div>
    );
};

export default EditableContent;
