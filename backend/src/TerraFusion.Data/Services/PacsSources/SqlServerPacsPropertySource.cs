using System.Runtime.CompilerServices;
using Microsoft.Data.SqlClient;
using TerraFusion.Core.Sync.PacsProperty;

namespace TerraFusion.Data.Services.PacsSources;

/// <summary>
/// Slice S1 (SYNC-POP-4a) — production <see cref="IPacsPropertySource"/>
/// against live Harris PACS <c>pacs_oltp.dbo.property</c>.
///
/// <para>Doctrine: <c>dbo.property</c> is the master parcel identity
/// table. <c>prop_id</c> is the PACS parcel identity. Every other
/// PACS table joins back here directly or transitively. This source
/// streams the parcel corpus verbatim — type filtering and active /
/// inactive filtering are the truth promoter's job (SYNC-POP-4b),
/// not the landing tier's.</para>
///
/// <para>SYNC-POP-4a TopN proof note: when <c>topN</c> is set, the
/// query orders <c>prop_id DESC</c> so the most recently created
/// parcels surface first. Production drains all rows
/// (<c>topN = null</c>).</para>
/// </summary>
public sealed class SqlServerPacsPropertySource : IPacsPropertySource
{
    private readonly string _connectionString;
    private readonly int? _topN;

    /// <param name="topN">If set, limits the SQL Server query to TOP N rows.
    /// Used by SYNC-POP-4a proof runs that must complete inside an HTTP
    /// timeout. Production landing leaves this null to drain the full
    /// corpus.</param>
    public SqlServerPacsPropertySource(string connectionString, int? topN = null)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new ArgumentException("PACS connection string is required.", nameof(connectionString));
        _connectionString = connectionString;
        _topN = topN;
    }

    public string SourceSystem => "JCHARRISPACS";
    public string SourceFileOrDatabase => "pacs_oltp";

    /// <summary>
    /// Audit-anchor text. Reflects the actual query used against real
    /// Harris PACS <c>dbo.property</c>. The TopN clause is collapsed
    /// out of the audit text so the hash is stable across bounded
    /// proof runs and full production drains — only the column
    /// projection / ORDER BY shape contributes to the hash.
    /// </summary>
    public string SourceQueryText =>
        "SELECT prop_id, prop_type_cd, geo_id, ref_id1, ref_id2, " +
        "dba_name, alt_dba_name, prop_create_dt " +
        "FROM dbo.property " +
        "ORDER BY prop_id DESC";

    public async IAsyncEnumerable<PacsSourceProperty> StreamPropertiesAsync(
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        var topClause = _topN.HasValue ? $"TOP {_topN.Value} " : "";
        // Real Benton Harris PACS dbo.property has 34 columns but no
        // prop_inactive_dt — that lives on dbo.property_val (per-year,
        // per-supplement). We project only the master identity surface
        // here; SYNC-POP-4b's truth promoter joins property_val for
        // lifecycle resolution.
        var sql = $@"
            SELECT {topClause}prop_id,
                   prop_type_cd,
                   geo_id,
                   ref_id1,
                   ref_id2,
                   dba_name,
                   alt_dba_name,
                   prop_create_dt
            FROM dbo.property
            ORDER BY prop_id DESC";

        await using var conn = new SqlConnection(_connectionString);
        await conn.OpenAsync(cancellationToken).ConfigureAwait(false);

        await using var cmd = new SqlCommand(sql, conn) { CommandTimeout = 600 };
        await using var rdr = await cmd.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);

        var oPropId         = rdr.GetOrdinal("prop_id");
        var oPropTypeCd     = rdr.GetOrdinal("prop_type_cd");
        var oGeoId          = rdr.GetOrdinal("geo_id");
        var oRefId1         = rdr.GetOrdinal("ref_id1");
        var oRefId2         = rdr.GetOrdinal("ref_id2");
        var oDbaName        = rdr.GetOrdinal("dba_name");
        var oAltDbaName     = rdr.GetOrdinal("alt_dba_name");
        var oPropCreateDt   = rdr.GetOrdinal("prop_create_dt");

        while (await rdr.ReadAsync(cancellationToken).ConfigureAwait(false))
        {
            cancellationToken.ThrowIfCancellationRequested();

            // Real Harris PACS code/text columns (prop_type_cd, geo_id,
            // ref_id*, dba_name) are CHAR-padded with trailing whitespace
            // in real data. Doctrine destination columns are varchar with
            // tight caps; we trim before yielding. Empty strings collapse
            // to null per the doctrine convention that "no value" is null.
            //
            // Datetime columns (prop_create_dt, prop_inactive_dt) come back
            // from SQL Server with Kind=Unspecified; Postgres EF maps to
            // 'timestamp with time zone' which requires UTC. Specify Kind
            // explicitly per the SYNC-POP-2 fix.
            yield return new PacsSourceProperty(
                PropId:         rdr.GetInt32(oPropId),
                PropTypeCd:     TrimOrNull(rdr, oPropTypeCd),
                GeoId:          TrimOrNull(rdr, oGeoId),
                RefId1:         TrimOrNull(rdr, oRefId1),
                RefId2:         TrimOrNull(rdr, oRefId2),
                DbaName:        TrimOrNull(rdr, oDbaName),
                AltDbaName:     TrimOrNull(rdr, oAltDbaName),
                PropCreateDt:   rdr.IsDBNull(oPropCreateDt)
                                  ? null
                                  : DateTime.SpecifyKind(rdr.GetDateTime(oPropCreateDt), DateTimeKind.Utc));
        }
    }

    /// <summary>
    /// Returns the column value trimmed; null if the column was DBNull
    /// or the trimmed value is empty. Trimming handles real PACS
    /// CHAR-padded codes/text so the doctrine varchar destination
    /// columns accept them cleanly.
    /// </summary>
    private static string? TrimOrNull(SqlDataReader rdr, int ordinal)
    {
        if (rdr.IsDBNull(ordinal)) return null;
        var raw = rdr.GetString(ordinal).Trim();
        return string.IsNullOrEmpty(raw) ? null : raw;
    }
}
