// TerraFusion OS - Generic Email Service
// Government OS Engineering - SMTP Email Delivery

using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace TerraFusion.AI.Services
{
    /// <summary>
    /// Simple SMTP email service. Uses the same Email:* configuration keys
    /// as CodexEmailNotificationService. When SMTP is not configured the
    /// service logs a warning and returns without throwing.
    /// </summary>
    public class EmailService : IEmailService
    {
        private readonly ILogger<EmailService> _logger;

        private readonly string _smtpHost;
        private readonly int _smtpPort;
        private readonly string _smtpUsername;
        private readonly string _smtpPassword;
        private readonly bool _enableSsl;
        private readonly string _fromEmail;
        private readonly string _fromName;

        public EmailService(
            IConfiguration configuration,
            ILogger<EmailService> logger)
        {
            _logger = logger;

            _smtpHost = configuration["Email:SmtpHost"] ?? "";
            _smtpPort = int.Parse(configuration["Email:SmtpPort"] ?? "587");
            _smtpUsername = configuration["Email:SmtpUsername"] ?? "";
            _smtpPassword = configuration["Email:SmtpPassword"] ?? "";
            _enableSsl = bool.Parse(configuration["Email:EnableSsl"] ?? "true");
            _fromEmail = configuration["Email:FromEmail"] ?? "noreply@terrafusion.gov";
            _fromName = configuration["Email:FromName"] ?? "TerraFusion OS";
        }

        /// <inheritdoc />
        public bool IsConfigured =>
            !string.IsNullOrWhiteSpace(_smtpHost) &&
            !string.IsNullOrWhiteSpace(_smtpUsername);

        /// <inheritdoc />
        public async Task SendEmailAsync(string recipients, string subject, string body, bool isHtml = false)
        {
            if (!IsConfigured)
            {
                _logger.LogWarning(
                    "Email service not configured (SmtpHost/SmtpUsername missing) - skipping send for subject: {Subject}",
                    subject);
                return;
            }

            if (string.IsNullOrWhiteSpace(recipients))
            {
                _logger.LogWarning("No recipients specified for email: {Subject}", subject);
                return;
            }

            using var smtpClient = new SmtpClient(_smtpHost, _smtpPort)
            {
                Credentials = new NetworkCredential(_smtpUsername, _smtpPassword),
                EnableSsl = _enableSsl,
                Timeout = 30000,
            };

            using var mailMessage = new MailMessage
            {
                From = new MailAddress(_fromEmail, _fromName),
                Subject = subject,
                Body = body,
                IsBodyHtml = isHtml,
            };

            foreach (var recipient in recipients.Split(',', StringSplitOptions.RemoveEmptyEntries))
            {
                var trimmed = recipient.Trim();
                if (!string.IsNullOrEmpty(trimmed))
                {
                    mailMessage.To.Add(trimmed);
                }
            }

            await smtpClient.SendMailAsync(mailMessage);

            _logger.LogInformation(
                "Email sent to {Recipients} with subject: {Subject}",
                recipients, subject);
        }
    }
}
