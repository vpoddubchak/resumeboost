/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

jest.mock('@/src/lib/s3', () => ({
  generateUploadPresignedUrl: jest.fn().mockResolvedValue('https://s3.amazonaws.com/presigned-upload'),
  generateFileKey: jest.fn().mockReturnValue('uploads/42/1234567890-resume.pdf'),
  URL_EXPIRATION: 3600,
}));

jest.mock('@/app/lib/auth', () => ({
  auth: jest.fn().mockResolvedValue({ user: { userId: 42 } }),
}));

jest.mock('@/app/lib/rate-limit', () => ({
  checkRateLimit: jest.fn().mockReturnValue({ success: true, remaining: 99, resetAt: Date.now() + 60000, retryAfterSeconds: 0 }),
  getClientIp: jest.fn().mockReturnValue('127.0.0.1'),
  rateLimitResponse: jest.fn(),
  RATE_LIMITS: { GENERAL_API: { maxRequests: 100, windowSeconds: 60 } },
}));

function buildRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/uploads/presigned-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('/api/uploads/presigned-url', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const s3 = require('@/src/lib/s3');
    s3.generateUploadPresignedUrl.mockResolvedValue('https://s3.amazonaws.com/presigned-upload');
    s3.generateFileKey.mockReturnValue('uploads/42/1234567890-resume.pdf');

    const auth = require('@/app/lib/auth');
    auth.auth.mockResolvedValue({ user: { userId: 42 } });

    const rateLimit = require('@/app/lib/rate-limit');
    rateLimit.checkRateLimit.mockReturnValue({ success: true, remaining: 99, resetAt: Date.now() + 60000, retryAfterSeconds: 0 });
    rateLimit.getClientIp.mockReturnValue('127.0.0.1');
  });

  it('should return presigned URL for valid PDF', async () => {
    const { POST } = await import('@/app/api/uploads/presigned-url/route');
    const response = await POST(buildRequest({ fileName: 'resume.pdf', fileSize: 500 * 1024, mimeType: 'application/pdf' }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.uploadUrl).toBe('https://s3.amazonaws.com/presigned-upload');
    expect(data.data.fileKey).toBe('uploads/42/1234567890-resume.pdf');
    expect(data.meta.expiresIn).toBe(3600);
  });

  it('should return presigned URL for DOCX', async () => {
    const { POST } = await import('@/app/api/uploads/presigned-url/route');
    const response = await POST(
      buildRequest({
        fileName: 'resume.docx',
        fileSize: 200 * 1024,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should return presigned URL for TXT', async () => {
    const { POST } = await import('@/app/api/uploads/presigned-url/route');
    const response = await POST(
      buildRequest({ fileName: 'resume.txt', fileSize: 10 * 1024, mimeType: 'text/plain' })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should return 401 when unauthenticated', async () => {
    const auth = require('@/app/lib/auth');
    auth.auth.mockResolvedValueOnce(null);

    const { POST } = await import('@/app/api/uploads/presigned-url/route');
    const response = await POST(buildRequest({ fileName: 'resume.pdf', fileSize: 1024, mimeType: 'application/pdf' }));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  it('should return 400 for missing required fields', async () => {
    const { POST } = await import('@/app/api/uploads/presigned-url/route');
    const response = await POST(buildRequest({ fileName: 'resume.pdf' }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 for invalid file type', async () => {
    const { POST } = await import('@/app/api/uploads/presigned-url/route');
    const response = await POST(
      buildRequest({ fileName: 'virus.exe', fileSize: 1024, mimeType: 'application/x-msdownload' })
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.message).toContain('Invalid file type');
  });

  it('should return 400 for file exceeding 15MB', async () => {
    const { POST } = await import('@/app/api/uploads/presigned-url/route');
    const response = await POST(
      buildRequest({ fileName: 'huge.pdf', fileSize: 16 * 1024 * 1024, mimeType: 'application/pdf' })
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.message).toContain('15MB');
  });

  it('should return 500 when S3 throws', async () => {
    const s3 = require('@/src/lib/s3');
    s3.generateUploadPresignedUrl.mockRejectedValueOnce(new Error('S3 unavailable'));

    const { POST } = await import('@/app/api/uploads/presigned-url/route');
    const response = await POST(
      buildRequest({ fileName: 'resume.pdf', fileSize: 1024, mimeType: 'application/pdf' })
    );
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('PRESIGNED_URL_ERROR');
  });

  it('should use session userId for file key generation', async () => {
    const s3 = require('@/src/lib/s3');
    const { POST } = await import('@/app/api/uploads/presigned-url/route');
    await POST(buildRequest({ fileName: 'resume.pdf', fileSize: 1024, mimeType: 'application/pdf' }));

    expect(s3.generateFileKey).toHaveBeenCalledWith('42', 'resume.pdf');
  });
});
