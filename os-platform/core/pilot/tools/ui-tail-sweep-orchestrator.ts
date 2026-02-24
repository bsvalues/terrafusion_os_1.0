/**
 * UI Tail Sweep Orchestrator
 *
 * Purpose:
 * - Deterministically scan a set of files for raw-color leaks (rgba/rgb/hex/numeric hsl/hsla).
 * - Print a stable, lexical report: count + first hit location.
 * - Optionally generate leak-guard tests for each file using the canonical path resolver.
 *
 * Notes:
 * - This does NOT modify target files unless --write-tests is provided.
 * - Output is stable: sorted by (count desc, file asc).
 */

import fs from "node:fs";
import path from "node:path";

export type RawColorHit = {
  file: string;
  count: number;
  firstLine?: number;
  firstSnippet?: string;
};

export type ScanResult = {
  hits: RawColorHit[];
  totalFiles: number;
  totalHits: number;
};

export const RAW_COLOR_REGEX =
  /rgba\(|#(?:[0-9a-fA-F]{3,8})\b|hsla\(|\brgb\(|\bhsl\(\s*\d/g;

export function scanTextForRawColors(text: string): {
  count: number;
  firstIndex: number;
} {
  let count = 0;
  let firstIndex = -1;
  RAW_COLOR_REGEX.lastIndex = 0;

  let m: RegExpExecArray | null;
  while ((m = RAW_COLOR_REGEX.exec(text)) !== null) {
    count++;
    if (firstIndex === -1) firstIndex = m.index;
  }

  return { count, firstIndex };
}

export function locateLineAndSnippet(
  text: string,
  index: number,
): { line: number; snippet: string } {
  if (index < 0) return { line: 1, snippet: "" };

  let line = 1;
  for (let i = 0; i < index && i < text.length; i++) {
    if (text.charCodeAt(i) === 10) line++;
  }

  const start = Math.max(0, index - 40);
  const end = Math.min(text.length, index + 40);
  const snippet = text.slice(start, end).replace(/\s+/g, " ").trim();

  return { line, snippet };
}

export function scanFiles(
  files: string[],
  readFile: (p: string, enc: string) => string = (p, enc) =>
    fs.readFileSync(p, enc as BufferEncoding) as string,
): ScanResult {
  const hits: RawColorHit[] = [];
  let totalHits = 0;

  for (const file of files) {
    const text = readFile(file, "utf8");
    const { count, firstIndex } = scanTextForRawColors(text);
    if (count > 0) {
      totalHits += count;
      const loc = locateLineAndSnippet(text, firstIndex);
      hits.push({
        file,
        count,
        firstLine: loc.line,
        firstSnippet: loc.snippet,
      });
    } else {
      hits.push({ file, count: 0 });
    }
  }

  // Stable sort: count desc, file asc
  hits.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.file.localeCompare(b.file);
  });

  return { hits, totalFiles: files.length, totalHits };
}

export function toLeakGuardTestName(targetFile: string): string {
  const base = targetFile
    .replace(/\\/g, "/")
    .replace(/^.*frontend\//, "frontend/")
    .replace(/[^a-zA-Z0-9/._-]/g, "")
    .replace(/\//g, "-")
    .replace(/\./g, "-")
    .toLowerCase();

  return `${base}-leak-guard.test.ts`;
}

export function renderLeakGuardTest(targetFile: string): string {
  const normalized = targetFile.replace(/\\/g, "/");
  return `import fs from "node:fs";
import path from "node:path";
import { assertNoRawColorLeaks } from "../../../frontend/apps/os-shell/src/tools/ui-tokens/leak-guard";

describe("${path.basename(targetFile)} leak guard", () => {
  it("contains no raw color values", () => {
    const filePath = path.resolve(__dirname, "..", "..", "..", ${JSON.stringify(
      normalized,
    )});

    expect(fs.existsSync(filePath), \`Expected file to exist: \${filePath}\`).toBe(true);

    const content = fs.readFileSync(filePath, "utf8");
    assertNoRawColorLeaks(content, { label: ${JSON.stringify(path.basename(targetFile))} });
  });
});
`;
}

export function writeLeakGuardTest(
  targetFile: string,
  testsRoot: string,
): string {
  const testName = toLeakGuardTestName(targetFile);
  const outPath = path.resolve(testsRoot, testName);

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, renderLeakGuardTest(targetFile), "utf8");

  return outPath;
}

function parseArgs(argv: string[]) {
  const args = new Set(argv);
  const writeTests = args.has("--write-tests");
  const testsRootArgIndex = argv.indexOf("--tests-root");
  const testsRoot =
    testsRootArgIndex >= 0 && argv[testsRootArgIndex + 1]
      ? argv[testsRootArgIndex + 1]
      : "os-platform/core/tests";

  const listArgIndex = argv.indexOf("--list");
  const listPath = listArgIndex >= 0 ? argv[listArgIndex + 1] : undefined;

  return { writeTests, testsRoot, listPath };
}

if (require.main === module) {
  const { writeTests, testsRoot, listPath } = parseArgs(
    process.argv.slice(2),
  );

  if (!listPath) {
    throw new Error("Missing --list <path-to-json-file-list>");
  }

  const raw = fs.readFileSync(listPath, "utf8");
  const files: unknown = JSON.parse(raw);

  if (!Array.isArray(files) || !files.every((f) => typeof f === "string")) {
    throw new Error("List file must be a JSON array of strings.");
  }

  const result = scanFiles(files as string[]);
  const report = {
    ok: result.totalHits === 0,
    totalFiles: result.totalFiles,
    totalHits: result.totalHits,
    hits: result.hits,
  };

  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);

  if (writeTests) {
    const written: string[] = [];
    for (const h of result.hits) {
      if (h.count > 0) {
        written.push(writeLeakGuardTest(h.file, testsRoot));
      }
    }
    process.stdout.write(
      `${JSON.stringify({ generatedTests: written }, null, 2)}\n`,
    );
  }

  process.exit(report.ok ? 0 : 2);
}
