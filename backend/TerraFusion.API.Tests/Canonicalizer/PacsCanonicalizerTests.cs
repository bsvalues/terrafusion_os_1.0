using TerraFusion.API.Seeds;
using Xunit;

namespace TerraFusion.API.Tests.Canonicalizer;

public class PacsCanonicalizerTests
{
    [Theory]
    [InlineData("KENNEWICK", "Kennewick")]
    [InlineData("kennewick", "Kennewick")]
    [InlineData("  Kennewick  ", "Kennewick")]
    [InlineData("RICHLAND", "Richland")]
    [InlineData("PASCO", "Pasco")]
    [InlineData("PROSSER", "Prosser")]
    [InlineData("BENTON CITY", "Benton City")]
    [InlineData("WEST RICHLAND", "West Richland")]
    [InlineData("CLE ELUM", "Unincorporated")]
    [InlineData("", "Unincorporated")]
    [InlineData(null, "Unincorporated")]
    public void NormalizeCity_maps_to_canonical_benton_city(string? raw, string expected)
    {
        Assert.Equal(expected, PacsCanonicalizer.NormalizeCity(raw));
    }

    [Theory]
    [InlineData("R1", "R")]
    [InlineData("R2", "R")]
    [InlineData("M1", "M")]
    [InlineData("C1", "C")]
    [InlineData("C4", "C")]
    [InlineData("A1", "A")]
    [InlineData("A2", "A")]
    [InlineData("I1", "C")]
    [InlineData("S2", "C")]
    [InlineData("V", "V")]
    [InlineData("X", "X")]
    [InlineData("", "X")]
    [InlineData(null, "X")]
    [InlineData("ZZZ", "X")]
    public void DeriveStratum_buckets_building_types(string? bt, string expected)
    {
        Assert.Equal(expected, PacsCanonicalizer.DeriveStratum(bt));
    }
}
