/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

// Mock prisma
jest.mock('@/app/lib/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$2a$12$hashedpassword'),
}));

// Mock rate-limit
jest.mock('@/app/lib/rate-limit', () => ({
  checkRateLimit: jest.fn().mockReturnValue({ success: true }),
  getClientIp: jest.fn().mockReturnValue('127.0.0.1'),
  rateLimitResponse: jest.fn().mockReturnValue(
    Response.json(
      { success: false, error: { code: 'RATE_LIMIT', message: 'Too many requests' } },
      { status: 429 }
    )
  ),
  RATE_LIMITS: { AUTH_REGISTER: { maxRequests: 5, windowMs: 60000 } },
}));

// Mock validations
jest.mock('@/app/lib/validations', () => ({
  registerSchema: {},
  validateBody: jest.fn(),
}));

import prisma from '@/app/lib/prisma';
import { checkRateLimit, rateLimitResponse } from '@/app/lib/rate-limit';
import { validateBody } from '@/app/lib/validations';

function buildRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('/api/auth/register [P0]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('[P0] should register a new user successfully', async () => {
    // Given: valid input, no existing user
    const input = { email: 'new@example.com', password: 'Str0ng!Pass', first_name: 'John', last_name: 'Doe' };
    (validateBody as jest.Mock).mockReturnValue({
      success: true,
      data: input,
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.create as jest.Mock).mockResolvedValue({
      user_id: 1,
      email: input.email,
      first_name: input.first_name,
      last_name: input.last_name,
      role: 'job_seeker',
      created_at: new Date('2026-01-01'),
    });

    // When
    const { POST } = await import('@/app/api/auth/register/route');
    const response = await POST(buildRequest(input));
    const body = await response.json();

    // Then
    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.email).toBe(input.email);
    expect(body.data.role).toBe('job_seeker');
    expect(body.data.user_id).toBe(1);
  });

  it('[P0] should return 409 when email already exists', async () => {
    // Given
    const input = { email: 'existing@example.com', password: 'Str0ng!Pass' };
    (validateBody as jest.Mock).mockReturnValue({ success: true, data: input });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ user_id: 99, email: input.email });

    // When
    const { POST } = await import('@/app/api/auth/register/route');
    const response = await POST(buildRequest(input));
    const body = await response.json();

    // Then
    expect(response.status).toBe(409);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('USER_EXISTS');
  });

  it('[P0] should return 400 on validation failure', async () => {
    // Given
    (validateBody as jest.Mock).mockReturnValue({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid email' },
    });

    // When
    const { POST } = await import('@/app/api/auth/register/route');
    const response = await POST(buildRequest({ email: 'bad' }));
    const body = await response.json();

    // Then
    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('[P0] should return 429 when rate limited', async () => {
    // Given
    (checkRateLimit as jest.Mock).mockReturnValue({ success: false });

    // When
    const { POST } = await import('@/app/api/auth/register/route');
    const response = await POST(buildRequest({ email: 'test@example.com', password: 'pass' }));

    // Then
    expect(rateLimitResponse).toHaveBeenCalled();
  });

  it('[P0] should return 500 on unexpected error', async () => {
    // Given: rate limit passes, but DB throws
    (checkRateLimit as jest.Mock).mockReturnValue({ success: true });
    (validateBody as jest.Mock).mockReturnValue({
      success: true,
      data: { email: 'err@example.com', password: 'Str0ng!Pass' },
    });
    (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('DB down'));

    // When
    const { POST } = await import('@/app/api/auth/register/route');
    const response = await POST(buildRequest({ email: 'err@example.com', password: 'Str0ng!Pass' }));
    const body = await response.json();

    // Then
    expect(response.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});
