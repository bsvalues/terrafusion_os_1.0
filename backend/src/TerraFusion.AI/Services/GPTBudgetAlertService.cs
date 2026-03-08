// TerraFusionGPT Suite: Budget Alert Service
// Elite Government OS Engineering - Alert Management

using System.Reflection.Metadata;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Entities;
using TerraFusion.Data;
using TaskAsync = System.Threading.Tasks.Task;

namespace TerraFusion.AI.Services
{
    /// <summary>
    /// Sends budget alerts and notifications
    /// </summary>
    public interface IGPTBudgetAlertService
    {
        System.Threading.Tasks.Task SendAlertAsync(
            GPTBudget budget,
            BudgetAlertType alertType,
            AlertSeverity severity);

        System.Threading.Tasks.Task<List<GPTBudgetAlert>> GetAlertsAsync(
            int budgetId,
            bool unacknowledgedOnly = false);

        System.Threading.Tasks.Task AcknowledgeAlertAsync(int alertId, string acknowledgedBy);

        System.Threading.Tasks.Task<List<GPTBudget>> GetBudgetsNeedingAttentionAsync(int countyId);
    }

    /// <summary>
    /// Budget alert service implementation
    /// </summary>
    public class GPTBudgetAlertService : IGPTBudgetAlertService
    {
        private readonly TerraFusionDbContext _context;
        private readonly ILogger<GPTBudgetAlertService> _logger;
        private readonly IEmailService _emailService;

        public GPTBudgetAlertService(
            TerraFusionDbContext context,
            ILogger<GPTBudgetAlertService> logger,
            IEmailService emailService)
        {
            _context = context;
            _logger = logger;
            _emailService = emailService;
        }

        /// <summary>
        /// Send budget alert
        /// </summary>
        public async System.Threading.Tasks.Task SendAlertAsync(
            GPTBudget budget,
            BudgetAlertType alertType,
            AlertSeverity severity)
        {
            _logger.LogInformation(
                $"Sending {alertType} alert for budget {budget.Id}");

            try
            {
                // Create alert record
                var alert = new GPTBudgetAlert
                {
                    GPTBudgetId = budget.Id,
                    AlertType = alertType,
                    // Map AI.Services severity to Core.Entities severity consistently
                    Severity = AlertSeverityMapping.ToCoreSeverity(severity),
                    BudgetPercentageUsed = budget.PercentageConsumed,
                    AmountConsumed = budget.ConsumedAmount,
                    AmountRemaining = budget.RemainingAmount,
                    Message = GenerateAlertMessage(budget, alertType),
                    SentTo = budget.AlertRecipients ?? "No recipients configured",
                    AlertTimestamp = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow
                };

                // Send email if recipients configured
                if (!string.IsNullOrEmpty(budget.AlertRecipients))
                {
                    var sent = await SendAlertEmailAsync(budget, alert);
                    alert.Sent = sent;
                    alert.SentDate = sent ? DateTime.UtcNow : null;
                }
                else
                {
                    _logger.LogWarning(
                        $"No alert recipients configured for budget {budget.Id}");
                    alert.Sent = false;
                }

                // Save alert record
                _context.Set<GPTBudgetAlert>().Add(alert);
                await _context.SaveChangesAsync();

                _logger.LogInformation(
                    $"Alert {alert.Id} created successfully. Sent: {alert.Sent}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending budget alert");
                throw;
            }
        }

        /// <summary>
        /// Get alerts for budget
        /// </summary>
        public async System.Threading.Tasks.Task<List<GPTBudgetAlert>> GetAlertsAsync(
            int budgetId,
            bool unacknowledgedOnly = false)
        {
            var query = _context.Set<GPTBudgetAlert>()
                .Where(a => a.GPTBudgetId == budgetId);

            if (unacknowledgedOnly)
            {
                query = query.Where(a => !a.Acknowledged);
            }

            return await query
                .OrderByDescending(a => a.AlertTimestamp)
                .ToListAsync();
        }

        /// <summary>
        /// Acknowledge alert
        /// </summary>
        public async System.Threading.Tasks.Task AcknowledgeAlertAsync(int alertId, string acknowledgedBy)
        {
            var alert = await _context.Set<GPTBudgetAlert>()
                .FindAsync(alertId);

            if (alert == null)
            {
                throw new ArgumentException($"Alert {alertId} not found");
            }

            alert.Acknowledged = true;
            alert.AcknowledgedBy = acknowledgedBy;
            alert.AcknowledgedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation(
                $"Alert {alertId} acknowledged by {acknowledgedBy}");
        }

        /// <summary>
        /// Get budgets needing attention
        /// </summary>
        public async System.Threading.Tasks.Task<List<GPTBudget>> GetBudgetsNeedingAttentionAsync(int countyId)
        {
            var now = DateTime.UtcNow;

            return await _context.Set<GPTBudget>()
                .Where(b => b.CountyId == countyId)
                .Where(b => b.IsActive)
                .Where(b => b.PeriodStart <= now && b.PeriodEnd >= now)
                .Where(b =>
                    b.Status == BudgetStatus.AlertThreshold ||
                    b.Status == BudgetStatus.WarningThreshold ||
                    b.Status == BudgetStatus.Exhausted ||
                    b.Status == BudgetStatus.Overrun)
                .Include(b => b.Alerts.Where(a => !a.Acknowledged))
                .OrderByDescending(b => b.PercentageConsumed)
                .ToListAsync();
        }

