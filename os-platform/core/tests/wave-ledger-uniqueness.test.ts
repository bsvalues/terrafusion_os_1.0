import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

type Entry = { phaseLabel: string; commit: string };

describe("WAVE_LEDGER uniqueness", () => {
  it("does not reuse the same Phase label with different commits", () => {
    const filePath = path.join(
      process.cwd(),
      "os-platform/core/governance/WAVE_LEDGER.md",
    );
    const text = fs.readFileSync(filePath, "utf8");

    // Match lines like: "- Phase 110 — e48943388 — ..."
    const re = /^\-\s+(Phase\s+\d+)\s+—\s+([0-9a-f]{7,40})\s+—/gim;

    const entries: Entry[] = [];
    let m: RegExpExecArray | null;

    while ((m = re.exec(text)) !== null) {
      entries.push({ phaseLabel: m[1], commit: m[2] });
    }

    const byPhase = new Map<string, Set<string>>();
    for (const e of entries) {
      if (!byPhase.has(e.phaseLabel)) byPhase.set(e.phaseLabel, new Set());
      byPhase.get(e.phaseLabel)!.add(e.commit);
    }

    const collisions: string[] = [];
    for (const [phase, commits] of byPhase.entries()) {
      if (commits.size > 1)
        collisions.push(`${phase}: ${Array.from(commits).join(", ")}`);
    }

    expect(
      collisions,
      `Phase label collisions detected:\n${collisions.join("\n")}`,
    ).toEqual([]);
  });
});
