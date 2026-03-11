import { logger } from './logger';
import type { LogContext } from './logger';

// ============================================================
// Retry Configuration
// ============================================================

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitter: boolean;
}

export const RETRY_POLICIES = {
  claudeApi: { maxRetries: 3, baseDelayMs: 1000, maxDelayMs: 8000, backoffMultiplier: 2, jitter: true },
  s3Upload: { maxRetries: 2, baseDelayMs: 500, maxDelayMs: 2000, backoffMultiplier: 2, jitter: true },
  dbQuery: { maxRetries: 2, baseDelayMs: 200, maxDelayMs: 1000, backoffMultiplier: 2, jitter: false },
} as const;

// ============================================================
// Circuit Breaker
// ============================================================

interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  isOpen: boolean;
  openedAt: number;
}

const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_WINDOW_MS = 60_000; // 60 seconds
const CIRCUIT_BREAKER_RESET_MS = 30_000; // 30 seconds

const circuitBreakers = new Map<string, CircuitBreakerState>();

function getCircuitBreaker(key: string): CircuitBreakerState {
  if (!circuitBreakers.has(key)) {
    circuitBreakers.set(key, {
      failures: 0,
      lastFailureTime: 0,
      isOpen: false,
      openedAt: 0,
    });
  }
  return circuitBreakers.get(key)!;
}

function recordCircuitFailure(key: string): void {
  const cb = getCircuitBreaker(key);
  const now = Date.now();

  // Reset failure count if outside window
  if (now - cb.lastFailureTime > CIRCUIT_BREAKER_WINDOW_MS) {
    cb.failures = 0;
  }

  cb.failures++;
  cb.lastFailureTime = now;

  if (cb.failures >= CIRCUIT_BREAKER_THRESHOLD && !cb.isOpen) {
    cb.isOpen = true;
    cb.openedAt = now;
    logger.warn(`Circuit breaker OPENED for "${key}" after ${cb.failures} failures`, {
      action: 'circuit_breaker_open',
      key,
      failures: cb.failures,
    } as LogContext);
  }
}

function recordCircuitSuccess(key: string): void {
  const cb = getCircuitBreaker(key);
  if (cb.failures > 0 || cb.isOpen) {
    cb.failures = 0;
    cb.isOpen = false;
    cb.openedAt = 0;
    logger.info(`Circuit breaker RESET for "${key}"`, {
      action: 'circuit_breaker_reset',
      key,
    } as LogContext);
  }
}

function isCircuitOpen(key: string): boolean {
  const cb = getCircuitBreaker(key);
  if (!cb.isOpen) return false;

  const now = Date.now();
  // Allow retry after reset period (half-open)
  if (now - cb.openedAt >= CIRCUIT_BREAKER_RESET_MS) {
    logger.info(`Circuit breaker HALF-OPEN for "${key}", allowing retry`, {
      action: 'circuit_breaker_half_open',
      key,
    } as LogContext);
    return false;
  }

  return true;
}

// Exported for testing
export function resetCircuitBreaker(key: string): void {
  circuitBreakers.delete(key);
}

export function getCircuitBreakerState(key: string): CircuitBreakerState | undefined {
  return circuitBreakers.get(key);
}

// ============================================================
// Retry Utility
// ============================================================

function calculateDelay(attempt: number, config: RetryConfig): number {
  let delay = config.baseDelayMs * Math.pow(config.backoffMultiplier, attempt);
  delay = Math.min(delay, config.maxDelayMs);

  if (config.jitter) {
    // Add random jitter: ±25% of calculated delay
    const jitterRange = delay * 0.25;
    delay = delay - jitterRange + Math.random() * jitterRange * 2;
  }

  return Math.round(delay);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig,
  circuitBreakerKey?: string
): Promise<T> {
  // Check circuit breaker
  if (circuitBreakerKey && isCircuitOpen(circuitBreakerKey)) {
    throw new Error(`Circuit breaker is open for "${circuitBreakerKey}". Try again later.`);
  }

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const result = await fn();

      // Record success for circuit breaker
      if (circuitBreakerKey) {
        recordCircuitSuccess(circuitBreakerKey);
      }

      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < config.maxRetries) {
        const delay = calculateDelay(attempt, config);

        logger.warn(
          `Retry attempt ${attempt + 1}/${config.maxRetries} for ${circuitBreakerKey ?? 'operation'}: ${lastError.message}`,
          {
            action: 'retry_attempt',
            attempt: attempt + 1,
            maxRetries: config.maxRetries,
            delayMs: delay,
            key: circuitBreakerKey,
          } as LogContext
        );

        await sleep(delay);
      }
    }
  }

  // All retries exhausted
  if (circuitBreakerKey) {
    recordCircuitFailure(circuitBreakerKey);
  }

  logger.error(
    `All ${config.maxRetries} retries exhausted for ${circuitBreakerKey ?? 'operation'}: ${lastError?.message}`,
    {
      action: 'retry_exhausted',
      maxRetries: config.maxRetries,
      key: circuitBreakerKey,
    } as LogContext
  );

  throw lastError;
}

export { calculateDelay as _calculateDelay, sleep as _sleep };
