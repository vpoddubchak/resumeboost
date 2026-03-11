import { logger } from './logger';

interface ValidationResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
}

const REQUIRED_ENV_VARS = [
  'POSTGRES_PRISMA_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
] as const;

const OPTIONAL_ENV_VARS = [
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_S3_BUCKET',
  'AWS_REGION',
] as const;

export function validateEnvironment(): ValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const envVar of REQUIRED_ENV_VARS) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  for (const envVar of OPTIONAL_ENV_VARS) {
    if (!process.env[envVar]) {
      warnings.push(`Optional env var ${envVar} not set`);
    }
  }

  const valid = missing.length === 0;

  if (!valid) {
    logger.error('Startup validation FAILED: missing required environment variables', {
      action: 'startup_validation',
      missing: missing.join(', '),
    });
  } else if (warnings.length > 0) {
    logger.warn('Startup validation passed with warnings', {
      action: 'startup_validation',
      warnings: warnings.join('; '),
    });
  } else {
    logger.info('Startup validation passed', { action: 'startup_validation' });
  }

  return { valid, missing, warnings };
}

export function validateStartup(): void {
  const result = validateEnvironment();
  if (!result.valid) {
    const msg = `Missing required environment variables: ${result.missing.join(', ')}`;
    if (process.env.NODE_ENV === 'production') {
      throw new Error(msg);
    }
    logger.warn(`[DEV MODE] ${msg} — continuing anyway`);
  }
}

export { REQUIRED_ENV_VARS, OPTIONAL_ENV_VARS };
