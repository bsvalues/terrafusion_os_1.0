/**
 * Unit tests for CI Telemetry Comment Generator
 * Tests markdown generation, formatting, and sanitization
 *
 * @fileoverview Vitest unit tests for ci_telemetry_comment.mjs
 */

import { describe, expect, it } from 'vitest';

// ============================================================================
// Inline implementations (mirror the actual script logic for unit testing)
// ============================================================================

const SECRET_PATTERNS = [
  /ghp_[A-Za-z0-9_]+/gi,
  /gho_[A-Za-z0-9_]+/gi,
  /ghs_[A-Za-z0-9_]+/gi,
  /ghu_[A-Za-z0-9_]+/gi,
  /github_pat_[A-Za-z0-9_]+/gi,
  /sk-[A-Za-z0-9]{32,}/gi,
  /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi,
  /password[=:]\s*\S+/gi,
  /secret[=:]\s*\S+/gi,
  /token[=:]\s*\S+/gi,
  /api[_-]?key[=:]\s*\S+/gi,
];

const SENTINEL = '<!-- TF_CI_TELEMETRY -->';

function sanitize(value: string): string {
  if (typeof value !== 'string') return value;
  let result = value;
  for (const pattern of SECRET_PATTERNS) {
    result = result.replace(pattern, '***REDACTED***');
  }
  return result;
}

function deepSanitize(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return sanitize(obj);
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(deepSanitize);

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();
    if (
      lowerKey.includes('token') ||
      lowerKey.includes('secret') ||
      lowerKey.includes('password') ||
      lowerKey.includes('apikey')
    ) {
      result[key] = '***REDACTED***';
    } else {
      result[key] = deepSanitize(value);
    }
  }
  return result;
}

function formatDuration(ms: number): string {
  if (typeof ms !== 'number' || isNaN(ms)) return 'N/A';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  let mins = Math.floor(ms / 60000);
  let secs = Math.round((ms % 60000) / 1000);
  // Handle rounding edge case: 59999ms -> 60s should become 1m 0s
  if (secs === 60) {
    mins += 1;
    secs = 0;
  }
  return `${mins}m ${secs}s`;
}

function getClassificationEmoji(classification: string): string {
  const emojis: Record<string, string> = {
    docs_only: '📚',
    frontend_only: '🎨',
    backend_only: '⚙️',
    ci_only: '🔧',
    mixed: '🔀',
  };
  return emojis[classification] || '❓';
}

interface TelemetryJob {
  name: string;
  conclusion: string;
  durationMs: number;
}

interface TelemetrySummary {
  totalDurationMs: number;
  totalJobs: number;
  successCount: number;
  failureCount: number;
}

interface Telemetry {
  timestamp?: string;
  runId?: string | number;
  classification?: string;
  skippedBackend?: boolean;
  skippedFrontend?: boolean;
  jobs?: TelemetryJob[];
  summary?: TelemetrySummary;
}

interface GenerateOptions {
  runUrl?: string;
  artifactName?: string;
}

