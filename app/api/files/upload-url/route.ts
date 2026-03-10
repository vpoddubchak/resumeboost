import { NextRequest, NextResponse } from 'next/server';
import { generateUploadPresignedUrl, generateFileKey, URL_EXPIRATION } from '@/src/lib/s3';

// File validation
function validateFile(fileName: string, file_size: number, mime_type: string) {
  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!allowedTypes.includes(mime_type)) {
    return { valid: false, error: 'Invalid file type. Allowed: PDF, DOC, DOCX' };
  }
  
  if (file_size > maxSize) {
    return { valid: false, error: 'File too large. Maximum size: 10MB' };
  }
  
  return { valid: true };
}

// POST /api/files/upload-url - Generate presigned upload URL
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileName, file_size, mime_type, user_id } = body;

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

    // Generate S3 key and presigned upload URL
    const fileKey = generateFileKey(user_id || 'anonymous', fileName);
    const uploadUrl = await generateUploadPresignedUrl(fileKey, mime_type);

    return NextResponse.json({
      success: true,
      data: {
        upload_url: uploadUrl,
        file_key: fileKey,
        file_name: fileName,
        file_size,
        mime_type
      },
      meta: {
        timestamp: new Date().toISOString(),
        expires_in: URL_EXPIRATION
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
