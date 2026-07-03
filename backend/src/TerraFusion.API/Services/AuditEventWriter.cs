using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
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
            // WO-AUDIT-COUNTY-FILTER-001: the request context's CountyId may be a countyCode
            // (the accessor falls back to it), so resolve non-GUID values to the real county
            // GUID — otherwise the row is written county-unattributed and the county-isolated
            // trail/search can never surface it.
            Guid? countyId = await ResolveCountyIdAsync(ctx.CountyId, cancellationToken);

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

    /// <summary>
    /// Resolves the request's county claim (a GUID, or a countyCode/name/FIPS fallback) to
    /// the canonical county GUID. Returns null when absent or unresolvable.
    /// </summary>
    private async Task<Guid?> ResolveCountyIdAsync(string? countyIdOrCode, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(countyIdOrCode)) return null;
        if (Guid.TryParse(countyIdOrCode, out var direct)) return direct;

        var code = countyIdOrCode.Trim();
        var fipsPadded = code.All(char.IsDigit) ? code.PadLeft(3, '0') : code;

        var match = await _db.Counties
            .AsNoTracking()
            .Where(c => c.Name == code
                || (c.FipsCode != null && (c.FipsCode == code || c.FipsCode == fipsPadded)))
            .Select(c => (Guid?)c.Id)
            .FirstOrDefaultAsync(ct);

        return match;
    }
}
