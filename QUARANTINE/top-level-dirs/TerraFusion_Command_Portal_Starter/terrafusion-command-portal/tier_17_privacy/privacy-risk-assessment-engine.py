"""
TerraFusion Command Portal - Privacy Risk Assessment Engine
Comprehensive privacy risk analysis and mitigation for government data
Tier 17: Advanced Privacy & Differential Privacy Enhancement
"""

import json
import math
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from enum import Enum
import logging


class RiskLevel(Enum):
    """Privacy risk levels."""
    MINIMAL = "minimal"
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    CRITICAL = "critical"


class DataSensitivity(Enum):
    """Data sensitivity classifications."""
    PUBLIC = "public"
    INTERNAL = "internal"
    CONFIDENTIAL = "confidential"
    RESTRICTED = "restricted"
    TOP_SECRET = "top_secret"


@dataclass
class DataAsset:
    """Represents a government data asset for privacy assessment."""
    asset_id: str
    name: str
    data_type: str
    sensitivity: DataSensitivity
    record_count: int
    data_subjects: int
    purpose: str
    legal_basis: str
    retention_period_days: int
    geographic_scope: List[str]
    personal_data_categories: List[str]
    special_categories: List[str] = field(default_factory=list)
    cross_border_transfers: bool = False
    third_party_sharing: bool = False
    automated_processing: bool = False
    profiling: bool = False
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class PrivacyRiskMetrics:
    """Comprehensive privacy risk metrics."""
    reidentification_risk: float  # 0.0 to 1.0
    data_minimization_score: float  # 0.0 to 1.0 (higher is better)
    consent_compliance_score: float  # 0.0 to 1.0
    security_posture_score: float  # 0.0 to 1.0
    overall_risk_score: float  # 0.0 to 1.0
    risk_level: RiskLevel
    assessment_timestamp: str = field(default_factory=lambda: datetime.now().isoformat())


@dataclass
class RiskMitigationPlan:
    """Privacy risk mitigation recommendations."""
    asset_id: str
    identified_risks: List[str]
    recommended_actions: List[str]
    technical_controls: List[str]
    organizational_controls: List[str]
    timeline_days: int
    estimated_cost: float
    compliance_frameworks: List[str]
    priority: RiskLevel


