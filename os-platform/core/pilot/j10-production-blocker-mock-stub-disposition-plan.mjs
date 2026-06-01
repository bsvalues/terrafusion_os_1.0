#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const WAVE1_JSON = path.join(__dirname, "evidence", "j10-mock-stub-triage-wave1.latest.json");
const DEFAULT_OUT_JSON = path.join(__dirname, "evidence", "j10-production-blocker-mock-stub-disposition-plan.latest.json");
const DEFAULT_OUT_MD = path.join(__dirname, "evidence", "j10-production-blocker-mock-stub-disposition-plan.latest.md");

function rel(filePath) {
  return path.relative(repoRoot, filePath).replaceAll("\\", "/");
}

function full(relativePath) {
  return path.join(repoRoot, relativePath);
}

function readText(relativePath) {
  const file = full(relativePath);
  if (!fs.existsSync(file)) return "";
  const stat = fs.statSync(file);
  if (stat.size > 2 * 1024 * 1024) return "";
  return fs.readFileSync(file, "utf8");
}

function sha256Text(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function loadWave1() {
  if (!fs.existsSync(WAVE1_JSON)) throw new Error(`Missing Wave 1 triage packet: ${rel(WAVE1_JSON)}`);
  return JSON.parse(fs.readFileSync(WAVE1_JSON, "utf8"));
}

function owningModule(relativePath) {
  if (relativePath.includes("TerraFusion.API/Controllers")) return `API/${path.basename(relativePath, ".cs").replace(/Controller$/, "")}`;
  if (relativePath.includes("TerraFusion.API/Services")) return `API Service/${path.basename(relativePath, ".cs").replace(/Service$/, "")}`;
  if (relativePath.includes("TerraFusion.API/Security")) return "API Security/Auth";
  if (relativePath.includes("TerraFusion.API/Seeds")) return "API Seed/Import";
  if (relativePath.includes("TerraFusion.API/Models")) return "API Model";
  if (relativePath.includes("TerraFusion.AI/Agents")) return "AI Agent";
  if (relativePath.includes("TerraFusion.AI/Forecasting")) return "AI Forecasting";
  if (relativePath.includes("TerraFusion.AI/Narratives")) return "AI Narratives";
  if (relativePath.includes("TerraFusion.AI/Notices")) return "AI Notices";
  if (relativePath.includes("TerraFusion.AI/ML")) return "AI ML";
  if (relativePath.includes("TerraFusion.AI/Services")) return `AI Service/${path.basename(relativePath, ".cs").replace(/Service$/, "")}`;
  if (relativePath.includes("TerraFusion.Core/Services")) return `Core Service/${path.basename(relativePath, ".cs").replace(/Service$/, "")}`;
  if (relativePath.includes("TerraFusion.Abstractions")) return "Abstractions/DTO";
  return "Unknown";
}

function runtimeSurface(relativePath) {
  if (/Controller\.cs$/.test(relativePath)) return "HTTP controller";
  if (/Service\.cs$/.test(relativePath)) return "DI service/runtime service";
  if (/Agent\.cs$/.test(relativePath)) return "AI agent";
  if (/Engine\.cs$/.test(relativePath)) return "runtime engine";
  if (/Seeder\.cs$|Canonicalizer\.cs$/.test(relativePath)) return "data seed/import path";
  if (/Models?\//.test(relativePath) || /DTOs?\//.test(relativePath)) return "contract/model surface";
  if (/Security\//.test(relativePath)) return "auth/security surface";
  return "runtime source";
}

function extractRoutes(relativePath) {
  const text = readText(relativePath);
  if (!text || !/Controller\.cs$/.test(relativePath)) return [];
  const routePrefix = [...text.matchAll(/\[Route\("([^"]+)"\)\]/g)].map((match) => match[1])[0] ?? "";
  const httpRoutes = [...text.matchAll(/\[Http(Get|Post|Put|Delete|Patch)(?:\("([^"]*)"\))?/g)].map((match) => ({
    method: match[1].toUpperCase(),
    path: match[2] ?? ""
  }));
  if (httpRoutes.length === 0 && routePrefix) return [{ method: "ANY", route: normalizeRoute(routePrefix) }];
  return httpRoutes.map((route) => ({
    method: route.method,
    route: normalizeRoute([routePrefix, route.path].filter(Boolean).join("/"))
  }));
}

function normalizeRoute(route) {
  return `/${route}`
    .replaceAll("[controller]", "")
    .replaceAll("//", "/")
    .replace(/\/$/, "")
    .replace(/^\/api\//, "/api/");
}

function userFacingImpact(item) {
  const file = item.path;
  if (file.includes("PilotController")) return "Pilot invocation/tool-list behavior can present offline stubs instead of real tool execution.";
  if (file.includes("CostForge")) return "Cost/valuation workflows may return stubbed, hardcoded, or incomplete cost model behavior.";
  if (file.includes("GPT")) return "GPT/explanation workflows may use placeholder or fallback behavior rather than fully proven runtime intelligence.";
  if (file.includes("Atlas") || file.includes("Gis")) return "GIS/coordinate/map behavior may be partial or stubbed.";
  if (file.includes("Dais")) return "DAIS queue/escalation workflows may not be fully real beyond preview-safe paths.";
  if (file.includes("Forge")) return "Forge workbench/reconciliation/statistics may expose incomplete operational outputs.";
  if (file.includes("MassAppraisal") || file.includes("Valuation")) return "Valuation and mass appraisal claims are not production-safe.";
  if (file.includes("Compliance")) return "Compliance dashboard/automation state cannot be treated as complete production compliance.";
  if (file.includes("Ldap") || file.includes("Authentication")) return "Auth integration is provisioned-account-ready but enterprise directory behavior is not production-proven.";
  if (file.includes("Seeder") || file.includes("Pacs") || file.includes("DataMigration")) return "Data import/seed/migration behavior needs source-specific review before production mutation claims.";
  if (file.includes("Document") || file.includes("Notice") || file.includes("Narrative")) return "Document generation/narrative outputs are not production-complete.";
  return "Module behavior may be incomplete or misleading if surfaced as production-ready.";
}

function fixType(item) {
  const file = item.path;
  const kinds = new Set(item.signalKinds ?? []);
  if (file.includes("TestController") || file.includes("TestModels")) return "mark dev-only";
  if (item.staticReferenceCount === 0) return "delete/dead-code quarantine";
  if (file.includes("Ldap") || file.includes("DevelopmentLdap") || file.includes("RejectingLdap")) return "replace with honest unavailable state";
  if (file.includes("PilotController") || file.includes("GPTController") || file.includes("AtlasController")) return "replace with honest unavailable state";
  if (file.includes("Seeder") || file.includes("Pacs") || file.includes("DataMigration")) return "disable surface";
  if (kinds.has("not_implemented") || kinds.has("stub") || kinds.has("placeholder") || kinds.has("mock") || kinds.has("fake")) return "implement real service";
  if (kinds.has("hardcoded") || kinds.has("todo")) return "implement real service";
  return "replace with honest unavailable state";
}

function priority(item) {
  const file = item.path;
  if (/PilotController|GPTController|CostForgeController|ForgeController|PropertiesController|AtlasController|DaisController/.test(file)) return "P0";
  if (/Compliance|Authentication|Ldap|Program\.cs|Valuation|MassAppraisal|ProductionPACS|DataMigration|Pacs/.test(file)) return "P1";
  if (/Document|Notice|Narrative|Analytics|Integration|Levy|GisData|DataPipeline|Statistics/.test(file)) return "P2";
  return "P3";
}

function blocksJune10Preview(item) {
  const p = item.path;
  if (/Login|AuthProvider|CountyOpsScene|ForgeSuiteHome|Desktop/.test(p)) return { blocks: true, reason: "In controlled preview UI path." };
  return { blocks: false, reason: "Not in the frozen controlled dev39 preview path as currently defined." };
}

function blocksProduction(item) {
  if (item.disposition !== "production_blocker") return { blocks: false, reason: "Not classified as production_blocker in Wave 1." };
  return { blocks: true, reason: "Runtime production-risk mock/stub signal requires explicit disposition or remediation." };
}

function countBy(items, keyFn) {
  const counts = {};
  for (const item of items) {
    const key = keyFn(item);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function buildDisposition(item) {
  const preview = blocksJune10Preview(item);
  const production = blocksProduction(item);
  return {
    rank: item.rank,
    file: item.path,
    owningModule: owningModule(item.path),
    runtimeSurface: runtimeSurface(item.path),
    signalKinds: item.signalKinds,
    confidence: item.confidence,
    staticReferenceCount: item.staticReferenceCount,
    userFacingImpact: userFacingImpact(item),
    endpointsOrRoutesAffected: extractRoutes(item.path),
    blocksJune10Preview: preview.blocks,
    june10PreviewRationale: preview.reason,
    blocksProduction: production.blocks,
    productionRationale: production.reason,
    fixType: fixType(item),
    priority: priority(item),
    currentDecision: "requires_owner_disposition",
    allowedBeforeDisposition: "Do not claim full production capability for this surface."
  };
}

function buildPacket() {
  const wave1 = loadWave1();
  const blockers = wave1.triagedFiles.filter((item) => item.disposition === "production_blocker");
  const dispositions = blockers.map(buildDisposition);
  const packetBase = {
    generatedAt: new Date().toISOString(),
    operation: "production_blocker_mock_stub_disposition_plan",
    sourceWave1: rel(WAVE1_JSON),
    productionTouched: false,
    databaseMutation: false,
    featureWork: false,
    scope: {
      source: "39 production_blocker files from Wave 1",
      fixesIncluded: false,
      classificationOnly: true
    },
    countReconciliation: {
      earlierAuditProductionRiskFiles: 724,
      earlierAuditSource: "j10-mock-stub-audit.latest.json from prior audit packet / branch context",
      currentWave1ProductionRiskFiles: wave1.summary.sourceProductionRiskFiles,
      currentWave1Source: wave1.sourceAudit,
      reconciledInterpretation:
        "Do not compare 724 and 618 as the same denominator. The 724 count came from a broader prior audit artifact; Wave 1 used an inline scan in this worktree and excludes core pilot audit tooling/test/docs/evidence differently. Executive reporting should use the count tied to the specific packet being cited.",
      recommendedExecutiveMetric:
        "Use Wave 1 blocker result for immediate action: 39 production blockers in the top 50 triaged files. Use total production-risk count only after regenerating one canonical mock/stub audit on the current branch."
    },
    summary: {
      wave1TriagedFiles: wave1.summary.triagedFiles,
      wave1ProductionBlockers: blockers.length,
      dispositionRows: dispositions.length,
      byPriority: countBy(dispositions, (item) => item.priority),
      byFixType: countBy(dispositions, (item) => item.fixType),
      byRuntimeSurface: countBy(dispositions, (item) => item.runtimeSurface),
      june10PreviewBlockers: dispositions.filter((item) => item.blocksJune10Preview).length,
      productionBlockers: dispositions.filter((item) => item.blocksProduction).length
    },
    verdict: {
      controlledPreview: "still_ready",
      productionReadiness: "no_go",
      fullApplicationCapability: "not_ready",
      reason:
        "Wave 1 production blockers mostly affect AI/API/valuation/workflow surfaces outside the frozen dev39 preview path, but they block any full production or full capability claim until dispositioned and remediated."
    },
    dispositions,
    requiredNextStep:
      "Owner review of this disposition plan. For each row choose implement, disable, mark dev-only, return honest unavailable, or quarantine. No code fixes were made in this slice."
  };
  return { ...packetBase, packetHash: sha256Text(JSON.stringify(packetBase)) };
}

function renderMarkdown(packet) {
  const s = packet.summary;
  return `# Production Blocker Mock/Stub Disposition Plan

- Generated: ${packet.generatedAt}
- Source: ${packet.sourceWave1}
- Scope: ${packet.scope.source}
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

## Count Reconciliation

| Metric | Count |
| --- | ---: |
| Earlier audit production-risk files | ${packet.countReconciliation.earlierAuditProductionRiskFiles} |
| Current Wave 1 production-risk files | ${packet.countReconciliation.currentWave1ProductionRiskFiles} |
| Wave 1 production blockers | ${s.wave1ProductionBlockers} |

${packet.countReconciliation.reconciledInterpretation}

Recommended executive metric: ${packet.countReconciliation.recommendedExecutiveMetric}

## Summary

| Metric | Count |
| --- | ---: |
| Wave 1 triaged files | ${s.wave1TriagedFiles} |
| Disposition rows | ${s.dispositionRows} |
| June 10 preview blockers | ${s.june10PreviewBlockers} |
| Production blockers | ${s.productionBlockers} |

## Priority Counts

| Priority | Count |
| --- | ---: |
${Object.entries(s.byPriority).map(([key, value]) => `| ${key} | ${value} |`).join("\n")}

## Fix Type Counts

| Fix type | Count |
| --- | ---: |
${Object.entries(s.byFixType).map(([key, value]) => `| ${key} | ${value} |`).join("\n")}

## Disposition Matrix

| Rank | Priority | Fix type | Module | Surface | Preview blocker | Production blocker | File |
| ---: | --- | --- | --- | --- | --- | --- | --- |
${packet.dispositions.map((row) => `| ${row.rank} | ${row.priority} | ${row.fixType} | ${row.owningModule} | ${row.runtimeSurface} | ${row.blocksJune10Preview ? "yes" : "no"} | ${row.blocksProduction ? "yes" : "no"} | \`${row.file}\` |`).join("\n")}

## Required Next Step

${packet.requiredNextStep}
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
  console.log(`Disposition plan written: ${rel(DEFAULT_OUT_JSON)}`);
  console.log(`Production blockers: ${packet.summary.productionBlockers}; preview blockers: ${packet.summary.june10PreviewBlockers}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

export {
  blocksJune10Preview,
  buildDisposition,
  buildPacket,
  extractRoutes,
  fixType,
  owningModule,
  priority,
  runtimeSurface
};
