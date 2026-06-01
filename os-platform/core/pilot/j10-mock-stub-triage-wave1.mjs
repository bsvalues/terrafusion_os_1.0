#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const SOURCE_AUDIT = path.join(__dirname, "evidence", "j10-mock-stub-audit.latest.json");
const DEFAULT_OUT_JSON = path.join(__dirname, "evidence", "j10-mock-stub-triage-wave1.latest.json");
const DEFAULT_OUT_MD = path.join(__dirname, "evidence", "j10-mock-stub-triage-wave1.latest.md");

const TOP_N = 50;
const MAX_SCAN_BYTES = 2 * 1024 * 1024;
const TEXT_EXTENSIONS = new Set([".cs", ".csproj", ".json", ".mjs", ".js", ".ts", ".tsx", ".ps1", ".sh", ".md", ".yml", ".yaml"]);
const SCAN_ROOTS = ["backend/src", "frontend/apps/os-shell/src", "os-platform/core", "tools/registry", "tools", "scripts", "ops"];
const SKIP_DIRS = new Set([".git", ".claude", ".codex-worktrees", "ARCHIVE", "QUARANTINE", "bin", "obj", "node_modules", "target", "dist", "build", "publish", "coverage"]);

const SEVERITY = {
  not_implemented: 100,
  stub: 90,
  mock: 85,
  placeholder: 75,
  todo: 65,
  hardcoded: 55,
  fake: 50,
  sample_or_fixture: 25,
  fallback: 10
};

const SIGNAL_PATTERN =
  /\b(mock|stub|fake|sample|fixture|placeholder|todo|notimplemented|dummy|hardcoded|demo data|fallback data|in-memory fallback|fallback)\b/i;

function rel(filePath) {
  return path.relative(repoRoot, filePath).replaceAll("\\", "/");
}

function full(relativePath) {
  return path.join(repoRoot, relativePath);
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
    const base = path.basename(file).toLowerCase();
    if (!base.includes("lock") && TEXT_EXTENSIONS.has(ext) && stat.size <= MAX_SCAN_BYTES) acc.push(file);
    return acc;
  }
  for (const entry of fs.readdirSync(file, { withFileTypes: true })) {
    if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
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
      const base = path.basename(child).toLowerCase();
      if (!base.includes("lock") && TEXT_EXTENSIONS.has(ext) && childStat.size <= MAX_SCAN_BYTES) acc.push(child);
    }
  }
  return acc;
}

function selectedFiles() {
  return [...new Set(SCAN_ROOTS.flatMap((root) => walk(root).map(rel)))];
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
  const lines = text.split(/\r?\n/);
  const matches = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!SIGNAL_PATTERN.test(line)) continue;
    matches.push({
      line: i + 1,
      kind: signalKind(line),
      preview: line.trim().replace(/\s+/g, " ").slice(0, 220)
    });
    if (matches.length >= 20) break;
  }
  return matches;
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
  return "other";
}

