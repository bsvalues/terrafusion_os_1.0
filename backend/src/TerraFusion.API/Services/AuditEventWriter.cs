using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Auth;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Interfaces;
using Task = System.Threading.Tasks.Task; // disambiguate from TerraFusion.Core.Entities.Task

namespace TerraFusion.API.Services;

/// <summary>
/// WO-AU2-3 — writes domain <see cref="AuditEvent"/> rows: the per-parcel trail
/// feed read by <c>/api/audit/trail</c> and <c>/api/audit/search</c>. Actor and
/// county are resolved from the request user context. The write is
/// self-contained and never throws — audit emission must not break the domain
/// action that triggered it.
/// </summary>
public interface IAuditEventWriter
{
    Task WriteAsync(
        string entity,
        string entityId,
        string action,
        AuditEventType type,
        string? detailsJson = null,
        CancellationToken cancellationToken = default);
}

public sealed class AuditEventWriter : IAuditEventWriter
{
    private const string SystemActor = "system";

    private readonly ITerraFusionDbContext _db;
    private readonly IRequestUserContextAccessor _userContext;
    private readonly ILogger<AuditEventWriter> _logger;

    public AuditEventWriter(
        ITerraFusionDbContext db,
        IRequestUserContextAccessor userContext,
        ILogger<AuditEventWriter> logger)
    {
        _db = db;
        _userContext = userContext;
        _logger = logger;
    }

    public async Task WriteAsync(
        string entity,
        string entityId,
        string action,
        AuditEventType type,
        string? detailsJson = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var ctx = _userContext.Current;
            var actor = ctx.IsAuthenticated && !string.IsNullOrWhiteSpace(ctx.UserId)
                ? ctx.UserId!
                : SystemActor;
            Guid? countyId = Guid.TryParse(ctx.CountyId, out var parsed) ? parsed : null;

            _db.AuditEvents.Add(new AuditEvent
            {
                Id = Guid.NewGuid().ToString(),
                Type = type,
                Entity = entity,
                EntityId = entityId,
                Action = action,
                UserId = actor,
                DetailsJson = detailsJson,
                Timestamp = DateTime.UtcNow,
                CountyId = countyId,
                // IpAddress/UserAgent/SessionId keep their non-null entity defaults ("").
            });

            await _db.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            // Audit emission must never break the triggering domain action.
            _logger.LogError(ex,
                "Failed to write AuditEvent entity={Entity} entityId={EntityId} action={Action}",
                entity, entityId, action);
        }
    }
}
