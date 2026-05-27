import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "verified-handoff — multi-agent orchestration on EigenCompute",
  description:
    "Three agents collaborate to answer your question. Every handoff is cryptographically signed inside a TEE and verifiable by anyone.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
