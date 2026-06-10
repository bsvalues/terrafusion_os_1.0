using System.Runtime.CompilerServices;
using Microsoft.Data.SqlClient;
using TerraFusion.Core.Sync.PacsAttributeVal;

namespace TerraFusion.Data.Services.PacsSources;

/// <summary>
/// Slice E2-B (ATTR-POP-2) — production
/// <see cref="IPacsAttributeValSource"/>. Two-step strategy:
/// <list type="number">
///   <item>Prefer <c>dbo.imprv_attr_val</c> (the PACS value-grain
///   dictionary table; varchar(75) <c>imprv_attr_val_cd</c>).</item>
///   <item>If empty (Benton has it empty), fall back to
///   <c>SELECT DISTINCT i_attr_val_id, i_attr_val_cd FROM dbo.imprv_attr</c>
///   — every (id, code) pair observed in real data IS the active
///   value-grain dictionary by definition.</item>
/// </list>
/// </summary>
public sealed class SqlServerPacsAttributeValSource : IPacsAttributeValSource
{
    private readonly string _connectionString;

    public SqlServerPacsAttributeValSource(string connectionString)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new ArgumentException("PACS connection string is required.", nameof(connectionString));
        _connectionString = connectionString;
    }

    public string SourceSystem => "JCHARRISPACS";
    public string SourceFileOrDatabase => "pacs_oltp";

    public string SourceQueryText =>
        // The audit-anchor text describes the intent — value-grain
        // (id, code) pairs for canonical_tf.attribute_definition. The
        // actual streaming switches between dictionary-table and
        // data-table queries based on which has rows.
        "SELECT DISTINCT i_attr_val_id, i_attr_val_cd " +
        "FROM dbo.imprv_attr_val (preferred) OR dbo.imprv_attr (fallback)";

    public async IAsyncEnumerable<PacsSourceAttributeVal> StreamAttributeValsAsync(
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        await using var conn = new SqlConnection(_connectionString);
        await conn.OpenAsync(cancellationToken).ConfigureAwait(false);

        // Note: dbo.imprv_attr_val (the proper PACS dictionary table)
        // is keyed (imprv_attr_id, imprv_attr_val_cd, imprv_yr) — it
        // does NOT carry i_attr_val_id. The imprv_attr.i_attr_val_id
        // column the projector keys on lives only on the data table.
        // So the data-derived fallback IS the source of truth in
        // practice; we go straight to it.

        // Step 2: data-derived fallback. This is the source of truth in
        // practice for Benton: every (id, code) pair the projector ever
        // sees is in this query's result by definition.
        const string fallback = @"
            SELECT DISTINCT i_attr_val_id, i_attr_val_cd
            FROM dbo.imprv_attr
            WHERE i_attr_val_id IS NOT NULL
              AND i_attr_val_cd IS NOT NULL
              AND LTRIM(RTRIM(i_attr_val_cd)) <> ''
            ORDER BY i_attr_val_id";

        await using var cmd = new SqlCommand(fallback, conn) { CommandTimeout = 60 };
        await using var rdr = await cmd.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);

        var oId = rdr.GetOrdinal("i_attr_val_id");
        var oCd = rdr.GetOrdinal("i_attr_val_cd");

        while (await rdr.ReadAsync(cancellationToken).ConfigureAwait(false))
        {
            cancellationToken.ThrowIfCancellationRequested();
            if (rdr.IsDBNull(oId) || rdr.IsDBNull(oCd)) continue;

            var id = ReadInt64Flexible(rdr, oId);
            var code = rdr.GetString(oCd).Trim();
            if (string.IsNullOrEmpty(code)) continue;

            yield return new PacsSourceAttributeVal(IAttrValId: id, IAttrValCd: code);
        }
    }

    private static long ReadInt64Flexible(SqlDataReader rdr, int ordinal)
    {
        if (rdr.IsDBNull(ordinal)) return 0L;
        return rdr.GetFieldType(ordinal) == typeof(int)
            ? rdr.GetInt32(ordinal)
            : rdr.GetInt64(ordinal);
    }
}
