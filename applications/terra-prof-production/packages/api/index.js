/**
 * TerraFusionPro API Gateway
 * 
 * This is a simple API Gateway using Node.js http module.
 * It routes requests to core services and integrated apps.
 */

import http from 'http';
import url from 'url';

// Core Service URLs with default localhost fallbacks
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:5004';
const PROPERTY_SERVICE_URL = process.env.PROPERTY_SERVICE_URL || 'http://localhost:5003';
const FORM_SERVICE_URL = process.env.FORM_SERVICE_URL || 'http://localhost:5005';
const ANALYSIS_SERVICE_URL = process.env.ANALYSIS_SERVICE_URL || 'http://localhost:5006';
const REPORT_SERVICE_URL = process.env.REPORT_SERVICE_URL || 'http://localhost:5007';

// Integrated App Service URLs - Read from environment with defaults
// Based on provided app list with default port assignments
const TERRAFUSIONSYNC_URL = process.env.TERRAFUSIONSYNC_URL || 'http://localhost:3001';
const TERRAFUSIONPRO_URL = process.env.TERRAFUSIONPRO_URL || 'http://localhost:3002';
const TERRAFLOW_URL = process.env.TERRAFLOW_URL || 'http://localhost:3003';
const TERRAMINER_URL = process.env.TERRAMINER_URL || 'http://localhost:3004';
const TERRAAGENT_URL = process.env.TERRAAGENT_URL || 'http://localhost:3005';
const TERRAF_URL = process.env.TERRAF_URL || 'http://localhost:3006';
const TERRALEGISLATIVEPULSEPUB_URL = process.env.TERRALEGISLATIVEPULSEPUB_URL || 'http://localhost:3007';
const BCBSCOSTAPP_URL = process.env.BCBSCOSTAPP_URL || 'http://localhost:3008';
const BCBSGEOASSESSMENTPRO_URL = process.env.BCBSGEOASSESSMENTPRO_URL || 'http://localhost:3009';
const BCBSLEVY_URL = process.env.BCBSLEVY_URL || 'http://localhost:3010';
const BCBSWEBHUB_URL = process.env.BCBSWEBHUB_URL || 'http://localhost:3011';
const BCBSDATAENGINE_URL = process.env.BCBSDATAENGINE_URL || 'http://localhost:3012';
const BCBSPACSMAPPING_URL = process.env.BCBSPACSMAPPING_URL || 'http://localhost:3013';
const GEOASSESSMENTPRO_URL = process.env.GEOASSESSMENTPRO_URL || 'http://localhost:3014';
const BSBCMASTER_URL = process.env.BSBCMASTER_URL || 'http://localhost:3015';
const BSINCOMEVALUATION_URL = process.env.BSINCOMEVALUATION_URL || 'http://localhost:3016';
const TERRAFUSIONMOCKUP_URL = process.env.TERRAFUSIONMOCKUP_URL || 'http://localhost:3017';

const PORT = process.env.API_GATEWAY_PORT || 5002;

