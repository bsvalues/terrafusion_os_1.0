import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..', '..', '..');

const RUNTIME_TARGETS = [
  'backend/src/TerraFusion.API/Controllers/ForgeController.cs',
  'backend/src/TerraFusion.API/Controllers/TerraForgeController.cs',
  'backend/src/TerraFusion.API/Controllers/CostForgeController.cs',
  'backend/src/TerraFusion.API/Services/ValuationService.cs',
  'backend/src/TerraFusion.Core/Interfaces/IValuationService.cs',
  'backend/src/TerraFusion.Core/DTOs/ForgeValuationDtos.cs',
  'frontend/apps/os-shell/src/hooks/forge',
  'frontend/apps/os-shell/src/pages/forge',
  'frontend/apps/os-shell/src/services/forge',
  'frontend/apps/os-shell/src/pages/workbench/tabs/forge',
  'frontend/apps/os-shell/src/pages/workbench/tabs/PropertyForge.tsx',
];

const SOURCE_EXTENSIONS = new Set(['.cs', '.ts', '.tsx', '.js', '.jsx', '.mjs']);
const FORBIDDEN_PATTERNS = [
  /\bPacs\b/,
  /\bPacs[A-Za-z0-9_]*/,
  /\bPACS\b/,
  /pacs_/,
];

function isRuntimeSource(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  return (
    SOURCE_EXTENSIONS.has(extname(filePath)) &&
    !normalized.includes('/__tests__/') &&
    !normalized.includes('/test/') &&
    !normalized.includes('/tests/')
  );
}

function collectFiles(target) {
  const absolute = resolve(ROOT, target);
  if (!existsSync(absolute)) return [];

  const info = statSync(absolute);
  if (info.isFile()) {
    return isRuntimeSource(absolute) ? [absolute] : [];
  }

  const files = [];
  for (const entry of readdirSync(absolute, { withFileTypes: true })) {
    const child = join(absolute, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(child));
    } else if (isRuntimeSource(child)) {
      files.push(child);
    }
  }

  return files;
}

function findForbiddenRuntimeReferences() {
  const files = RUNTIME_TARGETS.flatMap(collectFiles);
  const violations = [];

  for (const file of files) {
    const lines = readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, index) => {
      if (FORBIDDEN_PATTERNS.some(pattern => pattern.test(line))) {
        violations.push({
          file: file.replace(ROOT + '\\', '').replace(ROOT + '/', ''),
          line: index + 1,
          text: line.trim(),
        });
      }
    });
  }

  return violations;
}

describe('Forge runtime PACS boundary', () => {
  it('keeps PACS out of Workbench and TerraForge runtime code paths', () => {
    const violations = findForbiddenRuntimeReferences();
    assert.equal(
      violations.length,
      0,
      [
        'PACS is source/provenance/sync only and must not be a Forge runtime dependency.',
        'Forbidden runtime references:',
        ...violations.map(v => `${v.file}:${v.line} ${v.text}`),
      ].join('\n'),
    );
  });
});
