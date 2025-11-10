import { useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
  freezeOnceVisible?: boolean;
}

export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
) {
  const {
    threshold = 0,
    root = null,
    rootMargin = '0px',
    freezeOnceVisible = false,
  } = options;

  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const targetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = targetRef.current;
    if (!node) return;

    // אם כבר היה visible ו-freezeOnceVisible=true, לא נצפה יותר
    if (hasBeenVisible && freezeOnceVisible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isCurrentlyIntersecting = entry.isIntersecting;
        setIsIntersecting(isCurrentlyIntersecting);

        if (isCurrentlyIntersecting) {
          setHasBeenVisible(true);
        }

        // אם freezeOnceVisible=true והאלמנט נראה, נפסיק לצפות
        if (isCurrentlyIntersecting && freezeOnceVisible) {
          observer.disconnect();
        }
      },
      { threshold, root, rootMargin }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [threshold, root, rootMargin, freezeOnceVisible, hasBeenVisible]);

  return { ref: targetRef, isIntersecting, hasBeenVisible };
}
