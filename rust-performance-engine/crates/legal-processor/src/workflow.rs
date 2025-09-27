//! Legal Workflow Management
//! 
//! Comprehensive workflow management system for legal operations including
//! attorney review workflows, task assignment, and process automation.

use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

use crate::document::DocumentType;

/// Legal workflow representation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LegalWorkflow {
    /// Workflow identifier
    pub id: Uuid,
    /// Document being processed
    pub document_id: Uuid,
    /// Workflow type
    pub workflow_type: WorkflowType,
    /// Current status
    pub status: WorkflowStatus,
    /// Assigned attorney
    pub assigned_attorney: Option<Uuid>,
    /// Creation timestamp
    pub created_at: DateTime<Utc>,
    /// Due date
    pub due_date: DateTime<Utc>,
    /// Priority level
    pub priority: crate::WorkflowPriority,
    /// Workflow stages
    pub stages: Vec<WorkflowStage>,
    /// Workflow metadata
    pub metadata: HashMap<String, String>,
}

/// Types of legal workflows
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum WorkflowType {
    AttorneyReview,
    PrivilegeReview,
    ComplianceReview,
    FOIAProcessing,
    ContractReview,
    LitigationSupport,
    RegulatoryResponse,
    DocumentClassification,
    QualityAssurance,
    Appeal,
    Custom(String),
}

/// Workflow status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum WorkflowStatus {
    Created,
    Assigned,
    InProgress,
    OnHold,
    UnderReview,
    AwaitingApproval,
    Completed,
    Cancelled,
    Failed,
    Escalated,
}

/// Individual workflow stage
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowStage {
    /// Stage identifier
    pub id: Uuid,
    /// Stage name
    pub name: String,
    /// Stage type
    pub stage_type: StageType,
    /// Stage status
    pub status: StageStatus,
    /// Assigned reviewer
    pub assigned_reviewer: Option<Uuid>,
    /// Stage requirements
    pub requirements: Vec<StageRequirement>,
    /// Stage outputs
    pub outputs: Vec<StageOutput>,
    /// Dependencies on other stages
    pub dependencies: Vec<Uuid>,
    /// Start timestamp
    pub started_at: Option<DateTime<Utc>>,
    /// Completion timestamp
    pub completed_at: Option<DateTime<Utc>>,
    /// Stage duration limit
    pub duration_limit: Option<chrono::Duration>,
    /// Stage notes
    pub notes: Vec<StageNote>,
    /// Approval status
    pub approval_status: ApprovalStatus,
}

/// Types of workflow stages
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum StageType {
    InitialReview,
    LegalAnalysis,
    PrivilegeReview,
    ComplianceCheck,
    RiskAssessment,
    ClientConsultation,
    SupervisorReview,
    QualityControl,
    FinalApproval,
    Documentation,
    Notification,
    Custom(String),
}

/// Stage status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum StageStatus {
    Pending,
    Ready,
    InProgress,
    Completed,
    Skipped,
    Failed,
    OnHold,
    Cancelled,
}

/// Stage requirement
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StageRequirement {
    /// Requirement identifier
    pub id: Uuid,
    /// Requirement description
    pub description: String,
    /// Requirement type
    pub requirement_type: RequirementType,
    /// Required status
    pub required: bool,
    /// Completion status
    pub completed: bool,
    /// Completion evidence
    pub evidence: Option<String>,
    /// Completed by
    pub completed_by: Option<Uuid>,
    /// Completion timestamp
    pub completed_at: Option<DateTime<Utc>>,
}

/// Types of stage requirements
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RequirementType {
    DocumentReview,
    LegalOpinion,
    ClientApproval,
    RiskAssessment,
    ComplianceVerification,
    QualityCheck,
    SupervisorApproval,
    Training,
    Certification,
    Custom(String),
}

/// Stage output
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StageOutput {
    /// Output identifier
    pub id: Uuid,
    /// Output name
    pub name: String,
    /// Output type
    pub output_type: OutputType,
    /// Output content
    pub content: String,
    /// Created by
    pub created_by: Uuid,
    /// Creation timestamp
    pub created_at: DateTime<Utc>,
    /// Output status
    pub status: OutputStatus,
    /// Associated files
    pub files: Vec<String>,
}

/// Types of stage outputs
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum OutputType {
    LegalMemo,
    ReviewNotes,
    RiskAssessment,
    ComplianceReport,
    Recommendation,
    Decision,
    Documentation,
    Notification,
    Custom(String),
}

/// Output status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum OutputStatus {
    Draft,
    UnderReview,
    Approved,
    Final,
    Archived,
}

/// Stage note
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StageNote {
    /// Note identifier
    pub id: Uuid,
    /// Author
    pub author: Uuid,
    /// Timestamp
    pub timestamp: DateTime<Utc>,
    /// Note content
    pub content: String,
    /// Note type
    pub note_type: NoteType,
    /// Visibility level
    pub visibility: NoteVisibility,
    /// Attachments
    pub attachments: Vec<String>,
}

/// Types of stage notes
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum NoteType {
    General,
    Issue,
    Question,
    Recommendation,
    Decision,
    Escalation,
    Resolution,
}

/// Note visibility levels
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum NoteVisibility {
    Private,
    Team,
    Attorney,
    Supervisor,
    Client,
    Public,
}

/// Approval status for stages
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ApprovalStatus {
    NotRequired,
    Pending,
    Approved,
    Rejected,
    ConditionalApproval,
    Escalated,
}

