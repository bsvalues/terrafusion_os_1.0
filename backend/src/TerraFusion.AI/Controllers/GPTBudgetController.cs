// TerraFusionGPT Suite: Budget Management Controller
// Elite Government OS Engineering - Budget Administration API

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.Services;
using TerraFusion.Core.Entities;
using TerraFusion.Data;

namespace TerraFusion.AI.Controllers
{
    /// <summary>
    /// GPT budget management and cost tracking API
    /// </summary>
    [ApiController]
    [Route("api/gpt/budgets")]
    [Authorize]
    public class GPTBudgetController : ControllerBase
    {
        private readonly TerraFusionDbContext _context;
        private readonly IGPTCostTrackingService _costTrackingService;
        private readonly IGPTBudgetAlertService _alertService;
        private readonly ILogger<GPTBudgetController> _logger;

        public GPTBudgetController(
            TerraFusionDbContext context,
            IGPTCostTrackingService costTrackingService,
            IGPTBudgetAlertService alertService,
            ILogger<GPTBudgetController> logger)
        {
            _context = context;
            _costTrackingService = costTrackingService;
            _alertService = alertService;
            _logger = logger;
        }

        /// <summary>
        /// Get all budgets for county
        /// </summary>
        [HttpGet]
        [Authorize(Roles = "Admin,Finance")]
        public async Task<ActionResult<List<GPTBudget>>> GetBudgets(
            [FromQuery] int countyId,
            [FromQuery] bool activeOnly = true)
        {
            var query = _context.Set<GPTBudget>()
                .Where(b => b.CountyId == countyId);

            if (activeOnly)
            {
                var now = DateTime.UtcNow;
                query = query.Where(b =>
                    b.IsActive &&
                    b.PeriodStart <= now &&
                    b.PeriodEnd >= now);
            }

            var budgets = await query
                .Include(b => b.Alerts.Where(a => !a.Acknowledged))
                .OrderByDescending(b => b.PeriodStart)
                .ToListAsync();

            return Ok(budgets);
        }

        /// <summary>
        /// Get budget by ID
        /// </summary>
        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,Finance")]
        public async Task<ActionResult<GPTBudget>> GetBudget(int id)
        {
            var budget = await _context.Set<GPTBudget>()
                .Include(b => b.Alerts)
                .Include(b => b.CostUsages)
                .FirstOrDefaultAsync(b => b.Id == id);

            if (budget == null)
            {
                return NotFound();
            }

            return Ok(budget);
        }

