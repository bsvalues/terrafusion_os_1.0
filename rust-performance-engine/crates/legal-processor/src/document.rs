//! Legal Document Management
//! 
//! Comprehensive document management system for legal operations including
//! document classification, metadata extraction, and content analysis.

use std::collections::HashMap;
use std::path::Path;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

/// Legal document representation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LegalDocument {
    /// Unique document identifier
    pub id: Uuid,
    /// Document title
    pub title: String,
    /// Document type classification
    pub document_type: DocumentType,
    /// Document content
    pub content: String,
    /// Document metadata
    pub metadata: DocumentMetadata,
    /// Privilege level
    pub privilege_level: PrivilegeLevel,
    /// Security classification
    pub security_classification: SecurityClassification,
    /// Document status
    pub status: DocumentStatus,
    /// Creation timestamp
    pub created_at: DateTime<Utc>,
    /// Last modified timestamp
    pub modified_at: DateTime<Utc>,
    /// Document version
    pub version: u32,
    /// File path (if applicable)
    pub file_path: Option<String>,
    /// File hash for integrity
    pub file_hash: Option<String>,
    /// Document size in bytes
    pub size_bytes: u64,
    /// Associated case numbers
    pub case_numbers: Vec<String>,
    /// Document tags
    pub tags: Vec<String>,
    /// Related document IDs
    pub related_documents: Vec<Uuid>,
    /// Retention requirements
    pub retention_requirements: RetentionRequirements,
}

/// Document types for legal classification
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum DocumentType {
    // Court Documents
    Complaint,
    Answer,
    Motion,
    Brief,
    Order,
    Judgment,
    Subpoena,
    Deposition,
    
    // Contract Documents
    Contract,
    Amendment,
    Addendum,
    ServiceAgreement,
    NDA,
    LicenseAgreement,
    
    // Corporate Documents
    Articles,
    Bylaws,
    Resolution,
    ShareholderAgreement,
    BoardMinutes,
    
    // Government Documents
    Statute,
    Regulation,
    OrdinanceDocument,
    Policy,
    Procedure,
    
    // Legal Memos and Communications
    LegalMemo,
    LegalOpinion,
    AttorneyLetter,
    ClientCommunication,
    
    // FOIA Related
    FOIARequest,
    FOIAResponse,
    FOIAAppeal,
    
    // Administrative
    Invoice,
    Retainer,
    Correspondence,
    Research,
    
    // Evidence
    Evidence,
    Exhibit,
    WitnessStatement,
    ExpertReport,
    
    // Custom document type
    Custom(String),
}

/// Document metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentMetadata {
    /// Document author
    pub author: String,
    /// Authoring organization
    pub organization: String,
    /// Document subject
    pub subject: Option<String>,
    /// Keywords
    pub keywords: Vec<String>,
    /// Document language
    pub language: String,
    /// Document format (PDF, DOCX, etc.)
    pub format: DocumentFormat,
    /// Original creation date
    pub original_creation_date: Option<DateTime<Utc>>,
    /// Document jurisdiction
    pub jurisdiction: Option<String>,
    /// Court information (if applicable)
    pub court_info: Option<CourtInfo>,
    /// Case information
    pub case_info: Option<CaseInfo>,
    /// Client information
    pub client_info: Option<ClientInfo>,
    /// Attorney information
    pub attorney_info: Option<AttorneyInfo>,
    /// Document properties
    pub properties: HashMap<String, String>,
}

/// Document formats
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DocumentFormat {
    PDF,
    DOC,
    DOCX,
    RTF,
    TXT,
    HTML,
    XML,
    JSON,
    CSV,
    Email,
    Image(ImageFormat),
    Unknown,
}

/// Image formats
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ImageFormat {
    JPEG,
    PNG,
    TIFF,
    GIF,
    BMP,
}

/// Court information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CourtInfo {
    /// Court name
    pub court_name: String,
    /// Court jurisdiction
    pub jurisdiction: String,
    /// Judge name
    pub judge_name: Option<String>,
    /// Court case number
    pub case_number: String,
    /// Filing date
    pub filing_date: Option<DateTime<Utc>>,
}

/// Case information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CaseInfo {
    /// Case number
    pub case_number: String,
    /// Case title
    pub case_title: String,
    /// Case type
    pub case_type: CaseType,
    /// Case status
    pub case_status: CaseStatus,
    /// Parties involved
    pub parties: Vec<Party>,
    /// Case opened date
    pub opened_date: DateTime<Utc>,
    /// Case closed date
    pub closed_date: Option<DateTime<Utc>>,
}

