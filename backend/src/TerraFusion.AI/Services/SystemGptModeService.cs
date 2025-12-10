// ═══════════════════════════════════════════════════════════════════════════════
// 🛑 TerraFusion SystemGPT Mode Service
// Phase 17: Safe Mode & Kill Switch for County Tech Leads
// Government. Transcended.
// ═══════════════════════════════════════════════════════════════════════════════

using Microsoft.Extensions.Logging;
using TerraFusion.AI.Models;

namespace TerraFusion.AI.Services
{
    /// <summary>
    /// Interface for managing SystemGPT operational mode.
    /// Phase 17: Allows county tech leads to enable Safe Mode during incidents.
    /// </summary>
    public interface ISystemGptModeService
    {
        /// <summary>
        /// Current operational mode.
        /// </summary>
        SystemGptMode CurrentMode { get; }

        /// <summary>
        /// Reason for current mode (if Safe Mode).
        /// </summary>
        string? CurrentReason { get; }

        /// <summary>
        /// Who last changed the mode.
        /// </summary>
        string? ChangedBy { get; }

        /// <summary>
        /// When the mode was last changed.
        /// </summary>
        DateTime? ChangedAt { get; }

        /// <summary>
        /// Set the operational mode.
        /// </summary>
        /// <param name="mode">Target mode.</param>
        /// <param name="reason">Reason for the change (required for SafeMode).</param>
        /// <param name="changedBy">Who is making the change.</param>
        void SetMode(SystemGptMode mode, string? reason, string changedBy);

        /// <summary>
        /// Check if the system is currently in Safe Mode.
        /// </summary>
        bool IsSafeMode { get; }
    }

    /// <summary>
    /// Thread-safe in-memory implementation of SystemGPT mode management.
    /// Phase 17: Process-local state - does not persist across restarts.
    /// </summary>
    public class SystemGptModeService : ISystemGptModeService
    {
        private readonly ILogger<SystemGptModeService> _logger;
        private readonly object _lock = new();

        private SystemGptMode _mode = SystemGptMode.Normal;
        private string? _reason;
        private string? _changedBy;
        private DateTime? _changedAt;

        public SystemGptModeService(ILogger<SystemGptModeService> logger)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _logger.LogInformation("SystemGptModeService initialized - Mode: Normal");
        }

        /// <inheritdoc />
        public SystemGptMode CurrentMode
        {
            get { lock (_lock) { return _mode; } }
        }

        /// <inheritdoc />
        public string? CurrentReason
        {
            get { lock (_lock) { return _reason; } }
        }

        /// <inheritdoc />
        public string? ChangedBy
        {
            get { lock (_lock) { return _changedBy; } }
        }

        /// <inheritdoc />
        public DateTime? ChangedAt
        {
            get { lock (_lock) { return _changedAt; } }
        }

        /// <inheritdoc />
        public bool IsSafeMode
        {
            get { lock (_lock) { return _mode == SystemGptMode.SafeMode; } }
        }

        /// <inheritdoc />
        public void SetMode(SystemGptMode mode, string? reason, string changedBy)
        {
            lock (_lock)
            {
                var previousMode = _mode;
                _mode = mode;
                _reason = mode == SystemGptMode.SafeMode ? reason : null;
                _changedBy = changedBy;
                _changedAt = DateTime.UtcNow;

                if (mode == SystemGptMode.SafeMode)
                {
                    _logger.LogWarning(
                        "🛑 SystemGPT SAFE MODE ENABLED by {ChangedBy}: {Reason}",
                        changedBy, reason ?? "No reason provided");
                }
                else if (previousMode == SystemGptMode.SafeMode)
                {
                    _logger.LogInformation(
                        "✅ SystemGPT SAFE MODE DISABLED by {ChangedBy} - Returning to Normal operation",
                        changedBy);
                }
            }
        }
    }
}
