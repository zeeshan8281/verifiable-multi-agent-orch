import type { NextConfig } from "next";
import path from "node:path";

const config: NextConfig = {
  // Silence the multi-lockfile warning.
  outputFileTracingRoot: path.resolve(import.meta.dirname, ".."),

  // Our SDK lives outside web/. Importing TS files with `.js` extensions
  // (the Node ESM convention) needs webpack's extensionAlias.
  webpack: (config) => {
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js", ".jsx"],
    };
    return config;
  },
};

export default config;
