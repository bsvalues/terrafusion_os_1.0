using TerraFusion.Core.DTOs.Pilot;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.AI.Services;

/// <summary>
/// Static file-to-surface contract resolver.
///
/// Maps (activeFile, activeSuite, activeTab) to the contract document that
/// governs that surface. Used to answer "what contract governs this surface?"
/// without a live doc store or LLM call.
///
/// Resolution order:
///   1. activeFile — most specific; matched by filename pattern (case-insensitive)
///   2. activeSuite + activeTab — scoped surface contract
///   3. activeSuite — suite-level contract
///   4. null — no contract registered
///
/// Contracts are written as one-paragraph statements the LLM can quote directly.
/// Add entries here as new surfaces are contracted.
/// </summary>
public sealed class SurfaceContractService : ISurfaceContractService
{
    // ── File-pattern → contract ───────────────────────────────────────────────
    // Key: lowercase filename substring (not full path — avoids platform path issues)
    // Match: activeFile?.ToLowerInvariant().Contains(key)
    private static readonly IReadOnlyDictionary<string, SurfaceContract> FileContracts =
        new Dictionary<string, SurfaceContract>(StringComparer.OrdinalIgnoreCase)
        {
            ["musechat"] = new(
                Surface: "Pilot Explain UI (MuseChat)",
                Summary: "MuseChat is the conversational face of TerraPilot. It reads all 7 context " +
                         "bus fields from companionStore and serializes them into every POST /api/pilot/explain " +
                         "payload. The signature guard (lastExplainSignatureRef) prevents duplicate proactive " +
                         "greetings. The component owns no business logic — it is a pure context relay + render.",
                DocPath: null),

            ["pilotcontroller"] = new(
                Surface: "Pilot Explain API (PilotController)",
                Summary: "POST /api/pilot/explain binds ExplainRequest including WorkContext and EditorMarkers[]. " +
                         "Requires RequireUser policy (any valid JWT). Delegates fully to IMuseService — the " +
                         "controller owns no logic. Response is ExplainResponse { Explanation, Sources[], " +
                         "Confidence, TraceId }.",
                DocPath: null),

            ["explainrequest"] = new(
                Surface: "Pilot Explain DTO (WorkContext / ExplainRequest)",
                Summary: "ExplainRequest carries Query, ParcelId?, CountyId, ActorId, Source, and WorkContext?. " +
                         "WorkContext holds the 7-field OS context bus: ActiveBranch, ActiveFile, BuildStatus, " +
                         "ActiveSuite, ActiveTab, EditorMarkers[]. EditorMarkers are pre-filtered to " +
                         "severity != hint by the frontend. All WorkContext fields are optional — the backend " +
                         "degrades gracefully when Canon or Vite are not running.",
                DocPath: null),

            ["museservice"] = new(
                Surface: "Muse Explain Logic (MuseService)",
                Summary: "MuseService routes explain requests through three modes: A (dev+suite, no parcel), " +
                         "B (dev-only, no suite, no parcel), C (county, parcel present). Source taxonomy: " +
                         "statute (county mode only), dev_context (all dev modes), parcel_data (county mode), " +
                         "editor_error (first 5 errors). Confidence drops to 0.60 on buildStatus=error. " +
                         "contextPreamble is structured as an LLM system prompt prefix — swap Task.FromResult " +
                         "for await _llmClient.CompleteAsync when the LLM is connected.",
                DocPath: null),

            ["propertyworkbenchwindow"] = new(
                Surface: "Property Workbench",
                Summary: "PropertyWorkbenchWindow is the dual-screen assessment surface. It publishes " +
                         "activeTab to companionStore on mount and on tab change. Window contract: portrait " +
                         "companion (360×680) floats alongside the workbench. Tab slugs: summary, forge, " +
                         "dais, atlas, dossier. Tab context is cleared on workbench unmount.",
                DocPath: null),

            ["companionstore"] = new(
                Surface: "Companion Context Bus (companionStore)",
                Summary: "companionStore is the OS-level context bus. It holds 7 fields: activeParcelId " +
                         "(parcelContext), activeSuite (Desktop window focus), activeTab (Workbench tab), " +
                         "activeBranch (CanonHome git oracle), activeFile (CanonHome editor tab), " +
                         "buildStatus (CanonHome markers + Vite HMR), editorMarkers[] (CanonHome, hint-filtered). " +
                         "All fields are written by specific publishers — no polling, no inference.",
                DocPath: null),

            ["salequalification"] = new(
                Surface: "Sale Qualification Engine (SaleQualificationService)",
                Summary: "SaleQualificationService applies a 5-layer decision hierarchy to qualify PACS sales " +
                         "for IAAO ratio studies. Layer order: sl_qualifier → sl_county_ratio_cd (Benton primary) " +
                         "→ sl_ratio_type_cd (DOR) → sales_exclude_calc_cd → wac_cd (WAC 458-61A). " +
                         "ComputeRecommendationsAsync is FK-aware and uses live reet_wac_code, county_ratio_code, " +
                         "and sale_ratio_type lookups. Version 1.1.",
                DocPath: null),

            ["desktopstore"] = new(
                Surface: "Desktop / Window Manager (desktopStore)",
                Summary: "desktopStore manages all OS windows. getModuleWindowSize checks os-pilot first " +
                         "(360×680 portrait) before the MODULE_OBJECT_TYPES classification registry — this " +
                         "guard order is load-bearing. openCompanionWindow spawns TerraPilot on Desktop mount. " +
                         "Window lifecycle events are fired on open/close/focus for audit and SignalR broadcast.",
                DocPath: null),
        };

