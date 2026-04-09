/**
 * Appeals Management Service
 * 
 * This service is responsible for managing property assessment appeals according to 
 * Washington State appeals process requirements. It supports:
 * 
 * 1. Appeal creation and lifecycle management
 * 2. Evidence tracking and documentation
 * 3. Hearing scheduling and management
 * 4. Decision tracking and notification
 * 5. Statistical analysis and reporting
 * 6. Integration with workflow engine for process management
 */
import { Appeal, AppealComment, AppealEvidence, InsertAppeal, InsertAppealComment, InsertAppealEvidence } from '@shared/schema';
import { IStorage } from '../../storage';
import { AssessorWorkflowEngine } from '../workflow/assessor-workflow-engine';
import { PropertyValidationEngine } from '../data-quality/property-validation-engine';
import { NotificationService } from '../notification-service';
import { formatDate } from '../../utils/date-utils';
import { logger } from '../../utils/logger';

// Appeal status types - matches what's in the database
export enum AppealStatus {
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  SCHEDULED = 'scheduled',
  HEARD = 'heard',
  DECIDED = 'decided',
  WITHDRAWN = 'withdrawn'
}

// Appeal decision types
export enum AppealDecision {
  GRANTED = 'granted',
  DENIED = 'denied',
  PARTIAL = 'partial'
}

// Appeal types - matches what's in the database
export enum AppealType {
  VALUATION = 'valuation',
  CLASSIFICATION = 'classification',
  EXEMPTION = 'exemption'
}

// Statistics for appeals reporting
export interface AppealsStatistics {
  totalAppeals: number;
  byStatus: {
    [key in AppealStatus]: number;
  };
  byType: {
    [key in AppealType]: number;
  };
  byDecision: {
    [key in AppealDecision]?: number;
  };
  averageProcessingDays: number | null;
  successRate: number | null;
}

export class AppealsManagementService {
  private storage: IStorage;
  private workflowEngine: AssessorWorkflowEngine;
  private validationEngine: PropertyValidationEngine;
  private notificationService: NotificationService;

  constructor(
    storage: IStorage,
    workflowEngine: AssessorWorkflowEngine,
    validationEngine: PropertyValidationEngine,
    notificationService: NotificationService
  ) {
    this.storage = storage;
    this.workflowEngine = workflowEngine;
    this.validationEngine = validationEngine;
    this.notificationService = notificationService;
    
    logger.info('Appeals Management Service initialized');
  }

