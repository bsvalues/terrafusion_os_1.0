/**
 * TerraForge Report Engine — Contract Tests
 *
 * Validates:
 * 1. All 4 report types generate valid HTML
 * 2. HTML contains required legal references and data
 * 3. CLI integration (--list, --format html, sample generation)
 * 4. Batch mode contract
 * 5. Error handling for invalid report types
 * 6. Audit hash generation
 * 7. Data integrity in rendered output
 *
 * Run: node --test tools/bin/tests/reports.test.mjs
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..", "..");
const TF = path.join(ROOT, "tools", "bin", "tf.mjs");
const ENGINE = path.join(ROOT, "tools", "bin", "commands", "reports", "report-engine.mjs");

function runForge(...args) {
  try {
    return {
      stdout: execSync(`node "${TF}" forge ${args.join(" ")}`, {
        encoding: "utf-8",
        timeout: 10000,
        cwd: ROOT,
      }),
      exitCode: 0,
    };
  } catch (e) {
    return {
      stdout: e.stdout ?? "",
      stderr: e.stderr ?? "",
      exitCode: e.status ?? 1,
    };
  }
}

// ── Report Engine Unit Tests ─────────────────────────────────────────────────

describe("Report Engine — HTML Generation", () => {
  let engine;

  it("imports report engine module", async () => {
    engine = await import(ENGINE);
    assert.ok(engine.generateReportHtml, "generateReportHtml should be exported");
    assert.ok(engine.REPORT_TYPES, "REPORT_TYPES should be exported");
    assert.ok(engine.generateReportPdf, "generateReportPdf should be exported");
  });

  it("exports all 4 report types", async () => {
    if (!engine) engine = await import(ENGINE);
    const types = Object.keys(engine.REPORT_TYPES);
    assert.deepEqual(types.sort(), [
      "cost-valuation",
      "levy-certification",
      "ratio-study",
      "rollback-notice",
    ]);
  });

  it("generates rollback-notice HTML with required elements", async () => {
    if (!engine) engine = await import(ENGINE);
    const html = engine.generateReportHtml("rollback-notice", {
      parcelId: "TEST-001",
      ownerName: "Test Owner",
      classificationCode: "CUFA",
      enrollmentDate: "2020-01-01",
      removalDate: "2025-06-01",
      removalReason: "Voluntary withdrawal",
      yearBreakdown: [
        { year: 2020, marketValue: 400000, useValue: 100000, difference: 300000, additionalTax: 3000, interestRate: 0.00602, interest: 18.06 },
        { year: 2021, marketValue: 420000, useValue: 105000, difference: 315000, additionalTax: 3150, interestRate: 0.03860, interest: 121.59 },
      ],
      totalAdditionalTax: 6150,
      totalInterest: 139.65,
      totalPenalty: 1230,
      grandTotal: 7519.65,
    });

    assert.ok(html.includes("<!DOCTYPE html>"), "Should be valid HTML5");
    assert.ok(html.includes("TEST-001"), "Should contain parcel ID");
    assert.ok(html.includes("Test Owner"), "Should contain owner name");
    assert.ok(html.includes("RCW 84.34.108"), "Should reference RCW 84.34.108");
    assert.ok(html.includes("WAC 458-30-590"), "Should reference WAC 458-30-590");
    assert.ok(html.includes("Voluntary withdrawal"), "Should contain removal reason");
    assert.ok(html.includes("2020"), "Should contain year 2020");
    assert.ok(html.includes("2021"), "Should contain year 2021");
    assert.ok(html.includes("0.602%"), "Should format interest rate as percentage");
    assert.ok(html.includes("TOTAL DUE"), "Should contain total due label");
    assert.ok(html.includes("SHA-256:"), "Should contain audit hash");
    assert.ok(html.includes("RIGHT TO APPEAL"), "Should contain appeal notice");
  });

  it("generates levy-certification HTML with required elements", async () => {
    if (!engine) engine = await import(ENGINE);
    const html = engine.generateReportHtml("levy-certification", {
      taxYear: 2025,
      certificationDate: "2025-02-15",
      totalAV: 28_500_000_000,
      totalLevy: 285_000_000,
      districts: [
        { code: "0001", name: "State School", assessedValue: 28_500_000_000, rate: 0.002229, levyAmount: 63_526_500, status: "Certified" },
        { code: "0100", name: "County General", assessedValue: 28_500_000_000, rate: 0.001450, levyAmount: 41_325_000, status: "Certified" },
      ],
    });

    assert.ok(html.includes("LEVY CERTIFICATION"), "Should contain title");
    assert.ok(html.includes("RCW 84.52.070"), "Should reference RCW 84.52.070");
    assert.ok(html.includes("RCW 84.52.043"), "Should reference statutory limits");
    assert.ok(html.includes("2025"), "Should contain tax year");
    assert.ok(html.includes("State School"), "Should contain district name");
    assert.ok(html.includes("0001"), "Should contain district code");
    assert.ok(html.includes("CERTIFICATION"), "Should contain certification section");
    assert.ok(html.includes("SHA-256:"), "Should contain audit hash");
    assert.ok(html.includes("landscape"), "Should use landscape orientation");
  });

  it("generates cost-valuation HTML with required elements", async () => {
    if (!engine) engine = await import(ENGINE);
    const html = engine.generateReportHtml("cost-valuation", {
      parcelId: "COST-TEST-001",
      ownerName: "Cost Test Owner",
      propertyAddress: "123 Test St, Richland, WA",
      buildingType: "Single Family Residence",
      squareFootage: 2000,
      yearBuilt: 2010,
      quality: "Good",
      condition: "Average",
      region: "Tri-Cities",
      baseCostPerSqFt: 175.00,
      qualityMultiplier: 1.15,
      regionMultiplier: 1.02,
      replacementCostNew: 410_550,
      effectiveAge: 12,
      depreciationRate: 0.18,
      depreciationAmount: 73_899,
      rcnld: 336_651,
      landValue: 120_000,
      totalValue: 456_651,
    });

    assert.ok(html.includes("COST APPROACH VALUATION"), "Should contain title");
    assert.ok(html.includes("COST-TEST-001"), "Should contain parcel ID");
    assert.ok(html.includes("IAAO"), "Should reference IAAO standard");
    assert.ok(html.includes("Single Family Residence"), "Should contain building type");
    assert.ok(html.includes("2,000"), "Should format square footage");
    assert.ok(html.includes("1.1500"), "Should contain quality multiplier");
    assert.ok(html.includes("RCNLD"), "Should contain RCNLD label");
    assert.ok(html.includes("TOTAL ASSESSED VALUE"), "Should contain total value label");
    assert.ok(html.includes("SHA-256:"), "Should contain audit hash");
  });

  it("generates ratio-study HTML with required elements", async () => {
    if (!engine) engine = await import(ENGINE);
    const html = engine.generateReportHtml("ratio-study", {
      area: "Residential",
      taxYear: 2025,
      sampleSize: 200,
      medianRatio: 0.9850,
      meanRatio: 0.9920,
      cod: 12.5,
      prd: 1.005,
      prb: -0.01,
      strata: [
        { name: "Under $300K", sampleSize: 80, medianRatio: 0.99, cod: 11.0, prd: 1.01 },
        { name: "$300K-$500K", sampleSize: 120, medianRatio: 0.98, cod: 13.0, prd: 1.00 },
      ],
    });

    assert.ok(html.includes("RATIO STUDY"), "Should contain title");
    assert.ok(html.includes("IAAO"), "Should reference IAAO");
    assert.ok(html.includes("0.9850"), "Should contain median ratio");
    assert.ok(html.includes("12.50%"), "Should contain COD");
    assert.ok(html.includes("1.0050"), "Should contain PRD");
    assert.ok(html.includes("COMPLIANT"), "Should show compliance status");
    assert.ok(html.includes("Under $300K"), "Should contain stratum name");
    assert.ok(html.includes("200"), "Should contain sample size");
    assert.ok(html.includes("SHA-256:"), "Should contain audit hash");
  });

  it("throws for unknown report type", async () => {
    if (!engine) engine = await import(ENGINE);
    assert.throws(
      () => engine.generateReportHtml("invalid-type", {}),
      /Unknown report type/
    );
  });

  it("generates consistent audit hashes for same data", async () => {
    if (!engine) engine = await import(ENGINE);
    const data = { parcelId: "HASH-TEST", ownerName: "Test" };
    const html1 = engine.generateReportHtml("rollback-notice", data);
    const html2 = engine.generateReportHtml("rollback-notice", data);
    const hash1 = html1.match(/SHA-256:([a-f0-9]+)/)?.[1];
    const hash2 = html2.match(/SHA-256:([a-f0-9]+)/)?.[1];
    assert.equal(hash1, hash2, "Same data should produce same hash");
    assert.equal(hash1?.length, 16, "Hash should be 16 hex chars");
  });

  it("generates different audit hashes for different data", async () => {
    if (!engine) engine = await import(ENGINE);
    const html1 = engine.generateReportHtml("rollback-notice", { parcelId: "A" });
    const html2 = engine.generateReportHtml("rollback-notice", { parcelId: "B" });
    const hash1 = html1.match(/SHA-256:([a-f0-9]+)/)?.[1];
    const hash2 = html2.match(/SHA-256:([a-f0-9]+)/)?.[1];
    assert.notEqual(hash1, hash2, "Different data should produce different hashes");
  });
});

// ── CLI Integration Tests ────────────────────────────────────────────────────

describe("Report CLI — Integration", () => {
  it("shows report help via tf forge reports --list", () => {
    const { stdout } = runForge("reports", "--list");
    assert.match(stdout, /TerraForge Report Generator/);
    assert.match(stdout, /rollback-notice/);
    assert.match(stdout, /levy-certification/);
    assert.match(stdout, /cost-valuation/);
    assert.match(stdout, /ratio-study/);
  });

  it("shows reports module in forge help", () => {
    const { stdout } = runForge("--help");
    assert.match(stdout, /reports/);
    assert.match(stdout, /PDF\/HTML report generation/);
  });

  it("generates sample rollback-notice HTML", () => {
    const outPath = path.join(ROOT, "tmp-test-rollback.html");
    try {
      const { stdout, exitCode } = runForge("reports", "rollback-notice", "--format", "html", "--output", outPath);
      assert.equal(exitCode, 0);
      assert.ok(fs.existsSync(outPath), "Output file should exist");
      const content = fs.readFileSync(outPath, "utf-8");
      assert.ok(content.includes("<!DOCTYPE html>"), "Should be valid HTML");
      assert.ok(content.includes("RCW 84.34.108"), "Should contain RCW reference");
    } finally {
      try { fs.unlinkSync(outPath); } catch {}
    }
  });

  it("generates sample levy-certification HTML", () => {
    const outPath = path.join(ROOT, "tmp-test-levy.html");
    try {
      const { stdout, exitCode } = runForge("reports", "levy-certification", "--format", "html", "--output", outPath);
      assert.equal(exitCode, 0);
      assert.ok(fs.existsSync(outPath), "Output file should exist");
      const content = fs.readFileSync(outPath, "utf-8");
      assert.ok(content.includes("LEVY CERTIFICATION"), "Should contain title");
    } finally {
      try { fs.unlinkSync(outPath); } catch {}
    }
  });

  it("generates sample cost-valuation HTML", () => {
    const outPath = path.join(ROOT, "tmp-test-cost.html");
    try {
      const { exitCode } = runForge("reports", "cost-valuation", "--format", "html", "--output", outPath);
      assert.equal(exitCode, 0);
      assert.ok(fs.existsSync(outPath), "Output file should exist");
      const content = fs.readFileSync(outPath, "utf-8");
      assert.ok(content.includes("COST APPROACH VALUATION"), "Should contain title");
    } finally {
      try { fs.unlinkSync(outPath); } catch {}
    }
  });

  it("generates sample ratio-study HTML", () => {
    const outPath = path.join(ROOT, "tmp-test-ratio.html");
    try {
      const { exitCode } = runForge("reports", "ratio-study", "--format", "html", "--output", outPath);
      assert.equal(exitCode, 0);
      assert.ok(fs.existsSync(outPath), "Output file should exist");
      const content = fs.readFileSync(outPath, "utf-8");
      assert.ok(content.includes("RATIO STUDY"), "Should contain title");
    } finally {
      try { fs.unlinkSync(outPath); } catch {}
    }
  });

  it("generates from --data JSON file", () => {
    const dataPath = path.join(ROOT, "tmp-test-data.json");
    const outPath = path.join(ROOT, "tmp-test-from-data.html");
    try {
      fs.writeFileSync(dataPath, JSON.stringify({
        parcelId: "DATA-FILE-TEST",
        ownerName: "Data File Owner",
        classificationCode: "DFL",
        enrollmentDate: "2019-01-01",
        removalDate: "2025-01-01",
        removalReason: "Test",
        yearBreakdown: [],
        totalAdditionalTax: 1000,
        totalInterest: 50,
        totalPenalty: 200,
        grandTotal: 1250,
      }));
      const { exitCode } = runForge("reports", "rollback-notice", "--data", dataPath, "--format", "html", "--output", outPath);
      assert.equal(exitCode, 0);
      const content = fs.readFileSync(outPath, "utf-8");
      assert.ok(content.includes("DATA-FILE-TEST"), "Should contain data from file");
      assert.ok(content.includes("Data File Owner"), "Should contain owner from file");
    } finally {
      try { fs.unlinkSync(dataPath); } catch {}
      try { fs.unlinkSync(outPath); } catch {}
    }
  });

  it("handles batch mode with NDJSON file", () => {
    const batchPath = path.join(ROOT, "tmp-test-batch.ndjson");
    try {
      const lines = [
        JSON.stringify({ parcelId: "BATCH-001", ownerName: "Owner 1", yearBreakdown: [], totalAdditionalTax: 100, totalInterest: 10, totalPenalty: 20, grandTotal: 130 }),
        JSON.stringify({ parcelId: "BATCH-002", ownerName: "Owner 2", yearBreakdown: [], totalAdditionalTax: 200, totalInterest: 20, totalPenalty: 40, grandTotal: 260 }),
        JSON.stringify({ parcelId: "BATCH-003", ownerName: "Owner 3", yearBreakdown: [], totalAdditionalTax: 300, totalInterest: 30, totalPenalty: 60, grandTotal: 390 }),
      ];
      fs.writeFileSync(batchPath, lines.join("\n"));
      const { stdout, exitCode } = runForge("reports", "rollback-notice", "--batch", batchPath, "--format", "html");
      assert.equal(exitCode, 0);
      assert.match(stdout, /Batch complete/);
      assert.match(stdout, /3 generated/);
    } finally {
      try { fs.unlinkSync(batchPath); } catch {}
      // Clean up batch output directory
      const dirs = fs.readdirSync(ROOT).filter(d => d.startsWith("reports-rollback-notice-"));
      for (const dir of dirs) {
        fs.rmSync(path.join(ROOT, dir), { recursive: true, force: true });
      }
    }
  });

  it("reports error for unknown report type", () => {
    const { stderr, exitCode } = runForge("reports", "nonexistent-type", "--format", "html");
    assert.notEqual(exitCode, 0);
    assert.match(stderr, /Unknown report type/);
  });
});

// ── Data Integrity Tests ─────────────────────────────────────────────────────

describe("Report Engine — Data Integrity", () => {
  let engine;

  it("formats currency values correctly", async () => {
    engine = await import(ENGINE);
    const html = engine.generateReportHtml("rollback-notice", {
      parcelId: "FMT-TEST",
      yearBreakdown: [
        { year: 2024, marketValue: 1234567.89, useValue: 500000, difference: 734567.89, additionalTax: 7345.68, interestRate: 0.02570, interest: 188.78 },
      ],
      totalAdditionalTax: 7345.68,
      totalInterest: 188.78,
      totalPenalty: 1469.14,
      grandTotal: 9003.60,
    });

    assert.ok(html.includes("1,234,567.89"), "Should format large numbers with commas");
    assert.ok(html.includes("7,345.68"), "Should format tax amount");
    assert.ok(html.includes("9,003.60"), "Should format grand total");
  });

  it("handles empty year breakdown gracefully", async () => {
    if (!engine) engine = await import(ENGINE);
    const html = engine.generateReportHtml("rollback-notice", {
      parcelId: "EMPTY-TEST",
      yearBreakdown: [],
      totalAdditionalTax: 0,
      totalInterest: 0,
      totalPenalty: 0,
      grandTotal: 0,
    });
    assert.ok(html.includes("EMPTY-TEST"), "Should still render with empty data");
    assert.ok(html.includes("0.00"), "Should show zero values");
  });

  it("handles missing optional fields with defaults", async () => {
    if (!engine) engine = await import(ENGINE);
    // Minimal data — all optional fields should default gracefully
    const html = engine.generateReportHtml("rollback-notice", { parcelId: "MIN-TEST" });
    assert.ok(html.includes("MIN-TEST"), "Should render with minimal data");
    assert.ok(html.includes("Benton County"), "Should use default county name");
  });

  it("levy report handles large assessed values", async () => {
    if (!engine) engine = await import(ENGINE);
    const html = engine.generateReportHtml("levy-certification", {
      taxYear: 2025,
      certificationDate: "2025-01-01",
      totalAV: 50_000_000_000,
      totalLevy: 500_000_000,
      districts: [],
    });
    assert.ok(html.includes("50.00B"), "Should format billions correctly");
    assert.ok(html.includes("500.0M"), "Should format millions correctly");
  });
});
