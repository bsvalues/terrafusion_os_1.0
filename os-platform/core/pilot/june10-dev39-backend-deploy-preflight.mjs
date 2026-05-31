#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_OUT_JSON = path.join(
  __dirname,
  "evidence",
  "j10-dev39-backend-deploy-preflight.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  __dirname,
  "evidence",
  "j10-dev39-backend-deploy-preflight.latest.md"
);

export function parseArgs(argv) {
  const args = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args.set(key, "true");
    } else {
      args.set(key, next);
      index += 1;
    }
  }
  return args;
}

export function parseRootUsePercent(dfOutput) {
  const lines = String(dfOutput).trim().split(/\r?\n/).filter(Boolean);
  for (const line of lines.slice(1)) {
    const parts = line.trim().split(/\s+/);
    const mount = parts.at(-1);
    const use = parts.at(-2);
    if (mount === "/" && /^\d+%$/.test(use)) {
      return Number.parseInt(use, 10);
    }
  }
  throw new Error("Unable to parse root filesystem usage from df output");
}

export function buildRemotePreflightScript({ appRoot }) {
  return `set -euo pipefail
cd '${appRoot}'
before_df="$(df -P /)"
before_use="$(printf '%s\\n' "$before_df" | awk '$6=="/" {print $5}' | tr -d '%')"
docker_builder_before="$(docker system df 2>/dev/null || true)"
docker builder prune -af >/tmp/dev39-builder-prune.log 2>&1 || true
after_df="$(df -P /)"
after_use="$(printf '%s\\n' "$after_df" | awk '$6=="/" {print $5}' | tr -d '%')"
docker_builder_after="$(docker system df 2>/dev/null || true)"
printf 'BEFORE_USE=%s\\n' "$before_use"
printf 'AFTER_USE=%s\\n' "$after_use"
printf 'BEFORE_DF<<EOF\\n%s\\nEOF\\n' "$before_df"
printf 'AFTER_DF<<EOF\\n%s\\nEOF\\n' "$after_df"
printf 'DOCKER_BEFORE<<EOF\\n%s\\nEOF\\n' "$docker_builder_before"
printf 'DOCKER_AFTER<<EOF\\n%s\\nEOF\\n' "$docker_builder_after"
`;
}

export function parseRemotePreflightOutput(output) {
  const beforeMatch = output.match(/^BEFORE_USE=(\d+)$/m);
  const afterMatch = output.match(/^AFTER_USE=(\d+)$/m);
  if (!beforeMatch || !afterMatch) {
    throw new Error("Unable to parse remote preflight usage output");
  }

  return {
    beforeUsePercent: Number.parseInt(beforeMatch[1], 10),
    afterUsePercent: Number.parseInt(afterMatch[1], 10)
  };
}

export function writeEvidence({ result, outJson, outMd }) {
  const generatedAt = new Date().toISOString();
  const packet = {
    generatedAt,
    operation: "dev39_backend_deploy_preflight",
    target: "dev39",
    productionTouched: false,
    databaseMutation: false,
    cleanup: "docker_builder_cache_only",
    ...result
  };
  const packetHash = crypto
    .createHash("sha256")
    .update(JSON.stringify(packet))
    .digest("hex");
  packet.packetHash = packetHash;

  fs.mkdirSync(path.dirname(outJson), { recursive: true });
  fs.writeFileSync(outJson, `${JSON.stringify(packet, null, 2)}\n`);
  fs.writeFileSync(
    outMd,
    `# dev39 backend deploy preflight

- Generated: ${generatedAt}
- Packet hash: ${packetHash}
- Target: dev39
- Production touched: false
- Database mutation: false
- Cleanup: docker builder cache only
- Root disk before: ${result.beforeUsePercent}%
- Root disk after: ${result.afterUsePercent}%
- Warning threshold: ${result.warningThresholdPercent}%
- Verdict: ${result.verdict}
`
  );

  return packet;
}

export function runRemotePreflight({ host, appRoot, warningThresholdPercent }) {
  const script = buildRemotePreflightScript({ appRoot });
  const output = execFileSync("ssh", [host, "bash -s"], {
    input: script,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "inherit"]
  });
  const parsed = parseRemotePreflightOutput(output);
  return {
    ...parsed,
    warningThresholdPercent,
    verdict:
      parsed.afterUsePercent < warningThresholdPercent
        ? "PASS_BELOW_WARNING_THRESHOLD"
        : "BLOCKED_DISK_ABOVE_WARNING_THRESHOLD"
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const args = parseArgs(process.argv.slice(2));
  const host = args.get("host") ?? "terrafusion-hostinger";
  const appRoot = args.get("app-root") ?? "/opt/terrafusion/june10-data-dev";
  const warningThresholdPercent = Number.parseInt(args.get("warning-threshold") ?? "90", 10);
  const outJson = args.get("out-json") ?? DEFAULT_OUT_JSON;
  const outMd = args.get("out-md") ?? DEFAULT_OUT_MD;

  const result = runRemotePreflight({ host, appRoot, warningThresholdPercent });
  const packet = writeEvidence({ result, outJson, outMd });
  console.log(JSON.stringify(packet, null, 2));
  if (packet.verdict !== "PASS_BELOW_WARNING_THRESHOLD") {
    process.exitCode = 1;
  }
}
