import { auth } from '@/app/lib/auth';
import prisma from '@/app/lib/prisma';
import type { Prisma } from '@prisma/client';
import { checkRateLimit, RATE_LIMITS, rateLimitResponse } from '@/app/lib/rate-limit';
import { analyzeRequestSchema, validateBody } from '@/app/lib/validations';
import { downloadFileContent } from '@/src/lib/s3';
import { extractTextFromFile, UnsupportedFileTypeError } from '@/app/lib/file-extractor';
import { analyzeResume } from '@/app/lib/claude';
import type { ClaudeAnalysisResult } from '@/app/lib/claude';
import { logger } from '@/app/lib/logger';
import type { LogContext } from '@/app/lib/logger';

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    // 1. Auth check
    const session = await auth();
    if (!session?.user?.userId) {
      return Response.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const userId = session.user.userId;

    // 2. Rate limit (keyed by user_id, not IP)
    const rateLimitResult = checkRateLimit(`ai-analysis:${userId}`, RATE_LIMITS.AI_ANALYSIS);
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    // 3. Validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid JSON body' } },
        { status: 422 }
      );
    }

    const validation = validateBody(analyzeRequestSchema, body);
    if (!validation.success) {
      return Response.json(
        { success: false, error: validation.error },
        { status: 422 }
      );
    }

    const { upload_id, job_description, locale } = validation.data;

    // 4. Look up upload record (IDOR protection: filter by BOTH upload_id AND user_id)
    const upload = await prisma.upload.findFirst({
      where: {
        upload_id,
        user_id: userId,
        upload_status: 'uploaded',
      },
    });

    if (!upload) {
      return Response.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Upload not found' } },
        { status: 404 }
      );
    }

    // 5. Download file from S3
    let fileBuffer: Buffer;
    try {
      fileBuffer = await downloadFileContent(upload.file_path);
    } catch (error) {
      logger.error('S3 download failed', {
        action: 'analysis_s3_download',
        userId,
        uploadId: upload_id,
        error: error instanceof Error ? error.message : String(error),
      } as LogContext);
      return Response.json(
        { success: false, error: { code: 'DOWNLOAD_ERROR', message: 'Failed to retrieve uploaded file' } },
        { status: 500 }
      );
    }

    // 6. Extract text from file
    let resumeText: string;
    try {
      resumeText = await extractTextFromFile(fileBuffer, upload.mime_type);
    } catch (error) {
      if (error instanceof UnsupportedFileTypeError) {
        return Response.json(
          { success: false, error: { code: 'EXTRACTION_ERROR', message: error.message } },
          { status: 422 }
        );
      }
      logger.error('Text extraction failed', {
        action: 'analysis_text_extraction',
        userId,
        uploadId: upload_id,
        mimeType: upload.mime_type,
        error: error instanceof Error ? error.message : String(error),
      } as LogContext);
      return Response.json(
        { success: false, error: { code: 'EXTRACTION_ERROR', message: 'Failed to extract text from file' } },
        { status: 422 }
      );
    }

    // 7. Call Claude API for analysis
    let analysisResult: ClaudeAnalysisResult;
    try {
      analysisResult = await analyzeResume(resumeText, job_description, locale);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isTimeout = error instanceof Error && (error.name === 'AbortError' || message.toLowerCase().includes('abort') || message.toLowerCase().includes('timeout'));
      const isCircuitOpen = message.includes('Circuit breaker is open');

      logger.error('Claude analysis failed', {
        action: 'analysis_claude_api',
        userId,
        uploadId: upload_id,
        error: message,
        isTimeout,
        isCircuitOpen,
      } as LogContext);

      if (isTimeout) {
        return Response.json(
          { success: false, error: { code: 'ANALYSIS_TIMEOUT', message: 'Analysis timed out. Please try again.' } },
          { status: 408 }
        );
      }

      return Response.json(
        { success: false, error: { code: 'ANALYSIS_ERROR', message: 'AI analysis failed. Please try again.' } },
        { status: 500 }
      );
    }

    // 8. Save to database
    let analysis;
    try {
      analysis = await prisma.analysis.create({
        data: {
          upload_id,
          user_id: userId,
          analysis_data: {
            matchScore: analysisResult.matchScore,
            strengths: analysisResult.strengths,
            weaknesses: analysisResult.weaknesses,
            recommendations: analysisResult.recommendations,
            ...(analysisResult.categoryBreakdown && {
              categoryBreakdown: {
                skills: { ...analysisResult.categoryBreakdown.skills },
                experience: { ...analysisResult.categoryBreakdown.experience },
                qualifications: { ...analysisResult.categoryBreakdown.qualifications },
              },
            }),
          } as Prisma.InputJsonObject,
          score: analysisResult.matchScore,
          recommendations: {
            strengths: analysisResult.strengths,
            weaknesses: analysisResult.weaknesses,
            recommendations: analysisResult.recommendations,
          },
        },
      });
    } catch (error) {
      logger.error('Database save failed', {
        action: 'analysis_db_save',
        userId,
        uploadId: upload_id,
        error: error instanceof Error ? error.message : String(error),
      } as LogContext);
      return Response.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to save analysis results' } },
        { status: 500 }
      );
    }

    // 9. Return success response
    return Response.json(
      {
        success: true,
        data: {
          analysisId: analysis.analysis_id,
          score: analysis.score,
          analysisData: analysis.analysis_data,
          recommendations: analysis.recommendations,
          createdAt: analysis.created_at.toISOString(),
        },
        meta: { timestamp: new Date().toISOString() },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Unexpected error in analysis endpoint', {
      action: 'analysis_unexpected_error',
      error: error instanceof Error ? error.message : String(error),
    } as LogContext);
    return Response.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
