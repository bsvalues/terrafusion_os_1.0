// PR-8 Prometheus H22 — verify that DoctrineDrainController's lane
// completion path actually feeds the dormant PrometheusConfig meter.
//
// Before this PR, every metric in PrometheusConfig.cs was dead code —
// dashboards reading /metrics saw only generic ASP.NET HTTP counters.
// The instrumented helpers EmitLaneCompletionMetrics + EmitGateMetricsAsync
// route lane outcomes through the static counters/histograms.
//
// Strategy: PrometheusConfig uses System.Diagnostics.Metrics (.NET 8)
// rather than prometheus-net's IMetric.Value, so we tap the meter via
// MeterListener and aggregate measurements ourselves. Each test owns a
// disposable listener so xunit's parallel runner doesn't cross-contaminate
// (concurrent tests would still record into the same static counters,
// but each listener filters by lane label so aggregation is scoped).

using System.Diagnostics.Metrics;
using FluentAssertions;
using TerraFusion.API.Controllers;
using TerraFusion.API.Monitoring;
using Xunit;

namespace TerraFusion.Unit.Tests.Observability;

public class PrometheusLaneMetricsTests
{
    /// <summary>
    /// Capture-all helper for one test scope. Subscribes to every
    /// instrument on the TerraFusion meter and stores measurements in
    /// a thread-safe list. Disposing detaches the listener.
    /// </summary>
    private sealed class CapturedMetric
    {
        public string Instrument { get; init; } = string.Empty;
        public double Value { get; init; }
        public Dictionary<string, string?> Tags { get; init; } = new();
    }

    private sealed class MeterCapture : IDisposable
    {
        private readonly MeterListener _listener;
        public List<CapturedMetric> Measurements { get; } = new();
        private readonly object _lock = new();
        // Per-test correlation tag value so concurrent tests can filter
        // their own measurements out of the shared static counters.
        public string Correlation { get; }

        public MeterCapture(string correlation)
        {
            Correlation = correlation;
            _listener = new MeterListener
            {
                InstrumentPublished = (instrument, listener) =>
                {
                    if (instrument.Meter.Name == PrometheusConfig.MeterName)
                        listener.EnableMeasurementEvents(instrument);
                },
            };
            _listener.SetMeasurementEventCallback<long>(Record);
            _listener.SetMeasurementEventCallback<double>(Record);
            _listener.SetMeasurementEventCallback<int>((inst, val, tags, state) => Record(inst, val, tags, state));
            _listener.Start();
        }

        private void Record<T>(Instrument instrument, T value, ReadOnlySpan<KeyValuePair<string, object?>> tags, object? state) where T : struct
        {
            var dict = new Dictionary<string, string?>(tags.Length);
            foreach (var kv in tags) dict[kv.Key] = kv.Value?.ToString();
            lock (_lock)
            {
                Measurements.Add(new CapturedMetric
                {
                    Instrument = instrument.Name,
                    Value = Convert.ToDouble(value),
                    Tags = dict,
                });
            }
        }

        public double SumOf(string instrument, string laneLabel, string laneValue) =>
            Measurements
                .Where(m => m.Instrument == instrument
                    && m.Tags.TryGetValue(laneLabel, out var v) && v == laneValue)
                .Sum(m => m.Value);

        public bool Any(string instrument, params (string key, string value)[] requiredTags)
            => Measurements.Any(m =>
                m.Instrument == instrument
                && requiredTags.All(t => m.Tags.TryGetValue(t.key, out var v) && v == t.value));

        public void Dispose() => _listener.Dispose();
    }

    // ── 1. Happy-path lane emits sync_operations_total{status=success}.
    [Fact]
    public void Happy_path_emits_sync_operations_total_success()
    {
        using var cap = new MeterCapture(nameof(Happy_path_emits_sync_operations_total_success));
        var lane = "parcel-h22-1";

        DoctrineDrainController.EmitLaneCompletionMetrics(
            lane, success: true, durationSeconds: 1.23, rowsLanded: 42, failedStage: null);

        cap.SumOf("terrafusion_sync_operations_total", "connector_name", lane).Should().Be(1.0);
        cap.Any("terrafusion_sync_operations_total",
            ("connector_name", lane), ("status", "success")).Should().BeTrue();
    }

    // ── 2. Happy-path lane emits sync_records_processed_total = rowsLanded.
    [Fact]
    public void Happy_path_emits_sync_records_processed_total_with_rows_landed()
    {
        using var cap = new MeterCapture(nameof(Happy_path_emits_sync_records_processed_total_with_rows_landed));
        var lane = "owner-wsdor-h22-2";

        DoctrineDrainController.EmitLaneCompletionMetrics(
            lane, success: true, durationSeconds: 5.5, rowsLanded: 200, failedStage: null);

        cap.SumOf("terrafusion_sync_records_processed_total", "connector_name", lane).Should().Be(200.0);
    }

    // ── 3. Happy-path lane records sync_duration_seconds histogram.
    [Fact]
    public void Happy_path_records_sync_duration_seconds()
    {
        using var cap = new MeterCapture(nameof(Happy_path_records_sync_duration_seconds));
        var lane = "improvement-h22-3";

        DoctrineDrainController.EmitLaneCompletionMetrics(
            lane, success: true, durationSeconds: 7.89, rowsLanded: 100, failedStage: null);

        cap.SumOf("terrafusion_sync_duration_seconds", "connector_name", lane).Should().Be(7.89);
    }

