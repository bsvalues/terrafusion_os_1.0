#!/usr/bin/env node
/**
 * TerraForge CLI — Unified command-line interface for all TerraForge modules
 *
 * Usage:
 *   tf forge <module> <action> [options]
 *
 * Modules:
 *   cuforge      Current Use (enrollment, rollback, interest, removals)
 *   levy         Levy calculation, certification, revenue projection
 *   sales        Sale qualification, comps, ratio study, regression
 *   cost         Cost estimate, depreciation, income approach, batch
 *
 * Global options:
 *   --api <url>  Override API base URL (default: http://localhost:5000)
 *   --json       Machine-readable JSON output
 *   --csv        CSV output (for list/table commands)
 *   --batch <file>  Process a batch file (NDJSON, one record per line)
 *   --kernel     Use Rust kernel for batch processing (cost/valuation only)
 *   --help       Show help
 *
 * Examples:
 *   tf forge cuforge rollback --parcel P-12345 --start-year 2018
 *   tf forge cuforge interest --year 2024
 *   tf forge levy calculate --district FD1 --av 500000 --rate 1.5
 *   tf forge sales qualify --parcel P-12345
 *   tf forge cost estimate --type residential --sqft 2400 --quality good
 *   tf forge cost batch --batch parcels.ndjson --kernel
 *
 * Zero external dependencies — uses only Node built-ins (fetch, fs, path).
 */
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import { execSync, spawn } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..", "..");
const DEFAULT_API = process.env.TERRAFORGE_API_URL ?? "http://localhost:5000";

// ── Arg Parsing ──────────────────────────────────────────────────────────────

function parseForgeArgs(argv) {
  const raw = argv.slice(2);
  const flags = {
    json: false,
    csv: false,
    help: false,
    kernel: false,
    api: DEFAULT_API,
    batch: null,
  };
  const positional = [];
  const named = {};

  for (let i = 0; i < raw.length; i++) {
    const arg = raw[i];
    if (arg === "--json") flags.json = true;
    else if (arg === "--csv") flags.csv = true;
    else if (arg === "--help" || arg === "-h") flags.help = true;
    else if (arg === "--kernel") flags.kernel = true;
    else if (arg === "--api" && raw[i + 1]) { flags.api = raw[++i]; }
    else if (arg === "--batch" && raw[i + 1]) { flags.batch = raw[++i]; }
    else if (arg.startsWith("--") && raw[i + 1] && !raw[i + 1].startsWith("--")) {
      named[arg.slice(2)] = raw[++i];
    } else if (arg.startsWith("--")) {
      named[arg.slice(2)] = true;
    } else {
      positional.push(arg);
    }
  }

  return {
    module: positional[0] ?? null,
    action: positional[1] ?? null,
    rest: positional.slice(2),
    flags,
    named,
  };
}

// ── HTTP Helpers ─────────────────────────────────────────────────────────────

async function apiGet(baseUrl, path) {
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} — ${url}\n${body.slice(0, 400)}`);
  }
  return res.json();
}

async function apiPost(baseUrl, path, body) {
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} — ${url}\n${text.slice(0, 400)}`);
  }
  return res.json();
}

// ── Output Formatters ────────────────────────────────────────────────────────

function formatOutput(data, flags) {
  if (flags.json) {
    return JSON.stringify(data, null, 2);
  }
  if (flags.csv && Array.isArray(data)) {
    if (data.length === 0) return "(empty)";
    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(h => String(row[h] ?? "")).join(","));
    return [headers.join(","), ...rows].join("\n");
  }
  if (Array.isArray(data)) {
    return formatTable(data);
  }
  if (typeof data === "object" && data !== null) {
    return Object.entries(data)
      .map(([k, v]) => `  ${k.padEnd(24)} ${typeof v === "object" ? JSON.stringify(v) : v}`)
      .join("\n");
  }
  return String(data);
}

function formatTable(rows) {
  if (rows.length === 0) return "(no results)";
  const headers = Object.keys(rows[0]);
  const widths = headers.map(h =>
    Math.max(h.length, ...rows.map(r => String(r[h] ?? "").length))
  );
  const sep = widths.map(w => "─".repeat(w + 2)).join("┼");
  const headerLine = headers.map((h, i) => ` ${h.padEnd(widths[i])} `).join("│");
  const dataLines = rows.map(r =>
    headers.map((h, i) => ` ${String(r[h] ?? "").padEnd(widths[i])} `).join("│")
  );
  return [headerLine, sep, ...dataLines].join("\n");
}

// ── CUForge Module ───────────────────────────────────────────────────────────

