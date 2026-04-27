// backend/TerraFusion.API.Tests/CountyStudioAiNarrativeSamples.cs
//
// Exports concrete narratives for three canonical segment shapes as part of
// Task E's acceptance criteria — so the reviewer can read them verbatim.

using System.Collections.Generic;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Services;
using Xunit;
using Xunit.Abstractions;

namespace TerraFusion.API.Tests;

public sealed class CountyStudioAiNarrativeSamples
{
    private readonly ITestOutputHelper _output;
    public CountyStudioAiNarrativeSamples(ITestOutputHelper output) => _output = output;

    private static CountySegmentDetailDto Build(
        string name, string? city, string? nbhd,
        int parcelCount, int ratioCount,
        decimal? median, decimal? cod, decimal? prd, decimal? prb,
        int exceptionCount,
        List<SegmentYearPoint>? history = null) =>
        new(
            SegmentId:            Guid.NewGuid(),
            SegmentSetId:         Guid.NewGuid(),
            StudyId:              Guid.NewGuid(),
            CountyId:             Guid.NewGuid(),
            TaxYear:              2026,
            Name:                 name,
            SegmentType:          "Residential",
            City:                 city,
            NeighborhoodCode:     nbhd,
            ParcelCount:          parcelCount,
            MedianRatio:          median,
            Cod:                  cod,
            Prd:                  prd,
            StabilityScore:       75m,
            RiskScore:            25m,
            ExceptionCount:       exceptionCount,
            Prb:                  prb,
            Vei:                  80m,
            EquityClassification: "Fair",
            EquityScore:          80m,
            RatioCount:           ratioCount,
            YearHistory:          history ?? new List<SegmentYearPoint>(),
            ComplianceStatus:     "IaaoCompliant",
            Warnings:             new List<string>(),
            DerivedAt:            new DateTime(2026, 4, 10, 12, 0, 0, DateTimeKind.Utc),
            OutlierParcelIds:     new List<string>());

    [Fact]
    public void Sample_Healthy_Narrative()
    {
        var d = Build("NBHD-R1/R1/STANDARD", "Richland", "NBHD-R1", 142, 42, 0.97m, 14.2m, 1.01m, 0.02m, 6);
        var dx = CountyStudioAiService.BuildDiagnosis(d);
        _output.WriteLine($"CLASS={dx.PrimaryClass} CONF={dx.PrimaryConfidence:P0}");
        _output.WriteLine($"NARRATIVE: {dx.Narrative}");
        Assert.Equal(ProblemClass.Healthy, dx.PrimaryClass);
    }

    [Fact]
    public void Sample_DataDominant_ZeroSales_Narrative()
    {
        var d = Build("NBHD-K3/R1/STANDARD", "Kennewick", "NBHD-K3", 55, 0, null, null, null, null, 0);
        var dx = CountyStudioAiService.BuildDiagnosis(d);
        _output.WriteLine($"CLASS={dx.PrimaryClass} CONF={dx.PrimaryConfidence:P0}");
        _output.WriteLine($"NARRATIVE: {dx.Narrative}");
        Assert.Equal(ProblemClass.Data, dx.PrimaryClass);
    }

    [Fact]
    public void Sample_ModelDominant_CodAndPrdBreach_Narrative()
    {
        var d = Build("NBHD-K1/R1/GOOD", "Kennewick", "NBHD-K1", 128, 42, 0.96m, 27.4m, 1.09m, 0.02m, 8);
        var dx = CountyStudioAiService.BuildDiagnosis(d);
        _output.WriteLine($"CLASS={dx.PrimaryClass} CONF={dx.PrimaryConfidence:P0}");
        _output.WriteLine($"NARRATIVE: {dx.Narrative}");
        Assert.Equal(ProblemClass.Model, dx.PrimaryClass);
    }
}
