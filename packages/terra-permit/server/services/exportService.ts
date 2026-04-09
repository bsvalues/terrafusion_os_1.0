import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import { Permit } from '../../shared/schema';

export class ExportService {
  /**
   * Exports permits data to Excel file
   * @param permits Array of permits to export
   * @param uploadId The upload ID these permits belong to
   * @param filename Optional custom filename
   */
  async exportPermitsToExcel(permits: Permit[], uploadId: number, filename?: string): Promise<string> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Processed Permits');
    
    // Define columns
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Parcel Number', key: 'parcelNumber', width: 20 },
      { header: 'Neighborhood Code', key: 'neighborhoodCode', width: 20 },
      { header: 'Permit Description', key: 'permitDescription', width: 40 },
      { header: 'Value', key: 'value', width: 15 },
      { header: 'Issue Date', key: 'issueDate', width: 15 },
      { header: 'Decision', key: 'enterPermit', width: 15 },
      { header: 'Reason', key: 'reason', width: 25 },
      { header: 'Processed At', key: 'processedAt', width: 20 }
    ];
    
    // Add header formatting
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Format each row before adding
    const formattedPermits = permits.map(permit => {
      return {
        ...permit,
        // Format boolean as Yes/No for better readability
        enterPermit: permit.enterPermit ? 'Enter' : 'Skip',
      };
    });
    
    // Add all permits
    formattedPermits.forEach(permit => {
      worksheet.addRow(permit);
    });
    
    // Apply conditional formatting to the Decision column
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) { // Skip the header row
        const decisionCell = row.getCell('enterPermit');
        if (decisionCell.value === 'Enter') {
          decisionCell.font = { color: { argb: 'FF10B981' } }; // Green
        } else {
          decisionCell.font = { color: { argb: 'FFEF4444' } }; // Red
        }
      }
    });
    
    // Create the directory if it doesn't exist
    const exportsDir = path.resolve('public/exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }
    
    // Set the filename
    const outputFilename = filename || `permits_upload_${uploadId}_${Date.now()}.xlsx`;
    const filePath = path.join(exportsDir, outputFilename);
    
    // Write the file
    await workbook.xlsx.writeFile(filePath);
    
    return filePath;
  }
}

export default new ExportService();