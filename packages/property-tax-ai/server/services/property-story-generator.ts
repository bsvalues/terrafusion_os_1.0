/**
 * Property Story Generator
 * 
 * This service generates human-readable narratives about properties based on their assessment data.
 * It integrates with OpenAI to perform natural language generation and falls back to template-based
 * approaches if AI generation fails.
 */

import { IStorage } from "../storage";
import { openaiService, OpenAIErrorType } from "./openai-service";
import { anthropicService, AnthropicErrorType } from "./anthropic-service";
import { perplexityService, PerplexityErrorType } from "./perplexity-service";

// Property Story Generator Options
export interface PropertyStoryOptions {
  format?: 'simple' | 'detailed' | 'summary';
  includeValuation?: boolean;
  includeImprovements?: boolean;
  includeLandRecords?: boolean;
  includeAppeals?: boolean;
  yearBuiltRange?: { min: number; max: number; };
  valueRange?: { min: number; max: number; };
  propertyTypes?: string[];
  focus?: 'market' | 'improvements' | 'historical' | 'appeals';
  aiProvider?: 'openai' | 'anthropic' | 'perplexity' | 'template';
  maxLength?: number;
}

/**
 * Property Story Generator Service
 * 
 * Generates narrative descriptions of properties based on assessment data
 */
export class PropertyStoryGenerator {
  constructor(private storage: IStorage) {}

  /**
   * Generate a property story
   * 
   * @param propertyId The ID of the property
   * @param options Options for story generation
   * @returns A narrative description of the property
   */
  async generatePropertyStory(propertyId: string, options: PropertyStoryOptions = {}): Promise<string> {
    try {
      // Get property data
      const property = await this.storage.getPropertyByPropertyId(propertyId);
      
      if (!property) {
        throw new Error(`Property not found: ${propertyId}`);
      }
      
      // Get related data if needed
      let improvements: any[] = [];
      let landRecords: any[] = [];
      let appeals: any[] = [];
      
      if (options.includeImprovements) {
        improvements = await this.storage.getImprovementsByPropertyId(propertyId);
      }
      
      if (options.includeLandRecords) {
        landRecords = await this.storage.getLandRecordsByPropertyId(propertyId);
      }
      
      if (options.includeAppeals) {
        appeals = await this.storage.getAppealsByPropertyId(propertyId);
      }
      
      // Default to OpenAI unless otherwise specified
      const aiProvider = options.aiProvider || 'openai';
      
      // Generate the story based on selected AI provider
      if (aiProvider === 'openai') {
        return this.generateWithOpenAI(property, improvements, landRecords, appeals, options);
      } else if (aiProvider === 'anthropic') {
        return this.generateWithAnthropic(property, improvements, landRecords, appeals, options);
      } else if (aiProvider === 'perplexity') {
        return this.generateWithPerplexity(property, improvements, landRecords, appeals, options);
      } else {
        // Use template-based generation for 'template' option or fallback
        return this.generateWithTemplate(property, improvements, landRecords, appeals, options);
      }
    } catch (error) {
      console.error("Error generating property story:", error);
      return this.generateErrorMessage(error);
    }
  }
  
  /**
   * Generate stories for multiple properties
   * 
   * @param propertyIds Array of property IDs
   * @param options Options for story generation
   * @returns Object mapping property IDs to their stories
   */
  async generateMultiplePropertyStories(propertyIds: string[], options: PropertyStoryOptions = {}): Promise<Record<string, string>> {
    const results: Record<string, string> = {};
    
    await Promise.all(
      propertyIds.map(async (propertyId) => {
        try {
          const story = await this.generatePropertyStory(propertyId, options);
          results[propertyId] = story;
        } catch (error) {
          console.error(`Error generating story for property ${propertyId}:`, error);
          results[propertyId] = this.generateErrorMessage(error);
        }
      })
    );
    
    return results;
  }
  
