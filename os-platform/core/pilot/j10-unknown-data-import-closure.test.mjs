import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const controllerPath = path.join(repoRoot, "backend/src/TerraFusion.API/Controllers/DataImportController.cs");

test("DataImport surface is authenticated and does not fake import execution", () => {
  const source = fs.readFileSync(controllerPath, "utf8");

  assert.match(source, /using Microsoft\.AspNetCore\.Authorization;/);
  assert.match(source, /\[Authorize\]\s*\[Produces\("application\/json"\)\]\s*public class DataImportController/);
  assert.doesNotMatch(source, /\[AllowAnonymous\]/);
  assert.doesNotMatch(source, /deleted = true/);
  assert.doesNotMatch(source, /status = "queued"/);
  assert.doesNotMatch(source, /status = "pending"/);
  assert.doesNotMatch(source, /Guid\.NewGuid\(\)/);
  assert.match(source, /DATA_IMPORT_STORAGE_UNCONFIGURED/);
  assert.match(source, /DATA_IMPORT_UNAVAILABLE/);
  assert.match(source, /StatusCodes\.Status503ServiceUnavailable/);
  assert.match(source, /generated = false/);
});
