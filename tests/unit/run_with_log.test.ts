/**
 * Government-Grade Security Tests for run_with_log.mjs
 *
 * Freezes the security posture of the CI command runner:
 * - Command allowlist enforcement
 * - Dangerous character rejection (cmd.exe expansion attacks)
 * - Cross-platform argument quoting
 * - Secret redaction in audit logs
 */
import { describe, expect, it } from 'vitest';
import {
  ALLOWED_COMMANDS,
  hasDangerousChars,
  isPreQuoted,
  quoteCmdArg,
  quotePosixArg,
  redactArg,
  redactArgs,
} from '../../scripts/ci/run_with_log.mjs';

describe('run_with_log security posture', () => {
  describe('ALLOWED_COMMANDS allowlist', () => {
    it('allows trusted CI commands', () => {
      expect(ALLOWED_COMMANDS.has('pnpm')).toBe(true);
      expect(ALLOWED_COMMANDS.has('npm')).toBe(true);
      expect(ALLOWED_COMMANDS.has('node')).toBe(true);
      expect(ALLOWED_COMMANDS.has('dotnet')).toBe(true);
      expect(ALLOWED_COMMANDS.has('gh')).toBe(true);
      expect(ALLOWED_COMMANDS.has('git')).toBe(true);
      expect(ALLOWED_COMMANDS.has('docker')).toBe(true);
    });

    it('blocks untrusted commands', () => {
      expect(ALLOWED_COMMANDS.has('curl')).toBe(false);
      expect(ALLOWED_COMMANDS.has('wget')).toBe(false);
      expect(ALLOWED_COMMANDS.has('rm')).toBe(false);
      expect(ALLOWED_COMMANDS.has('del')).toBe(false);
      expect(ALLOWED_COMMANDS.has('eval')).toBe(false);
    });
  });

  describe('hasDangerousChars()', () => {
    it('rejects % (environment variable expansion)', () => {
      expect(hasDangerousChars('%PATH%')).toBe(true);
      expect(hasDangerousChars('hello%world')).toBe(true);
      expect(hasDangerousChars('%')).toBe(true);
    });

    it('rejects ! (delayed expansion)', () => {
      expect(hasDangerousChars('!VAR!')).toBe(true);
      expect(hasDangerousChars('hello!world')).toBe(true);
      expect(hasDangerousChars('!')).toBe(true);
    });

    it('allows safe characters', () => {
      expect(hasDangerousChars('hello')).toBe(false);
      expect(hasDangerousChars('hello world')).toBe(false);
      expect(hasDangerousChars('hello&world')).toBe(false);
      expect(hasDangerousChars('a|b')).toBe(false);
    });
  });

  describe('isPreQuoted()', () => {
    it('recognizes properly quoted strings', () => {
      expect(isPreQuoted('"hello world"')).toBe(true);
      expect(isPreQuoted("'hello world'")).toBe(true);
      expect(isPreQuoted('""')).toBe(true);
      expect(isPreQuoted("''")).toBe(true);
    });

    it('rejects unbalanced quotes', () => {
      expect(isPreQuoted('"foo"bar"')).toBe(false);
      expect(isPreQuoted('"hello')).toBe(false);
      expect(isPreQuoted('hello"')).toBe(false);
    });

    it('rejects unquoted strings', () => {
      expect(isPreQuoted('hello')).toBe(false);
      expect(isPreQuoted('hello world')).toBe(false);
      expect(isPreQuoted('')).toBe(false);
      expect(isPreQuoted('"')).toBe(false);
    });
  });

  describe('quoteCmdArg() - Windows cmd.exe quoting', () => {
    it('quotes strings with spaces', () => {
      expect(quoteCmdArg('hello world')).toBe('"hello world"');
    });

    it('quotes strings with special chars: & | < > ( )', () => {
      expect(quoteCmdArg('hello&world')).toBe('"hello&world"');
      expect(quoteCmdArg('a|b')).toBe('"a|b"');
      expect(quoteCmdArg('a>b')).toBe('"a>b"');
      expect(quoteCmdArg('a<b')).toBe('"a<b"');
      expect(quoteCmdArg('a(b)c')).toBe('"a(b)c"');
    });

    it('escapes caret (^) properly', () => {
      expect(quoteCmdArg('a^b')).toBe('"a^^b"');
    });

    it('escapes internal quotes', () => {
      expect(quoteCmdArg('say "hello"')).toBe('"say ^"hello^""');
    });

    it('passes through safe strings unchanged', () => {
      expect(quoteCmdArg('hello')).toBe('hello');
      expect(quoteCmdArg('--flag=value')).toBe('--flag=value');
    });

    it('passes through pre-quoted strings unchanged', () => {
      expect(quoteCmdArg('"already quoted"')).toBe('"already quoted"');
    });

    it('throws on % (env var expansion attack)', () => {
      expect(() => quoteCmdArg('%PATH%')).toThrow('dangerous characters');
      expect(() => quoteCmdArg('hello%world')).toThrow('dangerous characters');
    });

    it('throws on ! (delayed expansion attack)', () => {
      expect(() => quoteCmdArg('!VAR!')).toThrow('dangerous characters');
      expect(() => quoteCmdArg('hello!world')).toThrow('dangerous characters');
    });
  });

  describe('quotePosixArg() - POSIX shell quoting', () => {
    it('quotes strings with spaces', () => {
      expect(quotePosixArg('hello world')).toBe("'hello world'");
    });

    it('quotes strings with special chars', () => {
      expect(quotePosixArg('$HOME')).toBe("'$HOME'");
      expect(quotePosixArg('a`b`c')).toBe("'a`b`c'");
      expect(quotePosixArg('a|b')).toBe("'a|b'");
    });

    it('escapes single quotes', () => {
      expect(quotePosixArg("it's")).toBe("'it'\\''s'");
    });

    it('passes through safe strings unchanged', () => {
      expect(quotePosixArg('hello')).toBe('hello');
      expect(quotePosixArg('--flag=value')).toBe('--flag=value');
    });
  });

  describe('redactArg() - secret redaction', () => {
    it('redacts --token=secret form', () => {
      expect(redactArg('--token=secret123')).toBe('--token=***REDACTED***');
      expect(redactArg('--password=hunter2')).toBe('--password=***REDACTED***');
      expect(redactArg('--api-key=abc123')).toBe('--api-key=***REDACTED***');
      expect(redactArg('--secret=xyz')).toBe('--secret=***REDACTED***');
    });

    it('redacts environment variable assignments', () => {
      expect(redactArg('GH_TOKEN=abc123')).toBe('GH_TOKEN=***REDACTED***');
      expect(redactArg('GITHUB_TOKEN=xyz')).toBe('GITHUB_TOKEN=***REDACTED***');
      expect(redactArg('NPM_TOKEN=token123')).toBe('NPM_TOKEN=***REDACTED***');
    });

    it('redacts Authorization headers', () => {
      expect(redactArg('Authorization: Bearer abc123')).toBe(
        'Authorization: Bearer ***REDACTED***'
      );
    });

    it('redacts Bearer token in isolation', () => {
      expect(redactArg('Bearer mytoken123')).toBe('Bearer ***REDACTED***');
    });

    it('leaves non-secret args unchanged', () => {
      expect(redactArg('--verbose')).toBe('--verbose');
      expect(redactArg('hello')).toBe('hello');
      expect(redactArg('--config=file.json')).toBe('--config=file.json');
    });
  });

  describe('redactArgs() - two-arg secret patterns', () => {
    it('redacts value following --token flag', () => {
      const result = redactArgs(['--token', 'secret123']);
      expect(result).toEqual(['--token', '***REDACTED***']);
    });

    it('redacts value following -t flag', () => {
      const result = redactArgs(['-t', 'secret123']);
      expect(result).toEqual(['-t', '***REDACTED***']);
    });

    it('redacts value following --password flag', () => {
      const result = redactArgs(['--password', 'hunter2']);
      expect(result).toEqual(['--password', '***REDACTED***']);
    });

    it('redacts -H header values (curl pattern)', () => {
      // -H is a secret flag, so the following arg gets partial Bearer redaction
      // (the arg still contains "Authorization:" prefix for debugging)
      const result = redactArgs(['-H', 'Authorization: Bearer abc123']);
      expect(result).toEqual(['-H', 'Authorization: Bearer ***REDACTED***']);
    });

    it('handles mixed args with multiple secrets', () => {
      const result = redactArgs([
        'pnpm',
        'run',
        '--token',
        'secret1',
        '--verbose',
        '--password=secret2',
      ]);
      expect(result).toEqual([
        'pnpm',
        'run',
        '--token',
        '***REDACTED***',
        '--verbose',
        '--password=***REDACTED***',
      ]);
    });

    it('leaves non-secret args unchanged', () => {
      const result = redactArgs(['pnpm', 'run', 'ci:governance-proof']);
      expect(result).toEqual(['pnpm', 'run', 'ci:governance-proof']);
    });
  });
});