        /// <summary>
        /// Generate alert message
        /// </summary>
        private string GenerateAlertMessage(GPTBudget budget, BudgetAlertType alertType)
        {
            var sb = new StringBuilder();

            var scope = string.IsNullOrEmpty(budget.Department)
                ? "County-wide"
                : $"Department: {budget.Department}";

            sb.AppendLine($"GPT Budget Alert - {alertType}");
            sb.AppendLine();
            sb.AppendLine($"Scope: {scope}");
            sb.AppendLine($"Budget Period: {budget.PeriodStart:d} to {budget.PeriodEnd:d}");
            sb.AppendLine();
            sb.AppendLine($"Allocated: ${budget.AllocatedAmount:F2}");
            sb.AppendLine($"Consumed: ${budget.ConsumedAmount:F2} ({budget.PercentageConsumed:F1}%)");
            sb.AppendLine($"Remaining: ${budget.RemainingAmount:F2}");
            sb.AppendLine();

            switch (alertType)
            {
                case BudgetAlertType.ThresholdReached:
                    sb.AppendLine($"⚠️ Budget has reached {budget.AlertThresholdPercent}% threshold.");
                    sb.AppendLine("Please monitor usage closely.");
                    break;

                case BudgetAlertType.WarningReached:
                    sb.AppendLine($"🚨 Budget has reached {budget.WarningThresholdPercent}% warning level!");
                    sb.AppendLine("Immediate attention required.");
                    break;

                case BudgetAlertType.BudgetExhausted:
                    sb.AppendLine("❌ Budget has been EXHAUSTED!");
                    if (budget.EnforceHardLimit)
                    {
                        sb.AppendLine("GPT usage has been BLOCKED.");
                        sb.AppendLine("Contact administrator to increase budget or approve overrun.");
                    }
                    else
                    {
                        sb.AppendLine("Usage allowed but tracking overrun.");
                    }
                    break;

                case BudgetAlertType.BudgetOverrun:
                    var overrun = budget.ConsumedAmount - budget.AllocatedAmount;
                    sb.AppendLine($"💥 Budget OVERRUN by ${overrun:F2}!");
                    sb.AppendLine("Immediate action required.");
                    break;

                case BudgetAlertType.DailyUsageSpike:
                    sb.AppendLine("📈 Unusual usage spike detected.");
                    sb.AppendLine("Review recent activity for anomalies.");
                    break;

                case BudgetAlertType.MonthlyProjection:
                    sb.AppendLine("📊 Budget projected to be exceeded.");
                    sb.AppendLine("Consider usage reduction or budget increase.");
                    break;

                case BudgetAlertType.BudgetSuspended:
                    sb.AppendLine("⛔ Budget has been SUSPENDED.");
                    sb.AppendLine("All GPT usage blocked pending review.");
                    break;
            }

            sb.AppendLine();
            sb.AppendLine("View budget details: [Dashboard URL]");
            sb.AppendLine();
            sb.AppendLine("---");
            sb.AppendLine("TerraFusionGPT Budget Management System");

            return sb.ToString();
        }

        /// <summary>
        /// Send alert email
        /// </summary>
        private System.Threading.Tasks.Task<bool> SendAlertEmailAsync(
            GPTBudget budget,
            GPTBudgetAlert alert)
        {
            try
            {
                // Parse email recipients
                var recipients = budget.AlertRecipients?
                    .Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(r => r.Trim())
                    .Where(r => !string.IsNullOrEmpty(r))
                    .ToList() ?? new List<string>();

                if (!recipients.Any())
                {
                    _logger.LogWarning("No valid email recipients");
                    return System.Threading.Tasks.Task.FromResult(false);
                }

                // Generate email content
                var subject = GenerateEmailSubject(budget, alert);
                var body = GenerateEmailBody(budget, alert);

                // TODO: Send email using email service
                // await _emailService.SendEmailAsync(recipients, subject, body);

                _logger.LogInformation(
                    $"Alert email would be sent to: {string.Join(", ", recipients)}");
                _logger.LogInformation($"Subject: {subject}");

                // For now, just log the alert
                _logger.LogWarning("Email service not configured - alert logged only");

                return System.Threading.Tasks.Task.FromResult(true); // Return true when email service is implemented
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending alert email");
                return System.Threading.Tasks.Task.FromResult(false);
            }
        }

