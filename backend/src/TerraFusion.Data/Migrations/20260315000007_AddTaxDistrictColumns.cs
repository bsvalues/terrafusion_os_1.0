using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <summary>
    /// LEV-138: Add additional columns to tax district tables.
    /// Extends district records with contact information, boundary references,
    /// statutory authority codes, and consolidation tracking fields.
    /// </summary>
    public partial class AddTaxDistrictColumns : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Stub: additional tax district columns will be implemented.
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Stub: additional tax district columns rollback will be implemented.
        }
    }
}
