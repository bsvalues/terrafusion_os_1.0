import assert from "node:assert/strict";
import test from "node:test";
import {
  buildRemotePreflightScript,
  parseRemotePreflightOutput,
  parseRootUsePercent
} from "./june10-dev39-backend-deploy-preflight.mjs";

test("parseRootUsePercent extracts root filesystem usage from POSIX df output", () => {
  const df = `Filesystem 1024-blocks Used Available Capacity Mounted on
/dev/sda1 51200000 42000000 7200000 86% /
tmpfs 1000 0 1000 0% /run`;

  assert.equal(parseRootUsePercent(df), 86);
});

test("remote preflight output parser returns before and after root use", () => {
  const output = `BEFORE_USE=86
AFTER_USE=85
BEFORE_DF<<EOF
Filesystem 1024-blocks Used Available Capacity Mounted on
/dev/sda1 51200000 42000000 7200000 86% /
EOF`;

  assert.deepEqual(parseRemotePreflightOutput(output), {
    beforeUsePercent: 86,
    afterUsePercent: 85
  });
});

test("remote preflight script only prunes builder cache and stays inside dev39 app root", () => {
  const script = buildRemotePreflightScript({ appRoot: "/opt/terrafusion/june10-data-dev" });

  assert.match(script, /cd '\/opt\/terrafusion\/june10-data-dev'/);
  assert.match(script, /docker builder prune -af/);
  assert.equal(script.includes("docker image prune"), false);
  assert.equal(script.includes("docker volume prune"), false);
  assert.equal(script.includes("/opt/terrafusion/production"), false);
});
