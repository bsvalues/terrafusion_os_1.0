using TerraFusion.Core.DTOs;

namespace TerraFusion.Core.Services;

public interface IPropertyService
{
    Task<PagedResult<PropertyDto>> GetPropertiesAsync(int page, int pageSize, string? search = null, Guid? countyId = null);
    Task<PropertyDto?> GetPropertyByIdAsync(Guid id);
    Task<PropertyDto?> GetPropertyByIdAsync(Guid id, Guid countyId);
    Task<PropertyDto?> GetPropertyByParcelAsync(string parcelNumber);
    Task<PropertyDto?> GetPropertyByParcelAsync(string parcelNumber, Guid countyId);
    Task<IEnumerable<ValuationDto>> GetPropertyValuationsAsync(Guid propertyId);
    Task<IEnumerable<ValuationDto>> GetPropertyValuationsAsync(Guid propertyId, Guid countyId);
    Task<ValuationDto> CreateValuationAsync(CreateValuationDto createDto);
    Task<PropertyStatsDto> GetPropertyStatsAsync();
    Task<PropertyStatsDto> GetPropertyStatsAsync(Guid countyId);
    Task<IEnumerable<PropertyDto>> ImportPropertiesAsync(IEnumerable<ImportPropertyDto> properties);
}
