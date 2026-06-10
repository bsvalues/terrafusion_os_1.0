using System.Runtime.CompilerServices;
using System.Text;
using Microsoft.Data.SqlClient;
using TerraFusion.Core.Sync.PacsProperty;

namespace TerraFusion.Data.Services.PacsSources;

/// <summary>
/// SYNC-POP-4d source: drains live Harris PACS
/// <c>pacs_oltp.dbo.property</c>, but ONLY for the <c>prop_id</c>
/// values explicitly requested by the caller.
///
/// <para>The doctrine canonical projection
/// (<c>PacsSaleCanonicalProjector</c>) resolves <c>source_xref</c>
/// via <c>tf_parcel.tf_parcel_id</c>. To unblock
/// <c>canonical_tf.tf_sale &gt; 0</c>, every promoted sale's
/// <c>prop_id</c> must have a corresponding <c>tf_parcel</c> +
/// <c>source_xref(parcel)</c>. Bounded proof runs need a parcel
/// batch that exactly covers the sales' prop_ids — the keyed-supp
/// approach (SYNC-POP-3) but for parcels.</para>
///
/// <para>This source takes a prop_id set extracted from already-
/// landed/promoted sale rows and emits matching property rows. The
/// query uses parameterized IN clauses with batched chunks to avoid
/// the SQL Server 2100-parameter limit. Each prop_id is one
/// parameter, so the chunk size is 2000.</para>
/// </summary>
public sealed class KeyedSqlServerPacsPropertySource : IPacsPropertySource
{
    /// <summary>
    /// SQL Server caps a single command at 2100 parameters. Each
    /// prop_id uses 1 parameter, so we batch up to 2000 per round-trip
    /// for safety headroom.
    /// </summary>
    private const int KeyChunkSize = 2000;

    private readonly string _connectionString;
    private readonly IReadOnlyCollection<int> _propIds;

    public KeyedSqlServerPacsPropertySource(
        string connectionString,
        IReadOnlyCollection<int> propIds)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new ArgumentException("PACS connection string is required.", nameof(connectionString));
        _connectionString = connectionString;
        _propIds = propIds ?? throw new ArgumentNullException(nameof(propIds));
    }

    public string SourceSystem => "JCHARRISPACS";
    public string SourceFileOrDatabase => "pacs_oltp";

    /// <summary>
    /// Audit-anchor text. Hash includes the key count so re-runs with
    /// different sale batches produce different audit anchors.
    /// </summary>
    public string SourceQueryText =>
        $"SELECT prop_id, prop_type_cd, geo_id, ref_id1, ref_id2, " +
        $"dba_name, alt_dba_name, prop_create_dt " +
        $"FROM dbo.property " +
        $"WHERE prop_id IN ({_propIds.Count} keyed prop_ids from truth_pacs.sale)";

    public async IAsyncEnumerable<PacsSourceProperty> StreamPropertiesAsync(
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        if (_propIds.Count == 0)
            yield break;

        await using var conn = new SqlConnection(_connectionString);
        await conn.OpenAsync(cancellationToken).ConfigureAwait(false);

        foreach (var chunk in Chunk(_propIds, KeyChunkSize))
        {
            cancellationToken.ThrowIfCancellationRequested();

            var sb = new StringBuilder();
            sb.AppendLine("SELECT prop_id,");
            sb.AppendLine("       prop_type_cd,");
            sb.AppendLine("       geo_id,");
            sb.AppendLine("       ref_id1,");
            sb.AppendLine("       ref_id2,");
            sb.AppendLine("       dba_name,");
            sb.AppendLine("       alt_dba_name,");
            sb.AppendLine("       prop_create_dt");
            sb.AppendLine("FROM dbo.property");
            sb.Append("WHERE prop_id IN (");

            await using var cmd = new SqlCommand { Connection = conn, CommandTimeout = 600 };
            for (var i = 0; i < chunk.Count; i++)
            {
                if (i > 0) sb.Append(", ");
                sb.Append($"@p{i}");
                cmd.Parameters.AddWithValue($"@p{i}", chunk[i]);
            }
            sb.AppendLine(")");

            cmd.CommandText = sb.ToString();

            await using var rdr = await cmd.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);
            var oPropId       = rdr.GetOrdinal("prop_id");
            var oPropTypeCd   = rdr.GetOrdinal("prop_type_cd");
            var oGeoId        = rdr.GetOrdinal("geo_id");
            var oRefId1       = rdr.GetOrdinal("ref_id1");
            var oRefId2       = rdr.GetOrdinal("ref_id2");
            var oDbaName      = rdr.GetOrdinal("dba_name");
            var oAltDbaName   = rdr.GetOrdinal("alt_dba_name");
            var oPropCreateDt = rdr.GetOrdinal("prop_create_dt");

            while (await rdr.ReadAsync(cancellationToken).ConfigureAwait(false))
            {
                cancellationToken.ThrowIfCancellationRequested();
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
    }

    private static string? TrimOrNull(SqlDataReader rdr, int ordinal)
    {
        if (rdr.IsDBNull(ordinal)) return null;
        var raw = rdr.GetString(ordinal).Trim();
        return string.IsNullOrEmpty(raw) ? null : raw;
    }

    private static IEnumerable<List<T>> Chunk<T>(IEnumerable<T> source, int size)
    {
        var bucket = new List<T>(size);
        foreach (var item in source)
        {
            bucket.Add(item);
            if (bucket.Count == size)
            {
                yield return bucket;
                bucket = new List<T>(size);
            }
        }
        if (bucket.Count > 0) yield return bucket;
    }
}
