/**
 * @jest-environment node
 */

import { CLAUDE_FIXTURES } from '@/src/__tests__/fixtures/claude';

jest.mock('@/app/lib/auth', () => ({
  auth: jest.fn().mockResolvedValue({ user: { userId: 42 } }),
}));

jest.mock('@/app/lib/prisma', () => ({
  __esModule: true,
  default: {
    upload: {
      findFirst: jest.fn(),
    },
    analysis: {
      create: jest.fn(),
    },
  },
}));

jest.mock('@/app/lib/rate-limit', () => ({
  checkRateLimit: jest.fn().mockReturnValue({
    success: true,
    remaining: 9,
    resetAt: Date.now() + 3600000,
    retryAfterSeconds: 0,
  }),
  rateLimitResponse: jest.fn().mockImplementation((result: { retryAfterSeconds: number }) =>
    Response.json(
      { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } },
      { status: 429, headers: { 'Retry-After': String(result.retryAfterSeconds) } }
    )
  ),
  RATE_LIMITS: {
    AI_ANALYSIS: { maxRequests: 10, windowSeconds: 3600 },
  },
}));

jest.mock('@/src/lib/s3', () => ({
  downloadFileContent: jest.fn().mockResolvedValue(Buffer.from('resume text content')),
}));

jest.mock('@/app/lib/file-extractor', () => ({
  extractTextFromFile: jest.fn().mockResolvedValue('Extracted resume text from file'),
  UnsupportedFileTypeError: class UnsupportedFileTypeError extends Error {
    constructor(mimeType: string) {
      super(`Unsupported file type: ${mimeType}`);
      this.name = 'UnsupportedFileTypeError';
    }
  },
}));

jest.mock('@/app/lib/claude', () => ({
  analyzeResume: jest.fn().mockResolvedValue(CLAUDE_FIXTURES.HIGH_MATCH_92),
}));

