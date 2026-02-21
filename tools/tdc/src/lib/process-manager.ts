import { ChildProcess, spawn, SpawnOptions } from 'child_process';
import { EventEmitter } from 'events';

export interface ServiceConfig {
  name: string;
  command: string;
  args: string[];
  options?: {
    cwd?: string;
    stdio?: string;
    env?: Record<string, string>;
  };
  healthCheckUrl?: string;
}

/**
 * Manages child processes for TerraFusion backend services.
 * Emits lifecycle events: stdout, stderr, error, exit.
 */
export class ProcessManager extends EventEmitter {
  private processes = new Map<string, ChildProcess>();

  async startService(config: ServiceConfig): Promise<ChildProcess> {
    const spawnOpts: SpawnOptions = {
      stdio: 'pipe',
      ...(config.options?.cwd ? { cwd: config.options.cwd } : {}),
      env: { ...process.env, ...config.options?.env },
    };

    const child = spawn(config.command, config.args, spawnOpts);

    this.processes.set(config.name, child);

    child.stdout?.on('data', (data: Buffer) => {
      this.emit('stdout', config.name, data.toString());
    });

    child.stderr?.on('data', (data: Buffer) => {
      this.emit('stderr', config.name, data.toString());
    });

    child.on('error', (err: Error) => {
      this.emit('error', config.name, err);
    });

    child.on('exit', (code: number | null) => {
      this.processes.delete(config.name);
      this.emit('exit', config.name, code ?? 1);
    });

    return child;
  }

  async stopService(name: string): Promise<boolean> {
    const child = this.processes.get(name);
    if (!child) return false;

    return new Promise<boolean>(resolve => {
      child.on('exit', () => {
        this.processes.delete(name);
        resolve(true);
      });
      child.kill('SIGTERM');
    });
  }

  async stopAllServices(): Promise<void> {
    const names = [...this.processes.keys()];
    await Promise.all(names.map(name => this.stopService(name)));
  }

  isServiceRunning(name: string): boolean {
    return this.processes.has(name);
  }

  getRunningServices(): string[] {
    return [...this.processes.keys()];
  }
}
