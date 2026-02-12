/**
 * Tests for search engine
 */

const { createSearchIndex, searchWorkspace, filterPackages, getSuggestions } = require('../src/search/search-engine');

// Mock workspace data
const mockWorkspaceData = {
  workspace: { name: 'TerraFusion OS' },
  packages: [
    { name: 'terrafusion-core', path: '/core', tier: 'core', type: 'module', description: 'Core functionality', hasDependencies: true, hasTests: true },
    { name: 'terrafusion-gis', path: '/gis', tier: 'essential', type: 'module', description: 'GIS mapping', hasDependencies: true, hasTests: false },
    { name: 'dashboard', path: '/dashboard', tier: 'enhanced', type: 'application', description: 'Main dashboard', hasDependencies: true, hasTests: true },
    { name: 'utils', path: '/utils', tier: 'core', type: 'library', description: 'Utility functions', hasDependencies: false, hasTests: true }
  ]
};

describe('Search Engine', () => {
  describe('createSearchIndex', () => {
    it('should create a Fuse search index', () => {
      const index = createSearchIndex(mockWorkspaceData);
      expect(index).toBeDefined();
      expect(index.search).toBeDefined();
    });
  });

  describe('searchWorkspace', () => {
    it('should find exact matches', async () => {
      const results = await searchWorkspace(mockWorkspaceData, 'terrafusion-core');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toBe('terrafusion-core');
    });

    it('should find fuzzy matches', async () => {
      const results = await searchWorkspace(mockWorkspaceData, 'terra');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.name.includes('terrafusion'))).toBe(true);
    });

    it('should search in descriptions', async () => {
      const results = await searchWorkspace(mockWorkspaceData, 'GIS');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.name === 'terrafusion-gis')).toBe(true);
    });

    it('should return top 20 results max', async () => {
      const results = await searchWorkspace(mockWorkspaceData, 'terra');
      expect(results.length).toBeLessThanOrEqual(20);
    });
  });

  describe('filterPackages', () => {
    it('should filter by tier', () => {
      const filtered = filterPackages(mockWorkspaceData, { tier: 'core' });
      expect(filtered.every(pkg => pkg.tier === 'core')).toBe(true);
    });

    it('should filter by type', () => {
      const filtered = filterPackages(mockWorkspaceData, { type: 'module' });
      expect(filtered.every(pkg => pkg.type === 'module')).toBe(true);
    });

    it('should filter by hasDependencies', () => {
      const filtered = filterPackages(mockWorkspaceData, { hasDependencies: true });
      expect(filtered.every(pkg => pkg.hasDependencies === true)).toBe(true);
    });

    it('should filter by hasTests', () => {
      const filtered = filterPackages(mockWorkspaceData, { hasTests: true });
      expect(filtered.every(pkg => pkg.hasTests === true)).toBe(true);
    });

    it('should combine multiple filters', () => {
      const filtered = filterPackages(mockWorkspaceData, { tier: 'core', hasTests: true });
      expect(filtered.every(pkg => pkg.tier === 'core' && pkg.hasTests === true)).toBe(true);
    });
  });

  describe('getSuggestions', () => {
    it('should return suggestions for partial input', () => {
      const suggestions = getSuggestions(mockWorkspaceData, 'ter');
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.includes('terrafusion'))).toBe(true);
    });

    it('should return empty array for short input', () => {
      const suggestions = getSuggestions(mockWorkspaceData, 't');
      expect(suggestions).toEqual([]);
    });

    it('should limit to 10 suggestions', () => {
      const suggestions = getSuggestions(mockWorkspaceData, 'a');
      expect(suggestions.length).toBeLessThanOrEqual(10);
    });
  });
});
