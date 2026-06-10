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
///
/// <para>OWNER-SUPNUM-RESOLUTION (2026-06-06): the default
/// <c>sup_num = 0</c> filter lands only the BASE owner record, which is
/// wrong for parcel-years whose active supplement is non-zero (~34.6K
/// Benton class-2 keys). The owner-current truth promoter requires
/// <c>owner.sup_num == active supplement</c> (= MAX(prop_supp_assoc.sup_num)
/// for the key), so base records get rejected as stale and never promote.
/// When <paramref name="activeSupp"/> is true the source instead lands the
/// owner record at the ACTIVE supplement per (prop_id, owner_tax_yr), joining
/// <c>dbo.prop_supp_assoc</c> MAX(sup_num). Live PACS verification: 100% of
/// class-2 keys (42,089) have an owner record at the active supplement.
/// Opt-in keeps the sealed land/improvement/parcel seed lanes (which only
/// need distinct prop_ids) on the original sup=0 behavior.</para>
/// </summary>
public sealed class SqlServerPacsOwnerSource : IPacsOwnerSource
{
    private readonly string _connectionString;
    private readonly int? _topN;
    private readonly int? _afterPropId;
    private readonly bool _activeSupp;

    /// <param name="afterPropId">
    /// ADVANCEMENT CURSOR (2026-05-27). When set, the stream returns only owners
    /// with <c>prop_id &gt; afterPropId</c>, ordered by <c>prop_id</c> — a keyset
    /// cursor so successive bounded (TopN) drains cover NEW parcels instead of
    /// re-pulling the same top-N every chunk. When null, the original
    /// (owner_tax_yr DESC, prop_id, owner_id) ordering is preserved unchanged so
    /// other lanes are unaffected.
    /// </param>
    /// <param name="activeSupp">
    /// OWNER-SUPNUM-RESOLUTION (2026-06-06). When false (default), filter
    /// <c>sup_num = 0</c> exactly as before (sealed lanes' seed behavior). When
    /// true, land the ACTIVE-supplement owner record per (prop_id, owner_tax_yr)
    /// = the row whose sup_num matches MAX(prop_supp_assoc.sup_num) for that key,
    /// so class-2 (non-zero active supplement) owners promote.
    /// </param>
    public SqlServerPacsOwnerSource(
        string connectionString, int? topN = null, int? afterPropId = null, bool activeSupp = false)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new ArgumentException("PACS connection string is required.", nameof(connectionString));
        _connectionString = connectionString;
        _topN = topN;
        _afterPropId = afterPropId;
        _activeSupp = activeSupp;
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
    public string SourceQueryText => _activeSupp
        ? "SELECT owner_tax_yr, sup_num, prop_id, owner_id, pct_ownership, " +
          "type_of_int AS type_of_owner, NULL AS udi_status, birth_dt " +
          "FROM dbo.owner o JOIN (SELECT prop_id, owner_tax_yr, MAX(sup_num) active_sup " +
          "FROM dbo.prop_supp_assoc WHERE owner_tax_yr >= 2018 GROUP BY prop_id, owner_tax_yr) sa " +
          "ON o.prop_id=sa.prop_id AND o.owner_tax_yr=sa.owner_tax_yr AND o.sup_num=sa.active_sup " +
          "WHERE o.owner_tax_yr >= 2018 (active-supplement resolution)"
        : "SELECT CAST(owner_tax_yr AS smallint) AS owner_tax_yr, " +
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

        // OWNER-SUPNUM-RESOLUTION: the per-key supplement filter. activeSupp
        // joins dbo.prop_supp_assoc MAX(sup_num) so the landed owner row's
        // sup_num equals the active supplement the truth promoter expects.
        // Default reproduces the original sup_num = 0 base-record filter.
        var ownerSupFilter = _activeSupp
            ? "JOIN (SELECT prop_id, owner_tax_yr, MAX(sup_num) AS active_sup " +
              "      FROM dbo.prop_supp_assoc WHERE owner_tax_yr >= 2018 " +
              "      GROUP BY prop_id, owner_tax_yr) sa " +
              "  ON o.prop_id = sa.prop_id AND o.owner_tax_yr = sa.owner_tax_yr " +
              "     AND o.sup_num = sa.active_sup "
            : null;

        string sql;
        if (_afterPropId.HasValue)
        {
            // ADVANCEMENT CURSOR (2026-05-27): keyset-paginate by prop_id so each
            // bounded chunk advances to NEW parcels. The owner table has ~1 row
            // per (prop_id, tax_year); to make TOP N ≈ N DISTINCT parcels (not N
            // owner-rows spread thin across years), collapse to the latest year
            // per prop_id via ROW_NUMBER before applying TOP N.
            sql = _activeSupp
                ? $@"
                WITH ranked AS (
                    SELECT CAST(o.owner_tax_yr AS smallint) AS owner_tax_yr,
                           CAST(o.sup_num AS smallint) AS sup_num,
                           o.prop_id, o.owner_id, o.pct_ownership,
                           o.type_of_int AS type_of_owner,
                           CAST(NULL AS varchar(8)) AS udi_status,
                           o.birth_dt,
                           ROW_NUMBER() OVER (PARTITION BY o.prop_id
                                              ORDER BY o.owner_tax_yr DESC, o.owner_id) AS rn
                    FROM dbo.owner o
                    {ownerSupFilter}
                    WHERE o.owner_tax_yr >= 2018 AND o.prop_id > @afterPropId)
                SELECT {topClause}owner_tax_yr, sup_num, prop_id, owner_id, pct_ownership,
                       type_of_owner, udi_status, birth_dt
                FROM ranked WHERE rn = 1
                ORDER BY prop_id"
                : $@"
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
            sql = _activeSupp
                ? $@"
                SELECT {topClause}CAST(o.owner_tax_yr AS smallint) AS owner_tax_yr,
                       CAST(o.sup_num AS smallint) AS sup_num,
                       o.prop_id,
                       o.owner_id,
                       o.pct_ownership,
                       o.type_of_int AS type_of_owner,
                       CAST(NULL AS varchar(8)) AS udi_status,
                       o.birth_dt
                FROM dbo.owner o
                {ownerSupFilter}
                WHERE o.owner_tax_yr >= 2018
                ORDER BY o.owner_tax_yr DESC, o.prop_id, o.owner_id"
                : $@"
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