    // ── 4. Happy-path lane emits etl_runs_total{status=success}.
    [Fact]
    public void Happy_path_emits_etl_runs_total_success()
    {
        using var cap = new MeterCapture(nameof(Happy_path_emits_etl_runs_total_success));
        var lane = "land-h22-4";

        DoctrineDrainController.EmitLaneCompletionMetrics(
            lane, success: true, durationSeconds: 2.0, rowsLanded: 50, failedStage: null);

        cap.SumOf("terrafusion_etl_runs_total", "source_system", lane).Should().Be(1.0);
        cap.Any("terrafusion_etl_runs_total",
            ("source_system", lane), ("status", "success")).Should().BeTrue();
    }

    // ── 5. Happy-path lane emits etl_records_total{step_id=land}.
    [Fact]
    public void Happy_path_emits_etl_records_total_for_land_step()
    {
        using var cap = new MeterCapture(nameof(Happy_path_emits_etl_records_total_for_land_step));
        var lane = "sales-h22-5";

        DoctrineDrainController.EmitLaneCompletionMetrics(
            lane, success: true, durationSeconds: 3.0, rowsLanded: 99, failedStage: null);

        cap.SumOf("terrafusion_etl_records_total", "source_system", lane).Should().Be(99.0);
        cap.Any("terrafusion_etl_records_total",
            ("source_system", lane), ("step_id", "land")).Should().BeTrue();
    }

    // ── 6. Failure-path emits sync_operations_total{status=failure}.
    [Fact]
    public void Failure_path_emits_sync_operations_total_failure()
    {
        using var cap = new MeterCapture(nameof(Failure_path_emits_sync_operations_total_failure));
        var lane = "geometry-h22-6";

        DoctrineDrainController.EmitLaneCompletionMetrics(
            lane, success: false, durationSeconds: 0.5, rowsLanded: 0, failedStage: "ArcGis-D2");

        cap.Any("terrafusion_sync_operations_total",
            ("connector_name", lane), ("status", "failure")).Should().BeTrue();
        cap.SumOf("terrafusion_sync_operations_total", "connector_name", lane).Should().Be(1.0);
    }

    // ── 7. Failure-path emits etl_step_failures_total tagged with failed stage.
    [Fact]
    public void Failure_path_emits_etl_step_failures_total_for_failed_stage()
    {
        using var cap = new MeterCapture(nameof(Failure_path_emits_etl_step_failures_total_for_failed_stage));
        var lane = "parcel-h22-7";

        DoctrineDrainController.EmitLaneCompletionMetrics(
            lane, success: false, durationSeconds: 1.0, rowsLanded: 0, failedStage: "Parcel-Spine");

        cap.Any("terrafusion_etl_step_failures_total",
            ("source_system", lane), ("step_id", "Parcel-Spine")).Should().BeTrue();
        cap.SumOf("terrafusion_etl_step_failures_total", "source_system", lane).Should().Be(1.0);
    }

    // ── 8. Failure-path with null failedStage falls back to "Unknown" label.
    [Fact]
    public void Failure_path_with_null_failed_stage_uses_unknown_label()
    {
        using var cap = new MeterCapture(nameof(Failure_path_with_null_failed_stage_uses_unknown_label));
        var lane = "improvement-h22-8";

        DoctrineDrainController.EmitLaneCompletionMetrics(
            lane, success: false, durationSeconds: 0.2, rowsLanded: 0, failedStage: null);

        cap.Any("terrafusion_etl_step_failures_total",
            ("source_system", lane), ("step_id", "Unknown")).Should().BeTrue();
    }

    // ── 9. Happy-path with rowsLanded=0 skips records counter (no zero-row noise).
    [Fact]
    public void Happy_path_with_zero_rows_landed_skips_records_counter()
    {
        using var cap = new MeterCapture(nameof(Happy_path_with_zero_rows_landed_skips_records_counter));
        var lane = "land-h22-9";

        DoctrineDrainController.EmitLaneCompletionMetrics(
            lane, success: true, durationSeconds: 0.1, rowsLanded: 0, failedStage: null);

        // sync_operations_total still ticks (lane completed).
        cap.SumOf("terrafusion_sync_operations_total", "connector_name", lane).Should().Be(1.0);
        // records counter intentionally not emitted on 0 rows.
        cap.SumOf("terrafusion_sync_records_processed_total", "connector_name", lane).Should().Be(0.0);
    }

    // ── 10. All four ETL+sync counters present for one happy-path emit.
    [Fact]
    public void Happy_path_emits_all_four_lane_completion_metrics()
    {
        using var cap = new MeterCapture(nameof(Happy_path_emits_all_four_lane_completion_metrics));
        var lane = "parcel-h22-10";

        DoctrineDrainController.EmitLaneCompletionMetrics(
            lane, success: true, durationSeconds: 4.2, rowsLanded: 10, failedStage: null);

        var hit = cap.Measurements
            .Where(m => m.Tags.TryGetValue("connector_name", out var v) && v == lane
                     || m.Tags.TryGetValue("source_system", out var v2) && v2 == lane)
            .Select(m => m.Instrument)
            .Distinct()
            .ToList();

        hit.Should().Contain("terrafusion_sync_operations_total");
        hit.Should().Contain("terrafusion_sync_records_processed_total");
        hit.Should().Contain("terrafusion_sync_duration_seconds");
        hit.Should().Contain("terrafusion_etl_runs_total");
        hit.Should().Contain("terrafusion_etl_run_duration_seconds");
        hit.Should().Contain("terrafusion_etl_records_total");
    }
}
