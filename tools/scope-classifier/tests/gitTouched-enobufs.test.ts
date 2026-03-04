/**
 * CX-17: ENOBUFS regression test for gitTouched.ts
 *
 * Validates that the spawnSync + maxBuffer fix (PR #542) prevents
 * buffer overflow on large git diff outputs. Tests three failure modes:
 *   1. Large stdout (>1 MB) → parses successfully, no throw
 *   2. Non-zero exit status → throws with stderr message
 *   3. Spawn error (e.g., ENOBUFS) → surfaces the error
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SpawnSyncReturns } from "node:child_process";

// Mock child_process before importing the module under test
vi.mock("node:child_process", () => ({
  spawnSync: vi.fn(),
}));

// Mock fs.statSync so rootFromPath's repoRoot lookup doesn't hit real FS
vi.mock("node:fs", () => ({
  default: {
    statSync: vi.fn(() => {
      throw new Error("ENOENT");
    }),
  },
}));

import { spawnSync } from "node:child_process";
import { computeTouched } from "../src/gitTouched";

const mockedSpawnSync = vi.mocked(spawnSync);

function makeSpawnResult(
  overrides: Partial<SpawnSyncReturns<string>>,
): SpawnSyncReturns<string> {
  return {
    pid: 1234,
    output: [],
    stdout: "",
    stderr: "",
    status: 0,
    signal: null,
    error: undefined,
    ...overrides,
  };
}

describe("gitTouched ENOBUFS regression (CX-17)", () => {
  beforeEach(() => {
    mockedSpawnSync.mockReset();
  });

  it("handles large stdout (>1 MB) without throwing", () => {
    // Generate >1 MB of file paths (~20,000 lines × ~60 chars each ≈ 1.2 MB)
    const lines: string[] = [];
    for (let i = 0; i < 20_000; i++) {
      lines.push(`backend/src/TerraFusion.API/Controllers/Controller${i}.cs`);
    }
    const largeOutput = lines.join("\n") + "\n";
    expect(largeOutput.length).toBeGreaterThan(1_000_000);

    mockedSpawnSync.mockReturnValue(makeSpawnResult({ stdout: largeOutput }));

    const touched = computeTouched("/fake/repo", "abc123");

    // Should parse without throwing and produce correct roots
    expect(touched["backend"]).toBe(true);
    expect(touched["."]).toBe(true);

    // Verify spawnSync was called with the 64 MB maxBuffer
    expect(mockedSpawnSync).toHaveBeenCalledOnce();
    const callArgs = mockedSpawnSync.mock.calls[0];
    expect(callArgs[0]).toBe("git");
    expect(callArgs[2]).toMatchObject({
      maxBuffer: 64 * 1024 * 1024,
    });
  });

  it("throws on non-zero exit with stderr message", () => {
    mockedSpawnSync.mockReturnValue(
      makeSpawnResult({
        status: 128,
        stderr: "fatal: bad revision 'nonexistent..HEAD'",
      }),
    );

    expect(() => computeTouched("/fake/repo", "nonexistent")).toThrow(
      "fatal: bad revision 'nonexistent..HEAD'",
    );
  });

  it("throws on non-zero exit with fallback message when stderr is empty", () => {
    mockedSpawnSync.mockReturnValue(
      makeSpawnResult({ status: 1, stderr: "" }),
    );

    expect(() => computeTouched("/fake/repo", "abc123")).toThrow(
      /git .+ exited 1/,
    );
  });

  it("surfaces spawn error (e.g., ENOBUFS)", () => {
    const spawnError = new Error("spawnSync git ENOBUFS");
    (spawnError as NodeJS.ErrnoException).code = "ENOBUFS";

    mockedSpawnSync.mockReturnValue(
      makeSpawnResult({ error: spawnError }),
    );

    expect(() => computeTouched("/fake/repo", "abc123")).toThrow("ENOBUFS");
  });

  it("parses multi-segment paths correctly from large output", () => {
    const lines = [
      "os-platform/core/src/index.ts",
      "tools/registry/manifest.json",
      "frontend/apps/os-shell/src/main.tsx",
      "backend/src/TerraFusion.API/Program.cs",
      "packages/os-core/dist/index.js",
    ];
    mockedSpawnSync.mockReturnValue(
      makeSpawnResult({ stdout: lines.join("\n") + "\n" }),
    );

    const touched = computeTouched("/fake/repo", "abc123");

    // Two-segment roots fall back to single-segment when fs.statSync
    // can't verify the directory (mocked environment).  The important
    // assertion is that ALL lines are parsed and produce roots.
    expect(touched["os-platform"]).toBe(true);
    expect(touched["tools"]).toBe(true);
    expect(touched["frontend"]).toBe(true);
    expect(touched["backend"]).toBe(true);
    expect(touched["packages"]).toBe(true);
    expect(touched["."]).toBe(true);
  });
});