  /**
   * Generate a comparison between properties
   * 
   * @param propertyIds Array of property IDs to compare
   * @param options Options for story generation
   * @returns A narrative comparison of the properties
   */
  async generatePropertyComparison(propertyIds: string[], options: PropertyStoryOptions = {}): Promise<string> {
    try {
      // Get property data for all properties
      const properties = await Promise.all(
        propertyIds.map(async (propertyId) => {
          const property = await this.storage.getPropertyByPropertyId(propertyId);
          
          if (!property) {
            throw new Error(`Property not found: ${propertyId}`);
          }
          
          return property;
        })
      );
      
      if (properties.length < 2) {
        throw new Error("At least two valid properties are required for comparison");
      }
      
      // Default to OpenAI unless otherwise specified
      const aiProvider = options.aiProvider || 'openai';
      
      // Generate the comparison based on selected AI provider
      if (aiProvider === 'openai') {
        return this.generateComparisonWithOpenAI(properties, options);
      } else if (aiProvider === 'anthropic') {
        return this.generateComparisonWithAnthropic(properties, options);
      } else if (aiProvider === 'perplexity') {
        return this.generateComparisonWithPerplexity(properties, options);
      } else {
        // Use template-based generation for 'template' option or fallback
        return this.generateComparisonWithTemplate(properties, options);
      }
    } catch (error) {
      console.error("Error generating property comparison:", error);
      return this.generateErrorMessage(error);
    }
  }
  
  /**
   * Generate a property story using OpenAI
   */
  private async generateWithOpenAI(property: any, improvements: any[], landRecords: any[], appeals: any[], options: PropertyStoryOptions): Promise<string> {
    try {
      // Create context object with all the data
      const context = {
        property,
        improvements: improvements || [],
        landRecords: landRecords || [],
        appeals: appeals || [],
        options
      };
      
      // Build the prompt based on the data and options
      const format = options.format || 'detailed';
      const focus = options.focus || 'market';
      
      let promptContent = `Generate a ${format} description of the following property:\n\n`;
      promptContent += `Property ID: ${property.propertyId}\n`;
      promptContent += `Address: ${property.address}\n`;
      promptContent += `Type: ${property.propertyType}\n`;
      
      if (property.assessedValue || property.value) {
        const value = property.assessedValue || property.value;
        promptContent += `Assessment: $${value ? value.toLocaleString() : 'Not available'}\n`;
      }
      
      if (property.landArea || property.acres) {
        const area = property.landArea || property.acres;
        const unit = property.landAreaUnit || 'acres';
        promptContent += `Land Area: ${area} ${unit}\n`;
      }
      
      if (improvements && improvements.length > 0) {
        promptContent += "\nImprovements:\n";
        improvements.forEach((imp, index) => {
          promptContent += `${index + 1}. ${imp.improvementType} (${imp.yearBuilt}): ${imp.description || ''}, ${imp.area} sq ft\n`;
        });
      }
      
      if (landRecords && landRecords.length > 0) {
        promptContent += "\nLand Records:\n";
        landRecords.forEach((record, index) => {
          promptContent += `${index + 1}. Zone: ${record.zoneType}, Land Use: ${record.landUse}\n`;
        });
      }
      
      if (appeals && appeals.length > 0) {
        promptContent += "\nAppeals History:\n";
        appeals.forEach((appeal, index) => {
          promptContent += `${index + 1}. Filed: ${appeal.filingDate}, Status: ${appeal.status}, Reason: ${appeal.reason}\n`;
        });
      }
      
      promptContent += `\nFocus the description on ${focus} aspects. Be objective and factual while maintaining readability.`;
      
      // Call OpenAI service
      const systemPrompt = "You are an expert property assessor and real estate analyst. Write informative, factual, and objective descriptions of properties based on assessment data.";
      
      try {
        const generatedText = await openaiService.generateText(
          promptContent,
          systemPrompt,
          options.maxLength || 1000
        );
        
        return generatedText;
      } catch (openaiError: any) {
        // Check if this is a rate limit or quota exceeded error
        if (openaiService.isRateLimitError(openaiError)) {
          console.warn(`OpenAI API rate limit reached for property ${property.propertyId}, using fallback template generation.`);
          return this.generateWithTemplate(property, improvements, landRecords, appeals, options);
        }
        
        // Get detailed error information
        const errorDetails = openaiService.getErrorDetails(openaiError);
        console.error(`OpenAI API error (${errorDetails.type}) for property ${property.propertyId}: ${errorDetails.message}`);
        
        // Only use template fallback for specific error types
        if (errorDetails.type === OpenAIErrorType.RATE_LIMIT || 
            errorDetails.type === OpenAIErrorType.QUOTA_EXCEEDED ||
            errorDetails.type === OpenAIErrorType.SERVER_ERROR) {
          return this.generateWithTemplate(property, improvements, landRecords, appeals, options);
        }
        
        // For other error types, rethrow to be handled by the caller
        throw new Error(`Failed to generate property story: ${errorDetails.message}`);
      }
    } catch (error) {
      console.error("Error in property story generation:", error);
      // Fall back to template generation on any other error
      return this.generateWithTemplate(property, improvements, landRecords, appeals, options);
    }
  }
  
