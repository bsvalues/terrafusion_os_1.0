// TFR-004: Schema contract for Benton County PACS 9.0 integration
using System;
using System.Collections.Generic;
using System.Linq;

namespace TerraFusion.Core.Sync.Contracts
{
    /// <summary>
    /// Defines the contract interface for PACS schema validation.
    /// </summary>
    public interface IPacsContract
    {
        /// <summary>
        /// Gets the expected table definitions for this PACS contract.
        /// </summary>
        IReadOnlyDictionary<string, PacsTableDefinition> ExpectedTables { get; }

        /// <summary>
        /// Validates the live PACS schema against this contract.
        /// </summary>
        /// <param name="liveSchema">The live schema discovered from the PACS database.</param>
        /// <returns>A contract validation result indicating pass/fail and drift details.</returns>
        ContractValidationResult Validate(PacsLiveSchema liveSchema);

        /// <summary>
        /// Gets the contract version identifier.
        /// </summary>
        string ContractVersion { get; }

        /// <summary>
        /// Gets the county FIPS code this contract targets.
        /// </summary>
        string CountyFips { get; }
    }

    /// <summary>
    /// Schema contract for Benton County PACS 9.0 data.
    /// Defines expected table names, column names, and data types.
    /// Used to detect schema drift before sync operations.
    /// </summary>
    public class PacsBentonContract : IPacsContract
    {
        /// <inheritdoc />
        public string ContractVersion => "1.0.0-benton-pacs9";

        /// <inheritdoc />
        public string CountyFips => "53005";

        /// <inheritdoc />
        public IReadOnlyDictionary<string, PacsTableDefinition> ExpectedTables { get; }

        /// <summary>
        /// Initializes the Benton County PACS 9.0 schema contract.
        /// </summary>
        public PacsBentonContract()
        {
            var tables = new Dictionary<string, PacsTableDefinition>
            {
                ["Property"] = new PacsTableDefinition
                {
                    TableName = "Property",
                    Schema = "dbo",
                    Columns = new Dictionary<string, PacsColumnDefinition>
                    {
                        ["prop_id"] = new("prop_id", "int", false, true),
                        ["parcel_number"] = new("parcel_number", "varchar(30)", false, false),
                        ["property_type"] = new("property_type", "varchar(10)", false, false),
                        ["status_code"] = new("status_code", "varchar(5)", false, false),
                        ["legal_description"] = new("legal_description", "varchar(500)", true, false),
                        ["situs_address"] = new("situs_address", "varchar(200)", true, false),
                        ["situs_city"] = new("situs_city", "varchar(100)", true, false),
                        ["situs_zip"] = new("situs_zip", "varchar(10)", true, false),
                        ["neighborhood_code"] = new("neighborhood_code", "varchar(20)", true, false),
                        ["map_number"] = new("map_number", "varchar(30)", true, false),
                        ["create_date"] = new("create_date", "datetime", false, false),
                        ["modify_date"] = new("modify_date", "datetime", true, false),
                    }
                },
                ["Owner"] = new PacsTableDefinition
                {
                    TableName = "Owner",
                    Schema = "dbo",
                    Columns = new Dictionary<string, PacsColumnDefinition>
                    {
                        ["owner_id"] = new("owner_id", "int", false, true),
                        ["prop_id"] = new("prop_id", "int", false, false),
                        ["owner_name"] = new("owner_name", "varchar(200)", false, false),
                        ["owner_type"] = new("owner_type", "varchar(10)", true, false),
                        ["mailing_address"] = new("mailing_address", "varchar(300)", true, false),
                        ["mailing_city"] = new("mailing_city", "varchar(100)", true, false),
                        ["mailing_state"] = new("mailing_state", "varchar(2)", true, false),
                        ["mailing_zip"] = new("mailing_zip", "varchar(10)", true, false),
                        ["ownership_pct"] = new("ownership_pct", "decimal(5,2)", true, false),
                        ["begin_date"] = new("begin_date", "datetime", true, false),
                    }
                },
                ["Value"] = new PacsTableDefinition
                {
                    TableName = "Value",
                    Schema = "dbo",
                    Columns = new Dictionary<string, PacsColumnDefinition>
                    {
                        ["value_id"] = new("value_id", "int", false, true),
                        ["prop_id"] = new("prop_id", "int", false, false),
                        ["tax_year"] = new("tax_year", "int", false, false),
                        ["land_value"] = new("land_value", "decimal(18,2)", true, false),
                        ["improvement_value"] = new("improvement_value", "decimal(18,2)", true, false),
                        ["total_value"] = new("total_value", "decimal(18,2)", true, false),
                        ["assessed_value"] = new("assessed_value", "decimal(18,2)", true, false),
                        ["value_type"] = new("value_type", "varchar(10)", false, false),
                        ["value_date"] = new("value_date", "datetime", true, false),
                    }
                },
                ["Sale"] = new PacsTableDefinition
                {
                    TableName = "Sale",
                    Schema = "dbo",
                    Columns = new Dictionary<string, PacsColumnDefinition>
                    {
                        ["sale_id"] = new("sale_id", "int", false, true),
                        ["prop_id"] = new("prop_id", "int", false, false),
                        ["sale_date"] = new("sale_date", "datetime", false, false),
                        ["sale_price"] = new("sale_price", "decimal(18,2)", true, false),
                        ["sale_type"] = new("sale_type", "varchar(20)", true, false),
                        ["deed_type"] = new("deed_type", "varchar(20)", true, false),
                        ["excise_number"] = new("excise_number", "varchar(30)", true, false),
                        ["grantor"] = new("grantor", "varchar(200)", true, false),
                        ["grantee"] = new("grantee", "varchar(200)", true, false),
                        ["verified"] = new("verified", "bit", false, false),
                    }
                },
                ["Improvement"] = new PacsTableDefinition
                {
                    TableName = "Improvement",
                    Schema = "dbo",
                    Columns = new Dictionary<string, PacsColumnDefinition>
                    {
                        ["impr_id"] = new("impr_id", "int", false, true),
                        ["prop_id"] = new("prop_id", "int", false, false),
                        ["impr_type"] = new("impr_type", "varchar(20)", false, false),
                        ["year_built"] = new("year_built", "int", true, false),
                        ["effective_year"] = new("effective_year", "int", true, false),
                        ["living_area"] = new("living_area", "decimal(12,2)", true, false),
                        ["total_area"] = new("total_area", "decimal(12,2)", true, false),
                        ["stories"] = new("stories", "decimal(4,2)", true, false),
                        ["condition_code"] = new("condition_code", "varchar(10)", true, false),
                        ["quality_code"] = new("quality_code", "varchar(10)", true, false),
                    }
                },
                ["Land"] = new PacsTableDefinition
                {
                    TableName = "Land",
                    Schema = "dbo",
                    Columns = new Dictionary<string, PacsColumnDefinition>
                    {
                        ["land_id"] = new("land_id", "int", false, true),
                        ["prop_id"] = new("prop_id", "int", false, false),
                        ["land_type"] = new("land_type", "varchar(20)", false, false),
                        ["acres"] = new("acres", "decimal(12,4)", true, false),
                        ["sqft"] = new("sqft", "decimal(14,2)", true, false),
                        ["zoning"] = new("zoning", "varchar(20)", true, false),
                        ["use_code"] = new("use_code", "varchar(20)", true, false),
                        ["frontage"] = new("frontage", "decimal(10,2)", true, false),
                        ["depth"] = new("depth", "decimal(10,2)", true, false),
                    }
                },
            };

            ExpectedTables = tables;
        }

