using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <summary>
    /// LEV-060: Add user audit tables for levy operations.
    /// Tracks user actions, session activity, and access patterns
    /// within the levy management module.
    /// </summary>
    public partial class AddUserAudit : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Stub: user audit tables creation will be implemented.
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Stub: user audit tables rollback will be implemented.
        }
    }
}
