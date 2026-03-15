// TFR-030 — Multi-table PACS data processor
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using TerraFusion.Core.Sync.Connectors;

namespace TerraFusion.Core.Sync.ETL
{
    /// <summary>
    /// Result of multi-table PACS processing.
    /// </summary>
    public sealed record MultiTableResult
    {
        public int PropertiesProcessed { get; init; }
        public int ImprovementsJoined { get; init; }
        public int SalesJoined { get; init; }
        public int OwnersJoined { get; init; }
        public int DenormalizedRecordsProduced { get; init; }
        public int ForeignKeyErrors { get; init; }
        public IReadOnlyList<string> Errors { get; init; } = Array.Empty<string>();
    }

    /// <summary>
    /// Configuration for multi-table PACS processing.
    /// </summary>
    public sealed record PacsMultiTableConfig
    {
        /// <summary>Primary key column in the property master table.</summary>
        public string PropertyKeyColumn { get; init; } = "PROP_ID";

        /// <summary>Foreign key column in child tables referencing the property.</summary>
        public string PropertyForeignKey { get; init; } = "PROP_ID";

        /// <summary>Whether to include improvement records.</summary>
        public bool IncludeImprovements { get; init; } = true;

        /// <summary>Whether to include sales records.</summary>
        public bool IncludeSales { get; init; } = true;

        /// <summary>Whether to include ownership records.</summary>
        public bool IncludeOwners { get; init; } = true;

        /// <summary>Maximum records per table to process.</summary>
        public int MaxRecords { get; init; } = 10000;
    }

    /// <summary>
    /// Multi-table PACS data processor. Handles related table joins
    /// (property -> improvements -> sales -> owners), resolves foreign keys,
    /// and produces denormalized property records for downstream consumption.
    /// </summary>
    public class PacsMultiTableProcessor
    {
        /// <summary>
        /// Processes multiple PACS tables and joins them into denormalized property records.
        /// </summary>
        /// <param name="properties">Property master records (keyed by PropertyKeyColumn).</param>
        /// <param name="improvements">Improvement records with foreign key to property.</param>
        /// <param name="sales">Sales records with foreign key to property.</param>
        /// <param name="owners">Ownership records with foreign key to property.</param>
        /// <param name="config">Processing configuration.</param>
        /// <param name="ct">Cancellation token.</param>
        /// <returns>Denormalized records and processing statistics.</returns>
        public Task<(IReadOnlyList<Dictionary<string, object?>> Records, MultiTableResult Stats)> ProcessAsync(
            IReadOnlyList<Dictionary<string, object?>> properties,
            IReadOnlyList<Dictionary<string, object?>> improvements,
            IReadOnlyList<Dictionary<string, object?>> sales,
            IReadOnlyList<Dictionary<string, object?>> owners,
            PacsMultiTableConfig config,
            CancellationToken ct = default)
        {
            var errors = new List<string>();
            var denormalized = new List<Dictionary<string, object?>>();
            int improvementsJoined = 0, salesJoined = 0, ownersJoined = 0, fkErrors = 0;

            // Index child tables by foreign key for O(1) lookup
            var improvementsByProp = IndexByKey(improvements, config.PropertyForeignKey);
            var salesByProp = IndexByKey(sales, config.PropertyForeignKey);
            var ownersByProp = IndexByKey(owners, config.PropertyForeignKey);

            foreach (var property in properties)
            {
                ct.ThrowIfCancellationRequested();

                if (!property.TryGetValue(config.PropertyKeyColumn, out var keyObj) || keyObj == null)
                {
                    fkErrors++;
                    errors.Add($"Property record missing key column '{config.PropertyKeyColumn}'.");
                    continue;
                }

                var key = keyObj.ToString()!;
                var record = new Dictionary<string, object?>(property, StringComparer.OrdinalIgnoreCase);

                // Join improvements
                if (config.IncludeImprovements && improvementsByProp.TryGetValue(key, out var propImprovements))
                {
                    record["Improvements"] = propImprovements;
                    record["ImprovementCount"] = propImprovements.Count;
                    improvementsJoined += propImprovements.Count;

                    // Flatten primary improvement into top-level fields
                    if (propImprovements.Count > 0)
                    {
                        var primary = propImprovements[0];
                        FlattenChild(record, primary, "Primary_");
                    }
                }
                else
                {
                    record["Improvements"] = Array.Empty<Dictionary<string, object?>>();
                    record["ImprovementCount"] = 0;
                }

                // Join sales
                if (config.IncludeSales && salesByProp.TryGetValue(key, out var propSales))
                {
                    record["Sales"] = propSales;
                    record["SaleCount"] = propSales.Count;
                    salesJoined += propSales.Count;

                    // Flatten most recent sale
                    if (propSales.Count > 0)
                    {
                        var mostRecent = propSales
                            .OrderByDescending(s => s.TryGetValue("SALE_DATE", out var d) ? d : null)
                            .First();
                        FlattenChild(record, mostRecent, "LastSale_");
                    }
                }
                else
                {
                    record["Sales"] = Array.Empty<Dictionary<string, object?>>();
                    record["SaleCount"] = 0;
                }

                // Join owners
                if (config.IncludeOwners && ownersByProp.TryGetValue(key, out var propOwners))
                {
                    record["Owners"] = propOwners;
                    record["OwnerCount"] = propOwners.Count;
                    ownersJoined += propOwners.Count;

                    // Flatten primary owner
                    if (propOwners.Count > 0)
                    {
                        FlattenChild(record, propOwners[0], "PrimaryOwner_");
                    }
                }
                else
                {
                    record["Owners"] = Array.Empty<Dictionary<string, object?>>();
                    record["OwnerCount"] = 0;
                }

                // Map PACS field names to TerraFusion canonical names
                var canonical = PacsConnector.MapToCanonical(record);
                denormalized.Add(canonical);
            }

            var stats = new MultiTableResult
            {
                PropertiesProcessed = properties.Count,
                ImprovementsJoined = improvementsJoined,
                SalesJoined = salesJoined,
                OwnersJoined = ownersJoined,
                DenormalizedRecordsProduced = denormalized.Count,
                ForeignKeyErrors = fkErrors,
                Errors = errors
            };

            return Task.FromResult<(IReadOnlyList<Dictionary<string, object?>>, MultiTableResult)>(
                (denormalized, stats));
        }

        /// <summary>
        /// Indexes a list of records by a key column into a lookup dictionary.
        /// Records with the same key are grouped into a list.
        /// </summary>
        private static Dictionary<string, List<Dictionary<string, object?>>> IndexByKey(
            IReadOnlyList<Dictionary<string, object?>> records, string keyColumn)
        {
            var index = new Dictionary<string, List<Dictionary<string, object?>>>(StringComparer.OrdinalIgnoreCase);
            foreach (var record in records)
            {
                if (record.TryGetValue(keyColumn, out var keyObj) && keyObj != null)
                {
                    var key = keyObj.ToString()!;
                    if (!index.ContainsKey(key))
                        index[key] = new List<Dictionary<string, object?>>();
                    index[key].Add(record);
                }
            }
            return index;
        }

        /// <summary>
        /// Flattens child record fields into the parent with a prefix.
        /// Skips the foreign key column to avoid duplication.
        /// </summary>
        private static void FlattenChild(
            Dictionary<string, object?> parent,
            Dictionary<string, object?> child,
            string prefix)
        {
            foreach (var kvp in child)
            {
                var targetKey = $"{prefix}{kvp.Key}";
                if (!parent.ContainsKey(targetKey))
                    parent[targetKey] = kvp.Value;
            }
        }
    }
}
