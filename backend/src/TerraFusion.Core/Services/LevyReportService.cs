// LEV-027 — Levy Report Service
// Owner Suite: TerraDais (workflow/state management for assessment operations)

using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace TerraFusion.Core.Services
{
    /// <summary>
    /// Report generation service for levy administration.
    /// Supports multiple templates, filtering, and output formats
    /// (PDF, Excel, CSV) for WA county assessor reporting needs.
    /// </summary>
    public class LevyReportService
    {
        /// <summary>Available report templates.</summary>
        public static readonly Dictionary<string, string> Templates = new()
        {
            ["LevyCertification"] = "Annual levy certification summary by district",
            ["RateComparison"] = "Year-over-year rate comparison across districts",
            ["TaxCodeSummary"] = "Tax code composition and aggregate rates",
            ["DistrictDetail"] = "Individual district detail with history",
            ["ComplianceSummary"] = "Statutory compliance status for all districts",
            ["RevenueProjection"] = "Projected revenue by district and tax code",
            ["ExemptionImpact"] = "Impact of exemptions on levy revenue",
            ["BankedCapacity"] = "Banked capacity status by district"
        };

        /// <summary>
        /// Generate a report using the specified template.
        /// </summary>
        /// <param name="templateKey">Key from <see cref="Templates"/>.</param>
        /// <param name="filters">Filters to narrow report scope.</param>
        /// <param name="format">Output format: PDF, Excel, or CSV.</param>
        /// <returns>Generated report metadata and content reference.</returns>
        public Task<ReportOutput> GenerateReportAsync(
            string templateKey,
            ReportFilters filters,
            ReportFormat format = ReportFormat.Pdf)
        {
            if (!Templates.ContainsKey(templateKey))
                throw new ArgumentException($"Unknown template: {templateKey}");

            // Stub — production impl renders via report engine
            var output = new ReportOutput
            {
                ReportId = Guid.NewGuid().ToString("N"),
                TemplateName = templateKey,
                Format = format,
                Title = Templates[templateKey],
                Filters = filters,
                PageCount = 0,
                GeneratedAt = DateTime.UtcNow,
                ContentBytes = Array.Empty<byte>()
            };
            return Task.FromResult(output);
        }

        /// <summary>
        /// List all available report templates.
        /// </summary>
        public Task<List<ReportTemplateInfo>> ListTemplatesAsync()
        {
            var list = new List<ReportTemplateInfo>();
            foreach (var kv in Templates)
            {
                list.Add(new ReportTemplateInfo
                {
                    Key = kv.Key,
                    Description = kv.Value,
                    SupportedFormats = new[] { ReportFormat.Pdf, ReportFormat.Excel, ReportFormat.Csv }
                });
            }
            return Task.FromResult(list);
        }
    }

    /// <summary>Output format for reports.</summary>
    public enum ReportFormat
    {
        Pdf,
        Excel,
        Csv
    }

    /// <summary>Filters to scope a report.</summary>
    public class ReportFilters
    {
        public int? CountyId { get; set; }
        public int? TaxYear { get; set; }
        public List<int> DistrictIds { get; set; } = new();
        public List<string> TaxCodes { get; set; } = new();
        public string? DistrictType { get; set; }
    }

    /// <summary>Generated report output with metadata.</summary>
    public class ReportOutput
    {
        public string ReportId { get; set; } = string.Empty;
        public string TemplateName { get; set; } = string.Empty;
        public ReportFormat Format { get; set; }
        public string Title { get; set; } = string.Empty;
        public ReportFilters? Filters { get; set; }
        public int PageCount { get; set; }
        public DateTime GeneratedAt { get; set; }
        /// <summary>Raw content bytes (PDF/Excel) or UTF-8 CSV.</summary>
        public byte[] ContentBytes { get; set; } = Array.Empty<byte>();
    }

    /// <summary>Metadata about a report template.</summary>
    public class ReportTemplateInfo
    {
        public string Key { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public ReportFormat[] SupportedFormats { get; set; } = Array.Empty<ReportFormat>();
    }
}
