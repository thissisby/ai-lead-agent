/**
 * Groq API Client — Browser-compatible (no Node.js dependencies)
 *
 * Uses: llama3-70b-8192 (fast, free tier available)
 * Retry: 3 attempts with exponential backoff (1s → 2s → 4s)
 * Fallback: Returns null if API key missing or all retries failed
 *
 * Get a free API key at: https://console.groq.com
 * Set VITE_GROQ_API_KEY in your .env.local file.
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama3-70b-8192';
const TEMPERATURE = 0.3;
const MAX_TOKENS = 200;
const RETRY_DELAYS = [1000, 2000, 4000]; // ms

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqResponse {
  text: string;
  model: string;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Call Groq API with retry + exponential backoff.
 * Returns null if VITE_GROQ_API_KEY is not set or all retries fail.
 */
export async function callGroq(
  messages: GroqMessage[],
  systemPrompt?: string
): Promise<GroqResponse | null> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;

  if (!apiKey || apiKey === 'your_groq_api_key_here') {
    console.debug('[Groq] No API key set — using scripted fallback');
    return null;
  }

  const allMessages: GroqMessage[] = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages;

  for (let attempt = 0; attempt < RETRY_DELAYS.length + 1; attempt++) {
    try {
      console.debug(`[Groq] Attempt ${attempt + 1}/${RETRY_DELAYS.length + 1}`);

      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: allMessages,
          temperature: TEMPERATURE,
          max_tokens: MAX_TOKENS,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.warn(`[Groq] HTTP ${response.status}: ${errorText}`);

        // 429 rate limit — always retry with backoff
        if (response.status === 429 && attempt < RETRY_DELAYS.length) {
          console.warn(`[Groq] Rate limited. Retrying in ${RETRY_DELAYS[attempt]}ms...`);
          await sleep(RETRY_DELAYS[attempt]);
          continue;
        }

        // Other errors — retry if attempts left
        if (attempt < RETRY_DELAYS.length) {
          await sleep(RETRY_DELAYS[attempt]);
          continue;
        }

        return null;
      }

      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content?.trim();

      if (!text) {
        console.warn('[Groq] Empty response received');
        return null;
      }

      console.debug('[Groq] Success:', text.substring(0, 80) + '...');
      return {
        text,
        model: data.model || MODEL,
        usage: data.usage,
      };
    } catch (err) {
      console.warn(`[Groq] Network error on attempt ${attempt + 1}:`, err);
      if (attempt < RETRY_DELAYS.length) {
        await sleep(RETRY_DELAYS[attempt]);
      }
    }
  }

  console.warn('[Groq] All retries exhausted — using scripted fallback');
  return null;
}

/**
 * Simple helper: send a single user message and get back a string.
 * Falls back to `fallbackResponse` if Groq unavailable.
 */
export async function askGroq(
  userMessage: string,
  systemPrompt: string,
  fallbackResponse: string
): Promise<string> {
  const result = await callGroq(
    [{ role: 'user', content: userMessage }],
    systemPrompt
  );
  return result?.text ?? fallbackResponse;
}
