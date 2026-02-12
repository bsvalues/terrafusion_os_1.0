const fs = require('fs');
const path = require('path');
const { askLLM } = require('../lib/ai-client');

class WorkflowAgent {
  constructor() {
    this.ready = true;
    this.promptTemplates = this.loadPromptTemplates();
  }

  loadPromptTemplates() {
    try {
      const templatePath = path.join(__dirname, '../../prompts/workflow_agent.json');
      if (fs.existsSync(templatePath)) {
        return JSON.parse(fs.readFileSync(templatePath, 'utf8'));
      }
    } catch (error) {
      console.warn('Workflow prompt templates not found, using defaults');
    }
    
    return {
      sm00_generation: {
        system: "You are a specialized GIS workflow assistant for Benton County, Washington. Generate accurate SM00 reports following Washington State standards.",
        template: "Generate an SM00 report for parcel {parcelNumber} with owner {ownerName} and legal description {legalDescription} in {county}."
      },
      bla_processing: {
        system: "You are processing Boundary Line Adjustments for Benton County. Ensure compliance with local zoning and state regulations.",
        template: "Process {operation} operation for parcels {sourceParcels} with target configuration {targetConfiguration} in {county}."
      },
      parcel_analysis: {
        system: "Analyze parcel data for Benton County assessment workflows. Consider agricultural, residential, commercial, and industrial classifications.",
        template: "Analyze parcel data {parcelData} for workflow type {workflowType} and provide recommendations."
      }
    };
  }

