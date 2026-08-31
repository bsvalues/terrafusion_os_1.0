import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  createPreviewProcessPlan,
  resolveFrontendPort,
} from "../pilot/dev-preview.mjs";

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const PREVIEW_SCRIPT = path.resolve(TEST_DIR, "..", "pilot", "dev-preview.mjs");

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

test("the preview plan builds the API and isolates Vite from an inherited generic port", () => {
  const plan = createPreviewProcessPlan({
    TF_FRONTEND_PORT: "3110",
    PORT: "3000",
    VITE_PORT: "5173",
    KEEP: "value",
  }, "linux");
  assert.deepEqual(plan.backend, {
    command: "pnpm",
    args: ["run", "dev:backend:watch"],
  });
  assert.equal(plan.frontend.command, "pnpm");
  assert.deepEqual(plan.frontend.args, ["run", "dev:frontend"]);
  assert.deepEqual(plan.frontend.env, {
    TF_FRONTEND_PORT: "3110",
    PORT: "3110",
    VITE_PORT: "3110",
    KEEP: "value",
  });
  assert.equal(plan.frontendBaseUrl, "http://localhost:3110");
});
