/**
 * Rerenders Scanner (Phase 4M2)
 * Detects rerender hotspots, missing memoization, and unstable patterns
 * Rule: 3.x - Rerender Issues (MEDIUM/HIGH)
 *
 * Classifications with fixability:
 * AUTO-FIXABLE:
 * - inline-object: {{ a: 1 }} → useMemo
 * - inline-array: {[a, b]} → useMemo
 * - inline-fn: {() => fn()} → useCallback
 * - setstate-nonfunctional: setState(x+1) → setState(s => s+1)
 *
 * REVIEW-ONLY:
 * - unstable-deps: missing/unstable useEffect deps
 * - context-value: inline object in Provider value
 * - list-hotspot: .map() without memo/virtualization
 * - missing-memo: component should be memoized
 */

import { EvidenceItem, Finding, Fixability, RerenderKind, ScanContext, Scanner } from './types.js';

// Rule IDs
const RULE_PREFIX = 'rerender';
const SEVERITY_HIGH = 'high' as const;
const SEVERITY_MEDIUM = 'medium' as const;

// Pragma to suppress rerender detection
const IGNORE_PRAGMA = 'perf-skill:ignore-rerender';

// Shell/pilot paths get priority boost
const HIGH_PRIORITY_PATHS = [
  'os-platform/core/pilot',
  'os-platform/core/types',
  'tools/registry',
  'frontend-v2/shell',
];

