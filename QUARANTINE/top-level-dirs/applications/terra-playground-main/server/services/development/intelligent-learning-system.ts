/**
 * Intelligent Learning System
 *
 * Provides continuous learning and improvement for assessment models:
 * - Model knowledge repository
 * - Learning from past assessment patterns
 * - Best practice recommendations
 * - Continuous improvement suggestions
 */

import { IStorage } from '../../storage';
import { AIAssistantService } from '../ai-assistant-service';
import { ModelComponent, ModelCalculation, AssessmentModel } from '@shared/schema';

// Type definitions for intelligent learning system
export type KnowledgeItem = {
  id: number;
  title: string;
  description: string;
  category:
    | 'component_pattern'
    | 'calculation_pattern'
    | 'validation_pattern'
    | 'best_practice'
    | 'lesson_learned';
  modelType?: string;
  code?: string;
  formula?: string;
  usageCount: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type BestPractice = {
  id: number;
  title: string;
  description: string;
  category:
    | 'code_quality'
    | 'performance'
    | 'accuracy'
    | 'error_handling'
    | 'security'
    | 'maintainability';
  modelType?: string;
  applicableEntityTypes: (
    | 'component'
    | 'calculation'
    | 'variable'
    | 'validation_rule'
    | 'test_case'
  )[];
  example?: string;
  counterExample?: string;
  importance: 'high' | 'medium' | 'low';
  source: 'system' | 'extracted' | 'user';
  createdAt: string;
  updatedAt: string;
};

export type ContinuousImprovementSuggestion = {
  id: number;
  title: string;
  description: string;
  modelId: string;
  targetEntityType:
    | 'model'
    | 'component'
    | 'calculation'
    | 'variable'
    | 'validation_rule'
    | 'test_case';
  targetEntityId?: number;
  improvementType:
    | 'performance'
    | 'readability'
    | 'accuracy'
    | 'maintainability'
    | 'consistency'
    | 'error_handling';
  suggestion: string;
  confidence: number;
  implemented: boolean;
  createdAt: string;
};

export type LearningPattern = {
  id: number;
  patternType: 'component' | 'calculation' | 'validation' | 'workflow';
  name: string;
  description: string;
  pattern: string;
  frequency: number;
  modelTypes: string[];
  successRate: number;
  createdAt: string;
  updatedAt: string;
};

export class IntelligentLearningSystem {
  private storage: IStorage;
  private aiAssistantService: AIAssistantService;

  constructor(storage: IStorage, aiAssistantService: AIAssistantService) {
    this.storage = storage;
    this.aiAssistantService = aiAssistantService;
  }

  /**
   * Extract knowledge from a model component
   */
  async extractKnowledgeFromComponent(
    component: ModelComponent,
    model: AssessmentModel
  ): Promise<KnowledgeItem | null> {
    try {
      // Prepare prompt for AI service
      const promptTemplate = `
You are an expert assessment model developer working on a knowledge extraction system.

MODEL TYPE: ${model.type}
COMPONENT NAME: ${component.name}
COMPONENT DESCRIPTION: ${component.description || 'No description provided'}
CODE:
\`\`\`
${component.code}
\`\`\`

Based on this component, extract reusable knowledge that could be valuable for other assessment models.
Focus on identifying patterns, techniques, or approaches that represent best practices in assessment modeling.

Your response should be in JSON format:
{
  "title": "Short, descriptive title for this knowledge item",
  "description": "Detailed explanation of the pattern, approach, or technique",
  "category": "component_pattern", // Keep this as component_pattern
  "tags": ["tag1", "tag2", "tag3"], // Relevant tags for categorization
  "code": "// Generalized version of the code pattern that could be reused"
}
`;

      // Try each available provider
      const providers = this.aiAssistantService.getAvailableProviders();

      if (providers.length === 0) {
        console.warn('No AI providers available for knowledge extraction');
        return null;
      }

      for (const provider of providers) {
        try {
          const response = await this.aiAssistantService.generateResponse({
            message: promptTemplate,
            provider,
            options: {
              temperature: 0.3,
              maxTokens: 1000,
            },
          });

          try {
            // Extract JSON response
            const jsonMatch =
              response.message.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) ||
              response.message.match(/(\{[\s\S]*\})/);

            if (jsonMatch && jsonMatch[1]) {
              const knowledge = JSON.parse(jsonMatch[1]);

              // Save knowledge to database
              const knowledgeItem = await this.storage.createKnowledgeItem({
                title: knowledge.title,
                description: knowledge.description,
                category: 'component_pattern',
                modelType: model.type,
                code: knowledge.code,
                usageCount: 1,
                tags: knowledge.tags,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });

              return knowledgeItem;
            }
          } catch (parseError) {
            console.error('Error parsing knowledge extraction response:', parseError);
            // Continue to the next provider
          }
        } catch (error) {
          console.error(`Error extracting knowledge with provider ${provider}:`, error);
          // Continue to the next provider
        }
      }

      return null;
    } catch (error) {
      console.error('Error extracting knowledge from component:', error);
      return null;
    }
  }

  /**
   * Extract knowledge from a model calculation
   */
  async extractKnowledgeFromCalculation(
    calculation: ModelCalculation,
    model: AssessmentModel
  ): Promise<KnowledgeItem | null> {
    try {
      // Prepare prompt for AI service
      const promptTemplate = `
You are an expert assessment model developer working on a knowledge extraction system.

MODEL TYPE: ${model.type}
CALCULATION NAME: ${calculation.name}
CALCULATION DESCRIPTION: ${calculation.description || 'No description provided'}
FORMULA:
\`\`\`
${calculation.formula}
\`\`\`

Based on this calculation, extract reusable knowledge that could be valuable for other assessment models.
Focus on identifying patterns, techniques, or approaches that represent best practices in assessment calculations.

Your response should be in JSON format:
{
  "title": "Short, descriptive title for this calculation pattern",
  "description": "Detailed explanation of the calculation approach or technique",
  "category": "calculation_pattern", // Keep this as calculation_pattern
  "tags": ["tag1", "tag2", "tag3"], // Relevant tags for categorization
  "formula": "// Generalized version of the formula that could be reused"
}
`;

      // Try each available provider
      const providers = this.aiAssistantService.getAvailableProviders();

      if (providers.length === 0) {
        console.warn('No AI providers available for knowledge extraction');
        return null;
      }

      for (const provider of providers) {
        try {
          const response = await this.aiAssistantService.generateResponse({
            message: promptTemplate,
            provider,
            options: {
              temperature: 0.3,
              maxTokens: 1000,
            },
          });

          try {
            // Extract JSON response
            const jsonMatch =
              response.message.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) ||
              response.message.match(/(\{[\s\S]*\})/);

            if (jsonMatch && jsonMatch[1]) {
              const knowledge = JSON.parse(jsonMatch[1]);

              // Save knowledge to database
              const knowledgeItem = await this.storage.createKnowledgeItem({
                title: knowledge.title,
                description: knowledge.description,
                category: 'calculation_pattern',
                modelType: model.type,
                formula: knowledge.formula,
                usageCount: 1,
                tags: knowledge.tags,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });

              return knowledgeItem;
            }
          } catch (parseError) {
            console.error('Error parsing knowledge extraction response:', parseError);
            // Continue to the next provider
          }
        } catch (error) {
          console.error(`Error extracting knowledge with provider ${provider}:`, error);
          // Continue to the next provider
        }
      }

      return null;
    } catch (error) {
      console.error('Error extracting knowledge from calculation:', error);
      return null;
    }
  }

  /**
   * Find similar knowledge items
   */
  async findSimilarKnowledgeItems(
    query: string,
    category?: string,
    tags?: string[]
  ): Promise<KnowledgeItem[]> {
    try {
      // For now, use simple text matching from database
      // In a real implementation, this would use embedding-based similarity search
      return this.storage.searchKnowledgeItems(query, category, tags);
    } catch (error) {
      console.error('Error finding similar knowledge items:', error);
      return [];
    }
  }

  /**
   * Generate best practices based on existing models
   */
  async generateBestPractices(modelType?: string): Promise<BestPractice[]> {
    try {
      // Get models of the specified type
      const models = modelType
        ? await this.storage.getAssessmentModelsByType(modelType)
        : await this.storage.getAllAssessmentModels();

      if (!models || models.length === 0) {
        return [];
      }

      // Sample components and calculations
      const sampleComponents: ModelComponent[] = [];
      const sampleCalculations: ModelCalculation[] = [];

      for (const model of models.slice(0, 5)) {
        // Limit to 5 models for performance
        const components = await this.storage.getModelComponentsByModel(model.modelId);
        const calculations = await this.storage.getModelCalculationsByModel(model.modelId);

        sampleComponents.push(...components.slice(0, 3)); // Sample up to 3 components per model
        sampleCalculations.push(...calculations.slice(0, 3)); // Sample up to 3 calculations per model
      }

      // Prepare prompt for AI service
      const promptTemplate = `
You are an expert assessment model developer tasked with generating best practices for assessment modeling.

MODEL TYPE: ${modelType || 'All types'}

SAMPLE COMPONENTS:
${sampleComponents
  .map(
    c => `
NAME: ${c.name}
DESCRIPTION: ${c.description || 'No description provided'}
CODE:
\`\`\`
${c.code}
\`\`\`
`
  )
  .join('\n')}

