/**
 * Client-Boundary Scanner (Phase 4M3)
 * Detects Server ↔ Client boundary performance debt and correctness risk
 * Rule: 4.x - Client Boundary Issues (MEDIUM/HIGH)
 *
 * Classifications with fixability:
 * AUTO-FIXABLE (low blast radius):
 * - missing-use-client: File uses client-only APIs but lacks "use client"
 * - server-imports-client: Server module imports client component
 * - dynamic-candidate: Heavy UI component should use dynamic()
 * - serialization-trim: Over-large prop objects at boundary
 *
 * REVIEW-ONLY (needs human intent):
 * - unstable-server-action: Server Actions with revalidation overhead
 * - rsc-cache-candidate: Repeated fetch without cache/dedup
 * - boundary-churn: Server→client→server refetch loop
 * - client-fetch-in-render: Fetch in client render phase
 */

import {
    ClientBoundaryKind,
    EvidenceItem,
    Finding,
    Fixability,
    ScanContext,
    Scanner,
} from './types.js';

// Rule IDs
const RULE_PREFIX = 'client-boundary';
const SEVERITY_HIGH = 'high' as const;
const SEVERITY_MEDIUM = 'medium' as const;

// Pragma to suppress client-boundary detection
const IGNORE_PRAGMA = 'perf-skill:ignore-client-boundary';

// Shell/pilot paths get priority boost
const HIGH_PRIORITY_PATHS = [
  'os-platform/core/pilot',
  'os-platform/core/types',
  'tools/registry',
  'frontend-v2/shell',
];

// Client-only React hooks
const CLIENT_ONLY_HOOKS = [
  'useState',
  'useEffect',
  'useLayoutEffect',
  'useReducer',
  'useRef',
  'useSyncExternalStore',
  'useInsertionEffect',
  'useTransition',
  'useDeferredValue',
];

// Client-only browser globals
const CLIENT_ONLY_GLOBALS = [
  'window',
  'document',
  'localStorage',
  'sessionStorage',
  'navigator',
  'location',
  'history',
  'requestAnimationFrame',
  'cancelAnimationFrame',
  'requestIdleCallback',
  'ResizeObserver',
  'MutationObserver',
  'IntersectionObserver',
];

// Heavy modules that should use dynamic import
const HEAVY_MODULES = [
  'lodash',
  'moment',
  'dayjs',
  '@mui/',
  'antd',
  'recharts',
  'd3',
  'chart.js',
  'react-chartjs',
  'echarts',
  'plotly',
  'mapbox',
  'leaflet',
  '@react-pdf',
  'pdfjs',
  'xlsx',
  'exceljs',
  'monaco-editor',
  '@monaco-editor',
  'codemirror',
  '@codemirror',
  'quill',
  'draft-js',
  'slate',
  'prosemirror',
  'tiptap',
  'marked',
  'highlight.js',
  'prism',
  'three',
  'babylon',
  'pixi',
  'konva',
  'fabric',
  'gsap',
  'framer-motion',
  'react-spring',
  'lottie',
  'swiper',
  'fullcalendar',
  'react-big-calendar',
  'react-datepicker',
  'react-select',
  'react-table',
  'ag-grid',
  'tanstack/table',
  'tanstack/virtual',
];

// Heavy component name patterns
const HEAVY_COMPONENT_PATTERNS = [
  /Viewer$/i,
  /Chart$/i,
  /Map$/i,
  /Editor$/i,
  /Calendar$/i,
  /Datepicker$/i,
  /Table$/i,
  /Grid$/i,
  /Dashboard$/i,
  /Visualization$/i,
];

