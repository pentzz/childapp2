/**
 * Rate Limiter Service
 * מגביל קצב קריאות ל-API
 */

interface RateLimitConfig {
  maxRequests: number; // מספר מקסימלי של בקשות
  windowMs: number; // חלון זמן במילישניות
}

interface RequestRecord {
  timestamp: number;
  count: number;
}

class RateLimiter {
  private requests: Map<string, RequestRecord>;
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig = { maxRequests: 10, windowMs: 60000 }) {
    this.requests = new Map();
    this.config = config;
  }

  /**
   * בדיקה אם ניתן לבצע בקשה
   */
  canMakeRequest(key: string = 'default'): boolean {
    const now = Date.now();
    const record = this.requests.get(key);

    if (!record) {
      this.requests.set(key, { timestamp: now, count: 1 });
      return true;
    }

    // אם עבר חלון הזמן, אפס את המונה
    if (now - record.timestamp > this.config.windowMs) {
      this.requests.set(key, { timestamp: now, count: 1 });
      return true;
    }

    // אם הגענו למקסימום, דחה
    if (record.count >= this.config.maxRequests) {
      return false;
    }

    // הוסף לספירה
    record.count++;
    return true;
  }

  /**
   * קבלת זמן המתנה עד הבקשה הבאה
   */
  getWaitTime(key: string = 'default'): number {
    const record = this.requests.get(key);
    if (!record) return 0;

    const now = Date.now();
    const timeElapsed = now - record.timestamp;
    const timeRemaining = this.config.windowMs - timeElapsed;

    return timeRemaining > 0 ? timeRemaining : 0;
  }

  /**
   * איפוס מונה בקשות
   */
  reset(key?: string): void {
    if (key) {
      this.requests.delete(key);
    } else {
      this.requests.clear();
    }
  }

  /**
   * קבלת מספר בקשות שנותרו
   */
  getRemainingRequests(key: string = 'default'): number {
    const record = this.requests.get(key);
    if (!record) return this.config.maxRequests;

    const now = Date.now();
    if (now - record.timestamp > this.config.windowMs) {
      return this.config.maxRequests;
    }

    return Math.max(0, this.config.maxRequests - record.count);
  }
}

// Singleton instances
export const geminiRateLimiter = new RateLimiter({
  maxRequests: 15, // 15 בקשות
  windowMs: 60000, // לדקה
});

export const imageRateLimiter = new RateLimiter({
  maxRequests: 10, // 10 תמונות
  windowMs: 60000, // לדקה
});

export const storyRateLimiter = new RateLimiter({
  maxRequests: 5, // 5 סיפורים
  windowMs: 60000, // לדקה
});
