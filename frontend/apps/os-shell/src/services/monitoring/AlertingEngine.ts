// =============================
// Alerting Engine
// Threshold violation detection, critical failure alerts,
// escalation policies, incident response automation, and multi-channel notifications
// =============================

// =============================
// Type Definitions
// =============================

export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'suppressed';
export type NotificationChannel = 'email' | 'slack' | 'sms' | 'webhook' | 'console';

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  metric: string;
  serviceName?: string;
  condition: AlertCondition;
  severity: AlertSeverity;
  enabled: boolean;
  notificationChannels: NotificationChannel[];
  escalationPolicy?: EscalationPolicy;
  cooldownMinutes: number; // Minimum time between alerts for same rule
  autoResolveAfterMinutes?: number;
}

export interface AlertCondition {
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'ne';
  threshold: number;
  durationMinutes?: number; // Alert only if condition persists for this duration
  comparisonType: 'absolute' | 'percentage_change' | 'rate_of_change';
}

export interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  serviceName?: string;
  metric: string;
  currentValue: number;
  threshold: number;
  severity: AlertSeverity;
  status: AlertStatus;
  message: string;
  timestamp: Date;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface EscalationPolicy {
  levels: EscalationLevel[];
}

export interface EscalationLevel {
  delayMinutes: number;
  notificationChannels: NotificationChannel[];
  recipients: string[]; // Email addresses, Slack channels, phone numbers
  requiresAcknowledgment: boolean;
}

export interface NotificationConfig {
  email?: {
    enabled: boolean;
    smtpHost: string;
    smtpPort: number;
    from: string;
    recipients: string[];
  };
  slack?: {
    enabled: boolean;
    webhookUrl: string;
    channel: string;
    mentionUsers?: string[];
  };
  sms?: {
    enabled: boolean;
    provider: 'twilio' | 'aws_sns';
    phoneNumbers: string[];
  };
  webhook?: {
    enabled: boolean;
    url: string;
    headers?: Record<string, string>;
  };
}

export interface AlertCorrelation {
  correlationId: string;
  relatedAlerts: Alert[];
  rootCause?: string;
  affectedServices: string[];
  timestamp: Date;
}

export interface IncidentResponse {
  incidentId: string;
  alert: Alert;
  status: 'investigating' | 'mitigating' | 'resolved';
  assignedTo?: string;
  actions: IncidentAction[];
  resolution?: string;
  createdAt: Date;
  resolvedAt?: Date;
}

export interface IncidentAction {
  action: string;
  timestamp: Date;
  performedBy: string;
  result: string;
  automated: boolean;
}

// =============================
// Alerting Engine Class
// =============================

export class AlertingEngine {
  private static instance: AlertingEngine;
  private alertRules: Map<string, AlertRule>;
  private activeAlerts: Map<string, Alert>;
  private alertHistory: Alert[];
  private notificationConfig: NotificationConfig;
  private lastAlertTimes: Map<string, Date>; // For cooldown tracking
  private conditionStartTimes: Map<string, Date>; // For duration tracking
  private escalationTimers: Map<string, NodeJS.Timeout>;
  private monitoringInterval: NodeJS.Timeout | null = null;

  private constructor(notificationConfig: NotificationConfig) {
    this.alertRules = new Map();
    this.activeAlerts = new Map();
    this.alertHistory = [];
    this.notificationConfig = notificationConfig;
    this.lastAlertTimes = new Map();
    this.conditionStartTimes = new Map();
    this.escalationTimers = new Map();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(notificationConfig?: NotificationConfig): AlertingEngine {
    if (!AlertingEngine.instance && notificationConfig) {
      AlertingEngine.instance = new AlertingEngine(notificationConfig);
    }
    if (!AlertingEngine.instance) {
      throw new Error('AlertingEngine not initialized with notification config');
    }
    return AlertingEngine.instance;
  }

  /**
   * Register an alert rule
   */
  public registerAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
  }

  /**
   * Unregister an alert rule
   */
  public unregisterAlertRule(ruleId: string): void {
    this.alertRules.delete(ruleId);
    this.lastAlertTimes.delete(ruleId);
    this.conditionStartTimes.delete(ruleId);
  }

