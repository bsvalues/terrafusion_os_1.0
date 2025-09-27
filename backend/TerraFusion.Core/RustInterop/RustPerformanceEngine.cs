using System;
using System.Runtime.InteropServices;
using System.Collections.Generic;
using Microsoft.Extensions.Logging;

namespace TerraFusion.Core.Rust
{
    /// <summary>
    /// High-performance Rust integration for TerraFusion OS
    /// Provides zero-copy interop with Rust performance engines
    /// </summary>
    public static class RustPerformanceEngine
    {
        private static readonly ILogger _logger = 
            LoggerFactory.Create(builder => builder.AddConsole())
            .CreateLogger(typeof(RustPerformanceEngine));

        private static bool _initialized = false;

        #region FFI Structures

        [StructLayout(LayoutKind.Sequential)]
        public struct FFIAgent
        {
            public ulong IdHigh;
            public ulong IdLow;
            public byte AgentType;
            public byte Tier;
            public byte Status;
            public ulong TasksCompleted;
            public double SuccessRate;
            public ulong ResponseTimeMs;
        }

        [StructLayout(LayoutKind.Sequential)]
        public struct FFISwarmMetrics
        {
            public nuint TotalAgents;
            public nuint ActiveAgents;
            public double AveragePerformance;
            public double QuantumCoherence;
            public ulong OperationsPerSecond;
            public double SystemEfficiency;
            public ulong ResponseTimeP95Ms;
            public ulong ResponseTimeP99Ms;
        }

        [StructLayout(LayoutKind.Sequential)]
        public struct FFIPropertyParcel
        {
            public IntPtr ParcelId;
            public IntPtr CountyId;
            public double AreaSqFeet;
            public double AssessedValue;
            public double MarketValue;
            public double CentroidX;
            public double CentroidY;
        }

        [StructLayout(LayoutKind.Sequential)]
        public struct FFISpatialQueryResult
        {
            public nuint ParcelCount;
            public IntPtr Parcels;
            public ulong QueryTimeMs;
        }

        public enum TerraFusionError : int
        {
            Success = 0,
            InvalidInput = 1,
            AgentNotFound = 2,
            PerformanceViolation = 3,
            SecurityViolation = 4,
            GeospatialError = 5,
            InternalError = 99
        }

        #endregion

        #region Native Methods

        [DllImport("ffi_bridge", CallingConvention = CallingConvention.Cdecl)]
        private static extern int terrafusion_init();

        [DllImport("ffi_bridge", CallingConvention = CallingConvention.Cdecl)]
        private static extern TerraFusionError terrafusion_init_agent_engine();

        [DllImport("ffi_bridge", CallingConvention = CallingConvention.Cdecl)]
        private static extern TerraFusionError terrafusion_init_geospatial_engine();

        [DllImport("ffi_bridge", CallingConvention = CallingConvention.Cdecl)]
        private static extern TerraFusionError terrafusion_register_agent(ref FFIAgent agentData);

        [DllImport("ffi_bridge", CallingConvention = CallingConvention.Cdecl)]
        private static extern TerraFusionError terrafusion_get_swarm_metrics(out FFISwarmMetrics metricsOut);

        [DllImport("ffi_bridge", CallingConvention = CallingConvention.Cdecl)]
        private static extern TerraFusionError terrafusion_spatial_query_bbox(
            double minX, double minY, double maxX, double maxY,
            nuint maxResults, out FFISpatialQueryResult resultOut);

        [DllImport("ffi_bridge", CallingConvention = CallingConvention.Cdecl)]
        private static extern void terrafusion_free_spatial_result(ref FFISpatialQueryResult result);

        [DllImport("ffi_bridge", CallingConvention = CallingConvention.Cdecl)]
        private static extern TerraFusionError terrafusion_benchmark_agent_coordination(
            nuint agentCount, out ulong durationMsOut);

        [DllImport("ffi_bridge", CallingConvention = CallingConvention.Cdecl)]
        private static extern void terrafusion_shutdown();

        [DllImport("ffi_bridge", CallingConvention = CallingConvention.Cdecl)]
        private static extern int terrafusion_health_check();

        [DllImport("ffi_bridge", CallingConvention = CallingConvention.Cdecl)]
        private static extern IntPtr terrafusion_get_version();

        #endregion

        #region Public API

