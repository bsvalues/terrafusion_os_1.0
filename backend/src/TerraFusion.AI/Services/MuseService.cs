using Microsoft.Extensions.Logging;
using TerraFusion.Core.DTOs.Pilot;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.AI.Services;

public sealed class MuseService : IMuseService
{
    private readonly ILogger<MuseService> _logger;
    private readonly IGitContextService _git;
    private readonly ISurfaceContractService _contracts;
    private readonly IMuseLlmClient _llm;
    private readonly IMuseRouter? _router;

    /// <summary>
    /// Single-provider constructor — preserves backward compatibility with
    /// existing tests and single-model deployments. When only IMuseLlmClient
    /// is registered, all tasks are routed through it.
    /// </summary>
    public MuseService(
        ILogger<MuseService> logger,
        IGitContextService git,
        ISurfaceContractService contracts,
        IMuseLlmClient llm)
    {
        _logger = logger;
        _git = git;
        _contracts = contracts;
        _llm = llm;
        _router = null;
    }

    /// <summary>
    /// Multi-lane constructor — used when the routing matrix is configured.
    /// IMuseRouter dispatches to the appropriate model lane per task type.
    /// IMuseLlmClient is kept as the ultimate fallback should the router
    /// return empty string.
    /// </summary>
    public MuseService(
        ILogger<MuseService> logger,
        IGitContextService git,
        ISurfaceContractService contracts,
        IMuseLlmClient llm,
        IMuseRouter router)
    {
        _logger = logger;
        _git = git;
        _contracts = contracts;
        _llm = llm;
        _router = router;
    }

    public async Task<ExplainResponse> ExplainAsync(ExplainRequest request, CancellationToken ct = default)
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

        // EditorMarkers: include error/warning counts in the preamble so the LLM
        // can reference them. Messages are available for the RAG layer to inline.
        var errorMarkers = ctx?.EditorMarkers?.Where(m => m.Severity == "error").ToArray() ?? [];
        var warnMarkers = ctx?.EditorMarkers?.Where(m => m.Severity == "warning").ToArray() ?? [];
        if (errorMarkers.Length > 0 || warnMarkers.Length > 0)
        {
            var parts = new List<string>();
            if (errorMarkers.Length > 0) parts.Add($"{errorMarkers.Length} error(s)");
            if (warnMarkers.Length > 0) parts.Add($"{warnMarkers.Length} warning(s)");
            contextLines.Add($"Editor diagnostics: {string.Join(", ", parts)}");
        }

        // --- Parcel property context (Stage 1 injection) ---
        // ParcelSummary is built by buildParcelSummary() on the frontend and contains
        // the fields from propertyStore.activeParcel that are relevant to assessment reasoning.
        // The S() helper is null-safe: missing keys and null values both return "".
        if (request.ParcelSummary is { Count: > 0 } ps)
        {
            string S(string k) => ps.TryGetValue(k, out var v) ? v?.ToString() ?? "" : "";

            var address = S("address");
            if (!string.IsNullOrEmpty(address))
                contextLines.Add(
                    $"Parcel: {address}, {S("city")} | " +
                    $"Type: {S("propertyType")} | " +
                    $"Status: {S("assessmentStatus")} ({S("assessmentYear")})");

            var totalAv = S("totalAssessedValue");
            if (!string.IsNullOrEmpty(totalAv))
                contextLines.Add(
                    $"Assessed values: total ${totalAv} | land ${S("landValue")} | " +
                    $"improvement ${S("improvementValue")} | market ${S("marketValue")} | " +
                    $"taxable ${S("taxableValue")}");

            var sqft = S("buildingSquareFeet");
            if (!string.IsNullOrEmpty(sqft) && sqft != "0")
                contextLines.Add(
                    $"Physical: {sqft} sq ft built {S("yearBuilt")} | {S("landAcreage")} acres");

            var lastSaleDate = S("lastSaleDate");
            if (!string.IsNullOrEmpty(lastSaleDate))
                contextLines.Add($"Last sale: {lastSaleDate} at ${S("lastSalePrice")}");

            var neighborhood = S("neighborhood");
            var zoning = S("zoning");
            var district = S("taxDistrictName");
            if (!string.IsNullOrEmpty(neighborhood) || !string.IsNullOrEmpty(zoning) || !string.IsNullOrEmpty(district))
                contextLines.Add($"Geo: neighborhood {neighborhood} | zoning {zoning} | district {district}");

            var specials = S("specialDistricts");
            if (!string.IsNullOrEmpty(specials))
                contextLines.Add($"Special districts: {specials}");

            var lat = S("latitude");
            if (!string.IsNullOrEmpty(lat) && lat != "0")
                contextLines.Add($"Coordinates: {lat}, {S("longitude")}");
        }

