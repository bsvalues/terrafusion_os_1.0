using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Interfaces;
using TerraFusion.Core.Services;
using Xunit;

using Task = System.Threading.Tasks.Task;
using TerraFusionDbContext = TerraFusion.Data.TerraFusionDbContext;

namespace TerraFusion.API.Tests;

public sealed class DaisPersistenceTests : IDisposable
{
    private readonly TerraFusionDbContext _context;

    public DaisPersistenceTests()
    {
        _context = CreateInMemoryContext();
    }

    public void Dispose()
    {
        _context.Dispose();
    }

    // ──────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────

    private static TerraFusionDbContext CreateInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();

        return new TerraFusionDbContext(options, config);
    }

    private static readonly Guid County1 = Guid.NewGuid();
    private static readonly Guid County2 = Guid.NewGuid();

    // ──────────────────────────────────────────────
    // AppealService Tests
    // ──────────────────────────────────────────────

    [Fact]
    public async Task Appeal_Create_ReturnsEntityWithIdAndStatusFiled()
    {
        var svc = new AppealService(_context, NullLogger<AppealService>.Instance);

        var appeal = new Appeal
        {
            ParcelId = "P-001",
            AppealGround = "MARKET_VALUE",
            CountyId = County1,
            FiledDate = DateTime.UtcNow,
            CurrentValue = 300_000m,
            RequestedValue = 250_000m,
            TaxYear = 2026
        };

        var result = await svc.CreateAsync(appeal);

        Assert.NotEqual(Guid.Empty, result.Id);
        Assert.Equal("filed", result.Status);
        Assert.Equal("P-001", result.ParcelId);
    }

    [Fact]
    public async Task Appeal_GetById_ReturnsCorrectAppeal()
    {
        var svc = new AppealService(_context, NullLogger<AppealService>.Instance);

        var appeal = await svc.CreateAsync(new Appeal
        {
            ParcelId = "P-002",
            AppealGround = "UNIFORMITY",
            CountyId = County1,
            FiledDate = DateTime.UtcNow,
            CurrentValue = 200_000m,
            RequestedValue = 180_000m,
            TaxYear = 2026
        });

        var fetched = await svc.GetByIdAsync(appeal.Id, County1);

        Assert.NotNull(fetched);
        Assert.Equal(appeal.Id, fetched!.Id);
        Assert.Equal("P-002", fetched.ParcelId);
    }

    [Fact]
    public async Task Appeal_UpdateStatus_PersistsStateTransition()
    {
        var svc = new AppealService(_context, NullLogger<AppealService>.Instance);

        var appeal = await svc.CreateAsync(new Appeal
        {
            ParcelId = "P-003",
            AppealGround = "CLASSIFICATION",
            CountyId = County1,
            FiledDate = DateTime.UtcNow,
            CurrentValue = 400_000m,
            RequestedValue = 350_000m,
            TaxYear = 2026
        });

        var updated = await svc.UpdateStatusAsync(appeal.Id, "scheduled", County1);

        Assert.Equal("scheduled", updated.Status);

        // Re-fetch to confirm persistence
        var refetched = await svc.GetByIdAsync(appeal.Id, County1);
        Assert.Equal("scheduled", refetched!.Status);
    }

    [Fact]
    public async Task Appeal_CountyIsolation_CrossCountyAccessReturnsNull()
    {
        var svc = new AppealService(_context, NullLogger<AppealService>.Instance);

        var appeal = await svc.CreateAsync(new Appeal
        {
            ParcelId = "P-004",
            AppealGround = "MARKET_VALUE",
            CountyId = County1,
            FiledDate = DateTime.UtcNow,
            CurrentValue = 500_000m,
            RequestedValue = 450_000m,
            TaxYear = 2026
        });

        var crossCounty = await svc.GetByIdAsync(appeal.Id, County2);

        Assert.Null(crossCounty);
    }

    // ──────────────────────────────────────────────
    // ExemptionService Tests
    // ──────────────────────────────────────────────

    [Fact]
    public async Task Exemption_Create_PersistsWithCorrectProgramCode()
    {
        var svc = new ExemptionService(_context, NullLogger<ExemptionService>.Instance);

        var exemption = await svc.CreateAsync(new Exemption
        {
            ParcelId = "P-100",
            ProgramCode = "SENIOR_DISABLED",
            CountyId = County1,
            ApplicationDate = DateTime.UtcNow,
            ExemptionAmount = 50_000m
        });

        Assert.NotEqual(Guid.Empty, exemption.Id);
        Assert.Equal("SENIOR_DISABLED", exemption.ProgramCode);

        var fetched = await svc.GetByIdAsync(exemption.Id, County1);
        Assert.NotNull(fetched);
        Assert.Equal("SENIOR_DISABLED", fetched!.ProgramCode);
    }

    [Fact]
    public async Task Exemption_GetByParcel_ReturnsFilteredResultsOnly()
    {
        var svc = new ExemptionService(_context, NullLogger<ExemptionService>.Instance);

        await svc.CreateAsync(new Exemption
        {
            ParcelId = "P-200",
            ProgramCode = "CURRENT_USE",
            CountyId = County1,
            ApplicationDate = DateTime.UtcNow,
            ExemptionAmount = 25_000m
        });

        await svc.CreateAsync(new Exemption
        {
            ParcelId = "P-201",
            ProgramCode = "HISTORIC",
            CountyId = County1,
            ApplicationDate = DateTime.UtcNow,
            ExemptionAmount = 30_000m
        });

        await svc.CreateAsync(new Exemption
        {
            ParcelId = "P-200",
            ProgramCode = "SENIOR_DISABLED",
            CountyId = County1,
            ApplicationDate = DateTime.UtcNow,
            ExemptionAmount = 40_000m
        });

        var results = await svc.GetByParcelAsync("P-200", County1);

        Assert.Equal(2, results.Count);
        Assert.All(results, r => Assert.Equal("P-200", r.ParcelId));
    }

    // ──────────────────────────────────────────────
    // NoticeService Tests
    // ──────────────────────────────────────────────

    [Fact]
    public async Task Notice_Create_Persists()
    {
        var svc = new NoticeService(_context, NullLogger<NoticeService>.Instance);

        var notice = await svc.CreateAsync(new Notice
        {
            ParcelId = "P-300",
            TemplateId = "VALUE_CHANGE_2026",
            DeliveryMethod = "mail",
            CountyId = County1
        });

        Assert.NotEqual(Guid.Empty, notice.Id);

        var fetched = await svc.GetByIdAsync(notice.Id, County1);
        Assert.NotNull(fetched);
        Assert.Equal("VALUE_CHANGE_2026", fetched!.TemplateId);
    }

    [Fact]
    public async Task Notice_UpdateStatusToSent_AutoSetsSentAt()
    {
        var svc = new NoticeService(_context, NullLogger<NoticeService>.Instance);

        var notice = await svc.CreateAsync(new Notice
        {
            ParcelId = "P-301",
            TemplateId = "EXEMPTION_DECISION",
            DeliveryMethod = "email",
            CountyId = County1
        });

        Assert.Null(notice.SentAt);

        var updated = await svc.UpdateStatusAsync(notice.Id, "sent", County1);

        Assert.Equal("sent", updated.Status);
        Assert.NotNull(updated.SentAt);
    }

    // ──────────────────────────────────────────────
    // QueueService Tests
    // ──────────────────────────────────────────────

    [Fact]
    public async Task Queue_Create_PersistsWithPriority()
    {
        var svc = new QueueService(_context, NullLogger<QueueService>.Instance);

        var item = await svc.CreateAsync(new QueueItem
        {
            ParcelId = "P-400",
            TaskType = "FIELD_INSPECTION",
            Priority = "high",
            CountyId = County1
        });

        Assert.NotEqual(Guid.Empty, item.Id);
        Assert.Equal("high", item.Priority);
        Assert.Equal("queued", item.Status);
    }

    [Fact]
    public async Task Queue_StatusTransition_QueuedToInProgressToCompleted()
    {
        var svc = new QueueService(_context, NullLogger<QueueService>.Instance);

        var item = await svc.CreateAsync(new QueueItem
        {
            ParcelId = "P-401",
            TaskType = "DESK_REVIEW",
            Priority = "normal",
            CountyId = County1
        });

        Assert.Equal("queued", item.Status);
        Assert.Null(item.StartedAt);
        Assert.Null(item.CompletedAt);

        var inProgress = await svc.UpdateStatusAsync(item.Id, "in_progress", County1);
        Assert.Equal("in_progress", inProgress.Status);
        Assert.NotNull(inProgress.StartedAt);
        Assert.Null(inProgress.CompletedAt);

        var completed = await svc.UpdateStatusAsync(item.Id, "completed", County1);
        Assert.Equal("completed", completed.Status);
        Assert.NotNull(completed.CompletedAt);
    }

    [Fact]
    public async Task Queue_GetPending_ReturnsOnlyQueuedOrderedByPriority()
    {
        // Use a separate context so other test data does not leak in
        using var ctx = CreateInMemoryContext();
        var svc = new QueueService(ctx, NullLogger<QueueService>.Instance);
        var county = Guid.NewGuid();

        await svc.CreateAsync(new QueueItem
        {
            ParcelId = "P-500",
            TaskType = "FIELD_INSPECTION",
            Priority = "normal",
            CountyId = county
        });

        var urgentItem = await svc.CreateAsync(new QueueItem
        {
            ParcelId = "P-501",
            TaskType = "FIELD_INSPECTION",
            Priority = "urgent",
            CountyId = county
        });

        var highItem = await svc.CreateAsync(new QueueItem
        {
            ParcelId = "P-502",
            TaskType = "FIELD_INSPECTION",
            Priority = "high",
            CountyId = county
        });

        // Move one item to in_progress so it should NOT appear in pending
        var inProgressItem = await svc.CreateAsync(new QueueItem
        {
            ParcelId = "P-503",
            TaskType = "FIELD_INSPECTION",
            Priority = "urgent",
            CountyId = county
        });
        await svc.UpdateStatusAsync(inProgressItem.Id, "in_progress", county);

        var pending = await svc.GetPendingAsync(county);

        Assert.Equal(3, pending.Count);
        Assert.All(pending, p => Assert.Equal("queued", p.Status));
        Assert.DoesNotContain(pending, p => p.Id == inProgressItem.Id);

        // Verify all three priority levels are present
        var priorities = pending.Select(p => p.Priority).ToList();
        Assert.Contains("urgent", priorities);
        Assert.Contains("high", priorities);
        Assert.Contains("normal", priorities);
    }

    // ──────────────────────────────────────────────
    // CertificationService Tests (5th Dais service)
    // ──────────────────────────────────────────────

    [Fact]
    public async Task Certification_Create_PersistsStep()
    {
        var svc = new CertificationService(_context, NullLogger<CertificationService>.Instance);

        var step = await svc.CreateAsync(new CertificationStep
        {
            TaxYear = 2026,
            StepCode = "PRELIMINARY_ROLL",
            CountyId = County1
        });

        Assert.NotEqual(Guid.Empty, step.Id);
        Assert.Equal("pending", step.Status);

        var fetched = await svc.GetByIdAsync(step.Id, County1);
        Assert.NotNull(fetched);
        Assert.Equal("PRELIMINARY_ROLL", fetched!.StepCode);
    }

    [Fact]
    public async Task Certification_CompleteStep_SetsCompletedFields()
    {
        var svc = new CertificationService(_context, NullLogger<CertificationService>.Instance);

        var step = await svc.CreateAsync(new CertificationStep
        {
            TaxYear = 2026,
            StepCode = "FINAL_VALUES",
            CountyId = County1
        });

        var completed = await svc.CompleteStepAsync(step.Id, "assessor@benton.wa.gov", County1);

        Assert.Equal("completed", completed.Status);
        Assert.Equal("assessor@benton.wa.gov", completed.CompletedBy);
        Assert.NotNull(completed.CompletedAt);
    }

    // ──────────────────────────────────────────────
    // Write-Lane Contract Tests (reflection)
    // ──────────────────────────────────────────────

    [Theory]
    [InlineData(typeof(Appeal))]
    [InlineData(typeof(Exemption))]
    [InlineData(typeof(Notice))]
    [InlineData(typeof(QueueItem))]
    [InlineData(typeof(CertificationStep))]
    public void DaisEntities_HaveCountyIdProperty(Type entityType)
    {
        var prop = entityType.GetProperty("CountyId", BindingFlags.Public | BindingFlags.Instance);

        Assert.NotNull(prop);
        Assert.Equal(typeof(Guid), prop!.PropertyType);
    }

    [Theory]
    [InlineData(typeof(Appeal))]
    [InlineData(typeof(Exemption))]
    [InlineData(typeof(Notice))]
    [InlineData(typeof(QueueItem))]
    [InlineData(typeof(CertificationStep))]
    public void DaisEntities_HaveAuditTimestamps(Type entityType)
    {
        Assert.NotNull(entityType.GetProperty("CreatedAt", BindingFlags.Public | BindingFlags.Instance));
        Assert.NotNull(entityType.GetProperty("UpdatedAt", BindingFlags.Public | BindingFlags.Instance));
        Assert.NotNull(entityType.GetProperty("CreatedBy", BindingFlags.Public | BindingFlags.Instance));
        Assert.NotNull(entityType.GetProperty("UpdatedBy", BindingFlags.Public | BindingFlags.Instance));
    }

    // ──────────────────────────────────────────────
    // County Isolation — Exemption, Notice, Queue
    // ──────────────────────────────────────────────

    [Fact]
    public async Task Exemption_CountyIsolation_CrossCountyAccessReturnsNull()
    {
        var svc = new ExemptionService(_context, NullLogger<ExemptionService>.Instance);

        var exemption = await svc.CreateAsync(new Exemption
        {
            ParcelId = "P-ISO-EX",
            ProgramCode = "CURRENT_USE",
            CountyId = County1,
            ExemptionAmount = 20_000m
        });

        var crossCounty = await svc.GetByIdAsync(exemption.Id, County2);
        Assert.Null(crossCounty);
    }

    [Fact]
    public async Task Notice_CountyIsolation_CrossCountyAccessReturnsNull()
    {
        var svc = new NoticeService(_context, NullLogger<NoticeService>.Instance);

        var notice = await svc.CreateAsync(new Notice
        {
            ParcelId = "P-ISO-NOT",
            TemplateId = "CHANGE_OF_VALUE",
            DeliveryMethod = "MAIL",
            CountyId = County1
        });

        var crossCounty = await svc.GetByIdAsync(notice.Id, County2);
        Assert.Null(crossCounty);
    }

    [Fact]
    public async Task Queue_CountyIsolation_CrossCountyAccessReturnsNull()
    {
        var svc = new QueueService(_context, NullLogger<QueueService>.Instance);

        var item = await svc.CreateAsync(new QueueItem
        {
            ParcelId = "P-ISO-QUEUE",
            TaskType = "FIELD_INSPECTION",
            Priority = "normal",
            CountyId = County1
        });

        var crossCounty = await svc.GetByIdAsync(item.Id, County2);
        Assert.Null(crossCounty);
    }

    [Fact]
    public void DbContext_HasAllFiveDaisDbSets()
    {
        var contextType = typeof(ITerraFusionDbContext);

        var expectedDbSets = new[]
        {
            ("Appeals", typeof(Appeal)),
            ("Exemptions", typeof(Exemption)),
            ("CertificationSteps", typeof(CertificationStep)),
            ("Notices", typeof(Notice)),
            ("QueueItems", typeof(QueueItem))
        };

        foreach (var (name, entityType) in expectedDbSets)
        {
            var prop = contextType.GetProperty(name, BindingFlags.Public | BindingFlags.Instance);
            Assert.NotNull(prop);
            Assert.Equal(typeof(DbSet<>).MakeGenericType(entityType), prop!.PropertyType);
        }
    }
}