        /// <summary>
        /// Initialize the Rust performance engine
        /// Call this once during application startup
        /// </summary>
        public static void Initialize()
        {
            if (_initialized)
                return;

            _logger.LogInformation("Initializing TerraFusion Rust Performance Engine...");

            var result = terrafusion_init();
            if (result != 0)
            {
                throw new InvalidOperationException($"Failed to initialize Rust FFI bridge: {result}");
            }

            var agentResult = terrafusion_init_agent_engine();
            if (agentResult != TerraFusionError.Success)
            {
                throw new InvalidOperationException($"Failed to initialize agent engine: {agentResult}");
            }

            var geoResult = terrafusion_init_geospatial_engine();
            if (geoResult != TerraFusionError.Success)
            {
                throw new InvalidOperationException($"Failed to initialize geospatial engine: {geoResult}");
            }

            _initialized = true;
            _logger.LogInformation("Rust Performance Engine initialized successfully");
        }

        /// <summary>
        /// Register an AI agent with the high-performance Rust coordination engine
        /// </summary>
        public static void RegisterAgent(Guid agentId, AgentType agentType, byte tier, 
            AgentStatus status, ulong tasksCompleted, double successRate, ulong responseTimeMs)
        {
            EnsureInitialized();

            var guidBytes = agentId.ToByteArray();
            var idHigh = BitConverter.ToUInt64(guidBytes, 0);
            var idLow = BitConverter.ToUInt64(guidBytes, 8);

            var ffiAgent = new FFIAgent
            {
                IdHigh = idHigh,
                IdLow = idLow,
                AgentType = (byte)agentType,
                Tier = tier,
                Status = (byte)status,
                TasksCompleted = tasksCompleted,
                SuccessRate = successRate,
                ResponseTimeMs = responseTimeMs
            };

            var result = terrafusion_register_agent(ref ffiAgent);
            if (result != TerraFusionError.Success)
            {
                _logger.LogError("Failed to register agent {AgentId}: {Error}", agentId, result);
                throw new InvalidOperationException($"Failed to register agent: {result}");
            }

            _logger.LogDebug("Agent {AgentId} registered successfully", agentId);
        }

        /// <summary>
        /// Get real-time swarm metrics from the Rust coordination engine
        /// </summary>
        public static SwarmMetrics GetSwarmMetrics()
        {
            EnsureInitialized();

            var result = terrafusion_get_swarm_metrics(out var ffiMetrics);
            if (result != TerraFusionError.Success)
            {
                throw new InvalidOperationException($"Failed to get swarm metrics: {result}");
            }

            return new SwarmMetrics
            {
                TotalAgents = (int)ffiMetrics.TotalAgents,
                ActiveAgents = (int)ffiMetrics.ActiveAgents,
                AveragePerformance = ffiMetrics.AveragePerformance,
                QuantumCoherence = ffiMetrics.QuantumCoherence,
                OperationsPerSecond = ffiMetrics.OperationsPerSecond,
                SystemEfficiency = ffiMetrics.SystemEfficiency,
                ResponseTimeP95Ms = ffiMetrics.ResponseTimeP95Ms,
                ResponseTimeP99Ms = ffiMetrics.ResponseTimeP99Ms
            };
        }

        /// <summary>
        /// Perform high-performance spatial query using Rust geospatial engine
        /// </summary>
        public static SpatialQueryResult QuerySpatialBoundingBox(
            double minX, double minY, double maxX, double maxY, int maxResults = 1000)
        {
            EnsureInitialized();

            var startTime = DateTime.UtcNow;
            var result = terrafusion_spatial_query_bbox(
                minX, minY, maxX, maxY, (nuint)maxResults, out var ffiResult);

            if (result != TerraFusionError.Success)
            {
                throw new InvalidOperationException($"Spatial query failed: {result}");
            }

            var parcels = new List<PropertyParcel>();

            // Convert FFI results to managed objects
            unsafe
            {
                var parcelPtr = (FFIPropertyParcel*)ffiResult.Parcels;
                for (int i = 0; i < (int)ffiResult.ParcelCount; i++)
                {
                    var ffiParcel = parcelPtr[i];
                    
                    parcels.Add(new PropertyParcel
                    {
                        ParcelId = Marshal.PtrToStringAnsi(ffiParcel.ParcelId) ?? "",
                        CountyId = Marshal.PtrToStringAnsi(ffiParcel.CountyId) ?? "",
                        AreaSqFeet = ffiParcel.AreaSqFeet,
                        AssessedValue = ffiParcel.AssessedValue,
                        MarketValue = ffiParcel.MarketValue,
                        CentroidX = ffiParcel.CentroidX,
                        CentroidY = ffiParcel.CentroidY
                    });
                }
            }

            // Free native memory
            terrafusion_free_spatial_result(ref ffiResult);

            var queryResult = new SpatialQueryResult
            {
                Parcels = parcels,
                QueryTimeMs = ffiResult.QueryTimeMs,
                TotalProcessingTimeMs = (ulong)(DateTime.UtcNow - startTime).TotalMilliseconds
            };

            _logger.LogDebug("Spatial query returned {Count} parcels in {Time}ms", 
                parcels.Count, queryResult.QueryTimeMs);

            return queryResult;
        }

