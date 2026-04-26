// backend/src/TerraFusion.API/Hubs/CountyStudyHub.cs
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Collections.Concurrent;
using TerraFusion.Core.Interfaces;
using TerraFusion.Core.Services;

namespace TerraFusion.API.Hubs;

/// <summary>
/// Real-time hub for TerraForge County Studio co-present sessions.
/// Two surfaces (county-studio, atlas-live-view) subscribe to the same Study_{StudyId} group.
///
/// Event channels:
///   A — Presence: instant, bidirectional (segment hover, select, parcel focus, viewport sync)
///   B — Projection: instant, Forge→Atlas (metric overlays, scenario deltas, warnings)
///   C — Selection: staged, Atlas→Forge (lasso geometry, parcel ids, neighborhood ids)
///   D — Commit: confirm-required, Forge writes only (create cohort, save scenario, promote)
///
/// Write-lane law: Atlas NEVER calls BroadcastCommit. All consequential writes go through Forge.
/// </summary>
public class CountyStudyHub : Hub
{
    // In-memory session state: studyId → concurrent set of connectionIds (byte value is unused sentinel)
    private static readonly ConcurrentDictionary<string, ConcurrentDictionary<string, byte>> _studySessions = new();

    private readonly ITerraFusionDbContext _db;
    private readonly ICountyResolver _countyResolver;

    public CountyStudyHub(ITerraFusionDbContext db, ICountyResolver countyResolver)
    {
        _db = db;
        _countyResolver = countyResolver;
    }

    private async Task<Guid?> ResolveConnectionCountyScopeAsync()
    {
        var countyToken = Context.GetHttpContext()?.Request.Query["countyId"].ToString();
        if (string.IsNullOrWhiteSpace(countyToken))
            return null;

        return await _countyResolver.TryResolveAsync(countyToken);
    }

    private async Task EnsureStudyAccessAsync(string studyId)
    {
        if (!Guid.TryParse(studyId, out var parsedStudyId))
            throw new HubException("Invalid study id.");

        var countyId = await ResolveConnectionCountyScopeAsync();
        if (!countyId.HasValue)
            throw new HubException("County scope required.");

        var allowed = await _db.CountyStudySessions.AsNoTracking()
            .AnyAsync(s => s.StudyId == parsedStudyId && s.CountyId == countyId.Value);

        if (!allowed)
            throw new HubException("Study not available for active county scope.");
    }

    // ── Session Management ──────────────────────────────────────────────────────

    public async Task JoinStudy(string studyId)
    {
        await EnsureStudyAccessAsync(studyId);

        await Groups.AddToGroupAsync(Context.ConnectionId, $"Study_{studyId}");
        var conns = _studySessions.GetOrAdd(studyId, _ => new ConcurrentDictionary<string, byte>());
        conns.TryAdd(Context.ConnectionId, 0);

        await Clients.OthersInGroup($"Study_{studyId}")
            .SendAsync("SurfaceConnected", new { connectionId = Context.ConnectionId, studyId });
    }

    public async Task LeaveStudy(string studyId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Study_{studyId}");
        if (_studySessions.TryGetValue(studyId, out var conns))
        {
            conns.TryRemove(Context.ConnectionId, out _);
            // Evict empty study key to prevent unbounded memory growth
            if (conns.IsEmpty)
                _studySessions.TryRemove(studyId, out _);
        }

        await Clients.OthersInGroup($"Study_{studyId}")
            .SendAsync("SurfaceDisconnected", new { connectionId = Context.ConnectionId, studyId });
    }

    // ── Channel A: Presence (instant, bidirectional) ──────────────────────────

    /// <summary>Broadcast presence event to all other surfaces in the study.</summary>
    public async Task SendPresence(string studyId, object presenceEvent)
    {
        await EnsureStudyAccessAsync(studyId);

        await Clients.OthersInGroup($"Study_{studyId}")
            .SendAsync("ReceivePresence", presenceEvent);
    }

    // ── Channel B: Projection (instant, Forge → Atlas) ────────────────────────

    /// <summary>Forge sends projection events; Atlas renders them immediately.</summary>
    public async Task SendProjection(string studyId, object projectionEvent)
    {
        await EnsureStudyAccessAsync(studyId);

        await Clients.OthersInGroup($"Study_{studyId}")
            .SendAsync("ReceiveProjection", projectionEvent);
    }

    // ── Channel C: Selection (staged, Atlas → Forge) ──────────────────────────

    /// <summary>Atlas sends spatial selection intent. Forge opens a draft dialog — never auto-commits.</summary>
    public async Task SendSelection(string studyId, object selectionEvent)
    {
        await EnsureStudyAccessAsync(studyId);

        await Clients.OthersInGroup($"Study_{studyId}")
            .SendAsync("ReceiveSelection", selectionEvent);
    }

    // ── Channel D: Commit (Forge writes only — confirm required before calling) ─

    /// <summary>Forge broadcasts a commit confirmation to ALL surfaces after persisting.</summary>
    public async Task BroadcastCommit(string studyId, object commitEvent)
    {
        await EnsureStudyAccessAsync(studyId);

        await Clients.Group($"Study_{studyId}")
            .SendAsync("ReceiveCommit", commitEvent);
    }

    // ── Session Info ──────────────────────────────────────────────────────────

    public Task<int> GetSessionSurfaceCount(string studyId)
    {
        return Task.FromResult(_studySessions.TryGetValue(studyId, out var conns) ? conns.Count : 0);
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        foreach (var (studyId, conns) in _studySessions)
        {
            if (conns.TryRemove(Context.ConnectionId, out _))
            {
                // Evict empty study key to prevent unbounded memory growth
                if (conns.IsEmpty)
                    _studySessions.TryRemove(studyId, out _);

                // Use OthersInGroup (not Group) to match LeaveStudy semantics —
                // the disconnecting client cannot receive messages anyway.
                await Clients.OthersInGroup($"Study_{studyId}")
                    .SendAsync("SurfaceDisconnected", new { connectionId = Context.ConnectionId, studyId });
            }
        }
        await base.OnDisconnectedAsync(exception);
    }
}
