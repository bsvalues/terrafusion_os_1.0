/**
 * Agent Development Assistant
 *
 * This service leverages the existing agent system to help with application development.
 * It provides a bridge between our MCP agent system and the development process,
 * allowing agents to suggest code improvements, identify issues, and help generate
 * new features based on their specialized domains.
 */

import { IStorage } from '../../storage';
import { logger } from '../../utils/logger';
import { AgentSystem } from '../agent-system';
import { LLMService } from '../llm-service';
import { BaseAgent } from '../agents/base-agent';
import fs from 'fs/promises';
import path from 'path';

export enum ImprovementType {
  FEATURE_SUGGESTION = 'feature_suggestion',
  CODE_IMPROVEMENT = 'code_improvement',
  BUG_FIX = 'bug_fix',
  PERFORMANCE_OPTIMIZATION = 'performance_optimization',
  ARCHITECTURE_RECOMMENDATION = 'architecture_recommendation',
  DATA_MODEL_ENHANCEMENT = 'data_model_enhancement',
}

export interface CodeImprovement {
  id: string;
  type: ImprovementType;
  title: string;
  description: string;
  affectedFiles?: string[];
  suggestedChanges?: {
    file: string;
    oldCode?: string;
    newCode?: string;
    explanation: string;
  }[];
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'approved' | 'rejected' | 'implemented';
  agentId: string | number;
  agentName: string;
  createdAt: Date;
  updatedAt: Date;
}

export class AgentDevAssistant {
  private llmService: LLMService;

  constructor(
    private storage: IStorage,
    private agentSystem: AgentSystem
  ) {
    this.llmService = new LLMService({
      defaultProvider: 'openai',
      openaiApiKey: process.env.OPENAI_API_KEY,
      defaultModels: {
        openai: 'gpt-4o',
        anthropic: 'claude-3-opus-20240229',
      },
    });
  }

  /**
   * Initialize the development assistant
   */
  public async initialize(): Promise<void> {
    logger.info('Initializing Agent Development Assistant...');

    // Register our custom development capabilities with each agent
    const agents = this.agentSystem.getAllAgents();
    for (const [name, agent] of agents) {
      await this.enhanceAgentWithDevCapabilities(name, agent);
    }

    logger.info('Agent Development Assistant initialized successfully');
  }

  /**
   * Enhance an agent with development-related capabilities
   */
  private async enhanceAgentWithDevCapabilities(
    agentName: string,
    agent: BaseAgent
  ): Promise<void> {
    logger.info(`Enhancing ${agentName} with development capabilities...`);

    // Add specialized development capabilities based on agent type
    switch (agentName) {
      case 'property_assessment':
        await this.enhancePropertyAssessmentAgent(agent);
        break;
      case 'data_ingestion':
        await this.enhanceDataIngestionAgent(agent);
        break;
      case 'market_analysis':
        await this.enhanceMarketAnalysisAgent(agent);
        break;
      case 'spatial_gis':
        await this.enhanceSpatialGISAgent(agent);
        break;
      case 'compliance':
        await this.enhanceComplianceAgent(agent);
        break;
      case 'reporting':
        await this.enhanceReportingAgent(agent);
        break;
      default:
        // Add generic development capabilities
        await this.addGenericDevCapabilities(agent);
    }
  }

  /**
   * Enhance Property Assessment Agent with development capabilities
   */
  private async enhancePropertyAssessmentAgent(agent: BaseAgent): Promise<void> {
    // Add property assessment specific development capabilities
    agent.addDevelopmentCapability({
      name: 'improvePropertyValuationLogic',
      description: 'Analyze and suggest improvements to property valuation algorithms',
      parameters: {},
      handler: async () => {
        return await this.generatePropertyValuationImprovements();
      },
    });

    agent.addDevelopmentCapability({
      name: 'suggestComparableAlgorithmEnhancements',
      description: 'Suggest enhancements to the comparable property selection algorithm',
      parameters: {},
      handler: async () => {
        return await this.generateComparableAlgorithmImprovements();
      },
    });

    // Add generic development capabilities
    await this.addGenericDevCapabilities(agent);
  }