const cuforgeCommands = {
  async rollback({ flags, named }) {
    const parcelId = named["parcel"] ?? named["parcel-id"] ?? "UNKNOWN";
    const startYear = parseInt(named["start-year"] ?? "2018");
    const endYear = parseInt(named["end-year"] ?? new Date().getFullYear().toString());
    const currentMarketValue = parseFloat(named["market-value"] ?? "350000");
    const currentUseValue = parseFloat(named["use-value"] ?? "50000");

    const result = await apiPost(flags.api, "/api/currentuse/rollback", {
      parcelId, startYear, endYear, currentMarketValue, currentUseValue,
    });
    return result;
  },

  async interest({ flags, named }) {
    if (named["calculate"]) {
      const principal = parseFloat(named["principal"] ?? "10000");
      const startYear = parseInt(named["start-year"] ?? "2020");
      const endYear = parseInt(named["end-year"] ?? new Date().getFullYear().toString());
      return apiPost(flags.api, "/api/currentuse/interest/calculate", {
        principal, startYear, endYear,
      });
    }
    return apiGet(flags.api, "/api/currentuse/interest-rates");
  },

  async enroll({ flags, named }) {
    return apiPost(flags.api, "/api/currentuse/classifications", {
      parcelId: named["parcel"] ?? named["parcel-id"],
      classificationCode: named["code"] ?? "DFL",
      acreage: parseFloat(named["acreage"] ?? "20"),
      enrollmentDate: named["date"] ?? new Date().toISOString().split("T")[0],
      status: "Active",
    });
  },

  async removals({ flags, named }) {
    if (named["initiate"]) {
      return apiPost(flags.api, "/api/currentuse/removals", {
        parcelId: named["parcel"] ?? named["parcel-id"],
        reason: named["reason"] ?? "Voluntary",
        removalDate: named["date"] ?? new Date().toISOString().split("T")[0],
      });
    }
    return apiGet(flags.api, "/api/currentuse/removals");
  },

  async classifications({ flags, named }) {
    const page = named["page"] ?? "1";
    const pageSize = named["page-size"] ?? "25";
    return apiGet(flags.api, `/api/currentuse/classifications?page=${page}&pageSize=${pageSize}`);
  },

  async penalties({ flags, named }) {
    const parcelId = named["parcel"] ?? named["parcel-id"] ?? "UNKNOWN";
    return apiGet(flags.api, `/api/currentuse/penalty-exceptions?parcelId=${parcelId}`);
  },
};

// ── LevyForge Module ─────────────────────────────────────────────────────────

const levyCommands = {
  async calculate({ flags, named }) {
    const assessedValue = parseFloat(named["av"] ?? named["assessed-value"] ?? "500000");
    const levyRate = parseFloat(named["rate"] ?? named["levy-rate"] ?? "10.0");
    const districtId = named["district"] ?? named["district-id"] ?? "FD1";
    const taxYear = parseInt(named["year"] ?? new Date().getFullYear().toString());

    return apiPost(flags.api, "/api/levy/calculate", {
      assessedValue, levyRate, districtId, taxYear,
    });
  },

  async rates({ flags }) {
    return apiGet(flags.api, "/api/levy/ipd-rates");
  },

  async certify({ flags, named }) {
    const districtId = named["district"] ?? named["district-id"];
    const taxYear = parseInt(named["year"] ?? new Date().getFullYear().toString());
    return apiPost(flags.api, "/api/levy/certify", { districtId, taxYear });
  },

  async project({ flags, named }) {
    const districtId = named["district"] ?? named["district-id"];
    const years = parseInt(named["years"] ?? "5");
    return apiPost(flags.api, "/api/levy/revenue-projection", { districtId, projectionYears: years });
  },

  async risk({ flags, named }) {
    const districtId = named["district"] ?? named["district-id"];
    return apiGet(flags.api, `/api/levy/risk-score?districtId=${districtId}`);
  },
};

// ── SalesForge Module ────────────────────────────────────────────────────────

const salesCommands = {
  async qualify({ flags, named }) {
    const parcelId = named["parcel"] ?? named["parcel-id"];
    return apiPost(flags.api, "/api/terraforge/sale-qualification", { parcelId });
  },

  async comps({ flags, named }) {
    const parcelId = named["parcel"] ?? named["parcel-id"];
    const radius = named["radius"] ?? "1.0";
    const months = named["months"] ?? "12";
    return apiPost(flags.api, "/api/terraforge/comps-pool", {
      parcelId, radiusMiles: parseFloat(radius), monthsBack: parseInt(months),
    });
  },

  async ratio({ flags, named }) {
    const area = named["area"] ?? named["neighborhood"];
    const year = named["year"] ?? new Date().getFullYear().toString();
    return apiPost(flags.api, "/api/terraforge/ratio-study", {
      area, taxYear: parseInt(year),
    });
  },

  async regression({ flags, named }) {
    const area = named["area"] ?? named["neighborhood"];
    return apiPost(flags.api, "/api/terraforge/regression", { area });
  },
};

