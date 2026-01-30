import ExcelJS from 'exceljs';
import { InsertPermit } from '@shared/schema';
import { log } from '../vite';
import { aiService, SpreadsheetAnalysis } from './aiService';

interface RawPermitData {
  [key: string]: any;
}

export class SpreadsheetParser {
  // Excel (.xls) file signature (magic numbers)
  private XLS_SIGNATURES = [
    'd0cf11e0', // Common .xls signature
    'fdffffff', // Another variant
    '09081000', // Another variant
  ];
  
  // CSV markers to detect
  private CSV_MARKERS = [',', ';', '\t'];
  
  /**
   * Detect if the buffer is an older Excel (.xls) format
   */
  private isOldExcelFormat(buffer: Buffer): boolean {
    if (buffer.length < 4) return false;
    
    const signature = buffer.slice(0, 4).toString('hex');
    return this.XLS_SIGNATURES.includes(signature);
  }
  
  /**
   * Detect if the buffer is likely a CSV file
   */
  private isCSVFile(buffer: Buffer): boolean {
    // Check file mimetype from the first few bytes
    const signature = buffer.slice(0, Math.min(4, buffer.length)).toString('hex');
    
    // Check for Excel file signatures first - these shouldn't be treated as CSV
    if (this.isXLSXSignature(signature) || this.isOldExcelFormat(buffer)) {
      return false;
    }
    
    // Check BOM for UTF-8 CSV (common in Excel-exported CSVs)
    if (buffer.length >= 3 && 
        buffer[0] === 0xEF && 
        buffer[1] === 0xBB && 
        buffer[2] === 0xBF) {
      return true;
    }
    
    // Check first 1000 bytes for CSV characteristics
    const sample = buffer.slice(0, Math.min(1000, buffer.length)).toString('utf8');
    
    // Check for newlines and common CSV delimiters
    const hasNewlines = sample.includes('\n') || sample.includes('\r');
    const hasDelimiters = this.CSV_MARKERS.some(marker => sample.includes(marker));
    
    // Look for a good ratio of commas to newlines (typical for CSV)
    const commaCount = (sample.match(/,/g) || []).length;
    const newlineCount = (sample.match(/\n/g) || []).length + (sample.match(/\r/g) || []).length;
    const goodRatio = newlineCount > 0 && commaCount / newlineCount >= 3; // At least 3 fields per line
    
    // Likely a CSV if it has newlines and delimiters in the right proportion
    return hasNewlines && hasDelimiters && goodRatio;
  }
  
  /**
   * Detect XLSX file signature (PK zip file format)
   */
  private isXLSXSignature(signature: string): boolean {
    return signature.startsWith('504b'); // PK zip file signature
  }
  
  /**
   * Parse a CSV buffer into structured data
   */
  private parseCSV(buffer: Buffer): RawPermitData[] {
    // Convert buffer to text, handling UTF-8 BOM if present
    let content = buffer.toString('utf8');
    if (content.charCodeAt(0) === 0xFEFF) {
      content = content.substring(1); // Remove BOM
    }
    
    return this.parseCSVText(content);
  }
  
