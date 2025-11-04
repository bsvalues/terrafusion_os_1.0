"""
TerraFusion Command Portal - Data Minimization Framework
Automated data minimization and retention management for government systems
Tier 17: Advanced Privacy & Differential Privacy Enhancement
"""

import json
import hashlib
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Set, Tuple
from datetime import datetime, timedelta
from enum import Enum
import logging
import re


class MinimizationAction(Enum):
    """Types of data minimization actions."""
    SUPPRESS = "suppress"  # Hide/mask data
    ANONYMIZE = "anonymize"  # Remove identifying information
    PSEUDONYMIZE = "pseudonymize"  # Replace with pseudonyms
    AGGREGATE = "aggregate"  # Combine into summary statistics
    DELETE = "delete"  # Permanently remove
    ARCHIVE = "archive"  # Move to long-term storage
    RETAIN = "retain"  # Keep as-is


class RetentionStatus(Enum):
    """Data retention status."""
    ACTIVE = "active"
    REVIEW_REQUIRED = "review_required"
    ELIGIBLE_FOR_DELETION = "eligible_for_deletion"
    ARCHIVED = "archived"
    DELETED = "deleted"
    LEGAL_HOLD = "legal_hold"


@dataclass
class DataField:
    """Represents a data field for minimization analysis."""
    field_name: str
    data_type: str
    sensitivity_level: str
    purpose: str
    legal_basis: str
    retention_days: int
    last_accessed: Optional[str] = None
    access_frequency: int = 0
    business_necessity: float = 0.0  # 0.0 to 1.0
    anonymization_feasibility: float = 0.0  # 0.0 to 1.0
    deletion_impact: float = 0.0  # 0.0 to 1.0


@dataclass
class MinimizationRule:
    """Rules for automated data minimization."""
    rule_id: str
    name: str
    description: str
    conditions: Dict[str, Any]
    action: MinimizationAction
    priority: int  # Higher number = higher priority
    applicable_data_types: List[str]
    compliance_frameworks: List[str]
    auto_execute: bool = False
    approval_required: bool = True


@dataclass
class MinimizationPlan:
    """Data minimization execution plan."""
    plan_id: str
    dataset_id: str
    total_records: int
    total_fields: int
    planned_actions: Dict[str, MinimizationAction]
    estimated_reduction_percent: float
    compliance_benefits: List[str]
    risk_mitigation: List[str]
    execution_timeline_days: int
    estimated_cost: float
    approval_status: str = "pending"
    created_timestamp: str = field(default_factory=lambda: datetime.now().isoformat())


@dataclass
class RetentionPolicy:
    """Data retention policy definition."""
    policy_id: str
    name: str
    description: str
    data_categories: List[str]
    retention_period_days: int
    legal_basis: str
    compliance_frameworks: List[str]
    auto_deletion: bool = False
    archive_before_deletion: bool = True
    legal_hold_override: bool = False


