#!/usr/bin/env node
/**
 * R1 Evidence Verifier (Node .mjs)
 *
 * Enforces:
 *  - Required metadata fields in each lane signoff
 *  - Same verified branch-head SHA across all lanes
 *  - Same command canon version across all lanes
 *  - Evidence links restricted to lane folder + docs/evidence/final
 *  - Linked evidence files exist
 *  - Optional: validate docs/evidence/final/manifest.json (paths + sha256)
 *
 * Usage:
 *  node tools/r1/verify-evidence.mjs
 *
 * Exit codes:
 *  0: OK
 *  1: Validation failed
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const REPO_ROOT = process.cwd();

const DOCS_DIR = path.join(REPO_ROOT, "docs");
const EVIDENCE_DIR = path.join(DOCS_DIR, "evidence");

const LANES = /** @type {const} */ (["cc", "cx", "cp"]);
/** @type {Record<"cc"|"cx"|"cp", string>} */
const SIGNOFF_PATHS = {
  cc: path.join(EVIDENCE_DIR, "cc", "signoff.md"),
  cx: path.join(EVIDENCE_DIR, "cx", "signoff.md"),
  cp: path.join(EVIDENCE_DIR, "cp", "signoff.md"),
};

const REQUIRED_FIELDS = [
  "Lane",
  "Lane branch name",
  "Lane branch HEAD SHA (pre-merge)",
  "Merge commit SHA (into r1/integration)",
  "Baseline r1/integration SHA used for lane work",
  "Final branch-head SHA used for verification",
  "Date (local)",
  "Verified by",
  "Command canon version",
];

/** Fail fast with a crisp message. */
function die(msg) {
  console.error(`\n❌ R1 evidence verification failed:\n- ${msg}\n`);
  process.exit(1);
}

function readText(filePath) {
  if (!fs.existsSync(filePath)) {
    die(`Missing file: ${path.relative(REPO_ROOT, filePath)}`);
  }
  return fs.readFileSync(filePath, "utf8");
}

function isShaLike(v) {
  const s = String(v).trim();
  return /^[0-9a-f]{7,40}$/i.test(s);
}

function parseMetadata(md, lane) {
  /** @type {Record<string, string>} */
  const meta = {};
  const lines = md.split(/\r?\n/);

  for (const line of lines) {
    const m = line.match(/^\s*-\s*([^:]+):\s*(.+)\s*$/);
    if (!m) continue;
    meta[m[1].trim()] = m[2].trim();
  }

  for (const req of REQUIRED_FIELDS) {
    if (!meta[req] || meta[req].trim().length === 0) {
      die(`[${lane}] Missing required metadata field: "${req}"`);
    }
  }

  const laneVal = meta["Lane"].toLowerCase().trim();
  if (laneVal !== lane) {
    die(`[${lane}] "Lane" field must be "${lane}" (got "${meta["Lane"]}")`);
  }

  const shaFields = [
    "Lane branch HEAD SHA (pre-merge)",
    "Merge commit SHA (into r1/integration)",
    "Baseline r1/integration SHA used for lane work",
    "Final branch-head SHA used for verification",
  ];

  for (const f of shaFields) {
    if (!isShaLike(meta[f])) {
      die(`[${lane}] Field "${f}" is not a SHA-like value: "${meta[f]}"`);
    }
  }

  // Canon version can be a SHA or a stable identifier; enforce non-empty & non-trivial.
  const canon = meta["Command canon version"].trim();
  if (canon.length < 3) {
    die(`[${lane}] "Command canon version" looks invalid: "${meta["Command canon version"]}"`);
  }

  return meta;
}

/**
 * Extract markdown links: [text](target)
 * Excludes images: ![...](...)
 * @returns {string[]}
 */
function extractMarkdownLinks(md) {
  const links = [];
  const re = /(^|[^!])\[[^\]]*]\(([^)]+)\)/g;
  let m;
  while ((m = re.exec(md)) !== null) {
    links.push(m[2].trim());
  }
  return links;
}

