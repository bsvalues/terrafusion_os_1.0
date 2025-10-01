/**
 * Terrafusion Government Notification Service
 * Provides real-time notifications, alerts, and compliance monitoring
 * Supports government-grade notification requirements and audit trails
 */

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'compliance' | 'security';
  title: string;
  message: string;
  timestamp: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'system' | 'validation' | 'deployment' | 'compliance' | 'audit' | 'security';
  county?: string;
  pluginId?: string;
  userId?: string;
  read: boolean;
  persistent: boolean;
  actions?: NotificationAction[];
  metadata?: Record<string, any>;
}

export interface NotificationAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'danger';
  handler: () => void | Promise<void>;
}

export interface ComplianceAlert {
  id: string;
  county: string;
  pluginId: string;
  complianceType: 'fisma' | 'state_doe' | 'county_audit' | 'security';
  severity: 'warning' | 'violation' | 'critical';
  description: string;
  remediation: string;
  deadline?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'overdue';
}

export interface SecurityAlert {
  id: string;
  type: 'unauthorized_access' | 'suspicious_activity' | 'validation_failure' | 'system_breach';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedSystems: string[];
  timestamp: string;
  resolved: boolean;
  investigationNotes?: string;
}

export interface NotificationPreferences {
  email: boolean;
  browser: boolean;
  sms: boolean;
  categories: {
    system: boolean;
    validation: boolean;
    deployment: boolean;
    compliance: boolean;
    audit: boolean;
    security: boolean;
  };
  priorities: {
    low: boolean;
    medium: boolean;
    high: boolean;
    critical: boolean;
  };
  quietHours?: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string; // HH:MM format
  };
}

class NotificationService {
  private notifications: Map<string, Notification> = new Map();
  private complianceAlerts: Map<string, ComplianceAlert> = new Map();
  private securityAlerts: Map<string, SecurityAlert> = new Map();
  private preferences: NotificationPreferences;
  private eventListeners: Map<string, Set<Function>> = new Map();
  private baseUrl: string;
  private authToken: string | null = null;

  constructor(baseUrl: string = 'http://localhost:\${{TF_FRONTEND_PORT:-3000}}/api') {
    this.baseUrl = baseUrl;
    this.preferences = this.getDefaultPreferences();
    this.initializeBrowserNotifications();
    this.loadStoredNotifications();
  }

  // Notification Management
  async createNotification(
    notification: Omit<Notification, 'id' | 'timestamp' | 'read'>
  ): Promise<Notification> {
    const fullNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };

    this.notifications.set(fullNotification.id, fullNotification);

    // Check if notification should be shown based on preferences
    if (this.shouldShowNotification(fullNotification)) {
      await this.displayNotification(fullNotification);
    }

    // Store notification
    this.storeNotifications();

    // Emit event
    this.emit('notification_created', fullNotification);

    // Send to backend if authenticated
    if (this.authToken) {
      try {
        await this.sendNotificationToBackend(fullNotification);
      } catch (error) {
        console.warn('Failed to send notification to backend:', error);
      }
    }

