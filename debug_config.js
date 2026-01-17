import fs from "node:fs";
import path from "node:path";
const p = path.join(process.cwd(), "tools/scope-classifier/vitest.config.ts");
console.log("Reading:", p);
const c = fs.readFileSync(p, "utf8");
console.log("Content length:", c.length);
console.log("Has setupFiles:", /setupFiles\s*:/.test(c));
console.log("Content:\n", c);
