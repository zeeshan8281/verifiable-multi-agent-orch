export type Hex = `0x${string}`;

/**
 * What an agent receives and emits.
 * `output` is whatever the handler returns (JSON-serializable).
 */
export interface AgentHandlerInput<I = unknown> {
  input: I;
  pipelineId: string;
  step: number;
}

export type AgentHandler<I = unknown, O = unknown> = (
  ctx: AgentHandlerInput<I>,
) => Promise<O>;

export interface AgentDefinition<I = unknown, O = unknown> {
  name: string;
  version: string;
  description?: string;
  handler: AgentHandler<I, O>;
}

/**
 * The cryptographic envelope produced by an agent for each step.
 * This is what gets passed to the next agent and recorded in the lineage.
 *
 * Signature covers: hash(pipelineId || step || agent || inputHash || outputHash || timestamp)
 */
export interface StepEnvelope {
  step: number;
  agent: string;          // e.g. "researcher@1.0.0"
  pipelineId: string;
  timestamp: number;       // unix ms
  inputHash: Hex;          // sha256 of canonical(input)
  outputHash: Hex;         // sha256 of canonical(output)
  output: unknown;         // the actual payload (so next agent can read it)
  signature: Hex;          // ed25519 sig over the digest
  pubkey: Hex;             // ed25519 pubkey of the signing TEE
  eigenAppId?: string;     // EigenCompute app ID — proves which TEE produced this
  codeMeasurement?: Hex;   // optional: pinned code measurement claim
}

export interface Lineage {
  pipelineId: string;
  question: string;
  finalOutput: unknown;
  steps: StepEnvelope[];
  createdAt: number;
}

export interface VerifyResult {
  verified: boolean;
  reason?: string;
  details: Array<{
    step: number;
    agent: string;
    signatureOk: boolean;
    linkageOk: boolean;
    note?: string;
  }>;
}
