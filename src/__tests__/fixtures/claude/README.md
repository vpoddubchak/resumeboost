# Claude API Mock Fixtures

Real-world Claude API response examples for testing **without** making actual API calls.

## Available Fixtures

| Fixture | Match Score | Use Case |
|---------|-------------|----------|
| `PERFECT_MATCH_98` | 98 | Candidate exceeds all requirements |
| `HIGH_MATCH_92` | 92 | Strong candidate, minor gaps |
| `MEDIUM_MATCH_68` | 68 | Meets basics, missing key skills |
| `CAREER_CHANGE_45` | 45 | Career switcher, limited experience |
| `LOW_MATCH_34` | 34 | Significant experience gap |
| `NO_EXPERIENCE_12` | 12 | Fresh graduate, no professional experience |

## Usage in Tests

### Basic Usage

```typescript
import { CLAUDE_FIXTURES, createMockClaudeResponse } from '@/__tests__/fixtures/claude';

// Use specific fixture
const mockResponse = createMockClaudeResponse(CLAUDE_FIXTURES.HIGH_MATCH_92);

// Mock the SDK
jest.mock('@anthropic-ai/sdk', () => ({
  default: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue(mockResponse)
    }
  }))
}));
```

### Dynamic Fixture Selection

```typescript
import { getFixtureByScore } from '@/__tests__/fixtures/claude';

// Get fixture based on expected score
const fixture = getFixtureByScore(85); // Returns HIGH_MATCH_92
```

### Random Testing

```typescript
import { getRandomFixture } from '@/__tests__/fixtures/claude';

// Useful for fuzz testing
test('handles any match score', () => {
  const fixture = getRandomFixture();
  expect(fixture.matchScore).toBeGreaterThanOrEqual(0);
  expect(fixture.matchScore).toBeLessThanOrEqual(100);
});
```

## Example Test

```typescript
// src/__tests__/lib/claude.test.ts
import { analyzeResume } from '@/lib/claude';
import { CLAUDE_FIXTURES, createMockClaudeResponse } from '@/__tests__/fixtures/claude';

jest.mock('@anthropic-ai/sdk', () => ({
  default: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue(
        createMockClaudeResponse(CLAUDE_FIXTURES.HIGH_MATCH_92)
      )
    }
  }))
}));

describe('Claude Resume Analysis', () => {
  test('returns high match score for qualified candidate', async () => {
    const result = await analyzeResume('resume text', 'job description');
    
    expect(result.matchScore).toBe(92);
    expect(result.strengths).toHaveLength(8);
    expect(result.weaknesses).toHaveLength(4);
    expect(result.recommendations).toHaveLength(5);
  });
});
```

## Fixture Structure

All fixtures follow this schema:

```typescript
interface ClaudeAnalysisResult {
  matchScore: number;           // 0-100
  strengths: string[];          // 3-10 items
  weaknesses: string[];         // 2-8 items
  recommendations: string[];    // 3-10 items
}
```

## Benefits

✅ **No API costs** — tests run without real Claude API calls  
✅ **Fast** — instant responses vs 20s API latency  
✅ **Deterministic** — same input = same output  
✅ **CI/CD friendly** — no API keys needed  
✅ **Realistic** — based on actual Claude responses from spike testing

## When to Use Real API

Use real Claude API only for:
- **E2E tests** (manual, weekly)
- **Spike validation** (one-time)
- **Production monitoring** (health checks)

**Never** use real API in:
- Unit tests
- Integration tests
- CI/CD pipeline
- Pre-commit hooks