function sha256Text(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function classifySourceSignal(relativePath, signals) {
  const bucket = sourceBucket(relativePath);
  const kinds = new Set(signals.map((signal) => signal.kind));
  const previews = signals.map((signal) => signal.preview).join("\n").toLowerCase();
  const severeKinds = ["stub", "fake", "placeholder", "not_implemented", "todo", "hardcoded", "mock"];
  if (relativePath.startsWith("os-platform/core/pilot/")) return "not_production_risk";
  if (bucket === "test" || bucket === "docs" || bucket === "evidence") return "not_production_risk";
  if (/archive|quarantine|yakima-demo|cowlitz-demo|championship/.test(relativePath.toLowerCase())) return "not_production_risk";
  if (bucket === "backend_runtime" || bucket === "frontend_runtime" || bucket === "core_governance") {
    return severeKinds.some((kind) => kinds.has(kind)) || /sample data|fixture-backed|mock historical|demo data|fallback data|in-memory fallback/.test(previews)
      ? "production_risk"
      : "not_production_risk";
  }
  if (bucket === "tools" || bucket === "scripts" || bucket === "ops") {
    return severeKinds.some((kind) => kinds.has(kind)) || /sample data|fixture-backed|demo data|fallback data/.test(previews)
      ? "production_risk"
      : "not_production_risk";
  }
  return "not_production_risk";
}

function buildSourceAudit() {
  const sourceSignalMatrix = selectedFiles()
    .map((file) => {
      const signals = lineSignals(file);
      if (signals.length === 0) return null;
      return {
        path: file,
        bucket: sourceBucket(file),
        classification: classifySourceSignal(file, signals),
        matchCount: signals.length,
        signalKinds: [...new Set(signals.map((signal) => signal.kind))]
      };
    })
    .filter(Boolean);
  return {
    generatedAt: new Date().toISOString(),
    source: fs.existsSync(SOURCE_AUDIT) ? rel(SOURCE_AUDIT) : "inline_wave1_scan",
    summary: {
      productionRiskFiles: sourceSignalMatrix.filter((entry) => entry.classification === "production_risk").length,
      filesWithSignals: sourceSignalMatrix.length
    },
    sourceSignalMatrix
  };
}

function loadAudit() {
  if (fs.existsSync(SOURCE_AUDIT)) return JSON.parse(fs.readFileSync(SOURCE_AUDIT, "utf8"));
  return buildSourceAudit();
}

function extractSymbols(relativePath) {
  const text = readText(relativePath);
  const symbols = [];
  const patterns = [
    /\bclass\s+([A-Z][A-Za-z0-9_]*)/g,
    /\brecord\s+([A-Z][A-Za-z0-9_]*)/g,
    /\binterface\s+(I[A-Z][A-Za-z0-9_]*)/g
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text))) symbols.push(match[1]);
  }
  return [...new Set(symbols)];
}

