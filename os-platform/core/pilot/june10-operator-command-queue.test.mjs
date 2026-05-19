#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { buildJune10OperatorCommandQueue } from "./june10-operator-command-queue.mjs";

function sampleWarRoomStatus() {
  return {
    warRoomVerdict: "NO_GO",
    activeLane: "WAITING_SYNC_DB_EVIDENCE",
    firstUnblockCommand: "pnpm run truth:terrafusion-db-product-load-ledger",
    stopWork: [
      "Do not claim June 10 production approval.",
      "Do not run Benton closure until Sync evidence intake is accepted."
    ],
    nextCommands: [
      "pnpm run truth:terrafusion-db-product-load-ledger",
      "pnpm run truth:benton-runtime-pilot-closure",
      "pnpm run truth:june10-red-team",
      "pnpm run truth:june10-war-room-status"
    ]
  };
}

test("allows only the first unblock command while war-room verdict is NO_GO", () => {
  const queue = buildJune10OperatorCommandQueue({ warRoomStatus: sampleWarRoomStatus() });

  assert.equal(queue.queueStatus, "FIRST_UNBLOCK_ONLY");
  assert.equal(queue.summary.activeCommands, 1);
  assert.equal(queue.summary.blockedCommands, 3);
  assert.equal(queue.commands[0].command, "pnpm run truth:terrafusion-db-product-load-ledger");
  assert.equal(queue.commands[0].status, "ACTIVE");
  assert.ok(queue.commands.slice(1).every((item) => item.status === "BLOCKED_BY_FIRST_UNBLOCK"));
});

test("instructs operators to run the ordered refresh after the active command completes", () => {
  const queue = buildJune10OperatorCommandQueue({ warRoomStatus: sampleWarRoomStatus() });

  assert.ok(
    queue.rules.includes(
      "Run pnpm run truth:june10-control-plane-refresh after the active command completes."
    )
  );
  assert.ok(!queue.rules.some((rule) => rule.includes("Regenerate war-room status after")));
});

test("surfaces material no-op refresh state as a wait condition", () => {
  const queue = buildJune10OperatorCommandQueue({
    warRoomStatus: sampleWarRoomStatus(),
    controlPlaneRefresh: {
      refreshStatus: "PASS",
      summary: {
        materialStateChanged: false,
        materialChangedArtifacts: 0,
        materialUnchangedArtifacts: 7
      }
    }
  });

  assert.equal(queue.summary.lastRefreshMaterialStateChanged, false);
  assert.equal(queue.summary.lastRefreshMaterialChangedArtifacts, 0);
  assert.ok(
    queue.stopWork.includes(
      "Latest control-plane refresh changed no material artifacts; wait for new Sync/DB evidence before rerunning blocked commands."
    )
  );
});

test("turns missing war-room status into a stop-work queue", () => {
  const queue = buildJune10OperatorCommandQueue({ warRoomStatus: null });

  assert.equal(queue.queueStatus, "STOP_WORK");
  assert.equal(queue.summary.activeCommands, 0);
  assert.ok(queue.stopWork.includes("Do not run June 10 commands until war-room status exists."));
});

test("CLI writes operator command queue JSON and Markdown reports", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tf-june10-command-queue-"));
  const paths = {
    warRoom: path.join(tmp, "war-room.json"),
    outJson: path.join(tmp, "queue.json"),
    outMd: path.join(tmp, "queue.md")
  };

  fs.writeFileSync(paths.warRoom, `${JSON.stringify(sampleWarRoomStatus(), null, 2)}\n`);

  execFileSync(
    "node",
    [
      "os-platform/core/pilot/june10-operator-command-queue.mjs",
      "--war-room",
      paths.warRoom,
      "--out-json",
      paths.outJson,
      "--out-md",
      paths.outMd
    ],
    { cwd: process.cwd(), stdio: "pipe" }
  );

  const queue = JSON.parse(fs.readFileSync(paths.outJson, "utf8"));
  const markdown = fs.readFileSync(paths.outMd, "utf8");

  assert.equal(queue.queueStatus, "FIRST_UNBLOCK_ONLY");
  assert.match(markdown, /June 10 Operator Command Queue/);
  assert.match(markdown, /BLOCKED_BY_FIRST_UNBLOCK/);
});
