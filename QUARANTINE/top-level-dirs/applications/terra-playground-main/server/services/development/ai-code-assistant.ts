import { AIAssistantService, MessageContext } from '../../services/ai-assistant-service';

export interface CodeAssistantInterface {
  generateCodeSuggestion(prompt: string, fileContext?: string): Promise<string>;
  completeCode(codeSnippet: string, language: string): Promise<string>;
  explainCode(code: string): Promise<string>;
  fixBugs(code: string, errorMessage: string): Promise<string>;
  recommendImprovement(code: string): Promise<string>;
  generateAssessmentModel(requirements: string): Promise<string>;
}

/**
 * AI Code Assistant service for code generation, completion, and analysis
 * specifically designed for assessment applications development
 */
class AICodeAssistant implements CodeAssistantInterface {
  private aiAssistantService: AIAssistantService;

  constructor(aiAssistantService: AIAssistantService) {
    this.aiAssistantService = aiAssistantService;
  }

  /**
   * Generate code based on a prompt and optional file context
   */
  async generateCodeSuggestion(prompt: string, fileContext?: string): Promise<string> {
    const providers = this.aiAssistantService.getAvailableProviders();

    // Create a context with system prompt
    const context: MessageContext = {
      recentMessages: [
        {
          id: '1',
          role: 'system',
          content: `You are an expert programming assistant specialized in property assessment and valuation code. 
        Your task is to generate high-quality, clean, and efficient code based on the user's requirements.
        Focus particularly on assessment terminology and patterns appropriate for property tax administration.
        Generate code that follows best practices and includes appropriate comments.`,
          timestamp: Date.now(),
        },
      ],
    };

    let fullPrompt = prompt;
    if (fileContext) {
      fullPrompt = `Current file context:\n\`\`\`\n${fileContext}\n\`\`\`\n\nUser request: ${prompt}`;
    }

    // If no providers available, return a basic implementation
    if (providers.length === 0) {
      console.warn('No AI providers available, returning fallback implementation');
      return `// Fallback implementation - no AI providers available
// Basic property assessment function
function assessProperty(property) {
  // Calculate basic property value based on square footage and location factor
  const baseValue = property.squareFootage * property.locationFactor;
  
  // Apply adjustments for property condition
  const conditionFactor = {
    'excellent': 1.1,
    'good': 1.0,
    'average': 0.9,
    'poor': 0.7
  }[property.condition] || 1.0;
  
  // Calculate final assessed value
  const assessedValue = baseValue * conditionFactor;
  
  return {
    propertyId: property.id,
    assessedValue: assessedValue,
    assessmentDate: new Date(),
    assessmentMethod: 'basic-calculation'
  };
}`;
    }

    // Try each provider in order
    for (const provider of providers) {
      try {
        const response = await this.aiAssistantService.generateResponse({
          message: fullPrompt,
          context: context,
          provider: provider,
          options: {
            temperature: 0.3,
            maxTokens: 2000,
          },
        });

        // Extract code from response if it's wrapped in markdown code blocks
        const codeRegex = /```(?:\w*\n)?([\s\S]*?)```/g;
        const match = codeRegex.exec(response.message);
        return match ? match[1].trim() : response.message;
      } catch (error) {
        console.error(`Error generating code with provider ${provider}:`, error);
        // Continue to the next provider
      }
    }

    // If all providers failed, return a fallback implementation
    console.warn('All AI providers failed, returning fallback implementation');
    return `// Fallback implementation - AI provider errors
// Basic property assessment function
function assessProperty(property) {
  // Calculate basic property value based on square footage and location factor
  const baseValue = property.squareFootage * property.locationFactor;
  
  // Apply adjustments for property condition
  const conditionFactor = {
    'excellent': 1.1,
    'good': 1.0,
    'average': 0.9,
    'poor': 0.7
  }[property.condition] || 1.0;
  
  // Calculate final assessed value
  const assessedValue = baseValue * conditionFactor;
  
  return {
    propertyId: property.id,
    assessedValue: assessedValue,
    assessmentDate: new Date(),
    assessmentMethod: 'basic-calculation'
  };
}`;
  }

