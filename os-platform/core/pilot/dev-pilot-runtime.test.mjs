import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import path from "node:path";

const manifest = JSON.parse(
  readFileSync(path.resolve("tools/registry/terrapilot.tools.json"), "utf8")
);

function getManifestTool(toolId) {
  const tool = manifest.tools.find((entry) => entry?.toolId === toolId);
  assert.ok(tool, `expected manifest tool ${toolId} to exist`);
  return tool;
}

function sortedKeys(value) {
  return Object.keys(value).sort();
}

function assertTopLevelKeys(payload, expectedKeys, message) {
  assert.deepEqual(sortedKeys(payload), [...expectedKeys].sort(), message);
}

function omitParams(params, keysToRemove) {
  const next = { ...params };
  for (const key of keysToRemove) {
    delete next[key];
  }
  return next;
}

function collectFailureText(payload) {
  return [
    payload?.error,
    payload?.errorCode,
    JSON.stringify(payload?.result ?? null),
    ...(Array.isArray(payload?.violations) ? payload.violations.map((value) => String(value)) : []),
  ]
    .filter(Boolean)
    .join(" ");
}

function assertMentionsRequiredKeys(text, requiredKeys, label) {
  for (const key of requiredKeys) {
    assert.match(text, new RegExp(`\\b${key}\\b`, "i"), `${label} must mention missing ${key}`);
  }
}

async function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("failed to allocate test port"));
        return;
      }
      const port = address.port;
      server.close((err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(port);
      });
    });
  });
}

async function waitForReady(child, timeoutMs = 30_000) {
  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    let done = false;

    const finish = (fn, value) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      fn(value);
    };

    const timer = setTimeout(() => {
      finish(
        reject,
        new Error(
          `pilot runtime did not become ready in ${timeoutMs}ms\nSTDOUT:\n${stdout}\nSTDERR:\n${stderr}`
        )
      );
    }, timeoutMs);

    child.stdout?.on("data", (chunk) => {
      const text = chunk.toString();
      stdout += text;
      if (text.includes("[pilot] runtime listening")) {
        finish(resolve, { stdout, stderr });
      }
    });
    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("exit", (code) => {
      finish(
        reject,
        new Error(
          `pilot runtime exited before ready (code ${code ?? "unknown"})\nSTDOUT:\n${stdout}\nSTDERR:\n${stderr}`
        )
      );
    });
  });
}

async function stopChild(child) {
  if (child.exitCode !== null) return;

  const exitPromise = new Promise((resolve) => {
    child.once("exit", () => resolve());
  });

  child.kill();
  const timed = new Promise((resolve) => setTimeout(resolve, 2_000));
  await Promise.race([exitPromise, timed]);

  if (child.exitCode === null) {
    child.kill("SIGKILL");
    await exitPromise;
  }
}

async function postJson(port, pathname, body, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const response = await fetch(`http://127.0.0.1:${port}${pathname}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  return { status: response.status, payload };
}

async function getJson(port, pathname, options = {}) {
  const response = await fetch(`http://127.0.0.1:${port}${pathname}`, {
    method: "GET",
    headers: options.headers || {},
  });
  const payload = await response.json();
  return { status: response.status, payload };
}

