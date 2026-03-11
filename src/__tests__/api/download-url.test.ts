/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

// Mock S3
jest.mock('@/src/lib/s3', () => ({
  generateDownloadPresignedUrl: jest.fn().mockResolvedValue('https://s3.amazonaws.com/presigned-download'),
  URL_EXPIRATION: 3600,
}));

function buildRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/files/download-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('/api/files/download-url [P1]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('[P1] should return presigned download URL for valid file key', async () => {
    // Given
    const body = { file_key: 'uploads/user1/abc123-resume.pdf' };

    // When
    const { POST } = await import('@/app/api/files/download-url/route');
    const response = await POST(buildRequest(body));
    const data = await response.json();

    // Then
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.download_url).toBe('https://s3.amazonaws.com/presigned-download');
    expect(data.data.file_key).toBe('uploads/user1/abc123-resume.pdf');
    expect(data.meta.expires_in).toBe(3600);
  });

  it('[P1] should return 400 when file_key is missing', async () => {
    // Given: empty body
    const body = {};

    // When
    const { POST } = await import('@/app/api/files/download-url/route');
    const response = await POST(buildRequest(body));
    const data = await response.json();

    // Then
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('[P1] should handle S3 errors gracefully', async () => {
    // Given
    const s3 = require('@/src/lib/s3');
    s3.generateDownloadPresignedUrl.mockRejectedValue(new Error('S3 unavailable'));

    // When
    const { POST } = await import('@/app/api/files/download-url/route');
    const response = await POST(buildRequest({ file_key: 'uploads/test.pdf' }));
    const data = await response.json();

    // Then
    expect(response.status).toBe(500);
    expect(data.error.code).toBe('DOWNLOAD_URL_ERROR');
  });
});
