using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PACSIntegration.Services.CostApproach;

namespace PACSIntegration.Controllers.CostApproach
{
    [Authorize]
    [ApiController]
    [Route("api/cost-approach")]
    public class CostApproachController : ControllerBase
    {
        private readonly ICostApproachService _costApproachService;
        private readonly ILogger<CostApproachController> _logger;

        public CostApproachController(
            ICostApproachService costApproachService,
            ILogger<CostApproachController> logger)
        {
            _costApproachService = costApproachService;
            _logger = logger;
        }

        [HttpPost("calculate")]
        public async Task<ActionResult<ValuationResult>> CalculateValue(
            [FromBody] ValuationRequest request)
        {
            try
            {
                // Get tenant ID from claims
                var tenantId = User.GetTenantId();
                request.TenantID = tenantId;

                var result = await _costApproachService.CalculateValueAsync(request);
                return Ok(result);
            }
            catch (NotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calculating value for property {PropertyId}", 
                    request.PropertyID);
                return StatusCode(500, "An error occurred while calculating the value");
            }
        }

        [HttpGet("history/{propertyId}")]
        public async Task<ActionResult<List<ValuationHistory>>> GetValuationHistory(
            int propertyId,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            try
            {
                var tenantId = User.GetTenantId();
                var history = await _costApproachService.GetValuationHistoryAsync(
                    propertyId,
                    tenantId,
                    startDate,
                    endDate);

                return Ok(history);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving valuation history for property {PropertyId}", 
                    propertyId);
                return StatusCode(500, "An error occurred while retrieving the valuation history");
            }
        }

        [HttpGet("factors")]
        public async Task<ActionResult<IEnumerable<CostFactor>>> GetCostFactors()
        {
            try
            {
                var tenantId = User.GetTenantId();
                var factors = await _costApproachService.GetCostFactorsAsync(tenantId);
                return Ok(factors);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving cost factors");
                return StatusCode(500, "An error occurred while retrieving cost factors");
            }
        }

        [HttpGet("depreciation-rates")]
        public async Task<ActionResult<IEnumerable<DepreciationRate>>> GetDepreciationRates()
        {
            try
            {
                var tenantId = User.GetTenantId();
                var rates = await _costApproachService.GetDepreciationRatesAsync(tenantId);
                return Ok(rates);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving depreciation rates");
                return StatusCode(500, "An error occurred while retrieving depreciation rates");
            }
        }

        [HttpGet("land-values")]
        public async Task<ActionResult<IEnumerable<LandValue>>> GetLandValues()
        {
            try
            {
                var tenantId = User.GetTenantId();
                var values = await _costApproachService.GetLandValuesAsync(tenantId);
                return Ok(values);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving land values");
                return StatusCode(500, "An error occurred while retrieving land values");
            }
        }
    }
}
