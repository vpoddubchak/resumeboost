/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

// Mock PrismaClient at module level (users/[id]/route.ts creates its own instance)
const mockPrismaUser = {
  findUnique: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: mockPrismaUser,
  })),
}));

function buildRequest(method: string, id: string, body?: Record<string, unknown>): NextRequest {
  const init: RequestInit = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) init.body = JSON.stringify(body);
  return new NextRequest(`http://localhost:3000/api/users/${id}`, init);
}

function buildParams(id: string): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

describe('/api/users/[id] [P1]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- GET ---
  describe('GET', () => {
    it('[P1] should return user by ID', async () => {
      // Given
      mockPrismaUser.findUnique.mockResolvedValue({
        user_id: 1, email: 'user@test.com', first_name: 'John', last_name: 'Doe',
        created_at: new Date('2026-01-01'), updated_at: new Date('2026-01-02'),
      });

      // When
      const { GET } = await import('@/app/api/users/[id]/route');
      const response = await GET(buildRequest('GET', '1'), buildParams('1'));
      const body = await response.json();

      // Then
      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.email).toBe('user@test.com');
    });

    it('[P1] should return 400 for non-numeric ID', async () => {
      const { GET } = await import('@/app/api/users/[id]/route');
      const response = await GET(buildRequest('GET', 'abc'), buildParams('abc'));
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('[P1] should return 404 when user not found', async () => {
      mockPrismaUser.findUnique.mockResolvedValue(null);

      const { GET } = await import('@/app/api/users/[id]/route');
      const response = await GET(buildRequest('GET', '999'), buildParams('999'));
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error.code).toBe('USER_NOT_FOUND');
    });

    it('[P1] should return 500 on DB error', async () => {
      mockPrismaUser.findUnique.mockRejectedValue(new Error('DB error'));

      const { GET } = await import('@/app/api/users/[id]/route');
      const response = await GET(buildRequest('GET', '1'), buildParams('1'));
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error.code).toBe('DATABASE_ERROR');
    });
  });

  // --- PUT ---
  describe('PUT', () => {
    it('[P1] should update user', async () => {
      mockPrismaUser.update.mockResolvedValue({
        user_id: 1, email: 'user@test.com', first_name: 'Jane', last_name: 'Smith',
        created_at: new Date('2026-01-01'), updated_at: new Date('2026-01-03'),
      });

      const { PUT } = await import('@/app/api/users/[id]/route');
      const response = await PUT(
        buildRequest('PUT', '1', { first_name: 'Jane', last_name: 'Smith' }),
        buildParams('1')
      );
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.first_name).toBe('Jane');
    });

    it('[P1] should return 400 for non-numeric ID on PUT', async () => {
      const { PUT } = await import('@/app/api/users/[id]/route');
      const response = await PUT(
        buildRequest('PUT', 'abc', { first_name: 'X' }),
        buildParams('abc')
      );
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // --- DELETE ---
  describe('DELETE', () => {
    it('[P1] should delete user', async () => {
      mockPrismaUser.delete.mockResolvedValue({});

      const { DELETE } = await import('@/app/api/users/[id]/route');
      const response = await DELETE(buildRequest('DELETE', '1'), buildParams('1'));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.meta.message).toContain('deleted');
    });

    it('[P1] should return 400 for non-numeric ID on DELETE', async () => {
      const { DELETE } = await import('@/app/api/users/[id]/route');
      const response = await DELETE(buildRequest('DELETE', 'abc'), buildParams('abc'));
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('[P1] should return 500 on DB error during delete', async () => {
      mockPrismaUser.delete.mockRejectedValue(new Error('FK constraint'));

      const { DELETE } = await import('@/app/api/users/[id]/route');
      const response = await DELETE(buildRequest('DELETE', '1'), buildParams('1'));
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error.code).toBe('DATABASE_ERROR');
    });
  });
});
