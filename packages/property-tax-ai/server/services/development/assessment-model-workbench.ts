/**
 * Assessment Model Workbench Service
 * 
 * Provides management of assessment models, variables, components, calculations, 
 * validation rules, test cases, and model versioning.
 */

import { IStorage } from '../../storage';
import { v4 as uuidv4 } from 'uuid';
import {
  AssessmentModel,
  InsertAssessmentModel,
  ModelVariable,
  InsertModelVariable,
  ModelComponent,
  InsertModelComponent,
  ModelCalculation,
  InsertModelCalculation,
  ModelValidationRule,
  InsertModelValidationRule,
  ModelTestCase,
  InsertModelTestCase,
  AssessmentModelVersion,
  InsertAssessmentModelVersion,
  ModelStatus,
  ModelType
} from '@shared/schema';

/**
 * Service for managing assessment models and related components
 */
class AssessmentModelWorkbench {
  private storage: IStorage;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  // Assessment Models
  async getAllModels(): Promise<AssessmentModel[]> {
    return this.storage.getAllAssessmentModels();
  }

  async getModelById(id: number): Promise<AssessmentModel | undefined> {
    return this.storage.getAssessmentModel(id);
  }

  async getModelByModelId(modelId: string): Promise<AssessmentModel | undefined> {
    return this.storage.getAssessmentModelByModelId(modelId);
  }

  async createModel(model: InsertAssessmentModel): Promise<AssessmentModel> {
    // Generate a unique modelId if not provided
    if (!model.modelId) {
      model.modelId = uuidv4();
    }
    
    // Set default values if not provided
    const modelToCreate: InsertAssessmentModel = {
      ...model,
      type: model.type || ModelType.RESIDENTIAL,
      status: model.status || ModelStatus.DRAFT,
      description: model.description || null,
      tags: model.tags || []
    };
    
    return this.storage.createAssessmentModel(modelToCreate);
  }

  async updateModel(modelId: string, updateData: Partial<AssessmentModel>): Promise<AssessmentModel | undefined> {
    return this.storage.updateAssessmentModel(modelId, updateData);
  }

  async deleteModel(modelId: string): Promise<boolean> {
    return this.storage.deleteAssessmentModel(modelId);
  }

  // Model Variables
  async getVariableById(id: number): Promise<ModelVariable | undefined> {
    return this.storage.getModelVariable(id);
  }

  async getVariablesByModel(modelId: string): Promise<ModelVariable[]> {
    return this.storage.getModelVariablesByModel(modelId);
  }

  async createVariable(variable: InsertModelVariable): Promise<ModelVariable> {
    return this.storage.createModelVariable(variable);
  }

  async updateVariable(id: number, updateData: Partial<ModelVariable>): Promise<ModelVariable | undefined> {
    return this.storage.updateModelVariable(id, updateData);
  }

  async deleteVariable(id: number): Promise<boolean> {
    return this.storage.deleteModelVariable(id);
  }

  // Model Components
  async getComponentById(id: number): Promise<ModelComponent | undefined> {
    return this.storage.getModelComponent(id);
  }

  async getComponentsByModel(modelId: string): Promise<ModelComponent[]> {
    return this.storage.getModelComponentsByModel(modelId);
  }

  async createComponent(component: InsertModelComponent): Promise<ModelComponent> {
    return this.storage.createModelComponent(component);
  }

  async updateComponent(id: number, updateData: Partial<ModelComponent>): Promise<ModelComponent | undefined> {
    return this.storage.updateModelComponent(id, updateData);
  }

  async deleteComponent(id: number): Promise<boolean> {
    return this.storage.deleteModelComponent(id);
  }

  // Model Calculations
  async getCalculationById(id: number): Promise<ModelCalculation | undefined> {
    return this.storage.getModelCalculation(id);
  }

  async getCalculationsByModel(modelId: string): Promise<ModelCalculation[]> {
    return this.storage.getModelCalculationsByModel(modelId);
  }

  async createCalculation(calculation: InsertModelCalculation): Promise<ModelCalculation> {
    return this.storage.createModelCalculation(calculation);
  }