  /**
   * Generate a property comparison using OpenAI
   */
  private async generateComparisonWithOpenAI(properties: any[], options: PropertyStoryOptions): Promise<string> {
    try {
      // Build the comparison prompt
      let promptContent = `Compare and contrast the following ${properties.length} properties:\n\n`;
      
      properties.forEach((property, index) => {
        promptContent += `Property ${index + 1}:\n`;
        promptContent += `Property ID: ${property.propertyId}\n`;
        promptContent += `Address: ${property.address}\n`;
        promptContent += `Type: ${property.propertyType}\n`;
        
        if (property.assessedValue || property.value) {
          const value = property.assessedValue || property.value;
          promptContent += `Assessment: $${value ? value.toLocaleString() : 'Not available'}\n`;
        }
        
        if (property.landArea || property.acres) {
          const area = property.landArea || property.acres;
          const unit = property.landAreaUnit || 'acres';
          promptContent += `Land Area: ${area} ${unit}\n`;
        }
        
        promptContent += `\n`;
      });
      
      promptContent += `\nFocus on highlighting the key similarities and differences between these properties in terms of value, location, and characteristics. Provide insights on their relative market positions.`;
      
      // Call OpenAI service
      const systemPrompt = "You are an expert property assessor and real estate analyst. Write informative, factual, and objective comparisons of properties based on assessment data.";
      
      try {
        const generatedText = await openaiService.generateText(
          promptContent,
          systemPrompt,
          options.maxLength || 1500
        );
        
        return generatedText;
      } catch (openaiError: any) {
        // Check if this is a rate limit or quota exceeded error
        if (openaiService.isRateLimitError(openaiError)) {
          const propertyIds = properties.map(p => p.propertyId).join(', ');
          console.warn(`OpenAI API rate limit reached for property comparison [${propertyIds}], using fallback template generation.`);
          return this.generateComparisonWithTemplate(properties, options);
        }
        
        // Get detailed error information
        const errorDetails = openaiService.getErrorDetails(openaiError);
        console.error(`OpenAI API error (${errorDetails.type}) for property comparison: ${errorDetails.message}`);
        
        // Only use template fallback for specific error types
        if (errorDetails.type === OpenAIErrorType.RATE_LIMIT || 
            errorDetails.type === OpenAIErrorType.QUOTA_EXCEEDED ||
            errorDetails.type === OpenAIErrorType.SERVER_ERROR) {
          return this.generateComparisonWithTemplate(properties, options);
        }
        
        // For other error types, rethrow to be handled by the caller
        throw new Error(`Failed to generate property comparison: ${errorDetails.message}`);
      }
    } catch (error) {
      console.error("Error in property comparison generation:", error);
      // Fall back to template generation on any other error
      return this.generateComparisonWithTemplate(properties, options);
    }
  }
  
