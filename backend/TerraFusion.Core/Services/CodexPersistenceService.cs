// TerraFusion Codex: Database Persistence Service
// Elite Government OS Engineering - Data Persistence Layer

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.Core.Services
{
    /// <summary>
    /// Service for persisting and retrieving Codex metrics from database
    /// </summary>
    public class CodexPersistenceService
    {
        private readonly ITerraFusionDbContext _context;
        private readonly ILogger<CodexPersistenceService> _logger;
        private readonly string _environment;

        public CodexPersistenceService(
            ITerraFusionDbContext context,
            ILogger<CodexPersistenceService> logger,
            Microsoft.Extensions.Hosting.IHostEnvironment hostEnvironment)
        {
            _context = context;
            _logger = logger;
            _environment = hostEnvironment.EnvironmentName;
        }

        #region Save Metrics

        /// <summary>
        /// Save individual metric to database
        /// </summary>
        public async Task<CodexMetric> SaveMetricAsync(
            string domain,
            string metricName,
            double rawValue,
            double scaledValue,
            string? unit = null,
            string? county = null,
            string? alertLevel = null)
        {
            var metric = new CodexMetric
            {
                Timestamp = DateTime.UtcNow,
                Environment = _environment,
                County = county,
                Domain = domain,
                MetricName = metricName,
                RawValue = rawValue,
                ScaledValue = scaledValue,
                Unit = unit,
                AlertLevel = alertLevel,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = "CodexSystem",
                UpdatedBy = "CodexSystem"
            };

            _context.CodexMetrics.Add(metric);
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Saved metric: {Domain}.{MetricName} = {ScaledValue}/12",
                domain, metricName, scaledValue.ToString("F2")
            );

            return metric;
        }

        /// <summary>
        /// Save domain score to database
        /// </summary>
        public async Task<CodexScore> SaveScoreAsync(
            string domain,
            double amplifiedScore,
            string alertLevel,
            string? recommendedAction = null,
            string? county = null)
        {
            var score = new CodexScore
            {
                Timestamp = DateTime.UtcNow,
                Environment = _environment,
                County = county,
                Domain = domain,
                AmplifiedScore = amplifiedScore,
                AlertLevel = alertLevel,
                RecommendedAction = recommendedAction,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = "CodexSystem",
                UpdatedBy = "CodexSystem"
            };

            _context.CodexScores.Add(score);
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Saved domain score: {Domain} = {Score}/12 [{AlertLevel}]",
                domain, amplifiedScore.ToString("F2"), alertLevel
            );

            return score;
        }

        /// <summary>
        /// Save ultimate power snapshot to database
        /// </summary>
        public async Task<CodexUltimatePower> SaveUltimatePowerAsync(
            double ultimatePowerScore,
            Dictionary<string, double> domainScores,
            string alertLevel,
            string? recommendedAction = null,
            string? trend = null,
            string? county = null)
        {
            var percentage = (ultimatePowerScore / CodexConstants.FOUNDATION_MAX) * 100;
            var isChampionship = ultimatePowerScore >= 10;
            var isFISMACompliant = domainScores.ContainsKey("compliance") && domainScores["compliance"] >= 10;

            var ultimatePower = new CodexUltimatePower
            {
                Timestamp = DateTime.UtcNow,
                Environment = _environment,
                County = county,
                UltimatePowerScore = ultimatePowerScore,
                Percentage = percentage,
                AlertLevel = alertLevel,
                RecommendedAction = recommendedAction,
                Trend = trend,
                DomainScoresJson = JsonSerializer.Serialize(domainScores),
                IsChampionshipMode = isChampionship,
                IsFISMACompliant = isFISMACompliant,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = "CodexSystem",
                UpdatedBy = "CodexSystem"
            };

            _context.CodexUltimatePowerRecords.Add(ultimatePower);
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Saved ultimate power: {Score}/12 ({Percentage}%) [{AlertLevel}] - Championship: {Championship}, FISMA: {FISMA}",
                ultimatePowerScore.ToString("F2"),
                percentage.ToString("F1"),
                alertLevel,
                isChampionship,
                isFISMACompliant
            );

            return ultimatePower;
        }

        /// <summary>
        /// Save alert to database
        /// </summary>
        public async Task<CodexAlert> SaveAlertAsync(
            string domain,
            string alertLevel,
            double score,
            double threshold,
            string message,
            string? recommendedAction = null,
            string? county = null)
        {
            var alert = new CodexAlert
            {
                Timestamp = DateTime.UtcNow,
                Environment = _environment,
                County = county,
                Domain = domain,
                AlertLevel = alertLevel,
                Score = score,
                Threshold = threshold,
                Message = message,
                RecommendedAction = recommendedAction,
                Acknowledged = false,
                Resolved = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = "CodexSystem",
                UpdatedBy = "CodexSystem"
            };

            _context.CodexAlerts.Add(alert);
            await _context.SaveChangesAsync();

            _logger.LogWarning(
                "Alert created: {Domain} - {AlertLevel} - {Message}",
                domain, alertLevel, message
            );

            return alert;
        }

        #endregion

        #region Query Metrics

        /// <summary>
        /// Get latest metrics for a domain
        /// </summary>
        public async Task<List<CodexMetric>> GetLatestMetricsAsync(
            string domain,
            string? county = null,
            int limit = 100)
        {
            var query = _context.CodexMetrics
                .Where(m => m.Domain == domain && m.Environment == _environment);

            if (!string.IsNullOrEmpty(county))
            {
                query = query.Where(m => m.County == county);
            }

            return await query
                .OrderByDescending(m => m.Timestamp)
                .Take(limit)
                .ToListAsync();
        }

        /// <summary>
        /// Get latest domain scores
        /// </summary>
        public async Task<List<CodexScore>> GetLatestScoresAsync(
            string? county = null,
            int limit = 100)
        {
            var query = _context.CodexScores
                .Where(s => s.Environment == _environment);

            if (!string.IsNullOrEmpty(county))
            {
                query = query.Where(s => s.County == county);
            }

            return await query
                .OrderByDescending(s => s.Timestamp)
                .Take(limit)
                .ToListAsync();
        }

        /// <summary>
        /// Get ultimate power history
        /// </summary>
        public async Task<List<CodexUltimatePower>> GetUltimatePowerHistoryAsync(
            string? county = null,
            DateTime? startDate = null,
            DateTime? endDate = null,
            int limit = 100)
        {
            var query = _context.CodexUltimatePowerRecords
                .Where(u => u.Environment == _environment);

            if (!string.IsNullOrEmpty(county))
            {
                query = query.Where(u => u.County == county);
            }

            if (startDate.HasValue)
            {
                query = query.Where(u => u.Timestamp >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                query = query.Where(u => u.Timestamp <= endDate.Value);
            }

            return await query
                .OrderByDescending(u => u.Timestamp)
                .Take(limit)
                .ToListAsync();
        }

        /// <summary>
        /// Get unresolved alerts
        /// </summary>
        public async Task<List<CodexAlert>> GetUnresolvedAlertsAsync(
            string? domain = null,
            string? county = null)
        {
            var query = _context.CodexAlerts
                .Where(a => !a.Resolved && a.Environment == _environment);

            if (!string.IsNullOrEmpty(domain))
            {
                query = query.Where(a => a.Domain == domain);
            }

            if (!string.IsNullOrEmpty(county))
            {
                query = query.Where(a => a.County == county);
            }

            return await query
                .OrderByDescending(a => a.Timestamp)
                .ToListAsync();
        }

        /// <summary>
        /// Get time-series data for trend analysis
        /// </summary>
        public async Task<List<TimeSeriesCodex>> GetTimeSeriesDataAsync(
            string? county = null,
            int hours = 24)
        {
            var startTime = DateTime.UtcNow.AddHours(-hours);

            var ultimatePowerRecords = await _context.CodexUltimatePowerRecords
                .Where(u => u.Timestamp >= startTime && u.Environment == _environment)
                .ToListAsync();

            if (!string.IsNullOrEmpty(county))
            {
                ultimatePowerRecords = ultimatePowerRecords
                    .Where(u => u.County == county)
                    .ToList();
            }

            return ultimatePowerRecords.Select(u => new TimeSeriesCodex
            {
                Timestamp = u.Timestamp,
                UltimatePower = u.UltimatePowerScore,
                DomainScores = JsonSerializer.Deserialize<Dictionary<string, double>>(u.DomainScoresJson)
                    ?? new Dictionary<string, double>(),
                AlertLevel = Enum.Parse<AlertLevel>(u.AlertLevel)
            }).ToList();
        }

        #endregion

        #region Update/Delete Operations

        /// <summary>
        /// Acknowledge alert
        /// </summary>
        public async Task<bool> AcknowledgeAlertAsync(int alertId, string acknowledgedBy)
        {
            var alert = await _context.CodexAlerts.FindAsync(alertId);
            if (alert == null) return false;

            alert.Acknowledged = true;
            alert.AcknowledgedBy = acknowledgedBy;
            alert.AcknowledgedAt = DateTime.UtcNow;
            alert.UpdatedAt = DateTime.UtcNow;
            alert.UpdatedBy = acknowledgedBy;

            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Alert {AlertId} acknowledged by {User}",
                alertId, acknowledgedBy
            );

            return true;
        }

        /// <summary>
        /// Resolve alert
        /// </summary>
        public async Task<bool> ResolveAlertAsync(int alertId, string resolvedBy, string? resolutionNotes = null)
        {
            var alert = await _context.CodexAlerts.FindAsync(alertId);
            if (alert == null) return false;

            alert.Resolved = true;
            alert.ResolvedAt = DateTime.UtcNow;
            alert.ResolutionNotes = resolutionNotes;
            alert.UpdatedAt = DateTime.UtcNow;
            alert.UpdatedBy = resolvedBy;

            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Alert {AlertId} resolved by {User}",
                alertId, resolvedBy
            );

            return true;
        }

        /// <summary>
        /// Clean up old metrics (data retention)
        /// </summary>
        public async Task<int> CleanupOldMetricsAsync(int retentionDays = 90)
        {
            var cutoffDate = DateTime.UtcNow.AddDays(-retentionDays);

            var oldMetrics = await _context.CodexMetrics
                .Where(m => m.Timestamp < cutoffDate)
                .ToListAsync();

            _context.CodexMetrics.RemoveRange(oldMetrics);

            var oldScores = await _context.CodexScores
                .Where(s => s.Timestamp < cutoffDate)
                .ToListAsync();

            _context.CodexScores.RemoveRange(oldScores);

            var oldUltimatePower = await _context.CodexUltimatePowerRecords
                .Where(u => u.Timestamp < cutoffDate)
                .ToListAsync();

            _context.CodexUltimatePowerRecords.RemoveRange(oldUltimatePower);

            var deletedCount = oldMetrics.Count + oldScores.Count + oldUltimatePower.Count;
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Cleaned up {Count} old codex records older than {Days} days",
                deletedCount, retentionDays
            );

            return deletedCount;
        }

        #endregion

        #region Analytics

        /// <summary>
        /// Get championship mode statistics
        /// </summary>
        public async Task<ChampionshipStatistics> GetChampionshipStatisticsAsync(
            string? county = null,
            int days = 30)
        {
            var startDate = DateTime.UtcNow.AddDays(-days);

            var query = _context.CodexUltimatePowerRecords
                .Where(u => u.Timestamp >= startDate && u.Environment == _environment);

            if (!string.IsNullOrEmpty(county))
            {
                query = query.Where(u => u.County == county);
            }

            var records = await query.ToListAsync();

            if (!records.Any())
            {
                return new ChampionshipStatistics();
            }

            var championshipCount = records.Count(r => r.IsChampionshipMode);
            var championshipPercentage = (double)championshipCount / records.Count * 100;

            return new ChampionshipStatistics
            {
                TotalMeasurements = records.Count,
                ChampionshipCount = championshipCount,
                ChampionshipPercentage = championshipPercentage,
                AverageScore = records.Average(r => r.UltimatePowerScore),
                HighestScore = records.Max(r => r.UltimatePowerScore),
                LowestScore = records.Min(r => r.UltimatePowerScore),
                FISMACompliancePercentage = (double)records.Count(r => r.IsFISMACompliant) / records.Count * 100
            };
        }

        #endregion
    }

    /// <summary>
    /// Championship mode statistics
    /// </summary>
    public class ChampionshipStatistics
    {
        public int TotalMeasurements { get; set; }
        public int ChampionshipCount { get; set; }
        public double ChampionshipPercentage { get; set; }
        public double AverageScore { get; set; }
        public double HighestScore { get; set; }
        public double LowestScore { get; set; }
        public double FISMACompliancePercentage { get; set; }
    }
}
