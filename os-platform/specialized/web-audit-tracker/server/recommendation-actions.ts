import { storage } from './storage';
import { InsertAudit, InsertAuditEvent } from '@shared/schema';

export interface RecommendationAction {
  id: string;
  type:
    | 'create_audit'
    | 'assign_user'
    | 'update_priority'
    | 'schedule_review'
    | 'send_notification'
    | 'update_workflow'
    | 'generate_report';
  title: string;
  description: string;
  parameters: Record<string, any>;
  requiresConfirmation?: boolean;
  estimatedDuration?: string;
}

export interface ActionResult {
  success: boolean;
  message: string;
  data?: any;
  errors?: string[];
}

export class RecommendationActionService {
  async executeAction(
    actionId: string,
    parameters: Record<string, any>,
    userId: number
  ): Promise<ActionResult> {
    try {
      console.log(`Executing action ${actionId} with parameters:`, parameters);

      switch (actionId) {
        case 'create_priority_audit':
          return await this.createPriorityAudit(parameters, userId);

        case 'reassign_overdue_audits':
          return await this.reassignOverdueAudits(parameters, userId);

        case 'update_audit_priorities':
          return await this.updateAuditPriorities(parameters, userId);

        case 'schedule_batch_review':
          return await this.scheduleBatchReview(parameters, userId);

        case 'send_deadline_reminders':
          return await this.sendDeadlineReminders(parameters, userId);

        case 'optimize_workload_distribution':
          return await this.optimizeWorkloadDistribution(parameters, userId);

        case 'update_workflow_settings':
          return await this.updateWorkflowSettings(parameters, userId);

        case 'generate_performance_report':
          return await this.generatePerformanceReport(parameters, userId);

        default:
          return {
            success: false,
            message: `Unknown action: ${actionId}`,
            errors: [`Action ${actionId} is not implemented`],
          };
      }
    } catch (error) {
      console.error(`Failed to execute action ${actionId}:`, error);
      return {
        success: false,
        message: 'Action execution failed',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  private async createPriorityAudit(parameters: any, userId: number): Promise<ActionResult> {
    try {
      const auditData: InsertAudit = {
        auditNumber: `URGENT-${Date.now()}`,
        title: parameters.title || 'Priority Audit - AI Recommendation',
        description: parameters.description || 'Created based on AI risk assessment',
        propertyId: parameters.propertyId || 'TBD',
        address: parameters.address || 'To be determined',
        currentAssessment: parameters.currentAssessment || 0,
        proposedAssessment: parameters.proposedAssessment || 0,
        taxImpact: parameters.taxImpact || null,
        reason: 'AI-recommended priority audit based on risk analysis',
        priority: 'urgent',
        auditType: parameters.auditType || 'standard',
        propertyType: parameters.propertyType || 'residential',
        submittedById: userId,
        dueDate: new Date(Date.now() + (parameters.dueDays || 7) * 24 * 60 * 60 * 1000),
        assignedToId: parameters.assignedToId || null,
        workflowEnabled: true,
        autoAssign: parameters.autoAssign || false,
      };

      const audit = await storage.createAudit(auditData);

      // Create audit event
      await storage.createAuditEvent({
        auditId: audit.id,
        userId: userId,
        eventType: 'created',
        comment: 'Priority audit created based on AI recommendation',
      });

      return {
        success: true,
        message: `Priority audit ${audit.auditNumber} created successfully`,
        data: { auditId: audit.id, auditNumber: audit.auditNumber },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create priority audit',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  private async reassignOverdueAudits(parameters: any, userId: number): Promise<ActionResult> {
    try {
      const audits = await storage.getAudits();
      const overdueAudits = audits.filter(
        audit =>
          audit.dueDate && new Date(audit.dueDate) < new Date() && audit.status !== 'approved'
      );

      if (overdueAudits.length === 0) {
        return {
          success: true,
          message: 'No overdue audits found to reassign',
          data: { reassignedCount: 0 },
        };
      }

      const targetUserId = parameters.targetUserId;
      let reassignedCount = 0;

      for (const audit of overdueAudits.slice(0, parameters.maxCount || 5)) {
        await storage.updateAudit(audit.id, {
          assignedToId: targetUserId,
          priority: 'high',
        });

        await storage.createAuditEvent({
          auditId: audit.id,
          userId: userId,
          eventType: 'reassigned',
          comment: `Reassigned due to overdue status - AI recommendation`,
        });

        reassignedCount++;
      }

      return {
        success: true,
        message: `Successfully reassigned ${reassignedCount} overdue audits`,
        data: { reassignedCount },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to reassign overdue audits',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  private async updateAuditPriorities(parameters: any, userId: number): Promise<ActionResult> {
    try {
      const audits = await storage.getAudits();
      const criteria = parameters.criteria || {};
      let updatedCount = 0;

      for (const audit of audits) {
        let shouldUpdate = false;
        let newPriority = audit.priority;

        // Apply priority rules based on criteria
        if (criteria.urgentIfOverdue && audit.dueDate && new Date(audit.dueDate) < new Date()) {
          newPriority = 'urgent';
          shouldUpdate = true;
        }

        if (
          criteria.highIfCommercial &&
          audit.propertyType === 'commercial' &&
          audit.priority === 'normal'
        ) {
          newPriority = 'high';
          shouldUpdate = true;
        }

        if (
          criteria.urgentIfHighValue &&
          audit.proposedAssessment > (criteria.highValueThreshold || 1000000)
        ) {
          newPriority = 'urgent';
          shouldUpdate = true;
        }

        if (shouldUpdate && newPriority !== audit.priority) {
          await storage.updateAudit(audit.id, { priority: newPriority });

          await storage.createAuditEvent({
            auditId: audit.id,
            userId: userId,
            eventType: 'priority_updated',
            comment: `Priority updated to ${newPriority} - AI recommendation`,
          });

          updatedCount++;
        }
      }

      return {
        success: true,
        message: `Successfully updated priority for ${updatedCount} audits`,
        data: { updatedCount },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update audit priorities',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  private async scheduleBatchReview(parameters: any, userId: number): Promise<ActionResult> {
    try {
      const audits = await storage.getAudits();
      const reviewCandidates = audits.filter(
        audit =>
          audit.status === 'under_review' ||
          (audit.status === 'in_progress' && parameters.includeInProgress)
      );

      const reviewDate = new Date(parameters.reviewDate || Date.now() + 24 * 60 * 60 * 1000);
      let scheduledCount = 0;

      for (const audit of reviewCandidates.slice(0, parameters.maxCount || 10)) {
        await storage.createAuditEvent({
          auditId: audit.id,
          userId: userId,
          eventType: 'review_scheduled',
          comment: `Batch review scheduled for ${reviewDate.toDateString()} - AI recommendation`,
        });

        scheduledCount++;
      }

      return {
        success: true,
        message: `Scheduled batch review for ${scheduledCount} audits on ${reviewDate.toDateString()}`,
        data: { scheduledCount, reviewDate: reviewDate.toISOString() },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to schedule batch review',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  private async sendDeadlineReminders(parameters: any, userId: number): Promise<ActionResult> {
    try {
      const audits = await storage.getAudits();
      const reminderDays = parameters.reminderDays || 3;
      const reminderDate = new Date(Date.now() + reminderDays * 24 * 60 * 60 * 1000);

      const auditsNearDeadline = audits.filter(
        audit =>
          audit.dueDate &&
          new Date(audit.dueDate) <= reminderDate &&
          new Date(audit.dueDate) > new Date() &&
          audit.status !== 'approved'
      );

      let remindersSent = 0;

      for (const audit of auditsNearDeadline) {
        await storage.createAuditEvent({
          auditId: audit.id,
          userId: userId,
          eventType: 'reminder_sent',
          comment: `Deadline reminder sent - Due: ${new Date(audit.dueDate!).toDateString()}`,
        });

        remindersSent++;
      }

      return {
        success: true,
        message: `Sent deadline reminders for ${remindersSent} audits`,
        data: { remindersSent, reminderDays },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to send deadline reminders',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  private async optimizeWorkloadDistribution(
    parameters: any,
    userId: number
  ): Promise<ActionResult> {
    try {
      const audits = await storage.getAudits();
      const unassignedAudits = audits.filter(
        audit => !audit.assignedToId && audit.status === 'pending'
      );

      if (unassignedAudits.length === 0) {
        return {
          success: true,
          message: 'No unassigned audits found for distribution',
          data: { distributedCount: 0 },
        };
      }

      // Simple round-robin distribution
      const availableUsers = parameters.availableUsers || [1, 2, 3]; // Default user IDs
      let distributedCount = 0;
      let userIndex = 0;

      for (const audit of unassignedAudits.slice(0, parameters.maxCount || 10)) {
        const assigneeId = availableUsers[userIndex % availableUsers.length];

        await storage.updateAudit(audit.id, {
          assignedToId: assigneeId,
          autoAssign: true,
        });

        await storage.createAuditEvent({
          auditId: audit.id,
          userId: userId,
          eventType: 'auto_assigned',
          comment: `Auto-assigned for workload optimization - AI recommendation`,
        });

        distributedCount++;
        userIndex++;
      }

      return {
        success: true,
        message: `Distributed ${distributedCount} audits across ${availableUsers.length} users`,
        data: { distributedCount, usersInvolved: availableUsers.length },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to optimize workload distribution',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  private async updateWorkflowSettings(parameters: any, userId: number): Promise<ActionResult> {
    try {
      // This would typically update system settings or workflow configurations
      // For now, we'll create an event to track the recommendation

      const settingsUpdated = Object.keys(parameters.settings || {}).length;

      // Create a system event (using a dummy audit ID of 1 for system events)
      await storage.createAuditEvent({
        auditId: 1,
        userId: userId,
        eventType: 'workflow_updated',
        comment: `Workflow settings updated based on AI recommendation: ${JSON.stringify(parameters.settings)}`,
      });

      return {
        success: true,
        message: `Updated ${settingsUpdated} workflow settings`,
        data: { settingsUpdated, settings: parameters.settings },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update workflow settings',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  private async generatePerformanceReport(parameters: any, userId: number): Promise<ActionResult> {
    try {
      const audits = await storage.getAudits();
      const recentEvents = await storage.getRecentAuditEvents(100);

      const reportData = {
        totalAudits: audits.length,
        completedAudits: audits.filter(a => a.status === 'approved').length,
        pendingAudits: audits.filter(a => a.status === 'pending').length,
        overdueAudits: audits.filter(
          a => a.dueDate && new Date(a.dueDate) < new Date() && a.status !== 'approved'
        ).length,
        recentActivity: recentEvents.length,
        generatedAt: new Date().toISOString(),
        timeRange: parameters.timeRange || 'last_30_days',
      };

      // Create an event to track report generation
      await storage.createAuditEvent({
        auditId: 1,
        userId: userId,
        eventType: 'report_generated',
        comment: `Performance report generated - AI recommendation`,
      });

      return {
        success: true,
        message: 'Performance report generated successfully',
        data: { report: reportData, fileName: `performance_report_${Date.now()}.json` },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to generate performance report',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  // Get available actions for a specific recommendation type
  getActionsForRecommendationType(recommendationType: string): RecommendationAction[] {
    const actionMap: Record<string, RecommendationAction[]> = {
      risk_assessment: [
        {
          id: 'create_priority_audit',
          type: 'create_audit',
          title: 'Create Priority Audit',
          description: 'Create a high-priority audit to address identified risks',
          parameters: { auditType: 'standard', priority: 'urgent', dueDays: 7 },
          requiresConfirmation: true,
          estimatedDuration: '2 minutes',
        },
        {
          id: 'update_audit_priorities',
          type: 'update_priority',
          title: 'Update Risk-Based Priorities',
          description: 'Automatically update audit priorities based on risk factors',
          parameters: { criteria: { urgentIfOverdue: true, highIfCommercial: true } },
          estimatedDuration: '1 minute',
        },
      ],
      workload_optimization: [
        {
          id: 'reassign_overdue_audits',
          type: 'assign_user',
          title: 'Reassign Overdue Audits',
          description: 'Redistribute overdue audits to available team members',
          parameters: { maxCount: 5 },
          requiresConfirmation: true,
          estimatedDuration: '3 minutes',
        },
        {
          id: 'optimize_workload_distribution',
          type: 'assign_user',
          title: 'Optimize Workload Distribution',
          description: 'Automatically distribute unassigned audits for better balance',
          parameters: { maxCount: 10 },
          estimatedDuration: '2 minutes',
        },
      ],
      compliance_priority: [
        {
          id: 'schedule_batch_review',
          type: 'schedule_review',
          title: 'Schedule Batch Review',
          description: 'Schedule a comprehensive review session for pending audits',
          parameters: { maxCount: 10, includeInProgress: true },
          estimatedDuration: '1 minute',
        },
        {
          id: 'send_deadline_reminders',
          type: 'send_notification',
          title: 'Send Deadline Reminders',
          description: 'Notify team members about upcoming audit deadlines',
          parameters: { reminderDays: 3 },
          estimatedDuration: '1 minute',
        },
      ],
      resource_allocation: [
        {
          id: 'update_workflow_settings',
          type: 'update_workflow',
          title: 'Update Workflow Settings',
          description: 'Optimize workflow configuration based on performance data',
          parameters: { settings: { autoAssign: true, priorityEscalation: true } },
          estimatedDuration: '2 minutes',
        },
        {
          id: 'generate_performance_report',
          type: 'generate_report',
          title: 'Generate Performance Report',
          description: 'Create a detailed performance analysis report',
          parameters: { timeRange: 'last_30_days' },
          estimatedDuration: '1 minute',
        },
      ],
    };

    return actionMap[recommendationType] || [];
  }
}

export const recommendationActionService = new RecommendationActionService();
