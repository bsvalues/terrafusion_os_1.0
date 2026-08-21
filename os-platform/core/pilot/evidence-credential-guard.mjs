#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  REDACTION_MARKER,
  findEvidenceCredentialFindings,
  redactEvidence,
  redactEvidenceText,
} from "./evidence-redaction.mjs";

const EVIDENCE_DIRECTORY = path.resolve(
  process.cwd(),
  "os-platform/core/pilot/evidence"
);

async function listJsonFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) return listJsonFiles(target);
      return entry.isFile() && entry.name.endsWith(".json") ? [target] : [];
    })
  );
  return nested.flat().sort();
}

function addRedactionMetadata(value, findings) {
  const sanitized = redactEvidence(value);
  if (sanitized === null || Array.isArray(sanitized) || typeof sanitized !== "object") {
    return sanitized;
  }

  return {
    ...sanitized,
    redaction: {
      schemaVersion: 1,
      status: "sanitized",
      replacement: REDACTION_MARKER,
      originalValuesRemoved: true,
      categories: [...new Set(findings.map((finding) => finding.kind))].sort(),
      occurrenceCount: findings.length,
    },
  };
}

export async function scanEvidenceDirectory(directory = EVIDENCE_DIRECTORY) {
  const results = [];
  for (const filePath of await listJsonFiles(directory)) {
    const source = await fs.readFile(filePath, "utf8");
    // Inspect the raw artifact before JSON.parse can collapse duplicate members.
    // The structured text detector also visits the parsed value, so this covers
    // both source-level and ordinary parsed-object credential representations.
    const findings = findEvidenceCredentialFindings(source);
    // Preserve the guard's fail-closed JSON validity contract even when the raw
    // source has no credential finding.
    JSON.parse(source);
    if (findings.length > 0) {
      results.push({ filePath, findings, source });
    }
  }
  return results;
}

export async function sanitizeEvidenceDirectory(directory = EVIDENCE_DIRECTORY) {
  const results = await scanEvidenceDirectory(directory);
  for (const result of results) {
    // Sanitize the raw representation before parsing so an earlier populated
    // duplicate cannot be discarded by last-member-wins JSON semantics.
    const sanitizedSource = redactEvidenceText(result.source);
    const sanitizedValue = JSON.parse(sanitizedSource);
    const sanitized = addRedactionMetadata(sanitizedValue, result.findings);
    await fs.writeFile(result.filePath, `${JSON.stringify(sanitized, null, 2)}\n`, "utf8");
  }
  return results.map(({ filePath, findings }) => ({ filePath, findings }));
}

async function main() {
  const write = process.argv.slice(2).includes("--write");
  const results = write
    ? await sanitizeEvidenceDirectory()
    : (await scanEvidenceDirectory()).map(({ filePath, findings }) => ({ filePath, findings }));

  for (const result of results) {
    const relativePath = path.relative(process.cwd(), result.filePath);
    process.stdout.write(`${relativePath}: ${result.findings.length} credential finding(s)\n`);
  }

  if (write) {
    const remaining = await scanEvidenceDirectory();
    if (remaining.length > 0) {
      process.stderr.write("Evidence credential sanitation did not converge.\n");
      process.exitCode = 1;
      return;
    }
    process.stdout.write(`Sanitized ${results.length} evidence file(s).\n`);
    return;
  }

  if (results.length > 0) {
    process.stderr.write("Credential material is present in Pilot evidence.\n");
    process.exitCode = 1;
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  await main();
}
