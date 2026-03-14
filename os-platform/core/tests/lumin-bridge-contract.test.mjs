/**
 * LUMIN BRIDGE Token Contract — Regression Gate
 *
 * Enforces that the five core LUMIN BRIDGE CSS variables
 * (--tf-accent, --tf-success, --tf-error, --tf-warning, --tf-info)
 * are ALWAYS defined as raw HSL channels (e.g. "180 100% 50%"),
 * never as hsl(...) or var(...) indirections.
 *
 * Also enforces that brand CSS files never consume these tokens
 * as naked var(--tf-*) colors outside an hsl() wrapper.
 *
 * Background: tokens.css defines raw channels; brand.css loads after.
 * Any override with full hsl() or var() alias produces hsl(hsl(...))
 * nesting, which is browser-invalid and silently fails to render.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const RAW_CHANNEL_VARS = [
  "tf-accent",
  "tf-success",
  "tf-error",
  "tf-warning",
  "tf-info",
];

function walkCss(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkCss(full, out);
    else if (entry.isFile() && full.endsWith(".css")) out.push(full);
  }
  return out;
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function defs(css, name) {
  const re = new RegExp(`--${name}\\s*:\\s*([^;]+);`, "g");
  return [...css.matchAll(re)].map((m) => m[1].trim());
}

function assertRawChannels(value, name, file) {
  assert.ok(
    !value.includes("hsl("),
    `--${name} must not use hsl() in ${file}: ${value}`
  );
  assert.ok(
    !value.includes("var("),
    `--${name} must not use var() indirection in ${file}: ${value}`
  );
  assert.match(
    value,
    /^\d+(\.\d+)?\s+\d+(\.\d+)?%\s+\d+(\.\d+)?%$/,
    `--${name} must be raw H S% L% in ${file}: ${value}`
  );
}

test("LUMIN BRIDGE vars are raw HSL channels everywhere", () => {
  const root = path.join(
    process.cwd(),
    "frontend",
    "apps",
    "os-shell",
    "src"
  );
  const files = walkCss(root);
  assert.ok(files.length > 0, "No CSS files found");

  for (const file of files) {
    const css = read(file);
    for (const name of RAW_CHANNEL_VARS) {
      for (const value of defs(css, name)) {
        assertRawChannels(value, name, file);
      }
    }
  }
});

test("brand css never uses naked var(--tf-*) colors", () => {
  const files = [
    path.join(
      process.cwd(),
      "frontend",
      "apps",
      "os-shell",
      "src",
      "styles",
      "terrafusion-brand.css"
    ),
    path.join(
      process.cwd(),
      "frontend",
      "apps",
      "os-shell",
      "src",
      "assets",
      "terrafusion-brand.css"
    ),
  ].filter(fs.existsSync);

  assert.ok(files.length > 0, "No brand css files found");

  const naked = /(?<!hsl\()var\(--tf-(accent|success|error|warning|info)\)/g;

  for (const file of files) {
    const css = read(file);
    const matches = [...css.matchAll(naked)];
    assert.equal(
      matches.length,
      0,
      `Found naked token color usage in ${file}: ${matches
        .slice(0, 5)
        .map((m) => m[0])
        .join(", ")}`
    );
  }
});
