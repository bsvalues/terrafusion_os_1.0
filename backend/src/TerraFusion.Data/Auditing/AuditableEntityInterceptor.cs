using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using TerraFusion.Core.Auth;
using TerraFusion.Core.Entities;

namespace TerraFusion.Data.Auditing;

/// <summary>
/// WO-AU2-1 — the AuditableEntityInterceptor referenced by the WS-3
/// <see cref="IAuditableEntity"/> entities (CapRateSet, CostFactorSet,
/// DepreciationSchedule, LandScheduleSet, ParcelValuation). Stamps the audit
/// FIELDS only:
///   - Added:    CreatedAt/By + UpdatedAt/By = now / current actor
///   - Modified: UpdatedAt/By = now / current actor (Created* preserved)
///
/// Actor is sourced from <see cref="IRequestUserContextAccessor"/>; it falls
/// back to "system" when there is no authenticated request user (background /
/// non-request saves, or if the accessor is unavailable).
///
/// This does NOT emit AuditEvents rows — domain audit-event emission is AU2-3.
/// Wired only to the primary request-pipeline DbContext registration, so
/// CLI/ETL/bulk hosts do not run it (they build their own DbContext scopes).
/// </summary>
public sealed class AuditableEntityInterceptor : SaveChangesInterceptor
{
    private const string SystemActor = "system";

    private readonly IRequestUserContextAccessor _userContext;

    public AuditableEntityInterceptor(IRequestUserContextAccessor userContext)
        => _userContext = userContext;

    public override InterceptionResult<int> SavingChanges(
        DbContextEventData eventData, InterceptionResult<int> result)
    {
        Stamp(eventData.Context);
        return base.SavingChanges(eventData, result);
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        Stamp(eventData.Context);
        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    /// <summary>Stamps tracked <see cref="IAuditableEntity"/> entries. Public for unit testing.</summary>
    public void Stamp(DbContext? context)
    {
        if (context is null) return;

        var actor = ResolveActor();
        var now = DateTime.UtcNow;

        foreach (var entry in context.ChangeTracker.Entries<IAuditableEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = now;
                    entry.Entity.CreatedBy = actor;
                    entry.Entity.UpdatedAt = now;
                    entry.Entity.UpdatedBy = actor;
                    break;

                case EntityState.Modified:
                    // Preserve original Created*; refresh Updated* only.
                    entry.Entity.UpdatedAt = now;
                    entry.Entity.UpdatedBy = actor;
                    break;
            }
        }
    }

    private string ResolveActor()
    {
        try
        {
            var ctx = _userContext.Current;
            return ctx.IsAuthenticated && !string.IsNullOrWhiteSpace(ctx.UserId)
                ? ctx.UserId!
                : SystemActor;
        }
        catch
        {
            // Never let audit stamping break a save.
            return SystemActor;
        }
    }
}
