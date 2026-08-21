import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  sanitizeEvidenceDirectory,
  scanEvidenceDirectory,
} from "./evidence-credential-guard.mjs";
import {
  REDACTION_MARKER,
  findEvidenceCredentialFindings,
  redactEvidence,
  redactEvidenceText,
  stringifyEvidence,
} from "./evidence-redaction.mjs";

const PILOT_DIRECTORY = path.resolve(process.cwd(), "os-platform/core/pilot");

function unwrapSerializedText(value) {
  let current = value;
  while (true) {
    try {
      const parsed = JSON.parse(current);
      if (typeof parsed !== "string" || parsed.length >= current.length) return current;
      current = parsed;
    } catch {
      return current;
    }
  }
}

function encodeSerializedFragment(value, serializationDepth) {
  let result = value;
  for (let depth = 0; depth < serializationDepth; depth += 1) {
    result = JSON.stringify(result).slice(1, -1);
  }
  return result;
}

test("deep evidence redaction removes credential fields and compact JWTs", () => {
  const fixtureJwt =
    "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJub3QtYS1yZWFsLXRva2VuIn0.fixture-signature-only";
  const evidence = {
    safe: "operator probe completed",
    nested: {
      token: fixtureJwt,
      stdout: `response={\"access_token\":\"${fixtureJwt}\"}`,
      authorization: `Bearer ${fixtureJwt}`,
      password: "fixture-password",
      cookie: "session=fixture-cookie",
    },
  };

  const redacted = redactEvidence(evidence);
  const serialized = stringifyEvidence(evidence);

  assert.equal(redacted.safe, evidence.safe);
  assert.equal(redacted.nested.token, REDACTION_MARKER);
  assert.equal(redacted.nested.authorization, REDACTION_MARKER);
  assert.equal(redacted.nested.password, REDACTION_MARKER);
  assert.equal(redacted.nested.cookie, REDACTION_MARKER);
  assert.ok(!serialized.includes(fixtureJwt));
  assert.equal(findEvidenceCredentialFindings(JSON.parse(serialized)).length, 0);
});

test("text redaction handles bearer and assignment representations", () => {
  const fixtureJwt =
    "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJub3QtYS1yZWFsLXRva2VuIn0.fixture-signature-only";
  const input = `Authorization: Bearer ${fixtureJwt}\npassword=fixture-password`;
  const redacted = redactEvidenceText(input);

  assert.ok(!redacted.includes(fixtureJwt));
  assert.ok(!redacted.includes("fixture-password"));
  assert.match(redacted, /\[REDACTED\]/);
});