        /// <summary>
        /// Run performance benchmark for agent coordination
        /// </summary>
        public static ulong BenchmarkAgentCoordination(int agentCount = 1000)
        {
            EnsureInitialized();

            var result = terrafusion_benchmark_agent_coordination((nuint)agentCount, out var durationMs);
            if (result != TerraFusionError.Success)
            {
                throw new InvalidOperationException($"Benchmark failed: {result}");
            }

            _logger.LogInformation("Benchmark: {AgentCount} agents processed in {Duration}ms", 
                agentCount, durationMs);

            return durationMs;
        }

        /// <summary>
        /// Shutdown the Rust performance engine
        /// Call this during application shutdown
        /// </summary>
        public static void Shutdown()
        {
            if (!_initialized)
                return;

            terrafusion_shutdown();
            _initialized = false;

            _logger.LogInformation("Rust Performance Engine shutdown complete");
        }

        /// <summary>
        /// Test FFI bridge connectivity
        /// </summary>
        public static bool TestFFIConnectivity()
        {
            try
            {
                var result = terrafusion_health_check();
                return result == 42; // Expected magic number from Rust
            }
            catch (Exception ex)
            {
                _logger.LogError("FFI connectivity test failed: {Error}", ex.Message);
                return false;
            }
        }

        /// <summary>
        /// Get FFI bridge version
        /// </summary>
        public static string GetFFIVersion()
        {
            try
            {
                var versionPtr = terrafusion_get_version();
                if (versionPtr != IntPtr.Zero)
                {
                    return Marshal.PtrToStringAnsi(versionPtr) ?? "unknown";
                }
                return "unknown";
            }
            catch (Exception ex)
            {
                _logger.LogError("Failed to get FFI version: {Error}", ex.Message);
                return "error";
            }
        }

        #endregion

        #region Helper Methods

        private static void EnsureInitialized()
        {
            if (!_initialized)
            {
                throw new InvalidOperationException(
                    "Rust Performance Engine not initialized. Call Initialize() first.");
            }
        }

        #endregion
    }

    #region Data Models

    public enum AgentType : byte
    {
        SupremeCommander = 0,
        AICouncilMember = 1,
        QuantumCommander = 2,
        DomainGeneral = 3,
        ProcessCoordinator = 4,
        ExpertSpecialist = 5,
        AdaptiveExecutor = 6,
        MicroOptimizer = 7,
        ModuleAgent = 8
    }

    public enum AgentStatus : byte
    {
        Active = 0,
        Standby = 1,
        Processing = 2,
        Maintenance = 3,
        QuantumEntangled = 4
    }

    public class SwarmMetrics
    {
        public int TotalAgents { get; set; }
        public int ActiveAgents { get; set; }
        public double AveragePerformance { get; set; }
        public double QuantumCoherence { get; set; }
        public ulong OperationsPerSecond { get; set; }
        public double SystemEfficiency { get; set; }
        public ulong ResponseTimeP95Ms { get; set; }
        public ulong ResponseTimeP99Ms { get; set; }
    }

    public class PropertyParcel
    {
        public string ParcelId { get; set; } = "";
        public string CountyId { get; set; } = "";
        public double AreaSqFeet { get; set; }
        public double AssessedValue { get; set; }
        public double MarketValue { get; set; }
        public double CentroidX { get; set; }
        public double CentroidY { get; set; }
    }

    public class SpatialQueryResult
    {
        public List<PropertyParcel> Parcels { get; set; } = new();
        public ulong QueryTimeMs { get; set; }
        public ulong TotalProcessingTimeMs { get; set; }
    }

    #endregion
}