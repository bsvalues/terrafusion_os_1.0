#!/usr/bin/env python3
"""
TerraFusion RI (Resilience Index) Calculator
Real-time computation of service resilience metrics from Prometheus data.

Architecture Integration:
- Feeds into Telemetry layer (ARCHITECTURE.md § Telemetry Architecture)
- Consumed by AI Swarm monitoring (swarm-master-control.js)
- Exported as custom Prometheus metrics for Grafana dashboards

RI Formula:
  RI = (1 - error_rate) * availability_factor * latency_factor
  
  Where:
    error_rate = rate(errors[5m]) / rate(requests[5m])
    availability_factor = 1.0 if service is up, 0.0 if down
    latency_factor = 1.0 if p95 <= target, exponential decay if > target

Author: TerraFusion Platform Team
Last Updated: 2025-10-07
Compliance: Aligns with CAMA migration validation gates (CAMA_MIGRATION_PLAYBOOK.md)
"""

import os
import sys
import time
import logging
import argparse
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass

import requests
from prometheus_client import start_http_server, Gauge, Counter, Histogram


# =============================================================================
# Configuration
# =============================================================================

PROMETHEUS_URL = os.getenv("PROMETHEUS_URL", "http://localhost:9090")
CALCULATION_INTERVAL = int(os.getenv("RI_CALCULATION_INTERVAL", "30"))  # seconds
EXPORT_PORT = int(os.getenv("RI_EXPORT_PORT", "9091"))

# Service-specific RI targets (from DAY_9_F1F4_README.md)
SERVICE_TARGETS = {
    "f1-gateway": {
        "target_ri": 0.9500,
        "target_p95_latency": 0.500,  # 500ms
        "error_rate_threshold": 0.01,  # 1%
    },
    "f2-processor": {
        "target_ri": 0.9500,
        "target_p95_latency": 0.060,  # 60s recovery (from Day 8)
        "error_rate_threshold": 0.005,  # 0.5%
    },
    "f4-cache": {
        "target_ri": 0.9300,
        "target_p95_latency": 0.800,  # 800ms
        "error_rate_threshold": 0.015,  # 1.5%
    },
}

# Prometheus metric queries (service-agnostic templates)
QUERIES = {
    "request_rate": 'rate({metric_prefix}_requests_total{{service="{service}"}}[5m])',
    "error_rate": 'rate({metric_prefix}_errors_total{{service="{service}"}}[5m])',
    "latency_p95": 'histogram_quantile(0.95, rate({metric_prefix}_latency_bucket{{service="{service}"}}[5m]))',
    "up": 'up{{job="{service}"}}',
}


# =============================================================================
# Data Models
# =============================================================================

@dataclass
class RIMetrics:
    """Container for RI calculation components."""
    service: str
    timestamp: datetime
    request_rate: float
    error_rate: float
    error_rate_pct: float
    latency_p95: float
    availability: float
    ri_raw: float
    ri_adjusted: float
    target_ri: float
    delta_from_target: float
    meets_target: bool


# =============================================================================
# Prometheus Client
# =============================================================================

class PrometheusClient:
    """Query Prometheus for service metrics."""
    
    def __init__(self, url: str):
        self.url = url.rstrip("/")
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def query(self, query: str) -> Optional[float]:
        """Execute instant query, return single float value."""
        try:
            response = self.session.get(
                f"{self.url}/api/v1/query",
                params={"query": query},
                timeout=10,
            )
            response.raise_for_status()
            data = response.json()
            
            if data["status"] != "success":
                logging.error(f"Query failed: {data.get('error', 'Unknown error')}")
                return None
            
            result = data.get("data", {}).get("result", [])
            if not result:
                logging.warning(f"No data returned for query: {query}")
                return None
            
            # Return first result value (assumes single time series)
            value = result[0]["value"][1]
            return float(value)
        
        except requests.exceptions.RequestException as e:
            logging.error(f"Prometheus query error: {e}")
            return None
        except (ValueError, KeyError, IndexError) as e:
            logging.error(f"Failed to parse Prometheus response: {e}")
            return None


# =============================================================================
# RI Calculator
# =============================================================================

