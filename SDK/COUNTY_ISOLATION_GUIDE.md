# SDK County Isolation Development Guide

**Essential reading for all TerraFusion government module developers**

---

## Overview

TerraFusion manages data for **39 Washington State counties** with strict tenant boundaries. Every government module MUST implement county isolation to prevent cross-county data leaks.

**Compliance Requirements**: FISMA-High, FedRAMP High, NIST 800-53, SOC 2 Type II

---

## The Golden Rule

**EVERY database query MUST include county filtering.**

---

## Quick Start Checklist

Before writing any module code:

- [ ] Read [Backend County Isolation Quick Reference](../backend/COUNTY_ISOLATION_QUICK_REF.md)
- [ ] Study [CountyIsolationTests.cs](../backend/tests/TerraFusion.Integration.Tests/CountyIsolationTests.cs)
- [ ] Understand `Guid` foreign key requirements
- [ ] Know the repository pattern with `countyCode` parameters
- [ ] Plan integration tests for your module

---

## Schema Standards

### Entity Definition

```csharp
// ✅ CORRECT: County-scoped entity
public class MyModuleEntity
{
    public Guid Id { get; set; }
    public string Name { get; set; }

    // Required: County isolation
    public Guid CountyId { get; set; }
    public County County { get; set; }

    // Optional: User ownership
    public Guid? UserId { get; set; }
    public GovernmentUser User { get; set; }

    // Audit fields
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string CreatedBy { get; set; }
    public string UpdatedBy { get; set; }
}
```

```csharp
// ❌ WRONG: int foreign keys
public class BadEntity
{
    public Guid Id { get; set; }
    public int CountyId { get; set; }  // ❌ Must be Guid!
    public int UserId { get; set; }    // ❌ Must be Guid!
}
```

### DbContext Configuration

```csharp
public class MyModuleDbContext : DbContext
{
    public DbSet<MyModuleEntity> MyEntities { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure county relationship
        modelBuilder.Entity<MyModuleEntity>()
            .HasOne(e => e.County)
            .WithMany()
            .HasForeignKey(e => e.CountyId)
            .OnDelete(DeleteBehavior.Restrict);

        // Configure user relationship
        modelBuilder.Entity<MyModuleEntity>()
            .HasOne(e => e.User)
            .WithMany()
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.SetNull);

        // Create index for county queries
        modelBuilder.Entity<MyModuleEntity>()
            .HasIndex(e => e.CountyId)
            .HasDatabaseName("IX_MyEntities_CountyId");
    }
}
```

---

## Repository Pattern

### Interface Definition

```csharp
public interface IMyModuleEntityRepository
{
    // ✅ CORRECT: All methods include Guid countyCode
    Task<MyModuleEntity> GetByIdAsync(Guid countyCode, Guid entityId);
    Task<List<MyModuleEntity>> GetByCountyAsync(Guid countyCode);
    Task<MyModuleEntity> CreateAsync(MyModuleEntity entity, Guid countyCode);
    Task<MyModuleEntity> UpdateAsync(MyModuleEntity entity, Guid countyCode);
    Task DeleteAsync(Guid entityId, Guid countyCode);

    // For paginated queries
    Task<PagedResult<MyModuleEntity>> GetPagedAsync(
        Guid countyCode,
        int page,
        int pageSize);

    // For search queries
    Task<List<MyModuleEntity>> SearchAsync(
        Guid countyCode,
        string searchTerm);

    // ❌ WRONG: Missing countyCode parameter
    // Task<List<MyModuleEntity>> GetAllAsync();
}
```

### Repository Implementation