  /**
   * Complete partial code snippet
   */
  async completeCode(codeSnippet: string, language: string): Promise<string> {
    const systemPrompt = `You are an expert code completion assistant for ${language} programming, 
    specializing in property assessment and tax administration code. 
    Complete the provided code snippet with high-quality, efficient code that follows best practices.`;

    const promptMessage = `Complete this ${language} code:\n\`\`\`${language}\n${codeSnippet}\n\`\`\`\nProvide only the completed code without explanations.`;

    // Try available providers in order of preference
    const providers = this.aiAssistantService.getAvailableProviders();

    if (providers.length === 0) {
      return `
function calculateTaxableValue(assessedValue, exemptions) {
  // Calculate the taxable value by subtracting exemptions from assessed value
  // Ensure the taxable value is not negative
  const taxableValue = Math.max(0, assessedValue - (exemptions || 0));
  
  // Return the calculated taxable value
  return taxableValue;
}`;
    }

    for (const provider of providers) {
      try {
        const response = await this.aiAssistantService.generateResponse({
          message: promptMessage,
          provider: provider,
          options: {
            temperature: 0.2,
            maxTokens: 1500,
          },
        });

        // Extract code from response
        const codeRegex = /```(?:\w*\n)?([\s\S]*?)```/g;
        const match = codeRegex.exec(response.message);
        return match ? match[1].trim() : response.message;
      } catch (error) {
        console.error(`Error completing code with provider ${provider}:`, error);
        // Continue to the next provider
      }
    }

    // If all providers failed, return a basic implementation
    console.warn('All AI providers failed, returning fallback implementation');
    return `
function calculateTaxableValue(assessedValue, exemptions) {
  // Calculate the taxable value by subtracting exemptions from assessed value
  // Ensure the taxable value is not negative
  const taxableValue = Math.max(0, assessedValue - (exemptions || 0));
  
  // Return the calculated taxable value
  return taxableValue;
}`;
  }

  /**
   * Explain code with assessment terminology
   */
  async explainCode(code: string): Promise<string> {
    // Create a context with system prompt
    const context: MessageContext = {
      recentMessages: [
        {
          id: '1',
          role: 'system',
          content: `You are an expert code explainer specializing in property assessment and valuation software.
        Explain the provided code in clear, non-technical terms that assessors and appraisers would understand.
        Focus on what the code does in the context of property assessment, not just the technical implementation.
        Use terminology familiar to the assessment industry.`,
          timestamp: Date.now(),
        },
      ],
    };

    const promptMessage = `Explain this code in the context of property assessment:\n\`\`\`\n${code}\n\`\`\``;
    const providers = this.aiAssistantService.getAvailableProviders();

    if (providers.length === 0) {
      // Return a simplified explanation if no AI providers
      return "This code appears to be related to property assessment calculations. It likely performs operations on property data to determine valuations based on standard assessment methodologies. Without AI assistance, a more detailed explanation isn't available.";
    }

    for (const provider of providers) {
      try {
        const response = await this.aiAssistantService.generateResponse({
          message: promptMessage,
          context: context,
          provider: provider,
          options: {
            temperature: 0.7,
            maxTokens: 1000,
          },
        });

        return response.message;
      } catch (error) {
        console.error(`Error explaining code with provider ${provider}:`, error);
        // Continue to next provider
      }
    }

    // Fallback if all providers fail
    return "This code appears to be related to property assessment calculations. It likely performs operations on property data to determine valuations based on standard assessment methodologies. Without AI assistance, a more detailed explanation isn't available.";
  }

  /**
   * Fix bugs in code based on error message
   */
  async fixBugs(code: string, errorMessage: string): Promise<string> {
    // Create a context with system prompt
    const context: MessageContext = {
      recentMessages: [
        {
          id: '1',
          role: 'system',
          content: `You are an expert debugging assistant specializing in property assessment software.
        Analyze the provided code and error message to identify and fix the issues.
        Provide the corrected code along with brief explanations of what was wrong and how you fixed it.
        Ensure the fixed code maintains the original functionality and intent.`,
          timestamp: Date.now(),
        },
      ],
    };

    const promptMessage = `Fix this code that has the following error:\n\nERROR: ${errorMessage}\n\nCODE:\n\`\`\`\n${code}\n\`\`\`\n\nPlease provide the corrected code.`;
    const providers = this.aiAssistantService.getAvailableProviders();

    if (providers.length === 0) {
      // Return a basic fix attempt if no AI providers available
      return this.generateBasicFix(code, errorMessage);
    }

    for (const provider of providers) {
      try {
        const response = await this.aiAssistantService.generateResponse({
          message: promptMessage,
          context: context,
          provider: provider,
          options: {
            temperature: 0.3,
            maxTokens: 2000,
          },
        });

        // Extract code from response
        const codeRegex = /```(?:\w*\n)?([\s\S]*?)```/g;
        const match = codeRegex.exec(response.message);
        return match ? match[1].trim() : response.message;
      } catch (error) {
        console.error(`Error fixing bugs with provider ${provider}:`, error);
        // Continue to next provider
      }
    }

    // If all providers failed, return a basic fix attempt
    return this.generateBasicFix(code, errorMessage);
  }

