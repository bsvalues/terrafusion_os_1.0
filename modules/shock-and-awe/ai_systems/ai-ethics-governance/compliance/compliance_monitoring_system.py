#!/usr/bin/env python3
"""
Regulatory Compliance Monitoring System for TerraFusion AI Systems
Comprehensive monitoring and reporting for multiple regulatory frameworks
"""

import sqlite3
import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import logging
import warnings
from abc import ABC, abstractmethod

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ComplianceStatus(Enum):
    """Compliance status enumeration"""
    COMPLIANT = "compliant"
    NON_COMPLIANT = "non_compliant"
    WARNING = "warning"
    UNDER_REVIEW = "under_review"
    REMEDIATION_REQUIRED = "remediation_required"

class RegulationType(Enum):
    """Types of regulations"""
    EU_AI_ACT = "eu_ai_act"
    GDPR = "gdpr"
    FCRA = "fcra"
    ECOA = "ecoa"
    APA = "apa"
    STATE_LOCAL = "state_local"

class ViolationSeverity(Enum):
    """Violation severity levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

@dataclass
class ComplianceRule:
    """Individual compliance rule definition"""
    rule_id: str
    regulation_type: RegulationType
    rule_name: str
    description: str
    severity: ViolationSeverity
    check_frequency: str  # 'real_time', 'daily', 'weekly', 'monthly'
    automated_check: bool
    remediation_steps: List[str]
    
class ComplianceViolation:
    """Compliance violation record"""
    def __init__(self, rule: ComplianceRule, violation_data: Dict[str, Any]):
        self.violation_id = self.generate_violation_id()
        self.rule = rule
        self.violation_data = violation_data
        self.timestamp = datetime.now()
        self.status = ComplianceStatus.NON_COMPLIANT
        self.resolution_notes = None
        self.resolved_date = None
    
    def generate_violation_id(self) -> str:
        """Generate unique violation ID"""
        import uuid
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        return f"VIOL-{timestamp}-{str(uuid.uuid4())[:8].upper()}"

class ComplianceChecker(ABC):
    """Abstract base class for compliance checkers"""
    
    @abstractmethod
    def check_compliance(self, data: Dict[str, Any]) -> Tuple[bool, Dict[str, Any]]:
        """Check compliance for given data"""
        pass
    
    @abstractmethod
    def get_remediation_steps(self, violation_data: Dict[str, Any]) -> List[str]:
        """Get specific remediation steps for violation"""
        pass

class BiasComplianceChecker(ComplianceChecker):
    """Bias and discrimination compliance checker"""
    
    def __init__(self, bias_thresholds: Dict[str, float] = None):
        self.bias_thresholds = bias_thresholds or {
            'statistical_parity': 0.05,
            'equalized_odds': 0.05,
            'demographic_parity_ratio': 0.05
        }
    
    def check_compliance(self, data: Dict[str, Any]) -> Tuple[bool, Dict[str, Any]]:
        """Check bias compliance"""
        bias_metrics = data.get('bias_metrics', {})
        violations = {}
        
        for metric, threshold in self.bias_thresholds.items():
            if metric in bias_metrics:
                value = bias_metrics[metric]
                if isinstance(value, dict):
                    # Handle ratio metrics with min/max thresholds
                    if metric == 'demographic_parity_ratio':
                        if value.get('min', 1) < (1 - threshold) or value.get('max', 1) > (1 + threshold):
                            violations[metric] = {
                                'value': value,
                                'threshold': threshold,
                                'violation_type': 'ratio_out_of_bounds'
                            }
                else:
                    # Handle difference metrics
                    if abs(value) > threshold:
                        violations[metric] = {
                            'value': value,
                            'threshold': threshold,
                            'violation_type': 'difference_exceeded'
                        }
        
        is_compliant = len(violations) == 0
        return is_compliant, {
            'violations': violations,
            'total_violations': len(violations),
            'checked_metrics': list(bias_metrics.keys())
        }
    
    def get_remediation_steps(self, violation_data: Dict[str, Any]) -> List[str]:
        """Get bias remediation steps"""
        steps = [
            "Conduct immediate bias analysis on affected demographic groups",
            "Implement bias mitigation techniques (resampling, reweighting, etc.)",
            "Retrain model with bias-corrected dataset",
            "Validate remediation effectiveness through testing",
            "Update monitoring to prevent future bias violations"
        ]
        
        # Add specific steps based on violation type
        violations = violation_data.get('violations', {})
        if 'statistical_parity' in violations:
            steps.append("Review selection rates across protected groups")
        if 'equalized_odds' in violations:
            steps.append("Examine true positive and false positive rates by group")
        
        return steps

class AccuracyComplianceChecker(ComplianceChecker):
    """Accuracy and performance compliance checker"""
    
    def __init__(self, accuracy_thresholds: Dict[str, float] = None):
        self.accuracy_thresholds = accuracy_thresholds or {
            'overall_accuracy': 0.85,
            'precision': 0.80,
            'recall': 0.80,
            'f1_score': 0.80
        }
    
    def check_compliance(self, data: Dict[str, Any]) -> Tuple[bool, Dict[str, Any]]:
        """Check accuracy compliance"""
        performance_metrics = data.get('performance_metrics', {})
        violations = {}
        
        for metric, threshold in self.accuracy_thresholds.items():
            if metric in performance_metrics:
                value = performance_metrics[metric]
                if value < threshold:
                    violations[metric] = {
                        'value': value,
                        'threshold': threshold,
                        'shortfall': threshold - value
                    }
        
        is_compliant = len(violations) == 0
        return is_compliant, {
            'violations': violations,
            'total_violations': len(violations),
            'performance_metrics': performance_metrics
        }
    
    def get_remediation_steps(self, violation_data: Dict[str, Any]) -> List[str]:
        """Get accuracy remediation steps"""
        return [
            "Analyze root causes of accuracy degradation",
            "Review and clean training data for quality issues",
            "Retrain model with improved data and techniques",
            "Implement additional validation and testing procedures",
            "Enhance ongoing monitoring and alerting systems"
        ]

class DataGovernanceChecker(ComplianceChecker):
    """Data governance and quality compliance checker"""
    
    def check_compliance(self, data: Dict[str, Any]) -> Tuple[bool, Dict[str, Any]]:
        """Check data governance compliance"""
        data_quality = data.get('data_quality_metrics', {})
        violations = {}
        
        # Check data completeness
        completeness = data_quality.get('completeness', 1.0)
        if completeness < 0.95:
            violations['data_completeness'] = {
                'value': completeness,
                'threshold': 0.95,
                'issue': 'Insufficient data completeness'
            }
        
        # Check data freshness
        last_update = data_quality.get('last_update')
        if last_update:
            days_since_update = (datetime.now() - datetime.fromisoformat(last_update)).days
            if days_since_update > 30:
                violations['data_freshness'] = {
                    'days_since_update': days_since_update,
                    'threshold': 30,
                    'issue': 'Data is not sufficiently fresh'
                }
        
        # Check data lineage
        if not data_quality.get('lineage_documented', False):
            violations['data_lineage'] = {
                'issue': 'Data lineage not properly documented'
            }
        
        is_compliant = len(violations) == 0
        return is_compliant, {'violations': violations}
    
    def get_remediation_steps(self, violation_data: Dict[str, Any]) -> List[str]:
        """Get data governance remediation steps"""
        return [
            "Implement comprehensive data quality monitoring",
            "Establish regular data refresh procedures",
            "Document complete data lineage and provenance",
            "Implement data validation and cleansing processes",
            "Create data quality dashboards and alerts"
        ]

class TransparencyComplianceChecker(ComplianceChecker):
    """Transparency and explainability compliance checker"""
    
    def check_compliance(self, data: Dict[str, Any]) -> Tuple[bool, Dict[str, Any]]:
        """Check transparency compliance"""
        transparency_metrics = data.get('transparency_metrics', {})
        violations = {}
        
        # Check explanation availability
        explanation_coverage = transparency_metrics.get('explanation_coverage', 0)
        if explanation_coverage < 1.0:
            violations['explanation_coverage'] = {
                'value': explanation_coverage,
                'threshold': 1.0,
                'issue': 'Not all decisions have explanations'
            }
        
        # Check explanation quality
        explanation_quality = transparency_metrics.get('explanation_quality_score', 0)
        if explanation_quality < 0.8:
            violations['explanation_quality'] = {
                'value': explanation_quality,
                'threshold': 0.8,
                'issue': 'Explanation quality below standards'
            }
        
        # Check human review availability
        human_review_rate = transparency_metrics.get('human_review_availability', 0)
        if human_review_rate < 1.0:
            violations['human_review'] = {
                'value': human_review_rate,
                'threshold': 1.0,
                'issue': 'Human review not available for all decisions'
            }
        
        is_compliant = len(violations) == 0
        return is_compliant, {'violations': violations}
    
    def get_remediation_steps(self, violation_data: Dict[str, Any]) -> List[str]:
        """Get transparency remediation steps"""
        return [
            "Implement comprehensive explanation generation for all decisions",
            "Improve explanation quality through better algorithms and training",
            "Establish human review processes for all decision types",
            "Create user-friendly explanation interfaces",
            "Train staff on explanation delivery and citizen communication"
        ]

class ComplianceMonitoringSystem:
    """Comprehensive compliance monitoring system"""
    
    def __init__(self, db_path: str = "compliance.db"):
        self.db_path = db_path
        self.checkers = {}
        self.rules = {}
        self.initialize_database()
        self.setup_compliance_checkers()
        self.load_compliance_rules()
    
    def initialize_database(self):
        """Initialize compliance monitoring database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Compliance rules table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS compliance_rules (
                rule_id TEXT PRIMARY KEY,
                regulation_type TEXT,
                rule_name TEXT,
                description TEXT,
                severity TEXT,
                check_frequency TEXT,
                automated_check BOOLEAN,
                remediation_steps TEXT,
                active BOOLEAN DEFAULT TRUE
            )
        ''')
        
        # Compliance violations table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS compliance_violations (
                violation_id TEXT PRIMARY KEY,
                rule_id TEXT,
                ai_system_name TEXT,
                violation_data TEXT,
                timestamp DATETIME,
                status TEXT,
                severity TEXT,
                resolution_notes TEXT,
                resolved_date DATETIME,
                assigned_to TEXT,
                FOREIGN KEY (rule_id) REFERENCES compliance_rules (rule_id)
            )
        ''')
        
        # Compliance checks table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS compliance_checks (
                check_id TEXT PRIMARY KEY,
                rule_id TEXT,
                ai_system_name TEXT,
                check_timestamp DATETIME,
                compliant BOOLEAN,
                check_results TEXT,
                automated BOOLEAN,
                performed_by TEXT,
                FOREIGN KEY (rule_id) REFERENCES compliance_rules (rule_id)
            )
        ''')
        
        # Compliance metrics table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS compliance_metrics (
                metric_id TEXT PRIMARY KEY,
                ai_system_name TEXT,
                metric_date DATE,
                regulation_type TEXT,
                compliance_score REAL,
                total_checks INTEGER,
                violations_count INTEGER,
                critical_violations INTEGER,
                metrics_data TEXT
            )
        ''')
        
        conn.commit()
        conn.close()
        logger.info("Compliance monitoring database initialized")
    
    def setup_compliance_checkers(self):
        """Setup all compliance checkers"""
        self.checkers = {
            'bias_checker': BiasComplianceChecker(),
            'accuracy_checker': AccuracyComplianceChecker(),
            'data_governance_checker': DataGovernanceChecker(),
            'transparency_checker': TransparencyComplianceChecker()
        }
    
    def load_compliance_rules(self):
        """Load compliance rules from database or create defaults"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM compliance_rules")
        if cursor.fetchone()[0] == 0:
            # Create default rules
            self.create_default_rules()
        
        # Load rules from database
        cursor.execute("SELECT * FROM compliance_rules WHERE active = TRUE")
        for row in cursor.fetchall():
            rule = ComplianceRule(
                rule_id=row[0],
                regulation_type=RegulationType(row[1]),
                rule_name=row[2],
                description=row[3],
                severity=ViolationSeverity(row[4]),
                check_frequency=row[5],
                automated_check=bool(row[6]),
                remediation_steps=json.loads(row[7])
            )
            self.rules[rule.rule_id] = rule
        
        conn.close()
        logger.info(f"Loaded {len(self.rules)} compliance rules")
    
    def create_default_rules(self):
        """Create default compliance rules"""
        default_rules = [
            {
                'rule_id': 'BIAS_STATISTICAL_PARITY',
                'regulation_type': RegulationType.ECOA.value,
                'rule_name': 'Statistical Parity Compliance',
                'description': 'Ensures equal selection rates across protected groups',
                'severity': ViolationSeverity.HIGH.value,
                'check_frequency': 'daily',
                'automated_check': True,
                'remediation_steps': json.dumps([
                    "Analyze bias across protected groups",
                    "Implement bias mitigation techniques",
                    "Retrain model with corrected data",
                    "Validate remediation effectiveness"
                ])
            },
            {
                'rule_id': 'ACCURACY_THRESHOLD',
                'regulation_type': RegulationType.EU_AI_ACT.value,
                'rule_name': 'AI System Accuracy Requirements',
                'description': 'Ensures AI system meets minimum accuracy thresholds',
                'severity': ViolationSeverity.HIGH.value,
                'check_frequency': 'weekly',
                'automated_check': True,
                'remediation_steps': json.dumps([
                    "Investigate accuracy degradation causes",
                    "Improve training data quality",
                    "Retrain and validate model performance",
                    "Update monitoring systems"
                ])
            },
            {
                'rule_id': 'DATA_QUALITY',
                'regulation_type': RegulationType.EU_AI_ACT.value,
                'rule_name': 'Training Data Quality Standards',
                'description': 'Ensures training data meets quality and governance standards',
                'severity': ViolationSeverity.MEDIUM.value,
                'check_frequency': 'monthly',
                'automated_check': True,
                'remediation_steps': json.dumps([
                    "Implement data quality monitoring",
                    "Establish data refresh procedures",
                    "Document data lineage",
                    "Create quality dashboards"
                ])
            },
            {
                'rule_id': 'TRANSPARENCY_REQUIREMENTS',
                'regulation_type': RegulationType.EU_AI_ACT.value,
                'rule_name': 'AI Decision Transparency',
                'description': 'Ensures all AI decisions are explainable and transparent',
                'severity': ViolationSeverity.HIGH.value,
                'check_frequency': 'daily',
                'automated_check': True,
                'remediation_steps': json.dumps([
                    "Implement explanation generation",
                    "Improve explanation quality",
                    "Establish human review processes",
                    "Train staff on explanations"
                ])
            }
        ]
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        for rule_data in default_rules:
            cursor.execute('''
                INSERT INTO compliance_rules (
                    rule_id, regulation_type, rule_name, description,
                    severity, check_frequency, automated_check, remediation_steps
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                rule_data['rule_id'],
                rule_data['regulation_type'],
                rule_data['rule_name'],
                rule_data['description'],
                rule_data['severity'],
                rule_data['check_frequency'],
                rule_data['automated_check'],
                rule_data['remediation_steps']
            ))
        
        conn.commit()
        conn.close()
    
    def perform_compliance_check(self, ai_system_name: str, system_data: Dict[str, Any],
                                check_type: str = 'automated') -> Dict[str, Any]:
        """Perform comprehensive compliance check"""
        check_results = {
            'ai_system': ai_system_name,
            'check_timestamp': datetime.now(),
            'check_type': check_type,
            'overall_compliant': True,
            'violations': [],
            'warnings': [],
            'compliance_score': 1.0
        }
        
        total_checks = 0
        passed_checks = 0
        
        # Run all automated checks
        for rule_id, rule in self.rules.items():
            if rule.automated_check or check_type == 'manual':
                total_checks += 1
                
                # Determine appropriate checker
                checker = self.get_checker_for_rule(rule)
                if checker:
                    try:
                        is_compliant, violation_data = checker.check_compliance(system_data)
                        
                        if is_compliant:
                            passed_checks += 1
                        else:
                            violation = ComplianceViolation(rule, violation_data)
                            check_results['violations'].append(violation)
                            check_results['overall_compliant'] = False
                            
                            # Record violation in database
                            self.record_violation(violation, ai_system_name)
                        
                        # Record the check
                        self.record_compliance_check(rule_id, ai_system_name, is_compliant, violation_data)
                        
                    except Exception as e:
                        logger.error(f"Error checking rule {rule_id}: {e}")
                        check_results['warnings'].append(f"Failed to check rule {rule_id}: {e}")
        
        # Calculate compliance score
        check_results['compliance_score'] = passed_checks / total_checks if total_checks > 0 else 1.0
        check_results['total_checks'] = total_checks
        check_results['passed_checks'] = passed_checks
        
        # Record overall compliance metrics
        self.record_compliance_metrics(ai_system_name, check_results)
        
        return check_results
    
    def get_checker_for_rule(self, rule: ComplianceRule) -> Optional[ComplianceChecker]:
        """Get appropriate checker for a compliance rule"""
        checker_mapping = {
            'BIAS_': 'bias_checker',
            'ACCURACY_': 'accuracy_checker',
            'DATA_': 'data_governance_checker',
            'TRANSPARENCY_': 'transparency_checker'
        }
        
        for prefix, checker_name in checker_mapping.items():
            if rule.rule_id.startswith(prefix):
                return self.checkers.get(checker_name)
        
        return None
    
    def record_violation(self, violation: ComplianceViolation, ai_system_name: str):
        """Record compliance violation in database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO compliance_violations (
                violation_id, rule_id, ai_system_name, violation_data,
                timestamp, status, severity
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            violation.violation_id,
            violation.rule.rule_id,
            ai_system_name,
            json.dumps(violation.violation_data, default=str),
            violation.timestamp,
            violation.status.value,
            violation.rule.severity.value
        ))
        
        conn.commit()
        conn.close()
    
    def record_compliance_check(self, rule_id: str, ai_system_name: str,
                              compliant: bool, results: Dict[str, Any]):
        """Record compliance check in database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        check_id = f"CHECK-{datetime.now().strftime('%Y%m%d%H%M%S')}-{rule_id}"
        
        cursor.execute('''
            INSERT INTO compliance_checks (
                check_id, rule_id, ai_system_name, check_timestamp,
                compliant, check_results, automated
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            check_id, rule_id, ai_system_name, datetime.now(),
            compliant, json.dumps(results, default=str), True
        ))
        
        conn.commit()
        conn.close()
    
    def record_compliance_metrics(self, ai_system_name: str, check_results: Dict[str, Any]):
        """Record compliance metrics for reporting"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        metric_id = f"METRIC-{datetime.now().strftime('%Y%m%d')}-{ai_system_name}"
        
        critical_violations = sum(1 for v in check_results['violations'] 
                                if v.rule.severity == ViolationSeverity.CRITICAL)
        
        cursor.execute('''
            INSERT OR REPLACE INTO compliance_metrics (
                metric_id, ai_system_name, metric_date, compliance_score,
                total_checks, violations_count, critical_violations, metrics_data
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            metric_id,
            ai_system_name,
            datetime.now().date(),
            check_results['compliance_score'],
            check_results['total_checks'],
            len(check_results['violations']),
            critical_violations,
            json.dumps(check_results, default=str)
        ))
        
        conn.commit()
        conn.close()
    
    def generate_compliance_report(self, ai_system_name: str = None,
                                 time_period: int = 30) -> Dict[str, Any]:
        """Generate comprehensive compliance report"""
        conn = sqlite3.connect(self.db_path)
        
        # Build query conditions
        where_conditions = ["metric_date >= date('now', '-{} days')".format(time_period)]
        params = []
        
        if ai_system_name:
            where_conditions.append("ai_system_name = ?")
            params.append(ai_system_name)
        
        where_clause = " AND ".join(where_conditions)
        
        # Get compliance metrics
        query = f'''
            SELECT ai_system_name, AVG(compliance_score) as avg_score,
                   SUM(violations_count) as total_violations,
                   SUM(critical_violations) as critical_violations
            FROM compliance_metrics
            WHERE {where_clause}
            GROUP BY ai_system_name
        '''
        
        metrics_df = pd.read_sql_query(query, conn, params=params)
        
        # Get recent violations
        violation_query = f'''
            SELECT v.*, r.regulation_type, r.rule_name
            FROM compliance_violations v
            JOIN compliance_rules r ON v.rule_id = r.rule_id
            WHERE datetime(v.timestamp) >= datetime('now', '-{time_period} days')
        '''
        
        if ai_system_name:
            violation_query += " AND v.ai_system_name = ?"
            params_violations = [ai_system_name]
        else:
            params_violations = []
        
        violations_df = pd.read_sql_query(violation_query, conn, params=params_violations)
        
        conn.close()
        
        # Generate report
        report = {
            'report_date': datetime.now().isoformat(),
            'time_period_days': time_period,
            'ai_system': ai_system_name or 'All Systems',
            'overall_compliance_score': float(metrics_df['avg_score'].mean()) if not metrics_df.empty else 1.0,
            'total_violations': int(violations_df.shape[0]),
            'critical_violations': int(violations_df[violations_df['severity'] == 'critical'].shape[0]),
            'system_scores': metrics_df.to_dict('records') if not metrics_df.empty else [],
            'violation_breakdown': self.analyze_violations(violations_df),
            'compliance_trends': self.analyze_compliance_trends(time_period),
            'recommendations': self.generate_compliance_recommendations(violations_df)
        }
        
        return report
    
    def analyze_violations(self, violations_df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze violation patterns"""
        if violations_df.empty:
            return {'by_regulation': {}, 'by_severity': {}, 'by_system': {}}
        
        return {
            'by_regulation': violations_df['regulation_type'].value_counts().to_dict(),
            'by_severity': violations_df['severity'].value_counts().to_dict(),
            'by_system': violations_df['ai_system_name'].value_counts().to_dict(),
            'most_common_rules': violations_df['rule_name'].value_counts().head(5).to_dict()
        }
    
    def analyze_compliance_trends(self, days: int) -> Dict[str, Any]:
        """Analyze compliance trends over time"""
        conn = sqlite3.connect(self.db_path)
        
        query = '''
            SELECT metric_date, AVG(compliance_score) as daily_score,
                   SUM(violations_count) as daily_violations
            FROM compliance_metrics
            WHERE metric_date >= date('now', '-{} days')
            GROUP BY metric_date
            ORDER BY metric_date
        '''.format(days)
        
        trend_df = pd.read_sql_query(query, conn)
        conn.close()
        
        if trend_df.empty:
            return {'trend_direction': 'stable', 'score_change': 0, 'violation_trend': 'stable'}
        
        # Calculate trends
        recent_score = trend_df['daily_score'].tail(7).mean()
        earlier_score = trend_df['daily_score'].head(7).mean()
        score_change = recent_score - earlier_score
        
        recent_violations = trend_df['daily_violations'].tail(7).sum()
        earlier_violations = trend_df['daily_violations'].head(7).sum()
        
        return {
            'trend_direction': 'improving' if score_change > 0.01 else 'declining' if score_change < -0.01 else 'stable',
            'score_change': float(score_change),
            'recent_avg_score': float(recent_score),
            'violation_trend': 'increasing' if recent_violations > earlier_violations else 'decreasing' if recent_violations < earlier_violations else 'stable',
            'recent_violations': int(recent_violations),
            'trend_data': trend_df.to_dict('records')
        }
    
    def generate_compliance_recommendations(self, violations_df: pd.DataFrame) -> List[str]:
        """Generate compliance improvement recommendations"""
        recommendations = []
        
        if violations_df.empty:
            recommendations.append("Maintain current compliance practices and monitoring")
            return recommendations
        
        # Analyze violation patterns
        common_rules = violations_df['rule_id'].value_counts().head(3)
        
        for rule_id, count in common_rules.items():
            rule = self.rules.get(rule_id)
            if rule:
                recommendations.append(
                    f"Address recurring {rule.rule_name} violations ({count} occurrences) by implementing: "
                    f"{'; '.join(rule.remediation_steps[:2])}"
                )
        
        # Check for critical violations
        critical_violations = violations_df[violations_df['severity'] == 'critical']
        if not critical_violations.empty:
            recommendations.append(
                f"Immediately address {len(critical_violations)} critical compliance violations "
                "with dedicated remediation team and accelerated timeline"
            )
        
        # System-specific recommendations
        problem_systems = violations_df['ai_system_name'].value_counts().head(2)
        for system, count in problem_systems.items():
            if count > 5:
                recommendations.append(
                    f"Conduct comprehensive compliance review of {system} "
                    f"({count} violations) including system architecture and processes"
                )
        
        return recommendations

# Example usage and testing
def main():
    """Example usage of compliance monitoring system"""
    
    # Initialize monitoring system
    compliance_system = ComplianceMonitoringSystem()
    
    # Example AI system data for testing
    system_data = {
        'bias_metrics': {
            'statistical_parity': 0.08,  # Violation: exceeds 0.05 threshold
            'equalized_odds': 0.03,      # Compliant
            'demographic_parity_ratio': {'min': 0.85, 'max': 1.15}  # Violation
        },
        'performance_metrics': {
            'overall_accuracy': 0.87,    # Compliant
            'precision': 0.75,           # Violation: below 0.80 threshold
            'recall': 0.82,              # Compliant
            'f1_score': 0.78             # Violation: below 0.80 threshold
        },
        'data_quality_metrics': {
            'completeness': 0.98,        # Compliant
            'last_update': '2025-07-15', # Violation: too old
            'lineage_documented': True   # Compliant
        },
        'transparency_metrics': {
            'explanation_coverage': 1.0,        # Compliant
            'explanation_quality_score': 0.75,  # Violation: below 0.80
            'human_review_availability': 1.0    # Compliant
        }
    }
    
    # Perform compliance check
    print("Performing compliance check...")
    check_results = compliance_system.perform_compliance_check("PropertyAssessmentAI", system_data)
    
    print(f"Overall Compliance: {'PASS' if check_results['overall_compliant'] else 'FAIL'}")
    print(f"Compliance Score: {check_results['compliance_score']:.2%}")
    print(f"Violations Found: {len(check_results['violations'])}")
    
    # Display violations
    for violation in check_results['violations']:
        print(f"\nViolation: {violation.rule.rule_name}")
        print(f"Severity: {violation.rule.severity.value}")
        print(f"Description: {violation.rule.description}")
    
    # Generate compliance report
    print("\nGenerating compliance report...")
    report = compliance_system.generate_compliance_report("PropertyAssessmentAI", time_period=30)
    
    print(f"Report Date: {report['report_date']}")
    print(f"Overall Compliance Score: {report['overall_compliance_score']:.2%}")
    print(f"Total Violations: {report['total_violations']}")
    print(f"Critical Violations: {report['critical_violations']}")
    
    print("\nRecommendations:")
    for i, rec in enumerate(report['recommendations'][:3], 1):
        print(f"{i}. {rec}")

if __name__ == "__main__":
    main()