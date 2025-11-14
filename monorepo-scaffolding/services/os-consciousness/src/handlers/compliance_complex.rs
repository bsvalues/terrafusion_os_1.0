use axum::{extract::State, http::StatusCode, Json};
use serde_json::{Value, json};
use crate::AppState;

/// Monitor compliance across all government AI operations
#[utoipa::path(
    get,
    path = "/compliance/monitor",
    responses(
        (status = 200, description = "Compliance monitoring data retrieved")
    )
)]
pub async fn monitor_compliance(
    State(state): State<AppState>
) -> Result<Json<Value>, StatusCode> {
    // Get comprehensive compliance metrics
    let fisma_compliance = state.compliance_monitor.get_fisma_compliance_status().await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let nist_compliance = state.compliance_monitor.get_nist_compliance_status().await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let audit_status = state.compliance_monitor.get_audit_status().await
        .unwrap_or_default();

    let data_protection = state.compliance_monitor.get_data_protection_status().await
        .unwrap_or_default();

    let county_isolation = state.compliance_monitor.validate_county_isolation().await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Calculate overall compliance score
    let overall_compliance = calculate_overall_compliance(&fisma_compliance, &nist_compliance, &county_isolation);

    Ok(Json(json!({
        "compliance_monitoring_active": true,
        "overall_compliance_score": overall_compliance,
        "compliance_status": if overall_compliance >= 0.95 { "compliant" } else if overall_compliance >= 0.85 { "warning" } else { "non_compliant" },
        "fisma_compliance": {
            "status": fisma_compliance.status,
            "level": "FISMA-High",
            "compliance_score": fisma_compliance.compliance_score,
            "last_assessment": fisma_compliance.last_assessment,
            "next_assessment": fisma_compliance.next_assessment,
            "violations": fisma_compliance.violations,
            "remediation_required": fisma_compliance.violations.len() > 0
        },
        "nist_compliance": {
            "framework": "NIST 800-53",
            "status": nist_compliance.status,
            "compliance_score": nist_compliance.compliance_score,
            "implemented_controls": nist_compliance.implemented_controls,
            "missing_controls": nist_compliance.missing_controls,
            "controls_effectiveness": nist_compliance.controls_effectiveness
        },
        "county_data_isolation": {
            "isolation_status": county_isolation.status,
            "isolation_score": county_isolation.isolation_score,
            "sovereign_boundaries_maintained": county_isolation.sovereign_boundaries,
            "cross_county_leaks_detected": county_isolation.leak_count,
            "isolation_integrity": county_isolation.integrity_score
        },
        "audit_logging": {
            "logging_active": audit_status.logging_active,
            "events_logged_24h": audit_status.events_logged_24h,
            "log_integrity": audit_status.log_integrity,
            "retention_compliance": audit_status.retention_compliance,
            "log_analysis_current": audit_status.analysis_current
        },
        "data_protection": {
            "encryption_status": data_protection.encryption_status,
            "access_control_status": data_protection.access_control_status,
            "backup_status": data_protection.backup_status,
            "data_classification": data_protection.data_classification,
            "privacy_compliance": data_protection.privacy_compliance
        },
        "ai_governance": {
            "ai_ethics_compliance": state.compliance_monitor.get_ai_ethics_compliance().await.unwrap_or(0.0),
            "consciousness_oversight": state.config.supreme_commander.enabled,
            "decision_transparency": state.compliance_monitor.get_decision_transparency().await.unwrap_or(0.0),
            "bias_monitoring": state.compliance_monitor.get_bias_monitoring_status().await.unwrap_or_default()
        },
        "compliance_alerts": state.compliance_monitor.get_active_alerts().await.unwrap_or_default(),
        "timestamp": chrono::Utc::now()
    })))
}

/// Get current compliance status summary
#[utoipa::path(
    get,
    path = "/compliance/status",
    responses(
        (status = 200, description = "Compliance status retrieved successfully")
    )
)]
pub async fn get_compliance_status(
    State(state): State<AppState>
) -> Result<Json<Value>, StatusCode> {
    let compliance_summary = state.compliance_monitor.get_compliance_summary().await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let active_violations = state.compliance_monitor.get_active_violations().await
        .unwrap_or_default();

    let remediation_status = state.compliance_monitor.get_remediation_status().await
        .unwrap_or_default();

    let certification_status = state.compliance_monitor.get_certification_status().await
        .unwrap_or_default();

    Ok(Json(json!({
        "compliance_overview": {
            "overall_status": compliance_summary.overall_status,
            "compliance_percentage": format!("{:.2}%", compliance_summary.compliance_percentage * 100.0),
            "last_full_assessment": compliance_summary.last_assessment,
            "next_scheduled_assessment": compliance_summary.next_assessment,
            "assessment_frequency": "quarterly"
        },
        "active_violations": {
            "total_violations": active_violations.len(),
            "critical_violations": active_violations.iter().filter(|v| v.severity == "critical").count(),
            "high_violations": active_violations.iter().filter(|v| v.severity == "high").count(),
            "medium_violations": active_violations.iter().filter(|v| v.severity == "medium").count(),
            "low_violations": active_violations.iter().filter(|v| v.severity == "low").count(),
            "violations_list": active_violations
        },
        "remediation": {
            "open_remediation_items": remediation_status.open_items,
            "in_progress": remediation_status.in_progress,
            "completed_this_month": remediation_status.completed_this_month,
            "average_remediation_time_days": remediation_status.average_remediation_days,
            "overdue_items": remediation_status.overdue_items
        },
        "certifications": {
            "fedramp": {
                "status": certification_status.fedramp.status,
                "level": "High",
                "expiration": certification_status.fedramp.expiration,
                "next_review": certification_status.fedramp.next_review
            },
            "soc2": {
                "status": certification_status.soc2.status,
                "type": "Type II",
                "expiration": certification_status.soc2.expiration,
                "next_audit": certification_status.soc2.next_audit
            },
            "iso27001": {
                "status": certification_status.iso27001.status,
                "expiration": certification_status.iso27001.expiration,
                "surveillance_audit": certification_status.iso27001.next_surveillance
            }
        },
        "government_specific": {
            "ato_status": compliance_summary.ato_status, // Authority to Operate
            "ato_expiration": compliance_summary.ato_expiration,
            "continuous_monitoring": compliance_summary.continuous_monitoring,
            "poam_items": compliance_summary.poam_items, // Plan of Action & Milestones
            "government_compliance_score": compliance_summary.government_score
        },
        "timestamp": chrono::Utc::now()
    })))
}

/// Calculate overall compliance score from multiple compliance domains
fn calculate_overall_compliance(
    fisma: &crate::compliance_monitor::FismaCompliance,
    nist: &crate::compliance_monitor::NistCompliance,
    county_isolation: &crate::compliance_monitor::CountyIsolation
) -> f64 {
    let fisma_weight = 0.4;
    let nist_weight = 0.35;
    let isolation_weight = 0.25;

    (fisma.compliance_score * fisma_weight +
     nist.compliance_score * nist_weight +
     county_isolation.isolation_score * isolation_weight)
    .min(1.0)
    .max(0.0)
}