```csharp
public class MyModuleEntityRepository : IMyModuleEntityRepository
{
    private readonly MyModuleDbContext _context;
    private readonly ILogger<MyModuleEntityRepository> _logger;

    public MyModuleEntityRepository(
        MyModuleDbContext context,
        ILogger<MyModuleEntityRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<MyModuleEntity> GetByIdAsync(Guid countyCode, Guid entityId)
    {
        _logger.LogDebug("Getting entity {EntityId} for county {CountyCode}",
            entityId, countyCode);

        return await _context.MyEntities
            .Where(e => e.CountyId == countyCode && e.Id == entityId)
            .SingleOrDefaultAsync();
    }

    public async Task<List<MyModuleEntity>> GetByCountyAsync(Guid countyCode)
    {
        return await _context.MyEntities
            .Where(e => e.CountyId == countyCode)
            .OrderBy(e => e.CreatedAt)
            .ToListAsync();
    }

    public async Task<MyModuleEntity> CreateAsync(MyModuleEntity entity, Guid countyCode)
    {
        // Enforce CountyId (never trust incoming data)
        entity.CountyId = countyCode;
        entity.CreatedAt = DateTime.UtcNow;

        _context.MyEntities.Add(entity);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created entity {EntityId} in county {CountyCode}",
            entity.Id, countyCode);

        return entity;
    }

    public async Task<MyModuleEntity> UpdateAsync(MyModuleEntity entity, Guid countyCode)
    {
        // CRITICAL: Verify entity exists in specified county
        var existing = await GetByIdAsync(countyCode, entity.Id);
        if (existing == null)
        {
            throw new InvalidOperationException(
                $"Entity {entity.Id} not found in county {countyCode}");
        }

        // Update fields
        existing.Name = entity.Name;
        existing.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return existing;
    }

    public async Task DeleteAsync(Guid entityId, Guid countyCode)
    {
        var entity = await GetByIdAsync(countyCode, entityId);
        if (entity != null)
        {
            _context.MyEntities.Remove(entity);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Deleted entity {EntityId} from county {CountyCode}",
                entityId, countyCode);
        }
    }

    public async Task<PagedResult<MyModuleEntity>> GetPagedAsync(
        Guid countyCode,
        int page,
        int pageSize)
    {
        var query = _context.MyEntities
            .Where(e => e.CountyId == countyCode);

        var total = await query.CountAsync();

        var items = await query
            .OrderBy(e => e.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<MyModuleEntity>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<List<MyModuleEntity>> SearchAsync(
        Guid countyCode,
        string searchTerm)
    {
        return await _context.MyEntities
            .Where(e => e.CountyId == countyCode &&
                       e.Name.Contains(searchTerm))
            .ToListAsync();
    }
}
```

---

## Service Layer Pattern

### Service Interface

```csharp
public interface IMyModuleEntityService
{
    Task<MyModuleEntityDto> GetByIdAsync(Guid entityId);
    Task<List<MyModuleEntityDto>> GetAllAsync();
    Task<MyModuleEntityDto> CreateAsync(CreateMyModuleEntityDto dto);
    Task<MyModuleEntityDto> UpdateAsync(Guid entityId, UpdateMyModuleEntityDto dto);
    Task DeleteAsync(Guid entityId);
}
```

### Service Implementation with County Context

```csharp
public class MyModuleEntityService : IMyModuleEntityService
{
    private readonly IMyModuleEntityRepository _repository;
    private readonly IMapper _mapper;
    private readonly IConfiguration _configuration;
    private readonly ILogger<MyModuleEntityService> _logger;

    public MyModuleEntityService(
        IMyModuleEntityRepository repository,
        IMapper mapper,
        IConfiguration configuration,
        ILogger<MyModuleEntityService> logger)
    {
        _repository = repository;
        _mapper = mapper;
        _configuration = configuration;
        _logger = logger;
    }

    private Guid GetCountyCode()
    {
        // Get county code from configuration (tenant-scoped)
        var countyCodeStr = _configuration["County:Code"];
        if (string.IsNullOrEmpty(countyCodeStr))
        {
            throw new InvalidOperationException("County code not configured");
        }

        return Guid.Parse(countyCodeStr);
    }

    public async Task<MyModuleEntityDto> GetByIdAsync(Guid entityId)
    {
        var countyCode = GetCountyCode();
        var entity = await _repository.GetByIdAsync(countyCode, entityId);

        if (entity == null)
        {
            throw new NotFoundException($"Entity {entityId} not found");
        }

        return _mapper.Map<MyModuleEntityDto>(entity);
    }

    public async Task<List<MyModuleEntityDto>> GetAllAsync()
    {
        var countyCode = GetCountyCode();
        var entities = await _repository.GetByCountyAsync(countyCode);

        return _mapper.Map<List<MyModuleEntityDto>>(entities);
    }

    public async Task<MyModuleEntityDto> CreateAsync(CreateMyModuleEntityDto dto)
    {
        var countyCode = GetCountyCode();
        var entity = _mapper.Map<MyModuleEntity>(dto);

        var created = await _repository.CreateAsync(entity, countyCode);

        return _mapper.Map<MyModuleEntityDto>(created);
    }

    public async Task<MyModuleEntityDto> UpdateAsync(
        Guid entityId,
        UpdateMyModuleEntityDto dto)
    {
        var countyCode = GetCountyCode();
        var entity = _mapper.Map<MyModuleEntity>(dto);
        entity.Id = entityId;

        var updated = await _repository.UpdateAsync(entity, countyCode);

        return _mapper.Map<MyModuleEntityDto>(updated);
    }

    public async Task DeleteAsync(Guid entityId)
    {
        var countyCode = GetCountyCode();
        await _repository.DeleteAsync(entityId, countyCode);
    }
}
```

