/**
 * TerraFusionPro Health Endpoint Script
 * 
 * This script can be used to add standardized health check endpoints to all
 * imported applications. It analyzes each application to determine the framework
 * used (Express, Koa, Fastify, etc.) and adds the appropriate health endpoint.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const APPS_DIR = path.join(__dirname, '..', 'apps');
const SERVICES_DIR = path.join(__dirname, '..', 'services');
const PACKAGES_DIR = path.join(__dirname, '..', 'packages');

// Express health endpoint code
const EXPRESS_HEALTH_ENDPOINT = `
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: '<service-name>',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});
`;

// Fastify health endpoint code
const FASTIFY_HEALTH_ENDPOINT = `
// Health check endpoint
fastify.get('/health', async (request, reply) => {
  return {
    status: 'healthy',
    service: '<service-name>',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  };
});
`;

// Koa health endpoint code
const KOA_HEALTH_ENDPOINT = `
// Health check endpoint
router.get('/health', async (ctx) => {
  ctx.body = {
    status: 'healthy',
    service: '<service-name>',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  };
});
`;

// Node.js HTTP health endpoint code
const NODE_HTTP_HEALTH_ENDPOINT = `
// Health check endpoint handler
if (req.url === '/health') {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'healthy',
    service: '<service-name>',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  }));
  return;
}
`;

// Function to find the main file of an application
function findMainFile(appDir) {
  // Check for common entry points
  const possibleEntryPoints = [
    'index.js',
    'server.js',
    'app.js',
    'main.js',
    'src/index.js',
    'src/server.js',
    'src/app.js',
    'src/main.js'
  ];

  for (const entryPoint of possibleEntryPoints) {
    const filePath = path.join(appDir, entryPoint);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }

  // If no common entry point found, look for files that start server
  const files = findFilesRecursively(appDir, '.js');
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    if (
      content.includes('listen(') ||
      content.includes('.listen(') ||
      content.includes('createServer(')
    ) {
      return file;
    }
  }

  return null;
}

// Function to find files recursively
function findFilesRecursively(dir, extension) {
  let results = [];
  const list = fs.readdirSync(dir);

  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && 
        file !== 'node_modules' && 
        file !== '.git' && 
        file !== 'dist' && 
        file !== 'build') {
      // Recursively search directories
      results = results.concat(findFilesRecursively(filePath, extension));
    } else if (file.endsWith(extension)) {
      results.push(filePath);
    }
  }

  return results;
}

// Function to detect the framework used in a file
function detectFramework(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  if (content.includes('express()') || content.includes('require(\'express\')') || content.includes('from \'express\'')) {
    return 'express';
  } else if (content.includes('fastify(') || content.includes('require(\'fastify\')') || content.includes('from \'fastify\'')) {
    return 'fastify';
  } else if (content.includes('new Koa(') || content.includes('require(\'koa\')') || content.includes('from \'koa\'')) {
    return 'koa';
  } else if (content.includes('createServer(') || content.includes('http.createServer(')) {
    return 'http';
  }

  return 'unknown';
}

// Function to add health endpoint to a file
function addHealthEndpoint(filePath, framework, serviceName) {
  let content = fs.readFileSync(filePath, 'utf8');
  let healthEndpoint;

  switch (framework) {
    case 'express':
      healthEndpoint = EXPRESS_HEALTH_ENDPOINT.replace('<service-name>', serviceName);
      // Find a good place to insert the endpoint
      if (content.includes('app.listen(')) {
        content = content.replace(
          /app\.listen\(/,
          `${healthEndpoint}\n\napp.listen(`
        );
      } else {
        // Add before the export or at the end
        if (content.includes('module.exports') || content.includes('export default')) {
          content = content.replace(
            /(module\.exports|export default)/,
            `${healthEndpoint}\n\n$1`
          );
        } else {
          content += `\n\n${healthEndpoint}`;
        }
      }
      break;

    case 'fastify':
      healthEndpoint = FASTIFY_HEALTH_ENDPOINT.replace('<service-name>', serviceName);
      // Find a good place to insert the endpoint
      if (content.includes('fastify.listen(')) {
        content = content.replace(
          /fastify\.listen\(/,
          `${healthEndpoint}\n\nfastify.listen(`
        );
      } else {
        // Add before the export or at the end
        if (content.includes('module.exports') || content.includes('export default')) {
          content = content.replace(
            /(module\.exports|export default)/,
            `${healthEndpoint}\n\n$1`
          );
        } else {
          content += `\n\n${healthEndpoint}`;
        }
      }
      break;

    case 'koa':
      healthEndpoint = KOA_HEALTH_ENDPOINT.replace('<service-name>', serviceName);
      // Find a good place to insert the endpoint
      if (content.includes('app.listen(')) {
        content = content.replace(
          /app\.listen\(/,
          `${healthEndpoint}\n\napp.listen(`
        );
      } else {
        // Add before the export or at the end
        if (content.includes('module.exports') || content.includes('export default')) {
          content = content.replace(
            /(module\.exports|export default)/,
            `${healthEndpoint}\n\n$1`
          );
        } else {
          content += `\n\n${healthEndpoint}`;
        }
      }
      break;

    case 'http':
      healthEndpoint = NODE_HTTP_HEALTH_ENDPOINT.replace('<service-name>', serviceName);
      // This is trickier, as we need to insert it in the request handler
      if (content.includes('createServer(') && content.includes('req, res')) {
        // Find the request handler function
        const match = content.match(/createServer\([^)]*\)\s*{|\([^)]*req,\s*res[^)]*\)\s*=>\s*{|\bfunction\s*\([^)]*req,\s*res[^)]*\)\s*{/);
        if (match) {
          const insertPosition = match.index + match[0].length;
          // Insert health check at the beginning of the handler function
          content = content.slice(0, insertPosition) + '\n  ' + healthEndpoint + content.slice(insertPosition);
        } else {
          console.warn(`Couldn't find a good place to insert health endpoint in ${filePath}`);
          return false;
        }
      } else {
        console.warn(`Couldn't find a good place to insert health endpoint in ${filePath}`);
        return false;
      }
      break;

    default:
      console.warn(`Unknown framework for ${filePath}`);
      return false;
  }

  // Write the modified content back to the file
  fs.writeFileSync(filePath, content);
  return true;
}

// Main function to add health endpoints to all applications
async function addHealthEndpointsToAllApps() {
  console.log('Adding health endpoints to all applications...');

  // Process apps directory
  if (fs.existsSync(APPS_DIR)) {
    const apps = fs.readdirSync(APPS_DIR);
    for (const app of apps) {
      const appDir = path.join(APPS_DIR, app);
      if (fs.statSync(appDir).isDirectory()) {
        const mainFile = findMainFile(appDir);
        if (mainFile) {
          const framework = detectFramework(mainFile);
          console.log(`Adding health endpoint to ${app} (${framework})...`);
          const success = addHealthEndpoint(mainFile, framework, app);
          if (success) {
            console.log(`  ✅ Health endpoint added to ${app}`);
          } else {
            console.log(`  ❌ Failed to add health endpoint to ${app}`);
          }
        } else {
          console.warn(`  ⚠️ Could not find main file for ${app}`);
        }
      }
    }
  }

  // Process services directory
  if (fs.existsSync(SERVICES_DIR)) {
    const services = fs.readdirSync(SERVICES_DIR);
    for (const service of services) {
      const serviceDir = path.join(SERVICES_DIR, service);
      if (fs.statSync(serviceDir).isDirectory()) {
        const mainFile = findMainFile(serviceDir);
        if (mainFile) {
          const framework = detectFramework(mainFile);
          console.log(`Adding health endpoint to ${service} (${framework})...`);
          const success = addHealthEndpoint(mainFile, framework, service);
          if (success) {
            console.log(`  ✅ Health endpoint added to ${service}`);
          } else {
            console.log(`  ❌ Failed to add health endpoint to ${service}`);
          }
        } else {
          console.warn(`  ⚠️ Could not find main file for ${service}`);
        }
      }
    }
  }

  // Process packages directory (only for servers, not libraries)
  if (fs.existsSync(PACKAGES_DIR)) {
    const packages = fs.readdirSync(PACKAGES_DIR);
    for (const pkg of packages) {
      const pkgDir = path.join(PACKAGES_DIR, pkg);
      if (fs.statSync(pkgDir).isDirectory()) {
        // Skip shared packages or libraries
        if (pkg === 'shared' || pkg === 'lib' || pkg === 'ui' || pkg === 'config') {
          continue;
        }
        
        const mainFile = findMainFile(pkgDir);
        if (mainFile) {
          const framework = detectFramework(mainFile);
          // Only add health endpoints to server packages
          if (framework !== 'unknown') {
            console.log(`Adding health endpoint to ${pkg} (${framework})...`);
            const success = addHealthEndpoint(mainFile, framework, pkg);
            if (success) {
              console.log(`  ✅ Health endpoint added to ${pkg}`);
            } else {
              console.log(`  ❌ Failed to add health endpoint to ${pkg}`);
            }
          }
        }
      }
    }
  }

  console.log('\nHealth endpoints added successfully!');
  console.log('Now you can run the smoke tests to verify all endpoints are working:');
  console.log('  chmod +x smoke-test.sh && ./smoke-test.sh');
}

// Run the main function
addHealthEndpointsToAllApps().catch(error => {
  console.error('Error adding health endpoints:', error);
  process.exit(1);
});