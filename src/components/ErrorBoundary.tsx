import React, { Component, ErrorInfo, ReactNode } from 'react';
import { styles } from '../../styles';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          background: 'var(--bg-primary)',
        }}>
          <div style={{
            maxWidth: '600px',
            padding: 'clamp(2rem, 5vw, 3rem)',
            background: 'rgba(255, 107, 107, 0.1)',
            border: '3px solid rgba(255, 107, 107, 0.4)',
            borderRadius: '24px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 'clamp(4rem, 10vw, 6rem)', marginBottom: '1rem' }}>
              😕
            </div>
            <h1 style={{
              fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
              color: 'var(--text-primary)',
              marginBottom: '1rem',
              fontFamily: 'var(--font-serif)',
            }}>
              אופס! משהו השתבש
            </h1>
            <p style={{
              fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
              color: 'var(--text-secondary)',
              marginBottom: '2rem',
              lineHeight: 1.6,
            }}>
              אנחנו מצטערים, אבל נראה שקרתה שגיאה בלתי צפויה. אנא נסו לרענן את הדף או לחזור למסך הבית.
            </p>
            {this.state.error && (
              <details style={{
                textAlign: 'right',
                marginBottom: '2rem',
                padding: '1rem',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '12px',
                fontSize: '0.9rem',
                color: 'var(--text-secondary)',
              }}>
                <summary style={{ cursor: 'pointer', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  פרטים טכניים
                </summary>
                <code style={{ display: 'block', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {this.state.error.toString()}
                </code>
              </details>
            )}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  ...styles.button,
                  background: 'linear-gradient(135deg, var(--primary-color), var(--primary-light))',
                  fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
                  padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1.5rem, 4vw, 2rem)',
                }}
              >
                🔄 רענן את הדף
              </button>
              <button
                onClick={() => window.location.href = '/'}
                style={{
                  ...styles.button,
                  background: 'rgba(127, 217, 87, 0.2)',
                  color: 'var(--primary-color)',
                  border: '2px solid var(--primary-color)',
                  fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
                  padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1.5rem, 4vw, 2rem)',
                }}
              >
                🏠 חזור לדף הבית
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
