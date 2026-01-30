/**
 * Waterfalls Scanner
 * Detects sequential await patterns that could be parallelized
 * Rule: 1.1 - Eliminate Async Waterfalls (CRITICAL)
 */

import { Finding, ScanContext, Scanner } from './types.js';

const RULE_ID = 'waterfall.parallelize';
const SEVERITY = 'critical' as const;

// Pattern: 3+ consecutive await statements
const CONSECUTIVE_AWAIT_PATTERN = /(?:^|\n)\s*(const|let|var)?\s*\w+\s*=\s*await\s+/g;

export const waterfallsScanner: Scanner = {
  name: 'waterfalls',
  description: 'Detect sequential awaits that could be parallelized',
  
  scan(content: string, filePath: string, ctx: ScanContext): Finding[] {
    const findings: Finding[] = [];
    const lines = content.split('\n');
    
    // Track consecutive await blocks
    let consecutiveAwaits: { line: number; text: string }[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;
      
      // Check if line contains an await statement
      if (/\bawait\s+/.test(line) && !line.trim().startsWith('//')) {
        consecutiveAwaits.push({ line: lineNum, text: line.trim() });
      } else if (line.trim() && !line.trim().startsWith('//') && !line.trim().startsWith('*')) {
        // Non-await line (excluding comments) breaks the chain
        if (consecutiveAwaits.length >= 3) {
          // Check if awaits appear independent (heuristic: no variable reuse)
          if (looksIndependent(consecutiveAwaits)) {
            const startLine = consecutiveAwaits[0].line;
            const endLine = consecutiveAwaits[consecutiveAwaits.length - 1].line;
            
            findings.push({
              severity: SEVERITY,
              rule: RULE_ID,
              file: filePath,
              lineStart: startLine,
              lineEnd: endLine,
              message: `${consecutiveAwaits.length} sequential awaits detected. Consider Promise.all() for independent operations.`,
              snippet: consecutiveAwaits.map(a => a.text).join('\n'),
              suggestedFix: `const [result1, result2, ...] = await Promise.all([\n  ${consecutiveAwaits.map(a => extractAwaitCall(a.text)).join(',\n  ')}\n]);`
            });
          }
        }
        consecutiveAwaits = [];
      }
    }
    
    // Check final block
    if (consecutiveAwaits.length >= 3 && looksIndependent(consecutiveAwaits)) {
      const startLine = consecutiveAwaits[0].line;
      const endLine = consecutiveAwaits[consecutiveAwaits.length - 1].line;
      
      findings.push({
        severity: SEVERITY,
        rule: RULE_ID,
        file: filePath,
        lineStart: startLine,
        lineEnd: endLine,
        message: `${consecutiveAwaits.length} sequential awaits detected. Consider Promise.all() for independent operations.`,
        snippet: consecutiveAwaits.map(a => a.text).join('\n'),
        suggestedFix: 'Use Promise.all() for parallel execution of independent async operations.'
      });
    }
    
    return findings;
  }
};

/**
 * Heuristic: Check if await statements look independent
 * (no variable from one used in another)
 */
function looksIndependent(awaits: { line: number; text: string }[]): boolean {
  const assignedVars: string[] = [];
  
  for (const a of awaits) {
    // Extract variable name if assignment
    const match = a.text.match(/(?:const|let|var)\s+(\w+)\s*=/);
    if (match) {
      assignedVars.push(match[1]);
    }
    
    // Check if any previously assigned var is used in this await
    for (const v of assignedVars.slice(0, -1)) {
      if (a.text.includes(v)) {
        return false; // Dependency detected
      }
    }
  }
  
  return true;
}

/**
 * Extract the await call from a line
 */
function extractAwaitCall(line: string): string {
  const match = line.match(/await\s+(.+?)(?:;?\s*$)/);
  return match ? match[1] : line;
}

export default waterfallsScanner;
