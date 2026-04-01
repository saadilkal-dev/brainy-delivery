const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Stream a chat response from the Delivery Brain backend.
 * Calls onChunk for each text piece, onDone when complete.
 */
export async function streamChat(
  messages: ChatMessage[],
  onChunk: (text: string) => void,
  onDone: (fullText: string) => void,
  projectContext?: Record<string, unknown>
): Promise<void> {
  const response = await fetch(`${BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, project_context: projectContext ?? null }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`Chat request failed: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const raw = decoder.decode(value, { stream: true });
    // SSE format: each line is "data: <content>\n\n"
    const lines = raw.split('\n');
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6);
      if (payload === '[DONE]') {
        onDone(fullText);
        return;
      }
      // Unescape newlines the server encoded
      const text = payload.replace(/\\n/g, '\n');
      fullText += text;
      onChunk(text);
    }
  }

  onDone(fullText);
}

/**
 * Parse artifact blocks that Claude embeds in its responses.
 * Format: <artifact type="mermaid" title="Title">content</artifact>
 */
export interface ParsedArtifact {
  type: 'mermaid' | 'timeline' | 'modules';
  title: string;
  content: string;
}

export function parseArtifacts(text: string): { clean: string; artifacts: ParsedArtifact[] } {
  const artifacts: ParsedArtifact[] = [];
  const clean = text.replace(
    /<artifact\s+type="([^"]+)"\s+title="([^"]+)">([\s\S]*?)<\/artifact>/g,
    (_match, type, title, content) => {
      artifacts.push({ type: type as ParsedArtifact['type'], title, content: content.trim() });
      return ''; // remove from visible text
    }
  ).trim();
  return { clean, artifacts };
}
