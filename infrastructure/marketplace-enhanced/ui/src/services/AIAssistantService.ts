/**
 * Terrafusion AI Assistant Service
 * Provides intelligent automation and guidance for government operations
 * Integrates with all backend services and AI prompt templates
 */

import { governmentAPI, County, GovernmentPlugin } from './GovernmentAPIService';
import { authService, User } from './AuthenticationService';
import { performanceService } from './PerformanceService';
import { notificationService } from './NotificationService';
import AIPromptTemplates from '../config/AIPromptTemplates.json';

export interface AIRequest {
  template: string;
  userQuery: string;
  contextOverride?: Record<string, any>;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export interface AIResponse {
  id: string;
  response: string;
  confidence: number;
  template: string;
  timestamp: string;
  context: Record<string, any>;
  actions?: AIAction[];
  followUp?: string[];
}

export interface AIAction {
  id: string;
  label: string;
  type: 'navigation' | 'api_call' | 'notification' | 'validation';
  handler: () => Promise<void>;
  requiresConfirmation?: boolean;
}

export interface AIContext {
  user: User | null;
  county: County | null;
  currentModule: string;
  securityLevel: string;
  complianceMode: string[];
  sessionData: Record<string, any>;
}

export interface ConversationHistory {
  id: string;
  timestamp: string;
  userQuery: string;
  aiResponse: string;
  template: string;
  context: AIContext;
  satisfaction?: 'helpful' | 'neutral' | 'unhelpful';
}

class AIAssistantService {
  private baseUrl: string;
  private conversationHistory: ConversationHistory[] = [];
  private currentContext: AIContext;
  private templates: any;
  private activeConversationId: string | null = null;

  constructor(baseUrl: string = 'http://localhost:\${{TF_FRONTEND_PORT:-3000}}/api') {
    this.baseUrl = baseUrl;
    this.templates = AIPromptTemplates.terrafusion_ai_templates;
    this.currentContext = this.initializeContext();
    this.loadConversationHistory();
  }

  // Core AI Assistant Methods
  async askAssistant(request: AIRequest): Promise<AIResponse> {
    try {
      // Update context before processing
      await this.updateContext();

      // Get template configuration
      const template = this.templates[request.template];
      if (!template) {
        throw new Error(`Template '${request.template}' not found`);
      }

      // Build enhanced context
      const enhancedContext = {
        ...this.currentContext,
        ...request.contextOverride,
        template_config: template,
        conversation_history: this.getRecentHistory(5),
      };

      // Process request based on template type
      const response = await this.processAIRequest(request, template, enhancedContext);

      // Store conversation
      this.storeConversation(request.userQuery, response, request.template);

      // Trigger any automated actions
      await this.executeAutomatedActions(response, enhancedContext);

      return response;
    } catch (error) {
      console.error('AI Assistant error:', error);
      return this.generateErrorResponse(request, error as Error);
    }
  }

  // Template-Specific Processing
  private async processAIRequest(
    request: AIRequest,
    template: any,
    context: any
  ): Promise<AIResponse> {
    switch (request.template) {
      case 'government_copilot':
        return this.processGovernmentCopilot(request, template, context);

      case 'plugin_validation_agent':
        return this.processPluginValidation(request, template, context);

      case 'compliance_automation':
        return this.processComplianceAutomation(request, template, context);

      case 'federation_manager':
        return this.processFederationManager(request, template, context);

      case 'user_onboarding':
        return this.processUserOnboarding(request, template, context);

      case 'audit_trail_generator':
        return this.processAuditTrailGenerator(request, template, context);

      case 'ai_confidence_explainer':
        return this.processConfidenceExplainer(request, template, context);

      default:
        return this.processGenericTemplate(request, template, context);
    }
  }

  // Government Copilot Implementation
  private async processGovernmentCopilot(
    request: AIRequest,
    template: any,
    context: any
  ): Promise<AIResponse> {
    const response: AIResponse = {
      id: this.generateResponseId(),
      response: '',
      confidence: 0.9,
      template: 'government_copilot',
      timestamp: new Date().toISOString(),
      context: context,
      actions: [],
      followUp: [],
    };

    // Analyze user query for intent
    const intent = this.analyzeIntent(request.userQuery);

    switch (intent.category) {
      case 'plugin_deployment':
        response.response = await this.generatePluginDeploymentGuidance(intent, context);
        response.actions = this.generatePluginDeploymentActions(intent, context);
        break;

      case 'compliance_check':
        response.response = await this.generateComplianceGuidance(intent, context);
        response.actions = this.generateComplianceActions(intent, context);
        break;

      case 'federation_management':
        response.response = await this.generateFederationGuidance(intent, context);
        response.actions = this.generateFederationActions(intent, context);
        break;

      default:
        response.response = this.generateGenericGuidance(request.userQuery, template, context);
    }

    // Add contextual follow-up questions
    response.followUp = this.generateFollowUpQuestions(intent, context);

    return response;
  }

