/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

// Mock S3
jest.mock('@/src/lib/s3', () => ({
  generateUploadPresignedUrl: jest.fn().mockResolvedValue('https://s3.amazonaws.com/presigned-upload'),
  generateFileKey: jest.fn().mockReturnValue('uploads/user1/abc123-resume.pdf'),
  URL_EXPIRATION: 3600,
}));

function buildRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/files/upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('/api/files/upload-url [P1]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('[P1] should return presigned URL for valid PDF upload', async () => {
    // Given
    const body = {
      fileName: 'resume.pdf',
      file_size: 1024 * 500, // 500KB
      mime_type: 'application/pdf',
      user_id: 'user1',
    };

    // When
    const { POST } = await import('@/app/api/files/upload-url/route');
    const response = await POST(buildRequest(body));
    const data = await response.json();

    // Then
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.upload_url).toBe('https://s3.amazonaws.com/presigned-upload');
    expect(data.data.file_key).toBeDefined();
    expect(data.data.file_name).toBe('resume.pdf');
    expect(data.meta.expires_in).toBe(3600);
  });

  it('[P1] should return 400 for missing required fields', async () => {
    // Given: missing fileName
    const body = { file_size: 1024, mime_type: 'application/pdf' };

    // When
    const { POST } = await import('@/app/api/files/upload-url/route');
    const response = await POST(buildRequest(body));
    const data = await response.json();

    // Then
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('[P1] should return 400 for invalid file type', async () => {
    // Given: exe file type
    const body = {
      fileName: 'virus.exe',
      file_size: 1024,
      mime_type: 'application/x-msdownload',
    };

    // When
    const { POST } = await import('@/app/api/files/upload-url/route');
    const response = await POST(buildRequest(body));
    const data = await response.json();

    // Then
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.message).toContain('Invalid file type');
  });

  it('[P1] should return 400 for file exceeding 10MB', async () => {
    // Given: 15MB file
    const body = {
      fileName: 'huge.pdf',
      file_size: 15 * 1024 * 1024,
      mime_type: 'application/pdf',
    };

    // When
    const { POST } = await import('@/app/api/files/upload-url/route');
    const response = await POST(buildRequest(body));
    const data = await response.json();

    // Then
    expect(response.status).toBe(400);
    expect(data.error.message).toContain('too large');
  });

  it('[P1] should accept DOCX file type', async () => {
    // Given
    const body = {
      fileName: 'resume.docx',
      file_size: 2048,
      mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      user_id: 'user1',
    };

    // When
    const { POST } = await import('@/app/api/files/upload-url/route');
    const response = await POST(buildRequest(body));
    const data = await response.json();

    // Then
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('[P1] should handle S3 errors gracefully', async () => {
    // Given: S3 throws
    const s3 = require('@/src/lib/s3');
    s3.generateUploadPresignedUrl.mockRejectedValue(new Error('S3 unavailable'));

    const body = {
      fileName: 'resume.pdf',
      file_size: 1024,
      mime_type: 'application/pdf',
    };

    // When
    const { POST } = await import('@/app/api/files/upload-url/route');
    const response = await POST(buildRequest(body));
    const data = await response.json();

    // Then
    expect(response.status).toBe(500);
    expect(data.error.code).toBe('UPLOAD_URL_ERROR');
  });
});
