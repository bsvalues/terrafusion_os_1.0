/**
 * Context Pack Integration for Workspace Companion
 *
 * Wires the WorkspaceCompanionAgent to the DX Spine Context Pack system.
 * Per DX_SPINE_CHARTER.md §2: Context Pack is the atomic unit of memory.
 *
 * This module:
 * - Reads Context Pack on startup
 * - Updates Context Pack with Companion state
 * - Emits events for Context Pack changes
 */

import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';

export interface ContextPack {
  version: string;
  generated: string;
  generator: string;
  repo: {
    root: string;
    branch: string;
    lastCommit: string;
    dirtyFiles: string[];
  };
  focus: {
    scene: string | null;
    lane: 'dev' | 'governance' | 'ops' | 'security' | 'data';
    pr: number | null;
    intent: string | null;
  };
  health: {
    services: Record<string, { port: number; status: 'up' | 'down' | 'unknown' }>;
    overallHealth: 'excellent' | 'good' | 'warning' | 'critical';
  };
  governance: {
    tier1EvidenceStatus: 'complete' | 'partial' | 'missing' | 'not-applicable';
    dodVersion: string;
    sceneEnforcementActive: boolean;
    missingEvidence: string[];
  };
  todos: {
    critical: Array<{ file: string; line: number; text: string }>;
    high: Array<{ file: string; line: number; text: string }>;
    medium: Array<{ file: string; line: number; text: string }>;
    low: Array<{ file: string; line: number; text: string }>;
  };
  nextActions: string[];
  companion?: {
    status: 'active' | 'inactive' | 'error';
    capabilities: {
      total: number;
      active: number;
      aiPowered: number;
    };
    lastAction: string | null;
    sessionDuration: number;
  };
}

export class ContextPackIntegration extends EventEmitter {
  private contextPackPath: string;
  private contextPack: ContextPack | null = null;
  private watcher: fs.FSWatcher | null = null;

  constructor(workspaceRoot: string) {
    super();
    this.contextPackPath = path.join(workspaceRoot, '.terrafusion', 'context', 'latest.json');
  }

  /**
   * Load the Context Pack from disk
   */
  load(): ContextPack | null {
    try {
      if (fs.existsSync(this.contextPackPath)) {
        const content = fs.readFileSync(this.contextPackPath, 'utf8');
        this.contextPack = JSON.parse(content);
        this.emit('loaded', this.contextPack);
        return this.contextPack;
      }
    } catch (error) {
      console.error('Failed to load Context Pack:', error);
      this.emit('error', error);
    }
    return null;
  }

  /**
   * Get current Context Pack
   */
  get(): ContextPack | null {
    return this.contextPack;
  }

  /**
   * Update Context Pack with Companion state
   */
  updateCompanionState(state: {
    status: 'active' | 'inactive' | 'error';
    capabilities: { total: number; active: number; aiPowered: number };
    lastAction: string | null;
    sessionDuration: number;
  }): void {
    if (!this.contextPack) {
      this.load();
    }

    if (this.contextPack) {
      this.contextPack.companion = state;
      this.contextPack.generated = new Date().toISOString();
      this.contextPack.generator = 'workspace-companion';

      this.save();
      this.emit('updated', this.contextPack);
    }
  }

  /**
   * Save Context Pack to disk
   */
  private save(): void {
    try {
      const dir = path.dirname(this.contextPackPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.contextPackPath, JSON.stringify(this.contextPack, null, 2));
    } catch (error) {
      console.error('Failed to save Context Pack:', error);
      this.emit('error', error);
    }
  }

  /**
   * Watch for Context Pack changes
   */
  watch(): void {
    const dir = path.dirname(this.contextPackPath);
    if (fs.existsSync(dir)) {
      this.watcher = fs.watch(dir, (event, filename) => {
        if (filename === 'latest.json' && event === 'change') {
          this.load();
          this.emit('changed', this.contextPack);
        }
      });
    }
  }

  /**
   * Stop watching for changes
   */
  unwatch(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }

  /**
   * Get health status from Context Pack
   */
  getHealthStatus(): 'excellent' | 'good' | 'warning' | 'critical' {
    return this.contextPack?.health?.overallHealth || 'critical';
  }

  /**
   * Get next actions from Context Pack
   */
  getNextActions(): string[] {
    return this.contextPack?.nextActions || [];
  }

  /**
   * Get critical TODOs from Context Pack
   */
  getCriticalTodos(): Array<{ file: string; line: number; text: string }> {
    return this.contextPack?.todos?.critical || [];
  }

  /**
   * Check if a specific service is healthy
   */
  isServiceHealthy(serviceName: string): boolean {
    const service = this.contextPack?.health?.services?.[serviceName];
    return service?.status === 'up';
  }

  /**
   * Get current focus lane
   */
  getCurrentLane(): string {
    return this.contextPack?.focus?.lane || 'dev';
  }

  /**
   * Add a next action recommendation
   */
  addNextAction(action: string): void {
    if (this.contextPack) {
      if (!this.contextPack.nextActions.includes(action)) {
        this.contextPack.nextActions.unshift(action);
        // Keep only top 10 actions
        this.contextPack.nextActions = this.contextPack.nextActions.slice(0, 10);
        this.save();
      }
    }
  }
}

export default ContextPackIntegration;
