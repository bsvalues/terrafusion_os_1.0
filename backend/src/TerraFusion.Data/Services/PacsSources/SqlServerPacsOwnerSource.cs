using System.Runtime.CompilerServices;
using Microsoft.Data.SqlClient;
using TerraFusion.Core.Sync.PacsOwner;

namespace TerraFusion.Data.Services.PacsSources;

/// <summary>
/// Slice B1-B — production <see cref="IPacsOwnerSource"/> against
/// live Harris PACS <c>pacs_oltp.dbo.owner</c>.
///
/// <para>The PACS owner table is the year-versioned link between a
/// property and an account (party). Identity is the 4-key composite
/// <c>(owner_tax_yr, sup_num, prop_id, owner_id)</c>. <c>owner_id</c>
/// is a foreign key to <c>account.acct_id</c>. The
/// <c>pct_ownership</c> column ranges 0–100 with NULL preserved
/// verbatim; co-ownership rows sum to ~100.</para>
///
/// <para>OWN-POP TopN proof note: bounded runs filter to
/// <c>owner_tax_yr &gt;= 2018</c> (post-2017 cutover) and
/// <c>sup_num = 0</c> (active supplement) so proof rows align with
/// the modern data shape. Production landing relaxes both filters
/// for full-corpus drains.</para>
/// </summary>
public sealed class SqlServerPacsOwnerSource : IPacsOwnerSource
{
    private readonly string _connectionString;
    private readonly int? _topN;
    private readonly int? _afterPropId;

