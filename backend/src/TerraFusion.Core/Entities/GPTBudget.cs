// TerraFusionGPT Suite: GPT Budget Entity
// Elite Government OS Engineering - Cost Management

using System;
using System.Collections.Generic;

namespace TerraFusion.Core.Entities
{
    /// <summary>
    /// Budget allocation and tracking for GPT usage at county/department level
    /// </summary>
    public class GPTBudget
    {
        public int Id { get; set; }

        /// <summary>
        /// County this budget belongs to
        /// </summary>
        public int? CountyId { get; set; }
        public County? County { get; set; }

        /// <summary>
        /// Department name (optional - null means county-wide)
        /// </summary>
        public string? Department { get; set; }

        /// <summary>
        /// Budget period type
        /// </summary>
        public BudgetPeriodType PeriodType { get; set; }

        /// <summary>
        /// Budget period start date
        /// </summary>
        public DateTime PeriodStart { get; set; }

        /// <summary>
        /// Budget period end date
        /// </summary>
        public DateTime PeriodEnd { get; set; }

        /// <summary>
        /// Allocated budget amount (USD)
        /// </summary>
        public decimal AllocatedAmount { get; set; }

        /// <summary>
        /// Consumed amount to date (USD)
        /// </summary>
        public decimal ConsumedAmount { get; set; }

        /// <summary>
        /// Remaining budget (calculated)
        /// </summary>
        public decimal RemainingAmount => AllocatedAmount - ConsumedAmount;

        /// <summary>
        /// Percentage consumed (calculated)
        /// </summary>
        public decimal PercentageConsumed =>
            AllocatedAmount > 0 ? (ConsumedAmount / AllocatedAmount) * 100 : 0;

        /// <summary>
        /// Alert threshold percentage (send alert when reached)
        /// </summary>
        public decimal AlertThresholdPercent { get; set; } = 80m;

        /// <summary>
        /// Warning threshold percentage
        /// </summary>
        public decimal WarningThresholdPercent { get; set; } = 90m;

        /// <summary>
        /// Hard limit - block usage when budget exhausted
        /// </summary>
        public bool EnforceHardLimit { get; set; }

        /// <summary>
        /// Allow budget overrun with approval
        /// </summary>
        public bool AllowOverrunWithApproval { get; set; }

        /// <summary>
        /// Overrun approval amount (if approved to exceed budget)
        /// </summary>
        public decimal? OverrunApprovedAmount { get; set; }

        /// <summary>
        /// Overrun approved by
        /// </summary>
        public string? OverrunApprovedBy { get; set; }

        /// <summary>
        /// Overrun approval date
        /// </summary>
        public DateTime? OverrunApprovedDate { get; set; }

        /// <summary>
        /// Budget status
        /// </summary>
        public BudgetStatus Status { get; set; }

        /// <summary>
        /// Alert recipients (email addresses, comma-separated)
        /// </summary>
        public string? AlertRecipients { get; set; }

        /// <summary>
        /// Whether alert threshold has been breached
        /// </summary>
        public bool AlertThresholdBreached { get; set; }

        /// <summary>
        /// When alert threshold was first breached
        /// </summary>
        public DateTime? AlertThresholdBreachedDate { get; set; }

        /// <summary>
        /// Whether warning threshold has been breached
        /// </summary>
        public bool WarningThresholdBreached { get; set; }

        /// <summary>
        /// When warning threshold was first breached
        /// </summary>
        public DateTime? WarningThresholdBreachedDate { get; set; }

        /// <summary>
        /// Whether budget has been exhausted
        /// </summary>
        public bool BudgetExhausted { get; set; }

        /// <summary>
        /// When budget was exhausted
        /// </summary>
        public DateTime? BudgetExhaustedDate { get; set; }

        /// <summary>
        /// Budget notes/description
        /// </summary>
        public string? Notes { get; set; }

        /// <summary>
        /// Is this budget active
        /// </summary>
        public bool IsActive { get; set; } = true;

        /// <summary>
        /// Cost usage history for this budget period
        /// </summary>
        public ICollection<GPTCostUsage> CostUsages { get; set; } = new List<GPTCostUsage>();

        /// <summary>
        /// Budget alerts sent
        /// </summary>
        public ICollection<GPTBudgetAlert> Alerts { get; set; } = new List<GPTBudgetAlert>();

        // Audit fields
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public string UpdatedBy { get; set; } = string.Empty;
    }

    /// <summary>
    /// Budget period type
    /// </summary>
    public enum BudgetPeriodType
    {
        Monthly,
        Quarterly,
        Annual,
        Custom
    }

    /// <summary>
    /// Budget status
    /// </summary>
    public enum BudgetStatus
    {
        Active,
        AlertThreshold,
        WarningThreshold,
        Exhausted,
        Overrun,
        Expired,
        Suspended
    }

    /// <summary>
    /// Detailed cost usage record
    /// </summary>
    public class GPTCostUsage
    {
        public int Id { get; set; }

