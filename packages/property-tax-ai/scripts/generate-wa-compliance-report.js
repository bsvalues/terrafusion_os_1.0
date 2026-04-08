/**
 * Generate Washington State Compliance Report Script
 * 
 * This script demonstrates the generation of compliance reports required by
 * Washington state regulations. It uses the WAComplianceReporter service
 * to generate various report types.
 * 
 * Usage: node scripts/generate-wa-compliance-report.js [reportType] [year]
 * 
 * Where reportType is one of:
 * - equalization (Equalization Ratio Report required by RCW 84.48)
 * - revaluation (Revaluation Cycle Report required by WAC 458-07-015)
 * - exemption (Exemption Verification Report)
 * - appeal (Appeal Compliance Report)
 * - annual (Annual Comprehensive Compliance Report)
 * 
 * If no report type is specified, it will generate the annual report.
 * If no year is specified, it will use the current year.
 */

const { storage } = require('../server/storage');
const { WAComplianceReporter } = require('../server/services/compliance/wa-compliance-reporter');
const { NotificationService } = require('../server/services/notification-service');
const { AgentSystem } = require('../server/services/agent-system');

async function main() {
  // Get command line arguments
  const args = process.argv.slice(2);
  const reportType = args[0] || 'annual';
  const year = parseInt(args[1]) || new Date().getFullYear();
  
  console.log(`Generating Washington State ${reportType} compliance report for ${year}...`);
  
  // Initialize services
  const notificationService = new NotificationService(storage);
  
  // Get the market analysis agent from the agent system
  const agentSystem = new AgentSystem(storage);
  await agentSystem.initialize();
  const marketAnalysisAgent = agentSystem.getAgentByType('market-analysis');
  
  if (!marketAnalysisAgent) {
    console.error('Market Analysis Agent not available. Using mock agent instead.');
    marketAnalysisAgent = {
      analyzeProperty: async () => ({
        analysis: "Mock market analysis - Agent not available",
        trends: {
          salesTrend: "unknown",
          valuationTrend: "unknown"
        }
      })
    };
  }
  
  // Create the Washington State Compliance Reporter
  const waComplianceReporter = new WAComplianceReporter(
    storage,
    notificationService,
    marketAnalysisAgent
  );
  
  let report;
  
  try {
    // Generate the appropriate report based on the report type
    switch(reportType.toLowerCase()) {
      case 'equalization':
        report = await waComplianceReporter.generateEqualizationReport(year);
        break;
      case 'revaluation':
        report = await waComplianceReporter.generateRevaluationCycleReport(year);
        break;
      case 'exemption':
        report = await waComplianceReporter.generateExemptionVerificationReport(year);
        break;
      case 'appeal':
        report = await waComplianceReporter.generateAppealComplianceReport(year);
        break;
      case 'annual':
        report = await waComplianceReporter.generateAnnualComplianceReport(year);
        break;
      default:
        console.error('Invalid report type. Please specify one of: equalization, revaluation, exemption, appeal, annual');
        process.exit(1);
    }
    
    console.log('Report generated successfully:');
    console.log(`Report ID: ${report.reportId}`);
    console.log(`Report Type: ${report.reportType}`);
    console.log(`Status: ${report.status}`);
    console.log(`Created At: ${report.createdAt}`);
    
    if (reportType.toLowerCase() === 'annual') {
      console.log('\nAnnual report includes the following components:');
      console.log('- Equalization Ratio Report');
      console.log('- Revaluation Cycle Report');
      console.log('- Exemption Verification Report');
      console.log('- Appeal Compliance Report');
    }
    
  } catch (error) {
    console.error('Error generating compliance report:', error);
    process.exit(1);
  }
  
  console.log('\nReport generation complete.');
}

main().catch(error => {
  console.error('Unhandled error in script execution:', error);
  process.exit(1);
});