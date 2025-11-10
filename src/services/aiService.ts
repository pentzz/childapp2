import { GoogleGenAI } from '@google/genai';
import { aiCache } from './aiCache';
import { geminiRateLimiter } from './rateLimiter';

/**
 * AI Service עם caching ו-rate limiting
 */

interface AIRequestParams {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  useCache?: boolean;
  userId?: string;
}

interface AIResponse {
  text: string;
  cached: boolean;
  remainingRequests: number;
}

export class AIService {
  private genAI: GoogleGenAI | null = null;
  private apiKey: string | null = null;

  constructor(apiKey?: string) {
    if (apiKey) {
      this.initialize(apiKey);
    }
  }

  /**
   * אתחול ה-AI service עם API key
   */
  initialize(apiKey: string): void {
    this.apiKey = apiKey;
    this.genAI = new GoogleGenAI(apiKey);
  }

  /**
   * בדיקה אם ה-service מאותחל
   */
  isInitialized(): boolean {
    return this.genAI !== null;
  }

  /**
   * שליחת בקשה ל-AI עם caching ו-rate limiting
   */
  async generateText(params: AIRequestParams): Promise<AIResponse> {
    if (!this.isInitialized()) {
      throw new Error('AI Service לא אותחל. נא להפעיל initialize() תחילה.');
    }

    const {
      prompt,
      model = 'gemini-2.0-flash-exp',
      temperature = 0.7,
      maxTokens = 2048,
      useCache = true,
      userId = 'default',
    } = params;

    // בדיקת rate limiting
    if (!geminiRateLimiter.canMakeRequest(userId)) {
      const waitTime = geminiRateLimiter.getWaitTime(userId);
      throw new Error(
        `הגעתם למגבלת הבקשות. אנא המתינו ${Math.ceil(waitTime / 1000)} שניות.`
      );
    }

    // ניסיון לקבל מה-cache
    const cacheKey = { prompt, model, temperature, maxTokens };
    if (useCache) {
      const cachedResponse = aiCache.get<string>(cacheKey);
      if (cachedResponse) {
        return {
          text: cachedResponse,
          cached: true,
          remainingRequests: geminiRateLimiter.getRemainingRequests(userId),
        };
      }
    }

    // קריאה ל-AI
    try {
      const response = await this.genAI!.models.generateContent({
        model,
        prompt,
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
        },
      });

      const text = response.text || '';

      // שמירה ב-cache
      if (useCache) {
        aiCache.set(cacheKey, text);
      }

      return {
        text,
        cached: false,
        remainingRequests: geminiRateLimiter.getRemainingRequests(userId),
      };
    } catch (error: any) {
      console.error('שגיאה בקריאה ל-AI:', error);
      throw new Error(error.message || 'שגיאה בשרת AI');
    }
  }

  /**
   * שליחת בקשה עם streaming
   */
  async generateTextStream(
    params: AIRequestParams,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    if (!this.isInitialized()) {
      throw new Error('AI Service לא אותחל. נא להפעיל initialize() תחילה.');
    }

    const {
      prompt,
      model = 'gemini-2.0-flash-exp',
      temperature = 0.7,
      maxTokens = 2048,
      userId = 'default',
    } = params;

    // בדיקת rate limiting
    if (!geminiRateLimiter.canMakeRequest(userId)) {
      const waitTime = geminiRateLimiter.getWaitTime(userId);
      throw new Error(
        `הגעתם למגבלת הבקשות. אנא המתינו ${Math.ceil(waitTime / 1000)} שניות.`
      );
    }

    try {
      const stream = await this.genAI!.models.generateContentStream({
        model,
        prompt,
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
        },
      });

      let fullText = '';

      for await (const chunk of stream) {
        const text = chunk.text || '';
        fullText += text;
        onChunk(text);
      }

      // שמירה ב-cache של הטקסט המלא
      const cacheKey = { prompt, model, temperature, maxTokens };
      aiCache.set(cacheKey, fullText);
    } catch (error: any) {
      console.error('שגיאה ב-streaming:', error);
      throw new Error(error.message || 'שגיאה בשרת AI');
    }
  }

  /**
   * ניקוי cache
   */
  clearCache(): void {
    aiCache.clear();
  }

  /**
   * קבלת מידע על rate limiting
   */
  getRateLimitInfo(userId: string = 'default') {
    return {
      remaining: geminiRateLimiter.getRemainingRequests(userId),
      waitTime: geminiRateLimiter.getWaitTime(userId),
    };
  }
}

// Singleton instance
export const aiService = new AIService();
