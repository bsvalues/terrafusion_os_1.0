namespace TerraFusion.Sync.Workbench.Atlas;

/// <summary>
/// Conventional secret-name builders for SyncAtlas. Keeping the convention in
/// one place ensures the CLI, the factory, and operator runbooks all derive
/// the same env-var name from a given <c>SyncSourceConnection.Id</c>.
///
/// Convention for SQL Auth passwords:
///   SYNCATLAS_SECRET_&lt;guid-no-dashes-uppercase&gt;
///
/// Example for connection id <c>aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee</c>:
///   SYNCATLAS_SECRET_AAAAAAAABBBBCCCCDDDDEEEEEEEEEEEE
/// </summary>
public static class SyncAtlasSecretNames
{
    /// <summary>
    /// Env-var name that holds the SQL Auth password for the given connection.
    /// </summary>
    public static string ForSqlAuthPassword(Guid connectionId)
    {
        return $"SYNCATLAS_SECRET_{Normalize(connectionId)}";
    }

    private static string Normalize(Guid connectionId)
    {
        return connectionId.ToString("N").ToUpperInvariant();
    }
}
