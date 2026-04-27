using System;
using System.Collections.Generic;
using System.Globalization;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Data.SqlClient;
using TerraFusion.Core.Entities.Sync;
using TerraFusion.Sync.Workbench.Atlas;
using TerraFusion.Sync.Workbench.Mapping;

namespace TerraFusion.Sync.Workbench.Transforms.Sales;

/// <summary>
/// Slice C8-C live implementation of <see cref="ISalesRowReader"/>.
/// Issues a TOP-N <c>SELECT</c> against <c>dbo.sale</c> on the source
/// SQL Server, returning only the qualification-relevant columns plus
/// the PACS row identifier (<c>chg_of_owner_id</c>) for log/audit.
///
/// <para>Read-only by construction. The query is a bare <c>SELECT</c>;
/// there are no UPDATE / INSERT / DELETE / DDL statements. The
/// connection string is built via the locked B1.6.5 path
/// (<see cref="SqlServerMetadataReaderFactory.BuildConnectionString"/>)
/// — SQL Auth passwords come from the operator's process environment
/// via <see cref="ISecretResolver"/>, never from the entity, never
/// from a repo file.</para>
///
/// <para>Bounded by <paramref name="maxRows"/>: the SQL <c>TOP (N)</c>
/// runs server-side, so we never pull more than N rows over the wire.
/// The <c>ORDER BY chg_of_owner_id</c> gives a deterministic
/// "first N by id" sample so re-runs against an unchanged PACS table
/// land on the same rows.</para>
/// </summary>
public sealed class SqlServerSalesRowReader : ISalesRowReader
{
    private readonly ISecretResolver _secretResolver;

    public SqlServerSalesRowReader(ISecretResolver secretResolver)
    {
        ArgumentNullException.ThrowIfNull(secretResolver);
        _secretResolver = secretResolver;
    }

    public async Task<IReadOnlyList<SalesRow>> ReadAsync(
        SyncSourceConnection connection,
        int maxRows,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(connection);
        if (maxRows <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(maxRows), "maxRows must be positive.");
        }

        if (!string.Equals(connection.ConnectionType, "SqlServer", StringComparison.OrdinalIgnoreCase))
        {
            throw new NotSupportedException(
                $"SqlServerSalesRowReader cannot handle ConnectionType '{connection.ConnectionType}'.");
        }

        var connectionString = SqlServerMetadataReaderFactory.BuildConnectionString(connection, _secretResolver);

        var sql = string.Format(
            CultureInfo.InvariantCulture,
            "SELECT TOP ({0}) " +
            "    s.chg_of_owner_id AS sale_id, " +
            "    s.wac_cd, " +
            "    s.sl_ratio_type_cd " +
            "FROM dbo.sale AS s " +
            "ORDER BY s.chg_of_owner_id;",
            maxRows);

        await using var sqlConnection = new SqlConnection(connectionString);
        await sqlConnection.OpenAsync(cancellationToken);

        await using var cmd = new SqlCommand(sql, sqlConnection);
        await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);

        var rows = new List<SalesRow>(maxRows);
        while (await reader.ReadAsync(cancellationToken))
        {
            rows.Add(new SalesRow(
                SaleIdentifier:    reader.IsDBNull(0) ? null : reader.GetValue(0)?.ToString(),
                WacCode:           reader.IsDBNull(1) ? null : reader.GetValue(1)?.ToString(),
                SaleRatioTypeCode: reader.IsDBNull(2) ? null : reader.GetValue(2)?.ToString()));
        }
        return rows;
    }
}
