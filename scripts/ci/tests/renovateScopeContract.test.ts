// scripts/ci/tests/renovateScopeContract.test.ts
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Renovate Scope Contract", () => {
    // We execute the actual script against the ACTUAL repo state
    // This is a "Contract Test" - strictly enforcing the governance rule
    
    it("enforces renovate.json exists and is compliant", () => {
        const scriptPath = join(__dirname, "../renovateScopeSanity.js");
        const projectRoot = join(__dirname, "../../..");
        
        // Execute the validator in the real repo root
        const result = spawnSync("node", [scriptPath], {
            cwd: projectRoot,
            encoding: "utf-8",
            env: { ...process.env, CI: "true" } // Force CI mode if applicable
        });

        if (result.status !== 0) {
            console.error("STDOUT:", result.stdout);
            console.error("STDERR:", result.stderr);
        }

        expect(result.status).toBe(0);
        expect(result.stdout).toContain("RENOVATE_SCOPE_OK");
        
        // Snapshot verification
        const snapshotPath = join(projectRoot, "governance-renovate-scope-snapshot.json");
        expect(fs.existsSync(snapshotPath)).toBe(true);
        
        try {
            const snapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf-8"));
            expect(snapshot.status).toBe("OK");
            expect(snapshot.metrics.matchedCount).toBeLessThanOrEqual(60);
        } catch (e) {
            throw new Error(`Snapshot invalid: ${e.message}`);
        }
    });
});
