/**
 * Unit tests for changed files classifier
 * Tests the classification logic for docs-only vs full CI runs
 *
 * @fileoverview Vitest unit tests for classifier logic
 */

import { describe, expect, it } from 'vitest';

// Classification types
type Classification = 'docs_only' | 'frontend_only' | 'backend_only' | 'ci_only' | 'mixed';

interface ClassificationResult {
  docsOnly: boolean;
  classification: Classification;
  changedFiles: string[];
  reason: string;
}

// Inline implementation for testing (mirrors the actual script logic)
const DOCS_PATTERNS = [
  /^.*\.md$/i, // Any markdown file
  /^docs\/.*/i, // docs/ directory
  /^\.github\/.*\.md$/i, // .github markdown files
  /^LICENSE(\..*)?$/i, // LICENSE files
  /^NOTICE(\..*)?$/i, // NOTICE files
  /^CHANGELOG(\..*)?$/i, // CHANGELOG files
  /^AUTHORS(\..*)?$/i, // AUTHORS files
  /^CONTRIBUTORS(\..*)?$/i, // CONTRIBUTORS files
];

// Files that look like docs but affect CI/build behavior
const NON_DOCS_PATTERNS = [
  /^\.github\/workflows\/.*/i, // Workflow files are NOT docs
  /^\.github\/actions\/.*/i, // Custom actions are NOT docs
];

// Patterns that force MIXED (affect everything)
const FORCE_MIXED_PATTERNS = [
  /^package\.json$/i,
  /^pnpm-lock\.yaml$/i,
  /^package-lock\.json$/i,
  /^yarn\.lock$/i,
  /^turbo\.json$/i,
  /^\.nvmrc$/i,
  /^\.node-version$/i,
  /^tsconfig\.json$/i,
  /^tsconfig\..*\.json$/i,
  /^\.eslintrc.*$/i,
  /^eslint\.config.*$/i,
  /^\.prettierrc.*$/i,
  /^vitest\.config.*$/i,
];

// Frontend patterns
const FRONTEND_PATTERNS = [
  /^frontend\/.*/i,
  /^native-shell\/ui\/.*/i,
  /^src\/.*\.(tsx?|jsx?|css|scss|less)$/i,
  /^public\/.*/i,
];

// Backend patterns
const BACKEND_PATTERNS = [
  /^backend\/.*/i,
  /^\.NET\/.*/i,
  /^.*\.cs$/i,
  /^.*\.csproj$/i,
  /^.*\.sln$/i,
  /^Directory\.Build\.props$/i,
  /^Directory\.Packages\.props$/i,
  /^nuget\.config$/i,
];

// CI patterns
const CI_PATTERNS = [
  /^\.github\/workflows\/.*/i,
  /^\.github\/actions\/.*/i,
  /^scripts\/ci\/.*/i,
  /^scripts\/governance\/.*/i,
  /^\.github\/.*\.ya?ml$/i,
];

function matchesAnyPattern(filePath: string, patterns: RegExp[]): boolean {
  return patterns.some(p => p.test(filePath));
}

function isDocsFile(filePath: string): boolean {
  if (matchesAnyPattern(filePath, NON_DOCS_PATTERNS)) return false;
  return matchesAnyPattern(filePath, DOCS_PATTERNS);
}

function isForceMixed(filePath: string): boolean {
  return matchesAnyPattern(filePath, FORCE_MIXED_PATTERNS);
}

function isFrontendFile(filePath: string): boolean {
  return matchesAnyPattern(filePath, FRONTEND_PATTERNS);
}

function isBackendFile(filePath: string): boolean {
  return matchesAnyPattern(filePath, BACKEND_PATTERNS);
}

function isCiFile(filePath: string): boolean {
  return matchesAnyPattern(filePath, CI_PATTERNS);
}

