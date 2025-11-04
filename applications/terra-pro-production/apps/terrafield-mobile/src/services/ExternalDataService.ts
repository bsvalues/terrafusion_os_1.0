import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { v4 as uuidv4 } from "uuid";

import { AuthService } from "./AuthService";
import { SecureStorageService, SecurityLevel } from "./SecureStorageService";
import { OfflineQueueService, OperationType } from "./OfflineQueueService";

/**
 * External data source type
 */
export enum ExternalDataSourceType {
  MLS = "mls", // Multiple Listing Service
  PUBLIC_RECORDS = "public_records", // County/Public Records
  TAX_ASSESSOR = "tax_assessor", // Tax Assessor Records
  FLOOD = "flood", // Flood Maps/FEMA
  ENVIRONMENTAL = "environmental", // Environmental Data
  CENSUS = "census", // Census Data
  SCHOOL = "school", // School District Data
  CRIME = "crime", // Crime Statistics
  MARKET_TRENDS = "market_trends", // Real Estate Market Trends
  GEOSPATIAL = "geospatial", // GIS/Mapping Data
  DEMOGRAPHICS = "demographics", // Demographic Data
  CUSTOM_API = "custom_api", // Custom API Integration
  EXTERNAL_FILE = "external_file", // External File Import
}

/**
 * Data integration mode
 */
export enum DataIntegrationMode {
  READ_ONLY = "read_only", // Read data only
  WRITE_ONLY = "write_only", // Write data only
  READ_WRITE = "read_write", // Read and write data
  SYNCHRONIZE = "synchronize", // Two-way synchronization
}

/**
 * External data connection status
 */
export enum ConnectionStatus {
  CONNECTED = "connected", // Successfully connected
  DISCONNECTED = "disconnected", // Not connected
  ERROR = "error", // Connection error
  UNAUTHORIZED = "unauthorized", // Authentication/authorization error
  EXPIRED = "expired", // Credentials expired
  RATE_LIMITED = "rate_limited", // Rate limit reached
  MAINTENANCE = "maintenance", // Service in maintenance
  PARTIAL = "partial", // Partial connection (some features unavailable)
}

/**
 * External data connector configuration
 */
export interface DataConnectorConfig {
  /**
   * Connector ID
   */
  id: string;

  /**
   * Connector name
   */
  name: string;

  /**
   * Data source type
   */
  sourceType: ExternalDataSourceType;

  /**
   * Integration mode
   */
  integrationMode: DataIntegrationMode;

  /**
   * Connection URL or endpoint
   */
  endpoint: string;

  /**
   * Authentication type
   */
  authType: "api_key" | "oauth" | "basic" | "token" | "none";

  /**
   * Authentication credentials (encrypted)
   */
  credentials?: {
    apiKey?: string;
    username?: string;
    password?: string;
    token?: string;
    clientId?: string;
    clientSecret?: string;
  };

  /**
   * Headers to include in requests
   */
  headers?: Record<string, string>;

  /**
   * Query parameters to include in requests
   */
  queryParams?: Record<string, string>;

  /**
   * Request timeout in milliseconds
   */
  timeout: number;

  /**
   * Whether to cache responses
   */
  cacheResponses: boolean;

  /**
   * Cache expiration time in milliseconds
   */
  cacheExpiration: number;

  /**
   * Data transformation rules
   */
  transformations?: {
    input?: string; // Transformation function for input data
    output?: string; // Transformation function for output data
  };

  /**
   * Rate limiting settings
   */
  rateLimit?: {
    requests: number;
    period: number;
  };

  /**
   * Retry settings
   */
  retry?: {
    maxAttempts: number;
    backoffFactor: number;
    initialDelay: number;
  };

  /**
   * Webhook configuration
   */
  webhook?: {
    url: string;
    events: string[];
    secret?: string;
  };

  /**
   * Enabled flag
   */
  enabled: boolean;

  /**
   * Created timestamp
   */
  createdAt: number;

  /**
   * Updated timestamp
   */
  updatedAt: number;

  /**
   * Created by user ID
   */
  createdBy: string;
}

/**
 * External data request interface
 */
export interface DataRequest {
  /**
   * Request ID
   */
  id: string;

  /**
   * Connector ID
   */
  connectorId: string;

  /**
   * Request type
   */
  requestType: "get" | "post" | "put" | "patch" | "delete";

  /**
   * Resource path
   */
  resourcePath: string;

  /**
   * Query parameters
   */
  queryParams?: Record<string, string>;

  /**
   * Request body
   */
  body?: any;

  /**
   * Request headers
   */
  headers?: Record<string, string>;

  /**
   * Expected response format
   */
  responseFormat: "json" | "xml" | "csv" | "text" | "binary";

  /**
   * Local entity type to map to
   */
  entityType?: string;

  /**
   * Local entity ID to map to
   */
  entityId?: string;

  /**
   * Mapping configuration
   */
  mapping?: {
    fields: {
      source: string;
      target: string;
      transform?: string;
    }[];
  };

  /**
   * Request timestamp
   */
  timestamp: number;

  /**
   * Result status
   */
  status?: "pending" | "success" | "error";

  /**
   * Result data
   */
  result?: any;

  /**
   * Error message
   */
  error?: string;

  /**
   * Response timestamp
   */
  responseTimestamp?: number;

  /**
   * Response headers
   */
  responseHeaders?: Record<string, string>;

  /**
   * HTTP status code
   */
  statusCode?: number;
}

/**
 * Data reconciliation conflict
 */
export interface DataConflict {
  /**
   * Conflict ID
   */
  id: string;