  // Plugin Validation Agent Implementation
  private async processPluginValidation(
    request: AIRequest,
    template: any,
    context: any
  ): Promise<AIResponse> {
    const response: AIResponse = {
      id: this.generateResponseId(),
      response: '',
      confidence: 0.95,
      template: 'plugin_validation_agent',
      timestamp: new Date().toISOString(),
      context: context,
      actions: [],
    };

    // Extract plugin information from query
    const pluginInfo = this.extractPluginInfo(request.userQuery);

    if (pluginInfo.pluginId) {
      // Get actual validation status
      try {
        const validationStatus = await governmentAPI.getValidationStatus(pluginInfo.pluginId);
        const plugin = await governmentAPI.getPluginById(pluginInfo.pluginId);

        response.response = this.generateValidationReport(plugin, validationStatus, template);
        response.actions = this.generateValidationActions(plugin, validationStatus);
        response.confidence = validationStatus.aiConfidence;
      } catch (error) {
        response.response = `Unable to retrieve validation status for plugin. Please verify the plugin ID and try again.`;
        response.confidence = 0.3;
      }
    } else {
      response.response = this.generateValidationGuidance(request.userQuery, template);
    }

    return response;
  }

  // Compliance Automation Implementation
  private async processComplianceAutomation(
    request: AIRequest,
    template: any,
    context: any
  ): Promise<AIResponse> {
    const response: AIResponse = {
      id: this.generateResponseId(),
      response: '',
      confidence: 0.92,
      template: 'compliance_automation',
      timestamp: new Date().toISOString(),
      context: context,
      actions: [],
    };

    // Get compliance alerts and status
    const complianceAlerts = notificationService.getComplianceAlerts({
      county: context.county?.id,
      status: 'open',
    });

    // Generate compliance report
    response.response = this.generateComplianceReport(complianceAlerts, template, context);
    response.actions = this.generateComplianceActions(complianceAlerts);

    // Create notification if critical issues found
    const criticalAlerts = complianceAlerts.filter(alert => alert.severity === 'critical');
    if (criticalAlerts.length > 0) {
      await notificationService.createNotification({
        type: 'compliance',
        title: 'Critical Compliance Issues Detected',
        message: `${criticalAlerts.length} critical compliance issues require immediate attention.`,
        priority: 'critical',
        category: 'compliance',
        county: context.county?.id,
        persistent: true,
      });
    }

    return response;
  }

  // Context Management
  private async updateContext(): Promise<void> {
    const user = authService.getCurrentUser();
    let county: County | null = null;

    if (user && user.county) {
      try {
        county = await governmentAPI.getCountyById(user.county);
      } catch (error) {
        console.warn('Failed to load county context:', error);
      }
    }

    this.currentContext = {
      user,
      county,
      currentModule: this.getCurrentModule(),
      securityLevel: user?.securityClearance || 'public',
      complianceMode: this.getComplianceMode(county),
      sessionData: this.getSessionData(),
    };
  }

  private initializeContext(): AIContext {
    return {
      user: null,
      county: null,
      currentModule: 'dashboard',
      securityLevel: 'public',
      complianceMode: ['basic'],
      sessionData: {},
    };
  }

  // Intent Analysis
  private analyzeIntent(query: string): { category: string; entities: any; confidence: number } {
    const lowercaseQuery = query.toLowerCase();

    // Plugin deployment patterns
    if (lowercaseQuery.includes('deploy') || lowercaseQuery.includes('install')) {
      return {
        category: 'plugin_deployment',
        entities: this.extractPluginEntities(query),
        confidence: 0.9,
      };
    }

    // Compliance patterns
    if (
      lowercaseQuery.includes('compliance') ||
      lowercaseQuery.includes('audit') ||
      lowercaseQuery.includes('fisma')
    ) {
      return {
        category: 'compliance_check',
        entities: this.extractComplianceEntities(query),
        confidence: 0.85,
      };
    }

    // Federation patterns
    if (
      lowercaseQuery.includes('federation') ||
      lowercaseQuery.includes('multi-county') ||
      lowercaseQuery.includes('cross-jurisdiction')
    ) {
      return {
        category: 'federation_management',
        entities: this.extractFederationEntities(query),
        confidence: 0.8,
      };
    }

    return {
      category: 'general',
      entities: {},
      confidence: 0.5,
    };
  }

