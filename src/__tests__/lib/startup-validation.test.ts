/**
 * @jest-environment node
 */

// Mock logger before importing module
jest.mock('@/app/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

import { validateEnvironment, validateStartup, REQUIRED_ENV_VARS, OPTIONAL_ENV_VARS } from '@/app/lib/startup-validation';
import { logger } from '@/app/lib/logger';

describe('startup-validation [P1]', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('validateEnvironment', () => {
    it('[P1] should return valid when all required env vars are set', () => {
      // Given: all required vars present
      process.env.POSTGRES_PRISMA_URL = 'postgres://localhost';
      process.env.NEXTAUTH_SECRET = 'secret';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.AWS_ACCESS_KEY_ID = 'key';
      process.env.AWS_SECRET_ACCESS_KEY = 'secret';
      process.env.AWS_S3_BUCKET = 'bucket';
      process.env.AWS_REGION = 'us-east-1';

      // When
      const result = validateEnvironment();

      // Then
      expect(result.valid).toBe(true);
      expect(result.missing).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
      expect(logger.info).toHaveBeenCalledWith('Startup validation passed', expect.any(Object));
    });

    it('[P0] should report missing required env vars', () => {
      // Given: no env vars set
      delete process.env.POSTGRES_PRISMA_URL;
      delete process.env.NEXTAUTH_SECRET;
      delete process.env.NEXTAUTH_URL;

      // When
      const result = validateEnvironment();

      // Then
      expect(result.valid).toBe(false);
      expect(result.missing).toContain('POSTGRES_PRISMA_URL');
      expect(result.missing).toContain('NEXTAUTH_SECRET');
      expect(result.missing).toContain('NEXTAUTH_URL');
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('FAILED'),
        expect.objectContaining({ action: 'startup_validation' })
      );
    });

    it('[P1] should report warnings for missing optional env vars', () => {
      // Given: required present, optional missing
      process.env.POSTGRES_PRISMA_URL = 'postgres://localhost';
      process.env.NEXTAUTH_SECRET = 'secret';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      delete process.env.AWS_ACCESS_KEY_ID;
      delete process.env.AWS_SECRET_ACCESS_KEY;
      delete process.env.AWS_S3_BUCKET;
      delete process.env.AWS_REGION;

      // When
      const result = validateEnvironment();

      // Then
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBe(OPTIONAL_ENV_VARS.length);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('warnings'),
        expect.any(Object)
      );
    });
  });

  describe('validateStartup', () => {
    it('[P1] should skip validation during build phase', () => {
      // Given: build phase
      process.env.NEXT_PHASE = 'phase-production-build';
      delete process.env.POSTGRES_PRISMA_URL;

      // When
      validateStartup();

      // Then: no logger calls — skipped entirely
      expect(logger.error).not.toHaveBeenCalled();
      expect(logger.info).not.toHaveBeenCalled();
    });

    it('[P1] should log error but not throw when required vars missing', () => {
      // Given
      delete process.env.NEXT_PHASE;
      delete process.env.POSTGRES_PRISMA_URL;
      delete process.env.NEXTAUTH_SECRET;
      delete process.env.NEXTAUTH_URL;

      // When / Then: should not throw
      expect(() => validateStartup()).not.toThrow();
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('constants', () => {
    it('[P1] should export expected required env vars', () => {
      expect(REQUIRED_ENV_VARS).toContain('POSTGRES_PRISMA_URL');
      expect(REQUIRED_ENV_VARS).toContain('NEXTAUTH_SECRET');
      expect(REQUIRED_ENV_VARS).toContain('NEXTAUTH_URL');
    });

    it('[P1] should export expected optional env vars', () => {
      expect(OPTIONAL_ENV_VARS).toContain('AWS_ACCESS_KEY_ID');
      expect(OPTIONAL_ENV_VARS).toContain('AWS_S3_BUCKET');
    });
  });
});
