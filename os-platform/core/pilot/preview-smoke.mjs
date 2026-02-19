#!/usr/bin/env node

const DEFAULT_BASE_URL = "http://localhost:5001";

function parseArgs(argv) {
  const args = argv.slice(2);
  const baseUrlIndex = args.indexOf("--base-url");
  const baseUrl =
    baseUrlIndex >= 0 && args[baseUrlIndex + 1]
      ? args[baseUrlIndex + 1]
      : process.env.PILOT_PREVIEW_BASE_URL || DEFAULT_BASE_URL;
  return { baseUrl };
}

function trimSlash(value) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let parsed = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = null;
  }

  return {
    status: response.status,
    okHttp: response.ok,
    text,
    parsed,
  };
}

function formatError(result) {
  if (!result.parsed || typeof result.parsed !== "object") {
    return `invalid JSON response (status ${result.status})`;
  }

  if (typeof result.parsed.error === "string" && result.parsed.error.trim()) {
    return result.parsed.error.trim();
  }

  if (typeof result.parsed.message === "string" && result.parsed.message.trim()) {
    return result.parsed.message.trim();
  }

  return `overallOk=false (status ${result.status})`;
}

async function run() {
  const { baseUrl } = parseArgs(process.argv);
  const root = trimSlash(baseUrl);

  const checks = [
    {
      id: "canon_ping",
      path: "/pilot/canon/ping",
      body: { echo: "preview-smoke" },
    },
    {
      id: "workbench_explain_model_inputs",
      path: "/pilot/workbench/explain-model-inputs",
      body: {},
    },
    {
      id: "workbench_compare_assessed_value_history",
      path: "/pilot/workbench/compare-assessed-value-history",
      body: {},
    },
  ];

  let failures = 0;
  const startedAt = new Date().toISOString();
  process.stdout.write(`Pilot Preview Smoke\nStarted: ${startedAt}\nBase URL: ${root}\n\n`);

  for (const check of checks) {
    const url = `${root}${check.path}`;
    try {
      const result = await postJson(url, check.body);
      const payload = result.parsed;
      const overallOk =
        result.okHttp &&
        payload &&
        typeof payload === "object" &&
        payload.overallOk === true;

      if (!overallOk) {
        failures += 1;
        const error = formatError(result);
        process.stdout.write(`FAIL ${check.id} ${check.path} - ${error}\n`);
        continue;
      }

      process.stdout.write(`PASS ${check.id} ${check.path}\n`);
    } catch (error) {
      failures += 1;
      const message = error instanceof Error ? error.message : String(error);
      process.stdout.write(`FAIL ${check.id} ${check.path} - request failed: ${message}\n`);
    }
  }

  process.stdout.write("\n");
  if (failures > 0) {
    process.stdout.write(`Result: FAIL (${failures} failing check${failures === 1 ? "" : "s"})\n`);
    process.exitCode = 1;
    return;
  }

  process.stdout.write("Result: PASS\n");
  process.exitCode = 0;
}

await run();

