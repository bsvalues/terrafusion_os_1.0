// TerraFusion OS - Generic Email Service Interface
// Government OS Engineering - FISMA-HIGH Compliant Email Abstraction

namespace TerraFusion.AI.Services
{
    /// <summary>
    /// Generic email service interface for sending notifications.
    /// Wraps SMTP configuration and provides a simple send API.
    /// </summary>
    public interface IEmailService
    {
        /// <summary>
        /// Send an email to one or more recipients (comma-separated).
        /// </summary>
        Task SendEmailAsync(string recipients, string subject, string body, bool isHtml = false);

        /// <summary>
        /// Returns true when SMTP host and username are configured.
        /// </summary>
        bool IsConfigured { get; }
    }
}
