/**
 * Search Engine
 * AI-powered fuzzy search with intelligent ranking
 */

const Fuse = require('fuse.js');
const chalk = require('chalk');

/**
 * Create search index for packages
 */
function createSearchIndex(workspaceData) {
  const options = {
    // Fuzzy search configuration
    includeScore: true,
    includeMatches: true,
    threshold: 0.4, // 0 = perfect match, 1 = match anything
    minMatchCharLength: 2,
    
    // Search in these fields
    keys: [
      { name: 'name', weight: 2.0 },           // Package name most important
      { name: 'description', weight: 1.5 },    // Description also important
      { name: 'path', weight: 1.0 },           // Path can help
      { name: 'keywords', weight: 1.5 },       // Keywords if available
      { name: 'tier', weight: 0.5 },           // Tier less important
      { name: 'type', weight: 0.8 }            // Type moderately important
    ]
  };

  // Prepare data with keywords
  const searchableData = workspaceData.packages.map(pkg => ({
    ...pkg,
    keywords: generateKeywords(pkg)
  }));

  return new Fuse(searchableData, options);
}

/**
 * Generate searchable keywords for a package
 */
function generateKeywords(pkg) {
  const keywords = [];
  
  // Add tier as keyword
  if (pkg.tier) keywords.push(pkg.tier);
  
  // Add type as keyword
  if (pkg.type) keywords.push(pkg.type);
  
  // Add technology keywords from path
  if (pkg.path) {
    if (pkg.path.includes('react')) keywords.push('react', 'frontend');
    if (pkg.path.includes('backend')) keywords.push('backend', 'api', 'server');
    if (pkg.path.includes('test')) keywords.push('testing', 'test');
    if (pkg.path.includes('ai')) keywords.push('ai', 'artificial intelligence');
    if (pkg.path.includes('mcp')) keywords.push('mcp', 'model context protocol');
    if (pkg.path.includes('gis')) keywords.push('gis', 'mapping', 'spatial');
    if (pkg.path.includes('dashboard')) keywords.push('dashboard', 'ui');
  }
  
  // Add name parts as keywords
  if (pkg.name) {
    const nameParts = pkg.name.toLowerCase().split(/[-_\s]+/);
    keywords.push(...nameParts);
  }
  
  return keywords.join(' ');
}

/**
 * Search workspace with AI-powered fuzzy matching
 */
async function searchWorkspace(workspaceData, query) {
  const fuse = createSearchIndex(workspaceData);
  const results = fuse.search(query);
  
  // Return top 20 results with metadata
  return results.slice(0, 20).map(result => ({
    ...result.item,
    _score: result.score,
    _matches: result.matches
  }));
}

/**
 * Filter packages by criteria
 */
function filterPackages(workspaceData, filters) {
  let filtered = [...workspaceData.packages];
  
  if (filters.tier) {
    filtered = filtered.filter(pkg => pkg.tier === filters.tier);
  }
  
  if (filters.type) {
    filtered = filtered.filter(pkg => pkg.type === filters.type);
  }
  
  if (filters.hasDependencies !== undefined) {
    filtered = filtered.filter(pkg => pkg.hasDependencies === filters.hasDependencies);
  }
  
  if (filters.hasTests !== undefined) {
    filtered = filtered.filter(pkg => pkg.hasTests === filters.hasTests);
  }
  
  return filtered;
}

/**
 * Get suggestions based on partial input
 */
function getSuggestions(workspaceData, partial) {
  if (!partial || partial.length < 2) {
    return [];
  }
  
  const lowerPartial = partial.toLowerCase();
  
  // Find packages that start with or contain the partial
  const suggestions = workspaceData.packages
    .filter(pkg => 
      pkg.name.toLowerCase().includes(lowerPartial) ||
      (pkg.description && pkg.description.toLowerCase().includes(lowerPartial))
    )
    .slice(0, 10)
    .map(pkg => pkg.name);
  
  return suggestions;
}

module.exports = {
  createSearchIndex,
  searchWorkspace,
  filterPackages,
  getSuggestions
};
