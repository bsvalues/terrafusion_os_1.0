// TMR-167: PACMLS Credential Setup - Configuration validation (NO actual credentials)
using System;
using System.Collections.Generic;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace TerraFusion.DataMining.Scripts
{
    /// <summary>
    /// Result of PACMLS configuration validation.
    /// </summary>
    public class PacmlsConfigValidation
    {
        public bool IsValid { get; set; }
        public List<string> MissingKeys { get; set; } = new();
        public List<string> ConfiguredKeys { get; set; } = new();
        public DateTime ValidatedAt { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// Validates that PACMLS connection configuration is present in IConfiguration.
    /// NEVER stores, logs, or hardcodes any credentials or API keys.
    /// All sensitive values must be provided via environment variables or secure config.
    /// </summary>
    public class PacmlsCredSetup
    {
        private readonly ILogger<PacmlsCredSetup> _logger;
        private readonly IConfiguration _configuration;

        /// <summary>
        /// Configuration keys required for PACMLS connectivity.
        /// Values are read from IConfiguration at runtime only.
        /// </summary>
        private static readonly string[] RequiredKeys = new[]
        {
            "DataSources:pacmls:Endpoint",
            "DataSources:pacmls:ApiKey",
            "DataSources:pacmls:MemberId",
        };

        public PacmlsCredSetup(ILogger<PacmlsCredSetup> logger, IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;
        }

        /// <summary>
        /// Validates that all required PACMLS configuration keys are present.
        /// Does NOT read, store, or log the actual values.
        /// </summary>
        public PacmlsConfigValidation Validate()
        {
            var result = new PacmlsConfigValidation();

            foreach (var key in RequiredKeys)
            {
                var value = _configuration[key];
                if (string.IsNullOrEmpty(value))
                {
                    result.MissingKeys.Add(key);
                }
                else
                {
                    // Log key name only, NEVER the value
                    result.ConfiguredKeys.Add(key);
                }
            }

            result.IsValid = result.MissingKeys.Count == 0;

            if (result.IsValid)
                _logger.LogInformation("PACMLS configuration validated: all {Count} keys present", RequiredKeys.Length);
            else
                _logger.LogWarning("PACMLS configuration incomplete: {Missing} keys missing", result.MissingKeys.Count);

            return result;
        }

        /// <summary>
        /// Returns setup instructions for missing configuration keys.
        /// </summary>
        public string GetSetupInstructions(PacmlsConfigValidation validation)
        {
            if (validation.IsValid)
                return "PACMLS configuration is complete. No action needed.";

            return $"Set the following environment variables or config entries:\n" +
                   string.Join("\n", validation.MissingKeys.ConvertAll(k => $"  - {k}"));
        }
    }
}
