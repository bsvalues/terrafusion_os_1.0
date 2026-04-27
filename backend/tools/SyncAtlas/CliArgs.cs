namespace TerraFusion.Tools.SyncAtlas;

/// <summary>
/// Parsed command-line arguments for the SyncAtlas CLI.
///
/// <para>The CLI has two operating modes — exactly one runs per
/// invocation:</para>
/// <list type="number">
/// <item><b>Profile mode (default).</b> Connects to a
/// <c>SyncSourceConnection</c> via <see cref="ConnectionId"/>, runs
/// the structural atlas pass, optionally runs the B2 deep-profile
/// pass (<see cref="DeepProfile"/> + sub-options), and persists into
/// the <c>SyncProfile*</c> tables.</item>
/// <item><b>Mapping-workbook mode.</b> Reads
/// <c>SyncProfileCodeCandidate</c> rows for a county/profile-batch
/// scope and produces draft Mapping Workbook rows
/// (<c>SyncMappingWorkbook</c> / <c>Column</c> / <c>CodeValue</c>)
/// via the C3 <c>SyncMappingWorkbookDraftLoader</c>. Triggered by
/// <see cref="GenerateMappingWorkbook"/>.</item>
/// </list>
/// <para><see cref="ConnectionId"/> is required only in profile mode;
/// the workbook mode resolves the source connection internally from
/// the chosen profile batch.</para>
/// </summary>
public sealed record CliArgs(
    string TerraFusionDbConnectionString,
    Guid CountyId,
    Guid? ConnectionId,
    string OperatorId,
    bool ShowHelp,
    bool DeepProfile,
    IReadOnlyList<string> DeepProfileIncludeQualifiedNames,
    int? DeepProfileMaxTables,
    // Slice C4 — Mapping Workbook draft mode
    bool GenerateMappingWorkbook,
    Guid? ProfileBatchId,
    bool LatestProfileBatch,
    string? WorkbookName,
    bool ReplaceExistingDraft,
    int? MappingMaxCandidates,
    // Slice C5 — Mapping Workbook export mode
    bool ExportMappingWorkbook,
    Guid? WorkbookId,
    string? OutputDirectory,
    string ExportFormat,
    // Slice C8-C — Sales qualification sample runner mode
    bool QualifySales,
    Guid? SourceConnectionId,
    int? MaxSales,
    // Slice C9-B — Mapping Workbook edit mode
    bool EditMappingWorkbook,
    string? EditSourceSchema,
    string? EditSourceTable,
    string? EditSourceColumn,
    string? EditSourceValue,
    string? EditCanonicalTarget,
    string? EditCanonicalValue,
    bool EditCanonicalValueNull,
    string? EditReviewStatus,
    bool? EditIsExcluded,
    string? EditNotes,
    // Slice C10-B — Mapping Workbook lock mode (sixth in the SyncAtlas mutex)
    bool LockMappingWorkbook,
    // Slice C11-B — Mapping Workbook batch edit mode (seventh in the SyncAtlas mutex)
    bool BatchEditMappingWorkbook,
    string? InputCsvPath,
    bool BatchEditDryRun,
    bool BatchEditApply);

/// <summary>
/// Pure argument parser. No I/O, no environment access — easy to unit test.
///
/// Recognized flags (all required unless marked optional):
///   --db &lt;connection-string&gt;       TerraFusion Postgres connection string
///   --county-id &lt;guid&gt;            CountyId scoping the run
///   --connection-id &lt;guid&gt;        SyncSourceConnection.Id to profile
///                                  (required ONLY in profile mode; the
///                                  Mapping Workbook mode resolves the
///                                  connection from the profile batch)
///   --operator &lt;name&gt;             Operator id stamped on audit fields (optional, default "cli-operator")
///   --deep-profile                Optional: also run the B2 deep-profile pass
///                                  after the structural atlas, populating the
///                                  SyncProfileTableStats / ColumnStats /
///                                  CodeCandidate tables. Defaults to off.
///                                  Profile-mode only.
///   --deep-profile-include &lt;list&gt; Optional, requires --deep-profile.
///   --deep-profile-max-tables &lt;n&gt; Optional, requires --deep-profile.
///
///   --generate-mapping-workbook   Switch the run into Mapping-Workbook mode.
///                                 Reads SyncProfileCodeCandidate rows for
///                                 (--county-id, &lt;chosen-batch&gt;) and
///                                 materializes draft workbook/column/value
///                                 rows. The chosen batch is either an
///                                 explicit --profile-batch-id or the most
///                                 recent successful profile batch via
///                                 --latest-profile-batch.
///   --profile-batch-id &lt;guid&gt;   Required in workbook mode unless
///                                  --latest-profile-batch is set; mutex
///                                  with --latest-profile-batch.
///   --latest-profile-batch        Required in workbook mode unless
///                                  --profile-batch-id is set; mutex
///                                  with --profile-batch-id. Resolves to
///                                  the most recent SyncBatch with mode='profile'
///                                  that has at least one SyncProfileTableStats
///                                  row, county-scoped.
///   --workbook-name &lt;name&gt;       Required in workbook mode. Workbook
///                                  natural key per county is (CountyId,
///                                  Name); same name in same county
///                                  resolves to idempotent re-load.
///   --replace-existing-draft      Optional, requires --generate-mapping-workbook.
///                                  When the named workbook exists with
///                                  Status='Draft', wipes its existing
///                                  contents and re-materializes from the
///                                  current candidate set. Refuses to
///                                  touch any non-Draft workbook regardless
///                                  of this flag.
///   --mapping-max-candidates &lt;n&gt; Optional, requires --generate-mapping-workbook.
///                                  Caps the candidate iteration at the
///                                  first N (after deterministic sort).
///                                  Must be a positive int.
///
///   --help, -h, /?                Print usage and exit
///
/// Returns (CliArgs, null) on success, (null, errorMessage) on parse failure.
/// </summary>
public static class CliArgsParser
{
    public const string DefaultOperatorId = "cli-operator";

    /// <summary>Valid <c>--format</c> values for the export mode.</summary>
    public static readonly HashSet<string> ValidExportFormats =
        new(StringComparer.OrdinalIgnoreCase) { "csv", "md", "both" };

