import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const releaseLane = fs.readFileSync(".github/workflows/release-lane.yml", "utf8");

test("release lane requires provisioned auth secrets without bootstrap credentials", () => {
  assert.match(
    releaseLane,
    /TF_PROVISIONED_AUTH_EMAIL:\s*\$\{\{\s*secrets\.TF_PROVISIONED_AUTH_EMAIL\s*\}\}/,
  );
  assert.match(
    releaseLane,
    /TF_PROVISIONED_AUTH_PASSWORD:\s*\$\{\{\s*secrets\.TF_PROVISIONED_AUTH_PASSWORD\s*\}\}/,
  );
  assert.match(releaseLane, /Missing required environment configuration/);
  assert.doesNotMatch(releaseLane, /TERRAFUSION_BOOTSTRAP_PASSWORD/);
  assert.doesNotMatch(releaseLane, /TF_AUTH_BOOTSTRAP_PASSWORD/);
});

test("release lane verifies provisioned access policy and login token", () => {
  assert.match(releaseLane, /Provisioned auth contract smoke/);
  assert.match(releaseLane, /\/api\/auth\/access-policy/);
  assert.match(releaseLane, /signupMode !== "provisioned_access_only"/);
  assert.match(releaseLane, /publicSignupEnabled !== false/);
  assert.match(releaseLane, /\/api\/auth\/login/);
  assert.match(releaseLane, /response\.token \|\| response\.Token/);
  assert.match(releaseLane, /email !== process\.env\.TF_PROVISIONED_AUTH_EMAIL/);
});

test("release lane does not mutate auth records during deploy", () => {
  assert.doesNotMatch(releaseLane, /dotnet\s+\/app\/tools\/TerraFusion\.AuthProvisioner/);
  assert.doesNotMatch(releaseLane, /TerraFusion\.AuthProvisioner\.dll/);
});
