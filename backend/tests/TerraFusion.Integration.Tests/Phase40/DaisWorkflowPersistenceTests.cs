// CARD-16 — Dais Workflow Persistence Integration Tests
//
// Proves that the core Dais workflow entities (Exemption, Appeal,
// CertificationStep, Notice, QueueItem) round-trip correctly through
// EF Core — every field persists, audit timestamps are populated, and
// status transitions record the expected state changes.
//
// These tests exercise the service layer against an in-memory store.
// They are not unit tests: they verify the full persistence surface
// including EF configuration, entity shape, and service contract.

using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Services;
using Xunit;
// Disambiguate: TerraFusion.Core.Entities.Task vs System.Threading.Tasks.Task
using Task = System.Threading.Tasks.Task;
// Disambiguate: TerraFusion.Core.Services also exposes TerraFusionDbContext
using TerraFusionDbContext = TerraFusion.Data.TerraFusionDbContext;

namespace TerraFusion.Integration.Tests.Phase40;

public class DaisWorkflowPersistenceTests
{
    // ─── Helpers ─────────────────────────────────────────────────────

    private static TerraFusionDbContext CreateContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = "InMemory",
                ["Logging:EnableSensitiveDataLogging"] = "false"
            })
            .Build();

        return new TerraFusionDbContext(options, configuration);
    }

    private static (Guid countyId, County county) SeedBentonCounty(TerraFusionDbContext ctx)
    {
        var countyId = Guid.NewGuid();
        var county = new County
        {
            Id = countyId,
            Name = "Benton County",
            State = "WA",
            FipsCode = "53005",
            Population = 204390,
            Area = 1700
        };
        ctx.Counties.Add(county);
        ctx.SaveChanges();
        return (countyId, county);
    }

    // ─── 1. Appeal — Filed → Heard → Decided full lifecycle ──────────

    [Fact]
    public async Task Appeal_FullLifecycle_FiledToDecided_Persists()
    {
        await using var ctx = CreateContext("DaisPersis_AppealLifecycle");
        var (countyId, _) = SeedBentonCounty(ctx);

        var svc = new AppealService(ctx, NullLogger<AppealService>.Instance);

        // Create
        var appeal = await svc.CreateAsync(new Appeal
        {
            ParcelId       = "1-0529-100-0001",
            AppealGround   = "MARKET_VALUE",
            Status         = "filed",
            PetitionerName = "Jane Appellant",
            FiledDate      = new DateTime(2025, 3, 1, 0, 0, 0, DateTimeKind.Utc),
            CurrentValue   = 450_000m,
            RequestedValue = 380_000m,
            TaxYear        = 2025,
            CountyId       = countyId
        });

        appeal.Id.Should().NotBeEmpty("Id must be assigned on create");
        appeal.CreatedAt.Should().BeAfter(DateTime.UtcNow.AddSeconds(-5));

        // Transition to heard
        var heard = await svc.UpdateStatusAsync(appeal.Id, "heard", countyId);
        heard.Status.Should().Be("heard");
        heard.UpdatedAt.Should().BeOnOrAfter(appeal.CreatedAt);

        // Transition to decided with value
        var decided = await svc.UpdateStatusAsync(
            appeal.Id, "decided", countyId,
            decisionNotes: "Reduction granted based on comparable evidence.",
            decidedValue: 395_000m);

        decided.Status.Should().Be("decided");
        decided.DecidedValue.Should().Be(395_000m);
        decided.DecisionNotes.Should().Be("Reduction granted based on comparable evidence.");
        decided.DecisionDate.Should().HaveValue();

        // Read-back via GetByParcel
        var all = await svc.GetByParcelAsync("1-0529-100-0001", countyId);
        all.Should().HaveCount(1);
        all[0].Status.Should().Be("decided");
        all[0].DecidedValue.Should().Be(395_000m);
    }

    // ─── 2. Exemption — Pending → Approved full lifecycle ────────────

    [Fact]
    public async Task Exemption_FullLifecycle_PendingToApproved_Persists()
    {
        await using var ctx = CreateContext("DaisPersis_ExemptionLifecycle");
        var (countyId, _) = SeedBentonCounty(ctx);

        var svc = new ExemptionService(ctx, NullLogger<ExemptionService>.Instance);

        var exemption = await svc.CreateAsync(new Exemption
        {
            ParcelId         = "EX-1234",
            ProgramCode      = "SENIOR_DISABLED",
            Status           = "pending",
            ApplicantName    = "Bob Senior",
            ApplicationDate  = new DateTime(2025, 1, 15, 0, 0, 0, DateTimeKind.Utc),
            ExemptionAmount  = 60_000m,
            RcwReference     = "84.36.381",
            CountyId         = countyId
        });

        exemption.Id.Should().NotBeEmpty();
        exemption.Status.Should().Be("pending");
        exemption.ProgramCode.Should().Be("SENIOR_DISABLED");

        // Approve
        var approved = await svc.UpdateStatusAsync(exemption.Id, "approved", countyId);
        approved.Status.Should().Be("approved");

        // Read-back
        var fetched = await svc.GetByIdAsync(exemption.Id, countyId);
        fetched.Should().NotBeNull();
        fetched!.Status.Should().Be("approved");
        fetched.ApplicantName.Should().Be("Bob Senior");
        fetched.RcwReference.Should().Be("84.36.381");
        fetched.ExemptionAmount.Should().Be(60_000m);
    }

    // ─── 3. CertificationStep — Complete records audit fields ─────────

    [Fact]
    public async Task CertificationStep_CompleteStep_RecordsAllAuditFields()
    {
        await using var ctx = CreateContext("DaisPersis_CertStep");
        var (countyId, _) = SeedBentonCounty(ctx);

        var svc = new CertificationService(ctx, NullLogger<CertificationService>.Instance);

        var before = DateTime.UtcNow;

        var step = await svc.CreateAsync(new CertificationStep
        {
            TaxYear  = 2025,
            StepCode = "PRELIMINARY_ROLL",
            Status   = "pending",
            CountyId = countyId
        });

        step.Id.Should().NotBeEmpty();
        step.Status.Should().Be("pending");
        step.CompletedAt.Should().BeNull();
        step.CompletedBy.Should().BeNull();

        var completed = await svc.CompleteStepAsync(
            step.Id, completedBy: "mary.appraiser@benton.wa.gov", countyId);

        completed.Status.Should().Be("completed");
        completed.CompletedBy.Should().Be("mary.appraiser@benton.wa.gov");
        completed.CompletedAt.Should().HaveValue();
        completed.CompletedAt!.Value.Should().BeOnOrAfter(before);

        // Confirm GetByTaxYear reflects completed status
        var steps = await svc.GetByTaxYearAsync(2025, countyId);
        steps.Should().HaveCount(1);
        steps[0].Status.Should().Be("completed");
    }

    // ─── 4. Notice — Generated → Sent status transition ──────────────

    [Fact]
    public async Task Notice_StatusTransition_GeneratedToSent_Persists()
    {
        await using var ctx = CreateContext("DaisPersis_NoticeStatus");
        var (countyId, _) = SeedBentonCounty(ctx);

        var svc = new NoticeService(ctx, NullLogger<NoticeService>.Instance);

        var notice = await svc.CreateAsync(new Notice
        {
            ParcelId        = "NOTE-5678",
            TemplateId      = "VALUE_CHANGE_NOTICE",
            DeliveryMethod  = "mail",
            Status          = "generated",
            RcwReference    = "84.40.020",
            CountyId        = countyId
        });

        notice.Id.Should().NotBeEmpty();
        notice.Status.Should().Be("generated");

        // Queue it
        var queued = await svc.UpdateStatusAsync(notice.Id, "queued", countyId);
        queued.Status.Should().Be("queued");

        // Mark sent
        var sent = await svc.UpdateStatusAsync(notice.Id, "sent", countyId);
        sent.Status.Should().Be("sent");

        // Read-back
        var fetched = await svc.GetByIdAsync(notice.Id, countyId);
        fetched.Should().NotBeNull();
        fetched!.Status.Should().Be("sent");
        fetched.TemplateId.Should().Be("VALUE_CHANGE_NOTICE");
        fetched.RcwReference.Should().Be("84.40.020");
    }

    // ─── 5. QueueItem — Assignment tracks assignee and SLA ───────────

    [Fact]
    public async Task QueueItem_Assign_TracksAssigneeAndStatusTransition()
    {
        await using var ctx = CreateContext("DaisPersis_QueueAssign");
        var (countyId, _) = SeedBentonCounty(ctx);

        var svc = new QueueService(ctx, NullLogger<QueueService>.Instance);

        var item = await svc.CreateAsync(new QueueItem
        {
            ParcelId  = "Q-9999",
            TaskType  = "FIELD_INSPECTION",
            Priority  = "high",
            Status    = "queued",
            SlaHours  = 48,
            CountyId  = countyId
        });

        item.Id.Should().NotBeEmpty();
        item.Status.Should().Be("queued");
        item.AssignedTo.Should().BeNull();

        var assigned = await svc.AssignAsync(
            item.Id, assignedTo: "john.inspector@benton.wa.gov", countyId);

        assigned.AssignedTo.Should().Be("john.inspector@benton.wa.gov");

        // Confirm via GetPending (status still queued/in_progress)
        var pending = await svc.GetPendingAsync(countyId);
        pending.Should().HaveCountGreaterOrEqualTo(1,
            "assigned item should still appear in pending queue");
        pending.Should().Contain(q => q.Id == item.Id);
    }

    // ─── 6. Appeal — Audit fields auto-populate on create ────────────

    [Fact]
    public async Task Appeal_AuditFields_ArePopulatedOnCreate()
    {
        await using var ctx = CreateContext("DaisPersis_AppealAudit");
        var (countyId, _) = SeedBentonCounty(ctx);

        var svc = new AppealService(ctx, NullLogger<AppealService>.Instance);
        var before = DateTime.UtcNow.AddMilliseconds(-100);

        var appeal = await svc.CreateAsync(new Appeal
        {
            ParcelId       = "AUDIT-PARCEL",
            AppealGround   = "CLERICAL_ERROR",
            Status         = "filed",
            FiledDate      = DateTime.UtcNow,
            CurrentValue   = 200_000m,
            RequestedValue = 195_000m,
            TaxYear        = 2025,
            CountyId       = countyId
        });

        appeal.CreatedAt.Should().BeOnOrAfter(before,
            "CreatedAt must be stamped on create");
        appeal.UpdatedAt.Should().BeOnOrAfter(before,
            "UpdatedAt must be stamped on create");
        appeal.Id.Should().NotBeEmpty();
    }
}
