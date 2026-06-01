#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const DEFAULT_OUT_JSON = path.join(__dirname, "evidence", "j10-canonical-mock-stub-audit-refresh.latest.json");
const DEFAULT_OUT_MD = path.join(__dirname, "evidence", "j10-canonical-mock-stub-audit-refresh.latest.md");
const ENDPOINT_MATRIX = path.join(__dirname, "evidence", "j10-backend-endpoint-contract-matrix.latest.json");
const DISPOSITION_PLAN = path.join(__dirname, "evidence", "j10-production-blocker-mock-stub-disposition-plan.latest.json");

const MAX_SCAN_BYTES = 2 * 1024 * 1024;
const MAX_MATCHES_PER_FILE = 20;
const TEXT_EXTENSIONS = new Set([".cs", ".csproj", ".json", ".mjs", ".js", ".ts", ".tsx", ".ps1", ".sh", ".md", ".yml", ".yaml", ".py"]);
const INCLUDE_ROOTS = ["backend/src", "frontend/apps/os-shell/src", "os-platform/core", "tools/registry", "tools", "scripts", "ops", "package.json"];
const EXCLUDE_DIRS = [".git", ".claude", ".codex-worktrees", "ARCHIVE", "QUARANTINE", "bin", "obj", "node_modules", "target", "dist", "build", "publish", "coverage"];
const EXCLUDE_FILE_NAME_PATTERNS = ["lock"];
const SIGNAL_PATTERN = /\b(mock|stub|fake|sample|fixture|placeholder|todo|notimplemented|dummy|hardcoded|demo data|fallback data|in-memory fallback|fallback)\b/i;
const SEVERE_KINDS = new Set(["stub", "fake", "placeholder", "not_implemented", "todo", "hardcoded", "mock"]);

function rel(filePath) {
  return path.relative(repoRoot, filePath).replaceAll("\\", "/");
}

function full(relativePath) {
  return path.join(repoRoot, relativePath);
}

function sha256Text(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function readText(relativePath) {
  const file = full(relativePath);
  if (!fs.existsSync(file)) return "";
  let stat;
  try {
    stat = fs.statSync(file);
  } catch {
    return "";
  }
  if (stat.size > MAX_SCAN_BYTES) return "";
  return fs.readFileSync(file, "utf8");
}

function isExcludedFile(filePath) {
  const base = path.basename(filePath).toLowerCase();
  return EXCLUDE_FILE_NAME_PATTERNS.some((pattern) => base.includes(pattern));
}

function walk(target, acc = []) {
  const file = full(target);
  if (!fs.existsSync(file)) return acc;
  let stat;
  try {
    stat = fs.statSync(file);
  } catch {
    return acc;
  }
  if (stat.isFile()) {
    const ext = path.extname(file).toLowerCase();
    if (!isExcludedFile(file) && TEXT_EXTENSIONS.has(ext) && stat.size <= MAX_SCAN_BYTES) acc.push(file);
    return acc;
  }
  for (const entry of fs.readdirSync(file, { withFileTypes: true })) {
    if (entry.isDirectory() && EXCLUDE_DIRS.includes(entry.name)) continue;
    const child = path.join(file, entry.name);
    let childStat;
    try {
      childStat = fs.statSync(child);
    } catch {
      continue;
    }
    if (entry.isDirectory()) {
      walk(rel(child), acc);
    } else {
      const ext = path.extname(child).toLowerCase();
      if (!isExcludedFile(child) && TEXT_EXTENSIONS.has(ext) && childStat.size <= MAX_SCAN_BYTES) acc.push(child);
    }
  }
  return acc;
}

function selectedFiles() {
  return [...new Set(INCLUDE_ROOTS.flatMap((root) => walk(root).map(rel)))].sort();
}

function sourceBucket(relativePath) {
  const lower = relativePath.toLowerCase();
  if (lower.includes("/__tests__/") || lower.includes("/__mocks__/") || lower.includes("/testutils/") || lower.includes(".test.") || lower.includes(".spec.") || lower.includes("/tests/")) return "test";
  if (lower.endsWith(".md")) return "docs";
  if (lower.startsWith("backend/src/")) return "backend_runtime";
  if (lower.startsWith("frontend/apps/os-shell/src/")) return "frontend_runtime";
  if (lower.startsWith("os-platform/core/pilot/evidence/")) return "evidence";
  if (lower.startsWith("os-platform/core/")) return "core_governance";
  if (lower.startsWith("tools/registry/")) return "registry";
  if (lower.startsWith("tools/")) return "tools";
  if (lower.startsWith("scripts/")) return "scripts";
  if (lower.startsWith("ops/")) return "ops";
  if (lower === "package.json") return "package_scripts";
  return "other";
}

function signalKind(line) {
  const lower = line.toLowerCase();
  if (/notimplemented|throw new notimplemented/.test(lower)) return "not_implemented";
  if (/mock/.test(lower)) return "mock";
  if (/stub/.test(lower)) return "stub";
  if (/fake|dummy/.test(lower)) return "fake";
  if (/placeholder/.test(lower)) return "placeholder";
  if (/sample|fixture|demo data/.test(lower)) return "sample_or_fixture";
  if (/hardcoded/.test(lower)) return "hardcoded";
  if (/todo/.test(lower)) return "todo";
  if (/fallback/.test(lower)) return "fallback";
  return "other_signal";
}

function lineSignals(relativePath) {
  const text = readText(relativePath);
  if (!text || !SIGNAL_PATTERN.test(text)) return [];
  const matches = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!SIGNAL_PATTERN.test(line)) continue;
    matches.push({
      line: i + 1,
      kind: signalKind(line),
      preview: line.trim().replace(/\s+/g, " ").slice(0, 220)
    });
    if (matches.length >= MAX_MATCHES_PER_FILE) break;
  }
  return matches;
}

