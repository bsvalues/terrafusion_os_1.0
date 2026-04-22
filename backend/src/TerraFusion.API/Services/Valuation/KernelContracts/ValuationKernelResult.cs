namespace TerraFusion.API.Services.Valuation.KernelContracts;

public record ValuationKernelResult(double TotalValue, ValuationComponents Components);

public record ValuationComponents(double Land, double Building);
