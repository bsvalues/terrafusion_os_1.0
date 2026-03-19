import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const manifestPath = resolve(__dirname, "../../../tools/registry/terrapilot.tools.json");
const schemaPath = resolve(__dirname, "../../../tools/registry/terrapilot.tools.schema.json");

function loadJson(pathname) {
  return JSON.parse(readFileSync(pathname, "utf8"));
}

function sortedUnique(values) {
  return [...new Set(values)].sort();
}

function readEnum(schema, definitionName) {
  const values = schema.definitions?.[definitionName]?.enum;
  assert.ok(Array.isArray(values), `schema.definitions.${definitionName}.enum must exist`);
  return sortedUnique(values);
}

function readToolEnum(schema, propertyName) {
  const variants = schema.definitions?.Tool?.properties?.[propertyName]?.oneOf;
  assert.ok(Array.isArray(variants), `schema Tool.${propertyName}.oneOf must exist`);
  const stringVariant = variants.find((variant) => Array.isArray(variant?.enum));
  assert.ok(stringVariant, `schema Tool.${propertyName} string enum must exist`);
  return sortedUnique(stringVariant.enum);
}

function collectManifestValues(tools, key) {
  return sortedUnique(
    tools
      .map((tool) => tool?.[key])
      .filter((value) => typeof value === "string" && value.length > 0)
  );
}

function collectNestedManifestValues(tools, key) {
  return sortedUnique(
    tools
      .flatMap((tool) => (Array.isArray(tool?.[key]) ? tool[key] : []))
      .filter((value) => typeof value === "string" && value.length > 0)
  );
}

test("live manifest values stay inside the registry schema boundary", () => {
  const manifest = loadJson(manifestPath);
  const schema = loadJson(schemaPath);
  const tools = Array.isArray(manifest.tools) ? manifest.tools : [];

  assert.equal(manifest.version, "2.0.0");
  assert.equal(schema.properties?.version?.const, manifest.version);

  const suitesInManifest = collectManifestValues(tools, "suite");
  const suitesInSchema = readEnum(schema, "Suite");
  assert.deepEqual(suitesInManifest, suitesInManifest.filter((value) => suitesInSchema.includes(value)));

  const touchTargetsInManifest = collectNestedManifestValues(tools, "touches");
  const touchTargetsInSchema = readEnum(schema, "TouchTarget");
  assert.deepEqual(
    touchTargetsInManifest,
    touchTargetsInManifest.filter((value) => touchTargetsInSchema.includes(value))
  );

  const payloadStoresInManifest = collectManifestValues(tools, "payloadStore");
  const payloadStoresInSchema = readToolEnum(schema, "payloadStore");
  assert.deepEqual(
    payloadStoresInManifest,
    payloadStoresInManifest.filter((value) => payloadStoresInSchema.includes(value))
  );

  const officeScopesInManifest = collectManifestValues(tools, "officeScope");
  const officeScopesInSchema = readEnum(schema, "OfficeId");
  assert.deepEqual(
    officeScopesInManifest,
    officeScopesInManifest.filter((value) => officeScopesInSchema.includes(value))
  );
});

test("schema exposes the live manifest properties that drifted in Wave 2 backend truth inventory", () => {
  const manifest = loadJson(manifestPath);
  const schema = loadJson(schemaPath);
  const tools = Array.isArray(manifest.tools) ? manifest.tools : [];
  const toolProperties = schema.definitions?.Tool?.properties ?? {};

  assert.ok(toolProperties.officeScope, "schema must expose Tool.officeScope");
  assert.ok(toolProperties.governance, "schema must expose Tool.governance");
  assert.ok(toolProperties.paramsSchema, "schema must expose Tool.paramsSchema");

  assert.ok(
    tools.some((tool) => typeof tool.officeScope === "string"),
    "manifest should exercise officeScope"
  );
  assert.ok(
    schema.definitions?.CommandGovernanceMeta?.type === "object",
    "schema must define CommandGovernanceMeta"
  );
  assert.ok(
    tools.some((tool) => tool.paramsSchema && typeof tool.paramsSchema === "object"),
    "manifest should exercise paramsSchema"
  );

  const reasonCodeItems = toolProperties.reasonCodes?.items;
  assert.equal(reasonCodeItems?.type, "string");
  assert.equal(reasonCodeItems?.pattern, "^[a-z][a-z0-9_]*$");
  assert.equal("enum" in reasonCodeItems, false, "reasonCodes must not be pinned to a stale fixed enum");

  const manifestReasonCodes = collectNestedManifestValues(tools, "reasonCodes");
  assert.ok(manifestReasonCodes.length > 0, "manifest should contain governed reason codes");
  for (const reasonCode of manifestReasonCodes) {
    assert.match(reasonCode, /^[a-z][a-z0-9_]*$/);
  }
});