    return fullNotification;
  }

  getNotifications(filters?: {
    category?: string;
    priority?: string;
    read?: boolean;
    county?: string;
    limit?: number;
  }): Notification[] {
    let notifications = Array.from(this.notifications.values());

    if (filters) {
      if (filters.category) {
        notifications = notifications.filter(n => n.category === filters.category);
      }
      if (filters.priority) {
        notifications = notifications.filter(n => n.priority === filters.priority);
      }
      if (filters.read !== undefined) {
        notifications = notifications.filter(n => n.read === filters.read);
      }
      if (filters.county) {
        notifications = notifications.filter(n => n.county === filters.county);
      }
      if (filters.limit) {
        notifications = notifications.slice(0, filters.limit);
      }
    }

    return notifications.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  markAsRead(notificationId: string): void {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.read = true;
      this.storeNotifications();
      this.emit('notification_read', notification);
    }
  }

  markAllAsRead(category?: string): void {
    for (const notification of this.notifications.values()) {
      if (!category || notification.category === category) {
        notification.read = true;
      }
    }
    this.storeNotifications();
    this.emit('notifications_read', { category });
  }

  deleteNotification(notificationId: string): void {
    const notification = this.notifications.get(notificationId);
    if (notification && !notification.persistent) {
      this.notifications.delete(notificationId);
      this.storeNotifications();
      this.emit('notification_deleted', notification);
    }
  }

  clearNotifications(category?: string): void {
    if (category) {
      for (const [id, notification] of this.notifications.entries()) {
        if (notification.category === category && !notification.persistent) {
          this.notifications.delete(id);
        }
      }
    } else {
      // Only clear non-persistent notifications
      for (const [id, notification] of this.notifications.entries()) {
        if (!notification.persistent) {
          this.notifications.delete(id);
        }
      }
    }
    this.storeNotifications();
    this.emit('notifications_cleared', { category });
  }

  // Compliance Alerts
  async createComplianceAlert(alert: Omit<ComplianceAlert, 'id'>): Promise<ComplianceAlert> {
    const fullAlert: ComplianceAlert = {
      ...alert,
      id: `comp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    this.complianceAlerts.set(fullAlert.id, fullAlert);

    // Create corresponding notification
    await this.createNotification({
      type: 'compliance',
      title: `Compliance Alert: ${fullAlert.complianceType.toUpperCase()}`,
      message: fullAlert.description,
      priority: fullAlert.severity === 'critical' ? 'critical' : 'high',
      category: 'compliance',
      county: fullAlert.county,
      pluginId: fullAlert.pluginId,
      persistent: true,
      metadata: { complianceAlertId: fullAlert.id },
    });

    this.emit('compliance_alert_created', fullAlert);
    return fullAlert;
  }

  getComplianceAlerts(filters?: {
    county?: string;
    pluginId?: string;
    complianceType?: string;
    status?: string;
    severity?: string;
  }): ComplianceAlert[] {
    let alerts = Array.from(this.complianceAlerts.values());

    if (filters) {
      if (filters.county) {
        alerts = alerts.filter(a => a.county === filters.county);
      }
      if (filters.pluginId) {
        alerts = alerts.filter(a => a.pluginId === filters.pluginId);
      }
      if (filters.complianceType) {
        alerts = alerts.filter(a => a.complianceType === filters.complianceType);
      }
      if (filters.status) {
        alerts = alerts.filter(a => a.status === filters.status);
      }
      if (filters.severity) {
        alerts = alerts.filter(a => a.severity === filters.severity);
      }
    }

    return alerts;
  }

  updateComplianceAlert(alertId: string, updates: Partial<ComplianceAlert>): void {
    const alert = this.complianceAlerts.get(alertId);
    if (alert) {
      Object.assign(alert, updates);
      this.emit('compliance_alert_updated', alert);
    }
  }

  // Security Alerts
  async createSecurityAlert(
    alert: Omit<SecurityAlert, 'id' | 'timestamp' | 'resolved'>
  ): Promise<SecurityAlert> {
    const fullAlert: SecurityAlert = {
      ...alert,
      id: `sec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      resolved: false,
    };

    this.securityAlerts.set(fullAlert.id, fullAlert);

    // Create corresponding notification
    await this.createNotification({
      type: 'security',
      title: `Security Alert: ${fullAlert.type.replace('_', ' ').toUpperCase()}`,
      message: fullAlert.description,
      priority: fullAlert.severity === 'critical' ? 'critical' : 'high',
      category: 'security',
      persistent: true,
      metadata: { securityAlertId: fullAlert.id },
    });

    this.emit('security_alert_created', fullAlert);
    return fullAlert;
  }

  getSecurityAlerts(filters?: {
    type?: string;
    severity?: string;
    resolved?: boolean;
  }): SecurityAlert[] {
    let alerts = Array.from(this.securityAlerts.values());

    if (filters) {
      if (filters.type) {
        alerts = alerts.filter(a => a.type === filters.type);
      }
      if (filters.severity) {
        alerts = alerts.filter(a => a.severity === filters.severity);
      }
      if (filters.resolved !== undefined) {
        alerts = alerts.filter(a => a.resolved === filters.resolved);
      }
    }

    return alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  resolveSecurityAlert(alertId: string, investigationNotes?: string): void {
    const alert = this.securityAlerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      if (investigationNotes) {
        alert.investigationNotes = investigationNotes;
      }
      this.emit('security_alert_resolved', alert);
    }
  }

  // Preferences Management
  updatePreferences(preferences: Partial<NotificationPreferences>): void {
    this.preferences = { ...this.preferences, ...preferences };
    this.storePreferences();
    this.emit('preferences_updated', this.preferences);
  }

  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  // Browser Notifications
  private async initializeBrowserNotifications(): Promise<void> {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    }
  }

  private async displayNotification(notification: Notification): Promise<void> {
    // Browser notification
    if (
      this.preferences.browser &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
        requireInteraction: notification.priority === 'critical',
      });

      browserNotification.onclick = () => {
        window.focus();
        this.emit('notification_clicked', notification);
        browserNotification.close();
      };

      // Auto-close after 5 seconds unless critical
      if (notification.priority !== 'critical') {
        setTimeout(() => {
          browserNotification.close();
        }, 5000);
      }
    }

    // In-app notification display
    this.emit('notification_display', notification);
  }

  private shouldShowNotification(notification: Notification): boolean {
    // Check category preferences
    if (!this.preferences.categories[notification.category]) {
      return false;
    }

    // Check priority preferences
    if (!this.preferences.priorities[notification.priority]) {
      return false;
    }

    // Check quiet hours
    if (this.preferences.quietHours?.enabled) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const { start, end } = this.preferences.quietHours;

      if (start <= end) {
        // Same day quiet hours
        if (currentTime >= start && currentTime <= end) {
          return notification.priority === 'critical';
        }
      } else {
        // Overnight quiet hours
        if (currentTime >= start || currentTime <= end) {
          return notification.priority === 'critical';
        }
      }
    }

    return true;
  }

  // Backend Integration
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  private async sendNotificationToBackend(notification: Notification): Promise<void> {
    await fetch(`${this.baseUrl}/notifications`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notification),
    });
  }

  async syncWithBackend(): Promise<void> {
    if (!this.authToken) return;

    try {
      const response = await fetch(`${this.baseUrl}/notifications`, {
        headers: {
          Authorization: `Bearer ${this.authToken}`,
        },
      });

      if (response.ok) {
        const backendNotifications = await response.json();

        // Merge with local notifications
        backendNotifications.forEach((notification: Notification) => {
          if (!this.notifications.has(notification.id)) {
            this.notifications.set(notification.id, notification);
          }
        });

        this.storeNotifications();
      }
    } catch (error) {
      console.warn('Failed to sync notifications with backend:', error);
    }
  }

  // Event System
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Event listener error:', error);
        }
      });
    }
  }

  // Storage
  private storeNotifications(): void {
    try {
      const notificationsArray = Array.from(this.notifications.entries());
      localStorage.setItem('tf_notifications', JSON.stringify(notificationsArray));
    } catch (error) {
      console.warn('Failed to store notifications:', error);
    }
  }

  private loadStoredNotifications(): void {
    try {
      const stored = localStorage.getItem('tf_notifications');
      if (stored) {
        const notificationsArray = JSON.parse(stored);
        this.notifications = new Map(notificationsArray);
      }
    } catch (error) {
      console.warn('Failed to load stored notifications:', error);
    }
  }

  private storePreferences(): void {
    try {
      localStorage.setItem('tf_notification_preferences', JSON.stringify(this.preferences));
    } catch (error) {
      console.warn('Failed to store preferences:', error);
    }
  }

  private loadStoredPreferences(): void {
    try {
      const stored = localStorage.getItem('tf_notification_preferences');
      if (stored) {
        this.preferences = { ...this.preferences, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn('Failed to load stored preferences:', error);
    }
  }

  private getDefaultPreferences(): NotificationPreferences {
    return {
      email: true,
      browser: true,
      sms: false,
      categories: {
        system: true,
        validation: true,
        deployment: true,
        compliance: true,
        audit: true,
        security: true,
      },
      priorities: {
        low: false,
        medium: true,
        high: true,
        critical: true,
      },
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
      },
    };
  }

  // Utility Methods
  getUnreadCount(category?: string): number {
    const notifications = this.getNotifications({ read: false, category });
    return notifications.length;
  }

  getCriticalAlertsCount(): number {
    const criticalNotifications = this.getNotifications({ priority: 'critical', read: false });
    const openComplianceAlerts = this.getComplianceAlerts({ status: 'open' });
    const unresolvedSecurityAlerts = this.getSecurityAlerts({ resolved: false });

    return (
      criticalNotifications.length + openComplianceAlerts.length + unresolvedSecurityAlerts.length
    );
  }

  // Cleanup
  destroy(): void {
    this.eventListeners.clear();
    this.storeNotifications();
    this.storePreferences();
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default NotificationService;