    /// <param name="afterPropId">
    /// ADVANCEMENT CURSOR (2026-05-27). When set, the stream returns only owners
    /// with <c>prop_id &gt; afterPropId</c>, ordered by <c>prop_id</c> — a keyset
    /// cursor so successive bounded (TopN) drains cover NEW parcels instead of
    /// re-pulling the same top-N every chunk. When null, the original
    /// (owner_tax_yr DESC, prop_id, owner_id) ordering is preserved unchanged so
    /// other lanes are unaffected.
    /// </param>
    public SqlServerPacsOwnerSource(string connectionString, int? topN = null, int? afterPropId = null)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new ArgumentException("PACS connection string is required.", nameof(connectionString));
        _connectionString = connectionString;
        _topN = topN;
        _afterPropId = afterPropId;
    }

    public string SourceSystem => "JCHARRISPACS";
    public string SourceFileOrDatabase => "pacs_oltp";

    // Doctrine note (OWN-POP-1 fixture-vs-real divergence):
    //   - The doctrine entity declares TypeOfOwner / UdiStatus, but real
    //     Benton dbo.owner does not have those columns. Real-world
    //     equivalents are type_of_int (type of interest) and
    //     udi_child_prop_id (UDI child property id, int not string).
    //   - We alias type_of_int AS type_of_owner. udi_status comes back
    //     as NULL — the entity tolerates this and downstream truth/
    //     canonical layers do not consult it for promotion gates.
    public string SourceQueryText =>
        "SELECT CAST(owner_tax_yr AS smallint) AS owner_tax_yr, " +
        "CAST(sup_num AS smallint) AS sup_num, " +
        "prop_id, owner_id, pct_ownership, " +
        "type_of_int AS type_of_owner, " +
        "CAST(NULL AS varchar(8)) AS udi_status, " +
        "birth_dt " +
        "FROM dbo.owner " +
        "WHERE sup_num = 0 AND owner_tax_yr >= 2018 " +
        "ORDER BY owner_tax_yr DESC, prop_id, owner_id";

    public async IAsyncEnumerable<PacsSourceOwner> StreamOwnersAsync(
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        var topClause = _topN.HasValue ? $"TOP {_topN.Value} " : "";
        string sql;
        if (_afterPropId.HasValue)
        {
            // ADVANCEMENT CURSOR (2026-05-27): keyset-paginate by prop_id so each
            // bounded chunk advances to NEW parcels. The owner table has ~1 row
            // per (prop_id, tax_year); to make TOP N ≈ N DISTINCT parcels (not N
            // owner-rows spread thin across years), collapse to the latest year
            // per prop_id via ROW_NUMBER before applying TOP N.
            sql = $@"
                WITH ranked AS (
                    SELECT CAST(owner_tax_yr AS smallint) AS owner_tax_yr,
                           CAST(sup_num AS smallint) AS sup_num,
                           prop_id, owner_id, pct_ownership,
                           type_of_int AS type_of_owner,
                           CAST(NULL AS varchar(8)) AS udi_status,
                           birth_dt,
                           ROW_NUMBER() OVER (PARTITION BY prop_id
                                              ORDER BY owner_tax_yr DESC, owner_id) AS rn
                    FROM dbo.owner
                    WHERE sup_num = 0 AND owner_tax_yr >= 2018 AND prop_id > @afterPropId)
                SELECT {topClause}owner_tax_yr, sup_num, prop_id, owner_id, pct_ownership,
                       type_of_owner, udi_status, birth_dt
                FROM ranked WHERE rn = 1
                ORDER BY prop_id";
        }
        else
        {
            // Original ordering preserved exactly (other lanes rely on it).
            sql = $@"
                SELECT {topClause}CAST(owner_tax_yr AS smallint) AS owner_tax_yr,
                       CAST(sup_num AS smallint) AS sup_num,
                       prop_id,
                       owner_id,
                       pct_ownership,
                       type_of_int AS type_of_owner,
                       CAST(NULL AS varchar(8)) AS udi_status,
                       birth_dt
                FROM dbo.owner
                WHERE sup_num = 0 AND owner_tax_yr >= 2018
                ORDER BY owner_tax_yr DESC, prop_id, owner_id";
        }

        await using var conn = new SqlConnection(_connectionString);
        await conn.OpenAsync(cancellationToken).ConfigureAwait(false);

        await using var cmd = new SqlCommand(sql, conn) { CommandTimeout = 600 };
        if (_afterPropId.HasValue)
            cmd.Parameters.AddWithValue("@afterPropId", _afterPropId.Value);
        await using var rdr = await cmd.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);

        var oOwnerTaxYr   = rdr.GetOrdinal("owner_tax_yr");
        var oSupNum       = rdr.GetOrdinal("sup_num");
        var oPropId       = rdr.GetOrdinal("prop_id");
        var oOwnerId      = rdr.GetOrdinal("owner_id");
        var oPctOwnership = rdr.GetOrdinal("pct_ownership");
        var oTypeOfOwner  = rdr.GetOrdinal("type_of_owner");
        var oUdiStatus    = rdr.GetOrdinal("udi_status");
        var oBirthDt      = rdr.GetOrdinal("birth_dt");

        while (await rdr.ReadAsync(cancellationToken).ConfigureAwait(false))
        {
            cancellationToken.ThrowIfCancellationRequested();
            yield return new PacsSourceOwner(
                OwnerTaxYr:    rdr.GetInt16(oOwnerTaxYr),
                SupNum:        rdr.GetInt16(oSupNum),
                PropId:        rdr.GetInt32(oPropId),
                OwnerId:       ReadInt64Flexible(rdr, oOwnerId),
                PctOwnership:  rdr.IsDBNull(oPctOwnership) ? null : rdr.GetDecimal(oPctOwnership),
                TypeOfOwner:   TrimOrNull(rdr, oTypeOfOwner),
                UdiStatus:     TrimOrNull(rdr, oUdiStatus),
                BirthDt:       rdr.IsDBNull(oBirthDt)
                                 ? null
                                 : DateTime.SpecifyKind(rdr.GetDateTime(oBirthDt), DateTimeKind.Utc));
        }
    }

    private static long ReadInt64Flexible(SqlDataReader rdr, int ordinal)
    {
        if (rdr.IsDBNull(ordinal)) return 0L;
        return rdr.GetFieldType(ordinal) == typeof(int)
            ? rdr.GetInt32(ordinal)
            : rdr.GetInt64(ordinal);
    }

    private static string? TrimOrNull(SqlDataReader rdr, int ordinal)
    {
        if (rdr.IsDBNull(ordinal)) return null;
        var raw = rdr.GetString(ordinal).Trim();
        return string.IsNullOrEmpty(raw) ? null : raw;
    }
}