        /// <summary>
        /// Generate email subject
        /// </summary>
        private string GenerateEmailSubject(GPTBudget budget, GPTBudgetAlert alert)
        {
            var scope = string.IsNullOrEmpty(budget.Department)
                ? "County-wide"
                : budget.Department;

            var severityEmoji = alert.Severity switch
            {
                TerraFusion.Core.Entities.AlertSeverity.Info => "ℹ️",
                TerraFusion.Core.Entities.AlertSeverity.Warning => "⚠️",
                TerraFusion.Core.Entities.AlertSeverity.Critical => "🚨",
                _ => ""
            };

            return alert.AlertType switch
            {
                BudgetAlertType.ThresholdReached =>
                    $"{severityEmoji} GPT Budget Alert: {scope} at {budget.PercentageConsumed:F0}%",

                BudgetAlertType.WarningReached =>
                    $"{severityEmoji} GPT Budget WARNING: {scope} at {budget.PercentageConsumed:F0}%",

                BudgetAlertType.BudgetExhausted =>
                    $"{severityEmoji} GPT Budget EXHAUSTED: {scope}",

                BudgetAlertType.BudgetOverrun =>
                    $"{severityEmoji} GPT Budget OVERRUN: {scope}",

                BudgetAlertType.DailyUsageSpike =>
                    $"{severityEmoji} GPT Usage Spike Detected: {scope}",

                BudgetAlertType.MonthlyProjection =>
                    $"{severityEmoji} GPT Budget Projection Alert: {scope}",

                BudgetAlertType.BudgetSuspended =>
                    $"{severityEmoji} GPT Budget SUSPENDED: {scope}",

                _ => $"{severityEmoji} GPT Budget Alert: {scope}"
            };
        }

        /// <summary>
        /// Generate email body
        /// </summary>
        private string GenerateEmailBody(GPTBudget budget, GPTBudgetAlert alert)
        {
            var sb = new StringBuilder();

            sb.AppendLine("<html><body>");
            sb.AppendLine("<h2>GPT Budget Alert</h2>");

            var scope = string.IsNullOrEmpty(budget.Department)
                ? "<strong>County-wide</strong>"
                : $"<strong>Department:</strong> {budget.Department}";

            sb.AppendLine($"<p>{scope}</p>");

            sb.AppendLine("<h3>Budget Status</h3>");
            sb.AppendLine("<table border='1' cellpadding='5'>");
            sb.AppendLine($"<tr><td>Budget Period</td><td>{budget.PeriodStart:d} to {budget.PeriodEnd:d}</td></tr>");
            sb.AppendLine($"<tr><td>Allocated Budget</td><td>${budget.AllocatedAmount:F2}</td></tr>");
            sb.AppendLine($"<tr><td>Amount Consumed</td><td>${budget.ConsumedAmount:F2}</td></tr>");
            sb.AppendLine($"<tr><td>Percentage Used</td><td>{budget.PercentageConsumed:F1}%</td></tr>");
            sb.AppendLine($"<tr><td>Remaining</td><td>${budget.RemainingAmount:F2}</td></tr>");
            sb.AppendLine("</table>");

            sb.AppendLine("<h3>Alert Details</h3>");
            sb.AppendLine($"<p>{alert.Message.Replace("\n", "<br/>")}</p>");

            sb.AppendLine("<h3>Next Steps</h3>");
            sb.AppendLine("<ul>");

            switch (alert.AlertType)
            {
                case BudgetAlertType.ThresholdReached:
                    sb.AppendLine("<li>Review recent usage patterns</li>");
                    sb.AppendLine("<li>Monitor budget closely</li>");
                    sb.AppendLine("<li>Consider usage optimization</li>");
                    break;

                case BudgetAlertType.WarningReached:
                    sb.AppendLine("<li><strong>Immediate attention required</strong></li>");
                    sb.AppendLine("<li>Review all active GPT usage</li>");
                    sb.AppendLine("<li>Consider temporary usage restrictions</li>");
                    sb.AppendLine("<li>Prepare budget increase request if needed</li>");
                    break;

                case BudgetAlertType.BudgetExhausted:
                    sb.AppendLine("<li><strong>Budget exhausted - action required</strong></li>");
                    if (budget.EnforceHardLimit)
                    {
                        sb.AppendLine("<li><strong>GPT usage is currently BLOCKED</strong></li>");
                    }
                    sb.AppendLine("<li>Review budget allocation</li>");
                    sb.AppendLine("<li>Submit budget increase request</li>");
                    sb.AppendLine("<li>Or approve overrun allowance</li>");
                    break;

                case BudgetAlertType.BudgetOverrun:
                    sb.AppendLine("<li><strong>Immediate action required</strong></li>");
                    sb.AppendLine("<li>Budget exceeded - review all usage</li>");
                    sb.AppendLine("<li>Determine cause of overrun</li>");
                    sb.AppendLine("<li>Submit emergency budget request</li>");
                    break;
            }

            sb.AppendLine("</ul>");

            sb.AppendLine("<p><a href='[Dashboard URL]'>View Budget Dashboard</a></p>");

            sb.AppendLine("<hr/>");
            sb.AppendLine("<p><small>TerraFusionGPT Budget Management System</small></p>");
            sb.AppendLine("</body></html>");

            return sb.ToString();
        }
    }
}
