/**
 * Claude API Mock Fixtures
 * 
 * Real-world response examples for testing without API calls.
 * Based on actual Claude API responses from spike testing.
 */

import highMatch92 from './high-match-92.json';
import mediumMatch68 from './medium-match-68.json';
import lowMatch34 from './low-match-34.json';
import perfectMatch98 from './perfect-match-98.json';
import noExperience12 from './edge-case-no-experience.json';
import careerChange45 from './career-change-45.json';

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

/**
 * All available mock fixtures
 */
export const CLAUDE_FIXTURES = {
  HIGH_MATCH_92: highMatch92 as ClaudeAnalysisResult,
  MEDIUM_MATCH_68: mediumMatch68 as ClaudeAnalysisResult,
  LOW_MATCH_34: lowMatch34 as ClaudeAnalysisResult,
  PERFECT_MATCH_98: perfectMatch98 as ClaudeAnalysisResult,
  NO_EXPERIENCE_12: noExperience12 as ClaudeAnalysisResult,
  CAREER_CHANGE_45: careerChange45 as ClaudeAnalysisResult,
};

/**
 * Get fixture by match score range
 */
export function getFixtureByScore(score: number): ClaudeAnalysisResult {
  if (score >= 90) return CLAUDE_FIXTURES.PERFECT_MATCH_98;
  if (score >= 80) return CLAUDE_FIXTURES.HIGH_MATCH_92;
  if (score >= 60) return CLAUDE_FIXTURES.MEDIUM_MATCH_68;
  if (score >= 40) return CLAUDE_FIXTURES.CAREER_CHANGE_45;
  if (score >= 20) return CLAUDE_FIXTURES.LOW_MATCH_34;
  return CLAUDE_FIXTURES.NO_EXPERIENCE_12;
}

/**
 * Get random fixture for testing
 */
export function getRandomFixture(): ClaudeAnalysisResult {
  const fixtures = Object.values(CLAUDE_FIXTURES);
  return fixtures[Math.floor(Math.random() * fixtures.length)];
}

/**
 * Mock Claude API response with realistic structure
 */
export function createMockClaudeResponse(fixture: ClaudeAnalysisResult) {
  return {
    id: `msg_${Math.random().toString(36).substring(7)}`,
    type: 'message',
    role: 'assistant',
    content: [
      {
        type: 'text',
        text: JSON.stringify(fixture, null, 2),
      },
    ],
    model: 'claude-opus-4-5',
    stop_reason: 'end_turn',
    usage: {
      input_tokens: 985,
      output_tokens: 1248,
    },
  };
}

/**
 * Example usage in tests:
 * 
 * ```typescript
 * import { CLAUDE_FIXTURES, createMockClaudeResponse } from '@/__tests__/fixtures/claude';
 * 
 * jest.mock('@anthropic-ai/sdk', () => ({
 *   default: jest.fn().mockImplementation(() => ({
 *     messages: {
 *       create: jest.fn().mockResolvedValue(
 *         createMockClaudeResponse(CLAUDE_FIXTURES.HIGH_MATCH_92)
 *       )
 *     }
 *   }))
 * }));
 * ```
 */
