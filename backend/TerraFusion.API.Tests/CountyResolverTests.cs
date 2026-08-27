// backend/TerraFusion.API.Tests/CountyResolverTests.cs
//
// Verifies that CountyResolver accepts all canonical forms of county identifier:
// Guid strings, case-insensitive county names. Also verifies throw/null semantics
// for unknown inputs and the memory cache behavior.

using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.API.Services;
using TerraFusion.API.Tests.TestHelpers;
using TerraFusion.Core.Counties;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Services;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.API.Tests;

public class CountyResolverTests
{
    private static readonly Guid BentonId = Guid.Parse("19190019-1919-1919-1919-191919191919");
    private static readonly Guid KingId   = Guid.Parse("29290029-2929-2929-2929-292929292929");

    private static CountyResolver CreateSut(params County[] counties)
    {
        var ctx = TestDbContextFactory.CreateInMemoryContext();
        var seededCounties = counties.Length > 0
            ? counties
            : new[]
            {
                new County { Id = BentonId, Name = "Benton", State = "WA", FipsCode = "53005" },
                new County { Id = KingId, Name = "King", State = "WA", FipsCode = "53033" },
            };
        ctx.Counties.AddRange(seededCounties);
        ctx.SaveChanges();

        var cache = new MemoryCache(new MemoryCacheOptions());
        return new CountyResolver(ctx, cache, NullLogger<CountyResolver>.Instance);
    }

    [Fact]
    public void WashingtonCountyRegistry_DefinesExactly39UniqueCanonicalIdentities()
    {
        var counties = WashingtonCountyRegistry.Counties;

        Assert.Equal(39, counties.Count);
        Assert.Equal(39, counties.Select(county => county.Key).Distinct(StringComparer.OrdinalIgnoreCase).Count());
        Assert.Equal(39, counties.Select(county => county.Slug).Distinct(StringComparer.OrdinalIgnoreCase).Count());
        Assert.Equal(39, counties.Select(county => county.Name).Distinct(StringComparer.OrdinalIgnoreCase).Count());
        Assert.Equal(39, counties.Select(county => county.FipsCode).Distinct(StringComparer.OrdinalIgnoreCase).Count());
        Assert.All(counties, county =>
        {
            Assert.Equal("WA", county.State);
            Assert.Matches("^53[0-9]{3}$", county.FipsCode);
            Assert.Equal(3, county.CountyCode.Length);
        });
    }

    [Fact]
    public void WashingtonCountyRegistry_ResolvesEveryCanonicalAliasToOneIdentity()
    {
        foreach (var county in WashingtonCountyRegistry.Counties)
        {
            var aliases = new[]
            {
                county.Key,
                county.Slug,
                county.Name,
                $"{county.Name} County",
                county.FipsCode,
                county.CountyCode,
            };

            foreach (var alias in aliases)
            {
                Assert.True(WashingtonCountyRegistry.TryResolve($"  {alias.ToUpperInvariant()}  ", out var resolved));
                Assert.Equal(county, resolved);
            }
        }
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("unknown")]
    [InlineData("53079")]
    public void WashingtonCountyRegistry_UnknownInputHasNoDefault(string? input)
    {
        Assert.False(WashingtonCountyRegistry.TryResolve(input, out _));
    }

    [Fact]
    public async Task ResolveAsync_AcceptsGuidStringForKnownCounty()
    {
        var sut = CreateSut();
        var result = await sut.ResolveAsync(BentonId.ToString());
        Assert.Equal(BentonId, result);
    }

    [Fact]
    public async Task ResolveAsync_AcceptsCountyNameLowerCase()
    {
        var sut = CreateSut();
        var result = await sut.ResolveAsync("benton");
        Assert.Equal(BentonId, result);
    }

    [Fact]
    public async Task ResolveAsync_AcceptsCountyNameMixedCase()
    {
        var sut = CreateSut();
        var result = await sut.ResolveAsync("BeNtOn");
        Assert.Equal(BentonId, result);
    }

    [Fact]
    public async Task ResolveAsync_AcceptsCountyNameWithSurroundingWhitespace()
    {
        var sut = CreateSut();
        var result = await sut.ResolveAsync("  benton  ");
        Assert.Equal(BentonId, result);
    }

    [Theory]
    [InlineData("wa-benton")]
    [InlineData("benton-wa")]
    [InlineData("Benton County")]
    [InlineData("53005")]
    [InlineData("005")]
    public async Task ResolveAsync_AcceptsCanonicalWashingtonIdentityAliases(string input)
    {
        var sut = CreateSut();
        var result = await sut.ResolveAsync(input);
        Assert.Equal(BentonId, result);
    }

