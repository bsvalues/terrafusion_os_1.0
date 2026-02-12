/**
 * API Catalog
 *
 * Provides a comprehensive catalog of all APIs in the system including:
 * - REST endpoints
 * - GraphQL queries and mutations
 * - WebSocket events
 * - OpenAPI specifications
 * - API versioning
 * - SDKs and client libraries
 */

import { EventEmitter } from 'events';

// API Types
export enum ApiType {
  REST = 'rest',
  GRAPHQL = 'graphql',
  WEBSOCKET = 'websocket',
  GRPC = 'grpc',
}

// API Security Scheme
export enum ApiSecurityScheme {
  API_KEY = 'apiKey',
  HTTP = 'http',
  OAUTH2 = 'oauth2',
  OPENID = 'openid',
  NONE = 'none',
}

// API Versioning Strategy
export enum ApiVersioningStrategy {
  URL_PATH = 'url_path', // e.g., /v1/resources
  QUERY_PARAM = 'query_param', // e.g., /resources?version=1
  HEADER = 'header', // e.g., X-API-Version: 1
  MEDIA_TYPE = 'media_type', // e.g., Accept: application/vnd.api+json;version=1
  NONE = 'none',
}

// API Status
export enum ApiStatus {
  ACTIVE = 'active',
  DEPRECATED = 'deprecated',
  BETA = 'beta',
  ALPHA = 'alpha',
  ARCHIVED = 'archived',
}

// API Authentication Method
export interface ApiAuthentication {
  type: ApiSecurityScheme;
  name: string;
  description: string;
  location?: 'header' | 'query' | 'cookie'; // For API Key
  scheme?: string; // For HTTP auth (e.g., 'bearer', 'basic')
  flows?: any; // For OAuth2
}

// API Parameter
export interface ApiParameter {
  name: string;
  description: string;
  required: boolean;
  type: string;
  location: 'path' | 'query' | 'header' | 'body';
  schema?: any;
  example?: any;
}

// API Response
export interface ApiResponse {
  code: string; // e.g., "200", "400", "5XX"
  description: string;
  schema?: any;
  examples?: Record<string, any>;
}

// API Endpoint (for REST APIs)
export interface ApiEndpoint {
  id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';
  summary: string;
  description: string;
  parameters: ApiParameter[];
  requestBody?: {
    description: string;
    required: boolean;
    content: Record<string, any>; // e.g., { "application/json": { schema: {...} } }
  };
  responses: Record<string, ApiResponse>;
  security?: ApiAuthentication[];
  tags?: string[];
  deprecated?: boolean;
}

// GraphQL Operation
export interface GraphQLOperation {
  id: string;
  name: string;
  type: 'query' | 'mutation' | 'subscription';
  description: string;
  arguments: ApiParameter[];
  returnType: string;
  returnTypeDescription: string;
  example: string;
}

// WebSocket Event
export interface WebSocketEvent {
  id: string;
  name: string;
  description: string;
  payloadSchema?: any;
  direction: 'client-to-server' | 'server-to-client' | 'bidirectional';
  example?: any;
}

// SDK
export interface SDK {
  id: string;
  name: string;
  language: string;
  version: string;
  repositoryUrl: string;
  documentationUrl: string;
  installationInstructions: string;
}

// API Entity
export interface ApiEntity {
  id: string;
  name: string;
  description: string;
  type: ApiType;
  basePath: string;
  version: string;
  status: ApiStatus;
  versioningStrategy: ApiVersioningStrategy;
  authentication: ApiAuthentication[];
  endpoints?: ApiEndpoint[]; // For REST APIs
  graphqlOperations?: GraphQLOperation[]; // For GraphQL APIs
  websocketEvents?: WebSocketEvent[]; // For WebSocket APIs
  sdks?: SDK[];
  tags: string[];
  owner: string;
  contactEmail?: string;
  documentationUrl?: string;
  specificationUrl?: string; // URL to OpenAPI/GraphQL spec
  createdAt: Date;
  updatedAt: Date;
}

/**
 * API Catalog Manager
 */
export class ApiCatalogManager extends EventEmitter {
  private apis: Map<string, ApiEntity> = new Map();
  private sdks: Map<string, SDK> = new Map();

  constructor() {
    super();
  }

  /**
   * Initialize the API catalog
   */
  public initialize(): void {
    this.emit('initialized');
  }

