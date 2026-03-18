// TMR-033: File-based ETL plugins for CSV, Excel, JSON, XML, and geospatial formats
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace TerraFusion.DataMining.ETL
{
    /// <summary>
    /// Represents a generic row of key-value data parsed from a file.
    /// </summary>
    public class FileRecord
    {
        /// <summary>Source file path.</summary>
        public string SourceFile { get; set; } = string.Empty;

        /// <summary>Row index within the source file.</summary>
        public int RowIndex { get; set; }

        /// <summary>Column-value pairs for this row.</summary>
        public Dictionary<string, string?> Fields { get; set; } = new();
    }

    /// <summary>
    /// Supported file formats for the file ETL system.
    /// </summary>
    public enum FileFormat
    {
        /// <summary>Comma-separated values.</summary>
        Csv,
        /// <summary>Tab-separated values.</summary>
        Tsv,
        /// <summary>Excel workbook (.xlsx).</summary>
        Excel,
        /// <summary>JSON array of objects.</summary>
        Json,
        /// <summary>XML document.</summary>
        Xml,
        /// <summary>GeoJSON geospatial data.</summary>
        GeoJson,
        /// <summary>Shapefile geospatial data.</summary>
        Shapefile
    }

    /// <summary>
    /// Configuration for a file-based ETL import.
    /// </summary>
    public class FileImportConfig
    {
        /// <summary>Path to the source file.</summary>
        public string FilePath { get; set; } = string.Empty;

        /// <summary>Detected or specified file format.</summary>
        public FileFormat Format { get; set; }

        /// <summary>Column mapping: source column name to target field name.</summary>
        public Dictionary<string, string> ColumnMapping { get; set; } = new();

        /// <summary>Whether the first row contains headers (CSV/TSV).</summary>
        public bool HasHeaders { get; set; } = true;

        /// <summary>Sheet name or index for Excel files.</summary>
        public string? SheetName { get; set; }

        /// <summary>JSON path to the array of records (for JSON files).</summary>
        public string? JsonRecordPath { get; set; }

        /// <summary>XPath to repeat elements (for XML files).</summary>
        public string? XmlRecordXPath { get; set; }
    }

    /// <summary>
    /// File-based ETL plugin that supports CSV, Excel, JSON, XML, and geospatial files.
    /// Extracts records from files, transforms using column mapping, and loads as
    /// normalized property records.
    /// </summary>
    public class FileEtlPlugin : BaseEtlJob<FileRecord, PropertySyncRecord>, IEtlPlugin
    {
        private readonly MultiFormatFileParser _parser;
        private FileImportConfig _config;

        /// <inheritdoc/>
        public override string JobName => "FileImport_ETL";

        /// <summary>Plugin identifier.</summary>
        public string PluginId => "file-etl";

        /// <summary>Plugin display name.</summary>
        public string PluginName => "File Import ETL";

        /// <summary>Plugin description.</summary>
        public string Description => "Imports property data from CSV, Excel, JSON, XML, and geospatial files.";

        /// <summary>Plugin version.</summary>
        public string Version => "1.0.0";

        /// <summary>
        /// Initializes the file ETL plugin.
        /// </summary>
        /// <param name="parser">Multi-format file parser.</param>
        /// <param name="logger">Logger instance.</param>
        public FileEtlPlugin(MultiFormatFileParser parser, ILogger<FileEtlPlugin> logger)
            : base(logger)
        {
            _parser = parser ?? throw new ArgumentNullException(nameof(parser));
            _config = new FileImportConfig();
        }

        /// <summary>
        /// Configures the import for a specific file.
        /// </summary>
        /// <param name="config">File import configuration.</param>
        public void Configure(FileImportConfig config)
        {
            _config = config ?? throw new ArgumentNullException(nameof(config));
        }

        /// <summary>
        /// Extracts records from the configured file using the multi-format parser.
        /// </summary>
        protected override async Task<IReadOnlyList<FileRecord>> ExtractAsync(
            CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(_config.FilePath))
            {
                Logger.LogWarning("No file path configured for file ETL");
                return Array.Empty<FileRecord>();
            }

            Logger.LogInformation("Extracting from file: {Path} (format: {Format})",
                _config.FilePath, _config.Format);

            return await _parser.ParseFileAsync(_config.FilePath, _config, cancellationToken);
        }

        /// <summary>
        /// Transforms file records into PropertySyncRecords using column mapping.
        /// </summary>
        protected override Task<IReadOnlyList<PropertySyncRecord>> TransformAsync(
            IReadOnlyList<FileRecord> rawRecords, CancellationToken cancellationToken)
        {
            var mapping = _config.ColumnMapping;
            var transformed = rawRecords
                .Select(r => new PropertySyncRecord
                {
                    SourceSystem = $"File:{Path.GetFileName(_config.FilePath)}",
                    SourceId = $"file-{Path.GetFileName(_config.FilePath)}-{r.RowIndex}",
                    Address = GetMappedField(r, mapping, "Address"),
                    City = GetMappedField(r, mapping, "City"),
                    State = GetMappedField(r, mapping, "State"),
                    ZipCode = GetMappedField(r, mapping, "ZipCode"),
                    County = GetMappedField(r, mapping, "County"),
                    ParcelNumber = GetMappedField(r, mapping, "ParcelNumber"),
                    PropertyType = GetMappedField(r, mapping, "PropertyType"),
                    AssessedValue = TryParseDecimal(GetMappedField(r, mapping, "AssessedValue")),
                    MarketValue = TryParseDecimal(GetMappedField(r, mapping, "MarketValue")),
                    FetchedAt = DateTime.UtcNow
                })
                .Where(r => !string.IsNullOrWhiteSpace(r.Address) || !string.IsNullOrWhiteSpace(r.ParcelNumber))
                .ToList()
                .AsReadOnly();

            return Task.FromResult<IReadOnlyList<PropertySyncRecord>>(transformed);
        }

        /// <summary>
        /// Loads transformed file records. Stub implementation.
        /// </summary>
        protected override Task<int> LoadAsync(
            IReadOnlyList<PropertySyncRecord> records, CancellationToken cancellationToken)
        {
            Logger.LogInformation("Loading {Count} records from file import (stub)", records.Count);
            return Task.FromResult(records.Count);
        }

        /// <inheritdoc/>
        public Task<EtlJobResult> ExecuteAsync(CancellationToken cancellationToken = default)
        {
            return RunAsync(cancellationToken);
        }

        private static string? GetMappedField(FileRecord record, Dictionary<string, string> mapping, string targetField)
        {
            // Check if there's a mapping for this target field
            var sourceColumn = mapping
                .FirstOrDefault(m => m.Value.Equals(targetField, StringComparison.OrdinalIgnoreCase))
                .Key;

            if (sourceColumn != null && record.Fields.TryGetValue(sourceColumn, out var value))
                return value;

            // Fall back to direct field name match
            if (record.Fields.TryGetValue(targetField, out var directValue))
                return directValue;

            return null;
        }

        private static decimal? TryParseDecimal(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return null;
            var cleaned = value.Replace("$", "").Replace(",", "").Trim();
            return decimal.TryParse(cleaned, out var result) ? result : null;
        }
    }
}
