import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { appendLocalAgentEvent, terrafusionPath } from './eventLog.js';
import {
  LocalAgentWorkCardFactory,
  renderLocalAgentWorkCard,
  type LocalAgentWorkCard,
} from './workCard.js';

export interface LockedLocalAgentCard {
  lockedAt: number;
  card: LocalAgentWorkCard;
}

export class LocalAgentCardLockStore {
  constructor(private readonly repoRoot: string) {}

  lockFromTask(task: string, overwrite = false): LocalAgentWorkCard {
    const card = new LocalAgentWorkCardFactory(this.repoRoot).build(task);
    this.lock(card, overwrite);
    return card;
  }

  lock(card: LocalAgentWorkCard, overwrite = false): void {
    if (this.exists() && !overwrite) {
      throw new Error('A work card is already locked. Clear it or pass overwrite=true.');
    }

    mkdirSync(terrafusionPath(this.repoRoot), { recursive: true });
    const payload: LockedLocalAgentCard = {
      lockedAt: Math.floor(Date.now() / 1000),
      card,
    };

    writeFileSync(this.jsonPath(), JSON.stringify(payload, null, 2), 'utf8');
    writeFileSync(this.markdownPath(), renderLocalAgentWorkCard(card), 'utf8');

    appendLocalAgentEvent(this.repoRoot, 'work_card_locked', {
      id: card.id,
      task: card.task,
      mode: card.mode,
      allowedFiles: card.allowedFiles,
      forbiddenFiles: card.forbiddenFiles,
      proofGates: card.proofGates,
      confidence: card.confidence,
    });
  }

  load(): LocalAgentWorkCard {
    if (!this.exists()) {
      throw new Error('No locked work card exists.');
    }

    const payload = JSON.parse(readFileSync(this.jsonPath(), 'utf8')) as LockedLocalAgentCard;
    return payload.card;
  }

  loadMarkdown(): string {
    if (!this.exists()) {
      throw new Error('No locked work card exists.');
    }

    return readFileSync(this.markdownPath(), 'utf8');
  }

  clear(): boolean {
    const existed = this.exists();
    rmSync(this.jsonPath(), { force: true });
    rmSync(this.markdownPath(), { force: true });

    appendLocalAgentEvent(this.repoRoot, 'work_card_cleared', { existed });
    return existed;
  }

  exists(): boolean {
    try {
      readFileSync(this.jsonPath(), 'utf8');
      return true;
    } catch {
      return false;
    }
  }

  requireLockedCard(): LocalAgentWorkCard {
    const card = this.load();
    if (card.allowedFiles.length === 0 || card.forbiddenFiles.length === 0 || card.proofGates.length === 0) {
      throw new Error('Locked work card is incomplete.');
    }

    return card;
  }

  private jsonPath(): string {
    return terrafusionPath(this.repoRoot, 'current-work-card.json');
  }

  private markdownPath(): string {
    return terrafusionPath(this.repoRoot, 'current-work-card.md');
  }
}