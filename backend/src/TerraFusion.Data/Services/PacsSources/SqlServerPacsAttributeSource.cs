using System.Runtime.CompilerServices;
using Microsoft.Data.SqlClient;
using TerraFusion.Core.Sync.PacsAttribute;

namespace TerraFusion.Data.Services.PacsSources;

/// <summary>
/// Slice E2-A (ATTR-POP-1) — production <see cref="IPacsAttributeSource"/>
/// against live Harris PACS <c>pacs_oltp.dbo.attribute</c>.
///
/// <para>The PACS <c>attribute</c> table is the family-grain
/// dictionary (one row per attribute family — ROOF_TYPE, FOUNDATION,
/// EXTERIOR_WALL, etc.). Real Benton schema (verified via
/// INFORMATION_SCHEMA): 9 columns including <c>imprv_attr_id</c>
/// (int, family identity), <c>imprv_attr_desc</c> (varchar 50,
/// display name), <c>inactive_flag</c> (bit, lifecycle).</para>
///
/// <para>This source is NOT bounded — the dictionary is small
/// (typically &lt; 100 rows per county) and full-corpus drains in
/// milliseconds. No TopN parameter.</para>
/// </summary>
public sealed class SqlServerPacsAttributeSource : IPacsAttributeSource
{
    private readonly string _connectionString;

    public SqlServerPacsAttributeSource(string connectionString)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new ArgumentException("PACS connection string is required.", nameof(connectionString));
        _connectionString = connectionString;
    }

    public string SourceSystem => "JCHARRISPACS";
    public string SourceFileOrDatabase => "pacs_oltp";

    public string SourceQueryText =>
        "SELECT imprv_attr_id, imprv_attr_desc, ISNULL(inactive_flag, 0) AS inactive_flag " +
        "FROM dbo.attribute " +
        "ORDER BY imprv_attr_id";

    public async IAsyncEnumerable<PacsSourceAttribute> StreamAttributesAsync(
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        var sql = @"
            SELECT imprv_attr_id,
                   imprv_attr_desc,
                   ISNULL(inactive_flag, 0) AS inactive_flag
            FROM dbo.attribute
            ORDER BY imprv_attr_id";

        await using var conn = new SqlConnection(_connectionString);
        await conn.OpenAsync(cancellationToken).ConfigureAwait(false);

        await using var cmd = new SqlCommand(sql, conn) { CommandTimeout = 60 };
        await using var rdr = await cmd.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);

        var oIAttrId   = rdr.GetOrdinal("imprv_attr_id");
        var oDesc      = rdr.GetOrdinal("imprv_attr_desc");
        var oInactive  = rdr.GetOrdinal("inactive_flag");

        while (await rdr.ReadAsync(cancellationToken).ConfigureAwait(false))
        {
            cancellationToken.ThrowIfCancellationRequested();
            yield return new PacsSourceAttribute(
                IAttrId:        ReadInt64Flexible(rdr, oIAttrId),
                AttributeName:  TrimOrNull(rdr, oDesc),
                InactiveFlag:   ReadBoolFlexible(rdr, oInactive));
        }
    }

    private static long ReadInt64Flexible(SqlDataReader rdr, int ordinal)
    {
        if (rdr.IsDBNull(ordinal)) return 0L;
        return rdr.GetFieldType(ordinal) == typeof(int)
            ? rdr.GetInt32(ordinal)
            : rdr.GetInt64(ordinal);
    }

    private static bool ReadBoolFlexible(SqlDataReader rdr, int ordinal)
    {
        if (rdr.IsDBNull(ordinal)) return false;
        var t = rdr.GetFieldType(ordinal);
        if (t == typeof(bool)) return rdr.GetBoolean(ordinal);
        if (t == typeof(byte)) return rdr.GetByte(ordinal) != 0;
        if (t == typeof(short)) return rdr.GetInt16(ordinal) != 0;
        if (t == typeof(int)) return rdr.GetInt32(ordinal) != 0;
        if (t == typeof(string))
        {
            var s = rdr.GetString(ordinal).Trim();
            return s.Equals("Y", StringComparison.OrdinalIgnoreCase) || s == "1";
        }
        return false;
    }

    private static string? TrimOrNull(SqlDataReader rdr, int ordinal)
    {
        if (rdr.IsDBNull(ordinal)) return null;
        var raw = rdr.GetString(ordinal).Trim();
        return string.IsNullOrEmpty(raw) ? null : raw;
    }
}
