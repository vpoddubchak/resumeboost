import {
  recordRequestMetric,
  recordError,
  getAverageResponseTime,
  getErrorRate,
  getErrorsByEndpoint,
  getUptime,
  getUptimeFormatted,
  getMetricsSummary,
} from '@/app/lib/monitoring';

describe('Performance Monitoring', () => {
  describe('recordRequestMetric', () => {
    it('should record a request metric', () => {
      recordRequestMetric('/api/test', 'GET', 150, 200);
      const summary = getMetricsSummary();
      expect(summary.totalRequests).toBeGreaterThan(0);
    });

    it('should track error metrics for 4xx/5xx', () => {
      recordRequestMetric('/api/fail', 'POST', 50, 500);
      const errors = getErrorsByEndpoint();
      const failEndpoint = errors.find((e) => e.endpoint === '/api/fail');
      expect(failEndpoint).toBeDefined();
      expect(failEndpoint!.errorCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('recordError', () => {
    it('should record an error for an endpoint', () => {
      recordError('/api/broken', 'Connection timeout');
      const errors = getErrorsByEndpoint();
      const broken = errors.find((e) => e.endpoint === '/api/broken');
      expect(broken).toBeDefined();
      expect(broken!.lastError).toBe('Connection timeout');
    });

    it('should increment error count on repeated failures', () => {
      recordError('/api/flaky', 'error 1');
      recordError('/api/flaky', 'error 2');
      const errors = getErrorsByEndpoint();
      const flaky = errors.find((e) => e.endpoint === '/api/flaky');
      expect(flaky!.errorCount).toBeGreaterThanOrEqual(2);
      expect(flaky!.lastError).toBe('error 2');
    });
  });

  describe('getAverageResponseTime', () => {
    it('should return 0 for no requests', () => {
      // Use a unique endpoint that has no data
      expect(getAverageResponseTime('/api/nonexistent-unique-12345')).toBe(0);
    });

    it('should calculate average for specific endpoint', () => {
      recordRequestMetric('/api/avg-test', 'GET', 100, 200);
      recordRequestMetric('/api/avg-test', 'GET', 200, 200);
      const avg = getAverageResponseTime('/api/avg-test');
      expect(avg).toBe(150);
    });
  });

  describe('getErrorRate', () => {
    it('should return 0 for no requests', () => {
      expect(getErrorRate('/api/nonexistent-unique-67890')).toBe(0);
    });
  });

  describe('getUptime', () => {
    it('should return positive uptime', () => {
      expect(getUptime()).toBeGreaterThan(0);
    });

    it('should return formatted uptime string', () => {
      const formatted = getUptimeFormatted();
      expect(typeof formatted).toBe('string');
      expect(formatted.length).toBeGreaterThan(0);
    });
  });

  describe('getMetricsSummary', () => {
    it('should return complete summary object', () => {
      const summary = getMetricsSummary();
      expect(summary).toHaveProperty('totalRequests');
      expect(summary).toHaveProperty('avgResponseTimeMs');
      expect(summary).toHaveProperty('errorRatePercent');
      expect(summary).toHaveProperty('uptimeFormatted');
      expect(summary).toHaveProperty('memoryMb');
      expect(summary).toHaveProperty('errorsByEndpoint');
    });
  });
});