  /**
   * Generate a property story using templates
   * This is a fallback method if AI generation fails
   */
  private generateWithTemplate(property: any, improvements: any[], landRecords: any[], appeals: any[], options: PropertyStoryOptions): string {
    const format = options.format || 'detailed';
    
    let story = "";
    
    // Introduction
    story += `Property Assessment: ${property.propertyId}\n\n`;
    story += `This ${property.propertyType} property is located at ${property.address}. `;
    
    if (property.assessedValue || property.value) {
      const value = property.assessedValue || property.value;
      story += `It has a current assessed value of $${value ? value.toLocaleString() : 'Not available'} `;
    }
    
    if (property.landArea || property.acres) {
      const area = property.landArea || property.acres;
      const unit = property.landAreaUnit || 'acres';
      story += `and comprises ${area} ${unit} of land. `;
    }
    
    // Add improvements if available
    if (improvements && improvements.length > 0 && options.includeImprovements) {
      story += `\n\nImprovements include: `;
      improvements.forEach((imp, index) => {
        if (index > 0) story += ", ";
        story += `a ${imp.improvementType} built in ${imp.yearBuilt} with ${imp.area} sq ft`;
      });
      story += ".";
    }
    
    // Add land records if available
    if (landRecords && landRecords.length > 0 && options.includeLandRecords) {
      story += `\n\nThe land is zoned as ${landRecords[0].zoneType} with primary use classified as ${landRecords[0].landUse}.`;
    }
    
    // Add appeals if available
    if (appeals && appeals.length > 0 && options.includeAppeals) {
      story += `\n\nThis property has ${appeals.length} assessment appeal(s) on record. `;
      if (appeals.length === 1) {
        story += `The appeal was filed on ${appeals[0].filingDate} with status "${appeals[0].status}" citing "${appeals[0].reason}".`;
      } else {
        story += `The most recent appeal was filed on ${appeals[0].filingDate} with status "${appeals[0].status}".`;
      }
    }
    
    // Add conclusion based on format
    if (format === 'detailed') {
      if (property.lastAssessmentDate) {
        story += `\n\nThe property was last assessed on ${property.lastAssessmentDate}. `;
      }
      if (property.assessmentTrend) {
        story += `Its assessment history shows a ${property.assessmentTrend} trend over the past assessment cycle.`;
      }
    } else if (format === 'summary') {
      story += `\n\nIn summary, this is a ${property.propertyType} property`;
      if (property.assessedValue || property.value) {
        const value = property.assessedValue || property.value;
        story += ` valued at $${value ? value.toLocaleString() : 'Not available'}`;
      }
      story += `.`;
    }
    
    return story;
  }
  
  /**
   * Generate a property comparison using templates
   * This is a fallback method if AI generation fails
   */
  private generateComparisonWithTemplate(properties: any[], options: PropertyStoryOptions): string {
    let comparison = "Property Comparison\n\n";
    
    // Add a summary of the properties
    comparison += `Comparing ${properties.length} properties:\n`;
    properties.forEach((property, index) => {
      comparison += `\n${index + 1}. ${property.propertyId}: ${property.address} (${property.propertyType})\n`;
      
      if (property.assessedValue || property.value) {
        const value = property.assessedValue || property.value;
        comparison += `   Assessed Value: $${value ? value.toLocaleString() : 'Not available'}\n`;
      }
      
      if (property.landArea || property.acres) {
        const area = property.landArea || property.acres;
        const unit = property.landAreaUnit || 'acres';
        comparison += `   Land Area: ${area} ${unit}\n`;
      }
    });
    
    // Add value comparison if all properties have values
    const propertiesWithValues = properties.filter(p => p.assessedValue || p.value);
    if (propertiesWithValues.length > 1) {
      // Transform properties to use a consistent value field
      const normalizedProperties = propertiesWithValues.map(p => ({
        ...p,
        normalizedValue: p.assessedValue || p.value || 0
      }));
      
      const sortedByValue = [...normalizedProperties].sort((a, b) => b.normalizedValue - a.normalizedValue);
      comparison += `\nValue Comparison:\n`;
      comparison += `- The highest valued property is ${sortedByValue[0].propertyId} at $${sortedByValue[0].normalizedValue.toLocaleString()}\n`;
      comparison += `- The lowest valued property is ${sortedByValue[sortedByValue.length - 1].propertyId} at $${sortedByValue[sortedByValue.length - 1].normalizedValue.toLocaleString()}\n`;
    }
    
    // Add land area comparison if all properties have land areas
    const propertiesWithAreas = properties.filter(p => p.landArea || p.acres);
    if (propertiesWithAreas.length > 1) {
      // Transform properties to use a consistent area field
      const normalizedProperties = propertiesWithAreas.map(p => ({
        ...p,
        normalizedArea: p.landArea || p.acres || 0,
        normalizedUnit: p.landAreaUnit || 'acres'
      }));
      
      const sortedByArea = [...normalizedProperties].sort((a, b) => b.normalizedArea - a.normalizedArea);
      comparison += `\nLand Area Comparison:\n`;
      comparison += `- The largest property is ${sortedByArea[0].propertyId} at ${sortedByArea[0].normalizedArea} ${sortedByArea[0].normalizedUnit}\n`;
      comparison += `- The smallest property is ${sortedByArea[sortedByArea.length - 1].propertyId} at ${sortedByArea[sortedByArea.length - 1].normalizedArea} ${sortedByArea[sortedByArea.length - 1].normalizedUnit}\n`;
    }
    
    // Add a simple conclusion
    comparison += `\nSummary: This comparison includes ${properties.filter(p => p.propertyType === 'residential').length} residential, `;
    comparison += `${properties.filter(p => p.propertyType === 'commercial').length} commercial, and `;
    comparison += `${properties.filter(p => !['residential', 'commercial'].includes(p.propertyType)).length} other property types.`;
    
    return comparison;
  }
  
