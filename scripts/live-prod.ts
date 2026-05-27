/**
 * Runs the pipeline against the deployed EigenCompute agents (no local spawn).
 *
 * Reads agent URLs and app IDs from web/.env.local (the same config the UI uses).
 *
 * Usage:
 *   npx tsx scripts/live-prod.ts ["Your question here"]
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { runPipeline } from "../lib/verified-handoff/orchestrator.js";
import { verifyLineage } from "../lib/verified-handoff/verify.js";
import type { StepEnvelope } from "../lib/verified-handoff/types.js";

const here = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(here, "../web/.env.local");
const env = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);

const AGENTS = [
  { name: "researcher", url: env.RESEARCHER_URL, eigenAppId: env.RESEARCHER_APP_ID },
  { name: "reasoner", url: env.REASONER_URL, eigenAppId: env.REASONER_APP_ID },
  { name: "critic", url: env.CRITIC_URL, eigenAppId: env.CRITIC_APP_ID },
];

const QUESTION =
  process.argv.slice(2).join(" ").trim() ||
  "Should I worry about quantum computers breaking Bitcoin in the next 10 years?";

function decorate(env: StepEnvelope): StepEnvelope {
  const role = env.agent.split("@")[0];
  const found = AGENTS.find((a) => a.name === role);
  return found?.eigenAppId ? { ...env, eigenAppId: found.eigenAppId } : env;
}

async function main() {
  console.log("\n=== verified-handoff · production demo (EigenCompute TEEs) ===\n");
  console.log(`question: ${QUESTION}\n`);
  console.log("agents:");
  for (const a of AGENTS) {
    console.log(`  ${a.name.padEnd(11)} ${a.url}`);
    console.log(`             ↳ https://verify-sepolia.eigencloud.xyz/app/${a.eigenAppId}`);
  }
  console.log("\n[1] running pipeline against deployed TEEs…");

  const t0 = Date.now();
  const { lineage } = await runPipeline({
    agents: AGENTS.map((a) => ({ name: a.name, url: a.url })),
    input: { question: QUESTION },
    onStep: (env) =>
      console.log(
        `    step ${env.step + 1} · ${env.agent.padEnd(20)} sig ${env.signature.slice(0, 14)}… (verified, ${Date.now() - t0}ms)`,
      ),
  });

  const decoratedLineage = {
    ...lineage,
    steps: lineage.steps.map(decorate),
  };

  const final = lineage.steps[lineage.steps.length - 1].output as {
    final_answer: string;
    confidence: number;
    caveats?: string[];
  };

  console.log("\n[2] final answer:");
  console.log(`    ${final.final_answer}`);
  console.log(`    confidence: ${final.confidence}`);
  if (final.caveats?.length) {
    console.log("    caveats:");
    for (const c of final.caveats) console.log(`      - ${c}`);
  }

  console.log("\n[3] re-verifying lineage locally…");
  const v = await verifyLineage(decoratedLineage);
  if (!v.verified) {
    console.error(`    ✗ verification FAILED: ${v.reason}`);
    process.exit(1);
  }
  console.log(`    ✓ verified — ${v.details.length} steps, signatures + linkages OK`);

  console.log("\n[4] per-step TEE attestations:");
  for (const step of decoratedLineage.steps) {
    console.log(
      `    ${step.agent.padEnd(22)} https://verify-sepolia.eigencloud.xyz/app/${step.eigenAppId}`,
    );
  }

  console.log(`\nPipeline took ${Date.now() - t0}ms total. ✓\n`);
}

main().catch((e) => {
  console.error("\n✗ demo failed:", e);
  process.exit(1);
});