/// Case types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CaseType {
    Civil,
    Criminal,
    Administrative,
    Constitutional,
    Contract,
    Tort,
    Family,
    Employment,
    Environmental,
    Intellectual,
    Other(String),
}

/// Case status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CaseStatus {
    Open,
    Closed,
    Pending,
    Appeal,
    Settled,
    Dismissed,
    OnHold,
}

/// Party in a legal case
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Party {
    /// Party name
    pub name: String,
    /// Party type
    pub party_type: PartyType,
    /// Party role
    pub role: PartyRole,
    /// Contact information
    pub contact_info: Option<ContactInfo>,
}

/// Party types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PartyType {
    Individual,
    Corporation,
    Government,
    NonProfit,
    Partnership,
    LLC,
    Other(String),
}

/// Party roles
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PartyRole {
    Plaintiff,
    Defendant,
    Respondent,
    Petitioner,
    Appellant,
    Appellee,
    ThirdParty,
    Intervenor,
    Witness,
    Expert,
}

/// Contact information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContactInfo {
    /// Email address
    pub email: Option<String>,
    /// Phone number
    pub phone: Option<String>,
    /// Mailing address
    pub address: Option<Address>,
}

/// Address information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Address {
    /// Street address
    pub street: String,
    /// City
    pub city: String,
    /// State or province
    pub state: String,
    /// ZIP or postal code
    pub zip_code: String,
    /// Country
    pub country: String,
}

/// Client information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClientInfo {
    /// Client identifier
    pub client_id: Uuid,
    /// Client name
    pub name: String,
    /// Client type
    pub client_type: ClientType,
    /// Matter number
    pub matter_number: Option<String>,
    /// Billing information
    pub billing_info: Option<BillingInfo>,
}

/// Client types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ClientType {
    Individual,
    Business,
    Government,
    NonProfit,
    Other(String),
}

/// Billing information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BillingInfo {
    /// Billing contact
    pub billing_contact: String,
    /// Billing address
    pub billing_address: Address,
    /// Rate structure
    pub rate_structure: RateStructure,
}

/// Rate structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RateStructure {
    Hourly(f64),
    Flat(f64),
    Contingency(f64),
    Retainer(f64),
    Custom(String),
}

/// Attorney information referenced in document
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AttorneyInfo {
    /// Attorney identifier
    pub attorney_id: Uuid,
    /// Attorney name
    pub name: String,
    /// Bar number
    pub bar_number: String,
    /// State bar
    pub state_bar: String,
    /// Law firm
    pub law_firm: Option<String>,
    /// Role in this document
    pub role: AttorneyRole,
}

/// Attorney roles in documents
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AttorneyRole {
    Author,
    Reviewer,
    Counsel,
    OpposingCounsel,
    Consultant,
    Expert,
}

/// Privilege levels for legal documents
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, PartialOrd, Ord)]
pub enum PrivilegeLevel {
    /// No privilege protection
    Public,
    /// Work product privilege
    WorkProduct,
    /// Attorney-client privilege
    AttorneyClient,
    /// Executive privilege
    Executive,
    /// Deliberative process privilege
    Deliberative,
    /// Law enforcement privilege
    LawEnforcement,
}

/// Security classification levels
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, PartialOrd, Ord)]
pub enum SecurityClassification {
    /// Public information
    Public,
    /// For official use only
    FOUO,
    /// Sensitive but unclassified
    SBU,
    /// Confidential
    Confidential,
    /// Secret
    Secret,
    /// Top Secret
    TopSecret,
}

/// Document status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DocumentStatus {
    Draft,
    Review,
    Approved,
    Filed,
    Archived,
    Sealed,
    Redacted,
    Destroyed,
}

/// Retention requirements
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RetentionRequirements {
    /// Retention period in years
    pub retention_years: u32,
    /// Legal hold flag
    pub legal_hold: bool,
    /// Disposition method
    pub disposition_method: DispositionMethod,
    /// Compliance requirements
    pub compliance_requirements: Vec<ComplianceRequirement>,
}

/// Disposition methods
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DispositionMethod {
    SecureDeletion,
    Archive,
    Transfer,
    PermanentRetention,
}

/// Compliance requirements
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComplianceRequirement {
    /// Requirement name
    pub name: String,
    /// Regulatory framework
    pub framework: RegulatoryFramework,
    /// Specific requirements
    pub requirements: Vec<String>,
}