function classifyChangedFiles(files: string[]): ClassificationResult {
  if (files.length === 0) {
    return {
      docsOnly: false,
      classification: 'mixed',
      changedFiles: [],
      reason: 'No files changed - running full CI',
    };
  }

  // Check for force-mixed files first (lockfiles, root configs)
  const forceMixedFiles = files.filter(f => isForceMixed(f));
  if (forceMixedFiles.length > 0) {
    return {
      docsOnly: false,
      classification: 'mixed',
      changedFiles: files,
      reason: `Root config/lockfile changed: ${forceMixedFiles[0]}`,
    };
  }

  // Classify each file
  const docsFiles = files.filter(f => isDocsFile(f));
  const frontendFiles = files.filter(f => isFrontendFile(f));
  const backendFiles = files.filter(f => isBackendFile(f));
  const ciFiles = files.filter(f => isCiFile(f));

  // All files must fit exactly one category for non-mixed
  const classifiedCount =
    docsFiles.length + frontendFiles.length + backendFiles.length + ciFiles.length;
  const unclassifiedFiles = files.filter(
    f => !isDocsFile(f) && !isFrontendFile(f) && !isBackendFile(f) && !isCiFile(f)
  );

  // If any file is unclassified, fallback to mixed
  if (unclassifiedFiles.length > 0) {
    return {
      docsOnly: false,
      classification: 'mixed',
      changedFiles: files,
      reason: `Unknown file type: ${unclassifiedFiles[0]}`,
    };
  }

  // Determine classification based on what categories have files
  const hasDocs = docsFiles.length > 0;
  const hasFrontend = frontendFiles.length > 0;
  const hasBackend = backendFiles.length > 0;
  const hasCi = ciFiles.length > 0;

  const categoryCount = [hasDocs, hasFrontend, hasBackend, hasCi].filter(Boolean).length;

  // If multiple categories, it's mixed
  if (categoryCount > 1) {
    const categories = [];
    if (hasDocs) categories.push('docs');
    if (hasFrontend) categories.push('frontend');
    if (hasBackend) categories.push('backend');
    if (hasCi) categories.push('ci');
    return {
      docsOnly: false,
      classification: 'mixed',
      changedFiles: files,
      reason: `Multiple areas changed: ${categories.join(', ')}`,
    };
  }

  // Single category
  if (hasDocs) {
    return {
      docsOnly: true,
      classification: 'docs_only',
      changedFiles: files,
      reason: 'All changed files match docs patterns',
    };
  }

  if (hasFrontend) {
    return {
      docsOnly: false,
      classification: 'frontend_only',
      changedFiles: files,
      reason: 'All changed files are frontend-only',
    };
  }

  if (hasBackend) {
    return {
      docsOnly: false,
      classification: 'backend_only',
      changedFiles: files,
      reason: 'All changed files are backend-only',
    };
  }

  if (hasCi) {
    return {
      docsOnly: false,
      classification: 'ci_only',
      changedFiles: files,
      reason: 'All changed files are CI-only',
    };
  }

  // Fallback (should not be reached)
  return {
    docsOnly: false,
    classification: 'mixed',
    changedFiles: files,
    reason: 'Fallback to mixed',
  };
}

describe('isDocsFile', () => {
  it('recognizes markdown files as docs', () => {
    expect(isDocsFile('README.md')).toBe(true);
    expect(isDocsFile('CHANGELOG.md')).toBe(true);
    expect(isDocsFile('docs/guide.md')).toBe(true);
    expect(isDocsFile('some/deep/path/file.md')).toBe(true);
  });

  it('recognizes docs/ directory files as docs', () => {
    expect(isDocsFile('docs/guide.md')).toBe(true);
    expect(isDocsFile('docs/api/reference.md')).toBe(true);
    expect(isDocsFile('docs/images/logo.png')).toBe(true); // Images in docs/ are docs
  });

  it('recognizes .github markdown files as docs', () => {
    expect(isDocsFile('.github/CONTRIBUTING.md')).toBe(true);
    expect(isDocsFile('.github/ISSUE_TEMPLATE.md')).toBe(true);
    expect(isDocsFile('.github/PULL_REQUEST_TEMPLATE.md')).toBe(true);
  });

  it('recognizes LICENSE/NOTICE files as docs', () => {
    expect(isDocsFile('LICENSE')).toBe(true);
    expect(isDocsFile('LICENSE.md')).toBe(true);
    expect(isDocsFile('LICENSE.txt')).toBe(true);
    expect(isDocsFile('NOTICE')).toBe(true);
    expect(isDocsFile('NOTICE.md')).toBe(true);
  });

  it('does NOT recognize workflow files as docs', () => {
    expect(isDocsFile('.github/workflows/ci.yml')).toBe(false);
    expect(isDocsFile('.github/workflows/release.yml')).toBe(false);
  });

  it('does NOT recognize custom actions as docs', () => {
    expect(isDocsFile('.github/actions/setup/action.yml')).toBe(false);
  });

  it('does NOT recognize code files as docs', () => {
    expect(isDocsFile('src/index.ts')).toBe(false);
    expect(isDocsFile('backend/Program.cs')).toBe(false);
    expect(isDocsFile('package.json')).toBe(false);
    expect(isDocsFile('tsconfig.json')).toBe(false);
  });

  it('is case-insensitive for extensions', () => {
    expect(isDocsFile('README.MD')).toBe(true);
    expect(isDocsFile('readme.Md')).toBe(true);
  });
});

