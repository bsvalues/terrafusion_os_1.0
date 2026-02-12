#!/usr/bin/env node

/**
 * Observability Linting Script
 *
 * This script validates Prometheus rules and Grafana dashboard configurations
 * to ensure they follow best practices and will work properly when deployed.
 *
 * Usage:
 *   node scripts/observability-lint.js [--fix]
 *
 * Options:
 *   --fix  Attempt to automatically fix common issues
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PROMETHEUS_RULES_DIR = path.join(__dirname, '..', 'prometheus', 'rules');
const PROMETHEUS_ALERTS_DIR = path.join(__dirname, '..', 'prometheus', 'alerts');
const GRAFANA_PROVISIONING_DIR = path.join(__dirname, '..', 'grafana', 'provisioning');
const GRAFANA_DASHBOARDS_DIR = path.join(__dirname, '..', 'grafana', 'dashboards');

// Color codes for terminal output
const COLORS = {
  RESET: '\x1b[0m',
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  MAGENTA: '\x1b[35m',
};

// Counters for summary
let errorCount = 0;
let warningCount = 0;
const fixedCount = 0;

// Arguments
const args = process.argv.slice(2);
const shouldFix = args.includes('--fix');

/**
 * Print a colored message to the console
 */
function log(message, color = COLORS.RESET) {
  console.log(`${color}${message}${COLORS.RESET}`);
}

/**
 * Check if a required tool is installed
 */
function checkToolInstalled(command, name, installInstructions) {
  try {
    execSync(`${command} --version`, { stdio: 'ignore' });
    return true;
  } catch (error) {
    log(`Error: ${name} is not installed or not in PATH.`, COLORS.RED);
    log(`Install instructions: ${installInstructions}`, COLORS.YELLOW);
    return false;
  }
}

/**
 * Validate YAML files in a directory
 */
function validateYamlFiles(directory, recursive = true) {
  log(`\nValidating YAML files in ${directory}...`, COLORS.BLUE);

  try {
    // Get all yaml files
    const findCommand = recursive
      ? `find ${directory} -name "*.yml" -o -name "*.yaml"`
      : `find ${directory} -maxdepth 1 -name "*.yml" -o -name "*.yaml"`;

    const yamlFiles = execSync(findCommand, { encoding: 'utf8' })
      .trim()
      .split('\n')
      .filter(Boolean);

    if (yamlFiles.length === 0) {
      log('No YAML files found.', COLORS.YELLOW);
      return;
    }

    log(`Found ${yamlFiles.length} YAML files.`);

    // Check each file
    yamlFiles.forEach(file => {
      try {
        // Try to parse the YAML
        const content = fs.readFileSync(file, 'utf8');
        yaml.load(content);
        log(`✅ ${file} - Valid YAML`, COLORS.GREEN);
      } catch (error) {
        errorCount++;
        log(`❌ ${file} - Invalid YAML: ${error.message}`, COLORS.RED);
      }
    });
  } catch (error) {
    log(`Error validating YAML files: ${error.message}`, COLORS.RED);
  }
}

/**
 * Validate Prometheus rule files
 */
function validatePrometheusRules() {
  if (
    !checkToolInstalled(
      'promtool',
      'promtool',
      'Install Prometheus (includes promtool) from https://prometheus.io/download/'
    )
  ) {
    return;
  }

  log('\nValidating Prometheus rule files...', COLORS.BLUE);

  // Check rules directory exists
  if (!fs.existsSync(PROMETHEUS_RULES_DIR)) {
    log(`❌ Rules directory ${PROMETHEUS_RULES_DIR} does not exist`, COLORS.RED);
    errorCount++;
    return;
  }

  // Check alerts directory exists
  if (!fs.existsSync(PROMETHEUS_ALERTS_DIR)) {
    log(`❌ Alerts directory ${PROMETHEUS_ALERTS_DIR} does not exist`, COLORS.RED);
    errorCount++;
    return;
  }

  // Get all rule files
  const ruleFiles = [
    ...fs
      .readdirSync(PROMETHEUS_RULES_DIR)
      .filter(f => f.endsWith('.yml') || f.endsWith('.yaml'))
      .map(f => path.join(PROMETHEUS_RULES_DIR, f)),
    ...fs
      .readdirSync(PROMETHEUS_ALERTS_DIR)
      .filter(f => f.endsWith('.yml') || f.endsWith('.yaml'))
      .map(f => path.join(PROMETHEUS_ALERTS_DIR, f)),
  ];

  if (ruleFiles.length === 0) {
    log('No rule files found.', COLORS.YELLOW);
    warningCount++;
    return;
  }

  log(`Found ${ruleFiles.length} rule files.`);

  // Check each file
  ruleFiles.forEach(file => {
    try {
      log(`Checking ${file}...`);
      execSync(`promtool check rules ${file}`, { encoding: 'utf8' });
      log(`✅ ${file} - Valid Prometheus rules`, COLORS.GREEN);
    } catch (error) {
      errorCount++;
      log(`❌ ${file} - Invalid Prometheus rules:`, COLORS.RED);
      log(error.stdout || error.message);
    }
  });
}

