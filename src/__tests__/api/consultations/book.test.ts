/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

// Mock auth
const mockAuth = jest.fn();
jest.mock('@/app/lib/auth', () => ({
  auth: () => mockAuth(),
}));

// Mock Prisma
const mockTransaction = jest.fn();
const mockFindFirst = jest.fn();
jest.mock('@/app/lib/prisma', () => {
  const mockPrisma = {
    consultation: {
      findFirst: (...args: any[]) => mockFindFirst(...args),
    },
    $transaction: (fn: (tx: any) => Promise<any>) => mockTransaction(fn),
  };
  return { __esModule: true, default: mockPrisma };
});

function buildRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/consultations/book', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function getFutureSlotISO(daysAhead: number = 1): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setHours(10, 0, 0, 0);
  return d.toISOString();
}

describe('/api/consultations/book', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('successfully books an available slot (auth required)', async () => {
    mockAuth.mockResolvedValue({ user: { userId: 42, email: 'test@test.com' } });
    mockFindFirst.mockResolvedValue(null); // no existing booking
    mockTransaction.mockImplementation(async (fn: Function) => {
      const tx = {
        consultation: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({
            consultation_id: 1,
            user_id: 42,
            consultation_date: new Date(getFutureSlotISO()),
            duration_minutes: 30,
            status: 'scheduled',
          }),
        },
      };
      return fn(tx);
    });

    const { POST } = await import('@/app/api/consultations/book/route');
    const response = await POST(buildRequest({ slotStart: getFutureSlotISO() }));
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.consultationId).toBe(1);
    expect(data.meta.timestamp).toBeDefined();
  });

  it('returns 401 for unauthenticated user', async () => {
    mockAuth.mockResolvedValue(null);

    const { POST } = await import('@/app/api/consultations/book/route');
    const response = await POST(buildRequest({ slotStart: getFutureSlotISO() }));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 409 for already-booked slot', async () => {
    mockAuth.mockResolvedValue({ user: { userId: 42, email: 'test@test.com' } });
    mockFindFirst.mockResolvedValue(null); // no existing booking by user
    mockTransaction.mockImplementation(async (fn: Function) => {
      const tx = {
        consultation: {
          findFirst: jest.fn().mockResolvedValue({ consultation_id: 99 }),
          create: jest.fn(),
        },
      };
      return fn(tx);
    });

    const { POST } = await import('@/app/api/consultations/book/route');
    const response = await POST(buildRequest({ slotStart: getFutureSlotISO() }));
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('SLOT_TAKEN');
  });

  it('validates slot time format', async () => {
    mockAuth.mockResolvedValue({ user: { userId: 42, email: 'test@test.com' } });

    const { POST } = await import('@/app/api/consultations/book/route');
    const response = await POST(buildRequest({ slotStart: 'not-a-date' }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 409 when user already has an active booking', async () => {
    mockAuth.mockResolvedValue({ user: { userId: 42, email: 'test@test.com' } });
    mockFindFirst.mockResolvedValue({ consultation_id: 99, status: 'scheduled' });

    const { POST } = await import('@/app/api/consultations/book/route');
    const response = await POST(buildRequest({ slotStart: getFutureSlotISO() }));
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('ALREADY_BOOKED');
  });

  it('returns 400 for missing slotStart', async () => {
    mockAuth.mockResolvedValue({ user: { userId: 42, email: 'test@test.com' } });

    const { POST } = await import('@/app/api/consultations/book/route');
    const response = await POST(buildRequest({}));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });
});