  /**
   * Generate a property story using Anthropic's Claude
   */
  private async generateWithAnthropic(property: any, improvements: any[], landRecords: any[], appeals: any[], options: PropertyStoryOptions): Promise<string> {
    try {
      // Create context object with all the data
      const context = {
        property,
        improvements: improvements || [],
        landRecords: landRecords || [],
        appeals: appeals || [],
        options
      };
      
      // Build the prompt based on the data and options
      const format = options.format || 'detailed';
      const focus = options.focus || 'market';
      
      let promptContent = `Generate a ${format} description of the following property:\n\n`;
      promptContent += `Property ID: ${property.propertyId}\n`;
      promptContent += `Address: ${property.address}\n`;
      promptContent += `Type: ${property.propertyType}\n`;
      
      if (property.assessedValue || property.value) {
        const value = property.assessedValue || property.value;
        promptContent += `Assessment: $${value ? value.toLocaleString() : 'Not available'}\n`;
      }
      
      if (property.landArea || property.acres) {
        const area = property.landArea || property.acres;
        const unit = property.landAreaUnit || 'acres';
        promptContent += `Land Area: ${area} ${unit}\n`;
      }
      
      if (improvements && improvements.length > 0) {
        promptContent += "\nImprovements:\n";
        improvements.forEach((imp, index) => {
          promptContent += `${index + 1}. ${imp.improvementType} (${imp.yearBuilt}): ${imp.description || ''}, ${imp.area} sq ft\n`;
        });
      }
      
      if (landRecords && landRecords.length > 0) {
        promptContent += "\nLand Records:\n";
        landRecords.forEach((record, index) => {
          promptContent += `${index + 1}. Zone: ${record.zoneType}, Land Use: ${record.landUse}\n`;
        });
      }
      
      if (appeals && appeals.length > 0) {
        promptContent += "\nAppeals History:\n";
        appeals.forEach((appeal, index) => {
          promptContent += `${index + 1}. Filed: ${appeal.filingDate}, Status: ${appeal.status}, Reason: ${appeal.reason}\n`;
        });
      }
      
      promptContent += `\nFocus the description on ${focus} aspects. Be objective and factual while maintaining readability.`;
      
      // Call Anthropic service
      const systemPrompt = "You are Claude, an expert property assessor and real estate analyst. Write informative, factual, and objective descriptions of properties based on assessment data.";
      
      try {
        const generatedText = await anthropicService.generateText(
          promptContent,
          systemPrompt,
          options.maxLength || 1000
        );
        
        return generatedText;
      } catch (anthropicError: any) {
        // Check if this is a rate limit or quota exceeded error
        if (anthropicService.isRateLimitError(anthropicError)) {
          console.warn(`Anthropic API rate limit reached for property ${property.propertyId}, using fallback template generation.`);
          return this.generateWithTemplate(property, improvements, landRecords, appeals, options);
        }
        
        // Get detailed error information
        const errorDetails = anthropicService.getErrorDetails(anthropicError);
        console.error(`Anthropic API error (${errorDetails.type}) for property ${property.propertyId}: ${errorDetails.message}`);
        
        // Only use template fallback for specific error types
        if (errorDetails.type === AnthropicErrorType.RATE_LIMIT || 
            errorDetails.type === AnthropicErrorType.QUOTA_EXCEEDED ||
            errorDetails.type === AnthropicErrorType.SERVER_ERROR) {
          return this.generateWithTemplate(property, improvements, landRecords, appeals, options);
        }
        
        // For other error types, rethrow to be handled by the caller
        throw new Error(`Failed to generate property story: ${errorDetails.message}`);
      }
    } catch (error) {
      console.error("Error in property story generation with Anthropic:", error);
      // Fall back to template generation on any other error
      return this.generateWithTemplate(property, improvements, landRecords, appeals, options);
    }
  }
  
