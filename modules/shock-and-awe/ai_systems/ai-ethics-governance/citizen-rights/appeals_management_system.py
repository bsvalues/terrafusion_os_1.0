#!/usr/bin/env python3
"""
AI Decision Appeals Management System
Comprehensive system for managing citizen appeals of AI-driven government decisions
"""

import sqlite3
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import logging
import smtplib
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart
import hashlib
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AppealStatus(Enum):
    """Appeal status enumeration"""
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    ADDITIONAL_INFO_REQUIRED = "additional_info_required"
    HUMAN_REVIEW_ASSIGNED = "human_review_assigned"
    ETHICS_COMMITTEE_REVIEW = "ethics_committee_review"
    RESOLVED_GRANTED = "resolved_granted"
    RESOLVED_DENIED = "resolved_denied"
    RESOLVED_PARTIAL = "resolved_partial"
    CLOSED = "closed"
    ESCALATED_EXTERNAL = "escalated_external"

class AppealPriority(Enum):
    """Appeal priority levels"""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"
    CRITICAL = "critical"

class ReviewLevel(Enum):
    """Review level enumeration"""
    INFORMAL = "informal"
    FORMAL_ADMINISTRATIVE = "formal_administrative"
    ETHICS_COMMITTEE = "ethics_committee"
    EXTERNAL_REVIEW = "external_review"

@dataclass
class Appellant:
    """Appellant information"""
    citizen_id: str
    name: str
    email: str
    phone: str
    address: str
    language_preference: str = "en"
    accessibility_needs: Optional[str] = None
    representative_info: Optional[Dict[str, str]] = None

@dataclass
class AIDecision:
    """AI decision being appealed"""
    decision_id: str
    decision_type: str
    decision_date: datetime
    ai_system_name: str
    decision_value: Any
    confidence_score: float
    factors_considered: List[Dict[str, Any]]
    original_explanation: str

@dataclass
class Appeal:
    """Appeal data structure"""
    appeal_id: str
    appellant: Appellant
    ai_decision: AIDecision
    grounds_for_appeal: List[str]
    description: str
    supporting_evidence: List[Dict[str, Any]]
    desired_outcome: str
    submission_date: datetime
    status: AppealStatus
    priority: AppealPriority
    review_level: ReviewLevel
    assigned_reviewer: Optional[str] = None
    timeline_days: int = 20
    due_date: Optional[datetime] = None
    resolution: Optional[Dict[str, Any]] = None
    communication_log: List[Dict[str, Any]] = None

    def __post_init__(self):
        if self.communication_log is None:
            self.communication_log = []
        if self.due_date is None:
            self.due_date = self.submission_date + timedelta(days=self.timeline_days)

