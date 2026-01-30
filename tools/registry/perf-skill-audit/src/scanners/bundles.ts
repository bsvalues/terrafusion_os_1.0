/**
 * Bundles Scanner
 * Detects barrel imports and bundle amplifiers
 * Rule: 1.2 - Bundle Size / Barrel Imports (CRITICAL)
 */

import { Finding, ScanContext, Scanner } from './types.js';

const RULE_ID_BARREL = 'bundle.barrel-import';
const RULE_ID_BARREL_EXPORT = 'bundle.barrel-file';
const SEVERITY = 'critical' as const;

// Pattern: Import from directory (implicit barrel)
const BARREL_IMPORT_PATTERN = /import\s+\{[^}]+\}\s+from\s+['"](@\/[^'"]+|\.\.?\/[^'"]+)(?<!\.(?:ts|tsx|js|jsx|json|css|scss))['"];?/g;

// Pattern: Index file with many re-exports
const REEXPORT_PATTERN = /export\s+(?:\*|\{[^}]+\})\s+from\s+['"]/g;

export const bundlesScanner: Scanner = {
  name: 'bundles',
  description: 'Detect barrel imports and bundle amplifiers',
  
  scan(content: string, filePath: string, ctx: ScanContext): Finding[] {
    const findings: Finding[] = [];
    const lines = content.split('\n');
    const isIndexFile = filePath.endsWith('index.ts') || filePath.endsWith('index.tsx');
    
    // Check for barrel exports in index files
    if (isIndexFile) {
      const reexports = content.match(REEXPORT_PATTERN) || [];
      
      if (reexports.length >= 5) {
        // Find first and last re-export lines
        let firstLine = 1;
        let lastLine = 1;
        
        for (let i = 0; i < lines.length; i++) {
          if (/export\s+(?:\*|\{[^}]+\})\s+from/.test(lines[i])) {
            if (firstLine === 1) firstLine = i + 1;
            lastLine = i + 1;
          }
        }
        
        findings.push({
          severity: SEVERITY,
          rule: RULE_ID_BARREL_EXPORT,
          file: filePath,
          lineStart: firstLine,
          lineEnd: lastLine,
          message: `Barrel file with ${reexports.length} re-exports. This forces bundlers to include all exports even when only one is used.`,
          snippet: `${reexports.length} export statements in index file`,
          suggestedFix: 'Consider direct imports from source files instead of re-exporting through index. Use path aliases for clean imports.'
        });
      }
    }
    
    // Check for barrel imports (imports from directories)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;
      
      // Skip comments
      if (line.trim().startsWith('//') || line.trim().startsWith('*')) continue;
      
      // Check for import from path that looks like a directory
      const importMatch = line.match(/import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/);
      if (importMatch) {
        const imports = importMatch[1];
        const path = importMatch[2];
        
        // Heuristic: Path ends in directory-like pattern (no extension)
        const looksLikeBarrel = (
          (path.startsWith('@/') || path.startsWith('./') || path.startsWith('../')) &&
          !path.match(/\.(ts|tsx|js|jsx|json|css|scss|mjs|cjs)$/) &&
          !path.includes('/index')
        );
        
        // Count imported items
        const importCount = imports.split(',').length;
        
        if (looksLikeBarrel && importCount >= 1) {
          // Higher confidence if importing from known component/util directories
          const isHighRisk = /\/(components|utils|hooks|lib|shared|ui)$/i.test(path);
          
          if (importCount >= 3 || isHighRisk) {
            findings.push({
              severity: SEVERITY,
              rule: RULE_ID_BARREL,
              file: filePath,
              lineStart: lineNum,
              lineEnd: lineNum,
              message: `Barrel import from '${path}' with ${importCount} items. May pull entire module tree.`,
              snippet: line.trim(),
              suggestedFix: `Import directly from source files:\nimport { X } from '${path}/X';`
            });
          }
        }
      }
    }
    
    return findings;
  }
};

export default bundlesScanner;
