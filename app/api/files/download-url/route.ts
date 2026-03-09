import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Database connection singleton
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Mock download URL generation
function generateDownloadUrl(file_key: string) {
  // In real implementation, this would generate AWS S3 presigned download URL
  const downloadUrl = `https://resumeboost-uploads.s3.amazonaws.com/${file_key}`;
  return downloadUrl;
}

// POST /api/files/download-url - Generate presigned download URL
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { file_key } = body;

    // Validate required fields
    if (!file_key) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'File key is required'
        }
      }, { status: 400 });
    }

    // Generate download URL
    const downloadUrl = generateDownloadUrl(file_key);

    return NextResponse.json({
      success: true,
      data: {
        download_url: downloadUrl,
        file_key
      },
      meta: {
        timestamp: new Date().toISOString(),
        expires_in: 3600 // 1 hour
      }
    });
  } catch (error) {
    console.error('Error generating download URL:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'DOWNLOAD_URL_ERROR',
        message: 'Failed to generate download URL'
      }
    }, { status: 500 });
  }
}
