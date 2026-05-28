"use client";

import { useEffect, useState } from "react";
import type { Lineage, StepEnvelope, VerifyResult } from "@verified-handoff/types";
import { verifyLineage } from "@verified-handoff/verify";
import { Badge, Button } from "@layr-labs/eigen-design";

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
      <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block mr-1.5" />
        verified
      </Badge>
    ) : effective === "failed" ? (
      <Badge variant="destructive">
        <span className="w-1.5 h-1.5 rounded-full bg-current inline-block mr-1.5" />
        invalid
      </Badge>
    ) : (
      <Badge variant="outline" className="text-muted-foreground">
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground inline-block mr-1.5" />
        not yet verified
      </Badge>
    );

  return (
    <div className={`rounded-lg border bg-card ${tint.split(" ")[1]}`}>
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
          <span className="text-muted-foreground text-xs">{open ? "−" : "+"}</span>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 text-sm border-t border-border pt-3">
          <Row label="input hash">
            <span className="mono text-muted-foreground">{short(env.inputHash, 12, 8)}</span>
            {prev && (
              <span
                className={`ml-2 text-xs ${linkageOk ? "text-emerald-400" : "text-red-400"}`}
              >
                {linkageOk ? "← matches step " + index : "← linkage broken"}
              </span>
            )}
          </Row>
          <Row label="output hash">
            <span className="mono text-muted-foreground">{short(env.outputHash, 12, 8)}</span>
          </Row>
          <Row label="signature">
            <span className="mono text-muted-foreground">{short(env.signature, 12, 8)}</span>
            {effective === "verified" && (
              <span className="ml-2 text-xs text-emerald-400">✓ valid</span>
            )}
            {effective === "failed" && (
              <span className="ml-2 text-xs text-red-400">✗ invalid</span>
            )}
          </Row>
          <Row label="pubkey">
            <span className="mono text-muted-foreground">{short(env.pubkey, 12, 8)}</span>
          </Row>
          {env.codeMeasurement && (
            <Row label="code measurement">
              <span className="mono text-muted-foreground">{short(env.codeMeasurement, 12, 8)}</span>
            </Row>
          )}
          <div className="pt-2 flex flex-wrap gap-2">
            {env.eigenAppId ? (
              <Button asChild size="xs" variant="outline">
                <a
                  href={`${EIGEN_VERIFY_BASE}/${env.eigenAppId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Verify TEE on Eigen ↗
                </a>
              </Button>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                local mode (no TEE)
              </Badge>
            )}
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground px-2.5 py-1 border border-border rounded-md hover:text-foreground">
                view output
              </summary>
              <pre className="mt-2 p-3 bg-background border border-border rounded text-foreground/90 mono overflow-auto max-h-80 max-w-full whitespace-pre-wrap">
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
      <span className="text-xs uppercase tracking-wider text-muted-foreground w-32 shrink-0">
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
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          verification chain
        </span>
        {pipelineId && (
          <span className="text-xs mono text-muted-foreground">id {short(pipelineId, 10, 6)}</span>
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
            <Button onClick={onVerify} disabled={verifying} size="sm">
              {verifying ? "Re-verifying…" : "Re-verify entire chain"}
            </Button>
            <Button onClick={onCopy} size="sm" variant="outline">
              {copied ? "Copied!" : "Copy lineage JSON"}
            </Button>
            <label className="text-xs text-muted-foreground ml-auto flex items-center gap-2 cursor-pointer">
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
