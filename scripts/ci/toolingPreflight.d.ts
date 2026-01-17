// Type definitions for toolingPreflight.js

export interface PreflightIO {
  readFile: (p: string) => string;
  exit: (code: number) => never;
  log: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

export function runPreflight(repoRoot?: string, io?: PreflightIO): void;