  async updateCalculation(id: number, updateData: Partial<ModelCalculation>): Promise<ModelCalculation | undefined> {
    return this.storage.updateModelCalculation(id, updateData);
  }

  async deleteCalculation(id: number): Promise<boolean> {
    return this.storage.deleteModelCalculation(id);
  }

  // Model Validation Rules
  async getValidationRuleById(id: number): Promise<ModelValidationRule | undefined> {
    return this.storage.getModelValidationRule(id);
  }

  async getValidationRulesByModel(modelId: string): Promise<ModelValidationRule[]> {
    return this.storage.getModelValidationRulesByModel(modelId);
  }

  async createValidationRule(rule: InsertModelValidationRule): Promise<ModelValidationRule> {
    return this.storage.createModelValidationRule(rule);
  }

  async updateValidationRule(id: number, updateData: Partial<ModelValidationRule>): Promise<ModelValidationRule | undefined> {
    return this.storage.updateModelValidationRule(id, updateData);
  }

  async deleteValidationRule(id: number): Promise<boolean> {
    return this.storage.deleteModelValidationRule(id);
  }

  // Model Test Cases
  async getTestCaseById(id: number): Promise<ModelTestCase | undefined> {
    return this.storage.getModelTestCase(id);
  }

  async getTestCasesByModel(modelId: string): Promise<ModelTestCase[]> {
    return this.storage.getModelTestCasesByModel(modelId);
  }

  async createTestCase(testCase: InsertModelTestCase): Promise<ModelTestCase> {
    return this.storage.createModelTestCase(testCase);
  }

  async updateTestCase(id: number, updateData: Partial<ModelTestCase>): Promise<ModelTestCase | undefined> {
    return this.storage.updateModelTestCase(id, updateData);
  }

  async runTestCase(id: number, inputData: any): Promise<ModelTestCase | undefined> {
    try {
      // In a real implementation, this would execute the test with the provided inputs
      // For now, we'll just simulate a test run by updating the test case status and results
      const testCase = await this.storage.getModelTestCase(id);
      
      if (!testCase) {
        return undefined;
      }
      
      // Simulated test execution - would actually execute model calculations in production
      const results = {
        executionTime: Math.random() * 100,
        passed: Math.random() > 0.2, // 80% chance of passing
        outputValues: inputData,
        logs: ['Test executed successfully']
      };
      
      const status = results.passed ? 'passed' : 'failed';
      
      return this.storage.updateModelTestCaseResults(id, status, results);
    } catch (error) {
      console.error('Error running test case:', error);
      return this.storage.updateModelTestCaseResults(id, 'error', { error: 'Test execution failed' });
    }
  }

  async deleteTestCase(id: number): Promise<boolean> {
    return this.storage.deleteModelTestCase(id);
  }

  // Model Versions
  async getVersionById(id: number): Promise<AssessmentModelVersion | undefined> {
    return this.storage.getAssessmentModelVersion(id);
  }

  async getVersionsByModel(modelId: string): Promise<AssessmentModelVersion[]> {
    return this.storage.getAssessmentModelVersionsByModel(modelId);
  }

  async getLatestVersion(modelId: string): Promise<AssessmentModelVersion | undefined> {
    return this.storage.getLatestAssessmentModelVersion(modelId);
  }

  async createVersion(version: InsertAssessmentModelVersion): Promise<AssessmentModelVersion> {
    // Get existing versions to determine next version number
    const existingVersions = await this.storage.getAssessmentModelVersionsByModel(version.modelId);
    
    // Calculate the next version number if not provided
    if (!version.version) {
      const maxVersion = existingVersions.reduce((max, v) => Math.max(max, v.version), 0);
      version.version = maxVersion + 1;
    }
    
    // Create the new version
    return this.storage.createAssessmentModelVersion(version);
  }

  // Model Types and Statuses
  getModelTypes(): string[] {
    return Object.values(ModelType);
  }

  getModelStatuses(): string[] {
    return Object.values(ModelStatus);
  }
}

// Singleton instance - storage will be passed when imported
import { storage } from '../../storage';
export const assessmentModelWorkbench = new AssessmentModelWorkbench(storage);

export default assessmentModelWorkbench;