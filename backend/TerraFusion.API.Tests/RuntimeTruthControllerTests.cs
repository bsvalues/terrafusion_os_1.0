using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using TerraFusion.API.Controllers;
using TerraFusion.API.Tests.TestHelpers;
using TerraFusion.Core.Entities;
using TerraFusion.Data;
using Xunit;
using SystemTask = System.Threading.Tasks.Task;

namespace TerraFusion.API.Tests;

public sealed class RuntimeTruthControllerTests : IDisposable
{
    private readonly TerraFusionDbContext _db;
    private readonly string? _priorExpectedDb;

    public RuntimeTruthControllerTests()
    {
        _priorExpectedDb = Environment.GetEnvironmentVariable("TF_EXPECTED_JUNE10_DB_NAME");
        Environment.SetEnvironmentVariable("TF_EXPECTED_JUNE10_DB_NAME", null);

        _db = TestDbContextFactory.CreateInMemoryContext();
        _db.Counties.Add(new County
        {
            Id = Guid.NewGuid(),
            Name = "Benton County",
            State = "WA",
            FipsCode = "53005",
        });
        _db.Properties.Add(new Property
        {
            Id = Guid.NewGuid(),
            CountyId = _db.Counties.Local.First().Id,
            PropertyId = "BENTON-001",
            ParcelId = "BENTON-001",
            ParcelNumber = "BENTON-001",
            Address = "1 Runtime Truth Way",
            PropertyType = "residential",
            AssessmentDate = DateTime.UtcNow,
            LastUpdated = DateTime.UtcNow,
        });
        _db.Properties.Add(new Property
        {
            Id = Guid.NewGuid(),
            CountyId = _db.Counties.Local.First().Id,
            PropertyId = "BENTON-002",
            ParcelId = "BENTON-001",
            ParcelNumber = "BENTON-001",
            Address = "1 Runtime Truth Way",
            PropertyType = "residential",
            AssessmentDate = DateTime.UtcNow,
            LastUpdated = DateTime.UtcNow,
        });
        _db.ComparableSales.Add(new ComparableSale
        {
            Id = Guid.NewGuid(),
            CountyId = _db.Counties.Local.First().Id,
            ParcelId = "BENTON-001",
            SaleDate = DateTime.UtcNow,
            SalePrice = 100_000m,
            PropertyType = "residential",
        });
        _db.SaveChanges();
    }

    public void Dispose()
    {
        Environment.SetEnvironmentVariable("TF_EXPECTED_JUNE10_DB_NAME", _priorExpectedDb);
        _db.Dispose();
    }

    [Fact]
    public async SystemTask GetDbIdentity_ReturnsRuntimeProviderAndRowCounts()
    {
        var sut = CreateController();

        var result = await sut.GetDbIdentity();

        var ok = Assert.IsType<OkObjectResult>(result);
        var json = JsonSerializer.Serialize(ok.Value);

        Assert.Contains("Microsoft.EntityFrameworkCore.InMemory", json);
        Assert.Contains("\"Counties\":1", json);
        Assert.Contains("\"Properties\":2", json);
        Assert.Contains("\"ComparableSales\":1", json);
    }

    [Fact]
    public async SystemTask GetDbIdentity_FailsClosedWithoutExpectedJune10Database()
    {
        var sut = CreateController();

        var result = await sut.GetDbIdentity();

        var ok = Assert.IsType<OkObjectResult>(result);
        var json = JsonSerializer.Serialize(ok.Value);

        Assert.Contains("\"Passed\":false", json);
        Assert.Contains("Expected June 10 TerraFusion DB name is not configured", json);
        Assert.Contains("in-memory provider", json);
    }

    [Fact]
    public async SystemTask GetDbIdentity_FailsWhenRuntimePropertyCountDoesNotMatchConfiguredBentonCount()
    {
        var sut = CreateController(new Dictionary<string, string?>
        {
            ["RuntimeTruth:ExpectedBentonParcelCount"] = "3",
        });

        var result = await sut.GetDbIdentity();

        var ok = Assert.IsType<OkObjectResult>(result);
        var json = JsonSerializer.Serialize(ok.Value);

        Assert.Contains("\"ExpectedBentonParcelCount\":3", json);
        Assert.Contains("\"IsBentonParcelCountExpected\":false", json);
        Assert.Contains("does not match configured Benton parcel count 3", json);
    }

    [Fact]
    public async SystemTask GetDbContent_ClassifiesDistinctParcelCountMismatch()
    {
        var sut = CreateController(new Dictionary<string, string?>
        {
            ["RuntimeTruth:ExpectedBentonParcelCount"] = "1",
        });

        var result = await sut.GetDbContent();

        var ok = Assert.IsType<OkObjectResult>(result);
        var json = JsonSerializer.Serialize(ok.Value);

        Assert.Contains("\"PropertyRows\":2", json);
        Assert.Contains("\"DistinctParcelIds\":1", json);
        Assert.Contains("\"DuplicateParcelIdGroups\":1", json);
        Assert.Contains("configured_count_matches_distinct_parcels_not_rows", json);
        Assert.Contains("Runtime Benton property rows 2 do not match configured parcel count 1", json);
    }

    private RuntimeTruthController CreateController(Dictionary<string, string?>? settings = null)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(settings ?? new Dictionary<string, string?>())
            .Build();
        var controller = new RuntimeTruthController(
            _db,
            configuration,
            new TestEnvironment { EnvironmentName = "Development" });
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                Request =
                {
                    Scheme = "http",
                    Host = new HostString("localhost:5046"),
                },
            },
        };
        return controller;
    }

    private sealed class TestEnvironment : IWebHostEnvironment
    {
        public string EnvironmentName { get; set; } = "Development";
        public string ApplicationName { get; set; } = "TerraFusion.API.Tests";
        public string WebRootPath { get; set; } = string.Empty;
        public IFileProvider WebRootFileProvider { get; set; } = new NullFileProvider();
        public string ContentRootPath { get; set; } = Directory.GetCurrentDirectory();
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}