/// Attorney review workflow
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AttorneyReview {
    /// Review identifier
    pub id: Uuid,
    /// Document under review
    pub document_id: Uuid,
    /// Assigned attorney
    pub attorney_id: Uuid,
    /// Review type
    pub review_type: ReviewType,
    /// Review status
    pub status: ReviewStatus,
    /// Review criteria
    pub criteria: Vec<ReviewCriterion>,
    /// Review findings
    pub findings: Vec<ReviewFinding>,
    /// Recommendations
    pub recommendations: Vec<ReviewRecommendation>,
    /// Review timeline
    pub timeline: ReviewTimeline,
    /// Review quality metrics
    pub quality_metrics: ReviewQualityMetrics,
}

/// Types of attorney reviews
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ReviewType {
    PrivilegeReview,
    LegalCompliance,
    RiskAssessment,
    ContractAnalysis,
    LitigationPrep,
    RegulatoryReview,
    EthicsReview,
    QualityAssurance,
    Custom(String),
}

/// Review status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ReviewStatus {
    Assigned,
    InProgress,
    Completed,
    OnHold,
    Escalated,
    Returned,
    Approved,
    Rejected,
}

/// Review criteria
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReviewCriterion {
    /// Criterion identifier
    pub id: Uuid,
    /// Criterion name
    pub name: String,
    /// Criterion description
    pub description: String,
    /// Criterion type
    pub criterion_type: CriterionType,
    /// Required for approval
    pub required: bool,
    /// Evaluation status
    pub evaluation_status: EvaluationStatus,
    /// Score (if applicable)
    pub score: Option<f64>,
    /// Comments
    pub comments: Option<String>,
}

/// Types of review criteria
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CriterionType {
    Legal,
    Factual,
    Procedural,
    Ethical,
    Risk,
    Quality,
    Compliance,
    Custom(String),
}

/// Evaluation status for criteria
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum EvaluationStatus {
    NotEvaluated,
    InProgress,
    Satisfactory,
    Unsatisfactory,
    NeedsImprovement,
    Exceptional,
    NotApplicable,
}

/// Review finding
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReviewFinding {
    /// Finding identifier
    pub id: Uuid,
    /// Finding category
    pub category: FindingCategory,
    /// Finding severity
    pub severity: FindingSeverity,
    /// Finding description
    pub description: String,
    /// Supporting evidence
    pub evidence: Vec<String>,
    /// Affected sections
    pub affected_sections: Vec<DocumentSection>,
    /// Resolution status
    pub resolution_status: ResolutionStatus,
    /// Remediation steps
    pub remediation_steps: Vec<String>,
}

/// Categories of review findings
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FindingCategory {
    PrivilegeIssue,
    ComplianceViolation,
    LegalRisk,
    FactualError,
    ProceduralIssue,
    QualityIssue,
    EthicalConcern,
    DocumentationGap,
    Custom(String),
}

/// Severity levels for findings
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, PartialOrd, Ord)]
pub enum FindingSeverity {
    Info = 1,
    Low = 2,
    Medium = 3,
    High = 4,
    Critical = 5,
}

/// Document section reference
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentSection {
    /// Section identifier
    pub id: String,
    /// Section name
    pub name: String,
    /// Page number
    pub page: Option<u32>,
    /// Line range
    pub line_range: Option<LineRange>,
    /// Character range
    pub char_range: Option<CharacterRange>,
}

/// Line range in document
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LineRange {
    /// Start line
    pub start: u32,
    /// End line
    pub end: u32,
}

/// Character range in document
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CharacterRange {
    /// Start position
    pub start: usize,
    /// End position
    pub end: usize,
}

/// Resolution status for findings
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ResolutionStatus {
    Open,
    InProgress,
    Resolved,
    Accepted,
    Deferred,
    NotApplicable,
}

/// Review recommendation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReviewRecommendation {
    /// Recommendation identifier
    pub id: Uuid,
    /// Recommendation type
    pub recommendation_type: RecommendationType,
    /// Recommendation priority
    pub priority: RecommendationPriority,
    /// Recommendation description
    pub description: String,
    /// Rationale
    pub rationale: String,
    /// Implementation steps
    pub implementation_steps: Vec<String>,
    /// Timeline for implementation
    pub timeline: Option<chrono::Duration>,
    /// Responsible party
    pub responsible_party: Option<Uuid>,
    /// Status
    pub status: RecommendationStatus,
}

/// Types of recommendations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RecommendationType {
    Approve,
    Reject,
    Modify,
    Investigate,
    Escalate,
    Defer,
    Archive,
    Redact,
    Release,
    Custom(String),
}

/// Recommendation priority levels
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, PartialOrd, Ord)]
pub enum RecommendationPriority {
    Low = 1,
    Medium = 2,
    High = 3,
    Urgent = 4,
    Emergency = 5,
}

/// Recommendation status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RecommendationStatus {
    Pending,
    UnderConsideration,
    Accepted,
    Rejected,
    PartiallyImplemented,
    Implemented,
    Superseded,
}

