/**
 * Quarantine Plan Core — Pure deterministic move plan computation
 *
 * Zero side effects. Takes git-tracked entries + keep-list, returns
 * a sorted array of { from, to } moves.
 *
 * Buckets:
 *   tree  → QUARANTINE/top-level-dirs/<name>/
 *   blob (.md) → QUARANTINE/root-md/<name>
 *   blob (other) → QUARANTINE/root-artifacts/<name>
 */

const IGNORED = new Set(['node_modules', 'QUARANTINE']);
const HIDDEN_RE = /^\./;

/**
 * @param {{ entries: Array<{name: string, type: string}>, keepList: {dirs: string[], files: string[]} }} input
 * @returns {Array<{from: string, to: string}>}
 */
export function computePlan({ entries, keepList }) {
  const allowed = new Set([...keepList.dirs, ...keepList.files]);

  const moves = [];
  for (const { name, type } of entries) {
    if (HIDDEN_RE.test(name)) continue;
    if (IGNORED.has(name)) continue;
    if (allowed.has(name)) continue;

    const isDir = type === 'tree';
    const from = isDir ? `${name}/` : name;

    let bucket;
    if (isDir) {
      bucket = 'top-level-dirs';
    } else if (name.endsWith('.md')) {
      bucket = 'root-md';
    } else {
      bucket = 'root-artifacts';
    }

    moves.push({ from, to: `QUARANTINE/${bucket}/${from}` });
  }

  return moves.sort((a, b) => a.from.localeCompare(b.from));
}
