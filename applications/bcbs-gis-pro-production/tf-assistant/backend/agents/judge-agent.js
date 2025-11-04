const fs = require('fs');
const path = require('path');
const { askLLM } = require('../lib/ai-client');

class JudgeAgent {
  constructor() {
    this.ready = true;
    this.complianceRules = this.loadComplianceRules();
    this.validationTemplates = this.loadValidationTemplates();
  }

  loadComplianceRules() {
    return {
      washington_state: {
        parcel_format: /^\d{7}-\d{3}-\d{3}$/,
        legal_description_required: true,
        surveyor_license_required: true,
        environmental_review_thresholds: ['wetlands', 'critical_areas', 'shoreline']
      },
      benton_county: {
        minimum_lot_sizes: {
          urban: 0.25, // acres
          rural_residential: 5.0,
          agricultural: 20.0
        },
        zoning_districts: [
          'R-1', 'R-2', 'R-3', 'C-1', 'C-2', 'I-1', 'I-2', 'AG', 'RR'
        ],
        taxing_authorities: [
          'Benton County', 'Kennewick', 'Richland', 'West Richland', 
          'Prosser', 'Benton City', 'School Districts', 'Fire Districts'
        ]
      },
      assessment_standards: {
        appraisal_date: 'January 1',
        revaluation_cycle: 6, // years
        current_use_eligibility: {
          agricultural: { minimum_acres: 20, minimum_income: 1500 },
          forestry: { minimum_acres: 20, management_plan_required: true }
        }
      }
    };
  }

  loadValidationTemplates() {
    try {
      const templatePath = path.join(__dirname, '../../prompts/judge_agent.json');
      if (fs.existsSync(templatePath)) {
        return JSON.parse(fs.readFileSync(templatePath, 'utf8'));
      }
    } catch (error) {
      console.warn('Judge validation templates not found, using defaults');
    }

    return {
      workflow_validation: {
        system: "You are a compliance validation specialist for Benton County, Washington. Validate workflows against state and local regulations.",
        template: "Validate the following workflow result for compliance with Washington State RCW, WAC, and Benton County regulations: {workflowResult}"
      },
      sm00_validation: {
        system: "Validate SM00 reports for accuracy, completeness, and compliance with Washington State assessment standards.",
        template: "Validate SM00 report: {sm00Data}. Check parcel format, legal description accuracy, ownership verification, and assessment compliance."
      },
      bla_validation: {
        system: "Validate Boundary Line Adjustment operations for compliance with Benton County planning requirements and state regulations.",
        template: "Validate BLA operation: {blaResult}. Verify no net parcel increase, minimum lot size compliance, setback requirements, and environmental considerations."
      }
    };
  }

  async validateWorkflow(workflowResult) {
    try {
      const template = this.validationTemplates.workflow_validation;
      const prompt = template.template.replace('{workflowResult}', JSON.stringify(workflowResult));

      const validationAnalysis = await askLLM(`${template.system}\n\n${prompt}`, {
        context: { agent: 'judge', validationType: 'workflow' },
        useRAG: true
      });

      const compliance = this.analyzeCompliance(workflowResult, validationAnalysis);
      const issues = this.identifyIssues(workflowResult, validationAnalysis);

      const validationResult = {
        validationId: this.generateValidationId(),
        workflowId: workflowResult.taskId,
        isValid: issues.length === 0,
        complianceScore: compliance.score,
        analysis: validationAnalysis,
        compliance,
        issues,
        recommendations: await this.generateComplianceRecommendations(issues),
        validatedAt: new Date().toISOString(),
        validatedBy: 'JudgeAgent'
      };

      this.logValidation(validationResult);
      return validationResult;

    } catch (error) {
      console.error('Workflow validation error:', error);
      return {
        validationId: this.generateValidationId(),
        workflowId: workflowResult.taskId,
        isValid: false,
        error: error.message,
        validatedAt: new Date().toISOString()
      };
    }
  }