        /// <summary>
        /// Create new budget
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "Admin,Finance")]
        public async Task<ActionResult<GPTBudget>> CreateBudget(
            [FromBody] CreateBudgetRequest request)
        {
            try
            {
                // Validate request
                if (request.AllocatedAmount <= 0)
                {
                    return BadRequest("Allocated amount must be greater than zero");
                }

                if (request.PeriodEnd <= request.PeriodStart)
                {
                    return BadRequest("Period end must be after period start");
                }

                // Check for overlapping budgets
                var overlapping = await _context.Set<GPTBudget>()
                    .Where(b => b.CountyId == request.CountyId)
                    .Where(b => b.Department == request.Department)
                    .Where(b => b.IsActive)
                    .Where(b =>
                        (b.PeriodStart <= request.PeriodEnd && b.PeriodEnd >= request.PeriodStart))
                    .AnyAsync();

                if (overlapping)
                {
                    return BadRequest(
                        "A budget already exists for this county/department in the specified period");
                }

                // Create budget
                var budget = new GPTBudget
                {
                    CountyId = request.CountyId,
                    Department = request.Department,
                    PeriodType = request.PeriodType,
                    PeriodStart = request.PeriodStart,
                    PeriodEnd = request.PeriodEnd,
                    AllocatedAmount = request.AllocatedAmount,
                    ConsumedAmount = 0,
                    AlertThresholdPercent = request.AlertThresholdPercent ?? 80m,
                    WarningThresholdPercent = request.WarningThresholdPercent ?? 90m,
                    EnforceHardLimit = request.EnforceHardLimit,
                    AllowOverrunWithApproval = request.AllowOverrunWithApproval,
                    Status = BudgetStatus.Active,
                    AlertRecipients = request.AlertRecipients,
                    Notes = request.Notes,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    CreatedBy = User.Identity?.Name ?? "System",
                    UpdatedBy = User.Identity?.Name ?? "System"
                };

                _context.Set<GPTBudget>().Add(budget);
                await _context.SaveChangesAsync();

                _logger.LogInformation(
                    $"Budget {budget.Id} created by {User.Identity?.Name}");

                return CreatedAtAction(
                    nameof(GetBudget),
                    new { id = budget.Id },
                    budget);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating budget");
                return StatusCode(500, "Error creating budget");
            }
        }

        /// <summary>
        /// Update budget
        /// </summary>
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Finance")]
        public async Task<ActionResult<GPTBudget>> UpdateBudget(
            int id,
            [FromBody] UpdateBudgetRequest request)
        {
            try
            {
                var budget = await _context.Set<GPTBudget>().FindAsync(id);

                if (budget == null)
                {
                    return NotFound();
                }

                // Update fields
                if (request.AllocatedAmount.HasValue)
                {
                    if (request.AllocatedAmount.Value <= 0)
                    {
                        return BadRequest("Allocated amount must be greater than zero");
                    }
                    budget.AllocatedAmount = request.AllocatedAmount.Value;
                }

                if (request.AlertThresholdPercent.HasValue)
                {
                    budget.AlertThresholdPercent = request.AlertThresholdPercent.Value;
                }

                if (request.WarningThresholdPercent.HasValue)
                {
                    budget.WarningThresholdPercent = request.WarningThresholdPercent.Value;
                }

                if (request.EnforceHardLimit.HasValue)
                {
                    budget.EnforceHardLimit = request.EnforceHardLimit.Value;
                }

                if (request.AlertRecipients != null)
                {
                    budget.AlertRecipients = request.AlertRecipients;
                }

                if (request.Notes != null)
                {
                    budget.Notes = request.Notes;
                }

                if (request.IsActive.HasValue)
                {
                    budget.IsActive = request.IsActive.Value;
                }

                budget.UpdatedAt = DateTime.UtcNow;
                budget.UpdatedBy = User.Identity?.Name ?? "System";

                await _context.SaveChangesAsync();

                _logger.LogInformation(
                    $"Budget {budget.Id} updated by {User.Identity?.Name}");

                return Ok(budget);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating budget");
                return StatusCode(500, "Error updating budget");
            }
        }

        /// <summary>
        /// Approve budget overrun
        /// </summary>
        [HttpPost("{id}/approve-overrun")]
        [Authorize(Roles = "Admin,Finance")]
        public async Task<ActionResult> ApproveOverrun(
            int id,
            [FromBody] ApproveOverrunRequest request)
        {
            try
            {
                var budget = await _context.Set<GPTBudget>().FindAsync(id);

                if (budget == null)
                {
                    return NotFound();
                }

                if (request.OverrunAmount <= 0)
                {
                    return BadRequest("Overrun amount must be greater than zero");
                }

                budget.OverrunApprovedAmount = request.OverrunAmount;
                budget.OverrunApprovedBy = User.Identity?.Name ?? "System";
                budget.OverrunApprovedDate = DateTime.UtcNow;
                budget.UpdatedAt = DateTime.UtcNow;
                budget.UpdatedBy = User.Identity?.Name ?? "System";

                // Update status if budget was exhausted
                if (budget.Status == BudgetStatus.Exhausted ||
                    budget.Status == BudgetStatus.Overrun)
                {
                    budget.Status = BudgetStatus.Active;
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation(
                    $"Overrun approved for budget {budget.Id}: ${request.OverrunAmount:F2} " +
                    $"by {User.Identity?.Name}");

                return Ok(new
                {
                    message = "Overrun approved",
                    approvedAmount = request.OverrunAmount,
                    approvedBy = budget.OverrunApprovedBy,
                    newTotalAllowed = budget.AllocatedAmount + request.OverrunAmount
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error approving overrun");
                return StatusCode(500, "Error approving overrun");
            }
        }

        /// <summary>
        /// Suspend budget
        /// </summary>
        [HttpPost("{id}/suspend")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> SuspendBudget(int id)
        {
            try
            {
                var budget = await _context.Set<GPTBudget>().FindAsync(id);

                if (budget == null)
                {
                    return NotFound();
                }

                budget.Status = BudgetStatus.Suspended;
                budget.UpdatedAt = DateTime.UtcNow;
                budget.UpdatedBy = User.Identity?.Name ?? "System";

                await _context.SaveChangesAsync();

                // Send suspension alert
                await _alertService.SendAlertAsync(
                    budget,
                    BudgetAlertType.BudgetSuspended,
                    TerraFusion.AI.Services.AlertSeverity.Critical);

                _logger.LogWarning(
                    $"Budget {budget.Id} suspended by {User.Identity?.Name}");

                return Ok(new { message = "Budget suspended" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error suspending budget");
                return StatusCode(500, "Error suspending budget");
            }
        }

        /// <summary>
        /// Get budget summary with statistics
        /// </summary>
        [HttpGet("{id}/summary")]
        [Authorize(Roles = "Admin,Finance,User")]
        public async Task<ActionResult<BudgetSummary>> GetBudgetSummary(
            int id,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate)
        {
            try
            {
                var budget = await _context.Set<GPTBudget>().FindAsync(id);

                if (budget == null)
                {
                    return NotFound();
                }

                var summary = await _costTrackingService.GetBudgetSummaryAsync(
                    budget.CountyId ?? 0,
                    budget.Department,
                    startDate,
                    endDate);

                return Ok(summary);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting budget summary");
                return StatusCode(500, "Error getting budget summary");
            }
        }

        /// <summary>
        /// Get usage history
        /// </summary>
        [HttpGet("{id}/usage")]
        [Authorize(Roles = "Admin,Finance")]
        public async Task<ActionResult<List<GPTCostUsage>>> GetUsageHistory(
            int id,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            try
            {
                var budget = await _context.Set<GPTBudget>().FindAsync(id);

                if (budget == null)
                {
                    return NotFound();
                }

                var start = startDate ?? budget.PeriodStart;
                var end = endDate ?? budget.PeriodEnd;

                var usages = await _costTrackingService.GetUsageHistoryAsync(
                    budget.CountyId ?? 0,
                    budget.Department,
                    start,
                    end);

                // Paginate
                var pagedUsages = usages
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToList();

                return Ok(new
                {
                    page,
                    pageSize,
                    totalCount = usages.Count,
                    totalPages = (int)Math.Ceiling(usages.Count / (double)pageSize),
                    data = pagedUsages
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting usage history");
                return StatusCode(500, "Error getting usage history");
            }
        }

        /// <summary>
        /// Get budget alerts
        /// </summary>
        [HttpGet("{id}/alerts")]
        [Authorize(Roles = "Admin,Finance")]
        public async Task<ActionResult<List<GPTBudgetAlert>>> GetAlerts(
            int id,
            [FromQuery] bool unacknowledgedOnly = false)
        {
            try
            {
                var alerts = await _alertService.GetAlertsAsync(id, unacknowledgedOnly);
                return Ok(alerts);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting alerts");
                return StatusCode(500, "Error getting alerts");
            }
        }

        /// <summary>
        /// Acknowledge alert
        /// </summary>
        [HttpPost("alerts/{alertId}/acknowledge")]
        [Authorize(Roles = "Admin,Finance")]
        public async Task<ActionResult> AcknowledgeAlert(int alertId)
        {
            try
            {
                await _alertService.AcknowledgeAlertAsync(
                    alertId,
                    User.Identity?.Name ?? "Unknown");

                return Ok(new { message = "Alert acknowledged" });
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error acknowledging alert");
                return StatusCode(500, "Error acknowledging alert");
            }
        }

        /// <summary>
        /// Get budgets needing attention
        /// </summary>
        [HttpGet("attention")]
        [Authorize(Roles = "Admin,Finance")]
        public async Task<ActionResult<List<GPTBudget>>> GetBudgetsNeedingAttention(
            [FromQuery] int countyId)
        {
            try
            {
                var budgets = await _alertService.GetBudgetsNeedingAttentionAsync(countyId);
                return Ok(budgets);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting budgets needing attention");
                return StatusCode(500, "Error getting budgets needing attention");
            }
        }

        /// <summary>
        /// Calculate estimated cost
        /// </summary>
        [HttpPost("calculate-cost")]
        [Authorize(Roles = "Admin,Finance,User")]
        public async Task<ActionResult> CalculateCost(
            [FromBody] CostCalculationRequest request)
        {
            try
            {
                var cost = await _costTrackingService.CalculateCostAsync(
                    request.Model,
                    request.PromptTokens,
                    request.CompletionTokens);

                return Ok(new
                {
                    model = request.Model,
                    promptTokens = request.PromptTokens,
                    completionTokens = request.CompletionTokens,
                    totalTokens = request.PromptTokens + request.CompletionTokens,
                    estimatedCost = cost
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calculating cost");
                return StatusCode(500, "Error calculating cost");
            }
        }
    }

    // Request DTOs
    public class CreateBudgetRequest
    {
        public int CountyId { get; set; }
        public string? Department { get; set; }
        public BudgetPeriodType PeriodType { get; set; }
        public DateTime PeriodStart { get; set; }
        public DateTime PeriodEnd { get; set; }
        public decimal AllocatedAmount { get; set; }
        public decimal? AlertThresholdPercent { get; set; }
        public decimal? WarningThresholdPercent { get; set; }
        public bool EnforceHardLimit { get; set; }
        public bool AllowOverrunWithApproval { get; set; }
        public string? AlertRecipients { get; set; }
        public string? Notes { get; set; }
    }

    public class UpdateBudgetRequest
    {
        public decimal? AllocatedAmount { get; set; }
        public decimal? AlertThresholdPercent { get; set; }
        public decimal? WarningThresholdPercent { get; set; }
        public bool? EnforceHardLimit { get; set; }
        public string? AlertRecipients { get; set; }
        public string? Notes { get; set; }
        public bool? IsActive { get; set; }
    }

    public class ApproveOverrunRequest
    {
        public decimal OverrunAmount { get; set; }
        public string? Notes { get; set; }
    }

    public class CostCalculationRequest
    {
        public string Model { get; set; } = string.Empty;
        public int PromptTokens { get; set; }
        public int CompletionTokens { get; set; }
    }
}