  /**
   * Entity type
   */
  entityType: string;

  /**
   * Entity ID
   */
  entityId: string;

  /**
   * Field path
   */
  fieldPath: string;

  /**
   * Local value
   */
  localValue: any;

  /**
   * External value
   */
  externalValue: any;

  /**
   * Connector ID
   */
  connectorId: string;

  /**
   * Data source type
   */
  sourceType: ExternalDataSourceType;

  /**
   * Conflict timestamp
   */
  timestamp: number;

  /**
   * Resolution status
   */
  resolved: boolean;

  /**
   * Resolution timestamp
   */
  resolvedAt?: number;

  /**
   * Resolution choice
   */
  resolution?: "local" | "external" | "custom";

  /**
   * Custom resolution value
   */
  customValue?: any;

  /**
   * Resolution notes
   */
  notes?: string;
}

/**
 * Data mapping
 */
export interface DataMapping {
  /**
   * Mapping ID
   */
  id: string;

  /**
   * Mapping name
   */
  name: string;

  /**
   * Source type
   */
  sourceType: ExternalDataSourceType;

  /**
   * Local entity type
   */
  entityType: string;

  /**
   * Field mappings
   */
  fields: {
    /**
     * Local field path
     */
    local: string;

    /**
     * External field path
     */
    external: string;

    /**
     * Transformation function
     */
    transform?: string;

    /**
     * Default value
     */
    defaultValue?: any;

    /**
     * Whether field is required
     */
    required: boolean;

    /**
     * Whether to ignore this field during synchronization
     */
    ignore?: boolean;

    /**
     * Direction of mapping
     */
    direction: "import" | "export" | "both";
  }[];

  /**
   * Mapping created timestamp
   */
  createdAt: number;

  /**
   * Mapping updated timestamp
   */
  updatedAt: number;
}

/**
 * External data service options
 */
export interface ExternalDataServiceOptions {
  /**
   * Maximum cache size (bytes)
   */
  maxCacheSize: number;

  /**
   * Default cache expiration (ms)
   */
  defaultCacheExpiration: number;

  /**
   * Whether to use offline mode when disconnected
   */
  offlineMode: boolean;

  /**
   * Default request timeout (ms)
   */
  defaultTimeout: number;

  /**
   * API connection retries
   */
  connectionRetries: number;

  /**
   * Whether to encrypt cached data
   */
  encryptCache: boolean;

  /**
   * Security level for stored data
   */
  securityLevel: SecurityLevel;

  /**
   * Auto-resolve conflicts strategy
   */
  autoResolveStrategy: "newer" | "external" | "local" | "none";
}

/**
 * Default service options
 */
const DEFAULT_OPTIONS: ExternalDataServiceOptions = {
  maxCacheSize: 100 * 1024 * 1024, // 100 MB
  defaultCacheExpiration: 24 * 60 * 60 * 1000, // 24 hours
  offlineMode: true,
  defaultTimeout: 30000, // 30 seconds
  connectionRetries: 3,
  encryptCache: true,
  securityLevel: SecurityLevel.HIGH,
  autoResolveStrategy: "none",
};

/**
 * External data integration service
 */
export class ExternalDataService {
  private static instance: ExternalDataService;
  private options: ExternalDataServiceOptions;
  private authService: AuthService;
  private secureStorageService: SecureStorageService;
  private offlineQueueService: OfflineQueueService;

  // State
  private connectors: Map<string, DataConnectorConfig> = new Map();
  private mappings: Map<string, DataMapping> = new Map();
  private conflicts: Map<string, DataConflict> = new Map();
  private connectionStatus: Map<string, ConnectionStatus> = new Map();

  // Cache
  private cache: Map<
    string,
    {
      data: any;
      timestamp: number;
      expires: number;
      size: number;
    }
  > = new Map();
  private cacheSize: number = 0;

  // Directories
  private readonly DATA_DIRECTORY = `${FileSystem.documentDirectory}external_data/`;

  // API endpoints
  private readonly API_ENDPOINT = "https://api.appraisalcore.replit.app/api/external-data";

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    this.options = { ...DEFAULT_OPTIONS };
    this.authService = AuthService.getInstance();
    this.secureStorageService = SecureStorageService.getInstance();
    this.offlineQueueService = OfflineQueueService.getInstance();

    // Ensure directories exist
    this.ensureDirectories();

    // Load state
    this.loadState();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ExternalDataService {
    if (!ExternalDataService.instance) {
      ExternalDataService.instance = new ExternalDataService();
    }
    return ExternalDataService.instance;
  }

