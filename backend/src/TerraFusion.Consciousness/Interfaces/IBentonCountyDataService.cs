using TerraFusion.Consciousness.DTOs;

namespace TerraFusion.Consciousness.Interfaces
{
    /// <summary>
    /// Benton County Data Service interface for county-specific operations
    /// Manages data integration with Benton County government systems
    /// Government. Transcended.
    /// </summary>
    public interface IBentonCountyDataService
    {
        /// <summary>
        /// Initialize Benton County data service
        /// </summary>
        Task<BentonCountyInitializationResultDto> InitializeAsync();

        /// <summary>
        /// Get property assessment data for Benton County
        /// </summary>
        Task<PropertyAssessmentDataDto> GetPropertyAssessmentDataAsync(PropertyDataRequestDto request);

        /// <summary>
        /// Get citizen services data for Benton County
        /// </summary>
        Task<CitizenServicesDataDto> GetCitizenServicesDataAsync(CitizenServicesRequestDto request);

        /// <summary>
        /// Get emergency response data for Benton County
        /// </summary>
        Task<EmergencyResponseDataDto> GetEmergencyResponseDataAsync(EmergencyDataRequestDto request);

        /// <summary>
        /// Synchronize data with Benton County systems
        /// </summary>
        Task<BentonCountySyncResultDto> SyncWithBentonCountyAsync();
    }
}