/**
 * Assessor Workflow Engine
 *
 * This service manages the workflow processes for property assessment activities.
 * It supports the full lifecycle of various assessment processes including:
 *
 * 1. Property Reassessment Workflows
 * 2. New Construction Assessment
 * 3. Appeal Processing Workflows
 * 4. Exemption Application Processing
 * 5. Data Quality Review Tasks
 * 6. Compliance Verification Processes
 *
 * The workflow engine supports:
 * - Dynamic workflow definitions with customizable steps
 * - Task assignment and tracking
 * - Status monitoring and reporting
 * - SLA enforcement and deadline management
 * - Integration with validation rules
 * - Automated task routing based on property characteristics
 */

import { v4 as uuidv4 } from 'uuid';
import { IStorage } from '../../storage';
import {
  WorkflowDefinition,
  WorkflowInstance,
  WorkflowStepHistory,
  Property,
  ValidationIssue,
} from '../../../shared/schema';
import { PropertyValidationEngine } from '../data-quality/property-validation-engine';
import { logger } from '../../utils/logger';

// Workflow Types
export enum WorkflowType {
  PROPERTY_REASSESSMENT = 'property_reassessment',
  NEW_CONSTRUCTION = 'new_construction',
  APPEAL_PROCESSING = 'appeal_processing',
  EXEMPTION_APPLICATION = 'exemption_application',
  DATA_QUALITY_REVIEW = 'data_quality_review',
  COMPLIANCE_VERIFICATION = 'compliance_verification',
}

// Entity Types
export enum WorkflowEntityType {
  PROPERTY = 'property',
  APPEAL = 'appeal',
  EXEMPTION = 'exemption',
  COMPLIANCE_REPORT = 'compliance_report',
}

// Step Action Types
export enum StepActionType {
  VALIDATION = 'validation',
  NOTIFICATION = 'notification',
  TASK = 'task',
  CONDITION = 'condition',
  APPROVAL = 'approval',
  REASSIGN = 'reassign',
  GENERATE_DOCUMENT = 'generate_document',
  DATA_UPDATE = 'data_update',
  EXTERNAL_SYSTEM = 'external_system',
}

// Workflow Status Types
export enum WorkflowStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  WAITING = 'waiting',
  COMPLETED = 'completed',
  CANCELED = 'canceled',
}

// Step Status Types
export enum StepStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

// Workflow Priority Levels
export enum WorkflowPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

// Workflow Filter Options
export interface WorkflowFilterOptions {
  status?: WorkflowStatus;
  definitionId?: string;
  entityType?: WorkflowEntityType;
  entityId?: string;
  assignedTo?: number;
  priority?: WorkflowPriority;
  startedAfter?: Date;
  startedBefore?: Date;
  dueAfter?: Date;
  dueBefore?: Date;
}

// Workflow Step Interface
export interface WorkflowStep {
  stepId: string;
  name: string;
  description?: string;
  actions: StepAction[];
  validations?: StepValidation[];
  assignedTo?: number | string; // Can be user ID or role name
  timeEstimate?: number; // In minutes
  nextSteps: StepTransition[];
  uiComponent?: string; // Optional UI component to render for this step
}

// Step Action Interface
export interface StepAction {
  actionId: string;
  type: StepActionType;
  name: string;
  description?: string;
  parameters?: Record<string, any>;
  requiredForCompletion: boolean;
}

// Step Validation Interface
export interface StepValidation {
  validationId: string;
  ruleId: string;
  level: string;
  blockingLevels?: string[]; // Validation levels that block progress
  message?: string;
}

// Step Transition Interface
export interface StepTransition {
  transitionId: string;
  condition?: string; // Optional JS expression or predefined condition
  targetStepId: string;
  name?: string;
}

/**
 * Assessor Workflow Engine
 */
export class AssessorWorkflowEngine {
  private storage: IStorage;
  private validationEngine: PropertyValidationEngine;

  constructor(storage: IStorage, validationEngine: PropertyValidationEngine) {
    this.storage = storage;
    this.validationEngine = validationEngine;

    logger.info('AssessorWorkflowEngine initialized');
  }

