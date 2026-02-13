#!/usr/bin/env node
/**
 * Orphan C# Source Scanner
 * 
 * Prevents "code exists in git but not in build" governance failures.
 * Scans for .cs files that are not referenced by any .csproj in the solution.
 * 
 * CRITICAL: This gate blocks the failure mode where:
 * - Source code is committed to git
 * - CI passes (because files aren't compiled)
 * - Code claims to implement security/compliance features
 * - Code has 0 test coverage (tests can't run)
 * - Production thinks features exist when they don't
 * 
 * Exit code:
 * - 0: All .cs files are tracked by projects
 * - 1: Orphaned .cs files found (BLOCKS MERGE)
 */

import { readdir, readFile } from 'fs/promises';
import { join, relative, sep } from 'path';
import { parseStringPromise } from 'xml2js';

const BACKEND_ROOT = 'backend';
const ALLOWED_ORPHAN_PATHS = [
  'docs/',
  'prototypes/',
  'ARCHIVE/',
  '.github/',
  'scripts/',
  'tools/'
];

// Colors for terminal output
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

/**
 * Recursively find all files matching a pattern
 */
async function findFiles(dir, pattern, results = []) {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      // Skip node_modules, .git, bin, obj
      if (entry.name === 'node_modules' || 
          entry.name === '.git' || 
          entry.name === 'bin' || 
          entry.name === 'obj') {
        continue;
      }
      
      if (entry.isDirectory()) {
        await findFiles(fullPath, pattern, results);
      } else if (entry.name.endsWith(pattern)) {
        results.push(fullPath);
      }
    }
  } catch (err) {
    // Directory doesn't exist or can't be read - that's ok
    if (err.code !== 'ENOENT' && err.code !== 'EACCES') {
      console.error(`${RED}Error reading directory ${dir}: ${err.message}${RESET}`);
    }
  }
  
  return results;
}

/**
 * Parse .csproj and extract all .cs file references
 */
async function getProjectSources(csprojPath) {
  try {
    const xml = await readFile(csprojPath, 'utf-8');
    const parsed = await parseStringPromise(xml);
    const sources = new Set();
    
    // MSBuild includes all .cs in project directory by default (SDK-style projects)
    const projectDir = csprojPath.substring(0, csprojPath.lastIndexOf(sep));
    const csFiles = await findFiles(projectDir, '.cs');
    csFiles.forEach(cs => sources.add(cs.replace(/\\/g, '/')));
    
    // Also check explicit <Compile Include="..." /> (old-style projects)
    if (parsed.Project?.ItemGroup) {
      for (const itemGroup of parsed.Project.ItemGroup) {
        if (itemGroup.Compile) {
          for (const compile of itemGroup.Compile) {
            if (compile.$?.Include) {
              const includePath = join(projectDir, compile.$.Include);
              sources.add(includePath.replace(/\\/g, '/'));
            }
          }
        }
      }
    }
    
    return sources;
  } catch (err) {
    console.error(`${YELLOW}Warning: Could not parse ${csprojPath}: ${err.message}${RESET}`);
    return new Set();
  }
}

/**
 * Check if path is in allowed orphan list
 */
function isAllowedOrphan(csPath) {
  const normalized = csPath.replace(/\\/g, '/');
  return ALLOWED_ORPHAN_PATHS.some(allowed => normalized.includes(allowed));
}

/**
 * Main scan logic
 */
async function scanOrphans() {
  console.log(`${BLUE}=== Orphan C# Source Scanner ===${RESET}\n`);
  
  // Step 1: Find all .csproj files
  console.log(`${BLUE}[1/4]${RESET} Finding .csproj files...`);
  const csprojFiles = await findFiles(BACKEND_ROOT, '.csproj');
  console.log(`      Found ${csprojFiles.length} project files\n`);
  
  if (csprojFiles.length === 0) {
    console.log(`${YELLOW}Warning: No .csproj files found in ${BACKEND_ROOT}/${RESET}`);
    return 0;
  }
  
  // Step 2: Collect all .cs files referenced by projects
  console.log(`${BLUE}[2/4]${RESET} Analyzing project source references...`);
  const trackedSources = new Set();
  for (const csproj of csprojFiles) {
    const sources = await getProjectSources(csproj);
    sources.forEach(s => trackedSources.add(s));
  }
  console.log(`      ${trackedSources.size} source files tracked by projects\n`);
  
  // Step 3: Find all .cs files in backend
  console.log(`${BLUE}[3/4]${RESET} Finding all .cs files in ${BACKEND_ROOT}/...`);
  const allCsFiles = await findFiles(BACKEND_ROOT, '.cs');
  console.log(`      Found ${allCsFiles.length} total .cs files\n`);
  
  // Step 4: Identify orphans
  console.log(`${BLUE}[4/4]${RESET} Identifying orphaned sources...\n`);
  const orphans = [];
  
  for (const csFile of allCsFiles) {
    const normalized = csFile.replace(/\\/g, '/');
    
    // Skip if tracked by a project
    if (trackedSources.has(normalized)) {
      continue;
    }
    
    // Skip if in allowed orphan path
    if (isAllowedOrphan(normalized)) {
      continue;
    }
    
    orphans.push(normalized);
  }
  
  // Report results
  if (orphans.length === 0) {
    console.log(`${GREEN}✅ SUCCESS: No orphaned .cs files detected${RESET}`);
    console.log(`${GREEN}   All ${allCsFiles.length} source files are tracked by projects or explicitly allowed${RESET}\n`);
    return 0;
  } else {
    console.log(`${RED}❌ FAILURE: ${orphans.length} orphaned .cs file(s) detected${RESET}\n`);
    console.log(`${RED}These files exist in git but are NOT compiled by any .csproj:${RESET}\n`);
    
    for (const orphan of orphans) {
      console.log(`  ${RED}•${RESET} ${orphan}`);
    }
    
    console.log(`\n${YELLOW}Orphaned source code creates the following risks:${RESET}`);
    console.log(`  ${YELLOW}• Code claims to implement features but is never built/tested${RESET}`);
    console.log(`  ${YELLOW}• CI passes even though code may not compile${RESET}`);
    console.log(`  ${YELLOW}• Security/compliance claims are misleading${RESET}`);
    console.log(`  ${YELLOW}• Zero test coverage (tests can't run on unbuilt code)${RESET}\n`);
    
    console.log(`${BLUE}To fix:${RESET}`);
    console.log(`  1. Add files to an existing .csproj (preferred), OR`);
    console.log(`  2. Create new .csproj + add to solution, OR`);
    console.log(`  3. Move to docs/prototypes/ if not production code\n`);
    
    return 1;
  }
}

// Run scan
scanOrphans()
  .then(exitCode => process.exit(exitCode))
  .catch(err => {
    console.error(`${RED}Fatal error: ${err.message}${RESET}`);
    console.error(err.stack);
    process.exit(1);
  });
