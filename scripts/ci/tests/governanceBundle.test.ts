import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// scripts/ci/tests/ -> ../../../ to root
const rootDir = path.resolve(__dirname, "../../../");
const packageJsonPath = path.join(rootDir, "package.json");

describe("Governance Bundle", () => {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  const scripts = packageJson.scripts;

  it("defines ci:governance-proof", () => {
    expect(scripts["ci:governance-proof"]).toBeDefined();
  });

  it("chains ci:scope-proof and ci:governance", () => {
    const proofScript = scripts["ci:governance-proof"];
    expect(proofScript).toContain("ci:scope-proof");
    expect(proofScript).toContain("ci:governance");
  });

  it("ensures dependent scripts exist", () => {
    // Verify referenced scripts in the chain exist
    const proofScript = scripts["ci:governance-proof"];
    // Split by && and clean up 'pnpm run ' or 'npm run '
    const commands = proofScript.split("&&").map(cmd => cmd.trim());

    commands.forEach(cmd => {
        // Only check npm/pnpm run commands
        if (cmd.startsWith("pnpm run ") || cmd.startsWith("npm run ")) {
            const scriptName = cmd.replace(/^(pnpm|npm) run /, "").trim();
            expect(scripts[scriptName], `Script '${scriptName}' referenced in bundle is missing`).toBeDefined();
        }
    });
  });

  it("ensures ci:governance script points to valid file", () => {
    const govScript = scripts["ci:governance"];
    // expect "node scripts/ci/governanceSentinel.js"
    const matches = govScript.match(/node\s+(.+)/);
    expect(matches).not.toBeNull();
    const relativePath = matches![1];
    const absolutePath = path.resolve(rootDir, relativePath);
    expect(fs.existsSync(absolutePath)).toBe(true);
  });
});
