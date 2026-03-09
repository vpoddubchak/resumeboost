import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

// GET /api/consultations - List all consultations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const status = searchParams.get('status');

    const where = user_id ? { user_id: parseInt(user_id) } : 
                  status ? { status } : {};

    const consultations = await prisma.consultation.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
            first_name: true,
            last_name: true
          }
        }
      },
      orderBy: { consultation_date: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: consultations,
      meta: {
        timestamp: new Date().toISOString(),
        count: consultations.length
      }
    });
  } catch (error) {
    console.error('Error fetching consultations:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch consultations'
      }
    }, { status: 500 });
  }
}

// POST /api/consultations - Create new consultation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, consultation_date, notes } = body;

    // Validate required fields
    if (!user_id || !consultation_date) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'User ID and consultation date are required'
        }
      }, { status: 400 });
    }

    // Create new consultation
    const consultation = await prisma.consultation.create({
      data: {
        user_id: parseInt(user_id),
        consultation_date: new Date(consultation_date),
        notes,
        status: 'scheduled'
      },
      include: {
        user: {
          select: {
            email: true,
            first_name: true,
            last_name: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: consultation,
      meta: {
        timestamp: new Date().toISOString()
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating consultation:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to create consultation'
      }
    }, { status: 500 });
  }
}
