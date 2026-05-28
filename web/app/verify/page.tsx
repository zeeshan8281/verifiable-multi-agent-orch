"use client";

import { useState } from "react";
import type { Lineage, VerifyResult } from "@verified-handoff/types";
import { verifyLineage } from "@verified-handoff/verify";
import { Button, Textarea } from "@layr-labs/eigen-design";
import { LineagePanel } from "../components/Lineage";

export default function VerifyPage() {
  const [text, setText] = useState("");
  const [lineage, setLineage] = useState<Lineage | null>(null);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onVerify = async () => {
    setError(null);
    setResult(null);
    setLineage(null);
    let parsed: Lineage;
    try {
      parsed = JSON.parse(text) as Lineage;
    } catch (e) {
      setError("invalid JSON");
      return;
    }
    if (!parsed.steps || !Array.isArray(parsed.steps)) {
      setError("not a lineage object (missing steps)");
      return;
    }
    setLineage(parsed);
    const r = await verifyLineage(parsed);
    setResult(r);
  };

  return (
    <main className="min-h-screen w-full">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        <header className="space-y-2">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            verify a lineage
          </h1>
          <p className="text-muted-foreground">
            Paste any <code className="mono text-foreground/90">lineage</code>{" "}
            object. We re-check every signature and every hash link locally in
            your browser. No infrastructure of ours involved.
          </p>
        </header>

        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste lineage JSON…"
          rows={12}
          className="mono text-sm"
        />

        <div className="flex gap-2">
          <Button onClick={onVerify} disabled={!text.trim()} size="lg">
            Verify
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href="/">← back</a>
          </Button>
        </div>

        {error && (
          <div className="p-3 rounded-md border border-red-500/40 bg-red-500/5 text-red-300 text-sm">
            {error}
          </div>
        )}

        {result && (
          <div
            className={`p-4 rounded-md border ${
              result.verified
                ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-300"
                : "border-red-500/40 bg-red-500/5 text-red-300"
            }`}
          >
            {result.verified ? (
              <strong>✓ verified.</strong>
            ) : (
              <>
                <strong>✗ verification failed.</strong>{" "}
                <span className="text-sm">{result.reason}</span>
              </>
            )}
          </div>
        )}

        {lineage && (
          <div className="pt-4">
            <LineagePanel
              steps={lineage.steps}
              pipelineId={lineage.pipelineId}
              lineage={lineage}
            />
          </div>
        )}
      </div>
    </main>
  );
}
