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

// NOTE: An identical interface exists in src/__tests__/fixtures/claude/index.ts
// Source of truth is THIS file (app/lib/claude.ts). Tests should import from here.
export interface ClaudeAnalysisResult {
  matchScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  categoryScores?: {
    skills: number;
    experience: number;
    qualifications: number;
  };
}

const claudeResponseSchema = z.object({
  matchScore: z.number().int().min(0).max(100),
  strengths: z.array(z.string()).min(1),
  weaknesses: z.array(z.string()),
  recommendations: z.array(z.string()).min(1),
  categoryScores: z.object({
    skills: z.number().int().min(0).max(100),
    experience: z.number().int().min(0).max(100),
    qualifications: z.number().int().min(0).max(100),
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
  jobDescription: string
): Promise<ClaudeAnalysisResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ANALYSIS_TIMEOUT_MS);

  try {
    return await withRetry(
      async () => {
        const message = await anthropic.messages.create(
          {
            model: MODEL,
            max_tokens: 2048, // Spike showed 1,248 output tokens — 1024 risks truncation
            messages: [
              {
                role: 'user',
                content: buildPrompt(resumeText, jobDescription),
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

function buildPrompt(resumeText: string, jobDescription: string): string {
  return `You are an expert resume analyst. Analyze the resume against the job description and return ONLY valid JSON.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Return ONLY this JSON structure (no markdown, no explanation):
{
  "matchScore": <integer 0-100>,
  "strengths": ["<strength 1>", ...],
  "weaknesses": ["<gap 1>", ...],
  "recommendations": ["<action item 1>", ...],
  "categoryScores": { "skills": <0-100>, "experience": <0-100>, "qualifications": <0-100> }
}`;
}

export { claudeResponseSchema, ANALYSIS_TIMEOUT_MS, MODEL };
