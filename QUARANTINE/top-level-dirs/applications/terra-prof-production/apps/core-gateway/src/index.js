/**
 * Terrafusion Core Gateway with Apollo Federation
 * 
 * This gateway orchestrates all the GraphQL subgraphs from different services
 * and provides a unified GraphQL API.
 */

import { ApolloGateway, RemoteGraphQLDataSource, IntrospectAndCompose } from '@apollo/gateway';
import { ApolloServer } from 'apollo-server';
import http from 'http';

// Custom data source that forwards the authentication token
class AuthDataSource extends RemoteGraphQLDataSource {
  willSendRequest({ request, context }) {
    // If we have a token in the context, add it to the headers
    if (context.token) {
      request.http.headers.set('authorization', context.token);
    }
  }

  // Override the didReceiveError method to handle 404s and other errors
  async didReceiveError({ response, context, request }) {
    console.warn(`Error from service: ${request.http.url.toString()}, status: ${response?.status}`);
    return super.didReceiveError({ response, context, request });
  }
}

// For this demonstration, we'll create a simple schema for the gateway
// since we don't have actual subgraphs running yet
const typeDefs = `
  type Query {
    serviceInfo: ServiceInfo
    healthCheck: HealthStatus
  }
  
  type ServiceInfo {
    name: String
    version: String
    services: [Service]
  }
  
  type Service {
    name: String
    url: String
    status: String
  }
  
  type HealthStatus {
    status: String
    timestamp: String
  }
`;

const resolvers = {
  Query: {
    serviceInfo: () => ({
      name: 'TerraFusionPro Gateway',
      version: '1.0.0',
      services: apps.map(app => ({ 
        name: app.name, 
        url: app.url,
        status: 'pending' 
      }))
    }),
    healthCheck: () => ({
      status: 'healthy',
      timestamp: new Date().toISOString()
    })
  }
};

// List of all integrated apps with their GraphQL endpoints
const externalApps = [
  { name: 'terrafusionsync', url: 'http://localhost:3001/graphql' },
  { name: 'terrafusionpro', url: 'http://localhost:3002/graphql' },
  { name: 'terraflow', url: 'http://localhost:3003/graphql' },
  { name: 'terraminer', url: 'http://localhost:3004/graphql' },
  { name: 'terraagent', url: 'http://localhost:3005/graphql' },
  { name: 'terraf', url: 'http://localhost:3006/graphql' },
  { name: 'terralegislativepulsepub', url: 'http://localhost:3007/graphql' },
  { name: 'bcbscostapp', url: 'http://localhost:3008/graphql' },
  { name: 'bcbsgeoassessmentpro', url: 'http://localhost:3009/graphql' },
  { name: 'bcbslevy', url: 'http://localhost:3010/graphql' },
  { name: 'bcbswebhub', url: 'http://localhost:3011/graphql' },
  { name: 'bcbsdataengine', url: 'http://localhost:3012/graphql' },
  { name: 'bcbspacsmapping', url: 'http://localhost:3013/graphql' },
  { name: 'geoassessmentpro', url: 'http://localhost:3014/graphql' },
  { name: 'bsbcmaster', url: 'http://localhost:3015/graphql' },
  { name: 'bsincomevaluation', url: 'http://localhost:3016/graphql' },
  { name: 'terrafusionmockup', url: 'http://localhost:3017/graphql' }
];

// List of existing Terrafusion services with their current port configuration
const existingServices = [
  { name: 'user-service', url: 'http://0.0.0.0:5004/graphql' },
  { name: 'property-service', url: 'http://0.0.0.0:5003/graphql' },
  { name: 'form-service', url: 'http://0.0.0.0:5005/graphql' },
  { name: 'analysis-service', url: 'http://0.0.0.0:5006/graphql' },
  { name: 'report-service', url: 'http://0.0.0.0:5007/graphql' }
];

// Combine all apps
const apps = [...externalApps, ...existingServices];