function stripFragment(target) {
  return target.split("#")[0].trim();
}

function toPosix(p) {
  return p.replaceAll("\\", "/");
}

/**
 * Resolve a link target to an absolute file path.
 * Supports:
 *  - signoff-relative links: ./forge-cutover.md
 *  - repo-relative links: docs/evidence/cc/forge-cutover.md
 *  - absolute-from-repo-style: /docs/evidence/cc/forge-cutover.md
 *
 * For signoff-relative, resolves against the directory containing signoff.md.
 */
function resolveLinkAbs(signoffPath, rawTarget) {
  const target = stripFragment(rawTarget);

  if (/^[a-z]+:\/\//i.test(target)) {
    die(`External URL links are not allowed in signoffs: ${rawTarget}`);
  }

  // "/docs/..." => repo-root relative
  if (target.startsWith("/")) {
    return path.join(REPO_ROOT, target.slice(1));
  }

  // "./..." or "../..." => signoff-relative
  if (target.startsWith("./") || target.startsWith("../")) {
    return path.resolve(path.dirname(signoffPath), target);
  }

  // "docs/..." or "tools/..." => repo-root relative
  return path.join(REPO_ROOT, target);
}

/**
 * Enforce that abs path stays inside allowed evidence roots.
 */
function assertAllowedEvidencePath(lane, absPath) {
  const laneRoot = path.join(EVIDENCE_DIR, lane);
  const finalRoot = path.join(EVIDENCE_DIR, "final");

  const normAbs = path.normalize(absPath);

  const inLane = normAbs === laneRoot || normAbs.startsWith(laneRoot + path.sep);
  const inFinal = normAbs === finalRoot || normAbs.startsWith(finalRoot + path.sep);

  if (!inLane && !inFinal) {
    die(
      `[${lane}] Evidence link escapes allowed roots.\n` +
        `  Resolved: ${path.relative(REPO_ROOT, normAbs)}\n` +
        `  Allowed: docs/evidence/${lane}/... or docs/evidence/final/...`
    );
  }
}

/**
 * Verify link containment + existence.
 */
function verifyLinksInSignoff(lane, signoffPath, md) {
  const links = extractMarkdownLinks(md);
  for (const raw of links) {
    const abs = resolveLinkAbs(signoffPath, raw);
    assertAllowedEvidencePath(lane, abs);
    if (!fs.existsSync(abs)) {
      die(`[${lane}] Linked evidence file does not exist: ${path.relative(REPO_ROOT, abs)} (from ${raw})`);
    }
  }
}

function sha256File(absPath) {
  const buf = fs.readFileSync(absPath);
  return crypto.createHash("sha256").update(buf).digest("hex");
}

/**
 * Optional: validate docs/evidence/final/manifest.json if present.
 * Shape:
 * {
 *   "branchHeadSha": "<sha>",
 *   "canonVersion": "<string>",
 *   "artifacts": [
 *     { "path": "docs/evidence/cc/forge-cutover.md", "sha256": "<hex>" }
 *   ]
 * }
 */
