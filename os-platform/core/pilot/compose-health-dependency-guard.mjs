#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const DEFAULT_COMPOSE_PATH = path.resolve("ops/prod/runtime-compose.template.yml");
const DEFAULT_OUT_JSON = path.resolve("os-platform/core/pilot/evidence/compose-health-dependency-guard.latest.json");
const DEFAULT_OUT_MD = path.resolve("os-platform/core/pilot/evidence/compose-health-dependency-guard.latest.md");

function indentation(line) {
  const match = line.match(/^ */);
  return match ? match[0].length : 0;
}

function stripComment(line) {
  let inSingle = false;
  let inDouble = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === "'" && !inDouble) inSingle = !inSingle;
    if (char === '"' && !inSingle) inDouble = !inDouble;
    if (char === "#" && !inSingle && !inDouble) return line.slice(0, index);
  }

  return line;
}

function normalizedLines(composeText) {
  return composeText
    .split(/\r?\n/)
    .map((raw, index) => ({
      lineNumber: index + 1,
      raw,
      text: stripComment(raw).trimEnd(),
      indent: indentation(raw)
    }))
    .filter((line) => line.text.trim().length > 0);
}

function parseServices(composeText) {
  const lines = normalizedLines(composeText);
  const servicesLineIndex = lines.findIndex((line) => line.indent === 0 && /^services:\s*$/.test(line.text));

  if (servicesLineIndex === -1) {
    return { services: new Map(), parseWarnings: ["No top-level services block found."] };
  }

  const services = new Map();
  const parseWarnings = [];
  const servicesIndent = lines[servicesLineIndex].indent;

  for (let index = servicesLineIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.indent <= servicesIndent) break;
    if (line.indent !== servicesIndent + 2) continue;

    const serviceMatch = line.text.match(/^ {2}([A-Za-z0-9_.-]+):\s*$/);
    if (!serviceMatch) continue;

    const name = serviceMatch[1];
    const serviceLines = [];
    for (let inner = index + 1; inner < lines.length; inner += 1) {
      const candidate = lines[inner];
      if (candidate.indent <= line.indent) break;
      serviceLines.push(candidate);
    }

    services.set(name, {
      name,
      lineNumber: line.lineNumber,
      hasHealthcheck: serviceLines.some((candidate) => candidate.indent === line.indent + 2 && /^\s+healthcheck:\s*$/.test(candidate.text)),
      serviceHealthyDependencies: parseServiceHealthyDependencies(serviceLines, line.indent + 2)
    });
  }

  return { services, parseWarnings };
}

function parseServiceHealthyDependencies(serviceLines, propertyIndent) {
  const dependencies = [];
  const dependsIndex = serviceLines.findIndex((line) => line.indent === propertyIndent && new RegExp(`^ {${propertyIndent}}depends_on:\\s*$`).test(line.text));
  if (dependsIndex === -1) return dependencies;

  for (let index = dependsIndex + 1; index < serviceLines.length; index += 1) {
    const line = serviceLines[index];
    if (line.indent <= propertyIndent) break;

    const listMatch = line.text.match(/^\s*-\s*([A-Za-z0-9_.-]+)\s*$/);
    if (listMatch) continue;

    const dependencyMatch = line.text.match(/^ {6}([A-Za-z0-9_.-]+):\s*(.*)$/);
    if (!dependencyMatch) continue;

    const dependency = dependencyMatch[1];
    const inline = dependencyMatch[2] ?? "";
    if (/condition:\s*service_healthy/.test(inline)) {
      dependencies.push({ dependency, lineNumber: line.lineNumber });
      continue;
    }

    for (let inner = index + 1; inner < serviceLines.length; inner += 1) {
      const candidate = serviceLines[inner];
      if (candidate.indent <= line.indent) break;
      if (/condition:\s*service_healthy/.test(candidate.text)) {
        dependencies.push({ dependency, lineNumber: candidate.lineNumber });
        break;
      }
    }
  }

  return dependencies;
}

export function evaluateComposeHealthDependencies(composeText, options = {}) {
  const { services, parseWarnings } = parseServices(composeText);
  const violations = [];
  const serviceSummaries = [];

  for (const service of services.values()) {
    serviceSummaries.push({
      service: service.name,
      lineNumber: service.lineNumber,
      hasHealthcheck: service.hasHealthcheck,
      serviceHealthyDependencies: service.serviceHealthyDependencies.map((dependency) => dependency.dependency)
    });

    for (const dependency of service.serviceHealthyDependencies) {
      const target = services.get(dependency.dependency);
      if (!target) {
        violations.push({
          service: service.name,
          dependency: dependency.dependency,
          lineNumber: dependency.lineNumber,
          reason: "Dependency uses condition: service_healthy but target service is not defined."
        });
        continue;
      }

      if (!target.hasHealthcheck) {
        violations.push({
          service: service.name,
          dependency: dependency.dependency,
          lineNumber: dependency.lineNumber,
          reason: "Dependency uses condition: service_healthy but target service has no healthcheck."
        });
      }
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    composePath: options.composePath ?? null,
    servicesScanned: services.size,
    serviceSummaries,
    violations,
    warnings: parseWarnings,
    passed: violations.length === 0
  };
}

function parseArgs(argv) {
  const args = {
    composePath: DEFAULT_COMPOSE_PATH,
    outJson: DEFAULT_OUT_JSON,
    outMd: DEFAULT_OUT_MD
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--compose") args.composePath = path.resolve(argv[++index]);
    else if (arg === "--out-json") args.outJson = path.resolve(argv[++index]);
    else if (arg === "--out-md") args.outMd = path.resolve(argv[++index]);
  }

  return args;
}

function renderMarkdown(report) {
  const rows = report.serviceSummaries.map((service) => [
    service.service,
    service.hasHealthcheck ? "yes" : "no",
    service.serviceHealthyDependencies.length ? service.serviceHealthyDependencies.join(", ") : "-"
  ]);

  const violationRows = report.violations.length
    ? report.violations.map((violation) =>
        `- ${violation.service} -> ${violation.dependency} at line ${violation.lineNumber}: ${violation.reason}`
      )
    : ["- none"];

  return [
    "# Compose Health Dependency Guard",
    "",
    `Generated: ${report.generatedAt}`,
    `Compose: \`${report.composePath}\``,
    `Passed: ${report.passed ? "yes" : "no"}`,
    "",
    "| Service | Healthcheck | service_healthy Dependencies |",
    "|---|---:|---|",
    ...rows.map((row) => `| ${row[0]} | ${row[1]} | ${row[2]} |`),
    "",
    "## Violations",
    "",
    ...violationRows
  ].join("\n");
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const composeText = fs.readFileSync(args.composePath, "utf8");
  const report = evaluateComposeHealthDependencies(composeText, { composePath: path.relative(process.cwd(), args.composePath).replaceAll(path.sep, "/") });

  fs.mkdirSync(path.dirname(args.outJson), { recursive: true });
  fs.writeFileSync(args.outJson, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(args.outMd, renderMarkdown(report));

  console.log(JSON.stringify({
    composePath: report.composePath,
    servicesScanned: report.servicesScanned,
    violations: report.violations.length,
    passed: report.passed
  }, null, 2));

  if (!report.passed) process.exit(1);
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] ?? "")) {
  main();
}
