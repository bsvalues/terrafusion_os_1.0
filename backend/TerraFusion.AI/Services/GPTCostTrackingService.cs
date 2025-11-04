// TerraFusionGPT Suite: Cost Tracking Service
// Elite Government OS Engineering - Budget Management

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Entities;
using TerraFusion.Data;

namespace TerraFusion.AI.Services
{
    /// <summary>
    /// Tracks GPT API costs and enforces budget limits
    /// </summary>
    public interface IGPTCostTrackingService
    {
        System.Threading.Tasks.Task<CostCheckResult> CheckBudgetAvailabilityAsync(
            int countyId, string? department, string userId);

        System.Threading.Tasks.Task RecordUsageAsync(GPTCostUsage usage);

        System.Threading.Tasks.Task<GPTBudget?> GetActiveBudgetAsync(
            int countyId, string? department);

        System.Threading.Tasks.Task<BudgetSummary> GetBudgetSummaryAsync(
            int countyId, string? department, DateTime? startDate, DateTime? endDate);

        System.Threading.Tasks.Task<List<GPTCostUsage>> GetUsageHistoryAsync(
            int countyId, string? department, DateTime startDate, DateTime endDate);

        System.Threading.Tasks.Task<decimal> CalculateCostAsync(
            string model, int promptTokens, int completionTokens);
    }

    /// <summary>
    /// Cost tracking service implementation
    /// </summary>
    public class GPTCostTrackingService : IGPTCostTrackingService
    {
        private readonly TerraFusionDbContext _context;
        private readonly ILogger<GPTCostTrackingService> _logger;
        private readonly IGPTBudgetAlertService _alertService;

        public GPTCostTrackingService(
            TerraFusionDbContext context,
            ILogger<GPTCostTrackingService> logger,
            IGPTBudgetAlertService alertService)
        {
            _context = context;
            _logger = logger;
            _alertService = alertService;
        }