test("pilot invoke and validate stay aligned on irreversible ingress context", async () => {
  const port = await getFreePort();
  const runtimePath = path.resolve("os-platform/core/pilot/dev-pilot-runtime.mjs");
  const child = spawn(process.execPath, [runtimePath], {
    cwd: path.resolve("."),
    env: {
      ...process.env,
      PILOT_PORT: String(port),
      TF_API_PORT: process.env.TF_API_PORT || "5046",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  const requestBody = {
    toolId: "request_trace_redaction",
    mode: "pilot",
    confirmation: true,
    reasonCode: "data_subject_request",
    params: {
      county: "benton",
      traceEventIds: ["trace-event-1"],
      reason: "Remove restricted payload reference",
    },
    supervisorApproval: {
      approvedBy: "supervisor-chief",
      approvedAt: "2026-03-18T12:00:00Z",
      role: "supervisor",
    },
  };
  const requestHeaders = {
    "x-user-id": "admin-1",
    "x-county-id": "benton",
    "x-role": "administrator",
  };

  try {
    await waitForReady(child);

    const validation = await postJson(port, "/pilot/validate", requestBody, {
      headers: requestHeaders,
    });
    assert.equal(validation.status, 200);
    assert.equal(validation.payload.valid, true);
    assert.equal(validation.payload.preflight.confirmationProvided, true);
    assert.equal(validation.payload.preflight.reasonCodeProvided, true);
    assert.equal(validation.payload.preflight.supervisorProvided, true);
    assert.equal(validation.payload.tool.toolId, "request_trace_redaction");

    const invocation = await postJson(port, "/pilot/invoke", requestBody, {
      headers: requestHeaders,
    });
    assert.equal(invocation.status, 200);
    assert.equal(invocation.payload.ok, true);
    assert.equal(invocation.payload.result.status, "pending_review");
    assert.equal(invocation.payload.result.eventsMarked, 1);
    assert.match(invocation.payload.result.payloadRef, /^secure-blob:\/\//);

    const missingSupervisor = await postJson(
      port,
      "/pilot/invoke",
      {
        ...requestBody,
        supervisorApproval: undefined,
      },
      { headers: requestHeaders }
    );
    assert.equal(missingSupervisor.status, 200);
    assert.equal(missingSupervisor.payload.ok, false);
    assert.equal(missingSupervisor.payload.errorCode, "SUPERVISOR_APPROVAL_REQUIRED");

    const missingSupervisorValidation = await postJson(
      port,
      "/pilot/validate",
      {
        ...requestBody,
        supervisorApproval: undefined,
      },
      { headers: requestHeaders }
    );
    assert.equal(missingSupervisorValidation.status, 200);
    assert.equal(missingSupervisorValidation.payload.valid, false);
    assert.equal(missingSupervisorValidation.payload.preflight.supervisorRequired, true);
    assert.equal(missingSupervisorValidation.payload.preflight.supervisorProvided, false);
    assert.ok(
      missingSupervisorValidation.payload.violations.some((violation) =>
        String(violation).includes("SUPERVISOR_APPROVAL_REQUIRED")
      )
    );
  } finally {
    await stopChild(child);
  }
});

test("pilot invoke and validate enforce county isolation from header context", async () => {
  const port = await getFreePort();
  const runtimePath = path.resolve("os-platform/core/pilot/dev-pilot-runtime.mjs");
  const child = spawn(process.execPath, [runtimePath], {
    cwd: path.resolve("."),
    env: {
      ...process.env,
      PILOT_PORT: String(port),
      TF_API_PORT: process.env.TF_API_PORT || "5046",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  const requestBody = {
    toolId: "request_trace_redaction",
    mode: "pilot",
    confirmation: true,
    reasonCode: "court_order",
    params: {
      county: "yakima",
      traceEventIds: ["trace-event-1"],
      reason: "Mismatch should be rejected before handler execution",
    },
    supervisorApproval: {
      approvedBy: "supervisor-chief",
      approvedAt: "2026-03-18T12:00:00Z",
      role: "supervisor",
    },
  };
  const requestHeaders = {
    "x-user-id": "admin-1",
    "x-county-id": "benton",
    "x-role": "administrator",
  };

  try {
    await waitForReady(child);

    const validation = await postJson(port, "/pilot/validate", requestBody, {
      headers: requestHeaders,
    });
    assert.equal(validation.status, 200);
    assert.equal(validation.payload.valid, false);
    assert.ok(
      validation.payload.violations.some((violation) =>
        String(violation).includes("COUNTY_MISMATCH")
      )
    );

    const invocation = await postJson(port, "/pilot/invoke", requestBody, {
      headers: requestHeaders,
    });
    assert.equal(invocation.status, 200);
    assert.equal(invocation.payload.ok, false);
    assert.equal(invocation.payload.errorCode, "COUNTY_MISMATCH");
  } finally {
    await stopChild(child);
  }
});

test("pilot validate short-circuits on canonical mode mismatch for governed write tools", async () => {
  const port = await getFreePort();
  const runtimePath = path.resolve("os-platform/core/pilot/dev-pilot-runtime.mjs");
  const child = spawn(process.execPath, [runtimePath], {
    cwd: path.resolve("."),
    env: {
      ...process.env,
      PILOT_PORT: String(port),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  const requestBody = {
    toolId: "assign_task",
    mode: "muse",
    params: {},
  };
  const requestHeaders = {
    "x-user-id": "viewer-1",
    "x-county-id": "benton",
    "x-role": "viewer",
  };

  try {
    await waitForReady(child);

    const validation = await postJson(port, "/pilot/validate", requestBody, {
      headers: requestHeaders,
    });
    assert.equal(validation.status, 200);
    assert.equal(validation.payload.valid, false);
    assert.equal(validation.payload.tool.toolId, "assign_task");
    assert.equal(validation.payload.preflight.confirmationRequired, true);
    assert.equal(validation.payload.preflight.confirmationProvided, false);
    assert.equal(validation.payload.preflight.reasonCodeRequired, true);
    assert.equal(validation.payload.preflight.reasonCodeProvided, false);

    const violations = validation.payload.violations.map((violation) => String(violation));
    assert.deepEqual(violations, ["Mode mismatch: tool requires pilot, got muse"]);

    const invocation = await postJson(port, "/pilot/invoke", requestBody, {
      headers: requestHeaders,
    });
    assert.equal(invocation.status, 200);
    assert.equal(invocation.payload.ok, false);
    assert.equal(invocation.payload.errorCode, "MODE_MISMATCH");
  } finally {
    await stopChild(child);
  }
});

test("pilot validate exposes canonical risk and RBAC violations after mode passes", async () => {
  const port = await getFreePort();
  const runtimePath = path.resolve("os-platform/core/pilot/dev-pilot-runtime.mjs");
  const child = spawn(process.execPath, [runtimePath], {
    cwd: path.resolve("."),
    env: {
      ...process.env,
      PILOT_PORT: String(port),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  const requestBody = {
    toolId: "assign_task",
    mode: "pilot",
    params: {},
  };
  const requestHeaders = {
    "x-user-id": "viewer-1",
    "x-county-id": "benton",
    "x-role": "viewer",
  };

  try {
    await waitForReady(child);

    const validation = await postJson(port, "/pilot/validate", requestBody, {
      headers: requestHeaders,
    });
    assert.equal(validation.status, 200);
    assert.equal(validation.payload.valid, false);
    assert.equal(validation.payload.tool.toolId, "assign_task");
    assert.equal(validation.payload.preflight.confirmationRequired, true);
    assert.equal(validation.payload.preflight.confirmationProvided, false);
    assert.equal(validation.payload.preflight.reasonCodeRequired, true);
    assert.equal(validation.payload.preflight.reasonCodeProvided, false);

    const violations = validation.payload.violations.map((violation) => String(violation));
    assert.ok(violations.some((violation) => violation.includes("CONFIRMATION_REQUIRED")));
    assert.ok(violations.some((violation) => violation.includes("REASON_CODE_REQUIRED")));
    assert.ok(violations.some((violation) => violation.includes("PERMISSION_DENIED")));
  } finally {
    await stopChild(child);
  }
});

test("pilot validate and invoke freeze their successful public top-level envelopes", async () => {
  const port = await getFreePort();
  const runtimePath = path.resolve("os-platform/core/pilot/dev-pilot-runtime.mjs");
  const child = spawn(process.execPath, [runtimePath], {
    cwd: path.resolve("."),
    env: {
      ...process.env,
      PILOT_PORT: String(port),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  const requestBody = {
    toolId: "summarize_parcel_casefile",
    mode: "muse",
    params: {
      county: "benton",
      parcelId: "1-0531-100-0001-000",
      include: ["appeals", "notices"],
    },
  };
  const requestHeaders = {
    "x-user-id": "appraiser-1",
    "x-county-id": "benton",
    "x-role": "appraiser",
  };

  try {
    await waitForReady(child);

    const validation = await postJson(port, "/pilot/validate", requestBody, {
      headers: requestHeaders,
    });
    assert.equal(validation.status, 200);
    assertTopLevelKeys(
      validation.payload,
      ["valid", "violations", "tool", "preflight"],
      "validate envelope must stay frozen"
    );
    assert.equal(validation.payload.valid, true);

    const invocation = await postJson(port, "/pilot/invoke", requestBody, {
      headers: requestHeaders,
    });
    assert.equal(invocation.status, 200);
    assertTopLevelKeys(
      invocation.payload,
      ["ok", "correlationId", "result", "traceEventId"],
      "invoke success envelope must stay frozen"
    );
    assert.equal(invocation.payload.ok, true);
  } finally {
    await stopChild(child);
  }
});

test("pilot validate and invoke stay aligned on paramsSchema.required for missing one and multiple params", async () => {
  const port = await getFreePort();
  const runtimePath = path.resolve("os-platform/core/pilot/dev-pilot-runtime.mjs");
  const child = spawn(process.execPath, [runtimePath], {
    cwd: path.resolve("."),
    env: {
      ...process.env,
      PILOT_PORT: String(port),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  const tool = getManifestTool("summarize_parcel_casefile");
  const requiredKeys = tool.paramsSchema?.required;
  assert.deepEqual(requiredKeys, ["county", "parcelId"]);

  const baseRequest = {
    toolId: tool.toolId,
    mode: "muse",
    params: {
      county: "benton",
      parcelId: "1-0531-100-0001-000",
      include: ["appeals", "notices"],
    },
  };
  const requestHeaders = {
    "x-user-id": "appraiser-1",
    "x-county-id": "benton",
    "x-role": "appraiser",
  };

  const cases = [
    { label: "missing one", missingKeys: [requiredKeys[0]] },
    { label: "missing multiple", missingKeys: [...requiredKeys] },
  ];

  try {
    await waitForReady(child);

    for (const testCase of cases) {
      const requestBody = {
        ...baseRequest,
        params: omitParams(baseRequest.params, testCase.missingKeys),
      };

      const validation = await postJson(port, "/pilot/validate", requestBody, {
        headers: requestHeaders,
      });
      assert.equal(validation.status, 200, `${testCase.label} validate must stay 200`);
      assertTopLevelKeys(
        validation.payload,
        ["valid", "violations", "tool", "preflight"],
        `${testCase.label} validate envelope must stay frozen`
      );
      assert.equal(validation.payload.valid, false, `${testCase.label} validate must fail`);
      assert.equal(validation.payload.tool.toolId, tool.toolId);
      assertMentionsRequiredKeys(
        collectFailureText(validation.payload),
        testCase.missingKeys,
        `${testCase.label} validate failure`
      );

      const invocation = await postJson(port, "/pilot/invoke", requestBody, {
        headers: requestHeaders,
      });
      assert.equal(invocation.status, 200, `${testCase.label} invoke must stay 200`);
      assertTopLevelKeys(
        invocation.payload,
        ["ok", "correlationId", "result", "error", "errorCode"],
        `${testCase.label} invoke failure envelope must stay frozen`
      );
      assert.equal(invocation.payload.ok, false, `${testCase.label} invoke must fail`);
      assertMentionsRequiredKeys(
        collectFailureText(invocation.payload),
        testCase.missingKeys,
        `${testCase.label} invoke failure`
      );
    }
  } finally {
    await stopChild(child);
  }
});

test("pilot invoke failure stops before request_trace_redaction side effects", async () => {
  const port = await getFreePort();
  const runtimePath = path.resolve("os-platform/core/pilot/dev-pilot-runtime.mjs");
  const child = spawn(process.execPath, [runtimePath], {
    cwd: path.resolve("."),
    env: {
      ...process.env,
      PILOT_PORT: String(port),
      TF_API_PORT: process.env.TF_API_PORT || "5046",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  const requestBody = {
    toolId: "request_trace_redaction",
    mode: "pilot",
    confirmation: true,
    reasonCode: "court_order",
    params: {
      county: "benton",
      traceEventIds: ["trace-event-1"],
    },
    supervisorApproval: {
      approvedBy: "supervisor-chief",
      approvedAt: "2026-03-18T12:00:00Z",
      role: "supervisor",
    },
  };
  const requestHeaders = {
    "x-user-id": "admin-1",
    "x-county-id": "benton",
    "x-role": "administrator",
  };

  try {
    await waitForReady(child);

    const before = await getJson(port, "/pilot/trace?toolId=request_trace_redaction&limit=100");
    assert.equal(before.status, 200);
    assert.deepEqual(before.payload.events, []);

    const invocation = await postJson(port, "/pilot/invoke", requestBody, {
      headers: requestHeaders,
    });
    assert.equal(invocation.status, 200);
    assertTopLevelKeys(
      invocation.payload,
      ["ok", "correlationId", "result", "error", "errorCode"],
      "invoke failure envelope must stay frozen when handler rejects missing params"
    );
    assert.equal(invocation.payload.ok, false);
    const failureText = collectFailureText(invocation.payload);
    assert.match(failureText, /Tool execution failed/i);
    assert.doesNotMatch(failureText, /Error:\s|node:internal| at |[A-Z]:\\|\/users?\//i);

    const after = await getJson(port, "/pilot/trace?toolId=request_trace_redaction&limit=100");
    assert.equal(after.status, 200);
    const eventTypes = after.payload.events.map((event) => event.type);
    assert.ok(eventTypes.includes("tool_failed"));
    assert.ok(!eventTypes.includes("redaction_requested"));
  } finally {
    await stopChild(child);
  }
});

test("pilot runtime preview endpoints return overallOk true", async () => {
  const port = await getFreePort();
  const runtimePath = path.resolve("os-platform/core/pilot/dev-pilot-runtime.mjs");
  const child = spawn(process.execPath, [runtimePath], {
    cwd: path.resolve("."),
    env: {
      ...process.env,
      PILOT_PORT: String(port),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  try {
    await waitForReady(child);

    const ping = await postJson(port, "/pilot/canon/ping", { echo: "nametag" });
    assert.equal(ping.status, 200);
    assert.equal(ping.payload.overallOk, true);
    assert.equal(ping.payload.normalized?.toolId, "terracanon-ping");
    assert.equal(ping.payload.normalized?.echo, "nametag");
    assert.equal(ping.payload.normalized?.inputCount, 1);

    const explain = await postJson(port, "/pilot/workbench/explain-model-inputs", {});
    assert.equal(explain.status, 200);
    assert.equal(explain.payload.overallOk, true);
    assert.equal(explain.payload.tool, "explain_model_inputs");
    assert.equal(explain.payload.normalized?.toolId, "explain_model_inputs");
    assert.ok(typeof explain.payload.normalized?.inputCount === "number");

    const compare = await postJson(port, "/pilot/workbench/compare-assessed-value-history", {});
    assert.equal(compare.status, 200);
    assert.equal(compare.payload.overallOk, true);
    assert.equal(compare.payload.tool, "compare_assessed_value_history");
    assert.ok(Array.isArray(compare.payload.normalized?.trend));

    const salesComps = await postJson(port, "/pilot/workbench/summarize-sales-comps-rationale", {});
    assert.equal(salesComps.status, 200);
    assert.equal(salesComps.payload.overallOk, true);
    assert.equal(salesComps.payload.tool, "summarize_sales_comps_rationale");
    assert.ok(typeof salesComps.payload.normalized?.rationale === "string");
    assert.ok(Array.isArray(salesComps.payload.normalized?.comps));
  } finally {
    await stopChild(child);
  }
});