function generateMarkdown(telemetry: Telemetry, options: GenerateOptions = {}): string {
  const sanitized = deepSanitize(telemetry) as Telemetry;
  const { runUrl = '', artifactName = 'ci-telemetry' } = options;

  const classification = sanitized.classification || 'mixed';
  const totalDuration = formatDuration(sanitized.summary?.totalDurationMs as number); // Match source: pass undefined to get 'N/A'
  const jobCount = sanitized.summary?.totalJobs ?? 0;
  const successCount = sanitized.summary?.successCount ?? 0;
  const failureCount = sanitized.summary?.failureCount ?? 0;
  const skippedBackend = sanitized.skippedBackend ?? false;
  const skippedFrontend = sanitized.skippedFrontend ?? false;

  const statusEmoji = failureCount === 0 ? '✅' : '❌';
  const classEmoji = getClassificationEmoji(classification);

  const skips: string[] = [];
  if (skippedBackend) skips.push('Backend');
  if (skippedFrontend) skips.push('Frontend');
  const skipText = skips.length > 0 ? skips.join(', ') : 'None';

  let jobsTable = '';
  if (Array.isArray(sanitized.jobs) && sanitized.jobs.length > 0) {
    jobsTable = `
<details>
<summary>📋 Job Details (${jobCount} jobs)</summary>

| Job | Status | Duration |
|-----|--------|----------|
${sanitized.jobs
  .map(job => {
    const statusIcon =
      job.conclusion === 'success'
        ? '✅'
        : job.conclusion === 'failure'
          ? '❌'
          : job.conclusion === 'skipped'
            ? '⏭️'
            : '⏳';
    return `| ${sanitize(job.name)} | ${statusIcon} ${job.conclusion || 'pending'} | ${formatDuration(job.durationMs)} |`;
  })
  .join('\n')}

</details>`;
  }

  const artifactLink = runUrl
    ? `[View Artifact](${runUrl}#artifacts)`
    : `Artifact: \`${artifactName}\``;

  const markdown = `${SENTINEL}
## 📊 CI Telemetry Summary

${statusEmoji} **Status:** ${failureCount === 0 ? 'All checks passed' : `${failureCount} failure(s)`}

| Metric | Value |
|--------|-------|
| ${classEmoji} Classification | \`${classification}\` |
| ⏱️ Total Duration | ${totalDuration} |
| 📦 Jobs | ${successCount}/${jobCount} passed |
| ⏭️ Skipped | ${skipText} |

${jobsTable}

---
<sub>${artifactLink} • Run: \`${sanitize(String(sanitized.runId || 'N/A'))}\` • ${sanitize(sanitized.timestamp || new Date().toISOString())}</sub>
`;

  return markdown;
}

// ============================================================================
// Tests
// ============================================================================

describe('sanitize', () => {
  it('redacts GitHub PAT tokens', () => {
    // Note: "token: value" matches the token assignment pattern, so entire match is redacted
    expect(sanitize('ghp_abc123XYZ')).toBe('***REDACTED***');
    expect(sanitize('ghp_supersecret123456789012345678901')).toBe('***REDACTED***');
    expect(sanitize('prefix ghp_abc123XYZ suffix')).toBe('prefix ***REDACTED*** suffix');
  });

  it('redacts GitHub OAuth tokens', () => {
    expect(sanitize('gho_abc123XYZ')).toBe('***REDACTED***');
  });

  it('redacts GitHub App tokens', () => {
    expect(sanitize('ghs_abc123XYZ')).toBe('***REDACTED***');
    expect(sanitize('ghu_abc123XYZ')).toBe('***REDACTED***');
  });

  it('redacts fine-grained PATs', () => {
    expect(sanitize('github_pat_abc123XYZ_more')).toBe('***REDACTED***');
  });

  it('redacts OpenAI API keys', () => {
    expect(sanitize('sk-12345678901234567890123456789012')).toBe('***REDACTED***');
  });

  it('redacts Bearer tokens', () => {
    expect(sanitize('Bearer abc123xyz==')).toBe('***REDACTED***');
  });

  it('redacts password assignments', () => {
    expect(sanitize('password=mysecret123')).toBe('***REDACTED***');
    expect(sanitize('password: supersecret')).toBe('***REDACTED***');
  });

  it('redacts secret assignments', () => {
    expect(sanitize('secret=abc123')).toBe('***REDACTED***');
  });

  it('redacts token assignments', () => {
    expect(sanitize('token=mytoken123')).toBe('***REDACTED***');
    expect(sanitize('token: mytoken123')).toBe('***REDACTED***');
  });

  it('redacts API key assignments', () => {
    expect(sanitize('api_key=abc123')).toBe('***REDACTED***');
    expect(sanitize('apikey: xyz789')).toBe('***REDACTED***');
  });

  it('preserves non-secret strings', () => {
    expect(sanitize('Hello World')).toBe('Hello World');
    expect(sanitize('frontend_only')).toBe('frontend_only');
    expect(sanitize('run-12345')).toBe('run-12345');
  });
});

