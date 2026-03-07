#!/usr/bin/env node
/**
 * Generate docs/evidence/final/manifest.json with SHA256 hashes.
 *
 * Usage:
 *  node tools/r1/generate-final-manifest.mjs <branchHeadSha> <canonVersion>
 *
 * The generator scans docs/evidence/{cc,cx,cp,final} for files (excluding manifest.json),
 * records their repo-relative paths and sha256 hashes.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const REPO_ROOT = process.cwd();
const EVIDENCE_DIR = path.join(REPO_ROOT, "docs", "evidence");
const FINAL_DIR = path.join(EVIDENCE_DIR, "final");
const OUT_PATH = path.join(FINAL_DIR, "manifest.json");

function die(msg) {
  console.error(`\n❌ manifest generation failed:\n- ${msg}\n`);
  process.exit(1);
}

function sha256File(absPath) {
  const buf = fs.readFileSync(absPath);
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function walk(absDir) {
  /** @type {string[]} */
  const out = [];
  for (const ent of fs.readdirSync(absDir, { withFileTypes: true })) {
    const p = path.join(absDir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

function toRepoRel(absPath) {
  return path.relative(REPO_ROOT, absPath).replaceAll("\\", "/");
}

function main() {
  const branchHeadSha = process.argv[2]?.trim();
  const canonVersion = process.argv[3]?.trim();

  if (!branchHeadSha || !/^[0-9a-f]{7,40}$/i.test(branchHeadSha)) {
    die(`branchHeadSha is required and must be sha-like. Example: node tools/r1/generate-final-manifest.mjs <sha> <canonVersion>`);
  }
  if (!canonVersion || canonVersion.length < 3) {
    die(`canonVersion is required (non-trivial string).`);
  }

  if (!fs.existsSync(EVIDENCE_DIR)) die(`Missing docs/evidence/`);
  fs.mkdirSync(FINAL_DIR, { recursive: true });

  const roots = ["cc", "cx", "cp", "final"].map((d) => path.join(EVIDENCE_DIR, d));
  for (const r of roots) if (!fs.existsSync(r)) die(`Missing evidence root: ${toRepoRel(r)}`);

  const files = roots.flatMap((r) => walk(r));
  const artifacts = files
    .filter((f) => path.basename(f) !== "manifest.json") // don't hash the manifest itself
    .map((f) => ({
      path: toRepoRel(f),
      sha256: sha256File(f),
    }))
    .sort((a, b) => a.path.localeCompare(b.path));

  const manifest = {
    branchHeadSha: branchHeadSha.toLowerCase(),
    canonVersion,
    generatedAt: new Date().toISOString(),
    artifacts,
  };

  fs.writeFileSync(OUT_PATH, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  console.log(`✅ Wrote ${toRepoRel(OUT_PATH)} with ${artifacts.length} artifacts`);
}

main();