  async processTask(task, parcelData, workflowType) {
    try {
      const promptTemplate = this.promptTemplates.parcel_analysis;
      const prompt = promptTemplate.template
        .replace('{parcelData}', JSON.stringify(parcelData))
        .replace('{workflowType}', workflowType);

      const analysis = await askLLM(`${promptTemplate.system}\n\n${prompt}\n\nTask: ${task}`, {
        context: { agent: 'workflow', workflowType },
        useRAG: true
      });

      return {
        taskId: this.generateTaskId(),
        workflowType,
        task,
        parcelData,
        analysis,
        recommendations: await this.generateRecommendations(analysis, workflowType),
        status: 'processed',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('WorkflowAgent task processing error:', error);
      return {
        taskId: this.generateTaskId(),
        workflowType,
        task,
        error: error.message,
        status: 'failed',
        timestamp: new Date().toISOString()
      };
    }
  }

  async generateSM00Report(parcelInfo) {
    try {
      const { parcelNumber, ownerName, legalDescription, county } = parcelInfo;
      
      const promptTemplate = this.promptTemplates.sm00_generation;
      const prompt = promptTemplate.template
        .replace('{parcelNumber}', parcelNumber)
        .replace('{ownerName}', ownerName)
        .replace('{legalDescription}', legalDescription)
        .replace('{county}', county);

      const sm00Content = await askLLM(`${promptTemplate.system}\n\n${prompt}`, {
        context: { agent: 'workflow', reportType: 'SM00' },
        useRAG: true
      });

      // Format as structured SM00 report
      const sm00Report = {
        reportId: `SM00-${this.generateTaskId()}`,
        parcelNumber,
        ownerName,
        legalDescription,
        county,
        generatedContent: sm00Content,
        sections: this.parseSM00Sections(sm00Content),
        status: 'generated',
        generatedAt: new Date().toISOString()
      };

      // Log SM00 generation
      this.logSM00Generation(sm00Report);

      return sm00Report;

    } catch (error) {
      console.error('SM00 generation error:', error);
      throw new Error('Failed to generate SM00 report');
    }
  }

  async processBLAOperation(blaInfo) {
    try {
      const { operation, sourceParcels, targetConfiguration, county } = blaInfo;
      
      const promptTemplate = this.promptTemplates.bla_processing;
      const prompt = promptTemplate.template
        .replace('{operation}', operation)
        .replace('{sourceParcels}', JSON.stringify(sourceParcels))
        .replace('{targetConfiguration}', JSON.stringify(targetConfiguration))
        .replace('{county}', county);

      const blaAnalysis = await askLLM(`${promptTemplate.system}\n\n${prompt}`, {
        context: { agent: 'workflow', operationType: 'BLA' },
        useRAG: true
      });

      const blaResult = {
        operationId: `BLA-${this.generateTaskId()}`,
        operation,
        sourceParcels,
        targetConfiguration,
        county,
        analysis: blaAnalysis,
        steps: this.parseBLASteps(blaAnalysis),
        requirements: this.extractBLARequirements(blaAnalysis),
        status: 'analyzed',
        processedAt: new Date().toISOString()
      };

      // Log BLA processing
      this.logBLAProcessing(blaResult);

      return blaResult;

    } catch (error) {
      console.error('BLA processing error:', error);
      throw new Error('Failed to process BLA operation');
    }
  }

  async generateRecommendations(analysis, workflowType) {
    const recommendations = [];

    // Parse analysis for actionable recommendations
    if (analysis.includes('survey') || analysis.includes('boundary')) {
      recommendations.push({
        priority: 'high',
        action: 'Survey Required',
        description: 'Licensed surveyor assessment needed for boundary verification'
      });
    }

    if (analysis.includes('zoning') || analysis.includes('compliance')) {
      recommendations.push({
        priority: 'medium',
        action: 'Zoning Review',
        description: 'Verify compliance with current Benton County zoning requirements'
      });
    }

    if (analysis.includes('environmental') || analysis.includes('SEPA')) {
      recommendations.push({
        priority: 'medium',
        action: 'Environmental Review',
        description: 'SEPA environmental review may be required'
      });
    }

    // Workflow-specific recommendations
    if (workflowType === 'agricultural_assessment') {
      recommendations.push({
        priority: 'low',
        action: 'Current Use Assessment',
        description: 'Review eligibility for agricultural current use assessment program'
      });
    }

    return recommendations;
  }

  parseSM00Sections(content) {
    // Extract structured sections from generated SM00 content
    const sections = {};
    
    const sectionPatterns = [
      { name: 'parcelIdentification', pattern: /Parcel Identification[:\s]*(.*?)(?=\n\d+\.|$)/s },
      { name: 'ownershipInformation', pattern: /Ownership Information[:\s]*(.*?)(?=\n\d+\.|$)/s },
      { name: 'assessmentData', pattern: /Assessment Data[:\s]*(.*?)(?=\n\d+\.|$)/s },
      { name: 'taxingDistricts', pattern: /Taxing Districts[:\s]*(.*?)(?=\n\d+\.|$)/s }
    ];

    sectionPatterns.forEach(({ name, pattern }) => {
      const match = content.match(pattern);
      if (match) {
        sections[name] = match[1].trim();
      }
    });

    return sections;
  }

  parseBLASteps(analysis) {
    // Extract procedural steps from BLA analysis
    const steps = [];
    const stepPattern = /(\d+)\.\s*(.*?)(?=\n\d+\.|$)/g;
    let match;

    while ((match = stepPattern.exec(analysis)) !== null) {
      steps.push({
        stepNumber: parseInt(match[1]),
        description: match[2].trim(),
        status: 'pending'
      });
    }

    return steps;
  }

  extractBLARequirements(analysis) {
    // Extract specific requirements from BLA analysis
    const requirements = [];
    
    if (analysis.includes('survey')) {
      requirements.push('Licensed surveyor boundary survey');
    }
    if (analysis.includes('legal description')) {
      requirements.push('Updated legal descriptions');
    }
    if (analysis.includes('setback')) {
      requirements.push('Setback compliance verification');
    }
    if (analysis.includes('utility')) {
      requirements.push('Utility easement review');
    }

    return requirements;
  }

  generateTaskId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  logSM00Generation(sm00Report) {
    const logEntry = {
      type: 'SM00_GENERATION',
      reportId: sm00Report.reportId,
      parcelNumber: sm00Report.parcelNumber,
      timestamp: sm00Report.generatedAt
    };

    fs.appendFileSync(
      path.join(__dirname, '../../logs/workflow-operations.log'),
      JSON.stringify(logEntry) + '\n'
    );
  }

  logBLAProcessing(blaResult) {
    const logEntry = {
      type: 'BLA_PROCESSING',
      operationId: blaResult.operationId,
      operation: blaResult.operation,
      timestamp: blaResult.processedAt
    };

    fs.appendFileSync(
      path.join(__dirname, '../../logs/workflow-operations.log'),
      JSON.stringify(logEntry) + '\n'
    );
  }

  isReady() {
    return this.ready;
  }
}

module.exports = { WorkflowAgent };