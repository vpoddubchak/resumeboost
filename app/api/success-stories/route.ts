import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/app/lib/prisma';
import { logger } from '@/app/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const industry = searchParams.get('industry');
    const outcome_type = searchParams.get('outcome_type');

    const where: Prisma.SuccessStoryWhereInput = {};
    if (industry) where.industry = industry;
    if (outcome_type) where.outcome_type = outcome_type;

    const data = await prisma.successStory.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: [{ is_featured: 'desc' }, { created_at: 'desc' }],
    });

    return NextResponse.json({
      success: true,
      data,
      meta: {
        count: data.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Failed to fetch success stories', { error });
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch success stories',
        },
      },
      { status: 500 }
    );
  }
}
