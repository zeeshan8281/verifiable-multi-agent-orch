import { NextRequest } from "next/server";
import { runPipeline } from "@verified-handoff/orchestrator";
import type { StepEnvelope } from "@verified-handoff/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ENDPOINTS = [
  {
    name: "researcher",
    url: process.env.RESEARCHER_URL ?? "http://localhost:4001",
    eigenAppId: process.env.RESEARCHER_APP_ID,
  },
  {
    name: "reasoner",
    url: process.env.REASONER_URL ?? "http://localhost:4002",
    eigenAppId: process.env.REASONER_APP_ID,
  },
  {
    name: "critic",
    url: process.env.CRITIC_URL ?? "http://localhost:4003",
    eigenAppId: process.env.CRITIC_APP_ID,
  },
];

const APP_ID_BY_NAME = new Map(
  ENDPOINTS.map((e) => [e.name, e.eigenAppId] as const),
);

function decorate(env: StepEnvelope): StepEnvelope {
  const role = env.agent.split("@")[0];
  const id = APP_ID_BY_NAME.get(role);
  return id ? { ...env, eigenAppId: id } : env;
}

export async function POST(req: NextRequest) {
  const { question } = (await req.json()) as { question?: string };
  if (!question || typeof question !== "string" || question.trim().length === 0) {
    return new Response(JSON.stringify({ error: "question required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const write = (obj: unknown) =>
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));

      try {
        write({ type: "start", agents: ENDPOINTS.map((e) => e.name) });

        const result = await runPipeline({
          agents: ENDPOINTS.map((e) => ({ name: e.name, url: e.url })),
          input: { question },
          onStep: (env: StepEnvelope) => {
            write({ type: "step", env: decorate(env) });
          },
        });

        const decoratedLineage = {
          ...result.lineage,
          steps: result.lineage.steps.map(decorate),
        };
        write({ type: "done", lineage: decoratedLineage });
      } catch (e) {
        write({
          type: "error",
          error: e instanceof Error ? e.message : String(e),
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson",
      "cache-control": "no-cache, no-transform",
    },
  });
}
