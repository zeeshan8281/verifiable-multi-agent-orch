import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001";

/**
 * Ask Claude for a JSON response matching a described shape.
 * Returns parsed object. Retries once on JSON parse failure.
 */
export async function askJSON<T>(opts: {
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<T> {
  const call = async (): Promise<T> => {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: opts.maxTokens ?? 1024,
      system:
        opts.system +
        "\n\nRespond with valid JSON only. No prose before or after. No markdown fences.",
      messages: [{ role: "user", content: opts.user }],
    });
    const text =
      res.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("")
        .trim();
    const cleaned = text.replace(/^```(?:json)?\s*|\s*```$/g, "");
    return JSON.parse(cleaned) as T;
  };

  try {
    return await call();
  } catch (e) {
    return await call();
  }
}
