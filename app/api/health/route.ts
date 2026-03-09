import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const startTime = Date.now();
    
    // Basic health check without database dependency
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: 'production',
      version: '1.0.0',
      responseTime: Date.now() - startTime,
      service: 'ResumeBoost API'
    };
    
    return NextResponse.json(health, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 });
  }
}
