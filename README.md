# verified-handoff

> Multi-agent orchestration where every handoff is cryptographically verifiable.
> Built on EigenCompute TEEs.

Three agents — **Researcher → Reasoner → Critic** — collaborate to answer any question.
Each agent runs in a Trusted Execution Environment, signs its output with a TEE-bound
key, and the next agent refuses to run unless the prior signature checks out.

You can hand the resulting `lineage` to anyone, anywhere — they can re-verify the
entire pipeline themselves, with no access to our infrastructure.

```ts
import { defineAgent, runPipeline, verifyLineage } from "@verified-handoff";

const result = await runPipeline({
  agents: [researcher, reasoner, critic],
  input: "Should I trust Polygon's zkEVM for a $10M bridge?",
});

// share `result.lineage` with anyone
const check = await verifyLineage(result.lineage);
// => { verified: true }
```

## Layout

```
lib/verified-handoff/    The SDK. Crypto, agent factory, orchestrator, verifier.
agents/                  Three agent containers, one per role.
web/                     Next.js demo UI (the "Trace Mirror" page).
```

## Run locally

```bash
npm install
ANTHROPIC_API_KEY=sk-ant-... npm run dev:agents   # in one terminal
npm run dev:web                                    # in another
open http://localhost:3000
```

## Deploy agents to EigenCompute

```bash
ANTHROPIC_API_KEY=sk-ant-... REGISTRY=docker.io/yourhandle TAG=0.1.0 \
  bash scripts/build-agents.sh && \
  bash scripts/push-agents.sh && \
  bash scripts/deploy-agents.sh
```

After deploy, copy the `eigenAppId`s into `web/.env.local` (and your Vercel env vars).

## Integrate into your own stack

The SDK in `lib/verified-handoff/` is reusable for any multi-agent pipeline — not just this Researcher/Reasoner/Critic shape.

**→ [docs/INTEGRATION.md](./docs/INTEGRATION.md)** — defining custom agents, running pipelines, re-verifying lineages, deploying to TEEs, threat model, full API reference.

## Live demo

- **UI:** https://verifiable-multi-agent-orch.vercel.app
- **Researcher TEE:** https://verify-sepolia.eigencloud.xyz/app/0x9F41C61e8e2E564266bcbe9738d86bA88F786eF7
- **Reasoner TEE:** https://verify-sepolia.eigencloud.xyz/app/0x2226eA247a52F2084564345862E854E173Bb7E0B
- **Critic TEE:** https://verify-sepolia.eigencloud.xyz/app/0x0462f630F167fa6Fb898E9c5Dd34d0045Aadc87F
