import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import {
  generateKeypair,
  hashJSON,
  signEnvelope,
  verifyEnvelope,
  type Keypair,
} from "./crypto.js";
import type {
  AgentDefinition,
  StepEnvelope,
} from "./types.js";

/**
 * Wraps an agent definition into a Hono server.
 *
 * Endpoints:
 *   GET  /         — health + identity (pubkey, name, version, eigen app id)
 *   POST /run      — { input, prevEnvelope?, pipelineId, step } → StepEnvelope
 *
 * Identity is bound to a freshly generated Ed25519 keypair on boot. The
 * private key NEVER leaves the process (and inside a TEE, that means
 * never leaves the enclave). The pubkey is exposed; signatures on
 * outputs are checked against it by the orchestrator.
 *
 * Trust chain: the orchestrator verifies the signature is from `pubkey`,
 * and the Eigen attestation page (verify-sepolia.eigencloud.xyz/app/{id})
 * proves the running container is the code we deployed — which is the
 * only code that ever held the private key.
 */
export interface ServeAgentOptions {
  port?: number;
  eigenAppId?: string;
}

export function createAgentApp<I, O>(def: AgentDefinition<I, O>) {
  const identity: Keypair = generateKeypair();
  const eigenAppId = process.env.EIGEN_APP_ID;
  const codeMeasurement = (process.env.CODE_MEASUREMENT as `0x${string}`) || undefined;

  const app = new Hono();
  app.use("*", cors());

  app.get("/", (c) =>
    c.json({
      ok: true,
      name: def.name,
      version: def.version,
      description: def.description,
      pubkey: identity.publicKey,
      eigenAppId,
      codeMeasurement,
    }),
  );

  app.post("/run", async (c) => {
    const body = await c.req.json<{
      input: I;
      prevEnvelope?: StepEnvelope | null;
      pipelineId: string;
      step: number;
    }>();

    // If there's a prior step, refuse to run unless its signature is valid
    // AND the input we just received matches the prior step's claimed output.
    if (body.prevEnvelope) {
      const sigOk = await verifyEnvelope(body.prevEnvelope);
      if (!sigOk) {
        return c.json(
          { error: "prev_signature_invalid", step: body.step },
          400,
        );
      }
      const claimedInputHash = hashJSON(body.input);
      if (claimedInputHash !== body.prevEnvelope.outputHash) {
        return c.json(
          {
            error: "input_does_not_match_prev_output",
            expected: body.prevEnvelope.outputHash,
            actual: claimedInputHash,
          },
          400,
        );
      }
    }

    const output = await def.handler({
      input: body.input,
      pipelineId: body.pipelineId,
      step: body.step,
    });

    const unsigned: Omit<StepEnvelope, "signature" | "pubkey"> = {
      step: body.step,
      agent: `${def.name}@${def.version}`,
      pipelineId: body.pipelineId,
      timestamp: Date.now(),
      inputHash: hashJSON(body.input),
      outputHash: hashJSON(output),
      output,
      eigenAppId,
      codeMeasurement,
    };
    const signature = await signEnvelope(unsigned, identity.privateKey);

    const envelope: StepEnvelope = {
      ...unsigned,
      signature,
      pubkey: identity.publicKey,
    };

    return c.json(envelope);
  });

  return { app, identity };
}

export function serveAgent<I, O>(
  def: AgentDefinition<I, O>,
  opts: ServeAgentOptions = {},
) {
  const port = opts.port ?? Number(process.env.PORT ?? 4000);
  const { app, identity } = createAgentApp(def);
  serve({ fetch: app.fetch, port, hostname: "0.0.0.0" });
  const tag = `[${def.name}@${def.version}]`;
  console.log(`${tag} listening on 0.0.0.0:${port}`);
  console.log(`${tag} pubkey ${identity.publicKey}`);
  const hasKey = Boolean(process.env.DARKBLOOM_API_KEY);
  console.log(
    `${tag} DARKBLOOM_API_KEY: ${hasKey ? "configured" : "missing — LLM calls will fail"}`,
  );
  const hasSearch = Boolean(process.env.TAVILY_API_KEY);
  console.log(
    `${tag} TAVILY_API_KEY: ${hasSearch ? "configured" : "missing — web_search will error"}`,
  );
  if (process.env.EIGEN_APP_ID) {
    console.log(`${tag} eigenAppId ${process.env.EIGEN_APP_ID}`);
  }
}
