import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  createPreviewProcessPlan,
  resolveApiPort,
  resolveFrontendPort,
} from "./dev-preview.mjs";

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const PREVIEW_SCRIPT = path.resolve(TEST_DIR, "dev-preview.mjs");

test("the canonical preview launcher starts with its shebang and parses as JavaScript", () => {
  const source = fs.readFileSync(PREVIEW_SCRIPT, "utf8");
  assert.match(source, /^#!\/usr\/bin\/env node\r?\n/);
  execFileSync(process.execPath, ["--check", PREVIEW_SCRIPT], { stdio: "pipe" });
});

test("the canonical frontend port defaults to 3102 and honors explicit overrides", () => {
  assert.equal(resolveFrontendPort({}), "3102");
  assert.equal(resolveFrontendPort({ VITE_PORT: "4173" }), "3102");
  assert.equal(resolveFrontendPort({ PORT: "4200", VITE_PORT: "4173" }), "3102");
  assert.equal(
    resolveFrontendPort({ TF_FRONTEND_PORT: "3109", PORT: "4200", VITE_PORT: "4173" }),
    "3109",
  );
});

test("the canonical API port defaults to 5046 and ignores unrelated generic ports", () => {
  assert.equal(resolveApiPort({}), "5046");
  assert.equal(resolveApiPort({ PORT: "3000", VITE_API_PORT: "5000" }), "5046");
  assert.equal(resolveApiPort({ TF_API_PORT: "5050", VITE_API_PORT: "5000" }), "5050");
});

test("the preview plan builds the API and isolates both canonical port contracts", () => {
  const plan = createPreviewProcessPlan({
    PORT: "3000",
    VITE_PORT: "5173",
    VITE_API_PORT: "5000",
    KEEP: "value",
  }, "linux");
  assert.deepEqual(plan.backendBuild, {
    command: "dotnet",
    args: [
      "build",
      "backend/src/TerraFusion.API/TerraFusion.API.csproj",
    ],
    env: {
      PORT: "3000",
      VITE_PORT: "5173",
      VITE_API_PORT: "5000",
      KEEP: "value",
      TF_API_PORT: "5046",
    },
  });
  assert.deepEqual(plan.backend, {
    command: "pnpm",
    args: ["run", "dev:backend"],
    env: {
      PORT: "3000",
      VITE_PORT: "5173",
      VITE_API_PORT: "5000",
      KEEP: "value",
      TF_API_PORT: "5046",
    },
  });
  assert.equal(plan.frontend.command, "pnpm");
  assert.deepEqual(plan.frontend.args, ["run", "dev:frontend", "--", "--strictPort"]);
  assert.deepEqual(plan.frontend.env, {
    PORT: "3102",
    VITE_PORT: "3102",
    VITE_API_PORT: "5000",
    KEEP: "value",
    TF_API_PORT: "5046",
    TF_FRONTEND_PORT: "3102",
  });
  assert.equal(plan.backendBaseUrl, "http://localhost:5046");
  assert.equal(plan.frontendBaseUrl, "http://localhost:3102");
});
