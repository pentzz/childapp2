import React, { useEffect, useState } from 'react';

export interface ToastMessage {
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
    duration?: number;
}

interface ToastProps {
    toast: ToastMessage;
    onClose: (id: string) => void;
}

const Toast = ({ toast, onClose }: ToastProps) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        // Fade in
        setTimeout(() => setIsVisible(true), 10);

        // Auto close after duration
        const timer = setTimeout(() => {
            handleClose();
        }, toast.duration || 4000);

        return () => clearTimeout(timer);
    }, [toast.duration]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            onClose(toast.id);
        }, 300);
    };

    const getToastStyles = () => {
        const baseStyle = {
            position: 'relative' as const,
            padding: 'clamp(1rem, 2.5vw, 1.3rem) clamp(1.2rem, 3vw, 1.8rem)',
            borderRadius: '16px',
            marginBottom: '1rem',
            minWidth: '300px',
            maxWidth: '500px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(10px)',
            border: '2px solid',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem',
            transform: isExiting ? 'translateX(120%)' : isVisible ? 'translateX(0)' : 'translateX(120%)',
            opacity: isExiting ? 0 : isVisible ? 1 : 0,
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        };

        const typeStyles = {
            success: {
                background: 'linear-gradient(145deg, rgba(76, 175, 80, 0.95), rgba(56, 142, 60, 0.9))',
                borderColor: '#4caf50',
            },
            error: {
                background: 'linear-gradient(145deg, rgba(244, 67, 54, 0.95), rgba(211, 47, 47, 0.9))',
                borderColor: '#f44336',
            },
            warning: {
                background: 'linear-gradient(145deg, rgba(255, 152, 0, 0.95), rgba(245, 124, 0, 0.9))',
                borderColor: '#ff9800',
            },
            info: {
                background: 'linear-gradient(145deg, rgba(127, 217, 87, 0.95), rgba(86, 217, 137, 0.9))',
                borderColor: 'var(--primary-color)',
            },
        };

        return { ...baseStyle, ...typeStyles[toast.type] };
    };

    const getIcon = () => {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️',
        };
        return icons[toast.type];
    };

    return (
        <div style={getToastStyles()}>
            <div
                style={{
                    fontSize: '1.8rem',
                    flexShrink: 0,
                    animation: 'bounce-in 0.5s ease-out',
                }}
            >
                {getIcon()}
            </div>

            <div style={{ flex: 1 }}>
                <p
                    style={{
                        margin: 0,
                        color: 'white',
                        fontSize: 'clamp(1rem, 2.2vw, 1.1rem)',
                        fontWeight: 600,
                        lineHeight: 1.5,
                        textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                    }}
                >
                    {toast.message}
                </p>
            </div>

            <button
                onClick={handleClose}
                style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    padding: '0.3rem 0.6rem',
                    transition: 'all 0.2s ease',
                    flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                }}
            >
                ×
            </button>

            <style>{`
                @keyframes bounce-in {
                    0% { transform: scale(0); }
                    50% { transform: scale(1.2); }
                    100% { transform: scale(1); }
                }
            `}</style>
        </div>
    );
};

interface ToastContainerProps {
    toasts: ToastMessage[];
    onClose: (id: string) => void;
}

export const ToastContainer = ({ toasts, onClose }: ToastContainerProps) => {
    return (
        <div
            style={{
                position: 'fixed',
                top: '2rem',
                right: '2rem',
                zIndex: 10001,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
            }}
            className="no-print"
        >
            {toasts.map((toast) => (
                <Toast key={toast.id} toast={toast} onClose={onClose} />
            ))}
        </div>
    );
};

// Helper function to create toast messages
export const createToast = (type: ToastMessage['type'], message: string, duration?: number): ToastMessage => {
    return {
        id: `toast-${Date.now()}-${Math.random()}`,
        type,
        message,
        duration,
    };
};

export default Toast;