class AppealsManagementSystem:
    """Comprehensive appeals management system"""
    
    def __init__(self, db_path: str = "appeals.db", config: Dict[str, Any] = None):
        self.db_path = db_path
        self.config = config or {}
        self.initialize_database()
    
    def initialize_database(self):
        """Initialize SQLite database for appeals management"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Appeals table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS appeals (
                appeal_id TEXT PRIMARY KEY,
                appellant_data TEXT,
                ai_decision_data TEXT,
                grounds_for_appeal TEXT,
                description TEXT,
                supporting_evidence TEXT,
                desired_outcome TEXT,
                submission_date DATETIME,
                status TEXT,
                priority TEXT,
                review_level TEXT,
                assigned_reviewer TEXT,
                timeline_days INTEGER,
                due_date DATETIME,
                resolution TEXT,
                communication_log TEXT
            )
        ''')
        
        # Reviewers table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS reviewers (
                reviewer_id TEXT PRIMARY KEY,
                name TEXT,
                email TEXT,
                specializations TEXT,
                current_caseload INTEGER DEFAULT 0,
                max_caseload INTEGER DEFAULT 10,
                availability_status TEXT DEFAULT 'available'
            )
        ''')
        
        # Appeal communications table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS communications (
                comm_id TEXT PRIMARY KEY,
                appeal_id TEXT,
                sender TEXT,
                recipient TEXT,
                message_type TEXT,
                subject TEXT,
                content TEXT,
                timestamp DATETIME,
                read_status BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (appeal_id) REFERENCES appeals (appeal_id)
            )
        ''')
        
        # Appeal outcomes tracking
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS appeal_outcomes (
                outcome_id TEXT PRIMARY KEY,
                appeal_id TEXT,
                original_decision_value TEXT,
                revised_decision_value TEXT,
                outcome_type TEXT,
                financial_impact REAL,
                systemic_changes_required BOOLEAN,
                lessons_learned TEXT,
                timestamp DATETIME,
                FOREIGN KEY (appeal_id) REFERENCES appeals (appeal_id)
            )
        ''')
        
        conn.commit()
        conn.close()
        logger.info("Appeals database initialized successfully")
    
    def submit_appeal(self, appellant: Appellant, ai_decision: AIDecision,
                     grounds: List[str], description: str, evidence: List[Dict[str, Any]],
                     desired_outcome: str) -> str:
        """Submit a new appeal"""
        try:
            appeal_id = self.generate_appeal_id()
            
            # Determine priority and review level
            priority = self.calculate_appeal_priority(ai_decision, grounds)
            review_level = self.determine_review_level(grounds, priority)
            
            # Create appeal object
            appeal = Appeal(
                appeal_id=appeal_id,
                appellant=appellant,
                ai_decision=ai_decision,
                grounds_for_appeal=grounds,
                description=description,
                supporting_evidence=evidence,
                desired_outcome=desired_outcome,
                submission_date=datetime.now(),
                status=AppealStatus.SUBMITTED,
                priority=priority,
                review_level=review_level
            )
            
            # Save to database
            self.save_appeal(appeal)
            
            # Send confirmation to appellant
            self.send_confirmation_email(appeal)
            
            # Assign reviewer if needed
            if review_level != ReviewLevel.INFORMAL:
                self.assign_reviewer(appeal)
            
            # Log initial communication
            self.log_communication(
                appeal_id, "system", appellant.email,
                "appeal_confirmation",
                "Appeal Submitted Successfully",
                f"Your appeal {appeal_id} has been submitted and will be reviewed."
            )
            
            logger.info(f"Appeal {appeal_id} submitted successfully")
            return appeal_id
            
        except Exception as e:
            logger.error(f"Failed to submit appeal: {e}")
            raise
    
    def generate_appeal_id(self) -> str:
        """Generate unique appeal ID"""
        timestamp = datetime.now().strftime("%Y%m%d")
        random_suffix = str(uuid.uuid4())[:8].upper()
        return f"APP-{timestamp}-{random_suffix}"
    
    def calculate_appeal_priority(self, ai_decision: AIDecision, grounds: List[str]) -> AppealPriority:
        """Calculate appeal priority based on decision and grounds"""
        priority_score = 0
        
        # High-impact decision types
        high_impact_types = ['property_assessment', 'benefit_determination', 'permit_approval']
        if ai_decision.decision_type in high_impact_types:
            priority_score += 2
        
        # High-value decisions
        if hasattr(ai_decision.decision_value, '__float__'):
            value = float(ai_decision.decision_value)
            if value > 500000:  # High-value property assessments
                priority_score += 3
            elif value > 100000:
                priority_score += 2
            elif value > 50000:
                priority_score += 1
        
        # Serious grounds for appeal
        serious_grounds = ['discrimination', 'bias', 'procedural_error', 'data_error']
        if any(ground in serious_grounds for ground in grounds):
            priority_score += 3
        
        # Low confidence AI decisions
        if ai_decision.confidence_score < 0.7:
            priority_score += 2
        
        # Determine priority level
        if priority_score >= 7:
            return AppealPriority.CRITICAL
        elif priority_score >= 5:
            return AppealPriority.URGENT
        elif priority_score >= 3:
            return AppealPriority.HIGH
        elif priority_score >= 1:
            return AppealPriority.NORMAL
        else:
            return AppealPriority.LOW
    
    def determine_review_level(self, grounds: List[str], priority: AppealPriority) -> ReviewLevel:
        """Determine appropriate review level"""
        ethics_grounds = ['discrimination', 'bias', 'civil_rights_violation']
        complex_grounds = ['systemic_issue', 'policy_interpretation', 'precedent_setting']
        
        if any(ground in ethics_grounds for ground in grounds):
            return ReviewLevel.ETHICS_COMMITTEE
        elif (priority in [AppealPriority.CRITICAL, AppealPriority.URGENT] or 
              any(ground in complex_grounds for ground in grounds)):
            return ReviewLevel.FORMAL_ADMINISTRATIVE
        else:
            return ReviewLevel.INFORMAL
    
    def save_appeal(self, appeal: Appeal):
        """Save appeal to database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO appeals (
                appeal_id, appellant_data, ai_decision_data, grounds_for_appeal,
                description, supporting_evidence, desired_outcome, submission_date,
                status, priority, review_level, assigned_reviewer, timeline_days,
                due_date, resolution, communication_log
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            appeal.appeal_id,
            json.dumps(asdict(appeal.appellant)),
            json.dumps(asdict(appeal.ai_decision), default=str),
            json.dumps(appeal.grounds_for_appeal),
            appeal.description,
            json.dumps(appeal.supporting_evidence),
            appeal.desired_outcome,
            appeal.submission_date,
            appeal.status.value,
            appeal.priority.value,
            appeal.review_level.value,
            appeal.assigned_reviewer,
            appeal.timeline_days,
            appeal.due_date,
            json.dumps(appeal.resolution) if appeal.resolution else None,
            json.dumps(appeal.communication_log)
        ))
        
        conn.commit()
        conn.close()
    
    def get_appeal(self, appeal_id: str) -> Optional[Appeal]:
        """Retrieve appeal by ID"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM appeals WHERE appeal_id = ?", (appeal_id,))
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            return None
        
        # Reconstruct appeal object
        appellant_data = json.loads(row[1])
        ai_decision_data = json.loads(row[2])
        
        appellant = Appellant(**appellant_data)
        ai_decision_data['decision_date'] = datetime.fromisoformat(ai_decision_data['decision_date'])
        ai_decision = AIDecision(**ai_decision_data)
        
        appeal = Appeal(
            appeal_id=row[0],
            appellant=appellant,
            ai_decision=ai_decision,
            grounds_for_appeal=json.loads(row[3]),
            description=row[4],
            supporting_evidence=json.loads(row[5]),
            desired_outcome=row[6],
            submission_date=datetime.fromisoformat(row[7]),
            status=AppealStatus(row[8]),
            priority=AppealPriority(row[9]),
            review_level=ReviewLevel(row[10]),
            assigned_reviewer=row[11],
            timeline_days=row[12],
            due_date=datetime.fromisoformat(row[13]) if row[13] else None,
            resolution=json.loads(row[14]) if row[14] else None,
            communication_log=json.loads(row[15]) if row[15] else []
        )
        
        return appeal
    
    def assign_reviewer(self, appeal: Appeal) -> str:
        """Assign appropriate reviewer to appeal"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Find available reviewers with appropriate specialization
        specialization_map = {
            'property_assessment': 'property_valuation',
            'benefit_determination': 'social_services',
            'permit_approval': 'regulatory_compliance'
        }
        
        required_specialization = specialization_map.get(
            appeal.ai_decision.decision_type, 'general'
        )
        
        cursor.execute('''
            SELECT reviewer_id, name, current_caseload, max_caseload
            FROM reviewers 
            WHERE availability_status = 'available' 
            AND (specializations LIKE ? OR specializations LIKE '%general%')
            AND current_caseload < max_caseload
            ORDER BY current_caseload ASC
        ''', (f'%{required_specialization}%',))
        
        reviewers = cursor.fetchall()
        
        if not reviewers:
            logger.warning(f"No available reviewers for appeal {appeal.appeal_id}")
            conn.close()
            return None
        
        # Assign to reviewer with lowest caseload
        reviewer_id, reviewer_name, current_caseload, max_caseload = reviewers[0]
        
        # Update appeal
        cursor.execute('''
            UPDATE appeals SET assigned_reviewer = ?, status = ?
            WHERE appeal_id = ?
        ''', (reviewer_id, AppealStatus.UNDER_REVIEW.value, appeal.appeal_id))
        
        # Update reviewer caseload
        cursor.execute('''
            UPDATE reviewers SET current_caseload = current_caseload + 1
            WHERE reviewer_id = ?
        ''', (reviewer_id,))
        
        conn.commit()
        conn.close()
        
        # Notify reviewer
        self.notify_reviewer_assignment(appeal, reviewer_id, reviewer_name)
        
        logger.info(f"Appeal {appeal.appeal_id} assigned to reviewer {reviewer_name}")
        return reviewer_id
    
    def update_appeal_status(self, appeal_id: str, new_status: AppealStatus,
                           notes: str = None, reviewer_id: str = None):
        """Update appeal status with optional notes"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE appeals SET status = ?
            WHERE appeal_id = ?
        ''', (new_status.value, appeal_id))
        
        conn.commit()
        conn.close()
        
        # Log status change
        self.log_communication(
            appeal_id, reviewer_id or "system", "appellant",
            "status_update",
            f"Appeal Status Updated to {new_status.value.replace('_', ' ').title()}",
            notes or f"Your appeal status has been updated to {new_status.value.replace('_', ' ')}"
        )
        
        # Send notification to appellant
        appeal = self.get_appeal(appeal_id)
        if appeal:
            self.send_status_update_email(appeal, new_status, notes)
    
    def request_additional_information(self, appeal_id: str, reviewer_id: str,
                                     information_needed: str, deadline_days: int = 10):
        """Request additional information from appellant"""
        appeal = self.get_appeal(appeal_id)
        if not appeal:
            raise ValueError(f"Appeal {appeal_id} not found")
        
        # Update status
        self.update_appeal_status(
            appeal_id, 
            AppealStatus.ADDITIONAL_INFO_REQUIRED,
            f"Additional information requested: {information_needed}",
            reviewer_id
        )
        
        # Extend timeline
        new_due_date = datetime.now() + timedelta(days=deadline_days)
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE appeals SET due_date = ?
            WHERE appeal_id = ?
        ''', (new_due_date, appeal_id))
        conn.commit()
        conn.close()
        
        # Send email to appellant
        self.send_information_request_email(appeal, information_needed, deadline_days)
    
    def resolve_appeal(self, appeal_id: str, reviewer_id: str, outcome: str,
                      reasoning: str, revised_decision: Any = None,
                      systemic_changes: List[str] = None):
        """Resolve an appeal with outcome and reasoning"""
        appeal = self.get_appeal(appeal_id)
        if not appeal:
            raise ValueError(f"Appeal {appeal_id} not found")
        
        # Determine status based on outcome
        status_map = {
            'granted': AppealStatus.RESOLVED_GRANTED,
            'denied': AppealStatus.RESOLVED_DENIED,
            'partial': AppealStatus.RESOLVED_PARTIAL
        }
        
        new_status = status_map.get(outcome.lower(), AppealStatus.RESOLVED_DENIED)
        
        # Create resolution record
        resolution = {
            'outcome': outcome,
            'reasoning': reasoning,
            'reviewer_id': reviewer_id,
            'resolution_date': datetime.now().isoformat(),
            'revised_decision': revised_decision,
            'systemic_changes': systemic_changes or [],
            'financial_impact': self.calculate_financial_impact(appeal, revised_decision)
        }
        
        # Update appeal
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE appeals SET status = ?, resolution = ?
            WHERE appeal_id = ?
        ''', (new_status.value, json.dumps(resolution, default=str), appeal_id))
        
        # Update reviewer caseload
        cursor.execute('''
            UPDATE reviewers SET current_caseload = current_caseload - 1
            WHERE reviewer_id = ?
        ''', (reviewer_id,))
        
        conn.commit()
        conn.close()
        
        # Record outcome for analytics
        self.record_appeal_outcome(appeal, resolution)
        
        # Send resolution notification
        self.send_resolution_email(appeal, resolution)
        
        # Implement systemic changes if needed
        if systemic_changes:
            self.implement_systemic_changes(systemic_changes)
        
        logger.info(f"Appeal {appeal_id} resolved with outcome: {outcome}")
    
    def calculate_financial_impact(self, appeal: Appeal, revised_decision: Any) -> float:
        """Calculate financial impact of appeal resolution"""
        if not revised_decision:
            return 0.0
        
        try:
            original_value = float(appeal.ai_decision.decision_value)
            revised_value = float(revised_decision)
            return revised_value - original_value
        except (ValueError, TypeError):
            return 0.0
    
    def record_appeal_outcome(self, appeal: Appeal, resolution: Dict[str, Any]):
        """Record appeal outcome for analytics"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        outcome_id = str(uuid.uuid4())
        
        cursor.execute('''
            INSERT INTO appeal_outcomes (
                outcome_id, appeal_id, original_decision_value,
                revised_decision_value, outcome_type, financial_impact,
                systemic_changes_required, lessons_learned, timestamp
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            outcome_id,
            appeal.appeal_id,
            str(appeal.ai_decision.decision_value),
            str(resolution.get('revised_decision', '')),
            resolution['outcome'],
            resolution.get('financial_impact', 0.0),
            bool(resolution.get('systemic_changes')),
            resolution.get('reasoning', ''),
            datetime.now()
        ))
        
        conn.commit()
        conn.close()
    
    def get_appeals_dashboard_data(self) -> Dict[str, Any]:
        """Get dashboard data for appeals management"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Current appeals by status
        cursor.execute('''
            SELECT status, COUNT(*) as count
            FROM appeals
            GROUP BY status
        ''')
        status_counts = dict(cursor.fetchall())
        
        # Appeals by priority
        cursor.execute('''
            SELECT priority, COUNT(*) as count
            FROM appeals
            GROUP BY priority
        ''')
        priority_counts = dict(cursor.fetchall())
        
        # Average resolution time
        cursor.execute('''
            SELECT AVG(julianday(datetime(json_extract(resolution, '$.resolution_date'))) - 
                      julianday(submission_date)) as avg_days
            FROM appeals
            WHERE resolution IS NOT NULL
        ''')
        avg_resolution_time = cursor.fetchone()[0] or 0
        
        # Appeals resolved this month
        cursor.execute('''
            SELECT COUNT(*) as count
            FROM appeals
            WHERE status LIKE 'resolved_%' 
            AND datetime(json_extract(resolution, '$.resolution_date')) >= datetime('now', '-30 days')
        ''')
        resolved_this_month = cursor.fetchone()[0]
        
        # Overdue appeals
        cursor.execute('''
            SELECT COUNT(*) as count
            FROM appeals
            WHERE due_date < datetime('now')
            AND status NOT LIKE 'resolved_%'
            AND status != 'closed'
        ''')
        overdue_appeals = cursor.fetchone()[0]
        
        conn.close()
        
        return {
            'status_distribution': status_counts,
            'priority_distribution': priority_counts,
            'average_resolution_days': round(avg_resolution_time, 1),
            'resolved_this_month': resolved_this_month,
            'overdue_appeals': overdue_appeals,
            'active_appeals': sum(1 for status in status_counts.keys() 
                                if not status.startswith('resolved_') and status != 'closed')
        }
    
    def log_communication(self, appeal_id: str, sender: str, recipient: str,
                         message_type: str, subject: str, content: str):
        """Log communication related to appeal"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        comm_id = str(uuid.uuid4())
        
        cursor.execute('''
            INSERT INTO communications (
                comm_id, appeal_id, sender, recipient, message_type,
                subject, content, timestamp
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (comm_id, appeal_id, sender, recipient, message_type, 
              subject, content, datetime.now()))
        
        conn.commit()
        conn.close()
    
    def send_confirmation_email(self, appeal: Appeal):
        """Send appeal confirmation email"""
        subject = f"Appeal Confirmation - {appeal.appeal_id}"
        content = f"""
        Dear {appeal.appellant.name},
        
        Thank you for submitting your appeal regarding AI decision {appeal.ai_decision.decision_id}.
        
        Appeal Details:
        - Appeal ID: {appeal.appeal_id}
        - Submission Date: {appeal.submission_date.strftime('%Y-%m-%d')}
        - Expected Resolution: {appeal.due_date.strftime('%Y-%m-%d')}
        - Priority Level: {appeal.priority.value.title()}
        
        Your appeal will be reviewed according to our established procedures. You will receive 
        updates as the review progresses.
        
        If you have questions, please contact us at appeals@terrafusion.gov or call (555) 123-4567.
        
        Best regards,
        TerraFusion Appeals Team
        """
        
        self.send_email(appeal.appellant.email, subject, content)
    
    def send_status_update_email(self, appeal: Appeal, new_status: AppealStatus, notes: str = None):
        """Send status update email to appellant"""
        subject = f"Appeal Status Update - {appeal.appeal_id}"
        content = f"""
        Dear {appeal.appellant.name},
        
        Your appeal {appeal.appeal_id} status has been updated to: {new_status.value.replace('_', ' ').title()}
        
        {notes if notes else 'We will continue to process your appeal according to our established timeline.'}
        
        If you have questions, please contact us at appeals@terrafusion.gov.
        
        Best regards,
        TerraFusion Appeals Team
        """
        
        self.send_email(appeal.appellant.email, subject, content)
    
    def send_email(self, recipient: str, subject: str, content: str):
        """Send email notification (mock implementation)"""
        # In a real implementation, this would connect to an SMTP server
        logger.info(f"Email sent to {recipient}: {subject}")
        print(f"EMAIL TO: {recipient}")
        print(f"SUBJECT: {subject}")
        print(f"CONTENT: {content}")
        print("-" * 50)
    
    def notify_reviewer_assignment(self, appeal: Appeal, reviewer_id: str, reviewer_name: str):
        """Notify reviewer of new case assignment"""
        logger.info(f"Reviewer {reviewer_name} assigned to appeal {appeal.appeal_id}")
        # Implementation would send email/notification to reviewer
    
    def send_information_request_email(self, appeal: Appeal, info_needed: str, deadline_days: int):
        """Send information request email to appellant"""
        logger.info(f"Information request sent for appeal {appeal.appeal_id}")
        # Implementation would send detailed email with specific information needed
    
    def send_resolution_email(self, appeal: Appeal, resolution: Dict[str, Any]):
        """Send resolution notification email"""
        logger.info(f"Resolution notification sent for appeal {appeal.appeal_id}")
        # Implementation would send detailed resolution email
    
    def implement_systemic_changes(self, changes: List[str]):
        """Implement systemic changes based on appeal outcomes"""
        logger.info(f"Implementing systemic changes: {changes}")
        # Implementation would integrate with AI system management to apply changes

# Example usage and testing
def main():
    """Example usage of the appeals management system"""
    
    # Initialize system
    appeals_system = AppealsManagementSystem()
    
    # Create sample appellant
    appellant = Appellant(
        citizen_id="CITIZEN_12345",
        name="John Doe",
        email="john.doe@email.com",
        phone="(555) 123-4567",
        address="123 Main St, Anytown, USA",
        language_preference="en"
    )
    
    # Create sample AI decision
    ai_decision = AIDecision(
        decision_id="AI_DECISION_67890",
        decision_type="property_assessment",
        decision_date=datetime.now() - timedelta(days=30),
        ai_system_name="PropertyAssessmentAI",
        decision_value=450000.00,
        confidence_score=0.65,
        factors_considered=[
            {"factor": "square_footage", "weight": 0.3, "value": 2500},
            {"factor": "neighborhood_score", "weight": 0.2, "value": 7.5}
        ],
        original_explanation="Assessment based on property size, location, and recent sales"
    )
    
    # Submit appeal
    appeal_id = appeals_system.submit_appeal(
        appellant=appellant,
        ai_decision=ai_decision,
        grounds=["decision_appears_incorrect", "data_error"],
        description="The AI assessment appears significantly higher than recent comparable sales in my neighborhood.",
        evidence=[
            {"type": "comparable_sales", "description": "Recent sales data from MLS"},
            {"type": "property_photos", "description": "Photos showing property condition"}
        ],
        desired_outcome="Reassessment of property value based on accurate data"
    )
    
    print(f"Appeal submitted with ID: {appeal_id}")
    
    # Get dashboard data
    dashboard_data = appeals_system.get_appeals_dashboard_data()
    print(f"Dashboard data: {dashboard_data}")
    
    # Update appeal status (example)
    appeals_system.update_appeal_status(
        appeal_id, 
        AppealStatus.UNDER_REVIEW,
        "Appeal has been assigned to a qualified reviewer for detailed analysis."
    )
    
    print("Appeals management system demonstration completed.")

if __name__ == "__main__":
    main()