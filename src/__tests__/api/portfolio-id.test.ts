/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

const mockFindUnique = jest.fn();
jest.mock('@/app/lib/prisma', () => ({
  __esModule: true,
  default: {
    portfolioContent: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
  },
}));

jest.mock('@/app/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

function buildRequest(method: string, id: string): NextRequest {
  return new NextRequest(`http://localhost:3000/api/portfolio/${id}`, { method });
}

function buildParams(id: string): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

describe('/api/portfolio/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return 200 with portfolio item data', async () => {
      const mockItem = {
        content_id: 1,
        title: 'Engineer Resume',
        description: 'Improved resume',
        content_type: 'engineering',
        file_url: null,
        is_featured: true,
        created_at: new Date('2024-01-01'),
      };
      mockFindUnique.mockResolvedValue(mockItem);

      const { GET } = await import('@/app/api/portfolio/[id]/route');
      const response = await GET(buildRequest('GET', '1'), buildParams('1'));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.title).toBe('Engineer Resume');
      expect(body.meta.timestamp).toBeDefined();
    });

    it('should return 404 when portfolio item not found', async () => {
      mockFindUnique.mockResolvedValue(null);

      const { GET } = await import('@/app/api/portfolio/[id]/route');
      const response = await GET(buildRequest('GET', '999'), buildParams('999'));
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('should return 400 for non-numeric id', async () => {
      const { GET } = await import('@/app/api/portfolio/[id]/route');
      const response = await GET(buildRequest('GET', 'abc'), buildParams('abc'));
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INVALID_ID');
    });

    it('should return 500 on database error', async () => {
      mockFindUnique.mockRejectedValue(new Error('DB connection failed'));

      const { GET } = await import('@/app/api/portfolio/[id]/route');
      const response = await GET(buildRequest('GET', '1'), buildParams('1'));
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('DATABASE_ERROR');
    });

    it('should query prisma with correct content_id', async () => {
      mockFindUnique.mockResolvedValue({ content_id: 5, title: 'Test' });

      const { GET } = await import('@/app/api/portfolio/[id]/route');
      await GET(buildRequest('GET', '5'), buildParams('5'));

      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { content_id: 5 },
      });
    });
  });
});