/// Regulatory frameworks
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RegulatoryFramework {
    FOIA,
    PrivacyAct,
    HIPAA,
    SOX,
    GDPR,
    StateRecords,
    Custom(String),
}

impl LegalDocument {
    /// Create a new legal document
    pub fn new(
        title: String,
        document_type: DocumentType,
        content: String,
        author: String,
    ) -> Self {
        let content_length = content.len() as u64;
        let now = Utc::now();
        
        Self {
            id: Uuid::new_v4(),
            title,
            document_type,
            content,
            metadata: DocumentMetadata {
                author,
                organization: String::new(),
                subject: None,
                keywords: Vec::new(),
                language: "en".to_string(),
                format: DocumentFormat::TXT,
                original_creation_date: Some(now),
                jurisdiction: None,
                court_info: None,
                case_info: None,
                client_info: None,
                attorney_info: None,
                properties: HashMap::new(),
            },
            privilege_level: PrivilegeLevel::Public,
            security_classification: SecurityClassification::Public,
            status: DocumentStatus::Draft,
            created_at: now,
            modified_at: now,
            version: 1,
            file_path: None,
            file_hash: None,
            size_bytes: content_length,
            case_numbers: Vec::new(),
            tags: Vec::new(),
            related_documents: Vec::new(),
            retention_requirements: RetentionRequirements {
                retention_years: 7, // Default legal retention
                legal_hold: false,
                disposition_method: DispositionMethod::Archive,
                compliance_requirements: Vec::new(),
            },
        }
    }
    
    /// Load document from file
    pub async fn load_from_file(
        file_path: &Path,
        document_type: DocumentType,
    ) -> Result<Self, DocumentError> {
        let content = tokio::fs::read_to_string(file_path)
            .await
            .map_err(|e| DocumentError::FileReadError(e.to_string()))?;
        
        let file_name = file_path
            .file_name()
            .and_then(|name| name.to_str())
            .unwrap_or("Unknown")
            .to_string();
        
        let mut document = Self::new(
            file_name,
            document_type,
            content,
            "System".to_string(),
        );
        
        document.file_path = Some(file_path.to_string_lossy().to_string());
        document.metadata.format = Self::detect_format(file_path);
        
        // Calculate file hash for integrity
        document.file_hash = Some(Self::calculate_hash(&document.content));
        
        Ok(document)
    }
    
    /// Update document content
    pub fn update_content(&mut self, new_content: String) {
        self.content = new_content;
        self.modified_at = Utc::now();
        self.version += 1;
        self.size_bytes = self.content.len() as u64;
        self.file_hash = Some(Self::calculate_hash(&self.content));
    }
    
    /// Add tag to document
    pub fn add_tag(&mut self, tag: String) {
        if !self.tags.contains(&tag) {
            self.tags.push(tag);
            self.modified_at = Utc::now();
        }
    }
    
    /// Remove tag from document
    pub fn remove_tag(&mut self, tag: &str) {
        if let Some(pos) = self.tags.iter().position(|t| t == tag) {
            self.tags.remove(pos);
            self.modified_at = Utc::now();
        }
    }
    
    /// Add related document
    pub fn add_related_document(&mut self, document_id: Uuid) {
        if !self.related_documents.contains(&document_id) {
            self.related_documents.push(document_id);
            self.modified_at = Utc::now();
        }
    }
    
    /// Set privilege level
    pub fn set_privilege_level(&mut self, privilege: PrivilegeLevel) {
        self.privilege_level = privilege;
        self.modified_at = Utc::now();
    }
    
    /// Set security classification
    pub fn set_security_classification(&mut self, classification: SecurityClassification) {
        self.security_classification = classification;
        self.modified_at = Utc::now();
    }
    
    /// Update document status
    pub fn update_status(&mut self, status: DocumentStatus) {
        self.status = status;
        self.modified_at = Utc::now();
    }
    
    /// Check if document requires attorney review
    pub fn requires_attorney_review(&self) -> bool {
        matches!(
            self.privilege_level,
            PrivilegeLevel::AttorneyClient | PrivilegeLevel::WorkProduct
        ) || matches!(
            self.security_classification,
            SecurityClassification::Confidential
                | SecurityClassification::Secret
                | SecurityClassification::TopSecret
        )
    }
    
