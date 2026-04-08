/**
 * Washington State Compliance Reporter Tests
 * 
 * These tests verify that the Washington State Compliance Reporter
 * correctly generates reports required by Washington state regulations.
 */

const { storage } = require('../server/storage');
const { WAComplianceReporter } = require('../server/services/compliance/wa-compliance-reporter');

// Mock notification service and agents for testing
const mockNotificationService = {
  sendNotification: jest.fn()
};

const mockMarketAnalysisAgent = {
  analyzeProperty: jest.fn().mockResolvedValue({
    analysis: "Mock market analysis",
    trends: {
      salesTrend: "increasing",
      valuationTrend: "stable"
    }
  })
};

describe('Washington State Compliance Reporter', () => {
  let waComplianceReporter;
  
  beforeEach(() => {
    jest.clearAllMocks();
    waComplianceReporter = new WAComplianceReporter(
      storage,
      mockNotificationService,
      mockMarketAnalysisAgent
    );
  });
  
  test('should generate equalization report successfully', async () => {
    // Set up required data
    const year = 2025;
    
    // Execute the function
    const report = await waComplianceReporter.generateEqualizationReport(year);
    
    // Verification
    expect(report).toBeDefined();
    expect(report.year).toBe(year);
    expect(report.reportType).toBe('equalization');
    expect(report.status).toBe('draft');
    
    // Check if the report was saved in storage
    const savedReport = await storage.getEqualizationReportByYear(year);
    expect(savedReport).toBeDefined();
    expect(savedReport.reportId).toBe(report.reportId);
  });
  
  test('should generate revaluation cycle report successfully', async () => {
    // Set up required data
    const year = 2025;
    
    // Execute the function
    const report = await waComplianceReporter.generateRevaluationCycleReport(year);
    
    // Verification
    expect(report).toBeDefined();
    expect(report.year).toBe(year);
    expect(report.reportType).toBe('revaluation');
    expect(report.status).toBe('draft');
    
    // Check if the report was saved in storage
    const savedReport = await storage.getRevaluationCycleReportByYear(year);
    expect(savedReport).toBeDefined();
    expect(savedReport.reportId).toBe(report.reportId);
  });
  
  test('should generate exemption verification report successfully', async () => {
    // Set up required data
    const year = 2025;
    
    // Execute the function
    const report = await waComplianceReporter.generateExemptionVerificationReport(year);
    
    // Verification
    expect(report).toBeDefined();
    expect(report.year).toBe(year);
    expect(report.reportType).toBe('exemption');
    expect(report.status).toBe('draft');
    
    // Check if the report was saved in storage
    const savedReport = await storage.getExemptionVerificationReportByYear(year);
    expect(savedReport).toBeDefined();
    expect(savedReport.reportId).toBe(report.reportId);
  });
  
  test('should generate appeal compliance report successfully', async () => {
    // Set up required data
    const year = 2025;
    
    // Execute the function
    const report = await waComplianceReporter.generateAppealComplianceReport(year);
    
    // Verification
    expect(report).toBeDefined();
    expect(report.year).toBe(year);
    expect(report.reportType).toBe('appeal-compliance');
    expect(report.status).toBe('draft');
    
    // Check if the report was saved in storage
    const savedReport = await storage.getAppealComplianceReportByYear(year);
    expect(savedReport).toBeDefined();
    expect(savedReport.reportId).toBe(report.reportId);
  });
  
  test('should generate annual compliance report successfully', async () => {
    // Set up required data
    const year = 2025;
    
    // Execute the function
    const report = await waComplianceReporter.generateAnnualComplianceReport(year);
    
    // Verification
    expect(report).toBeDefined();
    expect(report.year).toBe(year);
    expect(report.reportType).toBe('annual');
    expect(report.status).toBe('draft');
    
    // Verify that the sub-reports were created
    expect(mockNotificationService.sendNotification).toHaveBeenCalled();
  });
});