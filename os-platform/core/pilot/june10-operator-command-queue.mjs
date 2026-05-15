#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const DEFAULT_WAR_ROOM = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-war-room-status.latest.json"
);
const DEFAULT_OUT_JSON = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-operator-command-queue.latest.json"
);
const DEFAULT_OUT_MD = path.join(
  repoRoot,
  "os-platform",
  "core",
  "pilot",
  "evidence",
  "june10-operator-command-queue.latest.md"
);

function readJson(filePath, fallback = null) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function rel(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, "/");
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function commandStatus(command, firstUnblockCommand, warRoomVerdict) {
  if (warRoomVerdict === "NO_GO" && command === firstUnblockCommand) return "ACTIVE";
  if (warRoomVerdict === "NO_GO") return "BLOCKED_BY_FIRST_UNBLOCK";
  return "ACTIVE";
}

function commandReason(status, firstUnblockCommand) {
  if (status === "ACTIVE") return "Allowed by current war-room state.";
  return `Blocked until first unblock command passes: ${firstUnblockCommand}.`;
}

export function buildJune10OperatorCommandQueue({ warRoomStatus }) {
  if (!warRoomStatus) {
    return {
      generatedAtUtc: new Date().toISOString(),
      queueStatus: "STOP_WORK",
      warRoomVerdict: "missing",
      activeLane: "missing",
      firstUnblockCommand: null,
      summary: {
        totalCommands: 0,
        activeCommands: 0,
        blockedCommands: 0,
        stopWorkItems: 1
      },
      commands: [],
      stopWork: ["Do not run June 10 commands until war-room status exists."],
      rules: ["War-room status is the source of truth for operator command gating."]
    };
  }

  const firstUnblockCommand = warRoomStatus.firstUnblockCommand ?? null;
  const commands = unique(warRoomStatus.nextCommands ?? [firstUnblockCommand]).map((command) => {
    const status = commandStatus(command, firstUnblockCommand, warRoomStatus.warRoomVerdict);
    return {
      command,
      status,
      reason: commandReason(status, firstUnblockCommand)
    };
  });
  const activeCommands = commands.filter((item) => item.status === "ACTIVE").length;
  const blockedCommands = commands.filter((item) => item.status !== "ACTIVE").length;

  return {
    generatedAtUtc: new Date().toISOString(),
    queueStatus:
      warRoomStatus.warRoomVerdict === "NO_GO" && activeCommands === 1
        ? "FIRST_UNBLOCK_ONLY"
        : warRoomStatus.warRoomVerdict === "NO_GO"
          ? "STOP_WORK"
          : "OPEN",
    warRoomVerdict: warRoomStatus.warRoomVerdict ?? "missing",
    activeLane: warRoomStatus.activeLane ?? "missing",
    firstUnblockCommand,
    summary: {
      totalCommands: commands.length,
      activeCommands,
      blockedCommands,
      stopWorkItems: warRoomStatus.stopWork?.length ?? 0
    },
    commands,
    stopWork: warRoomStatus.stopWork ?? [],
    allowedFraming: warRoomStatus.allowedFraming ?? null,
    rules: [
      "Only ACTIVE commands may be executed from this queue.",
      "When war-room verdict is NO_GO, the first unblock command is the only active command.",
      "Blocked commands are not suggestions; they are sequencing guards.",
      "Regenerate war-room status after the active command completes."
    ]
  };
}

function renderMarkdown(queue) {
  const lines = [
    "# June 10 Operator Command Queue",
    "",
    `Generated: ${queue.generatedAtUtc}`,
    "",
    `Queue status: ${queue.queueStatus}`,
    `War-room verdict: ${queue.warRoomVerdict}`,
    `Active lane: ${queue.activeLane}`,
    `First unblock command: ${queue.firstUnblockCommand ? `\`${queue.firstUnblockCommand}\`` : "None"}`,
    "",
    "## Summary",
    "",
    `- Total commands: ${queue.summary.totalCommands}`,
    `- Active commands: ${queue.summary.activeCommands}`,
    `- Blocked commands: ${queue.summary.blockedCommands}`,
    `- Stop-work items: ${queue.summary.stopWorkItems}`,
    "",
    "## Commands",
    "",
    "| Status | Command | Reason |",
    "|---|---|---|"
  ];

  queue.commands.forEach((item) => lines.push(`${item.status} | \`${item.command}\` | ${item.reason}`));

  lines.push("", "## Stop Work", "");
  if (queue.stopWork.length === 0) lines.push("- None");
  else queue.stopWork.forEach((item) => lines.push(`- ${item}`));

  lines.push("", "## Rules", "");
  queue.rules.forEach((rule) => lines.push(`- ${rule}`));

  return `${lines.join("\n")}\n`;
}

function parseArgs(argv) {
  const args = {
    warRoomPath: DEFAULT_WAR_ROOM,
    outJson: DEFAULT_OUT_JSON,
    outMd: DEFAULT_OUT_MD,
    write: true
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--war-room") args.warRoomPath = path.resolve(argv[++i]);
    else if (arg === "--out-json") args.outJson = path.resolve(argv[++i]);
    else if (arg === "--out-md") args.outMd = path.resolve(argv[++i]);
    else if (arg === "--no-write") args.write = false;
  }

  return args;
}

export function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const queue = buildJune10OperatorCommandQueue({
    warRoomStatus: readJson(args.warRoomPath, null)
  });

  if (args.write) {
    fs.mkdirSync(path.dirname(args.outJson), { recursive: true });
    fs.writeFileSync(args.outJson, `${JSON.stringify(queue, null, 2)}\n`);
    fs.writeFileSync(args.outMd, renderMarkdown(queue));
  }

  console.log(
    JSON.stringify(
      {
        queueStatus: queue.queueStatus,
        activeCommands: queue.summary.activeCommands,
        blockedCommands: queue.summary.blockedCommands,
        output: rel(args.outJson)
      },
      null,
      2
    )
  );

  return queue;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