/// Review timeline tracking
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReviewTimeline {
    /// Review assigned
    pub assigned: DateTime<Utc>,
    /// Review started
    pub started: Option<DateTime<Utc>>,
    /// Review completed
    pub completed: Option<DateTime<Utc>>,
    /// Original due date
    pub original_due_date: DateTime<Utc>,
    /// Current due date
    pub current_due_date: DateTime<Utc>,
    /// Extensions granted
    pub extensions: Vec<TimeExtension>,
    /// Milestone tracking
    pub milestones: Vec<ReviewMilestone>,
}

/// Time extension for reviews
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimeExtension {
    /// Extension identifier
    pub id: Uuid,
    /// Reason for extension
    pub reason: ExtensionReason,
    /// Additional time granted
    pub additional_time: chrono::Duration,
    /// Granted by
    pub granted_by: Uuid,
    /// Grant timestamp
    pub granted_at: DateTime<Utc>,
    /// New due date
    pub new_due_date: DateTime<Utc>,
}

/// Reasons for time extensions
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ExtensionReason {
    Complexity,
    AdditionalResearch,
    ClientConsultation,
    ExpertConsultation,
    TechnicalIssues,
    EmergencyPriority,
    ResourceConstraints,
    Other(String),
}

/// Review milestone
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReviewMilestone {
    /// Milestone identifier
    pub id: Uuid,
    /// Milestone name
    pub name: String,
    /// Target date
    pub target_date: DateTime<Utc>,
    /// Actual date
    pub actual_date: Option<DateTime<Utc>>,
    /// Milestone status
    pub status: MilestoneStatus,
    /// Description
    pub description: String,
}

/// Milestone status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MilestoneStatus {
    Pending,
    InProgress,
    Completed,
    Delayed,
    Cancelled,
}

/// Review quality metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReviewQualityMetrics {
    /// Thoroughness score (0-100)
    pub thoroughness: f64,
    /// Accuracy score (0-100)
    pub accuracy: f64,
    /// Timeliness score (0-100)
    pub timeliness: f64,
    /// Completeness score (0-100)
    pub completeness: f64,
    /// Overall quality score (0-100)
    pub overall_quality: f64,
    /// Review efficiency metrics
    pub efficiency_metrics: EfficiencyMetrics,
    /// Quality indicators
    pub quality_indicators: Vec<QualityIndicator>,
}

/// Efficiency metrics for reviews
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EfficiencyMetrics {
    /// Time per page reviewed
    pub time_per_page: chrono::Duration,
    /// Issues identified per hour
    pub issues_per_hour: f64,
    /// Recommendations per hour
    pub recommendations_per_hour: f64,
    /// Rework rate percentage
    pub rework_rate: f64,
}

/// Quality indicator
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QualityIndicator {
    /// Indicator name
    pub name: String,
    /// Indicator value
    pub value: f64,
    /// Target value
    pub target: f64,
    /// Indicator status
    pub status: IndicatorStatus,
}

/// Status of quality indicators
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum IndicatorStatus {
    AboveTarget,
    OnTarget,
    BelowTarget,
    Critical,
}

/// Workflow automation rules
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowAutomationRule {
    /// Rule identifier
    pub id: Uuid,
    /// Rule name
    pub name: String,
    /// Rule description
    pub description: String,
    /// Trigger conditions
    pub triggers: Vec<AutomationTrigger>,
    /// Rule actions
    pub actions: Vec<AutomationAction>,
    /// Rule conditions
    pub conditions: Vec<AutomationCondition>,
    /// Rule priority
    pub priority: u32,
    /// Active status
    pub active: bool,
    /// Execution count
    pub execution_count: u64,
    /// Last executed
    pub last_executed: Option<DateTime<Utc>>,
}

/// Automation triggers
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AutomationTrigger {
    WorkflowCreated,
    StageCompleted,
    DeadlineApproaching,
    DocumentUpdated,
    ReviewCompleted,
    ApprovalReceived,
    IssueDetected,
    TimeThresholdReached,
    Custom(String),
}

/// Automation actions
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AutomationAction {
    AssignReviewer,
    SendNotification,
    EscalateToSupervisor,
    CreateTask,
    UpdateStatus,
    GenerateReport,
    ScheduleReminder,
    TriggerWorkflow,
    Custom(String),
}

/// Automation conditions
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AutomationCondition {
    /// Condition identifier
    pub id: Uuid,
    /// Condition type
    pub condition_type: ConditionType,
    /// Condition operator
    pub operator: ConditionOperator,
    /// Condition value
    pub value: String,
    /// Condition result
    pub result: Option<bool>,
}

/// Types of automation conditions
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ConditionType {
    DocumentType,
    ReviewerType,
    Priority,
    Duration,
    Status,
    Attribute,
    Custom(String),
}

/// Condition operators
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ConditionOperator {
    Equals,
    NotEquals,
    GreaterThan,
    LessThan,
    GreaterOrEqual,
    LessOrEqual,
    Contains,
    NotContains,
    StartsWith,
    EndsWith,
    Matches,
}

/// Task assignment system
#[derive(Debug)]
pub struct TaskAssignmentEngine {
    /// Assignment rules
    pub assignment_rules: Vec<AssignmentRule>,
    /// Workload balancer
    pub workload_balancer: WorkloadBalancer,
    /// Skill matcher
    pub skill_matcher: SkillMatcher,
    /// Availability checker
    pub availability_checker: AvailabilityChecker,
    /// Performance tracker
    pub performance_tracker: PerformanceTracker,
}

