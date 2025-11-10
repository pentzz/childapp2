import React from 'react';

interface SkeletonLoaderProps {
  type?: 'card' | 'text' | 'avatar' | 'image' | 'list';
  count?: number;
  width?: string;
  height?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  type = 'card',
  count = 1,
  width = '100%',
  height = 'auto',
}) => {
  const shimmerAnimation = {
    animation: 'shimmer 2s infinite',
  };

  const baseStyle = {
    background: 'linear-gradient(90deg, rgba(127, 217, 87, 0.1) 25%, rgba(127, 217, 87, 0.2) 50%, rgba(127, 217, 87, 0.1) 75%)',
    backgroundSize: '200% 100%',
    borderRadius: '12px',
    ...shimmerAnimation,
  };

  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div style={{
            ...baseStyle,
            width,
            height: height !== 'auto' ? height : '300px',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}>
            <div style={{
              ...baseStyle,
              width: '60%',
              height: '24px',
              marginBottom: '0.5rem',
            }} />
            <div style={{
              ...baseStyle,
              width: '100%',
              height: '16px',
            }} />
            <div style={{
              ...baseStyle,
              width: '90%',
              height: '16px',
            }} />
            <div style={{
              ...baseStyle,
              width: '80%',
              height: '16px',
            }} />
          </div>
        );

      case 'text':
        return (
          <div style={{
            ...baseStyle,
            width,
            height: height !== 'auto' ? height : '20px',
          }} />
        );

      case 'avatar':
        return (
          <div style={{
            ...baseStyle,
            width: width,
            height: width,
            borderRadius: '50%',
          }} />
        );

      case 'image':
        return (
          <div style={{
            ...baseStyle,
            width,
            height: height !== 'auto' ? height : '200px',
          }} />
        );

      case 'list':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width }}>
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} style={{
                ...baseStyle,
                height: '60px',
                display: 'flex',
                alignItems: 'center',
                padding: '1rem',
                gap: '1rem',
              }}>
                <div style={{
                  ...baseStyle,
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{
                    ...baseStyle,
                    width: '70%',
                    height: '16px',
                  }} />
                  <div style={{
                    ...baseStyle,
                    width: '40%',
                    height: '14px',
                  }} />
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
      <div className="skeleton-loader">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} style={{ marginBottom: count > 1 ? '1rem' : '0' }}>
            {renderSkeleton()}
          </div>
        ))}
      </div>
    </>
  );
};

export default SkeletonLoader;
