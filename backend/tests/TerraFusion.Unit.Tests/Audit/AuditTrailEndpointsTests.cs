using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.API.Controllers;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Entities;
using Xunit;
using DataDbContext = TerraFusion.Data.TerraFusionDbContext;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.Audit;

// WO-AUDIT-ROUTE-001 (SW-09): /api/audit/trail + /api/audit/search read AuditEvents
// and map to the Dais AuditEvent contract. AuditEvents is empty in the demo, so the
// endpoints return [] honestly — these tests seed rows to prove the mapping/filtering.
[Trait("Category", "Audit")]
public sealed class AuditTrailEndpointsTests
{
    private static readonly Guid CountyId = new("19190019-1919-1919-1919-191919191919");

    private static DataDbContext CreateDb(string name)
    {
        var options = new DbContextOptionsBuilder<DataDbContext>()
            .UseInMemoryDatabase($"AuditTrail-{name}-{Guid.NewGuid()}")
            .Options;
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>()).Build();
        return new DataDbContext(options, config);
    }

    private static AuditController CreateController(DataDbContext db, bool withCounty = true)
    {
        var controller = new AuditController(db, NullLogger<AuditController>.Instance);
        var claimList = new List<Claim> { new("sub", "test-user") };
        if (withCounty) claimList.Add(new Claim("countyId", CountyId.ToString()));
        var user = new ClaimsPrincipal(new ClaimsIdentity(claimList, "TestAuth"));
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = user } };
        return controller;
    }

    private static readonly Guid OtherCountyId = new("22222222-2222-2222-2222-222222222222");

    private static async Task Seed(DataDbContext db)
    {
        db.AuditEvents.AddRange(
            new AuditEvent { Id = "e1", Entity = "Parcel", EntityId = "P1", UserId = "u1", Action = "ValueChanged", Type = AuditEventType.Update, Timestamp = DateTime.UtcNow.AddMinutes(-5), CountyId = CountyId, DetailsJson = "{\"previousValue\":\"100\",\"newValue\":\"200\",\"details\":\"reval\"}" },
            new AuditEvent { Id = "e2", Entity = "Appeal", EntityId = "P1", UserId = "u2", Action = "AppealFiled", Type = AuditEventType.Create, Timestamp = DateTime.UtcNow, CountyId = CountyId, DetailsJson = "not-json" },
            new AuditEvent { Id = "e3", Entity = "Parcel", EntityId = "P2", UserId = "u1", Action = "Viewed", Type = AuditEventType.View, Timestamp = DateTime.UtcNow, CountyId = CountyId, DetailsJson = "" });
        await db.SaveChangesAsync();
    }

    private static List<AuditTrailEventDto> Ok(IActionResult result)
        => ((result as OkObjectResult)!.Value as IEnumerable<AuditTrailEventDto>)!.ToList();

    [Fact]
    public async Task Trail_MissingParcelId_ReturnsBadRequest()
    {
        await using var db = CreateDb(nameof(Trail_MissingParcelId_ReturnsBadRequest));
        var result = await CreateController(db).GetAuditTrail(null);
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Trail_NoCountyClaim_ReturnsForbid()
    {
        await using var db = CreateDb(nameof(Trail_NoCountyClaim_ReturnsForbid));
        var result = await CreateController(db, withCounty: false).GetAuditTrail("P1");
        result.Should().BeOfType<ForbidResult>();
    }

    [Fact]
    public async Task Trail_EmptyTable_ReturnsEmptyList()
    {
        await using var db = CreateDb(nameof(Trail_EmptyTable_ReturnsEmptyList));
        var result = await CreateController(db).GetAuditTrail("P1");
        Ok(result).Should().BeEmpty();
    }

    [Fact]
    public async Task Trail_ReturnsParcelEvents_MappedAndNewestFirst()
    {
        await using var db = CreateDb(nameof(Trail_ReturnsParcelEvents_MappedAndNewestFirst));
        await Seed(db);

        var events = Ok(await CreateController(db).GetAuditTrail("P1"));

        events.Should().HaveCount(2);
        events[0].EventId.Should().Be("e2");   // newest first
        events[1].EventId.Should().Be("e1");

        var e1 = events[1];
        e1.ParcelId.Should().Be("P1");
        e1.Category.Should().Be("assessment");     // Entity "Parcel"
        e1.PreviousValue.Should().Be("100");
        e1.NewValue.Should().Be("200");
        e1.Details.Should().Be("reval");

        events[0].Category.Should().Be("appeal");  // Entity "Appeal"
        events[0].Details.Should().Be("not-json"); // non-JSON DetailsJson kept raw
    }

    [Fact]
    public async Task Search_FiltersByCategory()
    {
        await using var db = CreateDb(nameof(Search_FiltersByCategory));
        await Seed(db);

        var events = Ok(await CreateController(db).SearchAuditTrail(
            parcelId: null, startDate: null, endDate: null, userId: null, category: "appeal", action: null));

        events.Should().ContainSingle().Which.EventId.Should().Be("e2");
    }

    // ── WO-AUDIT-COUNTY-FILTER-001: county isolation ────────────────────

    [Fact]
    public async Task Trail_ExcludesEventsFromAnotherCounty()
    {
        await using var db = CreateDb(nameof(Trail_ExcludesEventsFromAnotherCounty));
        await Seed(db); // e1,e2 on P1 in CountyId
        db.AuditEvents.Add(new AuditEvent
        {
            Id = "x1", Entity = "Appeal", EntityId = "P1", UserId = "u9", Action = "AppealFiled",
            Type = AuditEventType.Create, Timestamp = DateTime.UtcNow.AddMinutes(1),
            CountyId = OtherCountyId, DetailsJson = "{}"
        });
        await db.SaveChangesAsync();

        var events = Ok(await CreateController(db).GetAuditTrail("P1"));

        events.Should().HaveCount(2);
        events.Select(e => e.EventId).Should().BeEquivalentTo(new[] { "e1", "e2" });
        events.Select(e => e.EventId).Should().NotContain("x1");
    }

    [Fact]
    public async Task Search_ExcludesEventsFromAnotherCounty()
    {
        await using var db = CreateDb(nameof(Search_ExcludesEventsFromAnotherCounty));
        await Seed(db);
        db.AuditEvents.Add(new AuditEvent
        {
            Id = "x1", Entity = "Appeal", EntityId = "P1", UserId = "u9", Action = "AppealFiled",
            Type = AuditEventType.Create, Timestamp = DateTime.UtcNow, CountyId = OtherCountyId, DetailsJson = "{}"
        });
        await db.SaveChangesAsync();

        var events = Ok(await CreateController(db).SearchAuditTrail(
            parcelId: null, startDate: null, endDate: null, userId: null, category: "appeal", action: null));

        // Only the in-county appeal (e2), not the other-county one (x1).
        events.Should().ContainSingle().Which.EventId.Should().Be("e2");
    }

    [Fact]
    public async Task Search_CategoryFilter_AppliedBeforePaging()
    {
        // 3 non-matching Parcel events (newest) + 1 matching Appeal (oldest); pageSize 2.
        // If category filtered AFTER paging, the Appeal would fall outside the window and be lost.
        await using var db = CreateDb(nameof(Search_CategoryFilter_AppliedBeforePaging));
        var baseTime = DateTime.UtcNow;
        for (var i = 0; i < 3; i++)
            db.AuditEvents.Add(new AuditEvent { Id = $"p{i}", Entity = "Parcel", EntityId = "P1", UserId = "u1", Action = "Viewed", Type = AuditEventType.View, Timestamp = baseTime.AddMinutes(i + 1), CountyId = CountyId, DetailsJson = "" });
        db.AuditEvents.Add(new AuditEvent { Id = "app", Entity = "Appeal", EntityId = "P1", UserId = "u2", Action = "AppealFiled", Type = AuditEventType.Create, Timestamp = baseTime, CountyId = CountyId, DetailsJson = "{}" });
        await db.SaveChangesAsync();

        var events = Ok(await CreateController(db).SearchAuditTrail(
            parcelId: null, startDate: null, endDate: null, userId: null, category: "appeal", action: null,
            page: 1, pageSize: 2));

        events.Should().ContainSingle().Which.EventId.Should().Be("app");
    }

    [Theory]
    [InlineData("Parcel", "assessment")]
    [InlineData("PropertyValuation", "assessment")]
    [InlineData("Appeal", "appeal")]
    [InlineData("BuildingPermit", "permit")]
    [InlineData("Exemption", "exemption")]
    [InlineData("Document", "document")]
    [InlineData("FieldVisit", "field")]
    [InlineData("LoginEvent", "system")]
    [InlineData(null, "system")]
    public void MapCategory_DerivesFromEntity(string? entity, string expected)
        => AuditTrailMapper.MapCategory(entity).Should().Be(expected);
}