    private static bool IsValidExportFormat(string raw)
        => !string.IsNullOrWhiteSpace(raw) && ValidExportFormats.Contains(raw);

    /// <summary>
    /// Valid <c>--review-status</c> values for the edit mode (Slice C9-B).
    /// Matches the C2 schema vocabulary; the closed set is enforced at
    /// the parser AND defended again at the service layer.
    /// </summary>
    public static readonly HashSet<string> ValidEditReviewStatuses =
        new(StringComparer.OrdinalIgnoreCase)
        {
            "NeedsReview", "InProgress", "Mapped", "Excluded", "Deferred",
        };

    /// <summary>
    /// Rejection helper used by every non-batch mode to refuse the
    /// batch-edit-specific input flags (--input-csv, --dry-run,
    /// --apply). Returns null when none are present, or the error
    /// message when one is.
    /// </summary>
    private static string? RejectBatchEditModeFlags(
        string? inputCsvPath,
        bool   batchEditDryRun,
        bool   batchEditApply)
    {
        if (inputCsvPath is not null) return "--input-csv requires --batch-edit-mapping-workbook";
        if (batchEditDryRun)          return "--dry-run requires --batch-edit-mapping-workbook";
        if (batchEditApply)           return "--apply requires --batch-edit-mapping-workbook";
        return null;
    }

    /// <summary>
    /// Rejection helper used by every non-edit mode to refuse edit-mode
    /// flags. Returns null when no edit-mode flag is present, or the
    /// error message string when one is. Keeps the per-mode validation
    /// blocks readable.
    /// </summary>
    private static string? RejectEditModeFlags(
        string? editSourceSchema,
        string? editSourceValue,
        string? editCanonicalTarget,
        string? editCanonicalValue,
        bool   editCanonicalValueNull,
        string? editReviewStatusRaw,
        bool?   editIsExcludedRaw,
        string? editNotes)
    {
        if (editSourceSchema    is not null) return "--source requires --edit-mapping-workbook";
        if (editSourceValue     is not null) return "--source-value requires --edit-mapping-workbook";
        if (editCanonicalTarget is not null) return "--canonical-target requires --edit-mapping-workbook";
        if (editCanonicalValue  is not null) return "--canonical-value requires --edit-mapping-workbook";
        if (editCanonicalValueNull)          return "--canonical-value-null requires --edit-mapping-workbook";
        if (editReviewStatusRaw is not null) return "--review-status requires --edit-mapping-workbook";
        if (editIsExcludedRaw.HasValue)      return "--is-excluded requires --edit-mapping-workbook";
        if (editNotes           is not null) return "--notes requires --edit-mapping-workbook";
        return null;
    }

