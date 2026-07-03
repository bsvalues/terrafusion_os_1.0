using System;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.Auth;
using TerraFusion.Core.Entities;
using TerraFusion.Data.Auditing;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.Audit;

// WO-AU2-1 (SW-09): AuditableEntityInterceptor stamps CreatedAt/By + UpdatedAt/By
// on IAuditableEntity instances during SaveChanges, actor from
// IRequestUserContextAccessor (fallback "system"). Tested in isolation with a
// tiny DbContext + test entity so the assertion is about the interceptor, not
// the full TerraFusion model.
[Trait("Category", "Audit")]
public sealed class AuditableEntityInterceptorTests
{
    private sealed class FakeUserContext : IRequestUserContextAccessor
    {
        public RequestUserContext Current { get; set; } = RequestUserContext.Anonymous;
    }

    private sealed class Sample : IAuditableEntity
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public string? UpdatedBy { get; set; }
    }

    private sealed class SampleDbContext : DbContext
    {
        public SampleDbContext(DbContextOptions<SampleDbContext> options) : base(options) { }
        public DbSet<Sample> Samples => Set<Sample>();
    }

    private static SampleDbContext NewDb(IRequestUserContextAccessor accessor, string name)
    {
        var options = new DbContextOptionsBuilder<SampleDbContext>()
            .UseInMemoryDatabase($"AuditInt-{name}-{Guid.NewGuid()}")
            .AddInterceptors(new AuditableEntityInterceptor(accessor))
            .Options;
        return new SampleDbContext(options);
    }

    [Fact]
    public async Task Added_StampsAllFour_FromAuthenticatedUser()
    {
        var accessor = new FakeUserContext
        {
            Current = new RequestUserContext(true, "user-42", "county-1", Array.Empty<string>())
        };
        await using var db = NewDb(accessor, nameof(Added_StampsAllFour_FromAuthenticatedUser));

        var e = new Sample { Name = "x" };
        db.Samples.Add(e);
        await db.SaveChangesAsync();

        e.CreatedBy.Should().Be("user-42");
        e.UpdatedBy.Should().Be("user-42");
        e.CreatedAt.Should().NotBe(default);
        e.UpdatedAt.Should().Be(e.CreatedAt);
    }

    [Fact]
    public async Task Added_NoAuthenticatedUser_StampsSystem()
    {
        var accessor = new FakeUserContext(); // Anonymous
        await using var db = NewDb(accessor, nameof(Added_NoAuthenticatedUser_StampsSystem));

        var e = new Sample { Name = "x" };
        db.Samples.Add(e);
        await db.SaveChangesAsync();

        e.CreatedBy.Should().Be("system");
        e.UpdatedBy.Should().Be("system");
    }

    [Fact]
    public async Task Modified_RefreshesUpdatedOnly_PreservesCreated()
    {
        var accessor = new FakeUserContext
        {
            Current = new RequestUserContext(true, "creator", null, Array.Empty<string>())
        };
        await using var db = NewDb(accessor, nameof(Modified_RefreshesUpdatedOnly_PreservesCreated));

        var e = new Sample { Name = "x" };
        db.Samples.Add(e);
        await db.SaveChangesAsync();
        var createdAt = e.CreatedAt;
        var createdBy = e.CreatedBy;

        accessor.Current = new RequestUserContext(true, "editor", null, Array.Empty<string>());
        e.Name = "y";
        await db.SaveChangesAsync();

        e.CreatedBy.Should().Be(createdBy, "Created* must be preserved on update");
        e.CreatedAt.Should().Be(createdAt);
        e.UpdatedBy.Should().Be("editor", "Updated* must reflect the editing actor");
        e.UpdatedAt.Should().BeOnOrAfter(createdAt);
    }
}
