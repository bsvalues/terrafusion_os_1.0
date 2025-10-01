using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Runtime.InteropServices;
using TerraFusion.Core.Security;
using TerraFusion.Core.Models;

namespace TerraFusion.Banking.Controllers
{
    /// <summary>
    /// TerraBank Government Financial Infrastructure Controller
    /// 
    /// Provides secure, compliant banking and payment processing capabilities
    /// for county government operations through sponsor bank partnerships.
    /// 
    /// Features:
    /// - Government payment processing
    /// - Multi-fund accounting
    /// - Compliance reporting
    /// - Real-time reconciliation
    /// - FedNow/ACH integration
    /// </summary>
    [ApiController]
    [Route("api/modules/terra-bank")]
    [Authorize]
    public class TeraBankController : ControllerBase
    {
        private readonly ILogger<TeraBankController> _logger;
        private readonly IFinancialEngineService _financialEngine;
        private readonly IComplianceService _complianceService;
        private readonly ITrustFabricService _trustFabric;

        public TeraBankController(
            ILogger<TeraBankController> logger,
            IFinancialEngineService financialEngine,
            IComplianceService complianceService,
            ITrustFabricService trustFabric)
        {
            _logger = logger;
            _financialEngine = financialEngine;
            _complianceService = complianceService;
            _trustFabric = trustFabric;
        }