export const clientBoundaryScanner: Scanner = {
  name: 'client-boundary',
  description: 'Detect Server/Client boundary debt (Phase 4M3)',

  scan(content: string, filePath: string, ctx: ScanContext): Finding[] {
    const findings: Finding[] = [];
    const lines = content.split('\n');

    // Only scan .ts/.tsx files
    if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) {
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

    // Check if file has "use client" directive
    const hasUseClient = lines.some(
      l => l.trim() === '"use client"' || l.trim() === "'use client'"
    );

    // Check if file has "use server" directive
    const hasUseServer = lines.some(
      l => l.trim() === '"use server"' || l.trim() === "'use server'"
    );

    // Track if we already found missing-use-client to avoid duplicates
    let foundMissingUseClient = false;

    // Scan for patterns line by line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      // Skip comments
      if (line.trim().startsWith('//') || line.trim().startsWith('*')) continue;

      // Check for pragma suppression
      const prevLine = i > 0 ? lines[i - 1] : '';
      if (line.includes(IGNORE_PRAGMA) || prevLine.includes(IGNORE_PRAGMA)) continue;

      // 1. Missing "use client" detection (only flag once per file)
      if (!hasUseClient && !hasUseServer && !foundMissingUseClient) {
        const clientApiFinding = detectMissingUseClient(line, lineNum, filePath);
        if (clientApiFinding) {
          findings.push(clientApiFinding);
          foundMissingUseClient = true;
        }
      }

      // 2. Server imports client module
      if (!hasUseClient) {
        const serverImportsFinding = detectServerImportsClient(line, lineNum, filePath);
        if (serverImportsFinding) {
          findings.push(serverImportsFinding);
        }
      }

      // 3. Dynamic import candidate
      const dynamicFinding = detectDynamicCandidate(line, lineNum, filePath, hasUseClient);
      if (dynamicFinding) {
        findings.push(dynamicFinding);
      }

      // 4. Serialization trim candidate
      const serializationFinding = detectSerializationTrim(line, lineNum, filePath, lines, i);
      if (serializationFinding) {
        findings.push(serializationFinding);
      }

      // 5. Unstable server action patterns
      if (hasUseServer || content.includes('use server')) {
        const serverActionFinding = detectUnstableServerAction(line, lineNum, filePath);
        if (serverActionFinding) {
          findings.push(serverActionFinding);
        }
      }

      // 6. RSC cache candidate
      const cacheFinding = detectRscCacheCandidate(line, lineNum, filePath, content);
      if (cacheFinding) {
        findings.push(cacheFinding);
      }

      // 7. Client fetch in render
      if (hasUseClient) {
        const clientFetchFinding = detectClientFetchInRender(line, lineNum, filePath, lines, i);
        if (clientFetchFinding) {
          findings.push(clientFetchFinding);
        }
      }
    }

    // 8. Boundary churn detection (file-level analysis)
    const churnFindings = detectBoundaryChurn(lines, filePath, content);
    findings.push(...churnFindings);

    return findings;
  },
};

/**
 * Detect file using client-only APIs without "use client"
 */
function detectMissingUseClient(line: string, lineNum: number, filePath: string): Finding | null {
  // Check for client-only hooks
  for (const hook of CLIENT_ONLY_HOOKS) {
    const hookRegex = new RegExp(`\\b${hook}\\s*\\(`);
    if (hookRegex.test(line)) {
      const priorityScore = calculatePriorityScore(filePath, 'missing-use-client');
      const evidence: EvidenceItem[] = [{ line: lineNum, snippet: line.trim() }];

      return {
        severity: SEVERITY_HIGH,
        rule: `${RULE_PREFIX}.missing-use-client`,
        file: filePath,
        lineStart: lineNum,
        lineEnd: lineNum,
        message: `File uses client hook '${hook}' but lacks "use client" directive.`,
        snippet: line.trim(),
        suggestedFix: 'Add "use client" at the top of the file.',
        kind: 'missing-use-client' as ClientBoundaryKind,
        fixability: 'auto' as Fixability,
        priorityScore,
        symbol: hook,
        boundaryReason: 'Client-only React hook requires "use client" directive',
        evidence,
      };
    }
  }

  // Check for client-only globals (must be actual usage, not just type reference)
  for (const global of CLIENT_ONLY_GLOBALS) {
    // Match actual usage like window.something, document.getElementById
    const globalRegex = new RegExp(
      `(?<!type.*|interface.*|:\\s*)\\b${global}\\s*\\.|\\b${global}\\s*\\[`
    );
    if (globalRegex.test(line)) {
      // Skip if it's a type-only reference or typeof
      if (line.includes('typeof ' + global) || line.includes(': ' + global)) continue;
      // Skip if inside a type annotation
      if (line.match(/:\s*\w+\s*\|?\s*typeof/) && line.includes(global)) continue;

      const priorityScore = calculatePriorityScore(filePath, 'missing-use-client');
      const evidence: EvidenceItem[] = [{ line: lineNum, snippet: line.trim() }];

      return {
        severity: SEVERITY_HIGH,
        rule: `${RULE_PREFIX}.missing-use-client`,
        file: filePath,
        lineStart: lineNum,
        lineEnd: lineNum,
        message: `File uses browser global '${global}' but lacks "use client" directive.`,
        snippet: line.trim(),
        suggestedFix: 'Add "use client" at the top of the file or guard with typeof check.',
        kind: 'missing-use-client' as ClientBoundaryKind,
        fixability: 'auto' as Fixability,
        priorityScore,
        symbol: global,
        boundaryReason: 'Browser global requires "use client" directive',
        evidence,
      };
    }
  }

  return null;
}

