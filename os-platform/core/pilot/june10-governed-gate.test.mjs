#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"));

test("governed-spine gate exercises the June 10 control-plane test suite", () => {
  const governed = packageJson.scripts["test:governed"] ?? "";

  assert.match(governed, /pnpm run type-check/);
  assert.match(governed, /node --test os-platform\/core\/tests\/phase83-tools\.test\.mjs/);
  assert.match(governed, /node --test os-platform\/core\/pilot\/june10-\*\.test\.mjs/);
});

test("June 10 ordered refresh command is registered as an operator truth gate", () => {
  assert.equal(
    packageJson.scripts["truth:june10-control-plane-refresh"],
    "node os-platform/core/pilot/june10-control-plane-refresh.mjs"
  );
});
