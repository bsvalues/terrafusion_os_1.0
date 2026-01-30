/**
 * Rerenders Scanner
 * Detects rerender hotspots and missing memoization
 * Rule: 3.1, 3.2 - Rerender Issues (MEDIUM)
 */

import { Finding, ScanContext, Scanner } from './types.js';

const RULE_ID_INLINE_OBJECT = 'rerender.inline-object';
const RULE_ID_INLINE_CALLBACK = 'rerender.inline-callback';
const SEVERITY = 'medium' as const;

export const rerendersScanner: Scanner = {
  name: 'rerenders',
  description: 'Detect rerender hotspots and missing memoization',
  
  scan(content: string, filePath: string, ctx: ScanContext): Finding[] {
    const findings: Finding[] = [];
    const lines = content.split('\n');
    
    // Only scan .tsx files (React components)
    if (!filePath.endsWith('.tsx')) {
      return findings;
    }
    
    // Skip test files
    if (filePath.includes('.test.') || filePath.includes('.spec.') || filePath.includes('__tests__')) {
      return findings;
    }
    
    // Check if file has list rendering (map)
    const hasListRendering = content.includes('.map(') && content.includes('<');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;
      
      // Skip comments
      if (line.trim().startsWith('//') || line.trim().startsWith('*')) continue;
      
      // Rule 3.1: Inline object props in JSX
      // Pattern: prop={{ ... }}
      const inlineObjectMatch = line.match(/(\w+)\s*=\s*\{\s*\{/);
      if (inlineObjectMatch) {
        const propName = inlineObjectMatch[1];
        
        // Skip common false positives
        if (['key', 'ref', 'style'].includes(propName)) continue;
        
        // Higher severity in list rendering
        const effectiveSeverity = hasListRendering ? SEVERITY : SEVERITY;
        
        findings.push({
          severity: effectiveSeverity,
          rule: RULE_ID_INLINE_OBJECT,
          file: filePath,
          lineStart: lineNum,
          lineEnd: lineNum,
          message: `Inline object prop '${propName}' creates new reference each render.`,
          snippet: line.trim(),
          suggestedFix: `const ${propName}Value = useMemo(() => ({ ... }), [deps]);\n<Component ${propName}={${propName}Value} />`
        });
      }
      
      // Rule 3.2: Inline arrow functions in JSX props
      // Pattern: onClick={() => ...} or onSomething={(e) => ...}
      const inlineCallbackMatch = line.match(/(on\w+)\s*=\s*\{\s*\(/);
      if (inlineCallbackMatch) {
        const eventName = inlineCallbackMatch[1];
        
        // In list rendering, this is more impactful
        if (hasListRendering) {
          // Check if we're inside a .map()
          const contextStart = Math.max(0, i - 5);
          const contextLines = lines.slice(contextStart, i + 1).join('\n');
          
          if (contextLines.includes('.map(')) {
            findings.push({
              severity: SEVERITY,
              rule: RULE_ID_INLINE_CALLBACK,
              file: filePath,
              lineStart: lineNum,
              lineEnd: lineNum,
              message: `Inline callback '${eventName}' in list render creates new function per item.`,
              snippet: line.trim(),
              suggestedFix: `const handle${eventName.slice(2)} = useCallback((id) => { ... }, [deps]);\n// Then: ${eventName}={() => handle${eventName.slice(2)}(item.id)}`
            });
          }
        }
      }
      
      // Check for array literals in props
      const inlineArrayMatch = line.match(/(\w+)\s*=\s*\{\s*\[/);
      if (inlineArrayMatch && !line.includes('useMemo') && !line.includes('useState')) {
        const propName = inlineArrayMatch[1];
        
        // Skip common false positives
        if (['children'].includes(propName)) continue;
        
        findings.push({
          severity: SEVERITY,
          rule: RULE_ID_INLINE_OBJECT,
          file: filePath,
          lineStart: lineNum,
          lineEnd: lineNum,
          message: `Inline array prop '${propName}' creates new reference each render.`,
          snippet: line.trim(),
          suggestedFix: `const ${propName}Value = useMemo(() => [...], [deps]);\n<Component ${propName}={${propName}Value} />`
        });
      }
    }
    
    return findings;
  }
};

export default rerendersScanner;
