/**
 * Shell Governance: single import authority for terrafusion-brand.css
 *
 * Enforces that `src/styles/terrafusion-brand.css` is imported from
 * exactly one TypeScript module (App.tsx). Duplicate imports cause
 * CSS cascade re-poisoning and make load-order guarantees meaningless.
 *
 * The assets/terrafusion-brand.css file (imported by TerraFusionLogo.tsx)
 * is a SEPARATE file with its own import authority — not covered here.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, out);
    else if (ent.isFile() && (full.endsWith(".ts") || full.endsWith(".tsx")))
      out.push(full);
  }
  return out;
}

test("Shell governance: terrafusion-brand.css is imported from exactly one authority module", () => {
  const repoRoot = process.cwd();
  const srcRoot = path.join(repoRoot, "frontend", "apps", "os-shell", "src");
  const files = walk(srcRoot);

  const target = "styles/terrafusion-brand.css";
  const importRe = new RegExp(
    `import\\s+["'][^"']*${target.replaceAll("/", "\\/")}["']\\s*;?`,
    "g"
  );

  const hits = [];
  for (const f of files) {
    const text = fs.readFileSync(f, "utf8");
    const m = text.match(importRe);
    if (m?.length) hits.push({ file: path.relative(srcRoot, f), count: m.length });
  }

  assert.equal(
    hits.length,
    1,
    `Expected exactly 1 import of ${target}. Found:\n` +
      hits.map((h) => `- ${h.file} (${h.count})`).join("\n")
  );
});
