import { exec } from 'child_process';
import { promisify } from 'util';
import * as vscode from 'vscode';

const execAsync = promisify(exec);

interface ServiceStatus {
  name: string;
  status: 'running' | 'stopped' | 'unknown';
  port?: number;
  pid?: number;
}

export class ServicesProvider implements vscode.TreeDataProvider<ServiceItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<ServiceItem | undefined | null | void> =
    new vscode.EventEmitter<ServiceItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<ServiceItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  constructor() {
    // Auto-refresh every 10 seconds
    setInterval(() => this.refresh(), 10000);
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: ServiceItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: ServiceItem): Promise<ServiceItem[]> {
    if (!element) {
      return this.getServices();
    }
    return [];
  }

  private async getServices(): Promise<ServiceItem[]> {
    const services: ServiceStatus[] = [
      { name: 'TerraFusion API', status: 'unknown', port: 5000 },
      { name: 'Consciousness Engine', status: 'unknown', port: 3004 },
      { name: 'API Gateway', status: 'unknown', port: 3002 },
      { name: 'Portal UI', status: 'unknown', port: 5174 },
      { name: 'Transparency Engine', status: 'unknown', port: 8788 },
    ];

    // Check each service status
    await Promise.all(
      services.map(async service => {
        service.status = await this.checkServiceStatus(service.port!);
      })
    );

    return services.map(service => new ServiceItem(service));
  }

  private async checkServiceStatus(port: number): Promise<'running' | 'stopped'> {
    try {
      const { stdout } = await execAsync(`lsof -ti:${port}`);
      return stdout.trim() ? 'running' : 'stopped';
    } catch {
      return 'stopped';
    }
  }
}

export class ServiceItem extends vscode.TreeItem {
  constructor(public readonly service: ServiceStatus) {
    super(service.name, vscode.TreeItemCollapsibleState.None);

    this.description = service.port ? `:${service.port}` : '';
    this.tooltip = `${service.name}\nStatus: ${service.status}\nPort: ${service.port || 'N/A'}`;

    // Set icon based on status
    this.iconPath = new vscode.ThemeIcon(
      service.status === 'running' ? 'pass' : 'circle-slash',
      service.status === 'running'
        ? new vscode.ThemeColor('charts.green')
        : new vscode.ThemeColor('charts.gray')
    );
  }
}
