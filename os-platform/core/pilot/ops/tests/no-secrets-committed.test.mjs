import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SCOPES = [
  ".github/workflows",
  "os-platform/core/pilot",
  "ops",
];
const SELF_PATH = path.resolve(
  ROOT,
  "os-platform/core/pilot/ops/tests/no-secrets-committed.test.mjs",
);

const BAD_PATTERNS = [
  /API_TOKEN\s*[:=]\s*["'][^"']+["']/i,
  /HOSTINGER_API_TOKEN\s*[:=]\s*["'][^"']+["']/i,
  new RegExp(["ENTER", "TOKEN", "HERE"].join("_"), "i"),
  /-----BEGIN (RSA|OPENSSH|EC) PRIVATE KEY-----/,
];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;

  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      walk(p, out);
    } else if (ent.isFile()) {
      out.push(p);
    }
  }

  return out;
}

test("no committed secret-like assignments in governed/deploy surfaces", () => {
  const files = SCOPES.flatMap((d) => walk(path.join(ROOT, d))).filter((f) =>
    /\.(ya?ml|json|md|env|sh|mjs|js|ts)$/i.test(f),
  );

  const offenders = [];
  for (const f of files) {
    if (path.resolve(f) === SELF_PATH) continue;
    const txt = fs.readFileSync(f, "utf8");
    for (const re of BAD_PATTERNS) {
      if (re.test(txt)) offenders.push({ file: f, pattern: String(re) });
    }
  }

  assert.equal(
    offenders.length,
    0,
    `Potential secret material found:\n${offenders.map((o) => `- ${o.file} :: ${o.pattern}`).join("\n")}`,
  );
});
