import AsyncStorage from "@react-native-async-storage/async-storage";
import { v4 as uuidv4 } from "uuid";

// Notification types
export enum NotificationType {
  SYSTEM = "system",
  USER = "user",
  SUCCESS = "success",
  ERROR = "error",
  WARNING = "warning",
  INFO = "info",
}

// Channel types
export enum NotificationChannel {
  SYNC = "sync",
  FIELD_NOTES = "field-notes",
  AUTH = "auth",
  REPORTS = "reports",
  PROPERTIES = "properties",
  SYSTEM = "system",
}

// Notification interface
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  channel: NotificationChannel;
  data?: any;
}

// Notification listener type
type NotificationListener = (notification: Notification) => void;

// Notification preferences type
interface NotificationPreferences {
  enabled: boolean;
  channels: Record<NotificationChannel, boolean>;
}

// Main notification service class
export class NotificationService {
  private static instance: NotificationService;
  private notifications: Notification[];
  private listeners: NotificationListener[];
  private preferences: NotificationPreferences;
  private maxNotifications: number;

  // Private constructor
  private constructor() {
    this.notifications = [];
    this.listeners = [];
    this.maxNotifications = 100;

    // Default preferences
    this.preferences = {
      enabled: true,
      channels: {
        [NotificationChannel.SYNC]: true,
        [NotificationChannel.FIELD_NOTES]: true,
        [NotificationChannel.AUTH]: true,
        [NotificationChannel.REPORTS]: true,
        [NotificationChannel.PROPERTIES]: true,
        [NotificationChannel.SYSTEM]: true,
      },
    };

    // Load notifications and preferences from storage
    this.loadNotifications();
    this.loadPreferences();
  }

  // Get instance (singleton)
  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Add notification listener
  public addListener(listener: NotificationListener): void {
    this.listeners.push(listener);
  }

