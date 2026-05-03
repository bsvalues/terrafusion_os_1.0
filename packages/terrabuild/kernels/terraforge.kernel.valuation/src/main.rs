use std::io::{self, Read};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::Utc;

// --- Contracts ---

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Invocation {
    #[serde(rename = "contractPackVersion")]
    _contract_pack_version: String,
    #[serde(rename = "moduleApiVersion")]
    _module_api_version: String,
    #[serde(rename = "requestId")]
    _request_id: String,
    action: String,
    payload: serde_json::Value,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct Response<T> {
    success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    data: Option<T>,
    #[serde(skip_serializing_if = "Option::is_none")]
    audit_event: Option<AuditEvent>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct AuditEvent {
    event_id: String,
    timestamp: String,
    actor: String,
    action: String,
    resource_id: String,
    module: String,
    hash: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ValuationResult {
    total_value: f64,
    components: Components,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct Components {
    land: f64,
    building: f64,
}

// --- Domain Inputs ---

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct ValuationPayload {
    subject: Parcel,
    cost_breakdown: CostBreakdown,
    model: Model,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Parcel {
    parcel_id: String,
    #[allow(dead_code)]
    attributes: serde_json::Value,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct CostBreakdown {
    #[allow(dead_code)]
    replacement_cost: f64,
    #[allow(dead_code)]
    depreciation: f64,
    rcnld: f64,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Model {
    land_value: f64,
    adjustment_factors: Option<AdjustmentFactors>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct AdjustmentFactors {
    neighborhood: Option<f64>,
    location: Option<f64>,
}

fn calculate_valuation(payload: &ValuationPayload) -> ValuationResult {
    let land_value = payload.model.land_value;
    let building_value = payload.cost_breakdown.rcnld;

    let neighborhood_factor = payload.model.adjustment_factors
        .as_ref()
        .and_then(|f| f.neighborhood)
        .unwrap_or(1.0);

    let location_factor = payload.model.adjustment_factors
        .as_ref()
        .and_then(|f| f.location)
        .unwrap_or(1.0);

    let adjusted_building = building_value * neighborhood_factor * location_factor;
    let total_value = land_value + adjusted_building;

    ValuationResult {
        total_value,
        components: Components {
            land: land_value,
            building: adjusted_building,
        },
    }
}

fn main() -> io::Result<()> {
    // 1. Read Stdin
    let mut buffer = String::new();
    io::stdin().read_to_string(&mut buffer)?;

    // 2. Parse Invocation
    let invocation: Invocation = match serde_json::from_str(&buffer) {
        Ok(v) => v,
        Err(e) => {
            let resp: Response<()> = Response {
                success: false,
                error: Some(format!("Invalid JSON: {}", e)),
                data: None,
                audit_event: None,
            };
            println!("{}", serde_json::to_string(&resp)?);
            return Ok(());
        }
    };

    if invocation.action != "valuate" {
        let resp: Response<()> = Response {
            success: false,
            error: Some(format!("Unknown action: {}", invocation.action)),
            data: None,
            audit_event: None,
        };
        println!("{}", serde_json::to_string(&resp)?);
        return Ok(());
    }

    // 3. Extract Payload
    let payload: ValuationPayload = match serde_json::from_value(invocation.payload) {
        Ok(p) => p,
        Err(e) => {
            let resp: Response<()> = Response {
                success: false,
                error: Some(format!("Invalid Payload: {}", e)),
                data: None,
                audit_event: None,
            };
            println!("{}", serde_json::to_string(&resp)?);
            return Ok(());
        }
    };

    // 4. Calculate
    let result = calculate_valuation(&payload);

    let audit = AuditEvent {
        event_id: Uuid::new_v4().to_string(),
        timestamp: Utc::now().to_rfc3339(),
        actor: "system".to_string(),
        action: "valuate".to_string(),
        resource_id: payload.subject.parcel_id,
        module: "terraforge.kernel.valuation".to_string(),
        hash: format!("git:{}", env!("KERNEL_GIT_HASH")),
    };

    let response = Response {
        success: true,
        error: None,
        data: Some(result),
        audit_event: Some(audit),
    };

    // 6. Write Stdout
    println!("{}", serde_json::to_string(&response)?);

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn payload(adjustment_factors: Option<AdjustmentFactors>) -> ValuationPayload {
        ValuationPayload {
            subject: Parcel {
                parcel_id: "PARCEL-TEST".to_string(),
                attributes: serde_json::json!({}),
            },
            cost_breakdown: CostBreakdown {
                replacement_cost: 309_551.25,
                depreciation: 30_955.125,
                rcnld: 278_596.125,
            },
            model: Model {
                land_value: 65_000.0,
                adjustment_factors,
            },
        }
    }

    #[test]
    fn calculate_valuation_defaults_adjustments_to_one() {
        let result = calculate_valuation(&payload(None));

        assert_close(result.components.land, 65_000.0);
        assert_close(result.components.building, 278_596.125);
        assert_close(result.total_value, 343_596.125);
    }

    #[test]
    fn calculate_valuation_applies_adjustment_product() {
        let result = calculate_valuation(&payload(Some(AdjustmentFactors {
            neighborhood: Some(1.05),
            location: Some(0.98),
        })));

        assert_close(result.components.land, 65_000.0);
        assert_close(result.components.building, 286_675.412625);
        assert_close(result.total_value, 351_675.412625);
    }

    fn assert_close(actual: f64, expected: f64) {
        assert!(
            (actual - expected).abs() < 0.000_001,
            "actual {actual} expected {expected}"
        );
    }
}
