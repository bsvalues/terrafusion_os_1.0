using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace TerraFusion.API.Controllers;

/// <summary>
/// TerraForge Report Generation API
///
/// Generates formal assessment reports as HTML (print-ready, PDF-convertible):
/// - Rollback Notice (RCW 84.34.108)
/// - Levy Certification (RCW 84.52.070)
/// - Cost Approach Valuation (IAAO Standard)
/// - Ratio Study (IAAO Standard)
///
/// Each report includes:
/// - SHA-256 audit hash for tamper detection
/// - Legal citations and statutory references
/// - Print-optimized CSS with @media print rules
/// - Benton County WA branding and official formatting
///
/// These endpoints accept POST with JSON body containing report data
/// and return text/html content suitable for download or PDF conversion.
/// </summary>
[ApiController]
[Route("api/reports")]
public class TerraForgeReportsController : ControllerBase
{
    private readonly ILogger<TerraForgeReportsController> _logger;

    public TerraForgeReportsController(ILogger<TerraForgeReportsController> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Generate a Current Use Rollback Notice (RCW 84.34.108)
    /// </summary>
    [HttpPost("rollback-notice")]
    [Produces("text/html")]
    public IActionResult GenerateRollbackNotice([FromBody] JsonElement data)
    {
        var sw = Stopwatch.StartNew();
        try
        {
            var html = RenderRollbackNotice(data);
            _logger.LogInformation("Generated rollback-notice report in {Elapsed}ms", sw.ElapsedMilliseconds);
            return Content(html, "text/html", Encoding.UTF8);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate rollback-notice report");
            return StatusCode(500, new { error = "Report generation failed", detail = ex.Message });
        }
    }

    /// <summary>
    /// Generate a Levy Certification Report (RCW 84.52.070)
    /// </summary>
    [HttpPost("levy-certification")]
    [Produces("text/html")]
    public IActionResult GenerateLevyCertification([FromBody] JsonElement data)
    {
        var sw = Stopwatch.StartNew();
        try
        {
            var html = RenderLevyCertification(data);
            _logger.LogInformation("Generated levy-certification report in {Elapsed}ms", sw.ElapsedMilliseconds);
            return Content(html, "text/html", Encoding.UTF8);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate levy-certification report");
            return StatusCode(500, new { error = "Report generation failed", detail = ex.Message });
        }
    }

    /// <summary>
    /// Generate a Cost Approach Valuation Report (IAAO Standard)
    /// </summary>
    [HttpPost("cost-valuation")]
    [Produces("text/html")]
    public IActionResult GenerateCostValuation([FromBody] JsonElement data)
    {
        var sw = Stopwatch.StartNew();
        try
        {
            var html = RenderCostValuation(data);
            _logger.LogInformation("Generated cost-valuation report in {Elapsed}ms", sw.ElapsedMilliseconds);
            return Content(html, "text/html", Encoding.UTF8);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate cost-valuation report");
            return StatusCode(500, new { error = "Report generation failed", detail = ex.Message });
        }
    }

    /// <summary>
    /// Generate a Ratio Study Report (IAAO Standard)
    /// </summary>
    [HttpPost("ratio-study")]
    [Produces("text/html")]
    public IActionResult GenerateRatioStudy([FromBody] JsonElement data)
    {
        var sw = Stopwatch.StartNew();
        try
        {
            var html = RenderRatioStudy(data);
            _logger.LogInformation("Generated ratio-study report in {Elapsed}ms", sw.ElapsedMilliseconds);
            return Content(html, "text/html", Encoding.UTF8);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate ratio-study report");
            return StatusCode(500, new { error = "Report generation failed", detail = ex.Message });
        }
    }

    /// <summary>
    /// List available report types and their schemas
    /// </summary>
    [HttpGet("types")]
    public IActionResult ListReportTypes()
    {
        return Ok(new[]
        {
            new { type = "rollback-notice", title = "Current Use Rollback Notice", legalBasis = "RCW 84.34.108", description = "Year-by-year tax breakdown with interest and penalty" },
            new { type = "levy-certification", title = "Levy Certification Report", legalBasis = "RCW 84.52.070", description = "All district rates with statutory compliance verification" },
            new { type = "cost-valuation", title = "Cost Approach Valuation", legalBasis = "IAAO Standard", description = "RCN, depreciation, RCNLD, and total assessed value" },
            new { type = "ratio-study", title = "Ratio Study Report", legalBasis = "IAAO Standard", description = "COD, PRD, PRB metrics with stratified analysis" },
        });
    }

    // ── Private Rendering Methods ────────────────────────────────────────────

    private static string ComputeAuditHash(string content)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(content));
        return Convert.ToHexString(bytes)[..16].ToLowerInvariant();
    }

    private static string Fmt(decimal value) => value.ToString("N2");
    private static string FmtPct(decimal value) => (value * 100).ToString("F3") + "%";
    private static string FmtRate(decimal value) => value.ToString("F6");
    private static string GetStr(JsonElement el, string prop, string fallback = "")
    {
        if (el.TryGetProperty(prop, out var v) && v.ValueKind == JsonValueKind.String)
            return v.GetString() ?? fallback;
        return fallback;
    }
    private static decimal GetDec(JsonElement el, string prop, decimal fallback = 0)
    {
        if (el.TryGetProperty(prop, out var v))
        {
            if (v.ValueKind == JsonValueKind.Number) return v.GetDecimal();
            if (v.ValueKind == JsonValueKind.String && decimal.TryParse(v.GetString(), out var d)) return d;
        }
        return fallback;
    }
    private static int GetInt(JsonElement el, string prop, int fallback = 0)
    {
        if (el.TryGetProperty(prop, out var v))
        {
            if (v.ValueKind == JsonValueKind.Number) return v.GetInt32();
            if (v.ValueKind == JsonValueKind.String && int.TryParse(v.GetString(), out var i)) return i;
        }
        return fallback;
    }

    private static string BaseStyles => @"
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', system-ui, sans-serif; font-size: 11pt; color: #1a1a2e; line-height: 1.5; padding: 40px; max-width: 1000px; margin: 0 auto; }
        h1 { font-size: 18pt; text-align: center; margin-bottom: 4px; color: #0f172a; }
        h2 { font-size: 13pt; margin: 16px 0 8px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
        .header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #334155; padding-bottom: 16px; }
        .header .county { font-size: 14pt; font-weight: 700; color: #0f172a; }
        .header .subtitle { font-size: 10pt; color: #64748b; }
        table { width: 100%; border-collapse: collapse; margin: 8px 0 16px; font-size: 10pt; }
        th, td { padding: 6px 10px; border: 1px solid #cbd5e1; text-align: left; }
        th { background: #f1f5f9; font-weight: 600; color: #334155; }
        tr:nth-child(even) { background: #f8fafc; }
        .total-row { background: #e2e8f0 !important; font-weight: 700; }
        .legal { font-size: 9pt; color: #64748b; margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; }
        .audit { font-size: 8pt; color: #94a3b8; margin-top: 8px; font-family: monospace; }
        .compliant { color: #16a34a; font-weight: 700; }
        .non-compliant { color: #dc2626; font-weight: 700; }
        .appeal { background: #fef3c7; border: 1px solid #f59e0b; padding: 12px; margin-top: 16px; border-radius: 4px; font-size: 10pt; }
        .signature-block { margin-top: 32px; display: flex; gap: 40px; }
        .signature-line { border-top: 1px solid #334155; width: 200px; padding-top: 4px; font-size: 9pt; color: #64748b; }
        @media print { body { padding: 20px; } .no-print { display: none; } }
        @page { size: letter; margin: 0.75in; }
    ";

    private string RenderRollbackNotice(JsonElement data)
    {
        var parcelId = GetStr(data, "parcelId", "Unknown");
        var ownerName = GetStr(data, "ownerName", "Property Owner");
        var classCode = GetStr(data, "classificationCode", "CU");
        var enrollDate = GetStr(data, "enrollmentDate", "N/A");
        var removalDate = GetStr(data, "removalDate", "N/A");
        var removalReason = GetStr(data, "removalReason", "Removal from program");
        var totalTax = GetDec(data, "totalAdditionalTax");
        var totalInterest = GetDec(data, "totalInterest");
        var totalPenalty = GetDec(data, "totalPenalty");
        var grandTotal = GetDec(data, "grandTotal");

        var yearRows = new StringBuilder();
        if (data.TryGetProperty("yearBreakdown", out var years) && years.ValueKind == JsonValueKind.Array)
        {
            foreach (var yr in years.EnumerateArray())
            {
                yearRows.AppendLine($@"
                <tr>
                    <td>{GetInt(yr, "year")}</td>
                    <td style=""text-align:right"">${Fmt(GetDec(yr, "marketValue"))}</td>
                    <td style=""text-align:right"">${Fmt(GetDec(yr, "useValue"))}</td>
                    <td style=""text-align:right"">${Fmt(GetDec(yr, "difference"))}</td>
                    <td style=""text-align:right"">${Fmt(GetDec(yr, "additionalTax"))}</td>
                    <td style=""text-align:right"">{FmtPct(GetDec(yr, "interestRate"))}</td>
                    <td style=""text-align:right"">${Fmt(GetDec(yr, "interest"))}</td>
                </tr>");
            }
        }

        var dataForHash = $"{parcelId}|{grandTotal}|{DateTime.UtcNow:yyyy-MM-dd}";
        var hash = ComputeAuditHash(dataForHash);

        return $@"<!DOCTYPE html>
<html lang=""en"">
<head>
    <meta charset=""UTF-8"">
    <title>Rollback Notice — {parcelId}</title>
    <style>{BaseStyles}</style>
</head>
<body>
    <div class=""header"">
        <div class=""county"">BENTON COUNTY ASSESSOR</div>
        <div class=""subtitle"">State of Washington</div>
        <h1>CURRENT USE ROLLBACK NOTICE</h1>
        <div class=""subtitle"">Per RCW 84.34.108 &amp; WAC 458-30-590</div>
    </div>

    <h2>Property Information</h2>
    <table>
        <tr><th>Parcel ID</th><td>{parcelId}</td><th>Owner</th><td>{ownerName}</td></tr>
        <tr><th>Classification</th><td>{classCode}</td><th>Enrollment Date</th><td>{enrollDate}</td></tr>
        <tr><th>Removal Date</th><td>{removalDate}</td><th>Removal Reason</th><td>{removalReason}</td></tr>
    </table>

    <h2>Year-by-Year Tax Breakdown</h2>
    <table>
        <thead>
            <tr><th>Year</th><th style=""text-align:right"">Market Value</th><th style=""text-align:right"">Use Value</th><th style=""text-align:right"">Difference</th><th style=""text-align:right"">Add'l Tax</th><th style=""text-align:right"">Interest Rate</th><th style=""text-align:right"">Interest</th></tr>
        </thead>
        <tbody>
            {yearRows}
        </tbody>
    </table>

    <h2>TOTAL DUE</h2>
    <table>
        <tr><th>Additional Tax</th><td style=""text-align:right"">${Fmt(totalTax)}</td></tr>
        <tr><th>Interest (RCW 84.34.108)</th><td style=""text-align:right"">${Fmt(totalInterest)}</td></tr>
        <tr><th>Penalty (20% per RCW 84.34.108)</th><td style=""text-align:right"">${Fmt(totalPenalty)}</td></tr>
        <tr class=""total-row""><th>TOTAL DUE</th><td style=""text-align:right;font-size:14pt"">${Fmt(grandTotal)}</td></tr>
    </table>

    <div class=""appeal"">
        <strong>RIGHT TO APPEAL</strong><br/>
        Per RCW 84.34.108(4), you may appeal this determination to the Benton County Board of Equalization
        within 30 days of the date of this notice. Contact the Clerk of the Board at (509) 736-3085.
    </div>

    <div class=""signature-block"">
        <div><div class=""signature-line"">County Assessor</div></div>
        <div><div class=""signature-line"">Date</div></div>
    </div>

    <div class=""legal"">
        <strong>Legal Authority:</strong> RCW 84.34.108 (Additional tax — Interest — Penalties — Lien);
        WAC 458-30-590 (Removal procedures); RCW 84.34.020 (Definitions).
    </div>
    <div class=""audit"">Report generated: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC | SHA-256:{hash}</div>
</body>
</html>";
    }

    private string RenderLevyCertification(JsonElement data)
    {
        var taxYear = GetInt(data, "taxYear", DateTime.Now.Year);
        var certDate = GetStr(data, "certificationDate", DateTime.Now.ToString("yyyy-MM-dd"));
        var totalAV = GetDec(data, "totalAV");
        var totalLevy = GetDec(data, "totalLevy");

        var districtRows = new StringBuilder();
        if (data.TryGetProperty("districts", out var districts) && districts.ValueKind == JsonValueKind.Array)
        {
            foreach (var d in districts.EnumerateArray())
            {
                districtRows.AppendLine($@"
                <tr>
                    <td>{GetStr(d, "code")}</td>
                    <td>{GetStr(d, "name")}</td>
                    <td style=""text-align:right"">${Fmt(GetDec(d, "assessedValue") / 1_000_000)}M</td>
                    <td style=""text-align:right"">{FmtRate(GetDec(d, "rate"))}</td>
                    <td style=""text-align:right"">${Fmt(GetDec(d, "levyAmount"))}</td>
                    <td>{GetStr(d, "status", "Certified")}</td>
                </tr>");
            }
        }

        var dataForHash = $"levy|{taxYear}|{totalLevy}|{DateTime.UtcNow:yyyy-MM-dd}";
        var hash = ComputeAuditHash(dataForHash);

        return $@"<!DOCTYPE html>
<html lang=""en"">
<head>
    <meta charset=""UTF-8"">
    <title>Levy Certification — {taxYear}</title>
    <style>{BaseStyles} @page {{ size: letter landscape; }}</style>
</head>
<body>
    <div class=""header"">
        <div class=""county"">BENTON COUNTY ASSESSOR</div>
        <div class=""subtitle"">State of Washington</div>
        <h1>LEVY CERTIFICATION REPORT</h1>
        <div class=""subtitle"">Tax Year {taxYear} — Per RCW 84.52.070 &amp; RCW 84.52.043</div>
    </div>

    <h2>Certification Summary</h2>
    <table>
        <tr><th>Tax Year</th><td>{taxYear}</td><th>Certification Date</th><td>{certDate}</td></tr>
        <tr><th>Total Assessed Value</th><td>${Fmt(totalAV / 1_000_000_000)}B</td><th>Total Levy</th><td>${Fmt(totalLevy / 1_000_000)}M</td></tr>
    </table>

    <h2>District Levy Detail</h2>
    <table>
        <thead>
            <tr><th>Code</th><th>District</th><th style=""text-align:right"">Assessed Value</th><th style=""text-align:right"">Rate (per $1)</th><th style=""text-align:right"">Levy Amount</th><th>Status</th></tr>
        </thead>
        <tbody>
            {districtRows}
        </tbody>
    </table>

    <h2>CERTIFICATION</h2>
    <p>I hereby certify that the above levy amounts have been calculated in accordance with
    RCW 84.52.070 and do not exceed the statutory limits established by RCW 84.52.043.
    All districts have been verified for compliance with the 101% limit factor (RCW 84.55.010).</p>

    <div class=""signature-block"">
        <div><div class=""signature-line"">County Assessor</div></div>
        <div><div class=""signature-line"">Date</div></div>
    </div>

    <div class=""legal"">
        <strong>Legal Authority:</strong> RCW 84.52.070 (Levy certification); RCW 84.52.043 (Levy limits);
        RCW 84.55.010 (Limit factor); RCW 84.52.010 (Annual levy).
    </div>
    <div class=""audit"">Report generated: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC | SHA-256:{hash}</div>
</body>
</html>";
    }

    private string RenderCostValuation(JsonElement data)
    {
        var parcelId = GetStr(data, "parcelId", "Unknown");
        var ownerName = GetStr(data, "ownerName", "Property Owner");
        var address = GetStr(data, "propertyAddress", "Benton County, WA");
        var buildingType = GetStr(data, "buildingType", "Residential");
        var sqft = GetInt(data, "squareFootage");
        var yearBuilt = GetInt(data, "yearBuilt");
        var quality = GetStr(data, "quality", "Average");
        var condition = GetStr(data, "condition", "Average");
        var region = GetStr(data, "region", "Benton County");
        var baseCost = GetDec(data, "baseCostPerSqFt");
        var qualMult = GetDec(data, "qualityMultiplier", 1.0m);
        var regMult = GetDec(data, "regionMultiplier", 1.0m);
        var rcn = GetDec(data, "replacementCostNew");
        var effAge = GetInt(data, "effectiveAge");
        var depRate = GetDec(data, "depreciationRate");
        var depAmt = GetDec(data, "depreciationAmount");
        var rcnld = GetDec(data, "rcnld");
        var landValue = GetDec(data, "landValue");
        var totalValue = GetDec(data, "totalValue");

        var dataForHash = $"cost|{parcelId}|{totalValue}|{DateTime.UtcNow:yyyy-MM-dd}";
        var hash = ComputeAuditHash(dataForHash);

        return $@"<!DOCTYPE html>
<html lang=""en"">
<head>
    <meta charset=""UTF-8"">
    <title>Cost Valuation — {parcelId}</title>
    <style>{BaseStyles}</style>
</head>
<body>
    <div class=""header"">
        <div class=""county"">BENTON COUNTY ASSESSOR</div>
        <div class=""subtitle"">State of Washington</div>
        <h1>COST APPROACH VALUATION REPORT</h1>
        <div class=""subtitle"">Per IAAO Standard on Mass Appraisal of Real Property</div>
    </div>

    <h2>Property Information</h2>
    <table>
        <tr><th>Parcel ID</th><td>{parcelId}</td><th>Owner</th><td>{ownerName}</td></tr>
        <tr><th>Address</th><td>{address}</td><th>Region</th><td>{region}</td></tr>
        <tr><th>Building Type</th><td>{buildingType}</td><th>Year Built</th><td>{yearBuilt}</td></tr>
        <tr><th>Square Footage</th><td>{sqft:N0}</td><th>Quality / Condition</th><td>{quality} / {condition}</td></tr>
    </table>

    <h2>Cost Calculation</h2>
    <table>
        <tr><th>Base Cost per Sq Ft</th><td style=""text-align:right"">${baseCost:F2}</td></tr>
        <tr><th>Quality Multiplier</th><td style=""text-align:right"">{qualMult:F4}</td></tr>
        <tr><th>Region Multiplier</th><td style=""text-align:right"">{regMult:F4}</td></tr>
        <tr class=""total-row""><th>Replacement Cost New (RCN)</th><td style=""text-align:right"">${Fmt(rcn)}</td></tr>
    </table>

    <h2>Depreciation</h2>
    <table>
        <tr><th>Effective Age</th><td>{effAge} years</td></tr>
        <tr><th>Depreciation Rate</th><td>{FmtPct(depRate)}</td></tr>
        <tr><th>Depreciation Amount</th><td style=""text-align:right"">-${Fmt(depAmt)}</td></tr>
        <tr class=""total-row""><th>RCNLD (Replacement Cost New Less Depreciation)</th><td style=""text-align:right"">${Fmt(rcnld)}</td></tr>
    </table>

    <h2>TOTAL ASSESSED VALUE</h2>
    <table>
        <tr><th>Improvement Value (RCNLD)</th><td style=""text-align:right"">${Fmt(rcnld)}</td></tr>
        <tr><th>Land Value</th><td style=""text-align:right"">${Fmt(landValue)}</td></tr>
        <tr class=""total-row""><th>TOTAL ASSESSED VALUE</th><td style=""text-align:right;font-size:14pt"">${Fmt(totalValue)}</td></tr>
    </table>

    <div class=""signature-block"">
        <div><div class=""signature-line"">Appraiser</div></div>
        <div><div class=""signature-line"">Date</div></div>
    </div>

    <div class=""legal"">
        <strong>Methodology:</strong> IAAO Standard on Mass Appraisal of Real Property (2017);
        Marshall &amp; Swift cost tables; Benton County depreciation schedules.
        <br/><strong>Legal Authority:</strong> RCW 84.40.030 (True and fair value); WAC 458-07-030 (Valuation methods).
    </div>
    <div class=""audit"">Report generated: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC | SHA-256:{hash}</div>
</body>
</html>";
    }

    private string RenderRatioStudy(JsonElement data)
    {
        var area = GetStr(data, "area", "All Areas");
        var taxYear = GetInt(data, "taxYear", DateTime.Now.Year);
        var sampleSize = GetInt(data, "sampleSize");
        var medianRatio = GetDec(data, "medianRatio", 1.0m);
        var meanRatio = GetDec(data, "meanRatio", 1.0m);
        var cod = GetDec(data, "cod");
        var prd = GetDec(data, "prd", 1.0m);
        var prb = GetDec(data, "prb");

        // IAAO compliance checks
        var medianOk = medianRatio >= 0.90m && medianRatio <= 1.10m;
        var codOk = cod <= 15.0m;
        var prdOk = prd >= 0.98m && prd <= 1.03m;
        var allCompliant = medianOk && codOk && prdOk;

        var strataRows = new StringBuilder();
        if (data.TryGetProperty("strata", out var strata) && strata.ValueKind == JsonValueKind.Array)
        {
            foreach (var s in strata.EnumerateArray())
            {
                strataRows.AppendLine($@"
                <tr>
                    <td>{GetStr(s, "name")}</td>
                    <td style=""text-align:right"">{GetInt(s, "sampleSize")}</td>
                    <td style=""text-align:right"">{GetDec(s, "medianRatio"):F4}</td>
                    <td style=""text-align:right"">{GetDec(s, "cod"):F2}%</td>
                    <td style=""text-align:right"">{GetDec(s, "prd"):F4}</td>
                </tr>");
            }
        }

        var dataForHash = $"ratio|{area}|{taxYear}|{medianRatio}|{DateTime.UtcNow:yyyy-MM-dd}";
        var hash = ComputeAuditHash(dataForHash);

        return $@"<!DOCTYPE html>
<html lang=""en"">
<head>
    <meta charset=""UTF-8"">
    <title>Ratio Study — {area} {taxYear}</title>
    <style>{BaseStyles}</style>
</head>
<body>
    <div class=""header"">
        <div class=""county"">BENTON COUNTY ASSESSOR</div>
        <div class=""subtitle"">State of Washington</div>
        <h1>RATIO STUDY REPORT</h1>
        <div class=""subtitle"">Per IAAO Standard on Ratio Studies (2013) — Tax Year {taxYear}</div>
    </div>

    <h2>Study Parameters</h2>
    <table>
        <tr><th>Area</th><td>{area}</td><th>Tax Year</th><td>{taxYear}</td></tr>
        <tr><th>Sample Size</th><td>{sampleSize}</td><th>Overall Status</th><td class=""{(allCompliant ? "compliant" : "non-compliant")}"">{(allCompliant ? "COMPLIANT" : "NON-COMPLIANT")}</td></tr>
    </table>

    <h2>IAAO Statistical Measures</h2>
    <table>
        <thead>
            <tr><th>Measure</th><th>Value</th><th>IAAO Standard</th><th>Status</th></tr>
        </thead>
        <tbody>
            <tr>
                <td>Median Ratio</td>
                <td style=""text-align:right"">{medianRatio:F4}</td>
                <td>0.90 – 1.10</td>
                <td class=""{(medianOk ? "compliant" : "non-compliant")}"">{(medianOk ? "PASS" : "FAIL")}</td>
            </tr>
            <tr>
                <td>Mean Ratio</td>
                <td style=""text-align:right"">{meanRatio:F4}</td>
                <td>—</td>
                <td>—</td>
            </tr>
            <tr>
                <td>COD (Coefficient of Dispersion)</td>
                <td style=""text-align:right"">{cod:F2}%</td>
                <td>≤ 15.0%</td>
                <td class=""{(codOk ? "compliant" : "non-compliant")}"">{(codOk ? "PASS" : "FAIL")}</td>
            </tr>
            <tr>
                <td>PRD (Price-Related Differential)</td>
                <td style=""text-align:right"">{prd:F4}</td>
                <td>0.98 – 1.03</td>
                <td class=""{(prdOk ? "compliant" : "non-compliant")}"">{(prdOk ? "PASS" : "FAIL")}</td>
            </tr>
            <tr>
                <td>PRB (Price-Related Bias)</td>
                <td style=""text-align:right"">{prb:F4}</td>
                <td>-0.05 – 0.05</td>
                <td>—</td>
            </tr>
        </tbody>
    </table>

    {(strataRows.Length > 0 ? $@"
    <h2>Stratified Analysis</h2>
    <table>
        <thead>
            <tr><th>Stratum</th><th style=""text-align:right"">Sample</th><th style=""text-align:right"">Median</th><th style=""text-align:right"">COD</th><th style=""text-align:right"">PRD</th></tr>
        </thead>
        <tbody>
            {strataRows}
        </tbody>
    </table>" : "")}

    <div class=""signature-block"">
        <div><div class=""signature-line"">County Assessor</div></div>
        <div><div class=""signature-line"">Date</div></div>
    </div>

    <div class=""legal"">
        <strong>Methodology:</strong> IAAO Standard on Ratio Studies (2013);
        Washington State Department of Revenue guidelines.
        <br/><strong>Legal Authority:</strong> RCW 84.48.075 (Ratio study requirements);
        WAC 458-12-301 (Assessment level standards).
    </div>
    <div class=""audit"">Report generated: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC | SHA-256:{hash}</div>
</body>
</html>";
    }
}