/// Assignment rule
#[derive(Debug, Clone)]
pub struct AssignmentRule {
    /// Rule identifier
    pub id: Uuid,
    /// Rule name
    pub name: String,
    /// Rule conditions
    pub conditions: Vec<AssignmentCondition>,
    /// Target assignee
    pub target: AssignmentTarget,
    /// Rule weight
    pub weight: f64,
    /// Rule priority
    pub priority: u32,
}

/// Assignment conditions
#[derive(Debug, Clone)]
pub enum AssignmentCondition {
    DocumentType(DocumentType),
    ReviewType(ReviewType),
    Complexity(ComplexityLevel),
    Urgency(UrgencyLevel),
    Specialization(crate::LegalSpecialization),
    WorkloadLimit(u32),
    Custom(String),
}

/// Complexity levels
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub enum ComplexityLevel {
    Simple = 1,
    Moderate = 2,
    Complex = 3,
    HighlyComplex = 4,
    ExpertLevel = 5,
}

/// Urgency levels
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub enum UrgencyLevel {
    Low = 1,
    Normal = 2,
    High = 3,
    Urgent = 4,
    Emergency = 5,
}

/// Assignment targets
#[derive(Debug, Clone)]
pub enum AssignmentTarget {
    SpecificAttorney(Uuid),
    AttorneyPool(Vec<Uuid>),
    Team(String),
    Department(String),
    External(String),
    Automatic,
}

/// Workload balancer
#[derive(Debug)]
pub struct WorkloadBalancer {
    /// Current workloads
    pub current_workloads: HashMap<Uuid, WorkloadInfo>,
    /// Capacity limits
    pub capacity_limits: HashMap<Uuid, CapacityInfo>,
    /// Balancing strategy
    pub strategy: BalancingStrategy,
}

/// Workload information
#[derive(Debug, Clone)]
pub struct WorkloadInfo {
    /// Active assignments
    pub active_assignments: u32,
    /// Pending assignments
    pub pending_assignments: u32,
    /// Total hours committed
    pub committed_hours: f64,
    /// Utilization percentage
    pub utilization: f64,
    /// Last updated
    pub last_updated: DateTime<Utc>,
}

/// Capacity information
#[derive(Debug, Clone)]
pub struct CapacityInfo {
    /// Maximum concurrent assignments
    pub max_assignments: u32,
    /// Weekly hour capacity
    pub weekly_capacity: f64,
    /// Skill-based capacity adjustments
    pub skill_adjustments: HashMap<String, f64>,
    /// Availability schedule
    pub availability: AvailabilitySchedule,
}

/// Availability schedule
#[derive(Debug, Clone)]
pub struct AvailabilitySchedule {
    /// Regular working hours
    pub working_hours: WorkingHours,
    /// Scheduled time off
    pub time_off: Vec<TimeOffPeriod>,
    /// Meeting blocks
    pub meeting_blocks: Vec<MeetingBlock>,
    /// Court appearances
    pub court_appearances: Vec<CourtAppearance>,
}

/// Working hours definition
#[derive(Debug, Clone)]
pub struct WorkingHours {
    /// Monday hours
    pub monday: Option<DayHours>,
    /// Tuesday hours
    pub tuesday: Option<DayHours>,
    /// Wednesday hours
    pub wednesday: Option<DayHours>,
    /// Thursday hours
    pub thursday: Option<DayHours>,
    /// Friday hours
    pub friday: Option<DayHours>,
    /// Saturday hours
    pub saturday: Option<DayHours>,
    /// Sunday hours
    pub sunday: Option<DayHours>,
    /// Time zone
    pub timezone: String,
}

/// Hours for a specific day
#[derive(Debug, Clone)]
pub struct DayHours {
    /// Start time (hour of day)
    pub start: u8,
    /// End time (hour of day)
    pub end: u8,
    /// Break periods
    pub breaks: Vec<BreakPeriod>,
}

/// Break period
#[derive(Debug, Clone)]
pub struct BreakPeriod {
    /// Start time (hour of day)
    pub start: u8,
    /// End time (hour of day)
    pub end: u8,
    /// Break type
    pub break_type: BreakType,
}

/// Types of breaks
#[derive(Debug, Clone)]
pub enum BreakType {
    Lunch,
    Meeting,
    Personal,
    Other(String),
}

/// Time off period
#[derive(Debug, Clone)]
pub struct TimeOffPeriod {
    /// Start date and time
    pub start: DateTime<Utc>,
    /// End date and time
    pub end: DateTime<Utc>,
    /// Type of time off
    pub time_off_type: TimeOffType,
    /// Approval status
    pub approved: bool,
}

/// Types of time off
#[derive(Debug, Clone)]
pub enum TimeOffType {
    Vacation,
    SickLeave,
    PersonalDay,
    Training,
    Conference,
    Other(String),
}

/// Meeting block
#[derive(Debug, Clone)]
pub struct MeetingBlock {
    /// Meeting start time
    pub start: DateTime<Utc>,
    /// Meeting duration
    pub duration: chrono::Duration,
    /// Meeting type
    pub meeting_type: MeetingType,
    /// Meeting priority
    pub priority: MeetingPriority,
}

/// Types of meetings
#[derive(Debug, Clone)]
pub enum MeetingType {
    Client,
    Internal,
    Court,
    Deposition,
    Negotiation,
    Training,
    Other(String),
}

/// Meeting priority levels
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub enum MeetingPriority {
    Low = 1,
    Normal = 2,
    High = 3,
    Critical = 4,
}

