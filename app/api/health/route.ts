import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { getMetricsSummary } from '@/app/lib/monitoring';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Database connectivity check
  let dbStatus = 'unknown';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch {
    dbStatus = 'disconnected';
  }

  const responseTimeMs = Date.now() - startTime;
  const metrics = getMetricsSummary();

  return NextResponse.json({ 
    status: dbStatus === 'connected' ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    service: 'ResumeBoost API',
    environment: process.env.NODE_ENV || 'production',
    version: '1.0.0',
    checks: {
      database: dbStatus,
    },
    responseTimeMs,
    uptime: metrics.uptimeFormatted,
  });
}
