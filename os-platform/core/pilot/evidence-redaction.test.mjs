import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { scanEvidenceDirectory } from "./evidence-credential-guard.mjs";
import {
  REDACTION_MARKER,
  findEvidenceCredentialFindings,
  redactEvidence,
  redactEvidenceText,
  stringifyEvidence,
} from "./evidence-redaction.mjs";

const PILOT_DIRECTORY = path.resolve(process.cwd(), "os-platform/core/pilot");

test("deep evidence redaction removes credential fields and compact JWTs", () => {
  const fixtureJwt =
    "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJub3QtYS1yZWFsLXRva2VuIn0.fixture-signature-only";
  const evidence = {
    safe: "operator probe completed",
    nested: {
      token: fixtureJwt,
      stdout: `response={\"access_token\":\"${fixtureJwt}\"}`,
      authorization: `Bearer ${fixtureJwt}`,
      password: "fixture-password",
      cookie: "session=fixture-cookie",
    },
  };

  const redacted = redactEvidence(evidence);
  const serialized = stringifyEvidence(evidence);

  assert.equal(redacted.safe, evidence.safe);
  assert.equal(redacted.nested.token, REDACTION_MARKER);
  assert.equal(redacted.nested.authorization, REDACTION_MARKER);
  assert.equal(redacted.nested.password, REDACTION_MARKER);
  assert.equal(redacted.nested.cookie, REDACTION_MARKER);
  assert.ok(!serialized.includes(fixtureJwt));
  assert.equal(findEvidenceCredentialFindings(JSON.parse(serialized)).length, 0);
});

test("text redaction handles bearer and assignment representations", () => {
  const fixtureJwt =
    "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJub3QtYS1yZWFsLXRva2VuIn0.fixture-signature-only";
  const input = `Authorization: Bearer ${fixtureJwt}\npassword=fixture-password`;
  const redacted = redactEvidenceText(input);

  assert.ok(!redacted.includes(fixtureJwt));
  assert.ok(!redacted.includes("fixture-password"));
  assert.match(redacted, /\[REDACTED\]/);
});

test("text redaction handles generic compact tokens, Basic auth, and cookies", () => {
  const alternateCompactToken =
    "IHsiYWxnIjoiSFMyNTYifQ.eyJzdWIiOiJub3QtYS1yZWFsLXRva2VuIn0.c2lnbmF0dXJlLWZpeHR1cmU";
  const input = [
    alternateCompactToken,
    "Authorization: Basic Zml4dHVyZTpub3QtYS1jcmVkZW50aWFs",
    "Cookie: session=fixture-cookie; secure=true",
  ].join("\n");
  const redacted = redactEvidenceText(input);

  assert.ok(!redacted.includes(alternateCompactToken));
  assert.ok(!redacted.includes("Zml4dHVyZTpub3QtYS1jcmVkZW50aWFs"));
  assert.ok(!redacted.includes("fixture-cookie"));
  assert.equal(findEvidenceCredentialFindings(redacted).length, 0);
});

test("all current Pilot evidence is free of populated credential material", async () => {
  const results = await scanEvidenceDirectory();
  assert.deepEqual(
    results.map((result) => ({
      file: path.relative(process.cwd(), result.filePath),
      kinds: [...new Set(result.findings.map((finding) => finding.kind))].sort(),
      count: result.findings.length,
    })),
    []
  );
});

test("credential-bearing packet generators use the shared evidence boundary", async () => {
  const packetFiles = [
    "phase6-promotion-packet.mjs",
    "phase7-deployment-alignment-packet.mjs",
    "phase8-deployed-operator-parity-packet.mjs",
    "phase9-runtime-role-separation-packet.mjs",
    "phase12-pacs-connected-runtime-packet.mjs",
    "phase13-snapshot-promotion-packet.mjs",
    "phase17-go-live-packet.mjs",
    "phase18-pacs-runtime-productization-packet.mjs",
    "phase19-snapshot-promotion-automation-packet.mjs",
  ];

  for (const packetFile of packetFiles) {
    const source = await fs.readFile(path.join(PILOT_DIRECTORY, packetFile), "utf8");
    assert.match(source, /stringifyEvidence\(/, `${packetFile} must sanitize serialized evidence`);
    if (packetFile !== "phase8-deployed-operator-parity-packet.mjs") {
      assert.match(source, /redactEvidenceText\(/, `${packetFile} must sanitize mirrored child output`);
    }
  }
});

test("Pilot source contains no historical production-style password fallback", async () => {
  const entries = await fs.readdir(PILOT_DIRECTORY, { withFileTypes: true });
  const sourceFiles = entries
    .filter((entry) => entry.isFile() && /\.(?:mjs|js|ts)$/.test(entry.name))
    .map((entry) => entry.name);

  const offenders = [];
  for (const sourceFile of sourceFiles) {
    const source = await fs.readFile(path.join(PILOT_DIRECTORY, sourceFile), "utf8");
    const historicalFallback = ["Terra", "Fusion", "2026", "!"].join("");
    if (source.includes(historicalFallback)) offenders.push(sourceFile);
  }

  assert.deepEqual(offenders, []);
});
