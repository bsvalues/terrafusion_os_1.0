import { createHash, randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { relative, resolve, sep } from 'node:path';

import { LocalAgentCardLockStore } from './cardLock.js';
import { appendLocalAgentEvent, terrafusionPath } from './eventLog.js';
import { matchesGlob } from './policy.js';

export interface LocalAgentPatchProposal {
  id: string;
  path: string;
  oldSha256: string;
  newSha256: string;
  createdAt: number;
  diff: string;
}

interface StoredPatchProposal {
  proposal: LocalAgentPatchProposal;
  newContent: string;
}

export class LocalAgentPatchPreview {
  private readonly cardStore: LocalAgentCardLockStore;

  constructor(private readonly repoRoot: string) {
    this.cardStore = new LocalAgentCardLockStore(repoRoot);
  }

  previewReplacement(targetPath: string, newContent: string): LocalAgentPatchProposal {
    const card = this.cardStore.requireLockedCard();
    const resolved = this.resolveWorkspacePath(targetPath);
    const relativePath = toRepoRelative(this.repoRoot, resolved);
    const scope = checkScope(relativePath, card.allowedFiles, card.forbiddenFiles);
    if (!scope.ok) {
      appendLocalAgentEvent(this.repoRoot, 'patch_preview_denied', {
        path: relativePath,
        reason: scope.reason,
        matchedRule: scope.matchedRule ?? null,
      });
      throw new Error(scope.reason);
    }

    const stats = statSync(resolved, { throwIfNoEntry: false });
    if (stats && !stats.isFile()) {
      throw new Error(`Target is not a file: ${relativePath}`);
    }

    const oldContent = stats ? readFileSync(resolved, 'utf8') : '';
    const proposal: LocalAgentPatchProposal = {
      id: `patch_${randomUUID().replace(/-/g, '').slice(0, 12)}`,
      path: relativePath,
      oldSha256: sha256(oldContent),
      newSha256: sha256(newContent),
      createdAt: Math.floor(Date.now() / 1000),
      diff: createUnifiedDiff(relativePath, oldContent, newContent),
    };

    this.storeProposal(proposal, newContent);
    appendLocalAgentEvent(this.repoRoot, 'patch_preview_created', {
      id: proposal.id,
      path: proposal.path,
      oldSha256: proposal.oldSha256,
      newSha256: proposal.newSha256,
      diffChars: proposal.diff.length,
    });
    return proposal;
  }

  applyPatch(patchId: string, approved: boolean): LocalAgentPatchProposal {
    if (!approved) {
      appendLocalAgentEvent(this.repoRoot, 'patch_apply_denied', { id: patchId, reason: 'approval_missing' });
      throw new Error('Patch apply requires explicit approval.');
    }

    const card = this.cardStore.requireLockedCard();
    const payload = this.loadProposal(patchId);
    const scope = checkScope(payload.proposal.path, card.allowedFiles, card.forbiddenFiles);
    if (!scope.ok) {
      appendLocalAgentEvent(this.repoRoot, 'patch_apply_denied', {
        id: patchId,
        path: payload.proposal.path,
        reason: scope.reason,
        matchedRule: scope.matchedRule ?? null,
      });
      throw new Error(scope.reason);
    }

    const target = this.resolveWorkspacePath(payload.proposal.path);
    const currentContent = statSync(target, { throwIfNoEntry: false }) ? readFileSync(target, 'utf8') : '';
    if (sha256(currentContent) !== payload.proposal.oldSha256) {
      appendLocalAgentEvent(this.repoRoot, 'patch_apply_denied', {
        id: patchId,
        path: payload.proposal.path,
        reason: 'stale_preimage',
      });
      throw new Error('File changed since preview. Re-run patch preview.');
    }

    mkdirSync(resolve(target, '..'), { recursive: true });
    writeFileSync(target, payload.newContent, 'utf8');
    appendLocalAgentEvent(this.repoRoot, 'patch_applied', {
      id: payload.proposal.id,
      path: payload.proposal.path,
      newSha256: payload.proposal.newSha256,
    });
    return payload.proposal;
  }

  showPatch(patchId: string): string {
    return this.loadProposal(patchId).proposal.diff;
  }

  private storeProposal(proposal: LocalAgentPatchProposal, newContent: string): void {
    mkdirSync(terrafusionPath(this.repoRoot, 'patches'), { recursive: true });
    const payload: StoredPatchProposal = { proposal, newContent };
    writeFileSync(terrafusionPath(this.repoRoot, 'patches', `${proposal.id}.json`), JSON.stringify(payload, null, 2), 'utf8');
    writeFileSync(terrafusionPath(this.repoRoot, 'patches', `${proposal.id}.diff`), proposal.diff, 'utf8');
  }

  private loadProposal(patchId: string): StoredPatchProposal {
    return JSON.parse(readFileSync(terrafusionPath(this.repoRoot, 'patches', `${patchId}.json`), 'utf8')) as StoredPatchProposal;
  }

  private resolveWorkspacePath(rawPath: string): string {
    const resolved = resolve(this.repoRoot, rawPath);
    const repo = resolve(this.repoRoot);
    const diff = relative(repo, resolved);
    if (diff === '..' || diff.startsWith(`..${sep}`) || diff.startsWith('../')) {
      throw new Error(`Path escapes workspace: ${rawPath}`);
    }

    return resolved;
  }
}

function toRepoRelative(repoRoot: string, absolutePath: string): string {
  return relative(resolve(repoRoot), resolve(absolutePath)).split(sep).join('/');
}

function sha256(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

function checkScope(path: string, allowedFiles: string[], forbiddenFiles: string[]): { ok: boolean; reason: string; matchedRule?: string } {
  const normalized = path.replace(/\\/g, '/').replace(/^\.\//, '');
  for (const rule of forbiddenFiles) {
    if (matchesGlob(normalized, rule.replace(/^\.\//, ''))) {
      return { ok: false, reason: `Target path is forbidden by locked card: ${rule}`, matchedRule: rule };
    }
  }

  for (const rule of allowedFiles) {
    if (matchesGlob(normalized, rule.replace(/^\.\//, ''))) {
      return { ok: true, reason: `Target path allowed by locked card: ${rule}`, matchedRule: rule };
    }
  }

  return { ok: false, reason: 'Target path does not match locked card allowedFiles.' };
}

function createUnifiedDiff(path: string, oldContent: string, newContent: string): string {
  const oldLines = oldContent.split(/\r?\n/);
  const newLines = newContent.split(/\r?\n/);
  const lines = [
    `--- a/${path}`,
    `+++ b/${path}`,
    `@@ -1,${oldLines.length} +1,${newLines.length} @@`,
  ];
  const length = Math.max(oldLines.length, newLines.length);

  for (let index = 0; index < length; index += 1) {
    const previous = oldLines[index];
    const next = newLines[index];

    if (previous === next) {
      continue;
    }

    if (previous !== undefined) {
      lines.push(`-${previous}`);
    }
    if (next !== undefined) {
      lines.push(`+${next}`);
    }
  }

  return lines.join('\n');
}