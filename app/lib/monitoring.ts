import { logger } from './logger';
import type { LogContext } from './logger';

// ============================================================
// Performance Tracking
// ============================================================

interface PerformanceMetric {
  endpoint: string;
  method: string;
  duration: number;
  status: number;
  timestamp: string;
}

interface ErrorMetric {
  endpoint: string;
  errorCount: number;
  lastError: string;
  lastOccurrence: string;
}

// In-memory metrics store (resets on server restart)
const metrics = {
  requests: [] as PerformanceMetric[],
  errors: new Map<string, ErrorMetric>(),
  startTime: Date.now(),
};

const MAX_METRICS_HISTORY = 1000;

export function recordRequestMetric(
  endpoint: string,
  method: string,
  duration: number,
  status: number
): void {
  const metric: PerformanceMetric = {
    endpoint,
    method,
    duration,
    status,
    timestamp: new Date().toISOString(),
  };

  metrics.requests.push(metric);

  // Keep only last N metrics
  if (metrics.requests.length > MAX_METRICS_HISTORY) {
    metrics.requests = metrics.requests.slice(-MAX_METRICS_HISTORY);
  }

  // Track errors
  if (status >= 400) {
    const key = `${method}:${endpoint}`;
    const existing = metrics.errors.get(key);
    metrics.errors.set(key, {
      endpoint,
      errorCount: (existing?.errorCount ?? 0) + 1,
      lastError: `HTTP ${status}`,
      lastOccurrence: metric.timestamp,
    });
  }
}

export function recordError(endpoint: string, error: string): void {
  const key = endpoint;
  const existing = metrics.errors.get(key);
  metrics.errors.set(key, {
    endpoint,
    errorCount: (existing?.errorCount ?? 0) + 1,
    lastError: error,
    lastOccurrence: new Date().toISOString(),
  });
}

// ============================================================
// Metrics Accessors
// ============================================================

export function getAverageResponseTime(endpoint?: string): number {
  const filtered = endpoint
    ? metrics.requests.filter((m) => m.endpoint === endpoint)
    : metrics.requests;

  if (filtered.length === 0) return 0;

  const total = filtered.reduce((sum, m) => sum + m.duration, 0);
  return Math.round(total / filtered.length);
}

export function getErrorRate(endpoint?: string): number {
  const filtered = endpoint
    ? metrics.requests.filter((m) => m.endpoint === endpoint)
    : metrics.requests;

  if (filtered.length === 0) return 0;

  const errors = filtered.filter((m) => m.status >= 400).length;
  return Math.round((errors / filtered.length) * 10000) / 100; // percentage with 2 decimals
}

export function getErrorsByEndpoint(): ErrorMetric[] {
  return Array.from(metrics.errors.values());
}

export function getUptime(): number {
  return Date.now() - metrics.startTime;
}

export function getUptimeFormatted(): string {
  const ms = getUptime();
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

export function getMemoryUsage(): { heapUsed: number; heapTotal: number; rss: number } | null {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const mem = process.memoryUsage();
    return {
      heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
      rss: Math.round(mem.rss / 1024 / 1024),
    };
  }
  return null;
}

export function getMetricsSummary(): {
  totalRequests: number;
  avgResponseTimeMs: number;
  errorRatePercent: number;
  uptimeFormatted: string;
  memoryMb: { heapUsed: number; heapTotal: number; rss: number } | null;
  errorsByEndpoint: ErrorMetric[];
} {
  return {
    totalRequests: metrics.requests.length,
    avgResponseTimeMs: getAverageResponseTime(),
    errorRatePercent: getErrorRate(),
    uptimeFormatted: getUptimeFormatted(),
    memoryMb: getMemoryUsage(),
    errorsByEndpoint: getErrorsByEndpoint(),
  };
}

// ============================================================
// API Route Wrapper with Performance Monitoring
// ============================================================

export function withMonitoring(
  handler: (req: Request) => Promise<Response>,
  endpoint: string
): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    const start = Date.now();
    const method = req.method;

    try {
      const response = await handler(req);
      const duration = Date.now() - start;

      recordRequestMetric(endpoint, method, duration, response.status);

      if (duration > 3000) {
        logger.warn(`Slow request: ${method} ${endpoint} took ${duration}ms`, {
          action: 'slow_request',
          duration,
          endpoint,
        } as LogContext);
      }

      return response;
    } catch (error) {
      const duration = Date.now() - start;
      const errorMsg = error instanceof Error ? error.message : String(error);

      recordRequestMetric(endpoint, method, duration, 500);
      recordError(endpoint, errorMsg);

      throw error;
    }
  };
}
