"""
TerraFusion cOS 2.0 - Data Models
MIT PhD Systems Design Engineer Standards
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class SubscriptionTier(str, Enum):
    BASIC = "basic"
    PROFESSIONAL = "professional"
    ENTERPRISE = "enterprise"

class VendorStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING = "pending"

class AgentStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    DEPLOYING = "deploying"
    ERROR = "error"

class SyncStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SYNCING = "syncing"
    ERROR = "error"
    PAUSED = "paused"

class WorkflowStatus(str, Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    DRAFT = "draft"
    ERROR = "error"

class ExecutionStatus(str, Enum):
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class ComplianceStatus(str, Enum):
    COMPLIANT = "compliant"
    NON_COMPLIANT = "non_compliant"
    PENDING = "pending"
    ERROR = "error"

# Vendor Models
class Vendor(BaseModel):
    vendor_id: str = Field(..., description="Unique vendor identifier")
    vendor_name: str = Field(..., description="Vendor name")
    vendor_type: str = Field(..., description="Type of vendor")
    contact_email: str = Field(..., description="Contact email address")
    contact_phone: Optional[str] = Field(None, description="Contact phone number")
    subscription_tier: SubscriptionTier = Field(..., description="Subscription tier")
    status: VendorStatus = Field(..., description="Vendor status")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update timestamp")
    last_activity: Optional[datetime] = Field(None, description="Last activity timestamp")
    
    class Config:
        use_enum_values = True

class VendorMetrics(BaseModel):
    vendor_id: str = Field(..., description="Vendor identifier")
    total_integrations: int = Field(..., description="Total number of integrations")
    active_integrations: int = Field(..., description="Number of active integrations")
    data_volume_processed: float = Field(..., description="Data volume processed (GB)")
    api_calls_today: int = Field(..., description="API calls made today")
    success_rate: float = Field(..., description="Success rate percentage")
    uptime: float = Field(..., description="System uptime percentage")

# AI Swarm Models
class Agent(BaseModel):
    id: str = Field(..., description="Unique agent identifier")
    agent_type: str = Field(..., description="Type of agent")
    hierarchy_level: int = Field(..., description="Hierarchy level (1-3)")
    status: AgentStatus = Field(..., description="Agent status")
    capabilities: Dict[str, Any] = Field(default_factory=dict, description="Agent capabilities")
    performance_metrics: Dict[str, Any] = Field(default_factory=dict, description="Performance metrics")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update timestamp")
    
    class Config:
        use_enum_values = True

class Task(BaseModel):
    id: str = Field(..., description="Unique task identifier")
    agent_id: str = Field(..., description="Assigned agent identifier")
    task_type: str = Field(..., description="Type of task")
    status: str = Field(..., description="Task status")
    input_data: Dict[str, Any] = Field(default_factory=dict, description="Input data")
    output_data: Dict[str, Any] = Field(default_factory=dict, description="Output data")
    started_at: Optional[datetime] = Field(None, description="Task start timestamp")
    completed_at: Optional[datetime] = Field(None, description="Task completion timestamp")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")

# CostForge Models
class FinancialMetric(BaseModel):
    id: str = Field(..., description="Unique metric identifier")
    vendor_id: str = Field(..., description="Vendor identifier")
    metric_type: str = Field(..., description="Type of financial metric")
    value: float = Field(..., description="Metric value")
    currency: str = Field(default="USD", description="Currency code")
    period_start: datetime = Field(..., description="Period start date")
    period_end: datetime = Field(..., description="Period end date")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")

class OptimizationRecommendation(BaseModel):
    id: str = Field(..., description="Unique recommendation identifier")
    vendor_id: str = Field(..., description="Vendor identifier")
    recommendation_type: str = Field(..., description="Type of recommendation")
    title: str = Field(..., description="Recommendation title")
    description: str = Field(..., description="Recommendation description")
    potential_savings: float = Field(..., description="Potential savings amount")
    confidence_score: float = Field(..., description="Confidence score (0-1)")
    status: str = Field(default="pending", description="Recommendation status")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")

# Sync Models
class DataSource(BaseModel):
    id: str = Field(..., description="Unique data source identifier")
    vendor_id: str = Field(..., description="Vendor identifier")
    source_name: str = Field(..., description="Data source name")
    source_type: str = Field(..., description="Type of data source")
    connection_config: Dict[str, Any] = Field(default_factory=dict, description="Connection configuration")
    sync_frequency: int = Field(default=300, description="Sync frequency in seconds")
    last_sync: Optional[datetime] = Field(None, description="Last sync timestamp")
    status: SyncStatus = Field(..., description="Data source status")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    
    class Config:
        use_enum_values = True

class SyncLog(BaseModel):
    id: str = Field(..., description="Unique sync log identifier")
    source_id: str = Field(..., description="Data source identifier")
    sync_type: str = Field(..., description="Type of sync operation")
    records_processed: int = Field(default=0, description="Number of records processed")
    records_successful: int = Field(default=0, description="Number of successful records")
    records_failed: int = Field(default=0, description="Number of failed records")
    error_details: Optional[Dict[str, Any]] = Field(None, description="Error details")
    started_at: datetime = Field(default_factory=datetime.utcnow, description="Sync start timestamp")
    completed_at: Optional[datetime] = Field(None, description="Sync completion timestamp")

# Flow Models
class Workflow(BaseModel):
    id: str = Field(..., description="Unique workflow identifier")
    vendor_id: str = Field(..., description="Vendor identifier")
    workflow_name: str = Field(..., description="Workflow name")
    workflow_definition: Dict[str, Any] = Field(..., description="Workflow definition")
    status: WorkflowStatus = Field(..., description="Workflow status")
    version: int = Field(default=1, description="Workflow version")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update timestamp")
    
    class Config:
        use_enum_values = True

class WorkflowExecution(BaseModel):
    id: str = Field(..., description="Unique execution identifier")
    workflow_id: str = Field(..., description="Workflow identifier")
    execution_status: ExecutionStatus = Field(..., description="Execution status")
    input_data: Dict[str, Any] = Field(default_factory=dict, description="Input data")
    output_data: Dict[str, Any] = Field(default_factory=dict, description="Output data")
    started_at: datetime = Field(default_factory=datetime.utcnow, description="Execution start timestamp")
    completed_at: Optional[datetime] = Field(None, description="Execution completion timestamp")
    error_details: Optional[Dict[str, Any]] = Field(None, description="Error details")
    
    class Config:
        use_enum_values = True

# Security Models
class ComplianceCheck(BaseModel):
    id: str = Field(..., description="Unique compliance check identifier")
    vendor_id: str = Field(..., description="Vendor identifier")
    check_type: str = Field(..., description="Type of compliance check")
    standard: str = Field(..., description="Compliance standard")
    status: ComplianceStatus = Field(..., description="Compliance status")
    details: Dict[str, Any] = Field(default_factory=dict, description="Compliance details")
    checked_at: datetime = Field(default_factory=datetime.utcnow, description="Check timestamp")
    
    class Config:
        use_enum_values = True

class AuditLog(BaseModel):
    id: str = Field(..., description="Unique audit log identifier")
    vendor_id: str = Field(..., description="Vendor identifier")
    user_id: Optional[str] = Field(None, description="User identifier")
    action: str = Field(..., description="Action performed")
    resource_type: Optional[str] = Field(None, description="Resource type")
    resource_id: Optional[str] = Field(None, description="Resource identifier")
    details: Dict[str, Any] = Field(default_factory=dict, description="Action details")
    ip_address: Optional[str] = Field(None, description="IP address")
    user_agent: Optional[str] = Field(None, description="User agent")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")

# Integration Models
class Integration(BaseModel):
    id: str = Field(..., description="Unique integration identifier")
    vendor_id: str = Field(..., description="Vendor identifier")
    integration_name: str = Field(..., description="Integration name")
    integration_type: str = Field(..., description="Type of integration")
    configuration: Dict[str, Any] = Field(default_factory=dict, description="Integration configuration")
    status: str = Field(..., description="Integration status")
    last_sync: Optional[datetime] = Field(None, description="Last sync timestamp")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")

# API Response Models
class APIResponse(BaseModel):
    status: str = Field(..., description="Response status")
    message: Optional[str] = Field(None, description="Response message")
    data: Optional[Dict[str, Any]] = Field(None, description="Response data")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Response timestamp")

class ErrorResponse(BaseModel):
    status: str = Field(default="error", description="Error status")
    error_code: str = Field(..., description="Error code")
    message: str = Field(..., description="Error message")
    details: Optional[Dict[str, Any]] = Field(None, description="Error details")
    request_id: Optional[str] = Field(None, description="Request identifier")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Error timestamp")

# Health Check Models
class HealthCheck(BaseModel):
    status: str = Field(..., description="Health status")
    services: Dict[str, str] = Field(..., description="Service health status")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Health check timestamp")
    version: str = Field(default="2.0.0", description="API version")

# Metrics Models
class SystemMetrics(BaseModel):
    total_vendors: int = Field(..., description="Total number of vendors")
    active_vendors: int = Field(..., description="Number of active vendors")
    total_integrations: int = Field(..., description="Total number of integrations")
    active_integrations: int = Field(..., description="Number of active integrations")
    total_api_calls: int = Field(..., description="Total API calls")
    average_response_time: float = Field(..., description="Average response time in milliseconds")
    system_uptime: float = Field(..., description="System uptime percentage")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Metrics timestamp")