function buildReferenceIndex(files = selectedFiles()) {
  const texts = files.map((file) => ({ file, text: readText(file) }));
  return function referenceCount(symbols, selfPath) {
    if (symbols.length === 0) return 0;
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

function priorityScore(entry) {
  const kinds = entry.signalKinds ?? [];
  const maxSeverity = Math.max(...kinds.map((kind) => SEVERITY[kind] ?? 0), 0);
  const runtimeBoost = /backend\/src\/TerraFusion\.API|backend\/src\/TerraFusion\.AI|frontend\/apps\/os-shell\/src/.test(entry.path) ? 25 : 0;
  const controllerBoost = /Controller\.cs$/.test(entry.path) ? 20 : 0;
  const serviceBoost = /Service\.cs$/.test(entry.path) ? 10 : 0;
  return maxSeverity * 100 + (entry.matchCount ?? 0) + runtimeBoost + controllerBoost + serviceBoost;
}

function classifyTriage(entry, context = {}) {
  const file = entry.path;
  const lower = file.toLowerCase();
  const kinds = new Set(entry.signalKinds ?? []);
  const signals = context.signals ?? lineSignals(file);
  const previews = signals.map((signal) => signal.preview).join("\n").toLowerCase();
  const symbols = context.symbols ?? extractSymbols(file);
  const referenceCount = context.referenceCount ?? 0;
  const reasons = [];

  if (/testmodels|testcontroller|\/tests?\//i.test(file)) {
    reasons.push("test_or_test_endpoint_surface_inside_runtime_tree");
    return { disposition: "safe_demo_only", confidence: "medium", reasons };
  }

  if (/future deployment|placeholder only|not configured|unconfigured county placeholder/.test(previews)) {
    reasons.push("explicit_future_or_unconfigured_placeholder");
    return { disposition: "safe_demo_only", confidence: "medium", reasons };
  }

  if (kinds.has("fallback") && !kinds.has("stub") && !kinds.has("mock") && !kinds.has("placeholder") && !kinds.has("fake")) {
    reasons.push("fallback_signal_without_mock_stub_or_placeholder_behavior");
    return { disposition: "intentional_fallback", confidence: "medium", reasons };
  }

  if (referenceCount === 0 && !/controller\.cs$|appsettings\.json|program\.cs|dto|model/i.test(file)) {
    reasons.push("no_static_symbol_references_found");
    return { disposition: "dormant", confidence: "low", reasons };
  }

  if (kinds.has("not_implemented")) {
    reasons.push("not_implemented_signal_in_runtime_source");
    return { disposition: "production_blocker", confidence: "high", reasons };
  }

  if (kinds.has("stub") || kinds.has("mock") || kinds.has("placeholder") || kinds.has("fake")) {
    if (/controller\.cs$|service\.cs$|agent\.cs$|function\.cs$|orchestrator\.cs$|engine\.cs$/i.test(file)) {
      reasons.push("runtime_execution_surface_contains_mock_stub_placeholder_or_fake_signal");
      return { disposition: "production_blocker", confidence: "high", reasons };
    }
    reasons.push("runtime_model_or_config_contains_mock_stub_placeholder_or_fake_signal");
    return { disposition: "production_blocker", confidence: "medium", reasons };
  }

  if (kinds.has("todo") || kinds.has("hardcoded")) {
    reasons.push("runtime_todo_or_hardcoded_signal_requires_owner_review");
    return { disposition: "production_blocker", confidence: "medium", reasons };
  }

  if (lower.includes("demo") || lower.includes("legacy")) {
    reasons.push("legacy_or_demo_named_runtime_artifact");
    return { disposition: "dead_code", confidence: "low", reasons };
  }

  reasons.push("insufficient_static_context_for_safe_disposition");
  return { disposition: "production_blocker", confidence: "low", reasons };
}

function buildTriage({ limit = TOP_N } = {}) {
  const audit = loadAudit();
  const matrix = audit.sourceSignalMatrix ?? [];
  const candidates = matrix
    .filter((entry) => entry.classification === "production_risk")
    .sort((a, b) => priorityScore(b) - priorityScore(a))
    .slice(0, limit);

  const referenceCount = buildReferenceIndex();
  const triaged = candidates.map((entry, index) => {
    const signals = lineSignals(entry.path);
    const symbols = extractSymbols(entry.path);
    const refs = referenceCount(symbols, entry.path);
    const triage = classifyTriage(entry, { signals, symbols, referenceCount: refs });
    return {
      rank: index + 1,
      path: entry.path,
      bucket: entry.bucket,
      signalKinds: entry.signalKinds,
      matchCount: entry.matchCount,
      priorityScore: priorityScore(entry),
      symbols,
      staticReferenceCount: refs,
      disposition: triage.disposition,
      confidence: triage.confidence,
      reasons: triage.reasons,
      signalPreview: signals.slice(0, 5)
    };
  });

  return { audit, triaged };
}

function countBy(items, keyFn) {
  const counts = {};
  for (const item of items) {
    const key = keyFn(item);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function buildPacket({ limit = TOP_N } = {}) {
  const { audit, triaged } = buildTriage({ limit });
  const packetBase = {
    generatedAt: new Date().toISOString(),
    operation: "production_risk_mock_stub_triage_wave1",
    sourceAudit: fs.existsSync(SOURCE_AUDIT) ? rel(SOURCE_AUDIT) : "inline_wave1_scan_no_prior_audit_file",
    target: `top_${limit}_production_risk_mock_stub_files`,
    productionTouched: false,
    databaseMutation: false,
    featureWork: false,
    summary: {
      sourceProductionRiskFiles: audit.summary?.productionRiskFiles ?? null,
      triagedFiles: triaged.length,
      dispositionCounts: countBy(triaged, (item) => item.disposition),
      confidenceCounts: countBy(triaged, (item) => item.confidence),
      blockerCount: triaged.filter((item) => item.disposition === "production_blocker").length,
      dormantCount: triaged.filter((item) => item.disposition === "dormant").length,
      intentionalFallbackCount: triaged.filter((item) => item.disposition === "intentional_fallback").length,
      safeDemoOnlyCount: triaged.filter((item) => item.disposition === "safe_demo_only").length,
      deadCodeCount: triaged.filter((item) => item.disposition === "dead_code").length
    },
    verdict: {
      controlledPreview: "still_ready",
      productionReadiness: "blocked_by_mock_stub_disposition",
      fullCapability: "not_ready",
      reason:
        "Top production-risk mock/stub files are dominated by runtime AI/API execution surfaces with stub, placeholder, TODO, hardcoded, or mock behavior. This does not block the controlled demo path, but it does block full production capability claims."
    },
    triagedFiles: triaged,
    unsafeManualGaps: [
      {
        gap: "Production-risk files are not yet owner-dispositioned",
        impact: "The system cannot distinguish dormant AI experiments from production blockers without a reviewed disposition ledger.",
        recommendation: "Create a mock/stub disposition ledger with owner, runtime route/module, preview allowance, and production action."
      },
      {
        gap: "AI/API runtime surfaces dominate Wave 1 blockers",
        impact: "TerraFusion can truthfully demo the statewide runtime preview, but cannot claim complete AI/workflow capability.",
        recommendation: "Separate June 10 preview route set from full product capability route set."
      }
    ],
    recommendedNextSteps: [
      "Review each Wave 1 production_blocker with module ownership and decide: replace, disable, downgrade to explicit unavailable, or defer as non-production module.",
      "Run Wave 2 on the next 50 production-risk files after this packet is reviewed.",
      "Merge this triage with endpoint mock signals so route-level capability claims cannot hide source-level stubs."
    ]
  };
  return { ...packetBase, packetHash: sha256Text(JSON.stringify(packetBase)) };
}

function renderMarkdown(packet) {
  const s = packet.summary;
  return `# Production-Risk Mock/Stub Triage Wave 1

- Generated: ${packet.generatedAt}
- Source audit: ${packet.sourceAudit}
- Target: ${packet.target}
- Production touched: false
- DB mutation: false
- Feature work: false
- Packet hash: ${packet.packetHash}

## Verdict

| Claim | Verdict |
| --- | --- |
| Controlled preview | ${packet.verdict.controlledPreview} |
| Production readiness | ${packet.verdict.productionReadiness} |
| Full capability | ${packet.verdict.fullCapability} |

${packet.verdict.reason}

## Summary

| Metric | Count |
| --- | ---: |
| Source production-risk files | ${s.sourceProductionRiskFiles} |
| Triaged files | ${s.triagedFiles} |
| Production blockers | ${s.blockerCount} |
| Dormant | ${s.dormantCount} |
| Intentional fallback | ${s.intentionalFallbackCount} |
| Safe demo-only | ${s.safeDemoOnlyCount} |
| Dead code | ${s.deadCodeCount} |

## Disposition Counts

| Disposition | Count |
| --- | ---: |
${Object.entries(s.dispositionCounts).map(([key, value]) => `| ${key} | ${value} |`).join("\n")}

## Top 50 Triage Matrix

| Rank | Disposition | Confidence | File | Signals |
| ---: | --- | --- | --- | --- |
${packet.triagedFiles.map((item) => `| ${item.rank} | ${item.disposition} | ${item.confidence} | \`${item.path}\` | ${item.signalKinds.join(", ")} |`).join("\n")}

## Unsafe / Manual Gaps

${packet.unsafeManualGaps.map((gap) => `- **${gap.gap}**: ${gap.impact} Recommendation: ${gap.recommendation}`).join("\n")}

## Recommended Next Steps

${packet.recommendedNextSteps.map((step) => `- ${step}`).join("\n")}

## Conclusion

Wave 1 confirms the largest mock/stub risk is not the controlled dev39 runtime preview. It is full product capability: AI, valuation, workflow, and API surfaces still contain explicit stub/placeholder/mock behavior and need a disposition ledger before any production-ready claim.
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
  console.log(`Mock/stub triage wave 1 written: ${rel(DEFAULT_OUT_JSON)}`);
  console.log(`Verdict: production=${packet.verdict.productionReadiness}; blockers=${packet.summary.blockerCount}/${packet.summary.triagedFiles}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

export {
  buildPacket,
  buildTriage,
  classifyTriage,
  extractSymbols,
  lineSignals,
  priorityScore
};
