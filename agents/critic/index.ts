import "../../lib/load-env.js";
import { serveAgent } from "../../lib/verified-handoff/agent.js";
import { askJSON } from "../shared/llm.js";

interface Input {
  question: string;
  reasoning: string;
  answer: string;
  weakClaims: string[];
}

interface Output {
  question: string;
  final_answer: string;
  confidence: number;        // 0..1
  caveats: string[];
  changed_from_reasoner: boolean;
}

const SYSTEM = `You are the Critic, the final agent in a three-stage reasoning pipeline.

You receive the Reasoner's answer, reasoning, and the claims they flagged as weak.
Your job: pressure-test the answer. If you find issues, revise it. If you don't,
endorse it. Either way, give the user a calibrated final answer.

Return JSON with this shape:
{
  "question": "<copied verbatim from input>",
  "final_answer": "<your refined final answer, 2 to 4 sentences>",
  "confidence": <number between 0 and 1>,
  "caveats": ["<an important caveat the user should know>", ...],   // 0 to 3 items
  "changed_from_reasoner": <true if you materially changed the answer>
}

Be honest about confidence. If the question is genuinely hard or under-specified,
return a confidence below 0.6 and say why in caveats.`;

serveAgent({
  name: "critic",
  version: "1.0.0",
  description: "Critiques and finalizes the reasoner's answer.",
  handler: async ({ input }: { input: Input }) => {
    const userMsg = [
      `QUESTION: ${input.question}`,
      "",
      "REASONER'S REASONING:",
      input.reasoning,
      "",
      `REASONER'S ANSWER: ${input.answer}`,
      "",
      "REASONER'S WEAK CLAIMS:",
      ...input.weakClaims.map((c, i) => `  ${i + 1}. ${c}`),
    ].join("\n");
    const out = await askJSON<Output>({
      system: SYSTEM,
      user: userMsg,
      maxTokens: 1500,
    });
    return out;
  },
});
