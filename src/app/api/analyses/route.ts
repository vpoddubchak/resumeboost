import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

// GET /api/analyses - List all analyses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const upload_id = searchParams.get('upload_id');
    const user_id = searchParams.get('user_id');

    const where = upload_id ? { upload_id: parseInt(upload_id) } : 
                  user_id ? { upload: { user_id: parseInt(user_id) } } : {};

    const analyses = await prisma.analysis.findMany({
      where,
      include: {
        upload: {
          select: {
            file_name: true,
            file_size: true,
            mime_type: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: analyses,
      meta: {
        timestamp: new Date().toISOString(),
        count: analyses.length
      }
    });
  } catch (error) {
    console.error('Error fetching analyses:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch analyses'
      }
    }, { status: 500 });
  }
}

// POST /api/analyses - Create new analysis
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { upload_id, analysis_data, score, recommendations } = body;

    // Validate required fields
    if (!upload_id || !analysis_data) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Upload ID and analysis data are required'
        }
      }, { status: 400 });
    }

    // Create new analysis
    const analysis = await prisma.analysis.create({
      data: {
        upload_id: parseInt(upload_id),
        analysis_data,
        score: score ? parseInt(score) : null,
        recommendations
      },
      include: {
        upload: {
          select: {
            file_name: true,
            file_size: true,
            mime_type: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: analysis,
      meta: {
        timestamp: new Date().toISOString()
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating analysis:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to create analysis'
      }
    }, { status: 500 });
  }
}