// Patterns for memo detection
const MEMO_PATTERNS = [/memo\s*\(/, /React\.memo\s*\(/];

interface ComponentScope {
  name: string;
  startLine: number;
  endLine: number;
  isMemoized: boolean;
  hasListRendering: boolean;
}

export const rerendersScanner: Scanner = {
  name: 'rerenders',
  description: 'Detect rerender hotspots and missing memoization (Phase 4M2)',

  scan(content: string, filePath: string, ctx: ScanContext): Finding[] {
    const findings: Finding[] = [];
    const lines = content.split('\n');

    // Only scan .tsx files (React components)
    if (!filePath.endsWith('.tsx')) {
      return findings;
    }

    // Skip test files
    if (
      filePath.includes('.test.') ||
      filePath.includes('.spec.') ||
      filePath.includes('__tests__')
    ) {
      return findings;
    }

    // Extract component scopes
    const components = extractComponentScopes(lines, content);

    // Check for list rendering at file level
    const hasListRendering = content.includes('.map(') && content.includes('<');

    // Scan for patterns line by line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      // Skip comments
      if (line.trim().startsWith('//') || line.trim().startsWith('*')) continue;

      // Check for pragma suppression
      const prevLine = i > 0 ? lines[i - 1] : '';
      if (line.includes(IGNORE_PRAGMA) || prevLine.includes(IGNORE_PRAGMA)) continue;

      // Find which component this line is in
      const component = components.find(c => lineNum >= c.startLine && lineNum <= c.endLine);
      const componentName = component?.name || '<unknown>';
      const inMemoizedChild = component?.isMemoized || false;

      // 1. Inline object prop detection
      const inlineObjectFinding = detectInlineObject(
        line,
        lineNum,
        filePath,
        componentName,
        inMemoizedChild
      );
      if (inlineObjectFinding) findings.push(inlineObjectFinding);

      // 2. Inline array prop detection
      const inlineArrayFinding = detectInlineArray(
        line,
        lineNum,
        filePath,
        componentName,
        inMemoizedChild
      );
      if (inlineArrayFinding) findings.push(inlineArrayFinding);

      // 3. Inline function prop detection
      const inlineFnFinding = detectInlineFn(
        line,
        lineNum,
        filePath,
        componentName,
        hasListRendering,
        lines,
        i
      );
      if (inlineFnFinding) findings.push(inlineFnFinding);

      // 4. setState non-functional pattern
      const setStateFinding = detectNonFunctionalSetState(line, lineNum, filePath, componentName);
      if (setStateFinding) findings.push(setStateFinding);

      // 5. Context value inline object
      const contextFinding = detectContextValue(line, lineNum, filePath, componentName);
      if (contextFinding) findings.push(contextFinding);

      // 6. useEffect missing deps (simplified detection)
      const depsFinding = detectUnstableDeps(line, lineNum, filePath, componentName, lines, i);
      if (depsFinding) findings.push(depsFinding);
    }

    // 7. List hotspot detection (file-level analysis)
    const listFindings = detectListHotspots(lines, filePath, components);
    findings.push(...listFindings);

    return findings;
  },
};

/**
 * Extract component scopes from source
 */
function extractComponentScopes(lines: string[], content: string): ComponentScope[] {
  const scopes: ComponentScope[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Detect function component declarations
    const funcMatch = line.match(/(?:export\s+)?(?:const|function)\s+([A-Z]\w+)\s*[=:]/);

    if (funcMatch) {
      const name = funcMatch[1];

      // Check if memo-wrapped
      const isMemoized = MEMO_PATTERNS.some(
        p => line.includes('memo') || content.includes(`memo(${name}`)
      );

      // Find end of component (simplified: next export or end of file)
      let endLine = lines.length;
      for (let j = i + 1; j < lines.length; j++) {
        if (/^(?:export\s+)?(?:const|function)\s+[A-Z]/.test(lines[j])) {
          endLine = j;
          break;
        }
      }

      // Check for list rendering in component
      const componentContent = lines.slice(i, endLine).join('\n');
      const hasListRendering = componentContent.includes('.map(') && componentContent.includes('<');

      scopes.push({
        name,
        startLine: lineNum,
        endLine,
        isMemoized,
        hasListRendering,
      });
    }
  }

  return scopes;
}

/**
 * Detect inline object props: prop={{ }}
 */
function detectInlineObject(
  line: string,
  lineNum: number,
  filePath: string,
  componentName: string,
  inMemoizedChild: boolean
): Finding | null {
  const match = line.match(/(\w+)\s*=\s*\{\s*\{(?!\{)/);
  if (!match) return null;

  const propName = match[1];

  // Skip common false positives
  if (['key', 'ref', 'style', 'css', 'sx'].includes(propName)) return null;

  const priorityScore = calculatePriorityScore(filePath, 'inline-object', inMemoizedChild);
  const evidence: EvidenceItem[] = [{ line: lineNum, snippet: line.trim() }];

  return {
    severity: SEVERITY_MEDIUM,
    rule: `${RULE_PREFIX}.inline-object`,
    file: filePath,
    lineStart: lineNum,
    lineEnd: lineNum,
    message: `Inline object prop '${propName}' creates new reference each render.`,
    snippet: line.trim(),
    suggestedFix: `const ${propName}Value = useMemo(() => ({ ... }), []);\n<Component ${propName}={${propName}Value} />`,
    componentName,
    kind: 'inline-object' as RerenderKind,
    fixability: 'auto' as Fixability,
    priorityScore,
    propName,
    evidence,
  };
}

/**
 * Detect inline array props: prop={[]}
 */
function detectInlineArray(
  line: string,
  lineNum: number,
  filePath: string,
  componentName: string,
  inMemoizedChild: boolean
): Finding | null {
  const match = line.match(/(\w+)\s*=\s*\{\s*\[/);
  if (!match) return null;

  const propName = match[1];

  // Skip children and common false positives
  if (['children', 'key'].includes(propName)) return null;

  // Skip if already using useMemo/useState
  if (line.includes('useMemo') || line.includes('useState')) return null;

  const priorityScore = calculatePriorityScore(filePath, 'inline-array', inMemoizedChild);
  const evidence: EvidenceItem[] = [{ line: lineNum, snippet: line.trim() }];

  return {
    severity: SEVERITY_MEDIUM,
    rule: `${RULE_PREFIX}.inline-array`,
    file: filePath,
    lineStart: lineNum,
    lineEnd: lineNum,
    message: `Inline array prop '${propName}' creates new reference each render.`,
    snippet: line.trim(),
    suggestedFix: `const ${propName}Value = useMemo(() => [...], [deps]);\n<Component ${propName}={${propName}Value} />`,
    componentName,
    kind: 'inline-array' as RerenderKind,
    fixability: 'auto' as Fixability,
    priorityScore,
    propName,
    evidence,
  };
}

/**
 * Detect inline function props: onClick={() => }
 */
function detectInlineFn(
  line: string,
  lineNum: number,
  filePath: string,
  componentName: string,
  hasListRendering: boolean,
  lines: string[],
  lineIndex: number
): Finding | null {
  // Match onClick={() => ...} or onSomething={(e) => ...}
  const match = line.match(/(on\w+)\s*=\s*\{\s*(?:\([^)]*\)|[a-z_]\w*)?\s*=>/i);
  if (!match) return null;

  const eventName = match[1];

  // Check if we're in a list rendering context
  const contextStart = Math.max(0, lineIndex - 10);
  const contextLines = lines.slice(contextStart, lineIndex + 1).join('\n');
  const inListContext = contextLines.includes('.map(');

  // Higher priority in list context
  const baseKind: RerenderKind = 'inline-fn';
  const priorityScore = calculatePriorityScore(filePath, baseKind, inListContext);
  const evidence: EvidenceItem[] = [{ line: lineNum, snippet: line.trim() }];

  const handlerName = `handle${eventName.charAt(2).toUpperCase()}${eventName.slice(3)}`;

  return {
    severity: inListContext ? SEVERITY_HIGH : SEVERITY_MEDIUM,
    rule: `${RULE_PREFIX}.inline-fn`,
    file: filePath,
    lineStart: lineNum,
    lineEnd: lineNum,
    message: `Inline function '${eventName}'${inListContext ? ' in list render' : ''} creates new function each render.`,
    snippet: line.trim(),
    suggestedFix: `const ${handlerName} = useCallback(() => { ... }, [deps]);\n<Component ${eventName}={${handlerName}} />`,
    componentName,
    kind: baseKind,
    fixability: 'auto' as Fixability,
    priorityScore,
    propName: eventName,
    evidence,
  };
}

/**
 * Detect non-functional setState: setState(count + 1) vs setState(c => c + 1)
 */
function detectNonFunctionalSetState(
  line: string,
  lineNum: number,
  filePath: string,
  componentName: string
): Finding | null {
  // Match setState(variable + 1) or setState(variable - 1) patterns
  const match = line.match(/set([A-Z]\w*)\s*\(\s*(\w+)\s*([+-])\s*(\d+)\s*\)/);
  if (!match) return null;

  const setterName = `set${match[1]}`;
  const varName = match[2];
  const operator = match[3];
  const delta = match[4];

  // Skip if already using functional form
  if (line.includes('=>')) return null;

  const priorityScore = calculatePriorityScore(filePath, 'setstate-nonfunctional', false) + 10; // Extra boost for safety
  const evidence: EvidenceItem[] = [{ line: lineNum, snippet: line.trim(), varName }];

  return {
    severity: SEVERITY_MEDIUM,
    rule: `${RULE_PREFIX}.setstate-nonfunctional`,
    file: filePath,
    lineStart: lineNum,
    lineEnd: lineNum,
    message: `Non-functional setState '${setterName}(${varName} ${operator} ${delta})' may cause stale state issues.`,
    snippet: line.trim(),
    suggestedFix: `${setterName}(prev => prev ${operator} ${delta})`,
    componentName,
    kind: 'setstate-nonfunctional' as RerenderKind,
    fixability: 'auto' as Fixability,
    priorityScore,
    hook: 'useState',
    evidence,
  };
}

/**
 * Detect context value inline object: <Provider value={{ }}>
 */
function detectContextValue(
  line: string,
  lineNum: number,
  filePath: string,
  componentName: string
): Finding | null {
  // Match <SomeProvider value={{ }} or <SomeContext.Provider value={{ }}
  const match = line.match(/<(\w+(?:\.\w+)?)\s+value\s*=\s*\{\s*\{/);
  if (!match) return null;

  const providerName = match[1];

  // Must be a provider
  if (!providerName.includes('Provider') && !providerName.includes('.Provider')) return null;

  const priorityScore = calculatePriorityScore(filePath, 'context-value', false);
  const evidence: EvidenceItem[] = [{ line: lineNum, snippet: line.trim() }];

  return {
    severity: SEVERITY_HIGH,
    rule: `${RULE_PREFIX}.context-value`,
    file: filePath,
    lineStart: lineNum,
    lineEnd: lineNum,
    message: `Inline object in '${providerName}' value causes all consumers to rerender.`,
    snippet: line.trim(),
    suggestedFix: `const contextValue = useMemo(() => ({ ... }), [deps]);\n<${providerName} value={contextValue}>`,
    componentName,
    kind: 'context-value' as RerenderKind,
    fixability: 'review' as Fixability,
    priorityScore,
    evidence,
  };
}

/**
 * Detect unstable deps in useEffect/useMemo/useCallback
 */
function detectUnstableDeps(
  line: string,
  lineNum: number,
  filePath: string,
  componentName: string,
  lines: string[],
  lineIndex: number
): Finding | null {
  // Match useEffect/useMemo/useCallback with empty deps []
  const match = line.match(
    /(useEffect|useMemo|useCallback)\s*\(\s*(?:\([^)]*\)|[^,]+)\s*,\s*\[\s*\]\s*\)/
  );
  if (match) {
    // Empty deps - check if callback references any variables
    const hookName = match[1];

    // Look for variable references in the callback (simplified)
    const prevLines = lines.slice(Math.max(0, lineIndex - 5), lineIndex + 1).join('\n');

    // Skip if it's clearly a mount-only effect
    if (hookName === 'useEffect' && line.includes('[]')) {
      return null; // Empty deps in useEffect is often intentional
    }
  }

  // Match missing deps array entirely
  const missingMatch = line.match(/(useEffect)\s*\(\s*\([^)]*\)\s*=>\s*\{/);
  if (missingMatch && !line.includes('[')) {
    // Look ahead for deps array
    const nextFewLines = lines.slice(lineIndex, Math.min(lines.length, lineIndex + 5)).join('\n');

    // If no deps array found, flag it
    if (!nextFewLines.match(/\]\s*\)/)) {
      const hookName = missingMatch[1];
      const priorityScore = calculatePriorityScore(filePath, 'unstable-deps', false);
      const evidence: EvidenceItem[] = [{ line: lineNum, snippet: line.trim() }];

      return {
        severity: SEVERITY_MEDIUM,
        rule: `${RULE_PREFIX}.unstable-deps`,
        file: filePath,
        lineStart: lineNum,
        lineEnd: lineNum,
        message: `${hookName} may be missing dependency array.`,
        snippet: line.trim(),
        suggestedFix: `Add dependency array: ${hookName}(() => { ... }, [deps])`,
        componentName,
        kind: 'unstable-deps' as RerenderKind,
        fixability: 'review' as Fixability,
        priorityScore,
        hook: hookName,
        evidence,
      };
    }
  }

  return null;
}

/**
 * Detect list rendering hotspots
 */
function detectListHotspots(
  lines: string[],
  filePath: string,
  components: ComponentScope[]
): Finding[] {
  const findings: Finding[] = [];

  for (const component of components) {
    if (!component.hasListRendering) continue;

    // Find .map() calls in this component
    for (let i = component.startLine - 1; i < component.endLine && i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      if (line.includes('.map(') && line.includes('<')) {
        // Check if items are memoized or using key properly
        const nextLines = lines.slice(i, Math.min(lines.length, i + 10)).join('\n');

        // Skip if memo is used
        if (nextLines.includes('memo(') || nextLines.includes('React.memo')) continue;

        // Skip if it's a simple list (no complex components)
        if (!nextLines.match(/<[A-Z]\w+/)) continue;

        const priorityScore = calculatePriorityScore(filePath, 'list-hotspot', false);
        const evidence: EvidenceItem[] = [{ line: lineNum, snippet: line.trim() }];

        findings.push({
          severity: SEVERITY_MEDIUM,
          rule: `${RULE_PREFIX}.list-hotspot`,
          file: filePath,
          lineStart: lineNum,
          lineEnd: lineNum,
          message: `List render in '${component.name}' may cause child rerenders. Consider memo() or virtualization.`,
          snippet: line.trim(),
          suggestedFix: 'Wrap list items in memo() or use virtualization for large lists.',
          componentName: component.name,
          kind: 'list-hotspot' as RerenderKind,
          fixability: 'review' as Fixability,
          priorityScore,
          evidence,
        });

        break; // One finding per component
      }
    }
  }

  return findings;
}

/**
 * Calculate priority score for rerender findings (0-100)
 */
function calculatePriorityScore(
  filePath: string,
  kind: RerenderKind,
  memoizedOrListContext: boolean
): number {
  let score = 50;

  // Shell/pilot path boost (+30)
  if (HIGH_PRIORITY_PATHS.some(p => filePath.includes(p))) {
    score += 30;
  }

  // Kind-based scoring
  switch (kind) {
    case 'setstate-nonfunctional':
      score += 20; // Very safe, high confidence
      break;
    case 'inline-fn':
      score += 10;
      break;
    case 'inline-object':
    case 'inline-array':
      score += 10;
      break;
    case 'context-value':
      score += 5; // Important but review-only
      break;
    case 'unstable-deps':
    case 'list-hotspot':
    case 'missing-memo':
      score -= 10; // Review-only, lower priority
      break;
  }

  // Memoized child or list context boost (+10)
  if (memoizedOrListContext) {
    score += 10;
  }

  return Math.min(100, Math.max(0, score));
}

export default rerendersScanner;
