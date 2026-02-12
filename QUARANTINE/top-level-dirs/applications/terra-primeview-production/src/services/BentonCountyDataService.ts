import { supabase } from "@/integrations/supabase/client";
import { FTPDataImportService, FTPConnectionConfig } from "./FTPDataImportService";

export class BentonCountyDataService {
  private static async getFTPConfig(): Promise<FTPConnectionConfig> {
    // Get actual FTP credentials from Supabase secrets
    const { data: secrets } = await supabase.functions.invoke('get-secrets', {
      body: { keys: ['BENTON_FTP_HOST', 'BENTON_FTP_USERNAME', 'BENTON_FTP_PASSWORD'] }
    });

    console.log('FTP Config loaded:', { host: secrets?.BENTON_FTP_HOST });

    return {
      host: secrets?.BENTON_FTP_HOST || 'ftp.co.benton.wa.us',
      port: 21,
      username: secrets?.BENTON_FTP_USERNAME || 'benton_assessor',
      password: secrets?.BENTON_FTP_PASSWORD || '',
      secure: true,
      basePath: '/assessment_data'
    };
  }

  private static bentonCountyId = '53005'; // FIPS code

  static async getBentonCountyId(): Promise<string | null> {
    const { data: county, error } = await supabase
      .from('counties')
      .select('id')
      .eq('fips_code', this.bentonCountyId)
      .single();
    
    if (error) {
      console.error('Error fetching Benton County:', error);
      return null;
    }
    
    console.log('Benton County found:', county?.id);
    return county?.id || null;
  }

  static async performAutomaticSync(): Promise<{
    success: boolean;
    filesProcessed: number;
    errors: string[];
  }> {
    const result = {
      success: false,
      filesProcessed: 0,
      errors: [] as string[]
    };

    try {
      console.log('Starting Benton County FTP sync...');
      
      const countyId = await this.getBentonCountyId();
      if (!countyId) {
        throw new Error('Benton County not found in database - please check FIPS code 53005');
      }

      const ftpConfig = await this.getFTPConfig();
      console.log('FTP config ready, testing connection...');
      
      const ftpService = new FTPDataImportService(ftpConfig);

      // Test connection with real credentials
      const connectionTest = await ftpService.testConnection();
      if (!connectionTest) {
        throw new Error('Unable to connect to Benton County FTP server - check credentials and network');
      }

      console.log('FTP connection successful, listing files...');

      // Get available files from actual FTP server
      const files = await ftpService.listFiles();
      console.log(`Found ${files.length} files for processing from Benton County FTP`);

      if (files.length === 0) {
        console.warn('No files found on FTP server');
        result.errors.push('No files found on FTP server');
      }

      // Auto-process files based on naming conventions
      for (const file of files) {
        try {
          console.log(`Processing file: ${file.name}`);
          
          if (this.isPropertyFile(file.name)) {
            await ftpService.downloadAndProcessFile(file, 'properties', countyId);
            result.filesProcessed++;
          } else if (this.isOwnerFile(file.name)) {
            await ftpService.downloadAndProcessFile(file, 'owners');
            result.filesProcessed++;
          } else if (this.isAssessmentFile(file.name)) {
            await ftpService.downloadAndProcessFile(file, 'assessments', countyId);
            result.filesProcessed++;
          } else {
            console.log(`Skipping file: ${file.name} (doesn't match known patterns)`);
          }
        } catch (fileError) {
          const errorMsg = `Failed to process ${file.name}: ${fileError}`;
          console.error(errorMsg);
          result.errors.push(errorMsg);
        }
      }

      result.success = result.errors.length === 0;
      
      // Log sync completion
      await this.logSyncActivity(result);
      
      console.log('FTP sync completed:', result);
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown sync error';
      console.error('FTP sync failed:', errorMsg);
      result.errors.push(errorMsg);
    }

    return result;
  }

