/**
 * Workspace Data Loader
 * Loads and parses .workspace-map.json
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

/**
 * Load workspace data from .workspace-map.json
 * @returns {Promise<Object>} Workspace data
 */
async function loadWorkspaceData() {
  try {
    // Try multiple possible locations
    const possiblePaths = [
      // Direct path (when run from workspace root)
      path.join(process.cwd(), '.workspace-map.json'),
      // Parent directory (when run from subdirectory)
      path.join(process.cwd(), '..', '.workspace-map.json'),
      // Environment variable
      process.env.TERRAFUSION_ROOT 
        ? path.join(process.env.TERRAFUSION_ROOT, '.workspace-map.json')
        : null,
      // Hardcoded fallback (last resort)
      'C:\\Users\\bsval\\terrafusion_os_1.0\\.workspace-map.json'
    ].filter(Boolean);

    let workspaceMapPath = null;
    
    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        workspaceMapPath = testPath;
        break;
      }
    }

    if (!workspaceMapPath) {
      if (process.env.TF_EXPLORER_DEBUG) {
        console.error(chalk.red('Debug: Tried paths:'));
        possiblePaths.forEach(p => console.error(chalk.dim(`  - ${p}`)));
      }
      throw new Error('.workspace-map.json not found');
    }

    // Read and parse
    const rawData = fs.readFileSync(workspaceMapPath, 'utf8');
    const data = JSON.parse(rawData);

    // Validate structure
    if (!data.workspace || !data.packages) {
      throw new Error('Invalid .workspace-map.json structure');
    }

    // Add metadata
    data._loaded = new Date().toISOString();
    data._path = workspaceMapPath;

    if (process.env.TF_EXPLORER_DEBUG) {
      console.log(chalk.dim(`Debug: Loaded from ${workspaceMapPath}`));
      console.log(chalk.dim(`Debug: Found ${data.packages.length} packages`));
    }

    return data;

  } catch (error) {
    if (process.env.TF_EXPLORER_DEBUG) {
      console.error(chalk.red('Debug: Load error:'), error);
    }
    return null;
  }
}

/**
 * Get statistics from workspace data
 */
function getWorkspaceStats(workspaceData) {
  const stats = {
    totalPackages: workspaceData.packages.length,
    byTier: {},
    byType: {},
    hasDependencies: 0,
    hasTests: 0,
    totalModules: workspaceData.modules ? workspaceData.modules.length : 0,
    totalAISystems: workspaceData.ai_systems ? workspaceData.ai_systems.length : 0,
    totalMCPServers: workspaceData.mcp_servers ? workspaceData.mcp_servers.length : 0
  };

  // Count by tier
  workspaceData.packages.forEach(pkg => {
    const tier = pkg.tier || 'unknown';
    stats.byTier[tier] = (stats.byTier[tier] || 0) + 1;

    // Count by type
    const type = pkg.type || 'unknown';
    stats.byType[type] = (stats.byType[type] || 0) + 1;

    // Count features
    if (pkg.hasDependencies) stats.hasDependencies++;
    if (pkg.hasTests) stats.hasTests++;
  });

  return stats;
}

module.exports = {
  loadWorkspaceData,
  getWorkspaceStats
};