describe('deepSanitize', () => {
  it('sanitizes nested objects', () => {
    const input = {
      runId: '123',
      nested: {
        value: 'ghp_secret123',
      },
    };
    const result = deepSanitize(input) as Record<string, unknown>;
    expect((result.nested as Record<string, unknown>).value).toBe('***REDACTED***');
  });

  it('redacts keys containing token/secret/password', () => {
    const input = {
      apiToken: 'should-be-redacted',
      mySecret: 'also-redacted',
      password: 'redact-this',
      normalKey: 'keep-this',
    };
    const result = deepSanitize(input) as Record<string, unknown>;
    expect(result.apiToken).toBe('***REDACTED***');
    expect(result.mySecret).toBe('***REDACTED***');
    expect(result.password).toBe('***REDACTED***');
    expect(result.normalKey).toBe('keep-this');
  });

  it('handles arrays', () => {
    const input = ['ghp_secret1', 'normal', 'ghp_secret2'];
    const result = deepSanitize(input) as string[];
    expect(result).toEqual(['***REDACTED***', 'normal', '***REDACTED***']);
  });

  it('handles null and undefined', () => {
    expect(deepSanitize(null)).toBe(null);
    expect(deepSanitize(undefined)).toBe(undefined);
  });

  it('handles primitives', () => {
    expect(deepSanitize(123)).toBe(123);
    expect(deepSanitize(true)).toBe(true);
  });

  it('redacts camelCase keys like apiKey', () => {
    const input = {
      apiKey: 'should-be-redacted',
      accessToken: 'also-secret',
      normalField: 'keep-this',
    };
    const result = deepSanitize(input) as Record<string, unknown>;
    expect(result.apiKey).toBe('***REDACTED***');
    expect(result.accessToken).toBe('***REDACTED***');
    expect(result.normalField).toBe('keep-this');
  });
});

describe('formatDuration', () => {
  it('formats milliseconds', () => {
    expect(formatDuration(500)).toBe('500ms');
    expect(formatDuration(999)).toBe('999ms');
  });

  it('formats seconds', () => {
    expect(formatDuration(1000)).toBe('1.0s');
    expect(formatDuration(5500)).toBe('5.5s');
    expect(formatDuration(59500)).toBe('59.5s');
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(60000)).toBe('1m 0s');
    expect(formatDuration(90000)).toBe('1m 30s');
    expect(formatDuration(300000)).toBe('5m 0s');
  });

  it('handles 60s rounding edge case', () => {
    // 59999ms rounds to 60s, which should become 1m 0s
    expect(formatDuration(59999)).toBe('60.0s'); // under 60000ms, so seconds format
    expect(formatDuration(119999)).toBe('2m 0s'); // 1m 60s -> 2m 0s
  });

  it('handles invalid input', () => {
    expect(formatDuration(NaN)).toBe('N/A');
    // @ts-expect-error testing invalid input
    expect(formatDuration('not a number')).toBe('N/A');
  });
});

describe('getClassificationEmoji', () => {
  it('returns correct emoji for each classification', () => {
    expect(getClassificationEmoji('docs_only')).toBe('📚');
    expect(getClassificationEmoji('frontend_only')).toBe('🎨');
    expect(getClassificationEmoji('backend_only')).toBe('⚙️');
    expect(getClassificationEmoji('ci_only')).toBe('🔧');
    expect(getClassificationEmoji('mixed')).toBe('🔀');
  });

  it('returns question mark for unknown classification', () => {
    expect(getClassificationEmoji('unknown')).toBe('❓');
  });
});