  static async syncArcGISData(): Promise<{
    success: boolean;
    layersProcessed: number;
    errors: string[];
  }> {
    const result = {
      success: false,
      layersProcessed: 0,
      errors: [] as string[]
    };

    try {
      console.log('Starting Benton County ArcGIS sync...');
      
      // Call ArcGIS integration edge function
      const { data, error } = await supabase.functions.invoke('arcgis-sync', {
        body: { 
          county_fips: this.bentonCountyId,
          sync_layers: ['parcels', 'zoning', 'infrastructure', 'boundaries']
        }
      });

      if (error) {
        console.error('ArcGIS function error:', error);
        throw error;
      }

      console.log('ArcGIS sync response:', data);

      result.success = data?.success || false;
      result.layersProcessed = data?.layersProcessed || 0;
      result.errors = data?.errors || [];

      await this.logGISActivity(result);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'ArcGIS sync error';
      console.error('ArcGIS sync failed:', errorMsg);
      result.errors.push(errorMsg);
    }

    return result;
  }

  private static isPropertyFile(filename: string): boolean {
    const propertyPatterns = ['property', 'parcel', 'real_estate', 'assessment_roll'];
    return propertyPatterns.some(pattern => filename.toLowerCase().includes(pattern));
  }

  private static isOwnerFile(filename: string): boolean {
    const ownerPatterns = ['owner', 'ownership', 'taxpayer'];
    return ownerPatterns.some(pattern => filename.toLowerCase().includes(pattern));
  }

  private static isAssessmentFile(filename: string): boolean {
    const assessmentPatterns = ['assessment', 'valuation', 'appraisal'];
    return assessmentPatterns.some(pattern => filename.toLowerCase().includes(pattern));
  }

  private static async logSyncActivity(result: any): Promise<void> {
    try {
      await supabase
        .from('data_imports')
        .insert({
          import_name: 'Benton_County_Production_Sync',
          import_type: 'production_ftp_sync',
          status: result.success ? 'completed' : 'failed',
          total_records: result.filesProcessed,
          processed_records: result.filesProcessed,
          success_records: result.success ? result.filesProcessed : 0,
          error_records: result.errors.length,
          created_by: 'BentonCounty_Production_System',
          metadata: {
            sync_type: 'production',
            files_processed: result.filesProcessed,
            errors: result.errors,
            timestamp: new Date().toISOString()
          }
        });
    } catch (error) {
      console.error('Failed to log sync activity:', error);
    }
  }

  private static async logGISActivity(result: any): Promise<void> {
    try {
      await supabase
        .from('data_imports')
        .insert({
          import_name: 'Benton_County_ArcGIS_Sync',
          import_type: 'arcgis_production_sync',
          status: result.success ? 'completed' : 'failed',
          total_records: result.layersProcessed,
          processed_records: result.layersProcessed,
          success_records: result.success ? result.layersProcessed : 0,
          error_records: result.errors.length,
          created_by: 'BentonCounty_ArcGIS_System',
          metadata: {
            sync_type: 'arcgis_production',
            layers_processed: result.layersProcessed,
            errors: result.errors,
            timestamp: new Date().toISOString()
          }
        });
    } catch (error) {
      console.error('Failed to log GIS activity:', error);
    }
  }

  static async scheduleNightlySync(): Promise<void> {
    // This would typically integrate with a cron job or scheduled task
    console.log('Nightly sync scheduled for Benton County at 2:00 AM PST');
    
    // In production, this would call an edge function or cron job
    // For now, we'll simulate the scheduling
    setTimeout(async () => {
      await this.performAutomaticSync();
    }, this.getMillisecondsUntil2AM());
  }

  private static getMillisecondsUntil2AM(): number {
    const now = new Date();
    const tomorrow2AM = new Date();
    tomorrow2AM.setDate(now.getDate() + 1);
    tomorrow2AM.setHours(2, 0, 0, 0);
    
    return tomorrow2AM.getTime() - now.getTime();
  }
}
