// src/grounded-context/project-gpt-grounded-context.mjs
//
// WO-SR-005E-F1 — GPT Standalone Grounded-Context Foundation.
//
// Pure, provider-neutral, read-only projection and validation for the frozen
// `gpt.grounded-context@1.0.0` contract. Built fresh in the standalone GPT
// repository; it copies no sovereign DTO source and holds no Git history from the
// sovereign base. The standalone parity verifier imports this module instead of
// embedding the logic inline (WO-SR-005E-E2 proved parity with the logic inline,
// including the PR #2 Unicode code-point length remediation; F1 makes it a reusable
// product module without changing any verdict).
//
// Hard boundaries: no fs, network, persistence, database, auth, provider, model,
// embedding, prompt, retrieval, writeLane (TFR-028), terraTrace (TFR-027), or
// runtime consumer. The module is a synchronous pure function library over
// already-materialized exchange objects.

const piiPatterns = [
  /\b\d{3}-\d{2}-\d{4}\b/,
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/,
];

// NUL byte, used as the composite source/chunk identity separator; a control
// character cannot appear in a canonical id, so the composite key cannot collide.
// Constructed at runtime to keep the source pure ASCII.
const IDENTITY_SEPARATOR = String.fromCharCode(0);

function resolveRef(root, reference) {
  if (!/^#\//.test(reference)) {
    throw new Error(`only local schema references are supported: ${reference}`);
  }
  return reference
    .slice(2)
    .split('/')
    .map(segment => segment.replaceAll('~1', '/').replaceAll('~0', '~'))
    .reduce((current, segment) => current[segment], root);
}

function matchesType(type, value) {
  if (type === 'object') return value !== null && typeof value === 'object' && !Array.isArray(value);
  if (type === 'array') return Array.isArray(value);
  if (type === 'integer') return Number.isInteger(value);
  if (type === 'number') return typeof value === 'number' && Number.isFinite(value);
  return typeof value === type;
}

// Intentionally supports only the Draft-07 keywords used by the frozen GPT schema.
// String length is measured in Unicode code points (not UTF-16 code units) to match
// JSON Schema semantics (WO-SR-005E-E2 PR #2 remediation).
export function validateJsonSchema(root, schema, value, location = '$') {
  if (schema === true) return [];
  if (schema === false) return [`${location}: schema is false`];
  if (schema.$ref) return validateJsonSchema(root, resolveRef(root, schema.$ref), value, location);

  const errors = [];
  if (schema.type && !matchesType(schema.type, value)) return [`${location}: expected ${schema.type}`];
  if (Object.hasOwn(schema, 'const') && value !== schema.const) {
    errors.push(`${location}: value does not match const`);
  }
  if (schema.enum && !schema.enum.includes(value)) errors.push(`${location}: value is outside enum`);

  if (typeof value === 'string') {
    const codePointLength = Array.from(value).length;
    if (schema.minLength !== undefined && codePointLength < schema.minLength) {
      errors.push(`${location}: string is shorter than ${schema.minLength}`);
    }
    if (schema.maxLength !== undefined && codePointLength > schema.maxLength) {
      errors.push(`${location}: string is longer than ${schema.maxLength}`);
    }
  }

  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push(`${location}: number is below minimum`);
    }
    if (schema.maximum !== undefined && value > schema.maximum) {
      errors.push(`${location}: number is above maximum`);
    }
  }

  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      errors.push(`${location}: array has fewer than ${schema.minItems} items`);
    }
    if (schema.maxItems !== undefined && value.length > schema.maxItems) {
      errors.push(`${location}: array has more than ${schema.maxItems} items`);
    }
    if (schema.items) {
      value.forEach((item, index) => {
        errors.push(...validateJsonSchema(root, schema.items, item, `${location}[${index}]`));
      });
    }
  }

  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    const properties = schema.properties ?? {};
    for (const required of schema.required ?? []) {
      if (!Object.hasOwn(value, required)) errors.push(`${location}: missing ${required}`);
    }
    for (const [name, child] of Object.entries(properties)) {
      if (Object.hasOwn(value, name)) {
        errors.push(...validateJsonSchema(root, child, value[name], `${location}.${name}`));
      }
    }
    if (schema.additionalProperties === false) {
      for (const name of Object.keys(value)) {
        if (!Object.hasOwn(properties, name)) errors.push(`${location}: unexpected ${name}`);
      }
    }
  }

  for (const child of schema.allOf ?? []) {
    errors.push(...validateJsonSchema(root, child, value, location));
  }
  if (schema.if && validateJsonSchema(root, schema.if, value, location).length === 0 && schema.then) {
    errors.push(...validateJsonSchema(root, schema.then, value, location));
  }
  if (schema.not && validateJsonSchema(root, schema.not, value, location).length === 0) {
    errors.push(`${location}: forbidden schema matched`);
  }
  return errors;
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function compareCitations(left, right) {
  return (
    right.score - left.score ||
    compareText(left.sourceId, right.sourceId) ||
    left.chunkIndex - right.chunkIndex ||
    compareText(left.chunkId, right.chunkId)
  );
}

