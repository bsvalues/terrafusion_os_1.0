/**
 * Tests for workspace loader
 */

const { getWorkspaceStats } = require('../src/search/workspace-loader');

// Mock workspace data
const mockWorkspaceData = {
  workspace: { name: 'TerraFusion OS' },
  packages: [
    { name: 'pkg1', tier: 'core', type: 'module', hasDependencies: true, hasTests: true },
    { name: 'pkg2', tier: 'core', type: 'library', hasDependencies: false, hasTests: true },
    { name: 'pkg3', tier: 'essential', type: 'module', hasDependencies: true, hasTests: false },
    { name: 'pkg4', tier: 'enhanced', type: 'application', hasDependencies: true, hasTests: true }
  ],
  modules: [{ name: 'mod1' }, { name: 'mod2' }],
  ai_systems: [{ name: 'ai1' }],
  mcp_servers: [{ name: 'mcp1' }, { name: 'mcp2' }]
};

describe('Workspace Loader', () => {

  describe('getWorkspaceStats', () => {
    it('should calculate statistics correctly', () => {
      const stats = getWorkspaceStats(mockWorkspaceData);
      
      expect(stats.totalPackages).toBe(mockWorkspaceData.packages.length);
      expect(stats.byTier).toBeDefined();
      expect(stats.byType).toBeDefined();
      expect(typeof stats.hasDependencies).toBe('number');
      expect(typeof stats.hasTests).toBe('number');
      expect(stats.totalModules).toBe(2);
      expect(stats.totalAISystems).toBe(1);
      expect(stats.totalMCPServers).toBe(2);
    });

    it('should count by tier correctly', () => {
      const stats = getWorkspaceStats(mockWorkspaceData);
      
      const totalByTier = Object.values(stats.byTier).reduce((sum, count) => sum + count, 0);
      expect(totalByTier).toBeLessThanOrEqual(stats.totalPackages);
      expect(stats.byTier.core).toBe(2);
      expect(stats.byTier.essential).toBe(1);
      expect(stats.byTier.enhanced).toBe(1);
    });

    it('should count by type correctly', () => {
      const stats = getWorkspaceStats(mockWorkspaceData);
      
      const totalByType = Object.values(stats.byType).reduce((sum, count) => sum + count, 0);
      expect(totalByType).toBeLessThanOrEqual(stats.totalPackages);
      expect(stats.byType.module).toBe(2);
      expect(stats.byType.library).toBe(1);
      expect(stats.byType.application).toBe(1);
    });

    it('should count features correctly', () => {
      const stats = getWorkspaceStats(mockWorkspaceData);
      
      expect(stats.hasDependencies).toBe(3); // pkg1, pkg3, pkg4
      expect(stats.hasTests).toBe(3); // pkg1, pkg2, pkg4
    });
  });
});