        var contextPreamble = contextLines.Count > 0
            ? string.Join("; ", contextLines) + ". "
            : string.Empty;

        // --- CLI Phase 1: live repo context (read-only, bounded) ---
        GitContext? gitCtx = null;
        SurfaceContract? contract = null;

        if (ctx?.ActiveBranch is { } liveBranch)
        {
            gitCtx = await _git.GetContextAsync(liveBranch, ctx.ActiveFile, ct);
        }

        contract = _contracts.Resolve(ctx?.ActiveFile, ctx?.ActiveSuite, ctx?.ActiveTab);

        // Build enriched preamble lines from CLI results
        var enrichedLines = new List<string>();

        // Changed files: surface only when the list is small enough to be actionable.
        // Large branch-wide counts (e.g. thousands of files) are noise without a
        // file-scoped diff — suppress them so the LLM context stays clean.
        // Phase 2 will resolve activeFile to a repo-relative path so the file-scoped
        // diff populates reliably; until then, only show the list when ≤ 20 files.
        const int MaxUsefulChangedCount = 20;
        if (gitCtx?.ChangedFiles is { Length: > 0 } changed)
        {
            if (changed.Length <= MaxUsefulChangedCount)
            {
                var preview = changed.Length <= 3
                    ? string.Join(", ", changed)
                    : string.Join(", ", changed.Take(3)) + $" (+{changed.Length - 3} more)";
                enrichedLines.Add($"Changed files ({changed.Length}): {preview}");
            }
            // else: branch diverged too far without a file-scoped diff — suppress list.
        }

        if (gitCtx?.FileDiff is { Length: > 0 } diff)
            enrichedLines.Add($"Diff for {ctx!.ActiveFile}:\n{diff}");

        if (contract is not null)
            enrichedLines.Add($"Contract [{contract.Surface}]: {contract.Summary}");

        var enrichedPreamble = enrichedLines.Count > 0
            ? contextPreamble + string.Join("\n", enrichedLines) + "\n"
            : contextPreamble;

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

        // Add first N error messages as sources so the RAG renderer can surface them
        foreach (var m in errorMarkers.Take(5))
            sources.Add(new ExplainSource("editor_error", m.Message));

        // CLI Phase 1 — live repo context sources.
        // Source label distinguishes file-scoped diff (actionable) from branch-wide count
        // (informational) so the citation renderer and future LLM both know the scope.
        if (gitCtx?.HasChanges == true)
        {
            var diffRef = gitCtx.FileDiff is not null
                ? $"file-diff:{gitCtx.ResolvedFilePath ?? ctx?.ActiveFile ?? "unknown"} ({gitCtx.Branch})"
                : $"branch:{gitCtx.Branch} — {gitCtx.ChangedFiles.Length} file(s) changed (activeFile path unresolved)";
            sources.Add(new ExplainSource("git_diff", diffRef));
        }

        if (contract is not null)
            sources.Add(new ExplainSource("surface_contract", contract.Surface));

        if (request.Statutes is { Length: > 0 })
            sources.AddRange(request.Statutes.Select(s => new ExplainSource("statute", s)));