// Provider-neutral read-only projection judgment. Returns a list of typed
// violations ({ class, message }); an empty list is an accepted exchange
// (GROUNDED, NO_RELEVANT_CONTEXT, or DENIED). Enforces: frozen-schema conformance
// (incl. status/citation/denial conditionals), county/dataset/trace match,
// raw-PII-query rejection, topK bound, per-citation score threshold, unique
// source/chunk identity, and canonical citation ordering. No provider, model,
// embedding, retrieval, persistence, or network access.
export function validateGptExchange(schema, exchange) {
  const schemaErrors = validateJsonSchema(schema, schema, exchange);
  if (schemaErrors.length > 0) {
    return schemaErrors.map(message => ({ class: 'SCHEMA', message }));
  }

  const errors = [];
  if (exchange.request.countyId !== exchange.result.countyId) {
    errors.push({ class: 'COUNTY_MISMATCH', message: 'result countyId must match request countyId' });
  }
  if (exchange.request.datasetKey !== exchange.result.datasetKey) {
    errors.push({
      class: 'DATASET_MISMATCH',
      message: 'result datasetKey must match request datasetKey',
    });
  }
  if (exchange.request.traceId !== exchange.result.traceId) {
    errors.push({ class: 'TRACE_MISMATCH', message: 'result traceId must match request traceId' });
  }
  if (piiPatterns.some(pattern => pattern.test(exchange.request.queryText))) {
    errors.push({ class: 'RAW_PII_QUERY', message: 'raw query contains a prohibited PII pattern' });
  }
  if (exchange.result.citations.length > exchange.request.topK) {
    errors.push({ class: 'TOP_K', message: 'citation count exceeds request topK' });
  }

  const identities = new Set();
  let previous;
  for (const citation of exchange.result.citations) {
    if (citation.score < exchange.request.scoreThreshold) {
      errors.push({ class: 'SCORE_THRESHOLD', message: 'citation score is below request threshold' });
    }
    const identity = `${citation.sourceId}${IDENTITY_SEPARATOR}${citation.chunkId}`;
    if (identities.has(identity)) {
      errors.push({ class: 'DUPLICATE_CITATION', message: 'source/chunk identity must be unique' });
    }
    identities.add(identity);
    if (previous && compareCitations(previous, citation) > 0) {
      errors.push({ class: 'ORDERING', message: 'citations are not in canonical order' });
    }
    previous = citation;
  }
  return errors;
}

function sortJson(value) {
  if (Array.isArray(value)) return value.map(sortJson);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map(key => [key, sortJson(value[key])])
    );
  }
  return value;
}

// Deterministic canonical JSON serialization (stable key ordering) used to prove
// the accepted-fixture normalization is stable.
export function normalizeJson(value) {
  return JSON.stringify(sortJson(value));
}