describe('isForceMixed', () => {
  it('recognizes lockfiles as force-mixed', () => {
    expect(isForceMixed('pnpm-lock.yaml')).toBe(true);
    expect(isForceMixed('package-lock.json')).toBe(true);
    expect(isForceMixed('yarn.lock')).toBe(true);
  });

  it('recognizes package.json as force-mixed', () => {
    expect(isForceMixed('package.json')).toBe(true);
  });

  it('recognizes root config files as force-mixed', () => {
    expect(isForceMixed('turbo.json')).toBe(true);
    expect(isForceMixed('tsconfig.json')).toBe(true);
    expect(isForceMixed('.eslintrc.js')).toBe(true);
    expect(isForceMixed('eslint.config.js')).toBe(true);
    expect(isForceMixed('vitest.config.ts')).toBe(true);
  });

  it('does NOT recognize nested package.json as force-mixed', () => {
    expect(isForceMixed('frontend/package.json')).toBe(false);
    expect(isForceMixed('backend/package.json')).toBe(false);
  });
});

describe('isFrontendFile', () => {
  it('recognizes frontend directory files', () => {
    expect(isFrontendFile('frontend/src/App.tsx')).toBe(true);
    expect(isFrontendFile('frontend/components/Button.tsx')).toBe(true);
  });

  it('recognizes native-shell/ui files', () => {
    expect(isFrontendFile('native-shell/ui/index.html')).toBe(true);
  });

  it('recognizes src TypeScript/React files', () => {
    expect(isFrontendFile('src/App.tsx')).toBe(true);
    expect(isFrontendFile('src/components/Header.jsx')).toBe(true);
    expect(isFrontendFile('src/styles/main.css')).toBe(true);
  });
});

describe('isBackendFile', () => {
  it('recognizes backend directory files', () => {
    expect(isBackendFile('backend/src/TerraFusion.API/Program.cs')).toBe(true);
    expect(isBackendFile('backend/TerraFusion.sln')).toBe(true);
  });

  it('recognizes C# files', () => {
    expect(isBackendFile('SomeService.cs')).toBe(true);
    expect(isBackendFile('Project.csproj')).toBe(true);
  });

  it('recognizes .NET config files', () => {
    expect(isBackendFile('Directory.Build.props')).toBe(true);
    expect(isBackendFile('Directory.Packages.props')).toBe(true);
    expect(isBackendFile('nuget.config')).toBe(true);
  });
});

describe('isCiFile', () => {
  it('recognizes workflow files', () => {
    expect(isCiFile('.github/workflows/ci.yml')).toBe(true);
    expect(isCiFile('.github/workflows/release.yaml')).toBe(true);
  });

  it('recognizes scripts/ci files', () => {
    expect(isCiFile('scripts/ci/ci_telemetry.mjs')).toBe(true);
    expect(isCiFile('scripts/ci/run_with_log.mjs')).toBe(true);
  });

  it('recognizes scripts/governance files', () => {
    expect(isCiFile('scripts/governance/warningsGate.mjs')).toBe(true);
  });

  it('recognizes .github YAML files', () => {
    expect(isCiFile('.github/dependabot.yml')).toBe(true);
  });
});

