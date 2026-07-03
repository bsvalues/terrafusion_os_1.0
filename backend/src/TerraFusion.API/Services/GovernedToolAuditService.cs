using System.Text.Json;
using TerraFusion.Core.DTOs;
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
    private readonly IAuditEventWriter _auditEvents;
    private readonly ILogger<GovernedToolAuditService> _logger;

    public GovernedToolAuditService(
        ITerraFusionDbContext db,
        IAuditEventWriter auditEvents,
        ILogger<GovernedToolAuditService> logger)
    {
        _db = db;
        _auditEvents = auditEvents;
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

        // WO-AU2-3: also emit a per-parcel domain AuditEvents row so the Dais
        // audit trail (/api/audit/trail + /search) populates. Self-contained and
        // resilient (AuditEventWriter never throws).
        var (entity, type) = MapTool(toolName);
        await _auditEvents.WriteAsync(
            entity: entity,
            entityId: parcelId,
            action: toolName,
            type: type,
            detailsJson: JsonSerializer.Serialize(new { toolName, status }),
            cancellationToken: ct);
    }

    /// <summary>Maps a governed Dais tool name to the AuditEvent (Entity, Type) it represents.</summary>
    private static (string Entity, AuditEventType Type) MapTool(string toolName)
    {
        var t = (toolName ?? string.Empty).ToLowerInvariant();
        if (t.Contains("appeal") || t.Contains("boe") || t.Contains("hearing"))
            return ("Appeal", t.Contains("file") ? AuditEventType.Create : AuditEventType.Update);
        if (t.Contains("exempt"))
            return ("Exemption",
                t.Contains("create") ? AuditEventType.Create
                : t.Contains("eligibility") ? AuditEventType.View
                : AuditEventType.Update);
        if (t.Contains("certification"))
            return ("Certification", AuditEventType.Update);
        if (t.Contains("notice"))
            return ("Notice", AuditEventType.Create);
        if (t.Contains("queue"))
            return ("Queue", AuditEventType.Update);
        if (t.Contains("classify"))
            return ("Assessment", AuditEventType.Update);
        return ("Dais", AuditEventType.Update);
    }
}
