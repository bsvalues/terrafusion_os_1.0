using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <summary>
    /// LEV-136: Add scenario modeling fields to levy tables.
    /// Supports what-if analysis with scenario names, parameters,
    /// and projected outcomes stored alongside base levy data.
    /// </summary>
    public partial class AddLevyScenario : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Stub: scenario modeling fields will be implemented.
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Stub: scenario modeling fields rollback will be implemented.
        }
    }
}
