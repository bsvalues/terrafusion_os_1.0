using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TerraFusion.API.Services;
using TerraFusion.Core.Auth;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Entities;
using Xunit;
using DataDbContext = TerraFusion.Data.TerraFusionDbContext;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.Audit;

// WO-AU2-3 (SW-09): AuditEventWriter writes per-parcel AuditEvents rows (the trail
// feed); GovernedToolAuditService emits one for every governed Dais tool call.
[Trait("Category", "Audit")]
public sealed class AuditEventEmissionTests
{
    private sealed class FakeUserContext : IRequestUserContextAccessor
    {
        public RequestUserContext Current { get; set; } = RequestUserContext.Anonymous;
    }

    private static DataDbContext NewDb(string name)
    {
        var options = new DbContextOptionsBuilder<DataDbContext>()
            .UseInMemoryDatabase($"AuditEmit-{name}-{Guid.NewGuid()}")
            .Options;
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>()).Build();
        return new DataDbContext(options, config);
    }

    // ── AuditEventWriter ────────────────────────────────────────────────

    [Fact]
    public async Task Writer_AuthenticatedUser_WritesRowWithActorAndCounty()
    {
        var county = Guid.NewGuid();
        await using var db = NewDb(nameof(Writer_AuthenticatedUser_WritesRowWithActorAndCounty));
        var accessor = new FakeUserContext
        {
            Current = new RequestUserContext(true, "user-7", county.ToString(), Array.Empty<string>())
        };
        var writer = new AuditEventWriter(db, accessor, NullLogger<AuditEventWriter>.Instance);

        await writer.WriteAsync("Appeal", "P1", "file_appeal", AuditEventType.Create, "{\"x\":1}");

        var row = db.AuditEvents.Single();
        row.Entity.Should().Be("Appeal");
        row.EntityId.Should().Be("P1");
        row.Action.Should().Be("file_appeal");
        row.Type.Should().Be(AuditEventType.Create);
        row.UserId.Should().Be("user-7");
        row.CountyId.Should().Be(county);
        row.DetailsJson.Should().Be("{\"x\":1}");
        row.Timestamp.Should().NotBe(default);
    }

    [Fact]
    public async Task Writer_Anonymous_UsesSystemActorAndNullCounty()
    {
        await using var db = NewDb(nameof(Writer_Anonymous_UsesSystemActorAndNullCounty));
        var writer = new AuditEventWriter(db, new FakeUserContext(), NullLogger<AuditEventWriter>.Instance);

        await writer.WriteAsync("Exemption", "P9", "create_exemption", AuditEventType.Create);

        var row = db.AuditEvents.Single();
        row.UserId.Should().Be("system");
        row.CountyId.Should().BeNull();
    }

    // ── GovernedToolAuditService emission ───────────────────────────────

    [Fact]
    public async Task Service_WritesAuditLog_AndEmitsAuditEvent()
    {
        await using var db = NewDb(nameof(Service_WritesAuditLog_AndEmitsAuditEvent));
        var writer = new Mock<IAuditEventWriter>();
        var service = new GovernedToolAuditService(db, writer.Object, NullLogger<GovernedToolAuditService>.Instance);

        await service.LogInvocationAsync("file_appeal", "P1", "u1", "filed", CancellationToken.None);

        db.AuditLogs.Should().ContainSingle().Which.Type.Should().Be("DAIS_TOOL:file_appeal");
        writer.Verify(w => w.WriteAsync(
            "Appeal", "P1", "file_appeal", AuditEventType.Create,
            It.IsAny<string?>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Theory]
    [InlineData("file_appeal", "Appeal", AuditEventType.Create)]
    [InlineData("schedule_boe_hearing", "Appeal", AuditEventType.Update)]
    [InlineData("create_exemption", "Exemption", AuditEventType.Create)]
    [InlineData("check_exemption_eligibility", "Exemption", AuditEventType.View)]
    [InlineData("process_exemption_renewal", "Exemption", AuditEventType.Update)]
    [InlineData("sign_off_certification_step", "Certification", AuditEventType.Update)]
    [InlineData("generate_notice", "Notice", AuditEventType.Create)]
    [InlineData("queue_assign", "Queue", AuditEventType.Update)]
    [InlineData("classify", "Assessment", AuditEventType.Update)]
    [InlineData("something_else", "Dais", AuditEventType.Update)]
    public async Task Service_MapsToolNameToEntityAndType(string tool, string expectedEntity, AuditEventType expectedType)
    {
        await using var db = NewDb($"map-{tool}");
        var writer = new Mock<IAuditEventWriter>();
        var service = new GovernedToolAuditService(db, writer.Object, NullLogger<GovernedToolAuditService>.Instance);

        await service.LogInvocationAsync(tool, "P1", "u1", "ok", CancellationToken.None);

        writer.Verify(w => w.WriteAsync(
            expectedEntity, "P1", tool, expectedType,
            It.IsAny<string?>(), It.IsAny<CancellationToken>()), Times.Once);
    }
}
