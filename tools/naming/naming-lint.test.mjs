import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { runNamingLint } from "./naming-lint.mjs";

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "tf-naming-lint-"));
}

function write(p, content) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, "utf8");
}

function capture() {
  let out = "";
  let err = "";
  return {
    stdout: { write: (s) => void (out += s) },
    stderr: { write: (s) => void (err += s) },
    out: () => out,
    err: () => err,
  };
}

test("passes when banned phrase is absent", async () => {
  const root = tmpDir();
  write(path.join(root, "README.md"), "Hello Pillar Studio\n");
  write(path.join(root, "docs/spec.md"), "No placeholder here.\n");

  const cfg = {
    version: 1,
    root: ".",
    bannedPhrases: [{ phrase: "TerraFusion IDE", message: "nope" }],
    extensions: [".md"],
    excludeDirs: [".git", "node_modules"],
    excludeFiles: [],
    maxFileBytes: 2000000,
    required: [],
  };

  const cfgPath = path.join(root, "naming-lint.config.json");
  fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2), "utf8");

  const io = capture();
  const code = await runNamingLint({
    argv: ["node", "naming-lint.mjs", "--config", cfgPath, "--root", root],
    cwd: root,
    stdout: io.stdout,
    stderr: io.stderr,
  });

  assert.equal(code, 0);
  assert.match(io.out(), /No banned product labels/i);
});

test("fails when banned phrase is present and reports file:line:col", async () => {
  const root = tmpDir();
  write(path.join(root, "a.md"), "TerraFusion IDE is here\n");

  const cfg = {
    version: 1,
    root: ".",
    bannedPhrases: [{ phrase: "TerraFusion IDE", message: "placeholder label" }],
    extensions: [".md"],
    excludeDirs: [".git", "node_modules"],
    excludeFiles: [],
    maxFileBytes: 2000000,
    required: [],
  };

  const cfgPath = path.join(root, "naming-lint.config.json");
  fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2), "utf8");

  const io = capture();
  const code = await runNamingLint({
    argv: ["node", "naming-lint.mjs", "--config", cfgPath, "--root", root],
    cwd: root,
    stdout: io.stdout,
    stderr: io.stderr,
  });

  assert.equal(code, 1);
  assert.match(io.out(), /a\.md:1:1/);
  assert.match(io.out(), /TerraFusion IDE/);
});

test("--json output is stable and includes violations[]", async () => {
  const root = tmpDir();
  write(path.join(root, "a.md"), "TerraFusion IDE\n");

  const cfg = {
    version: 1,
    root: ".",
    bannedPhrases: [{ phrase: "TerraFusion IDE", message: "placeholder label" }],
    extensions: [".md"],
    excludeDirs: [".git", "node_modules"],
    excludeFiles: [],
    maxFileBytes: 2000000,
    required: [],
  };

  const cfgPath = path.join(root, "naming-lint.config.json");
  fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2), "utf8");

  const io = capture();
  const code = await runNamingLint({
    argv: ["node", "naming-lint.mjs", "--json", "--config", cfgPath, "--root", root],
    cwd: root,
    stdout: io.stdout,
    stderr: io.stderr,
  });

  assert.equal(code, 1);
  const parsed = JSON.parse(io.out());
  assert.equal(parsed.tool, "naming-lint");
  assert.equal(parsed.version, 1);
  assert.ok(Array.isArray(parsed.violations));
  assert.ok(parsed.violations.length >= 1);
  assert.equal(parsed.violations[0].phrase, "TerraFusion IDE");
});

test("skips excluded directories", async () => {
  const root = tmpDir();
  write(path.join(root, "node_modules/x.md"), "TerraFusion IDE\n");
  write(path.join(root, "ok.md"), "clean\n");

  const cfg = {
    version: 1,
    root: ".",
    bannedPhrases: [{ phrase: "TerraFusion IDE", message: "placeholder label" }],
    extensions: [".md"],
    excludeDirs: [".git", "node_modules"],
    excludeFiles: [],
    maxFileBytes: 2000000,
    required: [],
  };

  const cfgPath = path.join(root, "naming-lint.config.json");
  fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2), "utf8");

  const io = capture();
  const code = await runNamingLint({
    argv: ["node", "naming-lint.mjs", "--config", cfgPath, "--root", root],
    cwd: root,
    stdout: io.stdout,
    stderr: io.stderr,
  });

  assert.equal(code, 0);
});
