import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { getMetricsSummary } from '@/app/lib/monitoring';
import { logger } from '@/app/lib/logger';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Database connectivity check
  let dbStatus = 'unknown';
  let dbResponseTimeMs = 0;
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbResponseTimeMs = Date.now() - dbStart;
    dbStatus = 'connected';
  } catch (error) {
    dbStatus = 'disconnected';
    logger.error('Health check: database connectivity failed', {
      action: 'health_check_db',
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // S3 connectivity check (verify env vars are set)
  const s3Status = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? 'configured'
    : 'not_configured';

  // Environment variable validation
  const requiredEnvVars = [
    'POSTGRES_PRISMA_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
  ];

  const envStatus = requiredEnvVars.reduce<Record<string, boolean>>((acc, key) => {
    acc[key] = !!process.env[key];
    return acc;
  }, {});

  const allEnvPresent = Object.values(envStatus).every(Boolean);

  const metrics = getMetricsSummary();
  const totalResponseTimeMs = Date.now() - startTime;

  const isHealthy = dbStatus === 'connected' && allEnvPresent;

  return NextResponse.json({
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    service: 'ResumeBoost API',
    environment: process.env.NODE_ENV || 'production',
    version: '1.0.0',
    checks: {
      database: {
        status: dbStatus,
        responseTimeMs: dbResponseTimeMs,
      },
      s3: {
        status: s3Status,
      },
      environment: {
        status: allEnvPresent ? 'complete' : 'incomplete',
        variables: envStatus,
      },
    },
    metrics: {
      totalRequests: metrics.totalRequests,
      avgResponseTimeMs: metrics.avgResponseTimeMs,
      errorRatePercent: metrics.errorRatePercent,
      uptime: metrics.uptimeFormatted,
      memory: metrics.memoryMb,
      errorsByEndpoint: metrics.errorsByEndpoint,
    },
    responseTimeMs: totalResponseTimeMs,
  });
}
