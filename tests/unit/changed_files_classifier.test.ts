/**
 * Unit tests for changed files classifier
 * Tests the classification logic for docs-only vs full CI runs
 *
 * @fileoverview Vitest unit tests for classifier logic
 */

import { describe, expect, it } from 'vitest';

// Define the classifier types (will be exported from the main script)
interface ClassificationResult {
  docsOnly: boolean;
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

function isDocsFile(filePath: string): boolean {
  // First check if it matches non-docs patterns (exceptions)
  for (const pattern of NON_DOCS_PATTERNS) {
    if (pattern.test(filePath)) {
      return false;
    }
  }

  // Then check if it matches docs patterns
  for (const pattern of DOCS_PATTERNS) {
    if (pattern.test(filePath)) {
      return true;
    }
  }

  return false;
}

function classifyChangedFiles(files: string[]): ClassificationResult {
  if (files.length === 0) {
    return {
      docsOnly: false,
      changedFiles: [],
      reason: 'No files changed - running full CI',
    };
  }

  const nonDocFiles = files.filter(f => !isDocsFile(f));

  if (nonDocFiles.length === 0) {
    return {
      docsOnly: true,
      changedFiles: files,
      reason: 'All changed files match docs patterns',
    };
  }

  return {
    docsOnly: false,
    changedFiles: files,
    reason: `Non-docs file: ${nonDocFiles[0]}`,
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

describe('classifyChangedFiles', () => {
  it('returns docsOnly=true for markdown-only changes', () => {
    const result = classifyChangedFiles(['README.md', 'CHANGELOG.md', 'docs/guide.md']);
    expect(result.docsOnly).toBe(true);
    expect(result.reason).toContain('docs patterns');
  });

  it('returns docsOnly=false for mixed changes', () => {
    const result = classifyChangedFiles(['README.md', 'src/index.ts']);
    expect(result.docsOnly).toBe(false);
    expect(result.reason).toContain('src/index.ts');
  });

  it('returns docsOnly=false for code-only changes', () => {
    const result = classifyChangedFiles(['src/index.ts', 'package.json']);
    expect(result.docsOnly).toBe(false);
  });

  it('returns docsOnly=false for workflow changes', () => {
    const result = classifyChangedFiles(['README.md', '.github/workflows/ci.yml']);
    expect(result.docsOnly).toBe(false);
    expect(result.reason).toContain('.github/workflows/ci.yml');
  });

  it('returns docsOnly=false for empty file list', () => {
    const result = classifyChangedFiles([]);
    expect(result.docsOnly).toBe(false);
    expect(result.reason).toContain('No files');
  });

  it('includes all changed files in result', () => {
    const files = ['README.md', 'src/index.ts', 'docs/api.md'];
    const result = classifyChangedFiles(files);
    expect(result.changedFiles).toEqual(files);
  });

  it('mentions first non-docs file in reason', () => {
    const result = classifyChangedFiles(['docs/a.md', 'src/first.ts', 'src/second.ts']);
    expect(result.reason).toContain('src/first.ts');
    expect(result.reason).not.toContain('src/second.ts');
  });

  it('handles deeply nested docs paths', () => {
    const result = classifyChangedFiles([
      'docs/api/v1/endpoints/users.md',
      'docs/tutorials/getting-started/step1.md',
    ]);
    expect(result.docsOnly).toBe(true);
  });

  it('handles .github markdown templates', () => {
    const result = classifyChangedFiles([
      '.github/CONTRIBUTING.md',
      '.github/CODE_OF_CONDUCT.md',
      '.github/SECURITY.md',
    ]);
    expect(result.docsOnly).toBe(true);
  });
});
