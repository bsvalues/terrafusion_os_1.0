/**
 * Vitest unit tests for ops-health-report.
 * These tests are deterministic and do not invoke git.
 * We feed fake porcelain output like a tiny government simulator.
 */

import { describe, expect, it } from "vitest";
import {
  classify,
  computeOpsHealthReport,
  parseGitPorcelainZ,
  type Exec,
} from "./ops-health-report";

describe("ops-health-report", () => {
  it("parses porcelain -z and classifies staged/unstaged/untracked", () => {
    const fake =
      " M os-platform/core/tests/leak-guard-coverage-mapping.test.ts\0" +
      "A  os-platform/core/tests/no-untracked-leak-guards.test.ts\0" +
      "?? pact/\0";

    const entries = parseGitPorcelainZ(fake);
    const { staged, unstaged, untracked } = classify(entries);

    expect(staged.map((e) => e.path)).toContain(
      "os-platform/core/tests/no-untracked-leak-guards.test.ts",
    );
    expect(unstaged.map((e) => e.path)).toContain(
      "os-platform/core/tests/leak-guard-coverage-mapping.test.ts",
    );
    expect(untracked.map((e) => e.path)).toContain("pact/");
  });

  it("flags untracked pact/ as a finding", () => {
    const exec: Exec = (cmd, args) => {
      const key = `${cmd} ${args.join(" ")}`;
      if (key === "git rev-parse HEAD") return "deadbeef";
      if (key === "git rev-parse --abbrev-ref HEAD") return "main";
      if (key === "git status --porcelain=v1 -z") return "?? pact/\0";
      return "";
    };

    const report = computeOpsHealthReport({ exec });
    expect(report.ok).toBe(false);
    expect(report.findings.join("\n")).toMatch(/Untracked pact\/ detected/);
  });

  it("flags staged paths outside allowlist", () => {
    const exec: Exec = (cmd, args) => {
      const key = `${cmd} ${args.join(" ")}`;
      if (key === "git rev-parse HEAD") return "cafebabe";
      if (key === "git rev-parse --abbrev-ref HEAD") return "feature/x";
      if (key === "git status --porcelain=v1 -z")
        return "A  some-random-place/secrets.txt\0";
      return "";
    };

    const report = computeOpsHealthReport({ exec });
    expect(report.ok).toBe(false);
    expect(report.findings.join("\n")).toMatch(/outside allowlist/);
  });

  it("reports ok when repo is clean", () => {
    const exec: Exec = (cmd, args) => {
      const key = `${cmd} ${args.join(" ")}`;
      if (key === "git rev-parse HEAD") return "abc123";
      if (key === "git rev-parse --abbrev-ref HEAD") return "main";
      if (key === "git status --porcelain=v1 -z") return "";
      return "";
    };

    const report = computeOpsHealthReport({ exec });
    expect(report.ok).toBe(true);
    expect(report.findings).toHaveLength(0);
    expect(report.headSha).toBe("abc123");
    expect(report.branch).toBe("main");
  });

  it("handles rename records by keeping destination path", () => {
    const fake = "R  old-name.ts -> new-name.ts\0";
    const entries = parseGitPorcelainZ(fake);
    expect(entries[0].path).toBe("new-name.ts");
  });
});
