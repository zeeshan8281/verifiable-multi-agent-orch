import { webSearch } from "./websearch.js";

const BASE_URL = process.env.DARKBLOOM_BASE_URL ?? "https://api.darkbloom.dev/v1";
const MODEL = process.env.DARKBLOOM_MODEL ?? "gpt-oss-20b";

export interface InferenceAttestation {
  responseHash: string;
  seSignature: string;
  model: string;
  provider: "darkbloom";
}

export interface AskOptions {
  system: string;
  user: string;
  maxTokens?: number;
  webSearch?: { maxUses?: number };
}

export interface AskResult<T> {
  data: T;
  attestations: InferenceAttestation[];
}

interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
}

interface ToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

interface ChatResponse {
  choices: Array<{
    message: {
      role: "assistant";
      content: string | null;
      reasoning?: string;
      tool_calls?: ToolCall[];
    };
    finish_reason: string;
  }>;
  se_signature?: string;
  response_hash?: string;
}

const WEB_SEARCH_TOOL = {
  type: "function" as const,
  function: {
    name: "web_search",
    description:
      "Search the web for fresh, current information. Use for anything time-sensitive or that may have changed in the last 2 years. Returns a list of titles, URLs, and snippets.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query — short and specific, like you would type into Google.",
        },
      },
      required: ["query"],
    },
  },
};

export async function askJSON<T>(opts: AskOptions): Promise<AskResult<T>> {
  const key = process.env.DARKBLOOM_API_KEY;
  if (!key) throw new Error("DARKBLOOM_API_KEY not set");

  const searchEnabled = Boolean(opts.webSearch) && Boolean(process.env.TAVILY_API_KEY);
  const maxToolUses = searchEnabled ? (opts.webSearch?.maxUses ?? 3) : 0;
  const tools = searchEnabled ? [WEB_SEARCH_TOOL] : undefined;

  const toolAvailability = searchEnabled
    ? "You have a web_search tool. Call it (with a short specific query) for fresh facts before answering."
    : "No tools are available. Answer from your own knowledge. Do NOT mention web search, do NOT plan to search — just produce the JSON.";

  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        opts.system +
        "\n\n" +
        toolAvailability +
        "\n\nYour final assistant message MUST be a JSON object only — no prose before or after, no markdown fences. The JSON must start with { and end with }. Any explanation goes inside the JSON fields. Do not put the answer in the reasoning channel; put it in the content as JSON.",
    },
    { role: "user", content: opts.user },
  ];

  const attestations: InferenceAttestation[] = [];
  let toolUses = 0;

  for (let turn = 0; turn < maxToolUses + 4; turn++) {
    const body: Record<string, unknown> = {
      model: MODEL,
      max_tokens: opts.maxTokens ?? 1024,
      messages,
    };
    if (tools && toolUses < maxToolUses) body.tools = tools;

    const res = await fetch(`${BASE_URL}/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`darkbloom ${res.status}: ${text.slice(0, 300)}`);
    }
    const data = (await res.json()) as ChatResponse;
    if (data.se_signature && data.response_hash) {
      attestations.push({
        responseHash: data.response_hash,
        seSignature: data.se_signature,
        model: MODEL,
        provider: "darkbloom",
      });
    }

    const choice = data.choices?.[0];
    if (!choice) throw new Error("darkbloom: empty choices");

    const msg = choice.message;
    const calls = msg.tool_calls ?? [];

    if (calls.length > 0 && toolUses < maxToolUses) {
      messages.push({
        role: "assistant",
        content: msg.content ?? "",
        tool_calls: calls,
      });

      for (const call of calls) {
        if (call.function.name !== "web_search") {
          messages.push({
            role: "tool",
            tool_call_id: call.id,
            content: `error: unknown tool ${call.function.name}`,
          });
          continue;
        }
        let args: { query?: string } = {};
        try {
          args = JSON.parse(call.function.arguments || "{}");
        } catch {}
        const query = (args.query ?? "").trim();
        if (!query) {
          messages.push({
            role: "tool",
            tool_call_id: call.id,
            content:
              "error: web_search called with no query. Reread the original question and pass a specific short query string.",
          });
          toolUses++;
          continue;
        }
        try {
          const hits = await webSearch(query, 5);
          const formatted = hits
            .map((h, i) => `[${i + 1}] ${h.title}\n${h.url}\n${h.snippet}`)
            .join("\n\n");
          messages.push({
            role: "tool",
            tool_call_id: call.id,
            content: formatted || "no results",
          });
        } catch (e) {
          messages.push({
            role: "tool",
            tool_call_id: call.id,
            content: `error: ${e instanceof Error ? e.message : String(e)}`,
          });
        }
        toolUses++;
      }
      continue;
    }

    const text = (msg.content ?? "").trim();
    if (!text || calls.length > 0) {
      messages.push({
        role: "assistant",
        content: text || "(no content)",
      });
      messages.push({
        role: "user",
        content:
          calls.length > 0
            ? "No tools are available. Answer from your own knowledge. Reply now with the required JSON object only — no tool calls, no prose, just the JSON."
            : "You returned an empty response. Reply now with the required JSON object only — no tool calls, no prose, just the JSON.",
      });
      continue;
    }
    return { data: parseJSONLoose<T>(text), attestations };
  }

  throw new Error("askJSON: exceeded tool loop without final assistant message");
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
