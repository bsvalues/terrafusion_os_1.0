# County Isolation Quick Reference

**Purpose**: Fast reference for implementing county-scoped queries in TerraFusion

---

## The Golden Rule

**ALWAYS include `countyCode` parameter in repository methods.**

---

## Schema Standards

### Entity Definition
```csharp
public class MyEntity
{
    public Guid Id { get; set; }

    // ✅ CORRECT: Guid foreign key
    public Guid CountyId { get; set; }
    public County County { get; set; }

    // ❌ WRONG: int foreign key
    // public int CountyId { get; set; }
}
```

### Repository Interface
```csharp
public interface IMyEntityRepository
{
    // ✅ CORRECT: Includes countyCode parameter
    Task<MyEntity> GetByIdAsync(Guid countyCode, Guid entityId);
    Task<List<MyEntity>> GetByCountyAsync(Guid countyCode);
    Task CreateAsync(MyEntity entity, Guid countyCode);
    Task UpdateAsync(MyEntity entity, Guid countyCode);
    Task DeleteAsync(Guid entityId, Guid countyCode);

    // ❌ WRONG: Missing countyCode parameter
    // Task<List<MyEntity>> GetAllAsync(); // Cross-county leak!
}
```

### Repository Implementation
```csharp
public class MyEntityRepository : IMyEntityRepository
{
    private readonly TerraFusionDbContext _context;

    public async Task<MyEntity> GetByIdAsync(Guid countyCode, Guid entityId)
    {
        // ✅ CORRECT: Filter by CountyId
        return await _context.MyEntities
            .Where(e => e.CountyId == countyCode && e.Id == entityId)
            .SingleOrDefaultAsync();

        // ❌ WRONG: No county filter
        // return await _context.MyEntities
        //     .Where(e => e.Id == entityId)
        //     .SingleOrDefaultAsync();
    }

    public async Task<List<MyEntity>> GetByCountyAsync(Guid countyCode)
    {
        // ✅ CORRECT: Filter by CountyId
        return await _context.MyEntities
            .Where(e => e.CountyId == countyCode)
            .ToListAsync();
    }

    public async Task CreateAsync(MyEntity entity, Guid countyCode)
    {
        // ✅ CORRECT: Enforce CountyId
        entity.CountyId = countyCode;
        _context.MyEntities.Add(entity);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(MyEntity entity, Guid countyCode)
    {
        // ✅ CORRECT: Verify CountyId matches
        var existing = await GetByIdAsync(countyCode, entity.Id);
        if (existing == null)
            throw new InvalidOperationException($"Entity not found in county {countyCode}");

        // Update fields...
        _context.Entry(existing).CurrentValues.SetValues(entity);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(Guid entityId, Guid countyCode)
    {
        // ✅ CORRECT: Delete only within county
        var entity = await GetByIdAsync(countyCode, entityId);
        if (entity != null)
        {
            _context.MyEntities.Remove(entity);
            await _context.SaveChangesAsync();
        }
    }
}
```

---

## Testing Pattern

### Test Setup
```csharp
public class MyEntityTests
{
    private TerraFusionDbContext CreateContext(string countyCode)
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var mockConfig = new Mock<IConfiguration>();
        mockConfig.Setup(c => c["County:Code"]).Returns(countyCode);

        return new TerraFusionDbContext(options, mockConfig.Object);
    }

    [Fact]
    public async Task GetByCountyAsync_ReturnsOnlyCountyData()
    {
        // Arrange: Create test data in multiple counties
        using var context = CreateContext("test-king-wa");
        var kingCountyId = Guid.NewGuid();
        var pierceCountyId = Guid.NewGuid();

        context.MyEntities.AddRange(
            new MyEntity { Id = Guid.NewGuid(), CountyId = kingCountyId, Name = "King 1" },
            new MyEntity { Id = Guid.NewGuid(), CountyId = kingCountyId, Name = "King 2" },
            new MyEntity { Id = Guid.NewGuid(), CountyId = pierceCountyId, Name = "Pierce 1" }
        );
        await context.SaveChangesAsync();

        // Act: Query for King County only
        var repository = new MyEntityRepository(context);
        var result = await repository.GetByCountyAsync(kingCountyId);

        // Assert: Only King County data returned
        result.Should().HaveCount(2);
        result.Should().OnlyContain(e => e.CountyId == kingCountyId);
    }
}
```

---

## Common Mistakes

### ❌ Mistake 1: Using int for foreign keys
```csharp
// WRONG
public int CountyId { get; set; }

// CORRECT
public Guid CountyId { get; set; }
```

### ❌ Mistake 2: Missing countyCode parameter
```csharp
// WRONG
Task<List<MyEntity>> GetAllAsync();

// CORRECT
Task<List<MyEntity>> GetByCountyAsync(Guid countyCode);
```

### ❌ Mistake 3: Queries without county filter
```csharp
// WRONG
var entities = await _context.MyEntities.ToListAsync();

// CORRECT
var entities = await _context.MyEntities
    .Where(e => e.CountyId == countyCode)
    .ToListAsync();
```

### ❌ Mistake 4: Not validating countyCode in updates
```csharp
// WRONG
public async Task UpdateAsync(MyEntity entity)
{
    _context.Entry(entity).State = EntityState.Modified;
    await _context.SaveChangesAsync();
}

// CORRECT
public async Task UpdateAsync(MyEntity entity, Guid countyCode)
{
    var existing = await GetByIdAsync(countyCode, entity.Id);
    if (existing == null)
        throw new InvalidOperationException($"Entity not found in county {countyCode}");

    _context.Entry(existing).CurrentValues.SetValues(entity);
    await _context.SaveChangesAsync();
}
```

---

## Validation Checklist

Before committing code, verify:

- [ ] All entity foreign keys use `Guid` (not `int`)
- [ ] All repository methods include `Guid countyCode` parameter
- [ ] All queries filter by `CountyId`
- [ ] Create operations set `entity.CountyId = countyCode`
- [ ] Update operations validate `countyCode` matches
- [ ] Delete operations filter by `countyCode`
- [ ] Tests verify multi-county data isolation
- [ ] No direct `_context.Entities.ToListAsync()` calls

---

## Reference Implementation

**Canonical Test Suite**: `backend/tests/TerraFusion.Integration.Tests/CountyIsolationTests.cs`

Study this file for complete examples of:
- Multi-county test data setup
- County-scoped queries
- Update isolation validation
- Delete isolation validation
- Bulk operation isolation

---

## Questions?

See full documentation:
- **[Integration Test Achievement](./INTEGRATION_TEST_ACHIEVEMENT.md)** - Complete summary
- **[Schema Standardization Log](./SCHEMA_STANDARDIZATION_LOG.md)** - Technical details
- **[County Isolation Championship](./tests/COUNTY_ISOLATION_CHAMPIONSHIP.md)** - Test evidence

---

**Remember**: County isolation is not optional—it's a government compliance requirement.
