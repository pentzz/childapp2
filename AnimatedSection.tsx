import React, { useState, useEffect, useRef, ReactNode } from 'react';

interface AnimatedSectionProps {
    children: ReactNode;
}

const AnimatedSection: React.FC<AnimatedSectionProps> = ({ children }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    // Disconnect observer after animation to improve performance
                    if(ref.current) {
                        observer.unobserve(ref.current);
                    }
                }
            },
            {
                threshold: 0.1, // Trigger when 10% of the element is visible
            }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            if (ref.current) {
                // eslint-disable-next-line react-hooks/exhaustive-deps
                observer.unobserve(ref.current);
            }
        };
    }, []);
    
    // Always wrap children in a div to apply the animation classes and ref reliably.
    // This avoids issues with React.cloneElement and function components that don't forward refs.
    return (
        <div ref={ref} className={`animate-on-scroll ${isVisible ? 'is-visible' : ''}`}>
            {children}
        </div>
    );
};

export default AnimatedSection;