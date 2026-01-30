/**
 * Client Boundary Scanner
 * Detects server/client boundary friction
 * Rule: 2.1, 2.2 - Client Boundary Issues (HIGH)
 */

import { Finding, ScanContext, Scanner } from './types.js';

const RULE_ID_BOUNDARY = 'boundary.serialization';
const RULE_ID_CASCADE = 'boundary.client-cascade';
const SEVERITY = 'high' as const;

export const clientBoundaryScanner: Scanner = {
  name: 'client-boundary',
  description: 'Detect server/client boundary friction',
  
  scan(content: string, filePath: string, ctx: ScanContext): Finding[] {
    const findings: Finding[] = [];
    const lines = content.split('\n');
    
    // Only scan .tsx files (React components)
    if (!filePath.endsWith('.tsx')) {
      return findings;
    }
    
    const hasUseClient = content.includes("'use client'") || content.includes('"use client"');
    const hasUseServer = content.includes("'use server'") || content.includes('"use server"');
    
    // Rule 2.2: Check for 'use client' at page/route level
    if (hasUseClient) {
      const isRouteLevelFile = (
        filePath.includes('/app/') && 
        (filePath.endsWith('/page.tsx') || 
         filePath.endsWith('/layout.tsx') ||
         filePath.includes('/routes/'))
      );
      
      if (isRouteLevelFile) {
        const useClientLine = lines.findIndex(l => 
          l.includes("'use client'") || l.includes('"use client"')
        ) + 1;
        
        findings.push({
          severity: SEVERITY,
          rule: RULE_ID_CASCADE,
          file: filePath,
          lineStart: useClientLine,
          lineEnd: useClientLine,
          message: "'use client' at route level forces entire subtree to be client-rendered.",
          snippet: lines[useClientLine - 1]?.trim() || "'use client'",
          suggestedFix: 'Move client interactivity to leaf components. Keep pages as server components for better performance.'
        });
      }
    }
    
    // Rule 2.1: Check for spread props crossing boundary
    if (hasUseClient) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNum = i + 1;
        
        // Look for spread operator in props
        if (line.includes('{...') && line.includes('props')) {
          findings.push({
            severity: SEVERITY,
            rule: RULE_ID_BOUNDARY,
            file: filePath,
            lineStart: lineNum,
            lineEnd: lineNum,
            message: 'Spread props in client component may serialize unintended server data.',
            snippet: line.trim(),
            suggestedFix: 'Explicitly destructure only needed props to minimize serialization payload.'
          });
        }
        
        // Look for large data prop patterns
        const dataPropsMatch = line.match(/\b(data|items|records|rows|list|results)\s*=\s*\{/);
        if (dataPropsMatch && !line.includes('useMemo') && !line.includes('useState')) {
          // Check if this looks like a component prop
          if (line.includes('<') || lines[i - 1]?.includes('<')) {
            findings.push({
              severity: SEVERITY,
              rule: RULE_ID_BOUNDARY,
              file: filePath,
              lineStart: lineNum,
              lineEnd: lineNum,
              message: `Prop '${dataPropsMatch[1]}' may pass large data across client boundary.`,
              snippet: line.trim(),
              suggestedFix: 'Consider: 1) Fetch data on client with SWR/React Query, 2) Paginate server data, 3) Use minimal DTOs.'
            });
          }
        }
      }
    }
    
    return findings;
  }
};

export default clientBoundaryScanner;