jest.mock('@/app/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

function buildRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost:3000/api/analyses/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('/api/analyses/run', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const auth = require('@/app/lib/auth');
    auth.auth.mockResolvedValue({ user: { userId: 42 } });

    const prisma = require('@/app/lib/prisma').default;
    prisma.upload.findFirst.mockResolvedValue({
      upload_id: 1,
      user_id: 42,
      file_name: 'resume.pdf',
      file_path: 'uploads/42/resume.pdf',
      file_size: 1024,
      mime_type: 'application/pdf',
      upload_status: 'uploaded',
      created_at: new Date(),
    });
    prisma.analysis.create.mockResolvedValue({
      analysis_id: 100,
      upload_id: 1,
      user_id: 42,
      analysis_data: {
        matchScore: CLAUDE_FIXTURES.HIGH_MATCH_92.matchScore,
        strengths: CLAUDE_FIXTURES.HIGH_MATCH_92.strengths,
        weaknesses: CLAUDE_FIXTURES.HIGH_MATCH_92.weaknesses,
        recommendations: CLAUDE_FIXTURES.HIGH_MATCH_92.recommendations,
      },
      score: CLAUDE_FIXTURES.HIGH_MATCH_92.matchScore,
      recommendations: {
        strengths: CLAUDE_FIXTURES.HIGH_MATCH_92.strengths,
        weaknesses: CLAUDE_FIXTURES.HIGH_MATCH_92.weaknesses,
        recommendations: CLAUDE_FIXTURES.HIGH_MATCH_92.recommendations,
      },
      created_at: new Date('2026-03-12T09:00:00.000Z'),
    });

    const rateLimit = require('@/app/lib/rate-limit');
    rateLimit.checkRateLimit.mockReturnValue({
      success: true,
      remaining: 9,
      resetAt: Date.now() + 3600000,
      retryAfterSeconds: 0,
    });

    const s3 = require('@/src/lib/s3');
    s3.downloadFileContent.mockResolvedValue(Buffer.from('resume text'));

    const extractor = require('@/app/lib/file-extractor');
    extractor.extractTextFromFile.mockResolvedValue('Extracted resume text');

    const claude = require('@/app/lib/claude');
    claude.analyzeResume.mockResolvedValue(CLAUDE_FIXTURES.HIGH_MATCH_92);
  });

  it('should return 201 with analysis data on happy path', async () => {
    const { POST } = await import('@/app/api/analyses/run/route');
    const response = await POST(buildRequest({ upload_id: 1, job_description: 'Senior developer role with React experience' }));
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.analysisId).toBe(100);
    expect(data.data.score).toBe(CLAUDE_FIXTURES.HIGH_MATCH_92.matchScore);
    expect(data.data.analysisData).toBeDefined();
    expect(data.data.recommendations).toBeDefined();
    expect(data.data.createdAt).toBe('2026-03-12T09:00:00.000Z');
  });

  it('should return 401 when unauthenticated', async () => {
    const auth = require('@/app/lib/auth');
    auth.auth.mockResolvedValueOnce(null);

    const { POST } = await import('@/app/api/analyses/run/route');
    const response = await POST(buildRequest({ upload_id: 1, job_description: 'Senior developer role' }));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  it('should return 429 when rate limit exceeded', async () => {
    const rateLimit = require('@/app/lib/rate-limit');
    rateLimit.checkRateLimit.mockReturnValueOnce({
      success: false,
      remaining: 0,
      resetAt: Date.now() + 3600000,
      retryAfterSeconds: 3600,
    });

    const { POST } = await import('@/app/api/analyses/run/route');
    const response = await POST(buildRequest({ upload_id: 1, job_description: 'Senior developer role' }));

    expect(response.status).toBe(429);
  });

  it('should use user_id as rate limit key, not IP', async () => {
    const rateLimit = require('@/app/lib/rate-limit');

    const { POST } = await import('@/app/api/analyses/run/route');
    await POST(buildRequest({ upload_id: 1, job_description: 'Senior developer role' }));

    expect(rateLimit.checkRateLimit).toHaveBeenCalledWith(
      'ai-analysis:42',
      expect.objectContaining({ maxRequests: 10 })
    );
  });

  it('should return 404 when upload not found', async () => {
    const prisma = require('@/app/lib/prisma').default;
    prisma.upload.findFirst.mockResolvedValueOnce(null);

    const { POST } = await import('@/app/api/analyses/run/route');
    const response = await POST(buildRequest({ upload_id: 999, job_description: 'Senior developer role' }));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('NOT_FOUND');
  });

  it('should return 404 for IDOR attempt (different user upload)', async () => {
    const prisma = require('@/app/lib/prisma').default;
    prisma.upload.findFirst.mockResolvedValueOnce(null); // IDOR: findFirst with user_id filter returns null

    const { POST } = await import('@/app/api/analyses/run/route');
    const response = await POST(buildRequest({ upload_id: 1, job_description: 'Senior developer role' }));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error.code).toBe('NOT_FOUND');
  });

  it('should filter uploads by both upload_id and user_id', async () => {
    const prisma = require('@/app/lib/prisma').default;

    const { POST } = await import('@/app/api/analyses/run/route');
    await POST(buildRequest({ upload_id: 1, job_description: 'Senior developer role' }));

    expect(prisma.upload.findFirst).toHaveBeenCalledWith({
      where: {
        upload_id: 1,
        user_id: 42,
      },
    });
  });

  it('should return 408 on Claude timeout', async () => {
    const claude = require('@/app/lib/claude');
    claude.analyzeResume.mockRejectedValueOnce(new Error('The operation was aborted'));

    const { POST } = await import('@/app/api/analyses/run/route');
    const response = await POST(buildRequest({ upload_id: 1, job_description: 'Senior developer role' }));
    const data = await response.json();

    expect(response.status).toBe(408);
    expect(data.error.code).toBe('ANALYSIS_TIMEOUT');
  });

  it('should return 422 on file extraction error', async () => {
    const extractor = require('@/app/lib/file-extractor');
    const UnsupportedError = extractor.UnsupportedFileTypeError;
    extractor.extractTextFromFile.mockRejectedValueOnce(new UnsupportedError('application/x-msdownload'));

    const { POST } = await import('@/app/api/analyses/run/route');
    const response = await POST(buildRequest({ upload_id: 1, job_description: 'Senior developer role' }));
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.error.code).toBe('EXTRACTION_ERROR');
  });

  it('should return 500 on Claude API failure after retries', async () => {
    const claude = require('@/app/lib/claude');
    claude.analyzeResume.mockRejectedValueOnce(new Error('Claude API internal error'));

    const { POST } = await import('@/app/api/analyses/run/route');
    const response = await POST(buildRequest({ upload_id: 1, job_description: 'Senior developer role' }));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error.code).toBe('ANALYSIS_ERROR');
  });

  it('should return 500 on database save failure', async () => {
    const prisma = require('@/app/lib/prisma').default;
    prisma.analysis.create.mockRejectedValueOnce(new Error('DB connection lost'));

    const { POST } = await import('@/app/api/analyses/run/route');
    const response = await POST(buildRequest({ upload_id: 1, job_description: 'Senior developer role' }));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error.code).toBe('DATABASE_ERROR');
  });

  it('should return 422 for invalid request body', async () => {
    const { POST } = await import('@/app/api/analyses/run/route');
    const response = await POST(buildRequest({ upload_id: -1, job_description: 'short' }));
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 422 for missing upload_id', async () => {
    const { POST } = await import('@/app/api/analyses/run/route');
    const response = await POST(buildRequest({ job_description: 'Senior developer role with React' }));
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.success).toBe(false);
  });

  it('should return 422 for invalid JSON body', async () => {
    const { POST } = await import('@/app/api/analyses/run/route');
    const badRequest = new Request('http://localhost:3000/api/analyses/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json-at-all',
    });
    const response = await POST(badRequest);
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });
});
