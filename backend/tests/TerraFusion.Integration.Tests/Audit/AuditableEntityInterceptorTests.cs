using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TerraFusion.Core.Auth;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Time;
using TerraFusion.Data;
using TerraFusion.Data.Interceptors;
using Xunit;

namespace TerraFusion.Integration.Tests.Audit;

/// <summary>
/// WS-3 / AU-2 acceptance tests for the audit-stamping interceptor (T1–T8).
/// Written test-first against the real repo types: TerraFusionDbContext,
/// PropertyAssessment (auditable), Property (non-auditable), and the
/// Core.Entities.AuditLog row that the AuditLogs DbSet maps.
///
/// The interceptor is wired at the options level (AddInterceptors) so each test
/// exercises the same write pipeline production uses, with injected fakes for the
/// clock and the request user. SuppressAuditLogging is set on the context so the
/// legacy broad-audit path is off and the assertions observe only the interceptor.
/// </summary>
public class AuditableEntityInterceptorTests
{
    private static readonly DateTime T1 = new(2026, 1, 1, 12, 0, 0, DateTimeKind.Utc);
    private static readonly DateTime T2 = new(2026, 2, 2, 8, 30, 0, DateTimeKind.Utc);

    private static RequestUserContext Alice => new(
        IsAuthenticated: true, UserId: "alice", CountyId: "benton", Roles: Array.Empty<string>());

    private sealed class FixedClock : IClock
    {
        public FixedClock(DateTime utc) => UtcNow = utc;
        public DateTime UtcNow { get; set; }
    }

    private sealed class FakeUser : IRequestUserContextAccessor
    {
        public RequestUserContext Current { get; set; } = RequestUserContext.Anonymous;
    }

