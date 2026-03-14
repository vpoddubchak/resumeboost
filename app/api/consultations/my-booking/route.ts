import { NextResponse } from 'next/server';
import { auth } from '@/app/lib/auth';
import prisma from '@/app/lib/prisma';
import { SLOT_DURATION_MINUTES } from '@/app/lib/consultation-config';

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
        { status: 401 }
      );
    }

    const booking = await prisma.consultation.findFirst({
      where: {
        user_id: session.user.userId,
        status: 'scheduled',
        consultation_date: { gt: new Date() },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'No active booking found.' } },
        { status: 404 }
      );
    }

    await prisma.consultation.update({
      where: { consultation_id: booking.consultation_id },
      data: { status: 'cancelled' },
    });

    return NextResponse.json({
      success: true,
      data: { cancelled: true },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return NextResponse.json(
      { success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to cancel booking.' } },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
        { status: 401 }
      );
    }

    const booking = await prisma.consultation.findFirst({
      where: {
        user_id: session.user.userId,
        status: 'scheduled',
        consultation_date: { gt: new Date() },
      },
      orderBy: { consultation_date: 'asc' },
    });

    if (!booking) {
      return NextResponse.json({
        success: true,
        data: { booking: null },
        meta: { timestamp: new Date().toISOString() },
      });
    }

    const slotEnd = new Date(booking.consultation_date.getTime() + SLOT_DURATION_MINUTES * 60 * 1000);

    return NextResponse.json({
      success: true,
      data: {
        booking: {
          consultationId: booking.consultation_id,
          date: booking.consultation_date.toISOString().split('T')[0],
          time: booking.consultation_date.toISOString(),
          endTime: slotEnd.toISOString(),
          timezone: 'UTC',
        },
      },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    console.error('Error fetching user booking:', error);
    return NextResponse.json(
      { success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to fetch booking.' } },
      { status: 500 }
    );
  }
}
