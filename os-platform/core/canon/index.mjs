/**
 * Canon Runtime (Core) — public read-only API.
 *
 * One shared, deterministic query layer over static Canon law. Surfaces
 * (os-canon, CLI, IDE) consume this; they do not re-implement it. This MVP is
 * read-only: it answers questions, it does not edit files, run commands, or
 * dispatch agents.
 *
 * @module canon
 */

export { loadCanon } from './canon-loader.mjs';
export {
  getRulesForPath,
  getRulesForTask,
  getOwnerForPath,
  getRequiredGatesForPath,
  getLaneForPath,
  pathMatchesPattern,
  normalizePath,
} from './canon-query.mjs';
export { scorePathRisk } from './canon-risk.mjs';