  /**
   * Get appeal by ID
   */
  public async getAppealById(id: number): Promise<Appeal | null> {
    try {
      // Need to implement getAppealById in storage
      const appeals = await this.storage.getAppealsByPropertyId('dummy');
      const appeal = appeals.find(a => a.id === id);
      return appeal || null;
    } catch (error) {
      logger.error(`Error fetching appeal by ID ${id}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Get all appeals with optional filters
   */
  public async getAllAppeals(options?: {
    status?: AppealStatus,
    type?: AppealType,
    fromDate?: Date,
    toDate?: Date
  }): Promise<Appeal[]> {
    try {
      // This is a basic implementation for now - we need more specific methods in storage
      // Implementation will need enhancement when we add more filters
      let appeals: Appeal[] = [];
      
      // Get all property IDs and then use those to get appeals
      // This is not efficient, but works with current storage interface
      // In a real implementation, we'd add a method to get all appeals directly
      const properties = await this.storage.getAllProperties(10000);
      for (const property of properties) {
        const propertyAppeals = await this.storage.getAppealsByPropertyId(property.propertyId);
        appeals = [...appeals, ...propertyAppeals];
      }
      
      // Apply filters if provided
      if (options) {
        if (options.status) {
          appeals = appeals.filter(a => a.status === options.status);
        }
        
        if (options.type) {
          appeals = appeals.filter(a => a.appealType === options.type);
        }
        
        if (options.fromDate) {
          appeals = appeals.filter(a => a.dateReceived >= options.fromDate);
        }
        
        if (options.toDate) {
          appeals = appeals.filter(a => a.dateReceived <= options.toDate);
        }
      }
      
      return appeals;
    } catch (error) {
      logger.error(`Error fetching appeals: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Create a new appeal
   */
  public async createAppeal(appeal: InsertAppeal): Promise<Appeal> {
    try {
      // Validate appeal data
      this.validateAppealData(appeal);
      
      // Create the appeal
      const createdAppeal = await this.storage.createAppeal(appeal);
      
      // Start the appeal workflow
      await this.startAppealWorkflow(createdAppeal);
      
      // Log the appeal creation
      await this.storage.createSystemActivity({
        activity_type: 'appeal_created',
        component: 'appeals_management_service',
        status: 'success',
        details: {
          appealId: createdAppeal.id,
          appealNumber: createdAppeal.appealNumber,
          propertyId: createdAppeal.propertyId
        }
      });
      
      // Send notification to assigned staff member if assigned
      if (createdAppeal.assignedTo) {
        await this.notificationService.sendStaffNotification(
          createdAppeal.assignedTo,
          'New Appeal Assigned',
          `You have been assigned to handle appeal #${createdAppeal.appealNumber} for property ID ${createdAppeal.propertyId}.`,
          {
            appealId: createdAppeal.id,
            appealNumber: createdAppeal.appealNumber,
            type: 'appeal_assigned'
          }
        );
      }
      
      return createdAppeal;
    } catch (error) {
      logger.error(`Error creating appeal: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Update appeal status
   * 
   * @param appealId The ID of the appeal to update
   * @param status The new status for the appeal
   * @param userId The ID of the user making the update
   * @returns The updated appeal, or null if not found
   */
  public async updateAppealStatus(
    appealId: number, 
    status: AppealStatus, 
    userId: number
  ): Promise<Appeal | null> {
    try {
      // Update status in database
      const updatedAppeal = await this.storage.updateAppealStatus(appealId, status);
      
      if (!updatedAppeal) {
        return null;
      }
      
      // Log the status change
      await this.storage.createSystemActivity({
        activity_type: 'appeal_status_changed',
        component: 'appeals_management_service',
        status: 'success',
        details: {
          appealId,
          previousStatus: updatedAppeal.status !== status ? updatedAppeal.status : 'unknown',
          newStatus: status,
          changedBy: userId
        }
      });
      
      // If status is SCHEDULED, make sure hearing date is set
      if (status === AppealStatus.SCHEDULED && !updatedAppeal.hearingDate) {
        logger.warn(`Appeal ${appealId} status set to SCHEDULED but hearing date is not set`);
      }
      
      // Send notification about status change
      this.notificationService.createAppealStatusNotification(
        appealId,
        status,
        userId.toString(), // Staff ID who changed the status
        updatedAppeal.propertyId,
        updatedAppeal.appealType
      );
      
      // If appeal is assigned to a staff member, send them a notification as well
      if (updatedAppeal.assignedTo && updatedAppeal.assignedTo !== userId) {
        this.notificationService.createAppealStatusNotification(
          appealId,
          status,
          updatedAppeal.assignedTo.toString(),
          updatedAppeal.propertyId,
          updatedAppeal.appealType
        );
      }
      
      // Handle workflow transitions
      await this.handleAppealStatusChange(updatedAppeal, status);
      
      return updatedAppeal;
    } catch (error) {
      logger.error(`Error updating appeal status for appeal ${appealId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Add comment to an appeal
   */
  public async addAppealComment(comment: InsertAppealComment): Promise<AppealComment> {
    try {
      const createdComment = await this.storage.createAppealComment(comment);
      
      // Log the comment addition
      await this.storage.createSystemActivity({
        activity_type: 'appeal_comment_added',
        component: 'appeals_management_service',
        status: 'success',
        details: {
          appealId: comment.appealId,
          commentId: createdComment.id,
          userId: comment.userId,
          internalOnly: comment.internalOnly
        }
      });
      
      // Get the appeal to access properties and send notifications
      const appeal = await this.getAppealById(comment.appealId);
      
      if (appeal) {
        // If the comment is from the appellant (property owner), notify staff assigned to the appeal
        if (comment.userId === appeal.userId && appeal.assignedTo) {
          await this.notificationService.sendStaffNotification(
            appeal.assignedTo.toString(),
            'New Appeal Comment',
            `The appellant has added a new comment to appeal #${appeal.appealNumber}.`,
            'appeal',
            appeal.id.toString(),
            'medium',
            {
              appealId: appeal.id,
              appealNumber: appeal.appealNumber,
              commentId: createdComment.id,
              type: 'appeal_comment_added',
              isInternal: comment.internalOnly
            }
          );
        } 
        // If the comment is from staff and not marked as internal, notify the appellant
        else if (comment.userId !== appeal.userId && !comment.internalOnly) {
          await this.notificationService.sendUserNotification(
            appeal.userId.toString(),
            'New Appeal Comment',
            `A staff member has added a new comment to your appeal #${appeal.appealNumber}.`,
            'appeal',
            appeal.id.toString(),
            'medium',
            {
              appealId: appeal.id,
              appealNumber: appeal.appealNumber,
              commentId: createdComment.id,
              type: 'appeal_comment_added'
            }
          );
        }
      }
      
      return createdComment;
    } catch (error) {
      logger.error(`Error adding comment to appeal ${comment.appealId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Add evidence to an appeal
   */
  public async addAppealEvidence(evidence: InsertAppealEvidence): Promise<AppealEvidence> {
    try {
      const createdEvidence = await this.storage.createAppealEvidence(evidence);
      
      // Log the evidence addition
      await this.storage.createSystemActivity({
        activity_type: 'appeal_evidence_added',
        component: 'appeals_management_service',
        status: 'success',
        details: {
          appealId: evidence.appealId,
          evidenceId: createdEvidence.id,
          documentType: evidence.documentType,
          uploadedBy: evidence.uploadedBy
        }
      });
      
      // Get the appeal to access properties and send notifications
      const appeal = await this.getAppealById(evidence.appealId);
      
      if (appeal) {
        // If the evidence is from the appellant (property owner), notify staff assigned to the appeal
        if (evidence.uploadedBy === appeal.userId && appeal.assignedTo) {
          await this.notificationService.sendStaffNotification(
            appeal.assignedTo.toString(),
            'New Appeal Evidence',
            `The appellant has added new evidence (${evidence.documentType}) to appeal #${appeal.appealNumber}.`,
            'appeal',
            appeal.id.toString(),
            'high',
            {
              appealId: appeal.id,
              appealNumber: appeal.appealNumber,
              evidenceId: createdEvidence.id,
              documentType: evidence.documentType,
              type: 'appeal_evidence_added'
            }
          );
        } 
        // If the evidence is from staff, notify the appellant
        else if (evidence.uploadedBy !== appeal.userId) {
          await this.notificationService.sendUserNotification(
            appeal.userId.toString(),
            'New Appeal Evidence',
            `Staff has added new evidence (${evidence.documentType}) to your appeal #${appeal.appealNumber}.`,
            'appeal',
            appeal.id.toString(),
            'high',
            {
              appealId: appeal.id,
              appealNumber: appeal.appealNumber,
              evidenceId: createdEvidence.id,
              documentType: evidence.documentType,
              type: 'appeal_evidence_added'
            }
          );
        }
      }
      
      return createdEvidence;
    } catch (error) {
      logger.error(`Error adding evidence to appeal ${evidence.appealId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Get all comments for an appeal
   */
  public async getAppealComments(appealId: number): Promise<AppealComment[]> {
    try {
      return await this.storage.getAppealCommentsByAppealId(appealId);
    } catch (error) {
      logger.error(`Error fetching comments for appeal ${appealId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Get all evidence for an appeal
   */
  public async getAppealEvidence(appealId: number): Promise<AppealEvidence[]> {
    try {
      return await this.storage.getAppealEvidenceByAppealId(appealId);
    } catch (error) {
      logger.error(`Error fetching evidence for appeal ${appealId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Set hearing date for an appeal
   */
  public async setHearingDate(
    appealId: number, 
    hearingDate: Date, 
    hearingLocation: string | null = null,
    userId: number
  ): Promise<Appeal | null> {
    try {
      // Get the appeal
      const appeal = await this.getAppealById(appealId);
      
      if (!appeal) {
        return null;
      }
      
      // Update hearing date
      const updatedAppeal = await this.storage.updateAppeal(appealId, {
        hearingDate,
        hearingLocation,
        status: AppealStatus.SCHEDULED,
        lastUpdated: new Date()
      });
      
      if (!updatedAppeal) {
        return null;
      }
      
      // Log the hearing date setting
      await this.storage.createSystemActivity({
        activity_type: 'appeal_hearing_scheduled',
        component: 'appeals_management_service',
        status: 'success',
        details: {
          appealId,
          hearingDate: formatDate(hearingDate),
          hearingLocation,
          scheduledBy: userId
        }
      });
      
      // Send notification to appellant
      await this.notificationService.sendUserNotification(
        appeal.userId,
        'Appeal Hearing Scheduled',
        `Your appeal #${appeal.appealNumber} has been scheduled for a hearing on ${formatDate(hearingDate)}${hearingLocation ? ` at ${hearingLocation}` : ''}.`,
        {
          appealId: appeal.id,
          appealNumber: appeal.appealNumber,
          type: 'appeal_hearing_scheduled',
          hearingDate: hearingDate.toISOString(),
          hearingLocation
        }
      );
      
      return updatedAppeal;
    } catch (error) {
      logger.error(`Error setting hearing date for appeal ${appealId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Record appeal decision
   */
  public async recordDecision(
    appealId: number,
    decision: AppealDecision,
    decisionReason: string,
    userId: number
  ): Promise<Appeal | null> {
    try {
      // Get the appeal
      const appeal = await this.getAppealById(appealId);
      
      if (!appeal) {
        return null;
      }
      
      const decisionDate = new Date();
      
      // Update the appeal with the decision
      const updatedAppeal = await this.storage.updateAppeal(appealId, {
        decision,
        decisionReason,
        decisionDate,
        status: AppealStatus.DECIDED,
        lastUpdated: new Date()
      });
      
      if (!updatedAppeal) {
        return null;
      }
      
      // Log the decision
      await this.storage.createSystemActivity({
        activity_type: 'appeal_decision_recorded',
        component: 'appeals_management_service',
        status: 'success',
        details: {
          appealId,
          decision,
          decisionReason,
          decisionDate: formatDate(decisionDate),
          recordedBy: userId
        }
      });
      
      // Send notification to appellant
      await this.notificationService.sendUserNotification(
        appeal.userId,
        'Appeal Decision Recorded',
        `A decision has been made on your appeal #${appeal.appealNumber}: ${decision}. ${decisionReason}`,
        {
          appealId: appeal.id,
          appealNumber: appeal.appealNumber,
          type: 'appeal_decision_recorded',
          decision,
          decisionReason
        }
      );
      
      // Update property value if decision was granted and it's a valuation appeal
      if (decision === AppealDecision.GRANTED && appeal.appealType === AppealType.VALUATION && appeal.requestedValue) {
        // Implementation depends on how property values are updated
        // This might involve creating a validation task or directly updating the property
        logger.info(`Appeal ${appealId} granted - property value will be updated to ${appeal.requestedValue}`);
      }
      
      return updatedAppeal;
    } catch (error) {
      logger.error(`Error recording decision for appeal ${appealId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Get appeal statistics for reporting
   */
  public async getAppealsStatistics(
    fromDate?: Date,
    toDate?: Date
  ): Promise<AppealsStatistics> {
    try {
      // Get all appeals in date range
      const dateFilter = {
        fromDate,
        toDate
      };
      
      const appeals = await this.getAllAppeals(dateFilter);
      
      // Calculate statistics
      const statistics: AppealsStatistics = {
        totalAppeals: appeals.length,
        byStatus: {
          [AppealStatus.SUBMITTED]: 0,
          [AppealStatus.UNDER_REVIEW]: 0,
          [AppealStatus.SCHEDULED]: 0,
          [AppealStatus.HEARD]: 0,
          [AppealStatus.DECIDED]: 0,
          [AppealStatus.WITHDRAWN]: 0
        },
        byType: {
          [AppealType.VALUATION]: 0,
          [AppealType.CLASSIFICATION]: 0,
          [AppealType.EXEMPTION]: 0
        },
        byDecision: {
          [AppealDecision.GRANTED]: 0,
          [AppealDecision.DENIED]: 0,
          [AppealDecision.PARTIAL]: 0
        },
        averageProcessingDays: null,
        successRate: null
      };
      
      // Count by status and type
      appeals.forEach(appeal => {
        // Count by status
        if (appeal.status in statistics.byStatus) {
          statistics.byStatus[appeal.status as AppealStatus]++;
        }
        
        // Count by type
        if (appeal.appealType in statistics.byType) {
          statistics.byType[appeal.appealType as AppealType]++;
        }
        
        // Count by decision for decided appeals
        if (appeal.status === AppealStatus.DECIDED && appeal.decision) {
          if (appeal.decision in statistics.byDecision) {
            statistics.byDecision[appeal.decision as AppealDecision]!++;
          }
        }
      });
      
      // Calculate average processing time (only for decided appeals)
      const decidedAppeals = appeals.filter(a => 
        a.status === AppealStatus.DECIDED && 
        a.decisionDate !== null
      );
      
      if (decidedAppeals.length > 0) {
        const totalDays = decidedAppeals.reduce((sum, appeal) => {
          if (appeal.decisionDate && appeal.dateReceived) {
            const days = Math.ceil(
              (appeal.decisionDate.getTime() - appeal.dateReceived.getTime()) / 
              (1000 * 60 * 60 * 24)
            );
            return sum + days;
          }
          return sum;
        }, 0);
        
        statistics.averageProcessingDays = totalDays / decidedAppeals.length;
      }
      
      // Calculate success rate (granted or partial / total decided)
      if (decidedAppeals.length > 0) {
        const successfulAppeals = decidedAppeals.filter(a => 
          a.decision === AppealDecision.GRANTED || 
          a.decision === AppealDecision.PARTIAL
        ).length;
        
        statistics.successRate = (successfulAppeals / decidedAppeals.length) * 100;
      }
      
      return statistics;
    } catch (error) {
      logger.error(`Error generating appeals statistics: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Generate notification for overdue appeals
   */
  public async notifyOverdueAppeals(thresholdDays: number = 30): Promise<number> {
    try {
      // Get all appeals that aren't decided or withdrawn
      const activeAppeals = await this.getAllAppeals({
        status: AppealStatus.SUBMITTED
      });
      
      const overdueAppeals = activeAppeals.filter(appeal => {
        const daysSinceSubmission = Math.ceil(
          (new Date().getTime() - appeal.dateReceived.getTime()) / 
          (1000 * 60 * 60 * 24)
        );
        
        return daysSinceSubmission > thresholdDays;
      });
      
      // Send notifications for each overdue appeal
      for (const appeal of overdueAppeals) {
        if (appeal.assignedTo) {
          await this.notificationService.sendStaffNotification(
            appeal.assignedTo,
            'Overdue Appeal Reminder',
            `Appeal #${appeal.appealNumber} has been in status "${appeal.status}" for more than ${thresholdDays} days.`,
            {
              appealId: appeal.id,
              appealNumber: appeal.appealNumber,
              type: 'appeal_overdue',
              status: appeal.status
            }
          );
        }
      }
      
      return overdueAppeals.length;
    } catch (error) {
      logger.error(`Error notifying overdue appeals: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Assign appeal to a staff member
   */
  public async assignAppeal(
    appealId: number, 
    assigneeId: number, 
    assignerId: number
  ): Promise<Appeal | null> {
    try {
      // Get the appeal
      const appeal = await this.getAppealById(appealId);
      
      if (!appeal) {
        return null;
      }
      
      // Update the appeal with the assignee
      const updatedAppeal = await this.storage.updateAppeal(appealId, {
        assignedTo: assigneeId,
        lastUpdated: new Date()
      });
      
      if (!updatedAppeal) {
        return null;
      }
      
      // Log the assignment
      await this.storage.createSystemActivity({
        activity_type: 'appeal_assigned',
        component: 'appeals_management_service',
        status: 'success',
        details: {
          appealId,
          assigneeId,
          assignerId
        }
      });
      
      // Send notification to assignee
      await this.notificationService.sendStaffNotification(
        assigneeId,
        'Appeal Assigned',
        `You have been assigned to handle appeal #${appeal.appealNumber} for property ID ${appeal.propertyId}.`,
        {
          appealId: appeal.id,
          appealNumber: appeal.appealNumber,
          type: 'appeal_assigned'
        }
      );
      
      return updatedAppeal;
    } catch (error) {
      logger.error(`Error assigning appeal ${appealId} to staff member ${assigneeId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Mark appeal as withdrawn
   */
  public async withdrawAppeal(
    appealId: number, 
    withdrawalReason: string,
    userId: number
  ): Promise<Appeal | null> {
    try {
      // Get the appeal before updating
      const appeal = await this.getAppealById(appealId);
      
      if (!appeal) {
        return null;
      }
      
      // Update the appeal status
      const updatedAppeal = await this.storage.updateAppeal(appealId, {
        status: AppealStatus.WITHDRAWN,
        decisionReason: withdrawalReason,
        lastUpdated: new Date()
      });
      
      if (!updatedAppeal) {
        return null;
      }
      
      // Log the withdrawal
      await this.storage.createSystemActivity({
        activity_type: 'appeal_withdrawn',
        component: 'appeals_management_service',
        status: 'success',
        details: {
          appealId,
          withdrawalReason,
          withdrawnBy: userId
        }
      });
      
      // Send notification to appropriate party based on who withdrew it
      if (userId === appeal.userId) {
        // Appellant withdrew their own appeal - notify staff (if assigned)
        if (appeal.assignedTo) {
          await this.notificationService.sendStaffNotification(
            appeal.assignedTo.toString(),
            'Appeal Withdrawn',
            `Appeal #${appeal.appealNumber} has been withdrawn by the appellant. Reason: ${withdrawalReason}`,
            'appeal',
            appeal.id.toString(),
            'medium',
            {
              appealId: appeal.id,
              appealNumber: appeal.appealNumber,
              type: 'appeal_withdrawn',
              withdrawalReason
            }
          );
        }
      } else {
        // Staff withdrew the appeal - notify appellant
        await this.notificationService.sendUserNotification(
          appeal.userId.toString(),
          'Appeal Withdrawn',
          `Your appeal #${appeal.appealNumber} has been withdrawn. Reason: ${withdrawalReason}`,
          'appeal',
          appeal.id.toString(),
          'medium',
          {
            appealId: appeal.id,
            appealNumber: appeal.appealNumber,
            type: 'appeal_withdrawn',
            withdrawalReason
          }
        );
      }
      
      return updatedAppeal;
    } catch (error) {
      logger.error(`Error withdrawing appeal ${appealId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  // Private methods
  
  /**
   * Validate appeal data before creation
   */
  private validateAppealData(appeal: InsertAppeal): void {
    // Basic validation
    if (!appeal.propertyId) {
      throw new Error('Appeal must have a property ID');
    }
    
    if (!appeal.userId) {
      throw new Error('Appeal must have a user ID');
    }
    
    if (!appeal.reason) {
      throw new Error('Appeal must have a reason');
    }
    
    if (!appeal.appealType) {
      throw new Error('Appeal must have an appeal type');
    }
    
    // For valuation appeals, make sure requestedValue is provided
    if (appeal.appealType === AppealType.VALUATION && !appeal.requestedValue) {
      throw new Error('Valuation appeals must include a requested value');
    }
  }
  
  /**
   * Start the appeal workflow process
   */
  private async startAppealWorkflow(appeal: Appeal): Promise<void> {
    try {
      // Check if appeal workflow definition exists, create if not
      const workflowDefinitions = await this.workflowEngine.getAllWorkflowDefinitions(true);
      const appealWorkflow = workflowDefinitions.find(
        wf => wf.definitionId === 'appeal_processing_workflow'
      );
      
      if (!appealWorkflow) {
        // Create the appeal workflow definition
        await this.workflowEngine.createAppealProcessingWorkflow(appeal.userId);
      }
      
      // Start new workflow instance for this appeal
      await this.workflowEngine.startWorkflow({
        definitionId: 'appeal_processing_workflow',
        entityType: 'appeal',
        entityId: String(appeal.id),
        data: {
          appealId: appeal.id,
          appealNumber: appeal.appealNumber,
          propertyId: appeal.propertyId,
          appealType: appeal.appealType,
          requestedValue: appeal.requestedValue,
          assignedTo: appeal.assignedTo
        },
        startedBy: appeal.userId
      });
      
      logger.info(`Started appeal workflow for appeal ${appeal.id}`);
    } catch (error) {
      logger.error(`Error starting appeal workflow for appeal ${appeal.id}: ${error instanceof Error ? error.message : String(error)}`);
      // Don't throw error, as appeal was created successfully
    }
  }
  
  /**
   * Handle appeal status changes and update workflow as needed
   */
  private async handleAppealStatusChange(appeal: Appeal, newStatus: AppealStatus): Promise<void> {
    try {
      // Get workflow instance for this appeal
      const workflowInstances = await this.workflowEngine.getWorkflowsByEntityId(
        String(appeal.id),
        'appeal'
      );
      
      if (workflowInstances.length === 0) {
        logger.warn(`No workflow instance found for appeal ${appeal.id}`);
        return;
      }
      
      const workflowInstance = workflowInstances[0];
      
      // Update workflow step based on status
      switch (newStatus) {
        case AppealStatus.UNDER_REVIEW:
          await this.workflowEngine.progressWorkflow(
            workflowInstance.instanceId,
            'step_review',
            appeal.assignedTo || 1, // Default to user 1 if unassigned
            {
              action: 'start_review',
              notes: `Appeal status changed to ${newStatus}`
            }
          );
          break;
          
        case AppealStatus.SCHEDULED:
          await this.workflowEngine.progressWorkflow(
            workflowInstance.instanceId,
            'step_schedule',
            appeal.assignedTo || 1,
            {
              action: 'schedule_hearing',
              notes: `Appeal status changed to ${newStatus}`
            }
          );
          break;
          
        case AppealStatus.HEARD:
          await this.workflowEngine.progressWorkflow(
            workflowInstance.instanceId,
            'step_hearing',
            appeal.assignedTo || 1,
            {
              action: 'complete_hearing',
              notes: `Appeal status changed to ${newStatus}`
            }
          );
          break;
          
        case AppealStatus.DECIDED:
          // Decision could be granted, denied, or partial
          if (appeal.decision === AppealDecision.GRANTED) {
            await this.workflowEngine.progressWorkflow(
              workflowInstance.instanceId,
              'step_grant',
              appeal.assignedTo || 1,
              {
                action: 'grant_appeal',
                notes: `Appeal granted: ${appeal.decisionReason}`
              }
            );
          } else if (appeal.decision === AppealDecision.DENIED) {
            await this.workflowEngine.progressWorkflow(
              workflowInstance.instanceId,
              'step_reject',
              appeal.assignedTo || 1,
              {
                action: 'reject_appeal',
                notes: `Appeal denied: ${appeal.decisionReason}`
              }
            );
          } else {
            // Partial decision
            await this.workflowEngine.progressWorkflow(
              workflowInstance.instanceId,
              'step_partial',
              appeal.assignedTo || 1,
              {
                action: 'partial_appeal',
                notes: `Appeal partially granted: ${appeal.decisionReason}`
              }
            );
          }
          break;
          
        case AppealStatus.WITHDRAWN:
          await this.workflowEngine.completeWorkflow(
            workflowInstance.instanceId,
            appeal.assignedTo || 1,
            {
              outcome: 'withdrawn',
              notes: `Appeal withdrawn: ${appeal.decisionReason}`
            }
          );
          break;
      }
    } catch (error) {
      logger.error(`Error handling appeal status change for appeal ${appeal.id}: ${error instanceof Error ? error.message : String(error)}`);
      // Don't throw error, as status change was successful
    }
  }
}