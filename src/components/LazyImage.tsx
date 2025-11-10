import React, { useState, useEffect, useRef, CSSProperties } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  placeholder?: string;
  width?: string | number;
  height?: string | number;
  className?: string;
  style?: CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%237FD957" fill-opacity="0.1" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%237FD957" font-size="18" dy=".3em"%3E%D8%B7%D8%B9%D8%A7%D8%A0...%3C/text%3E%3C/svg%3E',
  width,
  height,
  className = '',
  style = {},
  onLoad,
  onError,
}) => {
  const [imageSrc, setImageSrc] = useState<string>(placeholder);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Intersection Observer לטעינה lazy
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // התמונה נכנסה לviewport - נטען אותה
            const img = new Image();
            img.src = src;

            img.onload = () => {
              setImageSrc(src);
              setImageLoaded(true);
              onLoad?.();
            };

            img.onerror = () => {
              setImageError(true);
              onError?.();
            };

            // הפסק לצפות לאחר שהתחלנו לטעון
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // התחל לטעון 50px לפני שהתמונה נכנסת לviewport
        threshold: 0.01,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [src, onLoad, onError]);

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      className={`lazy-image ${imageLoaded ? 'loaded' : ''} ${className}`}
      style={{
        ...style,
        transition: 'opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        opacity: imageLoaded ? 1 : 0.6,
      }}
      loading="lazy"
      decoding="async"
    />
  );
};

export default LazyImage;
