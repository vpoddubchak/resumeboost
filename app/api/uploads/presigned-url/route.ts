import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/app/lib/auth';
import { generateUploadPresignedUrl, generateFileKey, URL_EXPIRATION } from '@/src/lib/s3';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '@/app/lib/validations';
import { checkRateLimit, getClientIp, rateLimitResponse, RATE_LIMITS } from '@/app/lib/rate-limit';

const presignedUrlRequestSchema = z.object({
  fileName: z.string().min(1, 'File name is required').max(255),
  fileSize: z.number().positive().max(MAX_FILE_SIZE, 'File too large. Maximum size: 15MB'),
  mimeType: z
    .string()
    .refine(
      (val): val is (typeof ALLOWED_MIME_TYPES)[number] =>
        (ALLOWED_MIME_TYPES as readonly string[]).includes(val),
      'Invalid file type. Allowed: PDF, DOCX, TXT'
    ),
});

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
    const parsed = presignedUrlRequestSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: firstIssue?.message ?? 'Invalid request body',
          },
        },
        { status: 400 }
      );
    }

    const { fileName, fileSize, mimeType } = parsed.data;

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