describe('classifyChangedFiles - classification output', () => {
  it('returns classification=docs_only for markdown-only changes', () => {
    const result = classifyChangedFiles(['README.md', 'CHANGELOG.md', 'docs/guide.md']);
    expect(result.classification).toBe('docs_only');
    expect(result.docsOnly).toBe(true);
  });

  it('returns classification=frontend_only for frontend-only changes', () => {
    const result = classifyChangedFiles(['frontend/src/App.tsx', 'frontend/components/Button.tsx']);
    expect(result.classification).toBe('frontend_only');
    expect(result.docsOnly).toBe(false);
  });

  it('returns classification=backend_only for backend-only changes', () => {
    const result = classifyChangedFiles([
      'backend/src/TerraFusion.API/Program.cs',
      'backend/TerraFusion.sln',
    ]);
    expect(result.classification).toBe('backend_only');
    expect(result.docsOnly).toBe(false);
  });

  it('returns classification=ci_only for CI-only changes', () => {
    const result = classifyChangedFiles([
      '.github/workflows/ci.yml',
      'scripts/ci/ci_telemetry.mjs',
    ]);
    expect(result.classification).toBe('ci_only');
    expect(result.docsOnly).toBe(false);
  });

  it('returns classification=mixed for lockfile changes', () => {
    const result = classifyChangedFiles(['pnpm-lock.yaml', 'README.md']);
    expect(result.classification).toBe('mixed');
    expect(result.reason).toContain('pnpm-lock.yaml');
  });

  it('returns classification=mixed for package.json changes', () => {
    const result = classifyChangedFiles(['package.json', 'README.md']);
    expect(result.classification).toBe('mixed');
    expect(result.reason).toContain('package.json');
  });

  it('returns classification=mixed for frontend+backend changes', () => {
    const result = classifyChangedFiles(['frontend/src/App.tsx', 'backend/Program.cs']);
    expect(result.classification).toBe('mixed');
    expect(result.reason).toContain('Multiple areas');
  });

  it('returns classification=mixed for unknown file types', () => {
    const result = classifyChangedFiles(['some/random/file.xyz']);
    expect(result.classification).toBe('mixed');
    expect(result.reason).toContain('Unknown');
  });

  it('returns classification=mixed for empty file list', () => {
    const result = classifyChangedFiles([]);
    expect(result.classification).toBe('mixed');
    expect(result.docsOnly).toBe(false);
  });
});

describe('classifyChangedFiles - backwards compatibility', () => {
  it('returns docsOnly=true for markdown-only changes', () => {
    const result = classifyChangedFiles(['README.md', 'CHANGELOG.md', 'docs/guide.md']);
    expect(result.docsOnly).toBe(true);
    expect(result.reason).toContain('docs patterns');
  });

  it('returns docsOnly=false for mixed changes', () => {
    const result = classifyChangedFiles(['README.md', 'src/index.ts']);
    expect(result.docsOnly).toBe(false);
  });

  it('returns docsOnly=false for code-only changes', () => {
    const result = classifyChangedFiles(['frontend/src/index.ts', 'frontend/package.json']);
    expect(result.docsOnly).toBe(false);
  });

  it('returns docsOnly=false for workflow changes', () => {
    const result = classifyChangedFiles(['README.md', '.github/workflows/ci.yml']);
    expect(result.docsOnly).toBe(false);
  });

  it('includes all changed files in result', () => {
    const files = ['README.md', 'frontend/src/index.ts', 'docs/api.md'];
    const result = classifyChangedFiles(files);
    expect(result.changedFiles).toEqual(files);
  });

  it('handles deeply nested docs paths', () => {
    const result = classifyChangedFiles([
      'docs/api/v1/endpoints/users.md',
      'docs/tutorials/getting-started/step1.md',
    ]);
    expect(result.docsOnly).toBe(true);
    expect(result.classification).toBe('docs_only');
  });

  it('handles .github markdown templates', () => {
    const result = classifyChangedFiles([
      '.github/CONTRIBUTING.md',
      '.github/CODE_OF_CONDUCT.md',
      '.github/SECURITY.md',
    ]);
    expect(result.docsOnly).toBe(true);
    expect(result.classification).toBe('docs_only');
  });
});