        /// <summary>
        /// Health check endpoint for TerraBank module
        /// </summary>
        [HttpGet("health")]
        [AllowAnonymous]
        public async Task<IActionResult> HealthCheck()
        {
            try
            {
                var rustEngineStatus = await _financialEngine.CheckHealthAsync();
                var complianceStatus = await _complianceService.CheckHealthAsync();
                
                return Ok(new
                {
                    status = "healthy",
                    timestamp = DateTime.UtcNow,
                    rust_engine = rustEngineStatus,
                    compliance_engine = complianceStatus,
                    version = "1.0.0"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "TerraBank health check failed");
                return StatusCode(500, new { status = "unhealthy", error = ex.Message });
            }
        }

        /// <summary>
        /// Initialize government banking configuration
        /// </summary>
        [HttpPost("config/government")]
        [Authorize(Roles = "Administrator,FinanceManager")]
        public async Task<IActionResult> InitializeGovernmentConfig([FromBody] GovernmentConfigRequest request)
        {
            try
            {
                _logger.LogInformation("Initializing government banking configuration");
                
                var config = new GovernmentBankingConfig
                {
                    ComplianceLevel = request.ComplianceLevel,
                    AuditRetention = request.AuditRetention,
                    DualApprovalThreshold = request.DualApprovalThreshold,
                    CreatedBy = User.Identity?.Name ?? "system",
                    CreatedAt = DateTime.UtcNow
                };
                
                var result = await _financialEngine.InitializeGovernmentConfigAsync(config);
                
                await _trustFabric.RecordConfigurationChangeAsync(new ConfigurationChange
                {
                    ChangeType = "government_banking_config",
                    Details = config,
                    UserId = User.Identity?.Name ?? "system"
                });
                
                return Ok(new { success = true, config_id = result.ConfigId });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to initialize government configuration");
                return BadRequest(new { error = ex.Message });
            }
        }

        /// <summary>
        /// Configure sponsor bank partnerships
        /// </summary>
        [HttpPost("sponsors")]
        [Authorize(Roles = "Administrator,FinanceManager")]
        public async Task<IActionResult> ConfigureSponsorBank([FromBody] SponsorBankRequest request)
        {
            try
            {
                _logger.LogInformation("Configuring sponsor bank: {BankName}", request.BankName);
                
                var sponsorConfig = new SponsorBankConfiguration
                {
                    BankId = request.BankId,
                    BankName = request.BankName,
                    Capabilities = request.Capabilities,
                    ComplianceLevel = request.ComplianceLevel,
                    CreatedBy = User.Identity?.Name ?? "system"
                };
                
                var result = await _financialEngine.ConfigureSponsorBankAsync(sponsorConfig);
                
                return Ok(new { success = true, bank_id = result.BankId });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to configure sponsor bank: {BankName}", request.BankName);
                return BadRequest(new { error = ex.Message });
            }
        }

        /// <summary>
        /// Process government payment
        /// </summary>
        [HttpPost("payments")]
        [Authorize(Roles = "FinanceManager,PaymentProcessor")]
        public async Task<IActionResult> ProcessPayment([FromBody] PaymentRequest request)
        {
            try
            {
                _logger.LogInformation("Processing payment: {Amount} from {FromFund} to {ToAccount}", 
                    request.Amount, request.FromFund, request.ToAccount);
                
                // Pre-flight compliance check
                var complianceCheck = await _complianceService.CheckComplianceAsync(new ComplianceCheckRequest
                {
                    Amount = request.Amount,
                    TransactionType = "payment",
                    FromFund = request.FromFund,
                    ToAccount = request.ToAccount,
                    Metadata = request.Metadata
                });
                
                if (!complianceCheck.Approved)
                {
                    return BadRequest(new { error = "Payment blocked by compliance", reason = complianceCheck.Reason });
                }
                
                // Process payment through Rust financial engine
                var paymentResult = await _financialEngine.ProcessPaymentAsync(new FinancialPaymentRequest
                {
                    Amount = request.Amount,
                    FromFund = request.FromFund,
                    ToAccount = request.ToAccount,
                    Description = request.Description,
                    Metadata = request.Metadata,
                    UserId = User.Identity?.Name ?? "system"
                });
                
                // Record in Trust Fabric
                await _trustFabric.RecordTransactionAsync(new TransactionRecord
                {
                    TransactionId = paymentResult.TransactionId,
                    Amount = request.Amount,
                    Type = "payment",
                    Status = paymentResult.Status,
                    UserId = User.Identity?.Name ?? "system"
                });
                
                return Ok(new
                {
                    success = true,
                    transaction_id = paymentResult.TransactionId,
                    status = paymentResult.Status,
                    processing_time_ms = paymentResult.ProcessingTimeMs
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Payment processing failed: {Amount} from {FromFund}", 
                    request.Amount, request.FromFund);
                return BadRequest(new { error = ex.Message });
            }
        }

        /// <summary>
        /// Check transaction compliance
        /// </summary>
        [HttpPost("compliance/check")]
        [Authorize(Roles = "FinanceManager,PaymentProcessor,ComplianceOfficer")]
        public async Task<IActionResult> CheckCompliance([FromBody] ComplianceCheckRequest request)
        {
            try
            {
                var result = await _complianceService.CheckComplianceAsync(request);
                
                return Ok(new
                {
                    approved = result.Approved,
                    reason = result.Reason,
                    risk_score = result.RiskScore,
                    required_approvals = result.RequiredApprovals,
                    compliance_checks = result.ComplianceChecks
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Compliance check failed");
                return BadRequest(new { error = ex.Message });
            }
        }

        /// <summary>
        /// Get government fund balances
        /// </summary>
        [HttpGet("funds/balances")]
        [Authorize(Roles = "FinanceManager,PaymentProcessor,Treasurer")]
        public async Task<IActionResult> GetFundBalances()
        {
            try
            {
                var balances = await _financialEngine.GetFundBalancesAsync();
                
                return Ok(balances.ToDictionary(
                    kvp => kvp.Key,
                    kvp => new
                    {
                        balance = kvp.Value.Balance,
                        available = kvp.Value.Available,
                        pending = kvp.Value.Pending,
                        last_updated = kvp.Value.LastUpdated
                    }
                ));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve fund balances");
                return BadRequest(new { error = ex.Message });
            }
        }

        /// <summary>
        /// Generate compliance report
        /// </summary>
        [HttpPost("compliance/report")]
        [Authorize(Roles = "ComplianceOfficer,Administrator,Auditor")]
        public async Task<IActionResult> GenerateComplianceReport([FromBody] ComplianceReportRequest request)
        {
            try
            {
                _logger.LogInformation("Generating compliance report: {StartDate} to {EndDate}", 
                    request.PeriodStart, request.PeriodEnd);
                
                var report = await _complianceService.GenerateReportAsync(
                    request.PeriodStart, 
                    request.PeriodEnd
                );
                
                // Record report generation in audit trail
                await _trustFabric.RecordAuditEventAsync(new AuditEvent
                {
                    EventType = "compliance_report_generated",
                    UserId = User.Identity?.Name ?? "system",
                    Details = new { report.ReportId, request.PeriodStart, request.PeriodEnd }
                });
                
                return Ok(new
                {
                    report_id = report.ReportId,
                    period_start = report.PeriodStart,
                    period_end = report.PeriodEnd,
                    total_transactions = report.TotalTransactions,
                    compliant_transactions = report.CompliantTransactions,
                    non_compliant_transactions = report.NonCompliantTransactions,
                    risk_summary = report.RiskSummary,
                    generated_at = report.GeneratedAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate compliance report");
                return BadRequest(new { error = ex.Message });
            }
        }

        /// <summary>
        /// Get transaction history
        /// </summary>
        [HttpGet("transactions")]
        [Authorize(Roles = "FinanceManager,PaymentProcessor,Treasurer,Auditor")]
        public async Task<IActionResult> GetTransactionHistory(
            [FromQuery] string? fundId = null,
            [FromQuery] int limit = 100,
            [FromQuery] int offset = 0)
        {
            try
            {
                var transactions = await _financialEngine.GetTransactionHistoryAsync(
                    fundId, limit, offset
                );
                
                return Ok(transactions.Select(tx => new
                {
                    transaction_id = tx.TransactionId,
                    timestamp = tx.Timestamp,
                    type = tx.Type,
                    amount = tx.Amount,
                    from_account = tx.FromAccount,
                    to_account = tx.ToAccount,
                    description = tx.Description,
                    status = tx.Status,
                    compliance_status = tx.ComplianceStatus
                }));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve transaction history");
                return BadRequest(new { error = ex.Message });
            }
        }

        /// <summary>
        /// Reconcile government funds
        /// </summary>
        [HttpPost("reconciliation")]
        [Authorize(Roles = "FinanceManager,Treasurer")]
        public async Task<IActionResult> ReconcileFunds()
        {
            try
            {
                _logger.LogInformation("Starting fund reconciliation");
                
                var reconciliationResult = await _financialEngine.ReconcileFundsAsync();
                
                await _trustFabric.RecordAuditEventAsync(new AuditEvent
                {
                    EventType = "fund_reconciliation",
                    UserId = User.Identity?.Name ?? "system",
                    Details = new 
                    { 
                        reconciliationResult.ReconciledCount,
                        reconciliationResult.DiscrepancyCount,
                        reconciliationResult.TotalAmount 
                    }
                });
                
                return Ok(new
                {
                    success = true,
                    reconciled_count = reconciliationResult.ReconciledCount,
                    discrepancy_count = reconciliationResult.DiscrepancyCount,
                    total_amount = reconciliationResult.TotalAmount,
                    completion_time_ms = reconciliationResult.CompletionTimeMs
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Fund reconciliation failed");
                return BadRequest(new { error = ex.Message });
            }
        }

        /// <summary>
        /// Set up compliance rules
        /// </summary>
        [HttpPost("compliance/rules")]
        [Authorize(Roles = "ComplianceOfficer,Administrator")]
        public async Task<IActionResult> SetupComplianceRules([FromBody] ComplianceRulesRequest request)
        {
            try
            {
                var result = await _complianceService.SetupRulesAsync(request.Rules);
                
                return Ok(new
                {
                    success = true,
                    rules_configured = result.ConfiguredCount,
                    active_rules = result.ActiveRules
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to setup compliance rules");
                return BadRequest(new { error = ex.Message });
            }
        }
    }

    // Request/Response Models
    public class GovernmentConfigRequest
    {
        public string ComplianceLevel { get; set; } = "government";
        public string AuditRetention { get; set; } = "7_years";
        public decimal DualApprovalThreshold { get; set; } = 100.00m;
    }

    public class SponsorBankRequest
    {
        public string BankId { get; set; } = string.Empty;
        public string BankName { get; set; } = string.Empty;
        public List<string> Capabilities { get; set; } = new();
        public string ComplianceLevel { get; set; } = "standard";
    }

    public class PaymentRequest
    {
        public decimal Amount { get; set; }
        public string FromFund { get; set; } = string.Empty;
        public string ToAccount { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public Dictionary<string, string> Metadata { get; set; } = new();
    }

    public class ComplianceCheckRequest
    {
        public decimal Amount { get; set; }
        public string TransactionType { get; set; } = string.Empty;
        public string FromFund { get; set; } = string.Empty;
        public string ToAccount { get; set; } = string.Empty;
        public Dictionary<string, string> Metadata { get; set; } = new();
    }

    public class ComplianceReportRequest
    {
        public DateTime PeriodStart { get; set; }
        public DateTime PeriodEnd { get; set; }
    }

    public class ComplianceRulesRequest
    {
        public List<ComplianceRuleDefinition> Rules { get; set; } = new();
    }

    public class ComplianceRuleDefinition
    {
        public string RuleId { get; set; } = string.Empty;
        public string RuleName { get; set; } = string.Empty;
        public decimal Threshold { get; set; }
        public string Action { get; set; } = string.Empty;
    }
}