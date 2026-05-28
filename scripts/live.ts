/**
 * Live end-to-end demo — runs the real pipeline with real LLM calls.
 *
 * Spawns the three agent servers, waits for them to be ready, runs one
 * pipeline against the user's question, prints the lineage, verifies it,
 * and exits.
 *
 * Usage:
 *   DARKBLOOM_API_KEY=eigeninference-... npm run demo
 *   DARKBLOOM_API_KEY=eigeninference-... npm run demo -- "Your question here"
 */
import "../lib/load-env.js";
import { spawn, type ChildProcess } from "node:child_process";
import { runPipeline } from "../lib/verified-handoff/orchestrator.js";
import { verifyLineage } from "../lib/verified-handoff/verify.js";

const AGENTS = [
  { name: "researcher", port: 4001 },
  { name: "reasoner", port: 4002 },
  { name: "critic", port: 4003 },
] as const;

const QUESTION =
  process.argv.slice(2).join(" ").trim() ||
  "Should I worry about quantum computers breaking Bitcoin in the next 10 years?";

if (!process.env.DARKBLOOM_API_KEY) {
  console.error("✗ DARKBLOOM_API_KEY is not set. Add it to .env and re-run.");
  process.exit(1);
}

async function waitFor(url: string, timeoutMs = 15_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`timeout waiting for ${url}`);
}

async function main() {
  const procs: ChildProcess[] = [];
  const cleanup = () => {
    for (const p of procs) {
      if (!p.killed) p.kill("SIGTERM");
    }
  };
  process.on("SIGINT", () => {
    cleanup();
    process.exit(130);
  });
  process.on("exit", cleanup);

  try {
    console.log("\n=== verified-handoff live demo ===\n");
    console.log(`question: ${QUESTION}\n`);

    console.log("[1] booting agents…");
    for (const a of AGENTS) {
      const child = spawn(
        "npx",
        ["tsx", `agents/${a.name}/index.ts`],
        {
          env: { ...process.env, PORT: String(a.port) },
          stdio: ["ignore", "pipe", "pipe"],
        },
      );
      child.stdout?.on("data", (b) =>
        process.stdout.write(`  ${a.name.padEnd(11)} | ${b}`),
      );
      child.stderr?.on("data", (b) =>
        process.stderr.write(`  ${a.name.padEnd(11)} | ${b}`),
      );
      procs.push(child);
    }
    await Promise.all(
      AGENTS.map((a) => waitFor(`http://localhost:${a.port}/`)),
    );
    console.log("    ✓ all agents up\n");

    console.log("[2] running pipeline…");
    const { lineage } = await runPipeline({
      agents: AGENTS.map((a) => ({
        name: a.name,
        url: `http://localhost:${a.port}`,
      })),
      input: { question: QUESTION },
      onStep: (env) =>
        console.log(
          `    step ${env.step + 1} · ${env.agent.padEnd(20)} sig ${env.signature.slice(0, 14)}… (verified)`,
        ),
    });

    const final = lineage.steps[lineage.steps.length - 1].output as {
      final_answer: string;
      confidence: number;
      caveats?: string[];
    };
    console.log("\n[3] final answer:");
    console.log(`    ${final.final_answer}`);
    console.log(`    confidence: ${final.confidence}`);
    if (final.caveats?.length) {
      console.log("    caveats:");
      for (const c of final.caveats) console.log(`      - ${c}`);
    }

    console.log("\n[4] re-verifying lineage…");
    const v = await verifyLineage(lineage);
    if (!v.verified) {
      console.error(`    ✗ verification FAILED: ${v.reason}`);
      process.exit(1);
    }
    console.log(`    ✓ verified — ${v.details.length} steps, signatures + linkages OK`);

    console.log("\nALL CHECKS PASS ✓\n");
  } catch (e) {
    console.error("\n✗ demo failed:", e);
    process.exitCode = 1;
  } finally {
    cleanup();
    setTimeout(() => process.exit(process.exitCode ?? 0), 200);
  }
}

main();
