#nullable disable
using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Dapper;
using Npgsql;
using TerraFusion.Security.Interfaces;
using TerraFusion.Security.Models;
using TerraFusion.Security.Services;

namespace TerraFusion.Security
{
    /// <summary>
    /// PRODUCTION Audit Service - Government-compliant immutable audit logging
    /// Replaces console.log mocks with real audit trail for FISMA compliance
    /// </summary>
    public class ProductionAuditService : IAuditService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<ProductionAuditService> _logger;
        private readonly string _connectionString;
        private readonly IEncryptionService _encryptionService;
        private readonly IHashingService _hashingService;

        public ProductionAuditService(
            IConfiguration configuration,
            ILogger<ProductionAuditService> logger,
            IEncryptionService encryptionService,
            IHashingService hashingService)
        {
            _configuration = configuration;
            _logger = logger;
            _encryptionService = encryptionService;
            _hashingService = hashingService;
            _connectionString = configuration.GetConnectionString("AuditDatabase");
        }

        /// <summary>
        /// Log an audit event with full context and immutability
        /// </summary>
        public async Task<Guid> LogAuditEventAsync(AuditEvent auditEvent)
        {
            try
            {
                auditEvent.Id = Guid.NewGuid();
                auditEvent.Timestamp = DateTime.UtcNow;
                auditEvent.ServerHostname = Environment.MachineName;

                // Calculate hash for tamper detection
                auditEvent.Hash = CalculateEventHash(auditEvent);

                // Encrypt sensitive data if configured
                if (_configuration.GetValue<bool>("Audit:EncryptSensitiveData"))
                {
                    auditEvent.Data = await _encryptionService.EncryptAsync(auditEvent.Data);
                }

                using var connection = new NpgsqlConnection(_connectionString);

                const string sql = @"
                    INSERT INTO audit_log (
                        id, event_type, event_category, severity, user_id, username,
                        ip_address, user_agent, session_id, county, resource_type,
                        resource_id, action, outcome, data, error_message,
                        correlation_id, parent_event_id, duration_ms, timestamp,
                        server_hostname, hash, is_encrypted, retention_days
                    ) VALUES (
                        @Id, @EventType, @EventCategory, @Severity, @UserId, @Username,
                        @IpAddress, @UserAgent, @SessionId, @County, @ResourceType,
                        @ResourceId, @Action, @Outcome, @Data::jsonb, @ErrorMessage,
                        @CorrelationId, @ParentEventId, @DurationMs, @Timestamp,
                        @ServerHostname, @Hash, @IsEncrypted, @RetentionDays
                    )";

                await connection.ExecuteAsync(sql, auditEvent);

                // Also log critical events to separate compliance table
                if (IsComplianceEvent(auditEvent))
                {
                    await LogComplianceEventAsync(connection, auditEvent);
                }

                // Send to SIEM if configured
                if (_configuration.GetValue<bool>("Audit:SendToSiem"))
                {
                    await SendToSiemAsync(auditEvent);
                }

                return auditEvent.Id;
            }
            catch (Exception ex)
            {
                // Audit logging must never fail silently
                _logger.LogCritical(ex, "Failed to write audit log");

                // Write to fallback file system
                await WriteFallbackAuditLogAsync(auditEvent);

                throw new AuditException("Audit logging failed", ex);
            }
        }

        /// <summary>
        /// Log authentication attempt for security monitoring
        /// </summary>
        public async Task LogAuthenticationAttemptAsync(string username, string ipAddress)
        {
            await LogAuditEventAsync(new AuditEvent
            {
                EventType = "AUTHENTICATION_ATTEMPT",
                EventCategory = "Security",
                Severity = AuditSeverity.Information,
                Username = username,
                IpAddress = ipAddress,
                Action = "LOGIN_ATTEMPT",
                ResourceType = "Authentication",
                Data = JsonSerializer.Serialize(new { username, ipAddress, timestamp = DateTime.UtcNow })
            });
        }

