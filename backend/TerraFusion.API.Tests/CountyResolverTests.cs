// backend/TerraFusion.API.Tests/CountyResolverTests.cs
//
// Verifies that CountyResolver accepts all canonical forms of county identifier:
// Guid strings, case-insensitive county names. Also verifies throw/null semantics
// for unknown inputs and the memory cache behavior.

using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.API.Services;
using TerraFusion.API.Tests.TestHelpers;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Services;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.API.Tests;

public class CountyResolverTests
{
    private static readonly Guid BentonId = Guid.Parse("19190019-1919-1919-1919-191919191919");
    private static readonly Guid KingId   = Guid.Parse("29290029-2929-2929-2929-292929292929");

    private static CountyResolver CreateSut()
    {
        var ctx = TestDbContextFactory.CreateInMemoryContext();
        ctx.Counties.AddRange(
            new County { Id = BentonId, Name = "Benton", State = "WA", FipsCode = "53005" },
            new County { Id = KingId,   Name = "King",   State = "WA", FipsCode = "53033" });
        ctx.SaveChanges();

        var cache = new MemoryCache(new MemoryCacheOptions());
        return new CountyResolver(ctx, cache, NullLogger<CountyResolver>.Instance);
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
    public async Task ResolveAsync_DistinctCountyNames_ResolveToDifferentGuids()
    {
        var sut = CreateSut();
        var benton = await sut.ResolveAsync("benton");
        var king   = await sut.ResolveAsync("king");
        Assert.Equal(BentonId, benton);
        Assert.Equal(KingId,   king);
        Assert.NotEqual(benton, king);
    }
}
