/**
 * Direct browser-side Anthropic API client.
 * Uses the Messages API with streaming via SSE.
 * Requires VITE_ANTHROPIC_API_KEY in .env
 */

const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY ?? '';
const API_URL = 'https://api.anthropic.com/v1/messages';

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Stream a response from Claude directly via the Anthropic Messages API.
 * Calls onChunk for each text delta, onDone when the message is complete.
 */
export async function streamClaude(
  systemPrompt: string,
  messages: ClaudeMessage[],
  onChunk: (text: string) => void,
  onDone: (fullText: string) => void,
  model = 'claude-sonnet-4-6',
  maxTokens = 1024,
): Promise<void> {
  if (!API_KEY) {
    // Fallback: invoke through backend if no direct key
    throw new Error('VITE_ANTHROPIC_API_KEY not set — falling back to backend');
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      stream: true,
      system: systemPrompt,
      messages,
    }),
  });

  if (!response.ok || !response.body) {
    const errText = await response.text().catch(() => response.statusText);
    throw new Error(`Anthropic API error ${response.status}: ${errText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? ''; // keep incomplete last line

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6).trim();
      if (!payload || payload === '[DONE]') continue;

      try {
        const event = JSON.parse(payload);
        if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
          const chunk: string = event.delta.text;
          fullText += chunk;
          onChunk(chunk);
        } else if (event.type === 'message_stop') {
          onDone(fullText);
          return;
        }
      } catch {
        // Skip malformed SSE events
      }
    }
  }

  onDone(fullText);
}