/// Court appearance
#[derive(Debug, Clone)]
pub struct CourtAppearance {
    /// Court date and time
    pub datetime: DateTime<Utc>,
    /// Court name
    pub court: String,
    /// Case number
    pub case_number: String,
    /// Appearance type
    pub appearance_type: AppearanceType,
    /// Estimated duration
    pub duration: chrono::Duration,
}

/// Types of court appearances
#[derive(Debug, Clone)]
pub enum AppearanceType {
    Hearing,
    Trial,
    Deposition,
    Conference,
    Motion,
    Sentencing,
    Other(String),
}

/// Load balancing strategies
#[derive(Debug)]
pub enum BalancingStrategy {
    EqualDistribution,
    CapacityBased,
    SkillBased,
    PerformanceBased,
    Hybrid,
}

/// Skill matching system
#[derive(Debug)]
pub struct SkillMatcher {
    /// Attorney skill profiles
    pub skill_profiles: HashMap<Uuid, SkillProfile>,
    /// Skill requirements database
    pub skill_requirements: HashMap<WorkflowType, Vec<SkillRequirement>>,
    /// Matching algorithms
    pub matching_algorithms: Vec<MatchingAlgorithm>,
}

/// Skill profile for attorneys
#[derive(Debug, Clone)]
pub struct SkillProfile {
    /// Attorney identifier
    pub attorney_id: Uuid,
    /// Legal specializations
    pub specializations: Vec<crate::LegalSpecialization>,
    /// Experience levels by area
    pub experience_levels: HashMap<String, ExperienceLevel>,
    /// Skill ratings
    pub skill_ratings: HashMap<String, SkillRating>,
    /// Certifications
    pub certifications: Vec<Certification>,
    /// Training history
    pub training_history: Vec<TrainingRecord>,
    /// Performance history
    pub performance_history: PerformanceHistory,
}

/// Experience levels
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub enum ExperienceLevel {
    Entry = 1,
    Junior = 2,
    Intermediate = 3,
    Senior = 4,
    Expert = 5,
}

/// Skill rating
#[derive(Debug, Clone)]
pub struct SkillRating {
    /// Rating value (1-10)
    pub rating: u8,
    /// Rating source
    pub source: RatingSource,
    /// Last updated
    pub last_updated: DateTime<Utc>,
    /// Confidence level
    pub confidence: f64,
}

/// Sources of skill ratings
#[derive(Debug, Clone)]
pub enum RatingSource {
    SelfAssessment,
    SupervisorEvaluation,
    PeerReview,
    ClientFeedback,
    PerformanceMetrics,
    ExternalAssessment,
}

/// Professional certification
#[derive(Debug, Clone)]
pub struct Certification {
    /// Certification name
    pub name: String,
    /// Issuing organization
    pub issuer: String,
    /// Issue date
    pub issue_date: DateTime<Utc>,
    /// Expiration date
    pub expiration_date: Option<DateTime<Utc>>,
    /// Certification level
    pub level: CertificationLevel,
    /// Active status
    pub active: bool,
}

/// Certification levels
#[derive(Debug, Clone)]
pub enum CertificationLevel {
    Basic,
    Intermediate,
    Advanced,
    Expert,
    Master,
}

/// Training record
#[derive(Debug, Clone)]
pub struct TrainingRecord {
    /// Training identifier
    pub id: Uuid,
    /// Training name
    pub name: String,
    /// Training provider
    pub provider: String,
    /// Completion date
    pub completion_date: DateTime<Utc>,
    /// Training hours
    pub hours: f64,
    /// Skills covered
    pub skills_covered: Vec<String>,
    /// Completion status
    pub completion_status: CompletionStatus,
}

/// Training completion status
#[derive(Debug, Clone)]
pub enum CompletionStatus {
    Completed,
    InProgress,
    Failed,
    Cancelled,
}

/// Performance history
#[derive(Debug, Clone)]
pub struct PerformanceHistory {
    /// Historical performance records
    pub records: Vec<PerformanceRecord>,
    /// Average ratings
    pub average_ratings: HashMap<String, f64>,
    /// Trend analysis
    pub trends: Vec<PerformanceTrend>,
    /// Notable achievements
    pub achievements: Vec<Achievement>,
}

/// Performance record
#[derive(Debug, Clone)]
pub struct PerformanceRecord {
    /// Record identifier
    pub id: Uuid,
    /// Evaluation period
    pub period: EvaluationPeriod,
    /// Performance metrics
    pub metrics: HashMap<String, f64>,
    /// Evaluator
    pub evaluator: Uuid,
    /// Comments
    pub comments: String,
    /// Overall rating
    pub overall_rating: f64,
}

/// Evaluation period
#[derive(Debug, Clone)]
pub struct EvaluationPeriod {
    /// Start date
    pub start: DateTime<Utc>,
    /// End date
    pub end: DateTime<Utc>,
    /// Period type
    pub period_type: PeriodType,
}

/// Types of evaluation periods
#[derive(Debug, Clone)]
pub enum PeriodType {
    Monthly,
    Quarterly,
    SemiAnnual,
    Annual,
    ProjectBased,
}

/// Performance trend
#[derive(Debug, Clone)]
pub struct PerformanceTrend {
    /// Metric name
    pub metric: String,
    /// Trend direction
    pub direction: TrendDirection,
    /// Trend strength
    pub strength: f64,
    /// Time period
    pub period: chrono::Duration,
}

