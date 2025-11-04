using TerraFusion.Consciousness.DTOs;

namespace TerraFusion.Consciousness.Interfaces
{
    /// <summary>
    /// Multi-County Data Service interface for federated government operations
    /// Manages data integration across multiple Washington State counties
    /// Government. Transcended.
    /// </summary>
    public interface IMultiCountyDataService
    {
        /// <summary>
        /// Initialize multi-county data federation system
        /// </summary>
        Task<MultiCountyInitializationResult> InitializeAsync();

        /// <summary>
        /// Add a new county data source to the federation
        /// </summary>
        Task<CountyDataSourceResultDto> AddCountyDataSourceAsync(CountyDataSourceRequestDto request);

        /// <summary>
        /// Get list of available counties in the federation
        /// </summary>
        Task<AvailableCountiesDto> GetAvailableCountiesAsync();

        /// <summary>
        /// Get aggregated data across multiple counties
        /// </summary>
        Task<AggregatedCountyDataDto> GetAggregatedCountyDataAsync(AggregatedDataRequestDto request);

        /// <summary>
        /// Synchronize data across all county systems
        /// </summary>
        Task<CountySyncSummaryDto> SyncAllCountyDataAsync();

        /// <summary>
        /// Execute federated operations across county mesh
        /// </summary>
        Task<FederatedOperationResultDto> ExecuteFederatedOperationAsync(FederatedOperationRequestDto request);

        /// <summary>
        /// Get mesh health index across all counties
        /// </summary>
        Task<MeshHealthIndexDto> GetMeshHealthIndexAsync();

        /// <summary>
        /// Validate federated compliance across all counties
        /// </summary>
        Task<FederatedComplianceResultDto> ValidateFederatedComplianceAsync();
    }
}