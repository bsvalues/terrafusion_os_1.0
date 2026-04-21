// backend/src/TerraFusion.API/Hubs/CountyStudyHub.cs
using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;

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
    // In-memory session state: studyId → set of connectionIds
    private static readonly ConcurrentDictionary<string, HashSet<string>> _studySessions = new();

    // ── Session Management ──────────────────────────────────────────────────────

    public async Task JoinStudy(string studyId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"Study_{studyId}");
        _studySessions.AddOrUpdate(
            studyId,
            _ => new HashSet<string> { Context.ConnectionId },
            (_, existing) => { existing.Add(Context.ConnectionId); return existing; });

        await Clients.OthersInGroup($"Study_{studyId}")
            .SendAsync("SurfaceConnected", new { connectionId = Context.ConnectionId, studyId });
    }

    public async Task LeaveStudy(string studyId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Study_{studyId}");
        if (_studySessions.TryGetValue(studyId, out var conns))
            conns.Remove(Context.ConnectionId);

        await Clients.OthersInGroup($"Study_{studyId}")
            .SendAsync("SurfaceDisconnected", new { connectionId = Context.ConnectionId, studyId });
    }

    // ── Channel A: Presence (instant, bidirectional) ──────────────────────────

    /// <summary>Broadcast presence event to all other surfaces in the study.</summary>
    public async Task SendPresence(string studyId, object presenceEvent)
    {
        await Clients.OthersInGroup($"Study_{studyId}")
            .SendAsync("ReceivePresence", presenceEvent);
    }

    // ── Channel B: Projection (instant, Forge → Atlas) ────────────────────────

    /// <summary>Forge sends projection events; Atlas renders them immediately.</summary>
    public async Task SendProjection(string studyId, object projectionEvent)
    {
        await Clients.OthersInGroup($"Study_{studyId}")
            .SendAsync("ReceiveProjection", projectionEvent);
    }

    // ── Channel C: Selection (staged, Atlas → Forge) ──────────────────────────

    /// <summary>Atlas sends spatial selection intent. Forge opens a draft dialog — never auto-commits.</summary>
    public async Task SendSelection(string studyId, object selectionEvent)
    {
        await Clients.OthersInGroup($"Study_{studyId}")
            .SendAsync("ReceiveSelection", selectionEvent);
    }

    // ── Channel D: Commit (Forge writes only — confirm required before calling) ─

    /// <summary>Forge broadcasts a commit confirmation to ALL surfaces after persisting.</summary>
    public async Task BroadcastCommit(string studyId, object commitEvent)
    {
        await Clients.Group($"Study_{studyId}")
            .SendAsync("ReceiveCommit", commitEvent);
    }

    // ── Session Info ──────────────────────────────────────────────────────────

    public Task<int> GetSessionSurfaceCount(string studyId)
    {
        var count = _studySessions.TryGetValue(studyId, out var conns) ? conns.Count : 0;
        return Task.FromResult(count);
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        foreach (var (studyId, conns) in _studySessions)
        {
            if (conns.Remove(Context.ConnectionId))
            {
                await Clients.Group($"Study_{studyId}")
                    .SendAsync("SurfaceDisconnected", new { connectionId = Context.ConnectionId, studyId });
            }
        }
        await base.OnDisconnectedAsync(exception);
    }
}