    public static (CliArgs? Args, string? Error) Parse(string[] argv)
    {
        ArgumentNullException.ThrowIfNull(argv);

        if (argv.Length == 0)
        {
            return (null, "no arguments provided. Use --help for usage.");
        }

        string? db = null;
        Guid? countyId = null;
        Guid? connectionId = null;
        string operatorId = DefaultOperatorId;
        var help = false;
        var deepProfile = false;
        IReadOnlyList<string> deepProfileInclude = Array.Empty<string>();
        int? deepProfileMaxTables = null;

        // Slice C4 — Mapping Workbook draft mode
        var generateMappingWorkbook = false;
        Guid? profileBatchId = null;
        var latestProfileBatch = false;
        string? workbookName = null;
        var replaceExistingDraft = false;
        int? mappingMaxCandidates = null;

        // Slice C5 — Mapping Workbook export mode
        var exportMappingWorkbook = false;
        Guid? workbookId = null;
        string? outputDirectory = null;
        string exportFormat = "both";

        // Whether the user EXPLICITLY supplied --format. Lets us refuse
        // --format outside export mode without false-positive matches on
        // the default value.
        var exportFormatExplicit = false;

        // Slice C8-C — Sales qualification sample runner mode
        var qualifySales = false;
        Guid? sourceConnectionId = null;
        int? maxSales = null;

        // Slice C9-B — Mapping Workbook edit mode
        var editMappingWorkbook = false;
        string? editSourceSchema = null;
        string? editSourceTable = null;
        string? editSourceColumn = null;
        string? editSourceValue = null;
        string? editCanonicalTarget = null;
        string? editCanonicalValue = null;
        var editCanonicalValueNull = false;
        string? editReviewStatus = null;
        bool? editIsExcluded = null;
        string? editNotes = null;

        // Slice C10-B — Mapping Workbook lock mode
        var lockMappingWorkbook = false;

        // Slice C11-B — Mapping Workbook batch edit mode
        var batchEditMappingWorkbook = false;
        string? inputCsvPath = null;
        var batchEditDryRun = false;
        var batchEditApply  = false;

        for (var i = 0; i < argv.Length; i++)
        {
            var arg = argv[i];
            switch (arg)
            {
                case "--help":
                case "-h":
                case "/?":
                    help = true;
                    break;

                case "--db":
                    if (++i >= argv.Length) return (null, "--db requires a value");
                    db = argv[i];
                    break;

                case "--county-id":
                    if (++i >= argv.Length) return (null, "--county-id requires a value");
                    if (!Guid.TryParse(argv[i], out var c)) return (null, $"--county-id is not a valid GUID: '{argv[i]}'");
                    countyId = c;
                    break;

                case "--connection-id":
                    if (++i >= argv.Length) return (null, "--connection-id requires a value");
                    if (!Guid.TryParse(argv[i], out var k)) return (null, $"--connection-id is not a valid GUID: '{argv[i]}'");
                    connectionId = k;
                    break;

                case "--operator":
                    if (++i >= argv.Length) return (null, "--operator requires a value");
                    operatorId = argv[i];
                    break;

                case "--deep-profile":
                    deepProfile = true;
                    break;

                case "--deep-profile-include":
                    if (++i >= argv.Length) return (null, "--deep-profile-include requires a value");
                    var raw = argv[i];
                    var parsed = raw
                        .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                        .ToArray();
                    if (parsed.Length == 0)
                    {
                        return (null, "--deep-profile-include requires at least one schema.table entry");
                    }
                    foreach (var entry in parsed)
                    {
                        if (entry.Count(ch => ch == '.') != 1
                            || entry.StartsWith('.')
                            || entry.EndsWith('.'))
                        {
                            return (null, $"--deep-profile-include entry is not 'schema.table': '{entry}'");
                        }
                    }
                    deepProfileInclude = parsed;
                    break;

                case "--deep-profile-max-tables":
                    if (++i >= argv.Length) return (null, "--deep-profile-max-tables requires a value");
                    if (!int.TryParse(argv[i], out var n) || n <= 0)
                    {
                        return (null, $"--deep-profile-max-tables must be a positive integer: '{argv[i]}'");
                    }
                    deepProfileMaxTables = n;
                    break;

                // ── Slice C4 — Mapping Workbook draft mode ─────────────
                case "--generate-mapping-workbook":
                    generateMappingWorkbook = true;
                    break;

                case "--profile-batch-id":
                    if (++i >= argv.Length) return (null, "--profile-batch-id requires a value");
                    if (!Guid.TryParse(argv[i], out var pb)) return (null, $"--profile-batch-id is not a valid GUID: '{argv[i]}'");
                    profileBatchId = pb;
                    break;

                case "--latest-profile-batch":
                    latestProfileBatch = true;
                    break;

                case "--workbook-name":
                    if (++i >= argv.Length) return (null, "--workbook-name requires a value");
                    workbookName = argv[i];
                    break;

                case "--replace-existing-draft":
                    replaceExistingDraft = true;
                    break;

                case "--mapping-max-candidates":
                    if (++i >= argv.Length) return (null, "--mapping-max-candidates requires a value");
                    if (!int.TryParse(argv[i], out var mmc) || mmc <= 0)
                    {
                        return (null, $"--mapping-max-candidates must be a positive integer: '{argv[i]}'");
                    }
                    mappingMaxCandidates = mmc;
                    break;

                // ── Slice C5 — Mapping Workbook export mode ─────────────
                case "--export-mapping-workbook":
                    exportMappingWorkbook = true;
                    break;

                case "--workbook-id":
                    if (++i >= argv.Length) return (null, "--workbook-id requires a value");
                    if (!Guid.TryParse(argv[i], out var wid)) return (null, $"--workbook-id is not a valid GUID: '{argv[i]}'");
                    workbookId = wid;
                    break;

                case "--output-dir":
                    if (++i >= argv.Length) return (null, "--output-dir requires a value");
                    outputDirectory = argv[i];
                    break;

                case "--format":
                    if (++i >= argv.Length) return (null, "--format requires a value");
                    var fmt = argv[i];
                    if (!IsValidExportFormat(fmt))
                    {
                        return (null, $"--format must be one of: csv, md, both. Got '{fmt}'.");
                    }
                    exportFormat = fmt.ToLowerInvariant();
                    exportFormatExplicit = true;
                    break;

                // ── Slice C8-C — Sales qualification sample runner ─────
                case "--qualify-sales":
                    qualifySales = true;
                    break;

                case "--source-connection-id":
                    if (++i >= argv.Length) return (null, "--source-connection-id requires a value");
                    if (!Guid.TryParse(argv[i], out var sci))
                        return (null, $"--source-connection-id is not a valid GUID: '{argv[i]}'");
                    sourceConnectionId = sci;
                    break;

                case "--max-sales":
                    if (++i >= argv.Length) return (null, "--max-sales requires a value");
                    if (!int.TryParse(argv[i], out var ms) || ms <= 0)
                    {
                        return (null, $"--max-sales must be a positive integer: '{argv[i]}'");
                    }
                    maxSales = ms;
                    break;

                // ── Slice C9-B — Mapping Workbook edit mode ─────────────
                case "--edit-mapping-workbook":
                    editMappingWorkbook = true;
                    break;

                case "--source":
                    if (++i >= argv.Length) return (null, "--source requires a value");
                    var rawSource = argv[i];
                    var parts = rawSource.Split('.');
                    if (parts.Length != 3 ||
                        string.IsNullOrWhiteSpace(parts[0]) ||
                        string.IsNullOrWhiteSpace(parts[1]) ||
                        string.IsNullOrWhiteSpace(parts[2]))
                    {
                        return (null, $"--source must be 'schema.table.column': '{rawSource}'");
                    }
                    editSourceSchema = parts[0];
                    editSourceTable  = parts[1];
                    editSourceColumn = parts[2];
                    break;

                case "--source-value":
                    if (++i >= argv.Length) return (null, "--source-value requires a value");
                    editSourceValue = argv[i];
                    break;

                case "--canonical-target":
                    if (++i >= argv.Length) return (null, "--canonical-target requires a value");
                    editCanonicalTarget = argv[i];
                    break;

                case "--canonical-value":
                    if (++i >= argv.Length) return (null, "--canonical-value requires a value");
                    editCanonicalValue = argv[i];
                    break;

                case "--canonical-value-null":
                    editCanonicalValueNull = true;
                    break;

                case "--review-status":
                    if (++i >= argv.Length) return (null, "--review-status requires a value");
                    var rs = argv[i];
                    if (!ValidEditReviewStatuses.Contains(rs))
                    {
                        return (null,
                            $"--review-status must be one of: {string.Join(", ", ValidEditReviewStatuses)}. Got '{rs}'.");
                    }
                    editReviewStatus = rs;
                    break;

                case "--is-excluded":
                    if (++i >= argv.Length) return (null, "--is-excluded requires a value");
                    var rawExcluded = argv[i];
                    if (string.Equals(rawExcluded, "true",  StringComparison.OrdinalIgnoreCase))
                        editIsExcluded = true;
                    else if (string.Equals(rawExcluded, "false", StringComparison.OrdinalIgnoreCase))
                        editIsExcluded = false;
                    else
                        return (null, $"--is-excluded must be 'true' or 'false'. Got '{rawExcluded}'.");
                    break;

                case "--notes":
                    if (++i >= argv.Length) return (null, "--notes requires a value");
                    editNotes = argv[i];
                    break;

                // ── Slice C10-B — Mapping Workbook lock mode ────────────
                case "--lock-mapping-workbook":
                    lockMappingWorkbook = true;
                    break;

                // ── Slice C11-B — Mapping Workbook batch edit mode ──────
                case "--batch-edit-mapping-workbook":
                    batchEditMappingWorkbook = true;
                    break;

                case "--input-csv":
                    if (++i >= argv.Length) return (null, "--input-csv requires a value");
                    inputCsvPath = argv[i];
                    break;

                case "--dry-run":
                    batchEditDryRun = true;
                    break;

                case "--apply":
                    batchEditApply = true;
                    break;

                default:
                    return (null, $"unknown argument: '{arg}'");
            }
        }

        if (help)
        {
            return (new CliArgs(
                TerraFusionDbConnectionString:        string.Empty,
                CountyId:                              Guid.Empty,
                ConnectionId:                          null,
                OperatorId:                            operatorId,
                ShowHelp:                              true,
                DeepProfile:                           deepProfile,
                DeepProfileIncludeQualifiedNames:      deepProfileInclude,
                DeepProfileMaxTables:                  deepProfileMaxTables,
                GenerateMappingWorkbook:               generateMappingWorkbook,
                ProfileBatchId:                        profileBatchId,
                LatestProfileBatch:                    latestProfileBatch,
                WorkbookName:                          workbookName,
                ReplaceExistingDraft:                  replaceExistingDraft,
                MappingMaxCandidates:                  mappingMaxCandidates,
                ExportMappingWorkbook:                 exportMappingWorkbook,
                WorkbookId:                            workbookId,
                OutputDirectory:                       outputDirectory,
                ExportFormat:                          exportFormat,
                QualifySales:                          qualifySales,
                SourceConnectionId:                    sourceConnectionId,
                MaxSales:                              maxSales,
                EditMappingWorkbook:                   editMappingWorkbook,
                EditSourceSchema:                      editSourceSchema,
                EditSourceTable:                       editSourceTable,
                EditSourceColumn:                      editSourceColumn,
                EditSourceValue:                       editSourceValue,
                EditCanonicalTarget:                   editCanonicalTarget,
                EditCanonicalValue:                    editCanonicalValue,
                EditCanonicalValueNull:                editCanonicalValueNull,
                EditReviewStatus:                      editReviewStatus,
                EditIsExcluded:                        editIsExcluded,
                EditNotes:                             editNotes,
                LockMappingWorkbook:                   lockMappingWorkbook,
                BatchEditMappingWorkbook:              batchEditMappingWorkbook,
                InputCsvPath:                          inputCsvPath,
                BatchEditDryRun:                       batchEditDryRun,
                BatchEditApply:                        batchEditApply), null);
        }

        // ── Always-required, regardless of mode ─────────────────────────
        if (string.IsNullOrWhiteSpace(db)) return (null, "--db is required");
        if (!countyId.HasValue) return (null, "--county-id is required");
        if (string.IsNullOrWhiteSpace(operatorId)) return (null, "--operator must be non-empty when provided");

        // ── Seven-way mode mutex ────────────────────────────────────────
        // Profile (default) | Generate Workbook (C4) | Export Workbook (C5)
        // | Qualify Sales (C8-C) | Edit Workbook (C9-B) | Lock Workbook
        // (C10-B) | Batch Edit Workbook (C11-B) — at most one bool-toggle
        // can be on.
        var modeToggleCount =
            (generateMappingWorkbook   ? 1 : 0) +
            (exportMappingWorkbook     ? 1 : 0) +
            (qualifySales              ? 1 : 0) +
            (editMappingWorkbook       ? 1 : 0) +
            (lockMappingWorkbook       ? 1 : 0) +
            (batchEditMappingWorkbook  ? 1 : 0);
        if (modeToggleCount > 1)
        {
            return (null,
                "--generate-mapping-workbook, --export-mapping-workbook, --qualify-sales, " +
                "--edit-mapping-workbook, --lock-mapping-workbook, " +
                "and --batch-edit-mapping-workbook are mutually exclusive");
        }

        // ── Mode-mutual-exclusion: deep-profile flags only in profile mode ──
        if (generateMappingWorkbook || exportMappingWorkbook || qualifySales ||
            editMappingWorkbook || lockMappingWorkbook || batchEditMappingWorkbook)
        {
            var modeName =
                generateMappingWorkbook   ? "Mapping Workbook" :
                exportMappingWorkbook     ? "Mapping Workbook export" :
                qualifySales              ? "Sales qualification" :
                editMappingWorkbook       ? "Mapping Workbook edit" :
                lockMappingWorkbook       ? "Mapping Workbook lock" :
                                            "Mapping Workbook batch edit";
            if (deepProfile)
            {
                return (null, $"--deep-profile is not allowed in {modeName} mode");
            }
            if (deepProfileInclude.Count > 0)
            {
                return (null, $"--deep-profile-include is not allowed in {modeName} mode");
            }
            if (deepProfileMaxTables.HasValue)
            {
                return (null, $"--deep-profile-max-tables is not allowed in {modeName} mode");
            }
        }

        // ── Profile-mode-specific validation ────────────────────────────
        if (!generateMappingWorkbook && !exportMappingWorkbook && !qualifySales &&
            !editMappingWorkbook && !lockMappingWorkbook && !batchEditMappingWorkbook)
        {
            if (!connectionId.HasValue) return (null, "--connection-id is required");

            // Existing safety: --deep-profile-include / --max-tables only
            // make sense when deep-profile mode is on.
            if (!deepProfile && deepProfileInclude.Count > 0)
            {
                return (null, "--deep-profile-include requires --deep-profile");
            }
            if (!deepProfile && deepProfileMaxTables.HasValue)
            {
                return (null, "--deep-profile-max-tables requires --deep-profile");
            }

            // Workbook-generation flags must not appear in profile mode.
            if (profileBatchId.HasValue)
            {
                return (null, "--profile-batch-id requires --generate-mapping-workbook");
            }
            if (latestProfileBatch)
            {
                return (null, "--latest-profile-batch requires --generate-mapping-workbook");
            }
            if (workbookName is not null)
            {
                return (null, "--workbook-name requires --generate-mapping-workbook");
            }
            if (replaceExistingDraft)
            {
                return (null, "--replace-existing-draft requires --generate-mapping-workbook");
            }
            if (mappingMaxCandidates.HasValue)
            {
                return (null, "--mapping-max-candidates requires --generate-mapping-workbook");
            }

            // Export-mode flags must not appear in profile mode.
            if (workbookId.HasValue)
            {
                return (null, "--workbook-id requires --export-mapping-workbook or --qualify-sales");
            }
            if (outputDirectory is not null)
            {
                return (null, "--output-dir requires --export-mapping-workbook");
            }
            if (exportFormatExplicit)
            {
                return (null, "--format requires --export-mapping-workbook");
            }

            // Qualify-sales-mode flags must not appear in profile mode.
            if (sourceConnectionId.HasValue)
            {
                return (null, "--source-connection-id requires --qualify-sales");
            }
            if (maxSales.HasValue)
            {
                return (null, "--max-sales requires --qualify-sales");
            }

            // Edit-mode flags must not appear in profile mode.
            var editError = RejectEditModeFlags(
                editSourceSchema, editSourceValue, editCanonicalTarget,
                editCanonicalValue, editCanonicalValueNull, editReviewStatus,
                editIsExcluded, editNotes);
            if (editError is not null) return (null, editError);

            // Batch-edit-mode flags must not appear in profile mode.
            var batchError = RejectBatchEditModeFlags(inputCsvPath, batchEditDryRun, batchEditApply);
            if (batchError is not null) return (null, batchError);
        }
        else if (generateMappingWorkbook)
        {
            // ── Generate-workbook-mode-specific validation ─────────────
            if (string.IsNullOrWhiteSpace(workbookName))
            {
                return (null, "--workbook-name is required when --generate-mapping-workbook is set");
            }
            if (!profileBatchId.HasValue && !latestProfileBatch)
            {
                return (null, "--generate-mapping-workbook requires either --profile-batch-id or --latest-profile-batch");
            }
            if (profileBatchId.HasValue && latestProfileBatch)
            {
                return (null, "--profile-batch-id and --latest-profile-batch are mutually exclusive");
            }

            // Export-mode flags must not appear in generate mode.
            if (workbookId.HasValue)
            {
                return (null, "--workbook-id requires --export-mapping-workbook or --qualify-sales");
            }
            if (outputDirectory is not null)
            {
                return (null, "--output-dir requires --export-mapping-workbook");
            }
            if (exportFormatExplicit)
            {
                return (null, "--format requires --export-mapping-workbook");
            }

            // Qualify-sales flags must not appear in generate mode.
            if (sourceConnectionId.HasValue)
            {
                return (null, "--source-connection-id requires --qualify-sales");
            }
            if (maxSales.HasValue)
            {
                return (null, "--max-sales requires --qualify-sales");
            }
            // --connection-id is irrelevant in workbook mode (loader
            // resolves it from the profile batch). Tolerate its presence —
            // an operator with both flags set should not be punished — but
            // it is not required.

            // Edit-mode flags must not appear in generate mode.
            var editError = RejectEditModeFlags(
                editSourceSchema, editSourceValue, editCanonicalTarget,
                editCanonicalValue, editCanonicalValueNull, editReviewStatus,
                editIsExcluded, editNotes);
            if (editError is not null) return (null, editError);

            // Batch-edit-mode flags must not appear in generate mode.
            var batchError = RejectBatchEditModeFlags(inputCsvPath, batchEditDryRun, batchEditApply);
            if (batchError is not null) return (null, batchError);
        }
        else if (exportMappingWorkbook)
        {
            // ── Export-workbook-mode-specific validation (C5) ──────────
            if (!workbookId.HasValue)
            {
                return (null, "--workbook-id is required when --export-mapping-workbook is set");
            }
            if (string.IsNullOrWhiteSpace(outputDirectory))
            {
                return (null, "--output-dir is required when --export-mapping-workbook is set");
            }

            // Generate-mode flags must not appear in export mode.
            if (profileBatchId.HasValue)
            {
                return (null, "--profile-batch-id requires --generate-mapping-workbook");
            }
            if (latestProfileBatch)
            {
                return (null, "--latest-profile-batch requires --generate-mapping-workbook");
            }
            if (workbookName is not null)
            {
                return (null, "--workbook-name requires --generate-mapping-workbook");
            }
            if (replaceExistingDraft)
            {
                return (null, "--replace-existing-draft requires --generate-mapping-workbook");
            }
            if (mappingMaxCandidates.HasValue)
            {
                return (null, "--mapping-max-candidates requires --generate-mapping-workbook");
            }

            // Qualify-sales flags must not appear in export mode.
            if (sourceConnectionId.HasValue)
            {
                return (null, "--source-connection-id requires --qualify-sales");
            }
            if (maxSales.HasValue)
            {
                return (null, "--max-sales requires --qualify-sales");
            }

            // Edit-mode flags must not appear in export mode.
            var editError = RejectEditModeFlags(
                editSourceSchema, editSourceValue, editCanonicalTarget,
                editCanonicalValue, editCanonicalValueNull, editReviewStatus,
                editIsExcluded, editNotes);
            if (editError is not null) return (null, editError);

            // Batch-edit-mode flags must not appear in export mode.
            var batchError = RejectBatchEditModeFlags(inputCsvPath, batchEditDryRun, batchEditApply);
            if (batchError is not null) return (null, batchError);
        }
        else if (qualifySales)
        {
            // ── Qualify-sales-mode-specific validation (C8-C) ──────────
            if (!workbookId.HasValue)
            {
                return (null, "--workbook-id is required when --qualify-sales is set");
            }
            if (!sourceConnectionId.HasValue)
            {
                return (null, "--source-connection-id is required when --qualify-sales is set");
            }
            if (!maxSales.HasValue)
            {
                return (null, "--max-sales is required when --qualify-sales is set");
            }

            // Generate-mode flags must not appear in qualify mode.
            if (profileBatchId.HasValue)
            {
                return (null, "--profile-batch-id requires --generate-mapping-workbook");
            }
            if (latestProfileBatch)
            {
                return (null, "--latest-profile-batch requires --generate-mapping-workbook");
            }
            if (workbookName is not null)
            {
                return (null, "--workbook-name requires --generate-mapping-workbook");
            }
            if (replaceExistingDraft)
            {
                return (null, "--replace-existing-draft requires --generate-mapping-workbook");
            }
            if (mappingMaxCandidates.HasValue)
            {
                return (null, "--mapping-max-candidates requires --generate-mapping-workbook");
            }

            // Export-mode flags must not appear in qualify mode.
            if (outputDirectory is not null)
            {
                return (null, "--output-dir requires --export-mapping-workbook");
            }
            if (exportFormatExplicit)
            {
                return (null, "--format requires --export-mapping-workbook");
            }

            // Edit-mode flags must not appear in qualify mode.
            var editError = RejectEditModeFlags(
                editSourceSchema, editSourceValue, editCanonicalTarget,
                editCanonicalValue, editCanonicalValueNull, editReviewStatus,
                editIsExcluded, editNotes);
            if (editError is not null) return (null, editError);

            // Batch-edit-mode flags must not appear in qualify mode.
            var batchError = RejectBatchEditModeFlags(inputCsvPath, batchEditDryRun, batchEditApply);
            if (batchError is not null) return (null, batchError);
        }
        else if (editMappingWorkbook)
        {
            // ── Edit-mode-specific validation (C9-B) ───────────────────
            if (!workbookId.HasValue)
            {
                return (null, "--workbook-id is required when --edit-mapping-workbook is set");
            }
            if (editSourceSchema is null)
            {
                return (null, "--source is required when --edit-mapping-workbook is set");
            }
            // At-least-one mutation field — Hard Guard #4 from C9-A.
            var anyMutation =
                editCanonicalTarget    is not null ||
                editCanonicalValue     is not null ||
                editCanonicalValueNull                ||
                editReviewStatus       is not null ||
                editIsExcluded.HasValue               ||
                editNotes              is not null;
            if (!anyMutation)
            {
                return (null,
                    "--edit-mapping-workbook requires at least one mutation field " +
                    "(--canonical-target / --canonical-value / --canonical-value-null / " +
                    "--review-status / --is-excluded / --notes)");
            }

            // Mutex: --canonical-value and --canonical-value-null.
            if (editCanonicalValue is not null && editCanonicalValueNull)
            {
                return (null, "--canonical-value and --canonical-value-null are mutually exclusive");
            }

            // Scope-correct fields — Hard Guard #5 from C9-A.
            var isCodeValueScope = editSourceValue is not null;
            if (isCodeValueScope)
            {
                if (editCanonicalTarget is not null)
                {
                    return (null,
                        "--canonical-target is column-scope only and cannot be combined with --source-value");
                }
            }
            else
            {
                if (editCanonicalValue is not null)
                {
                    return (null,
                        "--canonical-value is code-value-scope only — supply --source-value alongside it");
                }
                if (editCanonicalValueNull)
                {
                    return (null,
                        "--canonical-value-null is code-value-scope only — supply --source-value alongside it");
                }
                if (editIsExcluded.HasValue)
                {
                    return (null,
                        "--is-excluded is code-value-scope only — supply --source-value alongside it");
                }
            }

            // Other modes' flags must not appear in edit mode.
            if (profileBatchId.HasValue)
            {
                return (null, "--profile-batch-id requires --generate-mapping-workbook");
            }
            if (latestProfileBatch)
            {
                return (null, "--latest-profile-batch requires --generate-mapping-workbook");
            }
            if (workbookName is not null)
            {
                return (null, "--workbook-name requires --generate-mapping-workbook");
            }
            if (replaceExistingDraft)
            {
                return (null, "--replace-existing-draft requires --generate-mapping-workbook");
            }
            if (mappingMaxCandidates.HasValue)
            {
                return (null, "--mapping-max-candidates requires --generate-mapping-workbook");
            }
            if (outputDirectory is not null)
            {
                return (null, "--output-dir requires --export-mapping-workbook");
            }
            if (exportFormatExplicit)
            {
                return (null, "--format requires --export-mapping-workbook");
            }
            if (sourceConnectionId.HasValue)
            {
                return (null, "--source-connection-id requires --qualify-sales");
            }
            if (maxSales.HasValue)
            {
                return (null, "--max-sales requires --qualify-sales");
            }

            // Batch-edit-mode flags must not appear in edit mode.
            var batchError = RejectBatchEditModeFlags(inputCsvPath, batchEditDryRun, batchEditApply);
            if (batchError is not null) return (null, batchError);
        }
        else if (lockMappingWorkbook)
        {
            // ── Lock-mode-specific validation (C10-B) ──────────────────
            // Hard Guards from the C10-A policy doc:
            //   1. Status='Draft' only          — enforced by C6 service.
            //   2. County scope                 — enforced by C6 service.
            //   3. Workbook completeness        — enforced by C6 service.
            //   4. One-shot, no --unlock        — there is no unlock flag.
            // The parser's job is the surface contract: --workbook-id is
            // mandatory; no other mode's flags may appear.
            if (!workbookId.HasValue)
            {
                return (null, "--workbook-id is required when --lock-mapping-workbook is set");
            }

            // Generate-mode flags must not appear in lock mode.
            if (profileBatchId.HasValue)
            {
                return (null, "--profile-batch-id requires --generate-mapping-workbook");
            }
            if (latestProfileBatch)
            {
                return (null, "--latest-profile-batch requires --generate-mapping-workbook");
            }
            if (workbookName is not null)
            {
                return (null, "--workbook-name requires --generate-mapping-workbook");
            }
            if (replaceExistingDraft)
            {
                return (null, "--replace-existing-draft requires --generate-mapping-workbook");
            }
            if (mappingMaxCandidates.HasValue)
            {
                return (null, "--mapping-max-candidates requires --generate-mapping-workbook");
            }

            // Export-mode flags must not appear in lock mode.
            if (outputDirectory is not null)
            {
                return (null, "--output-dir requires --export-mapping-workbook");
            }
            if (exportFormatExplicit)
            {
                return (null, "--format requires --export-mapping-workbook");
            }

            // Qualify-sales flags must not appear in lock mode.
            if (sourceConnectionId.HasValue)
            {
                return (null, "--source-connection-id requires --qualify-sales");
            }
            if (maxSales.HasValue)
            {
                return (null, "--max-sales requires --qualify-sales");
            }

            // Edit-mode flags must not appear in lock mode.
            var editError = RejectEditModeFlags(
                editSourceSchema, editSourceValue, editCanonicalTarget,
                editCanonicalValue, editCanonicalValueNull, editReviewStatus,
                editIsExcluded, editNotes);
            if (editError is not null) return (null, editError);

            // Batch-edit-mode flags must not appear in lock mode.
            var batchError = RejectBatchEditModeFlags(inputCsvPath, batchEditDryRun, batchEditApply);
            if (batchError is not null) return (null, batchError);
            // --connection-id is irrelevant in lock mode (lock service
            // never queries PACS). Tolerate its presence the same way
            // generate/export modes tolerate it — surface contract is
            // about preventing operator confusion, not punishing extra
            // bytes that the lock path ignores anyway.
        }
        else
        {
            // ── Batch-edit-mode-specific validation (C11-B) ────────────
            // Hard Guards from the C11-A policy doc:
            //   1. Status='Draft' only           — enforced by C11-B service.
            //   2. County scope                  — enforced by C11-B service.
            //   3. All-or-nothing atomicity      — enforced by C11-B service.
            //   4. No auto-exclusion (WacCd)     — enforced by C11-B service.
            // The parser's job is the surface contract: --workbook-id,
            // --input-csv, and exactly one of --dry-run / --apply.
            if (!workbookId.HasValue)
            {
                return (null, "--workbook-id is required when --batch-edit-mapping-workbook is set");
            }
            if (string.IsNullOrWhiteSpace(inputCsvPath))
            {
                return (null, "--input-csv is required when --batch-edit-mapping-workbook is set");
            }
            if (batchEditDryRun && batchEditApply)
            {
                return (null, "--dry-run and --apply are mutually exclusive");
            }
            if (!batchEditDryRun && !batchEditApply)
            {
                return (null,
                    "--batch-edit-mapping-workbook requires exactly one of --dry-run or --apply");
            }

            // Generate-mode flags must not appear in batch-edit mode.
            if (profileBatchId.HasValue)
            {
                return (null, "--profile-batch-id requires --generate-mapping-workbook");
            }
            if (latestProfileBatch)
            {
                return (null, "--latest-profile-batch requires --generate-mapping-workbook");
            }
            if (workbookName is not null)
            {
                return (null, "--workbook-name requires --generate-mapping-workbook");
            }
            if (replaceExistingDraft)
            {
                return (null, "--replace-existing-draft requires --generate-mapping-workbook");
            }
            if (mappingMaxCandidates.HasValue)
            {
                return (null, "--mapping-max-candidates requires --generate-mapping-workbook");
            }

            // Export-mode flags must not appear in batch-edit mode.
            if (outputDirectory is not null)
            {
                return (null, "--output-dir requires --export-mapping-workbook");
            }
            if (exportFormatExplicit)
            {
                return (null, "--format requires --export-mapping-workbook");
            }

            // Qualify-sales flags must not appear in batch-edit mode.
            if (sourceConnectionId.HasValue)
            {
                return (null, "--source-connection-id requires --qualify-sales");
            }
            if (maxSales.HasValue)
            {
                return (null, "--max-sales requires --qualify-sales");
            }

            // Single-row edit-mode flags must not appear in batch-edit
            // mode — the per-row mutations come from the CSV, not the
            // command line.
            var editError = RejectEditModeFlags(
                editSourceSchema, editSourceValue, editCanonicalTarget,
                editCanonicalValue, editCanonicalValueNull, editReviewStatus,
                editIsExcluded, editNotes);
            if (editError is not null) return (null, editError);
        }

        return (new CliArgs(
            TerraFusionDbConnectionString:        db!,
            CountyId:                              countyId.Value,
            ConnectionId:                          connectionId,
            OperatorId:                            operatorId,
            ShowHelp:                              false,
            DeepProfile:                           deepProfile,
            DeepProfileIncludeQualifiedNames:      deepProfileInclude,
            DeepProfileMaxTables:                  deepProfileMaxTables,
            GenerateMappingWorkbook:               generateMappingWorkbook,
            ProfileBatchId:                        profileBatchId,
            LatestProfileBatch:                    latestProfileBatch,
            WorkbookName:                          workbookName,
            ReplaceExistingDraft:                  replaceExistingDraft,
            MappingMaxCandidates:                  mappingMaxCandidates,
            ExportMappingWorkbook:                 exportMappingWorkbook,
            WorkbookId:                            workbookId,
            OutputDirectory:                       outputDirectory,
            ExportFormat:                          exportFormat,
            QualifySales:                          qualifySales,
            SourceConnectionId:                    sourceConnectionId,
            MaxSales:                              maxSales,
            EditMappingWorkbook:                   editMappingWorkbook,
            EditSourceSchema:                      editSourceSchema,
            EditSourceTable:                       editSourceTable,
            EditSourceColumn:                      editSourceColumn,
            EditSourceValue:                       editSourceValue,
            EditCanonicalTarget:                   editCanonicalTarget,
            EditCanonicalValue:                    editCanonicalValue,
            EditCanonicalValueNull:                editCanonicalValueNull,
            EditReviewStatus:                      editReviewStatus,
            EditIsExcluded:                        editIsExcluded,
            EditNotes:                             editNotes,
            LockMappingWorkbook:                   lockMappingWorkbook,
            BatchEditMappingWorkbook:              batchEditMappingWorkbook,
            InputCsvPath:                          inputCsvPath,
            BatchEditDryRun:                       batchEditDryRun,
            BatchEditApply:                        batchEditApply), null);
    }