        // --- Compose explanation ---
        // Mode A: dev + suite — branch/file/build/suite/tab signals, no parcel
        // Mode B: dev-only  — branch/file/build signals, no parcel, no suite
        // Mode C: county    — parcel present (+ optional dev overlay)
        //
        // LLM is tried first when configured. enrichedPreamble (git diff, contract,
        // build state) becomes the LLM system prompt so the model has live repo
        // context for every answer. Falls back to the static mode-specific template
        // when the LLM is unconfigured or returns null.
        string explanation;
        bool isDevMode = contextLines.Count > 0 && request.ParcelId is null;
        bool hasSuiteContext = ctx?.ActiveSuite is not null;

        // Attempt LLM completion. IMuseLlmClient is provider-agnostic — the
        // registered backend (local, Azure, or any SK connector) is chosen at
        // startup from MuseLlmOptions. MuseService never knows the vendor name.
        // Empty string means backend unavailable → fall through to static template.
        var systemPrompt = BuildSystemPrompt(enrichedPreamble, isDevMode, hasSuiteContext, ctx, errorMarkers);
        var task = ClassifyTask(request, isDevMode, hasSuiteContext);

        // Route through the multi-lane router when available; fall back to the
        // single-provider client for backward-compatible single-model deployments.
        string llmText;
        if (_router is not null)
        {
            llmText = await _router.CompleteAsync(task, systemPrompt, request.Query.Trim(), ct);
            _logger.LogDebug(
                "Muse router [{Task}] for trace {TraceId}: {Result}",
                task, traceId, llmText.Length > 0 ? $"{llmText.Length} chars" : "empty (static fallback)");
        }
        else
        {
            llmText = await _llm.CompleteAsync(systemPrompt, request.Query.Trim(), ct);
            _logger.LogDebug(
                "Muse LLM completion for trace {TraceId}: {Result}",
                traceId, llmText.Length > 0 ? $"{llmText.Length} chars" : "empty (static fallback)");
        }

        if (llmText.Length > 0)
        {
            // Live LLM response — use it directly.
            explanation = llmText;
        }
        else if (isDevMode && hasSuiteContext)
        {
            // Mode A static fallback: dev + suite context
            var buildNote = ctx?.BuildStatus is "error"
                ? BuildErrorNote(errorMarkers)
                : string.Empty;

            explanation = $"[{enrichedPreamble.TrimEnd()}]{buildNote} — {request.Query.Trim()} " +
                          $"[Muse: branch + file + suite ({ctx!.ActiveSuite}) signals received. " +
                          $"LLM backend offline or unconfigured — static fallback active.]";
        }
        else if (isDevMode)
        {
            // Mode B static fallback: dev-only
            var buildNote = ctx?.BuildStatus is "error"
                ? BuildErrorNote(errorMarkers)
                : string.Empty;

            explanation = $"[{enrichedPreamble.TrimEnd()}]{buildNote} — {request.Query.Trim()} " +
                          $"[Muse: branch + file signals received. " +
                          $"LLM backend offline or unconfigured — static fallback active.]";
        }
        else
        {
            // Mode C static fallback: county co-pilot (parcel + optional dev context overlay)
            var devOverlay = enrichedPreamble.Length > 0 ? $" [{enrichedPreamble.TrimEnd('.', ' ', '\n')}]" : string.Empty;
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

        return response;
    }

