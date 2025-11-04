import OpenAI from "openai";
import { storage } from "./storage";
import { Audit, AuditEvent, User } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export interface AuditRecommendation {
  id: string;
  type: 'risk_assessment' | 'workload_optimization' | 'compliance_priority' | 'resource_allocation';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-1 scale
  suggestedActions: string[];
  riskFactors: string[];
  estimatedTimeToComplete?: number; // in days
  recommendedAssignee?: number; // user ID
  deadline?: Date;
  reasoning: string;
  relatedAudits?: number[]; // audit IDs
  metadata: {
    analysisDate: Date;
    dataPointsAnalyzed: number;
    categories: string[];
  };
}

export interface RecommendationContext {
  recentAudits: Audit[];
  auditEvents: AuditEvent[];
  users: User[];
  workloadMetrics: {
    averageCompletionTime: number;
    pendingCount: number;
    overduCount: number;
  };
  riskFactors: {
    highRiskPropertyTypes: string[];
    complianceIssues: string[];
    historicalProblems: string[];
  };
}

export class AIRecommendationEngine {
  private async gatherContext(): Promise<RecommendationContext> {
    // Gather recent audit data
    const recentAudits = await storage.getAudits();
    const auditEvents = await storage.getRecentAuditEvents(100);
    const users = await Promise.all(
      Array.from(new Set(recentAudits.map(a => a.assignedToId).filter(Boolean)))
        .map(id => storage.getUser(id!))
    ).then(users => users.filter(Boolean) as User[]);

    // Calculate workload metrics
    const pendingAudits = await storage.getPendingAudits();
    const completedAudits = recentAudits.filter(a => a.status === 'approved');
    const overdueAudits = recentAudits.filter(a => 
      a.dueDate && new Date(a.dueDate) < new Date() && a.status !== 'approved'
    );

    const averageCompletionTime = completedAudits.length > 0 
      ? completedAudits.reduce((sum, audit) => {
          const created = new Date(audit.submittedAt).getTime();
          const updated = audit.updatedAt ? new Date(audit.updatedAt).getTime() : created;
          return sum + (updated - created);
        }, 0) / completedAudits.length / (1000 * 60 * 60 * 24) // Convert to days
      : 0;

    // Identify risk factors
    const propertyTypes = recentAudits.map(a => a.propertyType).filter(Boolean);
    const highRiskPropertyTypes = Array.from(new Set(propertyTypes))
      .map(type => ({
        type,
        count: propertyTypes.filter(p => p === type).length
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(p => p.type);

    return {
      recentAudits,
      auditEvents,
      users,
      workloadMetrics: {
        averageCompletionTime,
        pendingCount: pendingAudits.length,
        overduCount: overdueAudits.length
      },
      riskFactors: {
        highRiskPropertyTypes: highRiskPropertyTypes.filter(type => type !== null) as string[],
        complianceIssues: [], // Can be enhanced with compliance tracking
        historicalProblems: [] // Can be enhanced with problem pattern analysis
      }
    };
  }

  private async analyzeWithAI(context: RecommendationContext, analysisType: string): Promise<any> {
    const prompt = this.buildPrompt(context, analysisType);
    
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert audit analyst for county government operations. Analyze audit data and provide actionable recommendations in JSON format."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3 // Lower temperature for more consistent analysis
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('AI Analysis Error:', error);
      throw new Error(`AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildPrompt(context: RecommendationContext, analysisType: string): string {
    const auditSummary = {
      totalAudits: context.recentAudits.length,
      pendingCount: context.workloadMetrics.pendingCount,
      overdueCount: context.workloadMetrics.overduCount,
      averageCompletionDays: Math.round(context.workloadMetrics.averageCompletionTime),
      auditTypes: Array.from(new Set(context.recentAudits.map(a => a.auditType))),
      propertyTypes: Array.from(new Set(context.recentAudits.map(a => a.propertyType).filter(Boolean))),
      priorityDistribution: {
        urgent: context.recentAudits.filter(a => a.priority === 'urgent').length,
        high: context.recentAudits.filter(a => a.priority === 'high').length,
        normal: context.recentAudits.filter(a => a.priority === 'normal').length,
        low: context.recentAudits.filter(a => a.priority === 'low').length
      },
      statusDistribution: {
        pending: context.recentAudits.filter(a => a.status === 'pending').length,
        in_progress: context.recentAudits.filter(a => a.status === 'in_progress').length,
        under_review: context.recentAudits.filter(a => a.status === 'under_review').length,
        approved: context.recentAudits.filter(a => a.status === 'approved').length
      },
      teamCapacity: context.users.length,
      recentEvents: context.auditEvents.slice(0, 10).map(e => ({
        type: e.eventType,
        comment: e.comment || 'No comment'
      }))
    };

    switch (analysisType) {
      case 'workload_optimization':
        return `Analyze the following audit workload data and provide recommendations for optimization:

${JSON.stringify(auditSummary, null, 2)}

Provide recommendations in this JSON format:
{
  "recommendations": [
    {
      "type": "workload_optimization",
      "title": "Recommendation title",
      "description": "Detailed description",
      "priority": "high|medium|low|critical",
      "confidence": 0.85,
      "suggestedActions": ["Action 1", "Action 2"],
      "riskFactors": ["Risk 1", "Risk 2"],
      "estimatedTimeToComplete": 7,
      "reasoning": "Why this recommendation is important"
    }
  ]
}

Focus on workload balance, resource allocation, and efficiency improvements.`;

      case 'risk_assessment':
        return `Analyze audit data for risk patterns and provide risk-based recommendations:

${JSON.stringify(auditSummary, null, 2)}

Provide risk assessment recommendations in JSON format focusing on:
- High-risk property types or audit categories
- Compliance vulnerabilities
- Resource bottlenecks
- Timeline risks

Use the same JSON structure as above but with type: "risk_assessment"`;

      case 'compliance_priority':
        return `Analyze audit data to identify compliance priorities and urgent areas needing attention:

${JSON.stringify(auditSummary, null, 2)}

Provide compliance-focused recommendations in JSON format focusing on:
- Regulatory compliance gaps
- Overdue audits requiring immediate attention
- Systematic compliance issues
- Process improvements for compliance

Use the same JSON structure as above but with type: "compliance_priority"`;

      default:
        return `Analyze the audit data and provide general recommendations for improvement:

${JSON.stringify(auditSummary, null, 2)}

Provide recommendations in the specified JSON format.`;
    }
  }

  async generateRecommendations(analysisTypes?: string[]): Promise<AuditRecommendation[]> {
    const context = await this.gatherContext();
    const types = analysisTypes || ['workload_optimization', 'risk_assessment', 'compliance_priority'];
    
    const allRecommendations: AuditRecommendation[] = [];

    for (const analysisType of types) {
      try {
        const aiResponse = await this.analyzeWithAI(context, analysisType);
        
        if (aiResponse.recommendations && Array.isArray(aiResponse.recommendations)) {
          const recommendations = aiResponse.recommendations.map((rec: any /* , index */: number) => ({
            id: `${analysisType}_${Date.now()}_${index}`,
            type: rec.type || analysisType,
            title: rec.title || 'AI Recommendation',
            description: rec.description || 'No description provided',
            priority: rec.priority || 'medium',
            confidence: Math.min(Math.max(rec.confidence || 0.5, 0), 1),
            suggestedActions: Array.isArray(rec.suggestedActions) ? rec.suggestedActions : [],
            riskFactors: Array.isArray(rec.riskFactors) ? rec.riskFactors : [],
            estimatedTimeToComplete: rec.estimatedTimeToComplete,
            reasoning: rec.reasoning || 'Generated by AI analysis',
            metadata: {
              analysisDate: new Date(),
              dataPointsAnalyzed: context.recentAudits.length + context.auditEvents.length,
              categories: [analysisType]
            }
          }));

          allRecommendations.push(...recommendations);
        }
      } catch (error) {
        console.error(`Failed to generate ${analysisType} recommendations:`, error);
        // Continue with other analysis types even if one fails
      }
    }

    // Sort by priority and confidence
    return allRecommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority] || 1;
      const bPriority = priorityOrder[b.priority] || 1;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return b.confidence - a.confidence;
    });
  }

  async generatePersonalizedRecommendations(userId: number): Promise<AuditRecommendation[]> {
    const context = await this.gatherContext();
    const user = await storage.getUser(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    const userAudits = await storage.getAssignedAudits(userId);
    const userCreatedAudits = await storage.getAuditsCreatedByUser(userId);
    
    const personalizedPrompt = `Analyze audit data for personalized recommendations for user: ${user.username} (${user.role})

User's Audit History:
- Assigned audits: ${userAudits.length}
- Created audits: ${userCreatedAudits.length}
- User role: ${user.role}

System Context:
${JSON.stringify({
      totalAudits: context.recentAudits.length,
      pendingCount: context.workloadMetrics.pendingCount,
      userWorkload: userAudits.filter(a => a.status !== 'approved').length
    }, null, 2)}

Provide personalized recommendations in JSON format focusing on:
- User's expertise and role-specific tasks
- Workload optimization for this specific user
- Skill development opportunities
- Priority tasks based on user's history

Use this JSON structure:
{
  "recommendations": [
    {
      "type": "resource_allocation",
      "title": "Recommendation title",
      "description": "Personalized description",
      "priority": "high|medium|low|critical",
      "confidence": 0.85,
      "suggestedActions": ["Action 1", "Action 2"],
      "riskFactors": ["Risk 1", "Risk 2"],
      "estimatedTimeToComplete": 7,
      "recommendedAssignee": ${userId},
      "reasoning": "Why this is relevant for this user"
    }
  ]
}`;

    try {
      const aiResponse = await this.analyzeWithAI(context, 'personalized');
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert audit analyst providing personalized recommendations for county audit staff."
          },
          {
            role: "user",
            content: personalizedPrompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      if (result.recommendations && Array.isArray(result.recommendations)) {
        return result.recommendations.map((rec: any /* , index */: number) => ({
          id: `personalized_${userId}_${Date.now()}_${index}`,
          type: rec.type || 'resource_allocation',
          title: rec.title || 'Personalized Recommendation',
          description: rec.description || 'No description provided',
          priority: rec.priority || 'medium',
          confidence: Math.min(Math.max(rec.confidence || 0.5, 0), 1),
          suggestedActions: Array.isArray(rec.suggestedActions) ? rec.suggestedActions : [],
          riskFactors: Array.isArray(rec.riskFactors) ? rec.riskFactors : [],
          estimatedTimeToComplete: rec.estimatedTimeToComplete,
          recommendedAssignee: userId,
          reasoning: rec.reasoning || 'Generated by personalized AI analysis',
          metadata: {
            analysisDate: new Date(),
            dataPointsAnalyzed: userAudits.length + userCreatedAudits.length,
            categories: ['personalized', user.role]
          }
        }));
      }
    } catch (error) {
      console.error('Failed to generate personalized recommendations:', error);
    }

    return [];
  }

  async analyzeAuditRisk(auditId: number): Promise<{
    riskScore: number;
    riskFactors: string[];
    recommendations: string[];
    confidence: number;
  }> {
    const audit = await storage.getAuditById(auditId);
    if (!audit) {
      throw new Error('Audit not found');
    }

    const auditEvents = await storage.getAuditEvents(auditId);
    const context = await this.gatherContext();
    
    // Find similar audits for comparison
    const similarAudits = context.recentAudits.filter(a => 
      a.id !== auditId && 
      (a.auditType === audit.auditType || a.propertyType === audit.propertyType)
    );

    const riskAnalysisPrompt = `Analyze the risk level for this specific audit:

Current Audit:
${JSON.stringify({
      id: audit.id,
      auditNumber: audit.auditNumber,
      title: audit.title,
      auditType: audit.auditType,
      propertyType: audit.propertyType,
      priority: audit.priority,
      status: audit.status,
      dueDate: audit.dueDate,
      submittedAt: audit.submittedAt,
      assignedToId: audit.assignedToId
    }, null, 2)}

Audit Events:
${JSON.stringify(auditEvents.map(e => ({
      eventType: e.eventType,
      comment: e.comment,
      timestamp: e.timestamp
    })), null, 2)}

Similar Audits (for comparison):
${JSON.stringify(similarAudits.slice(0, 5).map(a => ({
      auditType: a.auditType,
      propertyType: a.propertyType,
      status: a.status,
      priority: a.priority
    })), null, 2)}

Provide a risk analysis in this JSON format:
{
  "riskScore": 0.75,
  "riskFactors": ["Factor 1", "Factor 2"],
  "recommendations": ["Recommendation 1", "Recommendation 2"],
  "confidence": 0.85
}

Risk score should be 0-1 where 1 is highest risk. Consider factors like:
- Deadline pressure
- Complexity of audit type
- Historical issues with similar audits
- Resource availability
- Compliance requirements`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert audit risk analyst for county government operations."
          },
          {
            role: "user",
            content: riskAnalysisPrompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        riskScore: Math.min(Math.max(result.riskScore || 0.5, 0), 1),
        riskFactors: Array.isArray(result.riskFactors) ? result.riskFactors : [],
        recommendations: Array.isArray(result.recommendations) ? result.recommendations : [],
        confidence: Math.min(Math.max(result.confidence || 0.5, 0), 1)
      };
    } catch (error) {
      console.error('Failed to analyze audit risk:', error);
      throw new Error(`Risk analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const aiRecommendationEngine = new AIRecommendationEngine();