  /**
   * Generate a basic fix attempt based on common error patterns
   * Used as fallback when AI providers are unavailable
   */
  private generateBasicFix(code: string, errorMessage: string): string {
    // Check for common syntax errors
    if (errorMessage.includes('SyntaxError') || errorMessage.includes('Unexpected token')) {
      // Check for missing brackets, parentheses, or semicolons
      const fixedCode = code
        .replace(/\(\s*\n/g, '(\n') // Fix spacing in parentheses
        .replace(/\s*\)/g, ')') // Fix spacing before closing parentheses
        .replace(/if\s*\((.+?)\)(\s*\w+)/g, 'if ($1) {$2}') // Add braces to if statements
        .replace(/(\w+)\s*=\s*(.+?)([^\s;])\s*\n/g, '$1 = $2$3;\n'); // Add missing semicolons

      return fixedCode;
    }

    if (errorMessage.includes('undefined') || errorMessage.includes('is not defined')) {
      // Add variable declarations for potentially undefined variables
      return `// Attempted fix for undefined variable error
// You may need to define variables properly
${code}`;
    }

    // For other errors, return the original code with a comment
    return `// Attempted to fix the following error:
// ${errorMessage}
// Automatic fixes without AI assistance are limited.
// Consider checking for:
// - Proper variable declarations
// - Correct function parameters
// - Proper error handling
// - Type checking

${code}`;
  }

  /**
   * Recommend improvements for code
   */
  async recommendImprovement(code: string): Promise<string> {
    // Create a context with system prompt
    const context: MessageContext = {
      recentMessages: [
        {
          id: '1',
          role: 'system',
          content: `You are an expert code reviewer specializing in property assessment and valuation software.
        Analyze the provided code and suggest improvements in terms of:
        1. Performance optimization
        2. Readability and maintainability
        3. Assessment industry best practices
        4. Security considerations
        5. Edge case handling relevant to property data
        Provide specific, actionable recommendations with examples where appropriate.`,
          timestamp: Date.now(),
        },
      ],
    };

    const promptMessage = `Review this code and suggest improvements specific to assessment software:\n\`\`\`\n${code}\n\`\`\``;
    const providers = this.aiAssistantService.getAvailableProviders();

    if (providers.length === 0) {
      // Return basic recommendations if no AI providers
      return `# Code Review: Improvement Recommendations

## General Observations
This code appears to be related to property assessment calculations. Without AI assistance, a limited review is provided.

## Potential Improvements
1. **Performance**: Consider caching frequently used values to improve calculation speed.
2. **Readability**: Add more descriptive comments explaining assessment-specific concepts.
3. **Best Practices**: Ensure all property values are validated before use in calculations.
4. **Security**: Validate and sanitize all user inputs to prevent injection attacks.
5. **Edge Cases**: Add handling for missing or zero values to prevent calculation errors.

For a more detailed analysis, please try again when AI services are available.`;
    }

    for (const provider of providers) {
      try {
        const response = await this.aiAssistantService.generateResponse({
          message: promptMessage,
          context: context,
          provider: provider,
          options: {
            temperature: 0.6,
            maxTokens: 1500,
          },
        });

        return response.message;
      } catch (error) {
        console.error(`Error recommending improvements with provider ${provider}:`, error);
        // Continue to next provider
      }
    }

    // If all providers failed, return basic recommendations
    return `# Code Review: Improvement Recommendations

## General Observations
This code appears to be related to property assessment calculations. Without AI assistance, a limited review is provided.

## Potential Improvements
1. **Performance**: Consider caching frequently used values to improve calculation speed.
2. **Readability**: Add more descriptive comments explaining assessment-specific concepts.
3. **Best Practices**: Ensure all property values are validated before use in calculations.
4. **Security**: Validate and sanitize all user inputs to prevent injection attacks.
5. **Edge Cases**: Add handling for missing or zero values to prevent calculation errors.

For a more detailed analysis, please try again when AI services are available.`;
  }

