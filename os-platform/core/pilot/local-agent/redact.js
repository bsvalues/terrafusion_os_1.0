// GENERATED - DO NOT EDIT
"use strict";
// TerraFusion local-agent telemetry redactor.
//
// Pure functions, no I/O, no globals. Scrubs PII and secret patterns from
// arbitrary JSON-shaped payloads before they are persisted to
// .terrafusion/agent-events.jsonl. Structure is preserved (objects stay
// objects, arrays stay arrays, lengths unchanged) so audit trails remain
// useful for debugging.
Object.defineProperty(exports, "__esModule", { value: true });
exports.redactPayload = redactPayload;
exports.redactStringValue = redactStringValue;
// Order matters: longer / more specific patterns first so a Bearer token
// is not partially matched by the JWT pattern (or vice versa).
const PATTERNS = [
    // Bearer / token headers (consume value too).
    {
        kind: 'bearer',
        re: /\bBearer\s+[A-Za-z0-9._\-+/=]+/g,
        transform: () => 'Bearer [REDACTED:bearer]',
    },
    // JWT-shaped string (3 base64url segments).
    {
        kind: 'jwt',
        re: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
        transform: () => '[REDACTED:jwt]',
    },
    // GitHub PAT / app tokens.
    {
        kind: 'github-token',
        re: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}\b/g,
        transform: () => '[REDACTED:github-token]',
    },
    // Slack bot token.
    {
        kind: 'slack-token',
        re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g,
        transform: () => '[REDACTED:slack-token]',
    },
    // Stripe-style live/test keys.
    {
        kind: 'stripe-key',
        re: /\b(?:sk|pk|rk)_(?:live|test)_[A-Za-z0-9]{16,}\b/g,
        transform: () => '[REDACTED:stripe-key]',
    },
    // Generic OpenAI-style sk- keys (sk- followed by 32+ alnum).
    {
        kind: 'api-key',
        re: /\bsk-[A-Za-z0-9_-]{20,}\b/g,
        transform: () => '[REDACTED:api-key]',
    },
    // AWS access key ids.
    {
        kind: 'aws-akid',
        re: /\bAKIA[0-9A-Z]{16}\b/g,
        transform: () => '[REDACTED:aws-akid]',
    },
    // Email addresses.
    {
        kind: 'email',
        re: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
        transform: () => '[REDACTED:email]',
    },
    // US SSN.
    {
        kind: 'ssn',
        re: /\b\d{3}-\d{2}-\d{4}\b/g,
        transform: () => '[REDACTED:ssn]',
    },
    // Windows user paths — preserve directory shape, redact only the user name.
    {
        kind: 'win-userpath',
        re: /([Cc]:\\Users\\)[^\\\/\s"'`]+/g,
        transform: (match) => {
            const idx = match.toLowerCase().indexOf('users\\') + 'users\\'.length;
            return match.slice(0, idx) + '[redacted-user]';
        },
    },
    // POSIX home directories.
    {
        kind: 'posix-home',
        re: /(\/home\/|\/Users\/)[^\/\s"'`]+/g,
        transform: (match) => {
            const slash = match.indexOf('/', 1);
            const second = match.indexOf('/', slash + 1);
            return match.slice(0, second === -1 ? match.length : second).replace(/[^\/]+$/, '[redacted-user]');
        },
    },
];
function redactString(input, stats) {
    let out = input;
    for (const pattern of PATTERNS) {
        out = out.replace(pattern.re, (match) => {
            stats.replacements += 1;
            return pattern.transform ? pattern.transform(match) : `[REDACTED:${pattern.kind}]`;
        });
    }
    return out;
}
function isPlainObject(value) {
    if (value === null || typeof value !== 'object')
        return false;
    const proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
}
function redactRec(value, stats) {
    if (typeof value === 'string') {
        return redactString(value, stats);
    }
    if (typeof value === 'number' || typeof value === 'boolean' || value === null) {
        return value;
    }
    if (Array.isArray(value)) {
        const out = new Array(value.length);
        for (let i = 0; i < value.length; i += 1) {
            out[i] = redactRec(value[i], stats);
        }
        return out;
    }
    if (isPlainObject(value)) {
        const out = {};
        for (const key of Object.keys(value)) {
            // Redact string-shaped keys too — though we only scrub the value, not
            // the key, to keep the audit trail's shape predictable. If a future
            // policy demands key redaction, it goes here.
            out[key] = redactRec(value[key], stats);
        }
        return out;
    }
    // Anything else (Date, Buffer, Map, function, undefined) is collapsed.
    if (typeof value === 'undefined')
        return null;
    return '[redacted-non-plain]';
}
/**
 * Redact a payload object, returning a new object (input is not mutated)
 * along with stats describing how many redactions fired.
 */
function redactPayload(payload) {
    const stats = { replacements: 0 };
    const value = redactRec(payload, stats);
    if (!isPlainObject(value)) {
        // Should be impossible (input is plain), but defensively coerce.
        return { value: {}, stats };
    }
    return { value: value, stats };
}
/** Convenience: redact a single string value (used by tests). */
function redactStringValue(input) {
    const stats = { replacements: 0 };
    return redactString(input, stats);
}
