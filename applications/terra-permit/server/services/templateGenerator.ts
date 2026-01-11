import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';

export class TemplateGenerator {
  /**
   * Creates a template Excel file for permits data
   */
  async generateTemplate(): Promise<string> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Permits');
    
    // Define columns
    worksheet.columns = [
      { header: 'ParcelNumber', key: 'parcelNumber', width: 20 },
      { header: 'NeighborhoodCode', key: 'neighborhoodCode', width: 20 },
      { header: 'PermitDescription', key: 'permitDescription', width: 40 },
      { header: 'Value', key: 'value', width: 15 },
      { header: 'IssueDate', key: 'issueDate', width: 15 }
    ];
    
    // Add header formatting
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Add a few example rows
    const exampleData = [
      {
        parcelNumber: '12345678',
        neighborhoodCode: '6001',
        permitDescription: 'Commercial Building Renovation',
        value: '150000',
        issueDate: '2023-01-15'
      },
      {
        parcelNumber: '87654321',
        neighborhoodCode: '2001',
        permitDescription: 'Residential HVAC Replacement',
        value: '8500',
        issueDate: '2023-02-20'
      },
      {
        parcelNumber: '13579246',
        neighborhoodCode: '6002',
        permitDescription: 'Office Building Addition',
        value: '250000',
        issueDate: '2023-03-10'
      },
      {
        parcelNumber: '24681357',
        neighborhoodCode: '3001',
        permitDescription: 'Residential Re-roof',
        value: '12000',
        issueDate: '2023-04-05'
      }
    ];
    
    // Add the example rows
    exampleData.forEach(item => {
      worksheet.addRow(item);
    });
    
    // Create the directory if it doesn't exist
    const templatesDir = path.resolve('public/templates');
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir, { recursive: true });
    }
    
    // Write the file
    const filePath = path.join(templatesDir, 'permit_template.xlsx');
    await workbook.xlsx.writeFile(filePath);
    
    return filePath;
  }
}

export default new TemplateGenerator();