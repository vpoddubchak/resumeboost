import { NextRequest, NextResponse } from 'next/server';
import { generateDownloadPresignedUrl, URL_EXPIRATION } from '@/src/lib/s3';

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

    // Generate presigned download URL
    const downloadUrl = await generateDownloadPresignedUrl(file_key);

    return NextResponse.json({
      success: true,
      data: {
        download_url: downloadUrl,
        file_key
      },
      meta: {
        timestamp: new Date().toISOString(),
        expires_in: URL_EXPIRATION
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