  // Response Generation Helpers
  private async generatePluginDeploymentGuidance(intent: any, context: any): Promise<string> {
    const steps = [
      "1. **Authentication**: Ensure you're logged in with appropriate permissions",
      '2. **Plugin Selection**: Navigate to Government Dashboard > Plugin Marketplace',
      '3. **Validation Check**: Verify plugin compliance and security status',
      '4. **County Selection**: Choose target counties for deployment',
      '5. **Deployment**: Initiate deployment with AI-guided validation',
      '6. **Monitoring**: Track deployment status and performance metrics',
    ];

    return `## Plugin Deployment Guidance\n\n${steps.join('\n')}\n\n**Current Context**: ${context.user?.role.displayName} in ${context.county?.name}\n\n⚠️ **Security Note**: All deployments require FISMA compliance validation.`;
  }

  private generateComplianceReport(alerts: any[], template: any, context: any): string {
    const totalAlerts = alerts.length;
    const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
    const warningAlerts = alerts.filter(a => a.severity === 'warning').length;

    let report = `## Compliance Status Report\n\n`;
    report += `**County**: ${context.county?.name || 'Unknown'}\n`;
    report += `**Generated**: ${new Date().toLocaleString()}\n\n`;

    if (totalAlerts === 0) {
      report += `✅ **All Systems Compliant** - No active compliance issues detected.\n\n`;
    } else {
      report += `### Alert Summary\n`;
      report += `- 🔴 Critical: ${criticalAlerts}\n`;
      report += `- 🟡 Warning: ${warningAlerts}\n`;
      report += `- 📊 Total: ${totalAlerts}\n\n`;

      if (criticalAlerts > 0) {
        report += `### Critical Issues Requiring Immediate Attention\n`;
        alerts
          .filter(a => a.severity === 'critical')
          .forEach(alert => {
            report += `- **${alert.complianceType.toUpperCase()}**: ${alert.description}\n`;
          });
      }
    }

    return report;
  }

  // Action Generators
  private generatePluginDeploymentActions(intent: any, context: any): AIAction[] {
    return [
      {
        id: 'navigate-to-marketplace',
        label: 'Open Plugin Marketplace',
        type: 'navigation',
        handler: async () => {
          window.location.href = '/plugins';
        },
      },
      {
        id: 'check-compliance',
        label: 'Run Compliance Check',
        type: 'validation',
        handler: async () => {
          await this.triggerComplianceCheck(context.county?.id);
        },
        requiresConfirmation: true,
      },
    ];
  }

  private generateComplianceActions(alerts: any[]): AIAction[] {
    const actions: AIAction[] = [
      {
        id: 'generate-report',
        label: 'Generate Full Compliance Report',
        type: 'api_call',
        handler: async () => {
          await this.generateFullComplianceReport();
        },
      },
    ];

    if (alerts.length > 0) {
      actions.push({
        id: 'resolve-alerts',
        label: 'Start Alert Resolution Workflow',
        type: 'navigation',
        handler: async () => {
          window.location.href = '/government-dashboard?tab=compliance';
        },
      });
    }

    return actions;
  }