  /**
   * Enhance Data Ingestion Agent with development capabilities
   */
  private async enhanceDataIngestionAgent(agent: BaseAgent): Promise<void> {
    // Add data ingestion specific development capabilities
    agent.addDevelopmentCapability({
      name: 'improveDataValidation',
      description: 'Analyze and suggest improvements to data validation rules',
      parameters: {},
      handler: async () => {
        return await this.generateDataValidationImprovements();
      },
    });

    agent.addDevelopmentCapability({
      name: 'enhanceDataLineageTracking',
      description: 'Suggest enhancements to data lineage tracking system',
      parameters: {},
      handler: async () => {
        return await this.generateLineageTrackingImprovements();
      },
    });

    // Add generic development capabilities
    await this.addGenericDevCapabilities(agent);
  }

  /**
   * Enhance Market Analysis Agent with development capabilities
   */
  private async enhanceMarketAnalysisAgent(agent: BaseAgent): Promise<void> {
    // Add market analysis specific development capabilities
    agent.addDevelopmentCapability({
      name: 'improveTrendDetection',
      description: 'Analyze and suggest improvements to market trend detection algorithms',
      parameters: {},
      handler: async () => {
        return await this.generateTrendDetectionImprovements();
      },
    });

    // Add generic development capabilities
    await this.addGenericDevCapabilities(agent);
  }

  /**
   * Enhance Spatial GIS Agent with development capabilities
   */
  private async enhanceSpatialGISAgent(agent: BaseAgent): Promise<void> {
    // Add spatial GIS specific development capabilities
    agent.addDevelopmentCapability({
      name: 'improveSpatialQueries',
      description: 'Analyze and suggest improvements to spatial query performance',
      parameters: {},
      handler: async () => {
        return await this.generateSpatialQueryImprovements();
      },
    });

    // Add generic development capabilities
    await this.addGenericDevCapabilities(agent);
  }

  /**
   * Enhance Compliance Agent with development capabilities
   */
  private async enhanceComplianceAgent(agent: BaseAgent): Promise<void> {
    // Add compliance specific development capabilities
    agent.addDevelopmentCapability({
      name: 'improveRegulatoryChecks',
      description: 'Analyze and suggest improvements to regulatory compliance checks',
      parameters: {},
      handler: async () => {
        return await this.generateComplianceCheckImprovements();
      },
    });

    // Add generic development capabilities
    await this.addGenericDevCapabilities(agent);
  }

  /**
   * Enhance Reporting Agent with development capabilities
   */
  private async enhanceReportingAgent(agent: BaseAgent): Promise<void> {
    // Add reporting specific development capabilities
    agent.addDevelopmentCapability({
      name: 'improveReportGeneration',
      description: 'Analyze and suggest improvements to report generation',
      parameters: {},
      handler: async () => {
        return await this.generateReportImprovements();
      },
    });

    // Add generic development capabilities
    await this.addGenericDevCapabilities(agent);
  }

  /**
   * Add generic development capabilities to any agent
   */
  private async addGenericDevCapabilities(agent: BaseAgent): Promise<void> {
    agent.addDevelopmentCapability({
      name: 'analyzeCode',
      description: 'Analyze a specific file or component and suggest improvements',
      parameters: {
        filePath: 'string',
        focus: 'string?',
      },
      handler: async params => {
        return await this.analyzeCode(params.filePath, params.focus);
      },
    });

    agent.addDevelopmentCapability({
      name: 'suggestNewFeature',
      description: 'Suggest a new feature for the application',
      parameters: {
        area: 'string', // The area of the application to focus on
        description: 'string?',
      },
      handler: async params => {
        return await this.suggestNewFeature(params.area, params.description);
      },
    });
  }

  /**
   * Use the Property Assessment Agent to generate improvements for property valuation logic
   */
  private async generatePropertyValuationImprovements(): Promise<CodeImprovement> {
    logger.info('Generating property valuation improvements...');

    // Analyze current property valuation code
    const filesToAnalyze = [
      'server/services/agents/property-assessment-agent.ts',
      'server/services/property/property-valuation-service.ts',
    ];

    return await this.generateCodeImprovement(
      ImprovementType.CODE_IMPROVEMENT,
      'Property Valuation Algorithm Enhancements',
      'Improve property valuation accuracy by enhancing current algorithms',
      'property_assessment',
      filesToAnalyze
    );
  }