---

## Controller Pattern (API)

```csharp
[ApiController]
[Route("api/my-module/entities")]
[Authorize]
public class MyModuleEntityController : ControllerBase
{
    private readonly IMyModuleEntityService _service;
    private readonly ILogger<MyModuleEntityController> _logger;

    public MyModuleEntityController(
        IMyModuleEntityService service,
        ILogger<MyModuleEntityController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<MyModuleEntityDto>), 200)]
    public async Task<IActionResult> GetAll()
    {
        // Service layer handles county filtering automatically
        var entities = await _service.GetAllAsync();
        return Ok(entities);
    }

    [HttpGet("{id}")]
    [ProducesResponseType(typeof(MyModuleEntityDto), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetById(Guid id)
    {
        try
        {
            var entity = await _service.GetByIdAsync(id);
            return Ok(entity);
        }
        catch (NotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPost]
    [ProducesResponseType(typeof(MyModuleEntityDto), 201)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> Create([FromBody] CreateMyModuleEntityDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var created = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    [ProducesResponseType(typeof(MyModuleEntityDto), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateMyModuleEntityDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var updated = await _service.UpdateAsync(id, dto);
            return Ok(updated);
        }
        catch (NotFoundException)
        {
            return NotFound();
        }
    }

    [HttpDelete("{id}")]
    [ProducesResponseType(204)]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _service.DeleteAsync(id);
        return NoContent();
    }
}
```

---

## Testing County Isolation

### Integration Test Setup