// ── CostForge Module ─────────────────────────────────────────────────────────

const costCommands = {
  async estimate({ flags, named }) {
    const buildingType = named["type"] ?? named["building-type"] ?? "Residential";
    const squareFeet = parseFloat(named["sqft"] ?? named["square-feet"] ?? "2000");
    const quality = named["quality"] ?? "Average";
    const region = named["region"] ?? "Benton";
    const yearBuilt = parseInt(named["year-built"] ?? "2000");

    return apiPost(flags.api, "/api/costforge/cost-estimate", {
      buildingType, squareFeet, quality, region, yearBuilt,
    });
  },

  async depreciation({ flags, named }) {
    const age = parseInt(named["age"] ?? "20");
    const condition = named["condition"] ?? "Average";
    const buildingType = named["type"] ?? named["building-type"] ?? "Residential";

    return apiPost(flags.api, "/api/costforge/depreciation", {
      effectiveAge: age, condition, buildingType,
    });
  },

  async income({ flags, named }) {
    const grossIncome = parseFloat(named["income"] ?? named["gross-income"] ?? "120000");
    const vacancyRate = parseFloat(named["vacancy"] ?? "0.05");
    const operatingExpenseRatio = parseFloat(named["expense-ratio"] ?? "0.35");
    const capRate = parseFloat(named["cap-rate"] ?? "0.08");

    return apiPost(flags.api, "/api/costforge/income-approach", {
      grossIncome, vacancyRate, operatingExpenseRatio, capRate,
    });
  },

  async matrix({ flags, named }) {
    const region = named["region"] ?? "Benton";
    return apiGet(flags.api, `/api/costforge/cost-matrix?region=${region}`);
  },

  async batch({ flags, named }) {
    const batchFile = flags.batch ?? named["file"];
    if (!batchFile) {
      throw new Error("--batch <file> is required for batch processing");
    }

    if (flags.kernel) {
      return runRustKernelBatch(batchFile, "cost");
    }

    // HTTP batch mode
    const lines = fs.readFileSync(batchFile, "utf-8").trim().split("\n");
    const results = [];
    const batchSize = 50;

    for (let i = 0; i < lines.length; i += batchSize) {
      const chunk = lines.slice(i, i + batchSize).map(l => JSON.parse(l));
      const res = await apiPost(flags.api, "/api/costforge/batch-estimate", { parcels: chunk });
      results.push(...(Array.isArray(res) ? res : [res]));
      if (!flags.json) {
        process.stderr.write(`\r  Processed ${Math.min(i + batchSize, lines.length)}/${lines.length} parcels`);
      }
    }
    if (!flags.json) process.stderr.write("\n");
    return results;
  },
};

// ── Rust Kernel Integration ──────────────────────────────────────────────────

function runRustKernelBatch(batchFile, kernelType) {
  const kernelMap = {
    cost: "terraforge.kernel.cost",
    valuation: "terraforge.kernel.valuation",
  };

  const kernelName = kernelMap[kernelType];
  if (!kernelName) throw new Error(`Unknown kernel type: ${kernelType}`);

  const kernelDir = path.join(ROOT, "packages", "terrabuild", "kernels", kernelName);
  const binaryName = kernelType === "cost" ? "terraforge-kernel-cost" : "terraforge-kernel-valuation";
  const binaryPath = path.join(kernelDir, "target", "release", binaryName);

  // Check if kernel binary exists
  if (!fs.existsSync(binaryPath)) {
    // Try to build it
    process.stderr.write(`  Building Rust kernel: ${kernelName}...\n`);
    try {
      execSync(`cargo build --release`, { cwd: kernelDir, stdio: "pipe" });
    } catch (e) {
      throw new Error(
        `Failed to build Rust kernel ${kernelName}.\n` +
        `Ensure Rust toolchain is installed: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh\n` +
        `Then run: cd ${kernelDir} && cargo build --release`
      );
    }
  }

  // Process batch file through kernel
  const lines = fs.readFileSync(batchFile, "utf-8").trim().split("\n");
  const results = [];

  for (const line of lines) {
    const payload = JSON.parse(line);
    const invocation = JSON.stringify({
      contractPackVersion: "1.0.0",
      moduleApiVersion: "1.0.0",
      requestId: crypto.randomUUID(),
      action: kernelType === "cost" ? "calculate_cost" : "calculate_valuation",
      payload,
    });

    try {
      const output = execSync(`echo '${invocation.replace(/'/g, "'\\''")}' | "${binaryPath}"`, {
        encoding: "utf-8",
        timeout: 5000,
      });
      results.push(JSON.parse(output));
    } catch (e) {
      results.push({ success: false, error: e.message, input: payload });
    }
  }

  return results;
}

// ── Module Router ────────────────────────────────────────────────────────────

