/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

// Mock prisma
jest.mock('@/app/lib/prisma', () => ({
  __esModule: true,
  default: {
    $queryRaw: jest.fn(),
  },
}));

// Mock monitoring
jest.mock('@/app/lib/monitoring', () => ({
  getMetricsSummary: jest.fn().mockReturnValue({
    totalRequests: 10,
    avgResponseTimeMs: 50,
    errorRatePercent: 1.5,
    uptimeFormatted: '1h 30m 0s',
    memoryMb: { heapUsed: 50, heapTotal: 100, rss: 150 },
    errorsByEndpoint: [],
  }),
}));

// Mock logger
jest.mock('@/app/lib/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import prisma from '@/app/lib/prisma';

describe('/api/health', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return healthy status when DB is connected', async () => {
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);

    const { GET } = await import('@/app/api/health/route');
    const request = new NextRequest('http://localhost:3000/api/health');
    const response = await GET(request);
    const body = await response.json();

    expect(body.status).toBe('healthy');
    expect(body.service).toBe('ResumeBoost API');
    expect(body.version).toBe('1.0.0');
    expect(body.timestamp).toBeDefined();
    expect(body.checks.database).toBe('connected');
    expect(body.responseTimeMs).toBeDefined();
    expect(body.uptime).toBeDefined();
  });

  it('should return degraded status when DB is disconnected', async () => {
    (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('connection refused'));

    const { GET } = await import('@/app/api/health/route');
    const request = new NextRequest('http://localhost:3000/api/health');
    const response = await GET(request);
    const body = await response.json();

    expect(body.status).toBe('degraded');
    expect(body.checks.database).toBe('disconnected');
  });

  it('should preserve existing response shape fields', async () => {
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);

    const { GET } = await import('@/app/api/health/route');
    const request = new NextRequest('http://localhost:3000/api/health');
    const response = await GET(request);
    const body = await response.json();

    // These fields MUST exist for CI/CD compatibility
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('timestamp');
    expect(body).toHaveProperty('service');
    expect(body).toHaveProperty('environment');
    expect(body).toHaveProperty('version');
  });
});

describe('/api/health/detailed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return comprehensive health data', async () => {
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);

    const { GET } = await import('@/app/api/health/detailed/route');
    const request = new NextRequest('http://localhost:3000/api/health/detailed');
    const response = await GET(request);
    const body = await response.json();

    expect(body.status).toBeDefined();
    expect(body.checks).toBeDefined();
    expect(body.checks.database).toBeDefined();
    expect(body.checks.s3).toBeDefined();
    expect(body.checks.environment).toBeDefined();
    expect(body.metrics).toBeDefined();
    expect(body.metrics.totalRequests).toBeDefined();
    expect(body.metrics.uptime).toBeDefined();
    expect(body.responseTimeMs).toBeDefined();
  });
});
