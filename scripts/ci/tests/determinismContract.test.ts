// scripts/ci/tests/determinismContract.test.ts
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Determinism Contract", () => {
    // The repo root is 3 levels up from scripts/ci/tests/
    const repoRoot = path.resolve(__dirname, "../../..");
    const logPath = path.join(repoRoot, "ci_determinism.log");

    it("runs determinism drill and produces valid audit log", () => {
        // Run the logged version of the determinism drill
        console.log("    [Contract] Invoking ci:test:determinism:log...");
        
        // Use os-specific pnpm alias to avoid shell:true
        const pnpmBin = os.platform() === "win32" ? "pnpm.cmd" : "pnpm";
        
        const result = spawnSync(pnpmBin, ["run", "ci:test:determinism:log"], {
            cwd: repoRoot,
            encoding: "utf-8",
            shell: false, // Security hardening + deprecation fix
            // modest timeout to failing fast if hung (30s)
            timeout: 30000 
        });

        if (result.status !== 0) {
            console.error("Determinism drill failed via contract test.");
            console.error("STDOUT:", result.stdout);
            console.error("STDERR:", result.stderr);
        }

        // 1. Exit code must be 0
        expect(result.status).toBe(0);

        // 2. Log file must exist
        expect(existsSync(logPath)).toBe(true);

        // 3. Log must contain the success marker defined in verifyScopeDeterminism.js
        const logContent = readFileSync(logPath, "utf-8");
        expect(logContent).toMatch(/Determinism check passed/i);
    });
});
