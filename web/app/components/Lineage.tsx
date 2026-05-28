"use client";

import { useEffect, useState } from "react";
import type { Lineage, StepEnvelope, VerifyResult } from "@verified-handoff/types";
import { verifyLineage } from "@verified-handoff/verify";

const EIGEN_VERIFY_BASE = "https://verify-sepolia.eigencloud.xyz/app";

const AGENT_TINTS: Record<string, string> = {
  researcher: "text-blue-300 border-blue-500/30",
  reasoner: "text-fuchsia-300 border-fuchsia-500/30",
  critic: "text-indigo-300 border-indigo-500/30",
};

function short(hex: string, head = 8, tail = 6) {
  if (!hex) return "";
  if (hex.length <= head + tail + 3) return hex;
  return `${hex.slice(0, head)}…${hex.slice(-tail)}`;
}

export function StepCard({
  env,
  prev,
  index,
  status,
}: {
  env: StepEnvelope;
  prev?: StepEnvelope;
  index: number;
  status?: "verified" | "failed" | "pending";
}) {
  const [open, setOpen] = useState(false);
  const role = env.agent.split("@")[0];
  const tint = AGENT_TINTS[role] ?? "text-zinc-300 border-zinc-500/30";
  const linkageOk = !prev || prev.outputHash === env.inputHash;
  const effective = status ?? "pending";

  const badge =
    effective === "verified" ? (
      <span className="text-xs text-emerald-400 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
        verified
      </span>
    ) : effective === "failed" ? (
      <span className="text-xs text-red-400 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
        invalid
      </span>
    ) : (
      <span className="text-xs text-zinc-500 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 inline-block" />
        not yet verified
      </span>
    );

  return (
    <div className={`rounded-lg border bg-[#0c0c0c] ${tint.split(" ")[1]}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <span className={`text-xs uppercase tracking-wider ${tint.split(" ")[0]}`}>
            Step {index + 1}
          </span>
          <span className="font-medium">{env.agent}</span>
        </div>
        <div className="flex items-center gap-3">
          {badge}
          <span className="text-zinc-500 text-xs">{open ? "−" : "+"}</span>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 text-sm border-t border-zinc-800 pt-3">
          <Row label="input hash">
            <span className="mono text-zinc-400">{short(env.inputHash, 12, 8)}</span>
            {prev && (
              <span
                className={`ml-2 text-xs ${linkageOk ? "text-emerald-400" : "text-red-400"}`}
              >
                {linkageOk ? "← matches step " + index : "← linkage broken"}
              </span>
            )}
          </Row>
          <Row label="output hash">
            <span className="mono text-zinc-400">{short(env.outputHash, 12, 8)}</span>
          </Row>
          <Row label="signature">
            <span className="mono text-zinc-400">{short(env.signature, 12, 8)}</span>
            {effective === "verified" && (
              <span className="ml-2 text-xs text-emerald-400">✓ valid</span>
            )}
            {effective === "failed" && (
              <span className="ml-2 text-xs text-red-400">✗ invalid</span>
            )}
          </Row>
          <Row label="pubkey">
            <span className="mono text-zinc-400">{short(env.pubkey, 12, 8)}</span>
          </Row>
          {env.codeMeasurement && (
            <Row label="code measurement">
              <span className="mono text-zinc-400">{short(env.codeMeasurement, 12, 8)}</span>
            </Row>
          )}
          <div className="pt-2 flex flex-wrap gap-2">
            {env.eigenAppId ? (
              <a
                href={`${EIGEN_VERIFY_BASE}/${env.eigenAppId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-2.5 py-1 rounded-md border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10"
              >
                Verify TEE on Eigen ↗
              </a>
            ) : (
              <span className="text-xs px-2.5 py-1 rounded-md border border-zinc-700 text-zinc-500">
                local mode (no TEE)
              </span>
            )}
            <details className="text-xs">
              <summary className="cursor-pointer text-zinc-400 px-2.5 py-1 border border-zinc-700 rounded-md">
                view output
              </summary>
              <pre className="mt-2 p-3 bg-black border border-zinc-800 rounded text-zinc-300 mono overflow-auto max-h-80 max-w-full whitespace-pre-wrap">
                {JSON.stringify(env.output, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="text-xs uppercase tracking-wider text-zinc-500 w-32 shrink-0">
        {label}
      </span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

export function LineagePanel({
  steps,
  pipelineId,
  lineage,
}: {
  steps: StepEnvelope[];
  pipelineId?: string;
  lineage?: Lineage;
}) {
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [tamper, setTamper] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!lineage) return;
    let cancelled = false;
    setTamper(false);
    verifyLineage(lineage).then((r) => {
      if (!cancelled) setVerifyResult(r);
    });
    return () => {
      cancelled = true;
    };
  }, [lineage]);

  const onVerify = async () => {
    if (!lineage) return;
    setVerifying(true);
    setVerifyResult(null);
    const target: Lineage = tamper
      ? {
          ...lineage,
          steps: lineage.steps.map((s, i) =>
            i === 1
              ? { ...s, output: { ...(s.output as object), tampered: true } }
              : s,
          ),
        }
      : lineage;
    const result = await verifyLineage(target);
    setVerifyResult(result);
    setVerifying(false);
  };

  const onCopy = async () => {
    if (!lineage) return;
    await navigator.clipboard.writeText(JSON.stringify(lineage, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-zinc-500">
          verification chain
        </span>
        {pipelineId && (
          <span className="text-xs mono text-zinc-500">id {short(pipelineId, 10, 6)}</span>
        )}
      </div>

      <div className="space-y-2">
        {steps.map((env, i) => {
          const d = verifyResult?.details.find((x) => x.step === i);
          const status: "verified" | "failed" | "pending" | undefined = !verifyResult
            ? undefined
            : d && d.signatureOk && d.linkageOk
              ? "verified"
              : "failed";
          return (
            <StepCard
              key={env.signature}
              env={env}
              prev={steps[i - 1]}
              index={i}
              status={status}
            />
          );
        })}
      </div>

      {steps.length > 0 && lineage && (
        <>
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button
              onClick={onVerify}
              disabled={verifying}
              className="text-sm px-3 py-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50"
            >
              {verifying ? "Re-verifying…" : "Re-verify entire chain"}
            </button>
            <button
              onClick={onCopy}
              className="text-sm px-3 py-1.5 rounded-md border border-zinc-700 text-zinc-300 hover:bg-zinc-900"
            >
              {copied ? "Copied!" : "Copy lineage JSON"}
            </button>
            <label className="text-xs text-zinc-400 ml-auto flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={tamper}
                onChange={(e) => {
                  setTamper(e.target.checked);
                  setVerifyResult(null);
                }}
              />
              tamper with step 2 (demo)
            </label>
          </div>

          {verifyResult && (
            <div
              className={`p-3 rounded-md border text-sm ${
                verifyResult.verified
                  ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-300"
                  : "border-red-500/40 bg-red-500/5 text-red-300"
              }`}
            >
              {verifyResult.verified ? (
                <>
                  <strong>verified.</strong> All {verifyResult.details.length} steps
                  have valid signatures and the lineage is unbroken.
                </>
              ) : (
                <>
                  <strong>verification failed:</strong> {verifyResult.reason}
                </>
              )}
              <div className="mt-2 text-xs space-y-1">
                {verifyResult.details.map((d) => (
                  <div key={d.step} className="flex items-center gap-2">
                    <span
                      className={
                        d.signatureOk && d.linkageOk
                          ? "text-emerald-400"
                          : "text-red-400"
                      }
                    >
                      {d.signatureOk && d.linkageOk ? "✓" : "✗"}
                    </span>
                    <span className="text-zinc-400">
                      step {d.step + 1} · {d.agent}
                    </span>
                    {d.note && <span className="text-zinc-500">— {d.note}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
