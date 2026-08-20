const REDACTION_MARKER = "[REDACTED]";

const COMPACT_JWT_PATTERN = /\b[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g;
const AUTHORIZATION_HEADER_PATTERN = /(\bAuthorization\s*:\s*)(?:Bearer|Basic)\s+[A-Za-z0-9._~+/=-]+/gi;
const COOKIE_HEADER_PATTERN = /(\b(?:Set-Cookie|Cookie)\s*:\s*)[^\r\n]+/gi;
const BEARER_PATTERN = /\bBearer\s+[A-Za-z0-9._~+/=-]{8,}/gi;
const SENSITIVE_ASSIGNMENT_PREFIX_PATTERN =
  /(\b(?:access[_-]?token|refresh[_-]?token|id[_-]?token|token|password|authorization|cookie|set-cookie|api[_-]?key|client[_-]?secret|secret)\b(?:\\*["'])?\s*[:=]\s*)/gi;
const SENSITIVE_KEYS = new Set([
  "token",
  "accesstoken",
  "refreshtoken",
  "idtoken",
  "password",
  "authorization",
  "cookie",
  "setcookie",
  "apikey",
  "clientsecret",
  "secret",
]);

function normalizedKey(key) {
  return String(key).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isSensitiveKey(key) {
  return SENSITIVE_KEYS.has(normalizedKey(key));
}

function isAlreadySafeSensitiveValue(value) {
  return (
    value === null ||
    value === undefined ||
    value === false ||
    value === "" ||
    value === REDACTION_MARKER
  );
}

function countBackslashesBefore(value, index) {
  let count = 0;
  for (let cursor = index - 1; cursor >= 0 && value[cursor] === "\\"; cursor -= 1) {
    count += 1;
  }
  return count;
}

function assignmentValueSpan(value, start) {
  const relativeLineEnd = value.slice(start).search(/[\r\n]/);
  const lineEnd = relativeLineEnd === -1 ? value.length : start + relativeLineEnd;
  let slashCount = 0;
  while (start + slashCount < lineEnd && value[start + slashCount] === "\\") {
    slashCount += 1;
  }

  const quote = value[start + slashCount];
  if (quote === '"' || quote === "'") {
    const delimiter = "\\".repeat(slashCount) + quote;
    const contentStart = start + delimiter.length;
    for (let cursor = contentStart; cursor < lineEnd; cursor += 1) {
      if (value[cursor] !== quote || countBackslashesBefore(value, cursor) !== slashCount) continue;
      return {
        delimiter,
        end: cursor + 1,
        original: value.slice(start, cursor + 1),
        replacement: delimiter + REDACTION_MARKER + delimiter,
      };
    }
  }

  return {
    delimiter: "",
    end: lineEnd,
    original: value.slice(start, lineEnd),
    replacement: REDACTION_MARKER,
  };
}

function isAlreadyRedactedAssignmentValue(value, delimiter) {
  const trimmed = String(value).trim();
  const unquoted =
    delimiter && trimmed.startsWith(delimiter) && trimmed.endsWith(delimiter)
      ? trimmed.slice(delimiter.length, -delimiter.length)
      : trimmed;
  return (
    unquoted === REDACTION_MARKER ||
    /^\[REDACTED\](?:\s*[}\]])+\s*$/.test(unquoted)
  );
}

function containsPopulatedSensitiveAssignment(value) {
  const detector = new RegExp(
    SENSITIVE_ASSIGNMENT_PREFIX_PATTERN.source,
    SENSITIVE_ASSIGNMENT_PREFIX_PATTERN.flags
  );

  for (let match; (match = detector.exec(value)); ) {
    const span = assignmentValueSpan(value, detector.lastIndex);
    if (span.end === detector.lastIndex) continue;
    if (!isAlreadyRedactedAssignmentValue(span.original, span.delimiter)) return true;
    detector.lastIndex = span.end;
  }

  return false;
}

function redactSensitiveAssignments(value) {
  let result = "";
  let cursor = 0;
  SENSITIVE_ASSIGNMENT_PREFIX_PATTERN.lastIndex = 0;

  for (let match; (match = SENSITIVE_ASSIGNMENT_PREFIX_PATTERN.exec(value)); ) {
    const valueStart = SENSITIVE_ASSIGNMENT_PREFIX_PATTERN.lastIndex;
    const span = assignmentValueSpan(value, valueStart);
    if (span.end === valueStart) continue;

    result += value.slice(cursor, match.index);
    result += match[0];
    result += isAlreadyRedactedAssignmentValue(span.original, span.delimiter)
      ? span.original
      : span.replacement;
    cursor = span.end;
    SENSITIVE_ASSIGNMENT_PREFIX_PATTERN.lastIndex = span.end;
  }

  return result + value.slice(cursor);
}

function patternMatches(pattern, value) {
  pattern.lastIndex = 0;
  return pattern.test(value);
}

function isCompactJwt(candidate) {
  const segments = candidate.split(".");
  if (segments.length !== 3) return false;
  try {
    const header = JSON.parse(Buffer.from(segments[0], "base64url").toString("utf8"));
    const payload = JSON.parse(Buffer.from(segments[1], "base64url").toString("utf8"));
    return (
      header !== null &&
      typeof header === "object" &&
      typeof header.alg === "string" &&
      payload !== null &&
      typeof payload === "object"
    );
  } catch {
    return false;
  }
}

function containsCompactJwt(value) {
  COMPACT_JWT_PATTERN.lastIndex = 0;
  return [...value.matchAll(COMPACT_JWT_PATTERN)].some((match) => isCompactJwt(match[0]));
}

export function redactEvidenceText(value) {
  const redacted = String(value)
    .replace(COMPACT_JWT_PATTERN, (candidate) =>
      isCompactJwt(candidate) ? REDACTION_MARKER : candidate
    )
    .replace(AUTHORIZATION_HEADER_PATTERN, `$1${REDACTION_MARKER}`)
    .replace(COOKIE_HEADER_PATTERN, `$1${REDACTION_MARKER}`)
    .replace(BEARER_PATTERN, `Bearer ${REDACTION_MARKER}`);
  return redactSensitiveAssignments(redacted);
}

export function redactEvidence(value) {
  if (typeof value === "string") return redactEvidenceText(value);
  if (Array.isArray(value)) return value.map((item) => redactEvidence(item));
  if (value === null || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [
      key,
      isSensitiveKey(key) && !isAlreadySafeSensitiveValue(child)
        ? REDACTION_MARKER
        : redactEvidence(child),
    ])
  );
}

export function stringifyEvidence(value) {
  return `${JSON.stringify(redactEvidence(value), null, 2)}\n`;
}

export function findEvidenceCredentialFindings(value, location = "$") {
  const findings = [];

  const visit = (node, currentLocation) => {
    if (typeof node === "string") {
      if (containsCompactJwt(node)) {
        findings.push({ kind: "compact-jwt", location: currentLocation });
      }
      if (patternMatches(BEARER_PATTERN, node)) {
        findings.push({ kind: "bearer", location: currentLocation });
      }
      if (containsPopulatedSensitiveAssignment(node)) {
        findings.push({ kind: "sensitive-text", location: currentLocation });
      }
      return;
    }

    if (Array.isArray(node)) {
      node.forEach((child, index) => visit(child, `${currentLocation}[${index}]`));
      return;
    }

    if (node === null || typeof node !== "object") return;

    for (const [key, child] of Object.entries(node)) {
      const childLocation = `${currentLocation}.${key}`;
      if (isSensitiveKey(key) && !isAlreadySafeSensitiveValue(child)) {
        findings.push({ kind: "sensitive-field", location: childLocation });
      }
      visit(child, childLocation);
    }
  };

  visit(value, location);
  return findings;
}

export { REDACTION_MARKER };