    [Fact]
    public async Task ResolveAsync_ThrowsForUnknownCounty()
    {
        var sut = CreateSut();
        var ex = await Assert.ThrowsAsync<CountyNotFoundException>(
            () => sut.ResolveAsync("nonexistent"));
        Assert.Equal("nonexistent", ex.Input);
    }

    [Fact]
    public async Task ResolveAsync_ThrowsForGuidThatDoesNotExistInDb()
    {
        var sut = CreateSut();
        var unknownGuid = Guid.NewGuid();
        await Assert.ThrowsAsync<CountyNotFoundException>(
            () => sut.ResolveAsync(unknownGuid.ToString()));
    }

    [Fact]
    public async Task ResolveAsync_ThrowsForEmptyInput()
    {
        var sut = CreateSut();
        await Assert.ThrowsAsync<CountyNotFoundException>(
            () => sut.ResolveAsync(""));
    }

    [Fact]
    public async Task TryResolveAsync_ReturnsNullForUnknownCounty()
    {
        var sut = CreateSut();
        var result = await sut.TryResolveAsync("nonexistent");
        Assert.Null(result);
    }

    [Fact]
    public async Task TryResolveAsync_ReturnsNullForEmptyInput()
    {
        var sut = CreateSut();
        var result = await sut.TryResolveAsync("");
        Assert.Null(result);
    }

    [Fact]
    public async Task TryResolveAsync_ReturnsNullWhenPersistedIdentityRowsAreDuplicated()
    {
        var sut = CreateSut(
            new County { Id = BentonId, Name = "Benton", State = "WA", FipsCode = "53005" },
            new County { Id = KingId, Name = "Benton", State = "WA", FipsCode = "53005" });

        Assert.Null(await sut.TryResolveAsync("benton"));
        Assert.Null(await sut.TryResolveAsync("53005"));
    }

    [Fact]
    public async Task TryResolveAsync_ReturnsNullWhenPersistedNameAndFipsConflict()
    {
        var sut = CreateSut(
            new County { Id = BentonId, Name = "Benton", State = "WA", FipsCode = "53033" });

        Assert.Null(await sut.TryResolveAsync("benton"));
        Assert.Null(await sut.TryResolveAsync("53033"));
    }

    [Fact]
    public async Task TryResolveAsync_DoesNotTreatNonWashingtonRowAsCountyAuthority()
    {
        var sut = CreateSut(
            new County { Id = BentonId, Name = "Benton", State = "OR", FipsCode = "53005" });

        Assert.Null(await sut.TryResolveAsync("benton"));
        Assert.Null(await sut.TryResolveAsync(BentonId.ToString()));
    }

    [Fact]
    public async Task ResolveAsync_DistinctCountyNames_ResolveToDifferentGuids()
    {
        var sut = CreateSut();
        var benton = await sut.ResolveAsync("benton");
        var king   = await sut.ResolveAsync("king");
        Assert.Equal(BentonId, benton);
        Assert.Equal(KingId,   king);
        Assert.NotEqual(benton, king);
    }

    // Regression: the shared IMemoryCache in Program.cs is configured with a
    // SizeLimit, so any cache Set() without a Size throws
    // "Cache entry must specify a value for Size when SizeLimit is set."
    // A live smoke test of /api/county-study/studies?countyId=benton surfaced
    // this; the CreateSut() tests above use a no-limit MemoryCache so they
    // missed it. This test locks the fix against the production-shaped cache.
    [Fact]
    public async Task ResolveAsync_WorksWith_SizeLimited_MemoryCache()
    {
        var ctx = TestDbContextFactory.CreateInMemoryContext();
        ctx.Counties.Add(new County { Id = BentonId, Name = "Benton", State = "WA", FipsCode = "53005" });
        ctx.SaveChanges();

        // Production-shaped cache: SizeLimit forces every entry to specify Size.
        var cache = new MemoryCache(new MemoryCacheOptions { SizeLimit = 10 });
        var sut = new CountyResolver(ctx, cache, NullLogger<CountyResolver>.Instance);

        // First call populates the cache — the bug threw here before the fix.
        var first = await sut.ResolveAsync("benton");
        Assert.Equal(BentonId, first);

        // Second call hits the cache without re-querying, still returning the right Guid.
        var second = await sut.ResolveAsync(BentonId.ToString());
        Assert.Equal(BentonId, second);
    }
}