class DataMinimizationFramework:
    """
    Data minimization framework for the TerraFusion Command Portal.
    Implements automated data minimization and retention management.
    """

    def __init__(self, workspace_name: str = "terrafusion-command-portal"):
        self.workspace_name = workspace_name
        self.minimization_rules: Dict[str, MinimizationRule] = {}
        self.retention_policies: Dict[str, RetentionPolicy] = {}
        self.minimization_plans: Dict[str, MinimizationPlan] = {}
        self.execution_history: List[Dict[str, Any]] = []
        self.dataset_inventory: Dict[str, Dict[str, Any]] = {}
        self.logger = logging.getLogger(f"data_minimization_{workspace_name}")

        # Initialize default government retention policies
        self._initialize_government_retention_policies()

        # Initialize default minimization rules
        self._initialize_default_minimization_rules()

        # Performance metrics
        self.minimization_metrics = {
            "total_data_minimized_gb": 0.0,
            "records_anonymized": 0,
            "records_deleted": 0,
            "compliance_violations_prevented": 0,
            "storage_cost_savings": 0.0
        }

        # Government-specific data categories
        self.government_data_categories = {
            "citizen_pii": {
                "sensitivity": "high",
                "default_retention_days": 2555,  # 7 years
                "minimization_priority": 9
            },
            "financial_records": {
                "sensitivity": "high",
                "default_retention_days": 3650,  # 10 years
                "minimization_priority": 8
            },
            "health_records": {
                "sensitivity": "very_high",
                "default_retention_days": 10950,  # 30 years
                "minimization_priority": 10
            },
            "public_records": {
                "sensitivity": "medium",
                "default_retention_days": 1825,  # 5 years
                "minimization_priority": 5
            },
            "operational_logs": {
                "sensitivity": "low",
                "default_retention_days": 365,  # 1 year
                "minimization_priority": 3
            },
            "legal_documents": {
                "sensitivity": "high",
                "default_retention_days": -1,  # Permanent
                "minimization_priority": 1  # Low priority for deletion
            }
        }

    def _initialize_government_retention_policies(self) -> None:
        """Initialize standard government data retention policies."""

        # GDPR-compliant citizen data policy
        citizen_policy = RetentionPolicy(
            policy_id="gov_citizen_data_policy",
            name="Government Citizen Data Retention",
            description="Standard retention for citizen personal data",
            data_categories=["citizen_pii", "service_requests", "applications"],
            retention_period_days=2555,  # 7 years
            legal_basis="public_task",
            compliance_frameworks=["GDPR", "FISMA", "Local_Government_Records_Act"],
            auto_deletion=False,  # Require manual review
            archive_before_deletion=True
        )

        # Financial records policy
        financial_policy = RetentionPolicy(
            policy_id="gov_financial_records_policy",
            name="Government Financial Records Retention",
            description="Financial and tax-related data retention",
            data_categories=["financial_records", "tax_assessments", "payments"],
            retention_period_days=3650,  # 10 years
            legal_basis="legal_obligation",
            compliance_frameworks=["IRS_Requirements", "FISMA", "GAAP"],
            auto_deletion=False,
            archive_before_deletion=True
        )

        # Health records policy (if applicable)
        health_policy = RetentionPolicy(
            policy_id="gov_health_records_policy",
            name="Government Health Records Retention",
            description="Health-related data retention",
            data_categories=["health_records", "medical_data"],
            retention_period_days=10950,  # 30 years
            legal_basis="legal_obligation",
            compliance_frameworks=["HIPAA", "FISMA"],
            auto_deletion=False,
            archive_before_deletion=True
        )

        # Operational logs policy
        logs_policy = RetentionPolicy(
            policy_id="gov_operational_logs_policy",
            name="Government Operational Logs Retention",
            description="System and operational logs retention",
            data_categories=["operational_logs", "audit_logs", "access_logs"],
            retention_period_days=365,  # 1 year
            legal_basis="legitimate_interests",
            compliance_frameworks=["FISMA", "SOC2"],
            auto_deletion=True,  # Can auto-delete logs
            archive_before_deletion=False
        )

        for policy in [citizen_policy, financial_policy, health_policy, logs_policy]:
            self.retention_policies[policy.policy_id] = policy

    def _initialize_default_minimization_rules(self) -> None:
        """Initialize default data minimization rules."""

        # Rule 1: Anonymize old citizen data
        citizen_anonymization_rule = MinimizationRule(
            rule_id="anonymize_old_citizen_data",
            name="Anonymize Old Citizen Data",
            description="Anonymize citizen PII after 5 years if not actively used",
            conditions={
                "data_age_days": {"min": 1825},  # 5 years
                "data_category": ["citizen_pii"],
                "access_frequency": {"max": 10},  # Rarely accessed
                "business_necessity": {"max": 0.3}
            },
            action=MinimizationAction.ANONYMIZE,
            priority=8,
            applicable_data_types=["citizen_data", "service_requests"],
            compliance_frameworks=["GDPR", "CCPA"],
            auto_execute=False,
            approval_required=True
        )

        # Rule 2: Delete expired operational logs
        logs_deletion_rule = MinimizationRule(
            rule_id="delete_expired_logs",
            name="Delete Expired Operational Logs",
            description="Auto-delete operational logs after retention period",
            conditions={
                "data_age_days": {"min": 365},  # 1 year
                "data_category": ["operational_logs"],
                "legal_hold": False
            },
            action=MinimizationAction.DELETE,
            priority=5,
            applicable_data_types=["logs", "audit_trails"],
            compliance_frameworks=["FISMA"],
            auto_execute=True,
            approval_required=False
        )

        # Rule 3: Pseudonymize research data
        research_pseudonymization_rule = MinimizationRule(
            rule_id="pseudonymize_research_data",
            name="Pseudonymize Research Data",
            description="Pseudonymize PII in datasets used for research",
            conditions={
                "purpose": ["research", "analytics"],
                "data_category": ["citizen_pii", "health_records"],
                "anonymization_feasibility": {"min": 0.7}
            },
            action=MinimizationAction.PSEUDONYMIZE,
            priority=7,
            applicable_data_types=["research_datasets", "analytics_data"],
            compliance_frameworks=["GDPR", "HIPAA"],
            auto_execute=False,
            approval_required=True
        )

        # Rule 4: Aggregate old financial summaries
        financial_aggregation_rule = MinimizationRule(
            rule_id="aggregate_old_financial_data",
            name="Aggregate Old Financial Data",
            description="Aggregate detailed financial records into summaries after 7 years",
            conditions={
                "data_age_days": {"min": 2555},  # 7 years
                "data_category": ["financial_records"],
                "business_necessity": {"max": 0.4},
                "detail_level": "individual"
            },
            action=MinimizationAction.AGGREGATE,
            priority=6,
            applicable_data_types=["financial_records", "tax_assessments"],
            compliance_frameworks=["IRS_Requirements", "GAAP"],
            auto_execute=False,
            approval_required=True
        )

        for rule in [citizen_anonymization_rule, logs_deletion_rule,
                    research_pseudonymization_rule, financial_aggregation_rule]:
            self.minimization_rules[rule.rule_id] = rule

    def register_dataset(self, dataset_id: str, dataset_metadata: Dict[str, Any]) -> None:
        """Register a dataset for minimization analysis."""
        self.dataset_inventory[dataset_id] = {
            **dataset_metadata,
            "registered_timestamp": datetime.now().isoformat(),
            "last_analyzed": None,
            "minimization_status": "pending_analysis"
        }

        self.logger.info(f"Registered dataset for minimization: {dataset_id}")

    def analyze_dataset_for_minimization(self, dataset_id: str,
                                       fields: List[DataField]) -> Dict[str, Any]:
        """Analyze dataset to identify minimization opportunities."""
        if dataset_id not in self.dataset_inventory:
            raise ValueError(f"Dataset not registered: {dataset_id}")

        start_time = datetime.now()

        # Analyze each field against minimization rules
        field_recommendations = {}
        privacy_risks = []
        compliance_gaps = []

        for field in fields:
            field_analysis = self._analyze_field_for_minimization(field)
            field_recommendations[field.field_name] = field_analysis

            # Check for privacy risks
            if field.sensitivity_level == "high" and field.last_accessed:
                last_access = datetime.fromisoformat(field.last_accessed)
                days_since_access = (datetime.now() - last_access).days
                if days_since_access > 180:  # 6 months
                    privacy_risks.append(f"High-sensitivity field '{field.field_name}' not accessed in {days_since_access} days")

            # Check retention compliance
            if field.retention_days > 0:
                if field.last_accessed:
                    field_age = (datetime.now() - datetime.fromisoformat(field.last_accessed)).days
                    if field_age > field.retention_days:
                        compliance_gaps.append(f"Field '{field.field_name}' exceeds retention period by {field_age - field.retention_days} days")

        # Calculate overall minimization potential
        total_fields = len(fields)
        minimizable_fields = sum(1 for analysis in field_recommendations.values()
                               if analysis["recommended_action"] != MinimizationAction.RETAIN)
        minimization_potential = minimizable_fields / total_fields if total_fields > 0 else 0

        # Estimate data reduction
        estimated_reduction = self._estimate_data_reduction(field_recommendations)

        analysis_result = {
            "dataset_id": dataset_id,
            "analysis_timestamp": datetime.now().isoformat(),
            "total_fields": total_fields,
            "minimizable_fields": minimizable_fields,
            "minimization_potential_percent": minimization_potential * 100,
            "estimated_data_reduction_percent": estimated_reduction * 100,
            "field_recommendations": field_recommendations,
            "privacy_risks": privacy_risks,
            "compliance_gaps": compliance_gaps,
            "recommended_actions": self._prioritize_minimization_actions(field_recommendations)
        }

        # Update dataset inventory
        self.dataset_inventory[dataset_id]["last_analyzed"] = datetime.now().isoformat()
        self.dataset_inventory[dataset_id]["minimization_analysis"] = analysis_result

        analysis_time = (datetime.now() - start_time).total_seconds()
        self.logger.info(f"Analyzed dataset {dataset_id}: {minimization_potential:.1%} minimization potential in {analysis_time:.2f}s")

        return analysis_result

    def _analyze_field_for_minimization(self, field: DataField) -> Dict[str, Any]:
        """Analyze individual field for minimization opportunities."""

        # Check field against all minimization rules
        applicable_rules = []
        for rule in self.minimization_rules.values():
            if self._field_matches_rule_conditions(field, rule):
                applicable_rules.append(rule)

        # Determine recommended action based on highest priority rule
        if applicable_rules:
            highest_priority_rule = max(applicable_rules, key=lambda r: r.priority)
            recommended_action = highest_priority_rule.action
            rationale = f"Matches rule: {highest_priority_rule.name}"
        else:
            recommended_action = MinimizationAction.RETAIN
            rationale = "No applicable minimization rules"

        # Calculate minimization score (higher = more benefit from minimization)
        minimization_score = self._calculate_minimization_score(field)

        return {
            "field_name": field.field_name,
            "current_sensitivity": field.sensitivity_level,
            "recommended_action": recommended_action,
            "minimization_score": minimization_score,
            "rationale": rationale,
            "applicable_rules": [rule.rule_id for rule in applicable_rules],
            "business_necessity": field.business_necessity,
            "anonymization_feasibility": field.anonymization_feasibility,
            "deletion_impact": field.deletion_impact
        }

    def _field_matches_rule_conditions(self, field: DataField, rule: MinimizationRule) -> bool:
        """Check if field matches rule conditions."""
        conditions = rule.conditions

        # Check data age
        if "data_age_days" in conditions and field.last_accessed:
            last_access = datetime.fromisoformat(field.last_accessed)
            age_days = (datetime.now() - last_access).days

            if "min" in conditions["data_age_days"] and age_days < conditions["data_age_days"]["min"]:
                return False
            if "max" in conditions["data_age_days"] and age_days > conditions["data_age_days"]["max"]:
                return False

        # Check data category
        if "data_category" in conditions:
            field_category = self._classify_field_category(field)
            if field_category not in conditions["data_category"]:
                return False

        # Check access frequency
        if "access_frequency" in conditions:
            if "min" in conditions["access_frequency"] and field.access_frequency < conditions["access_frequency"]["min"]:
                return False
            if "max" in conditions["access_frequency"] and field.access_frequency > conditions["access_frequency"]["max"]:
                return False

        # Check business necessity
        if "business_necessity" in conditions:
            if "min" in conditions["business_necessity"] and field.business_necessity < conditions["business_necessity"]["min"]:
                return False
            if "max" in conditions["business_necessity"] and field.business_necessity > conditions["business_necessity"]["max"]:
                return False

        # Check purpose
        if "purpose" in conditions:
            if field.purpose.lower() not in [p.lower() for p in conditions["purpose"]]:
                return False

        return True

    def _classify_field_category(self, field: DataField) -> str:
        """Classify field into government data category."""
        field_name_lower = field.field_name.lower()

        # PII indicators
        pii_indicators = ["name", "ssn", "address", "phone", "email", "id", "birth"]
        if any(indicator in field_name_lower for indicator in pii_indicators):
            return "citizen_pii"

        # Financial indicators
        financial_indicators = ["amount", "payment", "tax", "fee", "revenue", "budget"]
        if any(indicator in field_name_lower for indicator in financial_indicators):
            return "financial_records"

        # Health indicators
        health_indicators = ["health", "medical", "diagnosis", "treatment", "medication"]
        if any(indicator in field_name_lower for indicator in health_indicators):
            return "health_records"

        # Log indicators
        log_indicators = ["log", "timestamp", "session", "event", "audit"]
        if any(indicator in field_name_lower for indicator in log_indicators):
            return "operational_logs"

        return "public_records"  # Default category

    def _calculate_minimization_score(self, field: DataField) -> float:
        """Calculate minimization benefit score for field."""
        score = 0.0

        # Higher score for high sensitivity data
        sensitivity_scores = {"low": 0.1, "medium": 0.3, "high": 0.6, "very_high": 0.8}
        score += sensitivity_scores.get(field.sensitivity_level, 0.2)

        # Higher score for rarely accessed data
        if field.last_accessed:
            last_access = datetime.fromisoformat(field.last_accessed)
            days_since_access = (datetime.now() - last_access).days
            access_score = min(0.3, days_since_access / 365)  # Max 0.3 for data older than 1 year
            score += access_score

        # Higher score for low business necessity
        score += (1.0 - field.business_necessity) * 0.2

        # Higher score for high anonymization feasibility
        score += field.anonymization_feasibility * 0.2

        # Lower score for high deletion impact
        score -= field.deletion_impact * 0.1

        return max(0.0, min(1.0, score))

    def _estimate_data_reduction(self, field_recommendations: Dict[str, Dict[str, Any]]) -> float:
        """Estimate data size reduction from minimization actions."""
        total_fields = len(field_recommendations)
        if total_fields == 0:
            return 0.0

        reduction_weights = {
            MinimizationAction.DELETE: 1.0,  # 100% reduction
            MinimizationAction.ANONYMIZE: 0.3,  # 30% reduction (remove identifiers)
            MinimizationAction.PSEUDONYMIZE: 0.1,  # 10% reduction
            MinimizationAction.AGGREGATE: 0.7,  # 70% reduction (summaries)
            MinimizationAction.SUPPRESS: 0.5,  # 50% reduction (mask data)
            MinimizationAction.ARCHIVE: 0.0,  # No immediate reduction
            MinimizationAction.RETAIN: 0.0  # No reduction
        }

        total_reduction = sum(
            reduction_weights.get(rec["recommended_action"], 0.0)
            for rec in field_recommendations.values()
        )

        return total_reduction / total_fields

    def _prioritize_minimization_actions(self, field_recommendations: Dict[str, Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Prioritize minimization actions by impact and risk."""
        actions = []

        for field_name, rec in field_recommendations.items():
            if rec["recommended_action"] != MinimizationAction.RETAIN:
                priority_score = rec["minimization_score"]

                # Boost priority for compliance gaps
                if rec["business_necessity"] < 0.3:
                    priority_score += 0.2

                actions.append({
                    "field_name": field_name,
                    "action": rec["recommended_action"].value,
                    "priority_score": priority_score,
                    "rationale": rec["rationale"]
                })

        # Sort by priority score (highest first)
        actions.sort(key=lambda x: x["priority_score"], reverse=True)
        return actions

    def create_minimization_plan(self, dataset_id: str,
                                selected_actions: Optional[Dict[str, str]] = None) -> MinimizationPlan:
        """Create executable data minimization plan."""
        if dataset_id not in self.dataset_inventory:
            raise ValueError(f"Dataset not registered: {dataset_id}")

        dataset_info = self.dataset_inventory[dataset_id]
        analysis = dataset_info.get("minimization_analysis")

        if not analysis:
            raise ValueError(f"No minimization analysis found for dataset: {dataset_id}")

        # Use selected actions or default to analysis recommendations
        if selected_actions:
            planned_actions = {field: MinimizationAction(action)
                             for field, action in selected_actions.items()}
        else:
            planned_actions = {
                rec["field_name"]: rec["recommended_action"]
                for rec in analysis["field_recommendations"].values()
                if rec["recommended_action"] != MinimizationAction.RETAIN
            }

        # Calculate metrics
        total_records = dataset_info.get("record_count", 0)
        total_fields = len(analysis["field_recommendations"])
        estimated_reduction = self._estimate_data_reduction_from_actions(planned_actions)

        # Estimate execution timeline
        execution_days = self._estimate_execution_timeline(planned_actions)

        # Estimate cost
        estimated_cost = self._estimate_minimization_cost(total_records, planned_actions)

        # Identify compliance benefits
        compliance_benefits = self._identify_compliance_benefits(planned_actions)

        # Identify risk mitigation
        risk_mitigation = self._identify_risk_mitigation(planned_actions)

        plan_id = f"minimization_plan_{dataset_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        plan = MinimizationPlan(
            plan_id=plan_id,
            dataset_id=dataset_id,
            total_records=total_records,
            total_fields=total_fields,
            planned_actions=planned_actions,
            estimated_reduction_percent=estimated_reduction * 100,
            compliance_benefits=compliance_benefits,
            risk_mitigation=risk_mitigation,
            execution_timeline_days=execution_days,
            estimated_cost=estimated_cost
        )

        self.minimization_plans[plan_id] = plan

        self.logger.info(f"Created minimization plan {plan_id}: {len(planned_actions)} actions, {estimated_reduction:.1%} reduction")

        return plan

    def _estimate_data_reduction_from_actions(self, planned_actions: Dict[str, MinimizationAction]) -> float:
        """Estimate data reduction from specific planned actions."""
        if not planned_actions:
            return 0.0

        reduction_weights = {
            MinimizationAction.DELETE: 1.0,
            MinimizationAction.ANONYMIZE: 0.3,
            MinimizationAction.PSEUDONYMIZE: 0.1,
            MinimizationAction.AGGREGATE: 0.7,
            MinimizationAction.SUPPRESS: 0.5,
            MinimizationAction.ARCHIVE: 0.0,
            MinimizationAction.RETAIN: 0.0
        }

        total_reduction = sum(reduction_weights.get(action, 0.0) for action in planned_actions.values())
        return total_reduction / len(planned_actions)

    def _estimate_execution_timeline(self, planned_actions: Dict[str, MinimizationAction]) -> int:
        """Estimate execution timeline in days."""
        base_days = 7  # Base planning time

        action_complexity = {
            MinimizationAction.DELETE: 3,
            MinimizationAction.SUPPRESS: 2,
            MinimizationAction.ARCHIVE: 5,
            MinimizationAction.ANONYMIZE: 10,
            MinimizationAction.PSEUDONYMIZE: 8,
            MinimizationAction.AGGREGATE: 15,
            MinimizationAction.RETAIN: 0
        }

        total_complexity = sum(action_complexity.get(action, 5) for action in planned_actions.values())
        return base_days + (total_complexity // 2)  # Parallel execution

    def _estimate_minimization_cost(self, record_count: int, planned_actions: Dict[str, MinimizationAction]) -> float:
        """Estimate cost of minimization execution."""
        base_cost_per_record = 0.05  # $0.05 per record

        action_cost_multipliers = {
            MinimizationAction.DELETE: 0.5,
            MinimizationAction.SUPPRESS: 0.8,
            MinimizationAction.ARCHIVE: 1.0,
            MinimizationAction.ANONYMIZE: 2.0,
            MinimizationAction.PSEUDONYMIZE: 1.5,
            MinimizationAction.AGGREGATE: 3.0,
            MinimizationAction.RETAIN: 0.0
        }

        avg_multiplier = sum(action_cost_multipliers.get(action, 1.0)
                           for action in planned_actions.values()) / max(1, len(planned_actions))

        return record_count * base_cost_per_record * avg_multiplier

    def _identify_compliance_benefits(self, planned_actions: Dict[str, MinimizationAction]) -> List[str]:
        """Identify compliance benefits from planned actions."""
        benefits = []

        if MinimizationAction.DELETE in planned_actions.values():
            benefits.append("Reduces GDPR retention compliance burden")
            benefits.append("Minimizes data breach exposure")

        if MinimizationAction.ANONYMIZE in planned_actions.values():
            benefits.append("Enables GDPR-compliant research and analytics")
            benefits.append("Reduces privacy impact assessment requirements")

        if MinimizationAction.PSEUDONYMIZE in planned_actions.values():
            benefits.append("Maintains data utility while protecting privacy")
            benefits.append("Supports HIPAA de-identification requirements")

        if MinimizationAction.AGGREGATE in planned_actions.values():
            benefits.append("Enables public reporting without privacy risks")
            benefits.append("Supports statistical disclosure control")

        return benefits

    def _identify_risk_mitigation(self, planned_actions: Dict[str, MinimizationAction]) -> List[str]:
        """Identify risk mitigation from planned actions."""
        mitigations = []

        if any(action in [MinimizationAction.DELETE, MinimizationAction.ANONYMIZE]
               for action in planned_actions.values()):
            mitigations.append("Reduces reidentification risk")
            mitigations.append("Minimizes insider threat exposure")

        if MinimizationAction.ARCHIVE in planned_actions.values():
            mitigations.append("Reduces operational system attack surface")
            mitigations.append("Improves system performance")

        if any(action in [MinimizationAction.SUPPRESS, MinimizationAction.PSEUDONYMIZE]
               for action in planned_actions.values()):
            mitigations.append("Limits data exposure in unauthorized access")
            mitigations.append("Reduces compliance violation penalties")

        return mitigations

    def get_minimization_dashboard_data(self) -> Dict[str, Any]:
        """Get data minimization dashboard information for Command Portal."""
        total_datasets = len(self.dataset_inventory)
        analyzed_datasets = sum(1 for ds in self.dataset_inventory.values()
                              if ds.get("minimization_analysis"))
        pending_plans = sum(1 for plan in self.minimization_plans.values()
                          if plan.approval_status == "pending")

        # Calculate potential savings
        total_potential_reduction = 0.0
        total_estimated_cost = 0.0
        for plan in self.minimization_plans.values():
            total_potential_reduction += plan.estimated_reduction_percent
            total_estimated_cost += plan.estimated_cost

        avg_potential_reduction = total_potential_reduction / max(1, len(self.minimization_plans))

        return {
            "workspace": self.workspace_name,
            "dashboard_timestamp": datetime.now().isoformat(),
            "overview": {
                "total_datasets_registered": total_datasets,
                "datasets_analyzed": analyzed_datasets,
                "minimization_plans_created": len(self.minimization_plans),
                "plans_pending_approval": pending_plans,
                "avg_potential_data_reduction_percent": avg_potential_reduction
            },
            "performance_metrics": dict(self.minimization_metrics),
            "active_retention_policies": len(self.retention_policies),
            "active_minimization_rules": len(self.minimization_rules),
            "estimated_total_cost": total_estimated_cost,
            "compliance_frameworks_supported": [
                "GDPR", "HIPAA", "FISMA", "CCPA", "SOC2"
            ],
            "recent_activity": self.execution_history[-10:] if self.execution_history else []
        }


# Command Portal Integration Example
def example_government_data_minimization():
    """Example of data minimization for government datasets."""
    framework = DataMinimizationFramework("terrafusion-command-portal")

    # Register a citizen services dataset
    framework.register_dataset("citizen_services_2024", {
        "name": "Citizen Services Database 2024",
        "data_type": "citizen_data",
        "record_count": 25000,
        "purpose": "Provide government services",
        "legal_basis": "public_task"
    })

    # Define fields for analysis
    fields = [
        DataField("citizen_id", "string", "high", "identification", "public_task", 2555,
                 datetime.now().isoformat(), 1000, 0.9, 0.2, 0.8),
        DataField("full_name", "string", "high", "identification", "public_task", 2555,
                 (datetime.now() - timedelta(days=400)).isoformat(), 50, 0.8, 0.6, 0.7),
        DataField("ssn", "string", "very_high", "identification", "public_task", 2555,
                 (datetime.now() - timedelta(days=800)).isoformat(), 10, 0.3, 0.8, 0.9),
        DataField("address", "string", "high", "contact", "public_task", 2555,
                 (datetime.now() - timedelta(days=200)).isoformat(), 200, 0.6, 0.7, 0.5),
        DataField("debug_logs", "text", "low", "debugging", "legitimate_interests", 365,
                 (datetime.now() - timedelta(days=400)).isoformat(), 5, 0.1, 0.9, 0.1)
    ]

    # Analyze dataset for minimization
    analysis = framework.analyze_dataset_for_minimization("citizen_services_2024", fields)
    print(f"Minimization potential: {analysis['minimization_potential_percent']:.1f}%")
    print(f"Estimated data reduction: {analysis['estimated_data_reduction_percent']:.1f}%")

    # Create minimization plan
    plan = framework.create_minimization_plan("citizen_services_2024")
    print(f"Created plan: {plan.plan_id}")
    print(f"Planned actions: {len(plan.planned_actions)}")
    print(f"Estimated cost: ${plan.estimated_cost:.2f}")

    # Get dashboard data
    dashboard = framework.get_minimization_dashboard_data()
    print(f"Total datasets: {dashboard['overview']['total_datasets_registered']}")
    print(f"Plans pending approval: {dashboard['overview']['plans_pending_approval']}")


if __name__ == "__main__":
    example_government_data_minimization()