test("assignment redaction consumes complete quoted and whitespace-bearing values", () => {
  const input = [
    'password="correct horse battery staple"',
    "client_secret='alpha,beta;gamma'",
    'token=unquoted value with spaces',
    'password=correct,horse;still-secret}',
    'password=[REDACTED]',
    'next=safe',
  ].join('\n');
  const redacted = redactEvidenceText(input);

  for (const exposed of [
    'correct horse',
    'alpha,beta',
    'gamma',
    'unquoted value',
    'correct,horse',
    'still-secret',
  ]) {
    assert.ok(!redacted.includes(exposed));
  }
  assert.match(redacted, /next=safe/);
  assert.match(redacted, /password=\[REDACTED\]/);

  const jsonLike = '{"token":"opaque-value","next":"safe"}';
  const firstPass = redactEvidenceText(jsonLike);
  assert.equal(firstPass, '{"token":"[REDACTED]","next":"safe"}');
  assert.equal(redactEvidenceText(firstPass), firstPass);

  const escapedJsonLike = String.raw`response={\"token\":\"opaque-secret\",\"next\":\"safe\"}`;
  const escapedFirstPass = redactEvidenceText(escapedJsonLike);
  assert.equal(
    escapedFirstPass,
    String.raw`response={\"token\":\"[REDACTED]\",\"next\":\"safe\"}`
  );
  assert.equal(redactEvidenceText(escapedFirstPass), escapedFirstPass);
  assert.ok(!escapedFirstPass.includes("opaque-secret"));

  assert.equal(findEvidenceCredentialFindings(redacted).length, 0);
  assert.equal(findEvidenceCredentialFindings(firstPass).length, 0);
  assert.equal(findEvidenceCredentialFindings(escapedFirstPass).length, 0);

  const multilineCases = [
    'password="line-one\nline-two"\nnext=safe',
    'secret="line-one\r\nline-two"\r\nnext=safe',
    'client_secret="-----BEGIN PRIVATE KEY-----\nsynthetic-body\n-----END PRIVATE KEY-----"\nnext=safe',
    String.raw`response={\"token\":\"line-one
line-two\",\"next\":\"safe\"}`,
  ];
  for (const multiline of multilineCases) {
    const multilineFirstPass = redactEvidenceText(multiline);
    assert.ok(!multilineFirstPass.includes("line-one"));
    assert.ok(!multilineFirstPass.includes("line-two"));
    assert.ok(!multilineFirstPass.includes("synthetic-body"));
    assert.ok(multilineFirstPass.includes("next"));
    assert.equal(redactEvidenceText(multilineFirstPass), multilineFirstPass);
    assert.ok(
      findEvidenceCredentialFindings(multiline).some(
        (finding) => finding.kind === "sensitive-text"
      )
    );
    assert.equal(findEvidenceCredentialFindings(multilineFirstPass).length, 0);
  }

  for (let escapeDepth = 0; escapeDepth <= 12; escapeDepth += 1) {
    const delimiter = "\\".repeat(escapeDepth) + '"';
    const newline = escapeDepth % 2 === 0 ? "\n" : "\r\n";
    const nested = `response={${delimiter}token${delimiter}:${delimiter}opaque-depth-${escapeDepth}${newline}tail-depth-${escapeDepth}${delimiter},${delimiter}next${delimiter}:${delimiter}safe${delimiter}}`;
    const expected = `response={${delimiter}token${delimiter}:${delimiter}[REDACTED]${delimiter},${delimiter}next${delimiter}:${delimiter}safe${delimiter}}`;
    const nestedFirstPass = redactEvidenceText(nested);
    assert.equal(nestedFirstPass, expected);
    assert.equal(redactEvidenceText(nestedFirstPass), nestedFirstPass);
    assert.ok(!nestedFirstPass.includes(`opaque-depth-${escapeDepth}`));
    assert.ok(!nestedFirstPass.includes(`tail-depth-${escapeDepth}`));
    assert.ok(nestedFirstPass.includes("safe"));
    assert.ok(findEvidenceCredentialFindings(nested).some((finding) => finding.kind === "sensitive-text"));
    assert.equal(findEvidenceCredentialFindings(nestedFirstPass).length, 0);
  }

  const unterminatedCases = [
    {
      input: 'password="line-one\nmetadata="safe"\nline-two-secret',
      expected: 'password="[REDACTED]"\nmetadata="safe"',
    },
    {
      input: 'password="line-one\r\nmetadata="safe"\r\nline-two-secret',
      expected: 'password="[REDACTED]"\r\nmetadata="safe"',
    },
  ];
  for (const { input: unterminated, expected } of unterminatedCases) {
    const unterminatedFirstPass = redactEvidenceText(unterminated);
    assert.equal(unterminatedFirstPass, expected);
    assert.ok(!unterminatedFirstPass.includes("line-two-secret"));
    assert.ok(unterminatedFirstPass.includes('metadata="safe"'));
    assert.ok(
      findEvidenceCredentialFindings(unterminated).some(
        (finding) => finding.kind === "sensitive-text"
      )
    );
    assert.equal(findEvidenceCredentialFindings(unterminatedFirstPass).length, 0);
    assert.equal(redactEvidenceText(unterminatedFirstPass), unterminatedFirstPass);
  }

  const unquotedPemCases = [
    'client_secret=-----BEGIN PRIVATE KEY-----\nsynthetic-private-body\n-----END PRIVATE KEY-----\nnext=safe',
    'client_secret=-----BEGIN RSA PRIVATE KEY-----\r\nsynthetic-rsa-body\r\n-----END RSA PRIVATE KEY-----\r\nnext=safe',
  ];
  for (const unquotedPem of unquotedPemCases) {
    const unquotedPemFirstPass = redactEvidenceText(unquotedPem);
    assert.ok(!unquotedPemFirstPass.includes("synthetic-private-body"));
    assert.ok(!unquotedPemFirstPass.includes("synthetic-rsa-body"));
    assert.ok(!unquotedPemFirstPass.includes("END PRIVATE KEY"));
    assert.ok(!unquotedPemFirstPass.includes("END RSA PRIVATE KEY"));
    assert.ok(unquotedPemFirstPass.includes("next=safe"));
    assert.ok(
      findEvidenceCredentialFindings(unquotedPem).some(
        (finding) => finding.kind === "sensitive-text"
      )
    );
    assert.equal(findEvidenceCredentialFindings(unquotedPemFirstPass).length, 0);
    assert.equal(redactEvidenceText(unquotedPemFirstPass), unquotedPemFirstPass);
  }

  for (const emptyAssignment of ["password=\nnext=safe", "password=\r\nnext=safe"]) {
    assert.equal(redactEvidenceText(emptyAssignment), emptyAssignment);
    assert.equal(findEvidenceCredentialFindings(emptyAssignment).length, 0);
  }

  const multiplyEscaped =
    String.raw`response={\\\"token\\\":\\\"opaque-nested\\\",\\\"next\\\":\\\"safe\\\"}`;
  const multiplyEscapedFirstPass = redactEvidenceText(multiplyEscaped);
  assert.equal(
    multiplyEscapedFirstPass,
    String.raw`response={\\\"token\\\":\\\"[REDACTED]\\\",\\\"next\\\":\\\"safe\\\"}`
  );
  assert.equal(redactEvidenceText(multiplyEscapedFirstPass), multiplyEscapedFirstPass);
  assert.ok(!multiplyEscapedFirstPass.includes("opaque-nested"));
  assert.ok(
    findEvidenceCredentialFindings(multiplyEscaped).some(
      (finding) => finding.kind === "sensitive-text"
    )
  );
  assert.equal(findEvidenceCredentialFindings(multiplyEscapedFirstPass).length, 0);

  const escapedContent =
    String.raw`response={\"token\":\"sec\\\"ret\",\"next\":\"safe\"}`;
  const escapedContentFirstPass = redactEvidenceText(escapedContent);
  assert.equal(
    escapedContentFirstPass,
    String.raw`response={\"token\":\"[REDACTED]\",\"next\":\"safe\"}`
  );
  assert.equal(redactEvidenceText(escapedContentFirstPass), escapedContentFirstPass);
  assert.ok(!escapedContentFirstPass.includes("ret"));
  assert.ok(
    findEvidenceCredentialFindings(escapedContent).some(
      (finding) => finding.kind === "sensitive-text"
    )
  );
  assert.equal(findEvidenceCredentialFindings(escapedContentFirstPass).length, 0);

  let trailingBackslash = JSON.stringify({ token: "secret\\", next: "safe" });
  let trailingBackslashExpected = JSON.stringify({ token: REDACTION_MARKER, next: "safe" });
  for (let serializationDepth = 0; serializationDepth <= 3; serializationDepth += 1) {
    const trailingBackslashFirstPass = redactEvidenceText(trailingBackslash);
    assert.equal(trailingBackslashFirstPass, trailingBackslashExpected);
    assert.equal(redactEvidenceText(trailingBackslashFirstPass), trailingBackslashFirstPass);
    assert.ok(!trailingBackslashFirstPass.includes("secret"));
    assert.ok(trailingBackslashFirstPass.includes("safe"));
    assert.ok(findEvidenceCredentialFindings(trailingBackslash).length > 0);
    assert.equal(findEvidenceCredentialFindings(trailingBackslashFirstPass).length, 0);
    trailingBackslash = JSON.stringify(trailingBackslash);
    trailingBackslashExpected = JSON.stringify(trailingBackslashExpected);
  }
});

