import { fileURLToPath, URL } from "node:url";
import { createHash } from "node:crypto";
import { cpSync, existsSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));
const coloringLibrary = resolve(projectRoot, "coloring-library");

function portableBuild(): Plugin {
  return {
    name: "portable-coloring-library",
    apply: "build",
    closeBundle: async () => {
      const outDir = resolve(projectRoot, "dist");
      const targetLibrary = join(outDir, "coloring-library");
      if (existsSync(targetLibrary)) rmSync(targetLibrary, { recursive: true, force: true });
      if (existsSync(coloringLibrary)) {
        cpSync(coloringLibrary, targetLibrary, { recursive: true });
      }

      const excluded = new Set([
        "asset-manifest.json",
        "coloring-library",
        "service-worker.js",
        "coloring-library/images",
        "coloring-library/thumbnails",
      ]);

      const files = new Set<string>();
      const walk = (dir: string, urlDir = "./") => {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
          const absolute = join(dir, entry.name);
          const url = `${urlDir}${entry.name}`;
          if (entry.isDirectory()) {
            if (entry.name === "images" || entry.name === "thumbnails") continue;
            walk(absolute, `${url}/`);
          } else if (!excluded.has(entry.name)) {
            files.add(url);
          }
        }
      };

      if (existsSync(outDir)) walk(outDir);
      files.add("./coloring-library/catalog.json");
      files.add("./");
      const manifest = [...files].sort();
      writeFileSync(join(outDir, "asset-manifest.json"), JSON.stringify(manifest, null, 2));
      const version = createHash("sha256").update(JSON.stringify(manifest)).digest("hex").slice(0, 16);
      writeFileSync(join(outDir, "cache-version.json"), JSON.stringify({ version }, null, 2));
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [react(), portableBuild()],
  build: {
    target: "es2020",
    assetsInlineLimit: 0,
  },
});