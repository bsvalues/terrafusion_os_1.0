#!/usr/bin/env python3
"""Audit Framework - Immutable audit trail generation"""

import json
import logging
import hashlib
from datetime import datetime
from typing import Dict, Any
from dataclasses import dataclass, asdict

logger = logging.getLogger(__name__)

@dataclass
class AuditEvent:
    """Immutable audit trail entry"""
    event_id: str
    timestamp: str
    event_type: str
    user: str
    resource_id: str
    resource_type: str
    action: str
    result: str
    ip_address: str
    user_agent: str
    details: Dict[str, Any]
    previous_hash: str = None
    event_hash: str = None

    def compute_hash(self) -> str:
        """Compute cryptographic hash for immutability"""
        event_data = json.dumps(asdict(self), sort_keys=True, default=str)
        return hashlib.sha256(event_data.encode()).hexdigest()

class AuditFramework:
    """Manages immutable audit trails"""

    def __init__(self, retention_years: int = 10):
        self.retention_years = retention_years
        self.event_chain = []
        self.chain_head_hash = None
        logger.info(f"Audit Framework initialized with {retention_years} year retention")

    def log_event(self, event: AuditEvent) -> str:
        """Log immutable audit event"""
        event.previous_hash = self.chain_head_hash
        event.event_hash = event.compute_hash()

        self.event_chain.append(event)
        self.chain_head_hash = event.event_hash

        logger.info(f"Audit event logged: {event.event_type} by {event.user}")
        return event.event_hash

    def verify_chain_integrity(self) -> bool:
        """Verify entire audit chain integrity"""
        for i, event in enumerate(self.event_chain):
            if i > 0:
                expected_prev = self.event_chain[i-1].event_hash
                if event.previous_hash != expected_prev:
                    logger.error(f"Chain integrity violation at event {i}")
                    return False

            expected_hash = event.compute_hash()
            if event.event_hash != expected_hash:
                logger.error(f"Event hash mismatch at event {i}")
                return False

        return True

    def retrieve_events(self, filters: Dict[str, Any]) -> list:
        """Retrieve audit events with filtering"""
        results = []

        for event in self.event_chain:
            match = True

            if "event_type" in filters and event.event_type != filters["event_type"]:
                match = False
            if "user" in filters and event.user != filters["user"]:
                match = False
            if "resource_id" in filters and event.resource_id != filters["resource_id"]:
                match = False

            if match:
                results.append(asdict(event))

        return results

    def generate_compliance_report(self) -> Dict[str, Any]:
        """Generate compliance audit report"""
        report = {
            "generated": datetime.now().isoformat(),
            "total_events": len(self.event_chain),
            "chain_integrity": self.verify_chain_integrity(),
            "events_by_type": self._aggregate_by_type(),
            "high_risk_events": self._identify_high_risk_events()
        }
        return report

    def _aggregate_by_type(self) -> Dict[str, int]:
        """Aggregate events by type"""
        aggregates = {}
        for event in self.event_chain:
            aggregates[event.event_type] = aggregates.get(event.event_type, 0) + 1
        return aggregates

    def _identify_high_risk_events(self) -> list:
        """Identify high-risk audit events"""
        high_risk = []
        high_risk_actions = ["delete", "export", "permission_grant", "policy_change"]

        for event in self.event_chain:
            if event.action in high_risk_actions:
                high_risk.append(asdict(event))

        return high_risk

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    framework = AuditFramework()
    logger.info("Audit Framework ready")
