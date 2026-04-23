namespace TerraFusion.API.Services.Valuation.KernelContracts;

public record CostKernelPayload(CostSubject Subject, CostTables Tables);

public record CostSubject(string ParcelId, CostAttributes Attributes);

public record CostAttributes(double Sqft, string? Quality, string? Condition);

public record CostTables(double BaseRate, IReadOnlyDictionary<string, double> Modifiers);