  /**
   * Evaluate a metric against all relevant alert rules
   */
  public evaluateMetric(serviceName: string, metric: string, value: number): void {
    this.alertRules.forEach((rule, ruleId) => {
      // Skip disabled rules
      if (!rule.enabled) return;

      // Skip if rule doesn't match service/metric
      if (rule.serviceName && rule.serviceName !== serviceName) return;
      if (rule.metric !== metric && rule.metric !== `${serviceName}.${metric}`) return;

      // Check cooldown period
      const lastAlertTime = this.lastAlertTimes.get(ruleId);
      if (lastAlertTime) {
        const cooldownMs = rule.cooldownMinutes * 60 * 1000;
        const timeSinceLastAlert = Date.now() - lastAlertTime.getTime();
        if (timeSinceLastAlert < cooldownMs) {
          return; // Still in cooldown period
        }
      }

      // Evaluate condition
      const conditionMet = this.evaluateCondition(rule.condition, value);

      if (conditionMet) {
        // Check if duration requirement is met
        if (rule.condition.durationMinutes) {
          const conditionKey = `${ruleId}_${serviceName}_${metric}`;
          const conditionStartTime = this.conditionStartTimes.get(conditionKey);

          if (!conditionStartTime) {
            // First time condition is met, start tracking
            this.conditionStartTimes.set(conditionKey, new Date());
            return;
          }

          const durationMs = rule.condition.durationMinutes * 60 * 1000;
          const timeSinceConditionStart = Date.now() - conditionStartTime.getTime();

          if (timeSinceConditionStart < durationMs) {
            // Duration requirement not yet met
            return;
          }
        }

        // Condition met, create alert
        this.createAlert(rule, serviceName, metric, value);
      } else {
        // Condition not met, clear duration tracking
        const conditionKey = `${ruleId}_${serviceName}_${metric}`;
        this.conditionStartTimes.delete(conditionKey);
      }
    });
  }

  /**
   * Evaluate an alert condition
   */
  private evaluateCondition(condition: AlertCondition, value: number): boolean {
    const { operator, threshold } = condition;

    switch (operator) {
      case 'gt':
        return value > threshold;
      case 'gte':
        return value >= threshold;
      case 'lt':
        return value < threshold;
      case 'lte':
        return value <= threshold;
      case 'eq':
        return value === threshold;
      case 'ne':
        return value !== threshold;
      default:
        return false;
    }
  }

  /**
   * Create a new alert
   */
  private createAlert(rule: AlertRule, serviceName: string, metric: string, value: number): void {
    const alert: Alert = {
      id: this.generateAlertId(),
      ruleId: rule.id,
      ruleName: rule.name,
      serviceName,
      metric,
      currentValue: value,
      threshold: rule.condition.threshold,
      severity: rule.severity,
      status: 'active',
      message: this.generateAlertMessage(rule, serviceName, metric, value),
      timestamp: new Date(),
    };

    this.activeAlerts.set(alert.id, alert);
    this.alertHistory.push(alert);
    this.lastAlertTimes.set(rule.id, new Date());


    // Send notifications
    this.sendNotifications(alert, rule.notificationChannels);

    // Setup escalation if configured
    if (rule.escalationPolicy) {
      this.setupEscalation(alert, rule.escalationPolicy);
    }

    // Setup auto-resolve if configured
    if (rule.autoResolveAfterMinutes) {
      setTimeout(
        () => {
          this.autoResolveAlert(alert.id);
        },
        rule.autoResolveAfterMinutes * 60 * 1000
      );
    }
  }

  /**
   * Generate alert message
   */
  private generateAlertMessage(
    rule: AlertRule,
    serviceName: string,
    metric: string,
    value: number
  ): string {
    const { condition, severity } = rule;
    const operatorText = this.getOperatorText(condition.operator);

    return `[${severity.toUpperCase()}] ${serviceName}.${metric} is ${value.toFixed(2)} (${operatorText} ${condition.threshold})`;
  }

  /**
   * Get human-readable operator text
   */
  private getOperatorText(operator: string): string {
    const operatorMap: Record<string, string> = {
      gt: 'greater than',
      gte: 'greater than or equal to',
      lt: 'less than',
      lte: 'less than or equal to',
      eq: 'equal to',
      ne: 'not equal to',
    };
    return operatorMap[operator] || operator;
  }

