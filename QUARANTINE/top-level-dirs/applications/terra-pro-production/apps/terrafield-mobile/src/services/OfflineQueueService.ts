/**
 * OfflineQueueService
 *
 * This service handles queueing operations when the app is offline
 * and processing them when connectivity is restored.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

// Operation types for offline queue
export enum OperationType {
  CREATE_PROPERTY = "create_property",
  UPDATE_PROPERTY = "update_property",
  CREATE_REPORT = "create_report",
  UPDATE_REPORT = "update_report",
  CREATE_COMPARABLE = "create_comparable",
  UPDATE_COMPARABLE = "update_comparable",
  UPLOAD_PHOTO = "upload_photo",
  DELETE_PHOTO = "delete_photo",
  CREATE_NOTE = "create_note",
  UPDATE_NOTE = "update_note",
  DELETE_NOTE = "delete_note",
}

// Queue item interface
export interface QueueItem {
  id: string;
  type: OperationType;
  data: any;
  timestamp: number;
  priority: number; // 1 = low, 2 = medium, 3 = high
  attempts: number;
  lastAttempt?: number;
}

export class OfflineQueueService {
  private static instance: OfflineQueueService;
  private queue: QueueItem[] = [];
  private isProcessing: boolean = false;
  private storageKey: string = "terrafield_offline_queue";

  private constructor() {
    // Load queue from storage on initialization
    this.loadQueue();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): OfflineQueueService {
    if (!OfflineQueueService.instance) {
      OfflineQueueService.instance = new OfflineQueueService();
    }
    return OfflineQueueService.instance;
  }

  /**
   * Load queue from AsyncStorage
   */
  private async loadQueue(): Promise<void> {
    try {
      const queueData = await AsyncStorage.getItem(this.storageKey);
      if (queueData) {
        this.queue = JSON.parse(queueData);
        console.log(`Loaded ${this.queue.length} items from offline queue`);
      }
    } catch (error) {
      console.error("Error loading offline queue:", error);
    }
  }

  /**
   * Save queue to AsyncStorage
   */
  private async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(this.queue));
    } catch (error) {
      console.error("Error saving offline queue:", error);
    }
  }

  /**
   * Add an operation to the queue
   */
  public async enqueue(type: OperationType, data: any, priority: number = 1): Promise<string> {
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2);
    const queueItem: QueueItem = {
      id,
      type,
      data,
      timestamp: Date.now(),
      priority,
      attempts: 0,
    };

    this.queue.push(queueItem);
    await this.saveQueue();

    console.log(`Added ${type} operation to offline queue. Queue size: ${this.queue.length}`);
    return id;
  }

  /**
   * Get the current queue
   */
  public getQueue(): QueueItem[] {
    return [...this.queue];
  }

  /**
   * Get the count of queue items
   */
  public getQueueCount(): number {
    return this.queue.length;
  }

  /**
   * Get queue items of a specific type
   */
  public getItemsByType(type: OperationType): QueueItem[] {
    return this.queue.filter((item) => item.type === type);
  }

  /**
   * Remove an item from the queue
   */
  public async removeItem(id: string): Promise<boolean> {
    const initialCount = this.queue.length;
    this.queue = this.queue.filter((item) => item.id !== id);

    if (this.queue.length !== initialCount) {
      await this.saveQueue();
      return true;
    }

    return false;
  }

  /**
   * Clear the entire queue
   */
  public async clearQueue(): Promise<void> {
    this.queue = [];
    await this.saveQueue();
    console.log("Offline queue cleared");
  }

  /**
   * Update an item in the queue
   */
  public async updateItem(id: string, updates: Partial<QueueItem>): Promise<boolean> {
    const itemIndex = this.queue.findIndex((item) => item.id === id);

    if (itemIndex === -1) return false;

    this.queue[itemIndex] = {
      ...this.queue[itemIndex],
      ...updates,
    };

    await this.saveQueue();
    return true;
  }

  /**
   * Process a specific item from the queue
   * This should be implemented by the consumer
   */
  public processItem(item: QueueItem): Promise<boolean> {
    // This is a placeholder to be overridden by consumers
    return Promise.resolve(false);
  }

  /**
   * Process the queue (should be called when network is available)
   */
  public async processQueue(
    processItemFunc?: (item: QueueItem) => Promise<boolean>
  ): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;

    try {
      this.isProcessing = true;

      // Sort by priority (higher number = higher priority)
      const sortedQueue = [...this.queue].sort((a, b) => b.priority - a.priority);

      for (const item of sortedQueue) {
        try {
          console.log(`Processing offline queue item: ${item.type}`);

          // Use provided function or default
          const processFunction = processItemFunc || this.processItem;
          const success = await processFunction(item);

          if (success) {
            // If processed successfully, remove from queue
            await this.removeItem(item.id);
            console.log(`Successfully processed and removed queue item: ${item.id}`);
          } else {
            // Update attempt count and timestamp
            await this.updateItem(item.id, {
              attempts: item.attempts + 1,
              lastAttempt: Date.now(),
            });
            console.log(`Failed to process queue item: ${item.id}, attempts: ${item.attempts + 1}`);
          }
        } catch (error) {
          console.error(`Error processing queue item ${item.id}:`, error);

          // Update attempt count and timestamp
          await this.updateItem(item.id, {
            attempts: item.attempts + 1,
            lastAttempt: Date.now(),
          });
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }
}