/// Trend directions
#[derive(Debug, Clone)]
pub enum TrendDirection {
    Improving,
    Declining,
    Stable,
    Volatile,
}

/// Achievement record
#[derive(Debug, Clone)]
pub struct Achievement {
    /// Achievement identifier
    pub id: Uuid,
    /// Achievement name
    pub name: String,
    /// Achievement date
    pub date: DateTime<Utc>,
    /// Achievement type
    pub achievement_type: AchievementType,
    /// Description
    pub description: String,
    /// Recognition level
    pub recognition_level: RecognitionLevel,
}

/// Types of achievements
#[derive(Debug, Clone)]
pub enum AchievementType {
    Award,
    Recognition,
    Milestone,
    Certification,
    Publication,
    Speaking,
    Leadership,
    Other(String),
}

/// Recognition levels
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub enum RecognitionLevel {
    Internal = 1,
    Regional = 2,
    National = 3,
    International = 4,
}

/// Skill requirement for workflows
#[derive(Debug, Clone)]
pub struct SkillRequirement {
    /// Required skill
    pub skill: String,
    /// Minimum level required
    pub minimum_level: ExperienceLevel,
    /// Importance weight
    pub weight: f64,
    /// Required certification
    pub required_certification: Option<String>,
    /// Alternative skills
    pub alternatives: Vec<String>,
}

/// Matching algorithm for skill-based assignment
#[derive(Debug, Clone)]
pub struct MatchingAlgorithm {
    /// Algorithm identifier
    pub id: String,
    /// Algorithm name
    pub name: String,
    /// Algorithm type
    pub algorithm_type: AlgorithmType,
    /// Weight in overall matching
    pub weight: f64,
    /// Configuration parameters
    pub parameters: HashMap<String, f64>,
}

/// Types of matching algorithms
#[derive(Debug, Clone)]
pub enum AlgorithmType {
    ExactMatch,
    FuzzyMatch,
    WeightedScore,
    MachineLearning,
    Hybrid,
}

/// Availability checker
#[derive(Debug)]
pub struct AvailabilityChecker {
    /// Availability cache
    pub availability_cache: HashMap<Uuid, AvailabilityStatus>,
    /// Calendar integrations
    pub calendar_integrations: Vec<CalendarIntegration>,
    /// Availability rules
    pub availability_rules: Vec<AvailabilityRule>,
}

/// Availability status
#[derive(Debug, Clone)]
pub struct AvailabilityStatus {
    /// Attorney identifier
    pub attorney_id: Uuid,
    /// Current availability
    pub available: bool,
    /// Next available time
    pub next_available: Option<DateTime<Utc>>,
    /// Availability until
    pub available_until: Option<DateTime<Utc>>,
    /// Current capacity utilization
    pub capacity_utilization: f64,
    /// Reasons for unavailability
    pub unavailability_reasons: Vec<UnavailabilityReason>,
}

/// Reasons for unavailability
#[derive(Debug, Clone)]
pub enum UnavailabilityReason {
    OverCapacity,
    TimeOff,
    CourtAppearance,
    Meeting,
    Training,
    Other(String),
}

/// Calendar integration
#[derive(Debug)]
pub struct CalendarIntegration {
    /// Integration identifier
    pub id: String,
    /// Calendar system type
    pub system_type: CalendarSystemType,
    /// Integration status
    pub status: IntegrationStatus,
    /// Last sync
    pub last_sync: DateTime<Utc>,
    /// Sync frequency
    pub sync_frequency: chrono::Duration,
}

/// Calendar system types
#[derive(Debug)]
pub enum CalendarSystemType {
    Outlook,
    GoogleCalendar,
    iCal,
    Custom(String),
}

/// Integration status
#[derive(Debug)]
pub enum IntegrationStatus {
    Active,
    Inactive,
    Error,
    Syncing,
}

/// Availability rule
#[derive(Debug)]
pub struct AvailabilityRule {
    /// Rule identifier
    pub id: String,
    /// Rule condition
    pub condition: AvailabilityCondition,
    /// Rule action
    pub action: AvailabilityAction,
    /// Rule priority
    pub priority: u32,
}

/// Availability conditions
#[derive(Debug)]
pub enum AvailabilityCondition {
    TimeRange(DateTime<Utc>, DateTime<Utc>),
    DayOfWeek(chrono::Weekday),
    CapacityThreshold(f64),
    WorkflowType(WorkflowType),
    Custom(String),
}

/// Availability actions
#[derive(Debug)]
pub enum AvailabilityAction {
    Block,
    Allow,
    Require,
    Prefer,
    Avoid,
}

/// Performance tracker
#[derive(Debug)]
pub struct PerformanceTracker {
    /// Performance metrics
    pub metrics: HashMap<Uuid, AttorneyPerformanceMetrics>,
    /// Tracking configuration
    pub config: PerformanceTrackingConfig,
    /// Benchmark data
    pub benchmarks: HashMap<String, BenchmarkData>,
}

/// Attorney performance metrics
#[derive(Debug, Clone)]
pub struct AttorneyPerformanceMetrics {
    /// Attorney identifier
    pub attorney_id: Uuid,
    /// Quality metrics
    pub quality_metrics: QualityMetrics,
    /// Efficiency metrics
    pub efficiency_metrics: AttorneyEfficiencyMetrics,
    /// Client satisfaction
    pub client_satisfaction: f64,
    /// Peer ratings
    pub peer_ratings: f64,
    /// Overall performance score
    pub overall_score: f64,
    /// Last updated
    pub last_updated: DateTime<Utc>,
}

