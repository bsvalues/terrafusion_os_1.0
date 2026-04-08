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

        // --- Sources (county statutes are gated on parcel presence) ---
        var sources = new List<ExplainSource>();

        if (request.ParcelId is not null)
        {
            sources.Add(new ExplainSource("statute", "RCW 84.40.030 — Valuation of property for taxation"));
            sources.Add(new ExplainSource("statute", "RCW 84.40.038 — Appeal rights and notice requirements"));
            sources.Add(new ExplainSource("parcel_data", request.ParcelId));
        }

        if (ctx?.ActiveBranch is not null)
            sources.Add(new ExplainSource("dev_context", $"branch:{ctx.ActiveBranch}"));

        if (ctx?.ActiveFile is not null)
            sources.Add(new ExplainSource("dev_context", $"file:{ctx.ActiveFile}"));

        if (ctx?.ActiveSuite is not null)
            sources.Add(new ExplainSource("dev_context", $"suite:{ctx.ActiveSuite}"));

        if (request.Statutes is { Length: > 0 })
            sources.AddRange(request.Statutes.Select(s => new ExplainSource("statute", s)));

        // --- Compose explanation ---
        // Mode A: dev + suite — branch/file/build/suite/tab signals, no parcel
        // Mode B: dev-only  — branch/file/build signals, no parcel, no suite
        // Mode C: county    — parcel present (+ optional dev overlay)
        // Future: each mode sends contextPreamble as LLM system context.
        string explanation;
        bool isDevMode = contextLines.Count > 0 && request.ParcelId is null;
        bool hasSuiteContext = ctx?.ActiveSuite is not null;

        if (isDevMode && hasSuiteContext)
        {
            // Mode A: dev + suite context — answer as a suite-aware dev co-pilot
            var buildNote = ctx?.BuildStatus is "error"
                ? " WARNING: the build is currently broken — check editorMarkers for compile errors before proceeding."
                : string.Empty;

            explanation = $"[{contextPreamble.TrimEnd()}]{buildNote} — {request.Query.Trim()} " +
                          $"[Dev Truth Gate: branch + file + suite ({ctx!.ActiveSuite}) signals received. " +
                          $"RAG pipeline connection pending for diff + contract lookup scoped to {ctx.ActiveSuite}/{ctx.ActiveTab ?? "*"} surface.]";
        }
        else if (isDevMode)
        {
            // Mode B: dev-only — branch/file/build reviewer
            var buildNote = ctx?.BuildStatus is "error"
                ? " WARNING: the build is currently broken — check editorMarkers for compile errors before proceeding."
                : string.Empty;

            explanation = $"[{contextPreamble.TrimEnd()}]{buildNote} — {request.Query.Trim()} " +
                          $"[Dev Truth Gate: branch context and file signals received. " +
                          $"RAG pipeline connection pending for full diff + contract analysis.]";
        }
        else
        {
            // Mode C: county co-pilot (parcel + optional dev context overlay)
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
