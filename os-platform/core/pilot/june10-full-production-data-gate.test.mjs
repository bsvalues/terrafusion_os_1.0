#!/usr/bin/env node

import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  buildFullProductionDataGateReport,
  evaluateCountyFullDataReadiness,
  runFullProductionDataGate
} from "./june10-full-production-data-gate.mjs";

const counties = [
  "Adams",
  "Asotin",
  "Benton",
  "Chelan",
  "Clallam",
  "Clark",
  "Columbia",
  "Cowlitz",
  "Douglas",
  "Ferry",
  "Franklin",
  "Garfield",
  "Grant",
  "Grays Harbor",
  "Island",
  "Jefferson",
  "King",
  "Kitsap",
  "Kittitas",
  "Klickitat",
  "Lewis",
  "Lincoln",
  "Mason",
  "Okanogan",
  "Pacific",
  "Pend Oreille",
  "Pierce",
  "San Juan",
  "Skagit",
  "Skamania",
  "Snohomish",
  "Spokane",
  "Stevens",
  "Thurston",
  "Wahkiakum",
  "Walla Walla",
  "Whatcom",
  "Whitman",
  "Yakima"
];

function readyCounty(county) {
  return {
    county,
    state: "WA",
    classification: "runtime_proven",
    activationStatus: "runtime_proven",
    runtimeClass: "runtime_proven",
    runtimeRows: 100,
    parcelSemanticsProven: true,
    blockers: []
  };
}

function crosswalk(rows) {
  return {
    generatedAt: "2026-05-22T00:00:00.000Z",
    summary: {
      countiesChecked: rows.length
    },
    rows
  };
}

test("county full-data readiness requires runtime rows, semantics, runtime class, activation, and no blockers", () => {
  const ready = evaluateCountyFullDataReadiness(readyCounty("Benton"));
  assert.equal(ready.ready, true);
  assert.deepEqual(ready.blockers, []);

  const blocked = evaluateCountyFullDataReadiness({
    ...readyCounty("Clark"),
    runtimeRows: 0,
    parcelSemanticsProven: false,
    blockers: ["County endpoint is registered but returns zero rows."]
  });

  assert.equal(blocked.ready, false);
  assert.ok(blocked.blockers.includes("Runtime returned zero rows."));
  assert.ok(blocked.blockers.includes("Parcel semantics are not proven."));
  assert.ok(blocked.blockers.includes("County endpoint is registered but returns zero rows."));
});

test("full production data gate passes only when all 39 counties are full-data ready", () => {
  const report = buildFullProductionDataGateReport({
    crosswalk: crosswalk(counties.map(readyCounty))
  });

  assert.equal(report.passed, true);
  assert.equal(report.summary.fullDataReadyCounties, 39);
  assert.equal(report.summary.fullProductionDataReady, true);
  assert.equal(report.summary.bentonOnlyPilot, false);
  assert.equal(report.summary.prohibitFullProductionClaim, false);
});

test("full production data gate fails for Benton-only runtime proof and reports the 38-county gap", () => {
  const report = buildFullProductionDataGateReport({
    crosswalk: crosswalk(
      counties.map((county) =>
        county === "Benton"
          ? readyCounty(county)
          : {
              county,
              state: "WA",
              classification: "provenance_inventory_only",
              activationStatus: "provenance_only_needs_data_acquisition",
              runtimeClass: "not_registered",
              runtimeRows: 0,
              parcelSemanticsProven: false,
              blockers: ["County is not registered in runtime endpoint."]
            }
      )
    )
  });

  assert.equal(report.passed, false);
  assert.equal(report.summary.fullDataReadyCounties, 1);
  assert.equal(report.summary.notFullDataReadyCounties, 38);
  assert.equal(report.summary.bentonOnlyPilot, true);
  assert.equal(report.summary.prohibitFullProductionClaim, true);
  assert.ok(report.blockers.some((blocker) => blocker.source === "full_county_data"));
  assert.ok(report.claimRules.forbiddenClaims.includes("full production data is ready"));
});

test("full production data gate writes JSON and Markdown evidence", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tf-full-production-data-"));
  const crosswalkPath = path.join(root, "crosswalk.json");
  const outJson = path.join(root, "gate.json");
  const outMd = path.join(root, "gate.md");

  fs.writeFileSync(crosswalkPath, JSON.stringify(crosswalk(counties.map(readyCounty)), null, 2));

  const report = runFullProductionDataGate({
    crosswalkPath,
    outJson,
    outMd
  });

  assert.equal(report.passed, true);
  assert.equal(JSON.parse(fs.readFileSync(outJson, "utf8")).summary.fullDataReadyCounties, 39);
  assert.match(fs.readFileSync(outMd, "utf8"), /Full Production Data Gate/);
});

test("CLI writes evidence and exits nonzero when full production data is not ready", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tf-full-production-cli-"));
  const crosswalkPath = path.join(root, "crosswalk.json");
  const outJson = path.join(root, "gate.json");
  const outMd = path.join(root, "gate.md");
  const scriptPath = path.resolve("os-platform/core/pilot/june10-full-production-data-gate.mjs");

  fs.writeFileSync(
    crosswalkPath,
    JSON.stringify(
      crosswalk(
        counties.map((county) =>
          county === "Benton"
            ? readyCounty(county)
            : {
                county,
                state: "WA",
                classification: "provenance_inventory_only",
                activationStatus: "provenance_only_needs_data_acquisition",
                runtimeClass: "not_registered",
                runtimeRows: 0,
                parcelSemanticsProven: false,
                blockers: []
              }
        )
      ),
      null,
      2
    )
  );

  const result = spawnSync(
    process.execPath,
    [scriptPath, "--crosswalk", crosswalkPath, "--out-json", outJson, "--out-md", outMd],
    {
      cwd: process.cwd(),
      encoding: "utf8"
    }
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /"fullProductionDataReady": false/);
  assert.equal(JSON.parse(fs.readFileSync(outJson, "utf8")).summary.notFullDataReadyCounties, 38);
  assert.match(fs.readFileSync(outMd, "utf8"), /Verdict: \*\*FAIL\*\*/);
});
