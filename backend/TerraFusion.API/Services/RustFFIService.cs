using System;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;

namespace TerraFusion.API.Services;

/// <summary>
/// Rust FFI Service - Bridge to Elite Rust Performance Engine
/// Uses the compiled ffi_bridge.dll from rust-performance-engine
/// </summary>
public class RustFFIService
{
    private readonly ILogger<RustFFIService> _logger;

    // FFI imports from ffi_bridge.dll
    [DllImport("ffi_bridge", CallingConvention = CallingConvention.Cdecl)]
    private static extern IntPtr init_system();

    [DllImport("ffi_bridge", CallingConvention = CallingConvention.Cdecl)]
    private static extern IntPtr process_valuation(IntPtr parcel_json);

    [DllImport("ffi_bridge", CallingConvention = CallingConvention.Cdecl)]
    private static extern IntPtr coordinate_agents(IntPtr request_json);

    [DllImport("ffi_bridge", CallingConvention = CallingConvention.Cdecl)]
    private static extern void free_string(IntPtr ptr);

    public RustFFIService(ILogger<RustFFIService> logger)
    {
        _logger = logger;
        InitializeRustEngine();
    }

    private void InitializeRustEngine()
    {
        try
        {
            var resultPtr = init_system();
            if (resultPtr != IntPtr.Zero)
            {
                var result = Marshal.PtrToStringAnsi(resultPtr);
                free_string(resultPtr);
                _logger.LogInformation("🚀 Rust Performance Engine initialized: {Result}", result);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to initialize Rust Performance Engine");
        }
    }

    public async Task<ValuationResult> ProcessValuation(ValuationRequest request)
    {
        return await Task.Run(() =>
        {
            try
            {
                var json = JsonSerializer.Serialize(request);
                var jsonPtr = Marshal.StringToHGlobalAnsi(json);
                
                var resultPtr = process_valuation(jsonPtr);
                Marshal.FreeHGlobal(jsonPtr);
                
                if (resultPtr != IntPtr.Zero)
                {
                    var resultJson = Marshal.PtrToStringAnsi(resultPtr);
                    free_string(resultPtr);
                    
                    if (!string.IsNullOrEmpty(resultJson))
                    {
                        return JsonSerializer.Deserialize<ValuationResult>(resultJson) 
                            ?? new ValuationResult { Success = false };
                    }
                }
                
                return new ValuationResult { Success = false, Error = "No response from Rust engine" };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to process valuation through Rust engine");
                return new ValuationResult { Success = false, Error = ex.Message };
            }
        });
    }

    public async Task<AgentCoordinationResult> CoordinateAgents(AgentRequest request)
    {
        return await Task.Run(() =>
        {
            try
            {
                var json = JsonSerializer.Serialize(request);
                var jsonPtr = Marshal.StringToHGlobalAnsi(json);
                
                var resultPtr = coordinate_agents(jsonPtr);
                Marshal.FreeHGlobal(jsonPtr);
                
                if (resultPtr != IntPtr.Zero)
                {
                    var resultJson = Marshal.PtrToStringAnsi(resultPtr);
                    free_string(resultPtr);
                    
                    if (!string.IsNullOrEmpty(resultJson))
                    {
                        return JsonSerializer.Deserialize<AgentCoordinationResult>(resultJson)
                            ?? new AgentCoordinationResult { Success = false };
                    }
                }
                
                return new AgentCoordinationResult { Success = false };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to coordinate agents through Rust engine");
                return new AgentCoordinationResult { Success = false, Error = ex.Message };
            }
        });
    }
}

// DTOs for Rust FFI communication
public class ValuationRequest
{
    public string ParcelId { get; set; } = string.Empty;
    public string CountyName { get; set; } = string.Empty;
    public Dictionary<string, object> Properties { get; set; } = new();
}

public class ValuationResult
{
    public bool Success { get; set; }
    public decimal EstimatedValue { get; set; }
    public string? Error { get; set; }
    public Dictionary<string, object>? Metadata { get; set; }
}

public class AgentRequest
{
    public string TaskType { get; set; } = string.Empty;
    public int AgentCount { get; set; }
    public Dictionary<string, object> Parameters { get; set; } = new();
}

public class AgentCoordinationResult
{
    public bool Success { get; set; }
    public int AgentsDeployed { get; set; }
    public string? Error { get; set; }
    public Dictionary<string, object>? Results { get; set; }
}
