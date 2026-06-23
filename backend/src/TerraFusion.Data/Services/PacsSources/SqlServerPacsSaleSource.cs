using System.Data;
using System.Runtime.CompilerServices;
using Microsoft.Data.SqlClient;
using TerraFusion.Core.Sync.PacsSale;

namespace TerraFusion.Data.Services.PacsSources;

/// <summary>
/// Slice S1 — production <see cref="IPacsSaleSource"/> against live
/// Harris PACS <c>pacs_oltp.dbo.sale</c>.
///
/// <para>SourceQueryText matches the test-fixture spec exactly so the
/// landing service's <c>source_query_hash</c> aligns across fixture
/// and live runs. The actual SQL command uses the real column name
/// <c>adjusted_sl_price</c> aliased to <c>adj_sl_price</c> for reader
/// ordinal compatibility.</para>
/// </summary>
public sealed class SqlServerPacsSaleSource : IPacsSaleSource
{
    private readonly string _connectionString;
    private readonly int? _topN;

    /// <param name="topN">If set, limits the SQL Server query to TOP N rows.
    /// Used by SYNC-POP-2 proof runs that must complete inside an HTTP
    /// timeout. Production landing leaves this null to drain the full corpus.</param>
    public SqlServerPacsSaleSource(string connectionString, int? topN = null)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new ArgumentException("PACS connection string is required.", nameof(connectionString));
        _connectionString = connectionString;
        _topN = topN;
    }

    public string SourceSystem => "JCHARRISPACS";
    public string SourceFileOrDatabase => "pacs_oltp";

    /// <summary>
    /// Audit-anchor text. Reflects the actual JOIN-based query used
    /// against real Harris PACS: <c>dbo.sale</c> has no <c>prop_id /
    /// prop_val_yr / sup_num</c> columns — those live on
    /// <c>dbo.chg_of_owner_prop_assoc</c>. The original test-fixture
    /// spec assumed a flatter shape than Harris PACS provides; this
    /// source delivers the doctrine PacsSourceSale shape by joining
    /// the property-association table.
    /// </summary>
    public string SourceQueryText =>
        "SELECT s.chg_of_owner_id, copa.prop_id, " +
        "CAST(COALESCE(YEAR(s.sl_dt), YEAR(GETDATE())) AS smallint) AS prop_val_yr, " +
        "CAST(0 AS smallint) AS sup_num, " +
        "s.sl_county_ratio_cd, s.wac_cd, s.sl_ratio_type_cd, s.sl_dt, s.sl_price, " +
        "s.adjusted_sl_price AS adj_sl_price " +
        "FROM dbo.sale s " +
        "INNER JOIN dbo.chg_of_owner_prop_assoc copa " +
        "ON copa.chg_of_owner_id = s.chg_of_owner_id";

    public async IAsyncEnumerable<PacsSourceSale> StreamSalesAsync(
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        // Real Harris PACS doctrine note:
        //   - dbo.sale has chg_of_owner_id but NOT prop_id/prop_val_yr/sup_num
        //   - prop_id lives on dbo.chg_of_owner_prop_assoc (joined on chg_of_owner_id)
        //   - prop_val_yr/sup_num context lives on dbo.property_val by (prop_id, year, sup_num)
        // For S1 raw landing the doctrine result fields (Pre2018Count, Post2018Count,
        // StaleCodeViolations, CodeDistribution) all key on sl_dt or sl_county_ratio_cd —
        // not on PropValYr/SupNum — so deriving PropValYr from sl_dt's year and using
        // SupNum=0 matches both the test-fixture seed shape (PropValYr=2026, SupNum=0
        // for a 2026 sale) and downstream gate semantics. S2-B truth promotion can
        // refine via property_val lookup when needed.
        // SYNC-POP-2 proof note: ORDER BY DESC + filter to post-2018 sales
        // surfaces canonical-eligible records first, so the proof run can
        // observe non-zero S2-B truth_pacs promotion + S3 canonical_tf
        // projection. Production drains all rows (topN=null), date filter
        // honored only when caller asks for a bounded sample.
        var sql = BuildQuery(_topN);

        await using var conn = new SqlConnection(_connectionString);
        await conn.OpenAsync(cancellationToken).ConfigureAwait(false);

        await using var cmd = new SqlCommand(sql, conn) { CommandTimeout = 600 };
        await using var rdr = await cmd.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);

        var oChgId           = rdr.GetOrdinal("chg_of_owner_id");
        var oPropId          = rdr.GetOrdinal("prop_id");
        var oPropValYr       = rdr.GetOrdinal("prop_val_yr");
        var oSupNum          = rdr.GetOrdinal("sup_num");
        var oSlCountyRatio   = rdr.GetOrdinal("sl_county_ratio_cd");
        var oWacCd           = rdr.GetOrdinal("wac_cd");
        var oSlRatioType     = rdr.GetOrdinal("sl_ratio_type_cd");
        var oSlDt            = rdr.GetOrdinal("sl_dt");
        var oSlPrice         = rdr.GetOrdinal("sl_price");
        var oAdjSlPrice      = rdr.GetOrdinal("adj_sl_price");

        while (await rdr.ReadAsync(cancellationToken).ConfigureAwait(false))
        {
            cancellationToken.ThrowIfCancellationRequested();

            // Real Harris PACS dbo.sale.chg_of_owner_id is INT (32-bit), but
            // PacsSourceSale.ChgOfOwnerId is doctrine-typed long. Read as int
            // and widen. PACS code columns (sl_county_ratio_cd, wac_cd,
            // sl_ratio_type_cd) are CHAR-padded with trailing whitespace in
            // real data; the doctrine destination caps at varchar(8) so we
            // trim before yielding. Empty strings collapse to null per the
            // doctrine convention that "no code" is null, not "".
            yield return new PacsSourceSale(
                ChgOfOwnerId:    rdr.GetInt32(oChgId),
                PropId:          rdr.GetInt32(oPropId),
                PropValYr:       rdr.GetInt16(oPropValYr),
                SupNum:          rdr.GetInt16(oSupNum),
                SlCountyRatioCd: TrimOrNull(rdr, oSlCountyRatio),
                WacCd:           TrimOrNull(rdr, oWacCd),
                SlRatioTypeCd:   TrimOrNull(rdr, oSlRatioType),
                // sl_dt comes back from SQL Server with Kind=Unspecified;
                // Postgres EF maps to 'timestamp with time zone' which
                // requires UTC. Specify Kind explicitly per the test-fixture
                // pattern (PacsSaleLandingServiceTests seeds DateTimeKind.Utc).
                SlDt:            rdr.IsDBNull(oSlDt)          ? null : DateTime.SpecifyKind(rdr.GetDateTime(oSlDt), DateTimeKind.Utc),
                SlPrice:         rdr.IsDBNull(oSlPrice)       ? null : rdr.GetDecimal(oSlPrice),
                AdjSlPrice:      rdr.IsDBNull(oAdjSlPrice)    ? null : rdr.GetDecimal(oAdjSlPrice));
        }
    }

    /// <summary>
    /// Builds the PACS sale query for the given <paramref name="topN"/> bound.
    /// Exposed as <c>internal static</c> so unit tests can assert the ORDER BY
    /// clause is absent on full-corpus runs without requiring a live SQL Server.
    ///
    /// <para>ORDER BY is only emitted for bounded TopN proof runs (surfaces
    /// canonical-eligible records first so SYNC-POP-2 can observe truth
    /// promotion). Full-corpus drains omit it: SQL Server must otherwise sort
    /// all 440k rows through tempdb before streaming begins, causing
    /// mid-reader stalls (WO-DATA-FINALIZE-SALES-001 incident).</para>
    /// </summary>
    internal static string BuildQuery(int? topN)
    {
        var topClause   = topN.HasValue ? $"TOP {topN.Value} " : "";
        var dateFilter  = topN.HasValue ? "WHERE s.sl_dt >= '2018-01-01'" : "";
        var orderClause = topN.HasValue ? "ORDER BY s.chg_of_owner_id DESC, copa.prop_id" : "";
        return $@"
            SELECT {topClause}s.chg_of_owner_id,
                   copa.prop_id,
                   CAST(COALESCE(YEAR(s.sl_dt), YEAR(GETDATE())) AS smallint) AS prop_val_yr,
                   CAST(0 AS smallint) AS sup_num,
                   s.sl_county_ratio_cd,
                   s.wac_cd,
                   s.sl_ratio_type_cd,
                   s.sl_dt,
                   s.sl_price,
                   s.adjusted_sl_price AS adj_sl_price
            FROM dbo.sale s
            INNER JOIN dbo.chg_of_owner_prop_assoc copa
                ON copa.chg_of_owner_id = s.chg_of_owner_id
            {dateFilter}
            {orderClause}";
    }

    /// <summary>
    /// Returns the column value trimmed; null if the column was DBNull or
    /// the trimmed value is empty. Trimming handles real PACS CHAR-padded
    /// codes (e.g. <c>"100   "</c>) so the doctrine varchar(8) destination
    /// columns accept them cleanly.
    /// </summary>
    private static string? TrimOrNull(Microsoft.Data.SqlClient.SqlDataReader rdr, int ordinal)
    {
        if (rdr.IsDBNull(ordinal)) return null;
        var raw = rdr.GetString(ordinal).Trim();
        return string.IsNullOrEmpty(raw) ? null : raw;
    }
}