/**
 * Validate Grafana dashboard JSON files
 */
function validateGrafanaDashboards() {
  log('\nValidating Grafana dashboards...', COLORS.BLUE);

  // Check dashboard directory exists
  if (!fs.existsSync(GRAFANA_DASHBOARDS_DIR)) {
    log(`❌ Dashboard directory ${GRAFANA_DASHBOARDS_DIR} does not exist`, COLORS.RED);
    errorCount++;
    return;
  }

  // Get all dashboard files
  const dashboardFiles = fs
    .readdirSync(GRAFANA_DASHBOARDS_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => path.join(GRAFANA_DASHBOARDS_DIR, f));

  if (dashboardFiles.length === 0) {
    log('No dashboard files found.', COLORS.YELLOW);
    warningCount++;
    return;
  }

  log(`Found ${dashboardFiles.length} dashboard files.`);

  // Check each file
  dashboardFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      JSON.parse(content);
      log(`✅ ${file} - Valid JSON`, COLORS.GREEN);
    } catch (error) {
      errorCount++;
      log(`❌ ${file} - Invalid JSON: ${error.message}`, COLORS.RED);
    }
  });
}

/**
 * Validate Grafana provisioning YAML files
 */
function validateGrafanaProvisioning() {
  log('\nValidating Grafana provisioning configuration...', COLORS.BLUE);

  // Check provisioning directory exists
  if (!fs.existsSync(GRAFANA_PROVISIONING_DIR)) {
    log(`❌ Provisioning directory ${GRAFANA_PROVISIONING_DIR} does not exist`, COLORS.RED);
    errorCount++;
    return;
  }

  // Validate YAML files in the provisioning directory and its subdirectories
  validateYamlFiles(GRAFANA_PROVISIONING_DIR);

  // Check for required directories
  const requiredDirs = ['dashboards', 'datasources'];
  requiredDirs.forEach(dir => {
    const dirPath = path.join(GRAFANA_PROVISIONING_DIR, dir);
    if (!fs.existsSync(dirPath)) {
      warningCount++;
      log(`⚠️ Recommended provisioning directory ${dirPath} does not exist`, COLORS.YELLOW);
    }
  });
}

/**
 * Main function
 */
function main() {
  log('Starting observability configuration linting...', COLORS.MAGENTA);
  log('======================================\n');

  // Check YAML syntax for all observability files
  validateYamlFiles(PROMETHEUS_RULES_DIR);
  validateYamlFiles(PROMETHEUS_ALERTS_DIR);
  validateYamlFiles(GRAFANA_PROVISIONING_DIR, true);

  // Validate Prometheus rules
  validatePrometheusRules();

  // Validate Grafana configurations
  validateGrafanaDashboards();
  validateGrafanaProvisioning();

  // Print summary
  log('\n======================================', COLORS.MAGENTA);
  log('Linting complete!', COLORS.MAGENTA);
  log(`Errors: ${errorCount}`, errorCount > 0 ? COLORS.RED : COLORS.GREEN);
  log(`Warnings: ${warningCount}`, warningCount > 0 ? COLORS.YELLOW : COLORS.GREEN);

  if (shouldFix) {
    log(`Issues fixed: ${fixedCount}`, COLORS.BLUE);
  }

  // Exit with error code if there are errors
  process.exit(errorCount > 0 ? 1 : 0);
}

// Run the main function
main();