  /**
   * Parse CSV text into structured data
   */
  private parseCSVText(content: string): RawPermitData[] {
    try {
      // Split text into lines
      const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length === 0) {
        return [];
      }
      
      // Determine the delimiter by analyzing the first line
      const firstLine = lines[0];
      let delimiter = ','; // Default delimiter
      
      // Count occurrences of potential delimiters
      const delimiterCounts = {
        ',': (firstLine.match(/,/g) || []).length,
        ';': (firstLine.match(/;/g) || []).length,
        '\t': (firstLine.match(/\t/g) || []).length
      };
      
      // Find the most common delimiter
      if (delimiterCounts[';'] > delimiterCounts[','] && delimiterCounts[';'] > delimiterCounts['\t']) {
        delimiter = ';';
      } else if (delimiterCounts['\t'] > delimiterCounts[','] && delimiterCounts['\t'] > delimiterCounts[';']) {
        delimiter = '\t';
      }
      
      // Parse headers
      const headers = this.parseCSVLine(lines[0], delimiter);
      log(`CSV headers (using delimiter '${delimiter}'): ${headers.join(', ')}`, 'spreadsheetParser');
      
      // Parse data rows
      const data: RawPermitData[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = this.parseCSVLine(lines[i], delimiter);
        
        // Skip rows with fewer values than headers
        if (values.length < headers.length / 2) {
          continue;
        }
        
        const row: RawPermitData = {};
        for (let j = 0; j < headers.length; j++) {
          if (j < values.length) {
            row[headers[j]] = values[j];
          }
        }
        
        // Only add rows with at least one non-empty value
        if (Object.values(row).some(val => val !== undefined && val !== null && val !== '')) {
          data.push(row);
        }
      }
      
      log(`Processed ${data.length} valid data rows from CSV`, 'spreadsheetParser');
      return data;
    } catch (error: any) {
      log(`Error parsing CSV text: ${error.message}`, 'spreadsheetParser');
      return [];
    }
  }
  
  /**
   * Parse a single CSV line into values, handling quotes properly
   */
  private parseCSVLine(line: string, delimiter: string): string[] {
    const values: string[] = [];
    let inQuotes = false;
    let currentValue = '';
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = i < line.length - 1 ? line[i + 1] : '';
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote inside quotes
          currentValue += '"';
          i++; // Skip the next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        // End of value
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        // Part of value
        currentValue += char;
      }
    }
    
    // Add the last value
    values.push(currentValue.trim());
    
    return values;
  }
  /**
   * Parse an Excel file buffer into permit data
   * @param buffer - The uploaded file buffer
   * @returns Promise with array of permit data
   */
  async parseBuffer(buffer: Buffer): Promise<RawPermitData[]> {
    const workbook = new ExcelJS.Workbook();
    
    try {
      // Add logging to check buffer size
      log(`Processing spreadsheet buffer of size ${buffer.length} bytes`, 'spreadsheetParser');
      
      // Check if the file is CSV by looking for comma-separated content
      const isCSV = this.isCSVFile(buffer);
      
      if (isCSV) {
        log('Detected CSV file format, parsing as CSV', 'spreadsheetParser');
        return this.parseCSV(buffer);
      }
      
      // Check if file is older Excel (.xls) format
      const isOldExcel = this.isOldExcelFormat(buffer);
      if (isOldExcel) {
        log('Detected older Excel (.xls) format, converting to CSV for processing', 'spreadsheetParser');
        // Since ExcelJS doesn't natively support .xls, we'll extract text and parse it as CSV
        const extractedText = this.extractTextFromBuffer(buffer);
        return this.parseCSVText(extractedText);
      }
      
      // Try to load as XLSX
      await workbook.xlsx.load(buffer);
      
      // Debug workbook information
      log(`Workbook loaded successfully with ${workbook.worksheets.length} worksheets`, 'spreadsheetParser');
      
      // Use the first worksheet
      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        log('No worksheets found in the spreadsheet', 'spreadsheetParser');
        
        // Try parsing as CSV as a fallback
        log('Attempting to parse as CSV as fallback', 'spreadsheetParser');
        const textContent = this.extractTextFromBuffer(buffer);
        if (textContent.includes(',') || textContent.includes('\t')) {
          return this.parseCSVText(textContent);
        }
        
        // Return empty dataset
        return [];
      }
      
      // Log worksheet information
      log(`Processing worksheet: "${worksheet.name}" with ${worksheet.rowCount} rows`, 'spreadsheetParser');
      
      // Extract headers and data
      const headers: string[] = [];
      const data: RawPermitData[] = [];
      
      // Process headers from the first row
      worksheet.getRow(1).eachCell((cell, colNumber) => {
        headers[colNumber - 1] = cell.value?.toString() || `Column${colNumber}`;
      });
      
      log(`Found ${headers.length} headers: ${headers.join(', ')}`, 'spreadsheetParser');
      
      // Ensure we have some headers
      if (headers.length === 0) {
        log('No headers found in the first row', 'spreadsheetParser');
        return [];
      }
      
      // Process data rows
      worksheet.eachRow((row, rowNumber) => {
        // Skip header row
        if (rowNumber === 1) return;
        
        const rowData: RawPermitData = {};
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber - 1];
          rowData[header] = cell.value;
        });
        
        // Only add rows that have at least one non-empty value
        if (Object.values(rowData).some(val => val !== undefined && val !== null && val !== '')) {
          data.push(rowData);
        }
      });
      
      log(`Processed ${data.length} valid data rows`, 'spreadsheetParser');
      
      return data;
    } catch (error: any) {
      log(`Error parsing spreadsheet: ${error.message}`, 'spreadsheetParser');
      
      // More detailed logging for troubleshooting
      if (buffer.length === 0) {
        throw new Error('File buffer is empty. Please check the uploaded file.');
      }
      
      // Get the first few bytes to check the file signature
      const fileSignature = buffer.slice(0, Math.min(4, buffer.length)).toString('hex');
      log(`File signature: ${fileSignature}`, 'spreadsheetParser');
      
      // Try to extract text and parse it without using AI
      try {
        const textContent = this.extractTextFromBuffer(buffer);
        if (textContent && textContent.length > 100) {
          log(`Attempting to parse text content as CSV (${textContent.length} chars)`, 'spreadsheetParser');
          
          // Check if text has CSV-like characteristics
          if (textContent.includes(',') || textContent.includes(';') || textContent.includes('\t')) {
            const extractedData = this.parseCSVText(textContent);
            if (extractedData && extractedData.length > 0) {
              log(`Successfully extracted ${extractedData.length} rows from text content`, 'spreadsheetParser');
              return extractedData;
            }
          }
          
          log('Text content does not appear to be in CSV format', 'spreadsheetParser');
        }
      } catch (extractError: any) {
        log(`Failed to extract text: ${extractError.message}`, 'spreadsheetParser');
      }
      
      throw new Error(`Failed to parse spreadsheet: ${error.message}. Please ensure the file is a valid Excel spreadsheet.`);
    }
  }
  
  /**
   * Extract text content from buffer for AI analysis
   */
  private extractTextFromBuffer(buffer: Buffer): string {
    // Simple extraction of text fragments
    let text = '';
    for (let i = 0; i < buffer.length; i++) {
      // Only include printable ASCII characters
      if (buffer[i] >= 32 && buffer[i] <= 126) {
        text += String.fromCharCode(buffer[i]);
      } else if (buffer[i] === 9 || buffer[i] === 10 || buffer[i] === 13) {
        // Include tabs and newlines
        text += ' ';
      }
    }
    return text;
  }
  
  /**
   * Use AI to extract permit data from text
   */
  private async extractDataFromText(text: string): Promise<RawPermitData[]> {
    try {
      const permits = await aiService.extractPermitDataFromText(text);
      return permits.map(permit => ({
        ParcelNumber: permit.parcelNumber,
        NeighborhoodCode: permit.neighborhoodCode,
        PermitDescription: permit.permitDescription,
        Value: permit.value,
        IssueDate: permit.issueDate
      }));
    } catch (error: any) {
      log(`AI extraction failed: ${error.message}`, 'spreadsheetParser');
      return [];
    }
  }
  
  /**
   * Map raw data to our permit schema with intelligent column mapping
   * @param rawData - The raw data from spreadsheet
   * @param uploadId - The ID of the upload session
   * @returns Mapped permit data ready for insertion
   */
  async mapToPermits(rawData: RawPermitData[], uploadId: number): Promise<InsertPermit[]> {
    if (rawData.length === 0) {
      return [];
    }
    
    try {
      // Get headers from first row
      const headers = Object.keys(rawData[0]);
      
      // First try using traditional mapping - it's more reliable and doesn't require API calls
      try {
        log('Attempting traditional column mapping first', 'spreadsheetParser');
        return this.mapTraditional(rawData, uploadId);
      } catch (traditionalError: any) {
        log(`Traditional mapping failed: ${traditionalError.message}`, 'spreadsheetParser');
        
        // Only attempt AI analysis if traditional mapping fails and OpenAI is configured
        if (process.env.OPENAI_API_KEY) {
          try {
            // Use AI to analyze the spreadsheet structure
            const analysis = await aiService.analyzeSpreadsheet(headers, rawData.slice(0, 5));
            log(`AI spreadsheet analysis: ${JSON.stringify(analysis)}`, 'spreadsheetParser');
            
            if (analysis.confidence > 0.7) {
              // Use AI-provided column mapping
              return this.mapWithAIAnalysis(rawData, uploadId, analysis);
            }
          } catch (aiError: any) {
            log(`AI mapping failed: ${aiError.message}`, 'spreadsheetParser');
          }
        } else {
          log('OpenAI API key not configured, skipping AI analysis', 'spreadsheetParser');
        }
        
        // If both traditional mapping and AI analysis fail, throw the original error
        throw traditionalError;
      }
    } catch (error: any) {
      log(`Error mapping permit data: ${error.message}`, 'spreadsheetParser');
      throw error;
    }
  }
  
  /**
   * Map data using AI analysis results
   */
  private mapWithAIAnalysis(rawData: RawPermitData[], uploadId: number, analysis: SpreadsheetAnalysis): InsertPermit[] {
    return rawData.map(row => {
      // Use the AI-detected column mapping
      const mapping = analysis.columnMapping;
      
      // Map fields using AI-detected columns with fallback to our enhanced traditional matching
      const parcelNumber = this.getValueByMapping(row, mapping.parcelNumber || '') || 
                           this.getStringValue(row, [
                             'ParcelNumber', 'Parcel', 'Parcel Number', 'Parcel_Number', 'Parcel ID', 'ParcelID', 
                             'Property Number', 'PropertyNumber', 'Property ID', 'PropertyID', 'APN', 'Tax ID', 'TaxID'
                           ]);
      
      const neighborhoodCode = this.getValueByMapping(row, mapping.neighborhoodCode || '') || 
                              this.getStringValue(row, [
                                'NeighborhoodCode', 'Neighborhood', 'Neighborhood Code', 'Neighborhood_Code', 
                                'Zone', 'ZoneCode', 'Zone Code', 'District', 'District Code', 'Area', 'Area Code',
                                'Location', 'Location Code', 'Region', 'Region Code'
                              ]);
      
      const permitDescription = this.getValueByMapping(row, mapping.permitDescription || '') || 
                               this.getStringValue(row, [
                                 'PermitDescription', 'Description', 'Permit Description', 'Permit_Description',
                                 'Work Description', 'WorkDescription', 'Scope', 'Scope of Work', 'ScopeOfWork',
                                 'Project Description', 'ProjectDescription', 'Details', 'Work Details', 'WorkDetails'
                               ]);
      
      const value = this.getValueByMapping(row, mapping.value || '') || 
                   this.getStringValue(row, [
                     'Value', 'Cost', 'Amount', 'PermitValue', 'Permit Value', 'Permit_Value',
                     'Project Value', 'ProjectValue', 'Project Cost', 'ProjectCost', 'Fee',
                     'Construction Value', 'ConstructionValue', 'Price', 'Valuation', 'Project Valuation'
                   ]);
      
      const issueDate = this.getValueByMapping(row, mapping.issueDate || '') || 
                       this.getStringValue(row, [
                         'IssueDate', 'Date', 'Issue Date', 'Issue_Date', 'Issued', 'Issued Date', 'IssuedDate',
                         'Date Issued', 'DateIssued', 'Approval Date', 'ApprovalDate', 'Start Date', 'StartDate',
                         'Permit Date', 'PermitDate', 'Date of Issue', 'DateOfIssue'
                       ]);
      
      // Basic validation
      if (!parcelNumber) {
        throw new Error('Parcel Number is required for all permits');
      }
      
      return {
        parcelNumber,
        neighborhoodCode,
        permitDescription,
        value,
        issueDate,
        enterPermit: false, // Will be set by classifier
        reason: '',         // Will be set by classifier
        uploadId
      };
    });
  }
  
  /**
   * Traditional mapping approach
   */
  private mapTraditional(rawData: RawPermitData[], uploadId: number): InsertPermit[] {
    return rawData.map(row => {
      // Map fields from spreadsheet to our schema using traditional method with expanded column name possibilities
      const parcelNumber = this.getStringValue(row, [
        'ParcelNumber', 'Parcel', 'Parcel Number', 'Parcel_Number', 'Parcel ID', 'ParcelID', 
        'Property Number', 'PropertyNumber', 'Property ID', 'PropertyID', 'APN', 'Tax ID', 'TaxID'
      ]);
      
      const neighborhoodCode = this.getStringValue(row, [
        'NeighborhoodCode', 'Neighborhood', 'Neighborhood Code', 'Neighborhood_Code', 
        'Zone', 'ZoneCode', 'Zone Code', 'District', 'District Code', 'Area', 'Area Code',
        'Location', 'Location Code', 'Region', 'Region Code'
      ]);
      
      const permitDescription = this.getStringValue(row, [
        'PermitDescription', 'Description', 'Permit Description', 'Permit_Description',
        'Work Description', 'WorkDescription', 'Scope', 'Scope of Work', 'ScopeOfWork',
        'Project Description', 'ProjectDescription', 'Details', 'Work Details', 'WorkDetails'
      ]);
      
      const value = this.getStringValue(row, [
        'Value', 'Cost', 'Amount', 'PermitValue', 'Permit Value', 'Permit_Value',
        'Project Value', 'ProjectValue', 'Project Cost', 'ProjectCost', 'Fee',
        'Construction Value', 'ConstructionValue', 'Price', 'Valuation', 'Project Valuation'
      ]);
      
      const issueDate = this.getStringValue(row, [
        'IssueDate', 'Date', 'Issue Date', 'Issue_Date', 'Issued', 'Issued Date', 'IssuedDate',
        'Date Issued', 'DateIssued', 'Approval Date', 'ApprovalDate', 'Start Date', 'StartDate',
        'Permit Date', 'PermitDate', 'Date of Issue', 'DateOfIssue'
      ]);
      
      // Basic validation
      if (!parcelNumber) {
        throw new Error('Parcel Number is required for all permits');
      }
      
      return {
        parcelNumber,
        neighborhoodCode,
        permitDescription,
        value,
        issueDate,
        enterPermit: false, // Will be set by classifier
        reason: '',         // Will be set by classifier
        uploadId
      };
    });
  }
  
  /**
   * Helper to get value using AI-provided column mapping
   * Includes case-insensitive matching for better column detection
   */
  private getValueByMapping(row: RawPermitData, columnName: string): string {
    // If columnName is empty or not defined
    if (!columnName) return '';
    
    // Direct match
    if (row[columnName] !== undefined) {
      return row[columnName]?.toString() || '';
    }
    
    // Try case-insensitive match
    const rowKeys = Object.keys(row);
    const lowerColumnName = columnName.toLowerCase();
    
    const matchingKey = rowKeys.find(k => k.toLowerCase() === lowerColumnName);
    if (matchingKey && row[matchingKey] !== undefined) {
      return row[matchingKey]?.toString() || '';
    }
    
    return '';
  }
  
  /**
   * Helper to extract string values with various possible column names
   * Enhanced with case-insensitive matching and fuzzy name matching
   */
  private getStringValue(row: RawPermitData, possibleKeys: string[]): string {
    // Exact match first
    for (const key of possibleKeys) {
      if (row[key] !== undefined) {
        return row[key]?.toString() || '';
      }
    }
    
    // Try case-insensitive matching
    const rowKeys = Object.keys(row);
    for (const key of possibleKeys) {
      const lowerKey = key.toLowerCase();
      const matchingKey = rowKeys.find(k => k.toLowerCase() === lowerKey);
      if (matchingKey && row[matchingKey] !== undefined) {
        return row[matchingKey]?.toString() || '';
      }
    }
    
    // Try fuzzy matching (contains the key)
    for (const key of possibleKeys) {
      const fuzzyMatches = rowKeys.filter(k => 
        k.toLowerCase().includes(key.toLowerCase()) || 
        key.toLowerCase().includes(k.toLowerCase())
      );
      
      if (fuzzyMatches.length > 0) {
        // Use the shortest match (likely the most specific)
        const bestMatch = fuzzyMatches.sort((a, b) => a.length - b.length)[0];
        if (row[bestMatch] !== undefined) {
          return row[bestMatch]?.toString() || '';
        }
      }
    }
    
    return '';
  }
}

export default new SpreadsheetParser();
