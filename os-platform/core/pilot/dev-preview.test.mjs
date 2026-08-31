import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const pilotDir = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(pilotDir, "../../..");
const launcherPath = path.join(pilotDir, "dev-preview.mjs");
const viteConfigPath = path.join(repositoryRoot, "frontend", "vite.config.ts");

test("the integrated preview launcher is valid JavaScript", () => {
  const result = spawnSync(process.execPath, ["--check", launcherPath], {
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test("the OS Shell consumes the canonical integrated-preview frontend port", () => {
  const viteConfig = readFileSync(viteConfigPath, "utf8");

  assert.match(
    viteConfig,
    /port:\s*parseInt\(\s*process\.env\.TF_FRONTEND_PORT\s*\|\|\s*process\.env\.PORT\s*\|\|\s*process\.env\.VITE_PORT\s*\|\|\s*['"]3102['"]\s*\)/,
  );
  assert.match(viteConfig, /strictPort:\s*true/);
});

test("the integrated preview uses the backend path that builds a fresh checkout", () => {
  const launcher = readFileSync(launcherPath, "utf8");

  assert.match(launcher, /getPnpmInvocation\(\["run",\s*"dev:backend:watch"\]\)/);
  assert.doesNotMatch(launcher, /getPnpmInvocation\(\["run",\s*"dev:backend"\]\)/);
});

test("frontend readiness reports the actual configured URL", () => {
  const launcher = readFileSync(launcherPath, "utf8");

  assert.match(
    launcher,
    /Waiting for frontend \$\{DEFAULT_FRONTEND_BASE_URL\}/,
  );
  assert.doesNotMatch(launcher, /Waiting for frontend :5173/);
});

test("the integrated preview gives both services the same canonical API port without exposing Pilot auth", () => {
  const launcher = readFileSync(launcherPath, "utf8");

  assert.match(launcher, /const runtimeEnv = createPreviewRuntimeEnv\(process\.env\)/);
  assert.match(launcher, /const backendEnv = createPreviewBackendEnv\(runtimeEnv\)/);
  assert.match(
    launcher,
    /startProcess\("backend", backendInvocation\.command, backendInvocation\.args, \{\s*env: backendEnv,?\s*\}\)/,
  );
  assert.match(
    launcher,
    /startProcess\("frontend", frontendInvocation\.command, frontendInvocation\.args, \{\s*env: runtimeEnv,?\s*\}\)/,
  );
  assert.doesNotMatch(launcher, /startProcess\("frontend"[^;]*backendEnv/);
});
