// TFR-005: Field-level mappings from PACS column names to TerraFusion schema
using System;
using System.Collections.Generic;

namespace TerraFusion.Core.Sync.Contracts
{
    /// <summary>
    /// Describes a single field mapping from a PACS column to a TerraFusion column.
    /// </summary>
    public class FieldMapping
    {
        /// <summary>Column name in the PACS source database.</summary>
        public string PacsColumn { get; set; } = string.Empty;

        /// <summary>Column name in the TerraFusion target schema.</summary>
        public string TerraColumn { get; set; } = string.Empty;

        /// <summary>Data type in TerraFusion (CLR type name).</summary>
        public string DataType { get; set; } = string.Empty;

        /// <summary>
        /// Optional transform expression applied during ingestion.
        /// null means direct copy. Examples: "trim", "upper", "parse_date", "to_decimal".
        /// </summary>
        public string? Transform { get; set; }

        /// <summary>Whether the target column accepts null.</summary>
        public bool Nullable { get; set; }

        /// <summary>Default value when source is null and target is non-nullable.</summary>
        public string? DefaultValue { get; set; }

        /// <summary>
        /// Initializes a new FieldMapping.
        /// </summary>
        public FieldMapping() { }

        /// <summary>
        /// Initializes a new FieldMapping with all properties.
        /// </summary>
        public FieldMapping(string pacsColumn, string terraColumn, string dataType,
            string? transform = null, bool nullable = false, string? defaultValue = null)
        {
            PacsColumn = pacsColumn;
            TerraColumn = terraColumn;
            DataType = dataType;
            Transform = transform;
            Nullable = nullable;
            DefaultValue = defaultValue;
        }
    }

    /// <summary>
    /// Provides field-level mappings from PACS 9.0 column names to the
    /// TerraFusion canonical schema. Organized by source table.
    /// </summary>
    public static class PacsFieldMappings
    {
        /// <summary>
        /// Property table field mappings: PACS Property -> TerraFusion Properties.
        /// </summary>
        public static readonly Dictionary<string, FieldMapping> PropertyMappings = new()
        {
            ["prop_id"] = new("prop_id", "ExternalId", "int", null, false),
            ["parcel_number"] = new("parcel_number", "ParcelNumber", "string", "trim", false),
            ["property_type"] = new("property_type", "PropertyType", "string", "upper", false),
            ["status_code"] = new("status_code", "Status", "string", "map_status", false, "ACTIVE"),
            ["legal_description"] = new("legal_description", "LegalDescription", "string", "trim", true),
            ["situs_address"] = new("situs_address", "SitusAddress", "string", "trim", true),
            ["situs_city"] = new("situs_city", "SitusCity", "string", "trim", true),
            ["situs_zip"] = new("situs_zip", "SitusZip", "string", "trim", true),
            ["neighborhood_code"] = new("neighborhood_code", "NeighborhoodCode", "string", null, true),
            ["map_number"] = new("map_number", "MapNumber", "string", "trim", true),
            ["create_date"] = new("create_date", "SourceCreatedAt", "DateTime", "parse_date", false),
            ["modify_date"] = new("modify_date", "SourceModifiedAt", "DateTime", "parse_date", true),
        };

        /// <summary>
        /// Owner table field mappings: PACS Owner -> TerraFusion PropertyOwners.
        /// </summary>
        public static readonly Dictionary<string, FieldMapping> OwnerMappings = new()
        {
            ["owner_id"] = new("owner_id", "ExternalId", "int", null, false),
            ["prop_id"] = new("prop_id", "PropertyExternalId", "int", null, false),
            ["owner_name"] = new("owner_name", "OwnerName", "string", "trim", false),
            ["owner_type"] = new("owner_type", "OwnerType", "string", "upper", true),
            ["mailing_address"] = new("mailing_address", "MailingAddress", "string", "trim", true),
            ["mailing_city"] = new("mailing_city", "MailingCity", "string", "trim", true),
            ["mailing_state"] = new("mailing_state", "MailingState", "string", "upper", true),
            ["mailing_zip"] = new("mailing_zip", "MailingZip", "string", "trim", true),
            ["ownership_pct"] = new("ownership_pct", "OwnershipPercent", "decimal", "to_decimal", true, "100.00"),
            ["begin_date"] = new("begin_date", "OwnershipStartDate", "DateTime", "parse_date", true),
        };

