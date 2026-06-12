namespace TerraFusion.Core.Time;

/// <summary>
/// Abstraction over the system clock so audit stamping is deterministic under test.
/// Production uses <see cref="SystemClock"/>; tests inject a fixed UTC instant.
/// </summary>
public interface IClock
{
    DateTime UtcNow { get; }
}

/// <summary>Default UTC clock for production.</summary>
public sealed class SystemClock : IClock
{
    public DateTime UtcNow => DateTime.UtcNow;
}
