/**
 * GovernanceProvider - VS Code Governance Panel
 *
 * Displays Tier-1 Evidence status, Scene tracking, and Context Pack integration.
 * Part of the DX Spine architecture per DX_SPINE_CHARTER.md.
 *
 * This provider is READ-ONLY by default (risk level: read).
 * Write operations require explicit confirmation per §3 RiskPolicy.
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

interface ContextPack {
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
  evidencePack: {
    cid: string | null;
    traceUrl: string | null;
    latencyMs: number | null;
    receiptPresent: boolean;
  };
}

export class GovernanceProvider implements vscode.TreeDataProvider<GovernanceItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<GovernanceItem | undefined | void> =
    new vscode.EventEmitter<GovernanceItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<GovernanceItem | undefined | void> =
    this._onDidChangeTreeData.event;

  private contextPack: ContextPack | null = null;
  private workspaceRoot: string;

  constructor() {
    this.workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd();
    this.loadContextPack();

    // Watch for Context Pack changes
    const contextPackPath = path.join(this.workspaceRoot, '.terrafusion', 'context', 'latest.json');
    if (fs.existsSync(path.dirname(contextPackPath))) {
      fs.watch(path.dirname(contextPackPath), (event, filename) => {
        if (filename === 'latest.json') {
          this.loadContextPack();
          this.refresh();
        }
      });
    }
  }

  private loadContextPack(): void {
    const contextPackPath = path.join(this.workspaceRoot, '.terrafusion', 'context', 'latest.json');
    try {
      if (fs.existsSync(contextPackPath)) {
        const content = fs.readFileSync(contextPackPath, 'utf8');
        this.contextPack = JSON.parse(content);
      }
    } catch (error) {
      console.error('Failed to load Context Pack:', error);
      this.contextPack = null;
    }
  }

  refresh(): void {
    this.loadContextPack();
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: GovernanceItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: GovernanceItem): Thenable<GovernanceItem[]> {
    if (!this.contextPack) {
      return Promise.resolve([
        new GovernanceItem(
          'No Context Pack',
          'Run: node tools/dx/context-pack/generate.mjs',
          vscode.TreeItemCollapsibleState.None,
          'warning'
        ),
      ]);
    }

    if (!element) {
      // Root level
      return Promise.resolve(this.getRootItems());
    }

    // Children based on element type
    switch (element.contextValue) {
      case 'evidence-pack':
        return Promise.resolve(this.getEvidenceItems());
      case 'focus':
        return Promise.resolve(this.getFocusItems());
      case 'health':
        return Promise.resolve(this.getHealthItems());
      case 'todos':
        return Promise.resolve(this.getTodoItems());
      case 'next-actions':
        return Promise.resolve(this.getNextActionItems());
      default:
        return Promise.resolve([]);
    }
  }

  private getRootItems(): GovernanceItem[] {
    const pack = this.contextPack!;
    const items: GovernanceItem[] = [];

    // Evidence Pack section
    const evidenceIcon = this.getEvidenceIcon(pack.governance.tier1EvidenceStatus);
    items.push(
      new GovernanceItem(
        'Evidence Pack',
        `Status: ${pack.governance.tier1EvidenceStatus.toUpperCase()}`,
        vscode.TreeItemCollapsibleState.Expanded,
        'evidence-pack',
        evidenceIcon
      )
    );

    // Focus section
    items.push(
      new GovernanceItem(
        'Focus',
        `Lane: ${pack.focus.lane}`,
        vscode.TreeItemCollapsibleState.Collapsed,
        'focus',
        'symbol-namespace'
      )
    );

    // Health section
    const healthIcon = this.getHealthIcon(pack.health.overallHealth);
    items.push(
      new GovernanceItem(
        'Health',
        pack.health.overallHealth.toUpperCase(),
        vscode.TreeItemCollapsibleState.Collapsed,
        'health',
        healthIcon
      )
    );

    // TODOs section
    const totalTodos =
      pack.todos.critical.length +
      pack.todos.high.length +
      pack.todos.medium.length +
      pack.todos.low.length;
    items.push(
      new GovernanceItem(
        'TODOs',
        `${totalTodos} items (${pack.todos.critical.length} critical)`,
        vscode.TreeItemCollapsibleState.Collapsed,
        'todos',
        pack.todos.critical.length > 0 ? 'error' : 'checklist'
      )
    );

    // Next Actions section
    items.push(
      new GovernanceItem(
        'Next Actions',
        `${pack.nextActions.length} recommended`,
        vscode.TreeItemCollapsibleState.Collapsed,
        'next-actions',
        'rocket'
      )
    );

    return items;
  }

  private getEvidenceItems(): GovernanceItem[] {
    const pack = this.contextPack!;
    const items: GovernanceItem[] = [];

    // CID
    items.push(
      new GovernanceItem(
        'CID',
        pack.evidencePack.cid || 'Not captured',
        vscode.TreeItemCollapsibleState.None,
        'evidence-cid',
        pack.evidencePack.cid ? 'pass' : 'circle-slash'
      )
    );

    // Trace URL
    items.push(
      new GovernanceItem(
        'Trace',
        pack.evidencePack.traceUrl ? 'Available' : 'Not captured',
        vscode.TreeItemCollapsibleState.None,
        'evidence-trace',
        pack.evidencePack.traceUrl ? 'link-external' : 'circle-slash'
      )
    );

    // Latency
    items.push(
      new GovernanceItem(
        'Latency',
        pack.evidencePack.latencyMs ? `${pack.evidencePack.latencyMs}ms` : 'Not measured',
        vscode.TreeItemCollapsibleState.None,
        'evidence-latency',
        'history'
      )
    );

    // Receipt
    items.push(
      new GovernanceItem(
        'Receipt',
        pack.evidencePack.receiptPresent ? 'Present' : 'Not captured',
        vscode.TreeItemCollapsibleState.None,
        'evidence-receipt',
        pack.evidencePack.receiptPresent ? 'file-text' : 'circle-slash'
      )
    );

    // DoD Version
    items.push(
      new GovernanceItem(
        'DoD Version',
        pack.governance.dodVersion,
        vscode.TreeItemCollapsibleState.None,
        'dod-version',
        'versions'
      )
    );

    // Scene Enforcement
    items.push(
      new GovernanceItem(
        'Scene Enforcement',
        pack.governance.sceneEnforcementActive ? 'ACTIVE' : 'Inactive',
        vscode.TreeItemCollapsibleState.None,
        'scene-enforcement',
        pack.governance.sceneEnforcementActive ? 'shield' : 'unlock'
      )
    );

    return items;
  }

  private getFocusItems(): GovernanceItem[] {
    const pack = this.contextPack!;
    return [
      new GovernanceItem(
        'Lane',
        pack.focus.lane,
        vscode.TreeItemCollapsibleState.None,
        'lane',
        this.getLaneIcon(pack.focus.lane)
      ),
      new GovernanceItem(
        'Scene',
        pack.focus.scene || 'None',
        vscode.TreeItemCollapsibleState.None,
        'scene',
        'layout'
      ),
      new GovernanceItem(
        'PR',
        pack.focus.pr ? `#${pack.focus.pr}` : 'None',
        vscode.TreeItemCollapsibleState.None,
        'pr',
        'git-pull-request'
      ),
      new GovernanceItem(
        'Branch',
        pack.repo.branch,
        vscode.TreeItemCollapsibleState.None,
        'branch',
        'git-branch'
      ),
      new GovernanceItem(
        'Dirty Files',
        `${pack.repo.dirtyFiles.length} uncommitted`,
        vscode.TreeItemCollapsibleState.None,
        'dirty',
        pack.repo.dirtyFiles.length > 0 ? 'warning' : 'check'
      ),
    ];
  }

  private getHealthItems(): GovernanceItem[] {
    const pack = this.contextPack!;
    return Object.entries(pack.health.services).map(([name, info]) => {
      return new GovernanceItem(
        name,
        `:${info.port} - ${info.status.toUpperCase()}`,
        vscode.TreeItemCollapsibleState.None,
        `service-${name}`,
        info.status === 'up' ? 'check' : 'x'
      );
    });
  }

  private getTodoItems(): GovernanceItem[] {
    const pack = this.contextPack!;
    const items: GovernanceItem[] = [];

    if (pack.todos.critical.length > 0) {
      items.push(
        new GovernanceItem(
          `Critical (${pack.todos.critical.length})`,
          'Security/blocking issues',
          vscode.TreeItemCollapsibleState.None,
          'todo-critical',
          'error'
        )
      );
    }

    if (pack.todos.high.length > 0) {
      items.push(
        new GovernanceItem(
          `High (${pack.todos.high.length})`,
          'Important improvements',
          vscode.TreeItemCollapsibleState.None,
          'todo-high',
          'warning'
        )
      );
    }

    if (pack.todos.medium.length > 0) {
      items.push(
        new GovernanceItem(
          `Medium (${pack.todos.medium.length})`,
          'Standard items',
          vscode.TreeItemCollapsibleState.None,
          'todo-medium',
          'info'
        )
      );
    }

    if (pack.todos.low.length > 0) {
      items.push(
        new GovernanceItem(
          `Low (${pack.todos.low.length})`,
          'Nice to have',
          vscode.TreeItemCollapsibleState.None,
          'todo-low',
          'circle-outline'
        )
      );
    }

    return items;
  }

  private getNextActionItems(): GovernanceItem[] {
    const pack = this.contextPack!;
    return pack.nextActions.map((action, index) => {
      return new GovernanceItem(
        `${index + 1}. ${action.substring(0, 40)}${action.length > 40 ? '...' : ''}`,
        action,
        vscode.TreeItemCollapsibleState.None,
        `action-${index}`,
        'play'
      );
    });
  }

  private getEvidenceIcon(
    status: 'complete' | 'partial' | 'missing' | 'not-applicable'
  ): string {
    switch (status) {
      case 'complete':
        return 'pass';
      case 'partial':
        return 'warning';
      case 'missing':
        return 'error';
      case 'not-applicable':
        return 'circle-slash';
    }
  }

  private getHealthIcon(health: 'excellent' | 'good' | 'warning' | 'critical'): string {
    switch (health) {
      case 'excellent':
        return 'pass';
      case 'good':
        return 'info';
      case 'warning':
        return 'warning';
      case 'critical':
        return 'error';
    }
  }

  private getLaneIcon(lane: string): string {
    switch (lane) {
      case 'dev':
        return 'code';
      case 'governance':
        return 'law';
      case 'ops':
        return 'server';
      case 'security':
        return 'shield';
      case 'data':
        return 'database';
      default:
        return 'symbol-namespace';
    }
  }
}

class GovernanceItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    private description_: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly contextValue?: string,
    public readonly iconName?: string
  ) {
    super(label, collapsibleState);
    this.description = description_;
    this.tooltip = `${label}: ${description_}`;

    if (iconName) {
      this.iconPath = new vscode.ThemeIcon(iconName);
    }
  }
}
