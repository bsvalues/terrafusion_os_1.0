const fs = require('fs');
const path = require('path');
const { askLLM } = require('../lib/ai-client');

class NarratorAgent {
  constructor() {
    this.ready = true;
    this.narrativeTemplates = this.loadNarrativeTemplates();
  }

  loadNarrativeTemplates() {
    try {
      const templatePath = path.join(__dirname, '../../prompts/narrator_agent.json');
      if (fs.existsSync(templatePath)) {
        return JSON.parse(fs.readFileSync(templatePath, 'utf8'));
      }
    } catch (error) {
      console.warn('Narrator templates not found, using defaults');
    }

    return {
      workflow_summary: {
        system: "You are a documentation specialist for Benton County, Washington. Create clear, concise summaries of GIS workflows for audit trails and reporting.",
        template: "Summarize the following workflow and validation results for administrative review: Workflow: {workflowResult} Validation: {validationResult}"
      },
      sm00_narrative: {
        system: "Generate professional narrative summaries of SM00 report processing for Benton County records.",
        template: "Create a narrative summary of SM00 report processing: {sm00Data} with validation results: {validation}"
      },
      audit_summary: {
        system: "Create audit trail summaries for Benton County GIS operations, focusing on compliance and procedural adherence.",
        template: "Generate audit summary for operation: {operationType} with results: {results} and compliance status: {compliance}"
      }
    };
  }

  async summarizeWorkflow(workflowResult, validationResult) {
    try {
      const template = this.narrativeTemplates.workflow_summary;
      const prompt = template.template
        .replace('{workflowResult}', JSON.stringify(workflowResult))
        .replace('{validationResult}', JSON.stringify(validationResult));

      const narrativeSummary = await askLLM(`${template.system}\n\n${prompt}`, {
        context: { agent: 'narrator', summaryType: 'workflow' },
        useRAG: true
      });

      const summary = {
        summaryId: this.generateSummaryId(),
        workflowId: workflowResult.taskId,
        validationId: validationResult.validationId,
        narrative: narrativeSummary,
        keyPoints: this.extractKeyPoints(workflowResult, validationResult),
        timeline: this.createTimeline(workflowResult, validationResult),
        status: this.determineOverallStatus(workflowResult, validationResult),
        auditTrail: this.generateAuditTrail(workflowResult, validationResult),
        summarizedAt: new Date().toISOString(),
        summarizedBy: 'NarratorAgent'
      };

      this.logSummary(summary);
      return summary;

    } catch (error) {
      console.error('Workflow summary error:', error);
      return {
        summaryId: this.generateSummaryId(),
        error: error.message,
        summarizedAt: new Date().toISOString()
      };
    }
  }

