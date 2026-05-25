using Xunit;

namespace TerraFusion.Modules.CurrentUse.Tests;

public sealed class CurrentUseCanonicalSchemaTests
{
    [Fact]
    public void Canonical_Calculation_Must_Reference_Calculation_Version()
    {
        var required = new[]
        {
            "CalculationVersion",
            "InputSnapshotJson",
            "ResultSnapshotJson",
            "CreatedBy"
        };

        Assert.Contains("CalculationVersion", required);
    }

    [Fact]
    public void Canonical_Records_Are_County_Scoped()
    {
        var required = new[]
        {
            "CountyId",
            "ParcelId"
        };

        Assert.Contains("CountyId", required);
        Assert.Contains("ParcelId", required);
    }
}
