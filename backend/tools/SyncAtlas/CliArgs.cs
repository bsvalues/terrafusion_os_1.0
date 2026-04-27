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
    bool DeepProfile);

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

                default:
                    return (null, $"unknown argument: '{arg}'");
            }
        }

        if (help)
        {
            return (new CliArgs(string.Empty, Guid.Empty, Guid.Empty, operatorId, ShowHelp: true, DeepProfile: deepProfile), null);
        }

        if (string.IsNullOrWhiteSpace(db)) return (null, "--db is required");
        if (!countyId.HasValue) return (null, "--county-id is required");
        if (!connectionId.HasValue) return (null, "--connection-id is required");
        if (string.IsNullOrWhiteSpace(operatorId)) return (null, "--operator must be non-empty when provided");

        return (new CliArgs(db, countyId.Value, connectionId.Value, operatorId, ShowHelp: false, DeepProfile: deepProfile), null);
    }

    public static string UsageText => @"
SyncAtlas — Database Atlas profiler CLI

Usage:
  SyncAtlas --db <terrafusion-connection-string> \
            --county-id <guid> \
            --connection-id <guid> \
            [--operator <name>] \
            [--deep-profile]

Required:
  --db              Postgres connection string for the TerraFusion DB.
  --county-id       CountyId scoping the profile run.
  --connection-id   SyncSourceConnection.Id to profile (must belong to county-id).

Optional:
  --operator        Operator id stamped on audit fields. Default: 'cli-operator'.
  --deep-profile    Also run the B2 deep-profile pass after the structural atlas:
                    sample-based row counts, null %, distinct counts, top values,
                    and code-candidate detection per discovered table. Off by
                    default — adds runtime proportional to (table count, sample
                    size). Persists into SyncProfileTableStats / ColumnStats /
                    CodeCandidate tables.
  --help, -h, /?    Show this message and exit.

Example:
  SyncAtlas \
    --db ""Host=localhost;Port=5432;Database=terrafusion;Username=postgres;Password=devpassword123"" \
    --county-id 11111111-2222-3333-4444-555555555555 \
    --connection-id aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee \
    --deep-profile
";
}