class RICalculator:
    """Calculate real-time RI for TerraFusion services."""
    
    def __init__(self, prometheus_url: str):
        self.prom = PrometheusClient(prometheus_url)
        
        # Prometheus metrics for export
        self.ri_gauge = Gauge(
            "terrafusion_service_ri",
            "Service Resilience Index (0.0-1.0)",
            ["service"],
        )
        self.ri_delta_gauge = Gauge(
            "terrafusion_service_ri_delta",
            "Delta from target RI (negative = below target)",
            ["service"],
        )
        self.error_rate_gauge = Gauge(
            "terrafusion_service_error_rate",
            "Service error rate (percentage)",
            ["service"],
        )
        self.latency_p95_gauge = Gauge(
            "terrafusion_service_latency_p95",
            "Service p95 latency (seconds)",
            ["service"],
        )
        
        # Counters for calculations
        self.ri_calculations = Counter(
            "terrafusion_ri_calculations_total",
            "Total RI calculations performed",
            ["service"],
        )
        self.ri_target_met = Counter(
            "terrafusion_ri_target_met_total",
            "Count of times service met RI target",
            ["service"],
        )
        self.ri_target_missed = Counter(
            "terrafusion_ri_target_missed_total",
            "Count of times service missed RI target",
            ["service"],
        )
    
    def calculate_ri(self, service: str, metric_prefix: str = "http") -> Optional[RIMetrics]:
        """
        Calculate RI for a service.
        
        RI Components:
        1. Error Rate Factor: (1 - error_rate)
        2. Availability Factor: 1.0 if up, 0.0 if down
        3. Latency Factor: Exponential decay if p95 > target
        
        Returns:
            RIMetrics object with all components, or None if insufficient data
        """
        target_config = SERVICE_TARGETS.get(service)
        if not target_config:
            logging.error(f"Unknown service: {service} (not in SERVICE_TARGETS)")
            return None
        
        # Query Prometheus for metrics
        queries = {k: v.format(metric_prefix=metric_prefix, service=service) 
                   for k, v in QUERIES.items()}
        
        request_rate = self.prom.query(queries["request_rate"]) or 0.0
        error_rate = self.prom.query(queries["error_rate"]) or 0.0
        latency_p95 = self.prom.query(queries["latency_p95"]) or 0.0
        availability = self.prom.query(queries["up"]) or 0.0
        
        # Calculate error rate percentage
        if request_rate > 0:
            error_rate_pct = (error_rate / request_rate) * 100
        else:
            error_rate_pct = 0.0
        
        # Component 1: Error Rate Factor
        error_factor = max(0.0, 1.0 - (error_rate / max(request_rate, 1e-6)))
        
        # Component 2: Availability Factor (binary: 1.0 or 0.0)
        availability_factor = 1.0 if availability > 0.5 else 0.0
        
        # Component 3: Latency Factor (exponential decay beyond target)
        target_p95 = target_config["target_p95_latency"]
        if latency_p95 <= target_p95:
            latency_factor = 1.0
        else:
            # Exponential decay: factor = exp(-k * (actual - target) / target)
            # k = 2.0 gives ~13% penalty at 2x target, ~63% penalty at 3x target
            overshoot_ratio = (latency_p95 - target_p95) / target_p95
            latency_factor = max(0.0, 1.0 - (overshoot_ratio ** 0.5))
        
        # Final RI calculation
        ri_raw = error_factor * availability_factor * latency_factor
        
        # Adjusted RI (clamp to [0.0, 1.0])
        ri_adjusted = max(0.0, min(1.0, ri_raw))
        
        # Compare to target
        target_ri = target_config["target_ri"]
        delta = ri_adjusted - target_ri
        meets_target = ri_adjusted >= target_ri
        
        # Update Prometheus metrics
        self.ri_gauge.labels(service=service).set(ri_adjusted)
        self.ri_delta_gauge.labels(service=service).set(delta)
        self.error_rate_gauge.labels(service=service).set(error_rate_pct)
        self.latency_p95_gauge.labels(service=service).set(latency_p95)
        
        self.ri_calculations.labels(service=service).inc()
        if meets_target:
            self.ri_target_met.labels(service=service).inc()
        else:
            self.ri_target_missed.labels(service=service).inc()
        
        # Package results
        return RIMetrics(
            service=service,
            timestamp=datetime.utcnow(),
            request_rate=request_rate,
            error_rate=error_rate,
            error_rate_pct=error_rate_pct,
            latency_p95=latency_p95,
            availability=availability,
            ri_raw=ri_raw,
            ri_adjusted=ri_adjusted,
            target_ri=target_ri,
            delta_from_target=delta,
            meets_target=meets_target,
        )
    
    def calculate_all(self) -> List[RIMetrics]:
        """Calculate RI for all configured services."""
        results = []
        for service in SERVICE_TARGETS.keys():
            metrics = self.calculate_ri(service)
            if metrics:
                results.append(metrics)
        return results


