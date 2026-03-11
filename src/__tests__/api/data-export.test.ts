/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

// Mock auth
jest.mock('@/app/lib/auth', () => ({
  auth: jest.fn(),
}));

// Mock prisma
jest.mock('@/app/lib/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

import { auth } from '@/app/lib/auth';
import prisma from '@/app/lib/prisma';

function buildRequest(id: string): NextRequest {
  return new NextRequest(`http://localhost:3000/api/users/${id}/data-export`, {
    method: 'GET',
  });
}

function buildParams(id: string): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

describe('/api/users/[id]/data-export [P0]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('[P0] should return 401 when not authenticated', async () => {
    // Given
    (auth as jest.Mock).mockResolvedValue(null);

    // When
    const { GET } = await import('@/app/api/users/[id]/data-export/route');
    const response = await GET(buildRequest('1'), buildParams('1'));
    const body = await response.json();

    // Then
    expect(response.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('[P0] should return 403 when user tries to export another users data', async () => {
    // Given
    (auth as jest.Mock).mockResolvedValue({
      user: { userId: 2, role: 'job_seeker' },
    });

    // When
    const { GET } = await import('@/app/api/users/[id]/data-export/route');
    const response = await GET(buildRequest('1'), buildParams('1'));
    const body = await response.json();

    // Then
    expect(response.status).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('[P0] should allow user to export their own data', async () => {
    // Given
    (auth as jest.Mock).mockResolvedValue({
      user: { userId: 1, role: 'job_seeker' },
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      user_id: 1,
      email: 'user@test.com',
      first_name: 'John',
      password_hash: 'should_be_excluded',
      uploads: [],
      analyses: [],
      consultations: [],
      analytics: [],
      accounts: [],
    });

    // When
    const { GET } = await import('@/app/api/users/[id]/data-export/route');
    const response = await GET(buildRequest('1'), buildParams('1'));
    const body = await response.json();

    // Then
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.user.email).toBe('user@test.com');
    // CRITICAL: password_hash must NOT be in export
    expect(body.data.user.password_hash).toBeUndefined();
    expect(body.data.export_date).toBeDefined();
  });

  it('[P0] should allow admin to export any users data', async () => {
    // Given
    (auth as jest.Mock).mockResolvedValue({
      user: { userId: 99, role: 'admin' },
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      user_id: 1,
      email: 'user@test.com',
      password_hash: 'secret',
      uploads: [],
      analyses: [],
      consultations: [],
      analytics: [],
      accounts: [],
    });

    // When
    const { GET } = await import('@/app/api/users/[id]/data-export/route');
    const response = await GET(buildRequest('1'), buildParams('1'));
    const body = await response.json();

    // Then
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.user.password_hash).toBeUndefined();
  });

  it('[P1] should return 404 when user not found', async () => {
    // Given
    (auth as jest.Mock).mockResolvedValue({
      user: { userId: 1, role: 'job_seeker' },
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    // When
    const { GET } = await import('@/app/api/users/[id]/data-export/route');
    const response = await GET(buildRequest('1'), buildParams('1'));
    const body = await response.json();

    // Then
    expect(response.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('[P1] should return 500 on unexpected error', async () => {
    // Given
    (auth as jest.Mock).mockResolvedValue({
      user: { userId: 1, role: 'job_seeker' },
    });
    (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('DB crash'));

    // When
    const { GET } = await import('@/app/api/users/[id]/data-export/route');
    const response = await GET(buildRequest('1'), buildParams('1'));
    const body = await response.json();

    // Then
    expect(response.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});
