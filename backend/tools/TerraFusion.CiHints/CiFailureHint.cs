namespace TerraFusion.CiHints;

public static class CiFailureHint
{
    public const string DriftGuardHint =
        "Rerun hint: remove any direct dotnet test from workflows and call dotnet-test.yml only.";

    public static string? Decide(string? primaryFailedJobName)
    {
        if (string.IsNullOrWhiteSpace(primaryFailedJobName))
        {
            return null;
        }

        var name = primaryFailedJobName.Trim().ToLowerInvariant();

        return name.Contains("drift") && name.Contains("guard") ? DriftGuardHint : null;
    }
}