  /**
   * Generate a property comparison using Anthropic's Claude
   */
  private async generateComparisonWithAnthropic(properties: any[], options: PropertyStoryOptions): Promise<string> {
    try {
      // Build the comparison prompt
      let promptContent = `Compare and contrast the following ${properties.length} properties:\n\n`;
      
      properties.forEach((property, index) => {
        promptContent += `Property ${index + 1}:\n`;
        promptContent += `Property ID: ${property.propertyId}\n`;
        promptContent += `Address: ${property.address}\n`;
        promptContent += `Type: ${property.propertyType}\n`;
        
        if (property.assessedValue || property.value) {
          const value = property.assessedValue || property.value;
          promptContent += `Assessment: $${value ? value.toLocaleString() : 'Not available'}\n`;
        }
        
        if (property.landArea || property.acres) {
          const area = property.landArea || property.acres;
          const unit = property.landAreaUnit || 'acres';
          promptContent += `Land Area: ${area} ${unit}\n`;
        }
        
        promptContent += `\n`;
      });
      
      promptContent += `\nFocus on highlighting the key similarities and differences between these properties in terms of value, location, and characteristics. Provide insights on their relative market positions.`;
      
      // Call Anthropic service
      const systemPrompt = "You are Claude, an expert property assessor and real estate analyst. Write informative, factual, and objective comparisons of properties based on assessment data.";
      
      try {
        const generatedText = await anthropicService.generateText(
          promptContent,
          systemPrompt,
          options.maxLength || 1500
        );
        
        return generatedText;
      } catch (anthropicError: any) {
        // Check if this is a rate limit or quota exceeded error
        if (anthropicService.isRateLimitError(anthropicError)) {
          const propertyIds = properties.map(p => p.propertyId).join(', ');
          console.warn(`Anthropic API rate limit reached for property comparison [${propertyIds}], using fallback template generation.`);
          return this.generateComparisonWithTemplate(properties, options);
        }
        
        // Get detailed error information
        const errorDetails = anthropicService.getErrorDetails(anthropicError);
        console.error(`Anthropic API error (${errorDetails.type}) for property comparison: ${errorDetails.message}`);
        
        // Only use template fallback for specific error types
        if (errorDetails.type === AnthropicErrorType.RATE_LIMIT || 
            errorDetails.type === AnthropicErrorType.QUOTA_EXCEEDED ||
            errorDetails.type === AnthropicErrorType.SERVER_ERROR) {
          return this.generateComparisonWithTemplate(properties, options);
        }
        
        // For other error types, rethrow to be handled by the caller
        throw new Error(`Failed to generate property comparison: ${errorDetails.message}`);
      }
    } catch (error) {
      console.error("Error in property comparison generation with Anthropic:", error);
      // Fall back to template generation on any other error
      return this.generateComparisonWithTemplate(properties, options);
    }
  }
  