  /**
   * Use the Property Assessment Agent to generate improvements for comparable property algorithm
   */
  private async generateComparableAlgorithmImprovements(): Promise<CodeImprovement> {
    logger.info('Generating comparable property algorithm improvements...');

    // Analyze current comparable property algorithm code
    const filesToAnalyze = [
      'server/services/agents/property-assessment-agent.ts',
      'server/services/property/comparable-property-service.ts',
    ];

    return await this.generateCodeImprovement(
      ImprovementType.CODE_IMPROVEMENT,
      'Comparable Property Algorithm Enhancements',
      'Improve comparable property selection accuracy and relevance',
      'property_assessment',
      filesToAnalyze
    );
  }

  /**
   * Use the Data Ingestion Agent to generate improvements for data validation
   */
  private async generateDataValidationImprovements(): Promise<CodeImprovement> {
    logger.info('Generating data validation improvements...');

    // Analyze current data validation code
    const filesToAnalyze = [
      'server/services/data-quality/data-lineage-tracker.ts',
      'server/services/data-quality/validation-engine.ts',
    ];

    return await this.generateCodeImprovement(
      ImprovementType.CODE_IMPROVEMENT,
      'Data Validation Logic Enhancements',
      'Improve data validation rules and error handling',
      'data_ingestion',
      filesToAnalyze
    );
  }

  /**
   * Use the Data Ingestion Agent to generate improvements for lineage tracking
   */
  private async generateLineageTrackingImprovements(): Promise<CodeImprovement> {
    logger.info('Generating lineage tracking improvements...');

    // Analyze current lineage tracking code
    const filesToAnalyze = [
      'server/services/data-quality/data-lineage-tracker.ts',
      'client/src/components/data-lineage/LineageTimeline.tsx',
      'client/src/pages/PropertyLineagePage.tsx',
    ];

    return await this.generateCodeImprovement(
      ImprovementType.FEATURE_SUGGESTION,
      'Enhanced Data Lineage Tracking',
      'Improve data lineage visualization and filtering capabilities',
      'data_ingestion',
      filesToAnalyze
    );
  }

  /**
   * Use the Market Analysis Agent to generate improvements for trend detection
   */
  private async generateTrendDetectionImprovements(): Promise<CodeImprovement> {
    logger.info('Generating trend detection improvements...');

    // Analyze current trend detection code
    const filesToAnalyze = [
      'server/services/agents/market-analysis-agent.ts',
      'server/services/market/trend-detection-service.ts',
    ];

    return await this.generateCodeImprovement(
      ImprovementType.CODE_IMPROVEMENT,
      'Market Trend Detection Enhancements',
      'Improve market trend detection accuracy and performance',
      'market_analysis',
      filesToAnalyze
    );
  }

  /**
   * Use the Spatial GIS Agent to generate improvements for spatial queries
   */
  private async generateSpatialQueryImprovements(): Promise<CodeImprovement> {
    logger.info('Generating spatial query improvements...');

    // Analyze current spatial query code
    const filesToAnalyze = [
      'server/services/agents/spatial-gis-agent.ts',
      'server/services/gis/arcgis-service.ts',
    ];

    return await this.generateCodeImprovement(
      ImprovementType.PERFORMANCE_OPTIMIZATION,
      'Spatial Query Performance Optimization',
      'Optimize spatial query performance for faster property lookups',
      'spatial_gis',
      filesToAnalyze
    );
  }

  /**
   * Use the Compliance Agent to generate improvements for compliance checks
   */
  private async generateComplianceCheckImprovements(): Promise<CodeImprovement> {
    logger.info('Generating compliance check improvements...');

    // Analyze current compliance check code
    const filesToAnalyze = [
      'server/services/agents/compliance-agent.ts',
      'server/services/compliance/wa-compliance-reporter.ts',
    ];

    return await this.generateCodeImprovement(
      ImprovementType.CODE_IMPROVEMENT,
      'Regulatory Compliance Check Enhancements',
      'Improve regulatory compliance checks for Washington State property tax laws',
      'compliance',
      filesToAnalyze
    );
  }

  /**
   * Use the Reporting Agent to generate improvements for report generation
   */
  private async generateReportImprovements(): Promise<CodeImprovement> {
    logger.info('Generating report improvements...');

    // Analyze current report generation code
    const filesToAnalyze = [
      'server/services/agents/reporting-agent.ts',
      'server/services/reporting/report-generator.ts',
    ];

    return await this.generateCodeImprovement(
      ImprovementType.FEATURE_SUGGESTION,
      'Enhanced Report Generation',
      'Improve report generation with better visualizations and export options',
      'reporting',
      filesToAnalyze
    );
  }

