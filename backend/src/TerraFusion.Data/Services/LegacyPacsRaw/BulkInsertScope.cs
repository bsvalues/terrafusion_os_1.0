using System;
using Microsoft.EntityFrameworkCore;

namespace TerraFusion.Data.Services.LegacyPacsRaw;

/// <summary>
/// SYNC-COMPLETE-2: scoped EF Core bulk-insert optimization.
///
/// <para>Disables <see cref="ChangeTracker.AutoDetectChangesEnabled"/>
/// for the duration of a streaming Add+SaveChanges loop, restoring
/// the previous value when disposed. Per the EF Core docs:
/// AutoDetectChanges runs a full graph scan on every Add() to find
/// modifications. With BatchSize=1000 and tracker accumulating across
/// batches (entities stay tracked in Unchanged state after SaveChanges),
/// the cost grows linearly with tracker size → effectively O(n²) over
/// the full landing run.</para>
///
/// <para>Validated empirically (perf-test/bulk-insert-synthetic):
/// 1.58× speedup at N=20k. Effect compounds at larger N.</para>
///
/// <para>Usage:
/// <code>
/// using var _ = BulkInsertScope.Begin(_db);
/// try
/// {
///     await foreach (var src in source.StreamAsync(ct))
///     {
///         _db.Set&lt;X&gt;().Add(...);
///         if (++pending >= BatchSize) { await _db.SaveChangesAsync(ct); pending = 0; }
///     }
/// }
/// catch { ... }
/// </code>
/// The <c>using</c> guarantees restoration on every exit path —
/// success, exception, or early return — without explicit
/// try/finally noise in each service.</para>
///
/// <para>Caveat: callers that rely on <c>AutoDetectChanges</c> firing
/// (e.g. modifying a tracked entity then calling SaveChanges
/// expecting the change to be detected) must call
/// <c>_db.ChangeTracker.DetectChanges()</c> explicitly while inside
/// the scope, or perform such modifications outside the scope.
/// Pure Add+SaveChanges loops (the bulk-landing pattern) don't need
/// this since Add already marks the entity Added.</para>
/// </summary>
internal static class BulkInsertScope
{
    public static IDisposable Begin(DbContext db)
    {
        ArgumentNullException.ThrowIfNull(db);
        var previous = db.ChangeTracker.AutoDetectChangesEnabled;
        db.ChangeTracker.AutoDetectChangesEnabled = false;
        return new Scope(db, previous);
    }

    private sealed class Scope : IDisposable
    {
        private readonly DbContext _db;
        private readonly bool _previous;
        private bool _disposed;

        public Scope(DbContext db, bool previous)
        {
            _db = db;
            _previous = previous;
        }

        public void Dispose()
        {
            if (_disposed) return;
            _disposed = true;
            _db.ChangeTracker.AutoDetectChangesEnabled = _previous;
        }
    }
}
