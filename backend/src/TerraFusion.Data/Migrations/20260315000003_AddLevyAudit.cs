using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <summary>
    /// LEV-059: Add levy audit table.
    /// Tracks all levy modifications, approvals, and compliance checks
    /// for FISMA-HIGH audit requirements.
    /// </summary>
    public partial class AddLevyAudit : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Stub: levy audit table creation will be implemented.
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Stub: levy audit table rollback will be implemented.
        }
    }
}
