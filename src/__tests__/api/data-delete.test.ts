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
      delete: jest.fn(),
    },
  },
}));

import { auth } from '@/app/lib/auth';
import prisma from '@/app/lib/prisma';

function buildRequest(id: string): NextRequest {
  return new NextRequest(`http://localhost:3000/api/users/${id}/data-delete`, {
    method: 'DELETE',
  });
}

function buildParams(id: string): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

describe('/api/users/[id]/data-delete [P0]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('[P0] should return 401 when not authenticated', async () => {
    // Given: no session
    (auth as jest.Mock).mockResolvedValue(null);

    // When
    const { DELETE } = await import('@/app/api/users/[id]/data-delete/route');
    const response = await DELETE(buildRequest('1'), buildParams('1'));
    const body = await response.json();

    // Then
    expect(response.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('[P0] should return 403 when user tries to delete another users data', async () => {
    // Given: user 2 trying to delete user 1 data
    (auth as jest.Mock).mockResolvedValue({
      user: { userId: 2, role: 'job_seeker' },
    });

    // When
    const { DELETE } = await import('@/app/api/users/[id]/data-delete/route');
    const response = await DELETE(buildRequest('1'), buildParams('1'));
    const body = await response.json();

    // Then
    expect(response.status).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('[P0] should allow admin to delete any users data', async () => {
    // Given: admin deleting user 1
    (auth as jest.Mock).mockResolvedValue({
      user: { userId: 99, role: 'admin' },
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ user_id: 1, email: 'user@test.com' });
    (prisma.user.delete as jest.Mock).mockResolvedValue({});

    // When
    const { DELETE } = await import('@/app/api/users/[id]/data-delete/route');
    const response = await DELETE(buildRequest('1'), buildParams('1'));
    const body = await response.json();

    // Then
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.message).toContain('permanently deleted');
  });

  it('[P0] should allow user to delete their own data', async () => {
    // Given: user 1 deleting their own data
    (auth as jest.Mock).mockResolvedValue({
      user: { userId: 1, role: 'job_seeker' },
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ user_id: 1 });
    (prisma.user.delete as jest.Mock).mockResolvedValue({});

    // When
    const { DELETE } = await import('@/app/api/users/[id]/data-delete/route');
    const response = await DELETE(buildRequest('1'), buildParams('1'));
    const body = await response.json();

    // Then
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('[P1] should return 404 when user not found', async () => {
    // Given
    (auth as jest.Mock).mockResolvedValue({
      user: { userId: 1, role: 'job_seeker' },
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    // When
    const { DELETE } = await import('@/app/api/users/[id]/data-delete/route');
    const response = await DELETE(buildRequest('1'), buildParams('1'));
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
    const { DELETE } = await import('@/app/api/users/[id]/data-delete/route');
    const response = await DELETE(buildRequest('1'), buildParams('1'));
    const body = await response.json();

    // Then
    expect(response.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});
