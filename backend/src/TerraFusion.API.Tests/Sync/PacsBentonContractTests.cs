// TFR-075: xUnit tests for PacsBentonContract
using System.Collections.Generic;
using System.Linq;
using TerraFusion.Core.Sync.Contracts;
using Xunit;

namespace TerraFusion.API.Tests.Sync
{
    /// <summary>
    /// Tests for PacsBentonContract schema contract validation.
    /// </summary>
    public class PacsBentonContractTests
    {
        private readonly PacsBentonContract _contract;

        public PacsBentonContractTests()
        {
            _contract = new PacsBentonContract();
        }

        /// <summary>
        /// Contract should load without errors and have a valid version.
        /// </summary>
        [Fact]
        public void Contract_Loads_Successfully()
        {
            Assert.NotNull(_contract);
            Assert.False(string.IsNullOrWhiteSpace(_contract.ContractVersion));
            Assert.Equal("53005", _contract.CountyFips);
        }

        /// <summary>
        /// All required PACS tables should be defined in the contract.
        /// </summary>
        [Theory]
        [InlineData("Property")]
        [InlineData("Owner")]
        [InlineData("Value")]
        [InlineData("Sale")]
        [InlineData("Improvement")]
        [InlineData("Land")]
        public void Contract_Contains_Required_Table(string tableName)
        {
            Assert.True(_contract.ExpectedTables.ContainsKey(tableName),
                $"Expected table '{tableName}' not found in contract.");
        }

        /// <summary>
        /// Property table should have all required columns defined.
        /// </summary>
        [Theory]
        [InlineData("prop_id")]
        [InlineData("parcel_number")]
        [InlineData("property_type")]
        [InlineData("status_code")]
        [InlineData("situs_address")]
        [InlineData("create_date")]
        public void Property_Table_Has_Expected_Column(string columnName)
        {
            var table = _contract.ExpectedTables["Property"];
            Assert.True(table.Columns.ContainsKey(columnName),
                $"Expected column '{columnName}' not found in Property table.");
        }

        /// <summary>
        /// Primary key columns should be marked as such.
        /// </summary>
        [Fact]
        public void Primary_Keys_Are_Marked_Correctly()
        {
            foreach (var (tableName, table) in _contract.ExpectedTables)
            {
                var pkColumns = table.Columns.Values.Where(c => c.IsPrimaryKey).ToList();
                Assert.True(pkColumns.Count > 0,
                    $"Table '{tableName}' has no primary key column defined.");
            }
        }

        /// <summary>
        /// Field mappings should exist for every column in every contract table.
        /// </summary>
        [Fact]
        public void Field_Mappings_Cover_All_Contract_Columns()
        {
            var allMappings = PacsFieldMappings.GetAllMappings();

            foreach (var (tableName, table) in _contract.ExpectedTables)
            {
                Assert.True(allMappings.ContainsKey(tableName),
                    $"No field mappings found for contract table '{tableName}'.");

                var mappings = allMappings[tableName];
                foreach (var colName in table.Columns.Keys)
                {
                    Assert.True(mappings.ContainsKey(colName),
                        $"No field mapping for column '{colName}' in table '{tableName}'.");
                }
            }
        }

        /// <summary>
        /// Validation against a matching live schema should pass.
        /// </summary>
        [Fact]
        public void Validate_Matching_Schema_Returns_Valid()
        {
            var liveSchema = BuildMatchingLiveSchema();
            var result = _contract.Validate(liveSchema);

            Assert.True(result.IsValid);
            Assert.DoesNotContain(result.Drifts, d => d.Severity == DriftSeverity.Breaking);
        }

        /// <summary>
        /// Validation should detect a missing table as a breaking drift.
        /// </summary>
        [Fact]
        public void Validate_Missing_Table_Returns_Breaking_Drift()
        {
            var liveSchema = BuildMatchingLiveSchema();
            liveSchema.Tables.Remove("Sale");

            var result = _contract.Validate(liveSchema);

            Assert.False(result.IsValid);
            Assert.Contains(result.Drifts, d =>
                d.DriftType == SchemaDriftType.MissingTable &&
                d.TableName == "Sale" &&
                d.Severity == DriftSeverity.Breaking);
        }

        /// <summary>
        /// Validation should detect a missing non-nullable column as breaking.
        /// </summary>
        [Fact]
        public void Validate_Missing_Required_Column_Returns_Breaking_Drift()
        {
            var liveSchema = BuildMatchingLiveSchema();
            liveSchema.Tables["Property"].Columns.Remove("parcel_number");

            var result = _contract.Validate(liveSchema);

            Assert.False(result.IsValid);
            Assert.Contains(result.Drifts, d =>
                d.DriftType == SchemaDriftType.MissingColumn &&
                d.ColumnName == "parcel_number" &&
                d.Severity == DriftSeverity.Breaking);
        }

        /// <summary>
        /// Validation should detect a type mismatch as breaking.
        /// </summary>
        [Fact]
        public void Validate_Type_Mismatch_Returns_Breaking_Drift()
        {
            var liveSchema = BuildMatchingLiveSchema();
            liveSchema.Tables["Property"].Columns["prop_id"] =
                new PacsColumnDefinition("prop_id", "bigint", false, true);

            var result = _contract.Validate(liveSchema);

            Assert.False(result.IsValid);
            Assert.Contains(result.Drifts, d =>
                d.DriftType == SchemaDriftType.TypeMismatch &&
                d.ColumnName == "prop_id");
        }

        /// <summary>
        /// Unexpected columns in live schema should be reported as Info severity.
        /// </summary>
        [Fact]
        public void Validate_Unexpected_Column_Returns_Info_Drift()
        {
            var liveSchema = BuildMatchingLiveSchema();
            liveSchema.Tables["Property"].Columns["extra_col"] =
                new PacsColumnDefinition("extra_col", "varchar(50)", true, false);

            var result = _contract.Validate(liveSchema);

            Assert.True(result.IsValid, "Unexpected columns should not break the contract.");
            Assert.Contains(result.Drifts, d =>
                d.DriftType == SchemaDriftType.UnexpectedColumn &&
                d.ColumnName == "extra_col" &&
                d.Severity == DriftSeverity.Info);
        }

        /// <summary>
        /// Builds a live schema that matches the contract exactly.
        /// </summary>
        private PacsLiveSchema BuildMatchingLiveSchema()
        {
            var liveSchema = new PacsLiveSchema();
            foreach (var (tableName, table) in _contract.ExpectedTables)
            {
                liveSchema.Tables[tableName] = new PacsTableDefinition
                {
                    TableName = table.TableName,
                    Schema = table.Schema,
                    Columns = new Dictionary<string, PacsColumnDefinition>(table.Columns),
                };
            }
            return liveSchema;
        }
    }
}
