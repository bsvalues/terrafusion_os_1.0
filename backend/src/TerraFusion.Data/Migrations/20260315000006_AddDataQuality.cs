using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <summary>
    /// LEV-137: Add data quality tracking tables.
    /// Stores validation results, quality scores, and remediation records
    /// for imported levy data.
    /// </summary>
    public partial class AddDataQuality : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Stub: data quality tables creation will be implemented.
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Stub: data quality tables rollback will be implemented.
        }
    }
}
