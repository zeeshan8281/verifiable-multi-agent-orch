import * as ed from "@noble/ed25519";
import { sha512 } from "@noble/hashes/sha512";
import { sha256 } from "@noble/hashes/sha256";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
import type { Hex, StepEnvelope } from "./types.js";

// noble-ed25519 v2 requires a sync sha512 to be plugged in for sync helpers.
ed.etc.sha512Sync = (...m) => sha512(ed.etc.concatBytes(...m));

export interface Keypair {
  publicKey: Hex;
  privateKey: Hex;
}

export function generateKeypair(): Keypair {
  const priv = ed.utils.randomPrivateKey();
  const pub = ed.getPublicKey(priv);
  return { privateKey: toHex(priv), publicKey: toHex(pub) };
}

export function canonicalize(value: unknown): string {
  // Deterministic JSON: sort object keys recursively.
  const stringify = (v: unknown): string => {
    if (v === null || typeof v !== "object") return JSON.stringify(v);
    if (Array.isArray(v)) return `[${v.map(stringify).join(",")}]`;
    const keys = Object.keys(v as object).sort();
    return `{${keys
      .map((k) => `${JSON.stringify(k)}:${stringify((v as Record<string, unknown>)[k])}`)
      .join(",")}}`;
  };
  return stringify(value);
}

export function hashJSON(value: unknown): Hex {
  return toHex(sha256(new TextEncoder().encode(canonicalize(value))));
}

export function buildDigest(env: Omit<StepEnvelope, "signature" | "pubkey">): Uint8Array {
  const payload = canonicalize({
    pipelineId: env.pipelineId,
    step: env.step,
    agent: env.agent,
    timestamp: env.timestamp,
    inputHash: env.inputHash,
    outputHash: env.outputHash,
  });
  return sha256(new TextEncoder().encode(payload));
}

export async function signEnvelope(
  env: Omit<StepEnvelope, "signature" | "pubkey">,
  privateKey: Hex,
): Promise<Hex> {
  const digest = buildDigest(env);
  const sig = await ed.signAsync(digest, hexToBytes(stripHex(privateKey)));
  return toHex(sig);
}

export async function verifyEnvelope(env: StepEnvelope): Promise<boolean> {
  const digest = buildDigest(env);
  try {
    return await ed.verifyAsync(
      hexToBytes(stripHex(env.signature)),
      digest,
      hexToBytes(stripHex(env.pubkey)),
    );
  } catch {
    return false;
  }
}

export function toHex(bytes: Uint8Array): Hex {
  return `0x${bytesToHex(bytes)}` as Hex;
}

function stripHex(s: string): string {
  return s.startsWith("0x") ? s.slice(2) : s;
}
