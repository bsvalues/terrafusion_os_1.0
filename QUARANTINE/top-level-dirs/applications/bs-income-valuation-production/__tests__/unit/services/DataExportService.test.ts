import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DataExportService } from '@/services/DataExportService';

// Mock the FileSaver
vi.mock('file-saver', () => ({
  saveAs: vi.fn()
}));

describe('DataExportService', () => {
  const mockValuations = [
    {
      id: 1,
      name: 'Valuation 1',
      valuationAmount: '500000',
      totalAnnualIncome: '100000',
      multiplier: '5',
      incomeBreakdown: JSON.stringify({
        'salary': 60000,
        'business': 30000,
        'investment': 10000
      }),
      notes: 'Test notes 1',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-02')
    },
    {
      id: 2,
      name: 'Valuation 2',
      valuationAmount: '750000',
      totalAnnualIncome: '150000',
      multiplier: '5',
      incomeBreakdown: JSON.stringify({
        'salary': 100000,
        'business': 20000,
        'rental': 30000
      }),
      notes: 'Test notes 2',
      createdAt: new Date('2023-02-01'),
      updatedAt: new Date('2023-02-02')
    }
  ];
  
  const mockIncomes = [
    { id: 1, userId: 1, source: 'salary', amount: '60000', frequency: 'monthly', description: 'Employment', createdAt: new Date('2023-01-01') },
    { id: 2, userId: 1, source: 'business', amount: '30000', frequency: 'annual', description: 'Side business', createdAt: new Date('2023-01-01') },
    { id: 3, userId: 1, source: 'investment', amount: '10000', frequency: 'annual', description: 'Stocks', createdAt: new Date('2023-01-01') },
    { id: 4, userId: 1, source: 'salary', amount: '100000', frequency: 'annual', description: 'Primary job', createdAt: new Date('2023-02-01') },
    { id: 5, userId: 1, source: 'business', amount: '20000', frequency: 'annual', description: 'Consulting', createdAt: new Date('2023-02-01') },
    { id: 6, userId: 1, source: 'rental', amount: '30000', frequency: 'annual', description: 'Property', createdAt: new Date('2023-02-01') }
  ];

  describe('exportToCsv', () => {
    it('should export valuations to CSV with correct headers and data', () => {
      const { saveAs } = require('file-saver');
      
      const result = DataExportService.exportToCsv(mockValuations, 'valuations', {
        includeId: true
      });
      
      expect(result).toBe(true);
      expect(saveAs).toHaveBeenCalled();
      
      // Get the first argument of the first call to saveAs
      const blob = saveAs.mock.calls[0][0];
      expect(blob instanceof Blob).toBe(true);
      
      // Convert Blob to text for verification
      return blob.text().then((text: string) => {
        expect(text).toContain('id,name,valuationAmount,totalAnnualIncome,multiplier,notes,createdAt');
        expect(text).toContain('1,Valuation 1,500000,100000,5,Test notes 1');
        expect(text).toContain('2,Valuation 2,750000,150000,5,Test notes 2');
      });
    });
    
    it('should export incomes to CSV with correct headers and data', () => {
      const { saveAs } = require('file-saver');
      
      const result = DataExportService.exportToCsv(mockIncomes, 'incomes', {
        includeId: false
      });
      
      expect(result).toBe(true);
      expect(saveAs).toHaveBeenCalled();
      
      const blob = saveAs.mock.calls[0][0];
      
      return blob.text().then((text: string) => {
        expect(text).toContain('source,amount,frequency,description,createdAt');
        expect(text).not.toContain('id,source'); // Should not include ID
        expect(text).toContain('salary,60000,monthly,Employment');
        expect(text).toContain('business,30000,annual,Side business');
      });
    });
    
    it('should apply filters to exported data', () => {
      const { saveAs } = require('file-saver');
      
      const result = DataExportService.exportToCsv(mockIncomes, 'incomes', {
        includeId: false,
        filters: {
          source: 'salary'
        }
      });
      
      expect(result).toBe(true);
      
      const blob = saveAs.mock.calls[0][0];
      
      return blob.text().then((text: string) => {
        expect(text).toContain('salary,60000,monthly,Employment');
        expect(text).toContain('salary,100000,annual,Primary job');
        expect(text).not.toContain('business,30000'); // Should be filtered out
        expect(text).not.toContain('rental,30000'); // Should be filtered out
      });
    });
  });
  
  describe('exportToExcel', () => {
    it('should export data to Excel format', () => {
      const { saveAs } = require('file-saver');
      
      const result = DataExportService.exportToExcel(mockValuations, 'valuations', {
        sheetName: 'Valuations',
        includeId: true
      });
      
      expect(result).toBe(true);
      expect(saveAs).toHaveBeenCalled();
      
      const blob = saveAs.mock.calls[0][0];
      expect(blob instanceof Blob).toBe(true);
      expect(saveAs.mock.calls[0][1]).toBe('valuations.xlsx');
    });
    
    it('should export multiple sheets in Excel format', () => {
      const { saveAs } = require('file-saver');
      
      const result = DataExportService.exportToExcel(
        { valuations: mockValuations, incomes: mockIncomes },
        'financial_data',
        {
          includeId: true
        }
      );
      
      expect(result).toBe(true);
      expect(saveAs).toHaveBeenCalled();
      expect(saveAs.mock.calls[0][1]).toBe('financial_data.xlsx');
    });
  });
  
  describe('batchExport', () => {
    it('should process and export multiple sets of data', async () => {
      const { saveAs } = require('file-saver');
      
      const result = await DataExportService.batchExport([
        {
          data: mockValuations,
          type: 'csv',
          filename: 'valuations',
          options: { includeId: true }
        },
        {
          data: mockIncomes,
          type: 'csv',
          filename: 'incomes',
          options: { includeId: false }
        }
      ]);
      
      expect(result).toBe(true);
      expect(saveAs).toHaveBeenCalledTimes(2);
      
      expect(saveAs.mock.calls[0][1]).toBe('valuations.csv');
      expect(saveAs.mock.calls[1][1]).toBe('incomes.csv');
    });
    
    it('should handle errors during batch export', async () => {
      const { saveAs } = require('file-saver');
      saveAs.mockImplementationOnce(() => {
        throw new Error('Test error');
      });
      
      // Spy on console.error
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const result = await DataExportService.batchExport([
        {
          data: mockValuations,
          type: 'csv',
          filename: 'valuations',
          options: { includeId: true }
        },
        {
          data: mockIncomes,
          type: 'csv',
          filename: 'incomes',
          options: { includeId: false }
        }
      ]);
      
      // Even with one error, the operation should continue with other exports
      expect(result).toBe(true);
      expect(saveAs).toHaveBeenCalledTimes(2);
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });
  });
});