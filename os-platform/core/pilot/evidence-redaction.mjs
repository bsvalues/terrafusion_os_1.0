const REDACTION_MARKER = "[REDACTED]";

const COMPACT_JWT_PATTERN = /\b[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g;
const AUTHORIZATION_HEADER_PATTERN = /(\bAuthorization\s*:\s*)(?:Bearer|Basic)\s+[A-Za-z0-9._~+/=-]+/gi;
const COOKIE_HEADER_PATTERN = /(\b(?:Set-Cookie|Cookie)\s*:\s*)[^\r\n]+/gi;
const BEARER_PATTERN = /\bBearer\s+[A-Za-z0-9._~+/=-]{8,}/gi;
const SENSITIVE_ASSIGNMENT_PREFIX_PATTERN =
  /(\b(?:access[_-]?token|refresh[_-]?token|id[_-]?token|token|password|authorization|cookie|set-cookie|api[_-]?key|client[_-]?secret|secret)\b(?:\\*["'])?[ \t]*[:=][ \t]*)/gi;
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

function isClosingAssignmentDelimiter(value, index, openingSlashCount) {
  const runLength = countBackslashesBefore(value, index);
  const serializationUnit = openingSlashCount + 1;
  const quotient = (runLength + 1) / serializationUnit;
  return Number.isInteger(quotient) && quotient % 2 === 1;
}

function isStructurallyTerminatedDelimiter(value, index) {
  let cursor = index + 1;
  while (cursor < value.length && (value[cursor] === " " || value[cursor] === "\t")) {
    cursor += 1;
  }
  return (
    cursor === value.length ||
    value[cursor] === "\r" ||
    value[cursor] === "\n" ||
    value[cursor] === "," ||
    value[cursor] === ";" ||
    value[cursor] === "}" ||
    value[cursor] === "]"
  );
}

function unquotedPemSpan(value, start, lineEnd) {
  const firstLine = value.slice(start, lineEnd);
  const match = /^-----BEGIN ([A-Z0-9]+(?: [A-Z0-9]+)*)-----[ \t]*$/.exec(firstLine);
  if (!match) return null;

  const endMarker = "-----END " + match[1] + "-----";
  const markerIndex = value.indexOf(endMarker, lineEnd);
  const end = markerIndex === -1 ? value.length : markerIndex + endMarker.length;
  return {
    delimiter: "",
    end,
    original: value.slice(start, end),
    replacement: REDACTION_MARKER,
  };
}

function neighboringAssignmentLines(value, contentStart) {
  const neighbors = [];
  const firstLineEnd = value.slice(contentStart).search(/[\r\n]/);
  if (firstLineEnd === -1) return neighbors;

  let lineStart = contentStart + firstLineEnd;
  lineStart += value[lineStart] === "\r" && value[lineStart + 1] === "\n" ? 2 : 1;
  while (lineStart < value.length) {
    const relativeLineEnd = value.slice(lineStart).search(/[\r\n]/);
    const lineEnd = relativeLineEnd === -1 ? value.length : lineStart + relativeLineEnd;
    const line = value.slice(lineStart, lineEnd);
    const match = /^([A-Za-z_][A-Za-z0-9_.-]*)[ \t]*[:=]/.exec(line);
    if (match && !isSensitiveKey(match[1])) {
      const separatorStart =
        lineStart >= 2 && value.slice(lineStart - 2, lineStart) === "\r\n"
          ? lineStart - 2
          : lineStart - 1;
      neighbors.push({
        start: lineStart,
        end: lineEnd,
        preserved: value.slice(separatorStart, lineEnd),
      });
    }
    if (lineEnd === value.length) break;
    lineStart =
      value[lineEnd] === "\r" && value[lineEnd + 1] === "\n"
        ? lineEnd + 2
        : lineEnd + 1;
  }
  return neighbors;
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
    const neighboringAssignments = neighboringAssignmentLines(value, contentStart);
    const firstNeighborStart = neighboringAssignments[0]?.start ?? Number.POSITIVE_INFINITY;
    let sawAmbiguousDelimiterOnLine = false;
    for (let cursor = contentStart; cursor < value.length; cursor += 1) {
      if (value[cursor] === "\r" || value[cursor] === "\n") {
        sawAmbiguousDelimiterOnLine = false;
        continue;
      }
      if (
        cursor >= firstNeighborStart ||
        value[cursor] !== quote ||
        !isClosingAssignmentDelimiter(value, cursor, slashCount)
      ) {
        continue;
      }
      if (!isStructurallyTerminatedDelimiter(value, cursor)) {
        sawAmbiguousDelimiterOnLine = true;
        continue;
      }
      if (sawAmbiguousDelimiterOnLine) continue;
      return {
        delimiter,
        end: cursor + 1,
        original: value.slice(start, cursor + 1),
        replacement: delimiter + REDACTION_MARKER + delimiter,
      };
    }
    return {
      delimiter,
      end: value.length,
      original: value.slice(start),
      replacement:
        delimiter +
        REDACTION_MARKER +
        delimiter +
        neighboringAssignments.map((neighbor) => neighbor.preserved).join(""),
    };
  }

  const pemSpan = unquotedPemSpan(value, start, lineEnd);
  if (pemSpan) return pemSpan;

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

function populatedSensitiveAssignmentSpans(value) {
  const spans = [];
  const detector = new RegExp(
    SENSITIVE_ASSIGNMENT_PREFIX_PATTERN.source,
    SENSITIVE_ASSIGNMENT_PREFIX_PATTERN.flags
  );

  for (let match; (match = detector.exec(value)); ) {
    const valueStart = detector.lastIndex;
    const span = assignmentValueSpan(value, valueStart);
    if (span.end === valueStart) continue;
    if (!isAlreadyRedactedAssignmentValue(span.original, span.delimiter)) {
      spans.push({ start: match.index, end: span.end });
    }
    detector.lastIndex = span.end;
  }

  return spans;
}

function regexCredentialSpans(pattern, value, kindForMatch, priority) {
  const detector = new RegExp(pattern.source, pattern.flags);
  const spans = [];
  for (const match of value.matchAll(detector)) {
    const kind = kindForMatch(match);
    if (kind === null) continue;
    spans.push({
      start: match.index,
      end: match.index + match[0].length,
      kind,
      priority,
    });
  }
  return spans;
}

function textCredentialFindingSpans(value) {
  const candidates = [
    ...populatedSensitiveAssignmentSpans(value).map((span) => ({
      ...span,
      kind: "sensitive-text",
      priority: 4,
    })),
    ...regexCredentialSpans(
      AUTHORIZATION_HEADER_PATTERN,
      value,
      (match) => (match[0].toLowerCase().includes("basic") ? "basic-auth" : "bearer"),
      5
    ),
    ...regexCredentialSpans(
      COOKIE_HEADER_PATTERN,
      value,
      (match) =>
        isAlreadyRedactedAssignmentValue(match[0].slice(match[1].length), "")
          ? null
          : "cookie",
      5
    ),
    ...regexCredentialSpans(BEARER_PATTERN, value, () => "bearer", 3),
    ...[
      ...value.matchAll(
        new RegExp(COMPACT_JWT_PATTERN.source, COMPACT_JWT_PATTERN.flags)
      ),
    ].filter((match) => isCompactJwt(match[0]))
      .map((match) => ({
        start: match.index,
        end: match.index + match[0].length,
        kind: "compact-jwt",
        priority: 2,
      })),
  ].sort(
    (left, right) =>
      left.start - right.start ||
      right.priority - left.priority ||
      right.end - left.end
  );

  const findings = [];
  for (const candidate of candidates) {
    if (
      findings.some(
        (finding) =>
          candidate.start < finding.end && finding.start < candidate.end
      )
    ) {
      continue;
    }
    findings.push(candidate);
  }
  return findings.sort((left, right) => left.start - right.start);
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

function parseStructuredJsonText(value) {
  let current = String(value);
  let wrapperDepth = 0;

  while (true) {
    let parsed;
    try {
      parsed = JSON.parse(current);
    } catch {
      return wrapperDepth > 0 ? { value: current, wrapperDepth } : null;
    }

    if (parsed !== null && typeof parsed === "object") {
      return { value: parsed, wrapperDepth, source: current };
    }
    if (typeof parsed !== "string" || parsed.length >= current.length) {
      return wrapperDepth > 0 ? { value: current, wrapperDepth } : null;
    }

    current = parsed;
    wrapperDepth += 1;
  }
}

function stringifyStructuredJsonText(value, wrapperDepth) {
  let result =
    typeof value === "string"
      ? redactEvidenceText(value)
      : JSON.stringify(redactEvidence(value));
  for (let depth = 0; depth < wrapperDepth; depth += 1) {
    result = JSON.stringify(result);
  }
  return result;
}

function jsonStringEnd(value, start) {
  let escaped = false;
  for (let cursor = start + 1; cursor < value.length; cursor += 1) {
    if (escaped) {
      escaped = false;
    } else if (value[cursor] === "\\") {
      escaped = true;
    } else if (value[cursor] === '"') {
      return cursor + 1;
    }
  }
  return null;
}

function isJsonValueBoundary(value, index) {
  return (
    index === value.length ||
    /[\s,}\]]/.test(value[index])
  );
}

function isSafeSensitiveJsonSourceValue(value, start) {
  let cursor = start;
  while (cursor < value.length && /\s/.test(value[cursor])) cursor += 1;
  for (const literal of ["null", "false"]) {
    if (
      value.startsWith(literal, cursor) &&
      isJsonValueBoundary(value, cursor + literal.length)
    ) {
      return true;
    }
  }
  if (value[cursor] !== '"') return false;

  const end = jsonStringEnd(value, cursor);
  if (end === null) return false;
  try {
    return isAlreadySafeSensitiveValue(JSON.parse(value.slice(cursor, end)));
  } catch {
    return false;
  }
}

function populatedSensitiveJsonSourceMemberOffsets(value) {
  const offsets = [];
  for (let cursor = 0; cursor < value.length; cursor += 1) {
    if (value[cursor] !== '"') continue;
    const end = jsonStringEnd(value, cursor);
    if (end === null) {
      offsets.push(cursor);
      break;
    }

    let separator = end;
    while (separator < value.length && /\s/.test(value[separator])) separator += 1;
    if (value[separator] === ":") {
      let key;
      try {
        key = JSON.parse(value.slice(cursor, end));
      } catch {
        offsets.push(cursor);
        cursor = end - 1;
        continue;
      }
      if (
        isSensitiveKey(key) &&
        !isSafeSensitiveJsonSourceValue(value, separator + 1)
      ) {
        offsets.push(cursor);
      }
    }
    cursor = end - 1;
  }
  return offsets;
}

function jsonSourceStringValues(value) {
  const stringValues = [];
  for (let cursor = 0; cursor < value.length; cursor += 1) {
    if (value[cursor] !== '"') continue;
    const end = jsonStringEnd(value, cursor);
    if (end === null) break;

    let separator = end;
    while (separator < value.length && /[ \t\r\n]/.test(value[separator])) separator += 1;
    if (value[separator] !== ":") {
      try {
        const parsed = JSON.parse(value.slice(cursor, end));
        if (typeof parsed === "string") {
          stringValues.push({ offset: cursor, value: parsed });
        }
      } catch {
        // The containing structured JSON parser owns malformed-source failure.
      }
    }
    cursor = end - 1;
  }
  return stringValues;
}

function jsonPointerSegment(value) {
  return String(value).replaceAll("~", "~0").replaceAll("/", "~1");
}

function decodeSerializedJsonFragment(candidate) {
  let current = candidate;
  let serializationDepth = 0;

  while (true) {
    try {
      const parsed = JSON.parse(current);
      if (parsed !== null && typeof parsed === "object") {
        return { value: parsed, serializationDepth, source: current };
      }
    } catch {
      // The candidate may be JSON string content with independently escaped quotes.
    }

    let decoded;
    try {
      decoded = JSON.parse(`"${current}"`);
    } catch {
      return null;
    }
    if (typeof decoded !== "string" || decoded.length >= current.length) return null;
    current = decoded;
    serializationDepth += 1;
  }
}

function encodeSerializedJsonFragment(value, serializationDepth) {
  let result = JSON.stringify(redactEvidence(value));
  for (let depth = 0; depth < serializationDepth; depth += 1) {
    result = JSON.stringify(result).slice(1, -1);
  }
  return result;
}

function isPossibleJsonFragmentStart(value, start) {
  const opening = value[start];
  const closing = opening === "{" ? "}" : "]";
  let cursor = start + 1;
  while (cursor < value.length && /\s/.test(value[cursor])) cursor += 1;
  if (value[cursor] === closing) return true;

  while (value[cursor] === "\\") cursor += 1;
  if (opening === "{") return /["nrt]/.test(value[cursor] ?? "");
  return /["{[\]tfnr\d-]/.test(value[cursor] ?? "");
}

function serializedJsonFragmentEnd(value, start) {
  const stack = [value[start]];
  let delimiterSlashCount = null;
  let inString = false;

  for (let cursor = start + 1; cursor < value.length; cursor += 1) {
    const character = value[cursor];
    if (character === '"') {
      const slashCount = countBackslashesBefore(value, cursor);
      if (delimiterSlashCount === null) {
        if (!Number.isInteger(Math.log2(slashCount + 1))) return null;
        delimiterSlashCount = slashCount;
        inString = true;
      } else if (!inString && slashCount === delimiterSlashCount) {
        inString = true;
      } else if (
        inString &&
        isClosingAssignmentDelimiter(value, cursor, delimiterSlashCount)
      ) {
        inString = false;
      }
      continue;
    }
    if (inString) continue;

    if (character === "{" || character === "[") {
      stack.push(character);
      continue;
    }
    if (character !== "}" && character !== "]") continue;

    const opening = stack.pop();
    if (
      (opening === "{" && character !== "}") ||
      (opening === "[" && character !== "]")
    ) {
      return null;
    }
    if (stack.length === 0) return cursor + 1;
  }

  return null;
}

function structuredJsonFragments(value) {
  const fragments = [];

  for (let start = 0; start < value.length; start += 1) {
    const opening = value[start];
    if (
      (opening !== "{" && opening !== "[") ||
      !isPossibleJsonFragmentStart(value, start)
    ) {
      continue;
    }

    const end = serializedJsonFragmentEnd(value, start);
    if (end === null) continue;
    const decoded = decodeSerializedJsonFragment(value.slice(start, end));
    if (!decoded) continue;

    fragments.push({
      start,
      end,
      value: decoded.value,
      serializationDepth: decoded.serializationDepth,
      source: decoded.source,
    });
    start = end - 1;
  }

  return fragments;
}

function redactUnstructuredText(value) {
  const redacted = String(value)
    .replace(COMPACT_JWT_PATTERN, (candidate) =>
      isCompactJwt(candidate) ? REDACTION_MARKER : candidate
    )
    .replace(AUTHORIZATION_HEADER_PATTERN, `$1${REDACTION_MARKER}`)
    .replace(COOKIE_HEADER_PATTERN, `$1${REDACTION_MARKER}`)
    .replace(BEARER_PATTERN, `Bearer ${REDACTION_MARKER}`);
  return redactSensitiveAssignments(redacted);
}

export function redactEvidenceText(value) {
  const structured = parseStructuredJsonText(value);
  if (structured) {
    if (findEvidenceCredentialFindings(String(value)).length === 0) {
      return String(value);
    }
    return stringifyStructuredJsonText(structured.value, structured.wrapperDepth);
  }

  const text = String(value);
  const fragments = structuredJsonFragments(text);
  if (fragments.length === 0) return redactUnstructuredText(text);

  let result = "";
  let cursor = 0;
  for (const fragment of fragments) {
    result += redactUnstructuredText(text.slice(cursor, fragment.start));
    result +=
      findEvidenceCredentialFindings(fragment.source).length === 0
        ? text.slice(fragment.start, fragment.end)
        : encodeSerializedJsonFragment(
            fragment.value,
            fragment.serializationDepth
          );
    cursor = fragment.end;
  }
  return result + redactUnstructuredText(text.slice(cursor));
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

  const addSourceMemberFindings = (source, currentLocation, kind) => {
    for (const offset of populatedSensitiveJsonSourceMemberOffsets(source)) {
      findings.push({ kind, location: `${currentLocation}<json@${offset}>` });
    }
  };

  let visit;
  const inspectStructuredSource = (source, currentLocation, memberKind) => {
    addSourceMemberFindings(source, currentLocation, memberKind);
    for (const stringValue of jsonSourceStringValues(source)) {
      visit(
        stringValue.value,
        `${currentLocation}<string@${stringValue.offset}>`
      );
    }
  };

  visit = (node, currentLocation) => {
    if (typeof node === "string") {
      const structured = parseStructuredJsonText(node);
      if (structured) {
        if (structured.source) {
          // Inspect every raw string value before JSON.parse can discard an earlier
          // duplicate non-sensitive wrapper member.
          inspectStructuredSource(
            structured.source,
            currentLocation,
            "sensitive-field"
          );
        } else {
          // A serialized wrapper may decode to unstructured text rather than an
          // object. Inspect that decoded value before restoring wrapper depth.
          visit(structured.value, `${currentLocation}<decoded>`);
        }
        return;
      }

      const inspectText = (text, textLocation, sourceOffset = 0) => {
        for (const span of textCredentialFindingSpans(text)) {
          findings.push({
            kind: span.kind,
            location: `${textLocation}<text@${sourceOffset + span.start}:${sourceOffset + span.end}>`,
          });
        }
      };

      const fragments = structuredJsonFragments(node);
      if (fragments.length === 0) {
        inspectText(node, currentLocation);
        return;
      }

      let cursor = 0;
      for (const fragment of fragments) {
        inspectText(node.slice(cursor, fragment.start), currentLocation, cursor);
        inspectStructuredSource(
          fragment.source,
          `${currentLocation}<json@${fragment.start}>`,
          "sensitive-text"
        );
        cursor = fragment.end;
      }
      inspectText(node.slice(cursor), currentLocation, cursor);
      return;
    }

    if (Array.isArray(node)) {
      node.forEach((child, index) => visit(child, `${currentLocation}/${index}`));
      return;
    }

    if (node === null || typeof node !== "object") return;

    for (const [key, child] of Object.entries(node)) {
      const childLocation = `${currentLocation}/${jsonPointerSegment(key)}`;
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