  /**
   * Initialize with options
   */
  public initialize(options: Partial<ExternalDataServiceOptions>): void {
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
    };
  }

  /**
   * Ensure required directories exist
   */
  private async ensureDirectories(): Promise<void> {
    try {
      // Check if data directory exists
      const dirInfo = await FileSystem.getInfoAsync(this.DATA_DIRECTORY);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.DATA_DIRECTORY, { intermediates: true });
      }
    } catch (error) {
      console.error("Error ensuring directories:", error);
    }
  }

  /**
   * Load state from storage
   */
  private async loadState(): Promise<void> {
    try {
      // Load connectors
      const connectors = await this.secureStorageService.getData<DataConnectorConfig[]>(
        "terrafield:external:connectors",
        [],
        this.options.securityLevel
      );

      for (const connector of connectors) {
        this.connectors.set(connector.id, connector);
      }

      // Load mappings
      const mappings = await this.secureStorageService.getData<DataMapping[]>(
        "terrafield:external:mappings",
        [],
        this.options.securityLevel
      );

      for (const mapping of mappings) {
        this.mappings.set(mapping.id, mapping);
      }

      // Load conflicts
      const conflicts = await this.secureStorageService.getData<DataConflict[]>(
        "terrafield:external:conflicts",
        [],
        this.options.securityLevel
      );

      for (const conflict of conflicts) {
        this.conflicts.set(conflict.id, conflict);
      }

      // Load connection status
      const connectionStatus = await this.secureStorageService.getData<
        Record<string, ConnectionStatus>
      >("terrafield:external:connection_status", {}, SecurityLevel.MEDIUM);

      for (const [connectorId, status] of Object.entries(connectionStatus)) {
        this.connectionStatus.set(connectorId, status);
      }

      // Initialize cache metrics
      this.calculateCacheSize();
    } catch (error) {
      console.error("Error loading external data state:", error);
    }
  }

  /**
   * Save state to storage
   */
  private async saveState(): Promise<void> {
    try {
      // Save connectors
      await this.secureStorageService.saveData(
        "terrafield:external:connectors",
        Array.from(this.connectors.values()),
        this.options.securityLevel
      );

      // Save mappings
      await this.secureStorageService.saveData(
        "terrafield:external:mappings",
        Array.from(this.mappings.values()),
        this.options.securityLevel
      );

      // Save conflicts
      await this.secureStorageService.saveData(
        "terrafield:external:conflicts",
        Array.from(this.conflicts.values()),
        this.options.securityLevel
      );

      // Save connection status
      const connectionStatusObj: Record<string, ConnectionStatus> = {};
      this.connectionStatus.forEach((status, connectorId) => {
        connectionStatusObj[connectorId] = status;
      });

      await this.secureStorageService.saveData(
        "terrafield:external:connection_status",
        connectionStatusObj,
        SecurityLevel.MEDIUM
      );
    } catch (error) {
      console.error("Error saving external data state:", error);
    }
  }

  /**
   * Calculate cache size
   */
  private calculateCacheSize(): void {
    let size = 0;

    for (const entry of this.cache.values()) {
      size += entry.size;
    }

    this.cacheSize = size;
    console.log(`Cache size: ${(this.cacheSize / 1024 / 1024).toFixed(2)} MB`);
  }

  /**
   * Create data connector
   */
  public async createConnector(
    config: Omit<DataConnectorConfig, "id" | "createdAt" | "updatedAt" | "createdBy">
  ): Promise<DataConnectorConfig> {
    try {
      // Generate connector ID
      const connectorId = `connector_${uuidv4()}`;

      // Get user ID
      const userId = (await this.authService.getUserId()) || "unknown";

      // Create connector configuration
      const connector: DataConnectorConfig = {
        ...config,
        id: connectorId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: userId,
      };

      // Store connector
      this.connectors.set(connectorId, connector);
      await this.saveState();

      // Set initial connection status
      this.connectionStatus.set(connectorId, ConnectionStatus.DISCONNECTED);

      // Test connection if enabled
      if (connector.enabled) {
        this.testConnection(connectorId);
      }

      return connector;
    } catch (error) {
      console.error("Error creating data connector:", error);
      throw error;
    }
  }

  /**
   * Update data connector
   */
  public async updateConnector(
    connectorId: string,
    updates: Partial<DataConnectorConfig>
  ): Promise<DataConnectorConfig> {
    try {
      const connector = this.connectors.get(connectorId);

      if (!connector) {
        throw new Error(`Connector with ID ${connectorId} not found`);
      }

      // Update connector
      const updatedConnector: DataConnectorConfig = {
        ...connector,
        ...updates,
        id: connector.id, // Ensure ID remains the same
        createdAt: connector.createdAt, // Ensure created timestamp remains the same
        createdBy: connector.createdBy, // Ensure creator remains the same
        updatedAt: Date.now(),
      };

      // Store updated connector
      this.connectors.set(connectorId, updatedConnector);
      await this.saveState();

      // Test connection if enabled and endpoint or auth changed
      if (
        updatedConnector.enabled &&
        (updates.endpoint || updates.authType || updates.credentials)
      ) {
        this.testConnection(connectorId);
      }

      return updatedConnector;
    } catch (error) {
      console.error("Error updating data connector:", error);
      throw error;
    }
  }

  /**
   * Delete data connector
   */
  public async deleteConnector(connectorId: string): Promise<boolean> {
    try {
      const connector = this.connectors.get(connectorId);

      if (!connector) {
        return false;
      }

      // Remove connector
      this.connectors.delete(connectorId);
      this.connectionStatus.delete(connectorId);

      // Remove related mappings
      const mappingsToDelete: string[] = [];

      for (const [id, mapping] of this.mappings.entries()) {
        if (mapping.sourceType === connector.sourceType) {
          mappingsToDelete.push(id);
        }
      }

      for (const id of mappingsToDelete) {
        this.mappings.delete(id);
      }

      // Save state
      await this.saveState();

      return true;
    } catch (error) {
      console.error("Error deleting data connector:", error);
      return false;
    }
  }

  /**
   * Get connectors
   */
  public async getConnectors(sourceType?: ExternalDataSourceType): Promise<DataConnectorConfig[]> {
    try {
      let connectors = Array.from(this.connectors.values());

      if (sourceType) {
        connectors = connectors.filter((connector) => connector.sourceType === sourceType);
      }

      return connectors;
    } catch (error) {
      console.error("Error getting data connectors:", error);
      return [];
    }
  }

  /**
   * Get connector by ID
   */
  public async getConnector(connectorId: string): Promise<DataConnectorConfig | null> {
    try {
      return this.connectors.get(connectorId) || null;
    } catch (error) {
      console.error("Error getting data connector:", error);
      return null;
    }
  }

  /**
   * Test connection
   */
  public async testConnection(connectorId: string): Promise<ConnectionStatus> {
    try {
      const connector = this.connectors.get(connectorId);

      if (!connector) {
        throw new Error(`Connector with ID ${connectorId} not found`);
      }

      // Check network availability
      const networkInfo = await NetInfo.fetch();

      if (!networkInfo.isConnected) {
        this.connectionStatus.set(connectorId, ConnectionStatus.DISCONNECTED);
        await this.saveState();
        return ConnectionStatus.DISCONNECTED;
      }

      // Make test request
      try {
        const request: DataRequest = {
          id: `request_${uuidv4()}`,
          connectorId: connector.id,
          requestType: "get",
          resourcePath: "",
          responseFormat: "json",
          timestamp: Date.now(),
        };

        // Execute request
        const response = await this.executeRequest(request);

        if (response.status === "success") {
          this.connectionStatus.set(connectorId, ConnectionStatus.CONNECTED);
        } else {
          // Determine error type
          if (response.statusCode === 401 || response.statusCode === 403) {
            this.connectionStatus.set(connectorId, ConnectionStatus.UNAUTHORIZED);
          } else if (response.statusCode === 429) {
            this.connectionStatus.set(connectorId, ConnectionStatus.RATE_LIMITED);
          } else if (response.statusCode === 503) {
            this.connectionStatus.set(connectorId, ConnectionStatus.MAINTENANCE);
          } else {
            this.connectionStatus.set(connectorId, ConnectionStatus.ERROR);
          }
        }
      } catch (error) {
        this.connectionStatus.set(connectorId, ConnectionStatus.ERROR);
      }

      // Save state
      await this.saveState();

      return this.connectionStatus.get(connectorId) || ConnectionStatus.DISCONNECTED;
    } catch (error) {
      console.error("Error testing connection:", error);

      this.connectionStatus.set(connectorId, ConnectionStatus.ERROR);
      await this.saveState();

      return ConnectionStatus.ERROR;
    }
  }

  /**
   * Get connection status
   */
  public getConnectionStatus(connectorId: string): ConnectionStatus {
    return this.connectionStatus.get(connectorId) || ConnectionStatus.DISCONNECTED;
  }

  /**
   * Create data mapping
   */
  public async createMapping(
    mapping: Omit<DataMapping, "id" | "createdAt" | "updatedAt">
  ): Promise<DataMapping> {
    try {
      // Generate mapping ID
      const mappingId = `mapping_${uuidv4()}`;

      // Create mapping
      const newMapping: DataMapping = {
        ...mapping,
        id: mappingId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Store mapping
      this.mappings.set(mappingId, newMapping);
      await this.saveState();

      return newMapping;
    } catch (error) {
      console.error("Error creating data mapping:", error);
      throw error;
    }
  }

  /**
   * Update data mapping
   */
  public async updateMapping(
    mappingId: string,
    updates: Partial<DataMapping>
  ): Promise<DataMapping> {
    try {
      const mapping = this.mappings.get(mappingId);

      if (!mapping) {
        throw new Error(`Mapping with ID ${mappingId} not found`);
      }

      // Update mapping
      const updatedMapping: DataMapping = {
        ...mapping,
        ...updates,
        id: mapping.id, // Ensure ID remains the same
        createdAt: mapping.createdAt, // Ensure created timestamp remains the same
        updatedAt: Date.now(),
      };

      // Store updated mapping
      this.mappings.set(mappingId, updatedMapping);
      await this.saveState();

      return updatedMapping;
    } catch (error) {
      console.error("Error updating data mapping:", error);
      throw error;
    }
  }

  /**
   * Delete data mapping
   */
  public async deleteMapping(mappingId: string): Promise<boolean> {
    try {
      const mapping = this.mappings.get(mappingId);

      if (!mapping) {
        return false;
      }

      // Remove mapping
      this.mappings.delete(mappingId);

      // Save state
      await this.saveState();

      return true;
    } catch (error) {
      console.error("Error deleting data mapping:", error);
      return false;
    }
  }

  /**
   * Get mappings
   */
  public async getMappings(
    sourceType?: ExternalDataSourceType,
    entityType?: string
  ): Promise<DataMapping[]> {
    try {
      let mappings = Array.from(this.mappings.values());

      if (sourceType) {
        mappings = mappings.filter((mapping) => mapping.sourceType === sourceType);
      }

      if (entityType) {
        mappings = mappings.filter((mapping) => mapping.entityType === entityType);
      }

      return mappings;
    } catch (error) {
      console.error("Error getting data mappings:", error);
      return [];
    }
  }

  /**
   * Create data request
   */
  public async createRequest(
    request: Omit<
      DataRequest,
      | "id"
      | "timestamp"
      | "status"
      | "result"
      | "error"
      | "responseTimestamp"
      | "responseHeaders"
      | "statusCode"
    >
  ): Promise<DataRequest> {
    try {
      // Generate request ID
      const requestId = `request_${uuidv4()}`;

      // Create request
      const newRequest: DataRequest = {
        ...request,
        id: requestId,
        timestamp: Date.now(),
        status: "pending",
      };

      // Execute request
      return this.executeRequest(newRequest);
    } catch (error) {
      console.error("Error creating data request:", error);
      throw error;
    }
  }

  /**
   * Execute data request
   */
  private async executeRequest(request: DataRequest): Promise<DataRequest> {
    try {
      const connector = this.connectors.get(request.connectorId);

      if (!connector) {
        throw new Error(`Connector with ID ${request.connectorId} not found`);
      }

      // Check if connector is enabled
      if (!connector.enabled) {
        throw new Error(`Connector with ID ${request.connectorId} is disabled`);
      }

      // Check network availability
      const networkInfo = await NetInfo.fetch();

      if (!networkInfo.isConnected) {
        if (this.options.offlineMode) {
          // Queue request for later execution
          await this.offlineQueueService.enqueue(
            OperationType.EXTERNAL_DATA_REQUEST,
            { requestId: request.id },
            2 // Medium priority
          );

          return {
            ...request,
            status: "pending",
            error: "Network unavailable, request queued for later execution",
          };
        } else {
          throw new Error("Network unavailable");
        }
      }

      // Check cache if it's a GET request
      if (request.requestType === "get" && connector.cacheResponses) {
        const cacheKey = this.getCacheKey(request);
        const cachedData = this.cache.get(cacheKey);

        if (cachedData && cachedData.expires > Date.now()) {
          console.log("Using cached data for request", request.id);

          return {
            ...request,
            status: "success",
            result: cachedData.data,
            responseTimestamp: cachedData.timestamp,
          };
        }
      }

      // Prepare URL
      let url = connector.endpoint;
      if (request.resourcePath) {
        // Make sure we don't have double slashes
        if (url.endsWith("/") && request.resourcePath.startsWith("/")) {
          url += request.resourcePath.substring(1);
        } else if (!url.endsWith("/") && !request.resourcePath.startsWith("/")) {
          url += "/" + request.resourcePath;
        } else {
          url += request.resourcePath;
        }
      }

      // Add query parameters
      const queryParams = {
        ...(connector.queryParams || {}),
        ...(request.queryParams || {}),
      };

      if (Object.keys(queryParams).length > 0) {
        const queryString = Object.entries(queryParams)
          .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
          .join("&");

        url += (url.includes("?") ? "&" : "?") + queryString;
      }

      // Prepare headers
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(connector.headers || {}),
        ...(request.headers || {}),
      };

      // Add authorization header
      if (connector.authType === "api_key" && connector.credentials?.apiKey) {
        headers["X-API-Key"] = connector.credentials.apiKey;
      } else if (
        connector.authType === "basic" &&
        connector.credentials?.username &&
        connector.credentials?.password
      ) {
        const auth = Buffer.from(
          `${connector.credentials.username}:${connector.credentials.password}`
        ).toString("base64");
        headers["Authorization"] = `Basic ${auth}`;
      } else if (connector.authType === "token" && connector.credentials?.token) {
        headers["Authorization"] = `Bearer ${connector.credentials.token}`;
      }

      // Prepare request options
      const requestOptions: RequestInit = {
        method: request.requestType.toUpperCase(),
        headers,
        body: request.body ? JSON.stringify(request.body) : undefined,
      };

      // Make request with timeout
      const timeoutPromise = new Promise<Response>((_, reject) => {
        setTimeout(
          () => reject(new Error("Request timeout")),
          connector.timeout || this.options.defaultTimeout
        );
      });

      const responsePromise = fetch(url, requestOptions);
      const response = await Promise.race([responsePromise, timeoutPromise]);

      // Get response headers
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // Get HTTP status code
      const statusCode = response.status;

      // Parse response based on format
      let result;

      if (response.ok) {
        switch (request.responseFormat) {
          case "json":
            result = await response.json();
            break;
          case "xml":
          case "text":
            result = await response.text();
            break;
          case "csv":
            const text = await response.text();
            // In a real app, we would parse CSV to JSON here
            result = text;
            break;
          case "binary":
            const buffer = await response.arrayBuffer();
            // Save binary data to a file
            const fileName = `binary_${Date.now()}.bin`;
            const filePath = `${this.DATA_DIRECTORY}${fileName}`;

            await FileSystem.writeAsStringAsync(filePath, Buffer.from(buffer).toString("base64"), {
              encoding: FileSystem.EncodingType.Base64,
            });

            result = { filePath };
            break;
        }

        // Update request with success
        const updatedRequest: DataRequest = {
          ...request,
          status: "success",
          result,
          responseTimestamp: Date.now(),
          responseHeaders,
          statusCode,
        };

        // Cache result if it's a GET request
        if (request.requestType === "get" && connector.cacheResponses) {
          this.cacheResponse(request, result);
        }

        return updatedRequest;
      } else {
        // Handle error response
        let errorMessage;

        try {
          const errorData = await response.json();
          errorMessage =
            errorData.message || errorData.error || `Request failed with status ${response.status}`;
        } catch (e) {
          errorMessage = `Request failed with status ${response.status}`;
        }

        // Update request with error
        return {
          ...request,
          status: "error",
          error: errorMessage,
          responseTimestamp: Date.now(),
          responseHeaders,
          statusCode,
        };
      }
    } catch (error) {
      console.error("Error executing data request:", error);

      // Update request with error
      return {
        ...request,
        status: "error",
        error: error.message,
        responseTimestamp: Date.now(),
      };
    }
  }

  /**
   * Get cache key for request
   */
  private getCacheKey(request: DataRequest): string {
    const { connectorId, requestType, resourcePath, queryParams } = request;

    return `${connectorId}:${requestType}:${resourcePath}:${JSON.stringify(queryParams || {})}`;
  }

  /**
   * Cache response
   */
  private cacheResponse(request: DataRequest, data: any): void {
    try {
      const connector = this.connectors.get(request.connectorId);

      if (!connector) {
        return;
      }

      const cacheKey = this.getCacheKey(request);
      const dataSize = this.estimateSize(data);

      // Check if caching this would exceed the max cache size
      if (this.cacheSize + dataSize > this.options.maxCacheSize) {
        this.cleanCache(dataSize);
      }

      // Calculate expiration
      const expires =
        Date.now() + (connector.cacheExpiration || this.options.defaultCacheExpiration);

      // Add to cache
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        expires,
        size: dataSize,
      });

      // Update cache size
      this.cacheSize += dataSize;
    } catch (error) {
      console.error("Error caching response:", error);
    }
  }

  /**
   * Clean cache
   */
  private cleanCache(neededSpace: number = 0): void {
    try {
      // If cache is empty, nothing to clean
      if (this.cache.size === 0) {
        return;
      }

      // First, remove expired items
      const now = Date.now();
      const entriesByAge: [string, { timestamp: number; size: number }][] = [];

      for (const [key, entry] of this.cache.entries()) {
        if (entry.expires <= now) {
          this.cacheSize -= entry.size;
          this.cache.delete(key);
        } else {
          entriesByAge.push([key, { timestamp: entry.timestamp, size: entry.size }]);
        }
      }

      // If still need space, remove oldest entries
      if (neededSpace > 0 && this.cacheSize + neededSpace > this.options.maxCacheSize) {
        // Sort by age (oldest first)
        entriesByAge.sort((a, b) => a[1].timestamp - b[1].timestamp);

        // Remove entries until we have enough space
        for (const [key, entry] of entriesByAge) {
          this.cacheSize -= entry.size;
          this.cache.delete(key);

          if (this.cacheSize + neededSpace <= this.options.maxCacheSize) {
            break;
          }
        }
      }
    } catch (error) {
      console.error("Error cleaning cache:", error);
    }
  }

  /**
   * Estimate size of data in bytes
   */
  private estimateSize(data: any): number {
    try {
      const json = JSON.stringify(data);
      return new TextEncoder().encode(json).length;
    } catch (error) {
      // Fallback to a rough estimate
      return JSON.stringify(data).length * 2;
    }
  }

  /**
   * Import data from external source
   */
  public async importData(
    connectorId: string,
    entityType: string,
    options: {
      queryParams?: Record<string, string>;
      resourcePath?: string;
      mapping?: string; // Mapping ID
      transform?: string; // Custom transformation function
    } = {}
  ): Promise<{ success: boolean; data: any[]; errors: string[] }> {
    try {
      const connector = this.connectors.get(connectorId);

      if (!connector) {
        throw new Error(`Connector with ID ${connectorId} not found`);
      }

      // Find mapping
      let mapping: DataMapping | undefined;

      if (options.mapping) {
        mapping = this.mappings.get(options.mapping);
      } else {
        // Find mapping by source type and entity type
        const mappings = Array.from(this.mappings.values()).filter(
          (m) => m.sourceType === connector.sourceType && m.entityType === entityType
        );

        if (mappings.length > 0) {
          mapping = mappings[0];
        }
      }

      if (!mapping) {
        throw new Error(
          `No mapping found for source type ${connector.sourceType} and entity type ${entityType}`
        );
      }

      // Create and execute request
      const request: DataRequest = {
        id: `request_${uuidv4()}`,
        connectorId,
        requestType: "get",
        resourcePath: options.resourcePath || "",
        queryParams: options.queryParams,
        responseFormat: "json",
        entityType,
        mapping: {
          fields: mapping.fields
            .filter((f) => f.direction === "import" || f.direction === "both")
            .map((f) => ({
              source: f.external,
              target: f.local,
              transform: f.transform,
            })),
        },
        timestamp: Date.now(),
      };

      const response = await this.executeRequest(request);

      if (response.status === "error") {
        return {
          success: false,
          data: [],
          errors: [response.error || "Unknown error"],
        };
      }

      // Transform the data
      let transformedData: any[] = [];
      const errors: string[] = [];

      try {
        if (Array.isArray(response.result)) {
          transformedData = this.applyMapping(
            response.result,
            mapping,
            "import",
            options.transform
          );
        } else if (typeof response.result === "object" && response.result !== null) {
          // Handle case where result is an object with a data array
          const dataArray = response.result.data ||
            response.result.results ||
            response.result.items || [response.result];

          if (Array.isArray(dataArray)) {
            transformedData = this.applyMapping(dataArray, mapping, "import", options.transform);
          } else {
            errors.push("Response data is not an array or object with data array");
          }
        } else {
          errors.push("Unexpected response format");
        }
      } catch (error) {
        console.error("Error transforming data:", error);
        errors.push(`Error transforming data: ${error.message}`);
      }

      return {
        success: errors.length === 0,
        data: transformedData,
        errors,
      };
    } catch (error) {
      console.error("Error importing data:", error);
      return {
        success: false,
        data: [],
        errors: [error.message],
      };
    }
  }

  /**
   * Export data to external source
   */
  public async exportData(
    connectorId: string,
    entityType: string,
    data: any | any[],
    options: {
      resourcePath?: string;
      mapping?: string; // Mapping ID
      transform?: string; // Custom transformation function
      requestType?: "post" | "put" | "patch";
    } = {}
  ): Promise<{ success: boolean; errors: string[] }> {
    try {
      const connector = this.connectors.get(connectorId);

      if (!connector) {
        throw new Error(`Connector with ID ${connectorId} not found`);
      }

      // Find mapping
      let mapping: DataMapping | undefined;

      if (options.mapping) {
        mapping = this.mappings.get(options.mapping);
      } else {
        // Find mapping by source type and entity type
        const mappings = Array.from(this.mappings.values()).filter(
          (m) => m.sourceType === connector.sourceType && m.entityType === entityType
        );

        if (mappings.length > 0) {
          mapping = mappings[0];
        }
      }

      if (!mapping) {
        throw new Error(
          `No mapping found for source type ${connector.sourceType} and entity type ${entityType}`
        );
      }

      // Transform the data
      let transformedData: any;

      try {
        if (Array.isArray(data)) {
          transformedData = this.applyMapping(data, mapping, "export", options.transform);
        } else {
          transformedData = this.applySingleMapping(data, mapping, "export", options.transform);
        }
      } catch (error) {
        console.error("Error transforming data for export:", error);
        return {
          success: false,
          errors: [`Error transforming data: ${error.message}`],
        };
      }

      // Create and execute request
      const request: DataRequest = {
        id: `request_${uuidv4()}`,
        connectorId,
        requestType: options.requestType || "post",
        resourcePath: options.resourcePath || "",
        responseFormat: "json",
        body: transformedData,
        entityType,
        timestamp: Date.now(),
      };

      const response = await this.executeRequest(request);

      if (response.status === "error") {
        return {
          success: false,
          errors: [response.error || "Unknown error"],
        };
      }

      return {
        success: true,
        errors: [],
      };
    } catch (error) {
      console.error("Error exporting data:", error);
      return {
        success: false,
        errors: [error.message],
      };
    }
  }

  /**
   * Apply mapping to data array
   */
  private applyMapping(
    data: any[],
    mapping: DataMapping,
    direction: "import" | "export",
    customTransform?: string
  ): any[] {
    return data.map((item) => this.applySingleMapping(item, mapping, direction, customTransform));
  }

  /**
   * Apply mapping to single data item
   */
  private applySingleMapping(
    data: any,
    mapping: DataMapping,
    direction: "import" | "export",
    customTransform?: string
  ): any {
    const result: any = {};

    // Filter fields by direction
    const fields = mapping.fields.filter(
      (f) => f.direction === direction || f.direction === "both"
    );

    // Apply mapping
    for (const field of fields) {
      if (field.ignore) continue;

      let sourcePath: string;
      let targetPath: string;

      if (direction === "import") {
        sourcePath = field.external;
        targetPath = field.local;
      } else {
        sourcePath = field.local;
        targetPath = field.external;
      }

      // Get source value
      const sourceValue = this.getNestedValue(data, sourcePath);

      // Apply field transformation if available
      let targetValue = sourceValue;

      if (field.transform) {
        try {
          const transformFn = new Function("value", "data", field.transform);
          targetValue = transformFn(sourceValue, data);
        } catch (error) {
          console.error(`Error applying field transform for ${sourcePath}:`, error);
          // Use default value or source value
          targetValue = field.defaultValue !== undefined ? field.defaultValue : sourceValue;
        }
      } else if (sourceValue === undefined && field.defaultValue !== undefined) {
        targetValue = field.defaultValue;
      }

      // Set target value
      if (targetValue !== undefined || field.required) {
        this.setNestedValue(result, targetPath, targetValue);
      }
    }

    // Apply custom transform if provided
    if (customTransform) {
      try {
        const transformFn = new Function("data", "raw", customTransform);
        return transformFn(result, data);
      } catch (error) {
        console.error("Error applying custom transform:", error);
      }
    }

    return result;
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    if (!obj || !path) return undefined;

    const keys = path.split(".");
    let current = obj;

    for (const key of keys) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[key];
    }

    return current;
  }

  /**
   * Set nested value in object using dot notation
   */
  private setNestedValue(obj: any, path: string, value: any): void {
    if (!obj || !path) return;

    const keys = path.split(".");
    const lastKey = keys.pop();

    if (!lastKey) return;

    let current = obj;

    for (const key of keys) {
      if (current[key] === undefined) {
        current[key] = {};
      }
      current = current[key];
    }

    current[lastKey] = value;
  }

  /**
   * Synchronize data between local and external source
   */
  public async synchronizeData(
    connectorId: string,
    entityType: string,
    localData: any[],
    options: {
      resourcePath?: string;
      mapping?: string;
      identityField?: string;
      resolveStrategy?: "newer" | "external" | "local" | "none";
    } = {}
  ): Promise<{
    success: boolean;
    updated: number;
    created: number;
    deleted: number;
    conflicts: number;
    errors: string[];
  }> {
    try {
      const resolveStrategy = options.resolveStrategy || this.options.autoResolveStrategy;
      const identityField = options.identityField || "id";

      // Import data from external source
      const importResult = await this.importData(connectorId, entityType, {
        resourcePath: options.resourcePath,
        mapping: options.mapping,
      });

      if (!importResult.success) {
        return {
          success: false,
          updated: 0,
          created: 0,
          deleted: 0,
          conflicts: 0,
          errors: importResult.errors,
        };
      }

      const externalData = importResult.data;
      const errors: string[] = [];
      let updated = 0;
      let created = 0;
      const deleted = 0;
      let conflicts = 0;

      // Create maps for faster lookup
      const localMap = new Map(localData.map((item) => [item[identityField], item]));
      const externalMap = new Map(externalData.map((item) => [item[identityField], item]));

      // Find items to update, create, or delete
      const toUpdate: any[] = [];
      const toCreate: any[] = [];
      const toDelete: any[] = [];
      const conflictItems: { local: any; external: any; id: string }[] = [];

      // Check local items against external
      for (const [id, localItem] of localMap.entries()) {
        const externalItem = externalMap.get(id);

        if (externalItem) {
          // Item exists in both - check for conflicts
          if (this.hasConflicts(localItem, externalItem)) {
            if (resolveStrategy === "none") {
              // Report conflict
              conflictItems.push({ local: localItem, external: externalItem, id });
              conflicts++;
            } else {
              // Resolve automatically
              const resolvedItem = this.resolveConflict(localItem, externalItem, resolveStrategy);

              toUpdate.push(resolvedItem);
            }
          } else {
            // No conflicts - keep the most recent version
            const latestItem = this.getLatestVersion(localItem, externalItem);
            toUpdate.push(latestItem);
          }

          // Remove from external map to track what's left
          externalMap.delete(id);
        } else {
          // Item only exists locally - push to external
          toCreate.push(localItem);
        }
      }

      // Remaining external items are new
      for (const [id, externalItem] of externalMap.entries()) {
        // New item from external - add locally
        localMap.set(id, externalItem);
      }

      // Export updates
      if (toUpdate.length > 0) {
        const updateResult = await this.exportData(connectorId, entityType, toUpdate, {
          resourcePath: options.resourcePath,
          mapping: options.mapping,
          requestType: "put",
        });

        if (updateResult.success) {
          updated = toUpdate.length;
        } else {
          errors.push(...updateResult.errors);
        }
      }

      // Export new items
      if (toCreate.length > 0) {
        const createResult = await this.exportData(connectorId, entityType, toCreate, {
          resourcePath: options.resourcePath,
          mapping: options.mapping,
          requestType: "post",
        });

        if (createResult.success) {
          created = toCreate.length;
        } else {
          errors.push(...createResult.errors);
        }
      }

      // Create conflicts
      for (const conflict of conflictItems) {
        const conflictId = `conflict_${uuidv4()}`;

        const newConflict: DataConflict = {
          id: conflictId,
          entityType,
          entityId: conflict.id,
          fieldPath: "*", // Whole entity conflict
          localValue: conflict.local,
          externalValue: conflict.external,
          connectorId,
          sourceType:
            this.connectors.get(connectorId)?.sourceType || ExternalDataSourceType.CUSTOM_API,
          timestamp: Date.now(),
          resolved: false,
        };

        this.conflicts.set(conflictId, newConflict);
      }

      // Save state if conflicts were created
      if (conflicts > 0) {
        await this.saveState();
      }

      return {
        success: errors.length === 0,
        updated,
        created,
        deleted,
        conflicts,
        errors,
      };
    } catch (error) {
      console.error("Error synchronizing data:", error);
      return {
        success: false,
        updated: 0,
        created: 0,
        deleted: 0,
        conflicts: 0,
        errors: [error.message],
      };
    }
  }

  /**
   * Check if two items have conflicts
   */
  private hasConflicts(local: any, external: any): boolean {
    // This is a simplified check - in a real app, we'd do a deep comparison
    // and track specific field conflicts

    // Get common keys
    const localKeys = Object.keys(local).filter((k) => k !== "updatedAt" && k !== "syncedAt");
    const externalKeys = Object.keys(external).filter((k) => k !== "updatedAt" && k !== "syncedAt");

    for (const key of localKeys) {
      if (externalKeys.includes(key) && local[key] !== external[key]) {
        return true;
      }
    }

    return false;
  }

  /**
   * Resolve conflict between local and external data
   */
  private resolveConflict(
    local: any,
    external: any,
    strategy: "newer" | "external" | "local"
  ): any {
    switch (strategy) {
      case "newer":
        return this.getLatestVersion(local, external);
      case "external":
        return external;
      case "local":
        return local;
      default:
        return local;
    }
  }

  /**
   * Get the latest version of an item
   */
  private getLatestVersion(local: any, external: any): any {
    const localTimestamp = local.updatedAt || local.timestamp || 0;
    const externalTimestamp = external.updatedAt || external.timestamp || 0;

    return externalTimestamp > localTimestamp ? external : local;
  }

  /**
   * Get conflicts
   */
  public async getConflicts(entityType?: string, resolved?: boolean): Promise<DataConflict[]> {
    try {
      let conflicts = Array.from(this.conflicts.values());

      if (entityType) {
        conflicts = conflicts.filter((c) => c.entityType === entityType);
      }

      if (resolved !== undefined) {
        conflicts = conflicts.filter((c) => c.resolved === resolved);
      }

      // Sort by timestamp, newest first
      conflicts.sort((a, b) => b.timestamp - a.timestamp);

      return conflicts;
    } catch (error) {
      console.error("Error getting conflicts:", error);
      return [];
    }
  }

  /**
   * Resolve conflict
   */
  public async resolveConflict(
    conflictId: string,
    resolution: "local" | "external" | "custom",
    customValue?: any,
    notes?: string
  ): Promise<boolean> {
    try {
      const conflict = this.conflicts.get(conflictId);

      if (!conflict) {
        return false;
      }

      // Update conflict
      conflict.resolved = true;
      conflict.resolvedAt = Date.now();
      conflict.resolution = resolution;

      if (resolution === "custom") {
        conflict.customValue = customValue;
      }

      if (notes) {
        conflict.notes = notes;
      }

      // Save state
      await this.saveState();

      return true;
    } catch (error) {
      console.error("Error resolving conflict:", error);
      return false;
    }
  }

  /**
   * Delete conflict
   */
  public async deleteConflict(conflictId: string): Promise<boolean> {
    try {
      const conflict = this.conflicts.get(conflictId);

      if (!conflict) {
        return false;
      }

      // Remove conflict
      this.conflicts.delete(conflictId);

      // Save state
      await this.saveState();

      return true;
    } catch (error) {
      console.error("Error deleting conflict:", error);
      return false;
    }
  }
}
