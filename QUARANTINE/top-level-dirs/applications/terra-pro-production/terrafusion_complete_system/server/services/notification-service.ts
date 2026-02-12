import { WebSocket } from "ws";

export enum NotificationType {
  PHOTO_ENHANCEMENT_STARTED = "PHOTO_ENHANCEMENT_STARTED",
  PHOTO_ENHANCEMENT_COMPLETED = "PHOTO_ENHANCEMENT_COMPLETED",
  PHOTO_ENHANCEMENT_FAILED = "PHOTO_ENHANCEMENT_FAILED",
  SYNC_STARTED = "SYNC_STARTED",
  SYNC_COMPLETED = "SYNC_COMPLETED",
  SYNC_FAILED = "SYNC_FAILED",
  NEW_PHOTO_AVAILABLE = "NEW_PHOTO_AVAILABLE",
  OFFLINE_QUEUE_UPDATED = "OFFLINE_QUEUE_UPDATED",
}

export interface Notification {
  id: string;
  type: NotificationType;
  userId: number;
  title: string;
  message: string;
  resourceId?: string;
  resourceType?: string;
  timestamp: Date;
  read: boolean;
  data?: Record<string, any>;
}

/**
 * Service to manage notifications for TerraField Mobile
 */
export class NotificationService {
  private static instance: NotificationService;
  private clientConnections: Map<number, Set<WebSocket>>;
  private notifications: Map<number, Notification[]>;

  private constructor() {
    this.clientConnections = new Map();
    this.notifications = new Map();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Register a client connection for a user
   */
  public registerConnection(userId: number, connection: WebSocket): void {
    if (!this.clientConnections.has(userId)) {
      this.clientConnections.set(userId, new Set());
    }

    this.clientConnections.get(userId)?.add(connection);

    // Send any existing notifications to the new connection
    this.sendExistingNotifications(userId, connection);
  }

  /**
   * Remove a client connection
   */
  public removeConnection(userId: number, connection: WebSocket): void {
    const connections = this.clientConnections.get(userId);
    if (connections) {
      connections.delete(connection);
      if (connections.size === 0) {
        this.clientConnections.delete(userId);
      }
    }
  }

  /**
   * Create and send a notification
   */
  public sendNotification(
    userId: number,
    type: NotificationType,
    title: string,
    message: string,
    options: {
      resourceId?: string;
      resourceType?: string;
      data?: Record<string, any>;
    } = {}
  ): Notification {
    const notification: Notification = {
      id: this.generateId(),
      userId,
      type,
      title,
      message,
      resourceId: options.resourceId,
      resourceType: options.resourceType,
      data: options.data,
      timestamp: new Date(),
      read: false,
    };

    // Store the notification
    if (!this.notifications.has(userId)) {
      this.notifications.set(userId, []);
    }
    this.notifications.get(userId)?.push(notification);

    // Send to all connected clients for this user
    this.broadcastToUser(userId, {
      type: "notification",
      notification,
    });

    return notification;
  }

  /**
   * Mark a notification as read
   */
  public markAsRead(userId: number, notificationId: string): boolean {
    const userNotifications = this.notifications.get(userId);
    if (!userNotifications) return false;

    const notification = userNotifications.find((n) => n.id === notificationId);
    if (!notification) return false;

    notification.read = true;

    // Notify clients of the change
    this.broadcastToUser(userId, {
      type: "notification_updated",
      notification,
    });

    return true;
  }

  /**
   * Get all notifications for a user
   */
  public getNotificationsForUser(userId: number): Notification[] {
    return this.notifications.get(userId) || [];
  }

  /**
   * Clear all notifications for a user
   */
  public clearNotifications(userId: number): void {
    this.notifications.set(userId, []);

    // Notify clients of the change
    this.broadcastToUser(userId, {
      type: "notifications_cleared",
    });
  }

  /**
   * Send a specific notification about photo enhancement status
   */
  public sendPhotoEnhancementNotification(
    userId: number,
    status: "started" | "completed" | "failed",
    photoId: string,
    details?: Record<string, any>
  ): Notification {
    let type: NotificationType;
    let title: string;
    let message: string;

    switch (status) {
      case "started":
        type = NotificationType.PHOTO_ENHANCEMENT_STARTED;
        title = "Photo Enhancement Started";
        message = "Your photo is being enhanced with AI...";
        break;
      case "completed":
        type = NotificationType.PHOTO_ENHANCEMENT_COMPLETED;
        title = "Photo Enhancement Completed";
        message = "Your photo has been successfully enhanced!";
        break;
      case "failed":
        type = NotificationType.PHOTO_ENHANCEMENT_FAILED;
        title = "Photo Enhancement Failed";
        message = "There was an error enhancing your photo. Please try again.";
        break;
    }

    return this.sendNotification(userId, type, title, message, {
      resourceId: photoId,
      resourceType: "photo",
      data: details,
    });
  }

  /**
   * Send a specific notification about sync status
   */
  public sendSyncNotification(
    userId: number,
    status: "started" | "completed" | "failed",
    resourceType: string,
    resourceId?: string,
    details?: Record<string, any>
  ): Notification {
    let type: NotificationType;
    let title: string;
    let message: string;

    switch (status) {
      case "started":
        type = NotificationType.SYNC_STARTED;
        title = "Synchronization Started";
        message = `Syncing your ${resourceType}...`;
        break;
      case "completed":
        type = NotificationType.SYNC_COMPLETED;
        title = "Synchronization Completed";
        message = `Your ${resourceType} has been successfully synchronized!`;
        break;
      case "failed":
        type = NotificationType.SYNC_FAILED;
        title = "Synchronization Failed";
        message = `Failed to synchronize your ${resourceType}. Will retry when connected.`;
        break;
    }

    return this.sendNotification(userId, type, title, message, {
      resourceId,
      resourceType,
      data: details,
    });
  }

  /**
   * Send existing notifications to a new connection
   */
  private sendExistingNotifications(userId: number, connection: WebSocket): void {
    const userNotifications = this.notifications.get(userId) || [];

    if (userNotifications.length > 0) {
      this.sendToClient(connection, {
        type: "initial_notifications",
        notifications: userNotifications,
      });
    }
  }

  /**
   * Broadcast a message to all connections for a user
   */
  private broadcastToUser(userId: number, message: any): void {
    const connections = this.clientConnections.get(userId);
    if (!connections) return;

    const messageString = JSON.stringify(message);

    for (const connection of connections) {
      if (connection.readyState === WebSocket.OPEN) {
        connection.send(messageString);
      }
    }
  }

  /**
   * Send a message to a specific client
   */
  private sendToClient(connection: WebSocket, message: any): void {
    if (connection.readyState === WebSocket.OPEN) {
      connection.send(JSON.stringify(message));
    }
  }

  /**
   * Generate a unique ID for notifications
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
}