// Function to check if a service is available
const checkServiceAvailability = async (url) => {
  // Extract hostname and port from the URL
  const serviceUrl = new URL(url);
  
  // First check if GraphQL endpoint exists
  const graphqlAvailable = await checkEndpoint(serviceUrl, '/graphql');
  if (graphqlAvailable) {
    return true;
  }
  
  // Fall back to health check if GraphQL endpoint doesn't exist
  return await checkEndpoint(serviceUrl, '/health');
};

// Helper function to check a specific endpoint
const checkEndpoint = (serviceUrl, path) => {
  return new Promise((resolve) => {
    const req = http.request(
      {
        hostname: serviceUrl.hostname,
        port: serviceUrl.port,
        path: path,
        method: 'GET',
        timeout: 2000, // Increased timeout for more reliability
      },
      (res) => {
        if (res.statusCode === 200) {
          resolve(true);
        } else {
          console.log(`Service at ${serviceUrl.hostname}:${serviceUrl.port}${path} returned status: ${res.statusCode}`);
          resolve(false);
        }
      }
    );
    req.on('error', (error) => {
      console.log(`Error checking ${serviceUrl.hostname}:${serviceUrl.port}${path}: ${error.message}`);
      resolve(false);
    });
    req.on('timeout', () => {
      console.log(`Timeout checking ${serviceUrl.hostname}:${serviceUrl.port}${path}`);
      req.destroy();
      resolve(false);
    });
    req.end();
  });
};

// For now, we're using a mock schema for demonstration since our services don't have 
// actual GraphQL endpoints exposed
const generateMockSchemaForService = (serviceName) => {
  // Generate a basic schema for each service
  return `
    extend type Query {
      ${serviceName}Info: ServiceInfo
      ${serviceName}Health: HealthStatus
    }
    
    type ServiceInfo {
      name: String
      version: String
    }
    
    type HealthStatus {
      status: String
      timestamp: String
    }
  `;
};

// Start with our own schema until federation is ready
let gateway = null;
let server = null;

// Check which services are available and create the gateway
const setupGateway = async () => {
  try {
    console.log('Checking service availability...');
    const availabilityPromises = apps.map(async (app) => {
      const isAvailable = await checkServiceAvailability(app.url.replace('/graphql', ''));
      return { ...app, isAvailable };
    });
    
    const availabilityResults = await Promise.all(availabilityPromises);
    const availableServices = availabilityResults.filter(service => service.isAvailable);
    const availableCount = availableServices.length;
    
    console.log(`Found ${availableCount} available services out of ${apps.length}`);
    
    // Try to use Apollo Federation if core services are available
    const coreServices = ['user-service', 'property-service', 'form-service', 'analysis-service', 'report-service'];
    const availableCoreServices = availableServices.filter(service => coreServices.includes(service.name));
    
    if (availableCoreServices.length >= 5) {
      console.log('All core services are available. Setting up Apollo Federation Gateway.');
      
      try {
        gateway = new ApolloGateway({
          serviceList: availableCoreServices.map(service => ({
            name: service.name,
            url: service.url
          })),
          buildService: ({ name, url }) => {
            console.log(`Building service for ${name} at ${url}`);
            return new AuthDataSource({ url });
          },
          introspectionCache: 'persist',
          experimental_didValidateSupergraphSdl: (superGraphSdl) => {
            console.log('Validated supergraph SDL successfully');
          }
        });
        
        server = new ApolloServer({
          gateway,
          context: ({ req }) => {
            // Get the token from the Authorization header
            const token = req.headers.authorization || '';
            return { token };
          },
          subscriptions: false,
          playground: true,
          introspection: true
        });
        
        await server.listen({ port: 4000 });
        console.log('🚀 Apollo Gateway ready at http://localhost:4000/');
        // Start a simple health check HTTP server on port 4001
        const healthServer = http.createServer((req, res) => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }));
        });
        healthServer.listen(4001, () => {
          console.log('Health check server running on port 4001');
        });
        return;
      } catch (error) {
        console.error('Failed to start Apollo Federation Gateway:', error);
        console.log('Falling back to local schema implementation');
      }
    }
    
    // Fallback to local schema implementation
    console.log('Using local schema for demonstration');
    
    // Enhanced typeDefs to include information about available services
    const enhancedTypeDefs = `
      type Query {
        serviceInfo: ServiceInfo
        healthCheck: HealthStatus
        availableServices: [Service]
      }
      
      type ServiceInfo {
        name: String
        version: String
        services: [Service]
      }
      
      type Service {
        name: String
        url: String
        status: String
        available: Boolean
      }
      
      type HealthStatus {
        status: String
        timestamp: String
      }
    `;
    
    // Enhanced resolvers to provide information about available services
    const enhancedResolvers = {
      Query: {
        serviceInfo: () => ({
          name: 'TerraFusionPro Gateway',
          version: '1.0.0',
          services: apps.map(app => ({ 
            name: app.name, 
            url: app.url,
            status: 'pending' 
          }))
        }),
        healthCheck: () => ({
          status: 'healthy',
          timestamp: new Date().toISOString()
        }),
        availableServices: () => availabilityResults.map(service => ({
          name: service.name,
          url: service.url,
          status: service.isAvailable ? 'up' : 'down',
          available: service.isAvailable
        }))
      }
    };
    
    // Create standalone server with our enhanced schema
    server = new ApolloServer({
      typeDefs: enhancedTypeDefs,
      resolvers: enhancedResolvers,
      context: ({ req }) => {
        const token = req.headers.authorization || '';
        return { token };
      }
    });
    
    return server;
  } catch (error) {
    console.error('Error setting up gateway:', error);
    // Fallback to local schema on error
    return new ApolloServer({
      typeDefs,
      resolvers,
      context: ({ req }) => {
        const token = req.headers.authorization || '';
        return { token };
      }
    });
  }
};

