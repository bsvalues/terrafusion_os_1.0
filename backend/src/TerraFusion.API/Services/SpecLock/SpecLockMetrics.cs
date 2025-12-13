// =============================================================================
// SpecLock Prometheus Metrics (MYTHIC TIER)
// =============================================================================
// Exposes canonical truth signal for observability:
//   tf_speclock_ok{service="terrafusion-api"} = 1 | 0
//
// Consumers:
// - Grafana dashboards
// - Prometheus alerts
// - AI agents (self-awareness)
// - OPA sidecars (policy symmetry)
// =============================================================================

using Prometheus;

namespace TerraFusion.API.Services.SpecLock;

/// <summary>
/// SpecLock Prometheus metrics.
/// The canonical truth signal for observability.
/// </summary>
public static class SpecLockMetrics
{
    /// <summary>
    /// Gauge: tf_speclock_ok
    /// 1 = SpecLock invariant satisfied (all hashes match)
    /// 0 = SpecLock invariant violated (drift detected)
    /// </summary>
    public static readonly Gauge SpecLockOk =
        Metrics.CreateGauge(
            "tf_speclock_ok",
            "SpecLock invariant satisfied (1 = OK, 0 = violated)",
            new GaugeConfiguration
            {
                LabelNames = new[] { "service" }
            });

    /// <summary>
    /// Counter: tf_speclock_check_total
    /// Total number of SpecLock checks performed.
    /// </summary>
    public static readonly Counter SpecLockCheckTotal =
        Metrics.CreateCounter(
            "tf_speclock_check_total",
            "Total SpecLock health checks performed",
            new CounterConfiguration
            {
                LabelNames = new[] { "service", "result" }
            });

    /// <summary>
    /// Gauge: tf_speclock_lock_count
    /// Number of active locks in the manifest.
    /// </summary>
    public static readonly Gauge SpecLockCount =
        Metrics.CreateGauge(
            "tf_speclock_lock_count",
            "Number of active SpecLocks in manifest",
            new GaugeConfiguration
            {
                LabelNames = new[] { "service" }
            });

    /// <summary>
    /// Gauge: tf_speclock_artifact_count
    /// Total generated artifacts tracked by SpecLock.
    /// </summary>
    public static readonly Gauge SpecLockArtifactCount =
        Metrics.CreateGauge(
            "tf_speclock_artifact_count",
            "Total generated artifacts tracked by SpecLock",
            new GaugeConfiguration
            {
                LabelNames = new[] { "service" }
            });

    /// <summary>
    /// Gauge: tf_speclock_signature_verified
    /// 1 = Cosign signature verified, 0 = not verified or disabled
    /// </summary>
    public static readonly Gauge SpecLockSignatureVerified =
        Metrics.CreateGauge(
            "tf_speclock_signature_verified",
            "SpecLock manifest signature verified (1 = OK, 0 = not verified)",
            new GaugeConfiguration
            {
                LabelNames = new[] { "service" }
            });
}
