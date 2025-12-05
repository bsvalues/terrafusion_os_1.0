using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using TerraFusion.Core.Services;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace TerraFusion.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class HarrisPACSIntegrationController : ControllerBase
    {
        private readonly IHarrisPACSIntegrationService _harrisIntegrationService;
        private readonly ILogger<HarrisPACSIntegrationController> _logger;

        public HarrisPACSIntegrationController(
            IHarrisPACSIntegrationService harrisIntegrationService,
            ILogger<HarrisPACSIntegrationController> logger)
        {
            _harrisIntegrationService = harrisIntegrationService;
            _logger = logger;
        }

        /// <summary>
        /// Get available Harris PACS jurisdictions
        /// </summary>
        [HttpGet("jurisdictions")]
        [Authorize(Roles = "Admin,DataManager,PropertyAssessor")]
        public async Task<ActionResult<List<PACSJurisdiction>>> GetJurisdictions()
        {
            try
            {
                var jurisdictions = await _harrisIntegrationService.GetAvailableJurisdictionsAsync();
                return Ok(jurisdictions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving Harris PACS jurisdictions");
                return StatusCode(500, new { error = "Failed to retrieve jurisdictions", details = ex.Message });
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
                if (pageSize > 1000)
                {
                    return BadRequest(new { error = "Page size cannot exceed 1000" });
                }

                var properties = await _harrisIntegrationService.GetPropertiesAsync(jurisdiction, page, pageSize);
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
                var property = await _harrisIntegrationService.GetPropertyByParcelAsync(jurisdiction, parcelId);
                
                if (property == null)
                {
                    return NotFound(new { error = $"Property with parcel ID {parcelId} not found in jurisdiction {jurisdiction}" });
                }

                return Ok(property);
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
                var assessments = await _harrisIntegrationService.GetAssessmentsAsync(jurisdiction, parcelId);
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
                var owner = await _harrisIntegrationService.GetPropertyOwnerAsync(jurisdiction, parcelId);
                
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
        public async Task<ActionResult<List<PACSTaxRecord>>> GetTaxRecords(string jurisdiction, string parcelId)
        {
            try
            {
                var taxRecords = await _harrisIntegrationService.GetTaxRecordsAsync(jurisdiction, parcelId);
                return Ok(taxRecords);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving tax records for parcel {ParcelId} in jurisdiction {Jurisdiction}", parcelId, jurisdiction);
                return StatusCode(500, new { error = "Failed to retrieve tax records", details = ex.Message });
            }
        }

        /// <summary>
        /// Get permits for a specific property
        /// </summary>
        [HttpGet("jurisdictions/{jurisdiction}/properties/{parcelId}/permits")]
        [Authorize(Roles = "Admin,DataManager,PropertyAssessor")]
        public async Task<ActionResult<List<PACSPermit>>> GetPermits(string jurisdiction, string parcelId)
        {
            try
            {
                var permits = await _harrisIntegrationService.GetPermitsAsync(jurisdiction, parcelId);
                return Ok(permits);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving permits for parcel {ParcelId} in jurisdiction {Jurisdiction}", parcelId, jurisdiction);
                return StatusCode(500, new { error = "Failed to retrieve permits", details = ex.Message });
            }
        }

        /// <summary>
        /// Get recent property transactions
        /// </summary>
        [HttpGet("jurisdictions/{jurisdiction}/transactions")]
        [Authorize(Roles = "Admin,DataManager,PropertyAssessor")]
        public async Task<ActionResult<List<PACSTransaction>>> GetTransactions(
            string jurisdiction,
            [FromQuery] DateTime? since = null)
        {
            try
            {
                var transactions = await _harrisIntegrationService.GetRecentTransactionsAsync(jurisdiction, since);
                return Ok(transactions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving transactions for jurisdiction {Jurisdiction}", jurisdiction);
                return StatusCode(500, new { error = "Failed to retrieve transactions", details = ex.Message });
            }
        }

        /// <summary>
        /// Initiate data synchronization for a jurisdiction
        /// </summary>
        [HttpPost("jurisdictions/{jurisdiction}/sync")]
        [Authorize(Roles = "Admin,DataManager")]
        public async Task<ActionResult> SyncData(string jurisdiction)
        {
            try
            {
                var success = await _harrisIntegrationService.SyncPropertyDataAsync(jurisdiction);
                
                if (success)
                {
                    return Ok(new { message = $"Data synchronization initiated for jurisdiction {jurisdiction}" });
                }
                else
                {
                    return StatusCode(500, new { error = "Failed to initiate data synchronization" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error initiating sync for jurisdiction {Jurisdiction}", jurisdiction);
                return StatusCode(500, new { error = "Failed to initiate data synchronization", details = ex.Message });
            }
        }

        /// <summary>
        /// Get synchronization status for a jurisdiction
        /// </summary>
        [HttpGet("jurisdictions/{jurisdiction}/sync/status")]
        [Authorize(Roles = "Admin,DataManager,PropertyAssessor")]
        public async Task<ActionResult<PACSSyncStatus>> GetSyncStatus(string jurisdiction)
        {
            try
            {
                var syncStatus = await _harrisIntegrationService.GetSyncStatusAsync(jurisdiction);
                return Ok(syncStatus);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving sync status for jurisdiction {Jurisdiction}", jurisdiction);
                return StatusCode(500, new { error = "Failed to retrieve sync status", details = ex.Message });
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
                var systemStatus = await _harrisIntegrationService.GetSystemStatusAsync();
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
                var systemStatus = await _harrisIntegrationService.GetSystemStatusAsync();
                
                if (systemStatus.IsOnline)
                {
                    return Ok(new 
                    { 
                        status = "healthy", 
                        timestamp = DateTime.UtcNow,
                        pacsVersion = systemStatus.PACSVersion ?? "unknown",
                        responseTime = systemStatus.ResponseTime
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
    }
}