/**
 * Detect server module importing client component
 */
function detectServerImportsClient(
  line: string,
  lineNum: number,
  filePath: string
): Finding | null {
  // Match import statements
  const importMatch = line.match(/import\s+(?:\{[^}]+\}|[^{]+)\s+from\s+['"](\.\.?\/[^'"]+)['"]/);
  if (!importMatch) return null;

  const importPath = importMatch[1];

  // Check if import path suggests client component
  const clientIndicators = ['use-client', 'client', 'hooks', 'components/ui'];
  const isLikelyClient = clientIndicators.some(ind => importPath.toLowerCase().includes(ind));

  if (isLikelyClient) {
    const priorityScore = calculatePriorityScore(filePath, 'server-imports-client');
    const evidence: EvidenceItem[] = [{ line: lineNum, snippet: line.trim() }];

    return {
      severity: SEVERITY_MEDIUM,
      rule: `${RULE_PREFIX}.server-imports-client`,
      file: filePath,
      lineStart: lineNum,
      lineEnd: lineNum,
      message: `Server module imports likely client component from '${importPath}'.`,
      snippet: line.trim(),
      suggestedFix: 'Consider adding "use client" or using dynamic import with { ssr: false }.',
      kind: 'server-imports-client' as ClientBoundaryKind,
      fixability: 'review' as Fixability, // Usually needs review
      priorityScore,
      importPath,
      boundaryReason: 'Server module importing client-only code',
      evidence,
    };
  }

  return null;
}

/**
 * Detect heavy imports that should use dynamic()
 */
function detectDynamicCandidate(
  line: string,
  lineNum: number,
  filePath: string,
  hasUseClient: boolean
): Finding | null {
  // Match import statements
  const importMatch = line.match(/import\s+(?:\{([^}]+)\}|(\w+))\s+from\s+['"]([^'"]+)['"]/);
  if (!importMatch) return null;

  const imports = importMatch[1] || importMatch[2];
  const modulePath = importMatch[3];

  // Check if it's a heavy module
  const isHeavy = HEAVY_MODULES.some(mod => modulePath.includes(mod));

  // Check if it's a heavy component by name
  const importNames = imports.split(',').map(s => s.trim().split(/\s+as\s+/)[0]);
  const hasHeavyComponent = importNames.some(name =>
    HEAVY_COMPONENT_PATTERNS.some(pattern => pattern.test(name))
  );

  if (isHeavy || hasHeavyComponent) {
    // Skip if already using dynamic import
    if (line.includes('dynamic(') || line.includes('lazy(')) return null;

    const priorityScore = calculatePriorityScore(filePath, 'dynamic-candidate');
    const evidence: EvidenceItem[] = [{ line: lineNum, snippet: line.trim() }];

    const componentName = importNames[0];

    return {
      severity: SEVERITY_MEDIUM,
      rule: `${RULE_PREFIX}.dynamic-candidate`,
      file: filePath,
      lineStart: lineNum,
      lineEnd: lineNum,
      message: `Heavy module '${modulePath}' could benefit from dynamic import.`,
      snippet: line.trim(),
      suggestedFix: `const ${componentName} = dynamic(() => import('${modulePath}'), { ssr: false });`,
      kind: 'dynamic-candidate' as ClientBoundaryKind,
      fixability: hasUseClient ? 'auto' : ('review' as Fixability),
      priorityScore,
      importPath: modulePath,
      boundaryReason: 'Heavy module impacts initial bundle size',
      evidence,
    };
  }

  return null;
}

/**
 * Detect over-large prop objects passed to client components
 */
