import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CORE_DIR = path.resolve(__dirname, "..");
const FIXTURES_DIR = path.join(CORE_DIR, "fixtures", "tools");

export function loadToolFixture(toolId, which) {
  const p = path.join(FIXTURES_DIR, toolId, `${which}.json`);
  const raw = fs.readFileSync(p, "utf8");
  return JSON.parse(raw);
}
