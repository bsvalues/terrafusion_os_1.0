import { ApolloServer } from "apollo-server-express";
import { Express } from "express";
import { generateSchema } from "./schema";
import { ExtensionPointManager } from "../plugins/extension-point";
import { ExtensionPointType, ApiExtension } from "../plugins/types";

/**
 * API Gateway
 *
 * Sets up the GraphQL API server and registers all API extensions.
 */
export class ApiGateway {
  private apolloServer: ApolloServer | null = null;

  /**
   * Initialize the API gateway
   * @param app Express application
   */
  public async initialize(app: Express): Promise<void> {
    console.log("Initializing API gateway...");

    // Create the GraphQL schema
    const schema = generateSchema();

    // Create the Apollo Server
    this.apolloServer = new ApolloServer({
      schema,
      context: ({ req }) => {
        // Here we would typically include authentication information
        return {
          user: req.user,
        };
      },
    });

    // Start the Apollo Server
    await this.apolloServer.start();

    // Apply the Apollo middleware to the Express app
    this.apolloServer.applyMiddleware({ app, path: "/graphql" });

    console.log("GraphQL API available at /graphql");

    // Register REST API endpoints
    this.registerApiExtensions(app);

    console.log("API gateway initialized");
  }

  /**
   * Register all API extensions
   * @param app Express application
   */
  private registerApiExtensions(app: Express): void {
    // Get the extension point manager
    const extensionPointManager = ExtensionPointManager.getInstance();

    // Get the API extension point
    const apiExtensionPoint = extensionPointManager.getExtensionPoint<ApiExtension>("core.api");

    if (!apiExtensionPoint) {
      console.log("No API extension point registered");
      return;
    }

    // Get all API extensions
    const apiExtensions = apiExtensionPoint.getExtensions();

    // Register each API extension
    for (const extension of apiExtensions) {
      // Apply middleware if any
      if (extension.middleware && extension.middleware.length > 0) {
        app.use(extension.basePath, ...extension.middleware);
      }

      // Register the router
      app.use(extension.basePath, extension.router);

      console.log(`Registered API extension: ${extension.id} at ${extension.basePath}`);
    }

    console.log(`Registered ${apiExtensions.length} API extensions`);
  }

  /**
   * Shutdown the API gateway
   */
  public async shutdown(): Promise<void> {
    if (this.apolloServer) {
      await this.apolloServer.stop();
      this.apolloServer = null;
    }
  }
}

/**
 * Create a new API gateway instance
 */
export function createApiGateway(): ApiGateway {
  return new ApiGateway();
}
