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

See [DEPLOY.md](./DEPLOY.md).