    public static string UsageText => @"
SyncAtlas — Database Atlas profiler CLI

Usage (profile mode — default):
  SyncAtlas --db <terrafusion-connection-string> \
            --county-id <guid> \
            --connection-id <guid> \
            [--operator <name>] \
            [--deep-profile [--deep-profile-include <schema.table[,...]>] [--deep-profile-max-tables <n>]]

Usage (Mapping Workbook draft mode — Slice C4):
  SyncAtlas --db <terrafusion-connection-string> \
            --county-id <guid> \
            --generate-mapping-workbook \
            (--profile-batch-id <guid> | --latest-profile-batch) \
            --workbook-name <name> \
            [--replace-existing-draft] \
            [--mapping-max-candidates <n>] \
            [--operator <name>]

Usage (Mapping Workbook export mode — Slice C5):
  SyncAtlas --db <terrafusion-connection-string> \
            --county-id <guid> \
            --export-mapping-workbook \
            --workbook-id <guid> \
            --output-dir <path> \
            [--format csv|md|both] \
            [--operator <name>]

Usage (Sales qualification sample runner — Slice C8-C, read-only):
  SyncAtlas --db <terrafusion-connection-string> \
            --county-id <guid> \
            --qualify-sales \
            --workbook-id <guid> \
            --source-connection-id <guid> \
            --max-sales <n> \
            [--operator <name>]

Usage (Mapping Workbook edit — Slice C9-B, Draft-only mutation):
  SyncAtlas --db <terrafusion-connection-string> \
            --county-id <guid> \
            --edit-mapping-workbook \
            --workbook-id <guid> \
            --source <schema.table.column> \
            [--source-value <text>] \
            [--canonical-target <text>] \
            [--canonical-value <text> | --canonical-value-null] \
            [--review-status <NeedsReview|InProgress|Mapped|Excluded|Deferred>] \
            [--is-excluded true|false] \
            [--notes <text>] \
            [--operator <name>]

Usage (Mapping Workbook lock — Slice C10-B, one-shot Draft→Mapped):
  SyncAtlas --db <terrafusion-connection-string> \
            --county-id <guid> \
            --lock-mapping-workbook \
            --workbook-id <guid> \
            [--operator <name>]
  Lock refuses to flip Status unless every column AND every code-value
  is in a terminal review status (Mapped / Excluded / Deferred). There
  is no --unlock flag; lock is one-shot.

Usage (Mapping Workbook batch edit — Slice C11-B, all-or-nothing CSV):
  SyncAtlas --db <terrafusion-connection-string> \
            --county-id <guid> \
            --batch-edit-mapping-workbook \
            --workbook-id <guid> \
            --input-csv <path> \
            (--dry-run | --apply) \
            [--operator <name>]
  Apply mode runs every CSV row through the same validation pipeline
  as --edit-mapping-workbook, in a single transaction. If any row
  fails validation, zero rows mutate. Dry-run validates without
  mutating. Required CSV columns: scope, source_schema, source_table,
  source_column, source_value, review_status. Optional: canonical_target,
  canonical_value, canonical_value_null, is_excluded, notes.

Required (always):
  --db              Postgres connection string for the TerraFusion DB.
  --county-id       CountyId scoping the run.

Required (profile mode):
  --connection-id   SyncSourceConnection.Id to profile (must belong to county-id).

Required (Mapping Workbook mode):
  --generate-mapping-workbook   Switch into Mapping-Workbook mode.
  --workbook-name               Workbook label, unique per county.
  --profile-batch-id  | --latest-profile-batch
                                Pick the seeding batch explicitly OR resolve
                                to the latest successful profile batch.

Required (Mapping Workbook export mode):
  --export-mapping-workbook     Switch into export mode.
  --workbook-id                 Mapping workbook to export.
  --output-dir                  Directory to write export files into
                                (created if missing; existing files
                                overwritten).

Required (Sales qualification sample runner — read-only):
  --qualify-sales               Switch into the read-only sales sample mode.
  --workbook-id                 Mapped (Status='Mapped') workbook to consult.
                                Draft / InProgress / Approved / Archived
                                workbooks fail closed at the read model.
  --source-connection-id        SyncSourceConnection.Id pointing at the
                                PACS server to read sales rows from.
                                Must belong to --county-id.
  --max-sales                   Bounded TOP-N for the PACS sale read.
                                Positive integer.

Optional:
  --operator                  Operator id stamped on audit fields. Default: 'cli-operator'.

Profile-mode optional:
  --deep-profile              Also run the B2 deep-profile pass after the structural atlas:
                              sample-based row counts, null %, distinct counts, top values,
                              and code-candidate detection per discovered table.
  --deep-profile-include      Comma-separated qualified names ('schema.table') to limit the
                              deep pass to. Requires --deep-profile.
  --deep-profile-max-tables   Cap the deep pass at the first N tables. Requires --deep-profile.

Mapping-workbook-mode optional:
  --replace-existing-draft    When the named workbook exists with Status='Draft', wipe its
                              contents and re-materialize from the current candidate set.
                              Non-Draft workbooks (Mapped/Approved/Archived) are NEVER
                              touched, with or without this flag.
  --mapping-max-candidates    Cap the candidate iteration at the first N candidates after
                              deterministic (schema, table, column) sort. Positive integer.

Mapping-workbook-export-mode optional:
  --format <csv|md|both>      What to write. Default: 'both'.
                              csv  — mapping-workbook-columns.csv +
                                     mapping-workbook-code-values.csv
                              md   — mapping-workbook-review.md
                              both — all three.

  --help, -h, /?              Show this message and exit.

Examples:

  Profile (structural only):
    SyncAtlas \
      --db ""Host=localhost;Port=5432;Database=terrafusion;Username=postgres;Password=devpassword123"" \
      --county-id 11111111-2222-3333-4444-555555555555 \
      --connection-id aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee

  Profile (bounded deep-profile smoke):
    SyncAtlas \
      --db ""..."" \
      --county-id 11111111-2222-3333-4444-555555555555 \
      --connection-id aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee \
      --deep-profile \
      --deep-profile-max-tables 25

  Mapping Workbook (latest batch):
    SyncAtlas \
      --db ""..."" \
      --county-id 11111111-2222-3333-4444-555555555555 \
      --generate-mapping-workbook \
      --latest-profile-batch \
      --workbook-name ""Benton PACS OLTP Mapping Workbook""

  Mapping Workbook (explicit batch + replace):
    SyncAtlas \
      --db ""..."" \
      --county-id 11111111-2222-3333-4444-555555555555 \
      --generate-mapping-workbook \
      --profile-batch-id 6342a924-c235-43d5-b68c-0c0a70ead1e2 \
      --workbook-name ""Benton PACS OLTP Mapping Workbook"" \
      --replace-existing-draft
";
}
