import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import path from "node:path";

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

test("canon ping normalized toolId stays terracanon-ping", async () => {
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

    const response = await fetch(`http://127.0.0.1:${port}/pilot/canon/ping`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ echo: "nametag" }),
    });
    assert.equal(response.status, 200);

    const payload = await response.json();
    assert.equal(payload.overallOk, true);
    assert.equal(payload.normalized?.toolId, "terracanon-ping");
    assert.equal(payload.normalized?.echo, "nametag");
    assert.equal(payload.normalized?.inputCount, 1);
  } finally {
    await stopChild(child);
  }
});

