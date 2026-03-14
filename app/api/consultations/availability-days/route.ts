import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function GET() {
  try {
    const rules = await prisma.availabilityRule.findMany({
      where: { is_active: true },
      select: { day_of_week: true },
      distinct: ['day_of_week'],
      orderBy: { day_of_week: 'asc' },
    });

    const availableDays = rules.map((r) => r.day_of_week);

    return NextResponse.json({
      success: true,
      data: { availableDays },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    console.error('Error fetching availability days:', error);
    return NextResponse.json(
      { success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to fetch availability days.' } },
      { status: 500 }
    );
  }
}