  /**
   * Generate assessment-specific model code
   */
  async generateAssessmentModel(requirements: string): Promise<string> {
    // Create a context with system prompt
    const context: MessageContext = {
      recentMessages: [
        {
          id: '1',
          role: 'system',
          content: `You are an expert in CAMA (Computer Assisted Mass Appraisal) and assessment model development.
        Create high-quality, industry-standard code for property assessment models based on the provided requirements.
        Include appropriate statistical methods, valuation approaches (cost, market, income), and assessment-specific validation.
        Use assessment terminology correctly and implement industry best practices.
        The code should be well-documented with explanations of the valuation methodology.`,
          timestamp: Date.now(),
        },
      ],
    };

    const promptMessage = `Generate a property assessment model based on these requirements:\n${requirements}\n\nProvide the complete code with appropriate documentation.`;
    const providers = this.aiAssistantService.getAvailableProviders();

    if (providers.length === 0) {
      // Return a basic model implementation if no AI providers
      return this.generateBasicAssessmentModel(requirements);
    }

    for (const provider of providers) {
      try {
        const response = await this.aiAssistantService.generateResponse({
          message: promptMessage,
          context: context,
          provider: provider,
          options: {
            temperature: 0.4,
            maxTokens: 3000,
          },
        });

        // Extract code from response
        const codeRegex = /```(?:\w*\n)?([\s\S]*?)```/g;
        const match = codeRegex.exec(response.message);
        return match ? match[1].trim() : response.message;
      } catch (error) {
        console.error(`Error generating assessment model with provider ${provider}:`, error);
        // Continue to next provider
      }
    }

    // If all providers failed, return a basic model implementation
    return this.generateBasicAssessmentModel(requirements);
  }

