"use client";

import { useState } from "react";
import type { Lineage, StepEnvelope } from "@verified-handoff/types";
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
        <header className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
            <h1 className="text-2xl font-semibold tracking-tight">
              verified-handoff
            </h1>
            <span className="text-xs text-zinc-500 mono">
              multi-agent orchestration on EigenCompute
            </span>
          </div>
          <p className="text-zinc-400 max-w-2xl">
            Three agents — <span className="text-blue-300">Researcher</span> →{" "}
            <span className="text-fuchsia-300">Reasoner</span> →{" "}
            <span className="text-emerald-300">Critic</span> — collaborate on
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
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask anything…"
                className="flex-1 bg-[#0c0c0c] border border-zinc-800 rounded-lg px-4 py-3 text-base focus:outline-none focus:border-zinc-600"
                disabled={running}
              />
              <button
                type="submit"
                disabled={running || !question.trim()}
                className="px-5 py-3 rounded-lg bg-emerald-500 text-black font-medium hover:bg-emerald-400 disabled:opacity-40"
              >
                {running ? "Running…" : "Run pipeline"}
              </button>
            </div>
          </form>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="text-zinc-500">try:</span>
            {EXAMPLES.map((e) => (
              <button
                key={e}
                onClick={() => {
                  setQuestion(e);
                  if (!running) run(e);
                }}
                disabled={running}
                className="text-zinc-400 hover:text-zinc-200 border border-zinc-800 rounded px-2 py-0.5 disabled:opacity-40"
              >
                {e}
              </button>
            ))}
          </div>
        </section>

        {error && (
          <div className="p-3 rounded-md border border-red-500/40 bg-red-500/5 text-red-300 text-sm">
            {error}
          </div>
        )}

        <section className="grid md:grid-cols-2 gap-6">
          {/* LEFT — standard orchestrator */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-zinc-500">
                standard orchestrator
              </span>
              <span className="text-xs text-zinc-600">trust: provider's word</span>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-[#0c0c0c] p-5 min-h-[16rem]">
              {!final && !running && (
                <div className="text-sm text-zinc-600">
                  Run a question to see what a normal pipeline returns: just the answer.
                </div>
              )}
              {running && !final && (
                <div className="text-sm text-zinc-500 animate-pulse">
                  generating…
                </div>
              )}
              {final && (
                <div className="space-y-3">
                  <div className="text-zinc-200">{final.final_answer}</div>
                  <div className="text-xs text-zinc-600">
                    Generated by a 3-agent pipeline. No way to verify it ran as
                    claimed.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT — verified pipeline */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-emerald-400">
                verified-handoff (EigenCompute)
              </span>
              <span className="text-xs text-zinc-500">trust: math + TEEs</span>
            </div>
            <div className="rounded-lg border border-emerald-500/30 bg-[#0c0c0c] p-5 space-y-4">
              {!running && steps.length === 0 && !final && (
                <div className="text-sm text-zinc-600 min-h-[14rem]">
                  Run a question to watch each TEE-agent think out loud,
                  signing as it hands off to the next.
                </div>
              )}

              {(running || steps.length > 0) && (
                <ThinkingPanel steps={steps} running={running} />
              )}

              {steps.length > 0 && (
                <details className="pt-3 border-t border-zinc-800">
                  <summary className="cursor-pointer text-xs uppercase tracking-wider text-zinc-500 hover:text-zinc-300">
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
            </div>
          </div>
        </section>

        <footer className="pt-8 border-t border-zinc-800 text-xs text-zinc-500 flex justify-between">
          <span>
            unlike Dust / Crew / LangGraph, every handoff is provable. not promised.
          </span>
          <a href="/verify" className="text-zinc-400 hover:text-zinc-200">
            verify a lineage ↗
          </a>
        </footer>
      </div>
    </main>
  );
}
