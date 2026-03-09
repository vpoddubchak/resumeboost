import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

// GET /api/portfolio - List all portfolio content
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const content_type = searchParams.get('content_type');
    const is_featured = searchParams.get('is_featured');

    const where = content_type ? { content_type } : 
                  is_featured ? { is_featured: is_featured === 'true' } : {};

    const portfolioContent = await prisma.portfolioContent.findMany({
      where,
      orderBy: [
        { is_featured: 'desc' },
        { created_at: 'desc' }
      ]
    });

    return NextResponse.json({
      success: true,
      data: portfolioContent,
      meta: {
        timestamp: new Date().toISOString(),
        count: portfolioContent.length
      }
    });
  } catch (error) {
    console.error('Error fetching portfolio content:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch portfolio content'
      }
    }, { status: 500 });
  }
}

// POST /api/portfolio - Create new portfolio content
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, content_type, file_url, is_featured } = body;

    // Validate required fields
    if (!title || !content_type) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Title and content type are required'
        }
      }, { status: 400 });
    }

    // Create new portfolio content
    const portfolioItem = await prisma.portfolioContent.create({
      data: {
        title,
        description,
        content_type,
        file_url,
        is_featured: is_featured || false
      }
    });

    return NextResponse.json({
      success: true,
      data: portfolioItem,
      meta: {
        timestamp: new Date().toISOString()
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating portfolio content:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to create portfolio content'
      }
    }, { status: 500 });
  }
}
