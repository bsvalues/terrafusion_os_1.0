// TerraFusionGPT Suite: Function Handler Interface
// Elite Government OS Engineering - Function Execution Contract

using System.Text.Json;
using System.Threading.Tasks;
using TerraFusion.AI.Services;

namespace TerraFusion.AI.Functions
{
    /// <summary>
    /// Base interface for GPT function handlers
    /// </summary>
    public interface IFunctionHandler
    {
        /// <summary>
        /// Function name
        /// </summary>
        string FunctionName { get; }

        /// <summary>
        /// Function description
        /// </summary>
        string Description { get; }

        /// <summary>
        /// Validate function arguments
        /// </summary>
        ArgumentValidationResult ValidateArguments(JsonElement arguments);

        /// <summary>
        /// Execute the function
        /// </summary>
        Task<string> ExecuteAsync(JsonElement arguments, SecurityContext securityContext);

        /// <summary>
        /// Get required role for this function
        /// </summary>
        string? GetRequiredRole();

        /// <summary>
        /// Whether function requires county isolation
        /// </summary>
        bool RequiresCountyIsolation();

        /// <summary>
        /// Function rate limit (requests per minute)
        /// </summary>
        int GetRateLimit();
    }

    /// <summary>
    /// Abstract base class for function handlers
    /// </summary>
    public abstract class FunctionHandlerBase : IFunctionHandler
    {
        public abstract string FunctionName { get; }
        public abstract string Description { get; }

        public abstract ArgumentValidationResult ValidateArguments(JsonElement arguments);
        public abstract Task<string> ExecuteAsync(JsonElement arguments, SecurityContext securityContext);

        public virtual string? GetRequiredRole()
        {
            return null; // No role required by default
        }

        public virtual bool RequiresCountyIsolation()
        {
            return true; // County isolation required by default
        }

        public virtual int GetRateLimit()
        {
            return 30; // 30 requests per minute by default
        }

        /// <summary>
        /// Helper: Get required string argument
        /// </summary>
        protected (bool Success, string Value, string? Error) GetRequiredString(
            JsonElement args, string propertyName)
        {
            if (!args.TryGetProperty(propertyName, out var element))
            {
                return (false, string.Empty, $"Missing required argument: {propertyName}");
            }

            var value = element.GetString();
            if (string.IsNullOrEmpty(value))
            {
                return (false, string.Empty, $"Argument '{propertyName}' cannot be empty");
            }

            return (true, value, null);
        }

        /// <summary>
        /// Helper: Get required int argument
        /// </summary>
        protected (bool Success, int Value, string? Error) GetRequiredInt(
            JsonElement args, string propertyName)
        {
            if (!args.TryGetProperty(propertyName, out var element))
            {
                return (false, 0, $"Missing required argument: {propertyName}");
            }

            if (!element.TryGetInt32(out var value))
            {
                return (false, 0, $"Argument '{propertyName}' must be an integer");
            }

            return (true, value, null);
        }

        /// <summary>
        /// Helper: Get required double argument
        /// </summary>
        protected (bool Success, double Value, string? Error) GetRequiredDouble(
            JsonElement args, string propertyName)
        {
            if (!args.TryGetProperty(propertyName, out var element))
            {
                return (false, 0, $"Missing required argument: {propertyName}");
            }

            if (!element.TryGetDouble(out var value))
            {
                return (false, 0, $"Argument '{propertyName}' must be a number");
            }

            return (true, value, null);
        }

        /// <summary>
        /// Helper: Get optional string argument
        /// </summary>
        protected string? GetOptionalString(JsonElement args, string propertyName, string? defaultValue = null)
        {
            if (args.TryGetProperty(propertyName, out var element))
            {
                return element.GetString() ?? defaultValue;
            }

            return defaultValue;
        }

        /// <summary>
        /// Helper: Get optional int argument
        /// </summary>
        protected int GetOptionalInt(JsonElement args, string propertyName, int defaultValue = 0)
        {
            if (args.TryGetProperty(propertyName, out var element))
            {
                if (element.TryGetInt32(out var value))
                {
                    return value;
                }
            }

            return defaultValue;
        }

        /// <summary>
        /// Helper: Get optional bool argument
        /// </summary>
        protected bool GetOptionalBool(JsonElement args, string propertyName, bool defaultValue = false)
        {
            if (args.TryGetProperty(propertyName, out var element))
            {
                if (element.ValueKind == JsonValueKind.True) return true;
                if (element.ValueKind == JsonValueKind.False) return false;
            }

            return defaultValue;
        }
    }
}