// Create server
const server = http.createServer((req, res) => {
  // Parse the request URL
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  
  // Log request
  console.log(`${req.method} ${path}`);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }
  
  // Health check endpoint
  if (path === '/api/health') {
    const response = {
      status: 'healthy',
      service: 'api-gateway',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      services: {
        core: [
          { name: 'user-service', url: USER_SERVICE_URL },
          { name: 'property-service', url: PROPERTY_SERVICE_URL },
          { name: 'form-service', url: FORM_SERVICE_URL },
          { name: 'analysis-service', url: ANALYSIS_SERVICE_URL },
          { name: 'report-service', url: REPORT_SERVICE_URL }
        ],
        integrated: [
          { name: 'terrafusionsync', url: TERRAFUSIONSYNC_URL },
          { name: 'terrafusionpro', url: TERRAFUSIONPRO_URL },
          { name: 'terraflow', url: TERRAFLOW_URL },
          { name: 'terraminer', url: TERRAMINER_URL },
          { name: 'terraagent', url: TERRAAGENT_URL },
          { name: 'terraf', url: TERRAF_URL },
          { name: 'terralegislativepulsepub', url: TERRALEGISLATIVEPULSEPUB_URL },
          { name: 'bcbscostapp', url: BCBSCOSTAPP_URL },
          { name: 'bcbsgeoassessmentpro', url: BCBSGEOASSESSMENTPRO_URL },
          { name: 'bcbslevy', url: BCBSLEVY_URL },
          { name: 'bcbswebhub', url: BCBSWEBHUB_URL },
          { name: 'bcbsdataengine', url: BCBSDATAENGINE_URL },
          { name: 'bcbspacsmapping', url: BCBSPACSMAPPING_URL },
          { name: 'geoassessmentpro', url: GEOASSESSMENTPRO_URL },
          { name: 'bsbcmaster', url: BSBCMASTER_URL },
          { name: 'bsincomevaluation', url: BSINCOMEVALUATION_URL },
          { name: 'terrafusionmockup', url: TERRAFUSIONMOCKUP_URL }
        ]
      }
    };
    
    console.log('Health check response:', JSON.stringify(response));
    
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(response));
    return;
  }
  
  // API Version endpoint
  if (path === '/api/version') {
    const response = {
      version: '1.0.0',
      apiVersion: 'v1',
      name: 'TerraFusionPro API Gateway',
      timestamp: new Date().toISOString()
    };
    
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(response));
    return;
  }
  
  // Route requests to appropriate services
  let targetUrl = null;
  
  // Auth routes (handled by User Service)
  if (path.startsWith('/api/auth')) {
    if (path === '/api/auth/login') {
      targetUrl = USER_SERVICE_URL + '/login';
    }
    else if (path === '/api/auth/register') {
      targetUrl = USER_SERVICE_URL + '/register';
    }
    else if (path === '/api/auth/me') {
      targetUrl = USER_SERVICE_URL + '/me';
    }
    else if (path === '/api/auth/change-password') {
      targetUrl = USER_SERVICE_URL + '/change-password';
    }
    else if (path === '/api/auth/logout') {
      targetUrl = USER_SERVICE_URL + '/logout';
    }
    else if (path === '/api/auth/refresh-token') {
      targetUrl = USER_SERVICE_URL + '/refresh-token';
    }
    else {
      // If no specific auth endpoint matched, forward to the user service
      targetUrl = USER_SERVICE_URL + path.replace('/api/auth', '/auth');
    }
  }
  // User service routes
  else if (path.startsWith('/api/users')) {
    targetUrl = USER_SERVICE_URL + path.replace('/api/users', '/users');
  }
  // Property service routes
  else if (path.startsWith('/api/properties')) {
    targetUrl = PROPERTY_SERVICE_URL + path.replace('/api/properties', '/properties');
  }
  // Form service routes
  else if (path.startsWith('/api/forms')) {
    targetUrl = FORM_SERVICE_URL + path.replace('/api/forms', '/forms');
  }
  // Analysis service routes
  else if (path.startsWith('/api/analysis')) {
    targetUrl = ANALYSIS_SERVICE_URL + path.replace('/api/analysis', '/analysis');
  }
  // Report service routes
  else if (path.startsWith('/api/reports')) {
    targetUrl = REPORT_SERVICE_URL + path.replace('/api/reports', '/reports');
  }
  // Generic properties endpoint (just returns all properties)
  else if (path === '/api/properties') {
    targetUrl = PROPERTY_SERVICE_URL + '/properties';
  }
  // Generic reports endpoint (just returns all reports)
  else if (path === '/api/reports') {
    targetUrl = REPORT_SERVICE_URL + '/reports';
  }
  
  // GraphQL service endpoints
  else if (path === '/api/graphql/user') {
    // Handle GraphQL requests to the User Service
    return proxyGraphQLRequest(req, res, 'user');
  }
  else if (path === '/api/graphql/property') {
    // Handle GraphQL requests to the Property Service
    return proxyGraphQLRequest(req, res, 'property');
  }
  else if (path === '/api/graphql/form') {
    // Handle GraphQL requests to the Form Service
    return proxyGraphQLRequest(req, res, 'form');
  }
  else if (path === '/api/graphql/analysis') {
    // Handle GraphQL requests to the Analysis Service
    return proxyGraphQLRequest(req, res, 'analysis');
  }
  else if (path === '/api/graphql/report') {
    // Handle GraphQL requests to the Report Service
    return proxyGraphQLRequest(req, res, 'report');
  }
  
  // Integrated app routes - These routes allow access to the newly imported apps
  
  // TerraFusionSync routes
  else if (path.startsWith('/api/terrafusionsync')) {
    targetUrl = TERRAFUSIONSYNC_URL + path.replace('/api/terrafusionsync', '');
  }
  // TerraFusionPro routes
  else if (path.startsWith('/api/terrafusionpro')) {
    targetUrl = TERRAFUSIONPRO_URL + path.replace('/api/terrafusionpro', '');
  }
  // TerraFlow routes
  else if (path.startsWith('/api/terraflow')) {
    targetUrl = TERRAFLOW_URL + path.replace('/api/terraflow', '');
  }
  // TerraMiner routes
  else if (path.startsWith('/api/terraminer')) {
    targetUrl = TERRAMINER_URL + path.replace('/api/terraminer', '');
  }
  // TerraAgent routes
  else if (path.startsWith('/api/terraagent')) {
    targetUrl = TERRAAGENT_URL + path.replace('/api/terraagent', '');
  }
  // TerraF routes
  else if (path.startsWith('/api/terraf')) {
    targetUrl = TERRAF_URL + path.replace('/api/terraf', '');
  }
  // TerraLegislativePulsePub routes
  else if (path.startsWith('/api/terralegislativepulsepub')) {
    targetUrl = TERRALEGISLATIVEPULSEPUB_URL + path.replace('/api/terralegislativepulsepub', '');
  }
  // BCBSCostApp routes
  else if (path.startsWith('/api/bcbscostapp')) {
    targetUrl = BCBSCOSTAPP_URL + path.replace('/api/bcbscostapp', '');
  }
  // BCBSGeoAssessmentPro routes
  else if (path.startsWith('/api/bcbsgeoassessmentpro')) {
    targetUrl = BCBSGEOASSESSMENTPRO_URL + path.replace('/api/bcbsgeoassessmentpro', '');
  }
  // BCBSLevy routes
  else if (path.startsWith('/api/bcbslevy')) {
    targetUrl = BCBSLEVY_URL + path.replace('/api/bcbslevy', '');
  }
  // BCBSWebHub routes
  else if (path.startsWith('/api/bcbswebhub')) {
    targetUrl = BCBSWEBHUB_URL + path.replace('/api/bcbswebhub', '');
  }
  // BCBSDataEngine routes
  else if (path.startsWith('/api/bcbsdataengine')) {
    targetUrl = BCBSDATAENGINE_URL + path.replace('/api/bcbsdataengine', '');
  }
  // BCBSPacsMapping routes
  else if (path.startsWith('/api/bcbspacsmapping')) {
    targetUrl = BCBSPACSMAPPING_URL + path.replace('/api/bcbspacsmapping', '');
  }
  // GeoAssessmentPro routes
  else if (path.startsWith('/api/geoassessmentpro')) {
    targetUrl = GEOASSESSMENTPRO_URL + path.replace('/api/geoassessmentpro', '');
  }
  // BSBCMaster routes
  else if (path.startsWith('/api/bsbcmaster')) {
    targetUrl = BSBCMASTER_URL + path.replace('/api/bsbcmaster', '');
  }
  // BSIncomeValuation routes
  else if (path.startsWith('/api/bsincomevaluation')) {
    targetUrl = BSINCOMEVALUATION_URL + path.replace('/api/bsincomevaluation', '');
  }
  // TerraFusionMockUp routes
  else if (path.startsWith('/api/terrafusionmockup')) {
    targetUrl = TERRAFUSIONMOCKUP_URL + path.replace('/api/terrafusionmockup', '');
  }
  
  // If a route match was found, proxy the request
  if (targetUrl) {
    proxyRequest(req, res, targetUrl, parsedUrl.search || '');
  } else {
    // Handle 404 for unmatched routes
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      error: 'Not Found',
      message: `Path ${path} does not exist on this server`,
      timestamp: new Date().toISOString()
    }));
  }
});