```csharp
public class MyModuleCountyIsolationTests
{
    private MyModuleDbContext CreateContext(string countyCode)
    {
        var options = new DbContextOptionsBuilder<MyModuleDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var mockConfig = new Mock<IConfiguration>();
        mockConfig.Setup(c => c["County:Code"]).Returns(countyCode);

        return new MyModuleDbContext(options, mockConfig.Object);
    }

    [Fact]
    public async Task GetByCounty_ReturnsOnlyCountyData()
    {
        // Arrange: Create entities in 3 counties
        using var context = CreateContext("test-king-wa");
        var kingCountyId = Guid.NewGuid();
        var pierceCountyId = Guid.NewGuid();
        var spokaneCountyId = Guid.NewGuid();

        context.MyEntities.AddRange(
            new MyModuleEntity { Id = Guid.NewGuid(), CountyId = kingCountyId, Name = "King 1" },
            new MyModuleEntity { Id = Guid.NewGuid(), CountyId = kingCountyId, Name = "King 2" },
            new MyModuleEntity { Id = Guid.NewGuid(), CountyId = pierceCountyId, Name = "Pierce 1" },
            new MyModuleEntity { Id = Guid.NewGuid(), CountyId = spokaneCountyId, Name = "Spokane 1" }
        );
        await context.SaveChangesAsync();

        // Act: Query for King County only
        var repository = new MyModuleEntityRepository(context, NullLogger<MyModuleEntityRepository>.Instance);
        var result = await repository.GetByCountyAsync(kingCountyId);

        // Assert: Only King County data returned
        result.Should().HaveCount(2);
        result.Should().OnlyContain(e => e.CountyId == kingCountyId);
        result.Should().Contain(e => e.Name == "King 1");
        result.Should().Contain(e => e.Name == "King 2");
    }

    [Fact]
    public async Task UpdateEntity_OnlyAffectsTargetCounty()
    {
        // Arrange
        using var context = CreateContext("test-king-wa");
        var kingCountyId = Guid.NewGuid();
        var pierceCountyId = Guid.NewGuid();

        var kingEntity = new MyModuleEntity
        {
            Id = Guid.NewGuid(),
            CountyId = kingCountyId,
            Name = "Original King"
        };
        var pierceEntity = new MyModuleEntity
        {
            Id = Guid.NewGuid(),
            CountyId = pierceCountyId,
            Name = "Original Pierce"
        };

        context.MyEntities.AddRange(kingEntity, pierceEntity);
        await context.SaveChangesAsync();

        // Act: Update King County entity
        var repository = new MyModuleEntityRepository(context, NullLogger<MyModuleEntityRepository>.Instance);
        kingEntity.Name = "Updated King";
        await repository.UpdateAsync(kingEntity, kingCountyId);

        // Assert: Pierce County entity unchanged
        var pierceResult = await repository.GetByIdAsync(pierceCountyId, pierceEntity.Id);
        pierceResult.Name.Should().Be("Original Pierce");

        var kingResult = await repository.GetByIdAsync(kingCountyId, kingEntity.Id);
        kingResult.Name.Should().Be("Updated King");
    }

    [Fact]
    public async Task DeleteEntity_OnlyAffectsTargetCounty()
    {
        // Arrange
        using var context = CreateContext("test-king-wa");
        var kingCountyId = Guid.NewGuid();
        var pierceCountyId = Guid.NewGuid();

        var kingEntity = new MyModuleEntity { Id = Guid.NewGuid(), CountyId = kingCountyId, Name = "King" };
        var pierceEntity = new MyModuleEntity { Id = Guid.NewGuid(), CountyId = pierceCountyId, Name = "Pierce" };

        context.MyEntities.AddRange(kingEntity, pierceEntity);
        await context.SaveChangesAsync();

        // Act: Delete King County entity
        var repository = new MyModuleEntityRepository(context, NullLogger<MyModuleEntityRepository>.Instance);
        await repository.DeleteAsync(kingEntity.Id, kingCountyId);

        // Assert: Pierce County entity still exists
        var pierceResult = await repository.GetByIdAsync(pierceCountyId, pierceEntity.Id);
        pierceResult.Should().NotBeNull();

        var kingResult = await repository.GetByIdAsync(kingCountyId, kingEntity.Id);
        kingResult.Should().BeNull();
    }

    [Fact]
    public async Task BulkOperation_EnforcesCountyIsolation()
    {
        // Arrange
        using var context = CreateContext("test-king-wa");
        var kingCountyId = Guid.NewGuid();
        var pierceCountyId = Guid.NewGuid();

        context.MyEntities.AddRange(
            new MyModuleEntity { Id = Guid.NewGuid(), CountyId = kingCountyId, Name = "King 1" },
            new MyModuleEntity { Id = Guid.NewGuid(), CountyId = kingCountyId, Name = "King 2" },
            new MyModuleEntity { Id = Guid.NewGuid(), CountyId = kingCountyId, Name = "King 3" },
            new MyModuleEntity { Id = Guid.NewGuid(), CountyId = pierceCountyId, Name = "Pierce 1" }
        );
        await context.SaveChangesAsync();

        // Act: Bulk update King County entities
        var repository = new MyModuleEntityRepository(context, NullLogger<MyModuleEntityRepository>.Instance);
        var kingEntities = await repository.GetByCountyAsync(kingCountyId);

        foreach (var entity in kingEntities)
        {
            entity.Name = entity.Name + " UPDATED";
            await repository.UpdateAsync(entity, kingCountyId);
        }

        // Assert: Pierce County entity unchanged
        var pierceEntities = await repository.GetByCountyAsync(pierceCountyId);
        pierceEntities.Should().HaveCount(1);
        pierceEntities.First().Name.Should().Be("Pierce 1");

        // King County entities updated
        var updatedKingEntities = await repository.GetByCountyAsync(kingCountyId);
        updatedKingEntities.Should().HaveCount(3);
        updatedKingEntities.Should().OnlyContain(e => e.Name.EndsWith("UPDATED"));
    }
}
```

---

## Common Mistakes to Avoid

### ❌ Mistake 1: Using int for CountyId
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

    existing.Name = entity.Name;
    await _context.SaveChangesAsync();
}
```

---

## Validation Checklist

Before submitting your module for review:

- [ ] All entities use `Guid CountyId` (not `int`)
- [ ] All repository methods include `Guid countyCode` parameter
- [ ] All queries filter by `CountyId`
- [ ] Create operations set `entity.CountyId = countyCode`
- [ ] Update operations validate `countyCode` matches
- [ ] Delete operations filter by `countyCode`
- [ ] Integration tests verify multi-county isolation
- [ ] Service layer retrieves `countyCode` from configuration
- [ ] No direct `_context.Entities.ToListAsync()` calls
- [ ] API controllers delegate county filtering to services

---

## Reference Documentation

- **[Backend County Isolation Quick Reference](../backend/COUNTY_ISOLATION_QUICK_REF.md)** - Fast lookup guide
- **[CountyIsolationTests.cs](../backend/tests/TerraFusion.Integration.Tests/CountyIsolationTests.cs)** - Canonical test implementation
- **[Integration Test Achievement](../backend/INTEGRATION_TEST_ACHIEVEMENT.md)** - Test evidence and validation
- **[Schema Standardization Log](../backend/SCHEMA_STANDARDIZATION_LOG.md)** - Entity relationship standards

---

**Remember**: County isolation is not optional—it's a government compliance requirement. All modules MUST prove tenant boundaries through automated tests.
