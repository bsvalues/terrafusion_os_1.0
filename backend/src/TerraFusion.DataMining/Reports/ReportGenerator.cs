// TMR-111: Report Generator - HTML/CSV/Excel report generation
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace TerraFusion.DataMining.Reports
{
    /// <summary>
    /// Supported report output formats.
    /// </summary>
    public enum ReportFormat
    {
        Html,
        Csv,
        Excel
    }

    /// <summary>
    /// Metadata for a generated report.
    /// </summary>
    public class ReportResult
    {
        public string Title { get; set; } = string.Empty;
        public ReportFormat Format { get; set; }
        public byte[] Content { get; set; } = Array.Empty<byte>();
        public string FileName { get; set; } = string.Empty;
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// Generates reports in HTML, CSV, and Excel formats from tabular data.
    /// </summary>
    public class ReportGenerator
    {
        private readonly ILogger<ReportGenerator> _logger;

        public ReportGenerator(ILogger<ReportGenerator> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// Generates a report from rows of key-value data.
        /// </summary>
        public Task<ReportResult> GenerateAsync(
            string title,
            IReadOnlyList<Dictionary<string, string>> rows,
            ReportFormat format)
        {
            _logger.LogInformation("Generating {Format} report: {Title} ({RowCount} rows)", format, title, rows.Count);

            var result = format switch
            {
                ReportFormat.Html => GenerateHtml(title, rows),
                ReportFormat.Csv => GenerateCsv(title, rows),
                ReportFormat.Excel => GenerateExcelStub(title, rows),
                _ => throw new ArgumentOutOfRangeException(nameof(format))
            };

            result.Title = title;
            result.Format = format;
            return Task.FromResult(result);
        }

        private static ReportResult GenerateHtml(string title, IReadOnlyList<Dictionary<string, string>> rows)
        {
            var sb = new StringBuilder();
            sb.AppendLine("<!DOCTYPE html><html><head><title>").Append(title).AppendLine("</title></head><body>");
            sb.Append("<h1>").Append(title).AppendLine("</h1>");

            if (rows.Count > 0)
            {
                var headers = rows[0].Keys.ToList();
                sb.AppendLine("<table border='1'><tr>");
                foreach (var h in headers) sb.Append("<th>").Append(h).Append("</th>");
                sb.AppendLine("</tr>");
                foreach (var row in rows)
                {
                    sb.Append("<tr>");
                    foreach (var h in headers) sb.Append("<td>").Append(row.GetValueOrDefault(h, "")).Append("</td>");
                    sb.AppendLine("</tr>");
                }
                sb.AppendLine("</table>");
            }

            sb.AppendLine("</body></html>");
            return new ReportResult
            {
                Content = Encoding.UTF8.GetBytes(sb.ToString()),
                FileName = $"{title.Replace(" ", "_")}_{DateTime.UtcNow:yyyyMMdd}.html"
            };
        }

        private static ReportResult GenerateCsv(string title, IReadOnlyList<Dictionary<string, string>> rows)
        {
            var sb = new StringBuilder();
            if (rows.Count > 0)
            {
                var headers = rows[0].Keys.ToList();
                sb.AppendLine(string.Join(",", headers));
                foreach (var row in rows)
                    sb.AppendLine(string.Join(",", headers.Select(h => $"\"{row.GetValueOrDefault(h, "")}\"")));
            }

            return new ReportResult
            {
                Content = Encoding.UTF8.GetBytes(sb.ToString()),
                FileName = $"{title.Replace(" ", "_")}_{DateTime.UtcNow:yyyyMMdd}.csv"
            };
        }

        private ReportResult GenerateExcelStub(string title, IReadOnlyList<Dictionary<string, string>> rows)
        {
            // Stub: In production, use a library like EPPlus or ClosedXML
            _logger.LogInformation("Excel generation is a stub; returning CSV content for {Title}", title);
            return GenerateCsv(title, rows);
        }
    }
}