# =============================================================================
# Logging and Display
# =============================================================================

def format_ri_report(metrics_list: List[RIMetrics]) -> str:
    """Format RI metrics for human-readable display."""
    lines = []
    lines.append("\n" + "=" * 80)
    lines.append(f"TerraFusion RI Report - {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}")
    lines.append("=" * 80)
    
    for m in metrics_list:
        status = "✅ PASS" if m.meets_target else "❌ FAIL"
        delta_sign = "+" if m.delta_from_target >= 0 else ""
        
        lines.append(f"\n📊 Service: {m.service}")
        lines.append(f"   RI: {m.ri_adjusted:.4f} / {m.target_ri:.4f} ({delta_sign}{m.delta_from_target:.4f}) {status}")
        lines.append(f"   Error Rate: {m.error_rate_pct:.2f}%")
        lines.append(f"   p95 Latency: {m.latency_p95 * 1000:.0f}ms")
        lines.append(f"   Availability: {m.availability * 100:.0f}%")
        lines.append(f"   Request Rate: {m.request_rate:.2f} req/s")
    
    lines.append("\n" + "=" * 80 + "\n")
    return "\n".join(lines)


# =============================================================================
# Main Loop
# =============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="TerraFusion RI Calculator - Real-time resilience monitoring"
    )
    parser.add_argument(
        "--prometheus-url",
        default=PROMETHEUS_URL,
        help=f"Prometheus server URL (default: {PROMETHEUS_URL})",
    )
    parser.add_argument(
        "--interval",
        type=int,
        default=CALCULATION_INTERVAL,
        help=f"Calculation interval in seconds (default: {CALCULATION_INTERVAL})",
    )
    parser.add_argument(
        "--export-port",
        type=int,
        default=EXPORT_PORT,
        help=f"Prometheus metrics export port (default: {EXPORT_PORT})",
    )
    parser.add_argument(
        "--once",
        action="store_true",
        help="Calculate once and exit (for testing)",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable debug logging",
    )
    args = parser.parse_args()
    
    # Configure logging
    log_level = logging.DEBUG if args.verbose else logging.INFO
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    
    # Start Prometheus metrics exporter
    logging.info(f"Starting Prometheus exporter on port {args.export_port}...")
    start_http_server(args.export_port)
    
    # Initialize calculator
    calculator = RICalculator(args.prometheus_url)
    logging.info(f"Connected to Prometheus at {args.prometheus_url}")
    logging.info(f"Monitoring {len(SERVICE_TARGETS)} services: {', '.join(SERVICE_TARGETS.keys())}")
    
    if args.once:
        # Single calculation mode (for testing)
        logging.info("Running single RI calculation...")
        metrics_list = calculator.calculate_all()
        print(format_ri_report(metrics_list))
        logging.info("Single calculation complete. Exiting.")
        sys.exit(0)
    
    # Continuous monitoring loop
    logging.info(f"Starting continuous monitoring (interval: {args.interval}s)")
    logging.info("Press Ctrl+C to stop")
    
    try:
        while True:
            metrics_list = calculator.calculate_all()
            
            # Log summary
            for m in metrics_list:
                status = "PASS" if m.meets_target else "FAIL"
                logging.info(
                    f"{m.service}: RI={m.ri_adjusted:.4f} "
                    f"(target={m.target_ri:.4f}, delta={m.delta_from_target:+.4f}) "
                    f"[{status}]"
                )
            
            # Display detailed report (optional)
            if args.verbose:
                print(format_ri_report(metrics_list))
            
            # Sleep until next calculation
            time.sleep(args.interval)
    
    except KeyboardInterrupt:
        logging.info("\nShutting down gracefully...")
        sys.exit(0)


if __name__ == "__main__":
    main()
