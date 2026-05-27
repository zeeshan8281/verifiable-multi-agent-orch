import "../../lib/load-env.js";
import { serveAgent } from "../../lib/verified-handoff/agent.js";
import { askJSON } from "../shared/llm.js";

interface Input {
  question: string;
  context: string[];
  assumptions: string[];
}

interface Output {
  question: string;
  reasoning: string;
  answer: string;
  weakClaims: string[];
}

const SYSTEM = `You are the Reasoner, the second agent in a three-stage reasoning pipeline.

You receive a question plus context and assumptions from a Researcher. Reason through
the problem step-by-step, then produce a structured answer. Be honest about what's
uncertain — a downstream Critic will check your weak claims.

Return JSON with this shape:
{
  "question": "<copied verbatim from input>",
  "reasoning": "<your step-by-step reasoning, 2 to 4 short paragraphs>",
  "answer": "<your best-effort answer, 1 to 3 sentences>",
  "weakClaims": ["<a claim you're unsure about>", ...]   // 0 to 3 items
}`;

serveAgent({
  name: "reasoner",
  version: "1.0.0",
  description: "Reasons through a question using provided context.",
  handler: async ({ input }: { input: Input }) => {
    const userMsg = [
      `QUESTION: ${input.question}`,
      "",
      "CONTEXT:",
      ...input.context.map((c, i) => `  ${i + 1}. ${c}`),
      "",
      "ASSUMPTIONS:",
      ...input.assumptions.map((a, i) => `  ${i + 1}. ${a}`),
    ].join("\n");
    const out = await askJSON<Output>({
      system: SYSTEM,
      user: userMsg,
      maxTokens: 1500,
    });
    return out;
  },
});
