using System;
using System.Collections.Generic;
using System.Linq;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TerraFusion.Core.Auth;
using TerraFusion.Core.Entities.Forge;
using TerraFusion.Core.Time;
using TerraFusion.Data;
using TerraFusion.Data.Interceptors;
using Xunit;

namespace TerraFusion.Integration.Tests.Forge;

/// <summary>
/// WS-1 — V9: a reconciled ValuationResult is persisted (audit-stamped via WS-3) with its
/// explanation + breakdown and is retrievable by parcel + year, county-scoped.
/// </summary>
public class ParcelValuationPersistenceTests
{
    private static readonly Guid Parcel = Guid.Parse("33333333-3333-3333-3333-333333333333");
    private static readonly Guid CountyA = Guid.Parse("11111111-1111-1111-1111-111111111111");

    private static ValuationResult ResidentialResult() => ValuationEngine.Value(new ParcelValuationInput(
        Parcel, 2025, CountyA, "Residential",
        new[] { new ApproachValue("Cost", 200_000m), new ApproachValue("Sales", 220_000m) }));

    private static TerraFusionDbContext Ctx(string db, string user)
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(db)
            .AddInterceptors(new AuditableEntityInterceptor(
                new FixedClock(new DateTime(2026, 6, 6, 12, 0, 0, DateTimeKind.Utc)),
                new FakeUser { Current = new RequestUserContext(true, user, CountyA.ToString(), Array.Empty<string>()) }))
            .Options;
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["ConnectionStrings:DefaultConnection"] = "InMemory" }).Build();
        return new TerraFusionDbContext(options, config);
    }

    [Fact] // V9
    public async System.Threading.Tasks.Task valuation_is_persisted_audit_stamped_and_retrievable_by_parcel_year()
    {
        await using var ctx = Ctx(nameof(valuation_is_persisted_audit_stamped_and_retrievable_by_parcel_year), "assessor.jane");

        ctx.ParcelValuations.Add(ParcelValuation.FromResult(ResidentialResult(), engineVersion: "forge-native-v1"));
        await ctx.SaveChangesAsync();

        var loaded = ctx.ParcelValuations.Single(v => v.CountyId == CountyA && v.TfParcelId == Parcel && v.Year == 2025);
        loaded.IndicatedValue.Should().Be(210_000m);
        loaded.PropertyType.Should().Be("Residential");
        loaded.Explanation.Should().Contain("Reconciled");
        loaded.BreakdownJson.Should().Contain("Cost").And.Contain("Sales");
        loaded.EngineVersion.Should().Be("forge-native-v1");
        loaded.CreatedBy.Should().Be("assessor.jane", "persisted valuation is audit-stamped via WS-3");
        ctx.AuditLogs.Count(a => a.Type.Contains(nameof(ParcelValuation))).Should().Be(1);
    }

    [Fact] // not-found valuation is not persisted as a value
    public void unfound_result_maps_but_is_flagged_unfound()
    {
        var empty = ValuationEngine.Value(new ParcelValuationInput(Parcel, 2025, CountyA, "Residential", Array.Empty<ApproachValue>()));
        var row = ParcelValuation.FromResult(empty, "forge-native-v1");
        row.Found.Should().BeFalse();
        row.IndicatedValue.Should().Be(0m);
    }

    private sealed class FixedClock : IClock
    {
        public FixedClock(DateTime utc) => UtcNow = utc;
        public DateTime UtcNow { get; }
    }

    private sealed class FakeUser : IRequestUserContextAccessor
    {
        public RequestUserContext Current { get; set; } = RequestUserContext.Anonymous;
    }
}
