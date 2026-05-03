using System.Globalization;

namespace TerraFusion.Tools.SalesCompProof;

/// <summary>
/// Slice C37-C: CLI args + parser for the live-PACS comp-eligibility
/// proof tool. Pure parser, no I/O — easy to keep in lockstep with
/// the proof shape.
/// </summary>
public sealed record CliArgs(
    string TerraFusionDbConnectionString,
    Guid CountyId,
    Guid? WorkbookId,
    Guid SourceConnectionId,
    int  MaxSales,
    string OperatorId,
    bool ShowHelp)
{
    public static (CliArgs? Args, string? Error) Parse(string[] argv)
    {
        if (argv.Length == 0)
        {
            return (null, "no arguments. Use --help for usage.");
        }

        string? db          = null;
        Guid?   countyId    = null;
        Guid?   workbookId  = null;
        Guid?   connId      = null;
        int?    maxSales    = null;
        string  op          = "c37c-live-proof";
        var     showHelp    = false;

        for (var i = 0; i < argv.Length; i++)
        {
            var a = argv[i];
            switch (a)
            {
                case "--help":
                case "-h":
                    showHelp = true;
                    break;
                case "--db":
                    if (++i >= argv.Length) return (null, "--db requires a value");
                    db = argv[i];
                    break;
                case "--county-id":
                    if (++i >= argv.Length) return (null, "--county-id requires a value");
                    if (!Guid.TryParse(argv[i], out var c)) return (null, $"--county-id: not a guid: {argv[i]}");
                    countyId = c;
                    break;
                case "--workbook-id":
                    if (++i >= argv.Length) return (null, "--workbook-id requires a value");
                    if (!Guid.TryParse(argv[i], out var w)) return (null, $"--workbook-id: not a guid: {argv[i]}");
                    workbookId = w;
                    break;
                case "--source-connection-id":
                    if (++i >= argv.Length) return (null, "--source-connection-id requires a value");
                    if (!Guid.TryParse(argv[i], out var s)) return (null, $"--source-connection-id: not a guid: {argv[i]}");
                    connId = s;
                    break;
                case "--max-sales":
                    if (++i >= argv.Length) return (null, "--max-sales requires a value");
                    if (!int.TryParse(argv[i], NumberStyles.Integer, CultureInfo.InvariantCulture, out var m) || m <= 0)
                    {
                        return (null, $"--max-sales: must be a positive integer, got: {argv[i]}");
                    }
                    maxSales = m;
                    break;
                case "--operator":
                    if (++i >= argv.Length) return (null, "--operator requires a value");
                    op = argv[i];
                    break;
                default:
                    return (null, $"unknown flag: {a}");
            }
        }

        if (showHelp)
        {
            return (new CliArgs("", Guid.Empty, WorkbookId: null, Guid.Empty, 0, op, ShowHelp: true), null);
        }

        if (string.IsNullOrWhiteSpace(db))            return (null, "--db is required");
        if (countyId is null)                          return (null, "--county-id is required");
        // --workbook-id is OPTIONAL per C42-A. When omitted, the
        // runner resolves the active workbook via
        // ISyncCountyActiveWorkbookService and fails closed if none
        // is configured.
        if (connId is null)                            return (null, "--source-connection-id is required");
        if (maxSales is null)                          return (null, "--max-sales is required");

        return (new CliArgs(db!, countyId.Value, workbookId, connId.Value, maxSales.Value, op, ShowHelp: false), null);
    }

    public static string UsageText =>
"""
sales-comp-proof — Slice C37-C live-PACS comp-eligibility proof

Drives the C36 SalesQualificationCanonicalRunner against live PACS, then
queries the C37 SalesCompEligibilityReader for the resulting comp pool.
Emits an evidence pair (JSON + Markdown) to:
    os-platform/core/pilot/evidence/
        c37-comp-eligibility-live-proof.<UTC>.json
        c37-comp-eligibility-live-proof.<UTC>.md
        c37-comp-eligibility-live-proof.latest.json
        c37-comp-eligibility-live-proof.latest.md

Read-only against PACS. Writes only to TerraFusion's
CanonicalSaleQualifications table (idempotent per (CountyId, ChgOfOwnerId))
and to disk for evidence. Workbook is never mutated.

Required flags
  --db <connection-string>          TerraFusion Postgres connection string
  --county-id <guid>                Sovereign-county scope
  --source-connection-id <guid>     An active SyncSourceConnection in that
                                    county pointing at PACS (SQL Server)
  --max-sales <n>                   TOP-N bound for the live PACS read

Optional
  --workbook-id <guid>              A Mapped workbook in that county. When
                                    omitted, the tool resolves the county
                                    active-workbook pointer (C41-B). Fails
                                    closed if no pointer is configured.
                                    Explicit --workbook-id takes precedence
                                    and bypasses the pointer.
  --operator <name>                 Audit-stamp identifier
                                    (default: c37c-live-proof)
  --help, -h                        Print this usage and exit

Exit codes
  0  proof completed; reconciliation passed; evidence written
  1  argument parse failure
  2  runtime failure (workbook not Mapped, connection inactive,
     PACS unreachable, EF error, no active-workbook pointer when
     --workbook-id was omitted)
  3  operator cancelled (Ctrl+C)
  4  reconciliation rule failed (evidence still written for audit)

PACS credential handling: SQL Auth passwords come from the operator's
process environment via EnvironmentSecretResolver, exactly the same wiring
as B1.6.5 / C8-C / C36 in production. Never plaintext on the entity, never
in command-line args.

Example (Benton; explicit workbook id, the locked Path 1 destination):
  sales-comp-proof \
      --db                    "Host=localhost;Database=terrafusion;..." \
      --county-id             eb94de6d-973f-4997-b257-ae1eac352ac7 \
      --workbook-id           a767c8a2-5b8a-4846-af8b-c3496601e924 \
      --source-connection-id  <benton-pacs-conn-guid> \
      --max-sales             1000 \
      --operator              c37c-benton-2026-04-28

Example (Benton; using the C41-B active-workbook pointer):
  sales-comp-proof \
      --db                    "Host=localhost;Database=terrafusion;..." \
      --county-id             eb94de6d-973f-4997-b257-ae1eac352ac7 \
      --source-connection-id  <benton-pacs-conn-guid> \
      --max-sales             1000 \
      --operator              c42a-benton-2026-04-29
  # Resolves the workbook via ISyncCountyActiveWorkbookService.GetAsync;
  # fails closed if no pointer is configured for the county.
""";
}
