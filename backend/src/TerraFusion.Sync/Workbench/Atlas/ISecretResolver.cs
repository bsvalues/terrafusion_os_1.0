namespace TerraFusion.Sync.Workbench.Atlas;

/// <summary>
/// Resolves operator-supplied secrets (currently SQL Auth passwords) by name.
///
/// The locked Sync doctrine forbids storing source-system passwords in the
/// repo, in <see cref="TerraFusion.Core.Entities.Sync.SyncSourceConnection"/>,
/// or in <c>SyncSourceConnection.AdditionalOptions</c>. Passwords live only in
/// the operator's process environment and are resolved here at connection time.
///
/// Implementations:
///   - <see cref="EnvironmentSecretResolver"/> — reads from <c>Environment.GetEnvironmentVariable</c>.
///   - Future implementations may delegate to Windows Credential Manager,
///     HashiCorp Vault, Azure Key Vault, etc. without changing call sites.
/// </summary>
public interface ISecretResolver
{
    /// <summary>
    /// Resolve the secret value for <paramref name="secretName"/>. Throws
    /// <see cref="InvalidOperationException"/> if the secret is missing or empty.
    /// </summary>
    string ResolveRequired(string secretName);
}