        /// <summary>
        /// Check if budget is available for GPT usage
        /// </summary>
        public async System.Threading.Tasks.Task<CostCheckResult> CheckBudgetAvailabilityAsync(
            int countyId,
            string? department,
            string userId)
        {
            _logger.LogInformation(
                $"Checking budget availability for county {countyId}, " +
                $"department {department ?? "N/A"}, user {userId}");

            try
            {
                // Get active budget
                var budget = await GetActiveBudgetAsync(countyId, department);

                if (budget == null)
                {
                    // No budget configured - allow usage with warning
                    _logger.LogWarning(
                        $"No budget configured for county {countyId}, " +
                        $"department {department ?? "N/A"}");

                    return CostCheckResult.NoBudget();
                }

                // Check if budget is suspended
                if (budget.Status == BudgetStatus.Suspended)
                {
                    return CostCheckResult.Blocked(
                        "Budget has been suspended by administrator");
                }

                // Check if budget is exhausted
                if (budget.BudgetExhausted && budget.EnforceHardLimit)
                {
                    // Check if overrun is approved
                    if (budget.OverrunApprovedAmount.HasValue)
                    {
                        var totalAllowed = budget.AllocatedAmount +
                            budget.OverrunApprovedAmount.Value;

                        if (budget.ConsumedAmount >= totalAllowed)
                        {
                            return CostCheckResult.Blocked(
                                $"Budget exhausted. Approved overrun " +
                                $"(${budget.OverrunApprovedAmount:F2}) also exhausted.");
                        }
                    }
                    else
                    {
                        return CostCheckResult.Blocked(
                            $"Budget exhausted. ${budget.ConsumedAmount:F2} of " +
                            $"${budget.AllocatedAmount:F2} consumed.");
                    }
                }

                // Budget available - return status
                var result = new CostCheckResult
                {
                    IsAllowed = true,
                    Budget = budget,
                    RemainingBudget = budget.RemainingAmount,
                    PercentageConsumed = budget.PercentageConsumed
                };

                // Add warnings if approaching thresholds
                if (budget.PercentageConsumed >= budget.WarningThresholdPercent)
                {
                    result.Warning = $"Budget at {budget.PercentageConsumed:F1}% " +
                        $"(${budget.RemainingAmount:F2} remaining)";
                }
                else if (budget.PercentageConsumed >= budget.AlertThresholdPercent)
                {
                    result.Warning = $"Budget at {budget.PercentageConsumed:F1}% " +
                        $"(${budget.RemainingAmount:F2} remaining)";
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking budget availability");

                // On error, allow usage to prevent service disruption
                return CostCheckResult.NoBudget(
                    "Budget check failed - usage allowed with logging");
            }
        }

        /// <summary>
        /// Record GPT usage and update budget
        /// </summary>
        public async System.Threading.Tasks.Task RecordUsageAsync(GPTCostUsage usage)
        {
            _logger.LogInformation(
                $"Recording usage: {usage.TotalTokens} tokens, " +
                $"${usage.TotalCost:F4} cost");

            try
            {
                // Get active budget
                var budget = await GetActiveBudgetAsync(
                    usage.Conversation.CountyId,
                    usage.Department);

                if (budget != null)
                {
                    usage.GPTBudgetId = budget.Id;

                    // Update budget consumed amount
                    budget.ConsumedAmount += usage.TotalCost;
                    budget.UpdatedAt = DateTime.UtcNow;

                    // Check thresholds
                    await CheckAndUpdateThresholdsAsync(budget);
                }

                // Save usage record
                _context.Set<GPTCostUsage>().Add(usage);
                await _context.SaveChangesAsync();

                _logger.LogInformation(
                    $"Usage recorded successfully. Budget ID: {usage.GPTBudgetId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error recording GPT usage");
                throw;
            }
        }

        /// <summary>
        /// Get active budget for county/department
        /// </summary>
        public async System.Threading.Tasks.Task<GPTBudget?> GetActiveBudgetAsync(
            int countyId,
            string? department)
        {
            var now = DateTime.UtcNow;

            var query = _context.Set<GPTBudget>()
                .Where(b => b.CountyId == countyId)
                .Where(b => b.IsActive)
                .Where(b => b.PeriodStart <= now && b.PeriodEnd >= now);

            // Try to find department-specific budget first
            if (!string.IsNullOrEmpty(department))
            {
                var deptBudget = await query
                    .Where(b => b.Department == department)
                    .FirstOrDefaultAsync();

                if (deptBudget != null)
                {
                    return deptBudget;
                }
            }

            // Fall back to county-wide budget
            return await query
                .Where(b => b.Department == null)
                .FirstOrDefaultAsync();
        }

        /// <summary>
        /// Get budget summary with statistics
        /// </summary>
        public async System.Threading.Tasks.Task<BudgetSummary> GetBudgetSummaryAsync(
            int countyId,
            string? department,
            DateTime? startDate,
            DateTime? endDate)
        {
            var budget = await GetActiveBudgetAsync(countyId, department);

            if (budget == null)
            {
                return BudgetSummary.NoBudget();
            }

            var start = startDate ?? budget.PeriodStart;
            var end = endDate ?? budget.PeriodEnd;

            // Get usage for period
            var usages = await GetUsageHistoryAsync(countyId, department, start, end);

            // Calculate statistics
            var summary = new BudgetSummary
            {
                Budget = budget,
                TotalUsages = usages.Count,
                TotalCost = usages.Sum(u => u.TotalCost),
                TotalTokens = usages.Sum(u => u.TotalTokens),
                AverageCostPerRequest = usages.Any() ?
                    usages.Average(u => u.TotalCost) : 0,
                UniqueUsers = usages.Select(u => u.UserId).Distinct().Count(),
                UniqueGPTs = usages.Select(u => u.GPTConfigurationId).Distinct().Count()
            };

            // Cost by GPT
            summary.CostByGPT = usages
                .GroupBy(u => new { u.GPTConfigurationId, u.GPTConfiguration.Name })
                .Select(g => new CostBreakdown
                {
                    Category = g.Key.Name,
                    Cost = g.Sum(u => u.TotalCost),
                    UsageCount = g.Count(),
                    Percentage = (g.Sum(u => u.TotalCost) / summary.TotalCost) * 100
                })
                .OrderByDescending(c => c.Cost)
                .ToList();

            // Cost by user
            summary.CostByUser = usages
                .GroupBy(u => u.UserId)
                .Select(g => new CostBreakdown
                {
                    Category = g.Key,
                    Cost = g.Sum(u => u.TotalCost),
                    UsageCount = g.Count(),
                    Percentage = (g.Sum(u => u.TotalCost) / summary.TotalCost) * 100
                })
                .OrderByDescending(c => c.Cost)
                .Take(10)
                .ToList();

            // Cost by day
            summary.CostByDay = usages
                .GroupBy(u => u.UsageTimestamp.Date)
                .Select(g => new DailyCost
                {
                    Date = g.Key,
                    Cost = g.Sum(u => u.TotalCost),
                    UsageCount = g.Count()
                })
                .OrderBy(d => d.Date)
                .ToList();

            // Projection to end of period
            var daysElapsed = (DateTime.UtcNow - budget.PeriodStart).TotalDays;
            var totalDays = (budget.PeriodEnd - budget.PeriodStart).TotalDays;

            if (daysElapsed > 0 && daysElapsed < totalDays)
            {
                var dailyAverage = budget.ConsumedAmount / (decimal)daysElapsed;
                var daysRemaining = (decimal)(totalDays - daysElapsed);
                summary.ProjectedTotalCost = budget.ConsumedAmount +
                    (dailyAverage * daysRemaining);
                summary.ProjectedOverrun = Math.Max(0,
                    summary.ProjectedTotalCost - budget.AllocatedAmount);
            }

            return summary;
        }

        /// <summary>
        /// Get usage history for period
        /// </summary>
        public async System.Threading.Tasks.Task<List<GPTCostUsage>> GetUsageHistoryAsync(
            int countyId,
            string? department,
            DateTime startDate,
            DateTime endDate)
        {
            var query = _context.Set<GPTCostUsage>()
                .Include(u => u.GPTConfiguration)
                .Include(u => u.Conversation)
                .Where(u => u.Conversation.CountyId == countyId)
                .Where(u => u.UsageTimestamp >= startDate && u.UsageTimestamp <= endDate);

            if (!string.IsNullOrEmpty(department))
            {
                query = query.Where(u => u.Department == department);
            }

            return await query
                .OrderByDescending(u => u.UsageTimestamp)
                .ToListAsync();
        }

        /// <summary>
        /// Calculate cost for GPT request
        /// </summary>
        public async System.Threading.Tasks.Task<decimal> CalculateCostAsync(
            string model,
            int promptTokens,
            int completionTokens)
        {
            // Get pricing from configuration or database
            var pricing = await GetModelPricingAsync(model);

            var promptCost = (promptTokens / 1000m) * pricing.PromptCostPer1K;
            var completionCost = (completionTokens / 1000m) * pricing.CompletionCostPer1K;

            return promptCost + completionCost;
        }

        /// <summary>
        /// Check and update budget thresholds
        /// </summary>
        private async System.Threading.Tasks.Task CheckAndUpdateThresholdsAsync(GPTBudget budget)
        {
            var percentage = budget.PercentageConsumed;
            var previousStatus = budget.Status;

            // Check alert threshold
            if (percentage >= budget.AlertThresholdPercent && !budget.AlertThresholdBreached)
            {
                budget.AlertThresholdBreached = true;
                budget.AlertThresholdBreachedDate = DateTime.UtcNow;
                budget.Status = BudgetStatus.AlertThreshold;

                await _alertService.SendAlertAsync(
                    budget,
                    BudgetAlertType.ThresholdReached,
                    AlertSeverity.Warning);

                _logger.LogWarning(
                    $"Budget {budget.Id} alert threshold reached: {percentage:F1}%");
            }

            // Check warning threshold
            if (percentage >= budget.WarningThresholdPercent && !budget.WarningThresholdBreached)
            {
                budget.WarningThresholdBreached = true;
                budget.WarningThresholdBreachedDate = DateTime.UtcNow;
                budget.Status = BudgetStatus.WarningThreshold;

                await _alertService.SendAlertAsync(
                    budget,
                    BudgetAlertType.WarningReached,
                    AlertSeverity.Critical);

                _logger.LogWarning(
                    $"Budget {budget.Id} warning threshold reached: {percentage:F1}%");
            }

            // Check exhausted
            if (percentage >= 100 && !budget.BudgetExhausted)
            {
                budget.BudgetExhausted = true;
                budget.BudgetExhaustedDate = DateTime.UtcNow;
                budget.Status = BudgetStatus.Exhausted;

                await _alertService.SendAlertAsync(
                    budget,
                    BudgetAlertType.BudgetExhausted,
                    AlertSeverity.Critical);

                _logger.LogError(
                    $"Budget {budget.Id} exhausted: ${budget.ConsumedAmount:F2} of " +
                    $"${budget.AllocatedAmount:F2}");
            }

            // Check overrun
            if (percentage > 100)
            {
                budget.Status = BudgetStatus.Overrun;

                // Send overrun alert if first time
                if (previousStatus != BudgetStatus.Overrun)
                {
                    await _alertService.SendAlertAsync(
                        budget,
                        BudgetAlertType.BudgetOverrun,
                        AlertSeverity.Critical);
                }
            }
        }

        /// <summary>
        /// Get model pricing (hardcoded for now, should be in database)
        /// </summary>
        private async System.Threading.Tasks.Task<ModelPricing> GetModelPricingAsync(string model)
        {
            // TODO: Move to database configuration
            var pricing = model.ToLower() switch
            {
                "gpt-4o" or "gpt-4o-2024-05-13" => new ModelPricing
                {
                    Model = model,
                    PromptCostPer1K = 0.005m,
                    CompletionCostPer1K = 0.015m
                },
                "gpt-4o-mini" => new ModelPricing
                {
                    Model = model,
                    PromptCostPer1K = 0.00015m,
                    CompletionCostPer1K = 0.0006m
                },
                "gpt-3.5-turbo" or "gpt-3.5-turbo-0125" => new ModelPricing
                {
                    Model = model,
                    PromptCostPer1K = 0.0005m,
                    CompletionCostPer1K = 0.0015m
                },
                "claude-3-5-sonnet-20241022" or "claude-3-5-sonnet" => new ModelPricing
                {
                    Model = model,
                    PromptCostPer1K = 0.003m,
                    CompletionCostPer1K = 0.015m
                },
                "claude-3-opus-20240229" or "claude-3-opus" => new ModelPricing
                {
                    Model = model,
                    PromptCostPer1K = 0.015m,
                    CompletionCostPer1K = 0.075m
                },
                _ => new ModelPricing
                {
                    Model = model,
                    PromptCostPer1K = 0.001m,
                    CompletionCostPer1K = 0.003m
                }
            };

            return await System.Threading.Tasks.Task.FromResult(pricing);
        }
    }

