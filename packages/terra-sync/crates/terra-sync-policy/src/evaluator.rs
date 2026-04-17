use crate::manifest::{ContractManifest, CountyPolicy};
use terra_sync_proto::policy::{EvaluateRequest, EvaluateResponse};

/// Narrow allowlist of read-only action verbs that default to allow when the
/// county is registered. Anything outside this set falls through to
/// default-deny. Keep this list tight — adding a verb here broadens the
/// contract without a manifest change.
const READ_ONLY_ACTIONS: &[&str] = &[
    "topic.subscribe",
    "manifest.read",
    "canonical.read",
    "lineage.read",
];

pub struct PolicyEvaluator {
    manifest: ContractManifest,
}

impl PolicyEvaluator {
    pub fn new(manifest: ContractManifest) -> Self {
        Self { manifest }
    }

    pub fn evaluate(&self, req: &EvaluateRequest) -> EvaluateResponse {
        // 1. Resolve county first. An amendment attached to a registered
        //    county can positively permit an action that would otherwise
        //    be denied by `forbidden_actions` (that is the whole point of
        //    an amendment). If no amendment permits the action we proceed
        //    through the normal forbidden/county-specific checks.
        let county = self.find_county(&req.county_id);

        if let Some((county_key, cp)) = county {
            if self.amendment_permits(&cp.active_amendments, &req.action) {
                return EvaluateResponse {
                    allowed: true,
                    rule_matched: format!("counties.{}.amendment_permits", county_key),
                    reason: String::new(),
                };
            }
        }

        // 2. Global forbidden actions — the constitutional floor.
        for forbidden in &self.manifest.forbidden_actions {
            if forbidden.action == req.action {
                return self.deny(
                    req,
                    &format!("forbidden_actions.{}", forbidden.action),
                    forbidden.reason.clone(),
                );
            }
        }

        // 3. County-specific evaluation.
        if let Some((county_key, cp)) = county {
            return self.evaluate_county(county_key, cp, req);
        }

        // 4. Default: deny unknown county.
        self.deny(
            req,
            "default.deny_unknown_county",
            format!("county_id {} not registered in manifest", req.county_id),
        )
    }

    fn find_county(&self, county_id: &str) -> Option<(&str, &CountyPolicy)> {
        self.manifest
            .counties
            .iter()
            .find(|(_, c)| c.id == county_id)
            .map(|(k, v)| (k.as_str(), v))
    }

    /// Returns true iff some amendment id referenced by the county is present
    /// in the manifest's amendments map, is `ratified: true`, and lists
    /// `action` in its `permits`. A county referencing an unknown or
    /// unratified amendment grants nothing.
    fn amendment_permits(&self, amendment_ids: &[String], action: &str) -> bool {
        amendment_ids.iter().any(|id| {
            self.manifest
                .amendments
                .get(id)
                .map(|a| a.ratified && a.permits.iter().any(|p| p == action))
                .unwrap_or(false)
        })
    }

    fn evaluate_county(
        &self,
        county_key: &str,
        cp: &CountyPolicy,
        req: &EvaluateRequest,
    ) -> EvaluateResponse {
        // Topic subscribe check — explicit allow/forbid pattern match.
        if req.action == "topic.subscribe" {
            let topic = req.context.get("topic").cloned().unwrap_or_default();
            if topic.is_empty() {
                return self.deny(
                    req,
                    "default.deny_topic_missing_context",
                    "topic.subscribe requires context.topic".to_string(),
                );
            }
            if cp.forbid_subscribe.iter().any(|p| glob_match(p, &topic)) {
                return self.deny(
                    req,
                    &format!("counties.{}.forbid_subscribe", county_key),
                    format!("topic {} in county {} forbid list", topic, cp.name),
                );
            }
            if cp.allow_subscribe.iter().any(|p| glob_match(p, &topic)) {
                return EvaluateResponse {
                    allowed: true,
                    rule_matched: format!("counties.{}.allow_subscribe", county_key),
                    reason: String::new(),
                };
            }
            return self.deny(
                req,
                "default.deny_topic_not_listed",
                format!("topic {} not in allow list for county {}", topic, cp.name),
            );
        }

        // Default-deny for unknown actions. The action must appear in the
        // narrow READ_ONLY_ACTIONS allowlist to fall through to allow.
        if READ_ONLY_ACTIONS.iter().any(|a| *a == req.action) {
            return EvaluateResponse {
                allowed: true,
                rule_matched: format!("counties.{}.read_only_default_allow", county_key),
                reason: String::new(),
            };
        }

        tracing::warn!(
            target: "policy.deny",
            action = %req.action,
            county_id = %req.county_id,
            actor = %req.actor_identity,
            "action not in read-only allowlist; denied by default"
        );
        self.deny(
            req,
            "default.deny_unknown_action",
            format!(
                "action {} not in read-only allowlist for county {}",
                req.action, cp.name
            ),
        )
    }

    /// Centralized deny path: logs to `policy.deny` tracing target, then
    /// builds the `EvaluateResponse`. Every return path in the evaluator
    /// that sets `allowed: false` goes through here.
    fn deny(&self, req: &EvaluateRequest, rule: &str, reason: String) -> EvaluateResponse {
        tracing::warn!(
            target: "policy.deny",
            action = %req.action,
            county_id = %req.county_id,
            actor = %req.actor_identity,
            rule = %rule,
            "policy denied request"
        );
        EvaluateResponse {
            allowed: false,
            rule_matched: rule.to_string(),
            reason,
        }
    }
}

/// Minimal glob matcher: `*` matches any sequence of bytes within an ASCII
/// string. Topics are ASCII by contract (namespaced with `.`, lowercase
/// verbs, hyphen/underscore). If either side contains non-ASCII bytes this
/// returns `false` rather than panic — we refuse to match rather than guess.
fn glob_match(pattern: &str, s: &str) -> bool {
    if !pattern.is_ascii() || !s.is_ascii() {
        return false;
    }
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
