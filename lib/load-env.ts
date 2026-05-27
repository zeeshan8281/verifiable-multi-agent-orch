/**
 * Load .env from the repo root before anything else runs.
 * Imported at the very top of each agent's entry file.
 *
 * Uses Node 22's native process.loadEnvFile (no extra dependency).
 */
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const candidates = [
  resolve(here, "../.env"),
  resolve(here, "../../.env"),
  resolve(process.cwd(), ".env"),
];

for (const path of candidates) {
  if (existsSync(path)) {
    try {
      // Node 22+: process.loadEnvFile loads a dotenv-style file into process.env.
      (process as unknown as { loadEnvFile: (p: string) => void }).loadEnvFile(path);
      break;
    } catch {
      // ignore; fall through to next candidate
    }
  }
}
