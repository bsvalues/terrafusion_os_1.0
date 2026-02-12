/**
 * TerraForge ModuleRunner
 *
 * Orchestrates dynamic module invocation for the TerraForge suite.
 * Supports "steel" mode (real executables) and registry-based discovery.
 *
 * Government-grade reliability: audit trails, deterministic execution.
 */

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Registry module definition
 */
export interface ModuleDefinition {
  name: string;
  description: string;
  version: string;
  type: 'executable' | 'stub';
  executable?: string;
  executableWindows?: string;
  actions: string[];
  inputSchema?: string;
  outputSchema?: string;
  auditSchema?: string;
}

/**
 * Registry structure
 */
export interface Registry {
  version: string;
  contractPackVersion: string;
  moduleApiVersion: string;
  modules: Record<string, ModuleDefinition>;
}

/**
 * Standard module invocation request
 */
export interface InvocationRequest {
  contractPackVersion: string;
  moduleApiVersion: string;
  requestId: string;
  action: string;
  payload: unknown;
}

/**
 * Standard module response
 */
export interface ModuleResponse<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
  auditEvent?: AuditEvent;
}

/**
 * Audit event for government traceability
 */
export interface AuditEvent {
  eventId: string;
  timestamp: string;
  actor: string;
  action: string;
  resourceId: string;
  module: string;
  hash: string;
}

/**
 * ModuleRunner - Orchestrates TerraForge module invocation
 */
export class ModuleRunner {
  private modulesDir: string;
  private registry: Registry;
  private isWindows: boolean;

  constructor(modulesDir: string, registryPath: string) {
    this.modulesDir = modulesDir;
    this.isWindows = process.platform === 'win32';

    // Load registry
    if (!fs.existsSync(registryPath)) {
      throw new Error(`Registry not found: ${registryPath}`);
    }

    const registryContent = fs.readFileSync(registryPath, 'utf-8');
    this.registry = JSON.parse(registryContent) as Registry;
  }

  /**
   * Invoke a module by name with the given request payload
   */
  async invoke<T = unknown>(
    moduleName: string,
    request: { action: string; payload: unknown }
  ): Promise<ModuleResponse<T>> {
    const moduleDef = this.registry.modules[moduleName];

    if (!moduleDef) {
      return {
        success: false,
        error: `Module not registered: ${moduleName}`,
      };
    }

    if (!moduleDef.actions.includes(request.action)) {
      return {
        success: false,
        error: `Action '${request.action}' not supported by module '${moduleName}'`,
      };
    }

    // Build invocation request
    const invocation: InvocationRequest = {
      contractPackVersion: this.registry.contractPackVersion,
      moduleApiVersion: this.registry.moduleApiVersion,
      requestId: uuidv4(),
      action: request.action,
      payload: request.payload,
    };

    if (moduleDef.type === 'stub') {
      return this.invokeStub<T>(moduleName, moduleDef, invocation);
    }

    return this.invokeExecutable<T>(moduleName, moduleDef, invocation);
  }

  /**
   * Invoke a stub module (for testing)
   */
  private async invokeStub<T>(
    moduleName: string,
    _moduleDef: ModuleDefinition,
    invocation: InvocationRequest
  ): Promise<ModuleResponse<T>> {
    // Stub modules return a placeholder response
    const auditEvent: AuditEvent = {
      eventId: uuidv4(),
      timestamp: new Date().toISOString(),
      actor: 'system',
      action: invocation.action,
      resourceId: 'stub-resource',
      module: moduleName,
      hash: `stub-hash-${moduleName}`,
    };

    return {
      success: true,
      data: { message: `Stub response from ${moduleName}` } as T,
      auditEvent,
    };
  }

  /**
   * Invoke an executable module via subprocess
   */
  private async invokeExecutable<T>(
    moduleName: string,
    moduleDef: ModuleDefinition,
    invocation: InvocationRequest
  ): Promise<ModuleResponse<T>> {
    // Determine executable path
    const execPath = this.isWindows
      ? moduleDef.executableWindows || moduleDef.executable
      : moduleDef.executable;

    if (!execPath) {
      return {
        success: false,
        error: `No executable defined for module '${moduleName}'`,
      };
    }

    // Resolve relative to modules directory parent (the suite root)
    const suiteRoot = path.resolve(this.modulesDir, '..');
    const fullPath = path.resolve(suiteRoot, execPath);

    if (!fs.existsSync(fullPath)) {
      return {
        success: false,
        error: `Executable not found: ${fullPath}. Build the module first.`,
      };
    }

    return new Promise<ModuleResponse<T>>(resolve => {
      const proc = spawn(fullPath, [], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: suiteRoot,
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      proc.on('error', err => {
        resolve({
          success: false,
          error: `Failed to spawn module: ${err.message}`,
        });
      });

      proc.on('close', code => {
        if (code !== 0) {
          resolve({
            success: false,
            error: `Module exited with code ${code}: ${stderr}`,
          });
          return;
        }

        try {
          const response = JSON.parse(stdout) as ModuleResponse<T>;
          resolve(response);
        } catch (parseError) {
          resolve({
            success: false,
            error: `Failed to parse module response: ${stdout}`,
          });
        }
      });

      // Send invocation to stdin
      proc.stdin.write(JSON.stringify(invocation));
      proc.stdin.end();
    });
  }

  /**
   * Get list of registered modules
   */
  getRegisteredModules(): string[] {
    return Object.keys(this.registry.modules);
  }

  /**
   * Get module definition
   */
  getModuleDefinition(moduleName: string): ModuleDefinition | undefined {
    return this.registry.modules[moduleName];
  }
}
