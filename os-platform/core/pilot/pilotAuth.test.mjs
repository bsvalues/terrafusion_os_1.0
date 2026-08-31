import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const { acquirePilotToken, clearPilotToken } = require("./pilotAuth.js");

test("Pilot uses the backend development-token endpoint when explicitly selected", async () => {
  const originalFetch = globalThis.fetch;
  const originalMode = process.env.TF_PILOT_AUTH_MODE;
  const originalPassword = process.env.TF_PILOT_PASSWORD;

  try {
    process.env.TF_PILOT_AUTH_MODE = "dev-token";
    delete process.env.TF_PILOT_PASSWORD;
    clearPilotToken();

    globalThis.fetch = async (url, options) => {
      assert.equal(url, "http://localhost:5046/api/auth/dev-token");
      assert.equal(options.method, "GET");
      return new Response(
        JSON.stringify({
          token: "development-token",
          expiresIn: 7200,
          countyId: "benton-id",
          countyCode: "benton",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    };

    const result = await acquirePilotToken();

    assert.equal(result.token, "development-token");
    assert.equal(result.email, "dev@terrafusion.local");
    assert.deepEqual(result.roles, ["Developer", "Assessor", "GovernmentUser"]);
    assert.ok(result.expiresAt.getTime() > Date.now() + 60 * 60 * 1000);
  } finally {
    clearPilotToken();
    globalThis.fetch = originalFetch;
    if (originalMode === undefined) delete process.env.TF_PILOT_AUTH_MODE;
    else process.env.TF_PILOT_AUTH_MODE = originalMode;
    if (originalPassword === undefined) delete process.env.TF_PILOT_PASSWORD;
    else process.env.TF_PILOT_PASSWORD = originalPassword;
  }
});
