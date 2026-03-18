// LEV-037 — User Audit Controller
// Owner Suite: TerraDais (workflow/state management for assessment operations)

using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

namespace TerraFusion.Security.Audit
{
    /// <summary>
    /// API controller for user activity tracking in the levy module.
    /// Provides endpoints to query audit logs, user sessions,
    /// and levy-specific override records.
    /// </summary>
    [ApiController]
    [Route("api/v1/audit")]
    public class UserAuditController : ControllerBase
    {
        private readonly UserAuditService _auditService;

        public UserAuditController(UserAuditService auditService)
        {
            _auditService = auditService;
        }

        /// <summary>
        /// Get audit log entries filtered by user, date range, and action type.
        /// </summary>
        [HttpGet("logs")]
        public async Task<ActionResult<List<AuditLogEntry>>> GetAuditLogs(
            [FromQuery] string? userId = null,
            [FromQuery] DateTime? from = null,
            [FromQuery] DateTime? to = null,
            [FromQuery] string? actionType = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            var logs = await _auditService.GetAuditLogsAsync(
                userId, from, to, actionType, page, pageSize);
            return Ok(logs);
        }

        /// <summary>
        /// Get activity summary for a specific user.
        /// </summary>
        [HttpGet("users/{userId}/activity")]
        public async Task<ActionResult<UserActivitySummary>> GetUserActivity(string userId)
        {
            var summary = await _auditService.GetUserActivitySummaryAsync(userId);
            return Ok(summary);
        }

        /// <summary>
        /// Get all levy override records (rate changes, manual adjustments).
        /// </summary>
        [HttpGet("overrides")]
        public async Task<ActionResult<List<LevyOverrideRecord>>> GetOverrides(
            [FromQuery] int? districtId = null,
            [FromQuery] int? taxYear = null)
        {
            var overrides = await _auditService.GetLevyOverridesAsync(districtId, taxYear);
            return Ok(overrides);
        }

        /// <summary>
        /// Record a manual action for audit purposes.
        /// </summary>
        [HttpPost("log")]
        public async Task<ActionResult> LogAction([FromBody] AuditLogRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Action))
                return BadRequest("Action is required.");

            await _auditService.LogActionAsync(
                request.UserId ?? "system",
                request.Action,
                request.EntityType,
                request.EntityId,
                request.Details);
            return Ok();
        }
    }

    /// <summary>Request body for manually logging an audit action.</summary>
    public class AuditLogRequest
    {
        public string? UserId { get; set; }
        public string Action { get; set; } = string.Empty;
        public string? EntityType { get; set; }
        public int? EntityId { get; set; }
        public string? Details { get; set; }
    }
}
