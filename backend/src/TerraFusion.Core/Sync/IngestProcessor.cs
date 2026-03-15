// TFR-086 — Processes ingested records through transformation pipeline
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync
{
    /// <summary>
    /// Defines a field mapping from source to target schema.
    /// </summary>
    public sealed record FieldMapping
    {
        /// <summary>Source field name (as received from connector).</summary>
        public string SourceField { get; init; } = string.Empty;

        /// <summary>Target field name (TerraFusion schema).</summary>
        public string TargetField { get; init; } = string.Empty;

        /// <summary>Target CLR type name (e.g. "System.String", "System.Int32", "System.Decimal").</summary>
        public string TargetType { get; init; } = "System.String";

        /// <summary>Default value to apply when source is null or empty.</summary>
        public object? DefaultValue { get; init; }

        /// <summary>Whether this field is required (null/empty = validation error).</summary>
        public bool Required { get; init; }
    }

    /// <summary>
    /// Defines a computed field generated from other fields.
    /// </summary>
    public sealed record ComputedField
    {
        /// <summary>Target field name.</summary>
        public string FieldName { get; init; } = string.Empty;

        /// <summary>Function that computes the value from the record.</summary>
        public Func<Dictionary<string, object?>, object?> Compute { get; init; } = _ => null;
    }

    /// <summary>
    /// Configuration for the ingest processor pipeline.
    /// </summary>
    public sealed class IngestProcessorConfig
    {
        public List<FieldMapping> FieldMappings { get; } = new();
        public List<ComputedField> ComputedFields { get; } = new();

        /// <summary>If true, unmapped source fields are passed through unchanged.</summary>
        public bool PassThroughUnmapped { get; set; } = false;
    }

    /// <summary>
    /// Result of processing a batch of records.
    /// </summary>
    public sealed record ProcessorResult
    {
        public IReadOnlyList<Dictionary<string, object?>> Records { get; init; } = Array.Empty<Dictionary<string, object?>>();
        public int Processed { get; init; }
        public int Failed { get; init; }
        public IReadOnlyList<string> Errors { get; init; } = Array.Empty<string>();
    }

    /// <summary>
    /// Processes ingested records through a transformation pipeline:
    /// field mapping, type conversion, default value application, computed field generation.
    /// </summary>
    public class IngestProcessor
    {
        private readonly IngestProcessorConfig _config;

        public IngestProcessor(IngestProcessorConfig config)
        {
            _config = config ?? throw new ArgumentNullException(nameof(config));
        }

        /// <summary>
        /// Processes a batch of raw records into mapped/transformed records.
        /// </summary>
        public Task<ProcessorResult> ProcessAsync(
            IReadOnlyList<Dictionary<string, object?>> rawRecords,
            CancellationToken ct = default)
        {
            var output = new List<Dictionary<string, object?>>();
            var errors = new List<string>();
            int failed = 0;

            for (int i = 0; i < rawRecords.Count; i++)
            {
                ct.ThrowIfCancellationRequested();
                try
                {
                    var transformed = TransformRecord(rawRecords[i], i);
                    output.Add(transformed);
                }
                catch (Exception ex)
                {
                    failed++;
                    errors.Add($"Record {i}: {ex.Message}");
                }
            }

            return Task.FromResult(new ProcessorResult
            {
                Records = output,
                Processed = output.Count,
                Failed = failed,
                Errors = errors
            });
        }

        private Dictionary<string, object?> TransformRecord(Dictionary<string, object?> source, int index)
        {
            var target = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);

            // Apply field mappings
            foreach (var mapping in _config.FieldMappings)
            {
                source.TryGetValue(mapping.SourceField, out var rawValue);

                if (rawValue == null || (rawValue is string s && string.IsNullOrWhiteSpace(s)))
                {
                    if (mapping.Required && mapping.DefaultValue == null)
                        throw new InvalidOperationException(
                            $"Required field '{mapping.SourceField}' is null at record {index}.");

                    rawValue = mapping.DefaultValue;
                }

                target[mapping.TargetField] = ConvertType(rawValue, mapping.TargetType);
            }

            // Pass through unmapped fields
            if (_config.PassThroughUnmapped)
            {
                var mappedSources = _config.FieldMappings.Select(m => m.SourceField).ToHashSet(StringComparer.OrdinalIgnoreCase);
                foreach (var kvp in source)
                {
                    if (!mappedSources.Contains(kvp.Key) && !target.ContainsKey(kvp.Key))
                        target[kvp.Key] = kvp.Value;
                }
            }

            // Apply computed fields
            foreach (var computed in _config.ComputedFields)
            {
                target[computed.FieldName] = computed.Compute(target);
            }

            return target;
        }

        /// <summary>
        /// Converts a value to the specified CLR type.
        /// </summary>
        private static object? ConvertType(object? value, string targetType)
        {
            if (value == null) return null;

            return targetType switch
            {
                "System.String" => value.ToString(),
                "System.Int32" => Convert.ToInt32(value, CultureInfo.InvariantCulture),
                "System.Int64" => Convert.ToInt64(value, CultureInfo.InvariantCulture),
                "System.Decimal" => Convert.ToDecimal(value, CultureInfo.InvariantCulture),
                "System.Double" => Convert.ToDouble(value, CultureInfo.InvariantCulture),
                "System.Boolean" => Convert.ToBoolean(value, CultureInfo.InvariantCulture),
                "System.DateTime" => Convert.ToDateTime(value, CultureInfo.InvariantCulture),
                "System.Guid" => value is Guid g ? g : Guid.Parse(value.ToString()!),
                _ => value
            };
        }
    }
}