class PrivacyRiskAssessmentEngine:
    """
    Privacy risk assessment engine for the TerraFusion Command Portal.
    Provides comprehensive privacy risk analysis for government data assets.
    """

    def __init__(self, workspace_name: str = "terrafusion-command-portal"):
        self.workspace_name = workspace_name
        self.data_assets: Dict[str, DataAsset] = {}
        self.risk_assessments: Dict[str, PrivacyRiskMetrics] = {}
        self.mitigation_plans: Dict[str, RiskMitigationPlan] = {}
        self.assessment_history: List[Dict[str, Any]] = []
        self.logger = logging.getLogger(f"privacy_risk_{workspace_name}")

        # Government-specific risk parameters
        self.government_risk_factors = {
            "citizen_data": {
                "base_sensitivity": 0.7,
                "reidentification_multiplier": 1.2,
                "public_scrutiny_factor": 1.5
            },
            "health_records": {
                "base_sensitivity": 0.9,
                "reidentification_multiplier": 1.8,
                "public_scrutiny_factor": 2.0
            },
            "financial_records": {
                "base_sensitivity": 0.8,
                "reidentification_multiplier": 1.5,
                "public_scrutiny_factor": 1.7
            },
            "legal_documents": {
                "base_sensitivity": 0.85,
                "reidentification_multiplier": 1.6,
                "public_scrutiny_factor": 1.8
            },
            "tax_assessments": {
                "base_sensitivity": 0.75,
                "reidentification_multiplier": 1.3,
                "public_scrutiny_factor": 1.4
            }
        }

        # Compliance framework requirements
        self.compliance_requirements = {
            "GDPR": {
                "data_minimization": True,
                "purpose_limitation": True,
                "consent_required": True,
                "dpo_required": True,
                "dpia_threshold": 1000  # Data subjects
            },
            "HIPAA": {
                "minimum_necessary": True,
                "access_controls": True,
                "audit_logs": True,
                "business_associate_agreements": True
            },
            "FISMA": {
                "security_categorization": True,
                "continuous_monitoring": True,
                "incident_response": True,
                "authorization_boundary": True
            },
            "CCPA": {
                "consumer_rights": True,
                "disclosure_requirements": True,
                "opt_out_mechanisms": True,
                "data_deletion": True
            }
        }

        # Risk assessment weights
        self.risk_weights = {
            "reidentification": 0.3,
            "data_minimization": 0.25,
            "consent_compliance": 0.25,
            "security_posture": 0.2
        }

    def register_data_asset(self, asset: DataAsset) -> None:
        """Register a government data asset for privacy assessment."""
        self.data_assets[asset.asset_id] = asset

        # Automatically trigger initial assessment for high-sensitivity data
        if asset.sensitivity in [DataSensitivity.RESTRICTED, DataSensitivity.TOP_SECRET]:
            self.assess_privacy_risk(asset.asset_id)

        self.logger.info(f"Registered data asset: {asset.asset_id} ({asset.sensitivity.value})")

    def assess_privacy_risk(self, asset_id: str, custom_weights: Optional[Dict[str, float]] = None) -> PrivacyRiskMetrics:
        """Perform comprehensive privacy risk assessment."""
        if asset_id not in self.data_assets:
            raise ValueError(f"Data asset not found: {asset_id}")

        asset = self.data_assets[asset_id]
        weights = custom_weights or self.risk_weights

        start_time = datetime.now()

        # Calculate individual risk metrics
        reidentification_risk = self._assess_reidentification_risk(asset)
        data_minimization_score = self._assess_data_minimization(asset)
        consent_compliance_score = self._assess_consent_compliance(asset)
        security_posture_score = self._assess_security_posture(asset)

        # Calculate overall risk score
        overall_risk = (
            weights["reidentification"] * reidentification_risk +
            weights["data_minimization"] * (1.0 - data_minimization_score) +  # Inverted for risk
            weights["consent_compliance"] * (1.0 - consent_compliance_score) +  # Inverted for risk
            weights["security_posture"] * (1.0 - security_posture_score)  # Inverted for risk
        )

        # Determine risk level
        risk_level = self._determine_risk_level(overall_risk)

        # Create risk metrics
        risk_metrics = PrivacyRiskMetrics(
            reidentification_risk=reidentification_risk,
            data_minimization_score=data_minimization_score,
            consent_compliance_score=consent_compliance_score,
            security_posture_score=security_posture_score,
            overall_risk_score=overall_risk,
            risk_level=risk_level
        )

        # Store assessment
        self.risk_assessments[asset_id] = risk_metrics

        # Log assessment
        assessment_time = (datetime.now() - start_time).total_seconds()
        assessment_record = {
            "asset_id": asset_id,
            "assessment_timestamp": risk_metrics.assessment_timestamp,
            "overall_risk_score": overall_risk,
            "risk_level": risk_level.value,
            "assessment_time_seconds": assessment_time,
            "workspace": self.workspace_name
        }
        self.assessment_history.append(assessment_record)

        self.logger.info(f"Privacy risk assessment completed for {asset_id}: {risk_level.value} risk")

        # Auto-generate mitigation plan for high-risk assets
        if risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]:
            self.generate_mitigation_plan(asset_id)

        return risk_metrics

    def _assess_reidentification_risk(self, asset: DataAsset) -> float:
        """Assess risk of individual reidentification."""
        base_risk = 0.0

        # Factor 1: Dataset size and uniqueness
        if asset.record_count > 0:
            # Smaller datasets have higher reidentification risk
            size_factor = min(1.0, 10000 / asset.record_count)
            base_risk += size_factor * 0.3

        # Factor 2: Number of quasi-identifiers
        quasi_identifiers = ["age", "gender", "location", "occupation", "education", "income"]
        present_qids = sum(1 for qid in quasi_identifiers if qid in asset.personal_data_categories)
        qid_risk = min(1.0, present_qids / len(quasi_identifiers))
        base_risk += qid_risk * 0.4

        # Factor 3: Special category data (higher risk)
        if asset.special_categories:
            special_risk = min(1.0, len(asset.special_categories) / 5)  # Up to 5 special categories
            base_risk += special_risk * 0.2

        # Factor 4: Cross-border transfers (regulatory risk)
        if asset.cross_border_transfers:
            base_risk += 0.1

        # Apply government-specific multipliers
        if asset.data_type in self.government_risk_factors:
            multiplier = self.government_risk_factors[asset.data_type]["reidentification_multiplier"]
            base_risk *= multiplier

        return min(1.0, base_risk)

    def _assess_data_minimization(self, asset: DataAsset) -> float:
        """Assess data minimization compliance."""
        score = 1.0  # Start with perfect score

        # Factor 1: Purpose alignment
        purpose_score = 0.8  # Assume reasonable purpose alignment
        if "research" in asset.purpose.lower():
            purpose_score = 0.9  # Research often has good minimization
        elif "marketing" in asset.purpose.lower():
            purpose_score = 0.5  # Marketing often over-collects

        # Factor 2: Data categories vs purpose
        # Penalize for excessive data categories
        if len(asset.personal_data_categories) > 10:
            purpose_score -= 0.2
        if len(asset.special_categories) > 2:
            purpose_score -= 0.3

        # Factor 3: Retention period appropriateness
        retention_score = 1.0
        max_reasonable_retention = {
            "public_records": 1825,  # 5 years
            "citizen_data": 2555,   # 7 years
            "financial_records": 3650,  # 10 years
            "health_records": 10950,  # 30 years
            "legal_documents": -1    # Permanent is OK
        }

        if asset.data_type in max_reasonable_retention:
            max_retention = max_reasonable_retention[asset.data_type]
            if max_retention > 0 and asset.retention_period_days > max_retention:
                retention_score = max(0.2, max_retention / asset.retention_period_days)

        # Factor 4: Third-party sharing minimization
        sharing_score = 0.9 if not asset.third_party_sharing else 0.6

        final_score = (purpose_score * 0.4 + retention_score * 0.3 + sharing_score * 0.3)
        return max(0.0, min(1.0, final_score))

    def _assess_consent_compliance(self, asset: DataAsset) -> float:
        """Assess consent and legal basis compliance."""
        score = 0.0

        # Check legal basis appropriateness
        valid_legal_bases = [
            "consent", "contract", "legal_obligation", "vital_interests",
            "public_task", "legitimate_interests"
        ]

        if asset.legal_basis.lower() in valid_legal_bases:
            score += 0.4

        # Government data often uses "public_task" or "legal_obligation"
        if asset.legal_basis.lower() in ["public_task", "legal_obligation"]:
            score += 0.3  # Appropriate for government

        # Factor in consent requirements for special categories
        if asset.special_categories:
            if asset.legal_basis.lower() == "consent":
                score += 0.2  # Good - explicit consent for special data
            else:
                score -= 0.3  # Risk - special data without consent

        # Automated processing and profiling considerations
        if asset.automated_processing:
            if asset.legal_basis.lower() == "consent":
                score += 0.1
            else:
                score -= 0.2

        return max(0.0, min(1.0, score))

    def _assess_security_posture(self, asset: DataAsset) -> float:
        """Assess security controls and posture."""
        # This is a simplified assessment - in production, integrate with security scanning
        base_score = 0.7  # Assume reasonable baseline security

        # Factor 1: Data sensitivity vs security requirements
        sensitivity_bonus = {
            DataSensitivity.PUBLIC: 0.0,
            DataSensitivity.INTERNAL: 0.05,
            DataSensitivity.CONFIDENTIAL: 0.1,
            DataSensitivity.RESTRICTED: 0.15,
            DataSensitivity.TOP_SECRET: 0.2
        }
        base_score += sensitivity_bonus[asset.sensitivity]

        # Factor 2: Encryption and technical controls
        if "encrypted" in asset.metadata.get("security_controls", []):
            base_score += 0.1
        if "access_controls" in asset.metadata.get("security_controls", []):
            base_score += 0.1
        if "audit_logging" in asset.metadata.get("security_controls", []):
            base_score += 0.05

        # Factor 3: Government security standards
        if asset.metadata.get("fisma_categorization"):
            base_score += 0.1
        if asset.metadata.get("ato_status") == "active":
            base_score += 0.1

        return max(0.0, min(1.0, base_score))

    def _determine_risk_level(self, overall_risk: float) -> RiskLevel:
        """Determine risk level from overall risk score."""
        if overall_risk >= 0.8:
            return RiskLevel.CRITICAL
        elif overall_risk >= 0.6:
            return RiskLevel.HIGH
        elif overall_risk >= 0.4:
            return RiskLevel.MODERATE
        elif overall_risk >= 0.2:
            return RiskLevel.LOW
        else:
            return RiskLevel.MINIMAL

    def generate_mitigation_plan(self, asset_id: str) -> RiskMitigationPlan:
        """Generate privacy risk mitigation plan."""
        if asset_id not in self.data_assets:
            raise ValueError(f"Data asset not found: {asset_id}")
        if asset_id not in self.risk_assessments:
            raise ValueError(f"No risk assessment found for asset: {asset_id}")

        asset = self.data_assets[asset_id]
        risk_metrics = self.risk_assessments[asset_id]

        identified_risks = []
        recommended_actions = []
        technical_controls = []
        organizational_controls = []

        # Analyze reidentification risk
        if risk_metrics.reidentification_risk > 0.6:
            identified_risks.append("High reidentification risk")
            recommended_actions.append("Implement k-anonymity or l-diversity")
            technical_controls.append("Data anonymization engine")
            technical_controls.append("Differential privacy mechanisms")

        # Analyze data minimization
        if risk_metrics.data_minimization_score < 0.6:
            identified_risks.append("Poor data minimization practices")
            recommended_actions.append("Review and reduce collected data categories")
            organizational_controls.append("Data minimization training")
            organizational_controls.append("Regular data inventory audits")

        # Analyze consent compliance
        if risk_metrics.consent_compliance_score < 0.7:
            identified_risks.append("Consent compliance issues")
            recommended_actions.append("Review legal basis and consent mechanisms")
            organizational_controls.append("Consent management system")
            organizational_controls.append("Privacy notice updates")

        # Analyze security posture
        if risk_metrics.security_posture_score < 0.7:
            identified_risks.append("Inadequate security controls")
            recommended_actions.append("Enhance encryption and access controls")
            technical_controls.append("End-to-end encryption")
            technical_controls.append("Multi-factor authentication")
            technical_controls.append("Advanced audit logging")

        # Determine priority and timeline
        priority = risk_metrics.risk_level
        timeline_days = {
            RiskLevel.CRITICAL: 30,
            RiskLevel.HIGH: 60,
            RiskLevel.MODERATE: 120,
            RiskLevel.LOW: 180,
            RiskLevel.MINIMAL: 365
        }[priority]

        # Estimate cost (simplified)
        base_cost = asset.record_count * 0.10  # $0.10 per record
        complexity_multiplier = len(technical_controls) * 0.5 + len(organizational_controls) * 0.3
        estimated_cost = base_cost * (1 + complexity_multiplier)

        # Relevant compliance frameworks
        compliance_frameworks = ["GDPR", "FISMA"]
        if "health" in asset.data_type.lower():
            compliance_frameworks.append("HIPAA")
        if asset.data_subjects >= 100000:  # Large scale
            compliance_frameworks.append("CCPA")

        mitigation_plan = RiskMitigationPlan(
            asset_id=asset_id,
            identified_risks=identified_risks,
            recommended_actions=recommended_actions,
            technical_controls=technical_controls,
            organizational_controls=organizational_controls,
            timeline_days=timeline_days,
            estimated_cost=estimated_cost,
            compliance_frameworks=compliance_frameworks,
            priority=priority
        )

        self.mitigation_plans[asset_id] = mitigation_plan

        self.logger.info(f"Generated mitigation plan for {asset_id}: {len(recommended_actions)} actions, ${estimated_cost:.2f}")

        return mitigation_plan

    def get_risk_dashboard_data(self) -> Dict[str, Any]:
        """Get aggregated risk data for Command Portal dashboard."""
        if not self.risk_assessments:
            return {"message": "No risk assessments available"}

        # Aggregate risk statistics
        risk_levels = [assessment.risk_level for assessment in self.risk_assessments.values()]
        risk_level_counts = {level: risk_levels.count(level) for level in RiskLevel}

        # Calculate average scores
        avg_reidentification = sum(a.reidentification_risk for a in self.risk_assessments.values()) / len(self.risk_assessments)
        avg_data_minimization = sum(a.data_minimization_score for a in self.risk_assessments.values()) / len(self.risk_assessments)
        avg_consent_compliance = sum(a.consent_compliance_score for a in self.risk_assessments.values()) / len(self.risk_assessments)
        avg_security_posture = sum(a.security_posture_score for a in self.risk_assessments.values()) / len(self.risk_assessments)

        # High-risk assets requiring attention
        high_risk_assets = [
            asset_id for asset_id, assessment in self.risk_assessments.items()
            if assessment.risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]
        ]

        # Recent assessments (last 30 days)
        thirty_days_ago = datetime.now() - timedelta(days=30)
        recent_assessments = [
            record for record in self.assessment_history
            if datetime.fromisoformat(record["assessment_timestamp"]) > thirty_days_ago
        ]

        return {
            "workspace": self.workspace_name,
            "dashboard_timestamp": datetime.now().isoformat(),
            "overview": {
                "total_assets_assessed": len(self.risk_assessments),
                "total_mitigation_plans": len(self.mitigation_plans),
                "high_risk_assets": len(high_risk_assets),
                "recent_assessments_30_days": len(recent_assessments)
            },
            "risk_distribution": {
                "critical": risk_level_counts[RiskLevel.CRITICAL],
                "high": risk_level_counts[RiskLevel.HIGH],
                "moderate": risk_level_counts[RiskLevel.MODERATE],
                "low": risk_level_counts[RiskLevel.LOW],
                "minimal": risk_level_counts[RiskLevel.MINIMAL]
            },
            "average_scores": {
                "reidentification_risk": round(avg_reidentification, 3),
                "data_minimization_score": round(avg_data_minimization, 3),
                "consent_compliance_score": round(avg_consent_compliance, 3),
                "security_posture_score": round(avg_security_posture, 3)
            },
            "alerts": {
                "critical_risk_assets": [
                    asset_id for asset_id, assessment in self.risk_assessments.items()
                    if assessment.risk_level == RiskLevel.CRITICAL
                ],
                "overdue_mitigation_plans": [
                    plan.asset_id for plan in self.mitigation_plans.values()
                    if plan.priority in [RiskLevel.CRITICAL, RiskLevel.HIGH]
                ]
            },
            "compliance_status": {
                "gdpr_compliant_assets": sum(
                    1 for assessment in self.risk_assessments.values()
                    if assessment.overall_risk_score < 0.4
                ),
                "hipaa_applicable_assets": len([
                    asset for asset in self.data_assets.values()
                    if "health" in asset.data_type.lower()
                ]),
                "fisma_categorized_assets": len([
                    asset for asset in self.data_assets.values()
                    if asset.metadata.get("fisma_categorization")
                ])
            }
        }

    def generate_comprehensive_report(self, asset_id: str) -> Dict[str, Any]:
        """Generate comprehensive privacy risk report for specific asset."""
        if asset_id not in self.data_assets:
            return {"error": f"Data asset not found: {asset_id}"}

        asset = self.data_assets[asset_id]
        assessment = self.risk_assessments.get(asset_id)
        mitigation_plan = self.mitigation_plans.get(asset_id)

        return {
            "workspace": self.workspace_name,
            "report_timestamp": datetime.now().isoformat(),
            "asset_overview": {
                "asset_id": asset.asset_id,
                "name": asset.name,
                "data_type": asset.data_type,
                "sensitivity": asset.sensitivity.value,
                "record_count": asset.record_count,
                "data_subjects": asset.data_subjects,
                "purpose": asset.purpose,
                "legal_basis": asset.legal_basis
            },
            "risk_assessment": {
                "overall_risk_score": assessment.overall_risk_score if assessment else None,
                "risk_level": assessment.risk_level.value if assessment else "not_assessed",
                "reidentification_risk": assessment.reidentification_risk if assessment else None,
                "data_minimization_score": assessment.data_minimization_score if assessment else None,
                "consent_compliance_score": assessment.consent_compliance_score if assessment else None,
                "security_posture_score": assessment.security_posture_score if assessment else None,
                "assessment_date": assessment.assessment_timestamp if assessment else None
            },
            "mitigation_plan": {
                "plan_exists": mitigation_plan is not None,
                "identified_risks": mitigation_plan.identified_risks if mitigation_plan else [],
                "recommended_actions": mitigation_plan.recommended_actions if mitigation_plan else [],
                "technical_controls": mitigation_plan.technical_controls if mitigation_plan else [],
                "organizational_controls": mitigation_plan.organizational_controls if mitigation_plan else [],
                "timeline_days": mitigation_plan.timeline_days if mitigation_plan else None,
                "estimated_cost": mitigation_plan.estimated_cost if mitigation_plan else None,
                "priority": mitigation_plan.priority.value if mitigation_plan else None
            },
            "compliance_analysis": {
                "applicable_frameworks": self._get_applicable_frameworks(asset),
                "compliance_gaps": self._identify_compliance_gaps(asset, assessment),
                "regulatory_requirements": self._get_regulatory_requirements(asset)
            },
            "recommendations": self._generate_asset_recommendations(asset, assessment, mitigation_plan)
        }

    def _get_applicable_frameworks(self, asset: DataAsset) -> List[str]:
        """Determine applicable compliance frameworks for asset."""
        frameworks = ["FISMA"]  # Always applicable for government

        if asset.data_subjects >= 1:  # Any personal data
            frameworks.append("GDPR")

        if "health" in asset.data_type.lower() or "medical" in asset.purpose.lower():
            frameworks.append("HIPAA")

        if asset.data_subjects >= 100000:  # Large scale operations
            frameworks.append("CCPA")

        if asset.sensitivity in [DataSensitivity.RESTRICTED, DataSensitivity.TOP_SECRET]:
            frameworks.append("NIST-800-53")

        return frameworks

    def _identify_compliance_gaps(self, asset: DataAsset, assessment: Optional[PrivacyRiskMetrics]) -> List[str]:
        """Identify compliance gaps for the asset."""
        gaps = []

        if not assessment:
            gaps.append("No privacy risk assessment completed")
            return gaps

        if assessment.data_minimization_score < 0.6:
            gaps.append("Data minimization requirements not met")

        if assessment.consent_compliance_score < 0.7:
            gaps.append("Consent and legal basis issues")

        if assessment.security_posture_score < 0.7:
            gaps.append("Security controls insufficient")

        if asset.retention_period_days > 3650 and asset.data_type != "legal_documents":
            gaps.append("Retention period may exceed reasonable limits")

        if asset.cross_border_transfers and not asset.metadata.get("adequacy_decision"):
            gaps.append("Cross-border transfer safeguards needed")

        return gaps

    def _get_regulatory_requirements(self, asset: DataAsset) -> Dict[str, List[str]]:
        """Get specific regulatory requirements for asset."""
        requirements = {}

        if asset.data_subjects >= 1:  # GDPR applicable
            requirements["GDPR"] = [
                "Lawful basis for processing",
                "Data subject rights implementation",
                "Privacy notice requirements",
                "Data breach notification procedures"
            ]

            if asset.data_subjects >= 1000:
                requirements["GDPR"].append("Data Protection Impact Assessment (DPIA)")

        if "health" in asset.data_type.lower():
            requirements["HIPAA"] = [
                "Administrative safeguards",
                "Physical safeguards",
                "Technical safeguards",
                "Business associate agreements"
            ]

        requirements["FISMA"] = [
            "System categorization",
            "Security control implementation",
            "Continuous monitoring",
            "Authority to Operate (ATO)"
        ]

        return requirements

    def _generate_asset_recommendations(self, asset: DataAsset,
                                      assessment: Optional[PrivacyRiskMetrics],
                                      mitigation_plan: Optional[RiskMitigationPlan]) -> List[str]:
        """Generate specific recommendations for the asset."""
        recommendations = []

        if not assessment:
            recommendations.append("Conduct comprehensive privacy risk assessment")
            return recommendations

        if assessment.risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]:
            recommendations.append("Immediate privacy risk mitigation required")
            recommendations.append("Consider temporary data processing restrictions")

        if assessment.reidentification_risk > 0.6:
            recommendations.append("Implement advanced anonymization techniques")
            recommendations.append("Consider differential privacy for data releases")

        if asset.special_categories and assessment.consent_compliance_score < 0.8:
            recommendations.append("Review consent mechanisms for special category data")

        if asset.automated_processing and not asset.metadata.get("human_review"):
            recommendations.append("Implement human oversight for automated processing")

        if not mitigation_plan:
            recommendations.append("Develop formal risk mitigation plan")

        return recommendations


