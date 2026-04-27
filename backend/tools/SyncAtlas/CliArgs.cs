namespace TerraFusion.Tools.SyncAtlas;

/// <summary>
/// Parsed command-line arguments for the SyncAtlas CLI.
/// </summary>
public sealed record CliArgs(
    string TerraFusionDbConnectionString,
    Guid CountyId,
    Guid ConnectionId,
    string OperatorId,
    bool ShowHelp,
    bool DeepProfile,
    IReadOnlyList<string> DeepProfileIncludeQualifiedNames,
    int? DeepProfileMaxTables);

/// <summary>
/// Pure argument parser. No I/O, no environment access — easy to unit test.
///
/// Recognized flags (all required unless marked optional):
///   --db &lt;connection-string&gt;       TerraFusion Postgres connection string
///   --county-id &lt;guid&gt;            CountyId scoping the profile run
///   --connection-id &lt;guid&gt;        SyncSourceConnection.Id to profile
///   --operator &lt;name&gt;             Operator id stamped on audit fields (optional, default "cli-operator")
///   --deep-profile                Optional: also run the B2 deep-profile pass
///                                  after the structural atlas, populating the
///                                  SyncProfileTableStats / ColumnStats /
///                                  CodeCandidate tables. Defaults to off
///                                  because the deep pass scans real source
///                                  rows (sample-based) and adds runtime.
///   --deep-profile-include &lt;list&gt; Optional, requires --deep-profile. Comma-
///                                  separated list of qualified names like
///                                  "schema.table" — the deep pass will only
///                                  profile tables in this allowlist. Names
///                                  that don't match the structural batch
///                                  are silently dropped (typo-tolerant).
///   --deep-profile-max-tables &lt;n&gt; Optional, requires --deep-profile.
///                                  Caps the deep-profile iteration at the
///                                  first N tables (after include filter +
///                                  deterministic schema/name ordering).
///                                  Truncated tables show up as Skipped in
///                                  the summary. N must be a positive int.
///   --help, -h, /?                Print usage and exit
///
/// Returns (CliArgs, null) on success, (null, errorMessage) on parse failure.
/// </summary>
public static class CliArgsParser
{
    public const string DefaultOperatorId = "cli-operator";

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

                default:
                    return (null, $"unknown argument: '{arg}'");
            }
        }

        if (help)
        {
            return (new CliArgs(
                TerraFusionDbConnectionString:        string.Empty,
                CountyId:                              Guid.Empty,
                ConnectionId:                          Guid.Empty,
                OperatorId:                            operatorId,
                ShowHelp:                              true,
                DeepProfile:                           deepProfile,
                DeepProfileIncludeQualifiedNames:      deepProfileInclude,
                DeepProfileMaxTables:                  deepProfileMaxTables), null);
        }

        if (string.IsNullOrWhiteSpace(db)) return (null, "--db is required");
        if (!countyId.HasValue) return (null, "--county-id is required");
        if (!connectionId.HasValue) return (null, "--connection-id is required");
        if (string.IsNullOrWhiteSpace(operatorId)) return (null, "--operator must be non-empty when provided");

        // Safety: --deep-profile-include and --deep-profile-max-tables only
        // make sense when deep-profile mode is on. A bare run with neither
        // doesn't mean anything and would silently no-op past the structural
        // pass — surface the misuse early.
        if (!deepProfile && deepProfileInclude.Count > 0)
        {
            return (null, "--deep-profile-include requires --deep-profile");
        }
        if (!deepProfile && deepProfileMaxTables.HasValue)
        {
            return (null, "--deep-profile-max-tables requires --deep-profile");
        }

        return (new CliArgs(
            TerraFusionDbConnectionString:        db,
            CountyId:                              countyId.Value,
            ConnectionId:                          connectionId.Value,
            OperatorId:                            operatorId,
            ShowHelp:                              false,
            DeepProfile:                           deepProfile,
            DeepProfileIncludeQualifiedNames:      deepProfileInclude,
            DeepProfileMaxTables:                  deepProfileMaxTables), null);
    }

    public static string UsageText => @"
SyncAtlas — Database Atlas profiler CLI

Usage:
  SyncAtlas --db <terrafusion-connection-string> \
            --county-id <guid> \
            --connection-id <guid> \
            [--operator <name>] \
            [--deep-profile [--deep-profile-include <schema.table[,...]>] [--deep-profile-max-tables <n>]]

Required:
  --db              Postgres connection string for the TerraFusion DB.
  --county-id       CountyId scoping the profile run.
  --connection-id   SyncSourceConnection.Id to profile (must belong to county-id).

Optional:
  --operator                  Operator id stamped on audit fields. Default: 'cli-operator'.
  --deep-profile              Also run the B2 deep-profile pass after the structural atlas:
                              sample-based row counts, null %, distinct counts, top values,
                              and code-candidate detection per discovered table. Off by
                              default — adds runtime proportional to (table count, sample
                              size). Persists into SyncProfileTableStats / ColumnStats /
                              CodeCandidate tables.
  --deep-profile-include      Comma-separated qualified names ('schema.table') to limit the
                              deep pass to. Tables not in the list are skipped. Names that
                              don't match anything in the structural batch are silently
                              dropped (typo-tolerant). Requires --deep-profile.
  --deep-profile-max-tables   Cap the deep pass at the first N tables (after include filter
                              and the deterministic schema/name ordering). Tables truncated
                              by the cap appear as Skipped in the summary. Must be a
                              positive integer. Requires --deep-profile.
  --help, -h, /?              Show this message and exit.

Examples:

  Structural only:
    SyncAtlas \
      --db ""Host=localhost;Port=5432;Database=terrafusion;Username=postgres;Password=devpassword123"" \
      --county-id 11111111-2222-3333-4444-555555555555 \
      --connection-id aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee

  Bounded smoke (first 25 tables of the deep pass):
    SyncAtlas \
      --db ""..."" \
      --county-id 11111111-2222-3333-4444-555555555555 \
      --connection-id aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee \
      --deep-profile \
      --deep-profile-max-tables 25

  Targeted (just three known tables):
    SyncAtlas \
      --db ""..."" \
      --county-id 11111111-2222-3333-4444-555555555555 \
      --connection-id aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee \
      --deep-profile \
      --deep-profile-include dbo.property,dbo.property_val,dbo.sale
";
}
