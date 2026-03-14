import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/app/lib/auth';
import prisma from '@/app/lib/prisma';
import { SLOT_DURATION_MINUTES, MAX_BOOKING_DAYS_AHEAD } from '@/app/lib/consultation-config';

const bookingSchema = z.object({
  slotStart: z.string().datetime(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = bookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request body. slotStart must be a valid ISO datetime string.' } },
        { status: 400 }
      );
    }

    const slotStart = new Date(parsed.data.slotStart);

    // Validate slot is in the future
    if (slotStart <= new Date()) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Slot must be in the future.' } },
        { status: 400 }
      );
    }

    // Validate slot is within booking window
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + MAX_BOOKING_DAYS_AHEAD);
    if (slotStart > maxDate) {
      return NextResponse.json(
        { success: false, error: { code: 'DATE_OUT_OF_RANGE', message: `Slot must be within ${MAX_BOOKING_DAYS_AHEAD} days.` } },
        { status: 400 }
      );
    }

    const booking = await prisma.$transaction(async (tx) => {
      // Cancel any existing active booking for this user (supports rescheduling)
      await tx.consultation.updateMany({
        where: {
          user_id: session.user.userId,
          status: 'scheduled',
          consultation_date: { gt: new Date() },
        },
        data: { status: 'cancelled' },
      });

      const existing = await tx.consultation.findFirst({
        where: {
          consultation_date: slotStart,
          status: { not: 'cancelled' },
        },
      });
      if (existing) throw new Error('SLOT_TAKEN');

      return tx.consultation.create({
        data: {
          user_id: session.user.userId,
          consultation_date: slotStart,
          duration_minutes: SLOT_DURATION_MINUTES,
          status: 'scheduled',
        },
      });
    });

    const slotEnd = new Date(slotStart.getTime() + SLOT_DURATION_MINUTES * 60 * 1000);

    return NextResponse.json(
      {
        success: true,
        data: {
          consultationId: booking.consultation_id,
          date: slotStart.toISOString().split('T')[0],
          time: slotStart.toISOString(),
          endTime: slotEnd.toISOString(),
          timezone: 'UTC',
        },
        meta: { timestamp: new Date().toISOString() },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'SLOT_TAKEN') {
      return NextResponse.json(
        { success: false, error: { code: 'SLOT_TAKEN', message: 'This slot is no longer available.' } },
        { status: 409 }
      );
    }
    console.error('Error booking consultation:', error);
    return NextResponse.json(
      { success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to book consultation.' } },
      { status: 500 }
    );
  }
}
