# Claude API Spike - Setup & Results

## Spike Script

**`claude-api-spike.ts`** — Direct Anthropic Claude API

## ✅ Real Results (March 11, 2026)

| Metric | Value | SLA |
|--------|-------|-----|
| Model | `claude-opus-4-5` | — |
| Latency avg | 20.03s | ✅ PASS (<30s) |
| Latency min/max | 19.13s / 20.98s | ✅ |
| Cost/analysis | $0.0217 | ✅ |
| Monthly (100 users/day) | $65.03 | ✅ |
| Response JSON | Stable | ✅ |
| Error handling | Working | ✅ |

> **Production note:** Use `claude-sonnet-4-5` (~$0.007/analysis) instead of Opus for 3x cost savings.

## Setup

### 1. Get API Key

1. Sign up at [console.anthropic.com](https://console.anthropic.com/)
2. Settings → API Keys → Create Key

### 2. Add to `.env.local`

```bash
ANTHROPIC_API_KEY="sk-ant-..."
```

### 3. Run spike

```bash
npx tsx scripts/claude-api-spike.ts
```

## Implementation for Epic 1

```typescript
// app/lib/claude.ts
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function analyzeResume(resume: string, jobDescription: string) {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',   // cheaper than opus, same quality for analysis
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `Analyze resume vs job description. Return JSON:
{"matchScore":<0-100>,"strengths":[...],"weaknesses":[...],"recommendations":[...]}

RESUME: ${resume}
JOB: ${jobDescription}`
    }]
  });
  return response;
}
```

## Retry Config

```typescript
// 2 retries, 2s/4s exponential backoff, 35s timeout
const RETRY_CONFIG = { maxRetries: 2, baseDelayMs: 2000, maxDelayMs: 8000 };
const TIMEOUT_MS = 35000;
```
