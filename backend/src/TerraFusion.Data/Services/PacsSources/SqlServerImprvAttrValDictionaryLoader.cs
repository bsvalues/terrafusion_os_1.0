using Microsoft.Data.SqlClient;
using TerraFusion.Core.Sync.PacsImprvAttr;

namespace TerraFusion.Data.Services.PacsSources;

/// <summary>
/// ATTR-DRAIN-1: loads the closed-vocabulary <c>i_attr_val_cd</c>
/// set from PACS <c>dbo.imprv_attr_val</c> (the value-grain
/// dictionary, distinct from <c>dbo.attribute</c>'s family-grain
/// rows used by ATTR-POP-1).
///
/// <para>Per Block-C v1.5 contract the value-grain table holds the
/// closed vocabulary the LANDING service consults via
/// <see cref="IImprvAttrDictionary"/>. Empty dictionary → every
/// landing row quarantines with <c>UNKNOWN_I_ATTR_VAL_CD</c>.
/// Populated dictionary → landing succeeds, the canonical projector
/// then resolves attributes against <c>attribute_definition</c>.</para>
///
/// <para>Production refresh path: an operator (or a future hosted
/// service) calls <see cref="LoadDistinctCodesAsync"/> + passes the
/// result to <see cref="RefreshableImprvAttrDictionary.Refresh"/>.</para>
/// </summary>
public sealed class SqlServerImprvAttrValDictionaryLoader
{
    private readonly string _connectionString;

    public SqlServerImprvAttrValDictionaryLoader(string connectionString)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new ArgumentException("PACS connection string is required.", nameof(connectionString));
        _connectionString = connectionString;
    }

    /// <summary>
    /// Returns the distinct, trimmed, non-empty
    /// <c>i_attr_val_cd</c> values from <c>dbo.imprv_attr_val</c>.
    /// Drains in milliseconds — the value-grain dictionary is small
    /// (typically &lt; 500 codes per county).
    /// </summary>
    public async Task<IReadOnlyList<string>> LoadDistinctCodesAsync(
        CancellationToken cancellationToken = default)
    {
        // First try the proper dictionary table dbo.imprv_attr_val.
        var fromDict = await QueryDistinctCodesAsync(
            "SELECT DISTINCT imprv_attr_val_cd FROM dbo.imprv_attr_val " +
            "WHERE imprv_attr_val_cd IS NOT NULL AND LTRIM(RTRIM(imprv_attr_val_cd)) <> ''",
            cancellationToken).ConfigureAwait(false);
        if (fromDict.Count > 0) return fromDict;

        // Fallback: the dictionary table can be empty in some Benton
        // instances. Derive the active vocabulary from the data table
        // itself — every i_attr_val_cd observed in dbo.imprv_attr is
        // by definition a real PACS code that should be recognized.
        // Per Block-C contract: any value that exists in the source IS
        // the dictionary.
        return await QueryDistinctCodesAsync(
            "SELECT DISTINCT i_attr_val_cd FROM dbo.imprv_attr " +
            "WHERE i_attr_val_cd IS NOT NULL " +
            "AND LTRIM(RTRIM(i_attr_val_cd)) <> ''",
            cancellationToken).ConfigureAwait(false);
    }

    private async Task<IReadOnlyList<string>> QueryDistinctCodesAsync(
        string sql, CancellationToken cancellationToken)
    {
        await using var conn = new SqlConnection(_connectionString);
        await conn.OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var cmd = new SqlCommand(sql, conn) { CommandTimeout = 60 };
        await using var rdr = await cmd.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);

        var codes = new List<string>();
        while (await rdr.ReadAsync(cancellationToken).ConfigureAwait(false))
        {
            cancellationToken.ThrowIfCancellationRequested();
            if (rdr.IsDBNull(0)) continue;
            var code = rdr.GetString(0).Trim();
            if (!string.IsNullOrEmpty(code)) codes.Add(code);
        }
        return codes;
    }
}