# Command Portal Integration Example
def example_government_privacy_risk_assessment():
    """Example of privacy risk assessment for government data."""
    engine = PrivacyRiskAssessmentEngine("terrafusion-command-portal")

    # Register a citizen services data asset
    citizen_asset = DataAsset(
        asset_id="citizen_services_db_2024",
        name="Citizen Services Database",
        data_type="citizen_data",
        sensitivity=DataSensitivity.CONFIDENTIAL,
        record_count=50000,
        data_subjects=45000,
        purpose="Provide government services to citizens",
        legal_basis="public_task",
        retention_period_days=2555,  # 7 years
        geographic_scope=["Benton County", "Washington State"],
        personal_data_categories=["name", "address", "phone", "email", "ssn", "income"],
        special_categories=["health_status"],
        third_party_sharing=False,
        automated_processing=True,
        metadata={
            "security_controls": ["encrypted", "access_controls", "audit_logging"],
            "fisma_categorization": "moderate",
            "ato_status": "active"
        }
    )

    engine.register_data_asset(citizen_asset)

    # Assess privacy risk
    risk_metrics = engine.assess_privacy_risk(citizen_asset.asset_id)
    print(f"Privacy risk assessment: {risk_metrics.risk_level.value}")
    print(f"Overall risk score: {risk_metrics.overall_risk_score:.3f}")
    print(f"Reidentification risk: {risk_metrics.reidentification_risk:.3f}")

    # Get dashboard data
    dashboard_data = engine.get_risk_dashboard_data()
    print(f"Total assets assessed: {dashboard_data['overview']['total_assets_assessed']}")
    print(f"High-risk assets: {dashboard_data['overview']['high_risk_assets']}")

    # Generate comprehensive report
    report = engine.generate_comprehensive_report(citizen_asset.asset_id)
    print(f"Compliance frameworks: {report['compliance_analysis']['applicable_frameworks']}")
    print(f"Recommendations: {len(report['recommendations'])}")


if __name__ == "__main__":
    example_government_privacy_risk_assessment()
