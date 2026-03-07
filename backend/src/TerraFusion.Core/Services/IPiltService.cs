namespace TerraFusion.Core.Services;

/// <summary>
/// PILT — Payment In Lieu of Taxes service contract.
/// Benton County federal land PILT calculations per RCW 84.33.
/// </summary>
public interface IPiltService
{
  Task<PiltStatusDto> GetStatusAsync(Guid countyId);
  Task<List<PiltDistrictDto>> GetDistrictsAsync(Guid countyId);
  Task<List<PiltReceiptDto>> GetReceiptsAsync(Guid countyId, int? fiscalYear);
  Task<PiltReceiptDto> CreateReceiptAsync(PiltCreateReceiptRequest request, Guid countyId, string userId);
  Task<PiltCalculationResultDto> CalculateAsync(string receiptId, PiltCalculateRequest? request, Guid countyId);
  Task<PiltCalculationResultDto> ApproveAsync(string calculationId, Guid countyId, string userId);
  Task<PiltReportDto> GetReportAsync(int year, Guid countyId);
}

// ── DTOs ─────────────────────────────────────────────────────────────────

public class PiltStatusDto
{
  public string Status { get; set; } = "active";
  public int FiscalYear { get; set; }
  public decimal TotalPayments { get; set; }
  public int Districts { get; set; }
  public int FederalAcres { get; set; }
  public decimal AverageRate { get; set; }
}

public class PiltDistrictDto
{
  public string Id { get; set; } = string.Empty;
  public string Name { get; set; } = string.Empty;
  public string Type { get; set; } = string.Empty;
  public decimal LevyRate { get; set; }
  public decimal AssessedValue { get; set; }
  public decimal PiltDue { get; set; }
}

public class PiltReceiptDto
{
  public string Id { get; set; } = string.Empty;
  public int FiscalYear { get; set; }
  public string Source { get; set; } = string.Empty;
  public decimal Amount { get; set; }
  public string Status { get; set; } = "pending";
  public DateTime CreatedAt { get; set; }
}

public class PiltCreateReceiptRequest
{
  public int FiscalYear { get; set; }
  public string Source { get; set; } = string.Empty;
  public decimal Amount { get; set; }
}

public class PiltCalculateRequest
{
  public string? ReceiptId { get; set; }
  public Dictionary<string, decimal>? Weights { get; set; }
}

public class PiltDistributionDto
{
  public string DistrictId { get; set; } = string.Empty;
  public string DistrictName { get; set; } = string.Empty;
  public decimal Amount { get; set; }
  public decimal Percentage { get; set; }
}

public class PiltCalculationResultDto
{
  public string CalculationId { get; set; } = string.Empty;
  public string ReceiptId { get; set; } = string.Empty;
  public int FiscalYear { get; set; }
  public decimal TotalAmount { get; set; }
  public List<PiltDistributionDto> Distributions { get; set; } = new();
  public string Status { get; set; } = "calculated";
}

public class PiltReportDto
{
  public int Year { get; set; }
  public decimal TotalAssessedValue { get; set; }
  public decimal TotalPiltDue { get; set; }
  public List<PiltDistrictDto> Districts { get; set; } = new();
  public List<PiltLandClassificationDto> LandClassifications { get; set; } = new();
  public PiltCertificationDto Certification { get; set; } = new();
}

public class PiltLandClassificationDto
{
  public string Type { get; set; } = string.Empty;
  public string Unit { get; set; } = string.Empty;
  public double AcresOrFeet { get; set; }
  public decimal RatePerUnit { get; set; }
  public decimal TotalValue { get; set; }
}

public class PiltCertificationDto
{
  public string AssessorName { get; set; } = string.Empty;
  public string TreasurerName { get; set; } = string.Empty;
  public string Date { get; set; } = string.Empty;
  public decimal TotalAssessedValue { get; set; }
}