const modules = {
  cuforge: { commands: cuforgeCommands, description: "Current Use (enrollment, rollback, interest, removals)" },
  levy: { commands: levyCommands, description: "Levy calculation, certification, revenue projection" },
  sales: { commands: salesCommands, description: "Sale qualification, comps, ratio study, regression" },
  cost: { commands: costCommands, description: "Cost estimate, depreciation, income approach, batch" },
};

// ── Help Text ────────────────────────────────────────────────────────────────

function showHelp(module) {
  if (module && modules[module]) {
    const mod = modules[module];
    const cmds = Object.keys(mod.commands);
    console.log(`\n  tf forge ${module} — ${mod.description}\n`);
    console.log(`  Available actions:`);
    cmds.forEach(c => console.log(`    ${c}`));
    console.log(`\n  Use: tf forge ${module} <action> --help for action-specific options\n`);
    return;
  }

  console.log(`
  TerraForge CLI — Unified command-line interface for all TerraForge modules

  Usage:  tf forge <module> <action> [options]

  Modules:
    cuforge      Current Use (enrollment, rollback, interest, removals, penalties)
    levy         Levy calculation, certification, revenue projection, risk
    sales        Sale qualification, comps pool, ratio study, regression
    cost         Cost estimate, depreciation, income approach, batch processing

  Global options:
    --api <url>     Override API base URL (default: ${DEFAULT_API})
    --json          Machine-readable JSON output
    --csv           CSV output (for list/table commands)
    --batch <file>  Process a batch file (NDJSON, one record per line)
    --kernel        Use Rust kernel for batch processing (cost only)
    --help          Show this help

  Examples:
    tf forge cuforge rollback --parcel P-12345 --start-year 2018
    tf forge cuforge interest --calculate --principal 50000 --start-year 2020
    tf forge cuforge enroll --parcel P-99999 --code DFL --acreage 40
    tf forge levy calculate --district FD1 --av 500000 --rate 1.5
    tf forge levy project --district FD1 --years 5
    tf forge sales qualify --parcel P-12345
    tf forge sales comps --parcel P-12345 --radius 2.0 --months 18
    tf forge sales ratio --area Downtown --year 2025
    tf forge cost estimate --type residential --sqft 2400 --quality good
    tf forge cost depreciation --age 25 --condition average
    tf forge cost income --income 120000 --vacancy 0.05 --cap-rate 0.08
    tf forge cost batch --batch parcels.ndjson --kernel
  `);
}

// ── Main Entry Point ─────────────────────────────────────────────────────────

/**
 * Default export — called by tf.mjs dispatcher.
 * @param {{ root: string, flags: object, rest: string[], argv: string[] }} ctx
 */
export default async function forge(ctx) {
  const { rest, flags: tfFlags } = ctx;

  // Parse forge-specific args from rest
  const module = rest[0] ?? null;
  const action = rest[1] ?? null;
  const forgeFlags = {
    json: tfFlags.json ?? false,
    csv: false,
    help: tfFlags.help ?? false,
    kernel: false,
    api: DEFAULT_API,
    batch: null,
  };
  const named = {};

  for (let i = 2; i < rest.length; i++) {
    const arg = rest[i];
    if (arg === "--json") forgeFlags.json = true;
    else if (arg === "--csv") forgeFlags.csv = true;
    else if (arg === "--help" || arg === "-h") forgeFlags.help = true;
    else if (arg === "--kernel") forgeFlags.kernel = true;
    else if (arg === "--api" && rest[i + 1]) { forgeFlags.api = rest[++i]; }
    else if (arg === "--batch" && rest[i + 1]) { forgeFlags.batch = rest[++i]; }
    else if (arg.startsWith("--") && rest[i + 1] && !rest[i + 1].startsWith("--")) {
      named[arg.slice(2)] = rest[++i];
    } else if (arg.startsWith("--")) {
      named[arg.slice(2)] = true;
    }
  }

  if (forgeFlags.help || !module) {
    showHelp(module);
    return 0;
  }

  const mod = modules[module];
  if (!mod) {
    console.error(`  Unknown module: ${module}`);
    console.error(`  Available: ${Object.keys(modules).join(", ")}`);
    return 1;
  }

  if (!action || !mod.commands[action]) {
    console.error(`  Unknown action: ${action ?? "(none)"}`);
    console.error(`  Available for ${module}: ${Object.keys(mod.commands).join(", ")}`);
    return 1;
  }

  try {
    const result = await mod.commands[action]({ flags: forgeFlags, named });
    console.log(formatOutput(result, forgeFlags));
    return 0;
  } catch (err) {
    if (forgeFlags.json) {
      console.error(JSON.stringify({ error: err.message }));
    } else {
      console.error(`\n  ✗ Error: ${err.message}\n`);
    }
    return 1;
  }
}
