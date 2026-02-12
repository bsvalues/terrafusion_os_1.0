/**
 * Export Utilities
 * Elite Power User - Data Export Functions
 */

import type { SqlQueryResult } from '../types/pacs';

/**
 * Export query results to Excel (using native browser capabilities)
 */
export function exportToExcel(data: SqlQueryResult, filename: string = 'query-results.xlsx'): void {
  try {
    // Dynamic import for XLSX library
    import('xlsx').then((XLSX) => {
      const workbook = XLSX.utils.book_new();
      
      // Convert result rows to worksheet
      const worksheetData = [data.columnNames, ...data.resultRows];
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      
      // Set column widths
      worksheet['!cols'] = data.columnNames.map(() => ({ wch: 20 }));
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Query Results');
      
      // Write file
      XLSX.writeFile(workbook, filename);
    }).catch((error) => {
      console.error('Error exporting to Excel:', error);
      // Fallback to CSV if XLSX is not available
      exportToCSV(data, filename.replace('.xlsx', '.csv'));
    });
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    exportToCSV(data, filename.replace('.xlsx', '.csv'));
  }
}

/**
 * Export data to CSV
 */
export function exportToCSV(data: SqlQueryResult, filename: string = 'query-results.csv'): void {
  const csvRows: string[] = [];
  
  // Header row
  csvRows.push(data.columnNames.join(','));
  
  // Data rows
  data.resultRows.forEach((row) => {
    const csvRow = row.map((cell) => {
      // Escape commas and quotes in cell values
      const cellValue = cell?.toString() || '';
      if (cellValue.includes(',') || cellValue.includes('"') || cellValue.includes('\n')) {
        return `"${cellValue.replace(/"/g, '""')}"`;
      }
      return cellValue;
    });
    csvRows.push(csvRow.join(','));
  });
  
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export data to JSON
 */
export function exportToJSON(data: SqlQueryResult, filename: string = 'query-results.json'): void {
  const jsonData = data.resultRows.map((row) => {
    const obj: Record<string, any> = {};
    data.columnNames.forEach((colName, index) => {
      obj[colName] = row[index];
    });
    return obj;
  });
  
  const jsonContent = JSON.stringify(jsonData, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  
  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
