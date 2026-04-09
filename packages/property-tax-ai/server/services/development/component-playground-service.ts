/**
 * Component Playground Service
 * 
 * This service manages UI component templates for the Interactive Component Playground.
 * It provides functionality for creating, retrieving, updating, and deleting component templates,
 * as well as generating code for components based on descriptions.
 */

import { IStorage } from '../../storage';
import { 
  UIComponentTemplate, 
  InsertUIComponentTemplate, 
  ComponentType 
} from '@shared/schema';
import { PlandexAIService } from '../plandex-ai-service';
import { getPlandexAIService } from '../plandex-ai-factory';

export class ComponentPlaygroundService {
  private storage: IStorage;
  private plandexAI: PlandexAIService | null = null;

  constructor(storage: IStorage) {
    this.storage = storage;
    
    // Try to initialize PlandexAI for component generation
    try {
      this.plandexAI = getPlandexAIService();
    } catch (error) {
      console.warn('PlandexAI service not available for component generation:', error);
    }
  }

  /**
   * Get all component templates with optional filtering
   */
  async getAllComponentTemplates(
    options: {
      componentType?: ComponentType;
      framework?: string;
      tags?: string[];
      isPublic?: boolean;
      createdBy?: number;
      searchQuery?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<UIComponentTemplate[]> {
    try {
      return await this.storage.getUIComponentTemplates(options);
    } catch (error) {
      console.error('Error getting component templates:', error);
      throw new Error('Failed to get component templates');
    }
  }

  /**
   * Get a specific component template by ID
   */
  async getComponentTemplateById(id: number): Promise<UIComponentTemplate | undefined> {
    try {
      return await this.storage.getUIComponentTemplateById(id);
    } catch (error) {
      console.error(`Error getting component template with ID ${id}:`, error);
      throw new Error(`Failed to get component template with ID ${id}`);
    }
  }

  /**
   * Create a new component template
   */
  async createComponentTemplate(template: InsertUIComponentTemplate): Promise<UIComponentTemplate> {
    try {
      return await this.storage.createUIComponentTemplate(template);
    } catch (error) {
      console.error('Error creating component template:', error);
      throw new Error('Failed to create component template');
    }
  }

  /**
   * Update an existing component template
   */
  async updateComponentTemplate(id: number, template: Partial<InsertUIComponentTemplate>): Promise<UIComponentTemplate | undefined> {
    try {
      return await this.storage.updateUIComponentTemplate(id, template);
    } catch (error) {
      console.error(`Error updating component template with ID ${id}:`, error);
      throw new Error(`Failed to update component template with ID ${id}`);
    }
  }

  /**
   * Delete a component template
   */
  async deleteComponentTemplate(id: number): Promise<boolean> {
    try {
      return await this.storage.deleteUIComponentTemplate(id);
    } catch (error) {
      console.error(`Error deleting component template with ID ${id}:`, error);
      throw new Error(`Failed to delete component template with ID ${id}`);
    }
  }

  /**
   * Increment the usage count of a component template
   */
  async incrementUsageCount(id: number): Promise<void> {
    try {
      const template = await this.storage.getUIComponentTemplateById(id);
      if (template) {
        await this.storage.updateUIComponentTemplate(id, {
          usageCount: (template.usageCount || 0) + 1
        });
      }
    } catch (error) {
      console.error(`Error incrementing usage count for component template ${id}:`, error);
    }
  }

  /**
   * Generate a component using AI
   */
  async generateComponent(
    options: {
      description: string;
      componentType: ComponentType;
      framework: string;
      createdBy: number;
      additionalRequirements?: string;
    }
  ): Promise<UIComponentTemplate | null> {
    if (!this.plandexAI) {
      throw new Error('PlandexAI service not available for component generation');
    }

    try {
      // Construct a prompt for the AI
      const prompt = `
        Create a ${options.framework} component with the following specifications:
        
        Type: ${options.componentType}
        Description: ${options.description}
        ${options.additionalRequirements ? `Additional Requirements: ${options.additionalRequirements}` : ''}
        
        Include best practices, accessibility features, and responsive design.
        Format your response as complete, functional, self-contained code.
      `;

      // Generate component code using PlandexAI
      const result = await this.plandexAI.generateCode({
        prompt,
        language: this.getLanguageForFramework(options.framework),
        codeType: 'component',
        context: `Framework: ${options.framework}, Component Type: ${options.componentType}`
      });

      if (!result.code) {
        throw new Error('Failed to generate component code');
      }

      // Extract a name from the description (first 40 chars or less)
      const name = options.description.length > 40
        ? `${options.description.substring(0, 37)}...`
        : options.description;

      // Create and store the component template
      const template: InsertUIComponentTemplate = {
        name,
        description: options.description,
        componentType: options.componentType,
        framework: options.framework,
        code: result.code,
        tags: this.extractTagsFromDescription(options.description, options.framework),
        createdBy: options.createdBy,
        isPublic: false,
      };

      return await this.createComponentTemplate(template);
    } catch (error) {
      console.error('Error generating component:', error);
      return null;
    }
  }

  /**
   * Get the appropriate language based on the framework
   */
  private getLanguageForFramework(framework: string): string {
    const frameworkLower = framework.toLowerCase();
    
    if (frameworkLower.includes('react')) {
      return 'tsx';
    } else if (frameworkLower.includes('vue')) {
      return 'vue';
    } else if (frameworkLower.includes('svelte')) {
      return 'svelte';
    } else if (frameworkLower.includes('angular')) {
      return 'typescript';
    }
    
    return 'javascript';
  }

  /**
   * Extract potential tags from the description
   */
  private extractTagsFromDescription(description: string, framework: string): string[] {
    // Initialize tags with the framework
    const tags = [framework.toLowerCase()];
    
    // Common UI component tags
    const potentialTags = [
      'button', 'input', 'form', 'modal', 'dialog', 'card', 'menu',
      'dropdown', 'navigation', 'nav', 'sidebar', 'header', 'footer',
      'layout', 'grid', 'flex', 'responsive', 'mobile', 'desktop',
      'datepicker', 'slider', 'toggle', 'switch', 'checkbox', 'radio',
      'select', 'combobox', 'autocomplete', 'list', 'table', 'tabs',
      'accordion', 'carousel', 'tooltip', 'popover', 'notification',
      'alert', 'badge', 'avatar', 'icon', 'spinner', 'progress',
      'chart', 'dashboard', 'accessibility', 'a11y', 'theme', 'dark',
      'light', 'animation'
    ];

    const lowerDesc = description.toLowerCase();
    
    // Add matching tags
    const matchedTags = potentialTags.filter(tag => lowerDesc.includes(tag));
    tags.push(...matchedTags);
    
    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Find similar component templates based on description and tags
   */
  async findSimilarTemplates(
    description: string,
    framework?: string,
    componentType?: ComponentType,
    limit: number = 5
  ): Promise<UIComponentTemplate[]> {
    const tags = this.extractTagsFromDescription(description, framework || 'react');
    const options: any = {
      limit,
      searchQuery: description,
    };

    if (framework) {
      options.framework = framework;
    }

    if (componentType) {
      options.componentType = componentType;
    }

    if (tags.length > 0) {
      options.tags = tags;
    }

    return this.getAllComponentTemplates(options);
  }

  /**
   * Validate component code
   */
  async validateComponentCode(code: string, framework: string): Promise<{
    isValid: boolean;
    errors?: string[];
    warnings?: string[];
  }> {
    if (!this.plandexAI) {
      // Simple validation only checking for basic syntax
      return this.basicValidateComponentCode(code, framework);
    }

    try {
      const result = await this.plandexAI.validateCode({
        code,
        language: this.getLanguageForFramework(framework),
        context: `Framework: ${framework}`
      });

      if (result && result.isValid !== undefined) {
        return {
          isValid: result.isValid,
          errors: result.errors || [],
          warnings: result.warnings || []
        };
      }
      
      // Fallback to basic validation if AI response is invalid
      return this.basicValidateComponentCode(code, framework);
    } catch (error) {
      console.error('Error validating component code with AI:', error);
      return this.basicValidateComponentCode(code, framework);
    }
  }

  /**
   * Basic validation for component code
   */
  private basicValidateComponentCode(code: string, framework: string): {
    isValid: boolean;
    errors?: string[];
    warnings?: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check for basic syntax errors
    try {
      // This is a very basic check
      if (code.includes('{') && code.includes('}')) {
        const openBraces = (code.match(/{/g) || []).length;
        const closeBraces = (code.match(/}/g) || []).length;
        
        if (openBraces !== closeBraces) {
          errors.push('Mismatched curly braces: There are ' + openBraces + ' opening braces and ' + closeBraces + ' closing braces.');
        }
      }
      
      if (code.includes('(') && code.includes(')')) {
        const openParens = (code.match(/\(/g) || []).length;
        const closeParens = (code.match(/\)/g) || []).length;
        
        if (openParens !== closeParens) {
          errors.push('Mismatched parentheses: There are ' + openParens + ' opening parentheses and ' + closeParens + ' closing parentheses.');
        }
      }
      
      // React-specific checks
      if (framework.toLowerCase().includes('react')) {
        // Missing import React
        if (!code.includes('import React') && !code.includes('react"') && !code.includes("react'")) {
          warnings.push('The React import might be missing. For older versions of React, you need to import React even if not used directly.');
        }
        
        // Missing export
        if (!code.includes('export default') && !code.includes('export const') && !code.includes('export function')) {
          warnings.push('No export statement found. Components should be exported to be used in other files.');
        }
      }
      
      // Vue-specific checks
      if (framework.toLowerCase().includes('vue')) {
        if (!code.includes('<template>') && !code.includes('<script>')) {
          warnings.push('Missing <template> or <script> tags which are required for Vue components.');
        }
      }
      
      // Svelte-specific checks
      if (framework.toLowerCase().includes('svelte')) {
        if (!code.includes('<script>') && !code.includes('<style>')) {
          warnings.push('Consider adding <script> and <style> sections for a complete Svelte component.');
        }
      }
      
      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      return {
        isValid: false,
        errors: ['Syntax validation failed: ' + (error instanceof Error ? error.message : 'Unknown error')],
        warnings
      };
    }
  }
}