/// Quality metrics for attorneys
#[derive(Debug, Clone)]
pub struct QualityMetrics {
    /// Accuracy rate
    pub accuracy_rate: f64,
    /// Completeness score
    pub completeness_score: f64,
    /// Attention to detail
    pub attention_to_detail: f64,
    /// Legal analysis quality
    pub legal_analysis_quality: f64,
    /// Communication quality
    pub communication_quality: f64,
}

/// Efficiency metrics for attorneys
#[derive(Debug, Clone)]
pub struct AttorneyEfficiencyMetrics {
    /// Average turnaround time
    pub avg_turnaround_time: chrono::Duration,
    /// Productivity score
    pub productivity_score: f64,
    /// Resource utilization
    pub resource_utilization: f64,
    /// Rework rate
    pub rework_rate: f64,
    /// On-time delivery rate
    pub on_time_delivery_rate: f64,
}

/// Performance tracking configuration
#[derive(Debug)]
pub struct PerformanceTrackingConfig {
    /// Tracking frequency
    pub frequency: TrackingFrequency,
    /// Metrics to track
    pub tracked_metrics: Vec<String>,
    /// Reporting schedule
    pub reporting_schedule: ReportingSchedule,
    /// Alert thresholds
    pub alert_thresholds: HashMap<String, f64>,
}

/// Tracking frequency
#[derive(Debug)]
pub enum TrackingFrequency {
    RealTime,
    Daily,
    Weekly,
    Monthly,
    Quarterly,
}

/// Reporting schedule
#[derive(Debug)]
pub struct ReportingSchedule {
    /// Individual reports
    pub individual_reports: ReportFrequency,
    /// Team reports
    pub team_reports: ReportFrequency,
    /// Management reports
    pub management_reports: ReportFrequency,
    /// Benchmark reports
    pub benchmark_reports: ReportFrequency,
}

/// Report frequency
#[derive(Debug)]
pub enum ReportFrequency {
    Daily,
    Weekly,
    BiWeekly,
    Monthly,
    Quarterly,
    Annual,
    OnDemand,
}

/// Benchmark data
#[derive(Debug)]
pub struct BenchmarkData {
    /// Benchmark name
    pub name: String,
    /// Benchmark values
    pub values: HashMap<String, f64>,
    /// Industry averages
    pub industry_averages: HashMap<String, f64>,
    /// Best practices
    pub best_practices: HashMap<String, f64>,
    /// Last updated
    pub last_updated: DateTime<Utc>,
}

impl LegalWorkflow {
    /// Create new legal workflow
    pub fn new(
        document_id: Uuid,
        workflow_type: WorkflowType,
        priority: crate::WorkflowPriority,
        due_date: DateTime<Utc>,
    ) -> Self {
        Self {
            id: Uuid::new_v4(),
            document_id,
            workflow_type,
            status: WorkflowStatus::Created,
            assigned_attorney: None,
            created_at: Utc::now(),
            due_date,
            priority,
            stages: Vec::new(),
            metadata: HashMap::new(),
        }
    }
    
    /// Add stage to workflow
    pub fn add_stage(&mut self, stage: WorkflowStage) {
        self.stages.push(stage);
    }
    
    /// Update workflow status
    pub fn update_status(&mut self, status: WorkflowStatus) {
        self.status = status;
    }
    
    /// Assign attorney to workflow
    pub fn assign_attorney(&mut self, attorney_id: Uuid) {
        self.assigned_attorney = Some(attorney_id);
        if self.status == WorkflowStatus::Created {
            self.status = WorkflowStatus::Assigned;
        }
    }
    
    /// Get current stage
    pub fn current_stage(&self) -> Option<&WorkflowStage> {
        self.stages.iter().find(|stage| 
            matches!(stage.status, StageStatus::InProgress | StageStatus::Ready)
        )
    }
    
    /// Check if workflow is overdue
    pub fn is_overdue(&self) -> bool {
        Utc::now() > self.due_date && !matches!(self.status, WorkflowStatus::Completed | WorkflowStatus::Cancelled)
    }
    
    /// Get completion percentage
    pub fn completion_percentage(&self) -> f64 {
        if self.stages.is_empty() {
            return 0.0;
        }
        
        let completed_stages = self.stages.iter()
            .filter(|stage| stage.status == StageStatus::Completed)
            .count();
        
        (completed_stages as f64 / self.stages.len() as f64) * 100.0
    }
}

impl WorkflowStage {
    /// Create new workflow stage
    pub fn new(name: String, stage_type: StageType) -> Self {
        Self {
            id: Uuid::new_v4(),
            name,
            stage_type,
            status: StageStatus::Pending,
            assigned_reviewer: None,
            requirements: Vec::new(),
            outputs: Vec::new(),
            dependencies: Vec::new(),
            started_at: None,
            completed_at: None,
            duration_limit: None,
            notes: Vec::new(),
            approval_status: ApprovalStatus::NotRequired,
        }
    }
    
    /// Start stage
    pub fn start(&mut self) {
        self.status = StageStatus::InProgress;
        self.started_at = Some(Utc::now());
    }
    
