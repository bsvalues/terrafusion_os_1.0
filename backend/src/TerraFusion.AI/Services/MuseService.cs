using Microsoft.Extensions.Logging;
using TerraFusion.Core.DTOs.Pilot;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.AI.Services;

public sealed class MuseService : IMuseService
{
    private readonly ILogger<MuseService> _logger;

    public MuseService(ILogger<MuseService> logger)
    {
        _logger = logger;
    }

    public Task<ExplainResponse> ExplainAsync(ExplainRequest request, CancellationToken ct = default)
    {
        _logger.LogInformation(
            "Muse explain for parcel {ParcelId} county {CountyId} actor {ActorId} branch {Branch} file {File} build {Build}",
            request.ParcelId ?? "none",
            request.CountyId,
            request.ActorId,
            request.Context?.ActiveBranch ?? "none",
            request.Context?.ActiveFile ?? "none",
            request.Context?.BuildStatus ?? "unknown");

        var traceId = Guid.NewGuid().ToString("N")[..12];
        var ctx = request.Context;

        // --- Build context preamble from OS bus signals ---
        var contextLines = new List<string>();

        if (ctx?.ActiveBranch is { } branch)
            contextLines.Add($"Current branch: {branch}");

        if (ctx?.ActiveFile is { } file)
            contextLines.Add($"Active file: {file}");

        if (ctx?.BuildStatus is "error")
            contextLines.Add("Build status: BROKEN — there are compile errors in the editor");
        else if (ctx?.BuildStatus is "clean")
            contextLines.Add("Build status: clean");

        if (ctx?.ActiveSuite is { } suite)
            contextLines.Add($"Active suite: {suite}");

        if (ctx?.ActiveTab is { } tab)
            contextLines.Add($"Active tab: {tab}");

        var contextPreamble = contextLines.Count > 0
            ? string.Join("; ", contextLines) + ". "
            : string.Empty;

        // --- Statute sources ---
        var sources = new List<ExplainSource>
        {
            new("statute", "RCW 84.40.030 — Valuation of property for taxation"),
            new("statute", "RCW 84.40.038 — Appeal rights and notice requirements"),
        };

        if (request.ParcelId is not null)
            sources.Add(new ExplainSource("parcel_data", request.ParcelId));

        if (ctx?.ActiveBranch is not null)
            sources.Add(new ExplainSource("dev_context", $"branch:{ctx.ActiveBranch}"));

        if (ctx?.ActiveFile is not null)
            sources.Add(new ExplainSource("dev_context", $"file:{ctx.ActiveFile}"));

        if (request.Statutes is { Length: > 0 })
            sources.AddRange(request.Statutes.Select(s => new ExplainSource("statute", s)));

        // --- Compose explanation ---
        // When dev context is present Muse answers as a dev co-pilot (branch/file/build aware).
        // When only parcel context is present it answers as a county co-pilot.
        // Future: replace this with a RAG-backed LLM call that receives contextPreamble as system context.
        string explanation;

        if (contextLines.Count > 0 && request.ParcelId is null)
        {
            // Dev-context-only mode: answer as a code/build reviewer
            var buildNote = ctx?.BuildStatus is "error"
                ? " WARNING: the build is currently broken — check editorMarkers for compile errors before proceeding."
                : string.Empty;

            explanation = $"[{contextPreamble.TrimEnd()}]{buildNote} — {request.Query.Trim()} " +
                          $"[Dev Truth Gate: branch context and file signals received. " +
                          $"RAG pipeline connection pending for full diff + contract analysis.]";
        }
        else
        {
            // County co-pilot mode (parcel + optional dev context overlay)
            var devOverlay = contextPreamble.Length > 0 ? $" [{contextPreamble.TrimEnd('.', ' ')}]" : string.Empty;
            explanation = $"For parcel {request.ParcelId ?? "unknown"} in county {request.CountyId}{devOverlay}: " +
                          $"{request.Query.Trim()} — Under RCW 84.40.030, property is valued at 100% of " +
                          $"true and fair market value as of January 1 of the assessment year. " +
                          $"Current assessment reflects comparable sales data and property characteristics. " +
                          $"Appeal rights are governed by RCW 84.40.038 within 60 days of notice.";
        }

        var response = new ExplainResponse(
            Explanation: explanation,
            Sources: sources.ToArray(),
            Confidence: ctx?.BuildStatus is "error" ? 0.60 : 0.82,
            TraceId: traceId
        );

        return Task.FromResult(response);
    }
}
