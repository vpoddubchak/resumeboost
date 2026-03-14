/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

const mockFindMany = jest.fn();
jest.mock('@/app/lib/prisma', () => ({
  __esModule: true,
  default: {
    successStory: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
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

function buildRequest(method: string, query?: Record<string, string>): NextRequest {
  const url = new URL('http://localhost:3000/api/success-stories');
  if (query) {
    Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  return new NextRequest(url.toString(), { method });
}

const mockStories = [
  {
    story_id: 1,
    client_name: 'Sarah',
    client_role: 'Software Engineer',
    industry: 'engineering',
    challenge: 'Weak resume',
    solution: 'Rewrote bullets',
    results: 'Got interviews',
    testimonial_quote: 'Great service',
    outcome_type: 'salary-increase',
    metrics: { salaryIncrease: '35%' },
    is_featured: true,
    created_at: new Date('2024-01-01'),
  },
  {
    story_id: 2,
    client_name: 'Marcus',
    client_role: 'Marketing Manager',
    industry: 'marketing',
    challenge: 'Agency resume',
    solution: 'Repositioned',
    results: 'Got in-house role',
    testimonial_quote: null,
    outcome_type: 'career-change',
    metrics: null,
    is_featured: false,
    created_at: new Date('2024-01-02'),
  },
];

describe('/api/success-stories', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return 200 with all success stories', async () => {
      mockFindMany.mockResolvedValue(mockStories);

      const { GET } = await import('@/app/api/success-stories/route');
      const response = await GET(buildRequest('GET'));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(2);
      expect(body.meta.count).toBe(2);
      expect(body.meta.timestamp).toBeDefined();
    });

    it('should return 200 with filtered stories by industry', async () => {
      const engineeringStories = [mockStories[0]];
      mockFindMany.mockResolvedValue(engineeringStories);

      const { GET } = await import('@/app/api/success-stories/route');
      const response = await GET(buildRequest('GET', { industry: 'engineering' }));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(1);
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { industry: 'engineering' },
        })
      );
    });

    it('should return 200 with filtered stories by outcome_type', async () => {
      const careerChangeStories = [mockStories[1]];
      mockFindMany.mockResolvedValue(careerChangeStories);

      const { GET } = await import('@/app/api/success-stories/route');
      const response = await GET(buildRequest('GET', { outcome_type: 'career-change' }));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(1);
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { outcome_type: 'career-change' },
        })
      );
    });

    it('should return 200 with combined industry and outcome_type filters', async () => {
      mockFindMany.mockResolvedValue([mockStories[0]]);

      const { GET } = await import('@/app/api/success-stories/route');
      const response = await GET(buildRequest('GET', { industry: 'engineering', outcome_type: 'salary-increase' }));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { industry: 'engineering', outcome_type: 'salary-increase' },
        })
      );
    });

    it('should query with no where clause when no filters provided', async () => {
      mockFindMany.mockResolvedValue(mockStories);

      const { GET } = await import('@/app/api/success-stories/route');
      await GET(buildRequest('GET'));

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: undefined,
          orderBy: [{ is_featured: 'desc' }, { created_at: 'desc' }],
        })
      );
    });

    it('should return 500 on database error', async () => {
      mockFindMany.mockRejectedValue(new Error('DB connection failed'));

      const { GET } = await import('@/app/api/success-stories/route');
      const response = await GET(buildRequest('GET'));
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('DATABASE_ERROR');
      expect(body.error.message).toBe('Failed to fetch success stories');
    });

    it('should return correct API response shape', async () => {
      mockFindMany.mockResolvedValue(mockStories);

      const { GET } = await import('@/app/api/success-stories/route');
      const response = await GET(buildRequest('GET'));
      const body = await response.json();

      expect(body).toHaveProperty('success', true);
      expect(body).toHaveProperty('data');
      expect(body).toHaveProperty('meta');
      expect(body.meta).toHaveProperty('count');
      expect(body.meta).toHaveProperty('timestamp');
    });
  });
});
