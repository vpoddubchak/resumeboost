import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { withRetry, RETRY_POLICIES } from '@/app/lib/retry';
import { logger } from '@/app/lib/logger';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'resumeboost-uploads';
const URL_EXPIRATION = 3600; // 1 hour

export async function generateUploadPresignedUrl(key: string, contentType: string): Promise<string> {
  return withRetry(
    async () => {
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ContentType: contentType,
      });
      return getSignedUrl(s3Client, command, { expiresIn: URL_EXPIRATION });
    },
    RETRY_POLICIES.s3Upload,
    's3:generateUploadUrl'
  );
}

export async function generateDownloadPresignedUrl(key: string): Promise<string> {
  return withRetry(
    async () => {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });
      return getSignedUrl(s3Client, command, { expiresIn: URL_EXPIRATION });
    },
    RETRY_POLICIES.s3Upload,
    's3:generateDownloadUrl'
  );
}

export async function deleteFile(key: string): Promise<void> {
  return withRetry(
    async () => {
      const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });
      await s3Client.send(command);
    },
    RETRY_POLICIES.s3Upload,
    's3:deleteFile'
  );
}

export function generateFileKey(userId: string, fileName: string): string {
  const timestamp = Date.now();
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `uploads/${userId}/${timestamp}-${sanitizedName}`;
}

export async function checkS3Connectivity(): Promise<boolean> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: '__health_check_nonexistent__',
    });
    await getSignedUrl(s3Client, command, { expiresIn: 60 });
    return true;
  } catch (error) {
    logger.warn('S3 connectivity check failed', {
      action: 's3_health_check',
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

export { BUCKET_NAME, URL_EXPIRATION };
