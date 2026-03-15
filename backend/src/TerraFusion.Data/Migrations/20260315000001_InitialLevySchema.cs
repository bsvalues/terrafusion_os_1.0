using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <summary>
    /// LEV-056: Initial schema for levy management tables.
    /// Creates core levy tables: LevyDistricts, LevyRates, LevyCertifications,
    /// TaxCodes, and TaxCodeDistrictMappings.
    /// </summary>
    public partial class InitialLevySchema : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Stub: levy table creation will be implemented during schema finalization.
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Stub: levy table rollback will be implemented during schema finalization.
        }
    }
}
