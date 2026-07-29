use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io::{self, Read};
use uuid::Uuid;

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
struct CostResult {
    replacement_cost: f64,
    depreciation: f64,
    rcnld: f64,
}

// --- Domain Inputs ---

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct CostPayload {
    subject: Parcel,
    tables: CostFactors,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Parcel {
    parcel_id: String,
    attributes: Attributes,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Attributes {
    sqft: f64,
    quality: Option<String>,
    condition: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct CostFactors {
    base_rate: f64,
    modifiers: HashMap<String, f64>,
}

fn calculate_cost(payload: &CostPayload) -> CostResult {
    let sqft = payload.subject.attributes.sqft;
    let base_rate = payload.tables.base_rate;

    let quality = payload
        .subject
        .attributes
        .quality
        .as_deref()
        .unwrap_or("Average");
    let condition = payload
        .subject
        .attributes
        .condition
        .as_deref()
        .unwrap_or("Average");

    let mod_q = payload
        .tables
        .modifiers
        .get(quality)
        .copied()
        .unwrap_or(1.0);
    let mod_c = payload
        .tables
        .modifiers
        .get(condition)
        .copied()
        .unwrap_or(1.0);

    let replacement_cost = sqft * base_rate * mod_q * mod_c;
    let depr_rate = payload
        .tables
        .modifiers
        .get("DepreciationRate")
        .copied()
        .unwrap_or(0.10);
    let depreciation = depr_rate * replacement_cost;
    let rcnld = replacement_cost - depreciation;

    CostResult {
        replacement_cost,
        depreciation,
        rcnld,
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

    if invocation.action != "calculate_cost" {
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
    let payload: CostPayload = match serde_json::from_value(invocation.payload) {
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
    // NOTE: Depreciation defaults to 10%. The .NET CostForgeController owns the real
    // depreciation schedule (age-based, condition-adjusted) via POST /api/costforge/depreciation-calculate.
    // This kernel is used for batch/offline/audited scenarios where the depreciation rate
    // is passed in via modifiers (e.g. "DepreciationRate": 0.15 in the modifiers map).
    let result = calculate_cost(&payload);

    let audit = AuditEvent {
        event_id: Uuid::new_v4().to_string(),
        timestamp: Utc::now().to_rfc3339(),
        actor: "system".to_string(),
        action: "calculate_cost".to_string(),
        resource_id: payload.subject.parcel_id,
        module: "terraforge.kernel.cost".to_string(),
        // git:<12-char commit SHA> embedded at build time by build.rs.
        // Audit trail: check out this commit, rebuild, and you reproduce the binary
        // that produced this valuation. Satisfies FISMA calculation provenance requirement.
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

    fn payload_with_modifiers(modifiers: HashMap<String, f64>) -> CostPayload {
        CostPayload {
            subject: Parcel {
                parcel_id: "PARCEL-TEST".to_string(),
                attributes: Attributes {
                    sqft: 1_850.0,
                    quality: Some("GOOD".to_string()),
                    condition: Some("AVERAGE".to_string()),
                },
            },
            tables: CostFactors {
                base_rate: 145.50,
                modifiers,
            },
        }
    }

    #[test]
    fn calculate_cost_uses_default_depreciation_rate() {
        let modifiers = HashMap::from([("GOOD".to_string(), 1.15), ("AVERAGE".to_string(), 1.0)]);
        let result = calculate_cost(&payload_with_modifiers(modifiers));

        assert_close(result.replacement_cost, 309_551.25);
        assert_close(result.depreciation, 30_955.125);
        assert_close(result.rcnld, 278_596.125);
    }

    #[test]
    fn calculate_cost_honors_depreciation_override() {
        let modifiers = HashMap::from([
            ("GOOD".to_string(), 1.15),
            ("AVERAGE".to_string(), 1.0),
            ("DepreciationRate".to_string(), 0.20),
        ]);
        let result = calculate_cost(&payload_with_modifiers(modifiers));

        assert_close(result.replacement_cost, 309_551.25);
        assert_close(result.depreciation, 61_910.25);
        assert_close(result.rcnld, 247_641.0);
    }

    fn assert_close(actual: f64, expected: f64) {
        assert!(
            (actual - expected).abs() < 0.000_001,
            "actual {actual} expected {expected}"
        );
    }
}