SAMPLE CALCULATIONS:
${sampleCalculations
  .map(
    c => `
NAME: ${c.name}
DESCRIPTION: ${c.description || 'No description provided'}
FORMULA:
\`\`\`
${c.formula}
\`\`\`
`
  )
  .join('\n')}

Based on these examples, generate 3-5 best practices for assessment modeling. Focus on:
1. Code quality and maintainability
2. Performance optimization
3. Accuracy and reliability
4. Error handling
5. Security considerations

Your response should be in JSON format:
[
  {
    "title": "Short, descriptive title for this best practice",
    "description": "Detailed explanation of the best practice",
    "category": "code_quality", // One of: code_quality, performance, accuracy, error_handling, security, maintainability
    "applicableEntityTypes": ["component", "calculation"], // Which entity types this applies to
    "example": "// Good example code or formula",
    "counterExample": "// Bad example code or formula",
    "importance": "high" // high, medium, or low
  }
]
`;

      // Try each available provider
      const providers = this.aiAssistantService.getAvailableProviders();

      if (providers.length === 0) {
        console.warn('No AI providers available for generating best practices');
        return [];
      }

      for (const provider of providers) {
        try {
          const response = await this.aiAssistantService.generateResponse({
            message: promptTemplate,
            provider,
            options: {
              temperature: 0.4,
              maxTokens: 2000,
            },
          });

          try {
            // Extract JSON response
            const jsonMatch =
              response.message.match(/```(?:json)?\s*(\[[\s\S]*\])\s*```/) ||
              response.message.match(/(\[[\s\S]*\])/);

            if (jsonMatch && jsonMatch[1]) {
              const practices = JSON.parse(jsonMatch[1]);

              // Save best practices to database
              const bestPractices: BestPractice[] = [];

              for (const practice of practices) {
                const bestPractice = await this.storage.createBestPractice({
                  title: practice.title,
                  description: practice.description,
                  category: practice.category,
                  modelType: modelType,
                  applicableEntityTypes: practice.applicableEntityTypes,
                  example: practice.example,
                  counterExample: practice.counterExample,
                  importance: practice.importance,
                  source: 'extracted',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                });

                bestPractices.push(bestPractice);
              }

              return bestPractices;
            }
          } catch (parseError) {
            console.error('Error parsing best practices response:', parseError);
            // Continue to the next provider
          }
        } catch (error) {
          console.error(`Error generating best practices with provider ${provider}:`, error);
          // Continue to the next provider
        }
      }

      return [];
    } catch (error) {
      console.error('Error generating best practices:', error);
      return [];
    }
  }

  /**
   * Generate continuous improvement suggestions for a model
   */
  async generateImprovementSuggestions(
    modelId: string
  ): Promise<ContinuousImprovementSuggestion[]> {
    try {
      // Get model
      const model = await this.storage.getAssessmentModelByModelId(modelId);

      if (!model) {
        throw new Error('Model not found');
      }

      // Get components, calculations, and variables
      const components = await this.storage.getModelComponentsByModel(modelId);
      const calculations = await this.storage.getModelCalculationsByModel(modelId);
      const variables = await this.storage.getModelVariablesByModel(modelId);

      // Get best practices
      const bestPractices = await this.storage.getBestPractices();

      // Generate suggestions for components
      const componentSuggestions = await this.generateComponentSuggestions(
        components,
        model,
        bestPractices.filter(bp => bp.applicableEntityTypes.includes('component'))
      );

      // Generate suggestions for calculations
      const calculationSuggestions = await this.generateCalculationSuggestions(
        calculations,
        model,
        bestPractices.filter(bp => bp.applicableEntityTypes.includes('calculation'))
      );

      // Generate model-level suggestions
      const modelSuggestions = await this.generateModelLevelSuggestions(
        model,
        components,
        calculations,
        variables
      );

      return [...componentSuggestions, ...calculationSuggestions, ...modelSuggestions];
    } catch (error) {
      console.error('Error generating improvement suggestions:', error);
      return [];
    }
  }

  /**
   * Generate component improvement suggestions
   */
  private async generateComponentSuggestions(
    components: ModelComponent[],
    model: AssessmentModel,
    bestPractices: BestPractice[]
  ): Promise<ContinuousImprovementSuggestion[]> {
    const suggestions: ContinuousImprovementSuggestion[] = [];

    for (const component of components) {
      try {
        // Prepare prompt for AI service
        const promptTemplate = `
