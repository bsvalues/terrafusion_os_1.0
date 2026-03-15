// TFR-019 — Runtime configuration and lifecycle management for sync jobs
using System;
using System.Collections.Concurrent;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync
{
    /// <summary>
    /// Circuit breaker states for connector health tracking.
    /// </summary>
    public enum CircuitState
    {
        Closed,
        Open,
        HalfOpen
    }

    /// <summary>
    /// Retry policy configuration.
    /// </summary>
    public sealed record RetryPolicy
    {
        public int MaxRetries { get; init; } = 3;
        public TimeSpan InitialDelay { get; init; } = TimeSpan.FromSeconds(1);
        public double BackoffMultiplier { get; init; } = 2.0;
        public TimeSpan MaxDelay { get; init; } = TimeSpan.FromMinutes(1);
    }

    /// <summary>
    /// Circuit breaker configuration and state.
    /// </summary>
    public sealed class CircuitBreaker
    {
        public CircuitState State { get; private set; } = CircuitState.Closed;
        public int FailureCount { get; private set; }
        public int FailureThreshold { get; init; } = 5;
        public TimeSpan OpenDuration { get; init; } = TimeSpan.FromMinutes(2);
        public DateTime? OpenedAtUtc { get; private set; }

        /// <summary>Records a failure. Trips the circuit if threshold is exceeded.</summary>
        public void RecordFailure()
        {
            FailureCount++;
            if (FailureCount >= FailureThreshold)
            {
                State = CircuitState.Open;
                OpenedAtUtc = DateTime.UtcNow;
            }
        }

        /// <summary>Records a success. Resets the circuit to closed.</summary>
        public void RecordSuccess()
        {
            FailureCount = 0;
            State = CircuitState.Closed;
            OpenedAtUtc = null;
        }

        /// <summary>Checks whether the circuit allows execution.</summary>
        public bool AllowExecution()
        {
            if (State == CircuitState.Closed) return true;
            if (State == CircuitState.Open && OpenedAtUtc.HasValue &&
                DateTime.UtcNow - OpenedAtUtc.Value >= OpenDuration)
            {
                State = CircuitState.HalfOpen;
                return true;
            }
            return State == CircuitState.HalfOpen;
        }
    }

    /// <summary>
    /// Runtime configuration and lifecycle management for sync jobs.
    /// </summary>
    public interface ISyncRuntime
    {
        /// <summary>Maximum concurrent sync jobs.</summary>
        int MaxConcurrentSyncs { get; }

        /// <summary>Default retry policy for failed sync operations.</summary>
        RetryPolicy DefaultRetryPolicy { get; }

        /// <summary>Acquires a sync slot. Returns false if concurrency limit reached.</summary>
        bool TryAcquireSlot(string connectorName);

        /// <summary>Releases a sync slot.</summary>
        void ReleaseSlot(string connectorName);

        /// <summary>Returns the circuit breaker for a given connector.</summary>
        CircuitBreaker GetCircuitBreaker(string connectorName);

        /// <summary>Executes an action with retry policy applied.</summary>
        Task<T> ExecuteWithRetryAsync<T>(Func<CancellationToken, Task<T>> action,
            RetryPolicy? policy = null, CancellationToken ct = default);
    }

    /// <summary>
    /// Default sync runtime. Manages concurrent sync limits, retry policies, and circuit breaker state.
    /// </summary>
    public class SyncRuntime : ISyncRuntime
    {
        private readonly SemaphoreSlim _concurrencySemaphore;
        private readonly ConcurrentDictionary<string, CircuitBreaker> _circuitBreakers = new();
        private readonly ConcurrentDictionary<string, byte> _activeSlots = new();

        public int MaxConcurrentSyncs { get; }
        public RetryPolicy DefaultRetryPolicy { get; }

        public SyncRuntime(int maxConcurrentSyncs = 4, RetryPolicy? defaultRetryPolicy = null)
        {
            MaxConcurrentSyncs = maxConcurrentSyncs;
            DefaultRetryPolicy = defaultRetryPolicy ?? new RetryPolicy();
            _concurrencySemaphore = new SemaphoreSlim(maxConcurrentSyncs, maxConcurrentSyncs);
        }

        /// <inheritdoc />
        public bool TryAcquireSlot(string connectorName)
        {
            if (!_concurrencySemaphore.Wait(0)) return false;
            _activeSlots.TryAdd(connectorName, 0);
            return true;
        }

        /// <inheritdoc />
        public void ReleaseSlot(string connectorName)
        {
            if (_activeSlots.TryRemove(connectorName, out _))
            {
                _concurrencySemaphore.Release();
            }
        }

        /// <inheritdoc />
        public CircuitBreaker GetCircuitBreaker(string connectorName) =>
            _circuitBreakers.GetOrAdd(connectorName, _ => new CircuitBreaker());

        /// <inheritdoc />
        public async Task<T> ExecuteWithRetryAsync<T>(
            Func<CancellationToken, Task<T>> action,
            RetryPolicy? policy = null,
            CancellationToken ct = default)
        {
            policy ??= DefaultRetryPolicy;
            var delay = policy.InitialDelay;

            for (int attempt = 0; ; attempt++)
            {
                ct.ThrowIfCancellationRequested();
                try
                {
                    return await action(ct);
                }
                catch when (attempt < policy.MaxRetries)
                {
                    await Task.Delay(delay, ct);
                    delay = TimeSpan.FromMilliseconds(
                        Math.Min(delay.TotalMilliseconds * policy.BackoffMultiplier,
                                 policy.MaxDelay.TotalMilliseconds));
                }
            }
        }
    }
}
