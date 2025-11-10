/**
 * AI Response Cache Service
 * מטמון לתשובות AI עם TTL ו-LRU eviction
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class AICache {
  private cache: Map<string, CacheEntry<any>>;
  private maxSize: number;
  private defaultTTL: number; // בms

  constructor(maxSize: number = 100, defaultTTL: number = 1000 * 60 * 30) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  /**
   * יצירת מפתח cache מפרמטרים
   */
  private createKey(params: any): string {
    return JSON.stringify(params);
  }

  /**
   * קבלת ערך מה-cache
   */
  get<T>(params: any): T | null {
    const key = this.createKey(params);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // בדיקה אם פג תוקף
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // LRU: העבר לסוף (refresh)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.data as T;
  }

  /**
   * שמירת ערך ב-cache
   */
  set<T>(params: any, data: T, ttl?: number): void {
    const key = this.createKey(params);
    const expiresAt = Date.now() + (ttl || this.defaultTTL);

    // אם הגענו למקסימום, נמחק את הישן ביותר (LRU)
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt,
    });
  }

  /**
   * מחיקת ערך מה-cache
   */
  delete(params: any): void {
    const key = this.createKey(params);
    this.cache.delete(key);
  }

  /**
   * ניקוי כל ה-cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * קבלת גודל ה-cache
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * ניקוי ערכים שפג תוקפם
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// Singleton instance
export const aiCache = new AICache();

// ניקוי אוטומטי כל 5 דקות
setInterval(() => {
  aiCache.cleanup();
}, 1000 * 60 * 5);
