# TerraFusion OS — Chaos Test Make Targets
# Phase 4.9 Week 1 Day 7
# Usage: include ops/tests/chaos/make.targets.mk in top-level Makefile

.PHONY: chaos:prep chaos:fault:150ms chaos:fault:loss30 chaos:redis:latency chaos:redis:kill chaos:api:kill chaos:k6:read chaos:k6:spike chaos:report chaos:clean

# Variables
CHAOS_NS ?= terrafusion
CHAOS_RESULTS_DIR ?= ops/tests/chaos/results
API_BASE ?= https://api.terrafusion.local

# ============================================================================
# Preparation
# ============================================================================

chaos:prep:
	@echo "📊 Deploying Prometheus recording rules & alerts..."
	kubectl apply -f ops/tests/chaos/prometheus/recording-rules.yaml
	kubectl apply -f ops/tests/chaos/prometheus/chaos-alerts.yaml
	@echo "✅ Monitoring rules deployed. Waiting 10s for reload..."
	@sleep 10
	@echo "✅ Chaos test preparation complete\n"

# ============================================================================
# Fault Injection (Istio VirtualService)
# ============================================================================

chaos:fault:150ms:
	@echo "🔥 [F1] Applying Istio fault injection: +150ms latency"
	kubectl apply -f ops/tests/chaos/istio/fault-injection-150ms.yaml
	@echo "⏳ Fault active. Run 'make chaos:k6:read' to test."
	@echo "🧹 Cleanup: kubectl delete virtualservice api-brownout-150ms\n"

chaos:fault:loss30:
	@echo "🔥 [F2] Applying Istio fault injection: 30% packet loss (abort)"
	kubectl apply -f ops/tests/chaos/istio/fault-injection-30pct-loss.yaml
	@echo "⏳ Fault active. Run 'make chaos:k6:spike' to test circuit breakers."
	@echo "🧹 Cleanup: kubectl delete virtualservice api-packet-loss-30pct\n"

# ============================================================================
# Chaos Mesh Experiments
# ============================================================================

chaos:redis:latency:
	@echo "🔥 [F3] Applying Chaos Mesh network latency: Redis +200ms"
	kubectl apply -f ops/tests/chaos/chaos-mesh/network-latency.yaml
	@echo "⏳ Fault active for 10min. Run 'make chaos:k6:read' to test."
	@echo "🧹 Cleanup: kubectl delete networkchaos rediscache-latency\n"

chaos:redis:kill:
	@echo "🔥 [F4] Killing Redis pod (one-shot)"
	kubectl apply -f ops/tests/chaos/chaos-mesh/pod-kill-redis.yaml
	@echo "⏳ Pod killed. Run 'make chaos:k6:read' immediately to test failover."
	@echo "🧹 Cleanup: Auto-recovered by Kubernetes\n"

chaos:api:kill:
	@echo "🔥 [F7] Killing API pod (one-shot)"
	kubectl apply -f ops/tests/chaos/chaos-mesh/pod-kill-api.yaml
	@echo "⏳ Pod killed. Run 'make chaos:k6:read' immediately to test HPA."
	@echo "🧹 Cleanup: Auto-recovered by Kubernetes HPA\n"

# ============================================================================
# Load Testing (k6)
# ============================================================================

chaos:k6:read:
	@echo "📈 Running k6 read path load test (100 VUs, 15min)..."
	@echo "   API_BASE=$(API_BASE)"
	API_BASE=$(API_BASE) k6 run ops/tests/chaos/k6/brownout-read-api.js
	@echo "✅ Load test complete\n"

chaos:k6:spike:
	@echo "📈 Running k6 spike test (0→500 VUs, 10min hold)..."
	@echo "   API_BASE=$(API_BASE)"
	API_BASE=$(API_BASE) k6 run ops/tests/chaos/k6/spike-retry-grid.js
	@echo "✅ Spike test complete\n"

# ============================================================================
# Reporting
# ============================================================================

chaos:report:
	@echo "📊 Exporting Prometheus/Jaeger snapshots to $(CHAOS_RESULTS_DIR)/"
	@mkdir -p $(CHAOS_RESULTS_DIR)
	@echo "   📸 Prometheus: Exporting p95, error_rate, consumer_lag queries..."
	@echo "   (Manual step: Export Prometheus graphs as PNG from UI)"
	@echo "   📸 Jaeger: Exporting trace JSON..."
	@echo "   (Manual step: curl http://jaeger:16686/api/traces/{trace_id} > $(CHAOS_RESULTS_DIR)/trace_f1_during.json)"
	@echo "   📸 Alert Manager: Take screenshots of alert timelines"
	@echo "\n✅ Manual export steps listed above. See ops/tests/chaos/README.md for details.\n"

# ============================================================================
# Cleanup
# ============================================================================

chaos:clean:
	@echo "🧹 Cleaning up chaos test artifacts..."
	-kubectl delete virtualservice api-brownout-150ms 2>/dev/null || true
	-kubectl delete virtualservice api-packet-loss-30pct 2>/dev/null || true
	-kubectl delete networkchaos rediscache-latency 2>/dev/null || true
	-kubectl delete podchaos redis-pod-kill 2>/dev/null || true
	-kubectl delete podchaos api-pod-kill 2>/dev/null || true
	@echo "✅ Chaos test cleanup complete\n"

# ============================================================================
# Help
# ============================================================================

chaos:help:
	@echo "TerraFusion OS — Chaos Test Targets (Day 7)"
	@echo ""
	@echo "Preparation:"
	@echo "  make chaos:prep          Deploy Prometheus rules & alerts"
	@echo ""
	@echo "Fault Injection (Istio):"
	@echo "  make chaos:fault:150ms   [F1] API latency +150ms (15min)"
	@echo "  make chaos:fault:loss30  [F2] Packet loss 30% (10min)"
	@echo ""
	@echo "Chaos Mesh Experiments:"
	@echo "  make chaos:redis:latency [F3] Redis brownout +200ms (10min)"
	@echo "  make chaos:redis:kill    [F4] Redis pod kill (one-shot)"
	@echo "  make chaos:api:kill      [F7] API pod kill (one-shot)"
	@echo ""
	@echo "Load Testing (k6):"
	@echo "  make chaos:k6:read       Read path test (100 VUs, 15min)"
	@echo "  make chaos:k6:spike      Spike test (0→500 VUs, 10min)"
	@echo ""
	@echo "Reporting:"
	@echo "  make chaos:report        Export Prometheus/Jaeger snapshots"
	@echo ""
	@echo "Cleanup:"
	@echo "  make chaos:clean         Remove all chaos test artifacts"
	@echo ""
	@echo "Environment Variables:"
	@echo "  API_BASE=$(API_BASE)"
	@echo "  CHAOS_NS=$(CHAOS_NS)"
	@echo ""
	@echo "See ops/tests/chaos/README.md for full execution guide."
