import * as vscode from 'vscode';

interface AgentAction {
  actionType: string;
  timestamp: number;
  agent: string;
  metadata?: any;
}

export class AgentActivityProvider implements vscode.TreeDataProvider<AgentActivityItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<AgentActivityItem | undefined | null | void> =
    new vscode.EventEmitter<AgentActivityItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<AgentActivityItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  private recentActions: AgentAction[] = [];
  private maxActions = 50;

  constructor() {
    // Listen for agent activity updates
    vscode.commands.registerCommand('terrafusion.updateAgentActivity', (action: AgentAction) => {
      this.addAction(action);
    });
  }

  addAction(action: AgentAction): void {
    this.recentActions.unshift(action);
    if (this.recentActions.length > this.maxActions) {
      this.recentActions.pop();
    }
    this.refresh();
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: AgentActivityItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: AgentActivityItem): Promise<AgentActivityItem[]> {
    if (!element) {
      if (this.recentActions.length === 0) {
        return [
          new AgentActivityItem(
            {
              actionType: 'No recent activity',
              timestamp: Date.now(),
              agent: 'System',
            },
            true
          ),
        ];
      }
      return this.recentActions.map(action => new AgentActivityItem(action));
    }
    return [];
  }
}

export class AgentActivityItem extends vscode.TreeItem {
  constructor(
    public readonly action: AgentAction,
    public readonly isPlaceholder: boolean = false
  ) {
    super(
      isPlaceholder ? action.actionType : `${action.agent}: ${action.actionType}`,
      vscode.TreeItemCollapsibleState.None
    );

    if (!isPlaceholder) {
      const timestamp = new Date(action.timestamp);
      const timeAgo = this.getTimeAgo(timestamp);
      this.description = timeAgo;
      this.tooltip = `Agent: ${action.agent}\nAction: ${action.actionType}\nTime: ${timestamp.toLocaleString()}`;
      this.iconPath = new vscode.ThemeIcon('symbol-event');
    } else {
      this.iconPath = new vscode.ThemeIcon('info');
    }
  }

  private getTimeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }
}
