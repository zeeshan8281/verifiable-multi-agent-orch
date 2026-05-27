import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const dynamic = "force-static";

const MD_PATH = resolve(process.cwd(), "..", "docs", "INTEGRATION.md");

export default function DocsPage() {
  const md = readFileSync(MD_PATH, "utf8");

  return (
    <main className="min-h-screen w-full">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-xs text-zinc-400 hover:text-zinc-200"
          >
            ← back to demo
          </Link>
          <a
            href="https://github.com/zeeshan8281/verifiable-multi-agent-orch/blob/main/docs/INTEGRATION.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-zinc-400 hover:text-zinc-200"
          >
            view on GitHub ↗
          </a>
        </div>

        <article className="markdown">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: (p) => (
                <h1
                  className="text-3xl font-semibold tracking-tight text-zinc-100 mt-8 mb-4"
                  {...p}
                />
              ),
              h2: (p) => (
                <h2
                  className="text-xl font-semibold text-zinc-100 mt-10 mb-3 pb-1 border-b border-zinc-800"
                  {...p}
                />
              ),
              h3: (p) => (
                <h3
                  className="text-base font-semibold text-zinc-200 mt-6 mb-2"
                  {...p}
                />
              ),
              p: (p) => (
                <p className="text-zinc-300 leading-relaxed my-3" {...p} />
              ),
              ul: (p) => (
                <ul
                  className="list-disc pl-6 space-y-1.5 my-3 text-zinc-300"
                  {...p}
                />
              ),
              ol: (p) => (
                <ol
                  className="list-decimal pl-6 space-y-1.5 my-3 text-zinc-300"
                  {...p}
                />
              ),
              li: (p) => <li className="leading-relaxed" {...p} />,
              a: ({ href, ...rest }) => {
                const external = href?.startsWith("http");
                return (
                  <a
                    href={href}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noopener noreferrer" : undefined}
                    className="text-emerald-300 hover:text-emerald-200 underline underline-offset-2"
                    {...rest}
                  />
                );
              },
              strong: (p) => (
                <strong className="font-semibold text-zinc-100" {...p} />
              ),
              em: (p) => <em className="italic text-zinc-200" {...p} />,
              code: ({ className, children, ...rest }) => {
                const isBlock = (className ?? "").startsWith("language-");
                if (isBlock) {
                  return (
                    <code className={`${className} mono`} {...rest}>
                      {children}
                    </code>
                  );
                }
                return (
                  <code
                    className="mono text-[0.92em] px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-amber-200"
                    {...rest}
                  >
                    {children}
                  </code>
                );
              },
              pre: (p) => (
                <pre
                  className="my-4 p-4 rounded-lg bg-black border border-zinc-800 overflow-x-auto text-sm text-zinc-200 mono leading-relaxed"
                  {...p}
                />
              ),
              blockquote: (p) => (
                <blockquote
                  className="border-l-2 border-emerald-500/40 pl-4 my-4 text-zinc-400 italic"
                  {...p}
                />
              ),
              hr: () => <hr className="my-8 border-zinc-800" />,
              table: (p) => (
                <div className="my-4 overflow-x-auto">
                  <table
                    className="w-full text-sm border border-zinc-800 rounded"
                    {...p}
                  />
                </div>
              ),
              thead: (p) => (
                <thead className="bg-zinc-900/60 text-zinc-200" {...p} />
              ),
              th: (p) => (
                <th
                  className="text-left px-3 py-2 font-medium border-b border-zinc-800"
                  {...p}
                />
              ),
              td: (p) => (
                <td
                  className="px-3 py-2 align-top border-b border-zinc-900 text-zinc-300"
                  {...p}
                />
              ),
            }}
          >
            {md}
          </ReactMarkdown>
        </article>

        <footer className="pt-8 border-t border-zinc-800 text-xs text-zinc-500">
          <Link href="/" className="hover:text-zinc-300">
            ← back to demo
          </Link>
        </footer>
      </div>
    </main>
  );
}