  /**
   * Register a new API
   */
  public registerApi(api: Omit<ApiEntity, 'id' | 'createdAt' | 'updatedAt'>): ApiEntity {
    const id = `api-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const newApi: ApiEntity = {
      ...api,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.apis.set(id, newApi);

    console.log(`Registered API: ${newApi.name} (${newApi.id})`);
    this.emit('api:registered', newApi);

    return newApi;
  }

  /**
   * Update an existing API
   */
  public updateApi(
    id: string,
    updates: Partial<Omit<ApiEntity, 'id' | 'createdAt' | 'updatedAt'>>
  ): ApiEntity | null {
    const api = this.apis.get(id);

    if (!api) {
      console.error(`API not found: ${id}`);
      return null;
    }

    const updatedApi: ApiEntity = {
      ...api,
      ...updates,
      updatedAt: new Date(),
    };

    this.apis.set(id, updatedApi);

    console.log(`Updated API: ${updatedApi.name} (${updatedApi.id})`);
    this.emit('api:updated', updatedApi);

    return updatedApi;
  }

  /**
   * Add an endpoint to a REST API
   */
  public addEndpoint(apiId: string, endpoint: Omit<ApiEndpoint, 'id'>): ApiEndpoint | null {
    const api = this.apis.get(apiId);

    if (!api) {
      console.error(`API not found: ${apiId}`);
      return null;
    }

    if (api.type !== ApiType.REST) {
      console.error(`API ${apiId} is not a REST API`);
      return null;
    }

    const id = `endpoint-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const newEndpoint: ApiEndpoint = {
      ...endpoint,
      id,
    };

    api.endpoints = [...(api.endpoints || []), newEndpoint];
    api.updatedAt = new Date();

    this.emit('endpoint:added', { api, endpoint: newEndpoint });

    return newEndpoint;
  }

  /**
   * Add a GraphQL operation
   */
  public addGraphQLOperation(
    apiId: string,
    operation: Omit<GraphQLOperation, 'id'>
  ): GraphQLOperation | null {
    const api = this.apis.get(apiId);

    if (!api) {
      console.error(`API not found: ${apiId}`);
      return null;
    }

    if (api.type !== ApiType.GRAPHQL) {
      console.error(`API ${apiId} is not a GraphQL API`);
      return null;
    }

    const id = `operation-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const newOperation: GraphQLOperation = {
      ...operation,
      id,
    };

    api.graphqlOperations = [...(api.graphqlOperations || []), newOperation];
    api.updatedAt = new Date();

    this.emit('graphql-operation:added', { api, operation: newOperation });

    return newOperation;
  }

  /**
   * Add a WebSocket event
   */
  public addWebSocketEvent(
    apiId: string,
    event: Omit<WebSocketEvent, 'id'>
  ): WebSocketEvent | null {
    const api = this.apis.get(apiId);

    if (!api) {
      console.error(`API not found: ${apiId}`);
      return null;
    }

    if (api.type !== ApiType.WEBSOCKET) {
      console.error(`API ${apiId} is not a WebSocket API`);
      return null;
    }

    const id = `event-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const newEvent: WebSocketEvent = {
      ...event,
      id,
    };

    api.websocketEvents = [...(api.websocketEvents || []), newEvent];
    api.updatedAt = new Date();

    this.emit('websocket-event:added', { api, event: newEvent });

    return newEvent;
  }

