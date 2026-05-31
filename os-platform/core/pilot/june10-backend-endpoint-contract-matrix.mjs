#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const DEFAULT_CONTROLLER_ROOT = path.join(repoRoot, "backend/src/TerraFusion.API/Controllers");
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform/core/pilot/evidence/j10-backend-endpoint-contract-matrix.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform/core/pilot/evidence/j10-backend-endpoint-contract-matrix.latest.md"
);

const CLASSIFICATIONS = ["live", "protected", "broken", "mock", "dead", "not_applicable", "unknown"];

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

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value);
}

function sha256Text(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function listControllerFiles(root = DEFAULT_CONTROLLER_ROOT) {
  if (!fs.existsSync(root)) return [];
  const files = [];
  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".cs") && entry.name.includes("Controller")) {
        files.push(fullPath);
      }
    }
  }
  return files.sort((a, b) => a.localeCompare(b));
}

function trimQuotes(value) {
  return value?.replace(/^@?"/, "").replace(/"$/, "") ?? "";
}

function parseAttribute(line) {
  const match = line.trim().match(/^\[([A-Za-z0-9_]+)(?:\((.*)\))?\]/);
  if (!match) return null;
  return {
    name: match[1],
    args: match[2] ?? ""
  };
}

function routeFromAttribute(attribute) {
  if (!attribute) return "";
  const firstString = attribute.args.match(/@?"([^"]*)"/);
  if (firstString) return firstString[1];
  return "";
}

function controllerToken(controllerName) {
  return controllerName.replace(/Controller$/, "").toLowerCase();
}

export function composeRoute(controllerRoute, methodRoute, controllerName) {
  const controllerPart = (controllerRoute || "")
    .replace(/\[controller\]/gi, controllerToken(controllerName))
    .replace(/^\//, "")
    .replace(/\/$/, "");
  const methodPart = (methodRoute || "").replace(/^\//, "").replace(/\/$/, "");
  const route = `/${[controllerPart, methodPart].filter(Boolean).join("/")}`.replace(/\/+/g, "/");
  return route === "/" ? "/" : route.replace(/\/$/, "");
}

function extractExpectedRoleOrPermission(attributes) {
  const parts = [];
  for (const attribute of attributes) {
    if (attribute.name === "Authorize") {
      const roles = attribute.args.match(/Roles\s*=\s*"([^"]+)"/);
      const policy = attribute.args.match(/Policy\s*=\s*"([^"]+)"/);
      if (roles) parts.push(`Roles=${roles[1]}`);
      if (policy) parts.push(`Policy=${policy[1]}`);
    }
    if (/Permission/i.test(attribute.name)) {
      const permission = attribute.args.match(/"([^"]+)"/);
      parts.push(`Permission=${permission?.[1] ?? attribute.name}`);
    }
  }
  return parts.join("; ") || null;
}

function determineAuthRequirement(classAttributes, methodAttributes) {
  if (methodAttributes.some((attribute) => attribute.name === "AllowAnonymous")) return "anonymous";
  if ([...classAttributes, ...methodAttributes].some((attribute) => attribute.name === "Authorize")) {
    return "authorized";
  }
  return "unknown";
}

function inferDataDependency({ controller, route, body }) {
  const haystack = `${controller} ${route} ${body}`.toLowerCase();
  if (haystack.includes("tfparcel") || haystack.includes("parcel") || haystack.includes("county")) {
    return "canonical county/parcel runtime";
  }
  if (haystack.includes("auth") || haystack.includes("governmentuser") || haystack.includes("usersession")) {
    return "TerraFusion auth/session DB";
  }
  if (haystack.includes("sale")) return "sales/canonical sale data";
  if (haystack.includes("queue") || haystack.includes("dais")) return "DAIS queue/runtime tables";
  if (haystack.includes("report")) return "reporting runtime";
  if (haystack.includes("marketplace")) return "marketplace/service registry";
  if (haystack.includes("health")) return "runtime health/config";
  if (haystack.includes("dbcontext") || haystack.includes("_db.")) return "TerraFusion DB context";
  return "unknown";
}