  /**
   * Generate a property story using Perplexity
   */
  private async generateWithPerplexity(property: any, improvements: any[], landRecords: any[], appeals: any[], options: PropertyStoryOptions): Promise<string> {
    try {
      // Create context object with all the data
      const context = {
        property,
        improvements: improvements || [],
        landRecords: landRecords || [],
        appeals: appeals || [],
        options
      };
      
      // Build the prompt based on the data and options
      const format = options.format || 'detailed';
      const focus = options.focus || 'market';
      
      let promptContent = `Generate a ${format} description of the following property:\n\n`;
      promptContent += `Property ID: ${property.propertyId}\n`;
      promptContent += `Address: ${property.address}\n`;
      promptContent += `Type: ${property.propertyType}\n`;
      
      if (property.assessedValue || property.value) {
        const value = property.assessedValue || property.value;
        promptContent += `Assessment: $${value ? value.toLocaleString() : 'Not available'}\n`;
      }
      
      if (property.landArea || property.acres) {
        const area = property.landArea || property.acres;
        const unit = property.landAreaUnit || 'acres';
        promptContent += `Land Area: ${area} ${unit}\n`;
      }
      
      if (improvements && improvements.length > 0) {
        promptContent += "\nImprovements:\n";
        improvements.forEach((imp, index) => {
          promptContent += `${index + 1}. ${imp.improvementType} (${imp.yearBuilt}): ${imp.description || ''}, ${imp.area} sq ft\n`;
        });
      }
      
      if (landRecords && landRecords.length > 0) {
        promptContent += "\nLand Records:\n";
        landRecords.forEach((record, index) => {
          promptContent += `${index + 1}. Zone: ${record.zoneType}, Land Use: ${record.landUse}\n`;
        });
      }
      
      if (appeals && appeals.length > 0) {
        promptContent += "\nAppeals History:\n";
        appeals.forEach((appeal, index) => {
          promptContent += `${index + 1}. Filed: ${appeal.filingDate}, Status: ${appeal.status}, Reason: ${appeal.reason}\n`;
        });
      }
      
      promptContent += `\nFocus the description on ${focus} aspects. Be objective and factual while maintaining readability.`;
      
      // Call Perplexity service
      const systemPrompt = "You are an expert property assessor and real estate analyst. Write informative, factual, and objective descriptions of properties based on assessment data.";
      
      try {
        const generatedText = await perplexityService.generateText(
          promptContent,
          systemPrompt,
          options.maxLength || 1000
        );
        
        return generatedText;
      } catch (perplexityError: any) {
        // Check if this is a rate limit or quota exceeded error
        if (perplexityService.isRateLimitError(perplexityError)) {
          console.warn(`Perplexity API rate limit reached for property ${property.propertyId}, using fallback template generation.`);
          return this.generateWithTemplate(property, improvements, landRecords, appeals, options);
        }
        
        // Get detailed error information
        const errorDetails = perplexityService.getErrorDetails(perplexityError);
        console.error(`Perplexity API error (${errorDetails.type}) for property ${property.propertyId}: ${errorDetails.message}`);
        
        // Only use template fallback for specific error types
        if (errorDetails.type === PerplexityErrorType.RATE_LIMIT || 
            errorDetails.type === PerplexityErrorType.QUOTA_EXCEEDED ||
            errorDetails.type === PerplexityErrorType.SERVER_ERROR) {
          return this.generateWithTemplate(property, improvements, landRecords, appeals, options);
        }
        
        // For other error types, rethrow to be handled by the caller
        throw new Error(`Failed to generate property story: ${errorDetails.message}`);
      }
    } catch (error) {
      console.error("Error in property story generation with Perplexity:", error);
      // Fall back to template generation on any other error
      return this.generateWithTemplate(property, improvements, landRecords, appeals, options);
    }
  }
  
