import { db } from '../../db';
import { eq } from 'drizzle-orm';
import {
  devPreviewSettings,
  DevPreviewStatus,
  insertDevPreviewSettingsSchema,
  type DevPreviewSettings,
  type InsertDevPreviewSettings,
} from '../../../shared/schema';
import { exec } from 'child_process';
import { promisify } from 'util';
import { getPort } from '../../utils/network';

const execPromise = promisify(exec);

export interface PreviewStatusInfo {
  status: string;
  port?: number;
  url?: string;
  logs?: string[];
}

export interface PreviewEngineInterface {
  getPreviewSettings(projectId: string): Promise<DevPreviewSettings | null>;
  createPreviewSettings(settings: InsertDevPreviewSettings): Promise<DevPreviewSettings>;
  updatePreviewSettings(
    projectId: string,
    settings: Partial<InsertDevPreviewSettings>
  ): Promise<DevPreviewSettings | null>;
  startPreview(projectId: string): Promise<PreviewStatusInfo>;
  stopPreview(projectId: string): Promise<PreviewStatusInfo>;
  getPreviewStatus(projectId: string): Promise<PreviewStatusInfo>;
  addPreviewLog(projectId: string, log: string): Promise<boolean>;
}

class PreviewEngine implements PreviewEngineInterface {
  // Map of running preview processes by projectId
  private runningPreviewProcesses: Map<string, { process: any; port: number }> = new Map();

  /**
   * Get preview settings for a project
   */
  async getPreviewSettings(projectId: string): Promise<DevPreviewSettings | null> {
    const result = await db
      .select()
      .from(devPreviewSettings)
      .where(eq(devPreviewSettings.projectId, projectId));

    return result.length > 0 ? result[0] : null;
  }

  /**
   * Create preview settings for a project
   */
  async createPreviewSettings(settings: InsertDevPreviewSettings): Promise<DevPreviewSettings> {
    const validatedData = insertDevPreviewSettingsSchema.parse(settings);

    const newSettings = await db
      .insert(devPreviewSettings)
      .values({
        ...validatedData,
        status: DevPreviewStatus.STOPPED,
        logs: [],
      })
      .returning();

    return newSettings[0];
  }

  /**
   * Update preview settings for a project
   */
  async updatePreviewSettings(
    projectId: string,
    settings: Partial<InsertDevPreviewSettings>
  ): Promise<DevPreviewSettings | null> {
    const result = await db
      .update(devPreviewSettings)
      .set(settings)
      .where(eq(devPreviewSettings.projectId, projectId))
      .returning();

    return result.length > 0 ? result[0] : null;
  }

  /**
   * Start a preview for a project
   */
  async startPreview(projectId: string): Promise<PreviewStatusInfo> {
    // Get preview settings
    let settings = await this.getPreviewSettings(projectId);

    // Create default settings if none exist
    if (!settings) {
      settings = await this.createPreviewSettings({
        projectId,
        command: 'npm run dev',
        autoRefresh: true,
      });
    }

    // Stop any running preview first
    if (this.runningPreviewProcesses.has(projectId)) {
      await this.stopPreview(projectId);
    }

    try {
      // Find an available port
      const port = await getPort(3000);

      // Start the preview process (This would need proper implementation
      // in a real system to create sandbox environments)
      // This is a simplified simulation of process execution
      const process = {
        id: Math.random().toString(36).substring(7),
        kill: () => {}, // Stub function
      };

      // Store the process and port
      this.runningPreviewProcesses.set(projectId, {
        process,
        port,
      });

      // Update the settings in the database
      await db
        .update(devPreviewSettings)
        .set({
          status: DevPreviewStatus.RUNNING,
          port,
          lastStarted: new Date(),
          logs: [...(settings.logs || []), `Preview started on port ${port}`],
        })
        .where(eq(devPreviewSettings.projectId, projectId));

      return {
        status: DevPreviewStatus.RUNNING,
        port,
        url: `http://localhost:${port}`,
        logs: [...(settings.logs || []), `Preview started on port ${port}`],
      };
    } catch (error) {
      // Log the error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Update the settings in the database
      await db
        .update(devPreviewSettings)
        .set({
          status: DevPreviewStatus.ERROR,
          logs: [...(settings.logs || []), `Error starting preview: ${errorMessage}`],
        })
        .where(eq(devPreviewSettings.projectId, projectId));

      return {
        status: DevPreviewStatus.ERROR,
        logs: [...(settings.logs || []), `Error starting preview: ${errorMessage}`],
      };
    }
  }

  /**
   * Stop a preview for a project
   */
  async stopPreview(projectId: string): Promise<PreviewStatusInfo> {
    // Get the running process
    const runningProcess = this.runningPreviewProcesses.get(projectId);

    if (runningProcess) {
      // Kill the process
      runningProcess.process.kill();
      this.runningPreviewProcesses.delete(projectId);
    }

    // Get preview settings
    const settings = await this.getPreviewSettings(projectId);

    if (!settings) {
      return {
        status: DevPreviewStatus.STOPPED,
        logs: ['No preview settings found'],
      };
    }

    // Update the settings in the database
    await db
      .update(devPreviewSettings)
      .set({
        status: DevPreviewStatus.STOPPED,
        lastStopped: new Date(),
        logs: [...(settings.logs || []), 'Preview stopped'],
      })
      .where(eq(devPreviewSettings.projectId, projectId));

    return {
      status: DevPreviewStatus.STOPPED,
      logs: [...(settings.logs || []), 'Preview stopped'],
    };
  }

  /**
   * Get the current preview status for a project
   */
  async getPreviewStatus(projectId: string): Promise<PreviewStatusInfo> {
    const settings = await this.getPreviewSettings(projectId);

    if (!settings) {
      return {
        status: DevPreviewStatus.STOPPED,
        logs: ['No preview settings found'],
      };
    }

    const runningProcess = this.runningPreviewProcesses.get(projectId);

    return {
      status: settings.status,
      port: settings.port || undefined,
      url: settings.port ? `http://localhost:${settings.port}` : undefined,
      logs: settings.logs || [],
    };
  }

  /**
   * Add a log entry to the preview logs
   */
  async addPreviewLog(projectId: string, log: string): Promise<boolean> {
    const settings = await this.getPreviewSettings(projectId);

    if (!settings) {
      return false;
    }

    await db
      .update(devPreviewSettings)
      .set({
        logs: [...(settings.logs || []), log],
      })
      .where(eq(devPreviewSettings.projectId, projectId));

    return true;
  }
}

export const previewEngine = new PreviewEngine();
