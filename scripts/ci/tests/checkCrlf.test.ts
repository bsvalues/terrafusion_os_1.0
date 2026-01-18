import { describe, expect, it } from "vitest";
import { runCrlfCheck } from "../checkCrlf.ts";

/**
 * CRLF Guard Tests
 * 
 * Tests the checkCrlf.js script using IO injection pattern.
 */

interface TestIO {
  exec: (cmd: string) => string;
  readFile: (path: string) => Buffer;
  exit: (code: number) => never;
  log: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

interface TestResult {
  exitCode: number | null;
  logs: string[];
  errors: string[];
}

function createTestIO(
  trackedFiles: string[],
  fileContents: Record<string, Buffer>
): { io: TestIO; result: TestResult } {
  const result: TestResult = { exitCode: null, logs: [], errors: [] };

  const io: TestIO = {
    exec: (cmd: string) => {
      // Allow only the specific git command used by the script
      if (cmd.trim() === 'git ls-files "*.sh"') {
        return trackedFiles.join("\n");
      }
      throw new Error(`Unexpected command: ${cmd}`);
    },
    readFile: (path: string) => {
      // Extract just the filename from the full path
      const fileName = trackedFiles.find(f => path.endsWith(f.replace(/\//g, "\\"))) 
                    || trackedFiles.find(f => path.endsWith(f));
      if (fileName && fileContents[fileName]) {
        return fileContents[fileName];
      }
      const error = new Error(`ENOENT: no such file: ${path}`);
      (error as NodeJS.ErrnoException).code = "ENOENT";
      throw error;
    },
    exit: (code: number) => {
      result.exitCode = code;
      throw new Error(`EXIT:${code}`);
    },
    log: (...args: unknown[]) => {
      result.logs.push(args.map(String).join(" "));
    },
    error: (...args: unknown[]) => {
      result.errors.push(args.map(String).join(" "));
    },
  };

  return { io, result };
}

describe("checkCrlf", () => {
  const MOCK_REPO = "/mock/repo";

  describe("runCrlfCheck", () => {
    it("exits 0 when no tracked .sh files exist", () => {
      const { io, result } = createTestIO([], {});
      expect(() => runCrlfCheck(io, MOCK_REPO)).toThrow("EXIT:0");
      expect(result.exitCode).toBe(0);
      expect(result.logs).toContainEqual(expect.stringContaining("No tracked *.sh files"));
    });

    it("exits 0 when all .sh files have LF endings", () => {
      const trackedFiles = ["scripts/test.sh", "ops/run.sh"];
      const fileContents: Record<string, Buffer> = {
        "scripts/test.sh": Buffer.from("#!/bin/bash\necho hello\n"),
        "ops/run.sh": Buffer.from("#!/bin/bash\necho world\n"),
      };
      const { io, result } = createTestIO(trackedFiles, fileContents);
      expect(() => runCrlfCheck(io, MOCK_REPO)).toThrow("EXIT:0");
      expect(result.exitCode).toBe(0);
      expect(result.logs).toContainEqual(expect.stringContaining("All 2 shell scripts have LF"));
    });

    it("exits 1 when CRLF is detected in a .sh file", () => {
      const trackedFiles = ["scripts/good.sh", "scripts/bad.sh"];
      const fileContents: Record<string, Buffer> = {
        "scripts/good.sh": Buffer.from("#!/bin/bash\necho good\n"),
        "scripts/bad.sh": Buffer.from("#!/bin/bash\r\necho bad\r\n"), // CRLF
      };
      const { io, result } = createTestIO(trackedFiles, fileContents);
      expect(() => runCrlfCheck(io, MOCK_REPO)).toThrow("EXIT:1");
      expect(result.exitCode).toBe(1);
      expect(result.errors).toContainEqual(expect.stringContaining("CRLF DETECTED"));
      expect(result.errors).toContainEqual(expect.stringContaining("scripts/bad.sh"));
    });

    it("reports all files with CRLF, not just the first", () => {
      const trackedFiles = ["a.sh", "b.sh", "c.sh"];
      const fileContents: Record<string, Buffer> = {
        "a.sh": Buffer.from("#!/bin/bash\r\n"), // CRLF
        "b.sh": Buffer.from("#!/bin/bash\n"),   // LF
        "c.sh": Buffer.from("#!/bin/bash\r\n"), // CRLF
      };
      const { io, result } = createTestIO(trackedFiles, fileContents);
      expect(() => runCrlfCheck(io, MOCK_REPO)).toThrow("EXIT:1");
      expect(result.errors.some(e => e.includes("a.sh"))).toBe(true);
      expect(result.errors.some(e => e.includes("c.sh"))).toBe(true);
      // b.sh should NOT be in errors
      expect(result.errors.some(e => e.includes("b.sh"))).toBe(false);
    });

    it("continues checking if a file cannot be read", () => {
      const trackedFiles = ["exists.sh", "missing.sh"];
      const fileContents: Record<string, Buffer> = {
        "exists.sh": Buffer.from("#!/bin/bash\n"),
        // missing.sh not in fileContents
      };
      const { io, result } = createTestIO(trackedFiles, fileContents);
      expect(() => runCrlfCheck(io, MOCK_REPO)).toThrow("EXIT:0");
      expect(result.exitCode).toBe(0);
      expect(result.errors).toContainEqual(expect.stringContaining("Could not read missing.sh"));
    });
  });
});
