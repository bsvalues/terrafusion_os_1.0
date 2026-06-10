/**
 * TerraForge Report CLI
 *
 * Usage:
 *   tf forge reports <type> [options]
 *
 * Types:
 *   rollback-notice      Generate RCW 84.34.108 removal notice
 *   levy-certification   Generate RCW 84.52.070 levy certification
 *   cost-valuation       Generate IAAO cost approach report
 *   ratio-study          Generate IAAO ratio study report
 *
 * Options:
 *   --data <file>        JSON file with report data
 *   --output <file>      Output path (default: ./report-<type>-<timestamp>.pdf)
 *   --format <fmt>       Output format: pdf, html (default: pdf)
 *   --batch <file>       NDJSON file for batch report generation
 *   --list               List available report types
 *
 * @module terraforge-report-cli
 */
import fs from "node:fs";
import path from "node:path";
import { generateReportHtml, generateReportPdf, REPORT_TYPES } from "./report-engine.mjs";

export default async function reportCommand(args) {
  if (args.includes("--list") || args.includes("--help") || args.length === 0) {
    printHelp();
    return;
  }

  const reportType = args[0];
  if (!REPORT_TYPES[reportType]) {
    console.error(`❌ Unknown report type: "${reportType}"`);
    console.error(`   Available: ${Object.keys(REPORT_TYPES).join(", ")}`);
    process.exit(1);
  }

  const format = getFlag(args, "--format") || "pdf";
  const dataFile = getFlag(args, "--data");
  const outputFile = getFlag(args, "--output");
  const batchFile = getFlag(args, "--batch");

  // Batch mode: process NDJSON file
  if (batchFile) {
    await processBatch(reportType, batchFile, format);
    return;
  }

  // Single report mode
  if (!dataFile) {
    // Generate with sample data for preview
    console.log(`⚠️  No --data file provided. Generating sample ${REPORT_TYPES[reportType].name}...`);
    const sampleData = getSampleData(reportType);
    await generateSingle(reportType, sampleData, format, outputFile);
    return;
  }

  const data = JSON.parse(fs.readFileSync(dataFile, "utf-8"));
  await generateSingle(reportType, data, format, outputFile);
}

async function generateSingle(reportType, data, format, outputFile) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").split("T")[0];
  const defaultExt = format === "html" ? ".html" : ".pdf";
  const output = outputFile || `./report-${reportType}-${timestamp}${defaultExt}`;

  if (format === "html") {
    const html = generateReportHtml(reportType, data);
    fs.writeFileSync(output, html, "utf-8");
    console.log(`✅ HTML report generated: ${output}`);
  } else {
    try {
      await generateReportPdf(reportType, data, output);
      console.log(`✅ PDF report generated: ${output}`);
    } catch (err) {
      console.error(`⚠️  ${err.message}`);
      // Fallback to HTML
      const htmlOutput = output.replace(/\.pdf$/, ".html");
      const html = generateReportHtml(reportType, data);
      fs.writeFileSync(htmlOutput, html, "utf-8");
      console.log(`📄 HTML fallback saved: ${htmlOutput}`);
    }
  }
}

async function processBatch(reportType, batchFile, format) {
  const lines = fs.readFileSync(batchFile, "utf-8").trim().split("\n");
  const outputDir = `./reports-${reportType}-${Date.now()}`;
  fs.mkdirSync(outputDir, { recursive: true });

  console.log(`📦 Batch processing ${lines.length} reports → ${outputDir}/`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < lines.length; i++) {
    try {
      const data = JSON.parse(lines[i]);
      const id = data.parcelId || data.district || `item-${i + 1}`;
      const ext = format === "html" ? ".html" : ".pdf";
      const output = path.join(outputDir, `${reportType}-${id}${ext}`);

      if (format === "html") {
        const html = generateReportHtml(reportType, data);
        fs.writeFileSync(output, html, "utf-8");
      } else {
        await generateReportPdf(reportType, data, output);
      }
      success++;
      if ((i + 1) % 10 === 0 || i === lines.length - 1) {
        process.stdout.write(`\r  Progress: ${i + 1}/${lines.length} (${success} ok, ${failed} err)`);
      }
    } catch (err) {
      failed++;
    }
  }

  console.log(`\n✅ Batch complete: ${success} generated, ${failed} failed → ${outputDir}/`);
}

function getFlag(args, flag) {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx >= args.length - 1) return null;
  return args[idx + 1];
}

function printHelp() {
  console.log(`
TerraForge Report Generator
════════════════════════════

Usage: tf forge reports <type> [options]

Report Types:
${Object.entries(REPORT_TYPES)
  .map(([key, val]) => `  ${key.padEnd(22)} ${val.description}`)
  .join("\n")}

Options:
  --data <file>       JSON file with report data
  --output <file>     Output path (default: auto-generated)
  --format <fmt>      Output format: pdf, html (default: pdf)
  --batch <file>      NDJSON file for batch generation (one JSON per line)
  --list              List available report types

Examples:
  tf forge reports rollback-notice --data parcel.json --output notice.pdf
  tf forge reports levy-certification --data levy-2025.json --format html
  tf forge reports cost-valuation --batch parcels.ndjson
  tf forge reports ratio-study --data study.json
`);
}