  async summarizeSM00Processing(sm00Data, validation) {
    try {
      const template = this.narrativeTemplates.sm00_narrative;
      const prompt = template.template
        .replace('{sm00Data}', JSON.stringify(sm00Data))
        .replace('{validation}', JSON.stringify(validation));

      const narrative = await askLLM(`${template.system}\n\n${prompt}`, {
        context: { agent: 'narrator', summaryType: 'SM00' },
        useRAG: true
      });

      return {
        summaryId: this.generateSummaryId(),
        reportId: sm00Data.reportId,
        narrative,
        processingStatus: validation.isValid ? 'Completed Successfully' : 'Requires Review',
        validationSummary: this.createValidationSummary(validation),
        recommendations: this.extractRecommendations(validation),
        summarizedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('SM00 summary error:', error);
      throw new Error('Failed to summarize SM00 processing');
    }
  }

  async generateAuditReport(operations, timeframe) {
    try {
      const template = this.narrativeTemplates.audit_summary;
      
      const auditData = {
        timeframe,
        operationCount: operations.length,
        operationTypes: this.categorizeOperations(operations),
        complianceRate: this.calculateComplianceRate(operations),
        issues: this.aggregateIssues(operations)
      };

      const prompt = template.template
        .replace('{operationType}', 'Multiple Operations')
        .replace('{results}', JSON.stringify(auditData))
        .replace('{compliance}', auditData.complianceRate);

      const auditNarrative = await askLLM(`${template.system}\n\n${prompt}`, {
        context: { agent: 'narrator', summaryType: 'audit' },
        useRAG: true
      });

      return {
        auditId: this.generateSummaryId(),
        timeframe,
        narrative: auditNarrative,
        statistics: auditData,
        trends: this.identifyTrends(operations),
        recommendations: this.generateSystemRecommendations(auditData),
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Audit report error:', error);
      throw new Error('Failed to generate audit report');
    }
  }

  extractKeyPoints(workflowResult, validationResult) {
    const keyPoints = [];

    // Workflow key points
    if (workflowResult.workflowType) {
      keyPoints.push(`Workflow Type: ${workflowResult.workflowType}`);
    }

    if (workflowResult.recommendations && workflowResult.recommendations.length > 0) {
      keyPoints.push(`${workflowResult.recommendations.length} recommendations generated`);
    }

    // Validation key points
    if (validationResult.isValid) {
      keyPoints.push('Validation: PASSED');
    } else {
      keyPoints.push(`Validation: FAILED (${validationResult.issues?.length || 0} issues)`);
    }

    if (validationResult.complianceScore) {
      keyPoints.push(`Compliance Score: ${validationResult.complianceScore.score}% (${validationResult.complianceScore.grade})`);
    }

    return keyPoints;
  }

  createTimeline(workflowResult, validationResult) {
    const timeline = [];

    if (workflowResult.timestamp) {
      timeline.push({
        timestamp: workflowResult.timestamp,
        event: 'Workflow Processing Completed',
        status: workflowResult.status
      });
    }

    if (validationResult.validatedAt) {
      timeline.push({
        timestamp: validationResult.validatedAt,
        event: 'Validation Completed',
        status: validationResult.isValid ? 'passed' : 'failed'
      });
    }

    return timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  determineOverallStatus(workflowResult, validationResult) {
    if (workflowResult.status === 'failed') {
      return 'WORKFLOW_FAILED';
    }

    if (!validationResult.isValid) {
      return 'VALIDATION_FAILED';
    }

    if (validationResult.complianceScore && validationResult.complianceScore.score < 70) {
      return 'COMPLIANCE_REVIEW_REQUIRED';
    }

    return 'COMPLETED_SUCCESSFULLY';
  }

  generateAuditTrail(workflowResult, validationResult) {
    return {
      workflowProcessing: {
        agent: 'WorkflowAgent',
        timestamp: workflowResult.timestamp,
        status: workflowResult.status,
        taskId: workflowResult.taskId
      },
      validation: {
        agent: 'JudgeAgent',
        timestamp: validationResult.validatedAt,
        isValid: validationResult.isValid,
        validationId: validationResult.validationId
      },
      summary: {
        agent: 'NarratorAgent',
        timestamp: new Date().toISOString(),
        summaryGenerated: true
      }
    };
  }

  createValidationSummary(validation) {
    const summary = {
      overall: validation.isValid ? 'Valid' : 'Invalid',
      issueCount: validation.issues?.length || 0,
      checklistItems: validation.checklist?.length || 0
    };

    if (validation.checklist) {
      const passed = validation.checklist.filter(item => item.status === 'pass').length;
      summary.checklistPassRate = `${passed}/${validation.checklist.length}`;
    }

    return summary;
  }

  extractRecommendations(validation) {
    const recommendations = [];

    if (validation.issues) {
      validation.issues.forEach(issue => {
        if (issue.severity === 'high') {
          recommendations.push(`Address ${issue.category}: ${issue.description}`);
        }
      });
    }

    if (validation.recommendations) {
      validation.recommendations.forEach(rec => {
        recommendations.push(`${rec.priority.toUpperCase()}: ${rec.action} - ${rec.description}`);
      });
    }

    return recommendations;
  }

  categorizeOperations(operations) {
    const categories = {};
    
    operations.forEach(op => {
      const type = op.workflowType || op.operationType || 'unknown';
      categories[type] = (categories[type] || 0) + 1;
    });

    return categories;
  }

  calculateComplianceRate(operations) {
    const validOperations = operations.filter(op => 
      op.validation && op.validation.isValid
    ).length;

    return operations.length > 0 ? 
      Math.round((validOperations / operations.length) * 100) : 0;
  }

  aggregateIssues(operations) {
    const issueCategories = {};
    
    operations.forEach(op => {
      if (op.validation && op.validation.issues) {
        op.validation.issues.forEach(issue => {
          const category = issue.category || 'unknown';
          issueCategories[category] = (issueCategories[category] || 0) + 1;
        });
      }
    });

    return issueCategories;
  }

  identifyTrends(operations) {
    const trends = [];

    // Analyze compliance trends
    const complianceRate = this.calculateComplianceRate(operations);
    if (complianceRate < 80) {
      trends.push('Compliance rate below target (80%)');
    }

    // Analyze common issues
    const issues = this.aggregateIssues(operations);
    const topIssue = Object.keys(issues).reduce((a, b) => 
      issues[a] > issues[b] ? a : b, ''
    );
    
    if (topIssue && issues[topIssue] > 1) {
      trends.push(`Most common issue: ${topIssue} (${issues[topIssue]} occurrences)`);
    }

    return trends;
  }

  generateSystemRecommendations(auditData) {
    const recommendations = [];

    if (auditData.complianceRate < 90) {
      recommendations.push({
        priority: 'high',
        area: 'Compliance',
        action: 'Review workflow procedures and provide additional training'
      });
    }

    if (auditData.issues.format > 2) {
      recommendations.push({
        priority: 'medium',
        area: 'Data Quality',
        action: 'Implement automated format validation checks'
      });
    }

    if (auditData.issues.missing_data > 1) {
      recommendations.push({
        priority: 'medium',
        area: 'Data Completeness',
        action: 'Add required field validation before processing'
      });
    }

    return recommendations;
  }

  generateSummaryId() {
    return 'SUM-' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  logSummary(summary) {
    const logEntry = {
      type: 'SUMMARY_GENERATED',
      summaryId: summary.summaryId,
      workflowId: summary.workflowId,
      status: summary.status,
      timestamp: summary.summarizedAt
    };

    fs.appendFileSync(
      path.join(__dirname, '../../logs/summary-audit.log'),
      JSON.stringify(logEntry) + '\n'
    );
  }

  isReady() {
    return this.ready;
  }
}

module.exports = { NarratorAgent };