    /// <summary>
    /// Builds the LLM system prompt from the enriched context preamble.
    ///
    /// The preamble already contains branch, file, build status, git diff, and
    /// surface contract — this method wraps it with a role statement so the model
    /// understands its persona and expected output style.
    ///
    /// Mode A/B (dev) → developer co-pilot persona, focus on code and contracts.
    /// Mode C (county) → county assessor co-pilot persona, focus on RCW/assessment.
    /// </summary>
    private static string BuildSystemPrompt(
        string enrichedPreamble,
        bool isDevMode,
        bool hasSuiteContext,
        WorkContext? ctx,
        EditorMarker[] errorMarkers)
    {
        var roleHeader = isDevMode
            ? "You are Muse, the developer co-pilot for TerraFusion OS — a sovereign government property " +
              "assessment platform for Washington State counties.\n" +
              "Answer as a precise, experienced software engineer. Be concise and direct. " +
              "No preambles. Reference the active file, branch diff, and surface contract when relevant. " +
              (hasSuiteContext ? $"Focus on the {ctx!.ActiveSuite} suite and {ctx.ActiveTab ?? "active"} tab context.\n" : string.Empty) +
              (errorMarkers.Length > 0
                  ? $"The build has {errorMarkers.Length} error(s). Address them if the question relates to the build.\n"
                  : string.Empty)
            : "You are Muse, the county assessor co-pilot for TerraFusion OS — a sovereign government " +
              "property assessment platform for Washington State counties.\n" +
              "Answer as a knowledgeable property assessment expert. Be precise and professional. " +
              "Reference RCW statutes and IAAO methodology when applicable. No generic disclaimers.\n";

        return string.IsNullOrWhiteSpace(enrichedPreamble)
            ? roleHeader
            : roleHeader + "\n--- Context ---\n" + enrichedPreamble.TrimEnd();
    }

    /// <summary>
    /// Builds the build-error warning note for Mode A/B explanations.
    /// Includes the first error message when markers are present so the operator
    /// sees something actionable rather than a generic "build is broken" notice.
    /// </summary>
    private static string BuildErrorNote(EditorMarker[] errorMarkers)
    {
        if (errorMarkers.Length == 0)
            return " WARNING: the build is currently broken — check editorMarkers for compile errors before proceeding.";

        var firstMsg = errorMarkers[0].Message.Length > 120
            ? errorMarkers[0].Message[..120] + "…"
            : errorMarkers[0].Message;

        var more = errorMarkers.Length > 1 ? $" (+{errorMarkers.Length - 1} more)" : string.Empty;
        return $" WARNING: build broken — {errorMarkers.Length} error(s). First: \"{firstMsg}\"{more}";
    }

    /// <summary>
    /// Classifies the current request as a <see cref="MuseTaskType"/> so the
    /// router can dispatch to the most appropriate model lane.
    ///
    /// Classification rules (in priority order):
    ///   AgentTools  — request explicitly targets a tool/workflow execution
    ///   Document    — county mode asking for narrative/letter generation
    ///   Reasoning   — county mode or complex multi-step questions (heuristic)
    ///   DevAssist   — developer context present (default dev lane)
    ///   Reasoning   — county/parcel requests without a dev overlay (default)
    /// </summary>
    private static MuseTaskType ClassifyTask(
        ExplainRequest request,
        bool isDevMode,
        bool hasSuiteContext)
    {
        var q = request.Query.Trim().ToLowerInvariant();

        // Explicit agentic intent keywords
        if (q.Contains("run ") || q.Contains("execute ") || q.Contains("trigger ") ||
            q.Contains("schedule ") || q.Contains("workflow") || q.Contains("automate"))
            return MuseTaskType.AgentTools;

        // Document generation keywords
        if (q.Contains("write ") || q.Contains("draft ") || q.Contains("generate ") ||
            q.Contains("letter") || q.Contains("narrative") || q.Contains("report"))
            return MuseTaskType.Document;

        // Reasoning keywords (IAAO, ratio, stat, calculate, explain why)
        if (q.Contains("ratio") || q.Contains("iaao") || q.Contains("prd") || q.Contains("cod") ||
            q.Contains("rcw") || q.Contains("calculate") || q.Contains("why ") ||
            q.Contains("explain why") || q.Contains("analyse") || q.Contains("analyze"))
            return MuseTaskType.Reasoning;

        // Dev mode: default to DevAssist (latency-optimised small model)
        if (isDevMode)
            return MuseTaskType.DevAssist;

        // County mode without specific keyword: reasoning is the safer default
        // (statutory interpretation is common even for simple questions)
        return MuseTaskType.Reasoning;
    }
}