function getSampleData(reportType) {
  const samples = {
    "rollback-notice": {
      countyName: "Benton County",
      assessorName: "John Smith, County Assessor",
      parcelId: "1-0345-200-0012-000",
      ownerName: "Jane Doe",
      ownerAddress: "1234 Vineyard Lane, Prosser, WA 99350",
      propertyAddress: "1234 Vineyard Lane, Prosser, WA 99350",
      classificationCode: "FARM",
      enrollmentDate: "2018-01-01",
      removalDate: "2025-06-15",
      removalReason: "Voluntary withdrawal — land use change to residential subdivision",
      yearBreakdown: [
        { year: 2018, marketValue: 450000, useValue: 120000, difference: 330000, additionalTax: 3300, interestRate: 0.02169, interest: 71.58 },
        { year: 2019, marketValue: 475000, useValue: 125000, difference: 350000, additionalTax: 3500, interestRate: 0.01396, interest: 48.86 },
        { year: 2020, marketValue: 490000, useValue: 128000, difference: 362000, additionalTax: 3620, interestRate: 0.00602, interest: 21.79 },
        { year: 2021, marketValue: 540000, useValue: 130000, difference: 410000, additionalTax: 4100, interestRate: 0.03860, interest: 158.26 },
        { year: 2022, marketValue: 610000, useValue: 135000, difference: 475000, additionalTax: 4750, interestRate: 0.06457, interest: 306.71 },
        { year: 2023, marketValue: 625000, useValue: 138000, difference: 487000, additionalTax: 4870, interestRate: 0.03670, interest: 178.73 },
        { year: 2024, marketValue: 650000, useValue: 140000, difference: 510000, additionalTax: 5100, interestRate: 0.02570, interest: 131.07 },
      ],
      totalAdditionalTax: 29240,
      totalInterest: 917.00,
      totalPenalty: 5848.00,
      grandTotal: 36005.00,
      penaltyExceptions: [
        { code: "DEATH", description: "Death of owner (RCW 84.34.108(6)(a))", applies: false },
        { code: "TRANSFER_GOVT", description: "Transfer to government entity", applies: false },
      ],
      appealDeadline: "2025-08-14",
    },
    "levy-certification": {
      countyName: "Benton County",
      assessorName: "John Smith, County Assessor",
      taxYear: 2025,
      certificationDate: "2025-02-15",
      totalAV: 28_500_000_000,
      totalLevy: 285_000_000,
      districts: [
        { code: "0001", name: "State School Levy", assessedValue: 28_500_000_000, rate: 0.002229, levyAmount: 63_526_500, status: "Certified" },
        { code: "0100", name: "Benton County General", assessedValue: 28_500_000_000, rate: 0.001450, levyAmount: 41_325_000, status: "Certified" },
        { code: "0200", name: "Benton County Road", assessedValue: 18_200_000_000, rate: 0.001800, levyAmount: 32_760_000, status: "Certified" },
        { code: "0301", name: "City of Kennewick", assessedValue: 12_400_000_000, rate: 0.003150, levyAmount: 39_060_000, status: "Certified" },
        { code: "0302", name: "City of Richland", assessedValue: 9_800_000_000, rate: 0.002980, levyAmount: 29_204_000, status: "Certified" },
        { code: "0401", name: "Fire District 1", assessedValue: 6_200_000_000, rate: 0.001500, levyAmount: 9_300_000, status: "Certified" },
        { code: "0501", name: "Kennewick School District", assessedValue: 12_400_000_000, rate: 0.002800, levyAmount: 34_720_000, status: "Certified" },
        { code: "0601", name: "Port of Kennewick", assessedValue: 12_400_000_000, rate: 0.000450, levyAmount: 5_580_000, status: "Certified" },
      ],
    },
    "cost-valuation": {
      countyName: "Benton County",
      parcelId: "1-0920-100-0045-000",
      ownerName: "Robert Johnson",
      propertyAddress: "5678 Columbia Dr, Richland, WA 99352",
      buildingType: "Single Family Residence",
      squareFootage: 2400,
      yearBuilt: 2005,
      quality: "Good",
      condition: "Average",
      region: "Tri-Cities",
      baseCostPerSqFt: 185.50,
      qualityMultiplier: 1.15,
      regionMultiplier: 1.02,
      replacementCostNew: 524_277.60,
      effectiveAge: 15,
      depreciationRate: 0.225,
      depreciationAmount: 117_962.46,
      rcnld: 406_315.14,
      landValue: 145_000,
      totalValue: 551_315.14,
      assessmentDate: "2025-01-01",
    },
    "ratio-study": {
      countyName: "Benton County",
      area: "Residential — All Areas",
      taxYear: 2025,
      sampleSize: 342,
      medianRatio: 0.9823,
      meanRatio: 0.9915,
      cod: 11.24,
      prd: 1.0094,
      prb: -0.012,
      strata: [
        { name: "Under $300K", sampleSize: 89, medianRatio: 0.9912, cod: 12.8, prd: 1.012 },
        { name: "$300K–$500K", sampleSize: 145, medianRatio: 0.9845, cod: 10.2, prd: 1.005 },
        { name: "$500K–$750K", sampleSize: 72, medianRatio: 0.9756, cod: 11.9, prd: 1.008 },
        { name: "Over $750K", sampleSize: 36, medianRatio: 0.9680, cod: 14.1, prd: 1.015 },
      ],
    },
  };
  return samples[reportType];
}