function detectSerializationTrim(
  line: string,
  lineNum: number,
  filePath: string,
  lines: string[],
  lineIndex: number
): Finding | null {
  // Match spreading large objects or passing data props
  // Pattern: <Component data={hugeObject} /> or <Component {...props} />
  const spreadMatch = line.match(/<([A-Z]\w+)[^>]*\s\{\.\.\.(\w+)\}/);
  if (spreadMatch) {
    const componentName = spreadMatch[1];
    const spreadVar = spreadMatch[2];

    // Look for how large the spread object might be
    const contextStart = Math.max(0, lineIndex - 20);
    const contextLines = lines.slice(contextStart, lineIndex).join('\n');

    // Check if spread object is large (heuristic: many properties or API response)
    const isLikelyLarge =
      contextLines.includes(`${spreadVar} = await`) ||
      contextLines.includes(`${spreadVar}: {`) ||
      contextLines.match(new RegExp(`${spreadVar}\\s*=\\s*\\{[^}]{100,}`));

    if (isLikelyLarge) {
      const priorityScore = calculatePriorityScore(filePath, 'serialization-trim');
      const evidence: EvidenceItem[] = [{ line: lineNum, snippet: line.trim() }];

      return {
        severity: SEVERITY_MEDIUM,
        rule: `${RULE_PREFIX}.serialization-trim`,
        file: filePath,
        lineStart: lineNum,
        lineEnd: lineNum,
        message: `Spreading '${spreadVar}' into <${componentName}> may serialize excess data.`,
        snippet: line.trim(),
        suggestedFix: `Pick only needed fields: <${componentName} field1={${spreadVar}.field1} field2={${spreadVar}.field2} />`,
        kind: 'serialization-trim' as ClientBoundaryKind,
        fixability: 'review' as Fixability,
        priorityScore,
        componentName,
        boundaryReason: 'Over-serialization at server/client boundary',
        evidence,
      };
    }
  }

  // Match large object literals passed as props
  const largePropMatch = line.match(/<([A-Z]\w+)[^>]*\sdata\s*=\s*\{([^}]{80,})\}/);
  if (largePropMatch) {
    const componentName = largePropMatch[1];
    const priorityScore = calculatePriorityScore(filePath, 'serialization-trim');
    const evidence: EvidenceItem[] = [
      { line: lineNum, snippet: line.trim().slice(0, 100) + '...' },
    ];

    return {
      severity: SEVERITY_MEDIUM,
      rule: `${RULE_PREFIX}.serialization-trim`,
      file: filePath,
      lineStart: lineNum,
      lineEnd: lineNum,
      message: `Large object literal passed to <${componentName}> may benefit from trimming.`,
      snippet: line.trim().slice(0, 100) + '...',
      suggestedFix: 'Consider passing only the fields the component needs.',
      kind: 'serialization-trim' as ClientBoundaryKind,
      fixability: 'review' as Fixability,
      priorityScore,
      componentName,
      boundaryReason: 'Large prop serialization overhead',
      evidence,
    };
  }

  return null;
}

/**
 * Detect unstable server action patterns
 */
function detectUnstableServerAction(
  line: string,
  lineNum: number,
  filePath: string
): Finding | null {
  // Match patterns that suggest server action overhead
  // Pattern: revalidatePath/revalidateTag in hot paths
  if (line.includes('revalidatePath') || line.includes('revalidateTag')) {
    const priorityScore = calculatePriorityScore(filePath, 'unstable-server-action');
    const evidence: EvidenceItem[] = [{ line: lineNum, snippet: line.trim() }];

    return {
      severity: SEVERITY_MEDIUM,
      rule: `${RULE_PREFIX}.unstable-server-action`,
      file: filePath,
      lineStart: lineNum,
      lineEnd: lineNum,
      message: 'Revalidation call may cause unnecessary refetching.',
      snippet: line.trim(),
      suggestedFix: 'Consider batching revalidations or using more specific cache tags.',
      kind: 'unstable-server-action' as ClientBoundaryKind,
      fixability: 'review' as Fixability,
      priorityScore,
      boundaryReason: 'Server action revalidation overhead',
      evidence,
    };
  }

  return null;
}

/**
 * Detect repeated fetch without cache
 */
