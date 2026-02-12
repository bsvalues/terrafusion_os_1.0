
import { BentonCountyDataService } from './BentonCountyDataService';
import { supabase } from "@/integrations/supabase/client";

export interface SyncSchedule {
  id: string;
  county_id: string;
  schedule_type: 'daily' | 'weekly' | 'monthly' | 'custom';
  cron_expression: string;
  enabled: boolean;
  last_run: Date | null;
  next_run: Date | null;
  failure_count: number;
  max_retries: number;
}

export class ScheduledDataSyncService {
  private static readonly DEFAULT_SCHEDULES = {
    daily: '0 2 * * *', // 2 AM daily
    weekly: '0 2 * * 0', // 2 AM every Sunday
    monthly: '0 2 1 * *', // 2 AM first day of month
  };

  static async createBentonCountySchedule(): Promise<SyncSchedule> {
    const schedule: SyncSchedule = {
      id: 'benton-county-auto-sync',
      county_id: '53005',
      schedule_type: 'daily',
      cron_expression: this.DEFAULT_SCHEDULES.daily,
      enabled: true,
      last_run: null,
      next_run: this.getNextRunTime(this.DEFAULT_SCHEDULES.daily),
      failure_count: 0,
      max_retries: 3
    };

    await this.saveSchedule(schedule);
    return schedule;
  }

  static async executeScheduledSync(scheduleId: string): Promise<boolean> {
    try {
      console.log(`Starting scheduled sync for ${scheduleId}`);
      
      const schedule = await this.getSchedule(scheduleId);
      if (!schedule || !schedule.enabled) {
        console.log('Schedule not found or disabled');
        return false;
      }

      const syncResult = await BentonCountyDataService.performAutomaticSync();
      
      if (syncResult.success) {
        await this.updateScheduleSuccess(scheduleId);
        await this.logSyncSuccess(scheduleId, syncResult);
        return true;
      } else {
        await this.updateScheduleFailure(scheduleId);
        await this.logSyncFailure(scheduleId, syncResult);
        return false;
      }
    } catch (error) {
      console.error('Scheduled sync failed:', error);
      await this.updateScheduleFailure(scheduleId);
      return false;
    }
  }

  private static getNextRunTime(cronExpression: string): Date {
    // Simplified next run calculation - in production use a proper cron parser
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(2, 0, 0, 0);
    return tomorrow;
  }

  private static async saveSchedule(schedule: SyncSchedule): Promise<void> {
    // Get Benton County ID from database
    const { data: county } = await supabase
      .from('counties')
      .select('id')
      .eq('fips_code', '53005')
      .single();

    if (!county) {
      throw new Error('Benton County not found in database');
    }

    // Convert schedule to JSON-compatible format
    const scheduleData = {
      ...schedule,
      last_run: schedule.last_run?.toISOString() || null,
      next_run: schedule.next_run?.toISOString() || null
    };

    await supabase
      .from('system_config')
      .upsert({
        county_id: county.id,
        config_key: 'data_sync_schedule',
        category: 'automation',
        config_value: scheduleData as any,
        description: 'Automated data synchronization schedule'
      });
  }

  private static async getSchedule(scheduleId: string): Promise<SyncSchedule | null> {
    const { data } = await supabase
      .from('system_config')
      .select('config_value')
      .eq('config_key', 'data_sync_schedule')
      .single();

    if (!data?.config_value) return null;

    const scheduleData = data.config_value as any;
    return {
      ...scheduleData,
      last_run: scheduleData.last_run ? new Date(scheduleData.last_run) : null,
      next_run: scheduleData.next_run ? new Date(scheduleData.next_run) : null
    };
  }

  private static async updateScheduleSuccess(scheduleId: string): Promise<void> {
    const schedule = await this.getSchedule(scheduleId);
    if (schedule) {
      schedule.last_run = new Date();
      schedule.next_run = this.getNextRunTime(schedule.cron_expression);
      schedule.failure_count = 0;
      await this.saveSchedule(schedule);
    }
  }

  private static async updateScheduleFailure(scheduleId: string): Promise<void> {
    const schedule = await this.getSchedule(scheduleId);
    if (schedule) {
      schedule.failure_count += 1;
      if (schedule.failure_count >= schedule.max_retries) {
        schedule.enabled = false;
      }
      await this.saveSchedule(schedule);
    }
  }

  private static async logSyncSuccess(scheduleId: string, result: any): Promise<void> {
    await supabase
      .from('data_imports')
      .insert({
        import_name: 'Scheduled_Benton_County_Sync',
        import_type: 'scheduled_auto_sync',
        status: 'completed',
        success_records: result.filesProcessed,
        created_by: 'TerraFusion_Scheduler',
        metadata: {
          schedule_id: scheduleId,
          sync_type: 'scheduled',
          files_processed: result.filesProcessed
        }
      });
  }

  private static async logSyncFailure(scheduleId: string, result: any): Promise<void> {
    await supabase
      .from('data_imports')
      .insert({
        import_name: 'Scheduled_Benton_County_Sync',
        import_type: 'scheduled_auto_sync',
        status: 'failed',
        error_records: result.errors.length,
        created_by: 'TerraFusion_Scheduler',
        metadata: {
          schedule_id: scheduleId,
          sync_type: 'scheduled',
          errors: result.errors
        }
      });
  }
}
