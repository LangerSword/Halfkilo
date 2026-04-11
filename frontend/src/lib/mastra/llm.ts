// src/lib/mastra/llm.ts
// 100% free tier providers — NO paid APIs.
// Primary: Groq (console.groq.com — no credit card, 6000 tokens/min free)
// Fallback: Google Gemini Flash (aistudio.google.com — 250 req/day free)
// Emergency: Groq fast model (lower quality, higher throughput)
//
// ENV VARS needed in .env.local:
//   GROQ_API_KEY=gsk_...        (get free at console.groq.com → API Keys)
//   GOOGLE_AI_KEY=AIza...       (get free at aistudio.google.com → Get API Key)
//   Both are optional — the chain degrades gracefully if one is missing.

import { createGroq } from '@ai-sdk/groq';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

// ── Primary: Groq — llama-3.3-70b-versatile ─────────────────────────────────
// Best free model for in-character reasoning and tool use.
// Rate limit: 6000 tokens/min, 500 req/day on free tier.
const groqProvider = process.env.GROQ_API_KEY
  ? createGroq({ apiKey: process.env.GROQ_API_KEY })
  : null;

// ── Fast variant: Groq — llama3-8b-8192 ─────────────────────────────────────
// Faster, lower quality. Used for quick battle moves when rate-limited.
const groqFastProvider = groqProvider; // same client, different model string

// ── Fallback: Google Gemini 2.0 Flash ───────────────────────────────────────
// Free tier: 15 req/min, 250 req/day. Good quality.
const geminiProvider = process.env.GOOGLE_AI_KEY
  ? createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_AI_KEY })
  : null;

export type LLMTier = 'primary' | 'fast' | 'fallback';

export function getLLM(tier: LLMTier = 'primary') {
  switch (tier) {
    case 'primary':
      if (groqProvider) return groqProvider('llama-3.3-70b-versatile');
      if (geminiProvider) return geminiProvider('gemini-2.0-flash');
      throw new Error('No LLM available. Set GROQ_API_KEY or GOOGLE_AI_KEY in .env.local');

    case 'fast':
      if (groqProvider) return groqProvider('llama3-8b-8192');
      if (geminiProvider) return geminiProvider('gemini-2.0-flash');
      throw new Error('No fast LLM available.');

    case 'fallback':
      if (geminiProvider) return geminiProvider('gemini-2.0-flash');
      if (groqProvider) return groqProvider('llama3-8b-8192');
      throw new Error('No fallback LLM available.');
  }
}

// Tries primary first, catches rate-limit errors, falls back automatically.
// Use this wrapper in API routes for resilience.
export async function withFallback<T>(
  fn: (tier: LLMTier) => Promise<T>
): Promise<T> {
  const tiers: LLMTier[] = ['primary', 'fallback', 'fast'];
  let lastError: Error | null = null;

  for (const tier of tiers) {
    try {
      return await fn(tier);
    } catch (err: any) {
      // Groq rate limit returns 429. Google returns 429 or RESOURCE_EXHAUSTED.
      const isRateLimit =
        err?.status === 429 ||
        err?.message?.includes('rate') ||
        err?.message?.includes('quota') ||
        err?.message?.includes('RESOURCE_EXHAUSTED');

      if (isRateLimit) {
        lastError = err;
        continue; // try next tier
      }
      throw err; // non-rate-limit error — propagate immediately
    }
  }
  throw lastError ?? new Error('All LLM tiers exhausted');
}
