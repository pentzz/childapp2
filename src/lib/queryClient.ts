import { QueryClient } from '@tanstack/react-query';

// QueryClient עם הגדרות מתקדמות לביצועים מקסימליים
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache למשך 5 דקות
      staleTime: 1000 * 60 * 5,
      // שמירת נתונים במטמון למשך 10 דקות
      gcTime: 1000 * 60 * 10,
      // ניסיון חוזר 3 פעמים במקרה של שגיאה
      retry: 3,
      // השהיה אקספוננציאלית בין ניסיונות
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // לא לטעון מחדש בזמן focus
      refetchOnWindowFocus: false,
      // טעינה מחדש כל 30 שניות
      refetchInterval: 1000 * 30,
    },
    mutations: {
      // ניסיון חוזר פעם אחת למוטציות
      retry: 1,
    },
  },
});
