export const DEFAULT_GROQ_MODEL = "llama-3.1-8b-instant";

export type AiMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AiJsonRequest = {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  messages: AiMessage[];
  temperature?: number;
};

function firstNonWhitespaceModel(...values: (string | undefined)[]): string | undefined {
  for (const v of values) {
    const t = v?.trim();
    if (t) return t;
  }
  return undefined;
}

/** Model for onboarding JSON routes; falls back to general GROQ_MODEL then default. */
export function resolveGroqOnboardingModel(): string {
  return (
    firstNonWhitespaceModel(process.env.GROQ_ONBOARDING_MODEL, process.env.GROQ_MODEL) ?? DEFAULT_GROQ_MODEL
  );
}

export async function requestJsonCompletion<T>({
  apiKey,
  baseUrl = "https://api.groq.com/openai/v1",
  model = DEFAULT_GROQ_MODEL,
  messages,
  temperature = 0.2,
}: AiJsonRequest): Promise<T> {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    throw new Error(`AI provider request failed: ${response.status} ${await response.text()}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("AI provider returned an empty response");
  }

  return JSON.parse(content) as T;
}
