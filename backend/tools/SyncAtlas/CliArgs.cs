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
    string ExportFormat);

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
                ExportFormat:                          exportFormat), null);
        }

        // ── Always-required, regardless of mode ─────────────────────────
        if (string.IsNullOrWhiteSpace(db)) return (null, "--db is required");
        if (!countyId.HasValue) return (null, "--county-id is required");
        if (string.IsNullOrWhiteSpace(operatorId)) return (null, "--operator must be non-empty when provided");

        // ── Three-way mode mutex ────────────────────────────────────────
        // Profile (default) | Generate Workbook (C4) | Export Workbook (C5)
        // are mutually exclusive — at most one bool-toggle can be on.
        if (generateMappingWorkbook && exportMappingWorkbook)
        {
            return (null, "--generate-mapping-workbook and --export-mapping-workbook are mutually exclusive");
        }

        // ── Mode-mutual-exclusion: deep-profile flags only in profile mode ──
        if (generateMappingWorkbook || exportMappingWorkbook)
        {
            var modeName = generateMappingWorkbook ? "Mapping Workbook" : "Mapping Workbook export";
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
        if (!generateMappingWorkbook && !exportMappingWorkbook)
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
                return (null, "--workbook-id requires --export-mapping-workbook");
            }
            if (outputDirectory is not null)
            {
                return (null, "--output-dir requires --export-mapping-workbook");
            }
            if (exportFormatExplicit)
            {
                return (null, "--format requires --export-mapping-workbook");
            }
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
                return (null, "--workbook-id requires --export-mapping-workbook");
            }
            if (outputDirectory is not null)
            {
                return (null, "--output-dir requires --export-mapping-workbook");
            }
            if (exportFormatExplicit)
            {
                return (null, "--format requires --export-mapping-workbook");
            }
            // --connection-id is irrelevant in workbook mode (loader
            // resolves it from the profile batch). Tolerate its presence —
            // an operator with both flags set should not be punished — but
            // it is not required.
        }
        else
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
            ExportFormat:                          exportFormat), null);
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