    /// Complete stage
    pub fn complete(&mut self) {
        self.status = StageStatus::Completed;
        self.completed_at = Some(Utc::now());
    }
    
    /// Add requirement
    pub fn add_requirement(&mut self, requirement: StageRequirement) {
        self.requirements.push(requirement);
    }
    
    /// Add output
    pub fn add_output(&mut self, output: StageOutput) {
        self.outputs.push(output);
    }
    
    /// Add note
    pub fn add_note(&mut self, note: StageNote) {
        self.notes.push(note);
    }
    
    /// Check if all requirements are met
    pub fn requirements_met(&self) -> bool {
        self.requirements.iter()
            .filter(|req| req.required)
            .all(|req| req.completed)
    }
    
    /// Check if stage is ready to start
    pub fn ready_to_start(&self) -> bool {
        self.status == StageStatus::Pending && 
        self.dependencies.is_empty() // Simplified - would check actual dependencies
    }
    
    /// Get stage duration
    pub fn duration(&self) -> Option<chrono::Duration> {
        match (self.started_at, self.completed_at) {
            (Some(start), Some(end)) => Some(end - start),
            (Some(start), None) => Some(Utc::now() - start),
            _ => None,
        }
    }
    
    /// Check if stage is overdue
    pub fn is_overdue(&self) -> bool {
        if let (Some(duration_limit), Some(started_at)) = (self.duration_limit, self.started_at) {
            Utc::now() > started_at + duration_limit
        } else {
            false
        }
    }
}

impl AttorneyReview {
    /// Create new attorney review
    pub fn new(
        document_id: Uuid,
        attorney_id: Uuid,
        review_type: ReviewType,
    ) -> Self {
        Self {
            id: Uuid::new_v4(),
            document_id,
            attorney_id,
            review_type,
            status: ReviewStatus::Assigned,
            criteria: Vec::new(),
            findings: Vec::new(),
            recommendations: Vec::new(),
            timeline: ReviewTimeline {
                assigned: Utc::now(),
                started: None,
                completed: None,
                original_due_date: Utc::now() + chrono::Duration::days(7),
                current_due_date: Utc::now() + chrono::Duration::days(7),
                extensions: Vec::new(),
                milestones: Vec::new(),
            },
            quality_metrics: ReviewQualityMetrics {
                thoroughness: 0.0,
                accuracy: 0.0,
                timeliness: 0.0,
                completeness: 0.0,
                overall_quality: 0.0,
                efficiency_metrics: EfficiencyMetrics {
                    time_per_page: chrono::Duration::minutes(5),
                    issues_per_hour: 0.0,
                    recommendations_per_hour: 0.0,
                    rework_rate: 0.0,
                },
                quality_indicators: Vec::new(),
            },
        }
    }
    
    /// Start review
    pub fn start(&mut self) {
        self.status = ReviewStatus::InProgress;
        self.timeline.started = Some(Utc::now());
    }
    
    /// Complete review
    pub fn complete(&mut self) {
        self.status = ReviewStatus::Completed;
        self.timeline.completed = Some(Utc::now());
        self.calculate_quality_metrics();
    }
    
    /// Add finding
    pub fn add_finding(&mut self, finding: ReviewFinding) {
        self.findings.push(finding);
    }
    
    /// Add recommendation
    pub fn add_recommendation(&mut self, recommendation: ReviewRecommendation) {
        self.recommendations.push(recommendation);
    }
    
    /// Calculate quality metrics
    fn calculate_quality_metrics(&mut self) {
        // Simplified quality calculation
        let completion_ratio = if self.criteria.is_empty() {
            1.0
        } else {
            self.criteria.iter()
                .filter(|c| matches!(c.evaluation_status, EvaluationStatus::Satisfactory | EvaluationStatus::Exceptional))
                .count() as f64 / self.criteria.len() as f64
        };
        
        self.quality_metrics.completeness = completion_ratio * 100.0;
        
        // Calculate timeliness
        if let (Some(started), Some(completed)) = (self.timeline.started, self.timeline.completed) {
            let actual_duration = completed - started;
            let expected_duration = self.timeline.current_due_date - self.timeline.assigned;
            
            self.quality_metrics.timeliness = if actual_duration <= expected_duration {
                100.0
            } else {
                std::cmp::max(0, 100 - ((actual_duration.num_minutes() - expected_duration.num_minutes()) * 100 / expected_duration.num_minutes()) as i64) as f64
            };
        }
        
        // Overall quality (simplified)
        self.quality_metrics.overall_quality = (
            self.quality_metrics.thoroughness +
            self.quality_metrics.accuracy +
            self.quality_metrics.timeliness +
            self.quality_metrics.completeness
        ) / 4.0;
    }
    
    /// Check if review is overdue
    pub fn is_overdue(&self) -> bool {
        Utc::now() > self.timeline.current_due_date && 
        !matches!(self.status, ReviewStatus::Completed | ReviewStatus::Approved)
    }
    
    /// Get review progress percentage
    pub fn progress_percentage(&self) -> f64 {
        if self.criteria.is_empty() {
            return if matches!(self.status, ReviewStatus::Completed | ReviewStatus::Approved) { 100.0 } else { 0.0 };
        }
        
        let evaluated = self.criteria.iter()
            .filter(|c| !matches!(c.evaluation_status, EvaluationStatus::NotEvaluated))
            .count();
        
        (evaluated as f64 / self.criteria.len() as f64) * 100.0
    }
}