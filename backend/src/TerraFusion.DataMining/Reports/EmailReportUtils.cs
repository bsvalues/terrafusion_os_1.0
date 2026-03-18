// TMR-113: Email Report Utilities - Formatting and delivery helpers
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace TerraFusion.DataMining.Reports
{
    /// <summary>
    /// Configuration for email report delivery, read from IConfiguration.
    /// </summary>
    public class EmailReportConfig
    {
        public string FromAddress { get; set; } = string.Empty;
        public List<string> ToAddresses { get; set; } = new();
        public string SubjectPrefix { get; set; } = "[TerraFusion DataMining]";
    }

    /// <summary>
    /// Utilities for formatting and sending reports via email.
    /// SMTP credentials and configuration are read from IConfiguration only.
    /// </summary>
    public class EmailReportUtils
    {
        private readonly ILogger<EmailReportUtils> _logger;
        private readonly IConfiguration _configuration;

        public EmailReportUtils(ILogger<EmailReportUtils> logger, IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;
        }

        /// <summary>
        /// Loads email report configuration from IConfiguration.
        /// </summary>
        public EmailReportConfig GetConfig()
        {
            var config = new EmailReportConfig();
            _configuration.GetSection("EmailReports").Bind(config);
            return config;
        }

        /// <summary>
        /// Formats a report result into an email-ready HTML body.
        /// </summary>
        public string FormatReportAsEmailBody(ReportResult report)
        {
            var sb = new StringBuilder();
            sb.AppendLine("<html><body>");
            sb.Append("<h2>").Append(report.Title).AppendLine("</h2>");
            sb.Append("<p>Generated: ").Append(report.GeneratedAt.ToString("u")).AppendLine("</p>");
            sb.Append("<p>Format: ").Append(report.Format).AppendLine("</p>");
            sb.AppendLine("<p>Report is attached to this email.</p>");
            sb.AppendLine("</body></html>");
            return sb.ToString();
        }

        /// <summary>
        /// Stub: Sends a report via email using configured SMTP settings.
        /// </summary>
        public Task<bool> SendReportAsync(ReportResult report, IEnumerable<string>? recipients = null)
        {
            var config = GetConfig();
            var targets = recipients ?? config.ToAddresses;

            if (string.IsNullOrEmpty(config.FromAddress))
            {
                _logger.LogWarning("Email report not sent: FromAddress not configured");
                return Task.FromResult(false);
            }

            // Stub: In production, attach report.Content as a file and send via SMTP
            _logger.LogInformation("Email report '{Title}' queued for delivery to {Recipients}",
                report.Title, string.Join(", ", targets));
            return Task.FromResult(true);
        }

        /// <summary>
        /// Builds the email subject line with the configured prefix.
        /// </summary>
        public string BuildSubject(string reportTitle)
        {
            var config = GetConfig();
            return $"{config.SubjectPrefix} {reportTitle} - {DateTime.UtcNow:yyyy-MM-dd}";
        }
    }
}
