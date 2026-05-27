"use client";

import type { ReactNode } from "react";
import type { StepEnvelope } from "@verified-handoff/types";

interface ResearcherOutput {
  question: string;
  context: string[];
  assumptions: string[];
}
interface ReasonerOutput {
  question: string;
  reasoning: string;
  answer: string;
  weakClaims: string[];
}
interface CriticOutput {
  question: string;
  final_answer: string;
  confidence: number;
  caveats?: string[];
  changed_from_reasoner?: boolean;
}

const AGENTS = [
  {
    role: "researcher",
    label: "Researcher",
    activeText: "Searching the web for fresh context…",
    border: "border-blue-500/30",
    text: "text-blue-300",
    dim: "text-blue-400/70",
  },
  {
    role: "reasoner",
    label: "Reasoner",
    activeText: "Working through the question step by step…",
    border: "border-fuchsia-500/30",
    text: "text-fuchsia-300",
    dim: "text-fuchsia-400/70",
  },
  {
    role: "critic",
    label: "Critic",
    activeText: "Pressure-testing the answer…",
    border: "border-emerald-500/30",
    text: "text-emerald-300",
    dim: "text-emerald-400/70",
  },
] as const;

function linkify(text: string) {
  const parts = text.split(/(https?:\/\/[^\s)]+)/g);
  return parts.map((p, i) => {
    if (!/^https?:\/\//.test(p)) return <span key={i}>{p}</span>;
    const host = p.replace(/^https?:\/\/(www\.)?/, "").split("/")[0];
    return (
      <a
        key={i}
        href={p}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-400 hover:text-blue-300 underline underline-offset-2"
      >
        ({host})
      </a>
    );
  });
}

export function ThinkingPanel({
  steps,
  running,
}: {
  steps: StepEnvelope[];
  running: boolean;
}) {
  return (
    <div className="space-y-3">
      {AGENTS.map((a, i) => {
        const step = steps[i];
        const isActive = running && !step && i === steps.length;
        const isPending = !step && !isActive;

        return (
          <div
            key={a.role}
            className={`rounded-lg border bg-[#0c0c0c] ${
              step
                ? a.border
                : isActive
                  ? `${a.border} animate-pulse`
                  : "border-zinc-900 opacity-50"
            }`}
          >
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800/60">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs uppercase tracking-wider ${a.text}`}
                >
                  {a.label}
                </span>
                {step && (
                  <span className="text-xs text-zinc-500 mono">
                    {step.agent}
                  </span>
                )}
              </div>
              <span
                className={`text-xs ${step ? "text-emerald-400" : "text-zinc-600"}`}
              >
                {step ? "✓ signed" : isActive ? "thinking…" : "waiting"}
              </span>
            </div>
            <div className="p-4 space-y-3 text-sm">
              {isPending && (
                <div className="text-zinc-600 text-xs italic">
                  — not started —
                </div>
              )}
              {isActive && (
                <div className="text-zinc-500 text-xs">{a.activeText}</div>
              )}
              {step && a.role === "researcher" && (
                <ResearcherView
                  output={step.output as ResearcherOutput}
                  dim={a.dim}
                />
              )}
              {step && a.role === "reasoner" && (
                <ReasonerView
                  output={step.output as ReasonerOutput}
                  dim={a.dim}
                />
              )}
              {step && a.role === "critic" && (
                <CriticView
                  output={step.output as CriticOutput}
                  dim={a.dim}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Section({
  title,
  dim,
  children,
}: {
  title: string;
  dim: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className={`text-[10px] uppercase tracking-wider ${dim} mb-1.5`}>
        {title}
      </div>
      {children}
    </div>
  );
}

function ResearcherView({
  output,
  dim,
}: {
  output: ResearcherOutput;
  dim: string;
}) {
  return (
    <div className="space-y-3">
      <Section title="Context" dim={dim}>
        <ul className="space-y-1.5 list-disc pl-5">
          {output.context.map((c, i) => (
            <li key={i} className="text-zinc-300 leading-relaxed">
              {linkify(c)}
            </li>
          ))}
        </ul>
      </Section>
      <Section title="Assumptions" dim={dim}>
        <ul className="space-y-1 list-disc pl-5 text-zinc-400 text-xs">
          {output.assumptions.map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

function ReasonerView({
  output,
  dim,
}: {
  output: ReasonerOutput;
  dim: string;
}) {
  return (
    <div className="space-y-3">
      <Section title="Reasoning" dim={dim}>
        <p className="text-zinc-300 whitespace-pre-wrap leading-relaxed">
          {output.reasoning}
        </p>
      </Section>
      <Section title="Draft answer" dim={dim}>
        <p className="text-zinc-200">{output.answer}</p>
      </Section>
      {output.weakClaims.length > 0 && (
        <Section title="Weak claims (flagged for critic)" dim={dim}>
          <ul className="space-y-1 list-disc pl-5 text-zinc-400 text-xs">
            {output.weakClaims.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

function CriticView({
  output,
  dim,
}: {
  output: CriticOutput;
  dim: string;
}) {
  return (
    <div className="space-y-3">
      <Section title="Final answer" dim={dim}>
        <p className="text-zinc-100 leading-relaxed">{output.final_answer}</p>
      </Section>
      <div className="flex items-center gap-4 text-xs">
        <span className="text-zinc-400">
          confidence{" "}
          <span className="mono text-zinc-200">
            {output.confidence.toFixed(2)}
          </span>
        </span>
        {output.changed_from_reasoner && (
          <span className="text-amber-300">· critic revised the reasoner</span>
        )}
      </div>
      {output.caveats && output.caveats.length > 0 && (
        <Section title="Caveats" dim={dim}>
          <ul className="space-y-1 list-disc pl-5 text-zinc-400 text-xs">
            {output.caveats.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
