// backend/TerraFusion.API.Tests/CountyStudyEntityTests.cs
using TerraFusion.API.Tests.TestHelpers;
using TerraFusion.Core.Entities;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.API.Tests;

public class CountyStudyEntityTests
{
    [Fact]
    public async Task CountyStudySession_CanBeSavedAndRetrieved()
    {
        using var ctx = TestDbContextFactory.CreateInMemoryContext();
        var study = new CountyStudySession
        {
            CountyId = Guid.NewGuid(),
            TaxYear = 2026,
            StudyType = StudyType.RatioStudy,
            Status = StudyStatus.Draft
        };
        ctx.CountyStudySessions.Add(study);
        await ctx.SaveChangesAsync();

        var retrieved = await ctx.CountyStudySessions.FindAsync(study.StudyId);
        Assert.NotNull(retrieved);
        Assert.Equal(2026, retrieved!.TaxYear);
    }

    [Fact]
    public async Task CountySegment_CanBeSavedWithMetrics()
    {
        using var ctx = TestDbContextFactory.CreateInMemoryContext();
        var segSet = new CountySegmentSet
        {
            CountyId = Guid.NewGuid(),
            StudyId = Guid.NewGuid(),
            Name = "Test Set",
            IsBaseline = true
        };
        ctx.CountySegmentSets.Add(segSet);
        var seg = new CountySegment
        {
            SegmentSetId = segSet.SegmentSetId,
            CountyId = segSet.CountyId,
            Name = "West Richland R1",
            SegmentType = SegmentType.Residential,
            ParcelCount = 842,
            MedianRatio = 0.91m,
            StabilityScore = 58m,
            RiskScore = 45m
        };
        ctx.CountySegments.Add(seg);
        await ctx.SaveChangesAsync();

        var retrieved = await ctx.CountySegments.FindAsync(seg.SegmentId);
        Assert.Equal(0.91m, retrieved!.MedianRatio);
    }
}