        /// <inheritdoc />
        public ContractValidationResult Validate(PacsLiveSchema liveSchema)
        {
            if (liveSchema == null)
                throw new ArgumentNullException(nameof(liveSchema));

            var result = new ContractValidationResult
            {
                ContractVersion = ContractVersion,
                ValidatedAt = DateTime.UtcNow,
            };

            foreach (var (tableName, expectedTable) in ExpectedTables)
            {
                if (!liveSchema.Tables.TryGetValue(tableName, out var liveTable))
                {
                    result.Drifts.Add(new SchemaDrift
                    {
                        DriftType = SchemaDriftType.MissingTable,
                        TableName = tableName,
                        Description = $"Expected table '{expectedTable.Schema}.{tableName}' not found in live schema.",
                        Severity = DriftSeverity.Breaking,
                    });
                    continue;
                }

                foreach (var (colName, expectedCol) in expectedTable.Columns)
                {
                    if (!liveTable.Columns.TryGetValue(colName, out var liveCol))
                    {
                        result.Drifts.Add(new SchemaDrift
                        {
                            DriftType = SchemaDriftType.MissingColumn,
                            TableName = tableName,
                            ColumnName = colName,
                            Description = $"Expected column '{colName}' not found in table '{tableName}'.",
                            Severity = expectedCol.Nullable ? DriftSeverity.Warning : DriftSeverity.Breaking,
                        });
                        continue;
                    }

                    if (!string.Equals(expectedCol.DataType, liveCol.DataType, StringComparison.OrdinalIgnoreCase))
                    {
                        result.Drifts.Add(new SchemaDrift
                        {
                            DriftType = SchemaDriftType.TypeMismatch,
                            TableName = tableName,
                            ColumnName = colName,
                            ExpectedValue = expectedCol.DataType,
                            ActualValue = liveCol.DataType,
                            Description = $"Column '{colName}' in '{tableName}': expected type '{expectedCol.DataType}', found '{liveCol.DataType}'.",
                            Severity = DriftSeverity.Breaking,
                        });
                    }

                    if (expectedCol.Nullable != liveCol.Nullable)
                    {
                        result.Drifts.Add(new SchemaDrift
                        {
                            DriftType = SchemaDriftType.NullabilityChange,
                            TableName = tableName,
                            ColumnName = colName,
                            ExpectedValue = expectedCol.Nullable.ToString(),
                            ActualValue = liveCol.Nullable.ToString(),
                            Description = $"Column '{colName}' in '{tableName}': nullability changed.",
                            Severity = DriftSeverity.Warning,
                        });
                    }
                }

                // Detect unexpected columns (additive drift)
                foreach (var liveColName in liveTable.Columns.Keys)
                {
                    if (!expectedTable.Columns.ContainsKey(liveColName))
                    {
                        result.Drifts.Add(new SchemaDrift
                        {
                            DriftType = SchemaDriftType.UnexpectedColumn,
                            TableName = tableName,
                            ColumnName = liveColName,
                            Description = $"Unexpected column '{liveColName}' found in table '{tableName}'.",
                            Severity = DriftSeverity.Info,
                        });
                    }
                }
            }

            result.IsValid = !result.Drifts.Any(d => d.Severity == DriftSeverity.Breaking);
            return result;
        }
    }