        /// <summary>
        /// Value table field mappings: PACS Value -> TerraFusion PropertyValues.
        /// </summary>
        public static readonly Dictionary<string, FieldMapping> ValueMappings = new()
        {
            ["value_id"] = new("value_id", "ExternalId", "int", null, false),
            ["prop_id"] = new("prop_id", "PropertyExternalId", "int", null, false),
            ["tax_year"] = new("tax_year", "TaxYear", "int", null, false),
            ["land_value"] = new("land_value", "LandValue", "decimal", "to_decimal", true, "0"),
            ["improvement_value"] = new("improvement_value", "ImprovementValue", "decimal", "to_decimal", true, "0"),
            ["total_value"] = new("total_value", "TotalValue", "decimal", "to_decimal", true, "0"),
            ["assessed_value"] = new("assessed_value", "AssessedValue", "decimal", "to_decimal", true, "0"),
            ["value_type"] = new("value_type", "ValueType", "string", "upper", false),
            ["value_date"] = new("value_date", "ValueDate", "DateTime", "parse_date", true),
        };

        /// <summary>
        /// Sale table field mappings: PACS Sale -> TerraFusion PropertySales.
        /// </summary>
        public static readonly Dictionary<string, FieldMapping> SaleMappings = new()
        {
            ["sale_id"] = new("sale_id", "ExternalId", "int", null, false),
            ["prop_id"] = new("prop_id", "PropertyExternalId", "int", null, false),
            ["sale_date"] = new("sale_date", "SaleDate", "DateTime", "parse_date", false),
            ["sale_price"] = new("sale_price", "SalePrice", "decimal", "to_decimal", true, "0"),
            ["sale_type"] = new("sale_type", "SaleType", "string", "upper", true),
            ["deed_type"] = new("deed_type", "DeedType", "string", "upper", true),
            ["excise_number"] = new("excise_number", "ExciseNumber", "string", "trim", true),
            ["grantor"] = new("grantor", "Grantor", "string", "trim", true),
            ["grantee"] = new("grantee", "Grantee", "string", "trim", true),
            ["verified"] = new("verified", "IsVerified", "bool", "to_bool", false, "false"),
        };

        /// <summary>
        /// Improvement table field mappings: PACS Improvement -> TerraFusion PropertyImprovements.
        /// </summary>
        public static readonly Dictionary<string, FieldMapping> ImprovementMappings = new()
        {
            ["impr_id"] = new("impr_id", "ExternalId", "int", null, false),
            ["prop_id"] = new("prop_id", "PropertyExternalId", "int", null, false),
            ["impr_type"] = new("impr_type", "ImprovementType", "string", "upper", false),
            ["year_built"] = new("year_built", "YearBuilt", "int", null, true),
            ["effective_year"] = new("effective_year", "EffectiveYear", "int", null, true),
            ["living_area"] = new("living_area", "LivingArea", "decimal", "to_decimal", true),
            ["total_area"] = new("total_area", "TotalArea", "decimal", "to_decimal", true),
            ["stories"] = new("stories", "Stories", "decimal", "to_decimal", true),
            ["condition_code"] = new("condition_code", "ConditionCode", "string", null, true),
            ["quality_code"] = new("quality_code", "QualityCode", "string", null, true),
        };

        /// <summary>
        /// Land table field mappings: PACS Land -> TerraFusion PropertyLand.
        /// </summary>
        public static readonly Dictionary<string, FieldMapping> LandMappings = new()
        {
            ["land_id"] = new("land_id", "ExternalId", "int", null, false),
            ["prop_id"] = new("prop_id", "PropertyExternalId", "int", null, false),
            ["land_type"] = new("land_type", "LandType", "string", "upper", false),
            ["acres"] = new("acres", "Acres", "decimal", "to_decimal", true),
            ["sqft"] = new("sqft", "SquareFeet", "decimal", "to_decimal", true),
            ["zoning"] = new("zoning", "Zoning", "string", "upper", true),
            ["use_code"] = new("use_code", "UseCode", "string", "upper", true),
            ["frontage"] = new("frontage", "Frontage", "decimal", "to_decimal", true),
            ["depth"] = new("depth", "Depth", "decimal", "to_decimal", true),
        };

        /// <summary>
        /// Returns all mapping dictionaries keyed by PACS table name.
        /// </summary>
        public static Dictionary<string, Dictionary<string, FieldMapping>> GetAllMappings()
        {
            return new Dictionary<string, Dictionary<string, FieldMapping>>
            {
                ["Property"] = PropertyMappings,
                ["Owner"] = OwnerMappings,
                ["Value"] = ValueMappings,
                ["Sale"] = SaleMappings,
                ["Improvement"] = ImprovementMappings,
                ["Land"] = LandMappings,
            };
        }
    }
}