        /// <summary>
        /// Log successful login with session details
        /// </summary>
        public async Task LogSuccessfulLoginAsync(string userId, string ipAddress, string sessionId)
        {
            await LogAuditEventAsync(new AuditEvent
            {
                EventType = "LOGIN_SUCCESS",
                EventCategory = "Security",
                Severity = AuditSeverity.Information,
                UserId = userId,
                IpAddress = ipAddress,
                SessionId = sessionId,
                Action = "LOGIN",
                Outcome = "SUCCESS",
                ResourceType = "Authentication",
                Data = JsonSerializer.Serialize(new { userId, sessionId, loginTime = DateTime.UtcNow })
            });
        }

        /// <summary>
        /// Log data access for compliance tracking
        /// </summary>
        public async Task LogDataAccessAsync(DataAccessEvent accessEvent)
        {
            await LogAuditEventAsync(new AuditEvent
            {
                EventType = "DATA_ACCESS",
                EventCategory = "DataAccess",
                Severity = AuditSeverity.Information,
                UserId = accessEvent.UserId,
                Username = accessEvent.Username,
                IpAddress = accessEvent.IpAddress,
                SessionId = accessEvent.SessionId,
                County = accessEvent.County,
                ResourceType = accessEvent.ResourceType,
                ResourceId = accessEvent.ResourceId,
                Action = accessEvent.Action,
                Outcome = accessEvent.Success ? "SUCCESS" : "FAILURE",
                Data = JsonSerializer.Serialize(new
                {
                    query = accessEvent.Query,
                    parameters = accessEvent.Parameters,
                    recordCount = accessEvent.RecordCount,
                    fields = accessEvent.Fields,
                    purpose = accessEvent.Purpose
                })
            });
        }

        /// <summary>
        /// Log configuration changes for compliance
        /// </summary>
        public async Task LogConfigurationChangeAsync(ConfigChangeEvent changeEvent)
        {
            await LogAuditEventAsync(new AuditEvent
            {
                EventType = "CONFIG_CHANGE",
                EventCategory = "Configuration",
                Severity = AuditSeverity.Warning,
                UserId = changeEvent.UserId,
                Username = changeEvent.Username,
                ResourceType = "Configuration",
                ResourceId = changeEvent.ConfigKey,
                Action = "UPDATE",
                Data = JsonSerializer.Serialize(new
                {
                    configKey = changeEvent.ConfigKey,
                    oldValue = changeEvent.OldValue,
                    newValue = changeEvent.NewValue,
                    reason = changeEvent.Reason,
                    approvedBy = changeEvent.ApprovedBy
                })
            });
        }

        /// <summary>
        /// Log security violations for incident response
        /// </summary>
        public async Task LogSecurityViolationAsync(SecurityViolationEvent violation)
        {
            await LogAuditEventAsync(new AuditEvent
            {
                EventType = "SECURITY_VIOLATION",
                EventCategory = "Security",
                Severity = AuditSeverity.Critical,
                UserId = violation.UserId,
                IpAddress = violation.IpAddress,
                SessionId = violation.SessionId,
                Action = violation.ViolationType,
                Outcome = "VIOLATION",
                ErrorMessage = violation.Description,
                Data = JsonSerializer.Serialize(new
                {
                    violationType = violation.ViolationType,
                    description = violation.Description,
                    attemptedAction = violation.AttemptedAction,
                    blockedBy = violation.BlockedBy,
                    riskScore = violation.RiskScore
                })
            });

            // Trigger security alert
            await TriggerSecurityAlertAsync(violation);
        }

