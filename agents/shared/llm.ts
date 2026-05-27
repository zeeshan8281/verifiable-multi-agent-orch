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
        "\n\nRespond with valid JSON only. No prose before or after. No markdown fences.",
      messages: [{ role: "user", content: opts.user }],
    });
    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    const cleaned = text.replace(/^```(?:json)?\s*|\s*```$/g, "");
    return JSON.parse(cleaned) as T;
  };

  try {
    return await call();
  } catch {
    return await call();
  }
}
