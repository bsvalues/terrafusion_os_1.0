import { execSync } from "node:child_process";
import path from "node:path";

export function getTrackedDirs(repoRoot: string): Set<string> | null {
  try {
    const output = execSync("git ls-files -z", {
      cwd: repoRoot,
      maxBuffer: 50 * 1024 * 1024,
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString("utf8")
      .split("\0")
      .filter(Boolean);

    const dirs = new Set<string>(["."]);
    for (const file of output) {
      const normalized = file.replace(/\\/g, "/");
      let dir = path.posix.dirname(normalized);
      while (dir && dir !== "." && dir !== "/") {
        dirs.add(dir);
        const next = path.posix.dirname(dir);
        if (next === dir) break;
        dir = next;
      }
      dirs.add(dir === "." ? "." : dir);
    }

    return dirs;
  } catch {
    return null;
  }
}
