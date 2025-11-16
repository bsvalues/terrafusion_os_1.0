import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export class WorkspaceExplorerProvider implements vscode.TreeDataProvider<WorkspaceItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<WorkspaceItem | undefined | null | void> =
    new vscode.EventEmitter<WorkspaceItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<WorkspaceItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: WorkspaceItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: WorkspaceItem): Promise<WorkspaceItem[]> {
    if (!element) {
      // Root level - show workspaces
      return this.getWorkspaces();
    }
    return [];
  }

  private async getWorkspaces(): Promise<WorkspaceItem[]> {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceRoot) {
      return [];
    }

    const workspacesDir = path.join(workspaceRoot, 'workspaces');
    if (!fs.existsSync(workspacesDir)) {
      return [];
    }

    const files = fs.readdirSync(workspacesDir);
    const workspaceFiles = files.filter(f => f.endsWith('.code-workspace'));

    return workspaceFiles.map(file => {
      const name = file.replace('.code-workspace', '');
      const filePath = path.join(workspacesDir, file);

      return new WorkspaceItem(
        name,
        filePath,
        this.getWorkspaceIcon(name),
        vscode.TreeItemCollapsibleState.None
      );
    });
  }

  private getWorkspaceIcon(name: string): string {
    if (name.includes('master')) return 'home';
    if (name.includes('backend')) return 'server';
    if (name.includes('frontend')) return 'browser';
    if (name.includes('sdk')) return 'package';
    if (name.includes('government')) return 'organization';
    return 'file-directory';
  }
}

export class WorkspaceItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly workspacePath: string,
    public readonly icon: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.tooltip = workspacePath;
    this.iconPath = new vscode.ThemeIcon(icon);
    this.command = {
      command: 'vscode.openFolder',
      title: 'Open Workspace',
      arguments: [vscode.Uri.file(workspacePath)],
    };
  }
}