test("structured JSON redaction decodes escaped keys and preserves valid non-string values", () => {
  let unicodeEscapedKey = String.raw`{"to\u006ben":"unicode-secret\\","next":"safe"}`;
  let unicodeExpected = '{"token":"[REDACTED]","next":"safe"}';
  for (let serializationDepth = 0; serializationDepth <= 8; serializationDepth += 1) {
    const redacted = redactEvidenceText(unicodeEscapedKey);
    assert.equal(redacted, unicodeExpected);
    assert.ok(!redacted.includes("unicode-secret"));
    assert.ok(redacted.includes("safe"));
    assert.ok(findEvidenceCredentialFindings(unicodeEscapedKey).length > 0);
    assert.equal(findEvidenceCredentialFindings(redacted).length, 0);
    assert.equal(redactEvidenceText(redacted), redacted);
    unicodeEscapedKey = JSON.stringify(unicodeEscapedKey);
    unicodeExpected = JSON.stringify(unicodeExpected);
  }

  for (const safeValue of [null, false]) {
    let input = JSON.stringify({ token: safeValue, next: "safe" });
    for (let serializationDepth = 0; serializationDepth <= 8; serializationDepth += 1) {
      const redacted = redactEvidenceText(input);
      assert.equal(redacted, input);
      assert.equal(findEvidenceCredentialFindings(input).length, 0);
      assert.equal(findEvidenceCredentialFindings(redacted).length, 0);
      assert.equal(redactEvidenceText(redacted), redacted);
      input = JSON.stringify(input);
    }
  }

  for (const populatedValue of [true, 42, { nested: "opaque" }, ["opaque"]]) {
    let input = JSON.stringify({ token: populatedValue, next: "safe" });
    let expected = JSON.stringify({ token: REDACTION_MARKER, next: "safe" });
    for (let serializationDepth = 0; serializationDepth <= 8; serializationDepth += 1) {
      const redacted = redactEvidenceText(input);
      assert.equal(redacted, expected);
      assert.ok(findEvidenceCredentialFindings(input).length > 0);
      assert.equal(findEvidenceCredentialFindings(redacted).length, 0);
      assert.equal(redactEvidenceText(redacted), redacted);
      input = JSON.stringify(input);
      expected = JSON.stringify(expected);
    }
  }

  for (const safeJsonLikeString of ["[\n]", "[\r\n]"]) {
    let safeWrapped = safeJsonLikeString;
    for (let serializationDepth = 0; serializationDepth <= 8; serializationDepth += 1) {
      assert.equal(redactEvidenceText(safeWrapped), safeWrapped);
      assert.equal(findEvidenceCredentialFindings(safeWrapped).length, 0);
      safeWrapped = JSON.stringify(safeWrapped);
    }
  }

  for (const lineEnding of ["\n", "\r\n"]) {
    const prettySafe = [
      "{",
      '  "safe": "[\\n]"',
      "}",
    ].join(lineEnding);
    for (let fragmentDepth = 1; fragmentDepth <= 8; fragmentDepth += 1) {
      const safeInput =
        `response=${encodeSerializedFragment(prettySafe, fragmentDepth)}; tail=keep`;
      assert.equal(redactEvidenceText(safeInput), safeInput);
      assert.equal(findEvidenceCredentialFindings(safeInput).length, 0);
      assert.equal(redactEvidenceText(redactEvidenceText(safeInput)), safeInput);
    }

    const duplicateCases = [
      {
        members: [
          '  "to\\u006ben": "duplicate-secret\\\\",',
          '  "token": null,',
          '  "next": "safe"',
        ],
        expected: { token: null, next: "safe" },
      },
      {
        members: [
          '  "to\\u006ben": "duplicate-secret\\\\",',
          '  "token": false,',
          '  "next": "safe"',
        ],
        expected: { token: false, next: "safe" },
      },
      {
        members: [
          '  "to\\u006ben": "duplicate-secret\\\\",',
          '  "token": "[REDACTED]",',
          '  "next": "safe"',
        ],
        expected: { token: REDACTION_MARKER, next: "safe" },
      },
      {
        members: [
          '  "token": null,',
          '  "to\\u006ben": "duplicate-secret\\\\",',
          '  "next": "safe"',
        ],
        expected: { token: REDACTION_MARKER, next: "safe" },
      },
      {
        members: [
          '  "token": "first-secret",',
          '  "password": "second-secret",',
          '  "token": false,',
          '  "password": "[REDACTED]",',
          '  "next": "safe"',
        ],
        expected: {
          token: false,
          password: REDACTION_MARKER,
          next: "safe",
        },
      },
    ];
    for (const { members, expected: expectedValue } of duplicateCases) {
      const duplicateSource = ["{", ...members, "}"].join(lineEnding);
      const duplicateExpected = JSON.stringify(expectedValue);
      for (let fragmentDepth = 1; fragmentDepth <= 8; fragmentDepth += 1) {
        const duplicateInput =
          `response=${encodeSerializedFragment(duplicateSource, fragmentDepth)}; tail=keep`;
        const expected =
          `response=${encodeSerializedFragment(duplicateExpected, fragmentDepth)}; tail=keep`;
        const redacted = redactEvidenceText(duplicateInput);
        assert.equal(redacted, expected);
        assert.ok(!redacted.includes("duplicate-secret"));
        assert.ok(!redacted.includes("first-secret"));
        assert.ok(!redacted.includes("second-secret"));
        assert.ok(redacted.endsWith("; tail=keep"));
        assert.ok(findEvidenceCredentialFindings(duplicateInput).length > 0);
        assert.equal(findEvidenceCredentialFindings(redacted).length, 0);
        assert.equal(redactEvidenceText(redacted), redacted);
      }
    }

    const prettyUnicode = [
      "{",
      '  "to\\u006ben": "pretty-secret\\\\",',
      '  "next": "[\\n]"',
      "}",
    ].join(lineEnding);
    const prettyExpected = '{"token":"[REDACTED]","next":"[\\n]"}';
    for (let fragmentDepth = 1; fragmentDepth <= 8; fragmentDepth += 1) {
      const prettyInput =
        `response=${encodeSerializedFragment(prettyUnicode, fragmentDepth)}; tail=keep`;
      const expected =
        `response=${encodeSerializedFragment(prettyExpected, fragmentDepth)}; tail=keep`;
      const redacted = redactEvidenceText(prettyInput);
      assert.equal(redacted, expected);
      assert.ok(!redacted.includes("pretty-secret"));
      assert.ok(redacted.endsWith("; tail=keep"));
      assert.ok(findEvidenceCredentialFindings(prettyInput).length > 0);
      assert.equal(findEvidenceCredentialFindings(redacted).length, 0);
      assert.equal(redactEvidenceText(redacted), redacted);
    }
  }

  const rawPrefixedUnicode =
    String.raw`{"to\u006ben":"fragment-secret\\","next":"safe"}`;
  const rawPrefixedUnicodeExpected =
    '{"token":"[REDACTED]","next":"safe"}';
  const rawPrefixedSafe = '{"token":null,"next":"safe"}';
  for (let fragmentDepth = 1; fragmentDepth <= 8; fragmentDepth += 1) {
    const unicodeInput =
      `response=${encodeSerializedFragment(rawPrefixedUnicode, fragmentDepth)}; tail=keep`;
    const unicodeExpected =
      `response=${encodeSerializedFragment(rawPrefixedUnicodeExpected, fragmentDepth)}; tail=keep`;
    const unicodeRedacted = redactEvidenceText(unicodeInput);
    assert.equal(unicodeRedacted, unicodeExpected);
    assert.ok(!unicodeRedacted.includes("fragment-secret"));
    assert.ok(unicodeRedacted.endsWith("; tail=keep"));
    assert.ok(findEvidenceCredentialFindings(unicodeInput).length > 0);
    assert.equal(findEvidenceCredentialFindings(unicodeRedacted).length, 0);
    assert.equal(redactEvidenceText(unicodeRedacted), unicodeRedacted);

    const safeInput =
      `response=${encodeSerializedFragment(rawPrefixedSafe, fragmentDepth)}; tail=keep`;
    assert.equal(redactEvidenceText(safeInput), safeInput);
    assert.equal(findEvidenceCredentialFindings(safeInput).length, 0);

    for (const populatedValue of [true, 42, { nested: "secret" }, ["secret"]]) {
      const populatedInput = `response=${encodeSerializedFragment(
        JSON.stringify({ token: populatedValue, next: "safe" }),
        fragmentDepth
      )}; tail=keep`;
      const populatedExpected = `response=${encodeSerializedFragment(
        JSON.stringify({ token: REDACTION_MARKER, next: "safe" }),
        fragmentDepth
      )}; tail=keep`;
      const populatedRedacted = redactEvidenceText(populatedInput);
      assert.equal(populatedRedacted, populatedExpected);
      assert.ok(populatedRedacted.endsWith("; tail=keep"));
      assert.ok(findEvidenceCredentialFindings(populatedInput).length > 0);
      assert.equal(findEvidenceCredentialFindings(populatedRedacted).length, 0);
      assert.equal(redactEvidenceText(populatedRedacted), populatedRedacted);
    }
  }

  let prefixedUnicode =
    String.raw`response={"to\u006ben":"prefixed-secret\\","next":"safe"}; tail=keep`;
  let prefixedUnicodeExpected =
    'response={"token":"[REDACTED]","next":"safe"}; tail=keep';
  let prefixedNull = 'response={"token":null,"next":"safe"}; tail=keep';
  for (let serializationDepth = 0; serializationDepth <= 8; serializationDepth += 1) {
    const unicodeRedacted = redactEvidenceText(prefixedUnicode);
    assert.equal(unicodeRedacted, prefixedUnicodeExpected);
    assert.ok(!unicodeRedacted.includes("prefixed-secret"));
    assert.ok(unwrapSerializedText(unicodeRedacted).endsWith("; tail=keep"));
    assert.ok(findEvidenceCredentialFindings(prefixedUnicode).length > 0);
    assert.equal(findEvidenceCredentialFindings(unicodeRedacted).length, 0);
    assert.equal(redactEvidenceText(unicodeRedacted), unicodeRedacted);

    const nullRedacted = redactEvidenceText(prefixedNull);
    assert.equal(nullRedacted, prefixedNull);
    assert.ok(unwrapSerializedText(nullRedacted).endsWith("; tail=keep"));
    assert.equal(findEvidenceCredentialFindings(prefixedNull).length, 0);
    assert.equal(findEvidenceCredentialFindings(nullRedacted).length, 0);
    assert.equal(redactEvidenceText(nullRedacted), nullRedacted);

    prefixedUnicode = JSON.stringify(prefixedUnicode);
    prefixedUnicodeExpected = JSON.stringify(prefixedUnicodeExpected);
    prefixedNull = JSON.stringify(prefixedNull);
  }
});