    /// <summary>
    /// Result of budget availability check
    /// </summary>
    public class CostCheckResult
    {
        public bool IsAllowed { get; set; }
        public string? BlockReason { get; set; }
        public string? Warning { get; set; }
        public GPTBudget? Budget { get; set; }
        public decimal RemainingBudget { get; set; }
        public decimal PercentageConsumed { get; set; }

        public static CostCheckResult Allowed() =>
            new CostCheckResult { IsAllowed = true };

        public static CostCheckResult NoBudget(string? warning = null) =>
            new CostCheckResult
            {
                IsAllowed = true,
                Warning = warning ?? "No budget configured - usage allowed"
            };

        public static CostCheckResult Blocked(string reason) =>
            new CostCheckResult
            {
                IsAllowed = false,
                BlockReason = reason
            };
    }

    /// <summary>
    /// Budget summary with statistics
    /// </summary>
    public class BudgetSummary
    {
        public GPTBudget? Budget { get; set; }
        public int TotalUsages { get; set; }
        public decimal TotalCost { get; set; }
        public int TotalTokens { get; set; }
        public decimal AverageCostPerRequest { get; set; }
        public int UniqueUsers { get; set; }
        public int UniqueGPTs { get; set; }
        public List<CostBreakdown> CostByGPT { get; set; } = new();
        public List<CostBreakdown> CostByUser { get; set; } = new();
        public List<DailyCost> CostByDay { get; set; } = new();
        public decimal ProjectedTotalCost { get; set; }
        public decimal ProjectedOverrun { get; set; }

        public static BudgetSummary NoBudget() =>
            new BudgetSummary
            {
                Budget = null,
                TotalUsages = 0,
                TotalCost = 0
            };
    }

    /// <summary>
    /// Cost breakdown by category
    /// </summary>
    public class CostBreakdown
    {
        public string Category { get; set; } = string.Empty;
        public decimal Cost { get; set; }
        public int UsageCount { get; set; }
        public decimal Percentage { get; set; }
    }

    /// <summary>
    /// Daily cost summary
    /// </summary>
    public class DailyCost
    {
        public DateTime Date { get; set; }
        public decimal Cost { get; set; }
        public int UsageCount { get; set; }
    }

    /// <summary>
    /// Model pricing information
    /// </summary>
    public class ModelPricing
    {
        public string Model { get; set; } = string.Empty;
        public decimal PromptCostPer1K { get; set; }
        public decimal CompletionCostPer1K { get; set; }
    }
}