function detectRscCacheCandidate(
  line: string,
  lineNum: number,
  filePath: string,
  content: string
): Finding | null {
  // Match fetch calls without cache option
  const fetchMatch = line.match(/fetch\s*\(\s*[`'"]([^`'"]+)[`'"]/);
  if (!fetchMatch) return null;

  const url = fetchMatch[1];

  // Check if this URL is fetched multiple times in the file
  const urlRegex = new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  const fetchCount = (content.match(urlRegex) || []).length;

  if (fetchCount > 1 && !line.includes('cache') && !line.includes('next:')) {
    const priorityScore = calculatePriorityScore(filePath, 'rsc-cache-candidate');
    const evidence: EvidenceItem[] = [{ line: lineNum, snippet: line.trim() }];

    return {
      severity: SEVERITY_MEDIUM,
      rule: `${RULE_PREFIX}.rsc-cache-candidate`,
      file: filePath,
      lineStart: lineNum,
      lineEnd: lineNum,
      message: `Fetch to '${url.slice(0, 50)}' appears ${fetchCount} times without caching.`,
      snippet: line.trim(),
      suggestedFix: "Use React's cache() wrapper or Next.js fetch caching options.",
      kind: 'rsc-cache-candidate' as ClientBoundaryKind,
      fixability: 'review' as Fixability,
      priorityScore,
      boundaryReason: 'Repeated identical fetches without deduplication',
      evidence,
    };
  }

  return null;
}

/**
 * Detect client-side fetch in render phase
 */
function detectClientFetchInRender(
  line: string,
  lineNum: number,
  filePath: string,
  lines: string[],
  lineIndex: number
): Finding | null {
  // Match fetch calls
  if (!line.includes('fetch(') && !line.includes('axios') && !line.includes('$.ajax')) {
    return null;
  }

  // Check if we're inside useEffect (which is fine)
  const contextStart = Math.max(0, lineIndex - 10);
  const contextLines = lines.slice(contextStart, lineIndex).join('\n');

  if (
    contextLines.includes('useEffect') ||
    contextLines.includes('useSWR') ||
    contextLines.includes('useQuery') ||
    contextLines.includes('useMutation')
  ) {
    return null; // This is fine, handled by effect or query hook
  }

  // Check if we're in a component body (render phase)
  const isInRender =
    contextLines.match(/(?:function|const)\s+[A-Z]\w+/) && !contextLines.includes('useEffect');

  if (isInRender && line.includes('fetch(')) {
    const priorityScore = calculatePriorityScore(filePath, 'client-fetch-in-render');
    const evidence: EvidenceItem[] = [{ line: lineNum, snippet: line.trim() }];

    return {
      severity: SEVERITY_HIGH,
      rule: `${RULE_PREFIX}.client-fetch-in-render`,
      file: filePath,
      lineStart: lineNum,
      lineEnd: lineNum,
      message: 'Fetch in render phase may cause infinite loops or performance issues.',
      snippet: line.trim(),
      suggestedFix: 'Move fetch into useEffect, useSWR, or React Query.',
      kind: 'client-fetch-in-render' as ClientBoundaryKind,
      fixability: 'review' as Fixability,
      priorityScore,
      boundaryReason: 'Fetch in component render phase',
      evidence,
    };
  }

  return null;
}

/**
 * Detect boundary churn: server fetch → client state → server refetch
 */
function detectBoundaryChurn(lines: string[], filePath: string, content: string): Finding[] {
  const findings: Finding[] = [];

  // Look for patterns that suggest boundary churn
  // Pattern: useState with initial value from props/fetch, then refetching
  const hasServerDataInState = content.match(/useState\s*\(\s*(?:props\.|data\.|initial)/gi);
  const hasClientRefetch =
    content.includes('refetch') || (content.includes('fetch(') && content.includes('useEffect'));

  if (hasServerDataInState && hasClientRefetch) {
    // Find the first useState line for reference
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('useState') && line.match(/props\.|data\.|initial/)) {
        const priorityScore = calculatePriorityScore(filePath, 'boundary-churn');
        const evidence: EvidenceItem[] = [{ line: i + 1, snippet: line.trim() }];

        findings.push({
          severity: SEVERITY_MEDIUM,
          rule: `${RULE_PREFIX}.boundary-churn`,
          file: filePath,
          lineStart: i + 1,
          lineEnd: i + 1,
          message: 'Possible boundary churn: server data mirrored to client state with refetch.',
          snippet: line.trim(),
          suggestedFix: 'Consider keeping data on server or using client-only state.',
          kind: 'boundary-churn' as ClientBoundaryKind,
          fixability: 'review' as Fixability,
          priorityScore,
          boundaryReason: 'Server→client→server refetch loop pattern',
          evidence,
        });

        break; // One finding per file
      }
    }
  }

  return findings;
}

/**
 * Calculate priority score for client-boundary findings (0-100)
 */
function calculatePriorityScore(filePath: string, kind: ClientBoundaryKind): number {
  let score = 50;

  // Shell/pilot path boost (+30)
  if (HIGH_PRIORITY_PATHS.some(p => filePath.includes(p))) {
    score += 30;
  }

  // Kind-based scoring
  switch (kind) {
    case 'missing-use-client':
      score += 25; // High confidence, auto-fixable
      break;
    case 'server-imports-client':
      score += 15;
      break;
    case 'dynamic-candidate':
      score += 10;
      break;
    case 'serialization-trim':
      score += 5;
      break;
    // Review-only kinds get lower base scores
    case 'client-fetch-in-render':
      score -= 5; // Important but needs review
      break;
    case 'unstable-server-action':
    case 'rsc-cache-candidate':
    case 'boundary-churn':
      score -= 10; // Review-only, lower priority
      break;
  }

  return Math.min(100, Math.max(0, score));
}

export default clientBoundaryScanner;
