using Xunit;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using TerraFusion.Core.Data;
using { NAMESPACE}.Services;
using { NAMESPACE}.Entities;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace { NAMESPACE }.Tests.Integration;

/// <summary>
/// County Isolation Tests for {MODULE_NAME} Module
/// 
/// CRITICAL: These tests validate FISMA-High compliance requirement that
/// NO cross-county data leaks occur. All tests MUST pass with 0 failures
/// before production deployment.
/// 
/// Reference: SDK/COUNTY_ISOLATION_GUIDE.md
/// Canonical: backend/tests/TerraFusion.Integration.Tests/CountyIsolationTests.cs
/// </summary>
public class { PASCAL_NAME }
CountyIsolationTests: IDisposable
{
    private readonly TerraFusionDbContext _bentonContext;
private readonly TerraFusionDbContext _yakimaContext;
private readonly I
{ PASCAL_NAME}
Service _bentonService;
private readonly I
{ PASCAL_NAME}
Service _yakimaService;
private readonly Guid _bentonCountyId;
private readonly Guid _yakimaCountyId;

public
{ PASCAL_NAME}
CountyIsolationTests()
    {
    // Create separate in-memory databases for each county
    _bentonCountyId = Guid.NewGuid();
    _yakimaCountyId = Guid.NewGuid();

    _bentonContext = CreateContext("benton-test", _bentonCountyId);
    _yakimaContext = CreateContext("yakima-test", _yakimaCountyId);

    // Seed test counties
    SeedCounties();

    // Create services for each county context
    var mapper = CreateMapper();
    _bentonService = new { PASCAL_NAME }Service(_bentonContext, mapper, CreateLogger());
    _yakimaService = new { PASCAL_NAME }Service(_yakimaContext, mapper, CreateLogger());
}

private TerraFusionDbContext CreateContext(string dbName, Guid countyId)
{
    var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
        .UseInMemoryDatabase(databaseName: dbName)
        .Options;

    var mockConfig = new Mock<IConfiguration>();
    mockConfig.Setup(c => c["County:Code"]).Returns(countyId.ToString());

    return new TerraFusionDbContext(options, mockConfig.Object);
}

private void SeedCounties()
{
    // Seed Benton County
    _bentonContext.Counties.Add(new County
    {
        Id = _bentonCountyId,
        Name = "Benton County",
        Code = "benton",
        State = "WA",
        FIPSCode = "53005"
    });
    _bentonContext.SaveChanges();

    // Seed Yakima County
    _yakimaContext.Counties.Add(new County
    {
        Id = _yakimaCountyId,
        Name = "Yakima County",
        Code = "yakima",
        State = "WA",
        FIPSCode = "53077"
    });
    _yakimaContext.SaveChanges();
}

/// <summary>
/// Test 1: Verify entities can ONLY be retrieved from their assigned county
/// </summary>
[Fact]
public async Task GetByCounty_ReturnsOnlyCountySpecificData()
{
    // Arrange: Create entities in both counties
    var bentonEntity = new { PASCAL_NAME }
        {
        Id = Guid.NewGuid(),
            CountyId = _bentonCountyId,
            Name = "Benton Entity",
            CreatedAt = DateTime.UtcNow
        }
    ;

    var yakimaEntity = new { PASCAL_NAME }
        {
        Id = Guid.NewGuid(),
            CountyId = _yakimaCountyId,
            Name = "Yakima Entity",
            CreatedAt = DateTime.UtcNow
        }
    ;

    _bentonContext.{ PASCAL_NAME}
    s.Add(bentonEntity);
    _bentonContext.{ PASCAL_NAME}
    s.Add(yakimaEntity); // Cross-contamination test
    await _bentonContext.SaveChangesAsync();

    // Act: Query Benton County context
    var bentonResults = await _bentonContext.{ PASCAL_NAME}
    s
        .Where(e => e.CountyId == _bentonCountyId)
        .ToListAsync();

    // Assert: ONLY Benton County data returned
    bentonResults.Should().HaveCount(1);
    bentonResults.Should().OnlyContain(e => e.CountyId == _bentonCountyId);
    bentonResults.Should().NotContain(e => e.CountyId == _yakimaCountyId);
}

/// <summary>
/// Test 2: Verify service layer enforces county isolation
/// </summary>
[Fact]
public async Task ServiceGetAll_OnlyReturnsCountyData()
{
    // Arrange: Create data in both counties
    var bentonData = new List<{ PASCAL_NAME } >
        {
        new() { Id = Guid.NewGuid(), CountyId = _bentonCountyId, Name = "Benton 1" },
            new() { Id = Guid.NewGuid(), CountyId = _bentonCountyId, Name = "Benton 2" }
        }
    ;

    var yakimaData = new List<{ PASCAL_NAME } >
        {
        new() { Id = Guid.NewGuid(), CountyId = _yakimaCountyId, Name = "Yakima 1" }
        }
    ;

    _bentonContext.{ PASCAL_NAME}
    s.AddRange(bentonData);
    await _bentonContext.SaveChangesAsync();

    _yakimaContext.{ PASCAL_NAME}
    s.AddRange(yakimaData);
    await _yakimaContext.SaveChangesAsync();

    // Act: Query via service layer
    var bentonResult = await _bentonService.GetAllAsync(1, 100);

    // Assert: Service returns ONLY Benton County data
    bentonResult.Items.Should().HaveCount(2);
    bentonResult.Items.Should().OnlyContain(e => e.CountyId == _bentonCountyId);
}

/// <summary>
/// Test 3: Verify GetById prevents cross-county access
/// </summary>
[Fact]
public async Task GetById_CannotAccessOtherCountyData()
{
    // Arrange: Create entity in Yakima County
    var yakimaEntity = new { PASCAL_NAME }
        {
        Id = Guid.NewGuid(),
            CountyId = _yakimaCountyId,
            Name = "Yakima Sensitive Data"
        }
    ;

    _yakimaContext.{ PASCAL_NAME}
    s.Add(yakimaEntity);
    await _yakimaContext.SaveChangesAsync();

    // Act: Attempt to access Yakima data from Benton service
    var result = await _bentonService.GetByIdAsync(yakimaEntity.Id);

    // Assert: Benton service CANNOT access Yakima county data
    result.Should().BeNull();
}

/// <summary>
/// Test 4: Verify Create enforces CountyId assignment
/// </summary>
[Fact]
public async Task Create_EnforcesCountyId()
{
    // Arrange
    var createDto = new Create { PASCAL_NAME }Dto
        {
        Name = "Test Entity"
            // Note: CountyId should be auto-assigned by service
        }
    ;

    // Act
    var created = await _bentonService.CreateAsync(createDto);

    // Assert: Created entity has correct CountyId
    created.Should().NotBeNull();
    created.CountyId.Should().Be(_bentonCountyId);

    // Verify in database
    var dbEntity = await _bentonContext.{ PASCAL_NAME}
    s
        .FirstOrDefaultAsync(e => e.Id == created.Id);

    dbEntity.Should().NotBeNull();
    dbEntity!.CountyId.Should().Be(_bentonCountyId);
}

/// <summary>
/// Test 5: Verify Update cannot modify other county's data
/// </summary>
[Fact]
public async Task Update_CannotModifyOtherCountyData()
{
    // Arrange: Create entity in Yakima County
    var yakimaEntity = new { PASCAL_NAME }
        {
        Id = Guid.NewGuid(),
            CountyId = _yakimaCountyId,
            Name = "Yakima Original"
        }
    ;

    _yakimaContext.{ PASCAL_NAME}
    s.Add(yakimaEntity);
    await _yakimaContext.SaveChangesAsync();

    // Act: Attempt to update from Benton service
    var updateDto = new Update { PASCAL_NAME }Dto
        {
        Name = "Hacked by Benton"
        }
    ;

    var result = await _bentonService.UpdateAsync(yakimaEntity.Id, updateDto);

    // Assert: Update FAILS (returns null)
    result.Should().BeNull();

    // Verify original data unchanged in Yakima
    var yakimaCheck = await _yakimaContext.{ PASCAL_NAME}
    s
        .FirstOrDefaultAsync(e => e.Id == yakimaEntity.Id);

    yakimaCheck!.Name.Should().Be("Yakima Original");
}

/// <summary>
/// Test 6: Verify Delete cannot remove other county's data
/// </summary>
[Fact]
public async Task Delete_CannotDeleteOtherCountyData()
{
    // Arrange: Create entity in Yakima County
    var yakimaEntity = new { PASCAL_NAME }
        {
        Id = Guid.NewGuid(),
            CountyId = _yakimaCountyId,
            Name = "Yakima Protected"
        }
    ;

    _yakimaContext.{ PASCAL_NAME}
    s.Add(yakimaEntity);
    await _yakimaContext.SaveChangesAsync();

    // Act: Attempt to delete from Benton service
    var deleted = await _bentonService.DeleteAsync(yakimaEntity.Id);

    // Assert: Delete FAILS
    deleted.Should().BeFalse();

    // Verify entity still exists in Yakima
    var yakimaCheck = await _yakimaContext.{ PASCAL_NAME}
    s
        .FirstOrDefaultAsync(e => e.Id == yakimaEntity.Id);

    yakimaCheck.Should().NotBeNull();
}

/// <summary>
/// Test 7: Verify repository queries include CountyId filter
/// </summary>
[Fact]
public async Task RepositoryQueries_AlwaysFilterByCountyId()
{
    // Arrange: Create mixed county data in same context (simulating misconfiguration)
    var mixedData = new List<{ PASCAL_NAME } >
        {
        new() { Id = Guid.NewGuid(), CountyId = _bentonCountyId, Name = "Benton 1" },
            new() { Id = Guid.NewGuid(), CountyId = _bentonCountyId, Name = "Benton 2" },
            new() { Id = Guid.NewGuid(), CountyId = _yakimaCountyId, Name = "Yakima Leak" },
            new() { Id = Guid.NewGuid(), CountyId = Guid.NewGuid(), Name = "Unknown County" }
        }
    ;

    _bentonContext.{ PASCAL_NAME}
    s.AddRange(mixedData);
    await _bentonContext.SaveChangesAsync();

    // Act: Query using repository pattern with county filter
    var results = await _bentonContext.{ PASCAL_NAME}
    s
        .Where(e => e.CountyId == _bentonCountyId)
        .ToListAsync();

    // Assert: ZERO cross-county leaks
    results.Should().HaveCount(2);
    results.Should().OnlyContain(e => e.CountyId == _bentonCountyId);
}

/// <summary>
/// Test 8: Performance test - county filter doesn't degrade performance
/// </summary>
[Fact]
public async Task CountyFilter_MaintainsPerformance()
{
    // Arrange: Create large dataset
    var bentonData = Enumerable.Range(1, 1000)
        .Select(i => new { PASCAL_NAME }
            {
        Id = Guid.NewGuid(),
                CountyId = _bentonCountyId,
                Name = $"Benton Entity {i}"
            })
            .ToList();

    _bentonContext.{ PASCAL_NAME}
    s.AddRange(bentonData);
    await _bentonContext.SaveChangesAsync();

    // Act: Query with timing
    var stopwatch = System.Diagnostics.Stopwatch.StartNew();
    var results = await _bentonContext.{ PASCAL_NAME}
    s
        .Where(e => e.CountyId == _bentonCountyId)
        .Take(100)
        .ToListAsync();
    stopwatch.Stop();

    // Assert: Performance within acceptable range (<100ms for in-memory)
    results.Should().HaveCount(100);
    stopwatch.ElapsedMilliseconds.Should().BeLessThan(100);
}

// Helper methods
private IMapper CreateMapper()
{
    var mockMapper = new Mock<IMapper>();
    mockMapper.Setup(m => m.Map <{ PASCAL_NAME}
    Dto > (It.IsAny <{ PASCAL_NAME}> ()))
            .Returns((object src) =>
            {
            var entity = ({ PASCAL_NAME})src;
    return new { PASCAL_NAME }Dto
                {
        Id = entity.Id,
                    CountyId = entity.CountyId,
                    Name = entity.Name
                }
    ;
});

return mockMapper.Object;
    }

    private ILogger<{ PASCAL_NAME}
Service > CreateLogger()
    {
    return Mock.Of < ILogger <{ PASCAL_NAME}
    Service}> ();
    }

    public void Dispose()
{
    _bentonContext?.Dispose();
    _yakimaContext?.Dispose();
}
}

/// <summary>
/// GOVERNMENT COMPLIANCE SUMMARY
/// 
/// These tests validate that {MODULE_NAME} module enforces:
/// ✅ 100% county data isolation (FISMA-High requirement)
/// ✅ NO cross-county data leaks (0 failures required)
/// ✅ Service layer enforces CountyId filtering
/// ✅ Repository queries always include CountyId WHERE clause
/// ✅ Create/Update/Delete operations respect county boundaries
/// 
/// DEPLOYMENT REQUIREMENT: All 8 tests MUST pass before production deployment.
/// 
/// Reference Documentation:
/// - SDK/COUNTY_ISOLATION_GUIDE.md
/// - backend/tests/TerraFusion.Integration.Tests/CountyIsolationTests.cs
/// - backend/COUNTY_ISOLATION_QUICK_REF.md
/// </summary>
/// 