import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Database connection singleton
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Mock file validation
function validateFile(fileName: string, file_size: number, mime_type: string) {
  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!allowedTypes.includes(mime_type)) {
    return { valid: false, error: 'Invalid file type' };
  }
  
  if (file_size > maxSize) {
    return { valid: false, error: 'File too large' };
  }
  
  return { valid: true };
}

// Mock upload URL generation
function generateUploadUrl(fileName: string) {
  // In real implementation, this would generate AWS S3 presigned URL
  const uploadUrl = `https://resumeboost-uploads.s3.amazonaws.com/uploads/${fileName}`;
  return uploadUrl;
}

// POST /api/files/upload-url - Generate presigned upload URL
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileName, file_size, mime_type } = body;

    // Validate required fields
    if (!fileName || !file_size || !mime_type) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'File name, size, and type are required'
        }
      }, { status: 400 });
    }

    // Validate file
    const validation = validateFile(fileName, file_size, mime_type);
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: validation.error
        }
      }, { status: 400 });
    }

    // Generate upload URL
    const uploadUrl = generateUploadUrl(fileName);

    return NextResponse.json({
      success: true,
      data: {
        upload_url: uploadUrl,
        file_name: fileName,
        file_size,
        mime_type
      },
      meta: {
        timestamp: new Date().toISOString(),
        expires_in: 3600 // 1 hour
      }
    });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'UPLOAD_URL_ERROR',
        message: 'Failed to generate upload URL'
      }
    }, { status: 500 });
  }
}
