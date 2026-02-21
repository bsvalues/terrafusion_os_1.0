import test from "node:test";
import assert from "node:assert/strict";

// ── Inline copies of helpers (deliberate) ────────────────────────
// Avoids coupling tests to git/CI side effects.
// Ensures parsing/scope logic can't silently drift from the guard.

function isInScope(file, scopePatterns) {
  return scopePatterns.some((pat) => {
    const p = pat.replace(/\\/g, "/");
    const f = file.replace(/\\/g, "/");
    if (p.endsWith("/**")) {
      const prefix = p.slice(0, -3);
      return f.startsWith(prefix);
    }
    if (p.endsWith("/")) return f.startsWith(p);
    return f === p || f.startsWith(p + "/");
  });
}

function extractViolationCount(jsonText) {
  const parsed = JSON.parse(jsonText);
  if (typeof parsed.violationCount !== "number") {
    throw new Error("Baseline JSON missing numeric 'violationCount' field.");
  }
  return parsed.violationCount;
}

// ── Scope matcher tests ──────────────────────────────────────────

test("isInScope: matches prefix/** patterns", () => {
  const scope = ["apps/os-shell/**", "packages/ui/**"];
  assert.equal(isInScope("apps/os-shell/src/WindowPeek.tsx", scope), true);
  assert.equal(isInScope("packages/ui/theme/tokens.ts", scope), true);
  assert.equal(isInScope("docs/notes.md", scope), false);
  assert.equal(isInScope("backend/Server.cs", scope), false);
});

test("isInScope: matches trailing slash as prefix", () => {
  const scope = ["os-platform/"];
  assert.equal(isInScope("os-platform/core/pilot/index.ts", scope), true);
  assert.equal(isInScope("os-plat/core/pilot/index.ts", scope), false);
});

test("isInScope: exact path match", () => {
  const scope = ["tsconfig.core.json"];
  assert.equal(isInScope("tsconfig.core.json", scope), true);
  assert.equal(isInScope("tsconfig.json", scope), false);
});

test("isInScope: normalizes backslashes to forward slashes", () => {
  const scope = ["apps/os-shell/**"];
  assert.equal(isInScope("apps\\os-shell\\src\\App.tsx", scope), true);
});

test("isInScope: returns false for empty scope", () => {
  assert.equal(isInScope("any/file.ts", []), false);
});

// ── Violation count extraction tests ─────────────────────────────

test("extractViolationCount: reads integer from valid baseline JSON", () => {
  const json = JSON.stringify({
    contract: "ui-token-baseline.json",
    version: "v1",
    scopeHash: "abc123",
    violationCount: 3118,
    generatedAtIso: "2026-02-20T01:31:27.821Z",
  });
  assert.equal(extractViolationCount(json), 3118);
});

test("extractViolationCount: reads zero", () => {
  assert.equal(extractViolationCount('{"violationCount": 0}'), 0);
});

test("extractViolationCount: throws on missing field", () => {
  assert.throws(
    () => extractViolationCount('{"count": 42}'),
    /missing numeric 'violationCount'/
  );
});

test("extractViolationCount: throws on non-numeric field", () => {
  assert.throws(
    () => extractViolationCount('{"violationCount": "many"}'),
    /missing numeric 'violationCount'/
  );
});

test("extractViolationCount: throws on invalid JSON", () => {
  assert.throws(() => extractViolationCount("not json"));
});

// ── Delta logic (table-driven) ───────────────────────────────────

test("delta logic: improvement is base - head (positive = good)", () => {
  // Simulate the guard's comparison logic
  const cases = [
    { base: 3118, head: 3116, minDelta: 1, shouldPass: true },
    { base: 3118, head: 3118, minDelta: 1, shouldPass: false },
    { base: 3118, head: 3119, minDelta: 1, shouldPass: false },
    { base: 3118, head: 3117, minDelta: 1, shouldPass: true },
    { base: 100, head: 95, minDelta: 3, shouldPass: true },
    { base: 100, head: 98, minDelta: 3, shouldPass: false },
    { base: 0, head: 0, minDelta: 1, shouldPass: false },
  ];

  for (const { base, head, minDelta, shouldPass } of cases) {
    const delta = base - head;
    const result = delta >= minDelta;
    assert.equal(
      result,
      shouldPass,
      `base=${base} head=${head} minDelta=${minDelta}: expected ${shouldPass ? "pass" : "fail"}`
    );
  }
});
