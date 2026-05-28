import "../../lib/load-env.js";
import { serveAgent } from "../../lib/verified-handoff/agent.js";
import { askJSON } from "../shared/llm.js";

interface Input {
  question: string;
}

interface Output {
  question: string;
  context: string[];
  assumptions: string[];
  inference?: import("../shared/llm.js").InferenceAttestation[];
}

const SYSTEM = `You are the Researcher, the first agent in a three-stage reasoning pipeline.

If web_search is available (you will be told), call it for anything time-sensitive:
- current events, news, recent product launches, prices, releases
- evolving science / medicine / regulation
- specific numbers (stats, dates, rankings, market caps, populations)
- anything where a fact might have changed in the last 2 years

If no search is available, answer from your own knowledge — do not hedge, do not refuse.
Your job: surface the relevant background a downstream reasoner needs to answer well.
You do NOT answer the question yourself.

Return JSON with this shape:
{
  "question": "<the original question, copied verbatim>",
  "context":     ["<fact or background point, with source URL if from search>", ...]   // 3 to 6 items
  "assumptions": ["<assumption you think the question makes>", ...]  // 1 to 3 items
}

Be concise. One sentence per item. Prefer facts that would actually change the answer.`;

serveAgent({
  name: "researcher",
  version: "1.1.0",
  description: "Surfaces relevant context and assumptions for a question. Uses web search.",
  handler: async ({ input }: { input: Input }) => {
    const { data, attestations } = await askJSON<Output>({
      system: SYSTEM,
      user: input.question,
      maxTokens: 2048,
      webSearch: { maxUses: 3 },
    });
    return { ...data, inference: attestations };
  },
});
