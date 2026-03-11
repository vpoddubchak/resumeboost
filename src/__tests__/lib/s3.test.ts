/**
 * @jest-environment node
 */

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({}),
  })),
  PutObjectCommand: jest.fn(),
  GetObjectCommand: jest.fn(),
  DeleteObjectCommand: jest.fn(),
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://s3.amazonaws.com/signed-url'),
}));

// Mock retry — pass through directly (retry tested separately)
jest.mock('@/app/lib/retry', () => ({
  withRetry: jest.fn(async (fn: () => Promise<unknown>) => fn()),
  RETRY_POLICIES: {
    s3Upload: { maxRetries: 2, baseDelayMs: 500 },
  },
}));

// Mock logger
jest.mock('@/app/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { withRetry } from '@/app/lib/retry';
import { logger } from '@/app/lib/logger';

describe('src/lib/s3 [P1]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateUploadPresignedUrl', () => {
    it('[P1] should generate a presigned upload URL', async () => {
      const { generateUploadPresignedUrl } = await import('@/src/lib/s3');

      const url = await generateUploadPresignedUrl('uploads/user1/file.pdf', 'application/pdf');

      expect(url).toBe('https://s3.amazonaws.com/signed-url');
      expect(withRetry).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({ maxRetries: 2 }),
        's3:generateUploadUrl'
      );
    });
  });

  describe('generateDownloadPresignedUrl', () => {
    it('[P1] should generate a presigned download URL', async () => {
      const { generateDownloadPresignedUrl } = await import('@/src/lib/s3');

      const url = await generateDownloadPresignedUrl('uploads/user1/file.pdf');

      expect(url).toBe('https://s3.amazonaws.com/signed-url');
      expect(withRetry).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({ maxRetries: 2 }),
        's3:generateDownloadUrl'
      );
    });
  });

  describe('deleteFile', () => {
    it('[P1] should delete a file with retry', async () => {
      const { deleteFile } = await import('@/src/lib/s3');

      await deleteFile('uploads/user1/file.pdf');

      expect(withRetry).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({ maxRetries: 2 }),
        's3:deleteFile'
      );
    });
  });

  describe('generateFileKey', () => {
    it('[P1] should generate a key with userId and sanitized fileName', async () => {
      const { generateFileKey } = await import('@/src/lib/s3');

      const key = generateFileKey('user42', 'My Resume (v2).pdf');

      expect(key).toMatch(/^uploads\/user42\/\d+-My_Resume__v2_.pdf$/);
    });

    it('[P1] should sanitize special characters in file name', async () => {
      const { generateFileKey } = await import('@/src/lib/s3');

      const key = generateFileKey('u1', 'file name@#$.pdf');

      expect(key).toMatch(/^uploads\/u1\/\d+-file_name___.pdf$/);
    });
  });

  describe('checkS3Connectivity', () => {
    it('[P1] should return true when S3 is reachable', async () => {
      const { checkS3Connectivity } = await import('@/src/lib/s3');

      const result = await checkS3Connectivity();

      expect(result).toBe(true);
    });

    it('[P1] should return false and log warning when S3 is unreachable', async () => {
      (getSignedUrl as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { checkS3Connectivity } = await import('@/src/lib/s3');

      const result = await checkS3Connectivity();

      expect(result).toBe(false);
      expect(logger.warn).toHaveBeenCalledWith(
        'S3 connectivity check failed',
        expect.objectContaining({ action: 's3_health_check' })
      );
    });
  });

  describe('exports', () => {
    it('[P1] should export BUCKET_NAME and URL_EXPIRATION constants', async () => {
      const { BUCKET_NAME, URL_EXPIRATION } = await import('@/src/lib/s3');

      expect(typeof BUCKET_NAME).toBe('string');
      expect(URL_EXPIRATION).toBe(3600);
    });
  });
});
