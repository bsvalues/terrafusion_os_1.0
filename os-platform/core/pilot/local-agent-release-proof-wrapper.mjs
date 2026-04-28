#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const workspaceRoot = process.cwd();
const evidenceDir = path.resolve(workspaceRoot, "os-platform/core/pilot/evidence");
const markerPath = path.resolve(evidenceDir, "local-agent-release-proof.wrapper.json");
const errorPath = path.resolve(evidenceDir, "local-agent-release-proof.error.json");

await fs.mkdir(evidenceDir, { recursive: true });
await fs.rm(errorPath, { force: true });
await fs.writeFile(
  markerPath,
  `${JSON.stringify({ stage: "wrapper-start", cwd: workspaceRoot, ts: new Date().toISOString() }, null, 2)}\n`,
  "utf8"
);

try {
  await import("./local-agent-release-proof.mjs");
  await fs.rm(errorPath, { force: true });
  await fs.writeFile(
    markerPath,
    `${JSON.stringify({ stage: "wrapper-success", cwd: workspaceRoot, ts: new Date().toISOString() }, null, 2)}\n`,
    "utf8"
  );
} catch (error) {
  await fs.writeFile(
    errorPath,
    `${JSON.stringify({
      stage: "wrapper-error",
      cwd: workspaceRoot,
      ts: new Date().toISOString(),
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : null,
    }, null, 2)}\n`,
    "utf8"
  );
  process.exitCode = 1;
}