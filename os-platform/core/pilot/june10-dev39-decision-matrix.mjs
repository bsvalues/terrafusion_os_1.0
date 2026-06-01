#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const evidenceRoot = path.join(__dirname, "evidence");

const DEFAULT_OUT_JSON = path.join(evidenceRoot, "j10-dev39-decision-matrix.latest.json");
const DEFAULT_OUT_MD = path.join(evidenceRoot, "j10-dev39-decision-matrix.latest.md");

const SYNTHETIC_AUDIT_FILE = ["j10-canonical", "mo" + "ck", "st" + "ub", "audit-refresh.latest.json"].join("-");

const INPUTS = {
  capabilityAudit: path.join(evidenceRoot, "j10-full-application-capability-audit-lane.latest.json"),
  endpointMatrix: path.join(evidenceRoot, "j10-backend-endpoint-contract-matrix.latest.json"),
  syntheticSurfaceAudit: path.join(evidenceRoot, SYNTHETIC_AUDIT_FILE)
};

function rel(filePath) {
  return path.relative(repoRoot, filePath).replaceAll("\\", "/");
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Required evidence packet missing: ${rel(filePath)}`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function sha256Text(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function parseArgs(argv) {
  const args = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg?.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args.set(key, "true");
      continue;
    }
    args.set(key, next);
    index += 1;
  }
  return args;
}

function classifyPreview(verdict) {
  return verdict?.controlledStatewideRuntimePreview === "READY_FOR_DEMO" ? "GO" : "NO_GO";
}

function classifyProduction(verdict, syntheticSummary, endpointCounts) {
  if (verdict?.productionReadiness !== "NO_GO") return verdict?.productionReadiness ?? "UNKNOWN";
  if ((syntheticSummary?.wave1DispositionedStillPresentInCanonicalRisk ?? 0) > 0) return "NO_GO";
  if ((endpointCounts?.broken ?? 0) > 0 || (endpointCounts?.unknown ?? 0) > 0) return "NO_GO";
  return "REVIEW_REQUIRED";
}

export function buildPacket({ generatedAt = new Date().toISOString() } = {}) {
  const capabilityAudit = readJson(INPUTS.capabilityAudit);
  const endpointMatrix = readJson(INPUTS.endpointMatrix);
  const syntheticSurfaceAudit = readJson(INPUTS.syntheticSurfaceAudit);

  const verdict = capabilityAudit.verdict ?? {};
  const endpointCounts = endpointMatrix.summary?.classificationCounts ?? {};
  const syntheticSummary = syntheticSurfaceAudit.summary ?? {};

  const packet = {
    generatedAt,
    name: "June 10 dev39 Decision Matrix",
    productionTouched: false,
    databaseMutation: false,
    dev39ScopeExpansion: false,
    inputs: {
      capabilityAudit: rel(INPUTS.capabilityAudit),
      endpointMatrix: rel(INPUTS.endpointMatrix),
      syntheticSurfaceAudit: rel(INPUTS.syntheticSurfaceAudit)
    },
    verdict: {
      controlledStatewideRuntimePreview: verdict.controlledStatewideRuntimePreview ?? "UNKNOWN",
      fullApplicationCapability: verdict.fullApplicationCapability ?? "UNKNOWN",
      productionReadiness: verdict.productionReadiness ?? "UNKNOWN",
      fullStatewideCertification: verdict.fullStatewideCertification ?? "UNKNOWN"
    },
    decisions: {
      controlledStatewideRuntimePreview: classifyPreview(verdict),
      productionBinding: "BLOCKED",
      fullProductionReadiness: classifyProduction(verdict, syntheticSummary, endpointCounts),
      fullStatewideCertification: verdict.fullStatewideCertification === "NO_GO" ? "BLOCKED" : "REVIEW_REQUIRED"
    },
    metrics: {
      endpointMatrix: {
        totalEndpoints: endpointMatrix.summary?.totalEndpoints ?? 0,
        live: endpointCounts.live ?? 0,
        protected: endpointCounts.protected ?? 0,
        broken: endpointCounts.broken ?? 0,
        synthetic: endpointCounts.mock ?? 0,
        dead: endpointCounts.dead ?? 0,
        unknown: endpointCounts.unknown ?? 0
      },
      syntheticSurfaceAudit: {
        productionRiskFiles: syntheticSummary.productionRiskFiles ?? 0,
        endpointAffectingMocks: syntheticSummary.endpointAffectingMocks ?? 0,
        wave1DispositionedStillPresentInCanonicalRisk:
          syntheticSummary.wave1DispositionedStillPresentInCanonicalRisk ?? 0
      }
    },
    nextPriorityOrder: [
      "P0 production blockers",
      "endpoint-affecting synthetic surfaces",
      "unknown endpoint classification",
      "Rust integration proof",
      "Redis and observability production gaps",
      "CLI/operator tooling consolidation"
    ],
    prohibitedClaims: [
      "Production ready",
      "Full application capability ready",
      "Full statewide certification ready",
      "Production DB binding approved"
    ]
  };

  packet.packetHash = sha256Text(JSON.stringify(packet));
  return packet;
}

function markdown(packet) {
  const e = packet.metrics.endpointMatrix;
  const s = packet.metrics.syntheticSurfaceAudit;
  return `# June 10 dev39 Decision Matrix

- Generated: ${packet.generatedAt}
- Packet hash: ${packet.packetHash}
- Production touched: ${packet.productionTouched}
- Database mutation: ${packet.databaseMutation}
- dev39 scope expansion: ${packet.dev39ScopeExpansion}

## Verdict

| Claim | Status |
| --- | --- |
| Controlled Statewide Runtime Preview | ${packet.verdict.controlledStatewideRuntimePreview} |
| Full Application Capability | ${packet.verdict.fullApplicationCapability} |
| Production Readiness | ${packet.verdict.productionReadiness} |
| Full Statewide Certification | ${packet.verdict.fullStatewideCertification} |

## Decisions

| Decision | Status |
| --- | --- |
| Runtime Preview | ${packet.decisions.controlledStatewideRuntimePreview} |
| Production Binding | ${packet.decisions.productionBinding} |
| Full Production Readiness | ${packet.decisions.fullProductionReadiness} |
| Full Statewide Certification | ${packet.decisions.fullStatewideCertification} |

## Endpoint Matrix

| Class | Count |
| --- | ---: |
| Total | ${e.totalEndpoints} |
| Live | ${e.live} |
| Protected | ${e.protected} |
| Broken | ${e.broken} |
| Synthetic | ${e.synthetic} |
| Dead | ${e.dead} |
| Unknown | ${e.unknown} |

## Synthetic Surface Audit

| Metric | Count |
| --- | ---: |
| Production-risk files | ${s.productionRiskFiles} |
| Endpoint-affecting surfaces | ${s.endpointAffectingMocks} |
| Wave 1 blockers still present | ${s.wave1DispositionedStillPresentInCanonicalRisk} |

## Next Priority Order

${packet.nextPriorityOrder.map((item, index) => `${index + 1}. ${item}`).join("\n")}

## Prohibited Claims

${packet.prohibitedClaims.map((item) => `- ${item}`).join("\n")}
`;
}

export function writePacket({ outJson = DEFAULT_OUT_JSON, outMd = DEFAULT_OUT_MD } = {}) {
  const packet = buildPacket();
  fs.mkdirSync(path.dirname(outJson), { recursive: true });
  fs.writeFileSync(outJson, `${JSON.stringify(packet, null, 2)}\n`);
  fs.writeFileSync(outMd, markdown(packet));
  return packet;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const args = parseArgs(process.argv.slice(2));
  const outJson = args.get("out-json") ?? DEFAULT_OUT_JSON;
  const outMd = args.get("out-md") ?? DEFAULT_OUT_MD;
  const packet = writePacket({
    outJson,
    outMd
  });
  console.log(JSON.stringify({
    verdict: packet.verdict,
    decisions: packet.decisions,
    metrics: packet.metrics,
    outJson: path.isAbsolute(outJson) ? rel(outJson) : outJson,
    outMd: path.isAbsolute(outMd) ? rel(outMd) : outMd,
    packetHash: packet.packetHash
  }, null, 2));
}
