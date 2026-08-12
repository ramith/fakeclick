import { build as esbuildBuild, context } from "esbuild";
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  rmSync,
  cpSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(ROOT, "dist");

const args = process.argv.slice(2);
const watch = args.includes("--watch");
const zip = args.includes("--zip");

function readVersion() {
  const pkg = JSON.parse(readFileSync(path.join(ROOT, "package.json"), "utf8"));
  return pkg.version;
}

function copyStaticFiles() {
  mkdirSync(DIST, { recursive: true });

  const manifest = JSON.parse(
    readFileSync(path.join(ROOT, "manifest.json"), "utf8")
  );
  manifest.version = readVersion();
  writeFileSync(
    path.join(DIST, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n"
  );

  cpSync(path.join(ROOT, "icons"), path.join(DIST, "icons"), {
    recursive: true,
  });
}

function esbuildOptions() {
  return {
    entryPoints: [
      path.join(ROOT, "src/background.js"),
      path.join(ROOT, "src/inject.js"),
    ],
    outdir: DIST,
    bundle: true,
    format: "iife",
    target: "chrome111",
    minify: !watch,
    logLevel: "info",
  };
}

function makeZip() {
  const version = readVersion();
  const outDir = path.join(ROOT, "web-ext-artifacts");
  mkdirSync(outDir, { recursive: true });
  const zipPath = path.join(outDir, `fakeclick-${version}.zip`);
  rmSync(zipPath, { force: true });
  execFileSync("zip", ["-r", zipPath, "."], { cwd: DIST, stdio: "inherit" });
  console.log(`Packaged ${path.relative(ROOT, zipPath)}`);
}

async function main() {
  rmSync(DIST, { recursive: true, force: true });
  copyStaticFiles();

  if (watch) {
    const ctx = await context(esbuildOptions());
    await ctx.watch();
    console.log("Watching src/ for changes... (Ctrl+C to stop)");
    return;
  }

  await esbuildBuild(esbuildOptions());

  if (zip) {
    makeZip();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
