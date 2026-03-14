import { NextRequest, NextResponse } from 'next/server';
import { fromZonedTime } from 'date-fns-tz';
import prisma from '@/app/lib/prisma';
import { CONSULTANT_TIMEZONE, SLOT_DURATION_MINUTES, MAX_BOOKING_DAYS_AHEAD } from '@/app/lib/consultation-config';

function kyivTimeToUTC(dateStr: string, timeStr: string): Date {
  return fromZonedTime(new Date(`${dateStr}T${timeStr}:00`), CONSULTANT_TIMEZONE);
}

function generateSlots(dateStr: string, startTime: string, endTime: string): Date[] {
  const start = kyivTimeToUTC(dateStr, startTime);
  const end = kyivTimeToUTC(dateStr, endTime);
  const slots: Date[] = [];
  let current = start;
  while (current < end) {
    slots.push(new Date(current));
    current = new Date(current.getTime() + SLOT_DURATION_MINUTES * 60 * 1000);
  }
  return slots;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    if (!dateParam) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'date query parameter is required.' } },
        { status: 400 }
      );
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateParam)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'date must be in YYYY-MM-DD format.' } },
        { status: 400 }
      );
    }

    const requestedDate = new Date(dateParam + 'T00:00:00');
    if (isNaN(requestedDate.getTime())) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid date.' } },
        { status: 400 }
      );
    }

    // Check date range: today to MAX_BOOKING_DAYS_AHEAD days ahead
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + MAX_BOOKING_DAYS_AHEAD);

    if (requestedDate < today || requestedDate >= maxDate) {
      return NextResponse.json(
        { success: false, error: { code: 'DATE_OUT_OF_RANGE', message: `Date must be between today and ${MAX_BOOKING_DAYS_AHEAD} days ahead.` } },
        { status: 400 }
      );
    }

    const dayOfWeek = requestedDate.getDay(); // 0=Sunday

    // Check for date override
    const dateOverride = await prisma.dateOverride.findUnique({
      where: { date: new Date(dateParam) },
    });

    if (dateOverride?.is_blocked) {
      return NextResponse.json({
        success: true,
        data: { date: dateParam, timezone: CONSULTANT_TIMEZONE, slots: [] },
        meta: { timestamp: new Date().toISOString() },
      });
    }

    let startTime: string;
    let endTime: string;

    if (dateOverride && !dateOverride.is_blocked && dateOverride.start_time && dateOverride.end_time) {
      // Custom hours override
      startTime = dateOverride.start_time;
      endTime = dateOverride.end_time;
    } else {
      // Get availability rule for this day of week
      const rule = await prisma.availabilityRule.findFirst({
        where: { day_of_week: dayOfWeek, is_active: true },
      });

      if (!rule) {
        return NextResponse.json({
          success: true,
          data: { date: dateParam, timezone: CONSULTANT_TIMEZONE, slots: [] },
          meta: { timestamp: new Date().toISOString() },
        });
      }

      startTime = rule.start_time;
      endTime = rule.end_time;
    }

    // Generate all possible slots
    const allSlots = generateSlots(dateParam, startTime, endTime);

    // Filter out past slots (for today)
    const now = new Date();
    const futureSlots = allSlots.filter((slot) => slot > now);

    // Get booked consultations for this date
    const dayStartUTC = kyivTimeToUTC(dateParam, '00:00');
    const dayEndUTC = kyivTimeToUTC(dateParam, '23:59');

    const bookedConsultations = await prisma.consultation.findMany({
      where: {
        consultation_date: { gte: dayStartUTC, lte: dayEndUTC },
        status: { not: 'cancelled' },
      },
      select: { consultation_date: true },
    });

    const bookedTimes = new Set(
      bookedConsultations.map((c) => c.consultation_date.toISOString())
    );

    // Remove booked slots
    const availableSlots = futureSlots.filter(
      (slot) => !bookedTimes.has(slot.toISOString())
    );

    return NextResponse.json({
      success: true,
      data: {
        date: dateParam,
        timezone: CONSULTANT_TIMEZONE,
        slots: availableSlots.map((slot) => ({
          start: slot.toISOString(),
          end: new Date(slot.getTime() + SLOT_DURATION_MINUTES * 60 * 1000).toISOString(),
        })),
      },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    console.error('Error fetching slots:', error);
    return NextResponse.json(
      { success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to fetch available slots.' } },
      { status: 500 }
    );
  }
}