function extractSymbols(relativePath) {
  const text = readText(relativePath);
  const symbols = [];
  for (const pattern of [/\bclass\s+([A-Z][A-Za-z0-9_]*)/g, /\brecord\s+([A-Z][A-Za-z0-9_]*)/g, /\binterface\s+(I[A-Z][A-Za-z0-9_]*)/g]) {
    let match;
    while ((match = pattern.exec(text))) symbols.push(match[1]);
  }
  return [...new Set(symbols)];
}

function buildReferenceIndex(files) {
  const texts = files.map((file) => ({ file, text: readText(file) }));
  return function referenceCount(symbols, selfPath) {
    if (!symbols.length) return 0;
    const escaped = symbols.map((symbol) => symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const pattern = new RegExp(`\\b(${escaped.join("|")})\\b`, "g");
    let count = 0;
    for (const item of texts) {
      if (item.file === selfPath) continue;
      const matches = item.text.match(pattern);
      if (matches) count += matches.length;
    }
    return count;
  };
}

function classifyFile(relativePath, signals, referenceCount = 0) {
  const bucket = sourceBucket(relativePath);
  const lower = relativePath.toLowerCase();
  const kinds = new Set(signals.map((signal) => signal.kind));
  const previews = signals.map((signal) => signal.preview).join("\n").toLowerCase();
  const hasSevere = [...kinds].some((kind) => SEVERE_KINDS.has(kind));
  const hasDataMock = /sample data|fixture-backed|mock historical|demo data|fallback data|in-memory fallback/.test(previews);

  if (bucket === "test" || bucket === "docs" || bucket === "evidence") return "demo_safe";
  if (/archive|quarantine|yakima-demo|cowlitz-demo|championship/.test(lower)) return "dead";
  if (bucket === "ops" && /mock service|nginx:alpine placeholder|sample data|championship sample|fallback urls|stub\)/.test(previews)) return "dead";
  if ((bucket === "backend_runtime" || bucket === "frontend_runtime" || bucket === "core_governance") && (hasSevere || hasDataMock)) {
    if (referenceCount === 0 && !/controller\.cs$|program\.cs|appsettings\.json|dto|model|seed/i.test(relativePath)) return "dormant";
    return "production_risk";
  }
  if ((bucket === "tools" || bucket === "scripts" || bucket === "ops" || bucket === "registry" || bucket === "package_scripts") && (hasSevere || hasDataMock)) {
    return "production_risk";
  }
  return "demo_safe";
}

function endpointMockSignals() {
  if (!fs.existsSync(ENDPOINT_MATRIX)) return [];
  let packet;
  try {
    packet = JSON.parse(fs.readFileSync(ENDPOINT_MATRIX, "utf8"));
  } catch {
    return [];
  }
  const endpoints = Array.isArray(packet.endpoints) ? packet.endpoints : [];
  return endpoints
    .filter((endpoint) => String(endpoint.currentClassification ?? endpoint.classification ?? "").toLowerCase() === "mock")
    .map((endpoint) => ({
      controller: endpoint.controller ?? "unknown",
      action: endpoint.action ?? null,
      route: endpoint.route ?? endpoint.path ?? "unknown",
      method: endpoint.httpMethod ?? endpoint.method ?? "UNKNOWN",
      sourceFile: endpoint.sourceFile ? String(endpoint.sourceFile).replaceAll("\\", "/") : null,
      classification: endpoint.currentClassification ?? endpoint.classification ?? "mock"
    }));
}

