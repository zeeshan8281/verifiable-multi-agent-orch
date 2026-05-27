import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001";

export interface AskOptions {
  system: string;
  user: string;
  maxTokens?: number;
  webSearch?: { maxUses?: number };
}

export async function askJSON<T>(opts: AskOptions): Promise<T> {
  const tools = opts.webSearch
    ? [
        {
          type: "web_search_20250305" as const,
          name: "web_search",
          max_uses: opts.webSearch.maxUses ?? 3,
        },
      ]
    : undefined;

  const call = async (): Promise<T> => {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: opts.maxTokens ?? 1024,
      ...(tools ? { tools } : {}),
      system:
        opts.system +
        "\n\nYour final message MUST be a JSON object only — no prose before or after, no markdown fences. The JSON must start with { and end with }. Any explanation goes inside the JSON fields.",
      messages: [{ role: "user", content: opts.user }],
    });
    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    return parseJSONLoose<T>(text);
  };

  try {
    return await call();
  } catch (e) {
    console.error("askJSON: first attempt failed:", e);
    return await call();
  }
}

function parseJSONLoose<T>(text: string): T {
  const stripped = text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
  try {
    return JSON.parse(stripped) as T;
  } catch {}
  const first = stripped.indexOf("{");
  const last = stripped.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    const slice = stripped.slice(first, last + 1);
    return JSON.parse(slice) as T;
  }
  throw new Error(
    `askJSON: response did not contain a JSON object. raw text: ${text.slice(0, 200)}`,
  );
}
