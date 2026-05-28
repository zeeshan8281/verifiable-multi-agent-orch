/**
 * CLI demo — runs the full pipeline and pretty-prints every attestation.
 *
 * Shows for each step:
 *   • the agent's output payload
 *   • our Ed25519 step signature (TEE-bound)
 *   • darkbloom's per-call Secure Enclave signature + response hash (inference-bound)
 *
 * Then re-verifies the lineage, then tampers with it and shows the re-verify failing.
 *
 * Usage:
 *   npm run demo:cli
 *   npm run demo:cli -- "Your question"
 */
import "../lib/load-env.js";
import { spawn, type ChildProcess } from "node:child_process";
import { runPipeline } from "../lib/verified-handoff/orchestrator.js";
import { verifyLineage } from "../lib/verified-handoff/verify.js";

const AGENTS = [
  { name: "researcher", port: 4001, color: "\x1b[34m" },
  { name: "reasoner", port: 4002, color: "\x1b[35m" },
  { name: "critic", port: 4003, color: "\x1b[36m" },
] as const;

const QUESTION =
  process.argv.slice(2).join(" ").trim() ||
  "Should I worry about quantum computers breaking Bitcoin in the next 10 years?";

const C = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
};

if (!process.env.DARKBLOOM_API_KEY) {
  console.error(`${C.red}✗ DARKBLOOM_API_KEY is not set. Add it to .env and re-run.${C.reset}`);
  process.exit(1);
}

function short(s: string, head = 12, tail = 8): string {
  if (!s) return "";
  if (s.length <= head + tail + 3) return s;
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}

