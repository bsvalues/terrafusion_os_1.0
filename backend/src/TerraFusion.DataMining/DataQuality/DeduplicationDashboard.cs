// TMR-126: Deduplication Dashboard - Duplicate record management
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace TerraFusion.DataMining.DataQuality
{
    /// <summary>
    /// A pair of potentially duplicate records.
    /// </summary>
    public class DuplicateCandidate
    {
        public string RecordIdA { get; set; } = string.Empty;
        public string RecordIdB { get; set; } = string.Empty;
        public double SimilarityScore { get; set; }
        public string MatchField { get; set; } = string.Empty;
        public DateTime DetectedAt { get; set; } = DateTime.UtcNow;
        public DuplicateResolution Resolution { get; set; } = DuplicateResolution.Pending;
    }

    /// <summary>
    /// Resolution status for a duplicate candidate pair.
    /// </summary>
    public enum DuplicateResolution
    {
        Pending,
        Merged,
        NotDuplicate,
        Deferred
    }

    /// <summary>
    /// Summary statistics for the deduplication dashboard.
    /// </summary>
    public class DeduplicationSummary
    {
        public int TotalCandidates { get; set; }
        public int PendingReview { get; set; }
        public int Merged { get; set; }
        public int Dismissed { get; set; }
        public DateTime LastScanAt { get; set; }
    }

    /// <summary>
    /// Manages detection and resolution of duplicate records in the data mining store.
    /// </summary>
    public class DeduplicationDashboard
    {
        private readonly ILogger<DeduplicationDashboard> _logger;
        private readonly List<DuplicateCandidate> _candidates = new();

        public DeduplicationDashboard(ILogger<DeduplicationDashboard> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// Scans for duplicate records. Stub: In production, runs fuzzy matching queries.
        /// </summary>
        public Task<int> ScanForDuplicatesAsync(string countyId)
        {
            _logger.LogInformation("Scanning for duplicates in county {CountyId}", countyId);
            // Stub: production implementation runs fuzzy matching against property records
            return Task.FromResult(0);
        }

        /// <summary>
        /// Returns current duplicate candidates.
        /// </summary>
        public Task<IReadOnlyList<DuplicateCandidate>> GetCandidatesAsync(
            DuplicateResolution? statusFilter = null)
        {
            IReadOnlyList<DuplicateCandidate> result = statusFilter.HasValue
                ? _candidates.FindAll(c => c.Resolution == statusFilter.Value)
                : _candidates;
            return Task.FromResult(result);
        }

        /// <summary>
        /// Resolves a duplicate candidate pair.
        /// </summary>
        public Task<bool> ResolveAsync(string recordIdA, string recordIdB, DuplicateResolution resolution)
        {
            var candidate = _candidates.Find(c =>
                c.RecordIdA == recordIdA && c.RecordIdB == recordIdB);
            if (candidate == null) return Task.FromResult(false);

            candidate.Resolution = resolution;
            _logger.LogInformation("Duplicate resolved: {A} / {B} => {Resolution}",
                recordIdA, recordIdB, resolution);
            return Task.FromResult(true);
        }

        /// <summary>
        /// Returns summary statistics for the dashboard.
        /// </summary>
        public Task<DeduplicationSummary> GetSummaryAsync()
        {
            return Task.FromResult(new DeduplicationSummary
            {
                TotalCandidates = _candidates.Count,
                PendingReview = _candidates.FindAll(c => c.Resolution == DuplicateResolution.Pending).Count,
                Merged = _candidates.FindAll(c => c.Resolution == DuplicateResolution.Merged).Count,
                Dismissed = _candidates.FindAll(c => c.Resolution == DuplicateResolution.NotDuplicate).Count,
                LastScanAt = DateTime.UtcNow
            });
        }
    }
}
