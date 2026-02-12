/**
 * AI Model Assistant Service
 *
 * Provides AI-powered assistance for assessment model building, including:
 * - Code template generation
 * - Formula optimization
 * - Real-time validation
 * - Contextual suggestions
 */

import { AIAssistantService } from '../ai-assistant-service';
import { ModelComponent, ModelCalculation, ModelVariable } from '@shared/schema';

// Type definitions for AI-assisted model functions
export type CodeGenerationRequest = {
  description: string;
  modelContext?: {
    variables?: ModelVariable[];
    existingComponents?: ModelComponent[];
    modelType?: string;
  };
  language?: string;
  templateType?: 'component' | 'calculation' | 'validator';
};

export type FormulaOptimizationRequest = {
  formula: string;
  context?: {
    variables?: ModelVariable[];
    description?: string;
  };
  optimizationGoals?: ('performance' | 'readability' | 'accuracy')[];
};

export type CodeValidationResult = {
  isValid: boolean;
  errors: {
    line: number;
    message: string;
    severity: 'error' | 'warning' | 'info';
    suggestion?: string;
  }[];
  suggestions?: {
    line: number;
    message: string;
    suggestion: string;
  }[];
};

export class AIModelAssistant {
  private aiAssistantService: AIAssistantService;

  constructor(aiAssistantService: AIAssistantService) {
    this.aiAssistantService = aiAssistantService;
  }

  /**
   * Generate code template based on description and context
   */
  async generateCodeTemplate(request: CodeGenerationRequest): Promise<string> {
    const {
      description,
      modelContext,
      language = 'javascript',
      templateType = 'component',
    } = request;

    const variablesList = modelContext?.variables
      ? modelContext.variables
          .map(v => `${v.name} (${v.type}): ${v.description || 'No description'}`)
          .join('\n')
      : 'No variables available';

    let promptTemplate = `Generate a ${language} ${templateType} for an assessment model with the following description:\n\n`;
    promptTemplate += `${description}\n\n`;

    if (modelContext) {
      promptTemplate += `Available variables:\n${variablesList}\n\n`;

      if (modelContext.existingComponents?.length) {
        promptTemplate += `Existing components:\n${modelContext.existingComponents.map(c => c.name).join(', ')}\n\n`;
      }

      if (modelContext.modelType) {
        promptTemplate += `Model type: ${modelContext.modelType}\n\n`;
      }
    }

    promptTemplate += `Please generate clean, well-commented ${language} code that follows best practices.`;
    promptTemplate += `Format your response as only the code (without explanation) wrapped in triple backticks.`;

    // Try each available provider
    const providers = this.aiAssistantService.getAvailableProviders();

    if (providers.length === 0) {
      throw new Error('No AI providers available for code generation');
    }

    for (const provider of providers) {
      try {
        const response = await this.aiAssistantService.generateResponse({
          message: promptTemplate,
          provider,
          options: {
            temperature: 0.3, // Lower temperature for more precise code generation
            maxTokens: 2000,
          },
        });

        // Extract code from response
        const codeRegex = /```(?:\w*\n)?([\s\S]*?)```/g;
        const match = codeRegex.exec(response.message);
        if (match) {
          return match[1].trim();
        }

        return response.message;
      } catch (error) {
        console.error(`Error generating code template with provider ${provider}:`, error);
        // Continue to the next provider
      }
    }

    throw new Error('All AI providers failed to generate code template');
  }

  /**
   * Optimize a calculation formula
   */
  async optimizeFormula(request: FormulaOptimizationRequest): Promise<string> {
    const { formula, context, optimizationGoals = ['performance', 'readability'] } = request;

    const variablesList = context?.variables
      ? context.variables
          .map(v => `${v.name} (${v.type}): ${v.description || 'No description'}`)
          .join('\n')
      : 'No variables available';

    let promptTemplate = `Optimize the following assessment calculation formula:\n\n`;
    promptTemplate += `\`\`\`\n${formula}\n\`\`\`\n\n`;

    if (context) {
      promptTemplate += `Formula context: ${context.description || 'Not provided'}\n\n`;
      promptTemplate += `Available variables:\n${variablesList}\n\n`;
    }

    promptTemplate += `Optimization goals: ${optimizationGoals.join(', ')}\n\n`;
    promptTemplate += `Please provide the optimized formula with an explanation of your changes.`;

    // Try each available provider
    const providers = this.aiAssistantService.getAvailableProviders();

    if (providers.length === 0) {
      throw new Error('No AI providers available for formula optimization');
    }

    for (const provider of providers) {
      try {
        const response = await this.aiAssistantService.generateResponse({
          message: promptTemplate,
          provider,
          options: {
            temperature: 0.2,
            maxTokens: 1500,
          },
        });

        // Extract optimized formula
        const formulaRegex = /```(?:\w*\n)?([\s\S]*?)```/g;
        const match = formulaRegex.exec(response.message);

        return {
          optimizedFormula: match ? match[1].trim() : '',
          explanation: response.message.replace(formulaRegex, '').trim(),
        };
      } catch (error) {
        console.error(`Error optimizing formula with provider ${provider}:`, error);
        // Continue to the next provider
      }
    }

    throw new Error('All AI providers failed to optimize formula');
  }

