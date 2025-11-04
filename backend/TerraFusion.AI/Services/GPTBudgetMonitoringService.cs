// TerraFusionGPT Suite: Budget Monitoring Background Service
// Elite Government OS Engineering - Proactive Budget Monitoring

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Entities;
using TerraFusion.Data;
using TaskAsync = System.Threading.Tasks.Task;

namespace TerraFusion.AI.Services
{
    /// <summary>
    /// Background service for proactive budget monitoring
    /// </summary>
    public class GPTBudgetMonitoringService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<GPTBudgetMonitoringService> _logger;
        private readonly TimeSpan _monitoringInterval = TimeSpan.FromHours(1);

        public GPTBudgetMonitoringService(
            IServiceProvider serviceProvider,
            ILogger<GPTBudgetMonitoringService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async System.Threading.Tasks.Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("GPT Budget Monitoring Service starting");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await MonitorBudgetsAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in budget monitoring cycle");
                }

                // Wait for next monitoring cycle
                await System.Threading.Tasks.Task.Delay(_monitoringInterval, stoppingToken);
            }

            _logger.LogInformation("GPT Budget Monitoring Service stopping");
        }

        /// <summary>
        /// Monitor all active budgets
        /// </summary>
        private async System.Threading.Tasks.Task MonitorBudgetsAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Starting budget monitoring cycle");

            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
            var alertService = scope.ServiceProvider.GetRequiredService<IGPTBudgetAlertService>();

            try
            {
                var now = DateTime.UtcNow;

                // Get all active budgets
                var budgets = await context.Set<GPTBudget>()
                    .Where(b => b.IsActive)
                    .Where(b => b.PeriodStart <= now && b.PeriodEnd >= now)
                    .Include(b => b.CostUsages)
                    .ToListAsync(cancellationToken);

                _logger.LogInformation($"Monitoring {budgets.Count} active budgets");

                foreach (var budget in budgets)
                {
                    try
                    {
                        await MonitorBudgetAsync(budget, context, alertService, cancellationToken);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(
                            ex,
                            $"Error monitoring budget {budget.Id}");
                    }
                }

                _logger.LogInformation("Budget monitoring cycle complete");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in budget monitoring");
            }
        }

        /// <summary>
        /// Monitor individual budget
        /// </summary>
        private async System.Threading.Tasks.Task MonitorBudgetAsync(
            GPTBudget budget,
            TerraFusionDbContext context,
            IGPTBudgetAlertService alertService,
            CancellationToken cancellationToken)
        {
            // Check for unusual usage spikes
            await CheckForUsageSpikeAsync(budget, context, alertService, cancellationToken);

            // Check monthly projection
            await CheckMonthlyProjectionAsync(budget, context, alertService, cancellationToken);

            // Check for expired budgets
            await CheckForExpiredBudgetsAsync(context, cancellationToken);
        }

        /// <summary>
        /// Check for unusual usage spikes
        /// </summary>
        private async System.Threading.Tasks.Task CheckForUsageSpikeAsync(
            GPTBudget budget,
            TerraFusionDbContext context,
            IGPTBudgetAlertService alertService,
            CancellationToken cancellationToken)
        {
            try
            {
                var now = DateTime.UtcNow;
                var yesterday = now.AddDays(-1);
                var lastWeek = now.AddDays(-7);

                // Get today's usage
                var todayUsage = await context.Set<GPTCostUsage>()
                    .Where(u => u.GPTBudgetId == budget.Id)
                    .Where(u => u.UsageTimestamp >= yesterday)
                    .SumAsync(u => u.TotalCost, cancellationToken);

                if (todayUsage == 0)
                {
                    return; // No usage today
                }

                // Get average daily usage for past week
                var weekUsage = await context.Set<GPTCostUsage>()
                    .Where(u => u.GPTBudgetId == budget.Id)
                    .Where(u => u.UsageTimestamp >= lastWeek && u.UsageTimestamp < yesterday)
                    .GroupBy(u => u.UsageTimestamp.Date)
                    .Select(g => g.Sum(u => u.TotalCost))
                    .ToListAsync(cancellationToken);

                if (!weekUsage.Any())
                {
                    return; // No historical data
                }

                var averageDailyUsage = weekUsage.Average();

                // Check if today's usage is significantly higher (>3x average)
                if (todayUsage > averageDailyUsage * 3)
                {
                    _logger.LogWarning(
                        $"Usage spike detected for budget {budget.Id}: " +
                        $"${todayUsage:F2} today vs ${averageDailyUsage:F2} average");

                    // Check if we've already sent an alert today
                    var alreadyAlerted = await context.Set<GPTBudgetAlert>()
                        .Where(a => a.GPTBudgetId == budget.Id)
                        .Where(a => a.AlertType == BudgetAlertType.DailyUsageSpike)
                        .Where(a => a.AlertTimestamp >= yesterday)
                        .AnyAsync(cancellationToken);

                    if (!alreadyAlerted)
                    {
                        await alertService.SendAlertAsync(
                            budget,
                            BudgetAlertType.DailyUsageSpike,
                            AlertSeverity.Warning);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    $"Error checking usage spike for budget {budget.Id}");
            }
        }

        /// <summary>
        /// Check monthly projection
        /// </summary>
        private async System.Threading.Tasks.Task CheckMonthlyProjectionAsync(
            GPTBudget budget,
            TerraFusionDbContext context,
            IGPTBudgetAlertService alertService,
            CancellationToken cancellationToken)
        {
            try
            {
                // Only check for monthly and quarterly budgets
                if (budget.PeriodType != BudgetPeriodType.Monthly &&
                    budget.PeriodType != BudgetPeriodType.Quarterly)
                {
                    return;
                }

                var now = DateTime.UtcNow;
                var daysElapsed = (now - budget.PeriodStart).TotalDays;
                var totalDays = (budget.PeriodEnd - budget.PeriodStart).TotalDays;

                // Only check if we're at least 25% through the period
                if (daysElapsed < totalDays * 0.25)
                {
                    return;
                }

                // Calculate projected total
                var currentBurn = budget.ConsumedAmount;
                var dailyBurnRate = currentBurn / (decimal)daysElapsed;
                var projectedTotal = dailyBurnRate * (decimal)totalDays;

                // Check if projected to exceed budget by >10%
                if (projectedTotal > budget.AllocatedAmount * 1.1m)
                {
                    _logger.LogWarning(
                        $"Budget {budget.Id} projected to exceed: " +
                        $"${projectedTotal:F2} projected vs ${budget.AllocatedAmount:F2} allocated");

                    // Check if we've already sent a projection alert recently (within 7 days)
                    var recentProjectionAlert = await context.Set<GPTBudgetAlert>()
                        .Where(a => a.GPTBudgetId == budget.Id)
                        .Where(a => a.AlertType == BudgetAlertType.MonthlyProjection)
                        .Where(a => a.AlertTimestamp >= now.AddDays(-7))
                        .AnyAsync(cancellationToken);

                    if (!recentProjectionAlert)
                    {
                        await alertService.SendAlertAsync(
                            budget,
                            BudgetAlertType.MonthlyProjection,
                            AlertSeverity.Warning);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    $"Error checking projection for budget {budget.Id}");
            }
        }

        /// <summary>
        /// Check for expired budgets and mark them
        /// </summary>
        private async System.Threading.Tasks.Task CheckForExpiredBudgetsAsync(
            TerraFusionDbContext context,
            CancellationToken cancellationToken)
        {
            try
            {
                var now = DateTime.UtcNow;

                // Find budgets that have expired but are still marked active
                var expiredBudgets = await context.Set<GPTBudget>()
                    .Where(b => b.IsActive)
                    .Where(b => b.PeriodEnd < now)
                    .Where(b => b.Status != BudgetStatus.Expired)
                    .ToListAsync(cancellationToken);

                if (expiredBudgets.Any())
                {
                    _logger.LogInformation(
                        $"Found {expiredBudgets.Count} expired budgets to mark");

                    foreach (var budget in expiredBudgets)
                    {
                        budget.Status = BudgetStatus.Expired;
                        budget.UpdatedAt = now;
                        budget.UpdatedBy = "System";
                    }

                    await context.SaveChangesAsync(cancellationToken);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking expired budgets");
            }
        }
    }
}
