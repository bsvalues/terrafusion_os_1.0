/**
 * Agent envelope – Phase 3 unit tests
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createEnvelope } from "../lib/agent-envelope.mjs";

describe("agent-envelope", () => {
  it("finish() produces a valid envelope", () => {
    const env = createEnvelope("tf-test-tool");
    const result = env.finish(true, { count: 42 });

    assert.equal(result.tool, "tf-test-tool");
    assert.equal(result.version, 1);
    assert.equal(result.ok, true);
    assert.deepEqual(result.data, { count: 42 });
    assert.equal(result.error, null);
    assert.equal(typeof result.ts, "string");
    assert.equal(typeof result.meta.durationMs, "number");
  });

  it("fail() produces an error envelope", () => {
    const env = createEnvelope("tf-fail-test");
    const result = env.fail(new Error("something broke"));

    assert.equal(result.ok, false);
    assert.equal(result.data, null);
    assert.equal(result.error, "something broke");
    assert.equal(result.tool, "tf-fail-test");
  });

  it("fail() accepts string errors", () => {
    const env = createEnvelope("tf-str-err");
    const result = env.fail("plain string error");

    assert.equal(result.ok, false);
    assert.equal(result.error, "plain string error");
  });

  it("custom version number is preserved", () => {
    const env = createEnvelope("tf-versioned", 2);
    const result = env.finish(true, {});

    assert.equal(result.version, 2);
  });

  it("durationMs is non-negative", () => {
    const env = createEnvelope("tf-timing");
    const result = env.finish(true, {});

    assert.ok(result.meta.durationMs >= 0, "duration should be >= 0");
  });
});
