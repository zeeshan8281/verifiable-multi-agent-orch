import { verifyEnvelope } from "./crypto.js";
import type { Lineage, VerifyResult } from "./types.js";

/**
 * Verify a lineage end-to-end. Pure function — no network calls.
 *
 * Checks per step:
 *   1. Signature is valid for (pubkey, digest of envelope)
 *   2. Step index is monotonic and starts at 0
 *   3. inputHash of step N equals outputHash of step N-1 (linkage)
 *   4. All steps share the same pipelineId
 *
 * This function deliberately does NOT depend on our infrastructure.
 * Anyone, anywhere can run it on a lineage JSON.
 */
export async function verifyLineage(lineage: Lineage): Promise<VerifyResult> {
  const details: VerifyResult["details"] = [];
  let verified = true;
  let reason: string | undefined;

  for (let i = 0; i < lineage.steps.length; i++) {
    const env = lineage.steps[i];
    const sigOk = await verifyEnvelope(env);
    let linkageOk = true;
    let note: string | undefined;

    if (env.step !== i) {
      linkageOk = false;
      note = `step index mismatch: declared ${env.step}, position ${i}`;
    }
    if (env.pipelineId !== lineage.pipelineId) {
      linkageOk = false;
      note = `pipelineId mismatch: envelope has ${env.pipelineId}`;
    }
    if (i > 0) {
      const prev = lineage.steps[i - 1];
      if (env.inputHash !== prev.outputHash) {
        linkageOk = false;
        note = `linkage broken: step ${i} input hash does not match step ${i - 1} output hash`;
      }
    }

    if (!sigOk && !reason) {
      verified = false;
      reason = `step ${i} signature invalid`;
    } else if (!linkageOk && !reason) {
      verified = false;
      reason = note ?? `step ${i} linkage broken`;
    }

    details.push({ step: i, agent: env.agent, signatureOk: sigOk, linkageOk, note });
  }

  return { verified, reason, details };
}
