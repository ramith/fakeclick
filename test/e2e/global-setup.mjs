import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const E2E_EXTENSION_DIR = path.join(ROOT, ".e2e-extension");

export default async function globalSetup() {
  execFileSync("node", ["build.mjs"], { cwd: ROOT, stdio: "inherit" });

  rmSync(E2E_EXTENSION_DIR, { recursive: true, force: true });
  mkdirSync(E2E_EXTENSION_DIR, { recursive: true });
  cpSync(path.join(ROOT, "dist"), E2E_EXTENSION_DIR, { recursive: true });

  // Real users grant this per-site through the toolbar click + browser
  // permission prompt (src/background.js, chrome.permissions.request),
  // which requires a trusted user gesture Playwright can't fabricate for
  // an extension's own action button. This test-only copy of the built
  // extension pre-grants the fixture server's origin via a *required*
  // host permission instead, so e2e tests can drive chrome.storage
  // directly. The shipped dist/manifest.json (optional_host_permissions
  // only) is untouched.
  const manifestPath = path.join(E2E_EXTENSION_DIR, "manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  manifest.host_permissions = ["*://127.0.0.1/*"];
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}
