using System.Runtime.CompilerServices;
using Microsoft.Data.SqlClient;
using TerraFusion.Core.Sync.PacsPropSuppAssoc;

namespace TerraFusion.Data.Services.PacsSources;

/// <summary>
/// Slice S2-A — production <see cref="IPacsPropSuppAssocSource"/>
/// against live Harris PACS <c>pacs_oltp.dbo.prop_supp_assoc</c>.
///
/// <para>SourceQueryText matches the test-fixture spec exactly.</para>
/// </summary>
public sealed class SqlServerPacsPropSuppAssocSource : IPacsPropSuppAssocSource
{
    private readonly string _connectionString;
    private readonly int? _topN;

    /// <param name="topN">SYNC-POP-2 proof-run row cap. Null = full drain.</param>
    public SqlServerPacsPropSuppAssocSource(string connectionString, int? topN = null)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new ArgumentException("PACS connection string is required.", nameof(connectionString));
        _connectionString = connectionString;
        _topN = topN;
    }

    public string SourceSystem => "JCHARRISPACS";
    public string SourceFileOrDatabase => "pacs_oltp";

    public string SourceQueryText =>
        "SELECT CAST(owner_tax_yr AS smallint) AS prop_val_yr, prop_id, " +
        "CAST(sup_num AS smallint) AS sup_num FROM dbo.prop_supp_assoc";

    public async IAsyncEnumerable<PacsSourcePropSuppAssoc> StreamPropSuppAssocsAsync(
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        // SYNC-POP-2 finding #7: real Harris PACS dbo.prop_supp_assoc has
        // (prop_id INT, owner_tax_yr NUMERIC, sup_num INT). The doctrine
        // fixture assumed (prop_val_yr SMALLINT, prop_id INT, sup_num SMALLINT).
        // We alias owner_tax_yr → prop_val_yr and CAST both year + sup_num
        // to smallint to satisfy the PacsSourcePropSuppAssoc record shape.
        //
        // For SYNC-POP-2 PROOF runs: filter to recent years + sup_num=0 so
        // the supp index has the (prop_id, year) tuples our recent-sales
        // sample needs to promote. Production drains all rows.
        var topClause = _topN.HasValue ? $"TOP {_topN.Value} " : "";
        var filter = _topN.HasValue
            ? "WHERE owner_tax_yr >= 2018 AND sup_num = 0"
            : "";
        var sql = $@"
            SELECT {topClause}CAST(owner_tax_yr AS smallint) AS prop_val_yr,
                   prop_id,
                   CAST(sup_num AS smallint) AS sup_num
            FROM dbo.prop_supp_assoc
            {filter}
            ORDER BY owner_tax_yr DESC, prop_id";

        await using var conn = new SqlConnection(_connectionString);
        await conn.OpenAsync(cancellationToken).ConfigureAwait(false);

        await using var cmd = new SqlCommand(sql, conn) { CommandTimeout = 600 };
        await using var rdr = await cmd.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);

        var oPropValYr = rdr.GetOrdinal("prop_val_yr");
        var oPropId    = rdr.GetOrdinal("prop_id");
        var oSupNum    = rdr.GetOrdinal("sup_num");

        while (await rdr.ReadAsync(cancellationToken).ConfigureAwait(false))
        {
            cancellationToken.ThrowIfCancellationRequested();

            yield return new PacsSourcePropSuppAssoc(
                PropValYr: rdr.GetInt16(oPropValYr),
                PropId:    rdr.GetInt32(oPropId),
                SupNum:    rdr.GetInt16(oSupNum));
        }
    }
}
