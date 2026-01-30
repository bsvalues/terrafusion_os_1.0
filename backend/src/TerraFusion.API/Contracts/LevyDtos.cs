namespace TerraFusion.API.Contracts;

public record AnalyzeScenariosRequest(Guid MeasureId, List<decimal> Rates);
public record GenerateProjectionsRequest(Guid ScenarioId, int Years);
public record CalculateRequest(Guid MeasureId);

public record CompareScenariosRequest(List<Guid> ScenarioIds, int ProjectionYears);
