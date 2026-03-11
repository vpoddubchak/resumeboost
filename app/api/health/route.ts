import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  let dbStatus = 'unknown';
  let uptimeFormatted = 'N/A';

  try {
    // Dynamic import to avoid cold-start failures if prisma env vars missing
    const { default: prisma } = await import('@/app/lib/prisma');
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch {
    dbStatus = 'disconnected';
  }

  try {
    const { getMetricsSummary } = await import('@/app/lib/monitoring');
    const metrics = getMetricsSummary();
    uptimeFormatted = metrics.uptimeFormatted;
  } catch {
    // Monitoring not critical for health response
  }

  const responseTimeMs = Date.now() - startTime;

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
    uptime: uptimeFormatted,
  });
}
