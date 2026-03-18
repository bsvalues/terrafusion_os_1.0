using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <summary>
    /// LEV-058: Add historical levy rates table.
    /// Stores year-over-year levy rate snapshots for trend analysis and reporting.
    /// </summary>
    public partial class AddHistoricalRates : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Stub: historical rates table creation will be implemented.
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Stub: historical rates table rollback will be implemented.
        }
    }
}
