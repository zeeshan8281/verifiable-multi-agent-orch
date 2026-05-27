/**
 * Local smoke test — exercises the SDK end-to-end with no LLM.
 *
 * Wires three in-process agents (mock handlers) through the orchestrator
 * via a fake fetchImpl. Verifies the resulting lineage. Then mutates a
 * signature and asserts verification fails.
 */
import { createAgentApp } from "../lib/verified-handoff/agent.js";
import { runPipeline } from "../lib/verified-handoff/orchestrator.js";
import { verifyLineage } from "../lib/verified-handoff/verify.js";

const RESEARCHER_URL = "http://researcher.local";
const REASONER_URL = "http://reasoner.local";
const CRITIC_URL = "http://critic.local";

const researcher = createAgentApp({
  name: "researcher",
  version: "1.0.0-test",
  handler: async ({ input }) => ({
    question: (input as { question: string }).question,
    context: ["Bitcoin uses ECDSA on secp256k1.", "Grover halves symmetric security; Shor breaks ECDSA."],
    assumptions: ["the user wants a 10-year horizon"],
  }),
});

const reasoner = createAgentApp({
  name: "reasoner",
  version: "1.0.0-test",
  handler: async ({ input }) => {
    const i = input as { question: string };
    return {
      question: i.question,
      reasoning: "ECDSA is vulnerable to Shor; timelines for cryptanalytically relevant quantum computers are 10-30 years per most experts.",
      answer: "Some risk but not imminent.",
      weakClaims: ["10-year horizon estimate"],
    };
  },
});

const critic = createAgentApp({
  name: "critic",
  version: "1.0.0-test",
  handler: async ({ input }) => {
    const i = input as { question: string };
    return {
      question: i.question,
      final_answer: "Moderate but not imminent risk; reused-key UTXOs are most exposed.",
      confidence: 0.65,
      caveats: ["Estimates of CRQC arrival vary widely."],
      changed_from_reasoner: true,
    };
  },
});

const apps = new Map<string, typeof researcher.app>([
  [RESEARCHER_URL, researcher.app],
  [REASONER_URL, reasoner.app],
  [CRITIC_URL, critic.app],
]);

const fetchImpl: typeof fetch = async (input, init) => {
  const urlStr = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  for (const [base, app] of apps) {
    if (urlStr.startsWith(base)) {
      const path = urlStr.slice(base.length);
      const req = new Request(`http://localhost${path}`, init);
      return await app.fetch(req);
    }
  }
  throw new Error(`no mock fetch handler for ${urlStr}`);
};

async function main() {
  console.log("=== smoke test: verified-handoff ===\n");

  console.log("[1] running 3-agent pipeline (mock handlers)…");
  const { finalOutput, lineage } = await runPipeline({
    agents: [
      { name: "researcher", url: RESEARCHER_URL },
      { name: "reasoner", url: REASONER_URL },
      { name: "critic", url: CRITIC_URL },
    ],
    input: { question: "Should I worry about quantum computers breaking Bitcoin in 10 years?" },
    fetchImpl,
    onStep: (env) => console.log(`    step ${env.step + 1} · ${env.agent} · sig ${env.signature.slice(0, 14)}…`),
  });

  console.log(`\n[2] final output:\n    ${JSON.stringify(finalOutput).slice(0, 140)}…\n`);

  console.log("[3] verifying lineage…");
  const ok = await verifyLineage(lineage);
  if (!ok.verified) throw new Error(`expected verified=true, got reason: ${ok.reason}`);
  console.log(`    ✓ verified (${ok.details.length} steps, all signatures + linkages OK)\n`);

  console.log("[4] tamper test: flipping step-2 signature byte…");
  const tampered = {
    ...lineage,
    steps: lineage.steps.map((s, i) =>
      i === 1
        ? {
            ...s,
            signature: (s.signature.slice(0, -2) + (s.signature.slice(-2) === "00" ? "01" : "00")) as `0x${string}`,
          }
        : s,
    ),
  };
  const tamperResult = await verifyLineage(tampered);
  if (tamperResult.verified) throw new Error("tampered lineage incorrectly verified as true");
  console.log(`    ✓ rejected — reason: ${tamperResult.reason}\n`);

  console.log("[5] linkage test: swapping step-2 output hash…");
  const broken = {
    ...lineage,
    steps: lineage.steps.map((s, i) =>
      i === 1 ? { ...s, outputHash: ("0x" + "ff".repeat(32)) as `0x${string}` } : s,
    ),
  };
  const brokenResult = await verifyLineage(broken);
  if (brokenResult.verified) throw new Error("broken-linkage lineage incorrectly verified as true");
  console.log(`    ✓ rejected — reason: ${brokenResult.reason}\n`);

  console.log("ALL CHECKS PASS ✓");
}

main().catch((e) => {
  console.error("\n✗ smoke test FAILED:", e);
  process.exit(1);
});
