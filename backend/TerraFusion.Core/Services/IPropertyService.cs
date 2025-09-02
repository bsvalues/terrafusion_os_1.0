using TerraFusion.Core.DTOs;

namespace TerraFusion.Core.Services;

public interface IPropertyService
{
    Task<PagedResult<PropertyDto>> GetPropertiesAsync(int page, int pageSize, string? search = null, Guid? countyId = null);
    Task<PropertyDto?> GetPropertyByIdAsync(Guid id);
    Task<PropertyDto?> GetPropertyByParcelAsync(string parcelNumber);
    Task<IEnumerable<ValuationDto>> GetPropertyValuationsAsync(Guid propertyId);
    Task<ValuationDto> CreateValuationAsync(CreateValuationDto createDto);
    Task<PropertyStatsDto> GetPropertyStatsAsync();
    Task<IEnumerable<PropertyDto>> ImportPropertiesAsync(IEnumerable<ImportPropertyDto> properties);
}