  /**
   * Send notifications through configured channels
   */
  private async sendNotifications(alert: Alert, channels: NotificationChannel[]): Promise<void> {
    const notificationPromises = channels.map((channel) => {
      switch (channel) {
        case 'email':
          return this.sendEmailNotification(alert);
        case 'slack':
          return this.sendSlackNotification(alert);
        case 'sms':
          return this.sendSMSNotification(alert);
        case 'webhook':
          return this.sendWebhookNotification(alert);
        case 'console':
          return this.sendConsoleNotification(alert);
        default:
          return Promise.resolve();
      }
    });

    await Promise.allSettled(notificationPromises);
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(alert: Alert): Promise<void> {
    if (!this.notificationConfig.email?.enabled) return;

    // In production, this would use actual SMTP
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(alert: Alert): Promise<void> {
    if (!this.notificationConfig.slack?.enabled) return;

    const severityEmoji =
      alert.severity === 'critical' ? '🔴' : alert.severity === 'warning' ? '🟡' : 'ℹ️';
    const message = {
      text: `${severityEmoji} *${alert.ruleName}*`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${severityEmoji} *${alert.ruleName}*\n${alert.message}`,
          },
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Service:*\n${alert.serviceName || 'N/A'}` },
            { type: 'mrkdwn', text: `*Metric:*\n${alert.metric}` },
            { type: 'mrkdwn', text: `*Current Value:*\n${alert.currentValue.toFixed(2)}` },
            { type: 'mrkdwn', text: `*Threshold:*\n${alert.threshold}` },
          ],
        },
      ],
    };

    // In production, this would POST to Slack webhook
  }

  /**
   * Send SMS notification
   */
  private async sendSMSNotification(alert: Alert): Promise<void> {
    if (!this.notificationConfig.sms?.enabled) return;

    const smsMessage = `TerraFusion Alert: ${alert.message}`;

    // In production, this would use Twilio or AWS SNS
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(alert: Alert): Promise<void> {
    if (!this.notificationConfig.webhook?.enabled) return;

    const payload = {
      alert_id: alert.id,
      rule_name: alert.ruleName,
      service_name: alert.serviceName,
      metric: alert.metric,
      current_value: alert.currentValue,
      threshold: alert.threshold,
      severity: alert.severity,
      status: alert.status,
      message: alert.message,
      timestamp: alert.timestamp.toISOString(),
    };

    // In production, this would POST to webhook URL
  }

  /**
   * Send console notification
   */
  private async sendConsoleNotification(alert: Alert): Promise<void> {
    const severityEmoji =
      alert.severity === 'critical' ? '🔴' : alert.severity === 'warning' ? '🟡' : 'ℹ️';
  }

  /**
   * Setup escalation policy
   */
  private setupEscalation(alert: Alert, policy: EscalationPolicy): void {
    policy.levels.forEach((level, index) => {
      const timerId = setTimeout(
        async () => {
          // Check if alert is still active and not acknowledged
          const currentAlert = this.activeAlerts.get(alert.id);
          if (!currentAlert || currentAlert.status !== 'active') {
            return; // Alert resolved or acknowledged
          }


          // Send escalation notifications
          await this.sendNotifications(alert, level.notificationChannels);

          if (level.requiresAcknowledgment) {
          }
        },
        level.delayMinutes * 60 * 1000
      );

      this.escalationTimers.set(`${alert.id}_level_${index}`, timerId);
    });
  }

  /**
   * Acknowledge an alert
   */
  public acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return false;

    alert.status = 'acknowledged';
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = new Date();

    // Clear escalation timers
    this.clearEscalationTimers(alertId);

    return true;
  }

  /**
   * Resolve an alert
   */
  public resolveAlert(alertId: string, resolution?: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return false;

    alert.status = 'resolved';
    alert.resolvedAt = new Date();
    if (resolution) {
      alert.metadata = { ...alert.metadata, resolution };
    }

    this.activeAlerts.delete(alertId);
    this.clearEscalationTimers(alertId);

    return true;
  }

  /**
   * Auto-resolve an alert after timeout
   */
  private autoResolveAlert(alertId: string): void {
    const alert = this.activeAlerts.get(alertId);
    if (alert && alert.status === 'active') {
      this.resolveAlert(alertId, 'Auto-resolved after timeout');
    }
  }

  /**
   * Clear escalation timers for an alert
   */
  private clearEscalationTimers(alertId: string): void {
    this.escalationTimers.forEach((timer, key) => {
      if (key.startsWith(alertId)) {
        clearTimeout(timer);
        this.escalationTimers.delete(key);
      }
    });
  }

  /**
   * Correlate related alerts
   */
  public correlateAlerts(): AlertCorrelation[] {
    const correlations: AlertCorrelation[] = [];
    const now = Date.now();
    const correlationWindowMs = 5 * 60 * 1000; // 5 minutes

    // Group alerts by time window
    const recentAlerts = Array.from(this.activeAlerts.values()).filter(
      (alert) => now - alert.timestamp.getTime() < correlationWindowMs
    );

    // Group by affected services
    const serviceGroups = new Map<string, Alert[]>();
    recentAlerts.forEach((alert) => {
      if (alert.serviceName) {
        if (!serviceGroups.has(alert.serviceName)) {
          serviceGroups.set(alert.serviceName, []);
        }
        serviceGroups.get(alert.serviceName)!.push(alert);
      }
    });

    // Create correlations for services with multiple alerts
    serviceGroups.forEach((alerts, serviceName) => {
      if (alerts.length > 1) {
        correlations.push({
          correlationId: this.generateAlertId(),
          relatedAlerts: alerts,
          affectedServices: [serviceName],
          timestamp: new Date(),
        });
      }
    });

    return correlations;
  }

  /**
   * Get active alerts
   */
  public getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * Get alert history
   */
  public getAlertHistory(limit: number = 100): Alert[] {
    return this.alertHistory.slice(-limit);
  }

  /**
   * Get alerts by severity
   */
  public getAlertsBySeverity(severity: AlertSeverity): Alert[] {
    return Array.from(this.activeAlerts.values()).filter((alert) => alert.severity === severity);
  }

  /**
   * Get alerts by service
   */
  public getAlertsByService(serviceName: string): Alert[] {
    return Array.from(this.activeAlerts.values()).filter(
      (alert) => alert.serviceName === serviceName
    );
  }

  /**
   * Generate unique alert ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Clear all alerts
   */
  public clearAllAlerts(): void {
    this.activeAlerts.clear();
    this.alertHistory = [];
    this.lastAlertTimes.clear();
    this.conditionStartTimes.clear();

    // Clear all escalation timers
    this.escalationTimers.forEach((timer) => clearTimeout(timer));
    this.escalationTimers.clear();
  }

  /**
   * Get alert statistics
   */
  public getAlertStatistics(): {
    totalActive: number;
    totalResolved: number;
    bySeverity: Record<AlertSeverity, number>;
    byService: Record<string, number>;
    avgResolutionTimeMinutes: number;
  } {
    const activeAlerts = Array.from(this.activeAlerts.values());
    const resolvedAlerts = this.alertHistory.filter((a) => a.status === 'resolved');

    const bySeverity: Record<AlertSeverity, number> = {
      info: activeAlerts.filter((a) => a.severity === 'info').length,
      warning: activeAlerts.filter((a) => a.severity === 'warning').length,
      critical: activeAlerts.filter((a) => a.severity === 'critical').length,
    };

    const byService: Record<string, number> = {};
    activeAlerts.forEach((alert) => {
      if (alert.serviceName) {
        byService[alert.serviceName] = (byService[alert.serviceName] || 0) + 1;
      }
    });

    const resolutionTimes = resolvedAlerts
      .filter((a) => a.resolvedAt)
      .map((a) => (a.resolvedAt!.getTime() - a.timestamp.getTime()) / 1000 / 60);

    const avgResolutionTimeMinutes =
      resolutionTimes.length > 0
        ? resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length
        : 0;

    return {
      totalActive: activeAlerts.length,
      totalResolved: resolvedAlerts.length,
      bySeverity,
      byService,
      avgResolutionTimeMinutes,
    };
  }
}

// =============================
// Default Configuration
// =============================

export const DEFAULT_NOTIFICATION_CONFIG: NotificationConfig = {
  email: {
    enabled: false,
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    from: 'alerts@terrafusionmarket.com',
    recipients: ['ops@terrafusionmarket.com'],
  },
  slack: {
    enabled: true,
    webhookUrl: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL',
    channel: '#terrafusion-alerts',
  },
  sms: {
    enabled: false,
    provider: 'twilio',
    phoneNumbers: [],
  },
  webhook: {
    enabled: false,
    url: 'https://api.terrafusionmarket.com/webhooks/alerts',
  },
};

export default AlertingEngine;
