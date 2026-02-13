/**
 * Write Boundary Tests for Workspace Companion Agent
 *
 * Per DX_SPINE_CHARTER.md §4 Lane Discipline, the Companion should ONLY write to:
 * - .terrafusion/context/latest.json (Context Pack)
 * - .terrafusion/companion/* (Companion sandbox)
 *
 * This test suite ensures no writes occur outside these allowed paths.
 */

import * as path from 'path';

// Mock data
const mockWorkspaceRoot = '/home/user/terrafusion_os_1.0';
const allowedPaths = [
  '.terrafusion/context/latest.json',
  '.terrafusion/companion'
];

// Track all filesystem write operations
let writeOperations: Array<{ path: string; operation: string }> = [];

// Create mock functions
const mockWriteFileSync = jest.fn((filePath: any, data: any) => {
  const pathStr = String(filePath);
  writeOperations.push({ path: pathStr, operation: 'writeFileSync' });
  return undefined;
});

const mockWriteFile = jest.fn((filePath: any, data: any, callback?: any) => {
  const pathStr = String(filePath);
  writeOperations.push({ path: pathStr, operation: 'writeFile' });
  if (typeof callback === 'function') {
    callback(null);
  }
  return undefined;
});

const mockMkdirSync = jest.fn((dirPath: any, options?: any) => {
  const pathStr = String(dirPath);
  writeOperations.push({ path: pathStr, operation: 'mkdirSync' });
  return undefined;
});

const mockExistsSync = jest.fn((filePath: any) => {
  const pathStr = String(filePath);
  if (pathStr === mockWorkspaceRoot) return true;
  if (pathStr === path.join(mockWorkspaceRoot, 'backend')) return true;
  if (pathStr === path.join(mockWorkspaceRoot, 'frontend')) return true;
  if (pathStr === path.join(mockWorkspaceRoot, 'modules')) return true;
  // Allow .terrafusion context pack to "exist" so it can be loaded and updated
  if (pathStr.includes('latest.json') && pathStr.includes('.terrafusion')) return true;
  if (pathStr.includes('.terrafusion') && pathStr.includes('context')) return true;
  if (pathStr.includes('.terrafusion')) return false;
  return false;
});

const mockReadFileSync = jest.fn((filePath: any, encoding?: any) => {
  const pathStr = String(filePath);
  if (pathStr.includes('latest.json')) {
    return JSON.stringify({
      version: '1.0.0',
      generated: new Date().toISOString(),
      generator: 'test',
      repo: { root: mockWorkspaceRoot, branch: 'main', lastCommit: 'abc123', dirtyFiles: [] },
      focus: { scene: null, lane: 'dev', pr: null, intent: null },
      health: { services: {}, overallHealth: 'good' as const },
      governance: { tier1EvidenceStatus: 'partial' as const, dodVersion: '1.0.0', sceneEnforcementActive: false, missingEvidence: [] },
      todos: { critical: [], high: [], medium: [], low: [] },
      nextActions: []
    });
  }
  return '';
});

const mockWatch = jest.fn(() => ({
  close: jest.fn()
}));

const mockExec = jest.fn((cmd: string, callback: any) => {
  if (callback) {
    callback(null, { stdout: 'main\n', stderr: '' });
  }
  return {};
});

// Mock fs module
jest.mock('fs', () => ({
  writeFileSync: mockWriteFileSync,
  writeFile: mockWriteFile,
  mkdirSync: mockMkdirSync,
  existsSync: mockExistsSync,
  readFileSync: mockReadFileSync,
  watch: mockWatch
}));

// Mock child_process
jest.mock('child_process', () => ({
  exec: mockExec
}));

// Now import after mocking
import { WorkspaceCompanionAgent } from '../WorkspaceCompanionAgent';

// Helper function to check if a path is allowed
function isAllowedPath(filePath: string): boolean {
  const normalizedPath = path.normalize(filePath);

  return allowedPaths.some(allowedPath => {
    const fullAllowedPath = path.join(mockWorkspaceRoot, allowedPath);

    // Check if it's exactly the allowed file
    if (normalizedPath === fullAllowedPath) {
      return true;
    }

    // Check if it's within an allowed directory (for .terrafusion/companion/*)
    if (allowedPath.endsWith('/companion') || allowedPath.endsWith('\\companion')) {
      return normalizedPath.startsWith(fullAllowedPath + path.sep) ||
             normalizedPath.startsWith(fullAllowedPath);
    }

    return false;
  });
}