  /**
   * Analyze specific code and suggest improvements
   */
  private async analyzeCode(filePath: string, focus?: string): Promise<CodeImprovement> {
    logger.info(`Analyzing code in ${filePath}...`);

    const fileContent = await this.readFileContent(filePath);
    if (!fileContent) {
      throw new Error(`File ${filePath} not found or cannot be read`);
    }

    // Determine the agent that should handle this analysis based on file content
    const agentName = this.determineAgentForFile(filePath, fileContent);

    return await this.generateCodeImprovement(
      ImprovementType.CODE_IMPROVEMENT,
      `Code Improvements for ${path.basename(filePath)}`,
      `Analysis and improvements for ${filePath} focusing on ${focus || 'general improvements'}`,
      agentName,
      [filePath],
      focus
    );
  }

  /**
   * Suggest a new feature for the application
   */
  private async suggestNewFeature(area: string, description?: string): Promise<CodeImprovement> {
    logger.info(`Suggesting new feature for ${area}...`);

    // Determine the agent that should handle this feature suggestion based on area
    const agentName = this.determineAgentForArea(area);

    return await this.generateCodeImprovement(
      ImprovementType.FEATURE_SUGGESTION,
      `New Feature Suggestion for ${area}`,
      description || `Suggestion for new functionality in the ${area} area`,
      agentName,
      [] // No specific files to analyze yet
    );
  }