  /**
   * Generate a basic assessment model based on common patterns
   * Used as fallback when AI providers are unavailable
   */
  private generateBasicAssessmentModel(requirements: string): string {
    // Analyze requirements to determine model type
    const isResidential =
      requirements.toLowerCase().includes('residential') ||
      requirements.toLowerCase().includes('house') ||
      requirements.toLowerCase().includes('home');

    const isCommercial =
      requirements.toLowerCase().includes('commercial') ||
      requirements.toLowerCase().includes('business') ||
      requirements.toLowerCase().includes('office');

    // Generate model based on property type
    if (isResidential) {
      return `/**
 * Basic Residential Property Assessment Model
 * 
 * This model provides a simplified implementation of residential property valuation
 * based on standard assessment methodologies including:
 * - Cost approach (replacement cost minus depreciation)
 * - Sales comparison with adjustments
 * - Basic attribute modifiers (location, condition, features)
 * 
 * Requirements considered:
 * ${requirements}
 */

class ResidentialAssessmentModel {
  constructor() {
    // Depreciation factors by age ranges
    this.depreciationTable = {
      '0-5': 0.05,
      '6-10': 0.10,
      '11-20': 0.20,
      '21-30': 0.30,
      '31-40': 0.40,
      '41+': 0.50
    };
    
    // Location factors by neighborhood classification
    this.locationFactors = {
      'premium': 1.3,
      'desirable': 1.1,
      'average': 1.0,
      'below-average': 0.9,
      'challenged': 0.7
    };
    
    // Base construction costs per square foot
    this.baseCostPerSqFt = 150;
  }
  
  /**
   * Calculate property value using cost approach
   */
  calculateCostApproachValue(property) {
    // Calculate replacement cost new
    const replacementCost = property.squareFootage * this.baseCostPerSqFt;
    
    // Calculate effective age and depreciation
    const ageGroup = this.determineAgeGroup(property.yearBuilt);
    const depreciationRate = this.depreciationTable[ageGroup];
    const depreciation = replacementCost * depreciationRate;
    
    // Calculate improvement value
    const improvementValue = replacementCost - depreciation;
    
    // Add land value
    const totalValue = improvementValue + property.landValue;
    
    // Apply location factor
    const locationFactor = this.locationFactors[property.neighborhood] || 1.0;
    
    return totalValue * locationFactor;
  }
  
  /**
   * Determine age group for depreciation lookup
   */
  determineAgeGroup(yearBuilt) {
    const currentYear = new Date().getFullYear();
    const age = currentYear - yearBuilt;
    
    if (age <= 5) return '0-5';
    if (age <= 10) return '6-10';
    if (age <= 20) return '11-20';
    if (age <= 30) return '21-30';
    if (age <= 40) return '31-40';
    return '41+';
  }
  
  /**
   * Calculate property value using comparable sales
   */
  calculateMarketValue(property, comparableSales) {
    if (!comparableSales || comparableSales.length === 0) {
      return this.calculateCostApproachValue(property);
    }
    
    // Calculate adjusted values of comparable properties
    const adjustedValues = comparableSales.map(comp => {
      let adjustedValue = comp.salePrice;
      
      // Adjust for square footage differences
      const sqFtDiff = property.squareFootage - comp.squareFootage;
      adjustedValue += sqFtDiff * 100; // $100 per sq ft adjustment
      
      // Adjust for lot size differences
      const lotSizeDiff = property.lotSize - comp.lotSize;
      adjustedValue += lotSizeDiff * 10; // $10 per sq ft of lot adjustment
      
      // Adjust for age differences
      const ageDiff = (comp.yearBuilt - property.yearBuilt);
      adjustedValue += ageDiff * 1000; // $1000 per year of age difference
      
      // Adjust for differences in features
      if (property.hasGarage && !comp.hasGarage) adjustedValue += 20000;
      if (!property.hasGarage && comp.hasGarage) adjustedValue -= 20000;
      
      // Location adjustments
      if (property.neighborhood !== comp.neighborhood) {
        const propertyFactor = this.locationFactors[property.neighborhood] || 1.0;
        const compFactor = this.locationFactors[comp.neighborhood] || 1.0;
        const percentDiff = (propertyFactor - compFactor) * 100;
        adjustedValue += (adjustedValue * percentDiff / 100);
      }
      
      return adjustedValue;
    });
    
    // Calculate median of adjusted comparable values
    adjustedValues.sort((a, b) => a - b);
    const medianIndex = Math.floor(adjustedValues.length / 2);
    return adjustedValues.length % 2 === 0
      ? (adjustedValues[medianIndex - 1] + adjustedValues[medianIndex]) / 2
      : adjustedValues[medianIndex];
  }
  
  /**
   * Generate final assessment value by reconciling different approaches
   */
  generateAssessment(property, comparableSales = []) {
    const costValue = this.calculateCostApproachValue(property);
    const marketValue = this.calculateMarketValue(property, comparableSales);
    
    // Reconcile values (weighted average)
    let finalValue;
    
    if (comparableSales.length >= 3) {
      // With sufficient comparables, weight market value higher
      finalValue = (marketValue * 0.7) + (costValue * 0.3);
    } else if (comparableSales.length > 0) {
      // With few comparables, equal weight
      finalValue = (marketValue * 0.5) + (costValue * 0.5);
    } else {
      // Without comparables, rely on cost approach
      finalValue = costValue;
    }
    
    return {
      propertyId: property.id,
      assessedValue: Math.round(finalValue),
      landValue: property.landValue,
      improvementValue: Math.round(finalValue - property.landValue),
      methodologyNotes: comparableSales.length > 0 
        ? 'Hybrid: Cost and Market Comparison' 
        : 'Cost Approach',
      assessmentDate: new Date(),
      comparablesUsed: comparableSales.length
    };
  }
}

module.exports = ResidentialAssessmentModel;`;
    } else if (isCommercial) {
      return `/**
 * Basic Commercial Property Assessment Model
 * 
 * This model provides a simplified implementation of commercial property valuation
 * based on standard assessment methodologies including:
 * - Income approach (capitalized NOI)
 * - Cost approach with commercial adjustments
 * - Market comparable analysis
 * 
 * Requirements considered:
 * ${requirements}
 */

class CommercialAssessmentModel {
  constructor() {
    // Cap rates by property class
    this.capRates = {
      'A': 0.05,  // Class A: 5%
      'B': 0.06,  // Class B: 6%
      'C': 0.075, // Class C: 7.5%
      'D': 0.09   // Class D: 9%
    };
    
    // Base construction costs per square foot by building type
    this.baseCostPerSqFt = {
      'office': 200,
      'retail': 175,
      'industrial': 100,
      'warehouse': 80,
      'mixed-use': 160
    };
    
    // Market rent estimates per square foot by building type and class
    this.marketRentEstimates = {
      'office': {
        'A': 32,
        'B': 25,
        'C': 18,
        'D': 14
      },
      'retail': {
        'A': 28,
        'B': 22,
        'C': 16,
        'D': 12
      },
      'industrial': {
        'A': 12,
        'B': 9,
        'C': 7,
        'D': 5
      },
      'warehouse': {
        'A': 10,
        'B': 8,
        'C': 6,
        'D': 4
      },
      'mixed-use': {
        'A': 26,
        'B': 20,
        'C': 15,
        'D': 11
      }
    };
    
    // Expense ratios by property type
    this.expenseRatios = {
      'office': 0.45,
      'retail': 0.35,
      'industrial': 0.30,
      'warehouse': 0.25,
      'mixed-use': 0.40
    };
    
    // Depreciation tables
    this.depreciationRates = {
      '0-5': 0.03,
      '6-10': 0.06,
      '11-15': 0.1,
      '16-20': 0.15,
      '21-30': 0.25,
      '31-40': 0.35,
      '41+': 0.45
    };
  }
  
  /**
   * Calculate property value using income approach
   */
  calculateIncomeValue(property) {
    // Determine potential gross income
    const buildingType = property.buildingType || 'office';
    const buildingClass = property.buildingClass || 'B';
    
    const marketRentPerSqFt = this.marketRentEstimates[buildingType]?.[buildingClass] || 
                              this.marketRentEstimates['office']['B'];
    
    const potentialGrossIncome = property.rentableSqFt * marketRentPerSqFt;
    
    // Apply vacancy rate
    const vacancy = potentialGrossIncome * (property.vacancyRate || 0.05);
    const effectiveGrossIncome = potentialGrossIncome - vacancy;
    
    // Apply expense ratio
    const expenseRatio = this.expenseRatios[buildingType] || 0.4;
    const operatingExpenses = effectiveGrossIncome * expenseRatio;
    
    // Calculate net operating income
    const netOperatingIncome = effectiveGrossIncome - operatingExpenses;
    
    // Apply capitalization rate
    const capRate = this.capRates[buildingClass] || 0.06;
    
    // Final value using direct capitalization
    return netOperatingIncome / capRate;
  }
  
  /**
   * Calculate property value using cost approach
   */
  calculateCostValue(property) {
    // Determine base cost per square foot
    const buildingType = property.buildingType || 'office';
    const baseCost = this.baseCostPerSqFt[buildingType] || 175;
    
    // Calculate replacement cost new
    const replacementCost = property.buildingSize * baseCost;
    
    // Apply physical depreciation
    const ageGroup = this.determineAgeGroup(property.yearBuilt);
    const depreciationRate = this.depreciationRates[ageGroup];
    const physicalDepreciation = replacementCost * depreciationRate;
    
    // Apply functional obsolescence (if any)
    const functionalObsolescence = (property.functionalObsolescenceRate || 0) * replacementCost;
    
    // Apply external obsolescence (if any)
    const externalObsolescence = (property.externalObsolescenceRate || 0) * replacementCost;
    
    // Calculate total depreciation
    const totalDepreciation = physicalDepreciation + functionalObsolescence + externalObsolescence;
    
    // Calculate improvement value
    const improvementValue = replacementCost - totalDepreciation;
    
    // Add land value
    return improvementValue + property.landValue;
  }
  
  /**
   * Determine age group for depreciation lookup
   */
  determineAgeGroup(yearBuilt) {
    const currentYear = new Date().getFullYear();
    const age = currentYear - yearBuilt;
    
    if (age <= 5) return '0-5';
    if (age <= 10) return '6-10';
    if (age <= 15) return '11-15';
    if (age <= 20) return '16-20';
    if (age <= 30) return '21-30';
    if (age <= 40) return '31-40';
    return '41+';
  }
  
  /**
   * Calculate property value using market comparable approach
   */
  calculateMarketValue(property, comparableSales) {
    if (!comparableSales || comparableSales.length === 0) {
      return null; // No comparables available
    }
    
    // Calculate price per square foot for each comparable
    const adjustedPricesPerSqFt = comparableSales.map(comp => {
      let pricePerSqFt = comp.salePrice / comp.buildingSize;
      
      // Adjust for building class differences
      const buildingClass = property.buildingClass || 'B';
      const compClass = comp.buildingClass || 'B';
      
      if (buildingClass !== compClass) {
        const propertyCapRate = this.capRates[buildingClass] || 0.06;
        const compCapRate = this.capRates[compClass] || 0.06;
        // Inverse relationship: higher cap rate = lower value
        const capRateAdjustment = (compCapRate - propertyCapRate) / compCapRate;
        pricePerSqFt *= (1 + capRateAdjustment);
      }
      
      // Adjust for location
      if (property.location !== comp.location) {
        // Simplified location adjustment
        pricePerSqFt *= (property.locationFactor || 1.0) / (comp.locationFactor || 1.0);
      }
      
      // Adjust for building age
      const ageDiff = (comp.yearBuilt - property.yearBuilt);
      const ageAdjustment = ageDiff * 0.005; // 0.5% per year
      pricePerSqFt *= (1 + ageAdjustment);
      
      return pricePerSqFt;
    });
    
    // Calculate median price per square foot
    adjustedPricesPerSqFt.sort((a, b) => a - b);
    const medianIndex = Math.floor(adjustedPricesPerSqFt.length / 2);
    const medianPricePerSqFt = adjustedPricesPerSqFt.length % 2 === 0
      ? (adjustedPricesPerSqFt[medianIndex - 1] + adjustedPricesPerSqFt[medianIndex]) / 2
      : adjustedPricesPerSqFt[medianIndex];
    
    // Apply median price per square foot to subject property
    return medianPricePerSqFt * property.buildingSize;
  }
  
  /**
   * Generate final assessment value by reconciling different approaches
   */
  generateAssessment(property, comparableSales = []) {
    const incomeValue = this.calculateIncomeValue(property);
    const costValue = this.calculateCostValue(property);
    const marketValue = this.calculateMarketValue(property, comparableSales);
    
    // Reconcile values with appropriate weights
    let finalValue;
    let methodologyNotes = '';
    
    if (marketValue && comparableSales.length >= 3) {
      // With sufficient comparables
      if (property.buildingType === 'office' || property.buildingType === 'retail') {
        // For office and retail, income approach is most reliable
        finalValue = (incomeValue * 0.6) + (marketValue * 0.3) + (costValue * 0.1);
        methodologyNotes = 'Primary: Income Approach (60%), Secondary: Market Comparison (30%), Cost Approach (10%)';
      } else if (property.buildingType === 'industrial' || property.buildingType === 'warehouse') {
        // For industrial and warehouse, cost and market approaches are more reliable
        finalValue = (costValue * 0.5) + (marketValue * 0.3) + (incomeValue * 0.2);
        methodologyNotes = 'Primary: Cost Approach (50%), Secondary: Market Comparison (30%), Income Approach (20%)';
      } else {
        // Mixed-use and others
        finalValue = (incomeValue * 0.4) + (costValue * 0.3) + (marketValue * 0.3);
        methodologyNotes = 'Balanced: Income Approach (40%), Cost Approach (30%), Market Comparison (30%)';
      }
    } else if (marketValue) {
      // With limited comparables
      finalValue = (incomeValue * 0.6) + (costValue * 0.3) + (marketValue * 0.1);
      methodologyNotes = 'Primary: Income Approach (60%), Secondary: Cost Approach (30%), Limited Market Data (10%)';
    } else {
      // Without market comparables
      finalValue = (incomeValue * 0.7) + (costValue * 0.3);
      methodologyNotes = 'Primary: Income Approach (70%), Secondary: Cost Approach (30%), No Market Data';
    }
    
    return {
      propertyId: property.id,
      assessedValue: Math.round(finalValue),
      landValue: property.landValue,
      improvementValue: Math.round(finalValue - property.landValue),
      methodologyNotes: methodologyNotes,
      incomeApproachValue: Math.round(incomeValue),
      costApproachValue: Math.round(costValue),
      marketApproachValue: marketValue ? Math.round(marketValue) : null,
      capRate: this.capRates[property.buildingClass || 'B'],
      assessmentDate: new Date(),
      buildingType: property.buildingType,
      buildingClass: property.buildingClass,
      comparablesUsed: comparableSales.length
    };
  }
}

module.exports = CommercialAssessmentModel;`;
    } else {
      // Generic model if property type not detected
      return `/**
 * Generic Property Assessment Model
 * 
 * This model provides a simplified implementation of property valuation
 * that can be applied to various property types. It includes:
 * - Basic cost approach
 * - Simple market comparisons
 * - Attribute-based adjustments
 * 
 * Requirements considered:
 * ${requirements}
 */

class PropertyAssessmentModel {
  constructor() {
    // Base settings
    this.baseCostPerSqFt = 150;
    this.landValuePerAcre = 100000;
    this.depreciationPerYear = 0.01; // 1% per year
    this.maxDepreciation = 0.7;      // Max 70% depreciation
    
    // Location factors
    this.locationFactors = {
      'urban': 1.3,
      'suburban': 1.0,
      'rural': 0.7
    };
    
    // Property type factors
    this.propertyTypeFactors = {
      'residential': 1.0,
      'commercial': 1.2,
      'industrial': 0.9,
      'agricultural': 0.5,
      'mixed-use': 1.1
    };
  }
  
  /**
   * Calculate property value using basic cost approach
   */
  calculateValue(property) {
    // Calculate improvement value
    const improvementValue = this.calculateImprovementValue(property);
    
    // Calculate land value
    const landValue = this.calculateLandValue(property);
    
    // Combine values
    let totalValue = improvementValue + landValue;
    
    // Apply location factor
    const locationFactor = this.locationFactors[property.location] || 1.0;
    totalValue *= locationFactor;
    
    // Apply property type factor
    const propertyTypeFactor = this.propertyTypeFactors[property.type] || 1.0;
    totalValue *= propertyTypeFactor;
    
    return totalValue;
  }
  
  /**
   * Calculate improvement value with depreciation
   */
  calculateImprovementValue(property) {
    // Calculate replacement cost new
    const replacementCost = property.squareFootage * this.baseCostPerSqFt;
    
    // Calculate depreciation based on age
    const currentYear = new Date().getFullYear();
    const age = currentYear - (property.yearBuilt || currentYear);
    const depreciationRate = Math.min(age * this.depreciationPerYear, this.maxDepreciation);
    
    // Apply depreciation
    return replacementCost * (1 - depreciationRate);
  }
  
  /**
   * Calculate land value
   */
  calculateLandValue(property) {
    return (property.acreage || 0.25) * this.landValuePerAcre;
  }
  
  /**
   * Adjust value based on comparable sales
   */
  adjustValueWithComparables(baseValue, property, comparableSales) {
    if (!comparableSales || comparableSales.length === 0) {
      return baseValue;
    }
    
    // Calculate average price per square foot from comparables
    let totalPricePerSqFt = 0;
    for (const comp of comparableSales) {
      const pricePerSqFt = comp.salePrice / comp.squareFootage;
      totalPricePerSqFt += pricePerSqFt;
    }
    
    const avgPricePerSqFt = totalPricePerSqFt / comparableSales.length;
    const marketBasedValue = avgPricePerSqFt * property.squareFootage;
    
    // Blend cost-based and market-based values
    return (baseValue + marketBasedValue) / 2;
  }
  
  /**
   * Generate final assessment
   */
  generateAssessment(property, comparableSales = []) {
    // Calculate base value using cost approach
    const baseValue = this.calculateValue(property);
    
    // Adjust with comparable sales if available
    const finalValue = this.adjustValueWithComparables(baseValue, property, comparableSales);
    
    return {
      propertyId: property.id,
      assessedValue: Math.round(finalValue),
      landValue: this.calculateLandValue(property),
      improvementValue: Math.round(finalValue - this.calculateLandValue(property)),
      methodologyNotes: comparableSales.length > 0 
        ? 'Hybrid: Cost and Market Comparison' 
        : 'Cost Approach Only',
      assessmentDate: new Date(),
      propertyType: property.type || 'general',
      location: property.location || 'suburban',
      comparablesUsed: comparableSales.length
    };
  }
}

module.exports = PropertyAssessmentModel;`;
    }
  }
}

// Create and export the instance
let aiCodeAssistant: AICodeAssistant;

export function initializeAICodeAssistant(aiAssistantService: AIAssistantService): AICodeAssistant {
  aiCodeAssistant = new AICodeAssistant(aiAssistantService);
  return aiCodeAssistant;
}

export function getAICodeAssistant(): AICodeAssistant {
  if (!aiCodeAssistant) {
    throw new Error('AI Code Assistant not initialized');
  }
  return aiCodeAssistant;
}

export default aiCodeAssistant;
