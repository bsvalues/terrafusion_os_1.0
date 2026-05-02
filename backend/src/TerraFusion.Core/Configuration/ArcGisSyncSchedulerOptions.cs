using System;

namespace TerraFusion.Core.Configuration;

/// <summary>
/// Slice G1-D-2: scheduler configuration for the ArcGIS REST nightly
/// sync. Bound from configuration section <see cref="SectionName"/>.
///
/// <para>The scheduler is OFF by default. Set
/// <see cref="Enabled"/> to <c>true</c> in production / staging
/// configuration once a county's feature service URL is confirmed.</para>
/// </summary>
public sealed class ArcGisSyncSchedulerOptions
{
    /// <summary>Configuration section name: <c>ArcGisSyncScheduler</c>.</summary>
    public const string SectionName = "ArcGisSyncScheduler";

    /// <summary>
    /// Master kill-switch. When <c>false</c>, the hosted service
    /// returns immediately from <c>ExecuteAsync</c>. Default: <c>false</c>.
    /// </summary>
    public bool Enabled { get; set; } = false;

    /// <summary>
    /// How long to wait after host start before the first cycle.
    /// Lets the API finish warming up. Default: 2 minutes.
    /// </summary>
    public TimeSpan InitialDelay { get; set; } = TimeSpan.FromMinutes(2);

    /// <summary>
    /// Cadence between cycles. Default: 24 hours (the "nightly" in
    /// the slice name). For dev/staging, override to a smaller
    /// interval to exercise the loop.
    /// </summary>
    public TimeSpan Interval { get; set; } = TimeSpan.FromHours(24);

    /// <summary>
    /// Operator name recorded on each <c>load_batch</c> created by
    /// the scheduler. Default: <c>"arcgis-scheduler"</c>.
    /// </summary>
    public string OperatorName { get; set; } = "arcgis-scheduler";
}