    private static TerraFusionDbContext CreateContext(
        string databaseName, IClock clock, IRequestUserContextAccessor users)
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName)
            .AddInterceptors(new AuditableEntityInterceptor(clock, users))
            .Options;

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = "InMemory",
                ["Logging:EnableSensitiveDataLogging"] = "false"
            })
            .Build();

        // The interceptor is the single audit path; the legacy broad-audit emission was
        // retired from the context, so these tests observe only the interceptor's output.
        return new TerraFusionDbContext(options, configuration);
    }

    private static PropertyAssessment NewAssessment() => new()
    {
        Id = Guid.NewGuid(),
        PropertyId = Guid.NewGuid(),
        AssessmentYear = 2026,
        AssessedValue = 100_000m
    };

    [Fact] // T1
    public async System.Threading.Tasks.Task insert_stamps_created_and_updated()
    {
        var clock = new FixedClock(T1);
        var users = new FakeUser { Current = Alice };
        await using var ctx = CreateContext(nameof(insert_stamps_created_and_updated), clock, users);

        var pa = NewAssessment();
        ctx.PropertyAssessments.Add(pa);
        await ctx.SaveChangesAsync();

        pa.CreatedAt.Should().Be(T1);
        pa.UpdatedAt.Should().Be(T1);
        pa.CreatedBy.Should().Be("alice");
        pa.UpdatedBy.Should().Be("alice");
    }

    [Fact] // T2
    public async System.Threading.Tasks.Task update_refreshes_updated_only()
    {
        var clock = new FixedClock(T1);
        var users = new FakeUser { Current = Alice };
        await using var ctx = CreateContext(nameof(update_refreshes_updated_only), clock, users);

        var pa = NewAssessment();
        ctx.PropertyAssessments.Add(pa);
        await ctx.SaveChangesAsync();

        clock.UtcNow = T2;
        pa.AssessedValue = 120_000m;
        await ctx.SaveChangesAsync();

        pa.UpdatedAt.Should().Be(T2);
        pa.UpdatedBy.Should().Be("alice");
        pa.CreatedAt.Should().Be(T1, "CreatedAt must not change on update");
        pa.CreatedBy.Should().Be("alice", "CreatedBy must not change on update");
    }

    [Fact] // T3
    public async System.Threading.Tasks.Task caller_cannot_override_created()
    {
        var clock = new FixedClock(T1);
        var users = new FakeUser { Current = Alice };
        await using var ctx = CreateContext(nameof(caller_cannot_override_created), clock, users);

        var pa = NewAssessment();
        ctx.PropertyAssessments.Add(pa);
        await ctx.SaveChangesAsync();

        // Malicious caller tries to rewrite the creation provenance on update.
        clock.UtcNow = T2;
        pa.CreatedBy = "hacker";
        pa.CreatedAt = new DateTime(2000, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        pa.AssessedValue = 999_999m;
        await ctx.SaveChangesAsync();

        pa.CreatedBy.Should().Be("alice", "interceptor wins: CreatedBy is tamper-proof");
        pa.CreatedAt.Should().Be(T1, "interceptor wins: CreatedAt is tamper-proof");
    }

    [Fact] // T4
    public async System.Threading.Tasks.Task no_httpcontext_falls_back_to_system()
    {
        var clock = new FixedClock(T1);
        var users = new FakeUser { Current = RequestUserContext.Anonymous };
        await using var ctx = CreateContext(nameof(no_httpcontext_falls_back_to_system), clock, users);

        var pa = NewAssessment();
        ctx.PropertyAssessments.Add(pa);
        var act = async () => await ctx.SaveChangesAsync();

        await act.Should().NotThrowAsync();
        pa.CreatedBy.Should().Be("system");
        pa.UpdatedBy.Should().Be("system");
    }

    [Fact] // T5
    public async System.Threading.Tasks.Task audit_log_row_written_per_change()
    {
        var clock = new FixedClock(T1);
        var users = new FakeUser { Current = Alice };
        await using var ctx = CreateContext(nameof(audit_log_row_written_per_change), clock, users);

        var pa = NewAssessment();
        ctx.PropertyAssessments.Add(pa);
        await ctx.SaveChangesAsync();
        ctx.AuditLogs.Count().Should().Be(1, "one row per insert");

        var row = ctx.AuditLogs.Single();
        row.UserId.Should().Be("alice");
        row.Timestamp.Should().Be(T1);
        row.Type.Should().Contain(nameof(PropertyAssessment));
        row.Source.Should().Be("AuditableEntityInterceptor");
        row.Data.Should().Contain("benton", "county is captured from the request user context");

        clock.UtcNow = T2;
        pa.AssessedValue = 130_000m;
        await ctx.SaveChangesAsync();
        ctx.AuditLogs.Count().Should().Be(2, "one more row per update");

        ctx.PropertyAssessments.Remove(pa);
        await ctx.SaveChangesAsync();
        ctx.AuditLogs.Count().Should().Be(3, "one more row per delete");
    }

    [Fact] // T6
    public async System.Threading.Tasks.Task interceptor_touches_only_audit_fields_leaving_domain_data_intact()
    {
        // Sovereign-county isolation note (RP-10.5): the interceptor writes ONLY the
        // four audit fields and never domain columns (incl. CountyId where present).
        var clock = new FixedClock(T1);
        var users = new FakeUser { Current = Alice };
        await using var ctx = CreateContext(nameof(interceptor_touches_only_audit_fields_leaving_domain_data_intact), clock, users);

        var pa = NewAssessment();
        var propertyId = pa.PropertyId;
        ctx.PropertyAssessments.Add(pa);
        await ctx.SaveChangesAsync();

        clock.UtcNow = T2;
        pa.AssessedValue = 150_000m; // caller's own domain change
        await ctx.SaveChangesAsync();

        pa.AssessedValue.Should().Be(150_000m, "caller's domain change is preserved");
        pa.PropertyId.Should().Be(propertyId, "interceptor must not alter domain keys");
        pa.AssessmentYear.Should().Be(2026, "interceptor must not alter domain fields");
    }

    [Fact] // T7
    public async System.Threading.Tasks.Task non_auditable_entity_untouched_and_unlogged()
    {
        var clock = new FixedClock(T1);
        var users = new FakeUser { Current = Alice };
        await using var ctx = CreateContext(nameof(non_auditable_entity_untouched_and_unlogged), clock, users);

        // Property does NOT implement IAuditableEntity.
        var property = new Property
        {
            Id = Guid.NewGuid(),
            CountyId = Guid.NewGuid(),
            PropertyId = "P-1",
            ParcelId = "K001",
            ParcelNumber = "K001",
            Address = "100 Main St"
        };
        ctx.Properties.Add(property);
        await ctx.SaveChangesAsync();

        ctx.AuditLogs.Count().Should().Be(0, "non-auditable writes produce no audit row");
    }

    [Fact] // T8
    public async System.Threading.Tasks.Task bulk_save_all_stamped_and_logged()
    {
        var clock = new FixedClock(T1);
        var users = new FakeUser { Current = Alice };
        await using var ctx = CreateContext(nameof(bulk_save_all_stamped_and_logged), clock, users);

        const int n = 5;
        var batch = Enumerable.Range(0, n).Select(_ => NewAssessment()).ToList();
        ctx.PropertyAssessments.AddRange(batch);
        await ctx.SaveChangesAsync();

        batch.Should().OnlyContain(pa => pa.CreatedBy == "alice" && pa.UpdatedBy == "alice");
        batch.Should().OnlyContain(pa => pa.CreatedAt == T1 && pa.UpdatedAt == T1);
        ctx.AuditLogs.Count().Should().Be(n, "no write bypasses stamping: one audit row per entity");
    }
}
