import assert from "node:assert/strict";
import test from "node:test";

import { evaluateComposeHealthDependencies } from "./compose-health-dependency-guard.mjs";

test("blocks service_healthy dependency when target service has no healthcheck", () => {
  const report = evaluateComposeHealthDependencies(`
services:
  proxy:
    image: caddy:2.8-alpine
    depends_on:
      frontend:
        condition: service_healthy
  frontend:
    image: nginx:alpine
`);

  assert.equal(report.passed, false);
  assert.equal(report.violations.length, 1);
  assert.equal(report.violations[0].service, "proxy");
  assert.equal(report.violations[0].dependency, "frontend");
});

test("passes service_healthy dependency when target service has a healthcheck", () => {
  const report = evaluateComposeHealthDependencies(`
services:
  proxy:
    image: caddy:2.8-alpine
    depends_on:
      frontend:
        condition: service_healthy
  frontend:
    image: nginx:alpine
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1"]
`);

  assert.equal(report.passed, true);
  assert.equal(report.violations.length, 0);
});

test("passes service_started dependency without a healthcheck", () => {
  const report = evaluateComposeHealthDependencies(`
services:
  proxy:
    image: caddy:2.8-alpine
    depends_on:
      frontend:
        condition: service_started
  frontend:
    image: nginx:alpine
`);

  assert.equal(report.passed, true);
  assert.equal(report.violations.length, 0);
});

