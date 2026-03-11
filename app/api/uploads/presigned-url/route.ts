import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/lib/auth';
import { generateUploadPresignedUrl, generateFileKey, URL_EXPIRATION } from '@/src/lib/s3';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '@/app/lib/validations';
import { checkRateLimit, getClientIp, rateLimitResponse, RATE_LIMITS } from '@/app/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.userId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const ip = getClientIp(request);
    const rateLimitResult = checkRateLimit(`presigned-url:${ip}`, RATE_LIMITS.GENERAL_API);
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    const body = await request.json();
    const { fileName, fileSize, mimeType } = body;

    if (!fileName || !fileSize || !mimeType) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'fileName, fileSize, and mimeType are required' },
        },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid file type. Allowed: PDF, DOCX, TXT' },
        },
        { status: 400 }
      );
    }

    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'File too large. Maximum size: 15MB' },
        },
        { status: 400 }
      );
    }

    const fileKey = generateFileKey(String(session.user.userId), fileName);
    const uploadUrl = await generateUploadPresignedUrl(fileKey, mimeType);

    return NextResponse.json({
      success: true,
      data: { uploadUrl, fileKey, fileName, fileSize, mimeType },
      meta: { timestamp: new Date().toISOString(), expiresIn: URL_EXPIRATION },
    });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return NextResponse.json(
      { success: false, error: { code: 'PRESIGNED_URL_ERROR', message: 'Failed to generate upload URL' } },
      { status: 500 }
    );
  }
}
