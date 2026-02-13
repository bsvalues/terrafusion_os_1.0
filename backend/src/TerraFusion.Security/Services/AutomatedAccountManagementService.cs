/*
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS - AUTOMATED ACCOUNT MANAGEMENT SERVICE
 * FISMA-HIGH AC-2(4) - Automated Account Management Actions
 * NIST 800-53 Compliance: Automated account disable/session termination
 * ═══════════════════════════════════════════════════════════════
 */

using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Data;
using TerraFusion.Core.Entities;

namespace TerraFusion.Security.Services;

/// <summary>
/// Automated Account Management Service implementing NIST 800-53 AC-2(4)
///
/// FISMA-HIGH Requirements:
/// - Automatically disable accounts after 90 days of inactivity
/// - Terminate sessions after 30 minutes of inactivity
/// - Log all automated account management actions
/// - Support emergency account reactivation with audit trail
///
/// Execution Schedule:
/// - Runs every 1 hour to check for inactive accounts/sessions
/// - Compliance check interval: 3600 seconds (1 hour)
/// </summary>
public class AutomatedAccountManagementService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<AutomatedAccountManagementService> _logger;
    private readonly IConfiguration _configuration;
    private readonly TimeSpan _checkInterval = TimeSpan.FromHours(1);
    private readonly TimeSpan _inactivityThreshold;
    private readonly TimeSpan _sessionTimeout;

    public AutomatedAccountManagementService(
        IServiceProvider serviceProvider,
        ILogger<AutomatedAccountManagementService> logger,
        IConfiguration configuration)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _configuration = configuration;

        // NIST 800-53 AC-2(4) - Configurable thresholds with secure defaults
        _inactivityThreshold = TimeSpan.FromDays(
            configuration.GetValue<int>("Security:InactivityThresholdDays", 90));
        _sessionTimeout = TimeSpan.FromMinutes(
            configuration.GetValue<int>("Security:SessionTimeoutMinutes", 30));

        _logger.LogInformation(
            "[AC-2(4)] Automated Account Management Service initialized. " +
            "Inactivity threshold: {InactivityDays} days, Session timeout: {SessionMinutes} minutes",
            _inactivityThreshold.TotalDays,
            _sessionTimeout.TotalMinutes);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("[AC-2(4)] Starting Automated Account Management background service");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessAutomatedAccountManagementAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[AC-2(4)] Error in Automated Account Management cycle");
            }

            await Task.Delay(_checkInterval, stoppingToken);
        }
    }

    private async Task ProcessAutomatedAccountManagementAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();

        _logger.LogInformation("[AC-2(4)] Running automated account management check...");

        var disabledCount = await DisableInactiveAccountsAsync(dbContext, cancellationToken);
        var terminatedSessions = await TerminateInactiveSessionsAsync(dbContext, cancellationToken);

        _logger.LogInformation(
            "[AC-2(4)] Automated account management complete. " +
            "Accounts disabled: {DisabledCount}, Sessions terminated: {TerminatedCount}",
            disabledCount,
            terminatedSessions);
    }

    /// <summary>
    /// Disable government user accounts that have been inactive for 90+ days
    /// Implements NIST 800-53 AC-2(4) automated account management
    /// </summary>
    private async Task<int> DisableInactiveAccountsAsync(
        TerraFusionDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var inactivityCutoff = DateTime.UtcNow - _inactivityThreshold;
        var disabledCount = 0;

        // Find active accounts with last login older than threshold
        var inactiveAccounts = await dbContext.GovernmentUsers
            .Where(u => u.IsActive &&
                        u.LastLoginAt < inactivityCutoff)
            .ToListAsync(cancellationToken);

        foreach (var account in inactiveAccounts)
        {
            try
            {
                // Disable the account
                account.IsActive = false;

                // Create audit log entry
                var auditLog = new AuditLog
                {
                    Id = Guid.NewGuid(),
                    Type = "SECURITY:AUTOMATED_ACCOUNT_DISABLE",
                    Data = $"{{\"UserId\":\"{account.Id}\",\"Email\":\"{account.Email}\"," +
                           $"\"LastLogin\":\"{account.LastLoginAt:yyyy-MM-dd HH:mm:ss}\"," +
                           $"\"InactiveDays\":{(DateTime.UtcNow - account.LastLoginAt).TotalDays:F0}," +
                           $"\"Reason\":\"AC-2(4) - 90 day inactivity threshold exceeded\"}}",
                    Timestamp = DateTime.UtcNow,
                    UserId = "SYSTEM",
                    UserEmail = "automated-account-management@terrafusion.gov",
                    Severity = "Warning",
                    Source = "AutomatedAccountManagementService"
                };

                dbContext.AuditLogs.Add(auditLog);
                disabledCount++;

                _logger.LogWarning(
                    "[AC-2(4)] Disabled inactive account: {Email} (User: {UserId}, " +
                    "Last login: {LastLogin}, Inactive for {Days} days)",
                    account.Email,
                    account.Id,
                    account.LastLoginAt,
                    (DateTime.UtcNow - account.LastLoginAt).TotalDays);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "[AC-2(4)] Failed to disable inactive account: {UserId}", account.Id);
            }
        }

        if (disabledCount > 0)
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        return disabledCount;
    }

    /// <summary>
    /// Terminate user sessions that have been inactive for 30+ minutes
    /// Implements NIST 800-53 AC-12 session termination
    /// </summary>
    private async Task<int> TerminateInactiveSessionsAsync(
        TerraFusionDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var sessionCutoff = DateTime.UtcNow - _sessionTimeout;
        var terminatedCount = 0;

        // Find active sessions with last activity older than timeout
        var inactiveSessions = await dbContext.UserSessions
            .Where(s => s.IsActive &&
                        s.LastActivityAt.HasValue &&
                        s.LastActivityAt.Value < sessionCutoff)
            .ToListAsync(cancellationToken);

        foreach (var session in inactiveSessions)
        {
            try
            {
                // Terminate the session
                session.IsActive = false;

                // Create audit log entry
                var auditLog = new AuditLog
                {
                    Id = Guid.NewGuid(),
                    Type = "SECURITY:AUTOMATED_SESSION_TERMINATION",
                    Data = $"{{\"SessionId\":\"{session.Id}\",\"UserId\":\"{session.UserId}\"," +
                           $"\"LastActivity\":\"{session.LastActivityAt:yyyy-MM-dd HH:mm:ss}\"," +
                           $"\"InactiveMinutes\":{(DateTime.UtcNow - session.LastActivityAt.Value).TotalMinutes:F0}," +
                           $"\"Reason\":\"AC-12 - Session timeout threshold exceeded\"}}",
                    Timestamp = DateTime.UtcNow,
                    UserId = session.UserId.ToString(),
                    IpAddress = session.IpAddress,
                    UserAgent = session.UserAgent,
                    Severity = "Info",
                    Source = "AutomatedAccountManagementService"
                };

                dbContext.AuditLogs.Add(auditLog);
                terminatedCount++;

                _logger.LogInformation(
                    "[AC-12] Terminated inactive session: {SessionId} (User: {UserId}, " +
                    "Last activity: {LastActivity}, Inactive for {Minutes} minutes)",
                    session.Id,
                    session.UserId,
                    session.LastActivityAt,
                    (DateTime.UtcNow - session.LastActivityAt.Value).TotalMinutes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "[AC-12] Failed to terminate inactive session: {SessionId}", session.Id);
            }
        }

        if (terminatedCount > 0)
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        return terminatedCount;
    }

    /// <summary>
    /// Reactivate a disabled account with audit trail (emergency access)
    /// </summary>
    public async Task<bool> ReactivateAccountAsync(
        Guid userId,
        string reactivatedBy,
        string reason)
    {
        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();

        var user = await dbContext.GovernmentUsers.FindAsync(userId);
        if (user == null) return false;

        user.IsActive = true;

        // Create audit log for reactivation
        var auditLog = new AuditLog
        {
            Id = Guid.NewGuid(),
            Type = "SECURITY:MANUAL_ACCOUNT_REACTIVATION",
            Data = $"{{\"UserId\":\"{userId}\",\"ReactivatedBy\":\"{reactivatedBy}\"," +
                   $"\"Reason\":\"{reason}\"}}",
            Timestamp = DateTime.UtcNow,
            UserId = reactivatedBy,
            Severity = "Warning",
            Source = "AutomatedAccountManagementService"
        };

        dbContext.AuditLogs.Add(auditLog);
        await dbContext.SaveChangesAsync();

        _logger.LogWarning(
            "[AC-2(4)] Account manually reactivated: {UserId} by {ReactivatedBy}. Reason: {Reason}",
            userId, reactivatedBy, reason);

        return true;
    }
}
