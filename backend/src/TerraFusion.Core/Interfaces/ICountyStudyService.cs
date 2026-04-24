// backend/src/TerraFusion.Core/Interfaces/ICountyStudyService.cs
using TerraFusion.Core.DTOs;

namespace TerraFusion.Core.Interfaces;

public interface ICountyStudyService
{
    // Study
    Task<CountyStudySessionDto> CreateStudyAsync(CreateStudyRequest req, string userId);
    Task<CountyStudySessionDto?> GetStudyAsync(Guid studyId);
    Task<List<CountyStudySessionDto>> GetStudiesAsync(Guid countyId);
    Task<CountyStudySessionDto?> UpdateStudyStatusAsync(Guid studyId, string status, string userId);

    // Segment Sets
    Task<CountySegmentSetDto> CreateSegmentSetAsync(Guid studyId, string name, string sourceType, bool isBaseline, string userId);
    Task<List<CountySegmentSetDto>> GetSegmentSetsAsync(Guid studyId);
    Task<List<CountySegmentDto>> GetSegmentsAsync(Guid segmentSetId);

    // Cohorts
    Task<CountyCohortDto> CreateCohortAsync(CreateCohortRequest req, string userId);
    Task<List<CountyCohortDto>> GetCohortsAsync(Guid studyId);
    Task<CountyCohortDto?> GetCohortAsync(Guid cohortId);

    // Scenarios
    Task<CountyScenarioDto> CreateScenarioAsync(CreateScenarioRequest req, string userId);
    Task<List<CountyScenarioDto>> GetScenariosAsync(Guid studyId);
    Task<CountyScenarioDto?> GetScenarioAsync(Guid scenarioId);
    Task<CountyScenarioDto?> SaveScenarioAsync(Guid scenarioId, string userId);
    Task<ScenarioImpactPreviewDto> PreviewScenarioImpactAsync(Guid scenarioId);

    // Adjustment Sets
    Task<CountyAdjustmentSetDto> PromoteScenarioAsync(PromoteScenarioRequest req, string userId);
    Task<List<CountyAdjustmentSetDto>> GetAdjustmentSetsAsync(Guid studyId);

    // Exception Sets
    Task<CountyExceptionSetDto> CreateExceptionSetAsync(CreateCountyExceptionSetRequest req, string userId);
    Task<List<CountyExceptionSetDto>> GetExceptionSetsAsync(Guid studyId);

    // Rollups (Task B — County → City → Neighborhood drill lattice)
    Task<List<CityRollupRowDto>> GetCityRollupAsync(Guid studyId);
    Task<List<NeighborhoodRollupRowDto>> GetNeighborhoodRollupAsync(Guid studyId, string? cityFilter);
}