  /**
   * Validate code or formula and provide suggestions
   */
  async validateCode(
    code: string,
    type: 'component' | 'calculation' | 'validator'
  ): Promise<CodeValidationResult> {
    let promptTemplate = `Analyze the following ${type} code for an assessment model and identify any issues or potential improvements:\n\n`;
    promptTemplate += `\`\`\`\n${code}\n\`\`\`\n\n`;
    promptTemplate += `Provide a response in the following JSON format:\n`;
    promptTemplate += `{
  "isValid": true/false,
  "errors": [
    {
      "line": <line number>,
      "message": "<error description>",
      "severity": "<error|warning|info>",
      "suggestion": "<suggested fix>"
    }
  ],
  "suggestions": [
    {
      "line": <line number>,
      "message": "<improvement description>",
      "suggestion": "<suggested code>"
    }
  ]
}`;

    // Try each available provider
    const providers = this.aiAssistantService.getAvailableProviders();

    if (providers.length === 0) {
      throw new Error('No AI providers available for code validation');
    }

    for (const provider of providers) {
      try {
        const response = await this.aiAssistantService.generateResponse({
          message: promptTemplate,
          provider,
          options: {
            temperature: 0.1, // Very low temperature for more deterministic analysis
            maxTokens: 2000,
          },
        });

        try {
          // Extract JSON response
          const jsonMatch =
            response.message.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) ||
            response.message.match(/(\{[\s\S]*\})/);

          if (jsonMatch && jsonMatch[1]) {
            return JSON.parse(jsonMatch[1]);
          } else {
            console.warn('Could not extract JSON from response:', response.message);
            return {
              isValid: false,
              errors: [
                {
                  line: 0,
                  message: 'Failed to analyze code properly',
                  severity: 'info',
                },
              ],
            };
          }
        } catch (parseError) {
          console.error('Error parsing validation response:', parseError);
          return {
            isValid: false,
            errors: [
              {
                line: 0,
                message: 'Error parsing validation results',
                severity: 'info',
              },
            ],
          };
        }
      } catch (error) {
        console.error(`Error validating code with provider ${provider}:`, error);
        // Continue to the next provider
      }
    }

    throw new Error('All AI providers failed to validate code');
  }

  /**
   * Generate test cases for a component or calculation
   */
  async generateTestCases(
    component: ModelComponent | ModelCalculation,
    variables: ModelVariable[]
  ): Promise<any[]> {
    const variablesList = variables
      .map(v => `${v.name} (${v.type}): ${v.description || 'No description'}`)
      .join('\n');

    let promptTemplate = `Generate test cases for the following assessment model ${component.type === 'calculation' ? 'calculation' : 'component'}:\n\n`;
    promptTemplate += `Name: ${component.name}\n`;
    promptTemplate += `Description: ${component.description || 'Not provided'}\n`;
    promptTemplate += `Code:\n\`\`\`\n${component.type === 'calculation' ? component.formula : component.code}\n\`\`\`\n\n`;
    promptTemplate += `Available variables:\n${variablesList}\n\n`;
    promptTemplate += `Please generate 3-5 test cases with inputs and expected outputs.`;
    promptTemplate += `Provide your response in JSON format with an array of test cases like this:\n`;
    promptTemplate += `[
  {
    "name": "Test case name",
    "description": "Test case description",
    "inputs": {
      "variable1": value1,
      "variable2": value2
    },
    "expectedOutput": expectedValue
  }
]`;

    // Try each available provider
    const providers = this.aiAssistantService.getAvailableProviders();

    if (providers.length === 0) {
      throw new Error('No AI providers available for test case generation');
    }

    for (const provider of providers) {
      try {
        const response = await this.aiAssistantService.generateResponse({
          message: promptTemplate,
          provider,
          options: {
            temperature: 0.3,
            maxTokens: 2000,
          },
        });

        try {
          // Extract JSON response
          const jsonMatch =
            response.message.match(/```(?:json)?\s*(\[[\s\S]*\])\s*```/) ||
            response.message.match(/(\[[\s\S]*\])/);

          if (jsonMatch && jsonMatch[1]) {
            return JSON.parse(jsonMatch[1]);
          } else {
            console.warn('Could not extract JSON from response:', response.message);
            return [];
          }
        } catch (parseError) {
          console.error('Error parsing test cases response:', parseError);
          return [];
        }
      } catch (error) {
        console.error(`Error generating test cases with provider ${provider}:`, error);
        // Continue to the next provider
      }
    }

    throw new Error('All AI providers failed to generate test cases');
  }
}

// Singleton instance
let aiModelAssistant: AIModelAssistant;

/**
 * Initialize the AI Model Assistant with the AI Assistant Service
 */
export function initializeAIModelAssistant(
  aiAssistantService: AIAssistantService
): AIModelAssistant {
  aiModelAssistant = new AIModelAssistant(aiAssistantService);
  return aiModelAssistant;
}

/**
 * Get the AI Model Assistant instance
 */
export function getAIModelAssistant(): AIModelAssistant {
  if (!aiModelAssistant) {
    throw new Error('AI Model Assistant not initialized');
  }
  return aiModelAssistant;
}

export default aiModelAssistant;