// Function to proxy requests to the target service
function proxyRequest(req, res, targetUrl, queryString = '') {
  // Parse the target URL
  const target = new URL(targetUrl + queryString);
  
  console.log(`Proxying to: ${target.href}`);
  
  // Options for the proxied request
  const options = {
    hostname: target.hostname,
    port: target.port,
    path: target.pathname + target.search,
    method: req.method,
    headers: {
      ...req.headers,
      host: target.host,
    }
  };
  
  // Create the proxied request
  const proxyReq = http.request(options, (proxyRes) => {
    // Forward the status code
    res.statusCode = proxyRes.statusCode;
    
    // Forward the headers
    Object.keys(proxyRes.headers).forEach(key => {
      res.setHeader(key, proxyRes.headers[key]);
    });
    
    // Forward the response data
    proxyRes.on('data', (chunk) => {
      res.write(chunk);
    });
    
    proxyRes.on('end', () => {
      res.end();
    });
  });
  
  // Handle errors in the proxied request
  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err);
    
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      error: 'Bad Gateway',
      message: 'The requested service is unavailable',
      timestamp: new Date().toISOString()
    }));
  });
  
  // Forward the request body if present
  req.on('data', (chunk) => {
    proxyReq.write(chunk);
  });
  
  req.on('end', () => {
    proxyReq.end();
  });
}

// Helper function to proxy GraphQL requests to the appropriate service
function proxyGraphQLRequest(req, res, serviceName) {
  let targetUrl = '';
  
  // Determine the target service URL based on service name
  switch (serviceName) {
    case 'user':
      targetUrl = USER_SERVICE_URL + '/graphql';
      break;
    case 'property':
      targetUrl = PROPERTY_SERVICE_URL + '/graphql';
      break;
    case 'form':
      targetUrl = FORM_SERVICE_URL + '/graphql';
      break;
    case 'analysis':
      targetUrl = ANALYSIS_SERVICE_URL + '/graphql';
      break;
    case 'report':
      targetUrl = REPORT_SERVICE_URL + '/graphql';
      break;
    default:
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        error: 'Bad Request',
        message: `Unknown service: ${serviceName}`,
        timestamp: new Date().toISOString()
      }));
      return;
  }
  
  console.log(`Proxying GraphQL request to service: ${serviceName} at URL: ${targetUrl}`);
  proxyRequest(req, res, targetUrl);
}

// Start the server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log('Server successfully bound to 0.0.0.0:' + PORT);
});

export default server;