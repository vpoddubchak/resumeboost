import { withRetry, resetCircuitBreaker, getCircuitBreakerState, _calculateDelay, RETRY_POLICIES } from '@/app/lib/retry';
import type { RetryConfig } from '@/app/lib/retry';

// Suppress logger output in tests
jest.mock('@/app/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const fastRetryConfig: RetryConfig = {
  maxRetries: 2,
  baseDelayMs: 10,
  maxDelayMs: 50,
  backoffMultiplier: 2,
  jitter: false,
};

describe('Retry Mechanism', () => {
  beforeEach(() => {
    resetCircuitBreaker('test-key');
  });

  describe('withRetry', () => {
    it('should return result on first success', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      const result = await withRetry(fn, fastRetryConfig);
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and succeed', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockResolvedValue('success');

      const result = await withRetry(fn, fastRetryConfig);
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should exhaust retries and throw last error', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('persistent failure'));

      await expect(withRetry(fn, fastRetryConfig)).rejects.toThrow('persistent failure');
      expect(fn).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
    });

    it('should retry exact number of times specified', async () => {
      const config: RetryConfig = {
        maxRetries: 3,
        baseDelayMs: 1,
        maxDelayMs: 10,
        backoffMultiplier: 1,
        jitter: false,
      };
      const fn = jest.fn().mockRejectedValue(new Error('fail'));

      await expect(withRetry(fn, config)).rejects.toThrow('fail');
      expect(fn).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
    });

    it('should handle non-Error thrown values', async () => {
      const fn = jest.fn().mockRejectedValue('string error');
      await expect(withRetry(fn, fastRetryConfig)).rejects.toThrow('string error');
    });
  });

  describe('exponential backoff', () => {
    it('should calculate delay without jitter', () => {
      const config: RetryConfig = {
        maxRetries: 3,
        baseDelayMs: 100,
        maxDelayMs: 10000,
        backoffMultiplier: 2,
        jitter: false,
      };

      expect(_calculateDelay(0, config)).toBe(100);  // 100 * 2^0
      expect(_calculateDelay(1, config)).toBe(200);  // 100 * 2^1
      expect(_calculateDelay(2, config)).toBe(400);  // 100 * 2^2
    });

    it('should cap delay at maxDelayMs', () => {
      const config: RetryConfig = {
        maxRetries: 3,
        baseDelayMs: 1000,
        maxDelayMs: 2000,
        backoffMultiplier: 2,
        jitter: false,
      };

      expect(_calculateDelay(5, config)).toBe(2000); // capped
    });

    it('should add jitter when enabled', () => {
      const config: RetryConfig = {
        maxRetries: 3,
        baseDelayMs: 1000,
        maxDelayMs: 10000,
        backoffMultiplier: 2,
        jitter: true,
      };

      // Run multiple times to verify jitter produces varying results
      const delays = Array.from({ length: 10 }, () => _calculateDelay(1, config));
      const uniqueDelays = new Set(delays);

      // With jitter, we should get at least some variation
      // Base delay for attempt 1 = 2000, jitter range = ±500 (25%)
      expect(Math.min(...delays)).toBeGreaterThanOrEqual(1500);
      expect(Math.max(...delays)).toBeLessThanOrEqual(2500);
    });
  });

  describe('circuit breaker', () => {
    it('should open after threshold failures', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('fail'));
      const config: RetryConfig = {
        maxRetries: 0, // No retries, just immediate failure
        baseDelayMs: 1,
        maxDelayMs: 10,
        backoffMultiplier: 1,
        jitter: false,
      };

      // Trigger 5 failures (circuit breaker threshold)
      for (let i = 0; i < 5; i++) {
        await expect(withRetry(fn, config, 'test-key')).rejects.toThrow('fail');
      }

      // Circuit should now be open
      await expect(withRetry(fn, config, 'test-key')).rejects.toThrow('Circuit breaker is open');
    });

    it('should reset on success', async () => {
      const failFn = jest.fn().mockRejectedValue(new Error('fail'));
      const successFn = jest.fn().mockResolvedValue('ok');
      const config: RetryConfig = {
        maxRetries: 0,
        baseDelayMs: 1,
        maxDelayMs: 10,
        backoffMultiplier: 1,
        jitter: false,
      };

      // Trigger some failures (less than threshold)
      for (let i = 0; i < 3; i++) {
        await expect(withRetry(failFn, config, 'test-key')).rejects.toThrow();
      }

      // Success should reset
      await withRetry(successFn, config, 'test-key');

      const state = getCircuitBreakerState('test-key');
      expect(state?.failures).toBe(0);
      expect(state?.isOpen).toBe(false);
    });

    it('should work without circuit breaker key', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      const result = await withRetry(fn, fastRetryConfig);
      expect(result).toBe('success');
    });
  });

  describe('RETRY_POLICIES', () => {
    it('should have claudeApi policy', () => {
      expect(RETRY_POLICIES.claudeApi).toEqual({
        maxRetries: 3,
        baseDelayMs: 1000,
        maxDelayMs: 8000,
        backoffMultiplier: 2,
        jitter: true,
      });
    });

    it('should have s3Upload policy', () => {
      expect(RETRY_POLICIES.s3Upload).toEqual({
        maxRetries: 2,
        baseDelayMs: 500,
        maxDelayMs: 2000,
        backoffMultiplier: 2,
        jitter: true,
      });
    });

    it('should have dbQuery policy', () => {
      expect(RETRY_POLICIES.dbQuery).toEqual({
        maxRetries: 2,
        baseDelayMs: 200,
        maxDelayMs: 1000,
        backoffMultiplier: 2,
        jitter: false,
      });
    });
  });
});