test("credential findings use an independent assignment detector", async () => {
  const source = await fs.readFile(path.join(PILOT_DIRECTORY, "evidence-redaction.mjs"), "utf8");
  assert.doesNotMatch(source, /redactEvidenceText\(node\)\s*!==\s*node/);
  assert.match(
    source,
    /const inspectText = \(text, textLocation\) => \{[\s\S]*containsPopulatedSensitiveAssignment\(text\)/
  );
});

test("dev-data truth evidence uses the shared redaction boundary for JSON and Markdown", async () => {
  const source = await fs.readFile(path.join(PILOT_DIRECTORY, "dev-data-truth-gate.mjs"), "utf8");
  assert.match(source, /writeFileSync\(jsonOut, stringifyEvidence\(report\)\)/);
  assert.match(source, /writeFileSync\(mdOut, buildMarkdown\(redactEvidence\(report\)\)\)/);
});

test("text redaction handles generic compact tokens, Basic auth, and cookies", () => {
  const alternateCompactToken =
    "IHsiYWxnIjoiSFMyNTYifQ.eyJzdWIiOiJub3QtYS1yZWFsLXRva2VuIn0.c2lnbmF0dXJlLWZpeHR1cmU";
  const input = [
    alternateCompactToken,
    "Authorization: Basic Zml4dHVyZTpub3QtYS1jcmVkZW50aWFs",
    "Cookie: session=fixture-cookie; secure=true",
  ].join("\n");
  const redacted = redactEvidenceText(input);

  assert.ok(!redacted.includes(alternateCompactToken));
  assert.ok(!redacted.includes("Zml4dHVyZTpub3QtYS1jcmVkZW50aWFs"));
  assert.ok(!redacted.includes("fixture-cookie"));
  assert.equal(findEvidenceCredentialFindings(redacted).length, 0);
});

test("directory guard sanitizes top-level duplicate sensitive members before parsing", async () => {
  const temporaryDirectory = await fs.mkdtemp(
    path.join(os.tmpdir(), "tf-evidence-source-guard-")
  );
  const cases = [
    [
      "earlier-null",
      ['{', '  "to\\u006ben": "TOP-LEVEL-SECRET-null",', '  "token": null,', '  "next": "safe"', '}'],
    ],
    [
      "earlier-false",
      ['{', '  "to\\u006ben": "TOP-LEVEL-SECRET-false",', '  "token": false,', '  "next": "safe"', '}'],
    ],
    [
      "earlier-marker",
      [
        '{',
        '  "to\\u006ben": "TOP-LEVEL-SECRET-marker",',
        '  "token": "[REDACTED]",',
        '  "next": "safe"',
        '}',
      ],
    ],
    [
      "reversed",
      ['{', '  "token": null,', '  "to\\u006ben": "TOP-LEVEL-SECRET-reversed",', '  "next": "safe"', '}'],
    ],
    [
      "multiple",
      [
        '{',
        '  "to\\u006ben": "TOP-LEVEL-SECRET-first",',
        '  "token": "TOP-LEVEL-SECRET-second",',
        '  "token": false,',
        '  "next": "safe"',
        '}',
      ],
    ],
  ];

  try {
    for (const [endingName, lineEnding] of [
      ["lf", "\n"],
      ["crlf", "\r\n"],
    ]) {
      for (const [caseName, lines] of cases) {
        await fs.writeFile(
          path.join(temporaryDirectory, `${endingName}-${caseName}.json`),
          `${lines.join(lineEnding)}${lineEnding}`,
          "utf8"
        );
      }
    }

    const before = await scanEvidenceDirectory(temporaryDirectory);
    assert.equal(before.length, cases.length * 2);
    assert.ok(before.every((result) => result.findings.length > 0));

    const sanitized = await sanitizeEvidenceDirectory(temporaryDirectory);
    assert.equal(sanitized.length, cases.length * 2);
    const contentsAfterFirstPass = new Map();
    for (const entry of await fs.readdir(temporaryDirectory)) {
      const filePath = path.join(temporaryDirectory, entry);
      const source = await fs.readFile(filePath, "utf8");
      const value = JSON.parse(source);
      contentsAfterFirstPass.set(entry, source);
      assert.ok(!source.includes("TOP-LEVEL-SECRET"));
      assert.equal(value.next, "safe");
      assert.equal(findEvidenceCredentialFindings(source).length, 0);
    }

    assert.deepEqual(await scanEvidenceDirectory(temporaryDirectory), []);
    assert.deepEqual(await sanitizeEvidenceDirectory(temporaryDirectory), []);
    for (const [entry, source] of contentsAfterFirstPass) {
      assert.equal(
        await fs.readFile(path.join(temporaryDirectory, entry), "utf8"),
        source
      );
    }
  } finally {
    await fs.rm(temporaryDirectory, { recursive: true, force: true });
  }
});

test("all current Pilot evidence is free of populated credential material", async () => {
  const results = await scanEvidenceDirectory();
  assert.deepEqual(
    results.map((result) => ({
      file: path.relative(process.cwd(), result.filePath),
      kinds: [...new Set(result.findings.map((finding) => finding.kind))].sort(),
      count: result.findings.length,
    })),
    []
  );
});

test("credential-bearing packet generators use the shared evidence boundary", async () => {
  const packetFiles = [
    "phase6-promotion-packet.mjs",
    "phase7-deployment-alignment-packet.mjs",
    "phase8-deployed-operator-parity-packet.mjs",
    "phase9-runtime-role-separation-packet.mjs",
    "phase12-pacs-connected-runtime-packet.mjs",
    "phase13-snapshot-promotion-packet.mjs",
    "phase17-go-live-packet.mjs",
    "phase18-pacs-runtime-productization-packet.mjs",
    "phase19-snapshot-promotion-automation-packet.mjs",
  ];

  for (const packetFile of packetFiles) {
    const source = await fs.readFile(path.join(PILOT_DIRECTORY, packetFile), "utf8");
    assert.match(source, /stringifyEvidence\(/, `${packetFile} must sanitize serialized evidence`);
    if (packetFile !== "phase8-deployed-operator-parity-packet.mjs") {
      assert.match(source, /redactEvidenceText\(/, `${packetFile} must sanitize mirrored child output`);
    }
  }
});

test("Pilot source contains no historical production-style password fallback", async () => {
  const entries = await fs.readdir(PILOT_DIRECTORY, { withFileTypes: true });
  const sourceFiles = entries
    .filter((entry) => entry.isFile() && /\.(?:mjs|js|ts)$/.test(entry.name))
    .map((entry) => entry.name);

  const offenders = [];
  for (const sourceFile of sourceFiles) {
    const source = await fs.readFile(path.join(PILOT_DIRECTORY, sourceFile), "utf8");
    const historicalFallback = ["Terra", "Fusion", "2026", "!"].join("");
    if (source.includes(historicalFallback)) offenders.push(sourceFile);
  }

  assert.deepEqual(offenders, []);
});
