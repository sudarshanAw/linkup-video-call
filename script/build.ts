import { build } from "esbuild";
import { execSync } from "child_process";

console.log("Building client...");
execSync("npx vite build", { stdio: "inherit" });

console.log("Building server...");
await build({
  entryPoints: ["server/index.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  outfile: "dist/index.cjs",
  packages: "external",
  sourcemap: true,
});

console.log("Build complete!");