  // Utility Methods
  private generateResponseId(): string {
    return `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentModule(): string {
    const path = window.location.pathname;
    if (path.includes('government-dashboard')) return 'government_dashboard';
    if (path.includes('plugins')) return 'plugin_marketplace';
    return 'dashboard';
  }

  private getComplianceMode(county: County | null): string[] {
    const modes = ['basic'];
    if (county) {
      modes.push('county_audit');
      if (county.complianceScore >= 90) modes.push('fisma');
      if (county.federationStatus === 'active') modes.push('cross_jurisdictional');
    }
    return modes;
  }

  private getSessionData(): Record<string, any> {
    return {
      timestamp: new Date().toISOString(),
      performance: performanceService.getPerformanceMetrics(),
      notifications: notificationService.getUnreadCount(),
    };
  }

  // Conversation Management
  private storeConversation(query: string, response: AIResponse, template: string): void {
    const conversation: ConversationHistory = {
      id: response.id,
      timestamp: response.timestamp,
      userQuery: query,
      aiResponse: response.response,
      template,
      context: this.currentContext,
    };

    this.conversationHistory.unshift(conversation);

    // Keep only last 50 conversations
    if (this.conversationHistory.length > 50) {
      this.conversationHistory = this.conversationHistory.slice(0, 50);
    }

    this.saveConversationHistory();
  }

  private getRecentHistory(count: number): ConversationHistory[] {
    return this.conversationHistory.slice(0, count);
  }

  private saveConversationHistory(): void {
    try {
      localStorage.setItem('tf_ai_conversations', JSON.stringify(this.conversationHistory));
    } catch (error) {
      console.warn('Failed to save conversation history:', error);
    }
  }

  private loadConversationHistory(): void {
    try {
      const stored = localStorage.getItem('tf_ai_conversations');
      if (stored) {
        this.conversationHistory = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load conversation history:', error);
    }
  }

  // Error Handling
  private generateErrorResponse(request: AIRequest, error: Error): AIResponse {
    return {
      id: this.generateResponseId(),
      response: `I apologize, but I encountered an error processing your request: ${error.message}. Please try again or contact your system administrator if the problem persists.`,
      confidence: 0.1,
      template: request.template,
      timestamp: new Date().toISOString(),
      context: this.currentContext,
      actions: [
        {
          id: 'retry-request',
          label: 'Retry Request',
          type: 'api_call',
          handler: async () => {
            await this.askAssistant(request);
          },
        },
      ],
    };
  }

  // Placeholder implementations for complex methods
  private extractPluginInfo(query: string): { pluginId?: string; pluginName?: string } {
    // Simple pattern matching - in production, use NLP
    const pluginPatterns = ['costforge', 'pilt', 'gis'];
    for (const pattern of pluginPatterns) {
      if (query.toLowerCase().includes(pattern)) {
        return { pluginName: pattern, pluginId: `${pattern}-pro` };
      }
    }
    return {};
  }

  private extractPluginEntities(query: string): any {
    return { plugins: this.extractPluginInfo(query) };
  }

  private extractComplianceEntities(query: string): any {
    return { complianceTypes: ['fisma', 'state_doe', 'county_audit'] };
  }

  private extractFederationEntities(query: string): any {
    return { counties: ['benton-wa', 'franklin-wa'] };
  }

  private generateValidationReport(plugin: any, validation: any, template: any): string {
    return `## Validation Report: ${plugin?.name}\n\nSecurity: ${validation.security}\nCompliance: ${validation.compliance}\nConfidence: ${(validation.aiConfidence * 100).toFixed(1)}%`;
  }

  private generateValidationActions(plugin: any, validation: any): AIAction[] {
    return [];
  }

  private generateValidationGuidance(query: string, template: any): string {
    return "Please specify which plugin you'd like to validate.";
  }

  private generateFederationGuidance(intent: any, context: any): Promise<string> {
    return Promise.resolve('Federation management guidance will be provided here.');
  }

  private generateFederationActions(intent: any, context: any): AIAction[] {
    return [];
  }

  private generateGenericGuidance(query: string, template: any, context: any): string {
    return `I understand you're asking about: "${query}". Let me help you with that based on your current context as ${context.user?.role.displayName} in ${context.county?.name}.`;
  }

  private generateFollowUpQuestions(intent: any, context: any): string[] {
    return [
      'Would you like me to check the current compliance status?',
      'Do you need help with plugin deployment?',
      'Should I generate an audit report?',
    ];
  }

  private async executeAutomatedActions(response: AIResponse, context: any): Promise<void> {
    // Implement automated actions based on response
  }

  private processGenericTemplate(
    request: AIRequest,
    template: any,
    context: any
  ): Promise<AIResponse> {
    return Promise.resolve({
      id: this.generateResponseId(),
      response: 'Generic response based on template.',
      confidence: 0.7,
      template: request.template,
      timestamp: new Date().toISOString(),
      context: context,
    });
  }

  private async triggerComplianceCheck(countyId?: string): Promise<void> {
    // Implement compliance check trigger
  }

  private async generateFullComplianceReport(): Promise<void> {
    // Implement full compliance report generation
  }

  // Public API
  getConversationHistory(): ConversationHistory[] {
    return [...this.conversationHistory];
  }

  clearConversationHistory(): void {
    this.conversationHistory = [];
    this.saveConversationHistory();
  }

  rateSatisfaction(
    conversationId: string,
    satisfaction: 'helpful' | 'neutral' | 'unhelpful'
  ): void {
    const conversation = this.conversationHistory.find(c => c.id === conversationId);
    if (conversation) {
      conversation.satisfaction = satisfaction;
      this.saveConversationHistory();
    }
  }
}

// Export singleton instance
export const aiAssistant = new AIAssistantService();
export default AIAssistantService;