function validateFinalManifest(expectedBranchHeadSha, expectedCanonVersion) {
  const manifestPath = path.join(EVIDENCE_DIR, "final", "manifest.json");
  if (!fs.existsSync(manifestPath)) return; // optional

  let manifest;
  try {
    manifest = JSON.parse(readText(manifestPath));
  } catch {
    die(`final manifest is not valid JSON: ${path.relative(REPO_ROOT, manifestPath)}`);
  }

  if (!manifest || typeof manifest !== "object") {
    die(`final manifest has invalid structure: ${path.relative(REPO_ROOT, manifestPath)}`);
  }

  const mh = String(manifest.branchHeadSha ?? "").trim().toLowerCase();
  const cv = String(manifest.canonVersion ?? "").trim();

  if (!isShaLike(mh)) {
    die(`final manifest missing/invalid branchHeadSha: ${path.relative(REPO_ROOT, manifestPath)}`);
  }
  if (mh !== expectedBranchHeadSha) {
    die(
      `final manifest branchHeadSha mismatch.\n` +
        `  manifest: ${mh}\n` +
        `  expected: ${expectedBranchHeadSha}`
    );
  }

  if (!cv || cv.length < 3) {
    die(`final manifest missing/invalid canonVersion: ${path.relative(REPO_ROOT, manifestPath)}`);
  }
  if (cv !== expectedCanonVersion) {
    die(
      `final manifest canonVersion mismatch.\n` +
        `  manifest: ${cv}\n` +
        `  expected: ${expectedCanonVersion}`
    );
  }

  const artifacts = manifest.artifacts;
  if (!Array.isArray(artifacts)) {
    die(`final manifest missing artifacts array: ${path.relative(REPO_ROOT, manifestPath)}`);
  }

  for (const [i, a] of artifacts.entries()) {
    const p = String(a?.path ?? "").trim();
    const h = String(a?.sha256 ?? "").trim().toLowerCase();
    if (!p) die(`final manifest artifact[${i}] missing path`);
    if (!/^[0-9a-f]{64}$/i.test(h)) die(`final manifest artifact[${i}] has invalid sha256: ${h}`);

    const abs = resolveLinkAbs(manifestPath, p); // treat as repo-relative unless ./ used
    // Manifest artifacts must still be inside docs/evidence/(cc|cx|cp|final)
    const relPosix = toPosix(path.relative(REPO_ROOT, abs));
    if (!relPosix.startsWith("docs/evidence/")) {
      die(`final manifest artifact escapes docs/evidence/: ${relPosix}`);
    }

    if (!fs.existsSync(abs)) {
      die(`final manifest artifact missing on disk: ${relPosix}`);
    }

    const actual = sha256File(abs);
    if (actual !== h) {
      die(`final manifest sha256 mismatch for ${relPosix}\n  manifest: ${h}\n  actual:   ${actual}`);
    }
  }
}

function main() {
  if (!fs.existsSync(EVIDENCE_DIR)) die(`Missing evidence directory: docs/evidence/`);

  /** @type {Record<string, any>} */
  const metas = {};
  /** @type {Record<"cc"|"cx"|"cp", string>} */
  const finalShaByLane = /** @type {any} */ ({});
  /** @type {Record<"cc"|"cx"|"cp", string>} */
  const canonByLane = /** @type {any} */ ({});

  for (const lane of LANES) {
    const signoffPath = SIGNOFF_PATHS[lane];
    const md = readText(signoffPath);

    const meta = parseMetadata(md, lane);
    metas[lane] = meta;

    finalShaByLane[lane] = meta["Final branch-head SHA used for verification"].trim().toLowerCase();
    canonByLane[lane] = meta["Command canon version"].trim();

    verifyLinksInSignoff(lane, signoffPath, md);
  }

  // Same branch-head SHA across lanes
  const finals = new Set(Object.values(finalShaByLane));
  if (finals.size !== 1) {
    die(
      `Final branch-head SHA mismatch across lanes:\n` +
        `  cc: ${finalShaByLane.cc}\n` +
        `  cx: ${finalShaByLane.cx}\n` +
        `  cp: ${finalShaByLane.cp}\n` +
        `All lanes must reference the same verified branch-head SHA.`
    );
  }

  // Same canon version across lanes
  const canons = new Set(Object.values(canonByLane));
  if (canons.size !== 1) {
    die(
      `Command canon version mismatch across lanes:\n` +
        `  cc: ${canonByLane.cc}\n` +
        `  cx: ${canonByLane.cx}\n` +
        `  cp: ${canonByLane.cp}\n` +
        `All lanes must reference the same canon version.`
    );
  }

  const branchHeadSha = [...finals][0];
  const canonVersion = [...canons][0];

  // Optional final manifest check (only if file exists)
  validateFinalManifest(branchHeadSha, canonVersion);

  console.log("✅ R1 evidence verification passed.");
  console.log(`- Verified branch-head SHA: ${branchHeadSha}`);
  console.log(`- Canon version: ${canonVersion}`);
}

main();