  /**
   * Generate a code improvement using the LLM service
   */
  private async generateCodeImprovement(
    type: ImprovementType,
    title: string,
    description: string,
    agentName: string,
    filesToAnalyze: string[],
    focus?: string
  ): Promise<CodeImprovement> {
    // Read the content of all files to analyze
    const fileContents: Record<string, string> = {};
    for (const file of filesToAnalyze) {
      const content = await this.readFileContent(file);
      if (content) {
        fileContents[file] = content;
      }
    }

    // Generate an improvement using the LLM service
    const prompt = this.generateImprovementPrompt(type, title, description, fileContents, focus);

    const response = await this.llmService.prompt(prompt, {
      max_tokens: 2000,
      temperature: 0.7,
    });

    // Parse the LLM response to extract suggested changes
    const suggestedChanges = this.parseLLMResponseForChanges(response.content, filesToAnalyze);

    // Create the code improvement object
    const improvement: CodeImprovement = {
      id: this.generateUniqueId(),
      type,
      title,
      description,
      affectedFiles: filesToAnalyze,
      suggestedChanges,
      priority: 'medium',
      status: 'pending',
      agentId: agentName,
      agentName: this.getAgentReadableName(agentName),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Store the improvement in the database
    await this.storeImprovement(improvement);

    return improvement;
  }

  /**
   * Generate a prompt for the LLM to suggest code improvements
   */
  private generateImprovementPrompt(
    type: ImprovementType,
    title: string,
    description: string,
    fileContents: Record<string, string>,
    focus?: string
  ): string {
    let prompt = `You are an expert software architect and developer tasked with improving a property assessment platform.
    
Task: ${title}
Type: ${type}
Description: ${description}
${focus ? `Focus: ${focus}` : ''}

The platform is built on TypeScript with React frontend and Express backend. It employs an agent-based architecture for property assessment, market analysis, and data management.

Below are relevant code files to analyze:

`;

    // Add file contents to the prompt
    for (const [file, content] of Object.entries(fileContents)) {
      prompt += `\n### ${file}\n\`\`\`typescript\n${content}\n\`\`\`\n`;
    }

    // Add specific instructions based on improvement type
    switch (type) {
      case ImprovementType.FEATURE_SUGGESTION:
        prompt += `
Please suggest a new feature that would enhance this part of the system. Include:
1. Feature description
2. Implementation approach
3. Specific file changes (with before/after code examples)
4. Benefits of this feature
`;
        break;
      case ImprovementType.CODE_IMPROVEMENT:
        prompt += `
Please analyze the code and suggest improvements that enhance:
1. Code quality
2. Maintainability
3. Error handling
4. Type safety

Provide specific file changes with before/after code examples.
`;
        break;
      case ImprovementType.PERFORMANCE_OPTIMIZATION:
        prompt += `
Please analyze the code for performance bottlenecks and suggest optimizations:
1. Identify performance issues
2. Suggest specific optimizations
3. Provide before/after code examples
4. Explain the expected performance improvement
`;
        break;
    }

    // Final format instructions
    prompt += `
Format your response as follows:

ANALYSIS:
(Provide a brief analysis of the current code)

SUGGESTED CHANGES:
For each file that needs changes, use this format:
---
FILE: filename.ts
BEFORE:
\`\`\`typescript
// The specific code section to change
\`\`\`
AFTER:
\`\`\`typescript
// The improved code
\`\`\`
EXPLANATION:
Why this change is needed and how it improves the code
---
`;

    return prompt;
  }

  /**
   * Parse LLM response to extract suggested code changes
   */
  private parseLLMResponseForChanges(
    llmResponse: string,
    affectedFiles: string[]
  ): { file: string; oldCode?: string; newCode?: string; explanation: string }[] {
    const changes: { file: string; oldCode?: string; newCode?: string; explanation: string }[] = [];

    // Simple regex-based parsing for file changes
    const fileChangeRegex =
      /FILE: ([^\n]+)\s+BEFORE:\s+```(?:typescript|js)?\s+([\s\S]+?)```\s+AFTER:\s+```(?:typescript|js)?\s+([\s\S]+?)```\s+EXPLANATION:\s+([\s\S]+?)(?=---|$)/g;

    let match;
    while ((match = fileChangeRegex.exec(llmResponse)) !== null) {
      const file = match[1].trim();
      const oldCode = match[2].trim();
      const newCode = match[3].trim();
      const explanation = match[4].trim();

      changes.push({
        file,
        oldCode,
        newCode,
        explanation,
      });
    }

    // If no matches found but we have affected files, create a general suggestion
    if (changes.length === 0 && affectedFiles.length > 0) {
      // Extract any explanation from the response
      const explanation = llmResponse.replace(/ANALYSIS:[\s\S]+?SUGGESTED CHANGES:/g, '').trim();

      changes.push({
        file: affectedFiles[0],
        explanation: explanation || 'General code improvements suggested',
      });
    }

    return changes;
  }

  /**
   * Determine which agent should handle a file based on its content
   */
  private determineAgentForFile(filePath: string, fileContent: string): string {
    // Check file path first
    if (filePath.includes('property-assessment')) return 'property_assessment';
    if (filePath.includes('market-analysis')) return 'market_analysis';
    if (filePath.includes('data-quality') || filePath.includes('validation'))
      return 'data_ingestion';
    if (filePath.includes('spatial') || filePath.includes('gis')) return 'spatial_gis';
    if (filePath.includes('compliance')) return 'compliance';
    if (filePath.includes('reporting')) return 'reporting';

    // Check file content as a backup
    if (
      fileContent.includes('property') &&
      (fileContent.includes('valuation') || fileContent.includes('assessment'))
    ) {
      return 'property_assessment';
    }
    if (
      fileContent.includes('market') &&
      (fileContent.includes('trend') || fileContent.includes('analysis'))
    ) {
      return 'market_analysis';
    }
    if (
      fileContent.includes('data') &&
      (fileContent.includes('quality') || fileContent.includes('validation'))
    ) {
      return 'data_ingestion';
    }

    // Default to property assessment agent
    return 'property_assessment';
  }

  /**
   * Determine which agent should handle a feature suggestion based on area
   */
  private determineAgentForArea(area: string): string {
    area = area.toLowerCase();

    if (area.includes('property') || area.includes('valuation') || area.includes('assessment')) {
      return 'property_assessment';
    }
    if (area.includes('market') || area.includes('trend') || area.includes('analysis')) {
      return 'market_analysis';
    }
    if (
      area.includes('data') ||
      area.includes('quality') ||
      area.includes('validation') ||
      area.includes('lineage')
    ) {
      return 'data_ingestion';
    }
    if (area.includes('spatial') || area.includes('gis') || area.includes('map')) {
      return 'spatial_gis';
    }
    if (area.includes('compliance') || area.includes('regulation') || area.includes('law')) {
      return 'compliance';
    }
    if (area.includes('report') || area.includes('dashboard') || area.includes('visualization')) {
      return 'reporting';
    }

    // Default to property assessment agent
    return 'property_assessment';
  }

  /**
   * Get a human-readable name for an agent
   */
  private getAgentReadableName(agentName: string): string {
    const nameMap: Record<string, string> = {
      property_assessment: 'Property Assessment Agent',
      data_ingestion: 'Data Ingestion Agent',
      market_analysis: 'Market Analysis Agent',
      spatial_gis: 'Spatial GIS Agent',
      compliance: 'Compliance Agent',
      reporting: 'Reporting Agent',
      ftp_data: 'FTP Data Agent',
    };

    return nameMap[agentName] || agentName;
  }

  /**
   * Generate a unique ID for a code improvement
   */
  private generateUniqueId(): string {
    return `ci_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  }

  /**
   * Read file content from disk
   */
  private async readFileContent(filePath: string): Promise<string | null> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      logger.error(`Error reading file ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Store a code improvement in the database
   */
  private async storeImprovement(improvement: CodeImprovement): Promise<void> {
    try {
      // Convert to a format the storage interface can handle
      await this.storage.createCodeImprovement({
        ...improvement,
        suggestedChanges: JSON.stringify(improvement.suggestedChanges),
        affectedFiles: JSON.stringify(improvement.affectedFiles),
      });

      logger.info(`Stored code improvement: ${improvement.id}`);
    } catch (error) {
      logger.error('Error storing code improvement:', error);
    }
  }

  /**
   * Get all improvement suggestions
   */
  public async getAllImprovements(): Promise<CodeImprovement[]> {
    try {
      const improvements = await this.storage.getCodeImprovements();

      // Convert from storage format to our interface
      return improvements.map(imp => ({
        ...imp,
        suggestedChanges:
          typeof imp.suggestedChanges === 'string'
            ? JSON.parse(imp.suggestedChanges)
            : imp.suggestedChanges,
        affectedFiles:
          typeof imp.affectedFiles === 'string' ? JSON.parse(imp.affectedFiles) : imp.affectedFiles,
      }));
    } catch (error) {
      logger.error('Error getting code improvements:', error);
      return [];
    }
  }

  /**
   * Get improvements by agent
   */
  public async getImprovementsByAgent(agentId: string): Promise<CodeImprovement[]> {
    try {
      const improvements = await this.storage.getCodeImprovementsByAgent(agentId);

      // Convert from storage format to our interface
      return improvements.map(imp => ({
        ...imp,
        suggestedChanges:
          typeof imp.suggestedChanges === 'string'
            ? JSON.parse(imp.suggestedChanges)
            : imp.suggestedChanges,
        affectedFiles:
          typeof imp.affectedFiles === 'string' ? JSON.parse(imp.affectedFiles) : imp.affectedFiles,
      }));
    } catch (error) {
      logger.error(`Error getting code improvements for agent ${agentId}:`, error);
      return [];
    }
  }

  /**
   * Apply a code improvement suggestion
   */
  public async applyImprovement(improvementId: string): Promise<boolean> {
    try {
      // Get the improvement
      const improvements = await this.storage.getCodeImprovements();
      const improvement = improvements.find(imp => imp.id === improvementId);

      if (!improvement) {
        logger.error(`Improvement with ID ${improvementId} not found`);
        return false;
      }

      // Parse the suggested changes
      const suggestedChanges =
        typeof improvement.suggestedChanges === 'string'
          ? JSON.parse(improvement.suggestedChanges)
          : improvement.suggestedChanges;

      // Apply each suggested change
      for (const change of suggestedChanges) {
        if (!change.file || !change.oldCode || !change.newCode) {
          logger.warn(`Skipping incomplete change for ${change.file}`);
          continue;
        }

        try {
          // Read the current file content
          const filePath = change.file;
          const currentContent = await fs.readFile(filePath, 'utf-8');

          // Replace the old code with the new code
          const updatedContent = currentContent.replace(change.oldCode, change.newCode);

          // Write the updated content back to the file
          await fs.writeFile(filePath, updatedContent, 'utf-8');

          logger.info(`Applied change to ${filePath}`);
        } catch (error) {
          logger.error(`Error applying change to ${change.file}:`, error);
        }
      }

      // Update the improvement status
      await this.storage.updateCodeImprovementStatus(improvementId, 'implemented');

      return true;
    } catch (error) {
      logger.error(`Error applying improvement ${improvementId}:`, error);
      return false;
    }
  }

  /**
   * Update improvement status
   */
  public async updateImprovementStatus(
    improvementId: string,
    status: 'pending' | 'approved' | 'rejected' | 'implemented'
  ): Promise<boolean> {
    try {
      await this.storage.updateCodeImprovementStatus(improvementId, status);
      return true;
    } catch (error) {
      logger.error(`Error updating improvement status ${improvementId}:`, error);
      return false;
    }
  }
}
