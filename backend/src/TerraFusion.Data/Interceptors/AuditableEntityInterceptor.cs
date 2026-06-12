using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Diagnostics;
using TerraFusion.Core.Auth;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Time;

namespace TerraFusion.Data.Interceptors;

/// <summary>
/// WS-3 / AU-2 audit-stamping interceptor. The single audit path for the platform:
///
///  - Stamps CreatedAt/CreatedBy + UpdatedAt/UpdatedBy on <see cref="IAuditableEntity"/>
///    writes from the current request user (system fallback when unauthenticated).
///  - On update, CreatedAt/CreatedBy are tamper-proof: original values are restored and
///    marked unmodified so a caller cannot rewrite creation provenance.
///  - Emits exactly one <see cref="AuditLog"/> row per auditable insert/update/delete,
///    capturing entity name, key, action, user, UTC and the request county.
///  - Never touches domain columns (incl. CountyId / sovereign-county isolation).
///
/// Wired on the DbContext (not per-call) so no write path can bypass it. Honors
/// <see cref="TerraFusionDbContext.SuppressAuditLogging"/>: when set (bulk sync drains)
/// per-row audit emission is skipped while field stamping still applies.
/// </summary>
public sealed class AuditableEntityInterceptor : SaveChangesInterceptor
{
    public const string Source = "AuditableEntityInterceptor";
    private const string SystemUser = "system";

    private readonly IClock _clock;
    private readonly IRequestUserContextAccessor _users;
    private readonly bool _stampFields;
    private readonly bool _emitAuditRows;

    public AuditableEntityInterceptor(
        IClock clock,
        IRequestUserContextAccessor users,
        bool stampFields = true,
        bool emitAuditRows = true)
    {
        _clock = clock;
        _users = users;
        _stampFields = stampFields;
        _emitAuditRows = emitAuditRows;
    }

    public override InterceptionResult<int> SavingChanges(
        DbContextEventData eventData, InterceptionResult<int> result)
    {
        Stamp(eventData.Context);
        return base.SavingChanges(eventData, result);
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData, InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        Stamp(eventData.Context);
        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private void Stamp(DbContext? context)
    {
        if (context is null)
            return;

        var now = _clock.UtcNow;
        var current = _users.Current;
        var user = current.IsAuthenticated && !string.IsNullOrWhiteSpace(current.UserId)
            ? current.UserId!
            : SystemUser;
        var county = current.CountyId;

        // Bulk drains set SuppressAuditLogging to skip per-row audit volume; field
        // stamping stays on (cheap, and provenance correctness still matters).
        var emitAudit = _emitAuditRows
            && context is not TerraFusionDbContext { SuppressAuditLogging: true };

        var auditRows = new List<AuditLog>();

        foreach (var entry in context.ChangeTracker.Entries<IAuditableEntity>().ToList())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    if (_stampFields)
                    {
                        entry.Entity.CreatedAt = now;
                        entry.Entity.CreatedBy = user;
                        entry.Entity.UpdatedAt = now;
                        entry.Entity.UpdatedBy = user;
                    }
                    break;

                case EntityState.Modified:
                    if (_stampFields)
                    {
                        entry.Entity.UpdatedAt = now;
                        entry.Entity.UpdatedBy = user;
                        // CreatedAt/By are tamper-proof: restore original + mark unmodified
                        // so the value is unchanged regardless of provider write semantics.
                        var createdAt = entry.Property(nameof(IAuditableEntity.CreatedAt));
                        createdAt.CurrentValue = createdAt.OriginalValue;
                        createdAt.IsModified = false;

                        var createdBy = entry.Property(nameof(IAuditableEntity.CreatedBy));
                        createdBy.CurrentValue = createdBy.OriginalValue;
                        createdBy.IsModified = false;
                    }
                    break;

                case EntityState.Deleted:
                    break; // audit only; nothing to stamp

                default:
                    continue; // Unchanged / Detached
            }

            if (emitAudit)
                auditRows.Add(BuildAuditRow(entry, now, user, county));
        }

        if (auditRows.Count > 0)
            context.Set<AuditLog>().AddRange(auditRows);
    }

    private static AuditLog BuildAuditRow(
        EntityEntry<IAuditableEntity> entry, DateTime now, string user, string? county)
    {
        var entityName = entry.Entity.GetType().Name;

        var keyValues = entry.Metadata.FindPrimaryKey()?.Properties
            .Select(p => entry.Property(p.Name).CurrentValue?.ToString());
        var key = keyValues is null ? null : string.Join(",", keyValues);

        var payload = JsonSerializer.Serialize(new
        {
            entity = entityName,
            key,
            action = entry.State.ToString(),
            county,
            user,
        });

        return new AuditLog
        {
            Id = Guid.NewGuid(),
            Type = $"{entityName}_{entry.State}",
            Data = payload,
            Timestamp = now,
            UserId = user,
            Source = Source,
        };
    }
}
