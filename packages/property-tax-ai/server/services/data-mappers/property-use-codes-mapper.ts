/**
 * Property Use Codes Mapper
 * 
 * This utility maps property use codes from CSV files to our system's property schema.
 * It handles the transformation of property use code records into properly formatted
 * property objects that comply with our InsertProperty schema.
 */

import * as fs from 'fs';
import { parse } from 'csv-parse/sync';
import { InsertProperty } from '../../../shared/schema';

export interface MappingStats {
  totalRecords: number;
  mappedRecords: number;
  errors: string[];
}

export interface MappingResult {
  mappedProperties: InsertProperty[];
  stats: MappingStats;
}

export class PropertyUseCodesMapper {
  
  /**
   * Maps property use codes from a CSV file to InsertProperty objects
   * @param csvFilePath Path to the property use codes CSV file
   * @returns Mapping result containing mapped properties and stats
   */
  public static async mapFromCsvFile(csvFilePath: string): Promise<MappingResult> {
    const stats: MappingStats = {
      totalRecords: 0,
      mappedRecords: 0,
      errors: []
    };
    
    try {
      // Read and parse the CSV file
      const fileContent = fs.readFileSync(csvFilePath, 'utf8');
      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });
      
      stats.totalRecords = records.length;
      console.log(`Found ${records.length} property use code records`);
      
      // Log the field structure of the first record to help with debugging
      if (records.length > 0) {
        const sampleRecord = records[0];
        console.log(`Sample record fields: ${Object.keys(sampleRecord).join(', ')}`);
      }
      
      // Map each record to our property schema
      const mappedProperties: InsertProperty[] = [];
      
      for (let i = 0; i < records.length; i++) {
        try {
          const mappedProperty = this.mapRecordToProperty(records[i]);
          mappedProperties.push(mappedProperty);
          stats.mappedRecords++;
        } catch (error: any) {
          const errorMessage = `Error mapping record ${i+1}: ${error.message}`;
          stats.errors.push(errorMessage);
          console.error(errorMessage);
        }
      }
      
      console.log(`Successfully mapped ${stats.mappedRecords} out of ${stats.totalRecords} records`);
      
      return {
        mappedProperties,
        stats
      };
      
    } catch (error: any) {
      const errorMessage = `Error processing property use codes file: ${error.message}`;
      stats.errors.push(errorMessage);
      console.error(errorMessage, error);
      
      return {
        mappedProperties: [],
        stats
      };
    }
  }
  
  /**
   * Maps a single property use code record to an InsertProperty object
   * @param record Raw record from the CSV file
   * @returns Mapped InsertProperty object
   */
  private static mapRecordToProperty(record: any): InsertProperty {
    // Extract fields using various possible field names
    const useCode = this.extractField(record, ['useCode', 'use_code', 'property_use_code', 'code', 'id']);
    const description = this.extractField(record, ['description', 'use_description', 'name', 'title', 'label']);
    const category = this.extractField(record, ['category', 'use_category', 'type', 'class', 'classification']);
    
    if (!useCode) {
      throw new Error('Unable to determine use code from record');
    }
    
    // Create a sanitized version of the use code for the property ID
    const sanitizedUseCode = useCode.replace(/\s+/g, '').replace(/[^a-zA-Z0-9-_]/g, '');
    
    // Create a unique property ID based on the use code
    const propertyId = `USE-${sanitizedUseCode}`;
    
    // Map to our property schema
    return {
      propertyId,
      address: `${description || 'Unknown'} Classification`, // Using description as address placeholder
      parcelNumber: `UC-${useCode}`, // Using use code as parcel number placeholder
      propertyType: category || 'Use Code', // Using category if available
      status: 'active',
      acres: '0', // Default to 0 acres
      value: null, // No value for use codes
      extraFields: {
        useCode,
        description: description || '',
        category: category || '',
        isClassification: true,
        // Store any additional fields from the record
        ...Object.keys(record)
          .filter(key => !this.isCommonField(key))
          .reduce((obj, key) => {
            obj[key] = record[key];
            return obj;
          }, {} as Record<string, any>)
      }
    };
  }
  
  /**
   * Extracts a field value from a record, trying multiple possible field names
   * @param record Record object
   * @param possibleFieldNames Array of possible field names to try
   * @returns Field value or empty string if not found
   */
  private static extractField(record: any, possibleFieldNames: string[]): string {
    for (const fieldName of possibleFieldNames) {
      if (record[fieldName] !== undefined && record[fieldName] !== null) {
        return String(record[fieldName]).trim();
      }
    }
    return '';
  }
  
  /**
   * Checks if a field name is one of the common fields we explicitly handle
   * @param fieldName Field name to check
   * @returns True if it's a common field we handle explicitly
   */
  private static isCommonField(fieldName: string): boolean {
    const commonFields = [
      'useCode', 'use_code', 'property_use_code', 'code', 'id',
      'description', 'use_description', 'name', 'title', 'label',
      'category', 'use_category', 'type', 'class', 'classification'
    ];
    
    return commonFields.includes(fieldName);
  }
}