// The port for the gateway
const PORT = process.env.PORT || 4000;

// Main function to start the server
const startServer = async () => {
  try {
    // Set up the gateway based on available services
    const apolloServer = await setupGateway();
    
    // Try various ports to avoid conflicts
    let apolloServerStarted = false;
    for (const port of [4000, 4002, 4004, 4006]) {
      try {
        const { url } = await apolloServer.listen({ port });
        console.log(`🚀 Apollo Gateway ready at ${url}`);
        apolloServerStarted = true;
        break;
      } catch (portError) {
        console.error(`Port ${port} conflict:`, portError.message);
      }
    }
    
    if (!apolloServerStarted) {
      console.error('Failed to start Apollo server on any port');
    }
    
    // Try various ports for health check server
    let healthServerStarted = false;
    for (const healthPort of [4001, 4003, 4005, 4007]) {
      try {
        const healthServer = http.createServer((req, res) => {
          if (req.url === '/health') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              status: 'healthy',
              service: 'apollo-federation-gateway',
              timestamp: new Date().toISOString()
            }));
          } else {
            res.writeHead(404);
            res.end();
          }
        });
        
        await new Promise((resolve, reject) => {
          healthServer.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
              console.log(`Health port ${healthPort} in use, trying next...`);
              healthServer.close();
              resolve(false);
            } else {
              reject(err);
            }
          });
          
          healthServer.listen(healthPort, () => {
            console.log(`Health check server running on port ${healthPort}`);
            resolve(true);
          });
        });
        
        healthServerStarted = true;
        break;
      } catch (err) {
        console.error(`Failed to start health server on port ${healthPort}:`, err.message);
      }
    }
    
    if (!healthServerStarted) {
      console.error('Failed to start health check server on any port');
    }
    
    return apolloServer;
  } catch (error) {
    console.error('Failed to start Apollo Gateway:', error);
    process.exit(1);
  }
};

// Start the server
startServer().catch(error => {
  console.error('Unhandled error during server startup:', error);
  process.exit(1);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down Apollo Gateway...');
  if (server) {
    server.stop();
  }
  process.exit(0);
});