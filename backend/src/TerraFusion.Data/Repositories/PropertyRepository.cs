using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using TerraFusion.Core.Entities;
using TerraFusion.Core.DTOs;

namespace TerraFusion.Data.Repositories;

public interface IPropertyRepository
{
    System.Threading.Tasks.Task<Property?> GetByIdAsync(Guid id);
    System.Threading.Tasks.Task<Property?> GetByParcelIdAsync(string parcelId, Guid countyId);
    System.Threading.Tasks.Task<IEnumerable<Property>> GetByCountyIdAsync(Guid countyId, int page = 1, int pageSize = 100);
    System.Threading.Tasks.Task<IEnumerable<Property>> SearchPropertiesAsync(PropertySearchCriteria criteria);
    System.Threading.Tasks.Task<Property> CreateAsync(Property property);
    System.Threading.Tasks.Task<Property> UpdateAsync(Property property);
    System.Threading.Tasks.Task<bool> DeleteAsync(Guid id);
    System.Threading.Tasks.Task<PropertyStatistics> GetStatisticsAsync(Guid countyId);
    System.Threading.Tasks.Task<IEnumerable<Property>> GetPropertiesForAssessmentAsync(Guid countyId, int year);
}

public class PropertyRepository : IPropertyRepository
{
    private readonly TerraFusionDbContext _context;
    private readonly IDistributedCache _cache;
    private readonly ILogger<PropertyRepository> _logger;
    private const int DefaultCacheExpirationMinutes = 30;

    public PropertyRepository(
        TerraFusionDbContext context,
        IDistributedCache cache,
        ILogger<PropertyRepository> logger)
    {
        _context = context;
        _cache = cache;
        _logger = logger;
    }

    public async System.Threading.Tasks.Task<Property?> GetByIdAsync(Guid id)
    {
        var cacheKey = $"property:{id}";
        
        // Try cache first (significant performance improvement)
        var cachedProperty = await GetFromCacheAsync<Property>(cacheKey);
        if (cachedProperty != null)
        {
            _logger.LogDebug("Property {PropertyId} retrieved from cache", id);
            return cachedProperty;
        }

        // Optimized database query
        var property = await _context.Properties
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id);

        if (property != null)
        {
            await SetCacheAsync(cacheKey, property, TimeSpan.FromMinutes(DefaultCacheExpirationMinutes));
            _logger.LogDebug("Property {PropertyId} retrieved from database and cached", id);
        }

