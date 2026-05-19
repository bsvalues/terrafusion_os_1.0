#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { buildJune10ClaimGuardReport } from "./june10-claim-guard.mjs";

function sampleRedTeam() {
  return {
    verdict: "RED",
    summary: {
      shipBlockers: 23,
      seedReceiptsFound: 0,
      bentonCorpusSealed: false,
      readinessStatus: "FAIL"
    },
    bannedNarratives: [
      "39 counties are runtime-ready",
      "Benton full corpus is sealed",
      "TerraFusion is production approved"
    ],
    requiredContainmentPosture: [
      "Treat the readiness packet failure as authoritative until it passes.",
      "Treat Benton corpus evidence as ATTEMPT only until sealed."
    ],
    safestPublicFraming:
      "TerraFusion is in controlled readiness execution. Production and statewide runtime claims remain blocked until the proof gates pass.",
    requiredProofArtifacts: [
      "Passing June 10 readiness packet.",
      "Sealed Benton full-corpus verification, not ATTEMPT."
    ]
  };
}

test("locks public claims when red-team verdict is RED", () => {
  const report = buildJune10ClaimGuardReport({ redTeam: sampleRedTeam() });

  assert.equal(report.guardStatus, "LOCKED");
  assert.equal(report.publicClaimsAllowed, false);
  assert.equal(report.summary.bannedNarratives, 3);
  assert.ok(report.blockedClaims.some((claim) => claim.claim === "39 counties are runtime-ready"));
  assert.ok(report.allowedFraming.includes("controlled readiness execution"));
});

test("flags proposed launch text that includes banned narratives", () => {
  const report = buildJune10ClaimGuardReport({
    redTeam: sampleRedTeam(),
    proposedClaimsText: "TerraFusion is production approved and 39 counties are runtime-ready."
  });

  assert.equal(report.publicClaimsAllowed, false);
  assert.equal(report.summary.proposedClaimViolations, 2);
  assert.ok(report.proposedClaimFindings.some((finding) => finding.matchedNarrative === "TerraFusion is production approved"));
});

test("CLI writes claim guard JSON and Markdown reports", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tf-june10-claim-guard-"));
  const redTeamPath = path.join(tmp, "red-team.json");
  const claimsPath = path.join(tmp, "claims.md");
  const outJson = path.join(tmp, "claim-guard.json");
  const outMd = path.join(tmp, "claim-guard.md");

  fs.writeFileSync(redTeamPath, `${JSON.stringify(sampleRedTeam(), null, 2)}\n`);
  fs.writeFileSync(claimsPath, "Benton full corpus is sealed.\n");

  execFileSync(
    "node",
    [
      "os-platform/core/pilot/june10-claim-guard.mjs",
      "--red-team",
      redTeamPath,
      "--claims",
      claimsPath,
      "--out-json",
      outJson,
      "--out-md",
      outMd
    ],
    { cwd: process.cwd(), stdio: "pipe" }
  );

  const report = JSON.parse(fs.readFileSync(outJson, "utf8"));
  const markdown = fs.readFileSync(outMd, "utf8");

  assert.equal(report.guardStatus, "LOCKED");
  assert.equal(report.summary.proposedClaimViolations, 1);
  assert.match(markdown, /June 10 Claim Guard/);
  assert.match(markdown, /Benton full corpus is sealed/);
});
