const REDACTION_MARKER = "[REDACTED]";

const COMPACT_JWT_PATTERN = /\b[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g;
const AUTHORIZATION_HEADER_PATTERN = /(\bAuthorization\s*:\s*)(?:Bearer|Basic)\s+[A-Za-z0-9._~+/=-]+/gi;
const COOKIE_HEADER_PATTERN = /(\b(?:Set-Cookie|Cookie)\s*:\s*)[^\r\n]+/gi;
const BEARER_PATTERN = /\bBearer\s+[A-Za-z0-9._~+/=-]{8,}/gi;
const SENSITIVE_ASSIGNMENT_PATTERN =
  /(\b(?:access[_-]?token|refresh[_-]?token|id[_-]?token|token|password|authorization|cookie|set-cookie|api[_-]?key|client[_-]?secret|secret)\b["']?\s*[:=]\s*)("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[^\r\n,;}]+)/gi;

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

function isAlreadyRedactedAssignmentValue(value) {
  const trimmed = String(value).trim();
  const unquoted =
    trimmed.length >= 2 &&
    ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'")))
      ? trimmed.slice(1, -1)
      : trimmed;
  return unquoted === REDACTION_MARKER;
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
  return String(value)
    .replace(COMPACT_JWT_PATTERN, (candidate) =>
      isCompactJwt(candidate) ? REDACTION_MARKER : candidate
    )
    .replace(AUTHORIZATION_HEADER_PATTERN, `$1${REDACTION_MARKER}`)
    .replace(COOKIE_HEADER_PATTERN, `$1${REDACTION_MARKER}`)
    .replace(BEARER_PATTERN, `Bearer ${REDACTION_MARKER}`)
    .replace(SENSITIVE_ASSIGNMENT_PATTERN, (match, prefix, assignmentValue) =>
      isAlreadyRedactedAssignmentValue(assignmentValue) ? match : `${prefix}${REDACTION_MARKER}`
    );
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
      if (redactEvidenceText(node) !== node) {
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
