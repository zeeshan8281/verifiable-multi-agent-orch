# Integrating `verified-handoff` into your stack

`verified-handoff` is a small TypeScript SDK for multi-agent pipelines where **every handoff between agents is cryptographically verifiable**. Drop it into any runtime that can run Node-compatible JS, and any third party can re-verify your pipeline runs from just the final lineage — with no trust in your infrastructure.

This document walks through:

1. [Install](#install)
2. [Concepts](#concepts) — envelopes, lineage, what the signature covers
3. [Defining an agent](#defining-an-agent)
4. [Running a pipeline](#running-a-pipeline)
5. [Re-verifying a lineage](#re-verifying-a-lineage)
6. [Deploying agents to TEEs (EigenCompute)](#deploying-to-tees)
7. [Common patterns](#common-patterns)
8. [Threat model](#threat-model)
9. [API reference](#api-reference)

---

## Install

The SDK is in this repo at `lib/verified-handoff/`. Until it's published to npm, vendor it:

```bash
git clone https://github.com/zeeshan8281/verifiable-multi-agent-orch
cp -R verifiable-multi-agent-orch/lib/verified-handoff your-project/lib/
```

Runtime dependencies (add to your `package.json`):

```json
{
  "dependencies": {
    "@noble/ed25519": "^2.1.0",
    "@noble/hashes": "^1.5.0",
    "hono": "^4.6.0",
    "@hono/node-server": "^1.13.0"
  }
}
```

Works in **Node 20+** and any runtime that supports `fetch` and `crypto.subtle` (Vercel/Cloudflare/Deno included).

---

## Concepts

### Agent
A stateless function `(input) → output`. Each agent has an Ed25519 keypair generated at boot. The agent has no idea what came before it — it just receives input + the previous envelope, verifies it, runs, signs.

### StepEnvelope
The signed record each agent produces:

```ts
{
  step: number;
  agent: "researcher@1.0.0";
  pipelineId: "pl_abc123";
  timestamp: 1779869809081;
  inputHash:  "0x671c…";  // sha256(canonical(input))
  outputHash: "0x1025…";  // sha256(canonical(output))
  output:     { … },      // the actual payload, so the next agent can use it
  signature:  "0x31dc…",  // ed25519 sig over the digest
  pubkey:     "0xa922…",  // signer's pubkey
  eigenAppId?: "0x9F41…", // optional TEE attestation handle
  codeMeasurement?: "0x…",// optional pinned-code claim
}
```

### Lineage
An ordered list of envelopes + the final output. This is the whole audit log of one pipeline run — pass it to anyone, they can re-verify it.

### What the signature covers
```
hash(pipelineId || step || agent || timestamp || inputHash || outputHash)
```
`eigenAppId` and `codeMeasurement` are **not** signed. They're metadata that orchestrators decorate after the fact — so attaching the right TEE handle post-signing is safe.

### What `verifyLineage` checks
- Every step's signature validates against its declared pubkey
- `inputHash[N] === outputHash[N-1]` (chain is unbroken)
- Step indices are monotonic, `pipelineId` is consistent
- The final step's output equals the lineage's `finalOutput`

It's pure. Zero network calls. Run it in a browser, a serverless function, a CLI.

---

## Defining an agent

An agent is an HTTP server with `POST /run` and `GET /` (health + pubkey). The SDK ships a Hono helper that handles signing, prev-envelope verification, and refusal-on-mismatch:

```ts
// agents/classifier/index.ts
import "../load-env.js";   // your env loader (or use dotenv, etc.)
import { serveAgent } from "../../lib/verified-handoff/agent.js";

interface Input  { text: string }
interface Output { label: string; confidence: number }

serveAgent<Input, Output>({
  name: "classifier",
  version: "1.0.0",
  description: "Classifies a string into one of N labels.",
  handler: async ({ input }) => {
    const label = await yourClassifier(input.text);
    return { label, confidence: 0.92 };
  },
});
```

`serveAgent` listens on `process.env.PORT || 8080` and on boot will:

1. Generate an Ed25519 keypair.
2. Expose `GET /` → `{ ok: true, name, version, pubkey, description }`.
3. Expose `POST /run` → reads `{ input, prevEnvelope, pipelineId, step }`, verifies the previous envelope, refuses on mismatch, calls your handler, signs the result, returns a `StepEnvelope`.

If you need a different transport (gRPC, a Lambda handler, a queue worker), use the lower-level primitives in `crypto.ts` — they're 30 lines of code.

---

## Running a pipeline

```ts
import { runPipeline } from "@verified-handoff/orchestrator";

const result = await runPipeline({
  agents: [
    { name: "classifier", url: "https://classifier.example.com" },
    { name: "router",     url: "https://router.example.com" },
    { name: "handler",    url: "https://handler.example.com" },
  ],
  input: { text: "Help, my deployment is on fire" },
  onStep: (env) => console.log(`step ${env.step}: ${env.agent}`),
});

console.log(result.lineage.finalOutput);
// share `result.lineage` with anyone — they can re-verify it
```

The orchestrator is **not trusted**. It just shuttles envelopes from one agent to the next. Each handoff:

- The receiving agent re-hashes the input it got and checks it matches `prevEnvelope.outputHash` (so a malicious orchestrator can't quietly rewrite payloads).
- The agent verifies the prev envelope's signature against its declared pubkey.
- After running, the agent signs its own output and includes its pubkey.

If any step fails verification, the agent refuses to run (returns 4xx) and the orchestrator throws.

---

## Re-verifying a lineage

```ts
import { verifyLineage } from "@verified-handoff/verify";

const check = await verifyLineage(lineage);
if (!check.verified) throw new Error(check.reason);
// check.details[] gives a per-step breakdown
```

Run it in:

- **A browser** — see `web/app/verify/page.tsx` for a paste-and-verify page.
- **A serverless function** — verifying audit logs on demand.
- **A CLI** — to inspect lineage JSON.
- **On-chain** — Ed25519 sig verification is supported by precompiles on most modern L1s/L2s.

---

## Deploying to TEEs

You can stop here and have a fully working signed-handoff pipeline. **But** if you want provenance to extend all the way down to *"this output came from THIS code on THIS hardware"*, run each agent inside a TEE so the keypair is hardware-bound.

We use [EigenCompute](https://docs.eigencloud.xyz/products/eigencompute/eigencompute-overview) — same pattern works with any TEE provider.

### Per-agent Dockerfile

```dockerfile
FROM --platform=linux/amd64 node:22-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=optional
COPY . .
EXPOSE 8080
ENV PORT=8080
ARG AGENT
CMD ["sh", "-c", "node --import tsx agents/${AGENT}/index.ts"]
```

### Build, push, deploy

```bash
docker build --platform linux/amd64 --build-arg AGENT=classifier \
  -t docker.io/yourhandle/classifier:1.0.0 .
docker push docker.io/yourhandle/classifier:1.0.0

# Sealed-secret .env (decrypted only inside the TEE)
echo "MY_API_KEY=sk-..." > .env

ecloud compute app deploy \
  --name my-classifier \
  --image-ref docker.io/yourhandle/classifier:1.0.0 \
  --instance-type g1-standard-4t \
  --env-file .env \
  --log-visibility public \
  --resource-usage-monitoring enable \
  --force
```

This returns an `eigenAppId` (e.g. `0x9F41…`). Verifiers can look it up at `https://verify-sepolia.eigencloud.xyz/app/<id>` to see the deployed image, code measurement, and attestation status.

### Decorating envelopes with TEE handles

Agents don't know their own `eigenAppId` (chicken-and-egg — the ID is minted on deploy). The orchestrator attaches it after signing — which is safe because `eigenAppId` is not covered by the signature:

```ts
const APP_IDS: Record<string, string> = {
  classifier: "0xabc…",
  router:     "0xdef…",
};

await runPipeline({
  agents, input,
  onStep: (env) => {
    env.eigenAppId = APP_IDS[env.agent.split("@")[0]];
  },
});
```

---

## Common patterns

### Multiple LLMs in a chain
This is the canonical case — Researcher → Reasoner → Critic. Each agent calls an LLM and emits structured JSON.

### Tool-using agents
Anthropic's server-side `web_search_20250305` tool works seamlessly — the search runs inside the TEE, results feed into the model, the final structured output gets signed. The lineage now proves "this answer was derived from these searches in this TEE."

### Branching / routing
Want a router to choose between two reasoners? Run the router, inspect its output in your orchestrator, then call the chosen downstream agent. The lineage collapses into one signed path through the DAG.

### Sub-pipelines
Call `runPipeline` from inside a handler. Each sub-run produces its own lineage that you can embed as part of a parent envelope's output.

### Append-only audits
Treat the lineage as an immutable log. Store it in S3/IPFS/postgres — anyone reading it later can verify it without your involvement.

---

## Threat model

The SDK protects against:

- **A compromised orchestrator** that fabricates outputs (signatures won't validate).
- **A man-in-the-middle agent** that modifies what an upstream agent said (the prev-envelope hash-check fails, the next agent refuses).
- **Future-you auditing weeks later** — `verifyLineage(stored)` works offline.

It does **not** protect against:

- **The LLM being wrong.** Verification is about provenance, not factual accuracy. (That's what the Critic role is for.)
- **An agent's container being subverted at the code level.** If you need that, pin a `codeMeasurement` in each envelope and check it against the TEE's attestation.
- **Replay across pipelines.** If you need replay resistance, include a nonce in the initial input.

---

## API reference

Types and exports live in `lib/verified-handoff/`. The public surface:

```ts
// types.ts
type Hex = `0x${string}`
interface StepEnvelope { … }
interface Lineage { … }
interface VerifyResult { … }

// crypto.ts
canonicalize(value: unknown): string
hashJSON(value: unknown): Hex
generateKeypair(): { publicKey: Hex; privateKey: Hex }
signEnvelope(env, privateKey): Promise<Hex>
verifyEnvelope(env): Promise<boolean>

// agent.ts
serveAgent<I, O>(def: AgentDefinition<I, O>): void
createAgentApp<I, O>(def: AgentDefinition<I, O>): { app: Hono; identity }

// orchestrator.ts
runPipeline(opts: RunPipelineOptions): Promise<{ finalOutput; lineage }>

// verify.ts
verifyLineage(lineage: Lineage): Promise<VerifyResult>
```

---

## Live reference

A working three-agent pipeline (Researcher with web search → Reasoner → Critic) is deployed at:

| Component | URL |
|-----------|-----|
| Demo UI | https://verifiable-multi-agent-orch.vercel.app |
| Researcher TEE | https://verify-sepolia.eigencloud.xyz/app/0x9F41C61e8e2E564266bcbe9738d86bA88F786eF7 |
| Reasoner TEE   | https://verify-sepolia.eigencloud.xyz/app/0x2226eA247a52F2084564345862E854E173Bb7E0B |
| Critic TEE     | https://verify-sepolia.eigencloud.xyz/app/0x0462f630F167fa6Fb898E9c5Dd34d0045Aadc87F |
| Source         | https://github.com/zeeshan8281/verifiable-multi-agent-orch |

Run a question on the demo, hit "Copy lineage JSON," paste into the `/verify` page in another tab — that's the whole trust model in one click.