You are an expert assessment model developer tasked with suggesting improvements to a model component.

MODEL TYPE: ${model.type}
COMPONENT NAME: ${component.name}
COMPONENT DESCRIPTION: ${component.description || 'No description provided'}
CODE:
\`\`\`
${component.code}
\`\`\`

BEST PRACTICES TO CONSIDER:
${bestPractices.map(bp => `${bp.title}: ${bp.description}`).join('\n\n')}

Analyze this component and suggest 1-2 specific improvements that could be made.
Focus on practical, actionable suggestions that improve quality, performance, or maintainability.

Your response should be in JSON format:
[
  {
    "title": "Short, descriptive title for this suggestion",
    "description": "Brief explanation of the issue or improvement opportunity",
    "improvementType": "one of: performance, readability, accuracy, maintainability, consistency, error_handling",
    "suggestion": "Specific code or approach recommendation",
    "confidence": 0.85 // Between 0 and 1
  }
]
`;

        // Try each available provider
        const providers = this.aiAssistantService.getAvailableProviders();

        if (providers.length === 0) {
          console.warn('No AI providers available for generating component suggestions');
          continue;
        }

        for (const provider of providers) {
          try {
            const response = await this.aiAssistantService.generateResponse({
              message: promptTemplate,
              provider,
              options: {
                temperature: 0.3,
                maxTokens: 1000,
              },
            });

            try {
              // Extract JSON response
              const jsonMatch =
                response.message.match(/```(?:json)?\s*(\[[\s\S]*\])\s*```/) ||
                response.message.match(/(\[[\s\S]*\])/);

              if (jsonMatch && jsonMatch[1]) {
                const improvementSuggestions = JSON.parse(jsonMatch[1]);

                // Save suggestions to database
                for (const suggestion of improvementSuggestions) {
                  const improvementSuggestion =
                    await this.storage.createContinuousImprovementSuggestion({
                      title: suggestion.title,
                      description: suggestion.description,
                      modelId: model.modelId,
                      targetEntityType: 'component',
                      targetEntityId: component.id,
                      improvementType: suggestion.improvementType,
                      suggestion: suggestion.suggestion,
                      confidence: suggestion.confidence,
                      implemented: false,
                      createdAt: new Date().toISOString(),
                    });

                  suggestions.push(improvementSuggestion);
                }

                break; // Stop after the first successful provider
              }
            } catch (parseError) {
              console.error('Error parsing component suggestions response:', parseError);
              // Continue to the next provider
            }
          } catch (error) {
            console.error(
              `Error generating component suggestions with provider ${provider}:`,
              error
            );
            // Continue to the next provider
          }
        }
      } catch (error) {
        console.error(`Error generating suggestions for component ${component.id}:`, error);
      }
    }

    return suggestions;
  }

  /**
   * Generate calculation improvement suggestions
   */
  private async generateCalculationSuggestions(
    calculations: ModelCalculation[],
    model: AssessmentModel,
    bestPractices: BestPractice[]
  ): Promise<ContinuousImprovementSuggestion[]> {
    const suggestions: ContinuousImprovementSuggestion[] = [];

    for (const calculation of calculations) {
      try {
        // Prepare prompt for AI service
        const promptTemplate = `
You are an expert assessment model developer tasked with suggesting improvements to a model calculation.

MODEL TYPE: ${model.type}
CALCULATION NAME: ${calculation.name}
CALCULATION DESCRIPTION: ${calculation.description || 'No description provided'}
FORMULA:
\`\`\`
${calculation.formula}
\`\`\`

BEST PRACTICES TO CONSIDER:
${bestPractices.map(bp => `${bp.title}: ${bp.description}`).join('\n\n')}

Analyze this calculation and suggest 1-2 specific improvements that could be made.
Focus on practical, actionable suggestions that improve quality, performance, or accuracy.

Your response should be in JSON format:
[
  {
    "title": "Short, descriptive title for this suggestion",
    "description": "Brief explanation of the issue or improvement opportunity",
    "improvementType": "one of: performance, readability, accuracy, maintainability, consistency, error_handling",
    "suggestion": "Specific formula or approach recommendation",
    "confidence": 0.85 // Between 0 and 1
  }
]
`;

        // Try each available provider
        const providers = this.aiAssistantService.getAvailableProviders();

        if (providers.length === 0) {
          console.warn('No AI providers available for generating calculation suggestions');
          continue;
        }

        for (const provider of providers) {
          try {
            const response = await this.aiAssistantService.generateResponse({
              message: promptTemplate,
              provider,
              options: {
                temperature: 0.3,
                maxTokens: 1000,
              },
            });

            try {
              // Extract JSON response
              const jsonMatch =
                response.message.match(/```(?:json)?\s*(\[[\s\S]*\])\s*```/) ||
                response.message.match(/(\[[\s\S]*\])/);

              if (jsonMatch && jsonMatch[1]) {
                const improvementSuggestions = JSON.parse(jsonMatch[1]);

                // Save suggestions to database
                for (const suggestion of improvementSuggestions) {
                  const improvementSuggestion =
                    await this.storage.createContinuousImprovementSuggestion({
                      title: suggestion.title,
                      description: suggestion.description,
                      modelId: model.modelId,
                      targetEntityType: 'calculation',
                      targetEntityId: calculation.id,
                      improvementType: suggestion.improvementType,
                      suggestion: suggestion.suggestion,
                      confidence: suggestion.confidence,
                      implemented: false,
                      createdAt: new Date().toISOString(),
                    });

                  suggestions.push(improvementSuggestion);
                }

                break; // Stop after the first successful provider
              }
            } catch (parseError) {
              console.error('Error parsing calculation suggestions response:', parseError);
              // Continue to the next provider
            }
          } catch (error) {
            console.error(
              `Error generating calculation suggestions with provider ${provider}:`,
              error
            );
            // Continue to the next provider
          }
        }
      } catch (error) {
        console.error(`Error generating suggestions for calculation ${calculation.id}:`, error);
      }
    }

    return suggestions;
  }

  /**
   * Generate model-level improvement suggestions
   */
  private async generateModelLevelSuggestions(
    model: AssessmentModel,
    components: ModelComponent[],
    calculations: ModelCalculation[],
    variables: ModelVariable[]
  ): Promise<ContinuousImprovementSuggestion[]> {
    try {
      // Prepare prompt for AI service
      const promptTemplate = `
You are an expert assessment model developer tasked with suggesting improvements to an assessment model.

MODEL TYPE: ${model.type}
MODEL NAME: ${model.name}
MODEL DESCRIPTION: ${model.description || 'No description provided'}

MODEL STRUCTURE:
- Components: ${components.length}
- Calculations: ${calculations.length}
- Variables: ${variables.length}

COMPONENT NAMES:
${components.map(c => c.name).join(', ')}

CALCULATION NAMES:
${calculations.map(c => c.name).join(', ')}

VARIABLE NAMES:
${variables.map(v => v.name).join(', ')}

Analyze this model structure and suggest 2-3 high-level improvements that could be made at the model level.
Focus on structural, organizational, or architectural improvements rather than specific component or calculation changes.

Your response should be in JSON format:
[
  {
    "title": "Short, descriptive title for this suggestion",
    "description": "Brief explanation of the issue or improvement opportunity",
    "improvementType": "one of: performance, readability, accuracy, maintainability, consistency, error_handling",
    "suggestion": "Specific approach recommendation",
    "confidence": 0.85 // Between 0 and 1
  }
]
`;

      // Try each available provider
      const providers = this.aiAssistantService.getAvailableProviders();

      if (providers.length === 0) {
        console.warn('No AI providers available for generating model-level suggestions');
        return [];
      }

      for (const provider of providers) {
        try {
          const response = await this.aiAssistantService.generateResponse({
            message: promptTemplate,
            provider,
            options: {
              temperature: 0.4,
              maxTokens: 1500,
            },
          });

          try {
            // Extract JSON response
            const jsonMatch =
              response.message.match(/```(?:json)?\s*(\[[\s\S]*\])\s*```/) ||
              response.message.match(/(\[[\s\S]*\])/);

            if (jsonMatch && jsonMatch[1]) {
              const improvementSuggestions = JSON.parse(jsonMatch[1]);

              // Save suggestions to database
              const suggestions: ContinuousImprovementSuggestion[] = [];

              for (const suggestion of improvementSuggestions) {
                const improvementSuggestion =
                  await this.storage.createContinuousImprovementSuggestion({
                    title: suggestion.title,
                    description: suggestion.description,
                    modelId: model.modelId,
                    targetEntityType: 'model',
                    improvementType: suggestion.improvementType,
                    suggestion: suggestion.suggestion,
                    confidence: suggestion.confidence,
                    implemented: false,
                    createdAt: new Date().toISOString(),
                  });

                suggestions.push(improvementSuggestion);
              }

              return suggestions;
            }
          } catch (parseError) {
            console.error('Error parsing model-level suggestions response:', parseError);
            // Continue to the next provider
          }
        } catch (error) {
          console.error(
            `Error generating model-level suggestions with provider ${provider}:`,
            error
          );
          // Continue to the next provider
        }
      }

      return [];
    } catch (error) {
      console.error('Error generating model-level suggestions:', error);
      return [];
    }
  }

  /**
   * Detect and extract learning patterns from models
   */
  async detectLearningPatterns(): Promise<LearningPattern[]> {
    try {
      // Get all models
      const models = await this.storage.getAllAssessmentModels();

      if (!models || models.length === 0) {
        return [];
      }

      // Get components and calculations for each model
      const allComponents: { component: ModelComponent; modelType: string }[] = [];
      const allCalculations: { calculation: ModelCalculation; modelType: string }[] = [];

      for (const model of models) {
        const components = await this.storage.getModelComponentsByModel(model.modelId);
        const calculations = await this.storage.getModelCalculationsByModel(model.modelId);

        allComponents.push(...components.map(component => ({ component, modelType: model.type })));
        allCalculations.push(
          ...calculations.map(calculation => ({ calculation, modelType: model.type }))
        );
      }

      // Detect component patterns
      const componentPatterns = await this.detectComponentPatterns(allComponents);

      // Detect calculation patterns
      const calculationPatterns = await this.detectCalculationPatterns(allCalculations);

      return [...componentPatterns, ...calculationPatterns];
    } catch (error) {
      console.error('Error detecting learning patterns:', error);
      return [];
    }
  }

  /**
   * Detect component patterns
   */
  private async detectComponentPatterns(
    componentData: { component: ModelComponent; modelType: string }[]
  ): Promise<LearningPattern[]> {
    try {
      // Prepare prompt for AI service
      const components = componentData.slice(0, 10); // Limit to 10 components for performance

      const promptTemplate = `
You are an expert assessment model developer tasked with identifying common patterns in model components.

COMPONENTS:
${components
  .map(
    c => `
MODEL TYPE: ${c.modelType}
COMPONENT NAME: ${c.component.name}
COMPONENT DESCRIPTION: ${c.component.description || 'No description provided'}
CODE:
\`\`\`
${c.component.code}
\`\`\`
`
  )
  .join('\n')}