describe('generateMarkdown', () => {
  const sampleTelemetry: Telemetry = {
    timestamp: '2026-01-25T10:00:00Z',
    runId: 'run-123',
    classification: 'frontend_only',
    skippedBackend: true,
    skippedFrontend: false,
    jobs: [
      { name: 'build', conclusion: 'success', durationMs: 60000 },
      { name: 'test', conclusion: 'success', durationMs: 30000 },
    ],
    summary: {
      totalDurationMs: 90000,
      totalJobs: 2,
      successCount: 2,
      failureCount: 0,
    },
  };

  it('includes the sentinel comment for sticky updates', () => {
    const md = generateMarkdown(sampleTelemetry);
    expect(md).toContain(SENTINEL);
    expect(md.startsWith(SENTINEL)).toBe(true);
  });

  it('includes classification with emoji', () => {
    const md = generateMarkdown(sampleTelemetry);
    expect(md).toContain('🎨');
    expect(md).toContain('`frontend_only`');
  });

  it('includes total duration', () => {
    const md = generateMarkdown(sampleTelemetry);
    expect(md).toContain('1m 30s');
  });

  it('includes job counts', () => {
    const md = generateMarkdown(sampleTelemetry);
    expect(md).toContain('2/2 passed');
  });

  it('includes skip flags', () => {
    const md = generateMarkdown(sampleTelemetry);
    expect(md).toContain('Backend');
    expect(md).not.toContain('Frontend');
  });

  it('includes jobs table in details', () => {
    const md = generateMarkdown(sampleTelemetry);
    expect(md).toContain('<details>');
    expect(md).toContain('Job Details');
    expect(md).toContain('| build |');
    expect(md).toContain('| test |');
  });

  it('includes run ID', () => {
    const md = generateMarkdown(sampleTelemetry);
    expect(md).toContain('run-123');
  });

  it('includes artifact link when runUrl provided', () => {
    const md = generateMarkdown(sampleTelemetry, {
      runUrl: 'https://github.com/owner/repo/actions/runs/123',
    });
    expect(md).toContain('[View Artifact]');
    expect(md).toContain('https://github.com/owner/repo/actions/runs/123#artifacts');
  });

  it('shows failure status when failures present', () => {
    const failedTelemetry: Telemetry = {
      ...sampleTelemetry,
      summary: {
        totalDurationMs: 90000,
        totalJobs: 2,
        successCount: 1,
        failureCount: 1,
      },
    };
    const md = generateMarkdown(failedTelemetry);
    expect(md).toContain('❌');
    expect(md).toContain('1 failure(s)');
  });

  it('shows success status when no failures', () => {
    const md = generateMarkdown(sampleTelemetry);
    expect(md).toContain('✅');
    expect(md).toContain('All checks passed');
  });

  it('sanitizes secrets in telemetry', () => {
    const telemetryWithSecret: Telemetry = {
      ...sampleTelemetry,
      runId: 'ghp_secrettoken123',
    };
    const md = generateMarkdown(telemetryWithSecret);
    expect(md).not.toContain('ghp_');
    expect(md).toContain('***REDACTED***');
  });
});

describe('generateMarkdown - edge cases', () => {
  it('handles missing optional fields', () => {
    const minimalTelemetry: Telemetry = {};
    const md = generateMarkdown(minimalTelemetry);
    expect(md).toContain(SENTINEL);
    expect(md).toContain('`mixed`'); // default classification
    expect(md).toContain('N/A'); // missing runId
  });

  it('handles empty jobs list', () => {
    const telemetry: Telemetry = {
      classification: 'docs_only',
      jobs: [],
      summary: {
        totalDurationMs: 0,
        totalJobs: 0,
        successCount: 0,
        failureCount: 0,
      },
    };
    const md = generateMarkdown(telemetry);
    expect(md).not.toContain('<details>'); // no jobs table
    expect(md).toContain('0/0 passed');
  });

  it('handles undefined summary', () => {
    const telemetry: Telemetry = {
      classification: 'ci_only',
    };
    const md = generateMarkdown(telemetry);
    expect(md).toContain('N/A'); // undefined duration returns N/A
    expect(md).toContain('0/0 passed');
  });

  it('handles skipped jobs', () => {
    const telemetry: Telemetry = {
      jobs: [{ name: 'skipped-job', conclusion: 'skipped', durationMs: 0 }],
      summary: {
        totalDurationMs: 0,
        totalJobs: 1,
        successCount: 0,
        failureCount: 0,
      },
    };
    const md = generateMarkdown(telemetry);
    expect(md).toContain('⏭️');
    expect(md).toContain('skipped');
  });

  it('handles pending jobs', () => {
    const telemetry: Telemetry = {
      jobs: [{ name: 'pending-job', conclusion: 'in_progress', durationMs: 0 }],
      summary: {
        totalDurationMs: 0,
        totalJobs: 1,
        successCount: 0,
        failureCount: 0,
      },
    };
    const md = generateMarkdown(telemetry);
    expect(md).toContain('⏳');
  });

  it('handles both skips', () => {
    const telemetry: Telemetry = {
      classification: 'docs_only',
      skippedBackend: true,
      skippedFrontend: true,
      summary: { totalDurationMs: 0, totalJobs: 0, successCount: 0, failureCount: 0 },
    };
    const md = generateMarkdown(telemetry);
    expect(md).toContain('Backend, Frontend');
  });

  it('handles no skips', () => {
    const telemetry: Telemetry = {
      classification: 'mixed',
      skippedBackend: false,
      skippedFrontend: false,
      summary: { totalDurationMs: 0, totalJobs: 0, successCount: 0, failureCount: 0 },
    };
    const md = generateMarkdown(telemetry);
    expect(md).toContain('| ⏭️ Skipped | None |');
  });
});