// Helper to check if path is .terrafusion directory creation (allowed)
function isTerrafusionDirCreation(dirPath: string): boolean {
  const normalizedPath = path.normalize(dirPath);
  const terrafusionDir = path.join(mockWorkspaceRoot, '.terrafusion');

  // Allow creation of .terrafusion and its subdirectories
  return normalizedPath === terrafusionDir ||
         normalizedPath === path.join(terrafusionDir, 'context') ||
         normalizedPath === path.join(terrafusionDir, 'companion') ||
         normalizedPath.startsWith(terrafusionDir + path.sep);
}

describe('Workspace Companion Write Boundary Tests', () => {

  beforeEach(() => {
    // Reset write operations tracking
    writeOperations = [];

    // Clear all mock call history
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
  });

  test('Companion.activate() only writes to allowed paths', async () => {
    // Create companion instance
    const companion = new WorkspaceCompanionAgent();

    // Activate companion
    await companion.activate();

    // Filter out directory creations for .terrafusion (these are allowed)
    const fileWrites = writeOperations.filter(op => {
      if (op.operation === 'mkdirSync') {
        return !isTerrafusionDirCreation(op.path);
      }
      return true;
    });

    // Check all file writes are to allowed paths
    const invalidWrites = fileWrites.filter(op => !isAllowedPath(op.path));

    if (invalidWrites.length > 0) {
      console.error('INVALID WRITES DETECTED:');
      invalidWrites.forEach(write => {
        console.error(`  - ${write.operation}: ${write.path}`);
      });
    }

    expect(invalidWrites).toHaveLength(0);

    // Verify at least one write to Context Pack occurred
    const contextPackWrites = fileWrites.filter(op =>
      op.path.includes('latest.json') && op.path.includes('.terrafusion')
    );
    expect(contextPackWrites.length).toBeGreaterThan(0);
  });

  test('Companion.deactivate() only updates Context Pack', async () => {
    const companion = new WorkspaceCompanionAgent();
    await companion.activate();

    // Reset tracking after activation
    writeOperations = [];

    // Deactivate companion
    await companion.deactivate();

    // Filter out directory operations
    const fileWrites = writeOperations.filter(op => op.operation !== 'mkdirSync');

    // Check all writes are to allowed paths
    const invalidWrites = fileWrites.filter(op => !isAllowedPath(op.path));

    if (invalidWrites.length > 0) {
      console.error('INVALID WRITES DURING DEACTIVATION:');
      invalidWrites.forEach(write => {
        console.error(`  - ${write.operation}: ${write.path}`);
      });
    }

    expect(invalidWrites).toHaveLength(0);
  });

  test('No writes to source tree (backend/, frontend/, modules/)', async () => {
    const companion = new WorkspaceCompanionAgent();
    await companion.activate();

    const sourceTreePaths = [
      'backend',
      'frontend',
      'modules',
      'scripts',
      'docs',
      'tests'
    ];

    const sourceTreeWrites = writeOperations.filter(op => {
      const normalizedPath = path.normalize(op.path);
      return sourceTreePaths.some(dir => {
        const fullPath = path.join(mockWorkspaceRoot, dir);
        return normalizedPath.startsWith(fullPath);
      });
    });

    if (sourceTreeWrites.length > 0) {
      console.error('SOURCE TREE WRITES DETECTED:');
      sourceTreeWrites.forEach(write => {
        console.error(`  - ${write.operation}: ${write.path}`);
      });
    }

    expect(sourceTreeWrites).toHaveLength(0);
  });

  test('No writes to QUARANTINE/', async () => {
    const companion = new WorkspaceCompanionAgent();
    await companion.activate();

    const quarantineWrites = writeOperations.filter(op => {
      const normalizedPath = path.normalize(op.path);
      const quarantinePath = path.join(mockWorkspaceRoot, 'QUARANTINE');
      return normalizedPath.startsWith(quarantinePath);
    });

    if (quarantineWrites.length > 0) {
      console.error('QUARANTINE WRITES DETECTED:');
      quarantineWrites.forEach(write => {
        console.error(`  - ${write.operation}: ${write.path}`);
      });
    }

    expect(quarantineWrites).toHaveLength(0);
  });

  test('No writes to root configuration files', async () => {
    const companion = new WorkspaceCompanionAgent();
    await companion.activate();

    const rootConfigFiles = [
      'package.json',
      'tsconfig.json',
      'jest.config.js',
      '.gitignore',
      '.env',
      'README.md',
      'CLAUDE.md'
    ];

    const rootConfigWrites = writeOperations.filter(op => {
      const normalizedPath = path.normalize(op.path);
      return rootConfigFiles.some(file => {
        const fullPath = path.join(mockWorkspaceRoot, file);
        return normalizedPath === fullPath;
      });
    });

    if (rootConfigWrites.length > 0) {
      console.error('ROOT CONFIG WRITES DETECTED:');
      rootConfigWrites.forEach(write => {
        console.error(`  - ${write.operation}: ${write.path}`);
      });
    }

    expect(rootConfigWrites).toHaveLength(0);
  });

  test('Context Pack integration respects write boundaries', async () => {
    const companion = new WorkspaceCompanionAgent();
    const contextPack = companion.getContextPack();

    // Update companion state (should only write to .terrafusion/context/latest.json)
    contextPack.updateCompanionState({
      status: 'active',
      capabilities: { total: 10, active: 10, aiPowered: 5 },
      lastAction: 'Test update',
      sessionDuration: 100
    });

    // Filter out directory creations
    const fileWrites = writeOperations.filter(op => op.operation !== 'mkdirSync');

    // All writes should be to Context Pack
    const nonContextPackWrites = fileWrites.filter(op =>
      !op.path.includes('latest.json') || !op.path.includes('.terrafusion')
    );

    expect(nonContextPackWrites).toHaveLength(0);
  });

  test('Verify only .terrafusion/context/latest.json is written during activation', async () => {
    const companion = new WorkspaceCompanionAgent();
    await companion.activate();

    // Get all non-directory writes
    const fileWrites = writeOperations.filter(op => op.operation !== 'mkdirSync');

    // Verify all writes are to the Context Pack file
    fileWrites.forEach(write => {
      const isContextPack = write.path.includes('.terrafusion') &&
                           write.path.includes('context') &&
                           write.path.includes('latest.json');

      if (!isContextPack) {
        console.error(`Unexpected write: ${write.operation} to ${write.path}`);
      }

      expect(isContextPack).toBe(true);
    });
  });

  test('Write operations summary report', async () => {
    const companion = new WorkspaceCompanionAgent();
    await companion.activate();

    // Generate summary report
    const summary = {
      totalOperations: writeOperations.length,
      fileWrites: writeOperations.filter(op => op.operation.includes('write')).length,
      dirCreations: writeOperations.filter(op => op.operation === 'mkdirSync').length,
      uniquePaths: [...new Set(writeOperations.map(op => op.path))],
      operations: writeOperations
    };

    console.log('\n=== WRITE OPERATIONS SUMMARY ===');
    console.log(`Total operations: ${summary.totalOperations}`);
    console.log(`File writes: ${summary.fileWrites}`);
    console.log(`Directory creations: ${summary.dirCreations}`);
    console.log(`Unique paths affected: ${summary.uniquePaths.length}`);
    console.log('\nAll write operations:');
    writeOperations.forEach(op => {
      console.log(`  - ${op.operation}: ${op.path}`);
    });
    console.log('================================\n');

    // All writes should be within .terrafusion
    const allWithinBoundary = summary.uniquePaths.every(p =>
      p.includes('.terrafusion') || isTerrafusionDirCreation(p)
    );

    expect(allWithinBoundary).toBe(true);
  });

  test('Multiple activate/deactivate cycles maintain boundaries', async () => {
    const companion = new WorkspaceCompanionAgent();

    for (let i = 0; i < 3; i++) {
      writeOperations = []; // Reset tracking

      await companion.activate();
      await companion.deactivate();

      const fileWrites = writeOperations.filter(op => op.operation !== 'mkdirSync');
      const invalidWrites = fileWrites.filter(op => !isAllowedPath(op.path));

      expect(invalidWrites).toHaveLength(0);
    }
  });

  test('Sandbox directory (.terrafusion/companion) writes are allowed', async () => {
    // Manually test that writes to companion sandbox would be allowed
    const testPaths = [
      path.join(mockWorkspaceRoot, '.terrafusion', 'companion', 'test.json'),
      path.join(mockWorkspaceRoot, '.terrafusion', 'companion', 'logs', 'session.log'),
      path.join(mockWorkspaceRoot, '.terrafusion', 'companion', 'cache', 'data.json')
    ];

    testPaths.forEach(testPath => {
      expect(isAllowedPath(testPath)).toBe(true);
    });
  });

  test('Writes outside .terrafusion are correctly rejected', async () => {
    const testPaths = [
      path.join(mockWorkspaceRoot, 'backend', 'test.json'),
      path.join(mockWorkspaceRoot, 'frontend', 'test.ts'),
      path.join(mockWorkspaceRoot, 'package.json'),
      path.join(mockWorkspaceRoot, 'QUARANTINE', 'test.md'),
      path.join(mockWorkspaceRoot, '.git', 'config')
    ];

    testPaths.forEach(testPath => {
      expect(isAllowedPath(testPath)).toBe(false);
    });
  });
});