  // Remove notification listener
  public removeListener(listener: NotificationListener): void {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  // Send notification
  public sendNotification(
    type: NotificationType,
    title: string,
    message: string,
    channel: NotificationChannel = NotificationChannel.SYSTEM,
    data?: any
  ): Notification {
    // If notifications are disabled or channel is disabled, return empty notification
    if (!this.preferences.enabled || !this.preferences.channels[channel]) {
      return {
        id: uuidv4(),
        type,
        title,
        message,
        timestamp: new Date().toISOString(),
        read: true,
        channel,
        data,
      };
    }

    // Create notification
    const notification: Notification = {
      id: uuidv4(),
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false,
      channel,
      data,
    };

    // Add to notifications
    this.notifications.unshift(notification);

    // Limit the number of notifications
    if (this.notifications.length > this.maxNotifications) {
      this.notifications = this.notifications.slice(0, this.maxNotifications);
    }

    // Save notifications
    this.saveNotifications();

    // Notify listeners
    this.notifyListeners(notification);

    return notification;
  }

  // Send system notification
  public sendSystemNotification(title: string, message: string, data?: any): Notification {
    return this.sendNotification(
      NotificationType.SYSTEM,
      title,
      message,
      NotificationChannel.SYSTEM,
      data
    );
  }

  // Send success notification
  public sendSuccessNotification(
    title: string,
    message: string,
    channel: NotificationChannel = NotificationChannel.SYSTEM,
    data?: any
  ): Notification {
    return this.sendNotification(NotificationType.SUCCESS, title, message, channel, data);
  }

  // Send error notification
  public sendErrorNotification(
    title: string,
    message: string,
    channel: NotificationChannel = NotificationChannel.SYSTEM,
    data?: any
  ): Notification {
    return this.sendNotification(NotificationType.ERROR, title, message, channel, data);
  }

  // Send warning notification
  public sendWarningNotification(
    title: string,
    message: string,
    channel: NotificationChannel = NotificationChannel.SYSTEM,
    data?: any
  ): Notification {
    return this.sendNotification(NotificationType.WARNING, title, message, channel, data);
  }

  // Send info notification
  public sendInfoNotification(
    title: string,
    message: string,
    channel: NotificationChannel = NotificationChannel.SYSTEM,
    data?: any
  ): Notification {
    return this.sendNotification(NotificationType.INFO, title, message, channel, data);
  }

  // Send user notification
  public sendUserNotification(
    title: string,
    message: string,
    channel: NotificationChannel = NotificationChannel.SYSTEM,
    data?: any
  ): Notification {
    return this.sendNotification(NotificationType.USER, title, message, channel, data);
  }

  // Notify listeners
  private notifyListeners(notification: Notification): void {
    this.listeners.forEach((listener) => {
      try {
        listener(notification);
      } catch (error) {
        console.error("Error in notification listener:", error);
      }
    });
  }

  // Get all notifications
  public getNotifications(): Notification[] {
    return [...this.notifications];
  }

  // Get unread notifications
  public getUnreadNotifications(): Notification[] {
    return this.notifications.filter((notification) => !notification.read);
  }

  // Get notifications by channel
  public getNotificationsByChannel(channel: NotificationChannel): Notification[] {
    return this.notifications.filter((notification) => notification.channel === channel);
  }

  // Get notifications by type
  public getNotificationsByType(type: NotificationType): Notification[] {
    return this.notifications.filter((notification) => notification.type === type);
  }

  // Mark notification as read
  public markAsRead(id: string): void {
    const notification = this.notifications.find((n) => n.id === id);

    if (notification) {
      notification.read = true;
      this.saveNotifications();
    }
  }

  // Mark all notifications as read
  public markAllAsRead(): void {
    this.notifications.forEach((notification) => {
      notification.read = true;
    });

    this.saveNotifications();
  }

  // Delete notification
  public deleteNotification(id: string): void {
    this.notifications = this.notifications.filter((n) => n.id !== id);
    this.saveNotifications();
  }

  // Clear all notifications
  public clearNotifications(): void {
    this.notifications = [];
    this.saveNotifications();
  }

  // Enable notifications
  public enableNotifications(): void {
    this.preferences.enabled = true;
    this.savePreferences();
  }

  // Disable notifications
  public disableNotifications(): void {
    this.preferences.enabled = false;
    this.savePreferences();
  }

  // Enable channel
  public enableChannel(channel: NotificationChannel): void {
    this.preferences.channels[channel] = true;
    this.savePreferences();
  }

  // Disable channel
  public disableChannel(channel: NotificationChannel): void {
    this.preferences.channels[channel] = false;
    this.savePreferences();
  }

  // Get preferences
  public getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  // Set preferences
  public setPreferences(preferences: NotificationPreferences): void {
    this.preferences = { ...preferences };
    this.savePreferences();
  }

  // Load notifications from storage
  private async loadNotifications(): Promise<void> {
    try {
      const notificationsJson = await AsyncStorage.getItem("terrafield_notifications");

      if (notificationsJson) {
        this.notifications = JSON.parse(notificationsJson);
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
  }

  // Save notifications to storage
  private async saveNotifications(): Promise<void> {
    try {
      await AsyncStorage.setItem("terrafield_notifications", JSON.stringify(this.notifications));
    } catch (error) {
      console.error("Failed to save notifications:", error);
    }
  }

  // Load preferences from storage
  private async loadPreferences(): Promise<void> {
    try {
      const preferencesJson = await AsyncStorage.getItem("terrafield_notification_preferences");

      if (preferencesJson) {
        this.preferences = JSON.parse(preferencesJson);
      }
    } catch (error) {
      console.error("Failed to load notification preferences:", error);
    }
  }

  // Save preferences to storage
  private async savePreferences(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        "terrafield_notification_preferences",
        JSON.stringify(this.preferences)
      );
    } catch (error) {
      console.error("Failed to save notification preferences:", error);
    }
  }
}

export default NotificationService;
