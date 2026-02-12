#!/usr/bin/env node

/**
 * Terrafusion Deployment Script
 * Automates the deployment process to development, staging, and production environments
 */

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

// Configuration
const CONFIG = {
  development: {
    url: process.env.DEV_DEPLOY_URL || "dev-environment-url",
    postDeployScript: "post-deploy-dev.js",
  },
  staging: {
    url: process.env.STAGING_DEPLOY_URL || "staging-environment-url",
    postDeployScript: "post-deploy-staging.js",
  },
  production: {
    url: process.env.PROD_DEPLOY_URL || "production-environment-url",
    postDeployScript: "post-deploy-prod.js",
  },
};

// Get environment from command line arguments
const environment = process.argv[2];
if (!environment || !CONFIG[environment]) {
  console.error(`
    Error: Please specify a valid environment (development, staging, production)
    Usage: node deploy.js <environment>
  `);
  process.exit(1);
}

// Get configuration for the specified environment
const config = CONFIG[environment];

console.log(`Starting deployment to ${environment} environment...`);

// Function to execute a command and log output
function runCommand(command, errorMessage) {
  try {
    console.log(`Running: ${command}`);
    const output = execSync(command, { encoding: "utf-8" });
    console.log(output);
    return output;
  } catch (error) {
    console.error(`${errorMessage}:`);
    console.error(error.stdout || error.message);
    process.exit(1);
  }
}

// Main deployment process
async function deploy() {
  try {
    // Step 1: Build the application
    console.log("Building application...");
    runCommand("npm run build", "Failed to build application");

    // Step 2: Run tests to make sure everything is working
    if (environment === "production" || environment === "staging") {
      console.log("Running tests...");
      runCommand("npm test", "Tests failed");
    }

    // Step 3: Run database migrations if needed
    console.log("Running database migrations...");
    runCommand("npm run db:push", "Database migration failed");

    // Step 4: Deploy to specified environment
    console.log(`Deploying to ${environment}...`);

    // This is where you would add your actual deployment commands
    // For example, using rsync, git commands, or cloud deployment tools
    runCommand(`echo "Deploying to ${config.url}"`, "Deployment failed");

    // Step 5: Run post-deployment scripts if they exist
    const postDeployPath = path.join(__dirname, config.postDeployScript);
    if (fs.existsSync(postDeployPath)) {
      console.log("Running post-deployment script...");
      runCommand(`node ${postDeployPath}`, "Post-deployment script failed");
    }

    // Step 6: Verify deployment
    console.log("Verifying deployment...");
    // Add verification logic here

    console.log(`Deployment to ${environment} completed successfully!`);

    // Log completion time
    console.log(`Deployment completed at: ${new Date().toISOString()}`);
  } catch (error) {
    console.error("Deployment failed:");
    console.error(error);
    process.exit(1);
  }
}

// Run the deployment process
deploy().catch((error) => {
  console.error("Unhandled error during deployment:");
  console.error(error);
  process.exit(1);
});