  async validateSM00(sm00Data) {
    try {
      const template = this.validationTemplates.sm00_validation;
      const prompt = template.template.replace('{sm00Data}', JSON.stringify(sm00Data));

      const validationAnalysis = await askLLM(`${template.system}\n\n${prompt}`, {
        context: { agent: 'judge', validationType: 'SM00' },
        useRAG: true
      });

      const issues = [];
      
      // Validate parcel number format
      if (!this.complianceRules.washington_state.parcel_format.test(sm00Data.parcelNumber)) {
        issues.push({
          severity: 'high',
          category: 'format',
          description: 'Parcel number does not match Washington State format (XXXXXXX-XXX-XXX)',
          field: 'parcelNumber'
        });
      }

      // Validate required fields
      const requiredFields = ['parcelNumber', 'ownerName', 'legalDescription'];
      requiredFields.forEach(field => {
        if (!sm00Data[field] || sm00Data[field].trim() === '') {
          issues.push({
            severity: 'high',
            category: 'missing_data',
            description: `Required field '${field}' is missing or empty`,
            field
          });
        }
      });

      // Validate legal description format
      if (sm00Data.legalDescription && !this.validateLegalDescription(sm00Data.legalDescription)) {
        issues.push({
          severity: 'medium',
          category: 'legal_description',
          description: 'Legal description format may not comply with Washington State standards',
          field: 'legalDescription'
        });
      }

      return {
        validationId: this.generateValidationId(),
        reportId: sm00Data.reportId,
        isValid: issues.length === 0,
        analysis: validationAnalysis,
        issues,
        checklist: this.generateSM00Checklist(sm00Data),
        validatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('SM00 validation error:', error);
      throw new Error('Failed to validate SM00 report');
    }
  }

  async validateBLA(blaResult) {
    try {
      const template = this.validationTemplates.bla_validation;
      const prompt = template.template.replace('{blaResult}', JSON.stringify(blaResult));

      const validationAnalysis = await askLLM(`${template.system}\n\n${prompt}`, {
        context: { agent: 'judge', validationType: 'BLA' },
        useRAG: true
      });

      const issues = [];

      // Validate no net parcel increase
      const sourceParcelCount = blaResult.sourceParcels.length;
      const targetParcelCount = blaResult.targetConfiguration.parcels ? blaResult.targetConfiguration.parcels.length : sourceParcelCount;
      
      if (targetParcelCount > sourceParcelCount) {
        issues.push({
          severity: 'high',
          category: 'parcel_count',
          description: 'BLA cannot result in net increase of parcels',
          detail: `Source: ${sourceParcelCount}, Target: ${targetParcelCount}`
        });
      }

      // Validate minimum lot sizes
      if (blaResult.targetConfiguration.parcels) {
        blaResult.targetConfiguration.parcels.forEach((parcel /* , index */) => {
          const minSize = this.getMinimumLotSize(parcel.zoning);
          if (parcel.acreage < minSize) {
            issues.push({
              severity: 'high',
              category: 'lot_size',
              description: `Parcel ${index + 1} below minimum size for ${parcel.zoning} zoning`,
              detail: `Size: ${parcel.acreage} acres, Minimum: ${minSize} acres`
            });
          }
        });
      }

      // Validate survey requirement
      if (!blaResult.requirements.includes('Licensed surveyor boundary survey')) {
        issues.push({
          severity: 'medium',
          category: 'survey',
          description: 'Licensed surveyor boundary survey required for BLA',
          requirement: 'survey_required'
        });
      }

      return {
        validationId: this.generateValidationId(),
        operationId: blaResult.operationId,
        isValid: issues.length === 0,
        analysis: validationAnalysis,
        issues,
        requirements: this.generateBLARequirements(blaResult),
        validatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('BLA validation error:', error);
      throw new Error('Failed to validate BLA operation');
    }
  }

  analyzeCompliance(workflowResult, validationAnalysis) {
    let score = 100;
    const factors = [];

    // Deduct points for missing required information
    if (!workflowResult.parcelData || Object.keys(workflowResult.parcelData).length < 3) {
      score -= 20;
      factors.push('Insufficient parcel data');
    }

    // Deduct points for validation concerns mentioned in analysis
    if (validationAnalysis.toLowerCase().includes('concern') || validationAnalysis.toLowerCase().includes('issue')) {
      score -= 15;
      factors.push('Validation concerns identified');
    }

    // Deduct points for missing legal description
    if (workflowResult.parcelData && !workflowResult.parcelData.legalDescription) {
      score -= 25;
      factors.push('Legal description missing');
    }

    return {
      score: Math.max(0, score),
      grade: this.scoreToGrade(score),
      factors
    };
  }

  identifyIssues(workflowResult, validationAnalysis) {
    const issues = [];

    // Parse validation analysis for issues
    if (validationAnalysis.toLowerCase().includes('non-compliant') || 
        validationAnalysis.toLowerCase().includes('violation')) {
      issues.push({
        severity: 'high',
        category: 'compliance',
        description: 'Potential compliance violation identified in analysis'
      });
    }

    if (validationAnalysis.toLowerCase().includes('incomplete') ||
        validationAnalysis.toLowerCase().includes('missing')) {
      issues.push({
        severity: 'medium',
        category: 'completeness',
        description: 'Incomplete information detected'
      });
    }

    return issues;
  }

  async generateComplianceRecommendations(issues) {
    const recommendations = [];

    issues.forEach(issue => {
      switch (issue.category) {
        case 'format':
          recommendations.push({
            priority: 'high',
            action: 'Correct Format',
            description: 'Update to comply with Washington State formatting standards'
          });
          break;
        case 'missing_data':
          recommendations.push({
            priority: 'high',
            action: 'Complete Information',
            description: 'Gather and input all required field data'
          });
          break;
        case 'legal_description':
          recommendations.push({
            priority: 'medium',
            action: 'Verify Legal Description',
            description: 'Confirm legal description with county records or surveyor'
          });
          break;
        case 'survey':
          recommendations.push({
            priority: 'high',
            action: 'Obtain Survey',
            description: 'Engage licensed Washington State surveyor for boundary survey'
          });
          break;
      }
    });

    return recommendations;
  }

  validateLegalDescription(legalDescription) {
    // Basic validation for Washington State legal description format
    const patterns = [
      /Township \d+[NS], Range \d+[EW]/i,
      /Section \d+/i,
      /Quarter/i
    ];

    return patterns.some(pattern => pattern.test(legalDescription));
  }

  getMinimumLotSize(zoning) {
    const minimums = this.complianceRules.benton_county.minimum_lot_sizes;
    
    switch (zoning) {
      case 'R-1':
      case 'R-2':
      case 'R-3':
        return minimums.urban;
      case 'RR':
        return minimums.rural_residential;
      case 'AG':
        return minimums.agricultural;
      default:
        return minimums.urban;
    }
  }

  generateSM00Checklist(sm00Data) {
    return [
      {
        item: 'Parcel number format',
        status: this.complianceRules.washington_state.parcel_format.test(sm00Data.parcelNumber) ? 'pass' : 'fail'
      },
      {
        item: 'Owner name present',
        status: sm00Data.ownerName && sm00Data.ownerName.trim() ? 'pass' : 'fail'
      },
      {
        item: 'Legal description complete',
        status: sm00Data.legalDescription && sm00Data.legalDescription.length > 20 ? 'pass' : 'fail'
      },
      {
        item: 'County specified',
        status: sm00Data.county === 'Benton County, Washington' ? 'pass' : 'fail'
      }
    ];
  }

  generateBLARequirements(blaResult) {
    const baseRequirements = [
      'Licensed surveyor boundary survey',
      'Updated legal descriptions for all affected parcels',
      'Zoning compliance verification',
      'Setback requirement analysis',
      'Utility easement review'
    ];

    // Add conditional requirements
    if (blaResult.operation === 'split') {
      baseRequirements.push('Access verification for all resulting parcels');
    }

    if (blaResult.sourceParcels.some(p => p.zoning === 'AG')) {
      baseRequirements.push('Agricultural land current use assessment review');
    }

    return baseRequirements;
  }

  scoreToGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  generateValidationId() {
    return 'VAL-' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  logValidation(validationResult) {
    const logEntry = {
      type: 'VALIDATION',
      validationId: validationResult.validationId,
      isValid: validationResult.isValid,
      complianceScore: validationResult.complianceScore?.score,
      issueCount: validationResult.issues?.length || 0,
      timestamp: validationResult.validatedAt
    };

    fs.appendFileSync(
      path.join(__dirname, '../../logs/validation-audit.log'),
      JSON.stringify(logEntry) + '\n'
    );
  }

  isReady() {
    return this.ready;
  }
}

module.exports = { JudgeAgent };