  /**
   * Register a new SDK
   */
  public registerSDK(sdk: Omit<SDK, 'id'>): SDK {
    const id = `sdk-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const newSDK: SDK = {
      ...sdk,
      id,
    };

    this.sdks.set(id, newSDK);

    console.log(`Registered SDK: ${newSDK.name} (${newSDK.id})`);
    this.emit('sdk:registered', newSDK);

    return newSDK;
  }

  /**
   * Link an SDK to an API
   */
  public linkSDKToApi(sdkId: string, apiId: string): boolean {
    const sdk = this.sdks.get(sdkId);
    const api = this.apis.get(apiId);

    if (!sdk) {
      console.error(`SDK not found: ${sdkId}`);
      return false;
    }

    if (!api) {
      console.error(`API not found: ${apiId}`);
      return false;
    }

    api.sdks = [...(api.sdks || []), sdk];
    api.updatedAt = new Date();

    this.emit('sdk:linked', { api, sdk });

    return true;
  }

  /**
   * Get an API by ID
   */
  public getApi(id: string): ApiEntity | undefined {
    return this.apis.get(id);
  }

  /**
   * Get all APIs
   */
  public getAllApis(): ApiEntity[] {
    return Array.from(this.apis.values());
  }

  /**
   * Get APIs by type
   */
  public getApisByType(type: ApiType): ApiEntity[] {
    return this.getAllApis().filter(api => api.type === type);
  }

  /**
   * Get APIs by status
   */
  public getApisByStatus(status: ApiStatus): ApiEntity[] {
    return this.getAllApis().filter(api => api.status === status);
  }

  /**
   * Get APIs by tag
   */
  public getApisByTag(tag: string): ApiEntity[] {
    return this.getAllApis().filter(api => api.tags.includes(tag));
  }

  /**
   * Get APIs by owner
   */
  public getApisByOwner(owner: string): ApiEntity[] {
    return this.getAllApis().filter(api => api.owner === owner);
  }

  /**
   * Get an SDK by ID
   */
  public getSDK(id: string): SDK | undefined {
    return this.sdks.get(id);
  }

  /**
   * Get all SDKs
   */
  public getAllSDKs(): SDK[] {
    return Array.from(this.sdks.values());
  }

  /**
   * Get SDKs by language
   */
  public getSDKsByLanguage(language: string): SDK[] {
    return this.getAllSDKs().filter(sdk => sdk.language === language);
  }

  /**
   * Search APIs
   */
  public searchApis(query: string): ApiEntity[] {
    query = query.toLowerCase();

    return this.getAllApis().filter(api => {
      return (
        api.name.toLowerCase().includes(query) ||
        api.description.toLowerCase().includes(query) ||
        api.basePath.toLowerCase().includes(query) ||
        api.tags.some(tag => tag.toLowerCase().includes(query))
      );
    });
  }

  /**
   * Generate OpenAPI specification for a REST API
   */
  public generateOpenAPISpec(apiId: string): any {
    const api = this.apis.get(apiId);

    if (!api) {
      console.error(`API not found: ${apiId}`);
      return null;
    }

    if (api.type !== ApiType.REST) {
      console.error(`API ${apiId} is not a REST API`);
      return null;
    }

    // Generate OpenAPI spec
    const spec = {
      openapi: '3.0.0',
      info: {
        title: api.name,
        description: api.description,
        version: api.version,
        contact: api.contactEmail
          ? {
              email: api.contactEmail,
            }
          : undefined,
      },
      servers: [
        {
          url: api.basePath,
          description: `${api.name} API`,
        },
      ],
      paths: {},
      components: {
        securitySchemes: {},
      },
    };

    // Add security schemes
    if (api.authentication && api.authentication.length > 0) {
      for (const auth of api.authentication) {
        if (auth.type === ApiSecurityScheme.API_KEY) {
          spec.components.securitySchemes[auth.name] = {
            type: 'apiKey',
            name: auth.name,
            in: auth.location || 'header',
            description: auth.description,
          };
        } else if (auth.type === ApiSecurityScheme.HTTP) {
          spec.components.securitySchemes[auth.name] = {
            type: 'http',
            scheme: auth.scheme || 'bearer',
            description: auth.description,
          };
        } else if (auth.type === ApiSecurityScheme.OAUTH2) {
          spec.components.securitySchemes[auth.name] = {
            type: 'oauth2',
            flows: auth.flows,
            description: auth.description,
          };
        }
      }
    }

    // Add paths
    if (api.endpoints && api.endpoints.length > 0) {
      for (const endpoint of api.endpoints) {
        if (!spec.paths[endpoint.path]) {
          spec.paths[endpoint.path] = {};
        }

        spec.paths[endpoint.path][endpoint.method.toLowerCase()] = {
          summary: endpoint.summary,
          description: endpoint.description,
          tags: endpoint.tags,
          deprecated: endpoint.deprecated,
          parameters: endpoint.parameters.map(param => ({
            name: param.name,
            in: param.location,
            description: param.description,
            required: param.required,
            schema: param.schema,
          })),
          requestBody: endpoint.requestBody,
          responses: Object.entries(endpoint.responses).reduce((acc, [code, response]) => {
            acc[code] = {
              description: response.description,
              content: response.schema
                ? {
                    'application/json': {
                      schema: response.schema,
                    },
                  }
                : undefined,
              examples: response.examples,
            };
            return acc;
          }, {}),
          security: endpoint.security
            ? endpoint.security.map(auth => ({ [auth.name]: [] }))
            : undefined,
        };
      }
    }

    this.emit('openapi:generated', { api, spec });

    return spec;
  }

  /**
   * Generate API documentation
   */
  public generateApiDocumentation(apiId: string): any {
    const api = this.apis.get(apiId);

    if (!api) {
      console.error(`API not found: ${apiId}`);
      return null;
    }

    // Generate documentation structure
    const documentation = {
      id: apiId,
      name: api.name,
      description: api.description,
      type: api.type,
      version: api.version,
      status: api.status,
      basePath: api.basePath,
      authentication: api.authentication.map(auth => ({
        type: auth.type,
        name: auth.name,
        description: auth.description,
        details: this.getAuthDetails(auth),
      })),
      sections: [],
    };

    // Add appropriate sections based on API type
    if (api.type === ApiType.REST && api.endpoints) {
      documentation.sections.push({
        title: 'Endpoints',
        content: api.endpoints.map(endpoint => ({
          title: `${endpoint.method} ${endpoint.path}`,
          description: endpoint.description,
          parameters: endpoint.parameters,
          requestBody: endpoint.requestBody,
          responses: endpoint.responses,
          examples: this.generateEndpointExamples(endpoint),
        })),
      });
    } else if (api.type === ApiType.GRAPHQL && api.graphqlOperations) {
      documentation.sections.push({
        title: 'Operations',
        content: api.graphqlOperations.map(op => ({
          title: `${op.type} ${op.name}`,
          description: op.description,
          arguments: op.arguments,
          returnType: op.returnType,
          returnTypeDescription: op.returnTypeDescription,
          example: op.example,
        })),
      });
    } else if (api.type === ApiType.WEBSOCKET && api.websocketEvents) {
      documentation.sections.push({
        title: 'Events',
        content: api.websocketEvents.map(event => ({
          title: event.name,
          description: event.description,
          direction: event.direction,
          payload: event.payloadSchema,
          example: event.example,
        })),
      });
    }

    // Add SDK section if available
    if (api.sdks && api.sdks.length > 0) {
      documentation.sections.push({
        title: 'SDKs',
        content: api.sdks.map(sdk => ({
          name: sdk.name,
          language: sdk.language,
          version: sdk.version,
          installation: sdk.installationInstructions,
          repository: sdk.repositoryUrl,
          documentation: sdk.documentationUrl,
        })),
      });
    }

    this.emit('documentation:generated', { api, documentation });

    return documentation;
  }

  /**
   * Get authentication details for documentation
   */
  private getAuthDetails(auth: ApiAuthentication): string {
    if (auth.type === ApiSecurityScheme.API_KEY) {
      return `API Key: Send the key in the ${auth.location || 'header'} named '${auth.name}'`;
    } else if (auth.type === ApiSecurityScheme.HTTP) {
      if (auth.scheme === 'bearer') {
        return `Bearer Token: Send the token in the Authorization header as 'Bearer {token}'`;
      } else if (auth.scheme === 'basic') {
        return `Basic Auth: Send credentials as base64 encoded 'username:password' in the Authorization header`;
      }
    } else if (auth.type === ApiSecurityScheme.OAUTH2) {
      return `OAuth 2.0: Use the appropriate OAuth 2.0 flow to obtain an access token`;
    } else if (auth.type === ApiSecurityScheme.OPENID) {
      return `OpenID Connect: Use OpenID Connect for authentication`;
    }

    return 'No authentication required';
  }

  /**
   * Generate examples for an endpoint
   */
  private generateEndpointExamples(endpoint: ApiEndpoint): any {
    // Generate curl example
    let curlExample = `curl -X ${endpoint.method} "${endpoint.path}"`;

    // Add headers
    const headerParams = endpoint.parameters.filter(p => p.location === 'header');
    for (const param of headerParams) {
      curlExample += ` -H "${param.name}: ${param.example || 'value'}"`;
    }

    // Add query parameters
    const queryParams = endpoint.parameters.filter(p => p.location === 'query');
    if (queryParams.length > 0) {
      curlExample += ` -G`;
      for (const param of queryParams) {
        curlExample += ` --data-urlencode "${param.name}=${param.example || 'value'}"`;
      }
    }

    // Add request body
    if (endpoint.requestBody && endpoint.requestBody.required) {
      curlExample += ` -d '${JSON.stringify({ example: 'data' }, null, 2)}'`;
    }

    return {
      curl: curlExample,
      responses: Object.entries(endpoint.responses).reduce((acc, [code, response]) => {
        acc[code] = response.examples || {
          'application/json': {
            example: 'response data',
          },
        };
        return acc;
      }, {}),
    };
  }
}

/**
 * Create a new API catalog manager
 */
export function createApiCatalogManager(): ApiCatalogManager {
  return new ApiCatalogManager();
}
