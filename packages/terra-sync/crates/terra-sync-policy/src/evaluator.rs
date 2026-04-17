use crate::manifest::{ContractManifest, CountyPolicy};
use terra_sync_proto::policy::{EvaluateRequest, EvaluateResponse};

pub struct PolicyEvaluator {
    manifest: ContractManifest,
}

impl PolicyEvaluator {
    pub fn new(manifest: ContractManifest) -> Self {
        Self { manifest }
    }

    pub fn evaluate(&self, req: &EvaluateRequest) -> EvaluateResponse {
        // 1. Global forbidden actions check
        for forbidden in &self.manifest.forbidden_actions {
            if forbidden.action == req.action {
                return EvaluateResponse {
                    allowed: false,
                    rule_matched: format!("forbidden_actions.{}", forbidden.action),
                    reason: forbidden.reason.clone(),
                };
            }
        }

        // 2. County-specific evaluation
        let county = self.find_county(&req.county_id);
        if let Some(cp) = county {
            return self.evaluate_county(cp, req);
        }

        // 3. Default: deny unknown county
        EvaluateResponse {
            allowed: false,
            rule_matched: "default.deny_unknown_county".into(),
            reason: format!("county_id {} not registered in manifest", req.county_id),
        }
    }

    fn find_county(&self, county_id: &str) -> Option<&CountyPolicy> {
        self.manifest.counties.values().find(|c| c.id == county_id)
    }

    fn evaluate_county(&self, cp: &CountyPolicy, req: &EvaluateRequest) -> EvaluateResponse {
        // Writeback is blocked unless an amendment permits it.
        if req.action == "writeback.write" && cp.read_only && cp.active_amendments.is_empty() {
            return EvaluateResponse {
                allowed: false,
                rule_matched: format!("counties.{}.read_only", cp.name.to_lowercase()),
                reason: "no active write-back amendment".into(),
            };
        }

        // Topic subscribe check
        if req.action == "topic.subscribe" {
            let topic = req.context.get("topic").cloned().unwrap_or_default();
            if cp.forbid_subscribe.iter().any(|p| glob_match(p, &topic)) {
                return EvaluateResponse {
                    allowed: false,
                    rule_matched: format!("counties.{}.forbid_subscribe", cp.name.to_lowercase()),
                    reason: format!("topic {} in county {} forbid list", topic, cp.name),
                };
            }
            if cp.allow_subscribe.iter().any(|p| glob_match(p, &topic)) {
                return EvaluateResponse {
                    allowed: true,
                    rule_matched: format!("counties.{}.allow_subscribe", cp.name.to_lowercase()),
                    reason: String::new(),
                };
            }
            return EvaluateResponse {
                allowed: false,
                rule_matched: "default.deny_topic_not_listed".into(),
                reason: format!("topic {} not in allow list for county {}", topic, cp.name),
            };
        }

        // Default-allow for other actions if county is known — conservative permissive
        EvaluateResponse {
            allowed: true,
            rule_matched: format!("counties.{}.default_allow", cp.name.to_lowercase()),
            reason: String::new(),
        }
    }
}

/// Minimal glob matcher: * matches any sequence.
fn glob_match(pattern: &str, s: &str) -> bool {
    let parts: Vec<&str> = pattern.split('*').collect();
    if parts.len() == 1 {
        return pattern == s;
    }
    let mut cursor = 0;
    for (i, part) in parts.iter().enumerate() {
        if part.is_empty() {
            continue;
        }
        if i == 0 {
            if !s[cursor..].starts_with(part) {
                return false;
            }
            cursor += part.len();
        } else if i == parts.len() - 1 {
            if !s[cursor..].ends_with(part) {
                return false;
            }
        } else if let Some(pos) = s[cursor..].find(part) {
            cursor += pos + part.len();
        } else {
            return false;
        }
    }
    true
}
