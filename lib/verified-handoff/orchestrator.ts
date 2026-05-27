import { hashJSON, verifyEnvelope } from "./crypto.js";
import type { Lineage, StepEnvelope } from "./types.js";

export interface AgentEndpoint {
  name: string;
  url: string;
}

export interface RunPipelineOptions {
  agents: AgentEndpoint[];
  input: unknown;
  pipelineId?: string;
  onStep?: (env: StepEnvelope) => void;
  fetchImpl?: typeof fetch;
}

export interface RunPipelineResult {
  finalOutput: unknown;
  lineage: Lineage;
}

export async function runPipeline(
  opts: RunPipelineOptions,
): Promise<RunPipelineResult> {
  const fetchFn = opts.fetchImpl ?? fetch;
  const pipelineId = opts.pipelineId ?? randomId();
  const steps: StepEnvelope[] = [];

  let currentInput: unknown = opts.input;
  let prev: StepEnvelope | null = null;

  for (let i = 0; i < opts.agents.length; i++) {
    const agent = opts.agents[i];
    const res = await fetchFn(`${agent.url.replace(/\/$/, "")}/run`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        input: currentInput,
        prevEnvelope: prev,
        pipelineId,
        step: i,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `agent ${agent.name} failed at step ${i}: ${res.status} ${text}`,
      );
    }
    const env = (await res.json()) as StepEnvelope;

    // Orchestrator-side verification: signature must check out, and the
    // envelope's claimed inputHash must match what we actually sent.
    const sigOk = await verifyEnvelope(env);
    if (!sigOk) {
      throw new Error(
        `agent ${agent.name} returned envelope with invalid signature at step ${i}`,
      );
    }
    const expectedInputHash = hashJSON(currentInput);
    if (env.inputHash !== expectedInputHash) {
      throw new Error(
        `agent ${agent.name} envelope inputHash mismatch at step ${i}: expected ${expectedInputHash}, got ${env.inputHash}`,
      );
    }

    steps.push(env);
    opts.onStep?.(env);

    currentInput = env.output;
    prev = env;
  }

  return {
    finalOutput: currentInput,
    lineage: {
      pipelineId,
      question: typeof opts.input === "string" ? opts.input : JSON.stringify(opts.input),
      finalOutput: currentInput,
      steps,
      createdAt: Date.now(),
    },
  };
}

function randomId(): string {
  return `pl_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}
