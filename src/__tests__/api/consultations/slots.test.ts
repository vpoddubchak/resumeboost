/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

// Mock Prisma
jest.mock('@/app/lib/prisma', () => {
  const mockPrisma = {
    dateOverride: {
      findUnique: jest.fn(),
    },
    availabilityRule: {
      findFirst: jest.fn(),
    },
    consultation: {
      findMany: jest.fn(),
    },
  };
  return { __esModule: true, default: mockPrisma };
});

// Mock date-fns-tz
jest.mock('date-fns-tz', () => ({
  fromZonedTime: jest.fn((date: Date) => date),
}));

import prisma from '@/app/lib/prisma';

const mockPrisma = prisma as unknown as {
  dateOverride: { findUnique: jest.MockedFunction<any> };
  availabilityRule: { findFirst: jest.MockedFunction<any> };
  consultation: { findMany: jest.MockedFunction<any> };
};

function buildRequest(date: string): NextRequest {
  return new NextRequest(`http://localhost:3000/api/consultations/slots?date=${date}`);
}

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getFutureDateStr(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

describe('/api/consultations/slots', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: no overrides, no bookings
    mockPrisma.dateOverride.findUnique.mockResolvedValue(null);
    mockPrisma.consultation.findMany.mockResolvedValue([]);
  });

  it('returns slots for a valid weekday with availability rule', async () => {
    const dateStr = getFutureDateStr(1);
    mockPrisma.availabilityRule.findFirst.mockResolvedValue({
      rule_id: 1,
      day_of_week: new Date(dateStr).getDay(),
      start_time: '10:00',
      end_time: '12:00',
      is_active: true,
    });

    const { GET } = await import('@/app/api/consultations/slots/route');
    const response = await GET(buildRequest(dateStr));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.date).toBe(dateStr);
    expect(data.data.timezone).toBe('Europe/Kyiv');
    expect(Array.isArray(data.data.slots)).toBe(true);
  });

  it('returns empty slots for weekend (no availability rule)', async () => {
    // Find a future Sunday
    const today = new Date();
    const daysUntilSunday = (7 - today.getDay()) % 7 || 7;
    const sundayStr = getFutureDateStr(daysUntilSunday <= 13 ? daysUntilSunday : 0);

    mockPrisma.availabilityRule.findFirst.mockResolvedValue(null);

    const { GET } = await import('@/app/api/consultations/slots/route');
    const response = await GET(buildRequest(sundayStr));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.slots).toEqual([]);
  });

  it('excludes already-booked slots', async () => {
    const dateStr = getFutureDateStr(1);
    const bookedTime = new Date(`${dateStr}T10:00:00Z`);

    mockPrisma.availabilityRule.findFirst.mockResolvedValue({
      rule_id: 1,
      day_of_week: new Date(dateStr).getDay(),
      start_time: '10:00',
      end_time: '12:00',
      is_active: true,
    });
    mockPrisma.consultation.findMany.mockResolvedValue([
      { consultation_date: bookedTime },
    ]);

    const { GET } = await import('@/app/api/consultations/slots/route');
    const response = await GET(buildRequest(dateStr));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    // The booked slot should not appear in results
    const bookedIso = bookedTime.toISOString();
    const slotStarts = data.data.slots.map((s: { start: string }) => s.start);
    expect(slotStarts).not.toContain(bookedIso);
  });

  it('respects DateOverride (blocked date returns empty)', async () => {
    const dateStr = getFutureDateStr(1);
    mockPrisma.dateOverride.findUnique.mockResolvedValue({
      override_id: 1,
      date: new Date(dateStr),
      is_blocked: true,
      start_time: null,
      end_time: null,
      reason: 'Holiday',
    });

    const { GET } = await import('@/app/api/consultations/slots/route');
    const response = await GET(buildRequest(dateStr));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.slots).toEqual([]);
  });

  it('rejects dates more than 14 days ahead', async () => {
    const dateStr = getFutureDateStr(15);

    const { GET } = await import('@/app/api/consultations/slots/route');
    const response = await GET(buildRequest(dateStr));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('DATE_OUT_OF_RANGE');
  });

  it('rejects past dates', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    const dateStr = `${pastDate.getFullYear()}-${String(pastDate.getMonth() + 1).padStart(2, '0')}-${String(pastDate.getDate()).padStart(2, '0')}`;

    const { GET } = await import('@/app/api/consultations/slots/route');
    const response = await GET(buildRequest(dateStr));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('DATE_OUT_OF_RANGE');
  });

  it('returns 400 when date param is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/consultations/slots');

    const { GET } = await import('@/app/api/consultations/slots/route');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });
});
