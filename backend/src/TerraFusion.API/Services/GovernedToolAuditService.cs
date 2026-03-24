using System.Text.Json;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.API.Services;

/// <summary>
/// FISMA-compliant audit logging for governed Dais tool invocations.
/// Writes structured audit records to the AuditLogs DbSet for every
/// critical tool invocation (appeals, exemptions, certifications, queue ops).
/// </summary>
public interface IGovernedToolAuditService
{
    System.Threading.Tasks.Task LogInvocationAsync(string toolName, string parcelId, string userId, string status, CancellationToken ct);
}

public class GovernedToolAuditService : IGovernedToolAuditService
{
    private readonly ITerraFusionDbContext _db;
    private readonly ILogger<GovernedToolAuditService> _logger;

    public GovernedToolAuditService(ITerraFusionDbContext db, ILogger<GovernedToolAuditService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async System.Threading.Tasks.Task LogInvocationAsync(string toolName, string parcelId, string userId, string status, CancellationToken ct)
    {
        var auditEntry = new AuditLog
        {
            Id = Guid.NewGuid(),
            Type = $"DAIS_TOOL:{toolName}",
            Data = JsonSerializer.Serialize(new
            {
                toolName,
                parcelId,
                status,
                invokedAt = DateTime.UtcNow,
            }),
            Timestamp = DateTime.UtcNow,
            UserId = userId,
            Source = "GovernedToolAuditService",
        };

        _db.AuditLogs.Add(auditEntry);

        try
        {
            await _db.SaveChangesAsync(ct);
            _logger.LogInformation(
                "Audit: tool={ToolName} parcel={ParcelId} user={UserId} status={Status}",
                toolName, parcelId, userId, status);
        }
        catch (Exception ex)
        {
            // Audit logging must not break the request pipeline.
            // Log the failure and continue — the primary operation already succeeded.
            _logger.LogError(ex,
                "Failed to persist audit log for tool={ToolName} parcel={ParcelId}",
                toolName, parcelId);
        }
    }
}
