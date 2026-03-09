import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Database connection singleton
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// GET /api/analytics - List all analytics events
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const event_type = searchParams.get('event_type');
    const limit = searchParams.get('limit');

    const where = user_id ? { user_id: parseInt(user_id) } : 
                  event_type ? { event_type } : {};

    const analytics = await prisma.analytics.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: limit ? parseInt(limit) : 100
    });

    return NextResponse.json({
      success: true,
      data: analytics,
      meta: {
        timestamp: new Date().toISOString(),
        count: analytics.length
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch analytics'
      }
    }, { status: 500 });
  }
}

// POST /api/analytics - Create new analytics event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, event_type, event_data } = body;

    // Validate required fields
    if (!user_id || !event_type) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'User ID and event type are required'
        }
      }, { status: 400 });
    }

    // Create new analytics event
    const analyticsEvent = await prisma.analytics.create({
      data: {
        user_id: parseInt(user_id),
        event_type,
        event_data
      }
    });

    return NextResponse.json({
      success: true,
      data: analyticsEvent,
      meta: {
        timestamp: new Date().toISOString()
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating analytics event:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to create analytics event'
      }
    }, { status: 500 });
  }
}