        /// <summary>
        /// Budget this usage applies to
        /// </summary>
        public int GPTBudgetId { get; set; }
        public GPTBudget Budget { get; set; } = null!;

        /// <summary>
        /// Conversation this cost is from
        /// </summary>
        public int GPTConversationId { get; set; }
        public GPTConversation Conversation { get; set; } = null!;

        /// <summary>
        /// GPT configuration used
        /// </summary>
        public int GPTConfigurationId { get; set; }
        public GPTConfiguration GPTConfiguration { get; set; } = null!;

        /// <summary>
        /// User who incurred the cost
        /// </summary>
        public string UserId { get; set; } = string.Empty;
        public GovernmentUser? User { get; set; }

        /// <summary>
        /// Department (if departmental budget)
        /// </summary>
        public string? Department { get; set; }

        /// <summary>
        /// Model used (GPT-4o, GPT-3.5, etc.)
        /// </summary>
        public string ModelUsed { get; set; } = string.Empty;

        /// <summary>
        /// Prompt tokens used
        /// </summary>
        public int PromptTokens { get; set; }

        /// <summary>
        /// Completion tokens used
        /// </summary>
        public int CompletionTokens { get; set; }

        /// <summary>
        /// Total tokens
        /// </summary>
        public int TotalTokens => PromptTokens + CompletionTokens;

        /// <summary>
        /// Cost per 1K prompt tokens
        /// </summary>
        public decimal PromptTokenCostPer1K { get; set; }

        /// <summary>
        /// Cost per 1K completion tokens
        /// </summary>
        public decimal CompletionTokenCostPer1K { get; set; }

        /// <summary>
        /// Total cost for this request (USD)
        /// </summary>
        public decimal TotalCost { get; set; }

        /// <summary>
        /// Timestamp of usage
        /// </summary>
        public DateTime UsageTimestamp { get; set; }

        /// <summary>
        /// RAG usage (if applicable)
        /// </summary>
        public bool UsedRAG { get; set; }

        /// <summary>
        /// Function calling usage
        /// </summary>
        public bool UsedFunctions { get; set; }

        /// <summary>
        /// Number of functions called
        /// </summary>
        public int? FunctionCallCount { get; set; }

        /// <summary>
        /// Message content preview (for auditing)
        /// </summary>
        public string? MessagePreview { get; set; }

        // Audit fields
        public DateTime CreatedAt { get; set; }
    }

    /// <summary>
    /// Budget alert record
    /// </summary>
    public class GPTBudgetAlert
    {
        public int Id { get; set; }

        /// <summary>
        /// Budget this alert is for
        /// </summary>
        public int GPTBudgetId { get; set; }
        public GPTBudget Budget { get; set; } = null!;

        /// <summary>
        /// Alert type
        /// </summary>
        public BudgetAlertType AlertType { get; set; }

        /// <summary>
        /// Alert severity
        /// </summary>
        public AlertSeverity Severity { get; set; }

        /// <summary>
        /// Budget percentage at time of alert
        /// </summary>
        public decimal BudgetPercentageUsed { get; set; }

        /// <summary>
        /// Amount consumed at time of alert
        /// </summary>
        public decimal AmountConsumed { get; set; }

        /// <summary>
        /// Amount remaining at time of alert
        /// </summary>
        public decimal AmountRemaining { get; set; }

        /// <summary>
        /// Alert message
        /// </summary>
        public string Message { get; set; } = string.Empty;

        /// <summary>
        /// Alert sent to (email addresses)
        /// </summary>
        public string SentTo { get; set; } = string.Empty;

        /// <summary>
        /// Alert sent successfully
        /// </summary>
        public bool Sent { get; set; }

        /// <summary>
        /// When alert was sent
        /// </summary>
        public DateTime? SentDate { get; set; }

        /// <summary>
        /// Alert acknowledged by user
        /// </summary>
        public bool Acknowledged { get; set; }

        /// <summary>
        /// Who acknowledged the alert
        /// </summary>
        public string? AcknowledgedBy { get; set; }

        /// <summary>
        /// When alert was acknowledged
        /// </summary>
        public DateTime? AcknowledgedDate { get; set; }

        /// <summary>
        /// Alert timestamp
        /// </summary>
        public DateTime AlertTimestamp { get; set; }

        /// <summary>
        /// Additional alert metadata
        /// </summary>
        public string? Metadata { get; set; }

        // Audit fields
        public DateTime CreatedAt { get; set; }
    }

    /// <summary>
    /// Budget alert type
    /// </summary>
    public enum BudgetAlertType
    {
        ThresholdReached,       // 80% default
        WarningReached,         // 90% default
        BudgetExhausted,        // 100% reached
        BudgetOverrun,          // Over 100%
        DailyUsageSpike,        // Unusual usage pattern
        MonthlyProjection,      // Projected to exceed budget
        BudgetSuspended         // Budget suspended by admin
    }

    /// <summary>
    /// Alert severity level
    /// </summary>
    public enum AlertSeverity
    {
        Info,
        Warning,
        Critical,
        Emergency
    }
}
