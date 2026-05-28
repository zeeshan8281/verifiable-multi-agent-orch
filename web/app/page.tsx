"use client";

import { useState } from "react";
import type { Lineage, StepEnvelope } from "@verified-handoff/types";
import { Badge, Button, Card, Input } from "@layr-labs/eigen-design";
import { LineagePanel } from "./components/Lineage";
import { ThinkingPanel } from "./components/Thinking";

interface CriticOutput {
  question: string;
  final_answer: string;
  confidence: number;
  caveats?: string[];
  changed_from_reasoner?: boolean;
}

const EXAMPLES = [
  "Should I worry about quantum computers breaking Bitcoin in the next 10 years?",
  "Is it safe to upgrade a Postgres 14 cluster directly to 17?",
  "Explain why veCRV worked but most ve-token forks didn't.",
];

export default function Home() {
  const [question, setQuestion] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<StepEnvelope[]>([]);
  const [lineage, setLineage] = useState<Lineage | null>(null);
  const [final, setFinal] = useState<CriticOutput | null>(null);

  const run = async (q: string) => {
    setRunning(true);
    setError(null);
    setSteps([]);
    setLineage(null);
    setFinal(null);

    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      if (!res.ok || !res.body) {
        const text = await res.text();
        throw new Error(text || `pipeline failed: ${res.status}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const evt = JSON.parse(line) as
            | { type: "start"; agents: string[] }
            | { type: "step"; env: StepEnvelope }
            | { type: "done"; lineage: Lineage }
            | { type: "error"; error: string };
          if (evt.type === "step") {
            setSteps((s) => [...s, evt.env]);
          } else if (evt.type === "done") {
            setLineage(evt.lineage);
            const last = evt.lineage.steps[evt.lineage.steps.length - 1];
            setFinal(last?.output as CriticOutput);
          } else if (evt.type === "error") {
            setError(evt.error);
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  };

  return (
    <main className="min-h-screen w-full">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        <div className="flex items-center justify-end pb-2 border-b border-border gap-5 text-xs">
          <a href="/docs" className="text-foreground/80 hover:text-foreground">
            integrate as SDK ↗
          </a>
          <a href="/verify" className="text-foreground/80 hover:text-foreground">
            verify a lineage ↗
          </a>
        </div>

        <header className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="inline-block w-2 h-2 rounded-full bg-indigo-400" />
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              verified-handoff
            </h1>
            <span className="text-xs text-muted-foreground mono">
              multi-agent orchestration on EigenCompute
            </span>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Three agents — <span className="text-blue-300">Researcher</span> →{" "}
            <span className="text-fuchsia-300">Reasoner</span> →{" "}
            <span className="text-indigo-300">Critic</span> — collaborate on
            your question. Each handoff is signed inside a TEE. Anyone can
            re-verify the whole chain.
          </p>
        </header>

        <section className="space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (question.trim() && !running) run(question.trim());
            }}
          >
            <div className="flex gap-2">
              <Input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask anything…"
                className="flex-1 h-12 text-base"
                disabled={running}
              />
              <Button
                type="submit"
                size="lg"
                disabled={running || !question.trim()}
              >
                {running ? "Running…" : "Run pipeline"}
              </Button>
            </div>
          </form>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted-foreground">try:</span>
            {EXAMPLES.map((e) => (
              <Badge
                key={e}
                variant="outline"
                asChild
                className="cursor-pointer hover:bg-accent"
              >
                <button
                  onClick={() => {
                    setQuestion(e);
                    if (!running) run(e);
                  }}
                  disabled={running}
                  className="disabled:opacity-40"
                >
                  {e}
                </button>
              </Badge>
            ))}
          </div>
        </section>

        {error && (
          <div className="p-3 rounded-md border border-red-500/40 bg-red-500/5 text-red-300 text-sm">
            {error}
          </div>
        )}

        <section className="grid md:grid-cols-2 gap-6">
          {/* LEFT — what you get from a standard orchestrator */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                standard pipeline
              </span>
              <span className="text-xs text-muted-foreground/70">
                trust model: trust-me
              </span>
            </div>
            <Card className="p-5 min-h-[16rem]">
              {!final && !running && (
                <div className="text-sm text-muted-foreground">
                  This is what Dust / LangGraph / Crew hand you today: an
                  answer. Nothing to verify which agents actually ran, what
                  they actually said, or that the chain wasn't tampered with.
                </div>
              )}
              {running && !final && (
                <div className="text-sm text-muted-foreground animate-pulse">
                  generating…
                </div>
              )}
              {final && (
                <div className="space-y-3">
                  <div className="text-foreground">{final.final_answer}</div>
                  <div className="text-xs text-muted-foreground italic">
                    ↑ that's it. No signatures, no provenance, no proof three
                    agents even ran. You take the provider's word for it.
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* RIGHT — verified pipeline */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-indigo-300">
                verified-handoff
              </span>
              <span className="text-xs text-muted-foreground">
                trust model: prove-it (signatures + TEEs)
              </span>
            </div>
            <Card className="p-5 space-y-4 border-indigo-500/30">
              {!running && steps.length === 0 && !final && (
                <div className="text-sm text-muted-foreground min-h-[14rem]">
                  Run a question to watch each TEE-agent think out loud,
                  signing as it hands off to the next.
                </div>
              )}

              {(running || steps.length > 0) && (
                <ThinkingPanel steps={steps} running={running} />
              )}

              {steps.length > 0 && (
                <details className="pt-3 border-t border-border">
                  <summary className="cursor-pointer text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground">
                    proof layer — signatures, hashes, TEE attestations ↓
                  </summary>
                  <div className="pt-4">
                    <LineagePanel
                      steps={steps}
                      pipelineId={lineage?.pipelineId}
                      lineage={lineage ?? undefined}
                    />
                  </div>
                </details>
              )}
            </Card>
          </div>
        </section>

        <footer className="pt-8 border-t border-border text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-3">
          <span>
            unlike Dust / Crew / LangGraph, every handoff is provable. not promised.
          </span>
          <span className="flex items-center gap-2">
            made verifiable with
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/eigen/primary-wordmark-light.svg"
              alt="Eigen Cloud"
              className="h-4 w-auto opacity-90"
            />
          </span>
        </footer>
      </div>
    </main>
  );
}