Analyze these components and identify 2-3 common patterns or techniques that appear across multiple components.
Focus on meaningful patterns that represent best practices or reusable approaches in assessment modeling.

Your response should be in JSON format:
[
  {
    "patternType": "component",
    "name": "Pattern name",
    "description": "Detailed description of the pattern",
    "pattern": "// Generalized code representing the pattern",
    "frequency": 3, // Number of components that exhibit this pattern
    "modelTypes": ["residential", "commercial"], // Types of models where this pattern appears
    "successRate": 0.9 // Estimated success rate (0-1) based on pattern quality
  }
]
`;

      // Try each available provider
      const providers = this.aiAssistantService.getAvailableProviders();

      if (providers.length === 0) {
        console.warn('No AI providers available for detecting component patterns');
        return [];
      }

      for (const provider of providers) {
        try {
          const response = await this.aiAssistantService.generateResponse({
            message: promptTemplate,
            provider,
            options: {
              temperature: 0.4,
              maxTokens: 2000,
            },
          });

          try {
            // Extract JSON response
            const jsonMatch =
              response.message.match(/```(?:json)?\s*(\[[\s\S]*\])\s*```/) ||
              response.message.match(/(\[[\s\S]*\])/);

            if (jsonMatch && jsonMatch[1]) {
              const patterns = JSON.parse(jsonMatch[1]);

              // Save patterns to database
              const learningPatterns: LearningPattern[] = [];

              for (const pattern of patterns) {
                const learningPattern = await this.storage.createLearningPattern({
                  patternType: 'component',
                  name: pattern.name,
                  description: pattern.description,
                  pattern: pattern.pattern,
                  frequency: pattern.frequency,
                  modelTypes: pattern.modelTypes,
                  successRate: pattern.successRate,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                });

                learningPatterns.push(learningPattern);
              }

              return learningPatterns;
            }
          } catch (parseError) {
            console.error('Error parsing component patterns response:', parseError);
            // Continue to the next provider
          }
        } catch (error) {
          console.error(`Error detecting component patterns with provider ${provider}:`, error);
          // Continue to the next provider
        }
      }

      return [];
    } catch (error) {
      console.error('Error detecting component patterns:', error);
      return [];
    }
  }

  /**
   * Detect calculation patterns
   */
  private async detectCalculationPatterns(
    calculationData: { calculation: ModelCalculation; modelType: string }[]
  ): Promise<LearningPattern[]> {
    try {
      // Prepare prompt for AI service
      const calculations = calculationData.slice(0, 10); // Limit to 10 calculations for performance

      const promptTemplate = `
