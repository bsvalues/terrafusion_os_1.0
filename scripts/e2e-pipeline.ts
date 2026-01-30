/**
 * Root-level E2E pipeline CLI wrapper.
 *
 * Re-uses the TerraForge harness because the heavy lifting is already implemented there,
 * while exposing a clean entry point for CI, npm scripts, and the rest of the monorepo.
 */

import path from 'path';
import { pathToFileURL } from 'node:url';
import { runE2EPipeline } from '../applications/terraforge-suite/harness/src/e2e-pipeline.ts';

export { runE2EPipeline };
export type { PipelineResult } from '../applications/terraforge-suite/harness/src/e2e-pipeline.ts';

async function main() {
  const result = await runE2EPipeline();
  process.exit(result.success ? 0 : 1);
}

const entryPoint = process.argv?.[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';

if (import.meta.url === entryPoint) {
  main();
}
