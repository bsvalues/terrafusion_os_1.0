import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

interface ExportOptions {
  includeId?: boolean;
  filters?: Record<string, any>;
  sheetName?: string;
  dateFormat?: string;
}

interface BatchExportItem {
  data: any[] | Record<string, any[]>;
  type: 'csv' | 'excel';
  filename: string;
  options?: ExportOptions;
}

/**
 * Service for exporting data to CSV, Excel, and other formats
 */
export class DataExportService {
  /**
   * Export data to CSV format
   * @param data Array of data to export
   * @param filename Name of the file (without extension)
   * @param options Export options
   * @returns Success status
   */
  static exportToCsv(data: any[], filename: string, options: ExportOptions = {}): boolean {
    try {
      // Apply filters if provided
      let filteredData = data;
      if (options.filters) {
        filteredData = this.applyFilters(data, options.filters);
      }
      
      // Filter out ID if not included
      const processedData = filteredData.map(item => {
        const processed = { ...item };
        
        // Remove ID if not included
        if (!options.includeId && 'id' in processed) {
          delete processed.id;
        }
        
        // Format dates if needed
        if (options.dateFormat) {
          Object.keys(processed).forEach(key => {
            if (processed[key] instanceof Date) {
              processed[key] = this.formatDate(processed[key], options.dateFormat);
            }
          });
        }
        
        return processed;
      });
      
      // Create CSV content
      const headers = Object.keys(processedData[0] || {});
      const csvContent = [
        headers.join(','),
        ...processedData.map(row => 
          headers.map(header => {
            const value = row[header];
            
            // Handle nested objects like income breakdown
            if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
              return JSON.stringify(value).replace(/"/g, '""');
            }
            
            // Handle strings with commas
            if (typeof value === 'string' && value.includes(',')) {
              return `"${value}"`;
            }
            
            // Convert undefined/null to empty string
            if (value === undefined || value === null) {
              return '';
            }
            
            return String(value);
          }).join(',')
        )
      ].join('\\n');
      
      // Create blob and save
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      saveAs(blob, `${filename}.csv`);
      
      return true;
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      return false;
    }
  }
  
  /**
   * Export data to Excel format
   * @param data Array or object of data to export
   * @param filename Name of the file (without extension)
   * @param options Export options
   * @returns Success status
   */
  static exportToExcel(
    data: any[] | Record<string, any[]>, 
    filename: string, 
    options: ExportOptions = {}
  ): boolean {
    try {
      const workbook = XLSX.utils.book_new();
      
      // Handle single sheet (array) or multiple sheets (object)
      if (Array.isArray(data)) {
        // Apply filters if provided
        let filteredData = data;
        if (options.filters) {
          filteredData = this.applyFilters(data, options.filters);
        }
        
        // Process data
        const processedData = this.processDataForExport(filteredData, options);
        
        // Create worksheet
        const worksheet = XLSX.utils.json_to_sheet(processedData);
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(
          workbook, 
          worksheet, 
          options.sheetName || 'Sheet1'
        );
      } else {
        // Handle multiple sheets
        Object.entries(data).forEach(([sheetName, sheetData]) => {
          // Apply filters if provided
          let filteredData = sheetData;
          if (options.filters) {
            filteredData = this.applyFilters(sheetData, options.filters);
          }
          
          // Process data
          const processedData = this.processDataForExport(filteredData, options);
          
          // Create worksheet
          const worksheet = XLSX.utils.json_to_sheet(processedData);
          
          // Add worksheet to workbook
          XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        });
      }
      
      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Save file
      saveAs(blob, `${filename}.xlsx`);
      
      return true;
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      return false;
    }
  }
  
  /**
   * Batch export multiple sets of data
   * @param exportItems Array of items to export
   * @returns Promise resolving to success status
   */
  static async batchExport(exportItems: BatchExportItem[]): Promise<boolean> {
    let successful = true;
    
    for (const item of exportItems) {
      try {
        if (item.type === 'csv') {
          if (Array.isArray(item.data)) {
            this.exportToCsv(item.data, item.filename, item.options);
          } else {
            // Handle object of arrays for CSV (export as separate files)
            Object.entries(item.data).forEach(([key, data]) => {
              this.exportToCsv(data, `${item.filename}_${key}`, item.options);
            });
          }
        } else if (item.type === 'excel') {
          this.exportToExcel(item.data, item.filename, item.options);
        }
      } catch (error) {
        console.error(`Error exporting ${item.filename}:`, error);
        successful = false;  // Continue with other exports even if one fails
      }
    }
    
    return successful;
  }
  
  /**
   * Apply filters to data
   * @param data Array of data
   * @param filters Object with filter criteria
   * @returns Filtered data
   */
  private static applyFilters(data: any[], filters: Record<string, any>): any[] {
    return data.filter(item => {
      // Check if item matches all filter criteria
      return Object.entries(filters).every(([key, value]) => {
        // Skip undefined or null filters
        if (value === undefined || value === null) return true;
        
        // Handle array of values (OR condition)
        if (Array.isArray(value)) {
          return value.includes(item[key]);
        }
        
        // Handle date ranges
        if (key.endsWith('Min') || key.endsWith('Max')) {
          const baseKey = key.replace(/Min$|Max$/, '');
          const itemValue = item[baseKey];
          
          if (itemValue instanceof Date) {
            if (key.endsWith('Min')) {
              return itemValue >= value;
            } else {
              return itemValue <= value;
            }
          }
        }
        
        // Regular equality check
        return item[key] === value;
      });
    });
  }
  
  /**
   * Process data for export
   * @param data Array of data
   * @param options Export options
   * @returns Processed data
   */
  private static processDataForExport(data: any[], options: ExportOptions = {}): any[] {
    return data.map(item => {
      const processed = { ...item };
      
      // Remove ID if not included
      if (!options.includeId && 'id' in processed) {
        delete processed.id;
      }
      
      // Handle special fields
      Object.keys(processed).forEach(key => {
        // Format dates
        if (processed[key] instanceof Date) {
          processed[key] = options.dateFormat
            ? this.formatDate(processed[key], options.dateFormat)
            : processed[key].toISOString();
        }
        
        // Parse JSON strings
        if (typeof processed[key] === 'string' && 
            (key === 'incomeBreakdown' || key.includes('Breakdown'))) {
          try {
            processed[key] = JSON.parse(processed[key]);
          } catch (e) {
            // Keep as string if can't parse
          }
        }
      });
      
      return processed;
    });
  }
  
  /**
   * Format date according to specified format
   * @param date Date to format
   * @param format Format string
   * @returns Formatted date string
   */
  private static formatDate(date: Date, format: string): string {
    if (format === 'ISO') {
      return date.toISOString();
    }
    
    if (format === 'short') {
      return date.toLocaleDateString();
    }
    
    if (format === 'full') {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }
    
    // Default format: YYYY-MM-DD
    return date.toISOString().split('T')[0];
  }
}