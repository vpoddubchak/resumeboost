import Anthropic from '@anthropic-ai/sdk';
import { withRetry, RETRY_POLICIES } from './retry';
import { z } from 'zod';
import { logger } from './logger';

class ClaudeParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ClaudeParseError';
  }
}

// Source of truth for Claude response types. Re-exported by src/__tests__/fixtures/claude/index.ts.
export interface CategoryBreakdownItem {
  score: number;
  matched: string[];
  gaps: string[];
  analysis: string;
}

export interface ClaudeAnalysisResult {
  matchScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  categoryBreakdown?: {
    skills: CategoryBreakdownItem;
    experience: CategoryBreakdownItem;
    qualifications: CategoryBreakdownItem;
  };
}

const categoryBreakdownItemSchema = z.object({
  score: z.number().int().min(0).max(100),
  matched: z.array(z.string()),
  gaps: z.array(z.string()),
  analysis: z.string(),
});

const claudeResponseSchema = z.object({
  matchScore: z.number().int().min(0).max(100),
  strengths: z.array(z.string()).min(1),
  weaknesses: z.array(z.string()),
  recommendations: z.array(z.string()).min(1),
  categoryBreakdown: z.object({
    skills: categoryBreakdownItemSchema,
    experience: categoryBreakdownItemSchema,
    qualifications: categoryBreakdownItemSchema,
  }).optional(),
});

const ANALYSIS_TIMEOUT_MS = 35_000; // 35s — 5s buffer above 30s SLA (NFR1)
const MODEL = 'claude-sonnet-4-5'; // Cost-optimized: $0.007/analysis vs $0.022 for Opus

// Singleton — do NOT re-instantiate per request
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function analyzeResume(
  resumeText: string,
  jobDescription: string,
  locale: string = 'en'
): Promise<ClaudeAnalysisResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ANALYSIS_TIMEOUT_MS);

  try {
    return await withRetry(
      async () => {
        const message = await anthropic.messages.create(
          {
            model: MODEL,
            max_tokens: 2560, // Increased for richer categoryBreakdown response
            messages: [
              {
                role: 'user',
                content: buildPrompt(resumeText, jobDescription, locale),
              },
            ],
          },
          { signal: controller.signal }
        );

        const text = message.content[0]?.type === 'text' ? message.content[0].text : '';
        logger.debug('Claude raw response', { rawText: text });
        let parsed: unknown;
        try {
          // Claude sometimes wraps JSON in ```json``` blocks
          const cleanText = text.replace(/^```json\s*\n?|\n?```$/g, '').trim();
          parsed = JSON.parse(cleanText);
        } catch {
          logger.error('Claude JSON parse failed', { rawText: text });
          throw new ClaudeParseError('Claude returned unparseable JSON');
        }
        return claudeResponseSchema.parse(parsed); // Throws ZodError if malformed
      },
      {
        ...RETRY_POLICIES.claudeApi,
        shouldRetry: (error: Error) =>
          !controller.signal.aborted &&
          error.name !== 'AbortError' &&
          !(error instanceof ClaudeParseError) &&
          !(error instanceof z.ZodError),
      },
      'claude-api'
    );
  } finally {
    clearTimeout(timeout);
  }
}

function buildPrompt(resumeText: string, jobDescription: string, locale: string): string {
  const langInstruction = locale === 'uk'
    ? '\nIMPORTANT: Write ALL text values (strengths, weaknesses, recommendations, analysis) in Ukrainian (українською мовою). JSON keys must remain in English.'
    : '';

  return `You are an expert resume analyst. Analyze the resume against the job description and return ONLY valid JSON.${langInstruction}

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Return ONLY this JSON structure (no markdown, no explanation):
{
  "matchScore": <integer 0-100>,
  "strengths": ["<overall strength 1>", ...],
  "weaknesses": ["<overall gap 1>", ...],
  "recommendations": ["<specific action item 1>", ...],
  "categoryBreakdown": {
    "skills": {
      "score": <integer 0-100>,
      "matched": ["<specific skill from resume that matches a job requirement>", ...],
      "gaps": ["<specific skill required by the job but missing or weak in resume>", ...],
      "analysis": "<1-2 sentence assessment of skills alignment>"
    },
    "experience": {
      "score": <integer 0-100>,
      "matched": ["<specific experience or achievement that aligns with requirements>", ...],
      "gaps": ["<specific experience required but missing from resume>", ...],
      "analysis": "<1-2 sentence assessment of experience alignment>"
    },
    "qualifications": {
      "score": <integer 0-100>,
      "matched": ["<specific qualification, degree, or certification that matches>", ...],
      "gaps": ["<specific qualification required but absent from resume>", ...],
      "analysis": "<1-2 sentence assessment of qualifications alignment>"
    }
  }
}`;
}

export { claudeResponseSchema, ANALYSIS_TIMEOUT_MS, MODEL };
