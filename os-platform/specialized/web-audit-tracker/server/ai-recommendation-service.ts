import OpenAI from "openai";
import { storage } from "./storage";
import { enhancedAIFallback } from "./enhanced-ai-fallback";

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
  confidence: number;
  suggestedActions: string[];
  riskFactors: string[];
  estimatedTimeToComplete?: number;
  recommendedAssignee?: number;
  reasoning: string;
  metadata: {
    analysisDate: Date;
    dataPointsAnalyzed: number;
    categories: string[];
  };
}

export interface RiskAnalysis {
  riskScore: number;
  riskFactors: string[];
  recommendations: string[];
  confidence: number;
}

export class AIRecommendationService {
  async generateGeneralRecommendations(): Promise<AuditRecommendation[]> {
    try {
      // Gather audit data
      const audits = await storage.getAudits();
      const pendingAudits = await storage.getPendingAudits();
      const recentEvents = await storage.getRecentAuditEvents(50);

      // Calculate basic metrics
      const totalAudits = audits.length;
      const pendingCount = pendingAudits.length;
      const completedAudits = audits.filter(a => a.status === 'approved');
      const overdueAudits = audits.filter(a => 
        a.dueDate && new Date(a.dueDate) < new Date() && a.status !== 'approved'
      );

      // Status distribution
      const statusCounts = {
        pending: audits.filter(a => a.status === 'pending').length,
        in_progress: audits.filter(a => a.status === 'in_progress').length,
        under_review: audits.filter(a => a.status === 'under_review').length,
        approved: audits.filter(a => a.status === 'approved').length
      };

      // Priority distribution
      const priorityCounts = {
        low: audits.filter(a => a.priority === 'low').length,
        normal: audits.filter(a => a.priority === 'normal').length,
        high: audits.filter(a => a.priority === 'high').length,
        urgent: audits.filter(a => a.priority === 'urgent').length
      };

      const analysisData = {
        totalAudits,
        pendingCount,
        completedCount: completedAudits.length,
        overdueCount: overdueAudits.length,
        statusDistribution: statusCounts,
        priorityDistribution: priorityCounts,
        recentEventCount: recentEvents.length,
        averageProcessingTime: this.calculateAverageProcessingTime(audits)
      };

      const prompt = `Analyze the following county audit system data and provide actionable recommendations:

System Metrics:
${JSON.stringify(analysisData, null, 2)}

Based on this data, provide 3-5 recommendations to improve audit efficiency, reduce risks, and optimize workflows. Focus on:
1. Workload management and resource allocation
2. Risk identification and mitigation
3. Process optimization
4. Compliance and quality improvements

Respond in JSON format:
{
  "recommendations": [
    {
      "type": "workload_optimization|risk_assessment|compliance_priority|resource_allocation",
      "title": "Clear, actionable title",
      "description": "Detailed description of the issue and solution",
      "priority": "low|medium|high|critical",
      "confidence": 0.85,
      "suggestedActions": ["Specific action 1", "Specific action 2"],
      "riskFactors": ["Risk factor 1", "Risk factor 2"],
      "estimatedTimeToComplete": 7,
      "reasoning": "Why this recommendation is important and how it addresses the data patterns"
    }
  ]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert audit analyst for county government operations. Provide practical, data-driven recommendations based on audit metrics and patterns."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      if (result.recommendations && Array.isArray(result.recommendations)) {
        return result.recommendations.map((rec: any /* , index */: number) => ({
          id: `general_${Date.now()}_${index}`,
          type: rec.type || 'workload_optimization',
          title: rec.title || 'AI Recommendation',
          description: rec.description || 'No description provided',
          priority: rec.priority || 'medium',
          confidence: Math.min(Math.max(rec.confidence || 0.7, 0), 1),
          suggestedActions: Array.isArray(rec.suggestedActions) ? rec.suggestedActions : [],
          riskFactors: Array.isArray(rec.riskFactors) ? rec.riskFactors : [],
          estimatedTimeToComplete: rec.estimatedTimeToComplete || 7,
          reasoning: rec.reasoning || 'Generated by AI analysis',
          metadata: {
            analysisDate: new Date(),
            dataPointsAnalyzed: totalAudits + recentEvents.length,
            categories: ['general_analysis']
          }
        }));
      }

      return [];
    } catch (error) {
      console.error('Failed to generate AI recommendations:', error);
      
      // Use enhanced fallback system when AI service fails
      console.log('Using enhanced AI fallback system...');
      return await enhancedAIFallback.generateIntelligentRecommendations();
    }
  }

  async generatePersonalizedRecommendations(userId: number): Promise<AuditRecommendation[]> {
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const assignedAudits = await storage.getAssignedAudits(userId);
      const createdAudits = await storage.getAuditsCreatedByUser(userId);
      const allAudits = await storage.getAudits();

      // Calculate user-specific metrics
      const userWorkload = assignedAudits.filter(a => a.status !== 'approved').length;
      const userCompletedAudits = assignedAudits.filter(a => a.status === 'approved');
      const userAverageTime = this.calculateAverageProcessingTime(userCompletedAudits);

      const userAnalysis = {
        username: user.username,
        role: user.role,
        totalAssigned: assignedAudits.length,
        totalCreated: createdAudits.length,
        currentWorkload: userWorkload,
        completedAudits: userCompletedAudits.length,
        averageProcessingTime: userAverageTime,
        systemAverageTime: this.calculateAverageProcessingTime(allAudits),
        specialties: this.identifyUserSpecialties(assignedAudits)
      };

      const prompt = `Analyze user performance and provide personalized recommendations:

User Profile:
${JSON.stringify(userAnalysis, null, 2)}

Provide 2-4 personalized recommendations to help this user improve their audit performance, manage workload better, and develop their skills. Consider their role, current workload, and performance compared to system averages.

Respond in JSON format with the same structure as before, but focus on user-specific improvements.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert performance coach for county audit staff. Provide personalized, actionable recommendations based on individual performance data."
          },
          {
            role: "user",
            content: prompt
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
          confidence: Math.min(Math.max(rec.confidence || 0.7, 0), 1),
          suggestedActions: Array.isArray(rec.suggestedActions) ? rec.suggestedActions : [],
          riskFactors: Array.isArray(rec.riskFactors) ? rec.riskFactors : [],
          estimatedTimeToComplete: rec.estimatedTimeToComplete || 7,
          recommendedAssignee: userId,
          reasoning: rec.reasoning || 'Generated by personalized AI analysis',
          metadata: {
            analysisDate: new Date(),
            dataPointsAnalyzed: assignedAudits.length + createdAudits.length,
            categories: ['personalized', user.role]
          }
        }));
      }

      return [];
    } catch (error) {
      console.error('Failed to generate personalized recommendations:', error);
      
      // Use enhanced fallback system for personalized recommendations
      console.log('Using enhanced AI fallback for personalized recommendations...');
      const fallbackRecommendations = await enhancedAIFallback.generateIntelligentRecommendations();
      
      // Add personal context to fallback recommendations
      return fallbackRecommendations.map(rec => ({
        ...rec,
        id: `personal-${rec.id}`,
        title: `Personal: ${rec.title}`,
        description: `Based on your role and workload: ${rec.description}`,
        metadata: {
          ...rec.metadata,
          categories: [...rec.metadata.categories, 'personalized_fallback']
        }
      }));
    }
  }

  async analyzeAuditRisk(auditId: number): Promise<RiskAnalysis> {
    try {
      const audit = await storage.getAuditById(auditId);
      if (!audit) {
        throw new Error('Audit not found');
      }

      const auditEvents = await storage.getAuditEvents(auditId);
      const allAudits = await storage.getAudits();
      
      // Find similar audits for comparison
      const similarAudits = allAudits.filter(a => 
        a.id !== auditId && 
        (a.auditType === audit.auditType || a.propertyType === audit.propertyType)
      );

      const riskFactors = this.identifyRiskFactors(audit, auditEvents, similarAudits);

      const riskAnalysisData = {
        audit: {
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
        },
        eventCount: auditEvents.length,
        similarAuditsCount: similarAudits.length,
        identifiedRiskFactors: riskFactors,
        daysSinceSubmission: audit.submittedAt ? 
          Math.floor((new Date().getTime() - new Date(audit.submittedAt).getTime()) / (1000 * 60 * 60 * 24)) : 0,
        daysUntilDue: audit.dueDate ? 
          Math.floor((new Date(audit.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null
      };

      const prompt = `Analyze the risk level for this audit:

${JSON.stringify(riskAnalysisData, null, 2)}

Provide a comprehensive risk analysis considering:
- Timeline and deadline pressure
- Audit complexity and type
- Historical performance on similar audits
- Current status and progress
- Resource availability

Respond in JSON format:
{
  "riskScore": 0.75,
  "riskFactors": ["Specific risk factor 1", "Specific risk factor 2"],
  "recommendations": ["Specific recommendation 1", "Specific recommendation 2"],
  "confidence": 0.85
}

Risk score should be 0-1 where 1 is highest risk.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert audit risk analyst. Provide accurate risk assessments based on audit data patterns and timeline analysis."
          },
          {
            role: "user",
            content: prompt
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
        confidence: Math.min(Math.max(result.confidence || 0.7, 0), 1)
      };
    } catch (error) {
      console.error('Failed to analyze audit risk:', error);
      
      // Provide specific error messages for different failure types
      if (error instanceof Error) {
        if (error.message.includes('quota') || error.message.includes('429')) {
          throw new Error('OpenAI API quota exceeded. Please check your billing details or try again later.');
        }
        if (error.message.includes('401') || error.message.includes('authentication')) {
          throw new Error('OpenAI API authentication failed. Please verify your API key.');
        }
      }
      
      throw new Error(`Risk analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private calculateAverageProcessingTime(audits: any[]): number {
    const completedAudits = audits.filter(a => a.status === 'approved' && a.submittedAt && a.updatedAt);
    
    if (completedAudits.length === 0) return 0;
    
    const totalTime = completedAudits.reduce((sum, audit) => {
      const start = new Date(audit.submittedAt).getTime();
      const end = audit.updatedAt ? new Date(audit.updatedAt).getTime() : start;
      return sum + (end - start);
    }, 0);
    
    return totalTime / completedAudits.length / (1000 * 60 * 60 * 24); // Convert to days
  }

  private identifyUserSpecialties(audits: any[]): string[] {
    const auditTypes = audits.map(a => a.auditType).filter(Boolean);
    const propertyTypes = audits.map(a => a.propertyType).filter(Boolean);
    
    const typeCounts: Record<string, number> = {};
    [...auditTypes, ...propertyTypes].forEach(type => {
      if (type) {
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      }
    });
    
    return Object.entries(typeCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([type]) => type);
  }

  private identifyRiskFactors(audit: any, events: any[], similarAudits: any[]): string[] {
    const factors = [];
    
    // Timeline risk
    if (audit.dueDate) {
      const daysUntilDue = Math.floor((new Date(audit.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilDue < 7) factors.push('Tight deadline');
      if (daysUntilDue < 0) factors.push('Overdue');
    }
    
    // Priority risk
    if (audit.priority === 'urgent') factors.push('High priority audit');
    
    // Complexity risk
    if (audit.auditType === 'complex') factors.push('Complex audit type');
    if (audit.auditType === 'commercial') factors.push('Commercial property complexity');
    
    // Activity risk
    if (events.length === 0) factors.push('No recent activity');
    if (events.length > 10) factors.push('High activity volume');
    
    // Historical risk
    const similarProblematicAudits = similarAudits.filter(a => 
      a.status === 'rejected' || a.status === 'needs_info'
    );
    if (similarProblematicAudits.length > similarAudits.length * 0.3) {
      factors.push('Similar audits have high rejection rate');
    }
    
    return factors;
  }
}

export const aiRecommendationService = new AIRecommendationService();