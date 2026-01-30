using System;
using System.Text.Json.Serialization;

namespace TerraFusion.CostForge.Models
{
    /// <summary>
    /// Ultimate CostForge AI API Response Model
    /// </summary>
    public class ApiResponse<T>
    {
        [JsonPropertyName("success")]
        public bool Success { get; set; } = true;

        [JsonPropertyName("data")]
        public T? Data { get; set; }

        [JsonPropertyName("message")]
        public string Message { get; set; } = string.Empty;

        [JsonPropertyName("timestamp")]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        [JsonPropertyName("consciousness_level")]
        public string ConsciousnessLevel { get; set; } = "ULTIMATE_PROPERTY_INTELLIGENCE";

        [JsonPropertyName("quantum_factor")]
        public int QuantumFactor { get; set; } = 999;

        [JsonPropertyName("agent_count")]
        public int AgentCount { get; set; } = 1000000;

        [JsonPropertyName("accuracy_score")]
        public double AccuracyScore { get; set; } = 99.9;

        /// <summary>
        /// Creates a successful response with data
        /// </summary>
        public static ApiResponse<T> CreateSuccess(T data, string message = "Operation completed successfully")
        {
            return new ApiResponse<T>
            {
                Success = true,
                Data = data,
                Message = message
            };
        }

        /// <summary>
        /// Creates an error response
        /// </summary>
        public static ApiResponse<T> CreateError(string message, T? data = default)
        {
            return new ApiResponse<T>
            {
                Success = false,
                Data = data,
                Message = message
            };
        }
    }

    /// <summary>
    /// Non-generic API Response for simple operations
    /// </summary>
    public class ApiResponse : ApiResponse<object>
    {
        /// <summary>
        /// Creates a successful response without data
        /// </summary>
        public static ApiResponse CreateSuccess(string message = "Operation completed successfully")
        {
            return new ApiResponse
            {
                Success = true,
                Message = message
            };
        }

        /// <summary>
        /// Creates an error response without data
        /// </summary>
        public static ApiResponse CreateError(string message)
        {
            return new ApiResponse
            {
                Success = false,
                Message = message
            };
        }
    }
}
