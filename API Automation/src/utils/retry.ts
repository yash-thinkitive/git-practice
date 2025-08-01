import { logger } from './logger';

export interface RetryOptions {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: any) => boolean;
}

export class RetryHandler {
  private static defaultOptions: RetryOptions = {
    maxAttempts: 3,
    delayMs: 1000,
    backoffMultiplier: 2,
    shouldRetry: (error: any) => {
      // Retry on network errors, 5xx server errors, and rate limiting
      return error.code === 'ECONNRESET' || 
             error.code === 'ETIMEDOUT' ||
             (error.status >= 500 && error.status < 600) ||
             error.status === 429;
    }
  };

  static async execute<T>(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {}
  ): Promise<T> {
    const config = { ...this.defaultOptions, ...options };
    let lastError: any;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === config.maxAttempts) {
          logger.error(`Operation failed after ${config.maxAttempts} attempts`, error);
          throw error;
        }

        if (!config.shouldRetry!(error)) {
          logger.warn(`Non-retryable error encountered`, error);
          throw error;
        }

        const delay = config.delayMs * Math.pow(config.backoffMultiplier!, attempt - 1);
        logger.warn(`Attempt ${attempt} failed, retrying in ${delay}ms`, error);
        
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 