  /**
   * Generate a property comparison using Perplexity
   */
  private async generateComparisonWithPerplexity(properties: any[], options: PropertyStoryOptions): Promise<string> {
    try {
      // Build the comparison prompt
      let promptContent = `Compare and contrast the following ${properties.length} properties:\n\n`;
      
      properties.forEach((property, index) => {
        promptContent += `Property ${index + 1}:\n`;
        promptContent += `Property ID: ${property.propertyId}\n`;
        promptContent += `Address: ${property.address}\n`;
        promptContent += `Type: ${property.propertyType}\n`;
        
        if (property.assessedValue || property.value) {
          const value = property.assessedValue || property.value;
          promptContent += `Assessment: $${value ? value.toLocaleString() : 'Not available'}\n`;
        }
        
        if (property.landArea || property.acres) {
          const area = property.landArea || property.acres;
          const unit = property.landAreaUnit || 'acres';
          promptContent += `Land Area: ${area} ${unit}\n`;
        }
        
        promptContent += `\n`;
      });
      
      promptContent += `\nFocus on highlighting the key similarities and differences between these properties in terms of value, location, and characteristics. Provide insights on their relative market positions.`;
      
      // Call Perplexity service
      const systemPrompt = "You are an expert property assessor and real estate analyst. Write informative, factual, and objective comparisons of properties based on assessment data.";
      
      try {
        const generatedText = await perplexityService.generateText(
          promptContent,
          systemPrompt,
          options.maxLength || 1500
        );
        
        return generatedText;
      } catch (perplexityError: any) {
        // Check if this is a rate limit or quota exceeded error
        if (perplexityService.isRateLimitError(perplexityError)) {
          const propertyIds = properties.map(p => p.propertyId).join(', ');
          console.warn(`Perplexity API rate limit reached for property comparison [${propertyIds}], using fallback template generation.`);
          return this.generateComparisonWithTemplate(properties, options);
        }
        
        // Get detailed error information
        const errorDetails = perplexityService.getErrorDetails(perplexityError);
        console.error(`Perplexity API error (${errorDetails.type}) for property comparison: ${errorDetails.message}`);
        
        // Only use template fallback for specific error types
        if (errorDetails.type === PerplexityErrorType.RATE_LIMIT || 
            errorDetails.type === PerplexityErrorType.QUOTA_EXCEEDED ||
            errorDetails.type === PerplexityErrorType.SERVER_ERROR) {
          return this.generateComparisonWithTemplate(properties, options);
        }
        
        // For other error types, rethrow to be handled by the caller
        throw new Error(`Failed to generate property comparison: ${errorDetails.message}`);
      }
    } catch (error) {
      console.error("Error in property comparison generation with Perplexity:", error);
      // Fall back to template generation on any other error
      return this.generateComparisonWithTemplate(properties, options);
    }
  }

  /**
   * Generate a friendly error message
   * 
   * This provides a human-readable error message with appropriate guidance
   */
  private generateErrorMessage(error: any): string {
    // Handle different types of AI provider errors
    try {
      // Check for OpenAI errors
      if (error.message && error.message.includes('OpenAI')) {
        if (openaiService.isRateLimitError(error)) {
          return `We're currently experiencing high demand for our OpenAI service. Please try again in a few minutes or use a different AI provider by setting 'aiProvider' to 'anthropic', 'perplexity', or 'template'.`;
        }
        return `Unable to generate OpenAI-powered property story at this time. Please try using a different AI provider by setting 'aiProvider' to 'anthropic', 'perplexity', or 'template'.`;
      }
      
      // Check for Anthropic errors
      if (error.message && error.message.includes('Anthropic')) {
        if (anthropicService.isRateLimitError(error)) {
          return `We're currently experiencing high demand for our Anthropic service. Please try again in a few minutes or use a different AI provider by setting 'aiProvider' to 'openai', 'perplexity', or 'template'.`;
        }
        return `Unable to generate Anthropic-powered property story at this time. Please try using a different AI provider by setting 'aiProvider' to 'openai', 'perplexity', or 'template'.`;
      }
      
      // Check for Perplexity errors
      if (error.message && error.message.includes('Perplexity')) {
        if (perplexityService.isRateLimitError(error)) {
          return `We're currently experiencing high demand for our Perplexity service. Please try again in a few minutes or use a different AI provider by setting 'aiProvider' to 'openai', 'anthropic', or 'template'.`;
        }
        return `Unable to generate Perplexity-powered property story at this time. Please try using a different AI provider by setting 'aiProvider' to 'openai', 'anthropic', or 'template'.`;
      }
    } catch (parseError) {
      // If error parsing fails, continue to generic handling
    }

    // For non-AI provider errors, provide a generic message
    if (error.message && error.message.includes('not found')) {
      return `Property not found. Please check the property ID and try again.`;
    }
    
    return `Unable to generate property story at this time. Error: ${error.message || "Unknown error"}. Please try again later or contact support for assistance.`;
  }
}

// We'll create the instance in routes.ts to avoid circular dependencies
// export const propertyStoryGenerator = new PropertyStoryGenerator(storage);