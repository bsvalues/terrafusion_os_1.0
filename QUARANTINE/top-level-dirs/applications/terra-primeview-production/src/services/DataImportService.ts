
import * as Papa from 'papaparse';
import { supabase } from "@/integrations/supabase/client";

export interface ImportResult {
  success: boolean;
  totalRecords: number;
  successCount: number;
  errorCount: number;
  errors: Array<{
    row: number;
    error: string;
    data: any;
  }>;
}

export interface FieldMapping {
  source: string;
  target: string;
  transform?: (value: any) => any;
  required?: boolean;
}

export class DataImportService {
  static async parseCSVFile(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(new Error(`CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`));
          } else {
            resolve(results.data);
          }
        },
        error: (error) => reject(error)
      });
    });
  }

  static async importCounties(data: any[], mappings: FieldMapping[], importId: string): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      totalRecords: data.length,
      successCount: 0,
      errorCount: 0,
      errors: []
    };

    for (let i = 0; i < data.length; i++) {
      try {
        const row = data[i];
        const mappedData = this.mapRowData(row, mappings);
        
        // Validate required fields
        const validationErrors = this.validateCountyData(mappedData);
        if (validationErrors.length > 0) {
          throw new Error(validationErrors.join(', '));
        }

        // Insert county
        const { error } = await supabase
          .from('counties')
          .insert({
            name: mappedData.name,
            state: mappedData.state,
            fips_code: mappedData.fips_code,
            timezone: mappedData.timezone || 'UTC',
            assessment_cycle: mappedData.assessment_cycle || 'Annual',
            contact_info: mappedData.contact_info || {},
            configuration: mappedData.configuration || {},
            active: mappedData.active !== undefined ? mappedData.active : true
          });

        if (error) throw error;
        result.successCount++;

      } catch (error) {
        result.errorCount++;
        result.errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : 'Unknown error',
          data: data[i]
        });

        // Log error to database
        await supabase
          .from('import_errors')
          .insert({
            import_id: importId,
            row_number: i + 1,
            error_type: 'validation_error',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            raw_data: data[i]
          });
      }
    }

    result.success = result.errorCount === 0;
    return result;
  }

  static async importProperties(data: any[], mappings: FieldMapping[], importId: string, countyId: string): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      totalRecords: data.length,
      successCount: 0,
      errorCount: 0,
      errors: []
    };

    for (let i = 0; i < data.length; i++) {
      try {
        const row = data[i];
        const mappedData = this.mapRowData(row, mappings);
        
        // Validate required fields
        const validationErrors = this.validatePropertyData(mappedData);
        if (validationErrors.length > 0) {
          throw new Error(validationErrors.join(', '));
        }

        // Insert property
        const { error } = await supabase
          .from('properties')
          .insert({
            county_id: countyId,
            parcel_id: mappedData.parcel_id,
            address: mappedData.address,
            property_type: mappedData.property_type || 'Residential',
            assessed_value: parseInt(mappedData.assessed_value) || 0,
            land_value: parseInt(mappedData.land_value) || 0,
            improvement_value: parseInt(mappedData.improvement_value) || 0,
            market_value: mappedData.market_value ? parseInt(mappedData.market_value) : null,
            square_feet: mappedData.square_feet ? parseInt(mappedData.square_feet) : null,
            lot_size_acres: mappedData.lot_size_acres ? parseFloat(mappedData.lot_size_acres) : null,
            year_built: mappedData.year_built ? parseInt(mappedData.year_built) : null,
            zoning: mappedData.zoning || null,
            legal_description: mappedData.legal_description || null,
            coordinates: mappedData.coordinates || null,
            last_assessment_date: mappedData.last_assessment_date || new Date().toISOString(),
            next_assessment_due: mappedData.next_assessment_due || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            active: mappedData.active !== undefined ? mappedData.active : true
          });

        if (error) throw error;
        result.successCount++;

      } catch (error) {
        result.errorCount++;
        result.errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : 'Unknown error',
          data: data[i]
        });

        await supabase
          .from('import_errors')
          .insert({
            import_id: importId,
            row_number: i + 1,
            error_type: 'validation_error',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            raw_data: data[i]
          });
      }
    }

    result.success = result.errorCount === 0;
    return result;
  }

  static async importPropertyOwners(data: any[], mappings: FieldMapping[], importId: string): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      totalRecords: data.length,
      successCount: 0,
      errorCount: 0,
      errors: []
    };

    for (let i = 0; i < data.length; i++) {
      try {
        const row = data[i];
        const mappedData = this.mapRowData(row, mappings);
        
        // Find property by parcel_id
        const { data: properties, error: propertyError } = await supabase
          .from('properties')
          .select('id')
          .eq('parcel_id', mappedData.parcel_id)
          .single();

        if (propertyError || !properties) {
          throw new Error(`Property not found for parcel_id: ${mappedData.parcel_id}`);
        }

        // Validate required fields
        const validationErrors = this.validateOwnerData(mappedData);
        if (validationErrors.length > 0) {
          throw new Error(validationErrors.join(', '));
        }

        // Insert property owner
        const { error } = await supabase
          .from('property_owners')
          .insert({
            property_id: properties.id,
            owner_name: mappedData.owner_name,
            owner_type: mappedData.owner_type || 'Individual',
            mailing_address: mappedData.mailing_address,
            mailing_city: mappedData.mailing_city,
            mailing_state: mappedData.mailing_state,
            mailing_zip: mappedData.mailing_zip,
            percentage_owned: parseInt(mappedData.percentage_owned) || 100,
            primary_owner: mappedData.primary_owner !== undefined ? mappedData.primary_owner : true
          });

        if (error) throw error;
        result.successCount++;

      } catch (error) {
        result.errorCount++;
        result.errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : 'Unknown error',
          data: data[i]
        });

        await supabase
          .from('import_errors')
          .insert({
            import_id: importId,
            row_number: i + 1,
            error_type: 'validation_error',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            raw_data: data[i]
          });
      }
    }

    result.success = result.errorCount === 0;
    return result;
  }

  private static mapRowData(row: any, mappings: FieldMapping[]): any {
    const mapped: any = {};
    
    for (const mapping of mappings) {
      let value = row[mapping.source];
      
      if (mapping.transform) {
        value = mapping.transform(value);
      }
      
      mapped[mapping.target] = value;
    }
    
    return mapped;
  }

  private static validateCountyData(data: any): string[] {
    const errors: string[] = [];
    
    if (!data.name) errors.push('County name is required');
    if (!data.state) errors.push('State is required');
    if (!data.fips_code) errors.push('FIPS code is required');
    
    return errors;
  }

  private static validatePropertyData(data: any): string[] {
    const errors: string[] = [];
    
    if (!data.parcel_id) errors.push('Parcel ID is required');
    if (!data.address) errors.push('Address is required');
    
    return errors;
  }

  private static validateOwnerData(data: any): string[] {
    const errors: string[] = [];
    
    if (!data.parcel_id) errors.push('Parcel ID is required');
    if (!data.owner_name) errors.push('Owner name is required');
    if (!data.mailing_address) errors.push('Mailing address is required');
    if (!data.mailing_city) errors.push('Mailing city is required');
    if (!data.mailing_state) errors.push('Mailing state is required');
    if (!data.mailing_zip) errors.push('Mailing ZIP is required');
    
    return errors;
  }
}