    /// <summary>
    /// Defines the expected structure of a PACS database table.
    /// </summary>
    public class PacsTableDefinition
    {
        /// <summary>Table name in the PACS database.</summary>
        public string TableName { get; set; } = string.Empty;

        /// <summary>Database schema (e.g., dbo).</summary>
        public string Schema { get; set; } = "dbo";

        /// <summary>Expected columns keyed by column name.</summary>
        public Dictionary<string, PacsColumnDefinition> Columns { get; set; } = new();
    }

    /// <summary>
    /// Defines the expected structure of a PACS column.
    /// </summary>
    public record PacsColumnDefinition(
        string ColumnName,
        string DataType,
        bool Nullable,
        bool IsPrimaryKey
    );

    /// <summary>
    /// Represents the live schema discovered from a PACS database.
    /// </summary>
    public class PacsLiveSchema
    {
        /// <summary>Live tables keyed by table name.</summary>
        public Dictionary<string, PacsTableDefinition> Tables { get; set; } = new();
    }

    /// <summary>
    /// Result of validating a PACS contract against a live schema.
    /// </summary>
    public class ContractValidationResult
    {
        /// <summary>Whether the live schema passes the contract (no breaking drifts).</summary>
        public bool IsValid { get; set; }

        /// <summary>Contract version that was validated.</summary>
        public string ContractVersion { get; set; } = string.Empty;

        /// <summary>UTC timestamp of the validation.</summary>
        public DateTime ValidatedAt { get; set; }

        /// <summary>List of detected schema drifts.</summary>
        public List<SchemaDrift> Drifts { get; set; } = new();
    }

    /// <summary>
    /// Describes a single schema drift between expected and live PACS schema.
    /// </summary>
    public class SchemaDrift
    {
        /// <summary>Type of drift detected.</summary>
        public SchemaDriftType DriftType { get; set; }

        /// <summary>Table where drift was detected.</summary>
        public string TableName { get; set; } = string.Empty;

        /// <summary>Column where drift was detected (if applicable).</summary>
        public string? ColumnName { get; set; }

        /// <summary>Expected value.</summary>
        public string? ExpectedValue { get; set; }

        /// <summary>Actual value found.</summary>
        public string? ActualValue { get; set; }

        /// <summary>Human-readable description.</summary>
        public string Description { get; set; } = string.Empty;

        /// <summary>How severe is this drift.</summary>
        public DriftSeverity Severity { get; set; }
    }

    /// <summary>Type of schema drift.</summary>
    public enum SchemaDriftType
    {
        /// <summary>An expected table is missing.</summary>
        MissingTable,
        /// <summary>An expected column is missing.</summary>
        MissingColumn,
        /// <summary>A column's data type has changed.</summary>
        TypeMismatch,
        /// <summary>A column's nullability has changed.</summary>
        NullabilityChange,
        /// <summary>An unexpected column was found.</summary>
        UnexpectedColumn,
    }

    /// <summary>How severe a drift is.</summary>
    public enum DriftSeverity
    {
        /// <summary>Informational only; no action required.</summary>
        Info,
        /// <summary>Non-breaking but worth investigating.</summary>
        Warning,
        /// <summary>Sync cannot proceed until resolved.</summary>
        Breaking,
    }
}
