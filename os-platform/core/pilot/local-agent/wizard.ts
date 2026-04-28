import { createInterface } from 'node:readline/promises';
import type { Interface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { readFileSync } from 'node:fs';

import { LocalAgentCardLockStore } from './cardLock.js';
import { LocalAgentFinalizeRunner } from './finalize.js';
import { LocalAgentProofRunner } from './proof.js';
import { LocalAgentSaveStateWriter } from './saveState.js';

export interface FounderWizardIO {
  prompt(message: string): Promise<string | null>;
  write(message: string): void;
  close?(): void;
}

class LocalAgentWizardInputClosed extends Error {}

export class LocalAgentFounderWizard {
  private readonly cardStore: LocalAgentCardLockStore;
  private readonly tfDir: string;

  constructor(private readonly repoRoot: string, private readonly io: FounderWizardIO = createConsoleWizardIO()) {
    this.cardStore = new LocalAgentCardLockStore(repoRoot);
    this.tfDir = `${repoRoot}/.terrafusion`;
  }

  async run(): Promise<number> {
    this.write('');
    this.write('TerraFusion Local Agent');
    this.write('=======================');
    this.write('Founder Cockpit: local-first, proof-gated, scope-locked.');
    this.write('');

    try {
      while (true) {
        await this.printStatusSnapshot();
        this.printMenu();

        const choice = (await this.prompt('Choose: ')).trim().toLowerCase();
        if (choice === 'q' || choice === 'quit' || choice === 'exit') {
          this.write('Exiting TerraFusion Local Agent.');
          return 0;
        }

        switch (choice) {
          case '1':
          case 'pick up':
          case 'pickup':
            await this.pickUp();
            break;
          case '2':
          case 'start':
          case 'slice':
            await this.startBoundedSlice();
            break;
          case '3':
          case 'card':
            await this.showCurrentCard();
            break;
          case '4':
          case 'proof':
            await this.runProof();
            break;
          case '5':
          case 'save':
            await this.writeSaveState();
            break;
          case '6':
          case 'finalize':
            await this.finalize();
            break;
          case '7':
          case 'clear':
            await this.clearCard();
            break;
          default:
            this.write('Unknown choice. The raccoon looked at the button and blinked.');
            break;
        }

        await this.prompt('\nPress Enter to continue...');
        this.write('');
      }
    } catch (error) {
      if (error instanceof LocalAgentWizardInputClosed) {
        this.write('Input stream ended. Exiting TerraFusion Local Agent.');
        return 0;
      }

      throw error;
    } finally {
      this.io.close?.();
    }
  }

  private async printStatusSnapshot(): Promise<void> {
    this.write('Status');
    this.write('------');
    this.write(`Repo:   ${this.repoRoot}`);
    this.write(`Branch: ${this.git(['rev-parse', '--abbrev-ref', 'HEAD']) || 'unknown'}`);
    this.write(`Git:    ${this.git(['status', '--short']) ? 'changes present' : 'clean or unavailable'}`);

    try {
      const card = this.cardStore.load();
      this.write(`Card:   ${card.id}`);
    } catch {
      this.write('Card:   none');
    }

    this.write(`Proof:  ${this.fileExists('proof-results.json') ? 'results found' : 'not run'}`);
    this.write(`Save:   ${this.fileExists('save-state.md') ? 'found' : 'none'}`);
  }

  private printMenu(): void {
    this.write('');
    this.write('What are we doing?');
    this.write('');
    this.write('1. Pick up where we left off');
    this.write('2. Start a bounded slice');
    this.write('3. Show current work card');
    this.write('4. Run proof gates');
    this.write('5. Save state');
    this.write('6. Finalize');
    this.write('7. Clear current work card');
    this.write('q. Quit');
    this.write('');
  }

  private async pickUp(): Promise<void> {
    if (!this.fileExists('save-state.md')) {
      this.write('No save state found.');
      this.write('Start with option 2: Start a bounded slice.');
      return;
    }

    this.write('');
    this.write('Last Save State');
    this.write('---------------');
    this.write(readFileSync(`${this.tfDir}/save-state.md`, 'utf8').slice(0, 4000));
  }

  private async startBoundedSlice(): Promise<void> {
    this.write('');
    const task = (await this.prompt('Describe the task in plain English: ')).trim();
    if (!task) {
      this.write('No task entered. Scope box refused to exist.');
      return;
    }

    let overwrite = false;
    if (this.cardStore.exists()) {
      overwrite = (await this.prompt('A work card already exists. Overwrite it? [y/N]: ')).trim().toLowerCase() === 'y';
    }

    try {
      const card = this.cardStore.lockFromTask(task, overwrite);
      this.write('');
      this.write('Work card locked.');
      this.write('');
      this.write(readFileSync(`${this.tfDir}/current-work-card.md`, 'utf8'));
      this.write(`Proof gates: ${card.proofGates.join(', ')}`);
    } catch (error) {
      this.write(`Could not lock card: ${(error as Error).message}`);
    }
  }

  private async showCurrentCard(): Promise<void> {
    try {
      this.write(this.cardStore.loadMarkdown());
    } catch (error) {
      this.write(`No current work card: ${(error as Error).message}`);
    }
  }

  private async runProof(): Promise<void> {
    this.write('');
    this.write('Running proof gates from locked card...');
    try {
      const report = new LocalAgentProofRunner(this.repoRoot).run();
      this.write('');
      this.write(`Proof Result: ${report.ok ? 'PASS' : 'FAIL'}`);
      for (const result of report.results) {
        const status = result.skipped ? 'BLOCKED' : result.ok ? 'PASS' : 'FAIL';
        this.write(`- [${status}] ${result.command}`);
      }
    } catch (error) {
      this.write(`Proof blocked: ${(error as Error).message}`);
    }
  }

  private async writeSaveState(): Promise<void> {
    this.write('');
    const summary = (await this.prompt('Summary of what happened: ')).trim();
    const nextStep = (await this.prompt('Next exact step: ')).trim();
    const notes: string[] = [];

    while (true) {
      const note = (await this.prompt('Optional note, blank to finish: ')).trim();
      if (!note) {
        break;
      }

      notes.push(note);
    }

    try {
      const report = new LocalAgentSaveStateWriter(this.repoRoot).write(summary, nextStep, notes);
      this.write('');
      this.write('Save State written.');
      this.write(`- Summary: ${report.summary}`);
      this.write(`- Next:    ${report.nextExactStep}`);
      this.write('- Path:    .terrafusion/save-state.md');
    } catch (error) {
      this.write(`Save State blocked: ${(error as Error).message}`);
    }
  }

  private async finalize(): Promise<void> {
    this.write('');
    this.write('Finalizing current locked-card run...');
    try {
      const report = new LocalAgentFinalizeRunner(this.repoRoot).finalize();
      this.write('');
      this.write('Finalize PASS');
      this.write(`Work Card: ${report.workCardId}`);
      this.write(`Task:      ${report.task}`);
      this.write('');
      this.write('Commit:');
      this.write(`git commit -m "${report.commitMessage}"`);
      this.write('');
      this.write('Final report:');
      this.write('.terrafusion/final-report.md');
    } catch (error) {
      this.write(`Finalize blocked: ${(error as Error).message}`);
    }
  }

  private async clearCard(): Promise<void> {
    if ((await this.prompt('Clear current work card? [y/N]: ')).trim().toLowerCase() !== 'y') {
      this.write('Card preserved.');
      return;
    }

    this.write(this.cardStore.clear() ? 'Current work card cleared.' : 'No current work card existed.');
  }

  private git(args: string[]): string {
    const { runProcess } = require('./command.js') as typeof import('./command.js');
    const result = runProcess(this.repoRoot, ['git', ...args].join(' '), 5);
    return result.exitCode === 0 ? result.output.trim() : '';
  }

  private fileExists(fileName: string): boolean {
    try {
      readFileSync(`${this.tfDir}/${fileName}`, 'utf8');
      return true;
    } catch {
      return false;
    }
  }

  private write(message: string): void {
    this.io.write(message);
  }

  private async prompt(message: string): Promise<string> {
    const value = await this.io.prompt(message);
    if (value === null) {
      throw new LocalAgentWizardInputClosed();
    }

    return value;
  }
}

function createConsoleWizardIO(): FounderWizardIO {
  if (!input.isTTY) {
    const buffered = readFileSync(0, 'utf8').split(/\r?\n/);
    let offset = 0;
    return {
      async prompt(message: string) {
        console.log(message);
        if (offset >= buffered.length) {
          return null;
        }
        const value = buffered[offset] ?? '';
        offset += 1;
        return value;
      },
      write(message: string) {
        console.log(message);
      },
    };
  }

  const rl = createInterface({ input, output });
  return {
    prompt(message: string) {
      return rl.question(message);
    },
    write(message: string) {
      console.log(message);
    },
    close() {
      rl.close();
    },
  };
}