    /// Get document summary
    pub fn get_summary(&self) -> DocumentSummary {
        DocumentSummary {
            id: self.id,
            title: self.title.clone(),
            document_type: self.document_type.clone(),
            privilege_level: self.privilege_level.clone(),
            security_classification: self.security_classification.clone(),
            status: self.status.clone(),
            created_at: self.created_at,
            modified_at: self.modified_at,
            version: self.version,
            size_bytes: self.size_bytes,
            author: self.metadata.author.clone(),
        }
    }
    
    // Private helper methods
    
    fn detect_format(file_path: &Path) -> DocumentFormat {
        match file_path.extension().and_then(|ext| ext.to_str()) {
            Some("pdf") => DocumentFormat::PDF,
            Some("doc") => DocumentFormat::DOC,
            Some("docx") => DocumentFormat::DOCX,
            Some("rtf") => DocumentFormat::RTF,
            Some("txt") => DocumentFormat::TXT,
            Some("html") | Some("htm") => DocumentFormat::HTML,
            Some("xml") => DocumentFormat::XML,
            Some("json") => DocumentFormat::JSON,
            Some("csv") => DocumentFormat::CSV,
            Some("jpg") | Some("jpeg") => DocumentFormat::Image(ImageFormat::JPEG),
            Some("png") => DocumentFormat::Image(ImageFormat::PNG),
            Some("tiff") | Some("tif") => DocumentFormat::Image(ImageFormat::TIFF),
            Some("gif") => DocumentFormat::Image(ImageFormat::GIF),
            Some("bmp") => DocumentFormat::Image(ImageFormat::BMP),
            _ => DocumentFormat::Unknown,
        }
    }
    
    fn calculate_hash(content: &str) -> String {
        use sha2::{Sha256, Digest};
        let mut hasher = Sha256::new();
        hasher.update(content.as_bytes());
        format!("{:x}", hasher.finalize())
    }
}

/// Document summary for listing and overview
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentSummary {
    pub id: Uuid,
    pub title: String,
    pub document_type: DocumentType,
    pub privilege_level: PrivilegeLevel,
    pub security_classification: SecurityClassification,
    pub status: DocumentStatus,
    pub created_at: DateTime<Utc>,
    pub modified_at: DateTime<Utc>,
    pub version: u32,
    pub size_bytes: u64,
    pub author: String,
}

/// Document search criteria
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentSearchCriteria {
    /// Text search query
    pub query: Option<String>,
    /// Document types to include
    pub document_types: Vec<DocumentType>,
    /// Privilege levels to include
    pub privilege_levels: Vec<PrivilegeLevel>,
    /// Security classifications to include
    pub security_classifications: Vec<SecurityClassification>,
    /// Date range filter
    pub date_range: Option<DateRange>,
    /// Author filter
    pub author: Option<String>,
    /// Case number filter
    pub case_numbers: Vec<String>,
    /// Tag filters
    pub tags: Vec<String>,
    /// Maximum results
    pub limit: Option<usize>,
    /// Result offset
    pub offset: Option<usize>,
}

/// Date range for filtering
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DateRange {
    pub start: DateTime<Utc>,
    pub end: DateTime<Utc>,
}

/// Document search results
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentSearchResults {
    /// Matching documents
    pub documents: Vec<DocumentSummary>,
    /// Total count (may be larger than returned results)
    pub total_count: usize,
    /// Search query
    pub query: DocumentSearchCriteria,
    /// Search execution time
    pub execution_time: chrono::Duration,
}

/// Document error types
#[derive(Debug, thiserror::Error)]
pub enum DocumentError {
    #[error("File read error: {0}")]
    FileReadError(String),
    
    #[error("Parse error: {0}")]
    ParseError(String),
    
    #[error("Validation error: {0}")]
    ValidationError(String),
    
    #[error("Permission denied: {0}")]
    PermissionDenied(String),
    
    #[error("Document not found: {0}")]
    NotFound(String),
    
    #[error("Document already exists: {0}")]
    AlreadyExists(String),
    
    #[error("Invalid document state: {0}")]
    InvalidState(String),
    
    #[error("Storage error: {0}")]
    StorageError(String),
}

impl Default for DocumentSearchCriteria {
    fn default() -> Self {
        Self {
            query: None,
            document_types: Vec::new(),
            privilege_levels: Vec::new(),
            security_classifications: Vec::new(),
            date_range: None,
            author: None,
            case_numbers: Vec::new(),
            tags: Vec::new(),
            limit: Some(100),
            offset: Some(0),
        }
    }
}