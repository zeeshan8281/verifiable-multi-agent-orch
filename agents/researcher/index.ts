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
}

const SYSTEM = `You are the Researcher, the first agent in a three-stage reasoning pipeline.

Your job: take the user's question and surface the relevant background a downstream
reasoner would need to answer it well. You do NOT answer the question yourself.

Return JSON with this shape:
{
  "question": "<the original question, copied verbatim>",
  "context":     ["<fact or background point>", ...]   // 3 to 6 items
  "assumptions": ["<assumption you think the question makes>", ...]  // 1 to 3 items
}

Be concise. One sentence per item. Surface facts that would actually change the answer.`;

serveAgent({
  name: "researcher",
  version: "1.0.0",
  description: "Surfaces relevant context and assumptions for a question.",
  handler: async ({ input }: { input: Input }) => {
    const out = await askJSON<Output>({
      system: SYSTEM,
      user: input.question,
    });
    return out;
  },
});
