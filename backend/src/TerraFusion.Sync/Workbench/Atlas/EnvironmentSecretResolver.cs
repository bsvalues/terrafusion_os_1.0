namespace TerraFusion.Sync.Workbench.Atlas;

/// <summary>
/// Default <see cref="ISecretResolver"/> implementation. Reads secret values
/// from process environment variables. The operator sets the variable before
/// invoking the CLI; the value never persists to disk or to the TerraFusion DB.
/// </summary>
public sealed class EnvironmentSecretResolver : ISecretResolver
{
    public string ResolveRequired(string secretName)
    {
        if (string.IsNullOrWhiteSpace(secretName))
        {
            throw new InvalidOperationException("Secret name is required.");
        }

        var value = Environment.GetEnvironmentVariable(secretName);

        if (string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidOperationException(
                $"Required secret environment variable '{secretName}' is not set or is empty. "
                + "Set it in the operator's shell before invoking SyncAtlas.");
        }

        return value;
    }
}