function extractMethodBody(lines, methodLineIndex) {
  const bodyLines = [];
  for (let index = methodLineIndex; index < Math.min(lines.length, methodLineIndex + 120); index += 1) {
    const line = lines[index];
    if (index > methodLineIndex && /^\s*\[Http(?:Get|Post|Put|Delete|Patch)\b/.test(line)) break;
    if (index > methodLineIndex && /^\s*(public|private|protected)\s+.*\s+[A-Za-z0-9_]+\s*\(/.test(line)) break;
    bodyLines.push(line);
  }
  return bodyLines.join("\n");
}

function readMethodName(lines, methodLineIndex) {
  const signature = lines.slice(methodLineIndex, Math.min(lines.length, methodLineIndex + 12)).join(" ");
  if (!/\b(public|private|protected)\b/.test(signature)) return null;
  const beforeBody = signature.split("{")[0];
  const candidates = [...beforeBody.matchAll(/\b([A-Za-z_][A-Za-z0-9_]*)\s*\(/g)].map((match) => match[1]);
  const ignored = new Set(["if", "for", "foreach", "while", "switch", "catch", "using", "typeof", "nameof"]);
  return candidates.reverse().find((candidate) => !ignored.has(candidate)) ?? null;
}

export function classifyEndpoint(endpoint) {
  const body = endpoint.body ?? "";
  if (/StatusCode\s*\(\s*501\b|NotImplementedException|NotImplemented|not implemented/i.test(body)) {
    return "dead";
  }
  if (/\b(mock|stub|fake|placeholder|sample data|demo)\b/i.test(`${endpoint.route} ${body}`)) {
    return "mock";
  }
  if (endpoint.authRequirement === "authorized") return "protected";
  return "unknown";
}

export function extractEndpointContractsFromController({ filePath, text }) {
  const lines = text.split(/\r?\n/);
  let pendingAttributes = [];
  let classAttributes = [];
  let controllerName = path.basename(filePath, ".cs");
  let controllerRoute = "";
  const endpoints = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const attribute = parseAttribute(line);
    if (attribute) {
      pendingAttributes.push(attribute);
      continue;
    }

    const classMatch = line.match(/\bclass\s+([A-Za-z0-9_]+Controller)\b/);
    if (classMatch) {
      controllerName = classMatch[1];
      classAttributes = pendingAttributes;
      controllerRoute = routeFromAttribute(classAttributes.find((item) => item.name === "Route")) || "api/[controller]";
      pendingAttributes = [];
      continue;
    }

    const httpAttributes = pendingAttributes.filter((item) => /^Http(Get|Post|Put|Delete|Patch)$/.test(item.name));
    const methodName = httpAttributes.length > 0 ? readMethodName(lines, index) : null;
    if (!methodName) {
      if (line.trim() !== "") pendingAttributes = [];
      continue;
    }

    if (httpAttributes.length === 0) {
      pendingAttributes = [];
      continue;
    }

    const body = extractMethodBody(lines, index);
    for (const httpAttribute of httpAttributes) {
      const httpMethod = httpAttribute.name.replace(/^Http/, "").toUpperCase();
      const methodRoute = routeFromAttribute(httpAttribute);
      const attributes = [...classAttributes, ...pendingAttributes];
      const endpoint = {
        controller: controllerName,
        action: methodName,
        sourceFile: filePath,
        httpMethod,
        route: composeRoute(controllerRoute, methodRoute, controllerName),
        routeTemplate: {
          controller: controllerRoute || null,
          action: methodRoute || null
        },
        authRequirement: determineAuthRequirement(classAttributes, pendingAttributes),
        expectedRoleOrPermission: extractExpectedRoleOrPermission(attributes),
        dataDependency: inferDataDependency({
          controller: controllerName,
          route: composeRoute(controllerRoute, methodRoute, controllerName),
          body
        }),
        currentClassification: "unknown",
        evidenceSource: "static only",
        evidence: {
          staticAttributes: pendingAttributes.map((item) => `[${item.name}${item.args ? `(${item.args})` : ""}]`)
        },
        body
      };
      endpoint.currentClassification = classifyEndpoint(endpoint);
      endpoints.push(endpoint);
    }
    pendingAttributes = [];
  }

  return endpoints.map(({ body, ...endpoint }) => endpoint);
}

export function isSafeDev39GetProbeCandidate(endpoint) {
  if (endpoint.httpMethod !== "GET") return false;
  if (/[{}]/.test(endpoint.route)) return false;
  if (/stream/i.test(endpoint.action ?? "")) return false;
  return !/(^|\/)(stream|sse)(\/|$)/i.test(endpoint.route);
}

function classifyLiveProbe(status) {
  if (status >= 200 && status < 300) return "live";
  if (status === 401 || status === 403) return "protected";
  if (status === 404 || status === 501) return "dead";
  if (status === 0) return "broken";
  return "broken";
}

function parseEnvFile(envFile) {
  const result = {};
  if (!envFile || !fs.existsSync(envFile)) return result;
  const text = fs.readFileSync(envFile, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    result[trimmed.slice(0, index)] = trimmed.slice(index + 1);
  }
  return result;
}

async function loginForToken({ baseUrl, authEnvFile, timeoutMs }) {
  const env = { ...parseEnvFile(authEnvFile), ...process.env };
  const email = env.TF_J10_OPERATOR_EMAIL ?? env.TF_DEV39_OPERATOR_EMAIL;
  const password = env.TF_J10_OPERATOR_PASSWORD ?? env.TF_DEV39_OPERATOR_PASSWORD;
  if (!email || !password) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(new URL("/api/auth/login", baseUrl), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
      signal: controller.signal
    });
    if (!response.ok) return null;
    const body = await response.json();
    return body.token ?? body.Token ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function probeEndpoint({ baseUrl, endpoint, token, timeoutMs }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();
  try {
    const response = await fetch(new URL(endpoint.route, baseUrl), {
      method: "GET",
      headers: token ? { authorization: `Bearer ${token}` } : {},
      signal: controller.signal
    });
    return {
      status: response.status,
      ok: response.ok,
      durationMs: Date.now() - startedAt
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      durationMs: Date.now() - startedAt,
      error: error.name === "AbortError" ? "timeout" : error.message
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function mapWithConcurrency(items, limit, mapper) {
  const results = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.max(1, limit) }, async () => {
    while (next < items.length) {
      const current = next;
      next += 1;
      results[current] = await mapper(items[current], current);
    }
  });
  await Promise.all(workers);
  return results;
}

export async function applySafeDev39GetProbes(endpoints, {
  baseUrl = "https://dev39.terrafusionmarket.com",
  authEnvFile = null,
  timeoutMs = 7000,
  concurrency = 6,
  limit = Number.POSITIVE_INFINITY
} = {}) {
  const token = await loginForToken({ baseUrl, authEnvFile, timeoutMs });
  const candidates = endpoints.filter(isSafeDev39GetProbeCandidate).slice(0, limit);
  const probeResults = await mapWithConcurrency(candidates, concurrency, async (endpoint) => {
    const probe = await probeEndpoint({ baseUrl, endpoint, token, timeoutMs });
    return {
      key: `${endpoint.httpMethod} ${endpoint.route}`,
      probe
    };
  });
  const probeByKey = new Map(probeResults.map((item) => [item.key, item.probe]));

  return endpoints.map((endpoint) => {
    const key = `${endpoint.httpMethod} ${endpoint.route}`;
    const probe = probeByKey.get(key);
    if (!probe) return endpoint;
    return {
      ...endpoint,
      currentClassification: classifyLiveProbe(probe.status),
      evidenceSource: "live dev39 probe",
      evidence: {
        ...endpoint.evidence,
        dev39Probe: probe
      }
    };
  });
}

export function summarizeEndpointMatrix(endpoints) {
  const classificationCounts = Object.fromEntries(CLASSIFICATIONS.map((classification) => [classification, 0]));
  const evidenceSourceCounts = {};
  const methodCounts = {};
  for (const endpoint of endpoints) {
    classificationCounts[endpoint.currentClassification] =
      (classificationCounts[endpoint.currentClassification] ?? 0) + 1;
    evidenceSourceCounts[endpoint.evidenceSource] = (evidenceSourceCounts[endpoint.evidenceSource] ?? 0) + 1;
    methodCounts[endpoint.httpMethod] = (methodCounts[endpoint.httpMethod] ?? 0) + 1;
  }
  return {
    totalEndpoints: endpoints.length,
    classificationCounts,
    evidenceSourceCounts,
    methodCounts,
    safeDev39GetCandidates: endpoints.filter(isSafeDev39GetProbeCandidate).length
  };
}

export function buildStaticEndpointMatrix({ controllerRoot = DEFAULT_CONTROLLER_ROOT } = {}) {
  const endpoints = [];
  for (const file of listControllerFiles(controllerRoot)) {
    const text = fs.readFileSync(file, "utf8");
    endpoints.push(...extractEndpointContractsFromController({ filePath: path.relative(repoRoot, file), text }));
  }
  return endpoints;
}

function renderMarkdown(packet) {
  const counts = packet.summary.classificationCounts;
  const evidenceCounts = packet.summary.evidenceSourceCounts;
  const failingLive = packet.endpoints
    .filter((endpoint) => endpoint.evidenceSource === "live dev39 probe" && ["broken", "dead"].includes(endpoint.currentClassification))
    .slice(0, 50);

  return `# Backend Endpoint Contract Matrix

- Generated: ${packet.generatedAt}
- Verdict: ${packet.verdict}
- Controller root: ${packet.scope.controllerRoot}
- Production binding touched: ${packet.scope.productionBindingTouched}
- DB mutation touched: ${packet.scope.dataMutationTouched}
- Packet hash: ${packet.packetHash}

## Summary

| Metric | Count |
| --- | ---: |
| Total endpoints | ${packet.summary.totalEndpoints} |
| Safe dev39 GET candidates | ${packet.summary.safeDev39GetCandidates} |
| Static-only endpoints | ${evidenceCounts["static only"] ?? 0} |
| Live dev39 probed endpoints | ${evidenceCounts["live dev39 probe"] ?? 0} |

## Classification Counts

| Classification | Count |
| --- | ---: |
${CLASSIFICATIONS.map((classification) => `| ${classification} | ${counts[classification] ?? 0} |`).join("\n")}

## Method Counts

${Object.entries(packet.summary.methodCounts).map(([method, count]) => `- ${method}: ${count}`).join("\n")}

## Live Dev39 Broken/Dead Sample

${failingLive.length === 0 ? "- None in probed sample." : failingLive.map((endpoint) => `- ${endpoint.httpMethod} ${endpoint.route}: ${endpoint.currentClassification} (${endpoint.evidence.dev39Probe.status})`).join("\n")}

## Hard Stop

This matrix is classification only. Do not fix endpoints, bind production, or mutate data from this lane.
`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const args = parseArgs(process.argv.slice(2));
  const outJson = args.get("out-json") ?? DEFAULT_OUT_JSON;
  const outMd = args.get("out-md") ?? DEFAULT_OUT_MD;
  const controllerRoot = args.get("controller-root") ?? DEFAULT_CONTROLLER_ROOT;
  const liveDev39 = args.get("live-dev39") === "true";
  const baseUrl = args.get("base-url") ?? "https://dev39.terrafusionmarket.com";
  const authEnvFile = args.get("auth-env") ?? null;
  const timeoutMs = Number(args.get("timeout-ms") ?? 7000);
  const concurrency = Number(args.get("concurrency") ?? 6);
  const limit = Number(args.get("live-limit") ?? Number.POSITIVE_INFINITY);

  let endpoints = buildStaticEndpointMatrix({ controllerRoot });
  if (liveDev39) {
    endpoints = await applySafeDev39GetProbes(endpoints, {
      baseUrl,
      authEnvFile,
      timeoutMs,
      concurrency,
      limit
    });
  }

  const packetBase = {
    generatedAt: new Date().toISOString(),
    verdict: "CLASSIFICATION_ONLY_NOT_PRODUCTION_READY",
    scope: {
      controllerRoot,
      liveDev39ProbesEnabled: liveDev39,
      baseUrl: liveDev39 ? baseUrl : null,
      productionBindingTouched: false,
      dataMutationTouched: false,
      featureFixesTouched: false
    },
    classifications: CLASSIFICATIONS,
    summary: summarizeEndpointMatrix(endpoints),
    endpoints
  };
  const packet = {
    ...packetBase,
    packetHash: sha256Text(JSON.stringify(packetBase))
  };

  writeJson(outJson, packet);
  writeText(outMd, renderMarkdown(packet));

  console.log(
    JSON.stringify(
      {
        verdict: packet.verdict,
        summary: packet.summary,
        outJson,
        outMd,
        packetHash: packet.packetHash
      },
      null,
      2
    )
  );
}
