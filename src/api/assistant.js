// Streaming client for the RAG shopping assistant.
//
// We use the Fetch API (not axios) so we can read the response body as a stream and render
// tokens as they arrive. The backend streams NDJSON: one JSON object per line, e.g.
//   {"token":"Hi"}\n{"token":" there"}\n ...
// and returns the conversation id in the `X-Conversation-Id` response header.

import { authHeaders } from "./authToken";

const ASSISTANT_STREAM_URL = `${import.meta.env.VITE_BACK_END_URL}/api/assistant/stream`;

/**
 * Stream an assistant reply.
 *
 * @param {Object}   params
 * @param {string}   params.message          the user's message
 * @param {string?}  params.conversationId    id to continue a conversation (optional)
 * @param {(t:string)=>void} params.onToken   called with each token fragment as it streams in
 * @param {(id:string)=>void} [params.onConversationId] called once with the conversation id
 * @param {AbortSignal} [params.signal]       optional abort signal to cancel the stream
 * @returns {Promise<void>} resolves when the stream completes
 */
export async function streamAssistant({ message, conversationId, onToken, onConversationId, signal }) {
  const response = await fetch(ASSISTANT_STREAM_URL, {
    method: "POST",
    headers: authHeaders({
      "Content-Type": "application/json",
      Accept: "application/x-ndjson",
    }),
    credentials: "include",
    body: JSON.stringify({ conversationId: conversationId || null, message }),
    signal,
  });

  if (response.status === 401 || response.status === 403) {
    throw new Error("Please log in to chat with Rosy.");
  }
  if (!response.ok || !response.body) {
    throw new Error(`Assistant request failed (${response.status}).`);
  }

  const newConversationId = response.headers.get("X-Conversation-Id");
  if (newConversationId && onConversationId) {
    onConversationId(newConversationId);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const flushLine = (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed.token === "string") {
        onToken(parsed.token);
      }
    } catch {
      // Ignore partial / non-JSON lines; the remainder stays buffered.
    }
  };

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIndex;
    while ((newlineIndex = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);
      flushLine(line);
    }
  }

  // Flush any trailing content after the last newline.
  flushLine(buffer);
}
