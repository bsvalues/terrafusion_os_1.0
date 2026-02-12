import AsyncStorage from "@react-native-async-storage/async-storage";
import { v4 as uuidv4 } from "uuid";
import { NotificationService } from "./NotificationService";

// Request types
interface QueuedRequest {
  id: string;
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: any;
  headers?: Record<string, string>;
  createdAt: string;
  retries: number;
  priority: number;
}

// API Service class
export class ApiService {
  private static instance: ApiService;
  private isOnline: boolean;
  private token: string | null;
  private apiBaseUrl: string;
  private wsBaseUrl: string;
  private requestQueue: QueuedRequest[];
  private processingQueue: boolean;
  private notificationService: NotificationService;
  private maxRetries: number;

  // Private constructor
  private constructor() {
    this.isOnline = true; // Default to true, will be updated by network listener
    this.token = null;
    this.apiBaseUrl = "https://api.terrafield.com/v1"; // Default URL, should be configurable
    this.wsBaseUrl = "wss://api.terrafield.com/ws"; // Default WebSocket URL
    this.requestQueue = [];
    this.processingQueue = false;
    this.notificationService = NotificationService.getInstance();
    this.maxRetries = 5;

    // Load queue from storage
    this.loadQueue();

    // Process queue periodically
    setInterval(() => {
      this.processQueue();
    }, 30000); // Check every 30 seconds
  }

  // Get instance (singleton)
  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  // Set connectivity status
  public setConnectivity(isConnected: boolean): void {
    const wasOffline = !this.isOnline;
    this.isOnline = isConnected;

    // If connectivity restored, process queue
    if (wasOffline && isConnected) {
      this.notificationService.sendSystemNotification(
        "Connection Restored",
        "Your internet connection has been restored. Syncing pending changes..."
      );
      this.processQueue();
    } else if (!isConnected) {
      this.notificationService.sendSystemNotification(
        "Offline Mode",
        "You are currently offline. Changes will be saved locally and synced when connection is restored."
      );
    }
  }

  // Check if connected
  public isConnected(): boolean {
    return this.isOnline;
  }

  // Set API token
  public setToken(token: string): void {
    this.token = token;
  }

  // Clear API token
  public clearToken(): void {
    this.token = null;
  }

  // Get API token
  public getToken(): string | null {
    return this.token;
  }

  // Configure base URLs
  public configure(apiBaseUrl: string, wsBaseUrl: string): void {
    this.apiBaseUrl = apiBaseUrl;
    this.wsBaseUrl = wsBaseUrl;
  }

  // Get WebSocket URL
  public getWebSocketURL(): string {
    return this.wsBaseUrl;
  }

  // Generic request function
  private async request<T>(
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
    url: string,
    body?: any,
    headers?: Record<string, string>,
    priority: number = 1
  ): Promise<T> {
    // Prepare full URL
    const fullUrl = url.startsWith("http") ? url : `${this.apiBaseUrl}${url}`;

    // Prepare headers
    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...(headers || {}),
    };

    // Add auth token if available
    if (this.token) {
      requestHeaders["Authorization"] = `Bearer ${this.token}`;
    }

    // If offline, queue the request and return a promise
    if (!this.isOnline) {
      return this.queueRequest<T>(method, url, body, requestHeaders, priority);
    }

    // If online, make the request
    try {
      const response = await fetch(fullUrl, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });

      // Handle response
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      // If response is empty, return empty object
      if (response.status === 204) {
        return {} as T;
      }