function dispositionedWave1Blockers() {
  if (!fs.existsSync(DISPOSITION_PLAN)) return [];
  let packet;
  try {
    packet = JSON.parse(fs.readFileSync(DISPOSITION_PLAN, "utf8"));
  } catch {
    return [];
  }
  return (packet.dispositions ?? []).map((row) => ({
    file: row.file,
    priority: row.priority,
    fixType: row.fixType,
    owningModule: row.owningModule,
    currentDecision: row.currentDecision,
    blocksProduction: row.blocksProduction
  }));
}

function countBy(items, keyFn) {
  const counts = {};
  for (const item of items) {
    const key = keyFn(item);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function buildPacket() {
  const files = selectedFiles();
  const referenceCount = buildReferenceIndex(files);
  const signalRows = files
    .map((file) => {
      const signals = lineSignals(file);
      if (!signals.length) return null;
      const symbols = extractSymbols(file);
      const refs = referenceCount(symbols, file);
      const classification = classifyFile(file, signals, refs);
      return {
        path: file,
        bucket: sourceBucket(file),
        classification,
        signalKinds: [...new Set(signals.map((signal) => signal.kind))],
        matchCount: signals.length,
        staticReferenceCount: refs
      };
    })
    .filter(Boolean);

  const endpointMocks = endpointMockSignals();
  const dispositions = dispositionedWave1Blockers();
  const dispositionedFiles = new Set(dispositions.map((row) => row.file));
  const sourceSignalMatrix = signalRows.map((row) => ({
    ...row,
    wave1DispositionStatus: dispositionedFiles.has(row.path) ? "wave1_dispositioned" : "not_wave1_dispositioned"
  }));
  const packetBase = {
    generatedAt: new Date().toISOString(),
    operation: "canonical_mock_stub_audit_refresh",
    productionTouched: false,
    databaseMutation: false,
    featureWork: false,
    includeRules: {
      roots: INCLUDE_ROOTS,
      textExtensions: [...TEXT_EXTENSIONS].sort(),
      maxScanBytes: MAX_SCAN_BYTES
    },
    excludeRules: {
      directories: EXCLUDE_DIRS,
      fileNamePatterns: EXCLUDE_FILE_NAME_PATTERNS,
      note: "Lock files, generated/build outputs, dependency folders, archive/quarantine trees, and oversized files are excluded from the canonical denominator."
    },
    summary: {
      totalFilesScanned: files.length,
      filesWithSignals: signalRows.length,
      productionRiskFiles: signalRows.filter((row) => row.classification === "production_risk").length,
      demoSafeFiles: signalRows.filter((row) => row.classification === "demo_safe").length,
      dormantFiles: signalRows.filter((row) => row.classification === "dormant").length,
      deadFiles: signalRows.filter((row) => row.classification === "dead").length,
      endpointAffectingMocks: endpointMocks.length,
      wave1ProductionBlockersDispositioned: dispositions.length,
      wave1DispositionedStillPresentInCanonicalRisk: sourceSignalMatrix.filter((row) => row.wave1DispositionStatus === "wave1_dispositioned" && row.classification === "production_risk").length,
      byBucket: countBy(signalRows, (row) => row.bucket),
      byClassification: countBy(signalRows, (row) => row.classification),
      bySignalKind: countBy(signalRows.flatMap((row) => row.signalKinds), (kind) => kind)
    },
    denominatorReconciliation: {
      previousBroadAuditProductionRiskFiles: 724,
      previousWave1InlineProductionRiskFiles: 618,
      canonicalProductionRiskFiles: signalRows.filter((row) => row.classification === "production_risk").length,
      decision:
        "Use canonicalProductionRiskFiles from this packet for executive reporting going forward. Older 724 and 618 counts are superseded because they used different worktree state and include/exclude rules."
    },
    verdict: {
      controlledPreview: "ready",
      productionReadiness: "no_go",
      fullApplicationCapability: "not_ready",
      reason:
        "The canonical denominator is now stable for this worktree. Wave 1 production blockers are disposition-linked, but production/full capability remain blocked by unresolved production-risk mock/stub files and endpoint-affecting mocks."
    },
    endpointMockSignals: endpointMocks,
    wave1DispositionedBlockers: dispositions,
    sourceSignalMatrix,
    productionRiskExamples: sourceSignalMatrix.filter((row) => row.classification === "production_risk").slice(0, 80)
  };
  return { ...packetBase, packetHash: sha256Text(JSON.stringify(packetBase)) };
}

function renderMarkdown(packet) {
  const s = packet.summary;
  return `# Canonical Mock/Stub Audit Refresh

- Generated: ${packet.generatedAt}
- Production touched: false
- DB mutation: false
- Feature work: false
- Packet hash: ${packet.packetHash}

## Verdict

| Claim | Status |
| --- | --- |
| Controlled dev39 preview | ${packet.verdict.controlledPreview} |
| Production readiness | ${packet.verdict.productionReadiness} |
| Full application capability | ${packet.verdict.fullApplicationCapability} |

${packet.verdict.reason}

## Canonical Denominator

| Metric | Count |
| --- | ---: |
| Total files scanned | ${s.totalFilesScanned} |
| Files with mock/stub signals | ${s.filesWithSignals} |
| Production-risk files | ${s.productionRiskFiles} |
| Demo-safe files | ${s.demoSafeFiles} |
| Dormant files | ${s.dormantFiles} |
| Dead files | ${s.deadFiles} |
| Endpoint-affecting mocks | ${s.endpointAffectingMocks} |
| Wave 1 production blockers dispositioned | ${s.wave1ProductionBlockersDispositioned} |
| Wave 1 dispositioned still present in canonical risk | ${s.wave1DispositionedStillPresentInCanonicalRisk} |

## Count Reconciliation

| Count source | Count |
| --- | ---: |
| Previous broad audit production-risk files | ${packet.denominatorReconciliation.previousBroadAuditProductionRiskFiles} |
| Previous Wave 1 inline production-risk files | ${packet.denominatorReconciliation.previousWave1InlineProductionRiskFiles} |
| Canonical production-risk files | ${packet.denominatorReconciliation.canonicalProductionRiskFiles} |

${packet.denominatorReconciliation.decision}

## Include Rules

- Roots: ${packet.includeRules.roots.map((root) => `\`${root}\``).join(", ")}
- Extensions: ${packet.includeRules.textExtensions.map((ext) => `\`${ext}\``).join(", ")}
- Max scan bytes: ${packet.includeRules.maxScanBytes}

## Exclude Rules

- Directories: ${packet.excludeRules.directories.map((dir) => `\`${dir}\``).join(", ")}
- File-name patterns: ${packet.excludeRules.fileNamePatterns.map((pattern) => `\`${pattern}\``).join(", ")}
- ${packet.excludeRules.note}

## Classification Counts

| Classification | Count |
| --- | ---: |
${Object.entries(s.byClassification).map(([key, value]) => `| ${key} | ${value} |`).join("\n")}

## Endpoint-Affecting Mocks

${packet.endpointMockSignals.slice(0, 40).map((endpoint) => `- \`${endpoint.method} ${endpoint.route}\` (${endpoint.controller})`).join("\n") || "- None found."}

## Production-Risk Examples

${packet.productionRiskExamples.slice(0, 40).map((row) => `- \`${row.path}\` (${row.bucket}; ${row.signalKinds.join(", ")}; ${row.wave1DispositionStatus})`).join("\n")}

## Conclusion

This packet supersedes the conflicting 724 and 618 mock/stub denominator counts for this branch. The actionable state is now: canonical production-risk count = ${s.productionRiskFiles}, endpoint-affecting mocks = ${s.endpointAffectingMocks}, and Wave 1 blockers disposition-linked = ${s.wave1ProductionBlockersDispositioned}.
`;
}

function writePacket(packet, outJson = DEFAULT_OUT_JSON, outMd = DEFAULT_OUT_MD) {
  fs.mkdirSync(path.dirname(outJson), { recursive: true });
  fs.writeFileSync(outJson, `${JSON.stringify(packet, null, 2)}\n`);
  fs.writeFileSync(outMd, renderMarkdown(packet));
}

function main() {
  const packet = buildPacket();
  writePacket(packet);
  console.log(`Canonical mock/stub audit refresh written: ${rel(DEFAULT_OUT_JSON)}`);
  console.log(`Canonical production-risk files: ${packet.summary.productionRiskFiles}; endpoint mocks: ${packet.summary.endpointAffectingMocks}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

export {
  buildPacket,
  classifyFile,
  endpointMockSignals,
  lineSignals,
  selectedFiles,
  signalKind,
  sourceBucket
};