  /**
   * Create a new workflow definition
   */
  public async createWorkflowDefinition(
    workflow: Omit<WorkflowDefinition, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<WorkflowDefinition> {
    try {
      // Ensure workflow has a unique ID if not provided
      if (!workflow.definitionId) {
        workflow.definitionId = `workflow_${uuidv4()}`;
      }

      // Set defaults
      const newWorkflow = await this.storage.createWorkflowDefinition({
        ...workflow,
        version: workflow.version || 1,
        isActive: workflow.isActive !== undefined ? workflow.isActive : true,
      });

      logger.info(`Created workflow definition: ${workflow.name} (${workflow.definitionId})`);
      return newWorkflow;
    } catch (error) {
      logger.error(
        `Error creating workflow definition: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Get all workflow definitions
   */
  public async getAllWorkflowDefinitions(
    activeOnly: boolean = false
  ): Promise<WorkflowDefinition[]> {
    try {
      const workflows = await this.storage.getAllWorkflowDefinitions();
      return activeOnly ? workflows.filter(wf => wf.isActive) : workflows;
    } catch (error) {
      logger.error(
        `Error getting workflow definitions: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Get workflow definition by ID
   */
  public async getWorkflowDefinitionById(definitionId: string): Promise<WorkflowDefinition | null> {
    try {
      return await this.storage.getWorkflowDefinitionById(definitionId);
    } catch (error) {
      logger.error(
        `Error getting workflow definition ${definitionId}: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Update a workflow definition
   */
  public async updateWorkflowDefinition(
    definitionId: string,
    updates: Partial<WorkflowDefinition>
  ): Promise<WorkflowDefinition | null> {
    try {
      // Increment version if steps are updated
      if (updates.steps) {
        const currentWorkflow = await this.storage.getWorkflowDefinitionById(definitionId);
        if (currentWorkflow) {
          updates.version = currentWorkflow.version + 1;
        }
      }

      const updatedWorkflow = await this.storage.updateWorkflowDefinition(definitionId, updates);
      logger.info(`Updated workflow definition: ${definitionId}`);
      return updatedWorkflow;
    } catch (error) {
      logger.error(
        `Error updating workflow definition ${definitionId}: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Delete a workflow definition (or deactivate it)
   */
  public async deleteWorkflowDefinition(
    definitionId: string,
    deactivateOnly: boolean = true
  ): Promise<boolean> {
    try {
      if (deactivateOnly) {
        // Just deactivate instead of deleting
        await this.storage.updateWorkflowDefinition(definitionId, { isActive: false });
        logger.info(`Deactivated workflow definition: ${definitionId}`);
        return true;
      } else {
        // Actually delete the workflow definition
        const result = await this.storage.deleteWorkflowDefinition(definitionId);
        logger.info(`Deleted workflow definition: ${definitionId}`);
        return result;
      }
    } catch (error) {
      logger.error(
        `Error deleting workflow definition ${definitionId}: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Start a new workflow instance
   */
  public async startWorkflow(
    definitionId: string,
    entityType: WorkflowEntityType,
    entityId: string,
    options?: {
      assignedTo?: number;
      priority?: WorkflowPriority;
      data?: Record<string, any>;
      dueDate?: Date;
    }
  ): Promise<WorkflowInstance> {
    try {
      // Get the workflow definition
      const workflowDef = await this.storage.getWorkflowDefinitionById(definitionId);
      if (!workflowDef) {
        throw new Error(`Workflow definition not found: ${definitionId}`);
      }

      if (!workflowDef.isActive) {
        throw new Error(`Workflow definition is not active: ${definitionId}`);
      }

      // Parse the steps
      const steps = this.parseWorkflowSteps(workflowDef.steps);
      if (steps.length === 0) {
        throw new Error(`Workflow definition has no steps: ${definitionId}`);
      }

      // Create the workflow instance
      const initialStepId = steps[0].stepId;
      const now = new Date();

      const instanceId = `instance_${uuidv4()}`;
      const newInstance = await this.storage.createWorkflowInstance({
        instanceId,
        definitionId,
        entityType,
        entityId,
        currentStepId: initialStepId,
        status: WorkflowStatus.NOT_STARTED,
        assignedTo: options?.assignedTo,
        priority: options?.priority || WorkflowPriority.NORMAL,
        data: options?.data || {},
        startedAt: now,
        dueDate: options?.dueDate,
      });

      // Create the initial step history record
      await this.storage.createWorkflowStepHistory({
        instanceId,
        stepId: initialStepId,
        status: StepStatus.PENDING,
        assignedTo: options?.assignedTo,
        startedAt: now,
        data: {},
      });

      logger.info(`Started workflow instance: ${instanceId} for ${entityType}/${entityId}`);
      return newInstance;
    } catch (error) {
      logger.error(
        `Error starting workflow: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Get all workflow instances with optional filtering
   */
  public async getWorkflowInstances(options?: WorkflowFilterOptions): Promise<WorkflowInstance[]> {
    try {
      return await this.storage.getWorkflowInstances(options);
    } catch (error) {
      logger.error(
        `Error getting workflow instances: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Get workflow instance by ID
   */
  public async getWorkflowInstanceById(instanceId: string): Promise<WorkflowInstance | null> {
    try {
      return await this.storage.getWorkflowInstanceById(instanceId);
    } catch (error) {
      logger.error(
        `Error getting workflow instance ${instanceId}: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Update a workflow instance
   */
  public async updateWorkflowInstance(
    instanceId: string,
    updates: Partial<WorkflowInstance>
  ): Promise<WorkflowInstance | null> {
    try {
      const updatedInstance = await this.storage.updateWorkflowInstance(instanceId, {
        ...updates,
        updatedAt: new Date(),
      });

      logger.info(`Updated workflow instance: ${instanceId}`);
      return updatedInstance;
    } catch (error) {
      logger.error(
        `Error updating workflow instance ${instanceId}: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Start execution of a workflow instance
   */
  public async startWorkflowExecution(
    instanceId: string,
    userId?: number
  ): Promise<WorkflowInstance | null> {
    try {
      // Get the workflow instance
      const instance = await this.storage.getWorkflowInstanceById(instanceId);
      if (!instance) {
        throw new Error(`Workflow instance not found: ${instanceId}`);
      }

      if (instance.status !== WorkflowStatus.NOT_STARTED) {
        throw new Error(`Workflow instance is already started: ${instanceId}`);
      }

      // Get the definition
      const definition = await this.storage.getWorkflowDefinitionById(instance.definitionId);
      if (!definition) {
        throw new Error(`Workflow definition not found: ${instance.definitionId}`);
      }

      // Mark the instance as in progress
      const updatedInstance = await this.storage.updateWorkflowInstance(instanceId, {
        status: WorkflowStatus.IN_PROGRESS,
        assignedTo: userId || instance.assignedTo, // Assign to specified user if provided
        updatedAt: new Date(),
      });

      // Update the initial step history record
      await this.updateStepStatus(
        instanceId,
        instance.currentStepId,
        StepStatus.IN_PROGRESS,
        userId
      );

      logger.info(`Started execution of workflow instance: ${instanceId}`);
      return updatedInstance;
    } catch (error) {
      logger.error(
        `Error starting workflow execution ${instanceId}: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Complete current step and advance workflow
   */
  public async completeWorkflowStep(
    instanceId: string,
    stepData?: Record<string, any>,
    transitionId?: string,
    userId?: number
  ): Promise<WorkflowInstance | null> {
    try {
      // Get the workflow instance
      const instance = await this.storage.getWorkflowInstanceById(instanceId);
      if (!instance) {
        throw new Error(`Workflow instance not found: ${instanceId}`);
      }

      if (instance.status !== WorkflowStatus.IN_PROGRESS) {
        throw new Error(`Workflow instance is not in progress: ${instanceId}`);
      }

      // Get the definition
      const definition = await this.storage.getWorkflowDefinitionById(instance.definitionId);
      if (!definition) {
        throw new Error(`Workflow definition not found: ${instance.definitionId}`);
      }

      // Parse workflow steps
      const steps = this.parseWorkflowSteps(definition.steps);

      // Find the current step
      const currentStep = steps.find(s => s.stepId === instance.currentStepId);
      if (!currentStep) {
        throw new Error(`Current step not found: ${instance.currentStepId}`);
      }

      // Complete the current step
      await this.updateStepStatus(
        instanceId,
        instance.currentStepId,
        StepStatus.COMPLETED,
        userId,
        stepData
      );

      // Determine the next step
      let nextStepId = '';

      if (transitionId) {
        // Use the specified transition
        const transition = currentStep.nextSteps.find(t => t.transitionId === transitionId);
        if (!transition) {
          throw new Error(`Transition not found: ${transitionId}`);
        }
        nextStepId = transition.targetStepId;
      } else if (currentStep.nextSteps.length === 1) {
        // If there's only one possible next step, use that
        nextStepId = currentStep.nextSteps[0].targetStepId;
      } else if (currentStep.nextSteps.length > 1) {
        // Evaluate conditions to find the next step
        for (const transition of currentStep.nextSteps) {
          if (
            !transition.condition ||
            this.evaluateCondition(transition.condition, instance, stepData)
          ) {
            nextStepId = transition.targetStepId;
            break;
          }
        }

        if (!nextStepId) {
          throw new Error(`No valid transition found for step: ${instance.currentStepId}`);
        }
      }

      // If next step is empty, it means the workflow is complete
      if (!nextStepId || nextStepId === 'end') {
        // Mark the workflow as completed
        const completedInstance = await this.storage.updateWorkflowInstance(instanceId, {
          status: WorkflowStatus.COMPLETED,
          completedAt: new Date(),
          updatedAt: new Date(),
        });

        logger.info(`Completed workflow instance: ${instanceId}`);
        return completedInstance;
      }

      // Find the next step
      const nextStep = steps.find(s => s.stepId === nextStepId);
      if (!nextStep) {
        throw new Error(`Next step not found: ${nextStepId}`);
      }

      // Create history record for next step
      await this.storage.createWorkflowStepHistory({
        instanceId,
        stepId: nextStepId,
        status: StepStatus.PENDING,
        assignedTo: nextStep.assignedTo ? Number(nextStep.assignedTo) : instance.assignedTo,
        startedAt: new Date(),
        data: {},
      });

      // Update the workflow instance with the new step
      const updatedInstance = await this.storage.updateWorkflowInstance(instanceId, {
        currentStepId: nextStepId,
        assignedTo: nextStep.assignedTo ? Number(nextStep.assignedTo) : instance.assignedTo,
        updatedAt: new Date(),
      });

      logger.info(`Advanced workflow instance to step: ${nextStepId}`);
      return updatedInstance;
    } catch (error) {
      logger.error(
        `Error completing workflow step for ${instanceId}: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Run validations for current workflow step
   */
  public async validateWorkflowStep(instanceId: string): Promise<ValidationIssue[]> {
    try {
      // Get the workflow instance
      const instance = await this.storage.getWorkflowInstanceById(instanceId);
      if (!instance) {
        throw new Error(`Workflow instance not found: ${instanceId}`);
      }

      // Get the definition
      const definition = await this.storage.getWorkflowDefinitionById(instance.definitionId);
      if (!definition) {
        throw new Error(`Workflow definition not found: ${instance.definitionId}`);
      }

      // Parse workflow steps
      const steps = this.parseWorkflowSteps(definition.steps);

      // Find the current step
      const currentStep = steps.find(s => s.stepId === instance.currentStepId);
      if (!currentStep) {
        throw new Error(`Current step not found: ${instance.currentStepId}`);
      }

      // If there are no validations for this step, return empty array
      if (!currentStep.validations || currentStep.validations.length === 0) {
        return [];
      }

      const issues: ValidationIssue[] = [];

      // Run each validation rule
      for (const validation of currentStep.validations) {
        // Get the validation rule
        const rule = await this.storage.getValidationRuleById(validation.ruleId);
        if (!rule) {
          logger.warn(`Validation rule not found: ${validation.ruleId}`);
          continue;
        }

        // Get the entity to validate
        let entity = null;

        if (instance.entityType === WorkflowEntityType.PROPERTY) {
          entity = await this.storage.getPropertyById(instance.entityId);
        } else if (instance.entityType === WorkflowEntityType.APPEAL) {
          entity = await this.storage.getAppealById(Number(instance.entityId));
        }
        // Add other entity types as needed

        if (!entity) {
          logger.warn(
            `Entity not found for validation: ${instance.entityType}/${instance.entityId}`
          );
          continue;
        }

        // For property entities, run property validation
        if (
          instance.entityType === WorkflowEntityType.PROPERTY &&
          entity &&
          rule.entityType === 'property'
        ) {
          const propertyIssues = await this.validationEngine.validateProperty(entity as Property, {
            validationDate: new Date(),
            userId: instance.assignedTo || undefined,
          });

          // Filter issues to only include the ones related to the current rule
          const ruleIssues = propertyIssues.filter(issue => issue.ruleId === validation.ruleId);
          issues.push(...ruleIssues);
        }
        // Add other entity type validations as needed
      }

      return issues;
    } catch (error) {
      logger.error(
        `Error validating workflow step for ${instanceId}: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Reassign a workflow instance
   */
  public async reassignWorkflow(
    instanceId: string,
    newAssignee: number
  ): Promise<WorkflowInstance | null> {
    try {
      // Get the workflow instance
      const instance = await this.storage.getWorkflowInstanceById(instanceId);
      if (!instance) {
        throw new Error(`Workflow instance not found: ${instanceId}`);
      }

      // Update the assignee
      const updatedInstance = await this.storage.updateWorkflowInstance(instanceId, {
        assignedTo: newAssignee,
        updatedAt: new Date(),
      });

      // Also update the current step history
      const stepHistory = await this.storage.getStepHistoryByInstanceAndStep(
        instanceId,
        instance.currentStepId
      );

      if (stepHistory && stepHistory.length > 0) {
        const currentStepHistory = stepHistory[0];
        await this.storage.updateWorkflowStepHistory(currentStepHistory.id, {
          assignedTo: newAssignee,
        });
      }

      logger.info(`Reassigned workflow instance ${instanceId} to user ${newAssignee}`);
      return updatedInstance;
    } catch (error) {
      logger.error(
        `Error reassigning workflow ${instanceId}: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Cancel a workflow instance
   */
  public async cancelWorkflow(
    instanceId: string,
    cancelReason: string,
    userId?: number
  ): Promise<WorkflowInstance | null> {
    try {
      // Get the workflow instance
      const instance = await this.storage.getWorkflowInstanceById(instanceId);
      if (!instance) {
        throw new Error(`Workflow instance not found: ${instanceId}`);
      }

      if (
        instance.status === WorkflowStatus.COMPLETED ||
        instance.status === WorkflowStatus.CANCELED
      ) {
        throw new Error(`Workflow instance is already ${instance.status}: ${instanceId}`);
      }

      // Mark the current step as skipped
      await this.updateStepStatus(instanceId, instance.currentStepId, StepStatus.SKIPPED, userId, {
        cancelReason,
      });

      // Mark the workflow as canceled
      const canceledInstance = await this.storage.updateWorkflowInstance(instanceId, {
        status: WorkflowStatus.CANCELED,
        data: {
          ...instance.data,
          cancelReason,
          canceledBy: userId,
          canceledAt: new Date().toISOString(),
        },
        updatedAt: new Date(),
      });

      logger.info(`Canceled workflow instance: ${instanceId}`);
      return canceledInstance;
    } catch (error) {
      logger.error(
        `Error canceling workflow ${instanceId}: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Get workflow history (step transitions) for an instance
   */
  public async getWorkflowHistory(instanceId: string): Promise<WorkflowStepHistory[]> {
    try {
      return await this.storage.getWorkflowStepHistoryByInstance(instanceId);
    } catch (error) {
      logger.error(
        `Error getting workflow history for ${instanceId}: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Get overdue workflows
   */
  public async getOverdueWorkflows(): Promise<WorkflowInstance[]> {
    try {
      const now = new Date();
      const activeWorkflows = await this.storage.getWorkflowInstances({
        status: WorkflowStatus.IN_PROGRESS,
      });

      // Filter to only include workflows with due dates in the past
      return activeWorkflows.filter(wf => wf.dueDate && new Date(wf.dueDate) < now);
    } catch (error) {
      logger.error(
        `Error getting overdue workflows: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Get tasks for a specific user
   */
  public async getUserTasks(userId: number): Promise<WorkflowInstance[]> {
    try {
      return await this.storage.getWorkflowInstances({
        assignedTo: userId,
        status: WorkflowStatus.IN_PROGRESS,
      });
    } catch (error) {
      logger.error(
        `Error getting tasks for user ${userId}: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Create a property reassessment workflow
   */
  public async createPropertyReassessmentWorkflow(createdBy?: number): Promise<WorkflowDefinition> {
    try {
      const steps: WorkflowStep[] = [
        {
          stepId: 'step_1',
          name: 'Initial Property Review',
          description: 'Review property data and determine if reassessment is needed',
          actions: [
            {
              actionId: 'action_1_1',
              type: StepActionType.TASK,
              name: 'Review Property Data',
              requiredForCompletion: true,
            },
            {
              actionId: 'action_1_2',
              type: StepActionType.VALIDATION,
              name: 'Validate Property Data',
              requiredForCompletion: true,
            },
          ],
          validations: [
            {
              validationId: 'validation_1_1',
              ruleId: 'property_required_fields',
              level: 'error',
              blockingLevels: ['error', 'critical'],
            },
          ],
          timeEstimate: 30,
          nextSteps: [
            {
              transitionId: 'transition_1_1',
              condition: 'data.requiresFullReassessment === true',
              targetStepId: 'step_2',
              name: 'Requires Full Reassessment',
            },
            {
              transitionId: 'transition_1_2',
              condition: 'data.requiresFullReassessment === false',
              targetStepId: 'step_6',
              name: 'No Reassessment Needed',
            },
          ],
          uiComponent: 'PropertyReviewForm',
        },
        {
          stepId: 'step_2',
          name: 'Property Inspection',
          description: 'Schedule and conduct a physical property inspection',
          actions: [
            {
              actionId: 'action_2_1',
              type: StepActionType.TASK,
              name: 'Schedule Inspection',
              requiredForCompletion: true,
            },
            {
              actionId: 'action_2_2',
              type: StepActionType.TASK,
              name: 'Conduct Inspection',
              requiredForCompletion: true,
            },
            {
              actionId: 'action_2_3',
              type: StepActionType.DATA_UPDATE,
              name: 'Update Property Characteristics',
              requiredForCompletion: true,
            },
          ],
          timeEstimate: 120,
          nextSteps: [
            {
              transitionId: 'transition_2_1',
              targetStepId: 'step_3',
              name: 'Continue to Valuation',
            },
          ],
          uiComponent: 'PropertyInspectionForm',
        },
        {
          stepId: 'step_3',
          name: 'Valuation Analysis',
          description: 'Perform valuation analysis using comparable sales and cost approach',
          actions: [
            {
              actionId: 'action_3_1',
              type: StepActionType.TASK,
              name: 'Comparable Sales Analysis',
              requiredForCompletion: true,
            },
            {
              actionId: 'action_3_2',
              type: StepActionType.TASK,
              name: 'Cost Approach Valuation',
              requiredForCompletion: true,
            },
            {
              actionId: 'action_3_3',
              type: StepActionType.DATA_UPDATE,
              name: 'Update Property Value',
              parameters: {
                fields: ['value'],
              },
              requiredForCompletion: true,
            },
          ],
          timeEstimate: 90,
          nextSteps: [
            {
              transitionId: 'transition_3_1',
              targetStepId: 'step_4',
              name: 'Continue to Review',
            },
          ],
          uiComponent: 'PropertyValuationForm',
        },
        {
          stepId: 'step_4',
          name: 'Supervisor Review',
          description: 'Review and approve the reassessment by a supervisor',
          actions: [
            {
              actionId: 'action_4_1',
              type: StepActionType.APPROVAL,
              name: 'Review Reassessment',
              requiredForCompletion: true,
            },
          ],
          timeEstimate: 45,
          nextSteps: [
            {
              transitionId: 'transition_4_1',
              condition: 'data.approved === true',
              targetStepId: 'step_5',
              name: 'Approved',
            },
            {
              transitionId: 'transition_4_2',
              condition: 'data.approved === false',
              targetStepId: 'step_3',
              name: 'Rejected - Return to Valuation',
            },
          ],
          uiComponent: 'SupervisorReviewForm',
        },
        {
          stepId: 'step_5',
          name: 'Notice Generation',
          description: 'Generate and send reassessment notice to property owner',
          actions: [
            {
              actionId: 'action_5_1',
              type: StepActionType.GENERATE_DOCUMENT,
              name: 'Generate Reassessment Notice',
              parameters: {
                templateId: 'reassessment_notice',
              },
              requiredForCompletion: true,
            },
            {
              actionId: 'action_5_2',
              type: StepActionType.NOTIFICATION,
              name: 'Send Notice to Owner',
              requiredForCompletion: true,
            },
          ],
          timeEstimate: 30,
          nextSteps: [
            {
              transitionId: 'transition_5_1',
              targetStepId: 'end',
              name: 'Complete Reassessment',
            },
          ],
          uiComponent: 'NoticeGenerationForm',
        },
        {
          stepId: 'step_6',
          name: 'No Changes Required',
          description: 'Document decision that no reassessment is needed',
          actions: [
            {
              actionId: 'action_6_1',
              type: StepActionType.TASK,
              name: 'Document Decision',
              requiredForCompletion: true,
            },
          ],
          timeEstimate: 15,
          nextSteps: [
            {
              transitionId: 'transition_6_1',
              targetStepId: 'end',
              name: 'Complete Process',
            },
          ],
          uiComponent: 'NoChangesForm',
        },
      ];

      return await this.createWorkflowDefinition({
        definitionId: 'reassessment_workflow',
        name: 'Property Reassessment Workflow',
        description: 'Standardized workflow for property reassessment in Washington State',
        steps: JSON.stringify(steps),
        isActive: true,
        createdBy,
      });
    } catch (error) {
      logger.error(
        `Error creating property reassessment workflow: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Create a new construction workflow
   */
  public async createNewConstructionWorkflow(createdBy?: number): Promise<WorkflowDefinition> {
    try {
      const steps: WorkflowStep[] = [
        {
          stepId: 'step_1',
          name: 'Building Permit Review',
          description: 'Review building permit data and initialize assessment',
          actions: [
            {
              actionId: 'action_1_1',
              type: StepActionType.TASK,
              name: 'Review Building Permit',
              requiredForCompletion: true,
            },
            {
              actionId: 'action_1_2',
              type: StepActionType.TASK,
              name: 'Verify Property Information',
              requiredForCompletion: true,
            },
          ],
          nextSteps: [
            {
              transitionId: 'transition_1_1',
              targetStepId: 'step_2',
              name: 'Continue to Initial Assessment',
            },
          ],
          uiComponent: 'BuildingPermitForm',
        },
        // Additional steps for new construction workflow would go here
        {
          stepId: 'step_2',
          name: 'Initial Construction Assessment',
          description: 'Record initial construction details',
          actions: [
            {
              actionId: 'action_2_1',
              type: StepActionType.TASK,
              name: 'Document Construction Type',
              requiredForCompletion: true,
            },
            {
              actionId: 'action_2_2',
              type: StepActionType.DATA_UPDATE,
              name: 'Create Improvement Record',
              requiredForCompletion: true,
            },
          ],
          nextSteps: [
            {
              transitionId: 'transition_2_1',
              targetStepId: 'end',
              name: 'Complete Initial Assessment',
            },
          ],
          uiComponent: 'ConstructionAssessmentForm',
        },
      ];

      return await this.createWorkflowDefinition({
        definitionId: 'new_construction_workflow',
        name: 'New Construction Assessment Workflow',
        description: 'Workflow for assessing new construction',
        steps: JSON.stringify(steps),
        isActive: true,
        createdBy,
      });
    } catch (error) {
      logger.error(
        `Error creating new construction workflow: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Create an appeal processing workflow
   */
  public async createAppealProcessingWorkflow(createdBy?: number): Promise<WorkflowDefinition> {
    try {
      const steps: WorkflowStep[] = [
        {
          stepId: 'step_1',
          name: 'Appeal Receipt and Validation',
          description: 'Record and validate incoming appeal',
          actions: [
            {
              actionId: 'action_1_1',
              type: StepActionType.TASK,
              name: 'Record Appeal Details',
              requiredForCompletion: true,
            },
            {
              actionId: 'action_1_2',
              type: StepActionType.VALIDATION,
              name: 'Validate Appeal Eligibility',
              requiredForCompletion: true,
            },
            {
              actionId: 'action_1_3',
              type: StepActionType.NOTIFICATION,
              name: 'Send Appeal Acknowledgement',
              requiredForCompletion: true,
            },
          ],
          validations: [
            {
              validationId: 'validation_1_1',
              ruleId: 'appeal_filing_deadline',
              level: 'critical',
              blockingLevels: ['critical'],
            },
          ],
          nextSteps: [
            {
              transitionId: 'transition_1_1',
              condition: 'data.isValid === true',
              targetStepId: 'step_2',
              name: 'Appeal Valid - Continue',
            },
            {
              transitionId: 'transition_1_2',
              condition: 'data.isValid === false',
              targetStepId: 'step_reject',
              name: 'Appeal Invalid - Reject',
            },
          ],
          uiComponent: 'AppealReceiptForm',
        },
        {
          stepId: 'step_2',
          name: 'Appeal Review',
          description: 'Review appeal details and evidence',
          actions: [
            {
              actionId: 'action_2_1',
              type: StepActionType.TASK,
              name: 'Review Appeal Evidence',
              requiredForCompletion: true,
            },
            {
              actionId: 'action_2_2',
              type: StepActionType.TASK,
              name: 'Property Value Analysis',
              requiredForCompletion: true,
            },
          ],
          nextSteps: [
            {
              transitionId: 'transition_2_1',
              targetStepId: 'step_3',
              name: 'Continue to Hearing Scheduling',
            },
          ],
          uiComponent: 'AppealReviewForm',
        },
        {
          stepId: 'step_3',
          name: 'Hearing Scheduling',
          description: 'Schedule and prepare for appeal hearing',
          actions: [
            {
              actionId: 'action_3_1',
              type: StepActionType.TASK,
              name: 'Schedule Hearing',
              requiredForCompletion: true,
            },
            {
              actionId: 'action_3_2',
              type: StepActionType.NOTIFICATION,
              name: 'Send Hearing Notice',
              requiredForCompletion: true,
            },
          ],
          nextSteps: [
            {
              transitionId: 'transition_3_1',
              targetStepId: 'step_4',
              name: 'Continue to Hearing',
            },
          ],
          uiComponent: 'HearingScheduleForm',
        },
        {
          stepId: 'step_4',
          name: 'Appeal Hearing',
          description: 'Conduct and document the appeal hearing',
          actions: [
            {
              actionId: 'action_4_1',
              type: StepActionType.TASK,
              name: 'Conduct Hearing',
              requiredForCompletion: true,
            },
            {
              actionId: 'action_4_2',
              type: StepActionType.TASK,
              name: 'Record Hearing Notes',
              requiredForCompletion: true,
            },
          ],
          nextSteps: [
            {
              transitionId: 'transition_4_1',
              targetStepId: 'step_5',
              name: 'Continue to Decision',
            },
          ],
          uiComponent: 'AppealHearingForm',
        },
        {
          stepId: 'step_5',
          name: 'Appeal Decision',
          description: 'Record and issue the appeal decision',
          actions: [
            {
              actionId: 'action_5_1',
              type: StepActionType.TASK,
              name: 'Record Decision',
              requiredForCompletion: true,
            },
            {
              actionId: 'action_5_2',
              type: StepActionType.APPROVAL,
              name: 'Approve Decision',
              requiredForCompletion: true,
            },
            {
              actionId: 'action_5_3',
              type: StepActionType.GENERATE_DOCUMENT,
              name: 'Generate Decision Notice',
              requiredForCompletion: true,
            },
            {
              actionId: 'action_5_4',
              type: StepActionType.NOTIFICATION,
              name: 'Send Decision Notice',
              requiredForCompletion: true,
            },
          ],
          nextSteps: [
            {
              transitionId: 'transition_5_1',
              condition: 'data.decision === "granted" || data.decision === "partial"',
              targetStepId: 'step_6',
              name: 'Decision Granted - Update Values',
            },
            {
              transitionId: 'transition_5_2',
              condition: 'data.decision === "denied"',
              targetStepId: 'end',
              name: 'Decision Denied - Complete',
            },
          ],
          uiComponent: 'AppealDecisionForm',
        },
        {
          stepId: 'step_6',
          name: 'Update Property Values',
          description: 'Update property records based on appeal decision',
          actions: [
            {
              actionId: 'action_6_1',
              type: StepActionType.DATA_UPDATE,
              name: 'Update Property Value',
              requiredForCompletion: true,
            },
            {
              actionId: 'action_6_2',
              type: StepActionType.NOTIFICATION,
              name: 'Notify Tax Systems',
              requiredForCompletion: true,
            },
          ],
          nextSteps: [
            {
              transitionId: 'transition_6_1',
              targetStepId: 'end',
              name: 'Complete Appeal',
            },
          ],
          uiComponent: 'UpdatePropertyValueForm',
        },
        {
          stepId: 'step_reject',
          name: 'Reject Appeal',
          description: 'Process and document rejected appeal',
          actions: [
            {
              actionId: 'action_reject_1',
              type: StepActionType.TASK,
              name: 'Document Rejection Reason',
              requiredForCompletion: true,
            },
            {
              actionId: 'action_reject_2',
              type: StepActionType.NOTIFICATION,
              name: 'Send Rejection Notice',
              requiredForCompletion: true,
            },
          ],
          nextSteps: [
            {
              transitionId: 'transition_reject_1',
              targetStepId: 'end',
              name: 'Complete Rejection',
            },
          ],
          uiComponent: 'RejectAppealForm',
        },
      ];

      return await this.createWorkflowDefinition({
        definitionId: 'appeal_processing_workflow',
        name: 'Property Appeal Processing Workflow',
        description: 'Workflow for processing property value appeals',
        steps: JSON.stringify(steps),
        isActive: true,
        createdBy,
      });
    } catch (error) {
      logger.error(
        `Error creating appeal processing workflow: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Create a data quality review workflow
   */
  public async createDataQualityWorkflow(createdBy?: number): Promise<WorkflowDefinition> {
    try {
      const steps: WorkflowStep[] = [
        {
          stepId: 'step_1',
          name: 'Data Quality Check',
          description: 'Perform automated data quality validation',
          actions: [
            {
              actionId: 'action_1_1',
              type: StepActionType.VALIDATION,
              name: 'Run Data Validation',
              requiredForCompletion: true,
            },
            {
              actionId: 'action_1_2',
              type: StepActionType.TASK,
              name: 'Review Validation Results',
              requiredForCompletion: true,
            },
          ],
          validations: [
            {
              validationId: 'validation_1_1',
              ruleId: 'property_required_fields',
              level: 'error',
              blockingLevels: ['error', 'critical'],
            },
            {
              validationId: 'validation_1_2',
              ruleId: 'property_valid_type',
              level: 'error',
              blockingLevels: ['error', 'critical'],
            },
            {
              validationId: 'validation_1_3',
              ruleId: 'wa_data_quality_parcel_format',
              level: 'error',
              blockingLevels: ['error', 'critical'],
            },
          ],
          nextSteps: [
            {
              transitionId: 'transition_1_1',
              condition: 'data.hasIssues === true',
              targetStepId: 'step_2',
              name: 'Issues Found - Continue to Resolution',
            },
            {
              transitionId: 'transition_1_2',
              condition: 'data.hasIssues === false',
              targetStepId: 'step_3',
              name: 'No Issues - Skip to Completion',
            },
          ],
          uiComponent: 'DataQualityCheckForm',
        },
        {
          stepId: 'step_2',
          name: 'Data Issue Resolution',
          description: 'Resolve identified data quality issues',
          actions: [
            {
              actionId: 'action_2_1',
              type: StepActionType.TASK,
              name: 'Fix Data Issues',
              requiredForCompletion: true,
            },
            {
              actionId: 'action_2_2',
              type: StepActionType.DATA_UPDATE,
              name: 'Update Property Records',
              requiredForCompletion: true,
            },
            {
              actionId: 'action_2_3',
              type: StepActionType.VALIDATION,
              name: 'Verify Fixes',
              requiredForCompletion: true,
            },
          ],
          nextSteps: [
            {
              transitionId: 'transition_2_1',
              targetStepId: 'step_3',
              name: 'Continue to Documentation',
            },
          ],
          uiComponent: 'DataIssueResolutionForm',
        },
        {
          stepId: 'step_3',
          name: 'Data Quality Documentation',
          description: 'Document data quality review results',
          actions: [
            {
              actionId: 'action_3_1',
              type: StepActionType.TASK,
              name: 'Document Review Results',
              requiredForCompletion: true,
            },
            {
              actionId: 'action_3_2',
              type: StepActionType.TASK,
              name: 'Update Data Quality Metrics',
              requiredForCompletion: false,
            },
          ],
          nextSteps: [
            {
              transitionId: 'transition_3_1',
              targetStepId: 'end',
              name: 'Complete Data Quality Review',
            },
          ],
          uiComponent: 'DataQualityDocumentationForm',
        },
      ];

      return await this.createWorkflowDefinition({
        definitionId: 'data_quality_workflow',
        name: 'Data Quality Review Workflow',
        description: 'Workflow for reviewing and ensuring data quality',
        steps: JSON.stringify(steps),
        isActive: true,
        createdBy,
      });
    } catch (error) {
      logger.error(
        `Error creating data quality workflow: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Helper function to parse workflow steps from JSON
   */
  private parseWorkflowSteps(stepsJson: any): WorkflowStep[] {
    try {
      if (typeof stepsJson === 'string') {
        return JSON.parse(stepsJson);
      } else if (Array.isArray(stepsJson)) {
        return stepsJson;
      }
      return [];
    } catch (error) {
      logger.error(
        `Error parsing workflow steps: ${error instanceof Error ? error.message : String(error)}`
      );
      return [];
    }
  }

  /**
   * Helper function to update a step's status
   */
  private async updateStepStatus(
    instanceId: string,
    stepId: string,
    status: StepStatus,
    userId?: number,
    data?: Record<string, any>
  ): Promise<WorkflowStepHistory | null> {
    try {
      const stepHistory = await this.storage.getStepHistoryByInstanceAndStep(instanceId, stepId);

      if (!stepHistory || stepHistory.length === 0) {
        throw new Error(`Step history not found for instance ${instanceId} and step ${stepId}`);
      }

      const currentStepHistory = stepHistory[0];
      const updatedHistory = await this.storage.updateWorkflowStepHistory(currentStepHistory.id, {
        status,
        completedAt: status === StepStatus.COMPLETED ? new Date() : undefined,
        data: {
          ...currentStepHistory.data,
          ...data,
          previousStatus: currentStepHistory.status,
          statusChangedBy: userId,
          statusChangedAt: new Date().toISOString(),
        },
      });

      logger.debug(`Updated step status for ${instanceId}/${stepId} to ${status}`);
      return updatedHistory;
    } catch (error) {
      logger.error(
        `Error updating step status: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Helper function to evaluate a condition expression
   */
  private evaluateCondition(
    condition: string,
    instance: WorkflowInstance,
    additionalData?: Record<string, any>
  ): boolean {
    try {
      // Create a context with the workflow data
      const context = {
        data: {
          ...instance.data,
          ...additionalData,
        },
        instance: {
          id: instance.id,
          instanceId: instance.instanceId,
          status: instance.status,
          entityType: instance.entityType,
          entityId: instance.entityId,
          currentStepId: instance.currentStepId,
          startedAt: instance.startedAt,
          completedAt: instance.completedAt,
        },
      };

      // Evaluate the condition using Function constructor (safer than eval)
      const conditionFn = new Function('context', `with(context) { return ${condition}; }`);
      return conditionFn(context);
    } catch (error) {
      logger.error(
        `Error evaluating condition "${condition}": ${error instanceof Error ? error.message : String(error)}`
      );
      return false;
    }
  }

  /**
   * Washington State Specific: Create DOR compliant workflow templates
   */
  public async createWashingtonCompliantWorkflows(
    createdBy?: number
  ): Promise<WorkflowDefinition[]> {
    const workflows: WorkflowDefinition[] = [];

    try {
      // Create the property reassessment workflow
      const reassessmentWorkflow = await this.createPropertyReassessmentWorkflow(createdBy);
      workflows.push(reassessmentWorkflow);

      // Create the appeal processing workflow
      const appealWorkflow = await this.createAppealProcessingWorkflow(createdBy);
      workflows.push(appealWorkflow);

      // Create the data quality workflow
      const dataQualityWorkflow = await this.createDataQualityWorkflow(createdBy);
      workflows.push(dataQualityWorkflow);

      // Create the new construction workflow
      const newConstructionWorkflow = await this.createNewConstructionWorkflow(createdBy);
      workflows.push(newConstructionWorkflow);

      return workflows;
    } catch (error) {
      logger.error(
        `Error creating Washington compliant workflows: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }
}
