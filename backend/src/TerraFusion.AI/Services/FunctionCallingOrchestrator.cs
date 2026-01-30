// TerraFusionGPT Suite: Function Calling Orchestrator
// Elite Government OS Engineering - GPT Function Execution Engine

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.Functions;

namespace TerraFusion.AI.Services
{
    /// <summary>
    /// Orchestrates function calling for GPT interactions
    /// </summary>
    public interface IFunctionCallingOrchestrator
    {
        /// <summary>
        /// Register a function handler
        /// </summary>
        void RegisterFunction(string functionName, IFunctionHandler handler);

        /// <summary>
        /// Execute a function with arguments
        /// </summary>
        System.Threading.Tasks.Task<FunctionExecutionResult> ExecuteFunctionAsync(
            string functionName,
            string arguments,
            SecurityContext securityContext);

        /// <summary>
        /// Get available functions for a GPT
        /// </summary>
        List<string> GetAvailableFunctions(int gptConfigId);

        /// <summary>
        /// Validate function exists and user has permission
        /// </summary>
        System.Threading.Tasks.Task<(bool IsValid, string? ErrorMessage)> ValidateFunctionAccessAsync(
            string functionName,
            SecurityContext securityContext);
    }

    /// <summary>
    /// Function calling orchestrator implementation
    /// </summary>
    public class FunctionCallingOrchestrator : IFunctionCallingOrchestrator
    {
        private readonly Dictionary<string, IFunctionHandler> _functionHandlers;
        private readonly ILogger<FunctionCallingOrchestrator> _logger;

        public FunctionCallingOrchestrator(ILogger<FunctionCallingOrchestrator> logger)
        {
            _logger = logger;
            _functionHandlers = new Dictionary<string, IFunctionHandler>(StringComparer.OrdinalIgnoreCase);
        }

        /// <summary>
        /// Register a function handler
        /// </summary>
        public void RegisterFunction(string functionName, IFunctionHandler handler)
        {
            if (string.IsNullOrEmpty(functionName))
            {
                throw new ArgumentNullException(nameof(functionName));
            }

            if (handler == null)
            {
                throw new ArgumentNullException(nameof(handler));
            }

            _functionHandlers[functionName] = handler;
            _logger.LogInformation($"Registered function: {functionName}");
        }

        /// <summary>
        /// Execute a function with arguments
        /// </summary>
        public async System.Threading.Tasks.Task<FunctionExecutionResult> ExecuteFunctionAsync(
            string functionName,
            string arguments,
            SecurityContext securityContext)
        {
            _logger.LogInformation($"Executing function: {functionName}");

            try
            {
                // Validate function exists
                if (!_functionHandlers.ContainsKey(functionName))
                {
                    return FunctionExecutionResult.Error($"Function '{functionName}' not found");
                }

                var handler = _functionHandlers[functionName];

                // Validate access
                var (isValid, errorMessage) = await ValidateFunctionAccessAsync(functionName, securityContext);
                if (!isValid)
                {
                    return FunctionExecutionResult.Error(errorMessage ?? "Access denied");
                }

                // Parse arguments
                JsonDocument? argsDocument = null;
                try
                {
                    argsDocument = JsonDocument.Parse(arguments);
                }
                catch (JsonException ex)
                {
                    return FunctionExecutionResult.Error($"Invalid JSON arguments: {ex.Message}");
                }

                // Validate arguments
                var validationResult = handler.ValidateArguments(argsDocument.RootElement);
                if (!validationResult.IsValid)
                {
                    return FunctionExecutionResult.Error($"Invalid arguments: {validationResult.ErrorMessage}");
                }

                // Execute function
                var startTime = DateTime.UtcNow;
                var result = await handler.ExecuteAsync(argsDocument.RootElement, securityContext);
                var executionTime = (DateTime.UtcNow - startTime).TotalMilliseconds;

                _logger.LogInformation(
                    $"Function '{functionName}' executed successfully in {executionTime}ms");

                return FunctionExecutionResult.Success(result, executionTime);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error executing function '{functionName}'");
                return FunctionExecutionResult.Error($"Function execution failed: {ex.Message}");
            }
        }

        /// <summary>
        /// Get available functions for a GPT
        /// </summary>
        public List<string> GetAvailableFunctions(int gptConfigId)
        {
            // TODO: Filter by GPT configuration permissions
            return _functionHandlers.Keys.ToList();
        }

        /// <summary>
        /// Validate function access
        /// </summary>
        public async System.Threading.Tasks.Task<(bool IsValid, string? ErrorMessage)> ValidateFunctionAccessAsync(
            string functionName,
            SecurityContext securityContext)
        {
            await Task.CompletedTask;
            await Task.CompletedTask;
            // Validate security context
            if (securityContext == null)
            {
                return (false, "Security context required");
            }

            if (string.IsNullOrEmpty(securityContext.UserId))
            {
                return (false, "User ID required");
            }

            // Get handler
            if (!_functionHandlers.ContainsKey(functionName))
            {
                return (false, $"Function '{functionName}' not found");
            }

            var handler = _functionHandlers[functionName];

            // Check required role
            var requiredRole = handler.GetRequiredRole();
            if (!string.IsNullOrEmpty(requiredRole))
            {
                if (!securityContext.Roles.Contains(requiredRole, StringComparer.OrdinalIgnoreCase))
                {
                    return (false, $"Function requires role: {requiredRole}");
                }
            }

            // Check county isolation
            if (handler.RequiresCountyIsolation())
            {
                if (securityContext.CountyId == null)
                {
                    return (false, "County ID required for this function");
                }
            }

            return (true, null);
        }
    }

    /// <summary>
    /// Security context for function execution
    /// </summary>
    public class SecurityContext
    {
        public string UserId { get; set; } = string.Empty;
        public int? CountyId { get; set; }
        public List<string> Roles { get; set; } = new List<string>();
        public Dictionary<string, object> Claims { get; set; } = new Dictionary<string, object>();
    }

    /// <summary>
    /// Function execution result
    /// </summary>
    public class FunctionExecutionResult
    {
        public bool IsSuccess { get; set; }
        public string? Result { get; set; }
        public string? ErrorMessage { get; set; }
        public double ExecutionTimeMs { get; set; }
        public DateTime Timestamp { get; set; }

        public static FunctionExecutionResult Success(string result, double executionTimeMs)
        {
            return new FunctionExecutionResult
            {
                IsSuccess = true,
                Result = result,
                ExecutionTimeMs = executionTimeMs,
                Timestamp = DateTime.UtcNow
            };
        }

        public static FunctionExecutionResult Error(string errorMessage)
        {
            return new FunctionExecutionResult
            {
                IsSuccess = false,
                ErrorMessage = errorMessage,
                Timestamp = DateTime.UtcNow
            };
        }
    }

    /// <summary>
    /// Argument validation result
    /// </summary>
    public class ArgumentValidationResult
    {
        public bool IsValid { get; set; }
        public string? ErrorMessage { get; set; }

        public static ArgumentValidationResult Valid()
        {
            return new ArgumentValidationResult { IsValid = true };
        }

        public static ArgumentValidationResult Invalid(string errorMessage)
        {
            return new ArgumentValidationResult
            {
                IsValid = false,
                ErrorMessage = errorMessage
            };
        }
    }
}