      // Parse response
      const data = await response.json();
      return data as T;
    } catch (error) {
      // If network error, queue the request and throw
      if (error instanceof TypeError && error.message.includes("Network request failed")) {
        this.setConnectivity(false);
        return this.queueRequest<T>(method, url, body, requestHeaders, priority);
      }

      // Otherwise, rethrow
      throw error;
    }
  }

  // Queue a request for later execution
  private queueRequest<T>(
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
    url: string,
    body?: any,
    headers?: Record<string, string>,
    priority: number = 1
  ): Promise<T> {
    // Don't queue GET requests
    if (method === "GET") {
      throw new Error("Cannot perform GET request while offline");
    }

    // Create queue item
    const queueItem: QueuedRequest = {
      id: uuidv4(),
      url,
      method,
      body,
      headers,
      createdAt: new Date().toISOString(),
      retries: 0,
      priority,
    };

    // Add to queue
    this.requestQueue.push(queueItem);
    this.saveQueue();

    // Show notification
    this.notificationService.sendSystemNotification(
      "Request Queued",
      "You are offline. Your request has been queued and will be processed when you are back online."
    );

    // Return a promise that will resolve when the request is processed
    return new Promise<T>((resolve, reject) => {
      // In offline mode, we resolve with an empty object
      // The actual request will be processed later
      resolve({} as T);
    });
  }

  // Process the request queue
  private async processQueue(): Promise<void> {
    // If already processing or offline, skip
    if (this.processingQueue || !this.isOnline || this.requestQueue.length === 0) {
      return;
    }

    this.processingQueue = true;

    try {
      // Sort queue by priority and creation time
      this.requestQueue.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority; // Higher priority first
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); // Older first
      });

      // Process queue
      const processedRequests: string[] = [];

      for (const request of this.requestQueue) {
        try {
          // Prepare full URL
          const fullUrl = request.url.startsWith("http")
            ? request.url
            : `${this.apiBaseUrl}${request.url}`;

          // Make request
          const response = await fetch(fullUrl, {
            method: request.method,
            headers: request.headers,
            body: request.body ? JSON.stringify(request.body) : undefined,
          });

          // If successful, mark for removal
          if (response.ok) {
            processedRequests.push(request.id);
          } else {
            // If failed, increment retries
            request.retries++;

            // If max retries reached, mark for removal
            if (request.retries >= this.maxRetries) {
              processedRequests.push(request.id);

              // Show notification
              this.notificationService.sendSystemNotification(
                "Request Failed",
                `A queued request to ${request.url} failed after ${this.maxRetries} attempts.`
              );
            }
          }
        } catch (error) {
          // If error, increment retries
          request.retries++;

          // If max retries reached, mark for removal
          if (request.retries >= this.maxRetries) {
            processedRequests.push(request.id);

            // Show notification
            this.notificationService.sendSystemNotification(
              "Request Failed",
              `A queued request to ${request.url} failed after ${this.maxRetries} attempts.`
            );
          }
        }
      }

      // Remove processed requests
      this.requestQueue = this.requestQueue.filter(
        (request) => !processedRequests.includes(request.id)
      );

      // Save queue
      this.saveQueue();

      // Show notification
      if (processedRequests.length > 0) {
        this.notificationService.sendSystemNotification(
          "Sync Complete",
          `Successfully synchronized ${processedRequests.length} pending requests.`
        );
      }
    } finally {
      this.processingQueue = false;
    }
  }

  // Load queue from storage
  private async loadQueue(): Promise<void> {
    try {
      const queueJson = await AsyncStorage.getItem("terrafield_request_queue");

      if (queueJson) {
        this.requestQueue = JSON.parse(queueJson);
      }
    } catch (error) {
      console.error("Failed to load request queue:", error);
      this.requestQueue = [];
    }
  }

  // Save queue to storage
  private async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem("terrafield_request_queue", JSON.stringify(this.requestQueue));
    } catch (error) {
      console.error("Failed to save request queue:", error);
    }
  }

  // Public API methods

  // GET request
  public async get<T>(url: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>("GET", url, undefined, headers);
  }

  // POST request
  public async post<T>(
    url: string,
    body?: any,
    headers?: Record<string, string>,
    priority: number = 1
  ): Promise<T> {
    return this.request<T>("POST", url, body, headers, priority);
  }

  // PUT request
  public async put<T>(
    url: string,
    body?: any,
    headers?: Record<string, string>,
    priority: number = 1
  ): Promise<T> {
    return this.request<T>("PUT", url, body, headers, priority);
  }

  // DELETE request
  public async delete<T>(
    url: string,
    body?: any,
    headers?: Record<string, string>,
    priority: number = 1
  ): Promise<T> {
    return this.request<T>("DELETE", url, body, headers, priority);
  }

  // PATCH request
  public async patch<T>(
    url: string,
    body?: any,
    headers?: Record<string, string>,
    priority: number = 1
  ): Promise<T> {
    return this.request<T>("PATCH", url, body, headers, priority);
  }

  // Get queue stats
  public getQueueStats(): { total: number; byType: Record<string, number> } {
    const byType: Record<string, number> = {};

    this.requestQueue.forEach((request) => {
      byType[request.method] = (byType[request.method] || 0) + 1;
    });

    return {
      total: this.requestQueue.length,
      byType,
    };
  }

  // Clear queue (for testing)
  public async clearQueue(): Promise<void> {
    this.requestQueue = [];
    await this.saveQueue();
  }
}

export default ApiService;