function rule(char = "─", width = 78): string {
  return char.repeat(width);
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

interface InferenceAttestation {
  responseHash: string;
  seSignature: string;
  model: string;
  provider: string;
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
    console.log(`\n${C.bold}${C.cyan}╔${rule("═")}╗${C.reset}`);
    console.log(`${C.bold}${C.cyan}║  verified-handoff · darkbloom edition${" ".repeat(40)}║${C.reset}`);
    console.log(`${C.bold}${C.cyan}╚${rule("═")}╝${C.reset}\n`);
    console.log(`${C.dim}question:${C.reset} ${QUESTION}\n`);

    console.log(`${C.dim}[1] booting agents…${C.reset}`);
    for (const a of AGENTS) {
      const child = spawn("npx", ["tsx", `agents/${a.name}/index.ts`], {
        env: { ...process.env, PORT: String(a.port) },
        stdio: ["ignore", "pipe", "pipe"],
      });
      child.stderr?.on("data", (b) => {
        const s = b.toString().trim();
        if (s && !s.includes("ExperimentalWarning")) {
          process.stderr.write(`${C.dim}  ${a.name} | ${s}${C.reset}\n`);
        }
      });
      procs.push(child);
    }
    await Promise.all(AGENTS.map((a) => waitFor(`http://localhost:${a.port}/`)));
    console.log(`${C.green}    ✓ all 3 agents up${C.reset}\n`);

    console.log(`${C.dim}[2] running pipeline…${C.reset}\n`);
    const t0 = Date.now();

    const { lineage } = await runPipeline({
      agents: AGENTS.map((a) => ({ name: a.name, url: `http://localhost:${a.port}` })),
      input: { question: QUESTION },
      onStep: (env) => {
        const cfg = AGENTS.find((a) => env.agent.startsWith(a.name));
        const col = cfg?.color ?? C.cyan;
        const out = env.output as {
          inference?: InferenceAttestation[];
          [k: string]: unknown;
        };
        const att = out.inference?.[0];

        console.log(`${col}${C.bold}┌─ step ${env.step + 1} · ${env.agent}${C.reset}`);
        console.log(`${col}│${C.reset}`);

        // payload preview
        const previewKeys = Object.keys(out).filter((k) => k !== "inference");
        for (const k of previewKeys) {
          const v = out[k];
          if (Array.isArray(v)) {
            console.log(`${col}│${C.reset}  ${C.bold}${k}${C.reset}:`);
            for (const item of v.slice(0, 4)) {
              const line = typeof item === "string" ? item : JSON.stringify(item);
              console.log(`${col}│${C.reset}    • ${line.slice(0, 140)}`);
            }
            if (v.length > 4)
              console.log(`${col}│${C.reset}    ${C.dim}…${v.length - 4} more${C.reset}`);
          } else if (typeof v === "string") {
            const line = v.length > 200 ? v.slice(0, 200) + "…" : v;
            console.log(`${col}│${C.reset}  ${C.bold}${k}${C.reset}: ${line}`);
          } else {
            console.log(`${col}│${C.reset}  ${C.bold}${k}${C.reset}: ${JSON.stringify(v)}`);
          }
        }

        console.log(`${col}│${C.reset}`);
        console.log(`${col}│${C.reset}  ${C.dim}── attestations ──${C.reset}`);
        console.log(
          `${col}│${C.reset}  ${C.green}✓${C.reset} step sig (Ed25519, TEE-bound): ${C.dim}${short(env.signature, 14, 10)}${C.reset}`,
        );
        console.log(
          `${col}│${C.reset}    pubkey:                       ${C.dim}${short(env.pubkey, 14, 10)}${C.reset}`,
        );
        console.log(
          `${col}│${C.reset}    input → output hash:          ${C.dim}${short(env.inputHash, 10, 6)} → ${short(env.outputHash, 10, 6)}${C.reset}`,
        );
        if (att) {
          console.log(
            `${col}│${C.reset}  ${C.green}✓${C.reset} inference sig (Apple SE, ${att.provider}/${att.model}):`,
          );
          console.log(
            `${col}│${C.reset}    se signature:                 ${C.dim}${short(att.seSignature, 14, 10)}${C.reset}`,
          );
          console.log(
            `${col}│${C.reset}    response hash:                ${C.dim}${short(att.responseHash, 14, 10)}${C.reset}`,
          );
        } else {
          console.log(
            `${col}│${C.reset}  ${C.yellow}!${C.reset} no inference attestation captured`,
          );
        }
        console.log(`${col}└${rule("─", 77)}${C.reset}\n`);
      },
    });

    const dt = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`${C.dim}pipeline completed in ${dt}s${C.reset}\n`);

    const final = lineage.steps[lineage.steps.length - 1].output as {
      final_answer: string;
      confidence: number;
      caveats?: string[];
    };
    console.log(`${C.bold}${C.green}[3] final answer${C.reset}`);
    console.log(`${rule("─")}`);
    console.log(final.final_answer);
    console.log(`${C.dim}confidence: ${final.confidence.toFixed(2)}${C.reset}`);
    if (final.caveats?.length) {
      console.log(`${C.dim}caveats:${C.reset}`);
      for (const c of final.caveats) console.log(`  ${C.dim}-${C.reset} ${c}`);
    }
    console.log(`${rule("─")}\n`);

    console.log(`${C.dim}[4] re-verifying lineage locally…${C.reset}`);
    const v = await verifyLineage(lineage);
    if (!v.verified) {
      console.error(`${C.red}    ✗ verification FAILED: ${v.reason}${C.reset}`);
      process.exit(1);
    }
    console.log(
      `${C.green}    ✓ verified — ${v.details.length} steps, signatures + hash linkages OK${C.reset}\n`,
    );

    console.log(`${C.dim}[5] tamper demo — mutating step 2's output and re-verifying…${C.reset}`);
    const tampered = {
      ...lineage,
      steps: lineage.steps.map((s, i) =>
        i === 1
          ? { ...s, output: { ...(s.output as object), answer: "TAMPERED" } }
          : s,
      ),
    };
    const v2 = await verifyLineage(tampered);
    if (v2.verified) {
      console.error(`${C.red}    ✗ tamper went undetected — verifier is broken!${C.reset}`);
      process.exit(1);
    }
    console.log(`${C.green}    ✓ tamper caught — ${C.reset}${v2.reason}\n`);

    console.log(`${C.bold}${C.green}ALL CHECKS PASS ✓${C.reset}\n`);
    console.log(`${C.dim}what just happened:${C.reset}`);
    console.log(`${C.dim}  • 3 agents each ran in a TEE, signed their step with Ed25519${C.reset}`);
    console.log(`${C.dim}  • inference itself was attested by darkbloom's Apple Secure Enclave${C.reset}`);
    console.log(`${C.dim}  • the lineage is portable: anyone (you, your auditor) can re-verify offline${C.reset}\n`);
  } catch (e) {
    console.error(`${C.red}\n✗ demo failed:${C.reset}`, e);
    process.exitCode = 1;
  } finally {
    cleanup();
    setTimeout(() => process.exit(process.exitCode ?? 0), 200);
  }
}

main();
