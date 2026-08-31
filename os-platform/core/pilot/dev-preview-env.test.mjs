import assert from "node:assert/strict";
import test from "node:test";

import { createPreviewBackendEnv, createPreviewRuntimeEnv } from "./dev-preview-env.mjs";

test("preview runtime resolves and pins one canonical frontend and API port", () => {
  const result = createPreviewRuntimeEnv({ PORT: "3200", VITE_PORT: "3300" });

  assert.equal(result.TF_API_PORT, "5046");
  assert.equal(result.TF_FRONTEND_PORT, "3200");
});

test("preview runtime preserves explicit canonical port overrides", () => {
  const result = createPreviewRuntimeEnv({
    TF_API_PORT: "6046",
    TF_FRONTEND_PORT: "4102",
    PORT: "3200",
  });

  assert.equal(result.TF_API_PORT, "6046");
  assert.equal(result.TF_FRONTEND_PORT, "4102");
});

test("preview backend authentication preserves an explicit operator password", () => {
  const source = { TF_PILOT_PASSWORD: "operator-provided", OTHER: "value" };

  const result = createPreviewBackendEnv(source);

  assert.equal(result.TF_PILOT_PASSWORD, "operator-provided");
  assert.equal(result.TF_PILOT_AUTH_MODE, undefined);
  assert.equal(result.OTHER, "value");
  assert.notEqual(result, source);
});

test("preview backend authentication uses the development token without fabricating credentials", () => {
  const source = { OTHER: "value" };

  const result = createPreviewBackendEnv(source);

  assert.equal(source.TF_PILOT_PASSWORD, undefined);
  assert.equal(result.TF_PILOT_PASSWORD, undefined);
  assert.equal(result.TF_PILOT_AUTH_MODE, "dev-token");
  assert.equal(result.OTHER, "value");
});
