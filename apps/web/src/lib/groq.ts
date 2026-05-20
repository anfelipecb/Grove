import type { AiMessage } from "@grove/core";

const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";

/**
 * OpenAI-compatible chat completion against Groq. Returns trimmed text, or "" if no API key.
 */
export async function groqText(
  messages: AiMessage[],
  options?: { temperature?: number; model?: string; max_tokens?: number },
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  const model = options?.model ?? process.env.GROQ_MODEL ?? "llama-3.1-8b-instant";
  if (!apiKey) {
    return "";
  }
  const temperature = options?.temperature ?? 0.35;
  const response = await fetch(GROQ_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      ...(options?.max_tokens != null ? { max_tokens: options.max_tokens } : {}),
    }),
  });
  if (!response.ok) {
    throw new Error(`Groq error: ${response.status}`);
  }
  const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return payload.choices?.[0]?.message?.content?.trim() ?? "";
}