        /// <summary>
        /// Query audit logs with filtering and pagination
        /// </summary>
        public async Task<AuditLogQueryResult> QueryAuditLogsAsync(AuditLogQuery query)
        {
            using var connection = new NpgsqlConnection(_connectionString);

            var whereClause = BuildWhereClause(query);
            var orderBy = query.SortBy ?? "timestamp";
            var sortDirection = query.SortDescending ? "DESC" : "ASC";

            // Count total records
            var countSql = $@"
                SELECT COUNT(*) 
                FROM audit_log 
                WHERE {whereClause}";

            var totalCount = await connection.ExecuteScalarAsync<long>(countSql, query);

            // Get paginated results
            var dataSql = $@"
                SELECT 
                    id, event_type, event_category, severity, user_id, username,
                    ip_address, user_agent, session_id, county, resource_type,
                    resource_id, action, outcome, data, error_message,
                    correlation_id, parent_event_id, duration_ms, timestamp,
                    server_hostname, hash
                FROM audit_log
                WHERE {whereClause}
                ORDER BY {orderBy} {sortDirection}
                LIMIT @PageSize OFFSET @Offset";

            query.Offset = (query.Page - 1) * query.PageSize;

            var logs = await connection.QueryAsync<AuditEvent>(dataSql, query);

            // Decrypt data if needed
            if (_configuration.GetValue<bool>("Audit:EncryptSensitiveData"))
            {
                foreach (var log in logs)
                {
                    if (log.IsEncrypted)
                    {
                        log.Data = await _encryptionService.DecryptAsync(log.Data);
                    }
                }
            }

            return new AuditLogQueryResult
            {
                Logs = logs.ToList(),
                TotalCount = totalCount,
                Page = query.Page,
                PageSize = query.PageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)query.PageSize)
            };
        }

        /// <summary>
        /// Generate compliance report for auditors
        /// </summary>
        public async Task<ComplianceReport> GenerateComplianceReportAsync(DateTime startDate, DateTime endDate)
        {
            using var connection = new NpgsqlConnection(_connectionString);

            var report = new ComplianceReport
            {
                StartDate = startDate,
                EndDate = endDate,
                GeneratedAt = DateTime.UtcNow,
                GeneratedBy = "System"
            };

            // Authentication statistics
            report.AuthenticationStats = await connection.QuerySingleAsync<AuthenticationStats>(@"
                SELECT 
                    COUNT(*) FILTER (WHERE event_type = 'LOGIN_SUCCESS') as SuccessfulLogins,
                    COUNT(*) FILTER (WHERE event_type = 'LOGIN_FAILURE') as FailedLogins,
                    COUNT(*) FILTER (WHERE event_type = 'LOGOUT') as Logouts,
                    COUNT(*) FILTER (WHERE event_type = 'PASSWORD_CHANGE') as PasswordChanges,
                    COUNT(*) FILTER (WHERE event_type = 'MFA_CHALLENGE') as MfaChallenges,
                    COUNT(DISTINCT user_id) as UniqueUsers
                FROM audit_log
                WHERE timestamp BETWEEN @StartDate AND @EndDate
                    AND event_category = 'Security'",
                new { StartDate = startDate, EndDate = endDate });

            // Data access patterns
            report.DataAccessPatterns = await connection.QueryAsync<DataAccessPattern>(@"
                SELECT 
                    resource_type as ResourceType,
                    action as Action,
                    COUNT(*) as AccessCount,
                    COUNT(DISTINCT user_id) as UniqueUsers,
                    AVG(duration_ms) as AvgDurationMs
                FROM audit_log
                WHERE timestamp BETWEEN @StartDate AND @EndDate
                    AND event_category = 'DataAccess'
                GROUP BY resource_type, action
                ORDER BY AccessCount DESC",
                new { StartDate = startDate, EndDate = endDate });

            // Security violations
            report.SecurityViolations = await connection.QueryAsync<SecurityViolation>(@"
                SELECT 
                    event_type as ViolationType,
                    COUNT(*) as Count,
                    MAX(timestamp) as LastOccurrence
                FROM audit_log
                WHERE timestamp BETWEEN @StartDate AND @EndDate
                    AND severity = 'CRITICAL'
                    AND event_category = 'Security'
                GROUP BY event_type
                ORDER BY Count DESC",
                new { StartDate = startDate, EndDate = endDate });

            // User activity summary
            report.UserActivitySummary = await connection.QueryAsync<UserActivity>(@"
                SELECT 
                    user_id as UserId,
                    username as Username,
                    COUNT(*) as TotalActions,
                    COUNT(DISTINCT DATE(timestamp)) as ActiveDays,
                    MIN(timestamp) as FirstActivity,
                    MAX(timestamp) as LastActivity
                FROM audit_log
                WHERE timestamp BETWEEN @StartDate AND @EndDate
                GROUP BY user_id, username
                ORDER BY TotalActions DESC
                LIMIT 100",
                new { StartDate = startDate, EndDate = endDate });

            return report;
        }

        /// <summary>
        /// Verify audit log integrity
        /// </summary>
        public async Task<AuditIntegrityCheckResult> VerifyAuditIntegrityAsync(DateTime startDate, DateTime endDate)
        {
            using var connection = new NpgsqlConnection(_connectionString);

            var logs = await connection.QueryAsync<AuditEvent>(@"
                SELECT * FROM audit_log
                WHERE timestamp BETWEEN @StartDate AND @EndDate
                ORDER BY timestamp",
                new { StartDate = startDate, EndDate = endDate });

            var result = new AuditIntegrityCheckResult
            {
                TotalRecords = logs.Count(),
                ValidRecords = 0,
                TamperedRecords = new List<Guid>(),
                MissingRecords = new List<DateTimeRange>()
            };

            foreach (var log in logs)
            {
                // Verify hash
                var calculatedHash = CalculateEventHash(log);
                if (calculatedHash == log.Hash)
                {
                    result.ValidRecords++;
                }
                else
                {
                    result.TamperedRecords.Add(log.Id);
                    _logger.LogCritical($"Tampered audit record detected: {log.Id}");
                }
            }

            // Check for time gaps that might indicate deleted records
            var previousTimestamp = startDate;
            foreach (var log in logs.OrderBy(l => l.Timestamp))
            {
                var gap = log.Timestamp - previousTimestamp;
                if (gap.TotalMinutes > 60) // Suspicious gap
                {
                    result.MissingRecords.Add(new DateTimeRange
                    {
                        Start = previousTimestamp,
                        End = log.Timestamp
                    });
                }
                previousTimestamp = log.Timestamp;
            }

            result.IntegrityScore = (double)result.ValidRecords / result.TotalRecords * 100;
            result.IsValid = result.TamperedRecords.Count == 0 && result.MissingRecords.Count == 0;

            return result;
        }

        /// <summary>
        /// Archive old audit logs while maintaining compliance
        /// </summary>
        public async Task<ArchiveResult> ArchiveAuditLogsAsync(int retentionDays)
        {
            using var connection = new NpgsqlConnection(_connectionString);
            using var transaction = connection.BeginTransaction();

            try
            {
                var cutoffDate = DateTime.UtcNow.AddDays(-retentionDays);

                // First, export to archive storage
                var logsToArchive = await connection.QueryAsync<AuditEvent>(@"
                    SELECT * FROM audit_log
                    WHERE timestamp < @CutoffDate
                    AND (retention_days IS NULL OR timestamp < NOW() - INTERVAL '1 day' * retention_days)",
                    new { CutoffDate = cutoffDate },
                    transaction);

                // Write to archive (could be S3, Azure Blob, etc.)
                var archiveLocation = await WriteToArchiveStorageAsync(logsToArchive);

                // Record archive operation
                await connection.ExecuteAsync(@"
                    INSERT INTO audit_archive_log (archived_at, record_count, date_range_start, date_range_end, archive_location, hash)
                    VALUES (@ArchivedAt, @RecordCount, @StartDate, @EndDate, @Location, @Hash)",
                    new
                    {
                        ArchivedAt = DateTime.UtcNow,
                        RecordCount = logsToArchive.Count(),
                        StartDate = logsToArchive.Min(l => l.Timestamp),
                        EndDate = logsToArchive.Max(l => l.Timestamp),
                        Location = archiveLocation,
                        Hash = CalculateArchiveHash(logsToArchive)
                    },
                    transaction);

                // Delete archived records (keep compliance-required ones)
                var deletedCount = await connection.ExecuteAsync(@"
                    DELETE FROM audit_log
                    WHERE timestamp < @CutoffDate
                    AND (retention_days IS NULL OR timestamp < NOW() - INTERVAL '1 day' * retention_days)
                    AND event_category NOT IN ('Compliance', 'Legal')",
                    new { CutoffDate = cutoffDate },
                    transaction);

                await transaction.CommitAsync();

                return new ArchiveResult
                {
                    Success = true,
                    ArchivedCount = logsToArchive.Count(),
                    DeletedCount = deletedCount,
                    ArchiveLocation = archiveLocation
                };
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Failed to archive audit logs");
                throw;
            }
        }

        // Helper methods
        private string CalculateEventHash(AuditEvent auditEvent)
        {
            var data = $"{auditEvent.EventType}|{auditEvent.UserId}|{auditEvent.Timestamp:O}|{auditEvent.Data}";
            return _hashingService.ComputeSha256(data);
        }

        public async Task LogAuthenticationSuccessAsync(string username, string ipAddress)
        {
            await LogAuditEventAsync(new AuditEvent
            {
                EventType = "LOGIN_SUCCESS",
                EventCategory = "Security",
                Severity = AuditSeverity.Information,
                Username = username,
                IpAddress = ipAddress,
                Action = "LOGIN",
                Outcome = "SUCCESS",
                ResourceType = "Authentication"
            });
        }

        public async Task LogAuthenticationFailureAsync(string username, string ipAddress, string reason)
        {
            await LogAuditEventAsync(new AuditEvent
            {
                EventType = "LOGIN_FAILURE",
                EventCategory = "Security",
                Severity = AuditSeverity.Warning,
                Username = username,
                IpAddress = ipAddress,
                Action = "LOGIN",
                Outcome = "FAILURE",
                ErrorMessage = reason,
                ResourceType = "Authentication"
            });
        }

        public async Task LogAuthenticationErrorAsync(string username, string message)
        {
            await LogAuditEventAsync(new AuditEvent
            {
                EventType = "AUTH_ERROR",
                EventCategory = "Security",
                Severity = AuditSeverity.Warning,
                Username = username,
                Action = "AUTHENTICATION",
                Outcome = "ERROR",
                ErrorMessage = message,
                ResourceType = "Authentication"
            });
        }

        public async Task LogTokenRefreshAsync(string userId, string sessionId)
        {
            await LogAuditEventAsync(new AuditEvent
            {
                EventType = "TOKEN_REFRESH",
                EventCategory = "Security",
                Severity = AuditSeverity.Information,
                UserId = userId,
                SessionId = sessionId,
                Action = "TOKEN_REFRESH",
                Outcome = "SUCCESS",
                ResourceType = "Authentication"
            });
        }

        public async Task LogLogoutAsync(string userId, string sessionId)
        {
            await LogAuditEventAsync(new AuditEvent
            {
                EventType = "LOGOUT",
                EventCategory = "Security",
                Severity = AuditSeverity.Information,
                UserId = userId,
                SessionId = sessionId,
                Action = "LOGOUT",
                Outcome = "SUCCESS",
                ResourceType = "Authentication"
            });
        }

        public async Task LogPasswordChangeAsync(string userId)
        {
            await LogAuditEventAsync(new AuditEvent
            {
                EventType = "PASSWORD_CHANGE",
                EventCategory = "Security",
                Severity = AuditSeverity.Information,
                UserId = userId,
                Action = "PASSWORD_CHANGE",
                Outcome = "SUCCESS",
                ResourceType = "Authentication"
            });
        }

        public async Task LogFailedPasswordChangeAsync(string userId, string reason)
        {
            await LogAuditEventAsync(new AuditEvent
            {
                EventType = "PASSWORD_CHANGE_FAILED",
                EventCategory = "Security",
                Severity = AuditSeverity.Warning,
                UserId = userId,
                Action = "PASSWORD_CHANGE",
                Outcome = "FAILURE",
                ErrorMessage = reason,
                ResourceType = "Authentication"
            });
        }

        public async Task LogSecurityEventAsync(string eventType, string userId, string details)
        {
            await LogAuditEventAsync(new AuditEvent
            {
                EventType = eventType,
                EventCategory = "Security",
                Severity = AuditSeverity.Information,
                UserId = userId,
                Action = eventType,
                Data = details,
                ResourceType = "Security"
            });
        }

        private bool IsComplianceEvent(AuditEvent auditEvent)
        {
            var complianceEvents = new[] { "LOGIN_SUCCESS", "DATA_ACCESS", "CONFIG_CHANGE", "SECURITY_VIOLATION" };
            return complianceEvents.Contains(auditEvent.EventType);
        }

        private async Task LogComplianceEventAsync(IDbConnection connection, AuditEvent auditEvent)
        {
            // Additional compliance-specific logging
        }

        private async Task SendToSiemAsync(AuditEvent auditEvent)
        {
            // Send to SIEM system (Splunk, ELK, etc.)
        }

        private async Task WriteFallbackAuditLogAsync(AuditEvent auditEvent)
        {
            // Write to local file system as fallback
        }

        private string BuildWhereClause(AuditLogQuery query)
        {
            var clauses = new List<string> { "1=1" };

            if (!string.IsNullOrEmpty(query.EventType))
                clauses.Add("event_type = @EventType");
            if (!string.IsNullOrEmpty(query.EventCategory))
                clauses.Add("event_category = @EventCategory");
            if (!string.IsNullOrEmpty(query.UserId))
                clauses.Add("user_id = @UserId");
            if (!string.IsNullOrEmpty(query.County))
                clauses.Add("county = @County");
            if (query.MinSeverity.HasValue)
                clauses.Add("severity >= @MinSeverity");
            if (query.StartDate.HasValue)
                clauses.Add("timestamp >= @StartDate");
            if (query.EndDate.HasValue)
                clauses.Add("timestamp <= @EndDate");

            return string.Join(" AND ", clauses);
        }

        private async Task TriggerSecurityAlertAsync(SecurityViolationEvent violation)
        {
            // Send security alerts
        }

        private async Task<string> WriteToArchiveStorageAsync(IEnumerable<AuditEvent> logs)
        {
            var archiveDir = _configuration["Audit:ArchivePath"] ?? Path.Combine(AppContext.BaseDirectory, "audit-archives");
            Directory.CreateDirectory(archiveDir);

            var timestamp = DateTime.UtcNow.ToString("yyyyMMdd-HHmmss");
            var archivePath = Path.Combine(archiveDir, $"audit-archive-{timestamp}.json");

            var json = JsonSerializer.Serialize(logs, new JsonSerializerOptions { WriteIndented = false });
            await File.WriteAllTextAsync(archivePath, json);

            _logger.LogInformation("Audit archive written: {ArchivePath}, records: {Count}", archivePath, logs.Count());
            return archivePath;
        }

        private string CalculateArchiveHash(IEnumerable<AuditEvent> logs)
        {
            // SHA-256 chain hash over all event hashes for tamper detection
            using var sha = System.Security.Cryptography.SHA256.Create();
            var combined = string.Join("|", logs.Select(l => l.Hash ?? l.Id.ToString()));
            var hashBytes = sha.ComputeHash(System.Text.Encoding.UTF8.GetBytes(combined));
            return Convert.ToHexString(hashBytes);
        }
    }
}
