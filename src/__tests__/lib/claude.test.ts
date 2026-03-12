/**
 * @jest-environment node
 */

import { CLAUDE_FIXTURES, createMockClaudeResponse } from '@/src/__tests__/fixtures/claude';

const mockCreate = jest.fn();

jest.mock('@anthropic-ai/sdk', () => {
  const MockAnthropicClass = jest.fn().mockImplementation(() => ({
    messages: {
      create: mockCreate,
    },
  }));
  return {
    __esModule: true,
    default: MockAnthropicClass,
  };
});

jest.mock('@/app/lib/retry', () => ({
  withRetry: jest.fn(async (fn: () => Promise<unknown>) => fn()),
  RETRY_POLICIES: {
    claudeApi: { maxRetries: 3, baseDelayMs: 1000, maxDelayMs: 8000, backoffMultiplier: 2, jitter: true },
  },
}));

import { withRetry } from '@/app/lib/retry';

describe('app/lib/claude - analyzeResume', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreate.mockResolvedValue(
      createMockClaudeResponse(CLAUDE_FIXTURES.HIGH_MATCH_92)
    );
  });

  it('should return parsed ClaudeAnalysisResult on success', async () => {
    const { analyzeResume } = await import('@/app/lib/claude');

    const result = await analyzeResume('Sample resume text', 'Sample job description');

    expect(result).toEqual(CLAUDE_FIXTURES.HIGH_MATCH_92);
    expect(result.matchScore).toBe(92);
    expect(result.strengths).toBeInstanceOf(Array);
    expect(result.weaknesses).toBeInstanceOf(Array);
    expect(result.recommendations).toBeInstanceOf(Array);
  });

  it('should call Claude API with correct model and parameters', async () => {
    const { analyzeResume } = await import('@/app/lib/claude');

    await analyzeResume('resume text', 'job desc');

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'claude-sonnet-4-5',
        max_tokens: 2560,
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining('resume text'),
          }),
        ]),
      }),
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      })
    );
  });

  it('should use withRetry with claudeApi policy and circuit breaker key', async () => {
    const { analyzeResume } = await import('@/app/lib/claude');

    await analyzeResume('resume', 'job');

    expect(withRetry).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ maxRetries: 3 }),
      'claude-api'
    );
  });

  it('should abort after ANALYSIS_TIMEOUT_MS via AbortController', async () => {
    jest.useFakeTimers();

    mockCreate.mockImplementation((_params: unknown, options: { signal: AbortSignal }) =>
      new Promise((_, reject) => {
        options.signal.addEventListener('abort', () =>
          reject(new Error('The operation was aborted'))
        );
      })
    );

    (withRetry as jest.Mock).mockImplementation(async (fn: () => Promise<unknown>) => fn());

    const { analyzeResume, ANALYSIS_TIMEOUT_MS } = await import('@/app/lib/claude');
    const promise = analyzeResume('resume text', 'job description');

    jest.advanceTimersByTime(ANALYSIS_TIMEOUT_MS + 1);

    await expect(promise).rejects.toThrow('The operation was aborted');

    jest.useRealTimers();
  });

  it('should throw ZodError on malformed JSON response', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [
        {
          type: 'text',
          text: JSON.stringify({ matchScore: 'not-a-number', strengths: [], recommendations: [] }),
        },
      ],
    });

    const { analyzeResume } = await import('@/app/lib/claude');

    await expect(analyzeResume('resume', 'job')).rejects.toThrow();
  });

  it('should throw on non-JSON response text', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [
        {
          type: 'text',
          text: 'This is not JSON at all',
        },
      ],
    });

    const { analyzeResume } = await import('@/app/lib/claude');

    await expect(analyzeResume('resume', 'job')).rejects.toThrow();
  });

  it('should throw when response has no text content', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'image', source: {} }],
    });

    const { analyzeResume } = await import('@/app/lib/claude');

    await expect(analyzeResume('resume', 'job')).rejects.toThrow();
  });

  it('should validate matchScore is within 0-100 range', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            matchScore: 150,
            strengths: ['good'],
            weaknesses: [],
            recommendations: ['do more'],
          }),
        },
      ],
    });

    const { analyzeResume } = await import('@/app/lib/claude');

    await expect(analyzeResume('resume', 'job')).rejects.toThrow();
  });

  it('should require at least one strength', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            matchScore: 50,
            strengths: [],
            weaknesses: [],
            recommendations: ['something'],
          }),
        },
      ],
    });

    const { analyzeResume } = await import('@/app/lib/claude');

    await expect(analyzeResume('resume', 'job')).rejects.toThrow();
  });

  it('should require at least one recommendation', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            matchScore: 50,
            strengths: ['good'],
            weaknesses: [],
            recommendations: [],
          }),
        },
      ],
    });

    const { analyzeResume } = await import('@/app/lib/claude');

    await expect(analyzeResume('resume', 'job')).rejects.toThrow();
  });
});
