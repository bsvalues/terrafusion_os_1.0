using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.CurrentUse.Data;
using TerraFusion.CurrentUse.DTOs;

namespace TerraFusion.CurrentUse.Services;

/// <summary>
/// Evaluates penalty exceptions per RCW 84.33.140(6) and RCW 84.34.108(6).
/// The 20% penalty is waived when specific conditions are met.
/// </summary>
public class PenaltyExceptionService : IPenaltyExceptionService
{
    private readonly CurrentUseDbContext _db;
    private readonly ILogger<PenaltyExceptionService> _logger;

    private static readonly List<PenaltyExceptionDefinition> Definitions = new()
    {
        new("DEATH", "Owner death or incapacity", "RCW 84.33.140(6)(a) / 84.34.108(6)(a)",
            "Removal due to death of owner or permanent incapacity preventing land management."),
        new("GOVT_ACQUISITION", "Government acquisition", "RCW 84.33.140(6)(b) / 84.34.108(6)(b)",
            "Land acquired by federal, state, or local government entity."),
        new("TRADE_LAND_CONSERVATION", "Trade for conservation purposes", "RCW 84.34.108(6)(a)",
            "Land traded or transferred for conservation purposes to a qualifying organization."),
        new("FORCED_SALE", "Forced sale or condemnation", "RCW 84.34.108(6)(b)",
            "Removal due to condemnation or forced sale under eminent domain."),
        new("TRANSFER_TO_GOVT", "Transfer to government entity", "RCW 84.34.108(6)(c)",
            "Voluntary transfer to a government entity for public use."),
    };

    public PenaltyExceptionService(CurrentUseDbContext db, ILogger<PenaltyExceptionService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<List<PenaltyExceptionDto>> EvaluateAsync(string parcelId, CancellationToken ct = default)
    {
        _logger.LogInformation("Evaluating penalty exceptions for parcel {ParcelId}", parcelId);

        // Check if parcel has an active removal
        var removal = await _db.Removals
            .Where(r => r.ParcelId == parcelId)
            .OrderByDescending(r => r.InitiatedDate)
            .FirstOrDefaultAsync(ct);

        var results = new List<PenaltyExceptionDto>();

        foreach (var def in Definitions)
        {
            bool eligible = false;
            string reason;

            if (removal == null)
            {
                reason = "No active removal found for this parcel.";
            }
            else if (!string.IsNullOrWhiteSpace(removal.PenaltyExceptionCode) &&
                     removal.PenaltyExceptionCode.Equals(def.Code, StringComparison.OrdinalIgnoreCase))
            {
                eligible = true;
                reason = $"Exception already applied to removal {removal.Id}.";
            }
            else
            {
                // In production this would check evidence documents, death certificates, etc.
                reason = $"Requires supporting documentation. Removal reason: '{removal.Reason}'.";

                // Auto-detect based on removal reason keywords
                if (def.Code == "DEATH" && removal.Reason.Contains("death", StringComparison.OrdinalIgnoreCase))
                {
                    eligible = true;
                    reason = "Removal reason indicates owner death — exception likely applies.";
                }
                else if (def.Code == "GOVT_ACQUISITION" && removal.Reason.Contains("government", StringComparison.OrdinalIgnoreCase))
                {
                    eligible = true;
                    reason = "Removal reason indicates government acquisition — exception likely applies.";
                }
                else if (def.Code == "FORCED_SALE" && removal.Reason.Contains("condemnation", StringComparison.OrdinalIgnoreCase))
                {
                    eligible = true;
                    reason = "Removal reason indicates condemnation — exception likely applies.";
                }
            }

            results.Add(new PenaltyExceptionDto(def.Code, def.Description, def.RcwReference, eligible, reason));
        }

        return results;
    }

    private record PenaltyExceptionDefinition(string Code, string Description, string RcwReference, string FullDescription);
}
