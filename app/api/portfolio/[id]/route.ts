import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { logger } from '@/app/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numericId = parseInt(id, 10);

    if (isNaN(numericId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'Invalid portfolio item ID',
          },
        },
        { status: 400 }
      );
    }

    const portfolioItem = await prisma.portfolioContent.findUnique({
      where: { content_id: numericId },
    });

    if (!portfolioItem) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Portfolio item not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: portfolioItem,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Failed to fetch portfolio item', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch portfolio item',
        },
      },
      { status: 500 }
    );
  }
}
