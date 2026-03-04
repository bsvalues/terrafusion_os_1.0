using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using AutoMapper;
using TerraFusion.Core.Entities;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.Core.Services;

public class PropertyService : IPropertyService
{
    private readonly ITerraFusionDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<PropertyService> _logger;

    public PropertyService(ITerraFusionDbContext context, IMapper mapper, ILogger<PropertyService> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<PagedResult<PropertyDto>> GetPropertiesAsync(int page, int pageSize, string? search = null, Guid? countyId = null)
    {
        var query = _context.Properties
            .Include(p => p.County)
            .Include(p => p.Valuations)
            .AsQueryable();

        // Apply search filter
        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(p => (p.ParcelNumber != null && p.ParcelNumber.Contains(search)) ||
                                   (p.Address != null && p.Address.Contains(search)) ||
                                   (p.OwnerName != null && p.OwnerName.Contains(search)));
        }

        // Apply county filter
        if (countyId.HasValue)
        {
            query = query.Where(p => p.CountyId == countyId.Value);
        }

        var totalCount = await query.CountAsync();
        
        var properties = await query
            .OrderBy(p => p.ParcelNumber)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var propertyDtos = _mapper.Map<List<PropertyDto>>(properties);

        return new PagedResult<PropertyDto>
        {
            Items = propertyDtos,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<IEnumerable<PropertyDto>> SearchPropertiesAsync(string searchTerm)
    {
        var properties = await _context.Properties
            .Include(p => p.County)
            .Where(p => (p.ParcelNumber != null && p.ParcelNumber.Contains(searchTerm)) ||
                       (p.Address != null && p.Address.Contains(searchTerm)) ||
                       (p.OwnerName != null && p.OwnerName.Contains(searchTerm)))
            .Take(100) // Limit results
            .ToListAsync();

        return _mapper.Map<IEnumerable<PropertyDto>>(properties);
    }

    public async Task<PropertyDto?> GetPropertyByIdAsync(Guid id, Guid countyId)
    {
        var property = await _context.Properties
            .Include(p => p.County)
            .Include(p => p.Valuations)
            .FirstOrDefaultAsync(p => p.Id == id && p.CountyId == countyId);

        return property != null ? _mapper.Map<PropertyDto>(property) : null;
    }

    public async Task<PropertyDto?> GetPropertyByIdAsync(Guid id)
    {
        var property = await _context.Properties
            .Include(p => p.County)
            .Include(p => p.Valuations)
            .FirstOrDefaultAsync(p => p.Id == id);

        return property != null ? _mapper.Map<PropertyDto>(property) : null;
    }

    public async Task<PropertyDto?> GetPropertyByParcelAsync(string parcelNumber)
    {
        var property = await _context.Properties
            .Include(p => p.County)
            .Include(p => p.Valuations)
            .FirstOrDefaultAsync(p => p.ParcelNumber == parcelNumber);

        return property != null ? _mapper.Map<PropertyDto>(property) : null;
    }

    public async Task<IEnumerable<ValuationDto>> GetPropertyValuationsAsync(Guid propertyId)
    {
        var valuations = await _context.Valuations
            .Include(v => v.AIModel)
            .Where(v => v.PropertyId == propertyId)
            .OrderByDescending(v => v.CreatedAt)
            .ToListAsync();

        return _mapper.Map<IEnumerable<ValuationDto>>(valuations);
    }

    public async Task<ValuationDto> CreateValuationAsync(CreateValuationDto createDto)
    {
        var valuation = _mapper.Map<Valuation>(createDto);
        valuation.CreatedAt = DateTime.UtcNow;

        _context.Valuations.Add(valuation);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created valuation for property {PropertyId} with value {EstimatedValue}", 
            valuation.PropertyId, valuation.EstimatedValue);

        // Load related data for return
        await _context.Entry(valuation)
            .Reference(v => v.Property)
            .LoadAsync();
        await _context.Entry(valuation)
            .Reference(v => v.AIModel)
            .LoadAsync();

        return _mapper.Map<ValuationDto>(valuation);
    }

    public async Task<PropertyDto> CreatePropertyAsync(PropertyCreateRequest createDto)
    {
        var property = _mapper.Map<Property>(createDto);
        property.CreatedAt = DateTime.UtcNow;
        property.UpdatedAt = DateTime.UtcNow;

        _context.Properties.Add(property);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created property {ParcelNumber}", property.ParcelNumber);

        // Load related data for return
        await _context.Entry(property)
            .Reference(p => p.County)
            .LoadAsync();

        return _mapper.Map<PropertyDto>(property);
    }

    public async Task<PropertyStatsDto> GetPropertyStatsAsync()
    {
        var totalProperties = await _context.Properties.CountAsync();
        var totalAssessedValue = await _context.Properties.SumAsync(p => p.AssessedValue);
        var avgAssessedValue = totalProperties > 0 ? totalAssessedValue / totalProperties : 0;

        var countiesCounts = await _context.Properties
            .Include(p => p.County)
            .GroupBy(p => p.County.Name)
            .Select(g => new { County = g.Key, Count = g.Count() })
            .ToListAsync();

        return new PropertyStatsDto
        {
            TotalProperties = totalProperties,
            TotalAssessedValue = totalAssessedValue,
            AverageAssessedValue = avgAssessedValue,
            CountiesCount = countiesCounts.Count,
            PropertiesByCounty = countiesCounts.ToDictionary(x => x.County, x => x.Count)
        };
    }

    public async Task<IEnumerable<PropertyDto>> ImportPropertiesAsync(IEnumerable<ImportPropertyDto> properties)
    {
        var propertyEntities = new List<Property>();
        var importedCount = 0;

        foreach (var importDto in properties)
        {
            // Check if property already exists
            var existing = await _context.Properties
                .FirstOrDefaultAsync(p => p.ParcelNumber == importDto.ParcelNumber);

            if (existing == null)
            {
                var property = _mapper.Map<Property>(importDto);
                property.CreatedAt = DateTime.UtcNow;
                property.UpdatedAt = DateTime.UtcNow;

                propertyEntities.Add(property);
                importedCount++;
            }
        }

        if (propertyEntities.Any())
        {
            _context.Properties.AddRange(propertyEntities);
            await _context.SaveChangesAsync();

            // Load related data for the imported properties
            foreach (var property in propertyEntities)
            {
                await _context.Entry(property)
                    .Reference(p => p.County)
                    .LoadAsync();
            }
        }

        _logger.LogInformation("Imported {ImportedCount} new properties", importedCount);

        return _mapper.Map<IEnumerable<PropertyDto>>(propertyEntities);
    }
}
