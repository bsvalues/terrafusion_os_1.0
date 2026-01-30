using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Levy.Migrations
{
    /// <inheritdoc />
    public partial class SeedLevyData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Seed a baseline county district
            migrationBuilder.Sql(@"
                INSERT INTO ""Districts"" (
                    ""Id"", ""CountyId"", ""DistrictCode"", ""Name"", ""Description"", ""DistrictType"",
                    ""Boundaries"", ""TotalAssessedValue"", ""ParcelCount"", ""IsActive"",
                    ""CreatedAt"", ""UpdatedAt"", ""CreatedBy"", ""UpdatedBy"", ""Metadata""
                ) VALUES (
                    '11111111-1111-1111-1111-111111111111', 'benton', 'BN-01', 'Benton County General', 'Seed district', 'County',
                    NULL, 1000000000.00, 50000, TRUE,
                    TIMESTAMPTZ '2025-01-01T00:00:00Z', NULL, 'system-seed', NULL, NULL
                );
            ");

            // Seed a levy measure
            migrationBuilder.Sql(@"
                INSERT INTO ""LevyMeasures"" (
                    ""Id"", ""CountyId"", ""Name"", ""Description"", ""LevyYear"", ""LevyType"", ""Status"",
                    ""TargetAmount"", ""CalculatedAmount"", ""MaximumRate"", ""CalculatedRate"",
                    ""ApprovedDate"", ""EffectiveDate"", ""ExpirationDate"", ""SubjectToLimit"",
                    ""TotalAssessedValue"", ""CreatedAt"", ""UpdatedAt"", ""CreatedBy"", ""UpdatedBy"",
                    ""QuantumOptimized"", ""AiConfidenceScore"", ""Metadata""
                ) VALUES (
                    '22222222-2222-2222-2222-222222222222', 'benton', 'General Levy 2025', 'Seed levy measure', 2025, 'General', 'Active',
                    25000000.00, 0.00, 1.500000, 0.001234,
                    TIMESTAMPTZ '2024-12-15T00:00:00Z', TIMESTAMPTZ '2025-01-01T00:00:00Z', NULL, TRUE,
                    1000000000.00, TIMESTAMPTZ '2025-01-01T00:00:00Z', NULL, 'system-seed', NULL,
                    TRUE, 0.9900, NULL
                );
            ");

            // Join levy to district
            migrationBuilder.Sql(@"
                INSERT INTO ""LevyMeasureDistricts"" (""DistrictsId"", ""LevyMeasuresId"") VALUES (
                    '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222'
                );
            ");

            // Seed a levy rate
            migrationBuilder.Sql(@"
                INSERT INTO ""LevyRates"" (
                    ""Id"", ""CountyId"", ""LevyMeasureId"", ""DistrictId"", ""Rate"", ""AssessedValue"", ""LevyAmount"",
                    ""EffectiveDate"", ""ExpirationDate"", ""CreatedAt"", ""UpdatedAt"", ""CreatedBy"", ""UpdatedBy"",
                    ""AiOptimalRate"", ""ConfidenceScore""
                ) VALUES (
                    '33333333-3333-3333-3333-333333333333', 'benton', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111',
                    0.001234, 1000000000.00, 1234000.00,
                    TIMESTAMPTZ '2025-01-01T00:00:00Z', NULL,
                    TIMESTAMPTZ '2025-01-01T00:00:00Z', NULL, 'system-seed', NULL,
                    0.001250, 0.9850
                );
            ");

            // Seed a scenario
            migrationBuilder.Sql(@"
                INSERT INTO ""LevyScenarios"" (
                    ""Id"", ""CountyId"", ""LevyMeasureId"", ""Name"", ""Description"", ""ScenarioType"",
                    ""AssessedValue"", ""LevyRate"", ""CalculatedAmount"", ""ProjectedRevenue"", ""CollectionRate"", ""IsActive"",
                    ""Assumptions"", ""CreatedAt"", ""UpdatedAt"", ""CreatedBy"", ""UpdatedBy"", ""AiInsights"", ""QuantumOptimized"", ""ConfidenceScore""
                ) VALUES (
                    '44444444-4444-4444-4444-444444444444', 'benton', '22222222-2222-2222-2222-222222222222', 'Base Case', 'Seed scenario', 'Base',
                    1000000000.00, 0.001234, 1234000.00, 1200000.00, 0.9800, TRUE,
                    NULL, TIMESTAMPTZ '2025-01-01T00:00:00Z', NULL, 'system-seed', NULL, NULL, TRUE, 0.9900
                );
            ");

            // Seed a revenue projection
            migrationBuilder.Sql(@"
                INSERT INTO ""RevenueProjections"" (
                    ""Id"", ""CountyId"", ""LevyScenarioId"", ""FiscalYear"", ""ProjectedAssessedValue"",
                    ""ProjectedLevyAmount"", ""ProjectedCollectionRate"", ""ProjectedNetRevenue"", ""GrowthRate"", ""ConfidenceLevel"",
                    ""CreatedAt"", ""UpdatedAt"", ""CreatedBy"", ""UpdatedBy"", ""AiProjectedRevenue"", ""RiskFactors""
                ) VALUES (
                    '55555555-5555-5555-5555-555555555555', 'benton', '44444444-4444-4444-4444-444444444444', 2025,
                    1000000000.00, 1234000.00, 0.9800, 1219320.00, 0.0200, 0.9750,
                    TIMESTAMPTZ '2025-01-01T00:00:00Z', NULL, 'system-seed', NULL, NULL, NULL
                );
            ");

            // Seed a district parcel
            migrationBuilder.Sql(@"
                INSERT INTO ""DistrictParcels"" (
                    ""Id"", ""CountyId"", ""DistrictId"", ""ParcelNumber"", ""AssessedValue"", ""IsActive"",
                    ""AddedDate"", ""RemovedDate"", ""CreatedAt"", ""UpdatedAt"", ""CreatedBy"", ""UpdatedBy""
                ) VALUES (
                    '66666666-6666-6666-6666-666666666666', 'benton', '11111111-1111-1111-1111-111111111111', 'BN-000001', 250000.00, TRUE,
                    TIMESTAMPTZ '2025-01-01T00:00:00Z', NULL, TIMESTAMPTZ '2025-01-01T00:00:00Z', NULL, 'system-seed', NULL
                );
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                DELETE FROM ""RevenueProjections"" WHERE ""Id"" = '55555555-5555-5555-5555-555555555555';
                DELETE FROM ""DistrictParcels"" WHERE ""Id"" = '66666666-6666-6666-6666-666666666666';
                DELETE FROM ""LevyScenarios"" WHERE ""Id"" = '44444444-4444-4444-4444-444444444444';
                DELETE FROM ""LevyRates"" WHERE ""Id"" = '33333333-3333-3333-3333-333333333333';
                DELETE FROM ""LevyMeasureDistricts"" WHERE ""DistrictsId"" = '11111111-1111-1111-1111-111111111111' AND ""LevyMeasuresId"" = '22222222-2222-2222-2222-222222222222';
                DELETE FROM ""LevyMeasures"" WHERE ""Id"" = '22222222-2222-2222-2222-222222222222';
                DELETE FROM ""Districts"" WHERE ""Id"" = '11111111-1111-1111-1111-111111111111';
            ");
        }
    }
}
