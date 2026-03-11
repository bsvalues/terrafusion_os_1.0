// os-platform/core/tests/doc-truth-audit.test.mjs
// Truth-lint regression defense for evidence docs.
// Goal: prevent overclaims from re-entering main after audits.
//
// Run via: node --test os-platform/core/tests/doc-truth-audit.test.mjs
//
// Notes:
// - This is intentionally opinionated about specific overclaim patterns.
// - Keep assertions tight and evidence-backed.
// - If reality changes (new proof added), update the docs AND the assertions together.

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function repoPath(...parts) {
  // Resolve relative to repo root (assumes tests live under os-platform/core/tests/)
  // os-platform/core/tests -> repo root is ../../..
  return path.resolve(process.cwd(), ...parts);
}

function readUtf8(p) {
  assert.ok(fs.existsSync(p), `Expected file to exist: ${p}`);
  return fs.readFileSync(p, "utf8");
}

function mustNotMatch(haystack, regex, message) {
  assert.ok(
    !regex.test(haystack),
    message ?? `Expected NOT to match ${regex}, but it did.`
  );
}

function mustMatch(haystack, regex, message) {
  assert.ok(regex.test(haystack), message ?? `Expected to match ${regex}, but it did not.`);
}

test("doc truth audit: production-readiness-accounting.md must not overclaim UI smoke closure from health checks", () => {
  const file = repoPath("os-platform", "core", "pilot", "production-readiness-accounting.md");
  const md = readUtf8(file);

  // Guardrail 1: forbid the specific logical fallacy
  // "health endpoint 200" cannot be framed as closing "9-tab workbench smoke" fully.
  //
  // We disallow combinations that imply:
  // - 9-tab workbench AND
  // - CLOSED (or equivalent) AND
  // - health endpoint / HTTP 200 used as the closure rationale
  //
  // This is a "tripwire" — it should be hard to accidentally trip unless someone reintroduces the overclaim.
  const overclaimPattern =
    /(9[\s-]?tab|nine[\s-]?tab)[\s\S]{0,220}(CLOSED|Closed|closed|resolved|done)[\s\S]{0,220}(health|endpoint|HTTP\s*200|200\s*OK)/;

  mustNotMatch(
    md,
    overclaimPattern,
    "Overclaim detected: 9-tab workbench smoke appears to be marked CLOSED based on health/HTTP 200 evidence."
  );

  // Guardrail 1b: we *expect* the honest state to exist somewhere:
  // it should communicate partial closure / qualifier language.
  // We keep this loose to avoid brittle phrasing constraints.
  const honestQualifier =
    /(PARTIALLY\s+CLOSED|Partially\s+closed|partial\s+closure|health\s+endpoints?\s+verified[\s\S]*workbench[\s\S]*(not\s+proven|unexercised|not\s+yet\s+validated))/i;

  mustMatch(
    md,
    honestQualifier,
    "Expected an honesty qualifier: health endpoints verified but full workbench/tab render smoke remains unproven/unexercised."
  );
});

test("doc truth audit: production-approval-memo.md must scope release-path verification claims to staging when evidence is staging", () => {
  const file = repoPath("os-platform", "core", "pilot", "ops", "production-approval-memo.md");
  const md = readUtf8(file);

  // Guardrail 2: every occurrence of "release-path verification complete" must have
  // "staging" within an 80-char window on either side. Uses matchAll instead of
  // variable-length lookbehind for portability across Node versions.
  const matches = [...md.matchAll(/release-path verification complete/gi)];
  assert.ok(matches.length > 0, "Expected at least one 'release-path verification complete' occurrence.");

  for (const m of matches) {
    const start = Math.max(0, m.index - 80);
    const end = Math.min(md.length, m.index + m[0].length + 80);
    const window = md.slice(start, end);
    assert.ok(
      /\bstaging\b/i.test(window),
      `Unscoped claim detected near: "${window.replace(/\s+/g, " ").slice(0, 160)}..."`
    );
  }

  // Positive expectation: staging is explicitly named in the proven-claims area.
  mustMatch(
    md,
    /\bstaging\b[\s\S]{0,120}Release-path verification/i,
    "Expected staging-scoped release-path verification language (staging explicitly named near the release-path verification claim)."
  );
});

test("doc truth audit: hostinger-control-plane.md must not reintroduce stale 'production not approved until...' gate note", () => {
  const file = repoPath("os-platform", "core", "pilot", "ops", "hostinger-control-plane.md");
  const md = readUtf8(file);

  // Guardrail 3: ban the stale gate note phrasing (or close variants).
  // We keep this fairly direct because it's a known stale sentence that must not come back.
  const staleGate =
    /Production is not approved until[\s\S]{0,240}(production target|same live proof sequence|completed against the production)/i;

  mustNotMatch(
    md,
    staleGate,
    "Stale gate note detected: hostinger-control-plane.md appears to say production is not approved until another proof sequence is completed."
  );

  // Positive expectation: presence of a factual reference to completed production proof and staging re-verification.
  // Keep flexible; just require that it mentions both production proof and staging re-verification concepts.
  mustMatch(
    md,
    /\bproduction\b[\s\S]{0,240}\b(proven|proof|4-dispatch)\b/i,
    "Expected hostinger-control-plane.md to reference completed production proof (e.g., 'proven/proof/4-dispatch')."
  );
  mustMatch(
    md,
    /\bstaging\b[\s\S]{0,240}\b(re-?verification|verified|proof)\b/i,
    "Expected hostinger-control-plane.md to reference staging re-verification / verification."
  );
});
