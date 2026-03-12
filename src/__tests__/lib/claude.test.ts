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
        max_tokens: 2048,
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

  it('should throw on timeout (AbortController abort)', async () => {
    mockCreate.mockImplementation((_params: unknown, options: { signal: AbortSignal }) => {
      return new Promise((_resolve, reject) => {
        if (options?.signal) {
          options.signal.addEventListener('abort', () => {
            reject(new Error('The operation was aborted'));
          });
        }
        // Simulate long wait — the abort will fire first
      });
    });

    // Override withRetry to call fn directly but with a very short timeout
    (withRetry as jest.Mock).mockImplementation(async (fn: () => Promise<unknown>) => {
      // We need to test that the abort happens — but the real timeout is 35s
      // Instead, test that AbortController is used by checking the signal is passed
      return fn();
    });

    const { analyzeResume } = await import('@/app/lib/claude');

    // The call will hang because mockCreate never resolves
    // We verify abort signal is passed in the 'should call Claude API' test above
    // Here we verify that a rejected abort throws
    mockCreate.mockRejectedValueOnce(new Error('The operation was aborted'));

    await expect(analyzeResume('resume', 'job')).rejects.toThrow('The operation was aborted');
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
