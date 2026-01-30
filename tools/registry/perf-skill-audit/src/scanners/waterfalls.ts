/**
 * Waterfalls Scanner v2
 * 
 * Detects sequential await patterns that could be parallelized.
 * Rule: 1.1 - Eliminate Async Waterfalls (CRITICAL)
 * 
 * v2 Enhancements:
 * - Function-level grouping (scope-aware)
 * - Dependency-aware classification (safe-parallel vs dependent)
 * - Batch boundary detection (repeated service calls)
 * - Shell weighting (priority boost for core/pilot paths)
 * - Known-safe pattern suppression (loops, retries, pragmas)
 */

import { Finding, ScanContext, Scanner, WaterfallKind, EvidenceItem } from './types.js';

const RULE_ID = 'waterfall.parallelize';
const SEVERITY = 'critical' as const;

// Shell/pilot paths get priority boost
const HIGH_PRIORITY_PATHS = [
  'os-platform/core/pilot',
  'os-platform/core/types',
  'tools/registry',
  'frontend-v2/shell',
  '/ipc/',
  '/bridge/',
  'moduleLoader',
  'toolRegistry',
];

// Pragma to suppress waterfall detection
const IGNORE_PRAGMA = 'perf-skill:ignore-waterfall';

// Common batch-able service patterns
const BATCH_SERVICE_PATTERNS = [
  /fetch\s*\(/,
  /axios\.[a-z]+\s*\(/,
  /\.invoke\s*\(/,
  /\.get\s*\(/,
  /\.query\s*\(/,
  /toolRegistry\./,
  /ipc\./,
  /api\./,
  /client\./,
];

interface AwaitSite {
  line: number;
  text: string;
  varName?: string;
  callTarget?: string;  // Function/method being called
  inLoop: boolean;
  inTryCatch: boolean;
  hasPragma: boolean;
}

interface FunctionScope {
  name: string;
  startLine: number;
  endLine: number;
  awaits: AwaitSite[];
}

export const waterfallsScanner: Scanner = {
  name: 'waterfalls',
  description: 'Detect sequential awaits that could be parallelized (v2: scope-aware)',
  
  scan(content: string, filePath: string, ctx: ScanContext): Finding[] {
    const findings: Finding[] = [];
    const lines = content.split('\n');
    
    // Extract function scopes
    const scopes = extractFunctionScopes(lines);
    
    // Analyze each function scope
    for (const scope of scopes) {
      const scopeFindings = analyzeScope(scope, filePath, lines);
      findings.push(...scopeFindings);
    }
    
    // Also check top-level (module scope) awaits
    const topLevelAwaits = extractTopLevelAwaits(lines, scopes);
    if (topLevelAwaits.length >= 3) {
      const topLevelScope: FunctionScope = {
        name: '<module>',
        startLine: 1,
        endLine: lines.length,
        awaits: topLevelAwaits,
      };
      const topLevelFindings = analyzeScope(topLevelScope, filePath, lines);
      findings.push(...topLevelFindings);
    }
    
    return findings;
  }
};

/**
 * Extract function/method scopes from source
 * Uses simple brace-matching heuristic (no AST required)
 */
function extractFunctionScopes(lines: string[]): FunctionScope[] {
  const scopes: FunctionScope[] = [];
  const scopeStack: { name: string; startLine: number; braceDepth: number }[] = [];
  let globalBraceDepth = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    
    // Detect function declarations
    const funcMatch = line.match(
      /(?:async\s+)?(?:function\s+(\w+)|(\w+)\s*[=:]\s*(?:async\s+)?(?:\([^)]*\)|[a-zA-Z_]\w*)\s*=>|(\w+)\s*\([^)]*\)\s*(?::\s*\S+)?\s*\{)/
    );
    
    if (funcMatch) {
      const name = funcMatch[1] || funcMatch[2] || funcMatch[3] || 'anonymous';
      scopeStack.push({ name, startLine: lineNum, braceDepth: globalBraceDepth });
    }
    
    // Track brace depth
    const openBraces = (line.match(/\{/g) || []).length;
    const closeBraces = (line.match(/\}/g) || []).length;
    globalBraceDepth += openBraces - closeBraces;
    
    // Check if any scope has ended
    while (scopeStack.length > 0) {
      const currentScope = scopeStack[scopeStack.length - 1];
      if (globalBraceDepth <= currentScope.braceDepth) {
        // Scope ended
        const finishedScope = scopeStack.pop()!;
        scopes.push({
          name: finishedScope.name,
          startLine: finishedScope.startLine,
          endLine: lineNum,
          awaits: [],
        });
      } else {
        break;
      }
    }
  }
  
  // Extract awaits for each scope
  for (const scope of scopes) {
    scope.awaits = extractAwaitsInRange(lines, scope.startLine, scope.endLine);
  }
  
  return scopes.filter(s => s.awaits.length >= 2);
}

/**
 * Extract await sites within a line range
 */
function extractAwaitsInRange(lines: string[], startLine: number, endLine: number): AwaitSite[] {
  const awaits: AwaitSite[] = [];
  let inLoop = false;
  let loopDepth = 0;
  let inTryCatch = false;
  let tryDepth = 0;
  
  for (let i = startLine - 1; i < endLine && i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    const trimmed = line.trim();
    
    // Track loop state
    if (/\b(for|while|do)\s*[(\{]/.test(line)) {
      inLoop = true;
      loopDepth++;
    }
    if (inLoop && line.includes('}')) {
      loopDepth = Math.max(0, loopDepth - (line.match(/\}/g) || []).length);
      if (loopDepth === 0) inLoop = false;
    }
    
    // Track try/catch state
    if (/\btry\s*\{/.test(line)) {
      inTryCatch = true;
      tryDepth++;
    }
    if (inTryCatch && /\bcatch\s*\(/.test(line)) {
      // Still in try block context
    }
    if (inTryCatch && line.includes('}')) {
      const closeBraces = (line.match(/\}/g) || []).length;
      tryDepth = Math.max(0, tryDepth - closeBraces);
      if (tryDepth === 0) inTryCatch = false;
    }
    
    // Check for pragma (current line or previous line)
    const prevLine = i > 0 ? lines[i - 1] : '';
    const hasPragma = line.includes(IGNORE_PRAGMA) || prevLine.includes(IGNORE_PRAGMA);
    
    // Skip comments
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue;
    
    // Detect await
    if (/\bawait\s+/.test(line)) {
      // Extract variable name if assignment
      const varMatch = line.match(/(?:const|let|var)\s+(\w+)\s*=/);
      const varName = varMatch ? varMatch[1] : undefined;
      
      // Extract call target
      const callMatch = line.match(/await\s+(\w+(?:\.\w+)?)\s*\(/);
      const callTarget = callMatch ? callMatch[1] : undefined;
      
      awaits.push({
        line: lineNum,
        text: trimmed,
        varName,
        callTarget,
        inLoop,
        inTryCatch,
        hasPragma,
      });
    }
  }
  
  return awaits;
}

/**
 * Extract top-level awaits not inside any function
 */
function extractTopLevelAwaits(lines: string[], scopes: FunctionScope[]): AwaitSite[] {
  const awaits: AwaitSite[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i];
    
    // Skip if inside any function scope
    const insideScope = scopes.some(s => lineNum >= s.startLine && lineNum <= s.endLine);
    if (insideScope) continue;
    
    // Check for await
    if (/\bawait\s+/.test(line) && !line.trim().startsWith('//')) {
      const varMatch = line.match(/(?:const|let|var)\s+(\w+)\s*=/);
      const callMatch = line.match(/await\s+(\w+(?:\.\w+)?)\s*\(/);
      
      awaits.push({
        line: lineNum,
        text: line.trim(),
        varName: varMatch ? varMatch[1] : undefined,
        callTarget: callMatch ? callMatch[1] : undefined,
        inLoop: false,
        inTryCatch: false,
        hasPragma: line.includes(IGNORE_PRAGMA),
      });
    }
  }
  
  return awaits;
}

/**
 * Analyze a function scope for waterfall issues
 */
function analyzeScope(scope: FunctionScope, filePath: string, lines: string[]): Finding[] {
  const findings: Finding[] = [];
  const { awaits, name: functionName } = scope;
  
  // Filter out pragma-suppressed awaits
  const activeAwaits = awaits.filter(a => !a.hasPragma);
  if (activeAwaits.length < 2) return findings;
  
  // Group consecutive awaits
  const groups = groupConsecutiveAwaits(activeAwaits);
  
  for (const group of groups) {
    if (group.length < 2) continue;
    
    // Classify the waterfall
    const classification = classifyWaterfall(group);
    
    // Skip known-safe patterns unless they're batch candidates
    if (classification.kind === 'loop-seq' || classification.kind === 'retry-seq') {
      if (!isBatchCandidate(group)) continue;
    }
    
    // Calculate priority score
    const priorityScore = calculatePriorityScore(filePath, group, classification.kind);
    
    // Build evidence
    const evidence: EvidenceItem[] = group.map(a => ({
      line: a.line,
      snippet: a.text,
      varName: a.varName,
    }));
    
    // Generate finding
    const finding = buildFinding(
      filePath,
      functionName,
      group,
      classification,
      priorityScore,
      evidence
    );
    
    findings.push(finding);
  }
  
  return findings;
}

/**
 * Group awaits that are consecutive (with optional empty/comment lines between)
 */
function groupConsecutiveAwaits(awaits: AwaitSite[]): AwaitSite[][] {
  const groups: AwaitSite[][] = [];
  let currentGroup: AwaitSite[] = [];
  
  for (let i = 0; i < awaits.length; i++) {
    const current = awaits[i];
    const prev = awaits[i - 1];
    
    if (prev && current.line - prev.line > 3) {
      // Gap too large, start new group
      if (currentGroup.length >= 2) {
        groups.push(currentGroup);
      }
      currentGroup = [current];
    } else {
      currentGroup.push(current);
    }
  }
  
  if (currentGroup.length >= 2) {
    groups.push(currentGroup);
  }
  
  return groups;
}

/**
 * Classify a waterfall group
 */
function classifyWaterfall(group: AwaitSite[]): { kind: WaterfallKind; reason: string } {
  // Check for loop-based sequential
  if (group.some(a => a.inLoop)) {
    return { kind: 'loop-seq', reason: 'Sequential awaits in loop (may be intentional)' };
  }
  
  // Check for try/catch retry pattern
  if (group.some(a => a.inTryCatch)) {
    return { kind: 'retry-seq', reason: 'Sequential awaits in try/catch (retry pattern)' };
  }
  
  // Check for data dependencies
  const assignedVars: string[] = [];
  for (const a of group) {
    // Check if this await uses a previously assigned variable
    for (const v of assignedVars) {
      if (a.text.includes(v)) {
        return { kind: 'dependent', reason: `Data dependency: ${v} used across awaits` };
      }
    }
    if (a.varName) {
      assignedVars.push(a.varName);
    }
  }
  
  // Check for batch candidate (same service called multiple times)
  if (isBatchCandidate(group)) {
    return { kind: 'batch-candidate', reason: 'Same service/endpoint called multiple times' };
  }
  
  // Default: safe to parallelize
  return { kind: 'safe-parallel', reason: 'Independent operations, safe for Promise.all()' };
}

/**
 * Check if group is a batch aggregation candidate
 */
function isBatchCandidate(group: AwaitSite[]): boolean {
  if (group.length < 2) return false;
  
  // Check if same call target appears multiple times
  const callTargets = group.map(a => a.callTarget).filter(Boolean);
  const targetCounts = new Map<string, number>();
  
  for (const target of callTargets) {
    targetCounts.set(target!, (targetCounts.get(target!) || 0) + 1);
  }
  
  // Any target called 2+ times is a batch candidate
  for (const count of targetCounts.values()) {
    if (count >= 2) return true;
  }
  
  // Check for common batch patterns
  for (const a of group) {
    for (const pattern of BATCH_SERVICE_PATTERNS) {
      if (pattern.test(a.text)) {
        const matches = group.filter(g => pattern.test(g.text));
        if (matches.length >= 2) return true;
      }
    }
  }
  
  return false;
}

/**
 * Calculate priority score (0-100)
 */
function calculatePriorityScore(
  filePath: string, 
  group: AwaitSite[], 
  kind: WaterfallKind
): number {
  let score = 50; // Base score
  
  // Shell/pilot path boost (+30)
  if (HIGH_PRIORITY_PATHS.some(p => filePath.includes(p))) {
    score += 30;
  }
  
  // Batch candidate boost (+15)
  if (kind === 'batch-candidate') {
    score += 15;
  }
  
  // Safe parallel boost (+10)
  if (kind === 'safe-parallel') {
    score += 10;
  }
  
  // More awaits = higher impact (+5 per await beyond 2)
  score += Math.min(20, (group.length - 2) * 5);
  
  // Dependent/loop/retry penalty (-20)
  if (kind === 'dependent' || kind === 'loop-seq' || kind === 'retry-seq') {
    score -= 20;
  }
  
  return Math.min(100, Math.max(0, score));
}

/**
 * Build the finding object
 */
function buildFinding(
  filePath: string,
  functionName: string,
  group: AwaitSite[],
  classification: { kind: WaterfallKind; reason: string },
  priorityScore: number,
  evidence: EvidenceItem[]
): Finding {
  const startLine = group[0].line;
  const endLine = group[group.length - 1].line;
  
  let message = `${group.length} sequential awaits in \`${functionName}\`: ${classification.reason}`;
  let suggestedFix: string;
  
  switch (classification.kind) {
    case 'safe-parallel':
      suggestedFix = generatePromiseAllFix(group);
      break;
    case 'batch-candidate':
      suggestedFix = `Batch these into a single API call or use Promise.all():\n${generatePromiseAllFix(group)}`;
      break;
    case 'dependent':
      suggestedFix = 'Review data dependencies. If independent, extract to separate functions and parallelize.';
      break;
    case 'loop-seq':
      suggestedFix = 'Consider: const results = await Promise.all(items.map(item => fetchItem(item)));';
      break;
    case 'retry-seq':
      suggestedFix = 'Sequential retry is usually intentional. Add // perf-skill:ignore-waterfall to suppress.';
      break;
    default:
      suggestedFix = 'Review for parallelization opportunities.';
  }
  
  return {
    severity: SEVERITY,
    rule: RULE_ID,
    file: filePath,
    lineStart: startLine,
    lineEnd: endLine,
    message,
    snippet: group.map(a => a.text).join('\n'),
    suggestedFix,
    functionName,
    kind: classification.kind,
    priorityScore,
    evidence,
  };
}

/**
 * Generate Promise.all() fix suggestion
 */
function generatePromiseAllFix(group: AwaitSite[]): string {
  const calls = group.map(a => {
    const match = a.text.match(/await\s+(.+?)(?:;?\s*$)/);
    return match ? match[1] : a.text;
  });
  
  const varNames = group.map((a, i) => a.varName || `result${i + 1}`);
  
  return `const [${varNames.join(', ')}] = await Promise.all([
  ${calls.join(',\n  ')}
]);`;
}

export default waterfallsScanner;