You are an expert assessment model developer tasked with identifying common patterns in model calculations.

CALCULATIONS:
${calculations
  .map(
    c => `
MODEL TYPE: ${c.modelType}
CALCULATION NAME: ${c.calculation.name}
CALCULATION DESCRIPTION: ${c.calculation.description || 'No description provided'}
FORMULA:
\`\`\`
${c.calculation.formula}
\`\`\`
`
  )
  .join('\n')}

Analyze these calculations and identify 2-3 common patterns or techniques that appear across multiple calculations.
Focus on meaningful patterns that represent best practices or reusable approaches in assessment calculations.

Your response should be in JSON format:
[
  {
    "patternType": "calculation",
    "name": "Pattern name",
    "description": "Detailed description of the calculation pattern",
    "pattern": "// Generalized formula representing the pattern",
    "frequency": 3, // Number of calculations that exhibit this pattern
    "modelTypes": ["residential", "commercial"], // Types of models where this pattern appears
    "successRate": 0.9 // Estimated success rate (0-1) based on pattern quality
  }
]
`;

      // Try each available provider
      const providers = this.aiAssistantService.getAvailableProviders();

      if (providers.length === 0) {
        console.warn('No AI providers available for detecting calculation patterns');
        return [];
      }

      for (const provider of providers) {
        try {
          const response = await this.aiAssistantService.generateResponse({
            message: promptTemplate,
            provider,
            options: {
              temperature: 0.4,
              maxTokens: 2000,
            },
          });

          try {
            // Extract JSON response
            const jsonMatch =
              response.message.match(/```(?:json)?\s*(\[[\s\S]*\])\s*```/) ||
              response.message.match(/(\[[\s\S]*\])/);

            if (jsonMatch && jsonMatch[1]) {
              const patterns = JSON.parse(jsonMatch[1]);

              // Save patterns to database
              const learningPatterns: LearningPattern[] = [];

              for (const pattern of patterns) {
                const learningPattern = await this.storage.createLearningPattern({
                  patternType: 'calculation',
                  name: pattern.name,
                  description: pattern.description,
                  pattern: pattern.pattern,
                  frequency: pattern.frequency,
                  modelTypes: pattern.modelTypes,
                  successRate: pattern.successRate,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                });

                learningPatterns.push(learningPattern);
              }

              return learningPatterns;
            }
          } catch (parseError) {
            console.error('Error parsing calculation patterns response:', parseError);
            // Continue to the next provider
          }
        } catch (error) {
          console.error(`Error detecting calculation patterns with provider ${provider}:`, error);
          // Continue to the next provider
        }
      }

      return [];
    } catch (error) {
      console.error('Error detecting calculation patterns:', error);
      return [];
    }
  }

  /**
   * Get knowledge items
   */
  async getKnowledgeItems(category?: string, tags?: string[]): Promise<KnowledgeItem[]> {
    return this.storage.getKnowledgeItems(category, tags);
  }

  /**
   * Get best practices
   */
  async getBestPractices(category?: string, modelType?: string): Promise<BestPractice[]> {
    return this.storage.getBestPractices(category, modelType);
  }

  /**
   * Get continuous improvement suggestions
   */
  async getImprovementSuggestions(
    modelId: string,
    targetEntityType?: string
  ): Promise<ContinuousImprovementSuggestion[]> {
    return this.storage.getImprovementSuggestionsByModel(modelId, targetEntityType);
  }

  /**
   * Get learning patterns
   */
  async getLearningPatterns(patternType?: string): Promise<LearningPattern[]> {
    return this.storage.getLearningPatterns(patternType);
  }
}

// Singleton instance
let intelligentLearningSystem: IntelligentLearningSystem;

/**
 * Initialize the Intelligent Learning System
 */
export function initializeIntelligentLearningSystem(
  storage: IStorage,
  aiAssistantService: AIAssistantService
): IntelligentLearningSystem {
  intelligentLearningSystem = new IntelligentLearningSystem(storage, aiAssistantService);
  return intelligentLearningSystem;
}

/**
 * Get the Intelligent Learning System instance
 */
export function getIntelligentLearningSystem(): IntelligentLearningSystem {
  if (!intelligentLearningSystem) {
    throw new Error('Intelligent Learning System not initialized');
  }
  return intelligentLearningSystem;
}

export default intelligentLearningSystem;
