using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.PACS;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Services;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using DataDbContext = TerraFusion.Data.TerraFusionDbContext;

// Disambiguate TerraFusion.Core.Entities.Task from System.Threading.Tasks.Task
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.API.Controllers
{
  [ApiController]
  [Route("api/[controller]")]
  [Authorize]
  public class HarrisPACSIntegrationController : ControllerBase
  {
    private readonly IPacsAdapter _pacsAdapter;
    private readonly ILogger<HarrisPACSIntegrationController> _logger;
    private readonly DataDbContext _db;
    private readonly bool _isDevelopment;

    public HarrisPACSIntegrationController(
        IPacsAdapter pacsAdapter,
        ILogger<HarrisPACSIntegrationController> logger,
        DataDbContext db,
        IHostEnvironment hostEnvironment)
    {
      _pacsAdapter = pacsAdapter;
      _logger = logger;
      _db = db;
      _isDevelopment = hostEnvironment.IsDevelopment();
    }

    private async Task<County?> ResolveCountyAsync()
    {
      var countyIdClaim = User.FindFirst("countyId")?.Value?.Trim();
      if (!string.IsNullOrWhiteSpace(countyIdClaim) && Guid.TryParse(countyIdClaim, out var directCountyId))
      {
        return await _db.Counties
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == directCountyId);
      }

      var countyCodeClaim = User.FindFirst("countyCode")?.Value?.Trim();
      if (!string.IsNullOrWhiteSpace(countyCodeClaim))
      {
        return await _db.Counties
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Name == countyCodeClaim || c.FipsCode == countyCodeClaim);
      }

      if (_isDevelopment)
      {
        _logger.LogDebug("No county claims found for PACS request; falling back to Benton County in Development");
        return await _db.Counties
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Name == "Benton" && c.State == "WA");
      }

      return null;
    }

    private async Task<ActionResult?> ValidateJurisdictionAsync(string jurisdiction)
    {
      var county = await ResolveCountyAsync();
      if (county is null)
      {
        return Forbid();
      }

      var jurisdictionMatches =
          county.Name.Equals(jurisdiction, StringComparison.OrdinalIgnoreCase) ||
          (county.FipsCode != null && county.FipsCode.Equals(jurisdiction, StringComparison.OrdinalIgnoreCase)) ||
          county.Id.ToString().Equals(jurisdiction, StringComparison.OrdinalIgnoreCase);

      if (!jurisdictionMatches)
      {
        _logger.LogWarning(
            "PACS jurisdiction mismatch: user county {CountyName} (FIPS {FipsCode}) does not match requested jurisdiction {Jurisdiction}",
            county.Name, county.FipsCode, jurisdiction);

        return Forbid();
      }

      return null;
    }

    /// <summary>
    /// Get available Harris PACS jurisdictions
    /// </summary>
    [HttpGet("jurisdictions")]
    [Authorize(Roles = "Admin,DataManager,PropertyAssessor")]
    public Task<ActionResult<List<PACSJurisdiction>>> GetJurisdictions()
    {
      try
      {
        return Task.FromResult<ActionResult<List<PACSJurisdiction>>>(StatusCode(501, new
        {
          error = "PACS jurisdictions not available",
          details = "pacscontract.v1 does not expose jurisdictions. Use PACS adapter endpoints."
        }));
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error retrieving Harris PACS jurisdictions");
        return Task.FromResult<ActionResult<List<PACSJurisdiction>>>(StatusCode(500, new { error = "Failed to retrieve jurisdictions", details = ex.Message }));
      }
    }

    /// <summary>
    /// Get properties for a specific jurisdiction
    /// </summary>
    [HttpGet("jurisdictions/{jurisdiction}/properties")]
    [Authorize(Roles = "Admin,DataManager,PropertyAssessor")]
    public async Task<ActionResult<List<PACSProperty>>> GetProperties(
        string jurisdiction,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 100)
    {
      try
      {
        var guardResult = await ValidateJurisdictionAsync(jurisdiction);
        if (guardResult is not null) return guardResult;

        if (pageSize > 1000)
        {
          return BadRequest(new { error = "Page size cannot exceed 1000" });
        }

        var result = await _pacsAdapter.GetPropertiesAsync(page, pageSize);
        var properties = result.Items.Select(MapProperty).ToList();
        return Ok(properties);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error retrieving properties for jurisdiction {Jurisdiction}", jurisdiction);
        return StatusCode(500, new { error = "Failed to retrieve properties", details = ex.Message });
      }
    }

    /// <summary>
    /// Get specific property by parcel ID
    /// </summary>
    [HttpGet("jurisdictions/{jurisdiction}/properties/{parcelId}")]
    [Authorize(Roles = "Admin,DataManager,PropertyAssessor")]
    public async Task<ActionResult<PACSProperty>> GetProperty(string jurisdiction, string parcelId)
    {
      try
      {
        var guardResult = await ValidateJurisdictionAsync(jurisdiction);
        if (guardResult is not null) return guardResult;

        var propertyCore = await GetPropertyCoreAsync(parcelId);

        if (propertyCore == null)
        {
          return NotFound(new { error = $"Property with parcel ID {parcelId} not found in jurisdiction {jurisdiction}" });
        }

        return Ok(MapProperty(propertyCore));
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error retrieving property {ParcelId} in jurisdiction {Jurisdiction}", parcelId, jurisdiction);
        return StatusCode(500, new { error = "Failed to retrieve property", details = ex.Message });
      }
    }

    /// <summary>
    /// Get assessments for a specific property
    /// </summary>
    [HttpGet("jurisdictions/{jurisdiction}/properties/{parcelId}/assessments")]
    [Authorize(Roles = "Admin,DataManager,PropertyAssessor")]
    public async Task<ActionResult<List<PACSAssessment>>> GetAssessments(string jurisdiction, string parcelId)
    {
      try
      {
        var guardResult = await ValidateJurisdictionAsync(jurisdiction);
        if (guardResult is not null) return guardResult;

        var propId = await GetPropIdAsync(parcelId);
        if (propId == null)
        {
          return NotFound(new { error = $"Property with parcel ID {parcelId} not found in jurisdiction {jurisdiction}" });
        }

        var history = await _pacsAdapter.GetAssessmentHistoryAsync(propId.Value);
        var assessments = history.Select(h => MapAssessment(h, parcelId)).ToList();
        return Ok(assessments);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error retrieving assessments for parcel {ParcelId} in jurisdiction {Jurisdiction}", parcelId, jurisdiction);
        return StatusCode(500, new { error = "Failed to retrieve assessments", details = ex.Message });
      }
    }

    /// <summary>
    /// Get owner information for a specific property
    /// </summary>
    [HttpGet("jurisdictions/{jurisdiction}/properties/{parcelId}/owner")]
    [Authorize(Roles = "Admin,DataManager,PropertyAssessor")]
    public async Task<ActionResult<PACSOwner>> GetOwner(string jurisdiction, string parcelId)
    {
      try
      {
        var guardResult = await ValidateJurisdictionAsync(jurisdiction);
        if (guardResult is not null) return guardResult;
        var propId = await GetPropIdAsync(parcelId);
        if (propId == null)
        {
          return NotFound(new { error = $"Property with parcel ID {parcelId} not found in jurisdiction {jurisdiction}" });
        }

        var ownership = await _pacsAdapter.GetOwnershipAsync(propId.Value);
        var owner = ownership != null ? MapOwner(ownership, parcelId) : null;

        if (owner == null)
        {
          return NotFound(new { error = $"Owner information not found for parcel {parcelId} in jurisdiction {jurisdiction}" });
        }

        return Ok(owner);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error retrieving owner for parcel {ParcelId} in jurisdiction {Jurisdiction}", parcelId, jurisdiction);
        return StatusCode(500, new { error = "Failed to retrieve owner information", details = ex.Message });
      }
    }

    /// <summary>
    /// Get tax records for a specific property
    /// </summary>
    [HttpGet("jurisdictions/{jurisdiction}/properties/{parcelId}/taxes")]
    [Authorize(Roles = "Admin,DataManager,PropertyAssessor")]
    public Task<ActionResult<List<PACSTaxRecord>>> GetTaxRecords(string jurisdiction, string parcelId)
    {
      try
      {
        return Task.FromResult<ActionResult<List<PACSTaxRecord>>>(StatusCode(501, new
        {
          error = "Tax records not available",
          details = "pacscontract.v1 is read-only and does not expose tax record data."
        }));
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error retrieving tax records for parcel {ParcelId} in jurisdiction {Jurisdiction}", parcelId, jurisdiction);
        return Task.FromResult<ActionResult<List<PACSTaxRecord>>>(StatusCode(500, new { error = "Failed to retrieve tax records", details = ex.Message }));
      }
    }

    /// <summary>
    /// Get permits for a specific property
    /// </summary>
    [HttpGet("jurisdictions/{jurisdiction}/properties/{parcelId}/permits")]
    [Authorize(Roles = "Admin,DataManager,PropertyAssessor")]
    public Task<ActionResult<List<PACSPermit>>> GetPermits(string jurisdiction, string parcelId)
    {
      try
      {
        return Task.FromResult<ActionResult<List<PACSPermit>>>(StatusCode(501, new
        {
          error = "Permits not available",
          details = "pacscontract.v1 does not expose permit data."
        }));
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error retrieving permits for parcel {ParcelId} in jurisdiction {Jurisdiction}", parcelId, jurisdiction);
        return Task.FromResult<ActionResult<List<PACSPermit>>>(StatusCode(500, new { error = "Failed to retrieve permits", details = ex.Message }));
      }
    }

    /// <summary>
    /// Get recent property transactions
    /// </summary>
    [HttpGet("jurisdictions/{jurisdiction}/transactions")]
    [Authorize(Roles = "Admin,DataManager,PropertyAssessor")]
    public Task<ActionResult<List<PACSTransaction>>> GetTransactions(
        string jurisdiction,
        [FromQuery] DateTime? since = null)
    {
      try
      {
        return Task.FromResult<ActionResult<List<PACSTransaction>>>(StatusCode(501, new
        {
          error = "Transactions not available",
          details = "pacscontract.v1 does not expose transaction data."
        }));
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error retrieving transactions for jurisdiction {Jurisdiction}", jurisdiction);
        return Task.FromResult<ActionResult<List<PACSTransaction>>>(StatusCode(500, new { error = "Failed to retrieve transactions", details = ex.Message }));
      }
    }

    /// <summary>
    /// Initiate data synchronization for a jurisdiction
    /// </summary>
    [HttpPost("jurisdictions/{jurisdiction}/sync")]
    [Authorize(Roles = "Admin,DataManager")]
    public Task<ActionResult> SyncData(string jurisdiction)
    {
      try
      {
        return Task.FromResult<ActionResult>(StatusCode(501, new
        {
          error = "Sync not supported",
          details = "pacscontract.v1 enforces read-only access. Sync is disabled."
        }));
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error initiating sync for jurisdiction {Jurisdiction}", jurisdiction);
        return Task.FromResult<ActionResult>(StatusCode(500, new { error = "Failed to initiate data synchronization", details = ex.Message }));
      }
    }

    /// <summary>
    /// Get synchronization status for a jurisdiction
    /// </summary>
    [HttpGet("jurisdictions/{jurisdiction}/sync/status")]
    [Authorize(Roles = "Admin,DataManager,PropertyAssessor")]
    public Task<ActionResult<PACSSyncStatus>> GetSyncStatus(string jurisdiction)
    {
      try
      {
        return Task.FromResult<ActionResult<PACSSyncStatus>>(StatusCode(501, new
        {
          error = "Sync status not available",
          details = "pacscontract.v1 enforces read-only access. Sync status is unavailable."
        }));
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error retrieving sync status for jurisdiction {Jurisdiction}", jurisdiction);
        return Task.FromResult<ActionResult<PACSSyncStatus>>(StatusCode(500, new { error = "Failed to retrieve sync status", details = ex.Message }));
      }
    }

    /// <summary>
    /// Get Harris PACS system status
    /// </summary>
    [HttpGet("system/status")]
    [Authorize(Roles = "Admin,DataManager")]
    public async Task<ActionResult<PACSSystemStatus>> GetSystemStatus()
    {
      try
      {
        var connection = await _pacsAdapter.GetConnectionStatusAsync();
        var systemStatus = new PACSSystemStatus
        {
          IsOnline = connection.IsConnected,
          PACSVersion = null,
          LastHealthCheck = DateTime.UtcNow,
          ActiveConnections = connection.IsConnected ? 1 : 0,
          ResponseTime = connection.LatencyMs ?? 0,
          ServiceStatus = new Dictionary<string, bool>
          {
            ["PACS_DB"] = connection.IsConnected
          }
        };
        return Ok(systemStatus);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error retrieving Harris PACS system status");
        return StatusCode(500, new { error = "Failed to retrieve system status", details = ex.Message });
      }
    }

    /// <summary>
    /// Health check endpoint for Harris PACS integration
    /// </summary>
    [HttpGet("health")]
    [AllowAnonymous]
    public async Task<ActionResult> HealthCheck()
    {
      try
      {
        var connection = await _pacsAdapter.GetConnectionStatusAsync();

        if (connection.IsConnected)
        {
          return Ok(new
          {
            status = "healthy",
            timestamp = DateTime.UtcNow,
            pacsVersion = "unknown",
            responseTime = connection.LatencyMs ?? 0
          });
        }
        else
        {
          return StatusCode(503, new
          {
            status = "unhealthy",
            timestamp = DateTime.UtcNow,
            message = "Harris PACS system is offline"
          });
        }
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Harris PACS health check failed");
        return StatusCode(503, new
        {
          status = "unhealthy",
          timestamp = DateTime.UtcNow,
          error = ex.Message
        });
      }
    }

    private async Task<PacsPropertyCore?> GetPropertyCoreAsync(string parcelId)
    {
      if (int.TryParse(parcelId, out var propId))
      {
        return await _pacsAdapter.GetPropertyByIdAsync(propId);
      }

      return await _pacsAdapter.GetPropertyByGeoIdAsync(parcelId);
    }

    private async Task<int?> GetPropIdAsync(string parcelId)
    {
      if (int.TryParse(parcelId, out var propId))
      {
        return propId;
      }

      var property = await _pacsAdapter.GetPropertyByGeoIdAsync(parcelId);
      return property?.PropId;
    }

    private static PACSProperty MapProperty(PacsPropertyCore property)
    {
      decimal? totalValue = property.MarketVal ?? property.AssessedVal;
      if (!totalValue.HasValue && (property.LandVal.HasValue || property.ImprvVal.HasValue))
      {
        totalValue = (property.LandVal ?? 0m) + (property.ImprvVal ?? 0m);
      }

      return new PACSProperty
      {
        ParcelId = string.IsNullOrWhiteSpace(property.GeoId) ? property.PropId.ToString() : property.GeoId,
        Address = property.SitusAddr,
        City = property.SitusCity,
        State = null,
        ZipCode = property.SitusZip,
        LandValue = property.LandVal.HasValue ? (double)property.LandVal.Value : null,
        ImprovementValue = property.ImprvVal.HasValue ? (double)property.ImprvVal.Value : null,
        TotalValue = totalValue.HasValue ? (double)totalValue.Value : null,
        PropertyType = property.PropTypeCd,
        Acreage = null,
        YearBuilt = null,
        LegalDescription = property.LegalDesc,
        LastUpdated = property.LastModified ?? DateTime.MinValue
      };
    }

    private static PACSOwner MapOwner(PacsPropertyOwnership ownership, string parcelId)
    {
      var addressParts = new[] { ownership.MailAddr1, ownership.MailAddr2 }
          .Where(part => !string.IsNullOrWhiteSpace(part))
          .ToArray();
      var mailingAddress = addressParts.Length == 0 ? null : string.Join(" ", addressParts);

      return new PACSOwner
      {
        Id = ownership.PropId.ToString(),
        ParcelId = parcelId,
        Name = ownership.OwnerName,
        MailingAddress = mailingAddress,
        City = ownership.MailCity,
        State = ownership.MailState,
        ZipCode = ownership.MailZip,
        OwnershipPercentage = (double)(ownership.PctOwnership ?? 0m)
      };
    }

    private static PACSAssessment MapAssessment(PacsAssessmentHistory history, string parcelId)
    {
      decimal? totalValue = history.MarketVal ?? history.AssessedVal;
      if (!totalValue.HasValue && (history.LandVal.HasValue || history.ImprvVal.HasValue))
      {
        totalValue = (history.LandVal ?? 0m) + (history.ImprvVal ?? 0m);
      }
      var taxableValue = history.AssessedVal ?? history.MarketVal;

      return new PACSAssessment
      {
        Id = $"{history.PropId}-{history.PropValYr}",
        ParcelId = parcelId,
        AssessmentYear = history.PropValYr,
        LandValue = (double)(history.LandVal ?? 0m),
        ImprovementValue = (double)(history.ImprvVal ?? 0m),
        TotalValue = totalValue.HasValue ? (double)totalValue.Value : 0,
        TaxableValue = taxableValue.HasValue ? (double)taxableValue.Value : 0,
        AssessmentDate = history.AppraisalDt ?? DateTime.UtcNow,
        ExemptionAmount = null
      };
    }
  }
}