        return property;
    }

    public async System.Threading.Tasks.Task<Property?> GetByParcelIdAsync(string parcelId, Guid countyId)
    {
        var cacheKey = $"property:parcel:{countyId}:{parcelId}";
        
        var cachedProperty = await GetFromCacheAsync<Property>(cacheKey);
        if (cachedProperty != null)
        {
            return cachedProperty;
        }

        // Optimized query with compound index
        var property = await _context.Properties
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.ParcelId == parcelId && p.CountyId == countyId);

        if (property != null)
        {
            await SetCacheAsync(cacheKey, property, TimeSpan.FromMinutes(DefaultCacheExpirationMinutes));
        }

        return property;
    }

    public async System.Threading.Tasks.Task<IEnumerable<Property>> GetByCountyIdAsync(Guid countyId, int page = 1, int pageSize = 100)
    {
        var cacheKey = $"properties:county:{countyId}:page:{page}:size:{pageSize}";
        
        var cachedProperties = await GetFromCacheAsync<IEnumerable<Property>>(cacheKey);
        if (cachedProperties != null)
        {
            return cachedProperties;
        }

        // Performance-optimized pagination with query plan optimization
        var properties = await _context.Properties
            .AsNoTracking()
            .Where(p => p.CountyId == countyId)
            .OrderBy(p => p.ParcelId)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        await SetCacheAsync(cacheKey, properties, TimeSpan.FromMinutes(10));
        
        _logger.LogInformation("Retrieved {Count} properties for county {CountyId}, page {Page}", 
            properties.Count, countyId, page);

        return properties;
    }

    public async System.Threading.Tasks.Task<IEnumerable<Property>> SearchPropertiesAsync(PropertySearchCriteria criteria)
    {
        var cacheKey = GenerateSearchCacheKey(criteria);
        
        var cachedResults = await GetFromCacheAsync<IEnumerable<Property>>(cacheKey);
        if (cachedResults != null)
        {
            return cachedResults;
        }

        // Build performance-optimized dynamic query
        var query = _context.Properties.AsNoTracking();

        if (criteria.CountyId.HasValue)
        {
            query = query.Where(p => p.CountyId == criteria.CountyId.Value);
        }

        if (!string.IsNullOrEmpty(criteria.Address))
        {
            // Use full-text search for address matching
            query = query.Where(p => EF.Functions.ILike(p.Address, $"%{criteria.Address}%"));
        }

        if (!string.IsNullOrEmpty(criteria.ParcelId))
        {
            query = query.Where(p => p.ParcelId.Contains(criteria.ParcelId));
        }

        if (!string.IsNullOrEmpty(criteria.PropertyType))
        {
            query = query.Where(p => p.PropertyType == criteria.PropertyType);
        }

        if (criteria.MinAssessedValue.HasValue)
        {
            query = query.Where(p => p.AssessedValue >= criteria.MinAssessedValue.Value);
        }

        if (criteria.MaxAssessedValue.HasValue)
        {
            query = query.Where(p => p.AssessedValue <= criteria.MaxAssessedValue.Value);
        }

        if (criteria.YearBuiltFrom.HasValue)
        {
            query = query.Where(p => p.YearBuilt >= criteria.YearBuiltFrom.Value);
        }

        if (criteria.YearBuiltTo.HasValue)
        {
            query = query.Where(p => p.YearBuilt <= criteria.YearBuiltTo.Value);
        }

        // Apply ordering with performance optimization
        query = criteria.SortBy?.ToLower() switch
        {
            "assessedvalue" => criteria.SortDescending 
                ? query.OrderByDescending(p => p.AssessedValue)
                : query.OrderBy(p => p.AssessedValue),
            "yearbuilt" => criteria.SortDescending
                ? query.OrderByDescending(p => p.YearBuilt)
                : query.OrderBy(p => p.YearBuilt),
            "address" => criteria.SortDescending
                ? query.OrderByDescending(p => p.Address)
                : query.OrderBy(p => p.Address),
            _ => query.OrderBy(p => p.ParcelId)
        };

        // Apply pagination with performance optimization
        var results = await query
            .Skip((criteria.Page - 1) * criteria.PageSize)
            .Take(criteria.PageSize)
            .ToListAsync();

        await SetCacheAsync(cacheKey, results, TimeSpan.FromMinutes(5));

        _logger.LogInformation("Search returned {Count} properties with criteria: {Criteria}", 
            results.Count, JsonSerializer.Serialize(criteria));

        return results;
    }

    public async System.Threading.Tasks.Task<Property> CreateAsync(Property property)
    {
        property.Id = Guid.NewGuid();
        property.CreatedAt = DateTime.UtcNow;
        property.UpdatedAt = DateTime.UtcNow;

        _context.Properties.Add(property);
        await _context.SaveChangesAsync();

        // Invalidate relevant caches
        await InvalidateCountyCacheAsync(property.CountyId);

        _logger.LogInformation("Created property {PropertyId} with parcel ID {ParcelId}", 
            property.Id, property.ParcelId);

        return property;
    }

    public async System.Threading.Tasks.Task<Property> UpdateAsync(Property property)
    {
        property.UpdatedAt = DateTime.UtcNow;

        _context.Properties.Update(property);
        await _context.SaveChangesAsync();

        // Invalidate caches
        await InvalidatePropertyCacheAsync(property.Id);
        await InvalidateCountyCacheAsync(property.CountyId);

        _logger.LogInformation("Updated property {PropertyId}", property.Id);

        return property;
    }

    public async System.Threading.Tasks.Task<bool> DeleteAsync(Guid id)
    {
        var property = await _context.Properties.FindAsync(id);
        if (property == null)
        {
            return false;
        }

        _context.Properties.Remove(property);
        await _context.SaveChangesAsync();

        // Invalidate caches
        await InvalidatePropertyCacheAsync(id);
        await InvalidateCountyCacheAsync(property.CountyId);

        _logger.LogInformation("Deleted property {PropertyId}", id);

        return true;
    }

    public async System.Threading.Tasks.Task<PropertyStatistics> GetStatisticsAsync(Guid countyId)
    {
        var cacheKey = $"statistics:county:{countyId}";
        
        var cachedStats = await GetFromCacheAsync<PropertyStatistics>(cacheKey);
        if (cachedStats != null)
        {
            return cachedStats;
        }

        // Performance-optimized aggregation query
        var stats = await _context.Properties
            .Where(p => p.CountyId == countyId)
            .GroupBy(p => p.CountyId)
            .Select(g => new PropertyStatistics
            {
                CountyId = countyId,
                TotalProperties = g.Count(),
                TotalAssessedValue = g.Sum(p => p.AssessedValue),
                AverageAssessedValue = g.Average(p => p.AssessedValue),
                MinAssessedValue = g.Min(p => p.AssessedValue),
                MaxAssessedValue = g.Max(p => p.AssessedValue),
                ResidentialCount = g.Count(p => p.PropertyType == "Residential"),
                CommercialCount = g.Count(p => p.PropertyType == "Commercial"),
                AgriculturalCount = g.Count(p => p.PropertyType == "Agricultural"),
                LastUpdated = DateTime.UtcNow
            })
            .FirstOrDefaultAsync();

        if (stats == null)
        {
            stats = new PropertyStatistics
            {
                CountyId = countyId,
                LastUpdated = DateTime.UtcNow
            };
        }

        await SetCacheAsync(cacheKey, stats, TimeSpan.FromHours(1));

        return stats;
    }

    public async System.Threading.Tasks.Task<IEnumerable<Property>> GetPropertiesForAssessmentAsync(Guid countyId, int year)
    {
        var cacheKey = $"assessment:properties:{countyId}:{year}";
        
        var cachedProperties = await GetFromCacheAsync<IEnumerable<Property>>(cacheKey);
        if (cachedProperties != null)
        {
            return cachedProperties;
        }

        // Optimized query for assessment processing
        var properties = await _context.Properties
            .AsNoTracking()
            .Where(p => p.CountyId == countyId)
            .Where(p => !_context.PropertyAssessments.Any(a => 
                a.PropertyId == p.Id && 
                a.AssessmentYear == year && 
                a.IsActive))
            .OrderBy(p => p.ParcelId)
            .ToListAsync();

        await SetCacheAsync(cacheKey, properties, TimeSpan.FromHours(6));

        _logger.LogInformation("Retrieved {Count} properties for assessment in county {CountyId}, year {Year}", 
            properties.Count, countyId, year);

        return properties;
    }

    // Performance-enhanced caching methods
    private async System.Threading.Tasks.Task<T?> GetFromCacheAsync<T>(string key) where T : class
    {
        try
        {
            var cachedValue = await _cache.GetStringAsync(key);
            if (cachedValue != null)
            {
                return JsonSerializer.Deserialize<T>(cachedValue);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to retrieve from cache: {Key}", key);
        }

        return null;
    }

    private async System.Threading.Tasks.Task SetCacheAsync<T>(string key, T value, TimeSpan expiration)
    {
        try
        {
            var serializedValue = JsonSerializer.Serialize(value);
            var options = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = expiration
            };
            await _cache.SetStringAsync(key, serializedValue, options);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to set cache: {Key}", key);
        }
    }

    private async System.Threading.Tasks.Task InvalidatePropertyCacheAsync(Guid propertyId)
    {
        var keys = new[]
        {
            $"property:{propertyId}",
        };

        foreach (var key in keys)
        {
            await _cache.RemoveAsync(key);
        }
    }

    private async System.Threading.Tasks.Task InvalidateCountyCacheAsync(Guid countyId)
    {
        // In a production system, you might use cache tagging or a more sophisticated invalidation strategy
        var pattern = $"*county:{countyId}*";
        // This is a simplified approach - in production, consider using Redis with pattern-based invalidation
        await _cache.RemoveAsync($"statistics:county:{countyId}");
    }

    private string GenerateSearchCacheKey(PropertySearchCriteria criteria)
    {
        var keyParts = new List<string>
        {
            "search",
            $"county:{criteria.CountyId}",
            $"address:{criteria.Address}",
            $"parcel:{criteria.ParcelId}",
            $"type:{criteria.PropertyType}",
            $"minval:{criteria.MinAssessedValue}",
            $"maxval:{criteria.MaxAssessedValue}",
            $"yearfrom:{criteria.YearBuiltFrom}",
            $"yearto:{criteria.YearBuiltTo}",
            $"sort:{criteria.SortBy}:{criteria.SortDescending}",
            $"page:{criteria.Page}:{criteria.PageSize}"
        };

        return string.Join(":", keyParts.Where(p => !p.EndsWith(":")));
    }
}

// Data Transfer Objects
public class PropertySearchCriteria
{
    public Guid? CountyId { get; set; }
    public string? Address { get; set; }
    public string? ParcelId { get; set; }
    public string? PropertyType { get; set; }
    public decimal? MinAssessedValue { get; set; }
    public decimal? MaxAssessedValue { get; set; }
    public int? YearBuiltFrom { get; set; }
    public int? YearBuiltTo { get; set; }
    public string? SortBy { get; set; } = "ParcelId";
    public bool SortDescending { get; set; } = false;
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 100;
}

public class PropertyStatistics
{
    public Guid CountyId { get; set; }
    public int TotalProperties { get; set; }
    public decimal TotalAssessedValue { get; set; }
    public decimal AverageAssessedValue { get; set; }
    public decimal MinAssessedValue { get; set; }
    public decimal MaxAssessedValue { get; set; }
    public int ResidentialCount { get; set; }
    public int CommercialCount { get; set; }
    public int AgriculturalCount { get; set; }
    public DateTime LastUpdated { get; set; }
}