    // ── Suite + tab → contract ────────────────────────────────────────────────
    // Key: "suite:tab" or "suite:*" for suite-level
    private static readonly IReadOnlyDictionary<string, SurfaceContract> SuiteContracts =
        new Dictionary<string, SurfaceContract>(StringComparer.OrdinalIgnoreCase)
        {
            ["forge:summary"] = new(
                Surface: "TerraForge — Summary Tab",
                Summary: "The TerraForge summary tab shows the IAAO ratio study overview for the current " +
                         "model run. It reads from forgeStatisticsStore and forgeRegressionStore. " +
                         "The summary is read-only — all parameter changes happen in the Statistics or " +
                         "Regression tabs.",
                DocPath: null),

            ["forge:*"] = new(
                Surface: "TerraForge Suite",
                Summary: "TerraForge is the mass-appraisal analytics suite. It hosts ratio statistics, " +
                         "OLS regression, comparable sales qualification, and model calibration. " +
                         "All data flows through forgeStatisticsStore and forgeRegressionStore — no direct " +
                         "API calls from components. Sale qualification runs through SaleQualificationService " +
                         "on the backend.",
                DocPath: null),

            ["atlas:*"] = new(
                Surface: "TerraAtlas Suite",
                Summary: "TerraAtlas is the GIS and spatial analysis suite. It reads from atlasSpatialStore. " +
                         "Parcel geometry is fetched from GET /api/atlas/parcels/{parcelId}/geometry. " +
                         "Atlas is read-only from the assessment perspective — no property edits happen here.",
                DocPath: null),

            ["dais:*"] = new(
                Surface: "TerraDais Suite",
                Summary: "TerraDais is the workflow and queue management suite for assessor operations. " +
                         "It surfaces the TerraQueue (pending work items), Management Dashboard (KPIs), " +
                         "and appeal tracking. Queue state is managed by queueStore.",
                DocPath: null),
        };

    /// <inheritdoc/>
    public SurfaceContract? Resolve(string? activeFile, string? activeSuite, string? activeTab)
    {
        // 1. File match — most specific
        if (activeFile is not null)
        {
            var lower = activeFile.ToLowerInvariant();
            foreach (var (key, contract) in FileContracts)
            {
                if (lower.Contains(key.ToLowerInvariant()))
                    return contract;
            }
        }

        // 2. Suite + tab
        if (activeSuite is not null && activeTab is not null)
        {
            var suiteTabKey = $"{activeSuite}:{activeTab}";
            if (SuiteContracts.TryGetValue(suiteTabKey, out var suiteTabContract))
                return suiteTabContract;
        }

        // 3. Suite-level wildcard
        if (activeSuite is not null)
        {
            var suiteWildKey = $"{activeSuite}:*";
            if (SuiteContracts.TryGetValue(suiteWildKey, out var suiteContract))
                return suiteContract;
        }

        return null;
    }
}
