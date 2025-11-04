#!/usr/bin/env python3
"""Policy Conflict Resolution Engine"""

import json
import logging
from typing import Dict, List, Tuple
from enum import Enum

logger = logging.getLogger(__name__)

class PolicyConflictResolver:
    """Resolves conflicts between policies"""

    def __init__(self):
        self.policies = {}
        self.priority_matrix = self._build_priority_matrix()
        logger.info("Policy Conflict Resolver initialized")

    def register_policy(self, policy_id: str, policy: dict) -> None:
        """Register governance policy"""
        self.policies[policy_id] = {
            "policy": policy,
            "enabled": policy.get("enabled", True),
            "priority": policy.get("priority", 50),
            "conflicts": []
        }
        logger.info(f"Policy registered: {policy_id}")

    def detect_conflicts(self) -> List[Dict[str, any]]:
        """Detect conflicts between active policies"""
        conflicts = []
        policy_list = list(self.policies.items())

        for i, (id1, data1) in enumerate(policy_list):
            for id2, data2 in policy_list[i+1:]:
                if data1["enabled"] and data2["enabled"]:
                    conflict = self._check_policy_conflict(id1, data1["policy"], id2, data2["policy"])
                    if conflict:
                        conflicts.append({
                            "policy_1": id1,
                            "policy_2": id2,
                            "conflict_type": conflict,
                            "resolution": self._resolve_conflict(id1, id2, data1, data2)
                        })

        return conflicts

    def resolve_policy_decision(self, operation: dict) -> Tuple[str, str]:
        """Resolve policy decision when conflicts exist"""
        applicable_policies = self._find_applicable_policies(operation)

        if not applicable_policies:
            return "approved", "No policies apply"

        decisions = []
        for policy_id in applicable_policies:
            decision = self._evaluate_policy(policy_id, operation)
            priority = self.policies[policy_id]["priority"]
            decisions.append((priority, decision, policy_id))

        decisions.sort(reverse=True)

        final_decision = decisions[0][1]
        deciding_policy = decisions[0][2]

        return final_decision, f"Decision by policy: {deciding_policy}"

    def _build_priority_matrix(self) -> dict:
        """Build policy priority matrix"""
        return {
            "security": 90,
            "compliance": 85,
            "operational": 70,
            "business": 50
        }

    def _check_policy_conflict(self, id1: str, policy1: dict, id2: str, policy2: dict) -> str:
        """Check if two policies conflict"""
        if policy1.get("allow") == True and policy2.get("allow") == False:
            return "allow_deny_conflict"
        return None

    def _resolve_conflict(self, id1: str, id2: str, data1: dict, data2: dict) -> str:
        """Resolve conflict between two policies"""
        if data1["priority"] > data2["priority"]:
            return f"{id1} takes precedence (priority: {data1['priority']})"
        else:
            return f"{id2} takes precedence (priority: {data2['priority']})"

    def _find_applicable_policies(self, operation: dict) -> List[str]:
        """Find applicable policies for operation"""
        applicable = []
        for policy_id, data in self.policies.items():
            if data["enabled"]:
                applicable.append(policy_id)
        return applicable

    def _evaluate_policy(self, policy_id: str, operation: dict) -> str:
        """Evaluate policy decision"""
        policy = self.policies[policy_id]["policy"]
        if policy.get("allow"):
            return "approved"
        return "denied"

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    resolver = PolicyConflictResolver()
    logger.info("Policy Conflict Resolver ready")
