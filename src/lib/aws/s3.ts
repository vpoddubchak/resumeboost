import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// S3 Client configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

// S3 bucket name
const S3_BUCKET = process.env.AWS_S3_BUCKET || 'resumeboost-uploads';

// File upload utility
export async function uploadFileToS3(
  fileName: string,
  fileBuffer: Buffer,
  contentType: string
): Promise<{ key: string; url: string }> {
  const key = `uploads/${fileName}`;
  
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType
  });

  await s3Client.send(command);
  
  return {
    key,
    url: `https://${S3_BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`
  };
}

// Generate presigned URL for file upload
export async function generateUploadUrl(
  fileName: string,
  contentType: string
): Promise<string> {
  const key = `uploads/${fileName}`;
  
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    ContentType: contentType
  });

  return await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour
}

// Generate presigned URL for file download
export async function generateDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: key
  });

  return await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour
}

// Delete file from S3
export async function deleteFileFromS3(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: S3_BUCKET,
    Key: key
  });

  await s3Client.send(command);
}

// File validation utility
export function validateFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Only PDF and Word documents are allowed'
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size must be less than 10MB'
    };
  }

  return { valid: true };
}

export { s3Client, S3_BUCKET };
